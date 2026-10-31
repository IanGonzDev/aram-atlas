import { useEffect, useRef } from 'react'
import { ExternalLink, X } from 'lucide-react'
import type { Item } from '../../domain/buildTypes'

export default function ItemDialog({ item, context, onClose }: { item: Item; context?: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = overflow; opener?.focus({ preventScroll: true }) }
  }, [])
  return <dialog ref={ref} className="augment-dialog item-dialog" aria-labelledby="item-title" onCancel={e => {e.preventDefault(); onClose()}} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className="effect-panel">
      <header className="effect-header"><img src={item.icon} alt=""/><div><span className="overline">{item.cost.toLocaleString('pt-BR')} OURO · PATCH {item.patch}</span><h2 id="item-title">{item.name}</h2><p lang="en">{item.english}</p></div><button className="effect-close" aria-label="Fechar objeto" onClick={onClose} autoFocus><X size={22}/></button></header>
      {context && <section className="item-champion-context"><h3>Nesta build</h3><p>{context}</p></section>}
      <div className="effect-body"><section lang="pt-BR"><h3>PORTUGUÊS</h3><p>{item.description}</p></section><section lang="en"><h3>ENGLISH</h3><p>{item.descriptionEN}</p></section></div>
      <p className="build-small">Valores que dependem de nível, atributos, acúmulos ou recargas podem não ser resolvidos nos textos estáticos. Confira no cliente.</p>
      <footer className="effect-footer"><span>Riot Data Dragon 16.21.1 · Consulta 31/10/2026</span><a href={item.source[0].url} target="_blank" rel="noreferrer">Fonte <ExternalLink size={13}/></a></footer>
    </div>
  </dialog>
}
