# g2p_mapper

A zero-dependency TypeScript library that maps genome positions to
protein/transcript positions and back.

- Takes GFF3-style features with CDS subfeatures
- Handles forward and reverse strands
- Handles CDS phase offsets
- Deduplicates repeated CDS rows
- Handles codons that span an exon boundary

## Install

```
npm install g2p_mapper
```

## Usage

```typescript
import { genomeToTranscriptSeqMapping, getCodonRanges } from 'g2p_mapper'

const { g2p, p2g, p2gCodon, refName, strand } =
  genomeToTranscriptSeqMapping(feature)

const ranges = getCodonRanges(p2gCodon, proteinPos)
```

- `g2p` — genome position → protein position
- `p2g` — protein position → first genome position of the codon
- `p2gCodon` — protein position → every genome position of the codon, in
  transcription order
- `getCodonRanges` — a codon's genomic `[start, end)` ranges, one per contiguous
  piece

All coordinates are 0-based and half-open.

## Docs

- [mapping.md](docs/mapping.md) — how the maps are built, with a flowchart, and
  how reverse strands and split codons behave
- [api.md](docs/api.md) — the `Feat` input, the return maps, and a worked
  example

## See also

- [g2p_mapper_cli](https://github.com/cmdcolin/g2p_mapper_cli) — CLI wrapper for
  this library
- [interproscan2genome](https://github.com/cmdcolin/interproscan2genome) — maps
  InterProScan protein annotations back to genome coordinates
- [jbrowse-plugin-protein3d](https://github.com/cmdcolin/jbrowse-plugin-protein3d)
  — maps 3-D protein structure positions to the genome
- [jbrowse-plugin-msaview](https://github.com/GMOD/jbrowse-plugin-msaview) —
  maps MSA sequence positions to the genome

## Footnote

`g2p_mapper` assumes simple 3-letter codon translation, which does not always
hold. Validate this assumption against your own data.

## Publishing

[Trusted publishing](https://docs.npmjs.com/about-trusted-publishing) via GitHub
Actions.

```bash
pnpm version patch  # or minor/major
```
