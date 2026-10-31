import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { adaptBuild, validSequence } from '../src/domain/smartBuild.ts'
import { builds } from '../src/data/builds/catalog.ts'
import { rules } from '../src/data/builds/rules.ts'
import { threats } from '../src/domain/buildTypes.ts'
import { personalizedRules } from '../src/data/builds/personalizedRules.ts'
import { championPlans } from '../src/data/builds/championPlans.ts'
import { championKits } from '../src/data/builds/championKits.ts'
import { recipes } from '../src/data/builds/recipes.ts'
import { getBuildOptions, canUseDraft, buildCategory } from '../src/data/builds/laboratory.ts'
const { items } = JSON.parse(fs.readFileSync(new URL('../src/data/builds/items.json', import.meta.url)))
const allSelections = Array.from({ length: 2 ** threats.length }, (_, mask) => threats.filter((_, i) => mask & (1 << i)).map(t => t.id))
const find = id => builds.find(b => b.id === id)

test('all eleven specific builds have six compatible Mayhem items and distinguish observed cores from editorial proposals', () => {
  assert.equal(new Set(builds.map(b => b.championId)).size, 6)
  assert.equal(builds.length, 11)
  for (const b of builds) {
    assert.ok(validSequence(b.sequence, b, items), b.id)
    assert.equal(b.observedCore.length, b.basis === 'observed-core' ? 3 : 0)
    assert.deepEqual(b.sequence.filter(id => b.observedCore.includes(id)), b.observedCore)
    assert.ok(b.evidence.every(e => e.url.startsWith('https://') && e.patch === b.patch))
    assert.ok(b.starting.every(id => items[id]?.mayhem && items[id]?.purchasable))
  }
})

test('all 173 champions have a default principal, alternative and fun styles with working threat adjustments', () => {
  const champions = JSON.parse(fs.readFileSync(new URL('../src/data/champions.json', import.meta.url)))
  for (const champion of champions) {
    const options = getBuildOptions(champion.id)
    assert.equal(buildCategory(options[0], options[0]), 'Principal')
    assert.ok(options.some(b => buildCategory(b, options[0]) === 'Alternativa'), champion.id)
    assert.ok(options.some(b => buildCategory(b, options[0]) === 'Troll / Fun'), champion.id)
    assert.ok(['mage','attack','tank'].every(identity => options.some(b => b.identity === identity)))
    for (const build of options) {
      assert.ok(validSequence(build.sequence, build, items), build.id)
      const combined = personalizedRules(build, items)
      for (const selection of allSelections) {
        const result = adaptBuild(build, selection, items, combined)
        assert.ok(validSequence(result.sequence, build, items), build.id)
        assert.deepEqual(result, adaptBuild(build, [...selection].reverse(), items, combined))
        for (const change of result.changes) assert.equal(result.sequence[change.position - 1], change.itemId)
      }
      const result = adaptBuild(build, ['healing','tanks'], items, combined)
      assert.deepEqual(result.unresolved, [], build.id)
      if (build.basis === 'template') assert.deepEqual(build.observedCore, [])
    }
  }
})

test('Aatrox opens AD fighter, offers tank and fun AP, and AD crit adapts to healing and tanks', () => {
  const options = getBuildOptions('Aatrox')
  assert.equal(options[0].identity, 'fighter')
  assert.equal(buildCategory(options.find(b=>b.identity==='tank'),options[0]), 'Alternativa')
  assert.equal(buildCategory(options.find(b=>b.identity==='mage'),options[0]), 'Troll / Fun')
  const ad = options.find(b=>b.identity==='attack')
  const result = adaptBuild(ad, ['healing','tanks'], items, personalizedRules(ad,items))
  assert.ok(result.sequence.includes('3033') && result.sequence.includes('3031'))
  assert.ok(!result.sequence.includes('3036'))
  assert.deepEqual(result.unresolved, [])
  const fighter = options[0]
  const adapted = adaptBuild(fighter,['healing','tanks'],items,personalizedRules(fighter,items))
  assert.ok(adapted.sequence.includes('6609') && adapted.sequence.includes('3071'))
})

