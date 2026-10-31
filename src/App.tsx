import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Crosshair, Filter, Heart, Menu, Search, Shield, SlidersHorizontal, Sparkles, Swords, X } from 'lucide-react'
import allData from './data/champions.json'
import AugmentDialog from './AugmentDialog'
import MayhemCards from './features/cards/MayhemCards'
import type { Champion, Augment, Rarity } from './domain/champions'
const ItemsBuild = lazy(() => import('./features/builds/ItemsBuild'))

const champions = allData as Champion[]
const roles = ['Todos', 'Magos', 'Tiradores (ADC)', 'Lutadores', 'Tanques', 'Assassinos', 'Suportes']
function getQueryChampion(): string { return new URLSearchParams(location.search).get('champion') || '' }
function normalize(s: string): string { return s.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '') }

function RoleIcon({ role, size = 16 }: { role: string; size?: number }) {
  if (role === 'Magos') return <Sparkles size={size} />
  if (role === 'Tiradores (ADC)') return <Crosshair size={size} />
  if (role === 'Lutadores') return <Swords size={size} />
  if (role === 'Tanques') return <Shield size={size} />
  if (role === 'Suportes') return <Heart size={size} />
  return <SlidersHorizontal size={size} />
}

function Portrait({ champion, size = 'normal' }: { champion: Champion; size?: 'normal' | 'large' }) {
  return <img className={`portrait portrait-${size}`} src={champion.portrait} alt={`Retrato de ${champion.name}`} loading="lazy" onError={e => { e.currentTarget.style.opacity = '.25' }} />
}


