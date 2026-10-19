# Database Specialist — relatório

## Escopo investigado

- Migrations de domínio (`database/migrations/0001_01_01_000000_*`, `2026_09_14_00000{1..4}_*`), models, `BelongsToBusiness`, `app/Actions/{Create,Update}Estimate.php`, controllers/FormRequests de clientes, veículos, orçamentos, `CreateBusinessCommand`, regras de e-mail (`app/Concerns/ProfileValidationRules.php`, `config/fortify.php`).
- Execução real em **PostgreSQL 17.11** num container descartável `orc-pg-lab` (127.0.0.1:55432), env sobrescrito na linha de comando, sem tocar `.env`, sem acessar `escalas-louvor-db-1` (5434). Container parado ao final. Repositório não alterado (`git status` só mostra `.omc/`, que já existia).
- Scripts e testes de laboratório: `scratchpad/db/` (`boot.php`, `seed.php`, `create.php`, `update.php`, `tests/LabTest.php`, `pg-suite.txt`, `update-race.txt`).

## Resultado do suite

- sqlite (padrão do `phpunit.xml`): **60 passed (213 assertions)**.
- PostgreSQL 17 (`DB_CONNECTION=pgsql DB_URL= DB_HOST=127.0.0.1 DB_PORT=55432 ...`): **60 passed (213 assertions)**, 6,9 s. As tabelas foram de fato criadas no banco do laboratório (confirmado com `\dt`).
- Ressalva: o suite passa nos dois, mas **não cobre** os comportamentos que divergem entre sqlite e PG (busca com acentos, concorrência). Ver achados.

## Evidências (esquema real no PG)

- Índices existentes: PKs; `customers(business_id,name)`; `vehicles(business_id,customer_id)`, `vehicles(business_id,plate)`; `estimates(business_id,created_at)`, `UNIQUE estimates(business_id,number)`; `users(email) UNIQUE`.
- **Não há índice** em `estimate_items.estimate_id`, `estimates.customer_id`, `estimates.vehicle_id`, `users.business_id`, nem índice que comece por `vehicles.customer_id` (o PostgreSQL não indexa FKs automaticamente).
- **Não há CHECK constraints.** `unsignedInteger`/`unsignedBigInteger` viram `integer`/`bigint` com sinal no PG. Testado: `INSERT` com `status='qualquer'`, `total=-5` e `amount=-100` foi aceito.
- FKs: `estimates.customer_id`/`vehicle_id` são `ON DELETE RESTRICT`; os demais são CASCADE. Apagar uma `business` inteira com orçamentos **funciona** no PG (o cascade não esbarra no RESTRICT). Apagar um cliente com orçamento falha com a FK, como esperado.
- Collation do banco do laboratório: `en_US.utf8` (provider libc). Em produção não verifiquei.

## Achados confirmados

### P2: corrida em `UpdateEstimate` duplica itens e deixa `total` diferente da soma dos itens

- Evidência: `app/Actions/UpdateEstimate.php:12-20`. O orçamento é carregado fora da transação (`EstimateController.php:63`, `:70-73`) e não há `lockForUpdate`. O `$estimate->update()` só emite `UPDATE` (que trava a linha) quando há atributo _dirty_.
- Reprodução determinística em psql: duas transações fazem só `DELETE items` + `INSERT`, sem `UPDATE` no cabeçalho. Resultado: `total=30`, **4 itens, soma 60**. Em READ COMMITTED, o `DELETE` da segunda transação não enxerga os itens recém-inseridos pela primeira.
- Reprodução com o código real (2 processos × 15 updates simultâneos no mesmo orçamento): **6 de 40 rodadas inconsistentes** (ex.: `total=25`, 8 itens, soma 34).
- Quando o cabeçalho muda, o `UPDATE` serializa as transações e não houve inconsistência no teste determinístico.
- Impacto: o PDF entregue ao cliente mostra itens que não batem com o total. Probabilidade baixa: exige dois saves simultâneos do mesmo orçamento, por exemplo duas abas ou duplo envio em que só os itens mudam. O botão usa `form.processing` (`resources/js/pages/estimates/form.tsx:433`), o que atenua o duplo toque.
- Confiança: alta. Esforço: baixo. Correção: dentro da transação, `Estimate::whereKey($id)->lockForUpdate()->firstOrFail()` antes de apagar e recriar os itens.

