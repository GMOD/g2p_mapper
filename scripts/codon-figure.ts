// Draws docs/img/codons.svg, the README's two-exon transcript base by base,
// by running it through the mapper, so the figure cannot drift from the code.
//
//   pnpm docs:figure
//
// test/figure.test.ts fails when the SVG is stale.
import fs from 'node:fs'
import path from 'node:path'

import { genomeToTranscriptSeqMapping, getCodonRanges } from '../src/index.ts'

import type { Feat, PartialCodon } from '../src/index.ts'

export const CODON_FIGURE = path.join(
  import.meta.dirname,
  '..',
  'docs/img/codons.svg',
)

const transcript = (strand: number, phases: [number, number]): Feat => ({
  refName: 'chr1',
  start: 99,
  end: 205,
  strand,
  type: 'mRNA',
  subfeatures: [
    { refName: 'chr1', start: 99, end: 103, type: 'CDS', phase: phases[0] },
    { refName: 'chr1', start: 200, end: 205, type: 'CDS', phase: phases[1] },
  ],
})

const show = (v: unknown) => JSON.stringify(v).replaceAll(',', ', ')

function panels() {
  const forward = genomeToTranscriptSeqMapping(transcript(1, [0, 2]))
  const reverse = genomeToTranscriptSeqMapping(transcript(-1, [1, 0]))
  const phased = transcript(1, [1, 2])
  const numberings = (['counted', 'dropped'] as PartialCodon[]).map(
    partialCodon => ({
      label: partialCodon === 'counted' ? 'counted (default)' : partialCodon,
      g2p: genomeToTranscriptSeqMapping(phased, { partialCodon }).g2p,
    }),
  )
  return [
    {
      title: 'Forward strand',
      sub: 'strand: 1, first CDS phase 0',
      feature: transcript(1, [0, 2]),
      numberings: [{ label: 'protein position', g2p: forward.g2p }],
      readouts: [
        `g2p[200] = ${forward.g2p[200]}`,
        `p2gCodon[1] = ${show(forward.p2gCodon[1])}`,
        `getCodonRanges(p2gCodon, 1) =`,
        show(getCodonRanges(forward.p2gCodon, 1)),
      ],
    },
    {
      title: 'Reverse strand',
      sub: 'strand: -1, first CDS (the right one) phase 0',
      feature: transcript(-1, [1, 0]),
      numberings: [{ label: 'protein position', g2p: reverse.g2p }],
      readouts: [
        `g2p[204] = ${reverse.g2p[204]}`,
        `p2g[1] = ${reverse.p2g[1]}`,
        `p2gCodon[1] = ${show(reverse.p2gCodon[1])}`,
      ],
    },
    {
      title: 'Phase 1',
      sub: 'strand: 1, first CDS phase 1: base 99 ends a codon begun upstream',
      feature: phased,
      numberings,
      readouts: numberings.map(
        n => `${n.label.split(' ')[0]}: g2p[100] = ${n.g2p[100]}`,
      ),
    },
  ]
}

const LEFT = 180
const CELL = 40
const INTRON = 100
const SANS = 'Helvetica,Arial,sans-serif'
const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'
const INK = '#000000'
const MUTED = '#666666'

const DARK: Record<string, string> = {
  '#ffffff': '#0d1117',
  '#000000': '#e6edf3',
  '#666666': '#9198a1',
}

const darkStyle = () =>
  `<style>@media (prefers-color-scheme: dark) {${Object.entries(DARK)
    .map(([l, d]) => `[fill="${l}"]{fill:${d}}[stroke="${l}"]{stroke:${d}}`)
    .join('')}}</style>`

interface TextOpts {
  size?: number
  fill?: string
  anchor?: 'start' | 'middle' | 'end'
  font?: string
  bold?: boolean
}

function text(
  tx: number,
  ty: number,
  s: string | number,
  {
    size = 11,
    fill = INK,
    anchor = 'middle',
    font = SANS,
    bold = false,
  }: TextOpts = {},
) {
  const weight = bold ? ' font-weight="bold"' : ''
  const escaped = String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  return `<text x="${tx}" y="${ty}" font-family="${font}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"${weight}>${escaped}</text>`
}

function layout(feature: Feat) {
  const exons = (feature.subfeatures ?? []).toSorted(
    (a, b) => a.start - b.start,
  )
  const xOf = new Map<number, number>()
  let cursor = LEFT
  exons.forEach((exon, i) => {
    if (i > 0) {
      cursor += INTRON
    }
    for (let base = exon.start; base < exon.end; base++) {
      xOf.set(base, cursor)
      cursor += CELL
    }
  })
  return { exons, xOf, right: cursor }
}

function codonPieces(g2p: Record<number, number>, bases: number[]) {
  const pieces: { pos: number; from: number; to: number }[] = []
  for (const base of bases) {
    const pos = g2p[base]
    const last = pieces.at(-1)
    if (pos === undefined) {
      continue
    }
    if (last?.pos === pos && last.to === base - 1) {
      last.to = base
    } else {
      pieces.push({ pos, from: base, to: base })
    }
  }
  return pieces
}

