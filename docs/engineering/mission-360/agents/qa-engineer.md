# QA Engineer: mapa de testes, lacunas e testes de caracterização

Repositório: `orcamentos` (commit `df32258`, branch `main`). Investigação somente leitura. Os experimentos foram copiados temporariamente para `tests/Feature/LabQa*.php`, rodados por caminho de arquivo e apagados depois. O `git status` final mostra só `?? .omc/`, que já existia antes. Fontes dos experimentos: `scratchpad/qa/LabQaProbeTest.php` e `scratchpad/qa/LabQaLoginTest.php`; saída bruta em `scratchpad/qa/out.txt`.

> Observação sobre o ambiente: durante a execução apareceram arquivos de outros agentes (`tests/Feature/ZzDomainProbeTest.php`, `tests/Feature/LabPerfBaselineTest.php`). Por causa deles, `php artisan test --compact` sem filtro quebrou (`TestCaseAlreadyInUse`). Por isso rodei apenas pelo caminho do arquivo. Esses arquivos não são meus e depois sumiram.

## 1. Escopo investigado

- Rotas: `routes/web.php` e `routes/settings.php`.
- Controllers: `Customer`, `Vehicle`, `Estimate`, `EstimatePdf`, `Business` e `Settings/Profile`.
- FormRequests: `Estimate`, `Customer`, `Vehicle` e `Business`.
- Actions: `CreateEstimate` e `UpdateEstimate`.
- Comando `business:create`, models, migrations, view do PDF, `BrazilianFormat` e `format.ts`.
- Todos os testes em `tests/` (Feature, Auth, Settings, Unit).
- Experimentos executados (28 casos, todos passaram como sondas): amount, 100 itens, edição, validação, busca, paginação, ids, PDF, veículos, oficina e comando.

## 2. Matriz rota/ação × testes existentes × lacunas

Legenda: ✅ coberto · ⚠️ parcial · ❌ sem teste.

