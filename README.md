# g2p_mapper

A zero-dependency TypeScript library for mapping genome positions to
protein/transcript positions and vice versa. Works with GFF3-style features and
handles both forward and reverse strand genes, CDS phase offsets, and duplicate
CDS deduplication.

## Install

```
npm install g2p_mapper
```

## Usage

Pass a transcript feature (with CDS subfeatures) to
`genomeToTranscriptSeqMapping`:

```typescript
import { genomeToTranscriptSeqMapping } from 'g2p_mapper'

const { g2p, p2g, p2gCodon, refName, strand } =
  genomeToTranscriptSeqMapping(feature)

// g2p: Record<number, number>        — genome position → protein position
// p2g: Record<number, number>        — protein position → first genome position
//                                      of the codon (in transcription order)
// p2gCodon: Record<number, number[]> — protein position → all genome positions
//                                      of the codon, in transcription order;
//                                      correctly handles codons that span an
//                                      exon boundary
```

The input feature should match the `Feat` interface:

```typescript
interface Feat {
  refName: string // chromosome/contig name (required)
  start: number // 0-based (required)
  end: number // 0-based, half-open (required)
  type?: string // e.g. 'mRNA'; CDS children must have type === 'CDS'
  strand?: number // 1 (forward) or -1 (reverse); required on the parent
  phase?: number // CDS phase (0, 1, or 2); only the first CDS's phase is consulted
  subfeatures?: Feat[] // should contain CDS children
}
```

All coordinates are 0-based and half-open (`[start, end)`).

### Worked example

```typescript
const ret = genomeToTranscriptSeqMapping({
  refName: 'chr1',
  start: 0,
  end: 6,
  strand: 1,
  subfeatures: [
    { refName: 'chr1', start: 0, end: 6, type: 'CDS', strand: 1, phase: 0 },
  ],
})
// ret.g2p      => { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 }
// ret.p2g      => { 0: 0, 1: 3 }                // first genome pos per codon
// ret.p2gCodon => { 0: [0, 1, 2], 1: [3, 4, 5] } // all positions, transcription order
```

For reverse-strand features, `p2gCodon` lists positions in transcription order
(descending genomic coordinates). On a reverse-strand CDS `[0, 6)` the same
codons become `{ 0: [5, 4, 3], 1: [2, 1, 0] }`.

### Looking up codon ranges

`getCodonRanges` returns the genomic ranges covering a codon. It correctly
handles codons that span an exon boundary by returning multiple ranges.

```typescript
import { getCodonRanges } from 'g2p_mapper'

// Returns [start, end)[] sorted ascending, or undefined if the protein
// position is unknown.
const ranges = getCodonRanges(p2gCodon, proteinPos)
```

`getCodonRange` is a faster single-range alternative kept for backwards
compatibility. It assumes the codon's three bases are contiguous in genome
coordinates, so it returns wrong ranges for codons that span an exon boundary or
for split codons at a phase-shifted CDS start (`phase != 0`). Prefer
`getCodonRanges` for new code.

```typescript
import { getCodonRange } from 'g2p_mapper'

// Returns a single [start, end) interval, or undefined.
const range = getCodonRange(p2g, proteinPos, strand)
```

## See also

- https://github.com/cmdcolin/g2p_mapper_cli — CLI wrapper for this library
- https://github.com/cmdcolin/interproscan2genome — maps InterProScan protein
  annotations back to genome coordinates
- https://github.com/cmdcolin/jbrowse-plugin-protein3d - our plugin for mapping
  3-D protein structure positions to the genome
- https://github.com/GMOD/jbrowse-plugin-msaview - our plugin for mapping MSA
  sequence positions to the genome

## Footnote

This package makes various assumptions about the biology, specifically simple
3-letter codon translation. This assumption may not be valid in all
circumstances (biology breaks the rules constantly). Make sure to validate these
assumptions for your application

## Publishing

[Trusted publishing](https://docs.npmjs.com/about-trusted-publishing) via GitHub
Actions.

```bash
npm version patch  # or minor/major
```
