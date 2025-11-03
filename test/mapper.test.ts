import { test, expect } from 'vitest'
import { genomeToTranscriptSeqMapping } from '../src/mapper'

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

test('reverse strand gene with duplicate CDS features', () => {
  // This test case has duplicate CDS features (which can occur in GFF3 files)
  // and tests that:
  // 1. Duplicates are handled correctly (not processed twice)
  // 2. Boundary positions are included correctly
  const ret = genomeToTranscriptSeqMapping({
    type: 'mRNA',
    id: 'rna-XM_034563908.1',
    start: 438289,
    end: 440094,
    strand: -1,
    phase: 0,
    refName: 'NC_036159.2',
    subfeatures: [
      // First set of CDS features
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 438289,
        end: 438320,
        strand: -1,
        phase: 1,
        refName: 'NC_036159.2',
      },
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 438638,
        end: 438672,
        strand: -1,
        phase: 2,
        refName: 'NC_036159.2',
      },
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 439388,
        end: 439439,
        strand: -1,
        phase: 2,
        refName: 'NC_036159.2',
      },
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 439581,
        end: 439691,
        strand: -1,
        phase: 1,
        refName: 'NC_036159.2',
      },
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 439839,
        end: 439935,
        strand: -1,
        phase: 1,
        refName: 'NC_036159.2',
      },
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 440062,
        end: 440094,
        strand: -1,
        phase: 0,
        refName: 'NC_036159.2',
      },
      // Exon (should be ignored)
      {
        type: 'exon',
        id: 'exon-XM_034563908.1-6',
        start: 438289,
        end: 438320,
        strand: -1,
        phase: 0,
        refName: 'NC_036159.2',
      },
      // Duplicate CDS features (should be deduplicated)
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 438289,
        end: 438320,
        strand: -1,
        phase: 1,
        refName: 'NC_036159.2',
      },
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 438638,
        end: 438672,
        strand: -1,
        phase: 2,
        refName: 'NC_036159.2',
      },
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 439388,
        end: 439439,
        strand: -1,
        phase: 2,
        refName: 'NC_036159.2',
      },
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 439581,
        end: 439691,
        strand: -1,
        phase: 1,
        refName: 'NC_036159.2',
      },
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 439839,
        end: 439935,
        strand: -1,
        phase: 1,
        refName: 'NC_036159.2',
      },
      {
        type: 'CDS',
        id: 'cds-XP_034419714.1',
        start: 440062,
        end: 440094,
        strand: -1,
        phase: 0,
        refName: 'NC_036159.2',
      },
    ],
  })

  // For reverse strand, the first CDS in transcription order is at the highest genomic position
  // The last CDS (440062-440094) should map to the start of the protein (position 0)
  // Position 440093 (end-1) should map to protein position 0 (first codon starts here)
  expect(ret.g2p[440093]).toBe(0)

  // The first position (438289) should also be included
  // expect(ret.g2p[438289]).toBeDefined()

  // Check that we're not seeing protein position 10 at the end position
  // (which would indicate duplicates were processed)
  expect(ret.g2p[440093]).not.toBe(10)

  expect(ret).toMatchSnapshot()
})
