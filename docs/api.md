# API reference

All coordinates are 0-based and half-open (`[start, end)`). For how the maps are
built, see [mapping.md](mapping.md).

- [`genomeToTranscriptSeqMapping`](#genometotranscriptseqmapping)
- [`getCodonRanges`](#getcodonranges)
- [`getCodonRange`](#getcodonrange)

## `genomeToTranscriptSeqMapping`

```typescript
import { genomeToTranscriptSeqMapping } from 'g2p_mapper'

const { g2p, p2g, p2gCodon, refName, strand } =
  genomeToTranscriptSeqMapping(feature)
```

**Input.** A transcript with CDS children, of the exported type `Feat`:

| Field         | Type             | Meaning                                                       |
| ------------- | ---------------- | ------------------------------------------------------------- |
| `refName`     | `string`         | chromosome/contig name; required on the parent                |
| `start`       | `number`         | 0-based start; required                                       |
| `end`         | `number`         | 0-based end, exclusive; required                              |
| `id`          | `string`         | optional; the mapper does not read it                         |
| `name`        | `string`         | optional; the mapper does not read it                         |
| `type`        | `string \| null` | optional, e.g. `'mRNA'`; CDS children need `'CDS'`            |
| `strand`      | `number`         | `1` (forward) or `-1` (reverse); required on the parent       |
| `phase`       | `number`         | optional CDS phase (0, 1, or 2), read from the first CDS only |
| `subfeatures` | `Feat[]`         | optional; should contain the CDS children                     |

The function reads only the direct `subfeatures` of the feature you pass. A gene
whose CDS sit under its mRNA children has no direct CDS, so for a gene the
function returns empty maps without an error; pass each transcript instead.

**Output.**

| Field      | Type                       | Meaning                                                                       |
| ---------- | -------------------------- | ----------------------------------------------------------------------------- |
| `g2p`      | `Record<number, number>`   | genome position → protein position                                            |
| `p2g`      | `Record<number, number>`   | protein position → first genome position of the codon, in transcription order |
| `p2gCodon` | `Record<number, number[]>` | protein position → all genome positions of the codon, in transcription order  |
| `refName`  | `string`                   | the parent's `refName`                                                        |
| `strand`   | `1 \| -1`                  | the parent's `strand`                                                         |

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
// ret.p2g      => { 0: 0, 1: 3 }
// ret.p2gCodon => { 0: [0, 1, 2], 1: [3, 4, 5] }
```

## `getCodonRanges`

`getCodonRanges` returns the genomic ranges covering a codon, with more than one
range when the codon spans an exon boundary.

```typescript
import { getCodonRanges } from 'g2p_mapper'

// [start, end)[] sorted ascending, or undefined if the protein position is unknown
const ranges = getCodonRanges(p2gCodon, proteinPos)
```

## `proteinRangeToGenome`

`proteinRangeToGenome` places a run of protein positions, such as a Pfam domain
or a UniProt feature, on the genome without building the per-base maps.

```typescript
import { proteinRangeToGenome } from 'g2p_mapper'

// protein positions [proteinStart, proteinEnd), 0-based like the maps above;
// one [start, end) per CDS part, sorted ascending, empty past the last codon
const ranges = proteinRangeToGenome(transcript, proteinStart, proteinEnd)
```

## `getCodonRange`

`getCodonRange` is a faster single-range alternative, kept for backwards
compatibility. Prefer `getCodonRanges` for new code: `getCodonRange` assumes the
codon's three bases are contiguous, so it returns wrong ranges for codons that
span an exon boundary.

```typescript
import { getCodonRange } from 'g2p_mapper'

// a single [start, end) interval, or undefined
const range = getCodonRange(p2g, proteinPos, strand)
```
