export interface Feat {
  refName: string
  start: number
  end: number
  type?: string
  strand?: number
  phase?: number
  subfeatures?: Feat[]
}

export function genomeToTranscriptSeqMapping(feature: Feat) {
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

  const g2p: Record<number, number> = {}
  const p2g: Record<number, number> = {}
  const p2gCodon: Record<number, number[]> = {}

  if (cds.length !== 0) {
    // Phase: number of bases at the start of the first CDS that complete a
    // codon begun outside this transcript. Per-segment phase is assumed
    // consistent with running the counter through all bases.
    const firstPhase = cds[0]?.phase ?? 0
    let proteinCounter = (3 - firstPhase) % 3
    let lastProteinPos = -1

    for (const f of cds) {
      const length = f.end - f.start
      for (let i = 0; i < length; i++) {
        const genomePos = strand === 1 ? f.start + i : f.end - 1 - i
        const proteinPos = Math.floor(proteinCounter++ / 3)
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
  }

  return { g2p, p2g, p2gCodon, refName, strand }
}

/**
 * Genomic range [start, end) covering the codon at `proteinPos`.
 * On the reverse strand p2g stores the highest coordinate of the codon, so
 * the range extends from genomePos-2 to genomePos+1.
 *
 * Caveat: assumes the codon's three bases are contiguous in genome
 * coordinates. Codons that span an exon boundary, or split codons at the
 * start of a CDS (phase != 0), will produce a range that includes intronic
 * or out-of-CDS positions. Use `getCodonRanges` with `p2gCodon` to handle
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
