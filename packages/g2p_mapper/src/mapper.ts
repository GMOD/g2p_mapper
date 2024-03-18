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

// see similar function in msaview plugin
export function genomeToTranscriptSeqMapping(feature: Feat) {
  const strand = feature.strand
  const refName = feature.refName
  const cds =
    feature.subfeatures
      ?.filter(f => f.type === 'CDS')
      .sort((a, b) => strand * (a.start - b.start)) ?? []
  const g2p = {} as Record<number, number | undefined>
  const p2g = {} as Record<number, number | undefined>

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
    for (const f of cds) {
      for (let genomePos = f.end; genomePos > f.start; genomePos--) {
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
