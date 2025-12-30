export interface Feat {
  strand: number
  refName: string
  type: string
  phase: number
  id: string
  start: number
  end: number
  subfeatures?: Feat[]
}

function* getPositions(f: Feat, strand: number) {
  if (strand !== -1) {
    for (let pos = f.start; pos < f.end; pos++) {
      yield pos
    }
  } else {
    // For reverse strand, iterate from end-1 down to start (inclusive)
    // to properly handle 0-based half-open intervals [start, end)
    for (let pos = f.end - 1; pos >= f.start; pos--) {
      yield pos
    }
  }
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

  // Filter CDS features and deduplicate based on start/end positions
  // (GFF3 files can contain duplicate CDS features)
  const cdsFeatures = feature.subfeatures?.filter(f => f.type === 'CDS') ?? []
  const seenKeys = new Set<string>()
  const cds = cdsFeatures
    .filter(f => {
      if (f.start >= f.end) {
        return false
      }
      const key = `${f.start}-${f.end}`
      if (seenKeys.has(key)) {
        return false
      }
      seenKeys.add(key)
      return true
    })
    .sort((a, b) => strand * (a.start - b.start))

  const g2p: Record<number, number> = {}
  const p2g: Record<number, number> = {}

  if (cds.length === 0) {
    return { g2p, p2g, refName, strand }
  }

  // Account for CDS phase: phase indicates how many bases to skip
  // to reach the next complete codon (0, 1, or 2)
  const firstPhase = cds[0]?.phase ?? 0
  let proteinCounter = (3 - firstPhase) % 3
  let lastProteinPos = -1

  for (const f of cds) {
    for (const genomePos of getPositions(f, strand)) {
      const proteinPos = Math.floor(proteinCounter++ / 3)
      g2p[genomePos] = proteinPos
      if (proteinPos !== lastProteinPos) {
        p2g[proteinPos] = genomePos
        lastProteinPos = proteinPos
      }
    }
  }

  return {
    g2p,
    p2g,
    refName,
    strand,
  }
}

/**
 * Get the genomic coordinate range for a codon at a given protein position.
 * Returns a 0-based half-open interval [start, end).
 *
 * For positive strand: p2g gives the lowest coordinate, range is [pos, pos+3)
 * For negative strand: p2g gives the highest coordinate (first in transcription),
 *   so range is [pos-2, pos+1) to cover all 3 bases
 */
export function getCodonRange(
  p2g: Record<number, number>,
  proteinPos: number,
  strand: number,
) {
  const genomePos = p2g[proteinPos]
  if (genomePos === undefined) {
    return undefined
  }

  if (strand === 1) {
    return [genomePos, genomePos + 3] as const
  } else {
    return [genomePos - 2, genomePos + 1] as const
  }
}
