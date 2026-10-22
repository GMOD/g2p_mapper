export interface Feat {
  refName: string
  start: number
  end: number
  id?: string
  name?: string
  type?: string | null
  strand?: number
  phase?: number
  subfeatures?: Feat[]
}

/**
 * How protein positions count a partial first codon, the `phase` bases a first
 * CDS with phase 1 or 2 opens on:
 *
 * - `counted` (the default): position `0` is that partial codon, as in a
 *   JBrowse translation, which writes it as `&`
 * - `dropped`: position `0` is the first complete codon, as in `gffread -y`,
 *   an NCBI or Ensembl protein FASTA, and the domain calls made on them
 */
export type PartialCodon = 'counted' | 'dropped'

export interface NumberingOptions {
  partialCodon?: PartialCodon
}

/**
 * The transcript's CDS parts in transcription order, repeated rows dropped,
 * and the CDS offset of protein position 0's first base: negative when a
 * counted partial codon starts before the CDS does.
 */
function codingParts(feature: Feat, partialCodon: PartialCodon = 'counted') {
  const strand = feature.strand
  const refName = feature.refName

  if (strand !== -1 && strand !== 1) {
    throw new Error(`Invalid strand value: ${strand}. Expected 1 or -1.`)
  }
  if (!refName) {
    throw new Error('refName is required')
  }

  // GFF3 files can repeat CDS rows; dedupe on start/end, keeping the first.
  const uniqueCds = new Map<string, Feat>()
  for (const f of feature.subfeatures ?? []) {
    if (f.type === 'CDS' && f.start < f.end) {
      const key = `${f.start}-${f.end}`
      if (!uniqueCds.has(key)) {
        uniqueCds.set(key, f)
      }
    }
  }
  const cds = [...uniqueCds.values()].sort(
    (a, b) => strand * (a.start - b.start),
  )
  const phase = cds[0]?.phase ?? 0
  const lead = phase > 0 && partialCodon === 'counted' ? phase - 3 : phase
  return { cds, strand, refName, lead }
}

export function genomeToTranscriptSeqMapping(
  feature: Feat,
  { partialCodon }: NumberingOptions = {},
) {
  const { cds, strand, refName, lead } = codingParts(feature, partialCodon)

  const g2p: Record<number, number> = {}
  const p2g: Record<number, number> = {}
  const p2gCodon: Record<number, number[]> = {}

  // a dropped partial codon's bases map to no protein position
  let cdsPos = 0
  let lastProteinPos = -1
  for (const f of cds) {
    const length = f.end - f.start
    for (let i = 0; i < length; i++) {
      const genomePos = strand === 1 ? f.start + i : f.end - 1 - i
      const codingPos = cdsPos++ - lead
      if (codingPos < 0) {
        continue
      }
      const proteinPos = Math.floor(codingPos / 3)
      g2p[genomePos] = proteinPos
      if (proteinPos !== lastProteinPos) {
        p2g[proteinPos] = genomePos
        p2gCodon[proteinPos] = [genomePos]
        lastProteinPos = proteinPos
      } else {
        p2gCodon[proteinPos]!.push(genomePos)
      }
    }
  }

  return { g2p, p2g, p2gCodon, refName, strand }
}

/**
 * The genomic `[start, end)` ranges encoding protein positions
 * `[proteinStart, proteinEnd)`, one per CDS part they touch, sorted ascending
 * on either strand. A range reaching past the last codon stops at the CDS end;
 * one starting past it returns an empty list.
 */
export function proteinRangeToGenome(
  feature: Feat,
  proteinStart: number,
  proteinEnd: number,
  { partialCodon }: NumberingOptions = {},
) {
  const { cds, strand, lead } = codingParts(feature, partialCodon)
  const from = Math.max(0, proteinStart * 3 + lead)
  const to = proteinEnd * 3 + lead
  const ranges: [number, number][] = []
  let offset = 0
  for (const f of cds) {
    const length = f.end - f.start
    const lo = Math.max(from, offset) - offset
    const hi = Math.min(to, offset + length) - offset
    if (hi > lo) {
      ranges.push(
        strand === 1 ? [f.start + lo, f.start + hi] : [f.end - hi, f.end - lo],
      )
    }
    offset += length
  }
  return ranges.sort((a, b) => a[0] - b[0])
}

/**
 * Genomic range [start, end) covering the codon at `proteinPos`.
 * On the reverse strand p2g stores the highest coordinate of the codon, so
 * the range extends from genomePos-2 to genomePos+1.
 *
 * Caveat: assumes the codon's three bases are contiguous in genome
 * coordinates. A codon that spans an exon boundary produces a range that
 * includes intronic positions. Use `getCodonRanges` with `p2gCodon` to handle
 * those cases correctly.
 */
export function getCodonRange(
  p2g: Record<number, number>,
  proteinPos: number,
  strand: number,
) {
  const genomePos = p2g[proteinPos]
  if (genomePos !== undefined) {
    if (strand === 1) {
      return [genomePos, genomePos + 3] as const
    } else {
      return [genomePos - 2, genomePos + 1] as const
    }
  }
  return undefined
}

/**
 * One or more genomic [start, end) ranges covering the codon at `proteinPos`,
 * derived from the full set of genomic positions in `p2gCodon`. Returns
 * multiple ranges when the codon spans an exon boundary. Ranges are sorted
 * ascending and use 0-based half-open coordinates regardless of strand.
 * Returns undefined if `proteinPos` is unknown.
 */
export function getCodonRanges(
  p2gCodon: Record<number, number[]>,
  proteinPos: number,
) {
  const positions = p2gCodon[proteinPos]
  if (positions === undefined) {
    return undefined
  }
  const sorted = [...positions].sort((a, b) => a - b)
  const ranges: [number, number][] = []
  for (const pos of sorted) {
    const last = ranges.at(-1)
    if (last?.[1] === pos) {
      last[1] = pos + 1
    } else {
      ranges.push([pos, pos + 1])
    }
  }
  return ranges
}