| Rota / ação                                              | Testes existentes                                                               | Lacunas                                                                                                                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /`                                                  | ✅ ExampleTest (redirect)                                                       | —                                                                                                                                                                                 |
| `GET /manifest.webmanifest`                              | ✅ BrandTest                                                                    | —                                                                                                                                                                                 |
| `GET /dashboard`                                         | ⚠️ DashboardTest (guest→login, 200)                                             | Não prova que só aparecem os 5 últimos **da própria oficina**                                                                                                                     |
| `GET /customers` (index + busca)                         | ❌                                                                              | Isolamento, busca (nome/telefone, `%`/`_`, acentos), trim, volume sem paginação                                                                                                   |
| `GET /customers/create`                                  | ❌                                                                              | Smoke 200                                                                                                                                                                         |
| `POST /customers`                                        | ✅ EstimateTenantTest (business_id do usuário), FeedbackTest (msg pt-BR, toast) | Ignorar `business_id` enviado no request; `name` > 255; `phone` > 40                                                                                                              |
| `GET /customers/{id}`                                    | ⚠️ 404 de outra oficina                                                         | 200 para a própria oficina com veículos; id não numérico (hoje 500)                                                                                                               |
| `GET /customers/{id}/edit`                               | ❌                                                                              | 404 de outra oficina                                                                                                                                                              |
| `PUT /customers/{id}`                                    | ❌                                                                              | 404 de outra oficina sem alterar dados; sucesso + toast                                                                                                                           |
| `GET /vehicles/create`                                   | ❌                                                                              | `?customer_id` de outra oficina → `selectedCustomerId=null` (verificado)                                                                                                          |
| `POST /vehicles`                                         | ❌                                                                              | Cliente de outra oficina → erro (verificado); placa em maiúsculas; placa vazia → null                                                                                             |
| `GET /vehicles/{id}/edit`                                | ✅ 404 de outra oficina                                                         | —                                                                                                                                                                                 |
| `PUT /vehicles/{id}`                                     | ❌                                                                              | 404 de outra oficina (verificado); troca de dono deixa orçamentos inconsistentes (achado 4)                                                                                       |
| `GET /estimates` (index + busca)                         | ❌                                                                              | Isolamento (inclusive via busca por nome de cliente de outra oficina), `%`/`_`, placa, sem paginação                                                                              |
| `GET /estimates/create`                                  | ❌                                                                              | Só lista clientes e veículos da oficina                                                                                                                                           |
| `POST /estimates`                                        | ✅ total, numeração, centavos, `total` ignorado, veículo de outra oficina       | Veículo de **outro cliente da mesma oficina**; cliente de outra oficina; limites de amount; 0/101 itens; status/data inválidos; `number`/`business_id` injetados; dupla submissão |
| `GET /estimates/{id}`                                    | ✅ 404 de outra oficina; data ISO                                               | —                                                                                                                                                                                 |
| `GET /estimates/{id}/edit`                               | ❌                                                                              | 404 de outra oficina (verificado)                                                                                                                                                 |
| `PUT /estimates/{id}`                                    | ⚠️ só rejeita veículo de outra oficina                                          | **Nenhum teste de update bem-sucedido**: remover itens, recalcular total, manter `number`, ignorar `id`/`estimate_id` nos itens, 404 de outra oficina sem efeito colateral        |
| `GET /estimates/{id}/pdf`                                | ✅ 404 de outra oficina; dono recebe `%PDF`; apresentação da view               | Nome do arquivo `orcamento-001.pdf`; guest → login; escape de HTML; total grande                                                                                                  |
| `GET/PUT /settings/business`                             | ❌ **nenhum**                                                                   | Atualiza só a própria oficina; `address` > 255 (achado 2); mensagens pt-BR                                                                                                        |
| `settings/profile`, `security`, `password`, `appearance` | ✅ ProfileUpdateTest, SecurityTest                                              | Exclusão de conta não testa o efeito sobre a oficina (fora do foco)                                                                                                               |
| Auth (Fortify)                                           | ✅ 7 arquivos (login, reset, verificação, 2FA, registro desabilitado)           | Login com e-mail em maiúsculas criado pelo comando (achado 1)                                                                                                                     |
| `business:create`                                        | ⚠️ 1 caminho feliz                                                              | E-mail duplicado, senha < 8, e-mail inválido, e-mail com maiúsculas, prompt interativo, atomicidade                                                                               |
| `BrazilianFormat`                                        | ✅ Unit                                                                         | —                                                                                                                                                                                 |
| Frontend `moneyToCents` etc.                             | ❌ não há runner JS de testes                                                   | Fora do Pest (só `vp check`/tsc)                                                                                                                                                  |

## 3. Evidências (arquivo:linha) e resultados dos experimentos

### Amount (`app/Http/Requests/EstimateRequest.php:28`, regra `integer|min:1|max:999999999`)

| Entrada                                                               | Resultado                                                        |
| --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `'100'`, `100.0`, `' 100 '`, `'+100'`                                 | Aceito, total 100                                                |
| `true`                                                                | **Aceito como 1** (só alcançável via JSON ou requisição forjada) |
| `'1.5'`, `1.5`, `'1e3'`, `'1,50'`, `'0100'`, `'0x10'`, `'abc'`, `[1]` | "Informe um valor válido para o item."                           |
| `0`, `-1`                                                             | "O valor do item deve ser maior que zero."                       |
| `1000000000`                                                          | "O valor do item é muito alto."                                  |
| `'99999999999999999999'`                                              | Duas mensagens (inválido e muito alto)                           |
| `null`                                                                | "Informe o valor do item."                                       |

### Overflow

- Migrations: `estimates.total` é `unsignedBigInteger` (`database/migrations/2026_09_14_000003_create_estimates_table.php`). `estimate_items.amount` também é `unsignedBigInteger` (`..._000004_...`).
- No PostgreSQL isso vira `bigint`, cujo teto é 9,2e18. O pior caso, 100 × 999.999.999 = 99.999.999.900, está ~1e8 vezes abaixo desse teto. **Não há overflow de 32 bits.**
- Experimento: total 99999999900 gravado com 100 itens, PDF 200 com `R$ 999.999.999,00`. 101 itens → "O orçamento não pode ter mais de 100 itens."
- `estimates.number` é `unsignedInteger` (int4 no PG). Só estoura com 2,1 bilhões de orçamentos, irrelevante.
- `BrazilianFormat::formatCurrency` usa `intdiv`, sem float. O front divide por 100 em float, o que é exato até 2^53.

### Edição (`app/Actions/UpdateEstimate.php:12-19`)

- Update com 1 item onde havia 3: sobram 1 item e total 250.
- `number` continua 1 mesmo com `number=999`, `total=5` e `business_id` estrangeiro no payload.
- `id` e `estimate_id` injetados nos itens são ignorados: o item recriado tem id novo e o item do orçamento estrangeiro fica intacto.
- `items=[]` → erro de validação e itens preservados.

### Veículo e cliente (`EstimateRequest.php:32-45`)

- Veículo de outro cliente da mesma oficina → "O veículo deve pertencer ao cliente selecionado."
- Cliente de outra oficina → "Selecione um cliente válido."

### Status

- `approved`, `DRAFT` e `['draft']` → "Selecione um status válido."
- `''` → "Informe o status." (vem de `lang/pt_BR`).

### Data (`EstimateRequest.php:21`, regra `date`)

- Rejeitados: `2026-02-30`, `abc`, `tomorrow`, `14/09/2026`, `2026-13-01` e `0000-00-00`.
- **Aceitos:** `9999-12-31`, `2026-09-14T23:30:00-03:00` e `2026-09-14 23:59:59`.
- No sqlite a string bruta é gravada; a serialização sai `2026-09-14`. No PG a coluna `date` trunca.

### Busca (`CustomerController.php:17-19`, `EstimateController.php:20-23`)

- `%` e `_` retornam **tudo**: são curingas não escapados. Não vaza dados de outra oficina; o escopo vem antes.
- Placa (`xyz`, `abc1234`) encontra o orçamento.
- `'` e `\` → 200 sem resultados. Não há SQLi: a busca usa bindings.
- Não houve vazamento quando um cliente de outra oficina com nome igual existia.

