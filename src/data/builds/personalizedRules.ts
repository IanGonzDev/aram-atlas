import { validSequence } from '../../domain/smartBuild.ts'
import type { AdaptationRule, Build, Item, Threat } from '../../domain/buildTypes'
import { championPlans } from './championPlans.ts'
import { championKits } from './championKits.ts'

const selfHealing = new Set('Aatrox Ahri Aurora Cassiopeia Fiddlesticks Gragas Swain Sylas Vladimir Briar Darius Fiora Hecarim Illaoi Irelia LeeSin Lillia MasterYi Mordekaiser Nasus Nocturne Olaf RekSai Renekton Trundle Tryndamere Udyr Viego Volibear Warwick MonkeyKing XinZhao Yorick Zaahen Alistar Chogath DrMundo Maokai Nunu TahmKench Zac Ekko Elise Evelynn Rengar Nidalee Locke Morgana'.split(' '))
const physicalPlan = new Set('Aatrox Ambessa Akshan Aphelios Caitlyn Corki Draven Graves Jhin Jinx Kalista Lucian MissFortune Quinn Samira Sivir Smolder Tristana Xayah Zeri Belveth Briar Camille Darius Fiora Gangplank Garen Gnar Hecarim Illaoi Irelia JarvanIV Jayce Kayn Kled LeeSin MasterYi Nasus Nilah Nocturne Olaf Pantheon RekSai Renekton Riven Sett Trundle Tryndamere Urgot Vi Viego MonkeyKing XinZhao Yasuo Yone Yorick Zaahen KSante Poppy Sion Skarner Khazix Naafiri Qiyana Rengar Talon Zed Pyke Senna'.split(' '))
const apUsesPhysicalDamage = new Set('Aatrox Ambessa Aphelios Draven Darius Garen Kled Olaf Riven Sett Yone KSante Urgot Ornn DrMundo Zed Talon Naafiri Khazix Pyke Vayne'.split(' '))
const taunt = new Set(['Rammus','Galio','Shen'])
export const nativeAntiHeal: Record<string,string> = {
  Katarina:'A ultimate já aplica Ferimentos durante seus acertos; o objeto só acrescenta cobertura fora dessa janela.',
  Varus:'E já reduz a cura na área; um objeto pode acrescentar cobertura quando o alvo sai dela.',
  Singed:'A ultimate permite aplicar Ferimentos pelo veneno durante sua janela; avalie antes de duplicar o efeito.',
}

