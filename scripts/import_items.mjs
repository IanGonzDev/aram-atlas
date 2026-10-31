// Run with saved, matching-patch source snapshots: node scripts/import_items.mjs pt.json en.json mayhem.json
// This script does not access a live game, and is never shipped as runtime code.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [ptPath, enPath, mayhemPath] = process.argv.slice(2)
if (!ptPath || !enPath || !mayhemPath) throw new Error('Pass PT, EN and Mayhem item snapshots.')
const pt = JSON.parse(fs.readFileSync(ptPath)), en = JSON.parse(fs.readFileSync(enPath)), mayhem = JSON.parse(fs.readFileSync(mayhemPath))
if (pt.version !== '16.21.1' || en.version !== pt.version) throw new Error('This curated import requires Data Dragon 16.21.1.')
if (mayhem.meta?.releaseId !== 'website:20261031_115543:923b34276709') throw new Error('Review the Mayhem release before importing a different snapshot.')
const checkedAt = '2026-10-31', patch = '26.21'
const official = locale => `https://ddragon.leagueoflegends.com/cdn/${en.version}/data/${locale}/item.json`
const source = [
  { label: 'Riot Data Dragon PT-BR', url: official('pt_BR'), patch, checkedAt },
  { label: 'Riot Data Dragon EN', url: official('en_US'), patch, checkedAt },
  { label: 'Catálogo Mayhem · CC BY 4.0', url: 'https://arammayhem.com/data/v1/latest/items.json', patch, checkedAt },
]
// Identity allow-lists are editorial compatibility checks, not generated recommendations.
const identities = {
  mage: ['6609','3071','3153','2503','3003','3116','3137','3146','4628','4629','4646','6657','8010','3065','6655','4645','3089','3135','6653','3165','3157','3102','3118','3152','3100','4633','3115'],
  fighter: ['2501','3073','3074','3078','3071','6609','3153','6610','6333','3091','3053','3156','3065','3742','3748','3161','6631','6692','6694','3142','6698','3814','6696'],
  tank: ['3116','3748','3222','3165','6609','3071','3156','6333','3814','3110','3068','6662','6664','6665','2504','8020','3742','3050','3109','3107','6653','3143','3190','3084','3083','2502','3065','3075','3119','4401'],
  enchanter: ['3504','6616','6617','6620','6621','3222','3116','3050','3109','2504','3110','3118','4005','2065','3107','3190','3165','6653','3102'],
  attack: ['3139','3302','6673','6672','6675','6676','3124','3085','3094','3508','3004','3078','3161','6694','3142','6698','3814','6696','3748','2501','3071','6609','3065','6631','6610','3053','3156','3153','3046','3031','3036','3072','3033','6333','3091'],
}
const universal = ['3009','3020','3111','3047','3158','3006']
const starting = ['1028','1058','1052','1036','3077','2051','3070','3916','3801','3067','3211','1004','3114','3066','1029','1031','1011','4642']
const ids = [...new Set([...Object.values(identities).flat(), ...universal, ...starting])]
const plain = (html, locale) => html.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<li>/g, '\n')
  .replace(/<(healing|scaleHealth)>0(?: de Vida)?<\/(healing|scaleHealth)>/g, locale === 'pt' ? '[valor calculado no jogo]' : '[calculated in game]')
  .replace(/\(0s\)/g, locale === 'pt' ? '(recarga calculada no jogo)' : '(cooldown calculated in game)')
  .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  .replace(/\n{3,}/g, '\n\n').trim()
const items = {}
for (const id of ids) {
  const p = pt.data[id], e = en.data[id]
  const listed = mayhem.rows.find(row => String(row.gameItemId) === id)
  if (!p || !e || !listed || !e.maps?.['12'] || !e.gold.purchasable) throw new Error(`Unverified Mayhem item ${id}`)
  items[id] = { id, name: p.name, english: e.name, icon: `https://ddragon.leagueoflegends.com/cdn/${en.version}/img/item/${e.image.full}`,
    cost: e.gold.total, description: plain(p.description, 'pt'), descriptionEN: plain(e.description, 'en'),
    incomplete: /<[^>]+>0(?: de Vida)?<|\(0s\)/.test(p.description + e.description),
    stats: e.stats, buildsFrom: e.from || [], buildsInto: e.into || [],
    groups: ['3003','3004','3119'].includes(id) ? ['tear'] : universal.includes(id) ? ['boots'] : ['3053','3156','6673'].includes(id) ? ['lifeline'] : ['3135','3137'].includes(id) ? ['percent-magic-penetration'] : ['3036','3033','3071','6694','3302'].includes(id) ? ['percent-armor-penetration'] : ['3100','3078','6662'].includes(id) ? ['spellblade'] : [],
    mayhem: true, purchasable: true, allowedIdentities: universal.includes(id) || starting.includes(id) ? Object.keys(identities) : Object.entries(identities).filter(([, values]) => values.includes(id)).map(([key]) => key),
    ...(e.requiredChampion ? { requiredChampion: e.requiredChampion } : {}), patch, source,
  }
}
fs.writeFileSync(path.join(root,'src/data/builds/items.json'), JSON.stringify({ patch, dataDragonVersion: en.version, checkedAt, mayhemRelease: mayhem.meta.releaseId, items }, null, 2) + '\n')
console.log(`Imported ${ids.length} curated Mayhem items.`)

