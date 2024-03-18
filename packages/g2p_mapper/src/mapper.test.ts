import { genomeToTranscriptSeqMapping } from './mapper'

test('basic', () => {
  const ret = genomeToTranscriptSeqMapping({
    type: 'mRNA',
    subfeatres: [{ type: 'CDS', start: 100, end: 200 }],
  })
  expect(ret).toMatchSnapshot()
})
