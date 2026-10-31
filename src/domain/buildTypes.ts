export const threats = [
  { id: 'tanks', label: 'Muitos tanques', description: 'Vida alta e lutas prolongadas.' },
  { id: 'healing', label: 'Muita cura', description: 'Inimigos recuperam muita vida.' },
  { id: 'physical', label: 'Dano físico', description: 'Armadura pode ajudar; ataques básicos têm respostas específicas.' },
  { id: 'magic', label: 'Dano mágico', description: 'Resistência mágica, escudos ou proteção situacional.' },
  { id: 'burst', label: 'Muito burst', description: 'Dano concentrado em pouco tempo; não informa o tipo de dano.' },
] as const
export type Threat = typeof threats[number]['id']
export type Identity = 'mage' | 'fighter' | 'tank' | 'enchanter' | 'attack'
export type Evidence = { url: string; label: string; patch: string; checkedAt: string }
export type Item = {
  id: string
  name: string
  english: string
  icon: string
  cost: number
  description: string
  descriptionEN: string
  incomplete: boolean
  requiredChampion?: string
  stats: Record<string, number>
  buildsFrom: string[]
  buildsInto: string[]
  groups: string[]
  mayhem: boolean
  purchasable: boolean
  allowedIdentities: Identity[]
  patch: string
  source: Evidence[]
}
export type Build = {
  id: string
  championId: string
  name: string
  identity: Identity
  classification: 'Meta' | 'Off-meta' | 'Fun / Experimental'
  status: 'reviewed' | 'pending' | 'outdated'
  // reviewed = item/mechanical compatibility, not proof of competitive strength.
  basis: 'observed-core' | 'editorial' | 'template'
  patch: string
  sequence: string[]
  essential: string[]
  // Relative order of the observed three-item core, excluding boots.
  observedCore: string[]
  starting: string[]
  summary: string
  strengths: string[]
  limitations: string[]
  evidence: Evidence[]
  orderNote: string
  personalization?: { recipe: string; kitNote: string; styleNote: string; source: string }
}
export type AdaptationRule = {
  id: string
  buildIds: string[]
  threats: Threat[]
  itemId: string
  // One-based purchase position. Moves preserve all other items.
  position: number
  replaceable: string[]
  priority: number
  reason: string
  caveat?: string
  evidence: Evidence[]
}
export type Change = {
  itemId: string
  previousItemId?: string
  previousPosition?: number
  position: number
  action: 'move' | 'replace' | 'keep'
  threats: Threat[]
  reason: string
  caveat?: string
  ruleId: string
}
export type BuildResult = {
  sequence: string[]
  changes: Change[]
  unresolved: Threat[]
  warnings: string[]
}
