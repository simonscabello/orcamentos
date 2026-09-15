# Guia do sistema para agentes de IA

Referência técnica do **Orçamentos**, um SaaS mobile-first para oficinas mecânicas criarem orçamentos e gerarem PDF. Leia este arquivo antes de alterar o código. As regras gerais de Laravel/Inertia/Pest estão em `CLAUDE.md` / `AGENTS.md`.

## Visão geral

- **Domínio:** uma oficina (`Business`) tem usuários, clientes, veículos e orçamentos. O usuário cadastra cliente → veículo do cliente → orçamento com itens → baixa/compartilha o PDF.
- **Público:** usuários brasileiros em celular (375–430px). Toda a interface, mensagens de validação, toasts e PDF estão em **português do Brasil**.
- **Stack:** Laravel 13, PHP 8.5, PostgreSQL 17, Inertia 3, React 19, TypeScript, Tailwind 4, Vite+ (`vp`), Wayfinder, Fortify, Pest 5, DomPDF.

## Multi-tenant (regra mais importante)

Todo dado de negócio pertence a um `business_id`. **Nunca** busque `Customer`, `Vehicle` ou `Estimate` sem filtrar pela oficina do usuário logado.

- Os models com tenant usam o trait `App\Models\Concerns\BelongsToBusiness`, que fornece `business()` e o scope `forBusiness($businessOrId)`.
- Controllers **não** usam route model binding. Eles recebem `int $id` e buscam com escopo, o que retorna 404 para registros de outra oficina:

  ```php
  Customer::forBusiness($request->user()->business_id)->findOrFail($customer);
  ```

- Em `store`, o `business_id` vem sempre do usuário, nunca do request: `[...$request->validated(), 'business_id' => $request->user()->business_id]`.
- Regras `exists` de FormRequest também filtram por oficina: `Rule::exists('customers', 'id')->where('business_id', $this->user()->business_id)`.
- `EstimateItem` não tem `business_id`; ele é isolado pelo `Estimate` pai.
- Não existe global scope: o isolamento é explícito. Todo endpoint novo precisa de um teste que prove 404 para dados de outra oficina (veja `tests/Feature/EstimateTenantTest.php`).

## Modelo de dados

| Tabela | Colunas principais | Observações |
|---|---|---|
| `businesses` | `name`, `owner_name`, `phone`, `document`, `address` | Criada na migration de `users`. `document` é CPF ou CNPJ. |
| `users` | `business_id`, `name`, `email`, `password`, colunas 2FA | Todo usuário pertence a uma oficina. |
| `customers` | `business_id`, `name`, `phone?` | |
| `vehicles` | `business_id`, `customer_id`, `model`, `plate?`, `color?` | Placa salva em maiúsculas pelo controller. |
| `estimates` | `business_id`, `customer_id`, `vehicle_id`, `number`, `status`, `notes?`, `total`, `date` | `unique(business_id, number)`. Cliente/veículo com `restrictOnDelete`. |
| `estimate_items` | `estimate_id`, `description`, `amount` | Cascade ao apagar o orçamento. |

Relações: `Business` hasMany `users`, `customers`, `estimates`; `Customer` hasMany `vehicles`, `estimates`; `Vehicle` belongsTo `customer`; `Estimate` belongsTo `customer`, `vehicle` e hasMany `items`.

## Regras de negócio

- **Dinheiro é inteiro em centavos** (`total`, `amount`). Nunca use float. O frontend converte com `moneyToCents` / `centsToInput` (`resources/js/lib/format.ts`) e envia centavos.
- **O total é sempre calculado no servidor** como soma de `items.*.amount`. Não aceite `total` vindo do request.
- **Numeração:** `number` é sequencial por oficina. `App\Actions\CreateEstimate` trava a linha da `Business` (`lockForUpdate`) dentro de uma transação, pega `max(number) + 1` e cria o orçamento com os itens.
- **Edição:** `App\Actions\UpdateEstimate` recalcula o total, apaga todos os itens e recria (não há update item a item).
- **Status:** apenas `draft` ou `sent`.
- **Validação do orçamento** (`EstimateRequest`): de 1 a 100 itens, `amount` inteiro entre 1 e 999999999, e o veículo precisa pertencer ao cliente selecionado (validação em `after()`).
- **Sem exclusão:** as rotas de clientes, veículos e orçamentos não têm `destroy`. Não adicione sem pedido explícito.
- **Cadastro público desabilitado:** não existe `/register` (há teste garantindo). Oficinas e o primeiro usuário são criados por:

  ```bash
  php artisan business:create --name="Oficina" --owner="Nome" --email="email@exemplo.com" --password="senha-segura"
  ```

## Rotas

Definidas em `routes/web.php` e `routes/settings.php`. Todas as rotas de negócio usam `auth` + `verified`.

| Rota | Controller | Página Inertia |
|---|---|---|
| `GET /` | redirect para `/dashboard` | |
| `GET /dashboard` | closure em `web.php` | `dashboard` (últimos 5 orçamentos) |
| `/customers` (resource, sem destroy) | `CustomerController` | `customers/index`, `customers/show`, `customers/form` |
| `/vehicles` (create, store, edit, update) | `VehicleController` | `vehicles/form` (redireciona para o cliente) |
| `/estimates` (resource, sem destroy) | `EstimateController` | `estimates/index`, `estimates/show`, `estimates/form` |
| `GET /estimates/{id}/pdf` | `EstimatePdfController` | download `orcamento-001.pdf` |
| `GET/PUT /settings/business` | `BusinessController` | `business/edit` |
| `/settings/profile`, `/settings/security`, `/settings/appearance` | `Settings\*` | `settings/*` |

