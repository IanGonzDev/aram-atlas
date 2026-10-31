import fs from 'node:fs'
const [englishDirectory, portugueseDirectory] = process.argv.slice(2)
if (!englishDirectory || !portugueseDirectory) throw Error('Pass directories with matching Data Dragon 16.21.1 champion snapshots.')
const champions = JSON.parse(fs.readFileSync('src/data/champions.json', 'utf8'))
const plain = value => value.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim()
const kits = Object.fromEntries(champions.map(c => {
  const enFile=JSON.parse(fs.readFileSync(`${englishDirectory}/${c.id}.json`)), ptFile=JSON.parse(fs.readFileSync(`${portugueseDirectory}/${c.id}.json`))
  if(enFile.version !== '16.21.1' || ptFile.version !== enFile.version) throw Error(`Mismatched kit: ${c.id}`)
  const en=enFile.data[c.id], pt=ptFile.data[c.id]
  return [c.id, {name:pt.name, english:en.name, range:en.stats.attackrange, resource:en.partype,
    passive:{name:pt.passive.name, english:en.passive.name, description:plain(pt.passive.description), descriptionEN:plain(en.passive.description)},
    spells:en.spells.map((spell,i)=>({key:['Q','W','E','R'][i],name:pt.spells[i].name,english:spell.name,description:plain(pt.spells[i].description),descriptionEN:plain(spell.description)})),
    source:`https://ddragon.leagueoflegends.com/cdn/16.21.1/data/pt_BR/champion/${c.id}.json`}]
}))
fs.writeFileSync('src/data/builds/championKits.ts',`// Official matching-patch kit descriptions; regeneration: scripts/import_champion_kits.mjs.\nexport const championKits = ${JSON.stringify(kits,null,2)}\n`)
console.log(`Imported ${Object.keys(kits).length} bilingual champion kits.`)
