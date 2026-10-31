import type { Build } from '../../domain/buildTypes'
import { championKits } from './championKits.ts'

export function explainItem(build:Build, itemId:string):string {
  const context=build.personalization
  if (!context) return build.summary
  const kit=championKits[build.championId as keyof typeof championKits]
  const purpose:Record<string,string>={
    '3100':'O ataque após conjurar é o objetivo desta compra; é preciso atacar pessoalmente para consumir o efeito.',
    '3115':'AP e velocidade de ataque dão contexto aos ataques mágicos ao contato; não transmite automaticamente o efeito a invocações.',
    '3084':'Vida crescente exige acesso aos alvos para os ataques do efeito; não foi escolhido como núcleo universal de campeões à distância.',
    '3065':'Resistência mágica e amplificação de cura e escudos recebidos; não cria uma fonte de cura por conta própria.',
    '3742':'Movimento e armadura ajudam a alcançar alvos e permanecer no combate próximo.',
    '3110':'Armadura e mana apoiam a defesa; seu efeito de ataque lento depende de inimigos ao alcance.',
    '3119':'Mana e vida evoluem ao acumular Lágrima; o escudo da forma evoluída depende dos gatilhos de controle.',
    '3153':'Dano por vida atual depende de ataques e continua sujeito à armadura.',
    '3071':'Dano físico acumula a redução de armadura; não aumenta dano verdadeiro.',
    '6609':'Ferimentos por dano físico oferecem cobertura contra cura sem exigir que o inimigo ataque você.',
    '3033':'Ferimentos, crítico e penetração; substitui outra opção do grupo de penetração em vez de acumular com ela.',
    '3036':'Penetração de armadura mantém a abordagem de disparos críticos; não é anti-cura.',
    '3302':'Ataques acumulam defesa e penetração; exige permanecer atacando e ocupa o grupo de penetração.',
    '3075':'A aplicação de Ferimentos depende de o inimigo atacar você; não reduz cura automaticamente de todo inimigo próximo.',
    '3156':'AD, resistência mágica e escudo contra dano mágico; incompatível com outros objetos Salva-Vidas.',
    '3091':'A velocidade de ataque e o dano ao contato só têm valor ao atacar; a resistência mágica é a parte defensiva.',
    '3190':'Escudo ativo e resistências oferecem proteção a aliados próximos; exige ativação e posicionamento.',
    '4005':'Exige aplicar lentidão ou imobilização e contribuição de aliados para aproveitar o efeito.',
    '3504':'Curas e escudos aplicados a aliados entregam os efeitos de fortalecimento; não é uma compra de crítico próprio.',
    '6616':'Curas e escudos em aliados dão contexto ao fortalecimento de conjuradores.',
    '6617':'Curas e escudos de aliados são o contexto desta compra; não foi escolhido para um campeão sem proteção aliada.',
    '3118':'A ultimate precisa causar dano para aproveitar a zona do objeto; mana sem uso não justifica a compra.',
    '6653':'Dano de habilidades sustenta a queimadura por vida máxima; esta compra não oferece penetração mágica.',
    '3157':'AP e armadura com estase ativa; durante o efeito não é possível continuar atacando ou conjurando.',
    '3003':'Mana e AP apoiam conjuração repetida; é preciso acumular antes de avaliar a forma evoluída.',
    '3004':'Mana e AD apoiam o padrão de conjuração; é preciso acumular para a forma evoluída.',
  }
  const itemContext=purpose[itemId] || (build.essential.includes(itemId) ? 'Esta compra faz parte do núcleo escolhido para manter o estilo.' : 'Compra complementar do estilo; pode ceder espaço a uma resposta situacional.')
  return `${kit.name}: ${context.styleNote} ${itemContext}${kit && kit.resource!=='Mana' ? ' Este kit não usa mana; a sequência original evita compras centradas nesse recurso.' : ''}`
}