As buscas (`?search=`) em clientes e orçamentos usam `lower(coluna) like ?` sobre nome, telefone e placa.

Atalhos por veículo (botões na ficha do cliente):

- `GET /estimates/create?vehicle_id=` (ou `?customer_id=`) pré-seleciona cliente/veículo no formulário. Sem esses parâmetros nada vem selecionado — o usuário escolhe o cliente.
- `GET /estimates?vehicle_id=` filtra a listagem pelos orçamentos daquele veículo. IDs fora da oficina são ignorados.

## Backend: convenções

- **Controllers** finos: validação em `app/Http/Requests`, lógica transacional em `app/Actions` (método `handle`).
- **Feedback:** após salvar, use flash toast do Inertia e redirecione por rota nomeada:

  ```php
  Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente salvo com sucesso.']);
  return to_route('customers.show', $customer);
  ```

  O frontend exibe com o hook `use-flash-toast` (sonner).
- **Mensagens de validação** em português dentro de `messages()` do FormRequest; traduções padrão em `lang/pt_BR`.
- **Formatação brasileira no PHP:** `App\Support\BrazilianFormat` (telefone, CPF, CNPJ, documento, moeda `R$ 1.234,56`, data `d/m/Y`). Usado principalmente no PDF.
- **Autenticação:** Fortify (login, reset de senha, verificação de e-mail, 2FA). As views são páginas Inertia configuradas em `FortifyServiceProvider`.
- **Produção:** `AppServiceProvider` força HTTPS, proíbe comandos destrutivos no banco e exige senhas fortes. `bootstrap/app.php` confia em todos os proxies (`trustProxies(at: '*')`), o que é necessário atrás do proxy do Railway. Não remova isso: sem essa configuração os assets passam a ser gerados com `http://` e a página fica em branco por *mixed content*.

## PDF

- `EstimatePdfController` carrega o orçamento com escopo de oficina e renderiza `resources/views/pdf/estimate.blade.php` com DomPDF em A4.
- A view usa CSS inline e fonte `DejaVu Sans` (necessária para acentos). O DomPDF suporta apenas CSS limitado: evite flex/grid, use tabelas.
- O PDF é gerado na hora e **não é salvo** em disco (o filesystem do Railway é efêmero).
- Os testes de apresentação estão em `tests/Feature/PdfEstimatePresentationTest.php`.

## Frontend

- **Páginas:** `resources/js/pages/<recurso>/<pagina>.tsx`; o nome passado a `Inertia::render()` corresponde ao caminho.
- **Formulários de criar/editar** compartilham um único `form.tsx` que recebe o registro opcional (`customer`, `vehicle`, `estimate`).
- **Rotas no frontend:** use Wayfinder, importando de `@/actions/...` ou `@/routes/...`. Não escreva URLs fixas. Os arquivos em `resources/js/actions`, `resources/js/routes` e `resources/js/wayfinder` são **gerados**: não edite à mão.
- **UI:** componentes shadcn/Radix em `resources/js/components/ui`, ícones `lucide-react`, toasts `sonner`, layouts em `resources/js/layouts` (`mobile-shell.tsx` para navegação mobile).
- **Formatação:** `resources/js/lib/format.ts` (`formatCurrency`, `formatDate`, `moneyToCents`, `centsToInput`). Datas `Y-m-d` são formatadas em UTC para não mudar de dia.
- **PWA:** `public/manifest.webmanifest` e `public/sw.js` (registrado em `app.tsx`). O service worker **não** faz cache de páginas autenticadas; mantenha assim.
- Priorize mobile: alvos de toque grandes e layout em uma coluna. Checklist manual em `docs/manual-test.md`.

## Ambiente local

Requisitos: PHP 8.5, Composer, Node 24+, Docker.

```bash
cp .env.example .env
docker compose up -d        # PostgreSQL 17 em localhost:5434 (db/user/senha: app)
composer install
npm install
php artisan key:generate
php artisan migrate
php artisan business:create
composer run dev
```

Acesse `http://localhost:8000`. Se o frontend não refletir mudanças, rode `npm run build` ou `composer run dev`.

## Qualidade e testes

```bash
vendor/bin/pint --dirty --format agent   # formatação PHP (obrigatório após editar PHP)
npm run check                            # lint/format do frontend (vp check)
npm run types:check                      # TypeScript
composer types:check                     # PHPStan/Larastan
php artisan test --compact               # Pest
```

- Testes com Pest em `tests/Feature` e `tests/Unit`. Crie com `php artisan make:test --pest NomeTest`.
- Os testes usam factories (`Business`, `Customer`, `User`, `Vehicle`). A `UserFactory` já cria uma oficina.
- Comportamento novo precisa de teste, incluindo isolamento entre oficinas.
- O CI (`.github/workflows/tests.yml`) roda `composer setup` e `composer ci:check` a cada push/PR na `main`.

## Deploy

- **Automático:** o Railway está ligado ao repositório GitHub. **Todo push na `main` dispara build e deploy em produção.** Não faça push na `main` sem os testes passando.
- Build com Railpack (sem Dockerfile). Antes de liberar tráfego, roda `php artisan migrate --force` (pre-deploy). Healthcheck em `/up`.
- Infraestrutura descrita em `.railway/railway.ts`: serviço `app` + PostgreSQL. Detalhes e variáveis de ambiente em `docs/railway.md`.
- Migrations rodam sozinhas em produção: elas precisam ser seguras para dados existentes. Nunca edite uma migration que já foi para produção; crie uma nova.
- Não há fila, cron, worker nem uploads persistentes.
