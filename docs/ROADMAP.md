# Roadmap até 30/11/2026

Ponto de partida (15/11): esqueleto navegável com dados mockados (ver README → "O que está pronto").
Meta em 30/11: **demo funcional com dados reais persistidos, login simples, rota por ruas e números de
impacto validados com parceiros reais**, pronta para apresentação.

## Papéis

| Pessoa | Frente | Dono(a) de |
| --- | --- | --- |
| **P1** | Front-end | Telas, componentes, UX, responsividade, acessibilidade |
| **P2** | Back-end | Banco, API, autenticação, regras de negócio |
| **P3** | Mapas e rotas | Geocodificação, API de rotas, otimização com janelas |
| **P4** | Conteúdo, painel e validação | Pesquisa com estabelecimentos/ONGs, números, painel, pitch |

## Marcos

| Data | Marco |
| --- | --- |
| 18/11 (qua) | Decisão de back-end (Convex × Supabase) e modelo de dados fechado |
| 22/11 (dom) | Fluxo doar → reservar persistido no banco, com login |
| 26/11 (qui) | Rota por ruas + painel com dados reais; 1ª rodada de testes com parceiros |
| 28/11 (sáb) | Congelamento de funcionalidades (só correções a partir daqui) |
| 30/11 (seg) | Entrega: deploy na Vercel, README atualizado, vídeo/pitch |

---

## Semana 1 — 16/11 a 22/11: dados reais e fluxo principal

### P1 · Front-end
- [ ] Revisar telas no celular (a ONG vai usar no carro) e corrigir o que quebrar.
- [ ] Estados de carregamento e erro nas telas (preparar para chamadas assíncronas ao back-end).
- [ ] Tela "Minhas doações" do estabelecimento (status: disponível / reservada / coletada).
- [ ] Tornar `useApp()` compatível com dados assíncronos (combinar com P2).

### P2 · Back-end
- [ ] Escolher Convex ou Supabase (critérios: tempo de setup, tempo real, plano gratuito) — até 18/11.
- [ ] Criar tabelas/coleções espelhando `lib/types.ts` e um script de seed a partir de `lib/data/*.json`.
- [ ] Reimplementar `lib/data/index.ts` e as ações de `lib/store.tsx` contra o banco.
- [ ] Login simples (magic link ou e-mail/senha) com perfil `estabelecimento` ou `ong`.
- [ ] Regra de concorrência: duas ONGs não podem reservar a mesma doação.

### P3 · Mapas e rotas
- [ ] Geocodificar o endereço do formulário (Nominatim/OSM; respeitar o limite de 1 req/s) e remover a lista fixa de bairros.
- [ ] Prova de conceito com OSRM ou OpenRouteService: matriz de distâncias para as paradas reservadas.
- [ ] Definir onde a chave da API fica (rota de API do Next/servidor, nunca `NEXT_PUBLIC_`).

### P4 · Conteúdo, painel e validação
- [ ] Revisar e citar corretamente os números da landing page (PNUMA, FAO, Rede PENSSAN).
- [ ] Contatar 3–5 estabelecimentos e 2–3 ONGs de SP; agendar conversas de 15 min.
- [ ] Roteiro de entrevista: o que sobra, quando, quanto; como a ONG busca hoje; o que impede.
- [ ] Validar com nutricionista/ONG o fator `KG_POR_REFEICAO` e com fontes o `CO2E_KG_POR_KG_ALIMENTO`.

---

## Semana 2 — 23/11 a 29/11: rota real, painel e validação

### P1 · Front-end
- [ ] Filtros em `/coletas`: categoria, distância máxima, janela de retirada (hoje/amanhã).
- [ ] Integrar a rota real (polilinha pelas ruas) vinda de P3.
- [ ] Botão "Abrir no Google Maps/Waze" para cada parada.
- [ ] Polimento visual e textos finais com P4.

### P2 · Back-end
- [ ] Confirmação de coleta grava um registro de `Coleta` (usado no painel).
- [ ] Expirar automaticamente doações vencidas ou com janela encerrada.
- [ ] Notificação simples (e-mail) para ONGs próximas quando surgir doação nova.
- [ ] Deploy na Vercel com variáveis de ambiente configuradas.

### P3 · Mapas e rotas
- [ ] Substituir `sugerirRota` em `lib/rota.ts` pela API real mantendo a assinatura.
- [ ] Considerar janelas de retirada (ex.: VROOM/ORS Optimization) ou, no mínimo, ordenar por janela + proximidade.
- [ ] Fallback: se a API falhar, usar a heurística atual do vizinho mais próximo.
- [ ] Medir e mostrar a economia: km da rota sugerida × km visitando na ordem de reserva.

### P4 · Conteúdo, painel e validação
- [ ] Teste de usabilidade com pelo menos 1 estabelecimento e 1 ONG reais; registrar achados em `docs/`.
- [ ] Painel: adicionar filtro por período e exportação simples (CSV) para relatórios.
- [ ] Texto sobre segurança alimentar e a Lei 14.016/2020 (doação de alimentos) na landing.
- [ ] Roteiro do pitch e vídeo de demonstração (até 29/11).

---

## 30/11 — Entrega
- [ ] Build limpo (`npm run build`) e deploy final na Vercel.
- [ ] README atualizado (o que está pronto × o que falta).
- [ ] Ensaiar o pitch com o roteiro de demonstração do README.

## Fora do escopo do hackathon
Pagamentos, app nativo, rastreamento em tempo real do veículo, roteirização multi-veículo.
