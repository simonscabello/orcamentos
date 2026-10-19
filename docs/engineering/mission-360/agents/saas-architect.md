# SaaS Architect — Tratto/Orçamentos (multi-tenancy, identidade, planos, faturamento)

Data: 2026-10-19 · Modo: somente leitura · Suíte executada: `php artisan test --compact` → 60 passed (213 assertions).

## 1. Escopo investigado

- Isolamento por `business_id`: trait, controllers, FormRequests, Actions, PDF, dashboard, migrations, testes.
- Identidade: `User belongsTo Business`, Fortify (features), exclusão de conta, sessão.
- Onboarding: `business:create`.
- Configuração por oficina (dados no PDF) vs. marca do produto (`config/brand.php`).
- Opções futuras: múltiplos usuários/papéis, usuário em várias oficinas, planos/limites, faturamento, subdomínio vs sessão, banco único vs schema por tenant.
- Não investigado: produção/Railway, `.env`, frontend além do necessário, carga real.

## 2. Evidências (arquivo:linha)

| #   | Evidência                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | `app/Models/Concerns/BelongsToBusiness.php:11-19` — só relação `business()` e scope local `forBusiness`; sem global scope, sem hook `creating`.                                                                                                    |
| E2  | `app/Http/Controllers/CustomerController.php:16,38,45,52`; `VehicleController.php:17,28,36-37,45`; `EstimateController.php:21,63-66,72-75`; `EstimatePdfController.php:14` — toda leitura usa `forBusiness(user()->business_id)->findOrFail`.      |
| E3  | `CustomerController.php:31`, `VehicleController.php:28`, `CreateEstimate.php:20` — `business_id` sempre vem do usuário/Business, nunca do request.                                                                                                 |
| E4  | `EstimateRequest.php:18-19,33`, `VehicleRequest.php:18` — `Rule::exists(...)->where('business_id', ...)` e `after()` checa veículo↔cliente.                                                                                                        |
| E5  | `routes/web.php:39-41` — dashboard usa `$user->business->estimates()` (escopo via relação).                                                                                                                                                        |
| E6  | `database/migrations/2026_09_14_000003_create_estimates_table.php:14-16` — FKs simples `customer_id`/`vehicle_id` → `customers.id`/`vehicles.id`; banco **não** garante mesmo tenant. Idem `vehicles.customer_id` (`..._000002_...:14-15`).        |
| E7  | `database/migrations/0001_01_01_000000_create_users_table.php:25` — `users.business_id` NOT NULL, `cascadeOnDelete`; `email` único global (`:27`).                                                                                                 |
| E8  | `app/Models/User.php:5,28` — `MustVerifyEmail` comentado; `business_id` em `$fillable`. `config/fortify.php:148` habilita `emailVerification()` → middleware `verified` (`routes/web.php:38`) é efetivamente no-op.                                |
| E9  | `app/Http/Controllers/Settings/ProfileController.php:52-66` + `routes/settings.php:16` — qualquer usuário pode excluir a própria conta; a `Business` e todos os dados ficam órfãos (sem dono, sem acesso).                                         |
| E10 | `app/Console/Commands/CreateBusinessCommand.php:14-64` — cria Business+User em transação; valida senha só `min:8` (não usa `Password::defaults()`); não seta `email_verified_at`; não aceita phone/document.                                       |
| E11 | `config/brand.php:12-13` — documentado que a marca é do produto e o PDF usa apenas dados da oficina; `resources/views/pdf/estimate.blade.php:31-47` usa `business.name/phone/document/address`. Sem logo, cor, rodapé, validade, CNPJ obrigatório. |
| E12 | `app/Http/Requests/BusinessRequest.php:11-14` e demais requests — `authorize()` só checa login; não existem Policies (`app/Policies` inexistente) nem papéis.                                                                                      |
| E13 | `tests/Feature/EstimateTenantTest.php:35-50,107-126` — 404 cobertos: `customers.show`, `vehicles.edit`, `estimates.show`, `estimates.pdf`; rejeição de veículo estrangeiro em store/update de orçamento.                                           |
| E14 | `config/session.php:21,159` — sessão em banco, `SESSION_DOMAIN` por env (sem subdomínio). `.railway/railway.ts:8` — 1 réplica.                                                                                                                     |
| E15 | `app/Actions/CreateEstimate.php:15-16` — numeração com `lockForUpdate` na Business + `unique(business_id, number)`.                                                                                                                                |