test('custom item sequences retain situational adaptation and compatibility', () => {
  const ad = getBuildOptions('Renata').find(b=>b.identity==='attack')
  const custom = {...ad,sequence: [...ad.sequence],essential: []}
  custom.sequence[5] = '3091'
  const result=adaptBuild(custom,['healing','tanks'],items,personalizedRules(custom,items))
  assert.ok(validSequence(result.sequence,custom,items))
  assert.ok(result.sequence.includes('3033') && result.sequence.includes('3031'))
  assert.deepEqual(result.unresolved,[])
})

test('Renata offers support, AP and AD/crit and AD adaptations never revert to support', () => {
  const options = getBuildOptions('Renata')
  assert.ok(options.some(b => b.id === 'renata-support'))
  assert.ok(options.some(b => b.id === 'renata-ap'))
  const ad = options.find(b => b.id === 'renata-ad')
  const result = adaptBuild(ad, ['healing','magic'], items, rules)
  assert.ok(ad.essential.every(id => result.sequence.includes(id)))
  assert.ok(result.sequence.includes('3033'))
  assert.ok(result.sequence.includes('3091'))
  assert.ok(!result.sequence.includes('3118'))
  const ap = options.find(b => b.id === 'renata-ap')
  const adapted = adaptBuild(ap, ['healing','tanks'], items, rules)
  assert.ok(ap.essential.every(id => adapted.sequence.includes(id)))
  assert.ok(adapted.sequence.includes('3165') && adapted.sequence.includes('6653'))
})

test('manual experiments may replace original essentials but cannot duplicate items or unique groups', () => {
  const ad = getBuildOptions('Renata').find(b => b.id === 'renata-ad')
  const modified = [...ad.sequence]
  modified[0] = '3091'
  assert.ok(canUseDraft(modified, ad, items))
  assert.ok(!validSequence(modified, ad, items)) // No longer a reviewed core.
  modified[5] = '3091'
  assert.ok(!canUseDraft(modified, ad, items))
  const conflicting = [...ad.sequence];conflicting[5] = '3033'
  assert.ok(!canUseDraft(conflicting, ad, items))
})

test('Tahm has tank, AP and experimental AD; each alternative adapts without changing its identity', () => {
  assert.deepEqual(builds.filter(b => b.championId === 'TahmKench').map(b => b.classification), ['Meta','Off-meta','Fun / Experimental'])
  const ap = find('tahmkench-ap')
  const apResult = adaptBuild(ap, ['tanks','healing'], items, rules)
  assert.equal(apResult.sequence[3], '3165')
  assert.equal(apResult.sequence[4], '6653')
  assert.ok(ap.essential.every(id => apResult.sequence.includes(id)))
  assert.deepEqual(apResult.unresolved, [])
  const ad = find('tahmkench-ad')
  const adResult = adaptBuild(ad, ['healing','magic'], items, rules)
  assert.equal(adResult.sequence[4], '3033')
  assert.ok(!adResult.sequence.includes('3036'))
  assert.equal(adResult.sequence[5], '3091')
  assert.ok(ad.essential.every(id => adResult.sequence.includes(id)))
  assert.ok(!adResult.sequence.includes('3089'))
  assert.equal(ad.basis, 'editorial')
  assert.deepEqual(ad.observedCore, [])
  assert.ok(!validSequence([...ad.sequence.slice(0,5),'3033'], ad, items)) // Lord Dominik and Mortal Reminder conflict.
})

test('every threat subset preserves identity, essentials, promised positions and immutable input', () => {
  const before = JSON.stringify({ builds, rules, items })
  for (const b of builds) for (const selection of allSelections) {
    const result = adaptBuild(b, selection, items, rules)
    assert.ok(validSequence(result.sequence, b, items), `${b.id}: ${selection}`)
    assert.deepEqual(result, adaptBuild(b, [...selection].reverse(), items, rules))
    assert.equal(new Set(result.changes.map(c => c.itemId)).size, result.changes.length)
    for (const c of result.changes) {
      assert.equal(result.sequence[c.position - 1], c.itemId)
      assert.ok(c.threats.every(t => selection.includes(t)))
    }
    for (const t of selection) assert.ok(result.unresolved.includes(t) || result.changes.some(c => c.threats.includes(t)))
    if (!selection.length) assert.deepEqual(result.sequence, b.sequence)
  }
  assert.equal(JSON.stringify({ builds, rules, items }), before)
})