### P2: e-mail em caixa mista impede o login (`business:create` e edição de perfil)

- Evidência: `config/fortify.php:63` usa `lowercase_usernames => true`, então o Fortify converte o e-mail do login para minúsculas (`CanonicalizeUsername`). Mas `CreateBusinessCommand.php:49-55` grava o e-mail como foi digitado, e `ProfileValidationRules.php:39-49` / `Settings/ProfileController` também não normalizam. A comparação `=` diferencia maiúsculas no PG (e no sqlite).
- Teste de laboratório (`LabTest.php`): o usuário criado com `Joao@Oficina.com` **não autentica** nem em PG nem em sqlite. O controle com e-mail minúsculo autentica.
- Além disso, `unique:users,email` diferencia maiúsculas, então `A@x.com` e `a@x.com` podem coexistir.
- Impacto: uma oficina nova pode ficar sem acesso. Pela mesma lógica, o reset de senha não encontra o usuário (código lido, não testado). Confiança: alta para o comando; alta/plausível para o perfil (mesmo mecanismo, não testado end-to-end). Esforço: baixo. Correção: normalizar com `Str::lower` no comando e no perfil e, opcionalmente, um índice único em `lower(email)` numa migration nova.

### P3: busca `lower(col) like ?` com `strtolower` do PHP falha com acentos e diverge entre sqlite e PG

- Evidência: `CustomerController.php:18`, `EstimateController.php:23`. No PHP 8, `strtolower('JOSÉ')` dá `'josÉ'` (só ASCII). O `lower()` do PG converte `É` para `é`. O `lower()` do sqlite é só ASCII.
- Teste: buscar "JOSÉ" por "José Érico" falha em **PG e sqlite**. Buscar "josé" por "JOSÉ ÉRICO" **passa no PG e falha no sqlite**: divergência real entre o ambiente de teste e a produção.
- Extras: `%` e `_` digitados pelo usuário não são escapados, e "jose" não encontra "José" (sem `unaccent`).
- Correção: `mb_strtolower`, ou `ilike` no PG. Busca sem acento exige `unaccent` ou uma coluna normalizada. Esforço: baixo.

### P3: integridade só na aplicação

- Sem CHECK em `status IN ('draft','sent')`, `total >= 0`, `amount > 0` (comprovado acima). Hoje o `EstimateRequest` protege, mas seeders, tinker e código futuro não passam por ele.
- Nenhuma constraint garante que `estimates.vehicle_id` pertence ao mesmo `customer_id`/`business_id`. Isso só é validado em `EstimateRequest::after()`.
- `VehicleController@update` permite trocar o `customer_id` de um veículo que já tem orçamentos. Os orçamentos antigos passam a apontar para cliente ≠ dono do veículo (lido no código, não testado; pode ser intencional, ex.: veículo vendido).
- Esforço: médio (CHECKs são baratos numa migration nova; FK composta exige `UNIQUE(id, business_id)`).

### P3: índices faltando e listagens sem paginação

- Sem índice em `estimate_items.estimate_id`: toda abertura de orçamento, PDF, `UpdateEstimate::delete` e o cascade fazem varredura sequencial da tabela inteira de itens, que é a que mais cresce. Também faltam `estimates(customer_id)`, `estimates(vehicle_id)` (verificação do RESTRICT e `whereHas`), `vehicles(customer_id)` (`withCount('vehicles')`, `customer->vehicles`) e `users(business_id)`.
- `customers.index` e `estimates.index` fazem `->get()` de tudo da oficina (`CustomerController.php:19`, `EstimateController.php:24`), e `formData()` carrega todos os clientes e veículos. Com `like '%x%'` nenhum índice B-tree ajuda (`pg_trgm` resolveria).
- Impacto: baixo hoje, cresce linearmente. Esforço: baixo (migration nova com índices; `paginate`/`cursorPaginate`).

