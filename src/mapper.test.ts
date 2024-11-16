import { test, expect } from 'vitest'
import { genomeToTranscriptSeqMapping } from './mapper'

test('basic', () => {
  const ret = genomeToTranscriptSeqMapping({
    type: 'mRNA',
    id: 'hello',
    start: 100,
    end: 200,
    strand: 1,
    phase: 0,
    refName: 'chr1',
    subfeatures: [
      {
        type: 'CDS',
        start: 100,
        end: 200,
        id: 'hello1',
        phase: 0,
        strand: 1,
        refName: 'chr1',
      },
    ],
  })
  expect(ret).toMatchSnapshot()
})