export default function App() {
  const [section, setSection] = useState<'cards' | 'items'>('cards')
  const [itemsOpened, setItemsOpened] = useState(false)
  const [cardDetail, setCardDetail] = useState<Augment | null>(null)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('Todos')
  const [selected, setSelected] = useState<string>(getQueryChampion)
  const [rarity, setRarity] = useState<Rarity>('Prismática')
  const [variant, setVariant] = useState(0)
  const [mobileNav, setMobileNav] = useState(false)
  const active = champions.find(c => c.slug === selected || c.name === selected)

  useEffect(() => { const callback = () => setSelected(getQueryChampion()); addEventListener('popstate', callback); return () => removeEventListener('popstate', callback) }, [])
  useEffect(() => { setVariant(0); setRarity('Prismática'); setCardDetail(null); setSection('cards'); setItemsOpened(false) }, [selected])
  useEffect(() => {
    const closeMenu = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileNav(false) }
    addEventListener('keydown', closeMenu)
    return () => removeEventListener('keydown', closeMenu)
  }, [])
  const filtered = useMemo(() => champions.filter(c => (role === 'Todos' || c.role === role) && normalize(c.name).includes(normalize(query))).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), [role, query])
  const choose = (c?: Champion) => {
    const path = new URL(location.href)
    if (c) path.searchParams.set('champion', c.slug)
    else path.searchParams.delete('champion')
    history.pushState(null, '', path)
    setSelected(c?.slug || ''); setVariant(0); setRarity('Prismática'); setMobileNav(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <aside id="navigation" className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="logo" onClick={() => choose()} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && choose()}>
        <div className="logo-mark"><Sparkles size={22} /></div>
        <div><strong>ARAM <span>ATLAS</span></strong><small>DESORDEM DATABASE</small></div>
      </div>
      <div className="side-label">NAVEGAÇÃO</div>
      <button className={`side-item ${role === 'Todos' ? 'active' : ''}`} onClick={() => { setRole('Todos'); choose() }}><BookOpen size={17} /> Todos os campeões <span>{champions.length}</span></button>
      <div className="side-label role-label">CLASSES</div>
      {roles.slice(1).map(r => <button key={r} className={`side-item ${role === r ? 'active' : ''}`} onClick={() => { setRole(r); choose() }}><RoleIcon role={r} /> {r} <span>{champions.filter(c => c.role === r).length}</span></button>)}
      <div className="sidebar-bottom"><span className="status-dot" /> DADOS · PATCH 26.21 <small>30 OUT 2026</small></div>
    </aside>
    {mobileNav && <button className="nav-scrim" aria-label="Fechar menu" onClick={() => setMobileNav(false)} />}
    <main className="main" id="main-content" tabIndex={-1}>
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label={mobileNav ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileNav} aria-controls="navigation"><Menu /></button>
        <div className="breadcrumb"><span>ARAM: DESORDEM</span><span className="crumb-slash">/</span><strong>{active ? active.name : role === 'Todos' ? 'Campeões' : role}</strong></div>
        <span className="patch-chip"><span className="status-dot"/> PATCH 26.21</span>
      </header>

      {active ? <section className="detail-page">
        <button className="back-button" onClick={() => choose()}><ArrowLeft size={17} /> Voltar aos campeões</button>
        <div className="champion-hero">
          <div className="hero-glow" />
          <Portrait champion={active} size="large" />
          <div className="champion-headline"><span className="overline">{section === 'cards' ? 'GUIA DE APRIMORAMENTOS' : 'BUILDS · OBJETOS'}</span><h1>{active.name}</h1><div className="tag-row">{active.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div><p>{section === 'cards' ? 'Escolha os melhores aprimoramentos por raridade, considerando o kit do campeão e a sua forma de jogar.' : 'Consulte estilos de build e adapte os objetos às ameaças da partida, sem sair do Atlas.'}</p></div>
        </div>
        <nav className="champion-sections" aria-label="Conteúdo do campeão"><button aria-pressed={section === 'cards'} onClick={() => {setSection('cards');setCardDetail(null)}}><BookOpen size={17}/> Cartas Mayhem</button><button aria-pressed={section === 'items'} onClick={() => {setSection('items');setItemsOpened(true);setCardDetail(null)}}><Swords size={17}/> Objetos <span className="pilot-label">NOVO</span></button></nav>
        <div hidden={section !== 'cards'}><MayhemCards active={active} rarity={rarity} setRarity={setRarity} variant={variant} setVariant={setVariant} onBack={() => choose()} onCard={setCardDetail}/></div>
        {itemsOpened && <div hidden={section !== 'items'}><Suspense fallback={<p className="build-loading" role="status">Carregando objetos…</p>}><ItemsBuild key={active.id} championId={active.id} championName={active.name} visible={section === 'items'}/></Suspense></div>}
      </section> : <section className="catalog-page">
        <div className="hero-section"><div className="hero-spark hero-spark-1"/><div className="hero-spark hero-spark-2"/><div className="eyebrow"><span className="status-dot"/> META ATUALIZADO · PATCH 26.21</div><h1>Domine o <em>caos.</em><br/>Escolha melhor.</h1><p>Seu arsenal definitivo de aprimoramentos para ARAM: Desordem. Descubra o que realmente funciona para cada campeão.</p><div className="hero-stats"><div><strong>{champions.length}</strong><span>CAMPEÕES</span></div><div><strong>3</strong><span>RARIDADES</span></div><div><strong>PT-BR</strong><span>NOMES DO CLIENTE</span></div></div></div>
        <div className="catalog-header"><div><span className="overline">EXPLORE O ATLAS</span><h2>{role === 'Todos' ? 'Todos os campeões' : role}</h2><p role="status" aria-live="polite">{filtered.length} de {champions.length} campeões encontrados</p></div><button className="reset-filters" disabled={!query && role === "Todos"} onClick={() => {setQuery('');setRole('Todos')}}><Filter size={15}/> Limpar filtros</button></div>
        <div className="search-row"><div className="search-box"><Search size={19}/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Busque seu campeão... (ex: Hwei, Lux, Jhin)" aria-label="Buscar campeão"/>{query && <button onClick={() => setQuery('')} aria-label="Limpar busca"><X size={17}/></button>}</div></div>
        <div className="chip-filters">{roles.map(r => <button className={role === r ? 'selected' : ''} key={r} onClick={() => {setRole(r)}}>{r}</button>)}</div>
        {filtered.length ? <div className="champion-grid">{filtered.map(c => <article className="champion-tile" key={c.id}><button className="champion-card" onClick={() => choose(c)}><div className="portrait-frame"><Portrait champion={c}/><span className="role-symbol"><RoleIcon role={c.role} size={14}/></span></div><div className="card-name">{c.name}</div><span className="card-role">{c.role}</span><span className="card-arrow"><ArrowRight size={16}/></span></button></article>)}</div> : <div className="empty-state"><Search size={28}/><strong>Nenhum campeão encontrado</strong><p>Tente outro nome ou limpe os filtros.</p><button onClick={() => {setQuery('');setRole('Todos')}}>Limpar filtros</button></div>}
        <footer>ARAM ATLAS · Projeto independente, não afiliado à Riot Games. <a href="https://arammayhem.com/data/" target="_blank" rel="noreferrer">Dados: arammayhem.com</a> (CC BY 4.0).</footer>
      </section>}
    </main>
    {cardDetail && <AugmentDialog card={cardDetail} rarity={rarity} onClose={() => setCardDetail(null)}/>}
  </div>
}
