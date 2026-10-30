# ARAM Atlas

Guia de aprimoramentos para **ARAM: Desordem**, com 173 campeões e nomes em PT-BR e inglês.

## Recursos

- Busca, filtros por classe e ordenação.
- Favoritos salvos no navegador, sem conta ou servidor.
- 2.300 recomendações separadas em Prismática, Ouro e Prata.
- Efeitos de 102 cartas em português e inglês, em painel interno adaptado ao celular.
- Orientações editoriais para algumas builds alternativas.

## Executar

Requer Node.js 22 ou posterior.

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

Favoritos ficam no navegador e dispositivo usados; não são sincronizados entre dispositivos e podem ser perdidos ao limpar dados locais. O site não exige login.

Projeto independente, não afiliado à Riot Games. League of Legends e seus elementos pertencem aos respectivos titulares.