## 3. Achados confirmados

| ID  | Sev.         | Achado                                                                                                                                                                                                                                                                                                                                                                                           | Impacto                                                    | Confiança                                 | Esforço                                                                |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| A1  | — (positivo) | Isolamento explícito está **correto em todos os endpoints atuais** (E2–E5). Não encontrei vazamento entre oficinas.                                                                                                                                                                                                                                                                              | —                                                          | Alta (leitura de todo controller/request) | —                                                                      |
| A2  | P2           | Lacunas de teste de isolamento: sem 404 para `customers.edit/update`, `vehicles.update`, `estimates.edit/update` de outra oficina; sem teste de `vehicles.store` com `customer_id` estrangeiro; sem teste de que `customers.index`/`estimates.index`/busca/dashboard listam só a própria oficina (E13). O código está certo hoje; o risco é regressão silenciosa, porque o modelo é opt-in (E1). | Regressão futura vira vazamento cross-tenant               | Alta                                      | Baixo (~8 testes)                                                      |
| A3  | P2           | Modelo opt-in sem rede de segurança: esquecer `forBusiness` em um endpoint novo, job, comando ou relação vaza dados; não há global scope, nem teste "catch-all", nem constraint no banco (E1, E6).                                                                                                                                                                                               | Proporcional ao crescimento do time/código                 | Alta (comprovado por design)              | Médio                                                                  |
| A4  | P2           | Exclusão de conta pelo próprio usuário deixa a oficina órfã com dados de clientes (nomes, telefones, placas) sem titular, e o toast diz "Conta excluída" (E9). Com 1 usuário/oficina, isso equivale a "abandonar" dados pessoais — tema LGPD e de suporte. Com múltiplos usuários, permite que um funcionário apague o dono? Não (só a si mesmo), mas o último usuário some sem tratamento.      | Dados órfãos; pedido de exclusão LGPD não atendido de fato | Alta                                      | Baixo (bloquear/ocultar ou fluxo "encerrar oficina")                   |
| A5  | P3           | Integridade cross-tenant não é garantida pelo banco (E6): FKs simples permitem, via código errado/tinker, `estimate.business_id=A` com `customer` de B. Hoje só a validação impede.                                                                                                                                                                                                              | Defesa em profundidade ausente                             | Alta                                      | Médio (FKs compostas exigem `unique(id,business_id)` + nova migration) |
| A6  | P3           | `verified` é no-op porque `User` não implementa `MustVerifyEmail` (E8). Hoje é aceitável (contas criadas por comando), mas com convite/cadastro público vira lacuna.                                                                                                                                                                                                                             | Baixo agora                                                | Alta                                      | Baixo                                                                  |
| A7  | P3           | `business:create` aceita senha fraca (`min:8`) mesmo em produção, divergindo de `Password::defaults()` (E10, `AppServiceProvider.php:44-52`); senha via `--password` fica no histórico do shell.                                                                                                                                                                                                 | Conta de oficina com senha fraca                           | Alta                                      | Baixo                                                                  |
| A8  | P3           | `VehicleController::update` permite trocar o `customer_id` do veículo (mesma oficina); orçamentos antigos passam a ter cliente ≠ dono do veículo (não é vazamento, é consistência).                                                                                                                                                                                                              | Dados incoerentes no PDF/histórico                         | Média                                     | Baixo                                                                  |
| A9  | P3           | `User.$fillable` inclui `business_id` (E8). Hoje nenhum fluxo faz `fill($request->all())` (ProfileUpdateRequest valida só name/email), então não explorável; vira armadilha quando houver convite/edição de usuários.                                                                                                                                                                            | Futuro mass-assignment de tenant                           | Alta (não explorável hoje)                | Trivial                                                                |

