# g2p_mapper

Map positions on the genome to the protein and vice versa. Uses the "ID" field
from the GFF column 9 to create a mapping

## Usage

```bash
git clone https://github.com/cmdcolin/g2p_mapper
cd g2p_mapper
yarn
yarn build
node dist/mapper.js yourfile.gff mappings.json

```

## Output format

It is a large JSON file that maps every single position in a protein to every
single position in a genome and vice versa

The JSON format looks like this

```json
{
  "XM_047436352.1": {
    "g2p": { "123": 0, "124": 0, "125": 0, "126": 1, "127": 1 },
    "p2g": { "0": 123, "1": 126 },
    "strand": 1,
    "refName": "chr1"
  },
  "XM_047436352.2":{
    ...same type of thing here...
  }
}
```

the output file is fairly large, chr1 of human gff is 80 megabytes of JSON, but
you can load that JSON file into memory, then select the transcript you want to
get mappings for, and then use the g2p or p2g structures

## Todos

Add testing and sanity checks

## Footnote

Started from conversations at
https://genomic.social/@photocyte/112100147276909277

This code extracted from https://github.com/cmdcolin/jbrowse-plugin-protein3d
