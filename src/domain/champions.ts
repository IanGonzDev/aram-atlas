export type Rarity = 'Prismática' | 'Ouro' | 'Prata'
export type Augment = { name:string; english:string; tier:string; url:string; icon:string }
export type Champion = { name:string; id:string; slug:string; role:string; tags:string[]; portrait:string; augments:Record<Rarity,Augment[]> }
