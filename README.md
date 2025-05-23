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

## Notes

See also https://github.com/cmdcolin/interproscan2genome and
https://github.com/cmdcolin/g2p_mapper_cli for usages of this tool

This library is also used by the JBrowse plugins (protein3d, msaview) to map
positions on the genome to protein sequences
