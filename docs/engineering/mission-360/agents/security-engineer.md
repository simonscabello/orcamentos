# Relatório — Security Engineer (Orçamentos/Tratto)

Data: 2026-10-19 · Commit analisado: `df32258` (main) · Modo: somente leitura + testes experimentais temporários.

## Escopo investigado

- Todas as rotas de aplicação (`php artisan route:list --except-vendor`, 28) e de vendor (Fortify, storage local, Boost, Inertia DevTools, `/up`).
- Fortify: `config/fortify.php`, `FortifyServiceProvider` (views, rate limiters), 2FA, reset de senha, verificação de e-mail.
- Isolamento multi-tenant (IDOR) em todos os controllers, regras `exists`, validação cruzada veículo/cliente, mass assignment (`$fillable`).
- Exclusão de conta (`ProfileController@destroy`) e efeito sobre a oficina.
- Props compartilhadas (`HandleInertiaRequests`), Blade (`app.blade.php`, `pdf/estimate.blade.php`), sinks de XSS no React.
- Headers de segurança, sessão/cookies, `trustProxies`, `storage/{path}`, service worker, gating de ferramentas de dev.
- Experimentos: 17 testes Pest em `scratchpad/sec/LabSecProbeTest.php`, copiados para `tests/Feature/LabSecProbeTest.php`, executados (17 passed, 114 assertions) e apagados. `git status` após: apenas `?? .omc/` e `?? tests/Feature/LabPerfBaselineTest.php` (este último **não** é meu; provavelmente de outro agente).

## Evidências (arquivo:linha)

| #   | Evidência                                                                                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | `app/Http/Controllers/Settings/ProfileController.php:311-325` (dump) — `destroy` apaga só o `User`; nada com a `Business`.                                                                                                        |
| E2  | `database/migrations/0001_01_01_000000_create_users_table.php:26` — `users.business_id ... cascadeOnDelete()` (cascata só no sentido Business→User).                                                                              |
| E3  | `resources/js/components/delete-user.tsx:32-33,50-51` — UI promete: “Orçamentos, clientes e veículos serão apagados permanentemente”.                                                                                             |
| E4  | `app/Models/User.php:370` — `// use Illuminate\Contracts\Auth\MustVerifyEmail;` comentado; classe não implementa `MustVerifyEmail` ⇒ middleware `verified` é no-op.                                                               |
| E5  | `app/Http/Controllers/Settings/ProfileController.php` `update` — troca de e-mail sem senha atual; zera `email_verified_at`, mas isso não bloqueia nada (E4).                                                                      |
| E6  | `lang/pt_BR/passwords.php` `'user' => 'Não encontramos uma conta com este e-mail.'` + Fortify `password.email` sem throttle de rota (`vendor/laravel/fortify/routes/routes.php:37-45` só aplica limiter a login/2FA/verificação). |
| E7  | `bootstrap/app.php` `trustProxies(at: '*')` + `FortifyServiceProvider.php:139-143` (chave do throttle de login = `email                                                                                                           | ip`). |
| E8  | Nenhum middleware de headers de segurança em `bootstrap/app.php`; teste confirmou ausência de `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` em `/login`. |
| E9  | `app/Http/Middleware/HandleInertiaRequests.php:735-737` — `'auth' => ['user' => $request->user()]` (model inteiro serializado).                                                                                                   |
| E10 | `app/Console/Commands/CreateBusinessCommand.php:612` — senha `min:8`, ignora `Password::defaults()` (produção exige 12+, símbolos, uncompromised: `AppServiceProvider.php:46-54`).                                                |
| E11 | `app/Http/Controllers/Settings/SecurityController.php:366-375` — troca de senha não invalida outras sessões nem rotaciona `remember_token`.                                                                                       |
| E12 | `app/Http/Controllers/VehicleController.php:1012-1020` — `update` permite trocar `customer_id` de veículo já usado em orçamentos.                                                                                                 |
| E13 | `resources/views/app.blade.php` — `const appearance = '{{ $appearance ?? "system" }}';` com cookie `appearance` não criptografado (`bootstrap/app.php` `encryptCookies(except: ['appearance', ...])`).                            |
| E14 | `routes/settings.php` — `DELETE settings/profile` sem `throttle`; `PUT settings/password` com `throttle:6,1`.                                                                                                                     |
| E15 | `config/filesystems.php:33-39` — disco `local` com `'serve' => true` (rotas `storage/{path}` GET/PUT).                                                                                                                            |

## Achados confirmados

### F1 — Exclusão do único usuário deixa a oficina e todos os dados de clientes órfãos (contrariando a UI) — **P1**