Nenhum P0/P1 encontrado.

## 4. Hipóteses não verificadas

- H1: Dados de produção já podem ter oficinas órfãs (A4) — não acessei produção.
- H2: Com 1 réplica e sessão em banco, `lockForUpdate` é suficiente para numeração; com N réplicas continua correto (lock é no Postgres) — plausível, não testado sob carga.
- H3: Busca `lower(x) like '%..%'` sem índice funcional deve degradar com milhares de orçamentos por oficina — plausível, irrelevante no volume atual.

## 5. Avaliação do modelo atual

- **Isolamento:** "row-level, banco único, filtro explícito". Correto e simples; o ponto fraco é ser opt-in. Para o estágio (poucas oficinas, um dev), é a escolha certa. Endurecer com testes e um guard barato antes de pensar em global scope.
- **Identidade:** `users.business_id` NOT NULL = 1 usuário pertence a exatamente 1 oficina; e-mail único global. Bloqueia "usuário em várias oficinas" sem migração de dados, mas suporta N usuários por oficina já hoje (só falta UI/convite/papel).
- **Onboarding:** comando manual é adequado enquanto a venda é assistida (high-touch). Falta: dados completos da oficina, senha forte, marcar e-mail verificado, e um comando para adicionar usuário a uma oficina existente.
- **Configuração por oficina:** limitada aos 5 campos de `businesses`. Separação produto (`config/brand.php`) vs. tenant (PDF) está correta e bem documentada; manter.

## 6. Opções de evolução

### 6.1 Múltiplos usuários e papéis (mesma oficina)

| Opção                                                           | Custo                                                                    | Risco            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------- |
| a) Coluna `users.role` (`owner`/`member`) + Gate/Policy simples | Baixo (1 migration aditiva, 1 enum, gates em Business settings/usuários) | Baixo            |
| b) Pacote de permissões (spatie/permission)                     | Médio + dependência                                                      | Over-engineering |

- **Gatilho:** primeira oficina pedindo login para funcionário/atendente, ou pedido de "funcionário não vê valores/não edita dados da oficina".
- **Recomendação:** (a). Owner gerencia oficina/usuários/plano; member opera clientes/orçamentos. Convite por e-mail com `MustVerifyEmail` ligado (A6) e remover `business_id` do fillable (A9).
- **NÃO fazer agora:** permissões granulares, pacote de RBAC, tela de gestão de papéis; também não abrir cadastro público.

### 6.2 Usuário em várias oficinas

| Opção                                                                                                                                                           | Custo                                                                                             | Risco                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| a) Pivot `business_user` (role no pivot) + `users.current_business_id` na sessão/coluna; trocar `user()->business_id` por um resolver único (`CurrentBusiness`) | Alto: toca todos os controllers/requests, testes, migração de dados (`users.business_id` → pivot) | Médio-alto: troca de contexto mal feita = vazamento |
| b) Contas separadas por e-mail (status quo)                                                                                                                     | Zero                                                                                              | Fricção para contadores/redes                       |

- **Gatilho:** demanda real de rede com 2+ unidades, ou contador/consultor atendendo várias oficinas (≥2-3 clientes pagantes pedindo).
- **Preparação barata agora:** centralizar a leitura do tenant atual num único ponto (ex.: método `currentBusinessId()` no `User` ou helper) — reduz o custo futuro de (a) de "tocar 20 lugares" para "trocar 1". Só fazer se houver outra mudança tocando esses arquivos.
- **NÃO fazer agora:** pivot, seletor de oficina, migrar `users.business_id`; não remover a coluna NOT NULL.

### 6.3 Planos e limites

