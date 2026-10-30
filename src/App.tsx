import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Crosshair, ExternalLink, Filter, Heart, Info, Menu, Search, Shield, SlidersHorizontal, Sparkles, Swords, X } from 'lucide-react'
import allData from './data/champions.json'
import AugmentDialog from './AugmentDialog'

type Rarity = 'Prismática' | 'Ouro' | 'Prata'
type Augment = { name: string; english: string; tier: string; url: string; icon: string }
type Champion = { name: string; id: string; slug: string; role: string; tags: string[]; portrait: string; augments: Record<Rarity, Augment[]> }
const champions = allData as Champion[]
const roles = ['Todos', 'Magos', 'Tiradores (ADC)', 'Lutadores', 'Tanques', 'Assassinos', 'Suportes']
const rarityColors: Record<Rarity, string> = { Prismática: 'violet', Ouro: 'gold', Prata: 'silver' }
const favoriteDefaults = ['Hwei', 'Tahm Kench', 'Shen', 'Volibear', 'Irelia', 'Ahri', 'Kalista', 'Master Yi', 'Zilean', 'Miss Fortune', 'Lux', 'Jhin', 'Vayne', 'Xerath', 'Poppy', 'Taliyah', 'Kindred']
const variants: Record<string, { name: string; description: string; tip: string }[]> = {
  'Tahm Kench': [{ name: 'AP / Burst', description: 'Prioriza Q e R para causar dano.', tip: 'As recomendações da fonte misturam tanque e AP. Avalie dano mágico e aceleração de habilidade antes de seguir o tier geral.' }],
  Volibear: [{ name: 'AP / E', description: 'Foco no dano da Tempestade Celeste (E).', tip: 'Evite escolher automaticamente cartas de ataques básicos. Prefira opções que beneficiem E, AP ou sua frequência de uso; verifique elegibilidade.' }],
  'Miss Fortune': [{ name: 'Ultimate', description: 'Foco no dano da Barragem de Chumbo (R).', tip: 'Priorização de crítico de habilidade e amplificação da ultimate em vez de velocidade de ataque pura.' }, { name: 'Crítico / AA', description: 'Foco nos ataques básicos.', tip: 'Neste estilo, escalamento de AD, crítico e efeitos de ataque passam a ter prioridade.' }],
  Jhin: [{ name: 'Tiros / Burst', description: 'Dano alto por disparo.', tip: 'O ataque de Jhin não escala como o de um ADC tradicional. Considere conversão de atributos e dano por disparo.' }],
}
function readFavorites(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('aram-favorites') || JSON.stringify(favoriteDefaults))
    return Array.isArray(saved) ? [...new Set(saved.filter((name): name is string => typeof name === 'string' && champions.some(c => c.name === name)))] : [...favoriteDefaults]
  } catch { return [...favoriteDefaults] }
}
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

function TierPill({ tier }: { tier: string }) { return <span className={`tier tier-${tier.replace('+', 'plus').replace('-', 'minus')}`}>{tier}</span> }