### Acentos (só sqlite)

- Com o nome `JOSÉ`, a busca `JOSÉ` acha e `josé` não acha.
- Motivo: `strtolower` do PHP e `lower()` do sqlite só tratam ASCII.
- No PostgreSQL `lower()` é Unicode, então o comportamento se **inverte**: `josé` acharia e `JOSÉ` (convertido para `josÉ`) não acharia. Isso não foi verificado em PG.

### Paginação

- **Não existe.** `->get()` em `CustomerController.php:19` e `EstimateController.php:23`.
- `?page=2` com 121 clientes e 120 orçamentos devolve tudo.
- `formData()` (`EstimateController.php:72-80`) carrega **todos** os clientes e veículos no create e no edit.
- Dashboard: `take(5)`.

### IDs e PDF

- `/estimates/abc`, `/estimates/abc/pdf`, `/customers/abc`, `/vehicles/abc/edit` e `/estimates/99999999999999999999` → **500**. É `TypeError` do parâmetro `int $id`, porque não há `whereNumber`.
- `/estimates/1.5`, `/-1` e `/customers/0` → 404.
- Orçamento de outra oficina: `edit`, `put` e `pdf` → 404, sem alterar os dados.
- Visitante não logado → 302 `/login`.
- `Content-Disposition: attachment; filename=orcamento-001.pdf`.
- HTML em descrição e observações sai escapado no PDF: a view usa `{{ }}` (`resources/views/pdf/estimate.blade.php:36-85`).

### Oficina (`BusinessRequest.php`)

- `address` com 400 caracteres passa na validação (`max:500`), mas a coluna é `string` = varchar(255) (`database/migrations/0001_01_01_000000_create_users_table.php`, tabela `businesses`).
- Um `id` de outra oficina no payload não altera a outra oficina.

### Veículo

- Placa `abc-1234` é gravada como `ABC-1234`.
- Trocar o `customer_id` do veículo deixa o orçamento existente com o cliente antigo e um veículo de outro dono.

### Comando (`app/Console/Commands/CreateBusinessCommand.php:26-37`)

- E-mail duplicado e exato: falha.
- `A@EXAMPLE.COM` depois de `a@example.com`: **cria um segundo usuário e uma segunda oficina**.
- Senha com 7 caracteres: falha. `12345678` (8 caracteres): **aceita**, sem `Password::defaults()`.
- E-mail inválido: falha, sem criar oficina, então é atômico.
- Prompt interativo da senha: funciona.
- **Experimento extra:** comando com `Joao@Example.com` grava o e-mail com maiúsculas, e o login com o mesmo e-mail falha. O motivo é `config/fortify.php:63` `lowercase_usernames => true`.

### Outros

- `verified` é praticamente inócuo: um usuário não verificado acessa `/estimates` com 200, porque `User` não implementa `MustVerifyEmail` (`app/Models/User.php`, import comentado).
- O CI (`.github/workflows/tests.yml`) não sobe PostgreSQL; os testes rodam em sqlite `:memory:` (`phpunit.xml:26-27`).

## 4. Achados confirmados

