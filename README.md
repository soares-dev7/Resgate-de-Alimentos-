# Resgate de Alimentos

> Plataforma que conecta estabelecimentos com sobras de alimentos próprios para consumo a ONGs e
> cozinhas comunitárias, organizando a coleta com rotas otimizadas.

Projeto do **Hack Brasil 2026** · Trilha **Logística e Automação**.

---

## O problema

O Brasil desperdiça dezenas de milhões de toneladas de alimentos por ano enquanto milhões de pessoas
vivem em insegurança alimentar. Mercados, padarias e restaurantes descartam diariamente comida em
perfeito estado (pães do dia, frutas com pequenas imperfeições, refeições que sobraram), e ONGs a
poucos quilômetros não têm o suficiente.

O gargalo é **logístico**:

- o estabelecimento não sabe para quem doar nem tem tempo de ligar para várias ONGs;
- a janela de retirada é curta (fim do expediente, antes do vencimento);
- a ONG tem pouca gente, um carro e combustível contado — rodar a cidade sem planejamento não fecha a conta.

> Os números usados na landing page têm fonte citada, mas precisam ser revisados pela equipe de
> conteúdo antes da apresentação (ver `docs/ROADMAP.md`).

## A solução

1. **Estabelecimento cadastra** a doação: tipo de alimento, quantidade (kg), validade, janela de retirada e endereço.
2. **ONGs próximas** veem as doações disponíveis num mapa/lista e reservam.
3. O sistema **agrupa as coletas** reservadas por uma ONG e **sugere a ordem de retirada** (rota).
4. A ONG **confirma a coleta** e o impacto é registrado: kg resgatados, refeições estimadas, CO₂ evitado.
5. **Painel de impacto** com totais por semana, por estabelecimento e por ONG.

## Público-alvo

- **Doadores:** supermercados, padarias, restaurantes, hortifrútis e cozinhas industriais.
- **Receptores:** ONGs, cozinhas comunitárias, bancos de alimentos e projetos sociais.
- **Interessados no impacto:** prefeituras, redes varejistas (relatórios ESG) e financiadores.

## Funcionalidades do MVP

| Funcionalidade | Rota | Situação |
| --- | --- | --- |
| Landing page (problema, solução, como funciona, CTAs) | `/` | pronto |
| Cadastro de doação com validação | `/doar` | pronto (salva no navegador) |
| Lista + mapa de doações para a ONG, com reserva | `/coletas` | pronto (mock) |
| Rota sugerida de coleta no mapa + confirmação | `/rota` | pronto (heurística simples) |
| Painel de impacto | `/impacto` | pronto (histórico mockado + coletas da sessão) |

### O que está pronto

- Fluxo completo navegável de ponta a ponta: cadastrar → reservar → ver rota → confirmar → ver impacto.
- 10 estabelecimentos fictícios em bairros reais de São Paulo e 3 ONGs fictícias.
- Doações iniciais com datas relativas a "hoje" (a demo nunca fica vencida).
- Banco de dados compartilhado no **Supabase**, com atualização em tempo real entre aparelhos e reservas
  protegidas no banco (duas ONGs não reservam a mesma doação).
- Modo local de demonstração quando o Supabase não está configurado (dados no `localStorage` + botão
  "Reiniciar dados da demo" em `/impacto`).
- Rota que respeita as janelas de retirada (vizinho mais próximo no tempo), com horário previsto de cada coleta,
  alerta de coleta fora da janela e comparação com a ordem das reservas (km e janelas salvas).
- Fatores de impacto documentados em `lib/impacto.ts`.
- Layout responsivo (celular e desktop).

### O que falta (próximas fases)

- Autenticação e perfis (estabelecimento × ONG); hoje a ONG é escolhida num seletor e não é verificada
  pelo banco.
- Cadastro de estabelecimentos e ONGs pelo app (hoje vêm de `lib/data/*.json` e de `supabase/seed.sql`).
- Geocodificação do endereço digitado (hoje o ponto no mapa vem do estabelecimento ou do centro do bairro).
- API de rotas real (distâncias por ruas, trânsito) e um solver de VRP com janelas de tempo (ex.: VROOM).
- Notificações (WhatsApp/e-mail/push) para novas doações e lembretes de retirada.
- Regras de segurança alimentar (checklist de conservação, temperatura, termo de doação — Lei 14.016/2020).
- Testes automatizados.

## Stack

