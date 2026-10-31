import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'

test('the original champion recommendations and PT-BR card names are unchanged', () => {
  const raw = fs.readFileSync(new URL('../src/data/champions.json', import.meta.url))
  assert.equal(createHash('sha256').update(raw).digest('hex'), 'b0bae0e1f920f9f795318e2b335328ed0c24f6b7e94281568377d934ac554871')
  const champions = JSON.parse(raw)
  const { effects } = JSON.parse(fs.readFileSync(new URL('../src/data/augment-effects.json', import.meta.url)))
  assert.equal(champions.length, 173)
  let recommendations = 0
  for (const champion of champions) for (const card of Object.values(champion.augments).flat()) {
    assert.ok(card.name && card.english && card.tier)
    assert.ok(effects[card.url]?.pt && effects[card.url]?.en)
    recommendations++
  }
  assert.equal(recommendations, 2300)
})
