import fs from 'fs'
import gff, { GFF3FeatureLineWithRefs } from '@gmod/gff'
import { Feat, genomeToTranscriptSeqMapping } from 'g2p_mapper'

function main() {
  const stringOfGFF3 = fs.readFileSync(process.argv[2]).toString()
  const features = gff.parseStringSync(stringOfGFF3, {
    parseFeatures: true,
    parseComments: false,
    parseDirectives: false,
    parseSequences: false,
    disableDerivesFromReferences: true,
  })

  const mappings = {} as Record<
    string,
    ReturnType<typeof genomeToTranscriptSeqMapping>
  >

  for (const feat of features.flat()) {
    const f = featureData(feat)
    f.subfeatures?.map(f => {
      mappings[f.ID] = genomeToTranscriptSeqMapping(f)
    })
  }
  fs.writeFileSync(process.argv[3], JSON.stringify(mappings, null, 2))
}

function parseStrand(strand: string | null) {
  if (strand === '+') {
    return 1
  } else if (strand === '-') {
    return -1
  } else {
    return 0
  }
}
function processAttributes(dataAttributes: Record<string, unknown>) {
  const defaultFields = new Set([
    'start',
    'end',
    'seq_id',
    'score',
    'type',
    'source',
    'phase',
    'strand',
  ])
  const res = {} as Record<string, unknown>
  for (const a of Object.keys(dataAttributes)) {
    let b = a.toLowerCase()
    if (defaultFields.has(b)) {
      // add "suffix" to tag name if it already exists
      // reproduces behavior of NCList
      b += '2'
    }
    if (dataAttributes[a] !== null) {
      const attr = dataAttributes[a]
      res[b] = Array.isArray(attr) && attr.length === 1 ? attr[0] : attr
    }
  }
  return res
}

function featureData(data: GFF3FeatureLineWithRefs): Feat {
  const {
    child_features,
    score,
    strand,
    seq_id,
    attributes,
    type,
    end,
    start,
    phase,
    ...rest
  } = data
  const attrs = processAttributes(attributes || {})
  return {
    ...rest,
    ...processAttributes(attributes || {}),
    start: Number(start) - 1,
    end: Number(end),
    type: String(type),
    strand: parseStrand(strand),
    refName: String(seq_id),
    phase: Number(phase),
    score: Number(score),
    ID: String(attrs.ID),
    subfeatures: data.child_features.flatMap(c => c.map(c2 => featureData(c2))),
  }
}
