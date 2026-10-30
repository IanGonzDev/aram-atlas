import { useEffect, useRef } from 'react'
import { ExternalLink, X } from 'lucide-react'
import effectData from './data/augment-effects.json'

type Card = { name: string; english: string; tier: string; url: string; icon: string }
const effects: Record<string, { pt: string; en: string; incomplete: boolean }> = effectData.effects

export default function AugmentDialog({ card, rarity, onClose }: { card: Card; rarity: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const effect = effects[card.url]

  useEffect(() => {
    const dialog = dialogRef.current!
    const previousOverflow = document.body.style.overflow
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      opener?.focus({ preventScroll: true })
    }
  }, [])

  return <dialog ref={dialogRef} className="augment-dialog" aria-labelledby="effect-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="effect-panel">
      <header className="effect-header">
        {card.icon && <img src={card.icon} alt="" />}
        <div><span className="overline">{rarity} · Tier {card.tier}</span><h2 id="effect-title">{card.name}</h2><p lang="en">{card.english}</p></div>
        <button className="effect-close" onClick={onClose} aria-label="Fechar descrição" autoFocus><X size={22}/></button>
      </header>
      <div className="effect-body">
        <section lang="pt-BR"><h3>PORTUGUÊS</h3><p>{effect?.pt || 'Descrição indisponível para esta carta.'}</p></section>
        <section lang="en"><h3>ENGLISH</h3><p>{effect?.en || 'Description unavailable for this augment.'}</p></section>
        {effect?.incomplete && <small className="effect-missing">Alguns valores não são informados pela fonte. Confira no cliente.<br/><span lang="en">Some values are not provided by the source. Check the game client.</span></small>}
      </div>
      <footer className="effect-footer"><span>OP.GG · Patch {effectData.source.patch} · {effectData.source.retrieved}</span><a href={effectData.source.pt} target="_blank" rel="noreferrer">Fonte <ExternalLink size={13}/></a></footer>
    </div>
  </dialog>
}
