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

export function genomeToTranscriptSeqMapping(feature: Feat) {
  const strand = feature.strand
  const refName = feature.refName

  // Filter CDS features and deduplicate based on start/end positions
  // (GFF3 files can contain duplicate CDS features)
  const cdsFeatures = feature.subfeatures?.filter(f => f.type === 'CDS') ?? []
  const uniqueCdsMap = new Map<string, Feat>()
  for (const f of cdsFeatures) {
    const key = `${f.start}-${f.end}`
    if (!uniqueCdsMap.has(key)) {
      uniqueCdsMap.set(key, f)
    }
  }
  const cds = Array.from(uniqueCdsMap.values()).sort(
    (a, b) => strand * (a.start - b.start),
  )

  const g2p = {} as Record<number, number>
  const p2g = {} as Record<number, number>

  let proteinCounter = 0
  if (strand !== -1) {
    for (const f of cds) {
      for (let genomePos = f.start; genomePos < f.end; genomePos++) {
        const proteinPos = Math.floor(proteinCounter++ / 3)
        g2p[genomePos] = proteinPos
        if (!p2g[proteinPos]) {
          p2g[proteinPos] = genomePos
        }
      }
    }
  } else {
    // For reverse strand, iterate from end-1 down to start (inclusive)
    // to properly handle 0-based half-open intervals [start, end)
    for (const f of cds) {
      for (let genomePos = f.end; genomePos >= f.start; genomePos--) {
        const proteinPos = Math.floor(proteinCounter++ / 3)
        g2p[genomePos] = proteinPos
        if (!p2g[proteinPos]) {
          p2g[proteinPos] = genomePos
        }
      }
    }
  }

  return { g2p, p2g, refName, strand }
}