| Opção                                                                                                                                                                    | Custo               | Risco                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | --------------------------------------- |
| a) `businesses.plan` (string) + `businesses.trial_ends_at`/`active_until` + mapa de limites em `config/plans.php`; checagem em Actions (`CreateEstimate`) e FormRequests | Baixo-médio         | Baixo                                   |
| b) Tabela `plans` + features por linha                                                                                                                                   | Médio               | Baixo, mas desnecessário com 2-3 planos |
| c) Feature flags (Laravel Pennant)                                                                                                                                       | Médio + dependência | Baixo                                   |

- **Gatilho:** decisão comercial de cobrar com diferenciação (ex.: limite de orçamentos/mês, usuários, logo no PDF). Antes disso, um único plano = sem código.
- **Recomendação:** quando vier, (a); contar uso por query (`count` por mês) — sem contadores denormalizados. Bloquear criação com mensagem pt-BR, nunca leitura/PDF de dados existentes.
- **NÃO fazer agora:** tabela de planos, metering, Pennant, limites hard-coded "por precaução".

### 6.4 Faturamento

| Opção                                                                                                               | Custo                                                       | Risco                                                                |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| a) Manual (Pix/boleto fora do sistema) + flag `active_until` por comando/admin                                      | Muito baixo                                                 | Inadimplência controlada à mão                                       |
| b) Gateway BR com assinatura recorrente (Asaas, Iugu, Pagar.me, Mercado Pago) via webhook → atualiza `active_until` | Médio (webhook, idempotência, fila — hoje não há fila/cron) | Médio (webhook falho bloqueia cliente pagante)                       |
| c) Laravel Cashier (Stripe/Paddle)                                                                                  | Médio                                                       | Stripe/Paddle têm fit pior com Pix/boleto e NF-e brasileira; avaliar |

- **Gatilho:** ~10-20 oficinas pagantes ou cobrança manual consumindo >1-2h/mês. Também quando precisar emitir NFS-e automaticamente.
- **Recomendação:** começar por (a); para (b), o sistema precisa de fila/worker e cron (hoje inexistentes — `docs/sistema.md`), webhook idempotente e "graça" de alguns dias antes de bloquear.
- **NÃO fazer agora:** integrar gateway, dados de cartão no app (nunca), self-serve checkout, bloqueio automático por inadimplência.

### 6.5 Subdomínio vs sessão para resolver o tenant

| Opção                             | Custo                                                                                                                                                              | Risco                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| a) Sessão/usuário (atual)         | Zero                                                                                                                                                               | Nenhum novo                                                                                                                  |
| b) Subdomínio `oficina.tratto...` | Médio-alto: DNS wildcard + certificado wildcard no Railway, `SESSION_DOMAIN`, Wayfinder/rotas com domínio, PWA `scope/start_url` por host, cookies cross-subdomain | Alto: mexe em `trustProxies`/`forceHttps` (regras críticas), risco de página em branco e de sessão vazando entre subdomínios |
| c) Path `/o/{slug}`               | Médio                                                                                                                                                              | Médio                                                                                                                        |

- **Gatilho:** só se surgir página **pública** por oficina (ex.: link público do orçamento para o cliente final aprovar, vitrine) ou white-label com domínio próprio. Login/uso interno não precisa.
- **Recomendação:** manter (a). Para link público de orçamento, usar URL assinada/token aleatório (`/o/{uuid}`), não subdomínio.
- **NÃO fazer agora:** subdomínios, domínios customizados, tenant por host.

### 6.6 Banco único vs schema/banco por tenant

| Opção                                                                      | Custo                                                                                                                               | Risco                                                    |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| a) Banco único + `business_id` (atual)                                     | Zero                                                                                                                                | Vazamento por esquecimento de filtro (mitigar com A2/A3) |
| b) Postgres Row-Level Security (RLS) com `SET app.business_id` por request | Médio: policies por tabela, middleware, cuidado com pool/conexões persistentes, migrations e testes (sqlite em memória não tem RLS) | Médio                                                    |
| c) Schema por tenant (stancl/tenancy)                                      | Alto: migrations N vezes no pre-deploy (`migrate --force` atual), backups, relatórios cross-tenant                                  | Alto, especialmente com deploy automático na `main`      |
| d) Banco por tenant                                                        | Muito alto                                                                                                                          | Muito alto                                               |