### P3: diversos

- `0001_01_01_000000_create_users_table.php:50-55`: o `down()` não apaga `businesses`. Um rollback total seguido de `migrate` falha. Não editar (já publicada).
- `latest()` usa `created_at` com `timestamp(0)`: empates no mesmo segundo dão ordem não determinística. Para orçamentos, `orderByDesc('number')` seria estável.

## Pontos verificados e OK

- **Numeração concorrente:** 8 processos × 50 `CreateEstimate` simultâneos no PG resultaram em 400 orçamentos, números 1..400, sem buracos nem duplicatas e 0 erros. O `lockForUpdate` na `businesses` mais o `UNIQUE(business_id, number)` funcionam. No sqlite o lock é no-op, mas a escrita é serializada.
- `max('number')` usa o índice único. `total` em `bigint` comporta 100 × 999.999.999.
- Cascade ao apagar uma `business` funciona no PG.

## Hipóteses não verificadas

- Collation/locale do PG de produção (Railway) pode diferir de `en_US.utf8`; com `C`, `lower()` não converteria acentos. Não acessei produção.
- O lockout por troca de e-mail no perfil e a falha do reset de senha com e-mail em caixa mista seguem do código, mas não foram testados end-to-end.

## Recomendações (em ordem)

1. `UpdateEstimate`: travar o orçamento (`lockForUpdate`) dentro da transação e buscá-lo nela.
2. Normalizar e-mail para minúsculas em `business:create` e no perfil. Avaliar índice único `lower(email)` numa migration nova.
3. Busca: `mb_strtolower` (ou `ilike` só no PG), escapar `%`/`_`, avaliar `unaccent` + `pg_trgm`.
4. Migration nova: índices em `estimate_items(estimate_id)`, `estimates(customer_id)`, `estimates(vehicle_id)`, `vehicles(customer_id)`, `users(business_id)`, e CHECKs de `status`/`total`/`amount`. Se já houver dados em produção, criar índices com `CREATE INDEX CONCURRENTLY` (fora de transação). No volume atual, o comum basta.
5. Paginação nos índices de clientes e orçamentos.
6. Rodar o CI também em PostgreSQL (job com service `postgres:17`): o suite já passa lá.

## Testes necessários

- Feature: buscar "JOSÉ" encontra "José", e "josé" encontra "JOSÉ" (precisa rodar em PG para pegar a divergência).
- Feature: `business:create` com e-mail em caixa mista seguido de login funciona; atualizar o perfil com e-mail em maiúsculas grava em minúsculas.
- Teste de concorrência do update (difícil em sqlite em memória). No mínimo, um teste unitário de que `UpdateEstimate` usa lock, ou um teste em PG com dois processos, como em `scratchpad/db/update.php`.
- Teste de migration: CHECK rejeita `status` inválido e `amount <= 0`.

## Riscos e limitações

- O laboratório é PG 17.11 com locale padrão da imagem; produção pode diferir.
- Volume de dados pequeno: não medi planos (`EXPLAIN`) sob carga. Os achados de índice vêm do catálogo e do conhecimento do planner.
- A corrida do update é probabilística no código real (6/40) e determinística só no cenário sem mudança no cabeçalho.

## Perguntas para outros agentes

- Backend/produto: trocar o cliente de um veículo com orçamentos é intencional (veículo vendido)? Os orçamentos antigos devem manter o cliente original?
- Frontend: o formulário de orçamento bloqueia o reenvio (`processing`) em todos os caminhos, inclusive no Enter do teclado?
- Infra/Railway: qual a collation do banco de produção e a versão exata do PG? Existe CI em PG?
- Segurança: confirmam o impacto do e-mail em caixa mista no fluxo de reset de senha?