test('Xerath combines anti-heal and anti-health; clearing returns to the original build', () => {
  const b = find('xerath-poke')
  const result = adaptBuild(b, ['healing', 'tanks'], items, rules)
  assert.equal(result.sequence[2], '3165')
  assert.equal(result.sequence[3], '6653')
  assert.deepEqual(result.unresolved, [])
  assert.deepEqual(result.changes.map(c => c.previousItemId), ['4645','3089'])
  assert.deepEqual(adaptBuild(b, [], items, rules).sequence, b.sequence)
})

test('Blitzcrank AP stays AP when tank and healing threats are selected', () => {
  const b = find('blitzcrank-ap')
  const result = adaptBuild(b, ['healing', 'tanks'], items, rules)
  assert.ok(result.sequence.includes('3118'))
  assert.ok(!result.sequence.includes('3084'))
  assert.ok(result.sequence.every(id => items[id].allowedIdentities.includes('mage')))
})

test('a shared answer covers multiple threats once; competing positions report unresolved threats', () => {
  const protection = adaptBuild(find('renata-support'), ['burst','physical','magic'], items, rules)
  assert.equal(protection.changes.length, 1)
  assert.deepEqual(protection.unresolved, [])
  const shared = adaptBuild(find('xerath-poke'), ['burst','physical'], items, rules)
  assert.equal(shared.changes.length, 1)
  assert.deepEqual(shared.unresolved, [])
  const conflict = adaptBuild(find('xerath-poke'), ['healing','burst'], items, rules)
  assert.ok(conflict.unresolved.includes('burst'))
  assert.equal(conflict.sequence[2], '3165')
})

test('no generic fallback for threats without a reviewed rule', () => {
  const b = find('irelia-fighter')
  const result = adaptBuild(b, ['healing'], items, rules)
  assert.deepEqual(result.sequence, b.sequence)
  assert.deepEqual(result.unresolved, ['healing'])
})

test('removed, unknown, mismatched-patch and champion-restricted objects cannot enter a recommendation', () => {
  const b = find('xerath-poke')
  for (const patch of [{ mayhem: false },{ purchasable: false },{ patch: '26.20' },{ allowedIdentities: ['tank'] },{ requiredChampion: 'Renata' }]) {
    const changed = { ...items, '3165': { ...items['3165'], ...patch } }
    assert.ok(!adaptBuild(b, ['healing'], changed, rules).sequence.includes('3165'))
  }
  const unknown = { ...rules[0], id: 'unknown', itemId: 'removed-item' }
  assert.deepEqual(adaptBuild(b, ['healing'], items, [unknown]).sequence, b.sequence)
})

test('essential objects and unique passive groups are protected, including pending builds', () => {
  const b = find('irelia-fighter')
  const bad = { id: 'incompatible', buildIds: [b.id], threats: ['magic'], itemId: '3156', position: 5, replaceable: ['3091'], priority: 999, reason: 'test', evidence: [] }
  assert.deepEqual(adaptBuild(b, ['magic'], items, [bad]).sequence, b.sequence) // Maw conflicts with Sterak.
  assert.deepEqual(adaptBuild({ ...b, status: 'pending' }, ['burst'], items, rules).changes, [])
  const protectedCore = { ...bad, itemId: '3078', replaceable: ['3153'] }
  assert.deepEqual(adaptBuild(b, ['magic'], items, [protectedCore]).sequence, b.sequence)
  assert.deepEqual(adaptBuild({ ...b, sequence: ['missing',...b.sequence.slice(1)] }, ['burst'], items, rules).changes, [])
})

