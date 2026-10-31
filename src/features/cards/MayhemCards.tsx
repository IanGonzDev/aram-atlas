import { ArrowLeft, ExternalLink, Info, SlidersHorizontal, Sparkles } from 'lucide-react'
import type { Champion, Augment, Rarity } from '../../domain/champions'
const rarityColors: Record<Rarity,string> = { Prismática: 'violet', Ouro: 'gold', Prata: 'silver' }
const variants: Record<string, { name: string; description: string; tip: string }[]> = {
  'Tahm Kench': [{ name: 'AP / Burst', description: 'Prioriza Q e R para causar dano.', tip: 'As recomendações da fonte misturam tanque e AP. Avalie dano mágico e aceleração de habilidade antes de seguir o tier geral.' }],
  Volibear: [{ name: 'AP / E', description: 'Foco no dano da Tempestade Celeste (E).', tip: 'Evite escolher automaticamente cartas de ataques básicos. Prefira opções que beneficiem E, AP ou sua frequência de uso; verifique elegibilidade.' }],
  'Miss Fortune': [{ name: 'Ultimate', description: 'Foco no dano da Barragem de Chumbo (R).', tip: 'Priorização de crítico de habilidade e amplificação da ultimate em vez de velocidade de ataque pura.' }, { name: 'Crítico / AA', description: 'Foco nos ataques básicos.', tip: 'Neste estilo, escalamento de AD, crítico e efeitos de ataque passam a ter prioridade.' }],
  Jhin: [{ name: 'Tiros / Burst', description: 'Dano alto por disparo.', tip: 'O ataque de Jhin não escala como o de um ADC tradicional. Considere conversão de atributos e dano por disparo.' }],
}
function TierPill({tier}:{tier:string}) { return <span className={`tier tier-${tier.replace('+','plus').replace('-','minus')}`}>{tier}</span> }
export default function MayhemCards({active,rarity,setRarity,variant,setVariant,onBack,onCard}:{active:Champion;rarity:Rarity;setRarity:(r:Rarity)=>void;variant:number;setVariant:(n:number)=>void;onBack:()=>void;onCard:(a:Augment)=>void}) {
const currentVariant=variants[active.name]?.[variant]
const activeAugments=active.augments[rarity] || []
return <>
        {currentVariant && <div className="variant-box"><div className="variant-heading"><SlidersHorizontal size={18}/><strong>ESTILO DE JOGO</strong><span>Orientação editorial</span></div><div className="variant-options">{variants[active.name].map((v, i) => <button key={v.name} className={variant === i ? 'picked' : ''} onClick={() => setVariant(i)}>{v.name}</button>)}</div><p>{currentVariant.description}</p><div className="variant-tip"><Info size={16}/>{currentVariant.tip}</div></div>}
        <div className="section-title"><div><span className="overline">SUA BUILD COMEÇA AQUI</span><h2>Melhores aprimoramentos</h2></div></div>
        <div className="rarity-tabs" role="tablist" aria-label="Raridade">{(['Prismática', 'Ouro', 'Prata'] as Rarity[]).map(r => <button role="tab" aria-selected={rarity === r} onClick={() => setRarity(r)} className={`rarity-tab ${rarity === r ? 'chosen' : ''} rarity-${rarityColors[r]}`} key={r}><span className="rarity-gem">◆</span>{r}<span className="tab-count">{active.augments[r].length}</span></button>)}</div>
        <div className="augment-grid">{activeAugments.map((a, i) => <button type="button" className="augment-card" onClick={() => onCard(a)} aria-haspopup="dialog" key={`${rarity}-${a.english}`}><div className={`augment-icon ${rarityColors[rarity]}`}>{a.icon ? <img src={a.icon} alt="" loading="lazy"/> : <Sparkles size={25}/>}</div><div className="augment-info"><div className="augment-rank">#{i+1} · {rarity.toUpperCase()}</div><strong>{a.name}</strong><small lang="en">{a.english}</small></div><TierPill tier={a.tier}/><Info size={17} className="external-icon"/></button>)}</div>
        {activeAugments.length === 0 && <div className="empty-state">Nenhuma recomendação desta raridade nos dados atuais.</div>}
        <div className="source-note"><Info size={18}/><div><strong>Como ler esta lista</strong><p>Os tiers são classificações específicas para {active.name}, obtidas de dados agregados do ARAM Mayhem. A ordem combina a classificação por raridade e o tier. Builds alternativas podem exigir escolhas diferentes. Toque numa carta para ver seus efeitos em português e inglês sem sair do Atlas.</p></div></div>
        <div className="detail-bottom"><button className="back-button" onClick={() => onBack()}><ArrowLeft size={16}/> Todos os campeões</button><a href={`https://arammayhem.com/build/${active.slug}/`} target="_blank" rel="noreferrer">Ver dados originais <ExternalLink size={15}/></a></div>
</>
}
