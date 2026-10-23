import fs from 'node:fs'

import { expect, test } from 'vitest'

import { CODON_FIGURE, renderCodonFigure } from '../scripts/codon-figure.ts'

test('docs/img/codons.svg matches the mapper; pnpm docs:figure redraws it', () => {
  expect(renderCodonFigure()).toBe(fs.readFileSync(CODON_FIGURE, 'utf8'))
})
