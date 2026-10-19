# Relatório — Performance Engineer (Tratto / Orçamentos)

Data: 2026-10-19 · Commit base: `df32258` · Modo: somente leitura (nenhum arquivo do projeto alterado; `git status` final mostra apenas `?? .omc/`, que já existia).

## Escopo investigado

- Queries por página (dashboard, clientes index/busca/show, orçamentos index/busca/show/edit/create, veículo create, PDF), N+1, eager loading, índices.
- Tamanho de props Inertia por página.
- Tempo e memória do PDF (DomPDF) com 20 e 100 itens; tamanho do arquivo gerado.
- Bundle/assets (`vite.config.ts`, `package.json`, `public/build/manifest.json` existente, de 15/09 — pode estar defasado em relação ao HEAD).
- Service worker (`public/sw.js`) e SSR do Inertia (`config/inertia.php`).

## Metodologia

- Teste Pest experimental em `scratchpad/perf/LabPerfBaselineTest.php`, copiado temporariamente para `tests/Feature/` e **apagado** depois.
- sqlite em memória (configuração padrão de testes), `withoutVite()`, SSR desligado no teste (`inertia.ssr.enabled=false`), 1 aquecimento + mediana de 5 execuções (3 para PDF).
- Dados sintéticos inseridos em lote: oficina A com 200 clientes, 266 veículos, 500 orçamentos × 20 itens (10.000 itens); oficina B com ruído (50 clientes, 100 orçamentos × 5 itens). Depois, PDF/show com 100 itens e escalonamento para 2.000 orçamentos.
- Contagem com `DB::enableQueryLog()`/`DB::getQueryLog()`; props = tamanho do JSON no `<script data-page>`.
- Tempos incluem overhead do kernel de testes e oscilaram entre execuções (máquina compartilhada, ±30–50%). Use-os como ordem de grandeza; contagens de queries e bytes são determinísticos.

## Baseline medida

| Página                                         | URL                           | Queries | Mediana ms | Mín ms | HTML KB         | Props KB |
| ---------------------------------------------- | ----------------------------- | ------- | ---------- | ------ | --------------- | -------- |
| Dashboard                                      | `/dashboard`                  | 3       | 12.3       | 11.8   | 7.4             | 2.9      |
| Clientes (index, 200)                          | `/customers`                  | 1       | 67.3       | 62.4   | 40.9            | 36.3     |
| Clientes (busca)                               | `/customers?search=cliente 1` | 1       | 74.4       | 54.5   | 25.1            | 20.6     |
| Cliente (show)                                 | `/customers/{id}`             | 2       | 17.1       | 14.2   | 5.8             | 1.3      |
| Orçamentos (index, 500)                        | `/estimates`                  | 3       | 400.0      | 370.3  | 217.3           | 212.8    |
| Orçamentos (busca)                             | `/estimates?search=abc0`      | 3       | 165.7      | 145.7  | 110.5           | 106.0    |
| Orçamento (show, 20 itens)                     | `/estimates/{id}`             | 4       | 19.6       | 17.3   | 9.9             | 5.4      |
| Orçamento (edit)                               | `/estimates/{id}/edit`        | 4       | 53.7       | 49.9   | 43.7            | 39.1     |
| Orçamento (create)                             | `/estimates/create`           | 2       | 86.0       | 45.6   | 39.4            | 34.9     |
| Veículo (create)                               | `/vehicles/create`            | 1       | 26.5       | 26.3   | 12.9            | 8.4      |
| PDF (20 itens)                                 | `/estimates/{id}/pdf`         | 5       | 250.0      | 246.6  | **859.0** (PDF) | -        |
| Orçamento (show, 100 itens)                    | `/estimates/{id}`             | 4       | 35.0       | 34.6   | 35.8            | 31.3     |
| PDF (100 itens)                                | `/estimates/{id}/pdf`         | 5       | 686.1      | 667.5  | **864.7** (PDF) | -        |
| PDF (100 itens, `enable_font_subsetting=true`) | idem                          | 5       | 806.7      | 645.7  | **28.6** (PDF)  | -        |
| Orçamentos (index, 2.000)                      | `/estimates`                  | 3       | 1563.1     | 1080.0 | 736.5           | 731.9    |

