# ARAM Atlas

Guia de aprimoramentos para **ARAM: Desordem**, com 173 campeões e nomes em PT-BR e inglês.

## Recursos

- Busca e filtros por classe, com campeões em ordem alfabética.
- Escolha direta dos campeões, com busca e filtros por classe.
- 2.300 recomendações separadas em Prismática, Ouro e Prata.
- Efeitos de 102 cartas em português e inglês, em painel interno adaptado ao celular.
- Builds individuais, alternativas e Troll / Fun para os 173 campeões, com ajustes situacionais.

## Executar

Requer Node.js 22.18 ou posterior (testes usam remoção nativa de tipos TypeScript).

```bash
npm ci
npm run dev
```

## Validar e compilar

```bash
npm run check
npm run build
npm run preview
```

O build estático fica em dist/. A configuração Vite usa base relativa para suportar o caminho do GitHub Pages.

## GitHub Pages

O conteúdo desta pasta deve ser a raiz do repositório. Em Settings → Pages, selecione GitHub Actions como origem. O workflow .github/workflows/deploy.yml compila e publica a cada envio para main. Pull requests executam validação de TypeScript e build, sem publicar.

## Dados e fontes

Dados fornecidos com o projeto: patch **26.21**, referência **30/10/2026**. Não há atualização automática.

- [ARAM Mayhem](https://arammayhem.com/data/): recomendações e tiers. Atribuição: Data: arammayhem.com — CC BY 4.0.
- [OP.GG PT-BR](https://op.gg/pt/lol/modes/aram-mayhem) e [OP.GG EN](https://op.gg/en/lol/modes/aram-mayhem): efeitos das cartas, consultados em 30/10/2026.
- [Riot Data Dragon](https://developer.riotgames.com/docs/lol): retratos e papéis.

src/data/champions.json conserva a base original. src/data/augment-effects.json contém textos dos efeitos e a procedência. Valores ausentes na fonte estão sinalizados; os textos são exibidos como texto simples. Os efeitos estão incluídos no build, enquanto retratos, ícones e fontes tipográficas dependem de serviços externos.

scripts/generate_data.py é o gerador original: depende do manual Markdown e de snapshots externos não incluídos. Não é necessário executá-lo para desenvolver ou publicar.

## Limitações

Recomendações agregadas não distinguem automaticamente builds AP, AD e tanque. As variantes são orientações editoriais, não listas independentes calculadas. Confira a elegibilidade e os valores das cartas no cliente do jogo.

O site não exige login. Favoritos estão desativados nesta versão; a escolha do campeão é direta, em ordem alfabética, com busca e filtros por classe.

Projeto independente, não afiliado à Riot Games. League of Legends e seus elementos pertencem aos respectivos titulares.

## Builds individuais — revisão local

Os 173 campeões têm decisões editoriais explícitas para a principal, AP, AD e defesa/tanque: 589 opções após remover repetições e preservar as sequências específicas anteriores. Não existe mais fallback pela classe do campeão.

- Cada registro escolhe as combinações de objetos e explica o aproveitamento do kit e os sacrifícios de cada estilo.
- Combinações podem coincidir quando o kit aproveita as mesmas interações; personalização não significa forçar seis objetos únicos em cada campeão.
- Há prioridades adicionais para casos como Darius, Aatrox, Jhin, Gangplank, Fiora, Illaoi, Malphite, Rammus, Ornn, Shen e Pyke.
- O painel “Por que esta build?” apresenta as interações individuais. O diálogo de cada objeto também explica seu contexto na build.
- A ficha permite consultar passiva e Q/W/E/R oficiais, com nomes PT-BR e inglês.
- As respostas a cura, tanques, dano físico, mágico e burst consideram o estilo, dano físico ou mágico disponível, frequência de ataques, recuperação própria, recurso e alcance. Exemplo: Jhin não recebe Limite da Razão por ser AD; Darius AP recebe uma resposta física pontual quando é o dano físico do kit que pode aplicá-la.
- Trocas preservam o núcleo escolhido. Quando não há espaço compatível, a interface informa a ameaça sem ajuste seguro.
- O editor mantém seis espaços e bloqueia duplicidades e grupos incompatíveis. Os ajustes também funcionam sobre a sequência personalizada.
- Edições ficam em memória na ficha, inclusive ao alternar entre cartas e objetos, mas não persistem após recarregar.

### Procedência e limites

Os kits dos 173 campeões foram importados do Riot Data Dragon 16.21.1 PT-BR e EN. O catálogo tem 112 objetos/componentes, cruzados por ID com ARAM Mayhem, release website:20261031_115543:923b34276709. Consulta: 31/10/2026, patch 26.21.

As propostas individuais são decisões editoriais baseadas nas descrições do kit e dos objetos. Não são resultado de simulação de dano, nem 589 sequências validadas por partidas ou taxa de vitória. Não inferimos coeficientes numéricos ausentes nos textos estáticos. Troll / Fun identifica experiências com perdas explícitas de sinergia e desempenho possível.

Os sete núcleos observados anteriores continuam com suas fontes e ordem relativa preservados. Continuação de seis compras, variantes adicionais e adaptações são editoriais. Principal é a referência inicial do site, não uma afirmação de maior taxa de vitória.

Não há leitura de inventário, composição inimiga, cartas escolhidas, API de partida ou IA durante o jogo. Todos os dados de consulta acompanham a aplicação; imagens usam fontes externas. Publicação pelo workflow de GitHub Pages no repositório IanGonzDev/aram-atlas.

### Estrutura

| Caminho | Conteúdo |
|---|---|
| src/data/builds/championPlans.ts e arquivos *Plans.ts | Escolhas e notas individuais dos 173 campeões |
| src/data/builds/recipes.ts | Combinações de objetos reutilizáveis, com finalidade explícita |
| src/data/builds/sequenceOverrides.ts | Prioridades de compra adicionais por campeão |
| src/data/builds/championKits.ts | Kits oficiais do mesmo patch, em PT-BR e inglês |
| src/data/builds/laboratory.ts | Opções individuais, categorias e validação do editor |
| src/data/builds/personalizedRules.ts | Respostas situacionais por campeão e estilo |
| src/data/builds/itemReasons.ts | Contexto dos objetos na build |
| src/data/builds/catalog.ts | Sequências específicas anteriores e fontes |
| src/data/builds/items.json | Objetos, efeitos e procedência |
| src/domain/smartBuild.ts | Motor puro com prioridades e incompatibilidades |
| src/features/builds/ItemsBuild.tsx | Estilos, contexto do kit, ameaças e editor |

As cartas originais permanecem na primeira área; objetos e kits são carregados ao abrir Objetos.

### Verificação e reprodução

Execute npm test e npm run build. Os 20 testes incluem cobertura dos 173 registros, todos os 32 subconjuntos de ameaças em todas as opções, preservação de núcleo e compatibilidade, recursos sem mana, diferenças entre campeões, edições e grupos de compra. O hash da base original protege os nomes PT-BR e as 2.300 recomendações de cartas.

Para regenerar os dados com snapshots correspondentes:

- node scripts/import_items.mjs pt.json en.json mayhem.json
- node scripts/import_champion_kits.mjs diretorio-en diretorio-pt

Os importadores exigem versão/release correspondente. Os snapshots não são necessários para compilar; os dados gerados estão no código-fonte. Objetos, kits, propostas e regras precisam de nova revisão a cada patch.
