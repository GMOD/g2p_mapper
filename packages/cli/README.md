# g2p_mapper_cli

Map positions on the genome to the protein and vice versa. Outputs a large JSON
file with the "ID" field from the GFF column 9 to create keys in a mapping
object

## CLI usage

```bash
npm install g2p_mapper_cli
g2pmapper --in yourfile.gff --out outDir

## will create outDir if none exists
```

## Output

The script outputs one JSON file per transcript from the inputted GFF. The JSON
files look like this

e.g. XM_047436352.2.json

```json
{
  "g2p": { "123": 0, "124": 0, "125": 0, "126": 1, "127": 1 },
  "p2g": { "0": 123, "1": 126 },
  "strand": 1,
  "refName": "chr1"
}
```

- g2p gives the protein position given a genome position as a key
- p2g gives the genome position given the protein position as a key
- strand is the transcript strand
- refName is the chromosome name of the transcript

The number of files is fairly large e.g. the human GFF outputs 144000 files
