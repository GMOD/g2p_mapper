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

  // GFF3 files can repeat CDS rows; dedupe on start/end.
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

  if (cds.length !== 0) {
    // Phase: number of bases at the start of the first CDS that complete a
    // codon begun outside this transcript. Per-segment phase is assumed
    // consistent with running the counter through all bases.
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
  }

  return { g2p, p2g, refName, strand }
}

/**
 * Genomic range [start, end) covering the codon at `proteinPos`.
 * On the reverse strand p2g stores the highest coordinate of the codon, so
 * the range extends from genomePos-2 to genomePos+1.
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
