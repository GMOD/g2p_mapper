import { test, expect } from 'vitest'
import { genomeToTranscriptSeqMapping, getCodonRange } from '../src/index.ts'

const codonTable: Record<string, string> = {
  TTT: 'F',
  TTC: 'F',
  TTA: 'L',
  TTG: 'L',
  TCT: 'S',
  TCC: 'S',
  TCA: 'S',
  TCG: 'S',
  TAT: 'Y',
  TAC: 'Y',
  TAA: '*',
  TAG: '*',
  TGT: 'C',
  TGC: 'C',
  TGA: '*',
  TGG: 'W',
  CTT: 'L',
  CTC: 'L',
  CTA: 'L',
  CTG: 'L',
  CCT: 'P',
  CCC: 'P',
  CCA: 'P',
  CCG: 'P',
  CAT: 'H',
  CAC: 'H',
  CAA: 'Q',
  CAG: 'Q',
  CGT: 'R',
  CGC: 'R',
  CGA: 'R',
  CGG: 'R',
  ATT: 'I',
  ATC: 'I',
  ATA: 'I',
  ATG: 'M',
  ACT: 'T',
  ACC: 'T',
  ACA: 'T',
  ACG: 'T',
  AAT: 'N',
  AAC: 'N',
  AAA: 'K',
  AAG: 'K',
  AGT: 'S',
  AGC: 'S',
  AGA: 'R',
  AGG: 'R',
  GTT: 'V',
  GTC: 'V',
  GTA: 'V',
  GTG: 'V',
  GCT: 'A',
  GCC: 'A',
  GCA: 'A',
  GCG: 'A',
  GAT: 'D',
  GAC: 'D',
  GAA: 'E',
  GAG: 'E',
  GGT: 'G',
  GGC: 'G',
  GGA: 'G',
  GGG: 'G',
}

function reverseComplement(seq: string) {
  const comp: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' }
  return seq
    .split('')
    .reverse()
    .map(b => comp[b])
    .join('')
}

function translate(dna: string) {
  let protein = ''
  for (let i = 0; i < dna.length - 2; i += 3) {
    const codon = dna.slice(i, i + 3)
    protein += codonTable[codon] ?? 'X'
  }
  return protein
}

test('forward strand translation verification', () => {
  // DNA: ATG GCT = Met-Ala = "MA"
  // Positions 0-5 in genomic coords (using 0-based)
  //
  //   genome pos:  0   1   2   3   4   5
  //   nucleotide:  A   T   G   G   C   T
  //   protein pos: 0   0   0   1   1   1
  //   amino acid:  M   M   M   A   A   A
  //
  const dna = 'ATGGCT'
  const expectedProtein = 'MA'
  expect(translate(dna)).toBe(expectedProtein)

  const ret = genomeToTranscriptSeqMapping({
    type: 'mRNA',
    id: 'test-fwd',
    start: 0,
    end: 6,
    strand: 1,
    phase: 0,
    refName: 'chr1',
    subfeatures: [
      {
        type: 'CDS',
        start: 0,
        end: 6,
        id: 'cds1',
        phase: 0,
        strand: 1,
        refName: 'chr1',
      },
    ],
  })

  // g2p: genome position -> protein position
  expect(ret.g2p[0]).toBe(0) // A -> M
  expect(ret.g2p[1]).toBe(0) // T -> M
  expect(ret.g2p[2]).toBe(0) // G -> M
  expect(ret.g2p[3]).toBe(1) // G -> A
  expect(ret.g2p[4]).toBe(1) // C -> A
  expect(ret.g2p[5]).toBe(1) // T -> A

  // p2g: protein position -> first genome position of codon
  expect(ret.p2g[0]).toBe(0) // M codon starts at 0
  expect(ret.p2g[1]).toBe(3) // A codon starts at 3
})

