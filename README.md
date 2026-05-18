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

Use `getCodonRange` to get the genomic coordinate range for a codon at a given
protein position:

```typescript
import { getCodonRange } from 'g2p_mapper'

// returns a 0-based half-open [start, end) interval, or undefined
const range = getCodonRange(p2g, proteinPos, strand)
```

`getCodonRange` assumes the codon's three bases are contiguous in genome
coordinates. Codons that span an exon boundary, or split codons at the start of
a CDS (`phase != 0`), will produce a range that includes intronic or out-of-CDS
positions. Use `getCodonRanges` with `p2gCodon` to get the correct set of ranges
in those cases:

```typescript
import { getCodonRanges } from 'g2p_mapper'

// returns an array of 0-based half-open [start, end) intervals, sorted
// ascending, or undefined. Multiple ranges are returned when the codon spans
// an exon boundary.
const ranges = getCodonRanges(p2gCodon, proteinPos)
```

## See also

- https://github.com/cmdcolin/g2p_mapper_cli — CLI wrapper for this library
- https://github.com/cmdcolin/interproscan2genome — maps InterProScan protein
  annotations back to genome coordinates
- https://github.com/cmdcolin/jbrowse-plugin-protein3d - our plugin for mapping
  3-D protein structure positions to the genome
- https://github.com/GMOD/jbrowse-plugin-msaview - our plugin for mapping MSA
  sequence positions to the genome

## Publishing

[Trusted publishing](https://docs.npmjs.com/about-trusted-publishing) via GitHub
Actions.

```bash
npm version patch  # or minor/major
```

## Footnote

This package makes various assumptions about the biology, specifically simple
3-letter codon translation. This assumption may not be valid in all
circumstances (biology breaks the rules constantly). Make sure to validate these
assumptions for your application
