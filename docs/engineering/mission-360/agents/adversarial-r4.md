# Revisão adversarial R4 (final): branch `mission-360` + docs/engineering/mission-360

**Veredito: PRONTO COM RESSALVAS.** Nenhum P0/P1/P2 novo. Uma regressão P3 não declarada no front (`moneyToCents`), algumas imprecisões de documentação e pendências que já estão registradas.

## Escopo investigado

- Worktree `orcamentos-mission360`, `efebe2d..7a854cc` (5 commits, 22 arquivos, +421/-16).
- Docs 00, 04, 14, 15, 16 e 17, mais `agents/adversarial-r3.md` e `agents/codex-review.md`, além de verificações pontuais nos docs 05, 06, 11 e 12.
- Somente leitura. O PG de laboratório não foi usado. O `.env` não foi lido. Os experimentos ficaram no scratchpad (`r4/`).

## 1. Verificações executadas (2026-10-19, worktree)

| Comando                                    | Resultado                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `php artisan test --compact` (sqlite)      | **88 passed (377 assertions)**, 4,5 s                                    |
| `npm run types:check`                      | ok (exit 0)                                                              |
| `npm run check`                            | ok: 98 arquivos formatados, 0 lint (inclui os docs não commitados)       |
| `vendor/bin/phpstan analyse --level=0`     | No errors                                                                |
| `vendor/bin/pint --test` (extra)           | passed                                                                   |
| `gh run list --workflow tests.yml` (extra) | 9 runs, todos `failure`; `origin/main` = `efebe2d` (base continua atual) |

Não reexecutado: a suíte em PG ("88/88 em PG"), as medições de índice, a corrida 0/30 e o E2E no navegador. Esses números estão consistentes com as mensagens de commit e com a R3, mas não foram reproduzidos aqui.

## 2. Amostra de afirmações numéricas e de "corrigido" (14 itens)

