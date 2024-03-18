# g2p_mapper_cli

Map positions on the genome to the protein and vice versa. Outputs a large JSON
file with the "ID" field from the GFF column 9 to create keys in a mapping
object

## CLI usage

```bash
npm install g2p_mapper_cli
g2pmapper yourfile.gff mappings.json
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
