# g2p_mapper

A zero-dependency TypeScript library that maps genome positions to
protein/transcript positions and back.

- Takes GFF3-style features with CDS subfeatures
- Handles forward and reverse strands
- Handles CDS phase offsets
- Deduplicates repeated CDS rows
- Handles codons that span an exon boundary
- Pairs with [p2s_mapper](https://github.com/GMOD/p2s_mapper), which carries a
  protein position on to a residue of a 3D structure: genome → protein → 3D

## Install

```
npm install g2p_mapper
```

## Usage

### The input feature

`genomeToTranscriptSeqMapping` takes one transcript (an mRNA, say) as a plain
object, with its CDS segments in `subfeatures`. Take this two-exon transcript in
GFF3:

```
chr1  .  mRNA  100  205  .  +  .  ID=tx1
chr1  .  CDS   100  103  .  +  0  Parent=tx1
chr1  .  CDS   201  205  .  +  2  Parent=tx1
```

The equivalent feature object:

```typescript
const feature = {
  refName: 'chr1',
  start: 99,
  end: 205,
  strand: 1,
  type: 'mRNA',
  subfeatures: [
    { refName: 'chr1', start: 99, end: 103, type: 'CDS', phase: 0 },
    { refName: 'chr1', start: 200, end: 205, type: 'CDS', phase: 2 },
  ],
}
```

- `refName`, `start` and `end` are required on every feature
- `strand` is required on the transcript, and is `1` or `-1`, not `+` or `-`
- The mapper reads only subfeatures with `type: 'CDS'`, in any order, and
  ignores exons, UTRs and the rest
- `phase` is the GFF3 phase column; the mapper reads it from the first CDS in
  transcription order only
- Coordinates are 0-based and half-open, so a GFF3 `start` (1-based, inclusive)
  becomes `start - 1` and `end` stays the same

A JBrowse 2 feature's `feature.toJSON()` already has this shape.

### With @gmod/gff-nostream

[@gmod/gff-nostream](https://github.com/GMOD/gff-nostream) transcripts go to the
mapper unchanged. Pass each transcript, not the gene above it:

```typescript
import { parseStringSync } from '@gmod/gff-nostream'
import { genomeToTranscriptSeqMapping } from 'g2p_mapper'

const gff = `chr1\t.\tgene\t100\t205\t.\t+\t.\tID=gene1
chr1\t.\tmRNA\t100\t205\t.\t+\t.\tID=tx1;Parent=gene1
chr1\t.\tCDS\t100\t103\t.\t+\t0\tParent=tx1
chr1\t.\tCDS\t201\t205\t.\t+\t2\tParent=tx1
`

for (const gene of parseStringSync(gff)) {
  for (const transcript of gene.subfeatures) {
    const { g2p, p2gCodon } = genomeToTranscriptSeqMapping(transcript)
    g2p[200] // 1
  }
}
```

### Mapping positions

```typescript
import { genomeToTranscriptSeqMapping, getCodonRanges } from 'g2p_mapper'

const { g2p, p2g, p2gCodon, refName, strand } =
  genomeToTranscriptSeqMapping(feature)

g2p[200] // 1: genome position 200 falls in the second amino acid
g2p[150] // undefined: 150 is intronic

p2g[1] // 102
p2gCodon[1] // [102, 200, 201]: this codon spans the intron

getCodonRanges(p2gCodon, 1) // [[102, 103], [200, 202]]
getCodonRanges(p2gCodon, 2) // [[202, 205]]
```

- `g2p` — genome position → protein position
- `p2g` — protein position → first genome position of the codon
- `p2gCodon` — protein position → every genome position of the codon, in
  transcription order
- `getCodonRanges` — a codon's genomic `[start, end)` ranges, one per contiguous
  piece, or `undefined` for a protein position outside the CDS
- `proteinRangeToGenome(transcript, start, end)` — the genomic ranges encoding
  protein positions `[start, end)`, such as a domain, one per CDS part

Protein positions are 0-based too: `0` is the first amino acid. On a transcript
whose first CDS has phase 1 or 2, `0` is the partial codon, as in a JBrowse
translation; pass `{ partialCodon: 'dropped' }` to either function to number
from the first complete codon, as `gffread -y` and NCBI protein FASTA do.

### Reverse strand

With `strand: -1` the mapper walks the CDS from the highest coordinate down, so
the first amino acid is at the right-hand end. The same transcript on the
reverse strand has different phases, because the right-hand CDS now comes first:

```typescript
const { g2p, p2g, p2gCodon } = genomeToTranscriptSeqMapping({
  ...feature,
  strand: -1,
  subfeatures: [
    { refName: 'chr1', start: 99, end: 103, type: 'CDS', phase: 1 },
    { refName: 'chr1', start: 200, end: 205, type: 'CDS', phase: 0 },
  ],
})

g2p[204] // 0: the highest CDS base starts the protein
g2p[99] // 2

p2g[1] // 201: the codon's first base, which is its highest coordinate
p2gCodon[1] // [201, 200, 102]: transcription order, so descending

getCodonRanges(p2gCodon, 1) // [[102, 103], [200, 202]]: always ascending
```

## Docs

- [mapping.md](docs/mapping.md) — how the maps are built, and how reverse
  strands and split codons behave
- [api.md](docs/api.md) — the `Feat` input, the return maps, and a worked
  example

## See also

- [p2s_mapper](https://github.com/GMOD/p2s_mapper) — maps a protein position to
  residue in a structure file, combines with this lib
- [g2p_mapper_cli](https://github.com/cmdcolin/g2p_mapper_cli) — CLI wrapper for
  this library
- [domains2genome](https://github.com/cmdcolin/domains2genome) — places
  InterProScan or HMMER domain calls on the genome as BED12
- [jbrowse-plugin-protein3d](https://github.com/GMOD/jbrowse-plugin-protein3d) —
  maps 3-D protein structure positions to the genome
- [jbrowse-plugin-msaview](https://github.com/GMOD/jbrowse-plugin-msaview) —
  maps MSA sequence positions to the genome

## Assumptions

`g2p_mapper` assumes simple 3-letter codon translation, which does not always
hold, so validate the assumption against your own data.

## Publishing

GitHub Actions publishes each version tag to npm with
[trusted publishing](https://docs.npmjs.com/about-trusted-publishing). To
release:

```bash
pnpm version patch  # or minor/major
```