| #   | Achado                                                                                                                                                                                                               | Sev.                      | Impacto                                                                                   | Confiança                                               | Esforço                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| 1   | `business:create` com e-mail contendo maiúsculas gera um usuário que **não consegue logar**: Fortify minúscula o login e o comando não normaliza. A unicidade do e-mail também é sensível a maiúsculas e minúsculas. | P2                        | Onboarding quebra silenciosamente; oficina duplicada                                      | Alta (reproduzido)                                      | Baixo (`Str::lower` no comando + teste)    |
| 2   | `BusinessRequest` aceita `address` até 500 caracteres, mas a coluna tem 255. No PG isso vira `QueryException` → 500 ao salvar as configurações.                                                                      | P2                        | Erro 500 para a oficina com endereço longo                                                | Alta pela leitura do schema; não reproduzível em sqlite | Baixo (`max:255` ou nova migration `text`) |
| 3   | Rotas com `{id}` não numérico ou gigante → **500** (`TypeError`) em vez de 404.                                                                                                                                      | P3                        | Ruído em log e página de erro; não vaza dados                                             | Alta (reproduzido)                                      | Baixo (`->whereNumber(...)`)               |
| 4   | Trocar o dono de um veículo deixa orçamentos antigos com cliente ≠ dono do veículo. Depois disso, editar esse orçamento falha na validação `after()` até o usuário trocar o veículo.                                 | P3                        | Inconsistência no PDF e na edição                                                         | Alta (reproduzido)                                      | Médio (decisão de produto)                 |
| 5   | Busca não escapa `%` e `_`; `%` lista tudo.                                                                                                                                                                          | P3                        | Só UX, dentro do próprio tenant                                                           | Alta                                                    | Baixo                                      |
| 6   | Sem paginação em clientes e orçamentos. Os formulários de orçamento carregam todos os clientes e veículos.                                                                                                           | P3 (hoje) / P2 com volume | Payload Inertia cresce linearmente                                                        | Alta                                                    | Médio                                      |
| 7   | `business:create` aceita senha de 8 caracteres em produção, ignorando `Password::defaults()` (12 caracteres, mixed case etc. em `AppServiceProvider`).                                                               | P3                        | Senha fraca para o primeiro usuário                                                       | Alta                                                    | Baixo                                      |
| 8   | `amount: true` é aceito como 1 centavo; a data aceita `9999-12-31` e datetime com fuso.                                                                                                                              | P3                        | Só por payload forjado; dado estranho                                                     | Alta                                                    | Baixo                                      |
| 9   | Dupla submissão cria 2 orçamentos (nº 1 e nº 2), sem idempotência.                                                                                                                                                   | P3                        | Duplicata em toque duplo no celular (o front pode já desabilitar o botão: não verificado) | Alta no backend                                         | Médio                                      |
| 10  | Middleware `verified` é inócuo (User sem `MustVerifyEmail`).                                                                                                                                                         | P3/informativo            | Nenhum hoje (sem cadastro público)                                                        | Alta                                                    | —                                          |

**Não são bugs (confirmado):**

- Overflow de total: bigint suporta com folga.
- Injeção de `total`, `number`, `business_id`, `id` e `estimate_id` é ignorada.
- PDF, edit e update de outra oficina → 404.
- XSS no PDF é escapado.
- Status e datas impossíveis são rejeitados.
- Os limites de amount funcionam.

## 5. Hipóteses não verificadas

- **H1.** No PostgreSQL, a busca com maiúscula acentuada (`JOSÉ`) não acha registros, porque `strtolower` é ASCII-only e o `lower()` do PG é Unicode. Verificar com PG local (`docker compose`, porta 5434) ou trocar para `mb_strtolower`/`ilike`.
- **H2.** Concorrência na numeração: `lockForUpdate` é no-op em sqlite. Em PG o lock da `businesses` serializa, e o `unique(business_id, number)` é a rede de segurança. Não testável em sqlite.
- **H3.** Datetime com fuso (`2026-09-14T23:30:00-03:00`) em PG grava `2026-09-14`; com outro offset pode mudar de dia. Baixa relevância, porque o front envia `Y-m-d`.
- **H4.** O front já impede dupla submissão (`processing`)? Não inspecionei os `.tsx`.

## 6. Recomendações