Outras medições:

- PDF 100 itens isolado: ~660–815 ms, pico de memória **+9,2 MB** sobre base de 60 MB (folgado para `memory_limit` típico de 128 MB).
- Execução anterior (mesmo teste): index 500 = 250 ms, PDF 20 = 247 ms, PDF 100 = 611 ms, index 2.000 = 1.094 ms — confirma a oscilação, não a tendência.

`EXPLAIN QUERY PLAN` (sqlite):

- `estimate_items where estimate_id in (?)` → **SCAN estimate_items** (sem índice).
- lista de orçamentos → usa `estimates_business_id_created_at_index` (ok).
- lista de clientes → `customers_business_id_name_index` + **TEMP B-TREE FOR ORDER BY** (ordena por `created_at`, índice é por `name`); subquery de `vehicles_count` correlacionada faz **SCAN** no índice `(business_id, customer_id)` por cliente.
- `max(number)` → índice único `(business_id, number)` cobrindo (ok).

Bundle (`public/build`, build de 15/09, gzip -9 medido localmente):

- Entrada estática (todas as páginas, inclusive login): `app` 57,5 KB + `utils` (vendor) **374 KB** → **432 KB brutos / ~134 KB gzip**. CSS 52,6 KB / 9,9 KB gzip.
- Por página, extra: dashboard +8 KB (4 KB gz), estimates/index +11,7 KB (5,9 KB gz), estimates/form +16,4 KB (7 KB gz).
- 44 chunks JS (code splitting por página funcionando). Fontes Instrument Sans 3 pesos em woff2 (~17 KB cada) + woff (fallback, não baixado por browsers modernos).

## Evidências (arquivo:linha)

- `app/Http/Controllers/EstimateController.php:18-26` — `index` faz `->latest()->get()` sem paginação nem `select` de colunas; serializa `notes`, `business_id`, `created_at`, `updated_at`, `customer.phone` que a lista não usa (`resources/js/components/estimate-list-item.tsx:26-63` usa só id, number, status, date, total, customer.name, vehicle.model/plate).
- `app/Http/Controllers/CustomerController.php:15-22` — `index` sem paginação; `withCount('vehicles')` + `latest()`.
- `app/Http/Controllers/EstimateController.php:76-84` — `formData()` envia **todos** os clientes e **todos** os veículos da oficina para create/edit (filtrados no cliente, `resources/js/pages/estimates/form.tsx:47,73,112`).
- `app/Http/Controllers/VehicleController.php:16,38` — idem, todos os clientes.
- `app/Http/Controllers/EstimateController.php:21-23` e `CustomerController.php:18` — busca com `lower(col) like '%termo%'`: não usa índice (B-tree) em nenhum banco; em Postgres exigiria `pg_trgm`.
- `database/migrations/2026_09_14_000004_create_estimate_items_table.php:15` — `foreignId('estimate_id')->constrained()` **sem índice**. No PostgreSQL a FK não cria índice; cada show/edit/PDF/update (`UpdateEstimate.php:17` `items()->delete()`) faz seq scan em `estimate_items`, e o `ON DELETE CASCADE` também.
- `database/migrations/2026_09_14_000003_create_estimates_table.php:16-17` — `customer_id`/`vehicle_id` sem índice próprio (apenas FK). Impacto atual baixo (não há listagem por cliente nem `destroy`).
- `database/migrations/2026_09_14_000002_create_vehicles_table.php:20` — índice `(business_id, customer_id)`; a subquery de `withCount` filtra só por `customer_id` (sem `business_id`), não aproveita bem o índice composto.
- `database/migrations/2026_09_14_000001_create_customers_table.php:18` — índice `(business_id, name)`, mas `index` ordena por `created_at` (`latest()`).
- `vendor/barryvdh/laravel-dompdf/config/dompdf.php:113` — `enable_font_subsetting => false` (não há `config/dompdf.php` no projeto) → DejaVu Sans é embutida inteira (~850 KB) em todo PDF.
- `app/Http/Controllers/EstimatePdfController.php:14-19` — eager loading correto (5 queries fixas, sem N+1).
- `routes/web.php:38-42` — dashboard com eager loading e `take(5)` (3 queries).
- `config/inertia.php` — `ssr.enabled => true`; `HttpGateway::dispatch` (vendor `src/Ssr/HttpGateway.php:44-50`) só chama o servidor SSR se houver bundle ou Vite hot. Em produção o build é `vp build` sem `--ssr` → sem bundle → sem chamada. Em dev/teste com `public/hot` presente, ele tenta SSR via Vite (desliguei no experimento).
- `resources/js/app.tsx:3-6` — `AppLayout`, `AuthLayout` e `SettingsLayout` importados estaticamente → entram no chunk de entrada de todas as páginas (inclusive login).
- `public/sw.js` — só `skipWaiting`/`clients.claim`; sem cache (nenhum ganho offline/repeat, mas também sem risco de cache de página autenticada — coerente com `docs/sistema.md`).
- `resources/js/components/search-field.tsx:42-50` — debounce de 400 ms, `preserveState`, `replace` (ok).