- **Comprovado** (teste P1): após `DELETE /settings/profile` do único usuário, `Business`, `customers`, `vehicles`, `estimates` permanecem; nenhum usuário consegue mais acessá-los (sem cadastro público).
- **Impacto:** a UI afirma exclusão permanente de orçamentos/clientes/veículos (E3) — promessa falsa ao titular; dados pessoais de terceiros (nome/telefone de clientes, placas) retidos indefinidamente sem dono ⇒ risco LGPD (direito de eliminação, art. 18) e de confiança. Em oficinas com 2+ usuários, um usuário apagar a conta não deve apagar a oficina — precisa de regra explícita.
- **Confiança:** alta. **Esforço:** baixo-médio (decidir regra: se for o último usuário, apagar `Business` em transação — a cascata em E2 já remove users/customers/vehicles/estimates; checar `restrictOnDelete` de `estimates.customer_id/vehicle_id`, que pode bloquear a cascata dependendo da ordem — **testar em PostgreSQL**, não só sqlite; ou ajustar o texto da UI).

### F2 — Enumeração de contas via “Esqueci minha senha” — **P2**

- **Comprovado** (teste P2): e-mail inexistente ⇒ erro “Não encontramos uma conta com este e-mail.”; existente ⇒ sucesso.
- Sem throttle de rota (teste P3: 20 requisições seguidas sem 429); o broker só limita 60s **por usuário existente** (`config/auth.php:100`).
- **Impacto:** permite descobrir e-mails de oficinas clientes (alvos para phishing/credential stuffing). Combina com F3.
- **Confiança:** alta. **Esforço:** baixo (responder sempre a mensagem genérica de `sent` e adicionar `throttle` à rota `password.email`, ex.: limiter por IP).

### F3 — Throttle de login depende do IP derivado de `X-Forwarded-For` — **P2 (condicional)**

- **Comprovado localmente** (teste P4): com `trustProxies('*')`, após 5 falhas com `X-Forwarded-For: 10.0.0.1` vem 429; trocando para `10.0.0.2` a mesma conta volta a aceitar tentativas.
- **Em produção é hipótese:** `'*'` no Laravel confia apenas no `REMOTE_ADDR` imediato; se o proxy do Railway _anexa_ o IP real ao XFF, o valor mais à direita é o IP real e o spoof não funciona. Se o app for alcançável sem o proxy, ou se houver dois saltos de proxy, o throttle por conta vira ilimitado (rotação de IP falso) ou colapsa todos os usuários num IP.
- **Mitigação independente do proxy:** adicionar um segundo limite só por e-mail (ex.: `Limit::perMinute(5)->by(email|ip)` + `Limit::perHour(20)->by(email)`). **Não remover** `trustProxies` (regra crítica do projeto).
- **Confiança:** média. **Esforço:** baixo.

### F4 — Verificação de e-mail inoperante; troca de e-mail sem senha — **P2**

- **Comprovado** (testes P7/P8): usuário não verificado acessa `/dashboard` e `/customers`; `PATCH /settings/profile` troca o e-mail sem pedir senha atual e o usuário continua com acesso total.
- **Impacto:** quem sequestra uma sessão (dispositivo compartilhado na oficina, cookie roubado) troca o e-mail para um seu e depois usa “Esqueci minha senha” ⇒ **tomada persistente da conta** sem conhecer a senha. Também anula o propósito do middleware `verified` usado em todas as rotas de negócio.
- **Confiança:** alta. **Esforço:** baixo-médio (exigir `current_password` na troca de e-mail ou `password.confirm`; implementar `MustVerifyEmail` exige MAIL configurado em produção — ver perguntas).

### F5 — Ausência total de headers de segurança — **P3**

- **Comprovado** (teste P5). Sem `X-Frame-Options`/`frame-ancestors` (clickjacking das telas de configurações), sem HSTS, sem `nosniff`, sem `Referrer-Policy`, sem CSP.
- **Impacto:** baixo hoje (React escapa saída; ações destrutivas pedem senha), mas é defesa em profundidade barata. **Esforço:** baixo (middleware no grupo `web`; HSTS só em produção; CSP precisa contemplar Vite/inline script do tema — começar em `Report-Only`).

### F6 — Senha fraca permitida pelo `business:create` — **P3**

- E10: `min:8` ignora a política forte de produção. O primeiro usuário de cada oficina (o dono) pode nascer com senha de 8 caracteres comprometida. **Esforço:** trivial (`Password::defaults()`).