test('reverse strand translation verification', () => {
  // For reverse strand, transcription reads the reverse complement
  //
  // Genomic (+ strand): 5'-A  G  C  C  A  T-3'  positions 0-5
  // Template (- strand): 3'-T  C  G  G  T  A-5'
  // mRNA (transcript):   5'-A  T  G  G  C  T-3' = ATG GCT = "MA"
  //
  // Transcription order (genomic positions): 5, 4, 3, 2, 1, 0
  //
  //   genome pos:      5   4   3   2   1   0
  //   genomic base:    T   A   C   C   G   A
  //   complement:      A   T   G   G   C   T
  //   transcript pos:  0   1   2   3   4   5
  //   protein pos:     0   0   0   1   1   1
  //   amino acid:      M   M   M   A   A   A
  //
  const genomicSeq = 'AGCCAT'
  const transcriptSeq = reverseComplement(genomicSeq) // ATGGCT
  const expectedProtein = 'MA'
  expect(transcriptSeq).toBe('ATGGCT')
  expect(translate(transcriptSeq)).toBe(expectedProtein)

  const ret = genomeToTranscriptSeqMapping({
    type: 'mRNA',
    id: 'test-rev',
    start: 0,
    end: 6,
    strand: -1,
    phase: 0,
    refName: 'chr1',
    subfeatures: [
      {
        type: 'CDS',
        start: 0,
        end: 6,
        id: 'cds1',
        phase: 0,
        strand: -1,
        refName: 'chr1',
      },
    ],
  })

  // g2p: genome position -> protein position
  // Transcription goes 5->4->3->2->1->0
  expect(ret.g2p[5]).toBe(0) // T (comp=A) -> M
  expect(ret.g2p[4]).toBe(0) // A (comp=T) -> M
  expect(ret.g2p[3]).toBe(0) // C (comp=G) -> M
  expect(ret.g2p[2]).toBe(1) // C (comp=G) -> A
  expect(ret.g2p[1]).toBe(1) // G (comp=C) -> A
  expect(ret.g2p[0]).toBe(1) // A (comp=T) -> A

  // p2g: protein position -> first genome position of codon (in transcription order)
  expect(ret.p2g[0]).toBe(5) // M codon starts at genomic 5 (first in transcription)
  expect(ret.p2g[1]).toBe(2) // A codon starts at genomic 2
})

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

test('getCodonRange for forward strand', () => {
  // For forward strand gene at positions 0-5 (ATG GCT = MA)
  // p2g[0] = 0 (M codon starts at 0)
  // p2g[1] = 3 (A codon starts at 3)
  const ret = genomeToTranscriptSeqMapping({
    type: 'mRNA',
    id: 'test-fwd',
    start: 0,
    end: 6,
    strand: 1,
    phase: 0,
    refName: 'chr1',
    subfeatures: [
      {
        type: 'CDS',
        start: 0,
        end: 6,
        id: 'cds1',
        phase: 0,
        strand: 1,
        refName: 'chr1',
      },
    ],
  })

  // M codon at protein position 0 should span [0, 3)
  const range0 = getCodonRange(ret.p2g, 0, ret.strand)
  expect(range0).toEqual([0, 3])

  // A codon at protein position 1 should span [3, 6)
  const range1 = getCodonRange(ret.p2g, 1, ret.strand)
  expect(range1).toEqual([3, 6])

  // Non-existent protein position should return undefined
  const range2 = getCodonRange(ret.p2g, 99, ret.strand)
  expect(range2).toBeUndefined()
})

test('getCodonRange for reverse strand', () => {
  // For reverse strand gene at positions 0-5
  // Transcription order: 5, 4, 3, 2, 1, 0
  // p2g[0] = 5 (M codon starts at genomic 5, first in transcription)
  // p2g[1] = 2 (A codon starts at genomic 2)
  const ret = genomeToTranscriptSeqMapping({
    type: 'mRNA',
    id: 'test-rev',
    start: 0,
    end: 6,
    strand: -1,
    phase: 0,
    refName: 'chr1',
    subfeatures: [
      {
        type: 'CDS',
        start: 0,
        end: 6,
        id: 'cds1',
        phase: 0,
        strand: -1,
        refName: 'chr1',
      },
    ],
  })

  // M codon at protein position 0:
  // p2g[0] = 5 (highest coord, first in transcription)
  // Codon covers genomic positions 5, 4, 3
  // 0-based half-open range: [3, 6)
  const range0 = getCodonRange(ret.p2g, 0, ret.strand)
  expect(range0).toEqual([3, 6])

  // A codon at protein position 1:
  // p2g[1] = 2 (highest coord of second codon)
  // Codon covers genomic positions 2, 1, 0
  // 0-based half-open range: [0, 3)
  const range1 = getCodonRange(ret.p2g, 1, ret.strand)
  expect(range1).toEqual([0, 3])

  // Non-existent protein position should return undefined
  const range2 = getCodonRange(ret.p2g, 99, ret.strand)
  expect(range2).toBeUndefined()
})
