import gff from '@gmod/gff'
import fs from 'fs'
import { genomeToTranscriptSeqMapping } from 'g2p_mapper'

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
