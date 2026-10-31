import { useMemo, useState } from 'react'
import { ArrowRight, Check, FlaskConical, Info, RotateCcw, Shield, Sparkles } from 'lucide-react'
import itemData from '../../data/builds/items.json'
import { getBuildOptions, canUseDraft, buildCategory } from '../../data/builds/laboratory'
import { personalizedRules } from '../../data/builds/personalizedRules'
import { championKits } from '../../data/builds/championKits'
import { explainItem } from '../../data/builds/itemReasons'
import { threats } from '../../domain/buildTypes'
import type { BuildResult, Item, Threat } from '../../domain/buildTypes'
import { adaptBuild } from '../../domain/smartBuild'
import ItemDialog from './ItemDialog'
import './builds.css'

const items = itemData.items as Record<string, Item>
const label = (id: Threat) => threats.find(t => t.id === id)!.label

export default function ItemsBuild({ championId, championName, visible }: { championId: string; championName: string; visible: boolean }) {
  const options = useMemo(() => getBuildOptions(championId), [championId])
  const [buildId, setBuildId] = useState(options[0]?.id || '')
  const [selected, setSelected] = useState<Threat[]>([])
  const [detail, setDetail] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})
  const build = options.find(option => option.id === buildId)
  const draft = build ? drafts[build.id] : undefined
  const manual = Boolean(draft)
  const kit = championKits[championId as keyof typeof championKits]
  const result = useMemo<BuildResult | null>(() => !build ? null : adaptBuild(draft ? {...build, sequence: draft, essential: [], status: 'reviewed'} : build, selected, items, personalizedRules(draft ? {...build, sequence: draft, essential: []} : build, items)), [build, selected, draft])
  const toggle = (id: Threat) => setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id])
  const chooseStyle = (id: string) => { if (id !== buildId) {setBuildId(id);setSelected([]);setDetail(null)} }
  const stylePicker = <div className="style-options" role="group" aria-label="Estilo de build">{options.map(option => <button key={option.id} data-experimental={option.classification === 'Fun / Experimental' || undefined} aria-pressed={buildId === option.id} onClick={() => chooseStyle(option.id)}><span>{option.name}</span><small>{buildCategory(option, options[0])}</small>{buildId === option.id && <Check size={16}/>}</button>)}</div>

  if (!build || !result) return null

  return <div className="items-build">
    <div className="build-intro"><div><span className="overline"><FlaskConical size={14}/> BUILDS</span><h2>Builds de {championName}</h2><p>Escolha uma abordagem e ajuste os objetos ao que está acontecendo na partida.</p></div><span className="build-patch">PATCH · {build.patch}</span></div>
    {stylePicker}
    <div className="build-summary"><p>{build.summary}</p><span className={`build-badge ${build.classification === 'Fun / Experimental' ? 'build-badge-fun' : build.classification === 'Off-meta' ? 'build-badge-alt' : ''}`}>{buildCategory(build, options[0])}</span></div>
    <p className="build-evidence-note"><Info size={15}/><span>{build.basis === 'template' ? 'Base editorial por perfil de jogo · sem estatísticas de desempenho para este campeão.' : build.basis === 'editorial' ? 'Proposta editorial individual · baseada no kit e nos efeitos dos objetos, sem estatísticas de desempenho.' : 'Núcleo observado · sequência completa e ajustes editoriais. Sem garantia de desempenho.'}</span></p>

    {build.personalization && <section className="champion-build-context" aria-label="Interações desta build com o campeão"><h3>Por que esta build para {championName}?</h3><p>{build.personalization.kitNote}</p>{build.personalization.styleNote !== build.personalization.kitNote && <p>{build.personalization.styleNote}</p>}<span>Núcleo: {build.essential.map(id=>items[id].name).join(' · ') || 'sequência personalizada'}</span></section>}

    {build.classification === 'Fun / Experimental' && <div className="build-limitation lab-experiment" role="note"><FlaskConical size={20}/><div><strong>Fun / Experimental — explore outro jeito de jogar.</strong><p>Sequência para experimentação, sem garantia de desempenho. Avalie os atributos e as limitações deste estilo no campeão.</p></div></div>}
    <section className="smart-panel" aria-labelledby="smart-title"><div className="smart-heading"><div><h3 id="smart-title"><Sparkles size={18}/> Smart Build</h3><p>O que está dificultando a partida? Marque mais de uma opção.</p></div>{selected.length > 0 && <button className="build-reset" onClick={() => setSelected([])}><RotateCcw size={14}/> Limpar</button>}</div>
      <div className="threat-options" role="group" aria-label="Ameaças da partida">{threats.map(threat => <button key={threat.id} title={threat.description} aria-pressed={selected.includes(threat.id)} onClick={() => toggle(threat.id)}>{selected.includes(threat.id) ? <Check size={15}/> : <span className="threat-plus">+</span>}{threat.label}</button>)}</div>
      <p className="build-small">Sugestão de ordem de compra. Não registra seu inventário nem pede para vender itens já comprados.</p>
    </section>

    <section className="sequence-section" aria-labelledby="sequence-title"><div className="sequence-heading"><h3 id="sequence-title">{draft ? 'Sua sequência personalizada' : selected.length ? 'Sua sequência adaptada' : build.classification === 'Fun / Experimental' ? 'Sequência experimental' : 'Ordem de compra sugerida'}</h3><span>6 espaços · {result.sequence.some(id=>items[id].groups.includes('boots')) ? 'inclui botas' : 'sem botas nesta sequência'}</span></div>
      <ol className="item-sequence">{result.sequence.map((id, index) => {
        const item = items[id], originalPosition = build.sequence.indexOf(id), isNew = originalPosition === -1
        const changed = isNew || originalPosition !== index
        return <li key={id} className={changed ? 'item-changed' : ''}><button onClick={() => setDetail(id)} aria-haspopup="dialog" aria-label={`${index + 1}º objeto: ${item.name}, ${item.english}`}><span className="item-position">{index+1}</span><img src={item.icon} alt="" loading="lazy"/><strong>{item.name}</strong><small lang="en">{item.english}</small><span className="item-cost">{item.cost.toLocaleString('pt-BR')} ouro</span>{isNew ? <span className="item-marker">Substituição</span> : changed ? <span className="item-marker">Antes: {originalPosition + 1}º</span> : !manual && build.essential.includes(id) ? <span className="item-essential"><Shield size={11}/> Essencial</span> : <span className="item-marker item-unchanged">Ver efeito</span>}</button></li>
      })}</ol>
      {selected.length > 0 && <div className="adaptation-summary" role="status" aria-live="polite"><strong>{result.changes.length ? `${result.changes.filter(c=>c.action !== 'keep').length} ajuste(s) · estilo ${build.name} preservado` : 'Sequência original mantida'}</strong><span>O estilo escolhido é preservado; consulte os motivos de cada ajuste.</span></div>}
    </section>

    {result.changes.length > 0 && <section className="change-list" aria-label="Motivos das adaptações">{result.changes.map(change => <article key={change.itemId}><div className="change-number">{change.position}º</div><div><h4>{change.action === 'keep' ? 'Manter' : change.action === 'move' ? 'Adiantar' : 'Incluir'} {items[change.itemId].name}</h4>{change.previousItemId && <div className="replacement"><span>{items[change.previousItemId].name}</span><ArrowRight size={13}/><strong>{items[change.itemId].name}</strong></div>}<p>{change.reason}</p>{change.caveat && <p className="change-caveat">{change.caveat}</p>}<div className="answer-tags">{change.threats.map(t=><span key={t}>{label(t)}</span>)}</div></div></article>)}</section>}
    {result.unresolved.length > 0 && <div className="build-limitation"><Info size={18}/><div><strong>Sem ajuste seguro neste conjunto: {result.unresolved.map(label).join(', ')}.</strong><p>Outra adaptação tem prioridade ou não há espaço compatível para esta troca. Revise os objetos e os motivos acima; a ameaça pode continuar presente.</p></div></div>}
    {result.warnings.map(warning => <p key={warning} className="build-limitation">{warning}</p>)}


    <details className="build-details build-editor"><summary>Personalizar os 6 objetos</summary><p className="build-small">Escolha entre os objetos do catálogo revisado para este perfil. Itens duplicados ou grupos incompatíveis ficam desabilitados. Os ajustes situacionais também funcionam sobre sua sequência personalizada.</p><div className="lab-slots">{result.sequence.map((id, index) => <label key={index}><span>{index + 1}º objeto</span><select aria-label={`Objeto ${index + 1}`} value={id} onChange={event => {const next = [...result.sequence];next[index] = event.target.value;if (canUseDraft(next, build, items)) {setDrafts(previous => ({...previous,[build.id]:next}));setSelected([])}}}>{Object.values(items).filter(item => item.allowedIdentities.includes(build.identity) && item.purchasable && item.mayhem && item.patch === build.patch && (!item.requiredChampion || item.requiredChampion === championId)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(item => {const candidate = [...result.sequence];candidate[index]=item.id;return <option key={item.id} value={item.id} disabled={!canUseDraft(candidate, build, items)}>{item.name} — {item.english}</option>})}</select></label>)}</div>{draft && <button className="build-reset" onClick={() => {setDrafts(previous => {const next={...previous};delete next[build.id];return next});setSelected([])}}><RotateCcw size={14}/> Restaurar sequência do estilo</button>}</details>

    {kit && <details className="build-details champion-kit"><summary>Consultar o kit de {championName}</summary><p className="build-small">Descrições oficiais do patch 26.21. Não inferimos coeficientes numéricos ausentes nestes textos.</p>{[{key:'Passiva',...kit.passive},...kit.spells].map(ability=><article key={ability.key}><h4>{ability.key} · {ability.name} <small lang="en">{ability.english}</small></h4><p>{ability.description}</p></article>)}<a href={kit.source} target="_blank" rel="noreferrer">Fonte: Riot Data Dragon · PT-BR</a></details>}

    <details className="build-details"><summary>Entenda a build e consulte as fontes</summary>{draft && <p className="build-small">As fontes abaixo descrevem o estilo original. Os ajustes da sua sequência personalizada seguem os efeitos dos objetos.</p>}<div className="build-details-body"><div><h4>Pontos fortes</h4><ul>{build.strengths.map(s=><li key={s}>{s}</li>)}</ul></div><div><h4>Limitações</h4><ul>{build.limitations.map(s=><li key={s}>{s}</li>)}</ul></div><div className="build-details-full"><h4>{build.basis !== 'observed-core' ? 'Como esta proposta foi montada?' : 'O que foi observado?'}</h4>{build.observedCore.length > 0 && <p>Núcleo: {build.observedCore.map(id=>items[id].name).join(' → ')}.</p>}<p>{build.orderNote}</p><p>“Meta” identifica a referência principal; não é uma classificação calculada de desempenho. Regras situacionais são revisão editorial dos efeitos dos objetos.</p><h4>{build.basis !== 'observed-core' ? 'Componentes iniciais sugeridos' : 'Opção inicial da fonte'}</h4><p>{build.starting.length ? build.starting.map(id=>items[id].name).join(' + ') : 'Sem compra inicial definida para este estilo.'}. Compra inicial não ocupa posições adicionais na sequência final.</p><ul>{build.evidence.map(e=><li key={e.url}><a href={e.url} target="_blank" rel="noreferrer">{e.label}</a> · Patch {e.patch} · dados de {e.checkedAt.split('-').reverse().join('/')}</li>)}<li><a href={items[build.sequence[0]].source[0].url} target="_blank" rel="noreferrer">Objetos: Riot Data Dragon {itemData.dataDragonVersion}</a></li><li><a href="https://arammayhem.com/data/" target="_blank" rel="noreferrer">Data: arammayhem.com · CC BY 4.0</a></li></ul><p>Conferência do catálogo: {itemData.checkedAt.split('-').reverse().join('/')}. Não há atualização automática nem adaptação às cartas escolhidas.</p></div></div></details>

    {visible && detail && <ItemDialog item={items[detail]} context={explainItem(build, detail)} onClose={() => setDetail(null)}/>}
  </div>
}