export default function App() {
  const [cardDetail, setCardDetail] = useState<Augment | null>(null)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('Todos')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(readFavorites)
  const [selected, setSelected] = useState<string>(getQueryChampion)
  const [rarity, setRarity] = useState<Rarity>('Prismática')
  const [variant, setVariant] = useState(0)
  const [mobileNav, setMobileNav] = useState(false)
  const [sort, setSort] = useState<'name' | 'favorites'>('favorites')
  const active = champions.find(c => c.slug === selected || c.name === selected)

  useEffect(() => { const callback = () => setSelected(getQueryChampion()); addEventListener('popstate', callback); return () => removeEventListener('popstate', callback) }, [])
  useEffect(() => { try { localStorage.setItem('aram-favorites', JSON.stringify(favorites)) } catch { /* Favorites remain usable when storage is unavailable. */ } }, [favorites])
  useEffect(() => { setVariant(0); setRarity('Prismática'); setCardDetail(null) }, [selected])
  useEffect(() => {
    const closeMenu = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileNav(false) }
    addEventListener('keydown', closeMenu)
    return () => removeEventListener('keydown', closeMenu)
  }, [])
  const filtered = useMemo(() => champions.filter(c => (role === 'Todos' || c.role === role) && (!favoritesOnly || favorites.includes(c.name)) && normalize(c.name).includes(normalize(query))).sort((a, b) => sort === 'favorites' ? Number(favorites.includes(b.name)) - Number(favorites.includes(a.name)) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)), [role, query, favoritesOnly, favorites, sort])
  const toggleFavorite = (name: string) => setFavorites(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name])
  const choose = (c?: Champion) => {
    const path = new URL(location.href)
    if (c) path.searchParams.set('champion', c.slug)
    else path.searchParams.delete('champion')
    history.pushState(null, '', path)
    setSelected(c?.slug || ''); setVariant(0); setRarity('Prismática'); setMobileNav(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const currentVariant = active && variants[active.name]?.[variant]
  const activeAugments = active?.augments[rarity] || []

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <aside id="navigation" className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="logo" onClick={() => choose()} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && choose()}>
        <div className="logo-mark"><Sparkles size={22} /></div>
        <div><strong>ARAM <span>ATLAS</span></strong><small>DESORDEM DATABASE</small></div>
      </div>
      <div className="side-label">NAVEGAÇÃO</div>
      <button className={`side-item ${role === 'Todos' && !favoritesOnly ? 'active' : ''}`} onClick={() => { setRole('Todos'); setFavoritesOnly(false); choose() }}><BookOpen size={17} /> Todos os campeões <span>{champions.length}</span></button>
      <button className={`side-item ${favoritesOnly ? 'active' : ''}`} onClick={() => { setFavoritesOnly(true); setRole('Todos'); choose() }}><Heart size={17} /> Meus favoritos <span>{favorites.length}</span></button>
      <div className="side-label role-label">CLASSES</div>
      {roles.slice(1).map(r => <button key={r} className={`side-item ${role === r && !favoritesOnly ? 'active' : ''}`} onClick={() => { setRole(r); setFavoritesOnly(false); choose() }}><RoleIcon role={r} /> {r} <span>{champions.filter(c => c.role === r).length}</span></button>)}
      <div className="sidebar-bottom"><span className="status-dot" /> DADOS · PATCH 26.21 <small>30 OUT 2026</small></div>
    </aside>
    {mobileNav && <button className="nav-scrim" aria-label="Fechar menu" onClick={() => setMobileNav(false)} />}
    <main className="main" id="main-content" tabIndex={-1}>
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label={mobileNav ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileNav} aria-controls="navigation"><Menu /></button>
        <div className="breadcrumb"><span>ARAM: DESORDEM</span><span className="crumb-slash">/</span><strong>{active ? active.name : role === 'Todos' ? favoritesOnly ? 'Favoritos' : 'Campeões' : role}</strong></div>
        <span className="patch-chip"><span className="status-dot"/> PATCH 26.21</span>
      </header>

      {active ? <section className="detail-page">
        <button className="back-button" onClick={() => choose()}><ArrowLeft size={17} /> Voltar aos campeões</button>
        <div className="champion-hero">
          <div className="hero-glow" />
          <Portrait champion={active} size="large" />
          <div className="champion-headline"><span className="overline">GUIA DE APRIMORAMENTOS</span><h1>{active.name}</h1><div className="tag-row">{active.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div><p>Escolha os melhores aprimoramentos por raridade, considerando o kit do campeão e a sua forma de jogar.</p></div>
          <button className={`favorite-btn ${favorites.includes(active.name) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(active.name)} aria-label={`Favoritar ${active.name}`} aria-pressed={favorites.includes(active.name)}><Heart size={20} fill={favorites.includes(active.name) ? 'currentColor' : 'none'}/></button>
        </div>
        {currentVariant && <div className="variant-box"><div className="variant-heading"><SlidersHorizontal size={18}/><strong>ESTILO DE JOGO</strong><span>Orientação editorial</span></div><div className="variant-options">{variants[active.name].map((v, i) => <button key={v.name} className={variant === i ? 'picked' : ''} onClick={() => setVariant(i)}>{v.name}</button>)}</div><p>{currentVariant.description}</p><div className="variant-tip"><Info size={16}/>{currentVariant.tip}</div></div>}
        <div className="section-title"><div><span className="overline">SUA BUILD COMEÇA AQUI</span><h2>Melhores aprimoramentos</h2></div></div>
        <div className="rarity-tabs" role="tablist" aria-label="Raridade">{(['Prismática', 'Ouro', 'Prata'] as Rarity[]).map(r => <button role="tab" aria-selected={rarity === r} onClick={() => setRarity(r)} className={`rarity-tab ${rarity === r ? 'chosen' : ''} rarity-${rarityColors[r]}`} key={r}><span className="rarity-gem">◆</span>{r}<span className="tab-count">{active.augments[r].length}</span></button>)}</div>
        <div className="augment-grid">{activeAugments.map((a, i) => <button type="button" className="augment-card" onClick={() => setCardDetail(a)} aria-haspopup="dialog" key={`${rarity}-${a.english}`}><div className={`augment-icon ${rarityColors[rarity]}`}>{a.icon ? <img src={a.icon} alt="" loading="lazy"/> : <Sparkles size={25}/>}</div><div className="augment-info"><div className="augment-rank">#{i+1} · {rarity.toUpperCase()}</div><strong>{a.name}</strong><small lang="en">{a.english}</small></div><TierPill tier={a.tier}/><Info size={17} className="external-icon"/></button>)}</div>
        {activeAugments.length === 0 && <div className="empty-state">Nenhuma recomendação desta raridade nos dados atuais.</div>}
        <div className="source-note"><Info size={18}/><div><strong>Como ler esta lista</strong><p>Os tiers são classificações específicas para {active.name}, obtidas de dados agregados do ARAM Mayhem. A ordem combina a classificação por raridade e o tier. Builds alternativas podem exigir escolhas diferentes. Toque numa carta para ver seus efeitos em português e inglês sem sair do Atlas.</p></div></div>
        <div className="detail-bottom"><button className="back-button" onClick={() => choose()}><ArrowLeft size={16}/> Todos os campeões</button><a href={`https://arammayhem.com/build/${active.slug}/`} target="_blank" rel="noreferrer">Ver dados originais <ExternalLink size={15}/></a></div>
      </section> : <section className="catalog-page">
        <div className="hero-section"><div className="hero-spark hero-spark-1"/><div className="hero-spark hero-spark-2"/><div className="eyebrow"><span className="status-dot"/> META ATUALIZADO · PATCH 26.21</div><h1>Domine o <em>caos.</em><br/>Escolha melhor.</h1><p>Seu arsenal definitivo de aprimoramentos para ARAM: Desordem. Descubra o que realmente funciona para cada campeão.</p><div className="hero-stats"><div><strong>{champions.length}</strong><span>CAMPEÕES</span></div><div><strong>3</strong><span>RARIDADES</span></div><div><strong>PT-BR</strong><span>NOMES DO CLIENTE</span></div></div></div>
        <div className="catalog-header"><div><span className="overline">EXPLORE O ATLAS</span><h2>{favoritesOnly ? 'Meus favoritos' : role === 'Todos' ? 'Todos os campeões' : role}</h2><p role="status" aria-live="polite">{filtered.length} de {champions.length} campeões encontrados</p></div><button className="reset-filters" disabled={!query && role === "Todos" && !favoritesOnly} onClick={() => {setQuery('');setRole('Todos');setFavoritesOnly(false)}}><Filter size={15}/> Limpar filtros</button></div>
        <div className="search-row"><div className="search-box"><Search size={19}/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Busque seu campeão... (ex: Hwei, Lux, Jhin)" aria-label="Buscar campeão"/>{query && <button onClick={() => setQuery('')} aria-label="Limpar busca"><X size={17}/></button>}</div><select aria-label="Ordenação" value={sort} onChange={e => setSort(e.target.value as 'name'|'favorites')}><option value="favorites">Favoritos primeiro</option><option value="name">A–Z</option></select></div>
        <div className="chip-filters">{roles.map(r => <button className={role === r && !favoritesOnly ? 'selected' : ''} key={r} onClick={() => {setRole(r);setFavoritesOnly(false)}}>{r}</button>)}</div>
        {filtered.length ? <div className="champion-grid">{filtered.map(c => <article className="champion-tile" key={c.id}><button className="champion-card" onClick={() => choose(c)}><div className="portrait-frame"><Portrait champion={c}/><span className="role-symbol"><RoleIcon role={c.role} size={14}/></span></div><div className="card-name">{c.name}</div><span className="card-role">{c.role}</span><span className="card-arrow"><ArrowRight size={16}/></span></button><button className={`quick-favorite ${favorites.includes(c.name) ? 'is-favorite' : ''}`} aria-label={`Favoritar ${c.name}`} aria-pressed={favorites.includes(c.name)} onClick={() => toggleFavorite(c.name)}><Heart size={16} fill={favorites.includes(c.name) ? 'currentColor' : 'none'}/></button></article>)}</div> : <div className="empty-state"><Search size={28}/><strong>Nenhum campeão encontrado</strong><p>Tente outro nome ou limpe os filtros.</p><button onClick={() => {setQuery('');setRole('Todos');setFavoritesOnly(false)}}>Limpar filtros</button></div>}
        <footer>ARAM ATLAS · Projeto independente, não afiliado à Riot Games. <a href="https://arammayhem.com/data/" target="_blank" rel="noreferrer">Dados: arammayhem.com</a> (CC BY 4.0).</footer>
      </section>}
    </main>
    {cardDetail && <AugmentDialog card={cardDetail} rarity={rarity} onClose={() => setCardDetail(null)}/>}
  </div>
}