1. Normalizar o e-mail para minúsculas no `business:create`. Considerar também o update de perfil, onde Fortify `lowercase_usernames` vale só para login e registro.
2. Alinhar `address`: `max:255` no request ou nova migration `text`. Nunca editar a migration publicada.
3. `Route::...->whereNumber(...)` nos parâmetros `{customer}`, `{vehicle}` e `{estimate}`.
4. Escapar `%`, `_` e `\` na busca, e usar `mb_strtolower` ou `ilike` para acentos.
5. Paginar os índices (`paginate`/infinite scroll do Inertia v3) e trocar os selects de cliente/veículo por busca assíncrona quando o volume crescer.
6. Considerar um job de CI com PostgreSQL para pegar as classes de bug 2 e H1.
7. Decidir a regra de produto para a troca de dono do veículo: bloquear se houver orçamentos, ou aceitar.

## 7. Testes necessários: caracterização priorizada

Convenção: Pest, `tests/Feature`, helpers `tenantVehicle`/`tenantData` de `EstimateTenantTest.php`, `User::factory()`, `assertSessionHasErrors([...msg pt-BR])`.

### Prioridade 1: regressão de regras críticas (multi-tenant e dinheiro)

1. **`it('updates an estimate replacing all items and recalculating the total')`**
    - Arquivo: `tests/Feature/EstimateUpdateTest.php`.
    - Arrange: orçamento criado via POST com 3 itens (100/200/300).
    - Act: PUT com 1 item (`B`, 250) e `number=999`, `total=5`.
    - Assert: redirect para `/estimates/{id}`, `items()->count()===1`, `total===250`, `number===1`, toast "Orçamento atualizado com sucesso.".
2. **`it('ignores item ids and estimate_id supplied on update')`**
    - Arquivo: `EstimateUpdateTest.php`.
    - Arrange: orçamento A (dono) e B (outra oficina, 1 item).
    - Act: PUT A com `items[0][estimate_id]=B.id` e `items[0][id]=<id antigo>`.
    - Assert: o item novo pertence a A com id diferente do antigo, e B continua com 1 item.
3. **`it('returns 404 and keeps data when editing or updating another business estimate')`**
    - Arquivo: `EstimateTenantTest.php`.
    - Act: GET `/edit` e PUT com payload válido do usuário.
    - Assert: 404 nos dois casos, e `customer_id` e `total` do orçamento estrangeiro inalterados.
4. **`it('rejects a vehicle that belongs to another customer of the same business')`**
    - Arquivo: `EstimateTenantTest.php`.
    - Arrange: c1 com v1, c2 na mesma oficina.
    - Act: POST com `customer_id=c2` e `vehicle_id=v1`.
    - Assert: erro `vehicle_id` "O veículo deve pertencer ao cliente selecionado." e `Estimate::count()===0`.
5. **`it('rejects a customer from another business')`**
    - Assert: erro `customer_id` "Selecione um cliente válido.".
6. **`it('validates item amounts', fn ($amount, $message) => …)->with([...])`**
    - Arquivo: `tests/Feature/EstimateValidationTest.php`.
    - Dataset de rejeição: `0`, `-1` → "maior que zero"; `1000000000` → "muito alto"; `'1.5'`, `1.5`, `'1e3'`, `'1,50'`, `'abc'` → "Informe um valor válido para o item."; `null` → "Informe o valor do item.".
    - Teste irmão de aceitação: `999999999` e `'100'` aceitos, com total igual.
7. **`it('stores the maximum estimate total without overflow')`**
    - Arrange: 100 itens × 999999999.
    - Assert: `total===99999999900`, PDF 200 e a view contém `R$ 999.999.999,00`.
    - Junto: 101 itens → "O orçamento não pode ter mais de 100 itens.". Itens vazios → "Adicione pelo menos um item.".
8. **`it('rejects invalid status and dates')`**
    - Dataset status: `approved`, `DRAFT`, `['draft']` → "Selecione um status válido.".
    - Dataset data: `2026-02-30`, `14/09/2026`, `abc` → "Informe uma data válida.".
9. **`it('lists only the business own customers and estimates, including when searching')`**
    - Arquivo: `tests/Feature/SearchTest.php`.
    - Arrange: cliente "Maria" em cada oficina, com 1 orçamento cada.
    - Act: GET `/customers?search=maria` e `/estimates?search=maria`.
    - Assert: Inertia `has('customers', 1)` e `has('estimates', 1)` com o id próprio.
10. **`it('only shows the own business latest five estimates on the dashboard')`**
    - Arquivo: `DashboardTest.php`.
    - Arrange: 6 orçamentos próprios e 1 de outra oficina.
    - Assert: `has('estimates', 5)` e nenhum id estrangeiro.
11. **`it('updates only the authenticated business settings')`**
    - Arquivo: `tests/Feature/BusinessSettingsTest.php`.
    - Act: PUT `/settings/business` com `name` e `id` de outra oficina.
    - Assert: a própria oficina foi atualizada, a outra não, e o toast "Configurações salvas com sucesso." aparece. Hoje não há nenhum teste dessa rota.
12. **Isolamento de clientes e veículos.** Arquivo: `EstimateTenantTest.php`.
    - `it('returns 404 for editing or updating another business customer')`.
    - `it('returns 404 when updating another business vehicle')`.
    - `it('rejects creating a vehicle for another business customer')`: erro "Selecione um cliente válido.".
    - `it('ignores a foreign customer_id preselection on vehicle create')`: `selectedCustomerId` null.

### Prioridade 2: comando e bugs confirmados (testes que falham hoje: escrever junto com a correção)

13. **`it('rejects duplicate email, short password and invalid email without creating a business')`**
    - Arquivo: `CreateBusinessCommandTest.php`.
    - Assert: `assertFailed()` e `Business::count()` inalterado.
14. **`it('normalizes the email so the created user can log in')`** (falha hoje)
    - Act: comando com `Joao@Example.com`, depois POST `/login` com o mesmo e-mail.
    - Assert: `assertAuthenticated()`. Junto: `A@EXAMPLE.COM` após `a@example.com` → `assertFailed()`.
15. **`it('rejects a business address longer than the column')`** (falha hoje)
    - Act: PUT `/settings/business` com `address` de 256 caracteres.
    - Assert: `assertSessionHasErrors('address')`. Escolher entre essa expectativa e uma migration nova.
16. **`it('returns 404 for non numeric ids')`** (falha hoje: 500)
    - Dataset: `/estimates/abc`, `/estimates/abc/pdf`, `/customers/abc`, `/vehicles/abc/edit`.

### Prioridade 3: caracterização de comportamento atual (documentam e travam decisões)

17. **`it('treats percent and underscore literally in search')`**: falha hoje. Cliente "50% OFF" e "Maria"; `search=%` → espera 0 (hoje 2).
18. **`it('finds estimates by vehicle plate case-insensitively')`**: `search=abc1234` acha a placa `ABC1234`.
19. **`it('creates two estimates on double submission')`**: caracteriza a ausência de idempotência (números 1 e 2).
20. **`it('downloads the pdf with a padded file name')`**: header `content-disposition` contém `orcamento-001.pdf`.
21. **`it('escapes html in pdf items and notes')`**: a view contém `&lt;script&gt;` e não contém `<img`.
22. **`it('uppercases the plate and nulls an empty plate')`**: POST `/vehicles` com `abc-1234` grava `ABC-1234`; `''` grava null.
23. **`it('keeps estimates customer when a vehicle changes owner')`**: caracteriza o achado 4 até haver decisão de produto.
24. **`it('returns every customer without pagination')`**: só se quiser travar o comportamento atual. Melhor substituir quando a paginação for implementada.

## 8. Riscos e limitações

- Todos os experimentos rodaram em **sqlite**, não em PG. Os achados 2 e H1 dependem do PostgreSQL e foram inferidos pelo schema ou pelas funções.
- Não inspecionei o frontend (`.tsx`) além de `format.ts`, então a proteção contra dupla submissão no front não foi verificada.
- Não rodei a suíte completa sem filtro, por interferência de arquivos temporários de outros agentes. O resultado do baseline completo não foi coletado.
- Concorrência real (numeração) não é testável em sqlite `:memory:`.

## 9. Perguntas para outros agentes

- **Segurança:** o 500 por `TypeError` em ids não numéricos expõe stack trace em produção (`APP_DEBUG`)? A exclusão de conta (`profile.destroy`) pode deixar uma oficina sem usuários: isso é aceitável?
- **Backend / arquitetura:** qual a regra desejada para trocar o dono de um veículo com orçamentos? Paginação: usar `paginate()` ou infinite scroll do Inertia v3?
- **DevOps:** vale adicionar um serviço PostgreSQL ao `tests.yml` para pegar divergências entre sqlite e PG (varchar(255), `lower()` Unicode)?
- **Frontend:** o formulário de orçamento desabilita o botão durante `processing`? `moneyToCents` tem limite antes de 999999999 centavos?