### F7 — Troca de senha não encerra outras sessões — **P3**

- Comprovado parcialmente (teste P15: `remember_token` inalterado; nenhum `logoutOtherDevices`). Se a senha foi trocada por suspeita de comprometimento, sessões do invasor seguem válidas (sessões `database`, 120 min, + cookie “lembrar-me”). **Esforço:** baixo (`Auth::logoutOtherDevices()` / apagar linhas de `sessions` do usuário).

### F8 — `DELETE /settings/profile` sem rate limit — **P3**

- Comprovado (teste P16: 15 senhas erradas sem 429). Permite força bruta da senha atual a partir de sessão sequestrada (o `PUT settings/password` tem `throttle:6,1`, este não). **Esforço:** trivial.

### F9 — Integridade: reatribuir veículo a outro cliente deixa orçamentos inconsistentes — **P3 (integridade, não IDOR)**

- Comprovado (teste P11): orçamento fica com `customer_id` = cliente antigo e `vehicle_id` de um veículo agora de outro cliente (mesma oficina). PDF passaria a mostrar cliente A com veículo de B. Não cruza tenant.

### F10 — Props compartilhadas serializam o `User` inteiro, incluindo relações carregadas — **P3 (risco latente)**

- Comprovado (teste P6): `auth.user` expõe `id, business_id, name, email, email_verified_at, two_factor_confirmed_at, created_at, updated_at` e, no dashboard, **`business`** inteiro (porque a closure faz `request()->user()->business`, que fica em cache na relação). Campos sensíveis (`password`, `two_factor_*`, `remember_token`) estão `#[Hidden]` e não vazam. Hoje só expõe dados da própria oficina; o risco é futuro (qualquer relação carregada no user vaza para todas as páginas). Recomenda-se whitelist (`$request->user()?->only(['id','name','email'])`).

## Controles verificados e OK (comprovados por teste ou leitura)