| #   | Afirmação (doc)                                                                                                                                                                                                   | Evidência                                                                                                              | Veredito                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | 88 testes / 377 asserções (00, 15)                                                                                                                                                                                | execução acima                                                                                                         | CONFIRMADO                                           |
| 2   | 67 → 88 = 21 testes novos                                                                                                                                                                                         | diff de testes: BusinessSettings 2 + CreateBusinessCommand 2 + Integrity 15 (8 do dataset) + Tenant 1 + Profile 1 = 21 | CONFIRMADO                                           |
| 3   | "14 falhas antes" (15)                                                                                                                                                                                            | 6 URLs + status + 2 busca + endereço + 2 e-mail + perfil + PDF = 14                                                    | CONFIRMADO (aritmética)                              |
| 4   | "Teste com 8 URLs → 404" (14 §5)                                                                                                                                                                                  | `tests/Feature/EstimateIntegrityTest.php:97-108`                                                                       | CONFIRMADO                                           |
| 5   | Rotas `[0-9]{1,18}` (16, R3/Codex #5)                                                                                                                                                                             | `routes/web.php:53-57`                                                                                                 | CONFIRMADO                                           |
| 6   | `lockForUpdate` em `UpdateEstimate` (14 §2)                                                                                                                                                                       | `app/Actions/UpdateEstimate.php:15`                                                                                    | CONFIRMADO                                           |
| 7   | `address max:255` (T05)                                                                                                                                                                                           | `app/Http/Requests/BusinessRequest.php:21`; teste com 256/255                                                          | CONFIRMADO                                           |
| 8   | E-mail em minúsculas (T03)                                                                                                                                                                                        | `CreateBusinessCommand.php:26`, `ProfileUpdateRequest.php:16-21`, `config/fortify.php:63`                              | CONFIRMADO                                           |
| 9   | `items()->orderBy('id')` + teste com `PRAGMA reverse_unordered_selects` (T15)                                                                                                                                     | `app/Models/Estimate.php:34`; `EstimateIntegrityTest.php:53-79`                                                        | CONFIRMADO (não reverifiquei a falha sem a correção) |
| 10  | Subsetting + teste `%PDF`/`BaseFont XXXXXX+DejaVuSans`                                                                                                                                                            | `EstimatePdfController.php:20`; `EstimateTenantTest.php:142-154`                                                       | CONFIRMADO                                           |
| 11  | `SearchTerm` com dois padrões e `escape` (T11)                                                                                                                                                                    | `app/Support/SearchTerm.php:15-30`; teste `JOÃO DA SILVA`                                                              | CONFIRMADO                                           |
| 12  | `fetchPdf` usa `reload()` quando há redirect e a resposta não é PDF (T09)                                                                                                                                         | `resources/js/pages/estimates/show.tsx:85-102`                                                                         | CONFIRMADO                                           |
| 13  | Citações arquivo:linha do doc 04 na base `efebe2d` (`CreateBusinessCommand:54`, `fortify:63`, `BusinessRequest:21`, `form.tsx:88`, `show.tsx:84`, `CustomerController:18`, `EstimateController:33`, `User.php:5`) | `git show efebe2d:<arquivo>`                                                                                           | CONFIRMADO (8/8)                                     |
| 14  | `moneyToCents`: "todos os válidos idênticos" / "16 válidas iguais" (14 §9, 15)                                                                                                                                    | Node, base × branch (`r4/cmp.mts`)                                                                                     | **PARCIAL**, ver A1                                  |

Outros: "CI 0 de 9" confere com `gh` (um dos 9 runs é o PR #1 do Dependabot, não um push na main). Os 5 commits e os lotes do doc 14 batem com `git show --stat`; ao lote 5 o doc 14 omite `Customer/EstimateController.php`, o que é irrelevante.

## 3. R2, R3 e Codex: o que foi tratado

- **R2 (17 contestações):** as amostradas estão aplicadas: C0/T22 (04, 12:11), S08/Q2 com `auth.session` (05:35, 12:22), ADR-001 pendente do run verde (11:9), C5/C6 (12:14-15), Q10 (12:26). CONFIRMADO.
- **R3:** #13 (`assign` → `reload`, sem toast): feito. #5 (teste de ordem): feito. #11 ("r$"): feito. #3 (legado com maiúsculas e `unique` sem caixa): registrado como Q10 + DB07. CONFIRMADO.
- **Codex:** #1, #2, #4, #5, #6 e #7 foram corrigidos no código. O #3 (sem teste de concorrência) foi aceito como lacuna e declarado em 16 e 17. CONFIRMADO.
- **Não registrado:** a R3 #11 apontou que "50 reais" e "US$ 10" passaram a virar 0. A correção do lote 5 manteve esse comportamento e ainda o ampliou (A1). O doc 16 só menciona "r$ 50" como resolvido.

## Achados

### A1 — P3: regressão não declarada em `moneyToCents` para valores só de centavos

- **Evidência:** a comparação base × branch (`resources/js/lib/format.ts:32-38`) dá `",50"` 50 → **0** e `".50"` 50 → **0**. Também viraram 0 `"1.2345"` (antes 123) e `"1,234.56"` (antes 123). Esses dois últimos estavam errados antes, então a mudança é desejável. O `onBlur` (`form.tsx:477-483`) reescreve o campo como "0,00" e o servidor recusa por `min:1`. Não grava valor errado, mas a pessoa que digita ",50" vê o campo zerar sem aviso.
- **Impacto:** baixo. "0,50" continua funcionando, e um item de 50 centavos é raro em funilaria.
- **Confiança:** alta (executado).
- **Esforço:** P. Aceitar `^,\d{1,2}$` e `^\.\d{1,2}$`, ou registrar o comportamento.
- **Ação mínima:** corrigir a frase "todos os válidos idênticos" nos docs 14 e 15 e registrar a mudança no 16 (R3 #11) ou no backlog.

### A2 — P4: higiene do teste de ordenação

`EstimateIntegrityTest.php:56-78` liga `PRAGMA reverse_unordered_selects` e só o desliga no fim do teste. Se uma asserção falhar, a conexão sqlite em memória (compartilhada pelo `RefreshDatabase`) continua com o PRAGMA ligado nos testes seguintes, o que pode gerar falhas em cascata enganosas. Use `try/finally` ou `afterEach`. É plausível, não foi reproduzido.

### A3 — P4: imprecisões nos docs

- **00 item 4:** "busca **sem** acento em maiúsculas" deveria ser "**com** acento" (o caso é "JOÃO").
- **00 "Como o trabalho foi feito" e 16:** os dois já afirmam "Quatro revisões (R1–R4)", mas a seção R4 do 16 ainda está vazia ("Ver o relatório anexado… após a execução"). Anexar este relatório antes da entrega.
- **04 T09 "Corrigido, lote 3":** a correção do lote 3 introduziu a regressão do redirect, que só foi resolvida no lote 5. Sugestão: "lote 3 + lote 5".

### A4 — P4: coesão para PR

- Os commits estão bem separados por lote, e o diff não traz arquivos estranhos (`git status` só mostra `?? docs/engineering/`).
- O lote 5 é um commit de ajuste que toca arquivos dos lotes 2 e 3. É aceitável e bem descrito; squash é opcional.
- **A documentação não está commitada.** Se o PR for aberto agora, ela fica de fora. Decida se entra na branch.
- Se entrar, saiba que `agents/codex-review.md` tem links absolutos (`...`), que não funcionam no GitHub e expõem o caminho local. É inofensivo.
- **O PR #1 do Dependabot também altera `tests.yml`.** O `merge-tree` contra a branch é limpo, mas esse PR continuará vermelho até o `mission-360` entrar. Os docs não o mencionam.

## 4. Itens críticos mascarados ou dados sensíveis

- **Credenciais do seeder:** o e-mail e a senha de `DemoSeeder::EMAIL/PASSWORD` **não aparecem** em nenhum arquivo de `docs/engineering/`. A busca foi literal, pelo valor das constantes, que não foi impresso. O doc 07 cita apenas o nome `DemoSeeder`. OK.
- **Outros dados:** nenhum valor de `.env`, `APP_KEY`, URL de banco ou domínio de produção aparece nos docs. Aparecem `app/app` (credenciais do PG descartável de laboratório e do serviço do CI, já públicas no `tests.yml`) e o nome do container de outro projeto (`escalas-louvor-db-1`), que é aceitável.
- **"Validado" sem execução:** os pontos não validados estão declarados no doc 15 ("Não validado") e no 17 ("Limitações"): CI no GitHub, aparelhos reais, collation e mailer de produção, backup. Não encontrei afirmação de validação falsa. Reproduzi aqui os números de sqlite e de lint; os de PG não reproduzi.
- **Regressões conhecidas sem registro:** apenas A1.

## Hipóteses não verificadas

- O teste de ordem falharia sem `orderBy` (o doc afirma que foi verificado; não reexecutei).
- Os números de PG (88/88, 0/30, 23,45 → 0,17 ms) não foram reproduzidos, por restrição do escopo.

## Recomendações (antes de entregar)

1. Corrigir a frase sobre `moneyToCents` nos docs 14 e 15 e registrar A1. Opcionalmente, aceitar ",50".
2. Corrigir "sem acento" no doc 00 e preencher a seção R4 do doc 16.
3. Decidir se `docs/engineering/` entra na branch. Se entrar, trocar os links absolutos do codex-review.
4. (Opcional) Colocar o `PRAGMA` em `try/finally`.