## Achados confirmados

| #   | Achado                                                                                                                                                                                                                                                         | Sev.   | Impacto                                      | Confiança                              | Esforço                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| 1   | **PDF de ~860 KB** mesmo com 1 página, por falta de font subsetting. Com `enable_font_subsetting=true` cai para **28,6 KB (−97%)** sem piorar tempo de forma mensurável. Afeta download/compartilhamento em 3G/4G e WhatsApp (uso principal do produto).       | **P1** | Alto para UX mobile                          | Alta (medido)                          | Baixo (publicar `config/dompdf.php` ou `Pdf::setOption`)               |
| 2   | **`/estimates` sem paginação**: props crescem linearmente (~0,42 KB/orçamento): 213 KB com 500, **732 KB com 2.000**; tempo de servidor ~0,25–0,4 s → ~1,1–1,6 s. Oficina ativa chega a milhares em 1–2 anos. Também over-fetching (notes, timestamps, phone). | **P1** | Alto com crescimento; hoje moderado          | Alta (medido)                          | Médio (paginação/infinite scroll do Inertia v3 + `select` de colunas)  |
| 3   | `estimate_items.estimate_id` **sem índice** (Postgres não indexa FK). sqlite confirma SCAN. Show/edit/PDF/update e cascade fazem varredura da tabela inteira de itens (de todas as oficinas). Hoje imperceptível (10 k linhas); degrada com 10⁵–10⁶ itens.     | **P2** | Médio, cresce com o total global             | Alta (plano), impacto em PG não medido | Baixo (nova migration `index('estimate_id')`)                          |
| 4   | Formulários de orçamento/veículo enviam **todos clientes + veículos**: 35–39 KB de props com 200 clientes; `<select>` nativo com centenas de opções é ruim no celular.                                                                                         | **P2** | Médio (UX + payload)                         | Alta                                   | Médio (busca/autocomplete ou `Inertia::optional`/endpoint por cliente) |
| 5   | `/customers` sem paginação: 36 KB com 200 clientes; `withCount` correlacionado + ordenação sem índice adequado (TEMP B-TREE).                                                                                                                                  | **P3** | Baixo hoje                                   | Alta                                   | Médio                                                                  |
| 6   | Busca `lower(...) like '%x%'` não indexável; com `whereHas` duplo em orçamentos.                                                                                                                                                                               | **P3** | Baixo hoje (escopo por `business_id` limita) | Alta                                   | Médio (pg_trgm)                                                        |
| 7   | Chunk de entrada ~134 KB gzip carregado inclusive no login (layouts estáticos). Aceitável para SPA React 19; ganho de lazy-load dos layouts é marginal.                                                                                                        | **P3** | Baixo                                        | Média (build de 15/09)                 | Baixo/Médio                                                            |