function arrow(xa: number, xb: number, y: number, color: string) {
  const dir = Math.sign(xb - xa)
  return [
    `<line x1="${xa}" y1="${y}" x2="${xb - dir * 6}" y2="${y}" stroke="${color}"/>`,
    `<path d="M${xb} ${y} l${-dir * 7} -4 v8 z" fill="${color}"/>`,
  ]
}

function drawPanel(
  panel: ReturnType<typeof panels>[number],
  top: number,
  readoutX: number,
) {
  const { exons, xOf, right } = layout(panel.feature)
  const bases = [...xOf.keys()]
  const out: string[] = [
    text(16, top + 12, panel.title, { size: 13, anchor: 'start', bold: true }),
    text(16 + panel.title.length * 8 + 10, top + 12, panel.sub, {
      size: 10.5,
      fill: MUTED,
      anchor: 'start',
    }),
  ]

  const arrowY = top + 30
  const [xa, xb] = panel.feature.strand === -1 ? [right, LEFT] : [LEFT, right]
  out.push(
    ...arrow(xa, xb, arrowY, MUTED),
    text(LEFT - 12, arrowY + 4, 'transcription order', {
      size: 10,
      fill: MUTED,
      anchor: 'end',
    }),
  )

  const cellY = top + 42
  out.push(
    text(LEFT - 12, cellY + 18, 'genome position', {
      size: 10,
      fill: MUTED,
      anchor: 'end',
    }),
  )
  for (let i = 1; i < exons.length; i++) {
    const gapStart = xOf.get(exons[i - 1]!.end - 1)! + CELL
    out.push(
      `<line x1="${gapStart + 4}" y1="${cellY + 14}" x2="${gapStart + INTRON - 4}" y2="${cellY + 14}" stroke="${MUTED}" stroke-dasharray="3 3"/>`,
      text(gapStart + INTRON / 2, cellY + 8, 'intron', {
        size: 10,
        fill: MUTED,
      }),
    )
  }
  for (const base of bases) {
    out.push(
      `<rect x="${xOf.get(base)! + 1}" y="${cellY}" width="${CELL - 2}" height="28" fill="#ffffff" stroke="${INK}"/>`,
      text(xOf.get(base)! + CELL / 2, cellY + 18, base, {
        size: 11,
        font: MONO,
      }),
    )
  }

  panel.numberings.forEach(({ label, g2p }, row) => {
    const y = cellY + 40 + row * 30
    out.push(
      text(LEFT - 12, y + 8, label, {
        size: 10,
        fill: MUTED,
        anchor: 'end',
        font: row === 0 && panel.numberings.length === 1 ? SANS : MONO,
      }),
    )
    const pieces = codonPieces(g2p, bases)
    pieces.forEach((piece, i) => {
      const pa = xOf.get(piece.from)! + 3
      const pb = xOf.get(piece.to)! + CELL - 3
      out.push(
        `<path d="M${pa} ${y - 6} V${y} H${pb} V${y - 6}" fill="none" stroke="${INK}"/>`,
        text((pa + pb) / 2, y + 13, piece.pos, {
          size: 11,
          font: MONO,
        }),
      )
      const next = pieces[i + 1]
      if (next?.pos === piece.pos) {
        out.push(
          `<line x1="${pb}" y1="${y}" x2="${xOf.get(next.from)! + 3}" y2="${y}" stroke="${INK}" stroke-dasharray="3 3"/>`,
          text(pb + INTRON / 2 + 3, y + 13, 'split codon', {
            size: 10,
            fill: MUTED,
          }),
        )
      }
    })
    const skipped = bases.filter(b => g2p[b] === undefined)
    for (const base of skipped) {
      out.push(
        text(xOf.get(base)! + CELL / 2, y + 8, 'none', {
          size: 10,
          fill: MUTED,
        }),
      )
    }
  })

  panel.readouts.forEach((line, i) => {
    out.push(
      text(readoutX, cellY + 4 + i * 16, line, {
        size: 10.5,
        anchor: 'start',
        font: MONO,
      }),
    )
  })

  const height = 104 + (panel.numberings.length - 1) * 30
  return { out, height }
}

export function renderCodonFigure() {
  const all = panels()
  const readoutX = Math.max(...all.map(p => layout(p.feature).right)) + 32
  const width = readoutX + 290
  const body: string[] = []
  let top = 12
  all.forEach(panel => {
    const { out, height } = drawPanel(panel, top, readoutX)
    body.push(...out)
    top += height + 20
  })
  const height = top - 16
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Each CDS base numbered with its protein position, on the forward strand, the reverse strand and with phase 1">`,
    darkStyle(),
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    ...body,
    '</svg>',
    '',
  ].join('\n')
}

if (import.meta.main) {
  fs.writeFileSync(CODON_FIGURE, renderCodonFigure())
}