- **IDOR:** todas as rotas `show/edit/update/pdf` de customers/vehicles/estimates usam `forBusiness(...)->findOrFail` (teste P9 + `EstimateTenantTest`). `customers.edit`, `customers.update`, `vehicles.update`, `estimates.edit` cross-tenant ⇒ 404; `estimates.update` com veículo estrangeiro ⇒ falha de validação, total inalterado.
- **`exists` com escopo:** `VehicleRequest`/`EstimateRequest` filtram por `business_id`; `after()` valida veículo↔cliente. `vehicles/create?customer_id=<estrangeiro>` zera seleção; listas de form só da oficina.
- **Mass assignment:** `business_id`, `number`, `total`, `items.*.estimate_id/id` no payload são ignorados (teste P10); `BusinessController` atualiza só a oficina do usuário; `profile.update` não aceita `business_id`.
- **PDF:** todo conteúdo com `{{ }}` (escapado); teste P12 confirmou que `<img>`, `<script>`, `<link>` e `<a href=file://>` saem como entidades. Gerado em memória, nada em disco.
- **Cookie `appearance` no inline script (E13):** `{{ }}` converte `'` em `&#039;` e `<` em `&lt;`, sem quebra do contexto (teste P14). Pior caso: `\` causa erro de sintaxe no script de tema (self-DoS cosmético, requer injeção de cookie).
- **React:** único `dangerouslySetInnerHTML` é o SVG do QR code do Fortify (gerado no servidor). Links usam IDs numéricos e `tel:` saneado.
- **Fortify:** registro desabilitado (teste existente); login `5/min` por `email|ip`; 2FA com `confirm` + `confirmPassword`, limiter por `login.id`; rotas `user/two-factor-*` exigem `password.confirm`; verificação de e-mail `throttle 6,1`; Fortify regenera a sessão no login.
- **Sessão/cookies:** driver `database`, `http_only=true`, `same_site=lax`; `secure` não setado, mas `Response::prepare` aplica `setSecureDefault(true)` quando a requisição é HTTPS (depende de `trustProxies`, que está presente). CSRF via middleware padrão (cookie `XSRF-TOKEN` + Inertia).
- **Ferramentas de dev:** Boost só com `APP_ENV=local` ou `debug=true`; Inertia DevTools só em `local` (`DevTools::enabled()`); `laravel/boost` em `require-dev`. `docs/railway.md` define `APP_DEBUG=false`, `APP_ENV=production`.
- **`storage/{path}`:** GET e PUT sem assinatura ⇒ 403 (teste P13).
- **Service worker:** não faz cache (só `skipWaiting/claim`).

## Hipóteses não verificadas

- H1: comportamento real do `X-Forwarded-For` no edge do Railway (F3). Verificar com um endpoint temporário/log de `request()->ip()` em staging — não acessei produção por regra.
- H2: `SESSION_SECURE_COOKIE`, `SESSION_ENCRYPT`, `APP_DEBUG` reais em produção (não li `.env` nem variáveis do Railway).
- H3: cascata `Business` delete em PostgreSQL com `estimates.customer_id/vehicle_id restrictOnDelete` — a ordem das cascatas pode gerar erro de FK; precisa de teste em pgsql antes de implementar F1.
- H4: e-mail transacional em produção — `.railway/railway.ts` não lista variáveis `MAIL_*`; se `MAIL_MAILER=log`, “Esqueci minha senha” não funciona (e F4 com `MustVerifyEmail` travaria usuários).
- H5: DoS autenticado via geração de PDF sem throttle (100 itens × 255 chars + 4000 chars de notas) — provavelmente barato, não medido.
- H6: listas sem paginação (`customers.index`, `estimates.index`, `formData`) — exposição/performance, não segurança cruzada.

## Recomendações (ordem sugerida)

1. **F1:** definir a regra de exclusão (último usuário ⇒ apagar a oficina e dados, em transação; ou bloquear e orientar) e alinhar o texto da UI. Teste: único usuário apaga ⇒ `Business` e dados somem; com 2 usuários ⇒ oficina permanece.
2. **F4:** exigir senha atual (ou `password.confirm`) para trocar e-mail; decidir se implementa `MustVerifyEmail` (depende de H4).
3. **F2:** mensagem genérica no reset + `throttle` na rota `password.email` (ex.: `Fortify` limiter customizado por IP).
4. **F3:** limite adicional por e-mail no limiter `login`, mantendo `trustProxies('*')`.
5. **F7/F8:** `logoutOtherDevices` na troca de senha; `throttle:6,1` em `DELETE settings/profile`.
6. **F5:** middleware de headers (XFO/frame-ancestors, nosniff, Referrer-Policy, HSTS em produção, CSP em report-only).
7. **F6, F10, F9:** `Password::defaults()` no comando; whitelist de `auth.user`; impedir troca de cliente de veículo com orçamentos (ou documentar).

## Testes necessários (para quem implementar)

- `ProfileDeletionTest`: último usuário ⇒ oficina e dados apagados (rodar também em pgsql); não-último ⇒ oficina intacta; senha errada ⇒ erro; throttle 429 na 7ª tentativa.
- `PasswordResetTest`: e-mail inexistente ⇒ mesma resposta que existente; 429 após N por IP.
- `AuthenticationTest`: 429 por e-mail mesmo variando `X-Forwarded-For`.
- `ProfileUpdateTest`: troca de e-mail sem `current_password` ⇒ erro.
- `SecurityTest`: após troca de senha, outra sessão do usuário é invalidada.
- `SecurityHeadersTest`: headers presentes em resposta HTML.
- `CreateBusinessCommandTest`: senha fraca rejeitada em produção.
- Shared props: `auth.user` não contém `business` nem campos fora da whitelist.

## Riscos e limitações

- Testes rodaram em sqlite em memória com `APP_ENV=testing`; comportamento de proxy, cookies `secure` e FKs do PostgreSQL não foram exercitados.
- Não acessei produção/Railway nem `.env` (regra do papel). Configuração real de sessão/mail é inferida de `docs/railway.md` e `.railway/railway.ts`.
- Frontend revisado por grep de sinks (não auditoria linha a linha de todos os `.tsx`).
- Arquivo `tests/Feature/LabPerfBaselineTest.php` apareceu como não rastreado durante a sessão — não foi criado por mim; o orquestrador deve garantir a remoção pelo agente dono.

## Perguntas para outros agentes

- **Produto/PO:** qual é a regra desejada quando o último usuário apaga a conta? Haverá múltiplos usuários por oficina com papéis (dono vs funcionário)? Hoje qualquer usuário edita os dados da oficina e apagaria tudo.
- **DevOps/Railway:** o edge anexa ou sobrescreve `X-Forwarded-For`? Quantos saltos de proxy? `MAIL_*` está configurado? `SESSION_SECURE_COOKIE`/`SESSION_ENCRYPT` definidos?
- **Backend/QA:** a cascata `businesses → estimates` com `restrictOnDelete` em `customer_id/vehicle_id` funciona em PostgreSQL sem erro de FK?
- **Frontend:** a CSP proposta é compatível com o inline script de tema e com o Vite em produção (precisa de nonce via `Vite::useCspNonce()`)?
