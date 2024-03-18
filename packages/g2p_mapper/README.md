# g2p_mapper

A library for mapping transcript/protein positions to the genome

## Usage

Install the g2p_mapper library from npm, then

```js
import { genomeToTranscriptMapping } from 'g2p_mapper'

// pass in your feature, f, which is a "transcript" feature with the following
// data format:
// interface Feat {
//   strand: number
//   refName: string
//   type: string
//   phase: number
//   ID: string
//   score: number
//   start: number
//   end: number
//   subfeatures?: Feat[]
// }
const { g2p, p2g, refName, strand } = genomeToTranscriptMapping(f)
```