- **[Next.js 15](https://nextjs.org/)** (App Router) + **TypeScript**
- **[Tailwind CSS 4](https://tailwindcss.com/)**
- **[Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/)** com tiles do **OpenStreetMap** (sem chave de API)
- **[Supabase](https://supabase.com/)** (PostgreSQL + tempo real), com modo local de demonstração usando os dados de `lib/data/*.json`
- Deploy pensado para **Vercel**

## Como rodar localmente

Pré-requisitos: **Node.js 20+** e npm.

```bash
git clone <url-do-repositorio>
cd Resgate-de-Alimentos-
npm install
cp .env.example .env.local   # opcional: sem o Supabase, o app roda no modo local
npm run dev
```

Abra <http://localhost:3000>.

Outros comandos:

```bash
npm run build      # build de produção
npm run start      # servir o build
npm run lint       # ESLint
npm run typecheck  # checagem de tipos do TypeScript
```

### Banco de dados (Supabase)

Sem configuração, o app usa o **modo local**: cada navegador tem seus próprios dados. Para todos verem as
mesmas doações (estabelecimento num aparelho, ONG em outro):

1. Crie um projeto em <https://supabase.com> (plano gratuito; região São Paulo).
2. No painel, abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Ainda no SQL Editor, rode `supabase/seed.sql` para carregar os dados da demonstração.
4. Em **Project Settings > API**, copie a **Project URL** e a chave pública **anon** (ou "publishable")
   para o `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   Nunca use a chave **service_role** no app: variáveis `NEXT_PUBLIC_` vão para o navegador.
5. Reinicie o `npm run dev`. O formulário de doação passa a dizer "A doação fica visível na hora para as ONGs".

Para **reiniciar a demo** no Supabase, rode `supabase/seed.sql` de novo (apaga doações e coletas e recarrega
os dados iniciais).

O que o banco garante (ver comentários em `supabase/schema.sql`): leitura pública; cadastro de doação sempre
como "disponível" e com quantidade, janela e validade coerentes; reservar, cancelar e confirmar coleta só
pelas funções `reservar_doacao`, `cancelar_reserva` e `confirmar_coleta`, que conferem o status no próprio
banco. Limitação desta fase: sem login, a ONG informada pelo app não é verificada.

### Roteiro de demonstração (2 minutos)

1. `/` → **Sou estabelecimento** → cadastre uma doação (tente enviar vazio para ver a validação).
2. **Ver no mapa** → em `/coletas`, reserve 3 ou 4 doações.
3. **Ver rota de coleta** → em `/rota`, veja a ordem sugerida e confirme uma coleta.
4. `/impacto` → os números incluem a coleta que você acabou de confirmar.

## Variáveis de ambiente

Veja `.env.example`. Nenhuma é obrigatória: sem o Supabase, o app roda no modo local.

| Variável | Uso | Obrigatória |
| --- | --- | --- |
| `NEXT_PUBLIC_MAP_TILE_URL` | Servidor de tiles do mapa (padrão: OpenStreetMap) | não |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | não (sem ela, modo local) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública "anon" do Supabase | não (sem ela, modo local) |
| `ORS_API_KEY` | API de rotas real (fase futura, só no servidor) | não usada ainda |

## Estrutura de pastas

```
app/
  layout.tsx            # layout global: cabeçalho, rodapé e AppProvider (estado)
  page.tsx              # landing page
  doar/page.tsx         # cadastro de doação
  coletas/page.tsx      # lista + mapa de doações para a ONG
  rota/page.tsx         # rota sugerida de coleta
  impacto/page.tsx      # painel de impacto
components/
  Header.tsx, Footer.tsx, PageHeader.tsx
  AvisoErro.tsx         # faixa com a última mensagem de erro
  DoacaoForm.tsx        # formulário de doação (usa lib/validacao.ts)
  DoacaoCard.tsx        # card de doação na lista
  SeletorOng.tsx        # escolhe a "ONG logada" (substituto da autenticação)
  Mapa.tsx              # carrega o mapa só no cliente (next/dynamic, ssr: false)
  MapaLeaflet.tsx       # mapa genérico: marcadores numerados + linha da rota
  BarrasHorizontais.tsx # gráfico de barras simples em HTML/CSS
lib/
  types.ts              # tipos de domínio (Doacao, Ong, Estabelecimento, Coleta)
  data/
    repositorio.ts      # ÚNICO ponto que sabe onde os dados ficam: Supabase ou modo local
    index.ts            # cadastros de referência, dados iniciais, rótulos e bairros de SP
    *.json              # estabelecimentos, ONGs, doações e histórico de coletas
  supabase.ts           # cliente do Supabase (null quando não configurado)
  store.tsx             # estado global (React Context) que usa o repositório
  rota.ts               # rota com janelas de retirada (vizinho mais próximo + Haversine)
  impacto.ts            # fatores e cálculo de impacto (estimativas)
  validacao.ts          # regras de validação da doação
  formato.ts            # formatação pt-BR (kg, datas, janelas)
supabase/
  schema.sql            # tabelas, regras de acesso (RLS) e funções de reserva
  seed.sql              # dados da demonstração (rodar de novo reinicia a demo)
docs/
  ROADMAP.md            # plano até 30/11 dividido por pessoa
```

### Pontos de extensão importantes

- **Mudar a fonte de dados:** tudo passa pela interface `Repositorio` em `lib/data/repositorio.ts`. As telas
  usam só `useApp()` e não sabem se os dados vêm do Supabase ou do modo local.
- **Trocar a heurística por uma API de rotas:** veja o comentário no topo de `lib/rota.ts`
  (OSRM, OpenRouteService ou VROOM). A assinatura de `sugerirRota` pode ser mantida.
- **Ajustar fatores de impacto:** constantes `KG_POR_REFEICAO` e `CO2E_KG_POR_KG_ALIMENTO` em `lib/impacto.ts`.

## Deploy (Vercel)

1. Importe o repositório em <https://vercel.com/new> (o framework Next.js é detectado sozinho).
2. Em **Settings > Environment Variables**, configure `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sem elas, o site publicado roda no modo local).
3. Opcional: `NEXT_PUBLIC_MAP_TILE_URL` para outro provedor de tiles.
4. Todas as páginas são estáticas; os dados são buscados no navegador.

## Próximos passos

O plano detalhado, com tarefas para front-end, back-end, mapas/rotas e conteúdo/validação, está em
[`docs/ROADMAP.md`](docs/ROADMAP.md). Em resumo:

1. Login simples por perfil (estabelecimento / ONG), ligando as funções do banco ao usuário autenticado.
2. Deploy na Vercel com o Supabase configurado.
3. Geocodificação de endereços e API de rotas com janelas de tempo.
4. Validar fluxo e fatores de impacto com 2–3 estabelecimentos e ONGs reais.

## Licença

[MIT](LICENSE)