test('all champions have explicit individual decisions, kit sources and no unsupported fallback', () => {
  const champions=JSON.parse(fs.readFileSync(new URL('../src/data/champions.json',import.meta.url)))
  assert.deepEqual(Object.keys(championPlans).sort(),champions.map(c=>c.id).sort())
  assert.deepEqual(Object.keys(championKits).sort(),champions.map(c=>c.id).sort())
  for(const champion of champions){
    const plan=championPlans[champion.id]
    for(const key of ['main','ap','ad','tank']) assert.ok(recipes[plan[key]],champion.id)
    for(const key of ['mainNote','apNote','adNote','tankNote']) assert.ok(typeof plan[key]==='string' && plan[key].trim().length>0,`${champion.id}: ${key}`)
    const kit=championKits[champion.id]
    assert.equal(kit.spells.length,4)
    assert.ok(kit.passive.name && kit.passive.english && kit.passive.description)
    assert.ok(kit.source.endsWith(`/champion/${champion.id}.json`))
    for(const build of getBuildOptions(champion.id)){
      assert.equal(build.basis==='template',false)
      assert.ok(build.personalization.styleNote && build.personalization.source===kit.source)
      assert.ok(build.evidence.some(e=>e.url===kit.source))
      for(const selection of allSelections){
        const result=adaptBuild(build,selection,items,personalizedRules(build,items))
        if(kit.resource!=='Mana') assert.ok(!result.sequence.some(id=>items[id].stats.FlatMPPoolMod),`${build.id}: unnecessary mana`)
      }
    }
  }
  assert.throws(()=>getBuildOptions('UnknownChampion'),/Missing individual/)
})

test('Darius and Aatrox have distinct tank priorities and retain their physical kit in AP experiments', () => {
  const darius=getBuildOptions('Darius'),aatrox=getBuildOptions('Aatrox')
  const dTank=darius.find(b=>b.identity==='tank'),aTank=aatrox.find(b=>b.identity==='tank')
  assert.ok(dTank.essential.includes('3742'))
  assert.ok(aTank.essential.includes('3065'))
  assert.notDeepEqual(dTank.sequence,aTank.sequence)
  const dAP=darius.find(b=>b.identity==='mage')
  const result=adaptBuild(dAP,['healing','tanks'],items,personalizedRules(dAP,items))
  assert.ok(result.sequence.includes('6609') && result.sequence.includes('3071'))
  assert.ok(result.sequence.includes('3100'))
  assert.deepEqual(result.unresolved,[])
  assert.ok(dAP.personalization.styleNote.includes('sangramento'))
})

test('Jhin adaptations respect fixed-rate attacks, while Kayle AP and Vladimir use different cores', () => {
  const jhin=getBuildOptions('Jhin')[0]
  const result=adaptBuild(jhin,['tanks','healing','magic'],items,personalizedRules(jhin,items))
  assert.ok(result.sequence.includes('3033'))
  assert.ok(result.sequence.includes('3156'))
  assert.ok(!result.sequence.includes('3091') && !result.sequence.includes('3153'))
  assert.deepEqual(result.unresolved,[])
  assert.equal(getBuildOptions('Kayle')[0].sequence[0],'3115')
  assert.equal(getBuildOptions('Vladimir')[0].sequence[0],'4633')
  assert.equal(getBuildOptions('Lux')[0].sequence[0],'6655')
})

test('ranged protection and Pyke resistances avoid a universal Heartsteel tank recipe', () => {
  const lux=getBuildOptions('Lux').find(b=>b.identity==='tank')
  const pyke=getBuildOptions('Pyke').find(b=>b.identity==='tank')
  const shen=getBuildOptions('Shen').find(b=>b.identity==='tank')
  assert.ok(!lux.sequence.includes('3084') && !pyke.sequence.includes('3084'))
  assert.ok(shen.sequence.includes('3748'))
  assert.ok(pyke.personalization.styleNote.includes('não aumenta vida máxima'))
  for(const [championId,kit] of Object.entries(championKits)){
    if(kit.range<400&&!['Gnar','Elise','Nidalee','Jayce','Kayle'].includes(championId)){
      for(const b of getBuildOptions(championId)) assert.ok(!b.sequence.includes('3085'),b.id)
    }
  }
})

test('new catalogue blocks Lifeline, penetration, Tear and Spellblade purchase conflicts', () => {
  const attack=getBuildOptions('Jhin')[0]
  const bothPen=[...attack.sequence];bothPen[5]='3071'
  assert.ok(!validSequence(bothPen,attack,items))
  const lifeline=[...attack.sequence];lifeline[4]='3156';lifeline[5]='6673'
  assert.ok(!validSequence(lifeline,attack,items))
  const fighter=getBuildOptions('Jax')[0]
  const spellblade=[...fighter.sequence];spellblade[5]='6662'
  assert.ok(!canUseDraft(spellblade,fighter,items))
})

