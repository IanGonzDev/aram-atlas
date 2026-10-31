import type { Build, Identity, Item } from '../../domain/buildTypes'
import { builds } from './catalog.ts'
import { championPlans } from './championPlans.ts'
import { championKits } from './championKits.ts'
import { sequenceOverrides } from './sequenceOverrides.ts'
import { recipes } from './recipes.ts'
import type { RecipeId } from './recipes'
import { validSequence } from '../../domain/smartBuild.ts'

export function buildCategory(build: Build, principal: Build): 'Principal' | 'Alternativa' | 'Troll / Fun' {
  if (build.id === principal.id) return 'Principal'
  return build.classification === 'Fun / Experimental' ? 'Troll / Fun' : 'Alternativa'
}

export function getBuildOptions(championId: string): Build[] {
  const plan = championPlans[championId]
  const kit = championKits[championId as keyof typeof championKits]
  if (!plan || !kit) throw Error(`Missing individual build plan: ${championId}`)
  const noteFor = (identity: Identity) => identity === 'tank' ? plan.tankNote : identity === 'mage' ? plan.apNote : identity === 'attack' ? plan.adNote : plan.mainNote
  const recipeFor = (identity: Identity) => identity === 'tank' ? plan.tank : identity === 'mage' ? plan.ap : identity === 'attack' ? plan.ad : plan.main
  const specific: Build[] = builds.filter(b => b.championId === championId).map(b => ({ ...b,
    personalization: {recipe:b.identity === 'attack' && b.sequence.includes('3031') ? 'crit' : recipeFor(b.identity),kitNote:plan.mainNote,styleNote:noteFor(b.identity),source:kit.source},
    evidence: [...b.evidence,{label:'Kit do campeão · Riot Data Dragon PT-BR',url:kit.source,patch:b.patch,checkedAt:'2026-10-31'}],
  }))
  const requested: {key:string; recipe:RecipeId; note:string}[] = [
    {key:'main',recipe:plan.main,note:plan.mainNote}, {key:'tank',recipe:plan.tank,note:plan.tankNote},
    {key:'ap',recipe:plan.ap,note:plan.apNote}, {key:'ad',recipe:plan.ad,note:plan.adNote},
  ]
  const used = new Set<string>()
  const proposals: Build[] = []
  for (const entry of requested) {
    const recipe = recipes[entry.recipe]
    if (!recipe) throw Error(`Unknown recipe for ${championId}: ${entry.recipe}`)
    if (used.has(entry.recipe) || specific.some(b => b.identity === recipe.identity)) continue
    used.add(entry.recipe)
    const isMain = !specific.length && !proposals.length
    const fun = !isMain && (entry.key === 'ad' || (entry.key === 'ap' && recipes[plan.main].identity !== 'mage' && recipes[plan.main].identity !== 'enchanter' && recipes[plan.main].identity !== 'tank') || entry.recipe === 'meme')
    // Cassiopeia has an explicit six-item alternative without boots; no inferred purchase prohibition.
    const sequence = (sequenceOverrides[championId]?.[recipe.identity] || recipe.sequence).map(id => championId === 'Cassiopeia' && ['3020','3111','3158','3006','3047'].includes(id) ? recipe.identity === 'mage' ? '3116' : recipe.identity === 'tank' ? '4401' : '3085' : id)
    proposals.push({id:`champion-${championId}-${entry.key}`,championId,name:recipe.name,identity:recipe.identity,
      classification:fun ? 'Fun / Experimental' : 'Off-meta',status:'reviewed',basis:'editorial',patch:'26.21',
      sequence,essential:[sequence[0]],observedCore:[],starting:[],summary:recipe.purpose,
      personalization:{recipe:entry.recipe,kitNote:plan.mainNote,styleNote:entry.note,source:kit.source},
      strengths:[entry.note,recipe.purpose],
      limitations:[fun ? 'Proposta para diversão, sem eficácia comprovada em partidas.' : 'Proposta editorial individual, sem estatística de desempenho desta sequência.', 'As trocas situacionais preservam o núcleo do estilo; podem sacrificar dano ou proteção.'],
      orderNote:'Estilo e interações escolhidos individualmente para este campeão a partir do kit e dos efeitos dos objetos. Combinações de objetos podem coincidir quando campeões aproveitam as mesmas interações. Não é uma sequência comprovada por taxa de vitória.',
      evidence:[{label:'Kit do campeão · Riot Data Dragon PT-BR',url:kit.source,patch:'26.21',checkedAt:'2026-10-31'},
        {label:'Objetos e efeitos · Riot Data Dragon',url:'https://ddragon.leagueoflegends.com/cdn/16.21.1/data/pt_BR/item.json',patch:'26.21',checkedAt:'2026-10-31'}],
    })
  }
  const options = [...specific,...proposals]
  const principal=options[0], rank={Principal:0,Alternativa:1,'Troll / Fun':2}
  return options.sort((a,b)=>rank[buildCategory(a,principal)]-rank[buildCategory(b,principal)])
}

export function canUseDraft(sequence:string[],build:Build,items:Record<string,Item>):boolean {
  return validSequence(sequence,{...build,essential:[]},items)
}
