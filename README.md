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

Pass a transcript feature (with CDS subfeatures) to `genomeToTranscriptSeqMapping`:

```typescript
import { genomeToTranscriptSeqMapping } from 'g2p_mapper'

const { g2p, p2g, refName, strand } = genomeToTranscriptSeqMapping(feature)

// g2p: Record<number, number> — maps genome position → protein position
// p2g: Record<number, number> — maps protein position → genome position
```

The input feature should match the `Feat` interface:

```typescript
interface Feat {
  strand: number // 1 (forward) or -1 (reverse)
  refName: string // chromosome/contig name
  type: string // e.g. 'mRNA'
  phase: number // CDS phase (0, 1, or 2)
  id: string
  start: number // 0-based
  end: number // 0-based, half-open
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

## See also

- https://github.com/cmdcolin/g2p_mapper_cli — CLI wrapper for this library
- https://github.com/cmdcolin/interproscan2genome — maps InterProScan protein
  annotations back to genome coordinates

This library is also used by JBrowse plugins (protein3d, msaview) to map
positions on the genome to protein sequences.