type Answer = { threats: Threat[]; itemId:string; priority:number; reason:string; caveat:string }
/** Item answers chosen from the individual champion plan, range, resource and style. No role fallback. */
export function personalizedRules(build:Build, items:Record<string,Item>):AdaptationRule[] {
  const plan=championPlans[build.championId], kit=championKits[build.championId as keyof typeof championKits]
  if (!plan || !kit || !build.personalization) return []
  const recipe=build.personalization.recipe
  const rapid=['hit','meleeHit','apHit'].includes(recipe)
  const ranged=kit.range >= 400 && !['Elise','Nidalee','Jayce'].includes(build.championId)
  const physical=build.identity === 'mage' ? apUsesPhysicalDamage.has(build.championId) : physicalPlan.has(build.championId)
  const healing=selfHealing.has(build.championId)
  let antiHeal:string, antiTank:string, magic:string, physicalDefense:string, burst:string
  if (build.identity==='mage') {
    antiHeal=physical ? '6609' : '3165'
    antiTank=physical ? '3071' : '6653'
    magic='3102'; physicalDefense='3157'; burst='3157'
  } else if (build.identity==='fighter' || build.identity==='attack') {
    antiHeal=rapid || build.identity==='fighter' || recipe==='spellAD' ? '6609' : '3033'
    antiTank=rapid ? '3153' : recipe==='spellAD' || recipe==='assassin' ? '6694' : build.identity==='attack' ? '3036' : '3071'
    magic=rapid ? '3091' : healing && build.identity==='fighter' ? '3065' : '3156'
    physicalDefense=build.sequence.includes('3742') ? '3742' : '6333'
    burst=build.identity==='attack' && ranged ? '6673' : '3053'
  } else if (build.identity==='tank') {
    antiHeal=taunt.has(build.championId) ? '3075' : physical ? '6609' : '3165'
    antiTank=physical ? '3071' : '6653'
    magic=healing ? '3065' : '4401'
    physicalDefense=build.sequence.includes('3110') ? '3110' : '3143'
    burst='3190'
  } else {
    antiHeal='3165';antiTank='6653';magic='3190';physicalDefense='3190';burst='3190'
  }
  const context = build.personalization.styleNote
  const answers:Answer[]=[
    {threats:['healing'],itemId:antiHeal,priority:100,
      reason: antiHeal==='3075' ? `${kit.name}: a provocação força ataques e dá contexto a Espinhos para aplicar Ferimentos.` : `${kit.name}: ${antiHeal==='3165' ? 'dano mágico do kit aplica' : 'dano físico aplica'} Ferimentos. ${physical && build.identity==='mage' ? 'Mesmo nesta experiência AP, a compra pontual responde ao dano físico que o campeão realmente mantém.' : context}`,
      caveat:(nativeAntiHeal[build.championId] || 'Aplique o efeito no inimigo que recebe cura; Ferimentos não acumulam entre objetos.')+(antiHeal==='3075' ? ' Fora da provocação, o alvo precisa atacar você para receber o efeito.' : '')},
    {threats:['tanks'],itemId:antiTank,priority:90,
      reason: antiTank==='3153' ? `Ataques frequentes desta variante de ${kit.name} dão contexto ao dano por vida atual.` : antiTank==='6653' ? `Dano de habilidades de ${kit.name} pode manter a queimadura por vida máxima, sem substituir o núcleo escolhido.` : antiTank==='3071' ? `O dano físico de ${kit.name} pode acumular redução de armadura. ${physical && build.identity==='mage' ? 'É uma resposta física pontual dentro da experiência AP, não uma mudança automática para AD.' : context}` : `Penetração percentual favorece o dano físico desta variante de ${kit.name} contra armadura.`,
      caveat:antiTank==='3153' ? 'Exige ataques e continua sujeito à armadura; não é dano verdadeiro.' : antiTank==='6653' ? 'Troca parte da compra original por dano prolongado; não é penetração mágica.' : 'Armadura e vida são ameaças diferentes. Penetração ou redução de armadura não aumentam dano verdadeiro.'},
    {threats:['burst'],itemId:burst,priority:80,
      reason:burst==='3157' ? `Estase dá a ${kit.name} uma resposta ativa à janela de dano, mantendo o núcleo do estilo.` : burst==='3190' ? `O escudo ativo oferece uma janela de proteção a ${kit.name} e aliados próximos.` : `O escudo Salva-Vidas acrescenta uma janela de sobrevivência à variante de ${ranged ? 'disparos' : 'combate próximo'} de ${kit.name}.`,
      caveat:burst==='3157' ? 'É preciso ativar; durante estase não é possível atacar ou conjurar.' : burst==='3190' ? 'Escudo temporário que exige ativação e alcance dos aliados.' : 'Não combine objetos Salva-Vidas; pode ser preciso sacrificar dano ou outra defesa.'},
    {threats:['physical'],itemId:physicalDefense,priority:70,
      reason:`Armadura de ${items[physicalDefense].name} ajuda ${kit.name} contra dano físico. ${context}`,
      caveat:physicalDefense==='3157' ? 'A estase exige ativação; armadura não reduz dano verdadeiro.' : physicalDefense==='3143' ? 'Parte do valor de Randuin é específica contra ataques críticos.' : physicalDefense==='3190' ? 'Proteção limitada e escudo ativo; não garante sobreviver a qualquer combo.' : 'Armadura não reduz dano mágico nem verdadeiro.'},
    {threats:['magic'],itemId:magic,priority:60,
      reason:magic==='3065' ? `A recuperação própria de ${kit.name} dá contexto a Semblante, além da resistência mágica.` : magic==='3091' ? `Esta variante de ${kit.name} usa ataques frequentes: Limite da Razão mantém esse padrão e acrescenta resistência mágica.` : `Resistência mágica de ${items[magic].name} protege ${kit.name} sem exigir transformar o estilo em outro.`,
      caveat:magic==='3156' ? 'O escudo protege dano mágico e compartilha o grupo Salva-Vidas; não é resposta universal a burst físico.' : magic==='3102' ? 'O escudo de feitiço pode ser removido antes do combo inimigo.' : magic==='3091' ? 'O efeito ao contato exige ataques; não foi escolhido apenas pela classe do campeão.' : 'Resistência mágica não reduz dano físico ou verdadeiro.'},
  ]
  if (antiHeal==='3033') answers.push({threats:['tanks'],itemId:'3033',priority:85,reason:'Lembrete Mortal já acrescenta penetração de armadura junto à resposta contra cura, sem duplicar o grupo de penetração.',caveat:'Não compre Lorde Dominik junto; penetração de armadura não é dano por vida máxima.'})
  return answers.flatMap(answer=>{
    const item=items[answer.itemId]
    if (!item || !item.allowedIdentities.includes(build.identity)) return []
    const existing=build.sequence.indexOf(answer.itemId)
    // Prefer flexible purchases, keeping the individual core and boots. Group conflicts are checked per candidate.
    const flexible=build.sequence.filter(id=>!build.essential.includes(id)&&!items[id]?.groups.includes('boots')).reverse()
    if (answer.threats.includes('healing')) flexible.sort((a,b)=>Number(['3033','3165','6609','3075'].includes(b))-Number(['3033','3165','6609','3075'].includes(a)))
    const replacements=existing>=0 ? [answer.itemId] : flexible.filter(id=>validSequence(build.sequence.map(value=>value===id ? answer.itemId : value),build,items))
    return replacements.map((replacement,index)=>({id:`champion-rule-${build.id}-${answer.itemId}-${answer.threats.join('-')}-${replacement}`,
      buildIds:[build.id],threats:answer.threats,itemId:answer.itemId,position:build.sequence.indexOf(replacement)+1,
      replaceable:existing>=0 ? [] : [replacement],priority:answer.priority-index/100,reason:answer.reason,caveat:answer.caveat,
      evidence:[...item.source,{label:'Kit individual · Riot Data Dragon',url:kit.source,patch:build.patch,checkedAt:'2026-10-31'}],
    }))
  })
}