Sem N+1: todas as páginas medidas têm número **constante** de queries (1–5), independente do volume.

## Hipóteses não verificadas

- Em PostgreSQL 17 os tempos absolutos serão diferentes; a ausência de índice em `estimate_items.estimate_id` deve ter efeito maior que no sqlite em tabelas grandes (não medido em PG).
- O tempo de serialização da lista de orçamentos (Eloquent `toArray` + casts de data + JSON) parece dominar sobre o SQL; não perfilado com Xdebug/SPX.
- `public/build` é de 15/09 (anterior aos commits de UI/marca); tamanhos atuais do bundle podem diferir. Não rodei `npm run build` por instrução.
- Fontes: o tempo de renderização do DomPDF (~250 ms mínimo) provavelmente inclui carga das métricas da DejaVu a cada request; cache de fontes em `storage/fonts` é efêmero no Railway.
- Railway: tamanho de instância/`memory_limit` em produção desconhecidos (não acessei produção).

## Recomendações (em ordem)

1. Publicar `config/dompdf.php` (ou `->setOption('enable_font_subsetting', true)` no `EstimatePdfController`) — ganho de 97% no PDF, 1 linha + teste.
2. Paginar `/estimates` (e depois `/customers`) com `paginate()`/`Inertia::scroll()` (infinite scroll do v3) e limitar colunas: `select('id','customer_id','vehicle_id','number','status','total','date','created_at')`, `customer:id,name`.
3. Nova migration adicionando `index('estimate_id')` em `estimate_items` (não editar a migration publicada). Considerar `index(['business_id','created_at'])` já existe para estimates; para customers avaliar `(business_id, created_at)` ou ordenar por nome.
4. Formulário de orçamento: carregar veículos só do cliente selecionado (partial reload `only: ['vehicles']` com `Inertia::optional`) e trocar o `<select>` de clientes por busca quando houver muitos.
5. Opcional: `pg_trgm` + índices GIN para busca; lazy dos layouts em `app.tsx`.

## Testes necessários

- Feature: PDF continua `application/pdf` e contém acentos/valores corretos com subsetting (estender `PdfEstimatePresentationTest`); asserção de tamanho < ~100 KB como regressão.
- Feature: paginação de `/estimates` e `/customers` (página 2, busca preservada, isolamento multi-tenant → 404/não vazar da outra oficina).
- Feature de contagem de queries (padrão do lab): N fixo por página independente do volume, para evitar N+1 futuros.
- Migration de índice: teste simples de `Schema::hasIndex('estimate_items', ...)`.

## Riscos e limitações

- Medições em sqlite em memória dentro do kernel de testes; tempos ruidosos (±30–50% entre execuções). Bytes e contagem de queries são confiáveis.
- Font subsetting do DomPDF: verificar visualmente acentos e símbolos (R$, º) — o teste existente valida texto, mas convém conferir em leitor de PDF.
- Paginação muda a UX da lista e a busca (hoje filtra a lista completa no servidor; continua funcionando com paginação).
- Nova migration roda com `--force` no deploy; `CREATE INDEX` em Postgres bloqueia escrita na tabela durante a criação (tabela pequena hoje → risco baixo; em tabela grande usar `CREATE INDEX CONCURRENTLY`).

## Perguntas para outros agentes

- **Produto/UX:** quantos orçamentos/clientes uma oficina típica acumula por ano? Infinite scroll ou paginação numerada no mobile?
- **Backend/arquitetura:** aceitam publicar `config/dompdf.php`? Há planos de status adicionais/listas por cliente que justifiquem índices em `estimates.customer_id`/`vehicle_id`?
- **DevOps:** qual `memory_limit` e CPU da instância no Railway? `storage/fonts` é recriado a cada deploy (afeta cache de métricas de fonte do DomPDF)?
- **Frontend:** o `<select>` de clientes no formulário precisa virar combobox com busca?