- **Gatilho:** exigência contratual de isolamento físico (cliente enterprise/rede/franquia), requisitos regulatórios, ou um tenant com volume que degrade os demais. Nenhum existe hoje.
- **Recomendação:** ficar em (a). Considerar (b) RLS só se o time crescer e A3 se tornar risco real; nunca (c)/(d) neste estágio.
- **NÃO fazer agora:** stancl/tenancy, schemas, RLS, sharding.

### 6.7 Configuração/branding por oficina

- Próximos campos naturais (migration aditiva em `businesses`): `logo_path` (requer storage persistente — Railway tem FS efêmero → bucket S3/R2), texto de rodapé/condições, validade do orçamento em dias, chave Pix.
- **Gatilho:** pedido de clientes para logo/condições no PDF (provável cedo; é diferencial comercial e candidato a feature de plano).
- **NÃO fazer agora:** temas/cores por oficina na UI, white-label do produto; manter `config/brand.php` só para o produto.

## 7. Recomendações (ordem sugerida)

1. **Agora (baixo custo, alto valor):** completar testes de isolamento (A2); teste "guarda" que percorre `Route::getRoutes()` com `{id}` e garante 404 para recurso de outra oficina.
2. **Agora:** tratar exclusão de conta (A4): esconder/bloquear para o último usuário da oficina ou trocar por "solicitar encerramento" com processo LGPD.
3. **Logo:** `business:create` com `Password::defaults()`, `email_verified_at`, campos opcionais phone/document; comando `business:add-user` (prepara 6.1 sem UI).
4. **Quando houver 2º usuário por oficina:** `users.role` + Policies + `MustVerifyEmail` + tirar `business_id` do fillable.
5. **Quando cobrar:** `businesses.plan` + `active_until` + cobrança manual; gateway só com fila/cron.
6. **Opcional/defesa em profundidade:** FKs compostas `(business_id, customer_id)` em migration nova (A5) — só se houver acesso a dados por outros caminhos (jobs, API, admin).
7. **Adiar explicitamente:** usuário multi-oficina, subdomínio, schema/banco por tenant, RBAC granular, Cashier.

## 8. Testes necessários

- 404 para outra oficina: `GET customers/{id}/edit`, `PUT customers/{id}`, `PUT vehicles/{id}`, `GET estimates/{id}/edit`, `PUT estimates/{id}` (e verificar que o registro não mudou).
- `POST /vehicles` e `PUT /vehicles/{id}` com `customer_id` de outra oficina → erro de validação.
- `customers.index`, `estimates.index` (com e sem `?search=` que casaria com dados da outra oficina) e `dashboard` → só dados próprios.
- Exclusão de conta do último usuário → comportamento definido (A4).
- `business:create` rejeita senha fraca em produção / marca e-mail verificado (se adotado).
- Futuro: guard genérico iterando rotas com parâmetro numérico.

## 9. Riscos e limitações desta análise

- Análise estática + suíte existente; não escrevi testes de penetração nem acessei produção/Railway/.env.
- Custos são estimativas relativas; números de gatilho (10-20 pagantes etc.) são heurísticos, a validar com o negócio.
- Recomendações de gateway brasileiro não foram comparadas em preço/API nesta análise.

## 10. Perguntas para outros agentes

- **Security reviewer:** existe algum caminho (Fortify, 2FA, reset de senha, Inertia shared props `auth.user`) que exponha dados de outra oficina? Confirmar A4 sob ótica LGPD.
- **Test engineer:** viabilidade do teste-guarda por rotas com sqlite em memória.
- **Produto/negócio:** qual o primeiro gatilho provável — funcionário com login (6.1), logo no PDF (6.7) ou cobrança (6.3/6.4)? Isso define a próxima migration.
- **Infra/Railway:** há storage persistente/bucket disponível para logo? Há plano de fila/cron (pré-requisito de faturamento automático)?
