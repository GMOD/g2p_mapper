#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import sanitize from 'sanitize-filename'
import gff, { GFF3FeatureLineWithRefs } from '@gmod/gff'
import { genomeToTranscriptSeqMapping } from 'g2p_mapper'
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
// locals
import { featureData } from './parse'

const ret = yargs(hideBin(process.argv))
  .options({
    in: {
      type: 'string',
      demandOption: true,
      description: 'input gff',
    },
    out: {
      type: 'string',
      demandOption: true,
      description: "output directory, will be created if it doesn't exist",
    },
  })
  .parseSync()

if (!fs.existsSync(ret.out)) {
  fs.mkdirSync(ret.out)
}
main({ inFile: ret.in, outDir: ret.out })

function main({ inFile, outDir }: { inFile: string; outDir: string }) {
  fs.createReadStream(inFile)
    .pipe(
      gff.parseStream({
        parseFeatures: true,
        parseComments: false,
        parseDirectives: false,
        parseSequences: false,
        disableDerivesFromReferences: true,
      }),
    )
    .on('data', (feat: GFF3FeatureLineWithRefs[]) => {
      featureData(feat[0]).subfeatures?.map(f => {
        if (f.type === 'mRNA') {
          fs.writeFileSync(
            path.join(outDir, sanitize(`${f.id}.json`)),
            JSON.stringify(genomeToTranscriptSeqMapping(f), null, 2),
          )
        }
      })
    })
}
