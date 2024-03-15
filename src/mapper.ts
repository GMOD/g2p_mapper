import gff from '@gmod/gff'
import fs from 'fs'

const stringOfGFF3 = fs.readFileSync(process.argv[2]).toString()
const features = gff.parseStringSync(stringOfGFF3)

const mappings = {} as Record<
  string,
  ReturnType<typeof genomeToTranscriptSeqMapping>
>

// messy types in here, hard to type the gff parser results well
for (const feat of features) {
  // @ts-expect-error
  if (feat[0].type === 'gene') {
    // @ts-expect-error
    ;(feat[0].child_features as Feat[][])
      ?.map((f: Feat[]) => f[0])
      .filter((f: Feat) => f.type === 'mRNA')
      .forEach((f: Feat) => {
        mappings[f.attributes.ID] = genomeToTranscriptSeqMapping(f)
      })
  }
}
fs.writeFileSync(process.argv[3], JSON.stringify(mappings, null, 2))

function parseStrand(str: string) {
  if (str === '-') {
    return -1
  } else if (str === '+') {
    return 1
  } else {
    return 0
  }
}

interface Feat {
  strand: string
  seq_id: string
  type: string
  start: number
  end: number
  attributes: Record<string, string>
  child_features?: Feat[]
}

// see similar function in msaview plugin
export function genomeToTranscriptSeqMapping(feature: Feat) {
  const strand = parseStrand(feature.strand)
  const refName = feature.seq_id
  const cds =
    feature.child_features
      // @ts-expect-error
      ?.map(f => f[0])
      ?.filter(f => f.type === 'CDS')
      .sort((a, b) => strand * (a.start - b.start)) || []
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
