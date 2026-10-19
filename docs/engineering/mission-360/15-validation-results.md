# 15 — Resultados de validação

Todas as execuções foram em 2026-10-19, nesta máquina (PHP 8.5.4, Node 24.22.0), com PostgreSQL 17 descartável em `127.0.0.1:55432`. Nenhum teste tocou produção.

## Baseline

| Verificação             | `df32258` (local)           | `efebe2d` (produção)                                            |
| ----------------------- | --------------------------- | --------------------------------------------------------------- |
| Pest (sqlite)           | 60 passed / 213 assertions  | 67 passed / 289                                                 |
| Pest (PostgreSQL)       | 60 passed (agente de banco) | 67 passed                                                       |
| Pint / PHPStan L0 / tsc | ok / ok / ok                | ok / ok / ok                                                    |
| `npm run check`         | **falha** (formatação)      | **falha** (`.railway/railway.ts`, `docs/railway.md`)            |
| CI no GitHub            | —                           | **falha** em 9/9 execuções (`SQLSTATE[08006]`, run 37167447342) |

## Testes que falhavam antes das correções

Rodados contra o código de `efebe2d` com os testes novos já escritos: **14 falhas**, todas nos casos que a missão corrige. Os testes de caracterização passaram, porque confirmam o comportamento que já estava certo.

| Teste                                       | Falha antes                     |
| ------------------------------------------- | ------------------------------- |
| ids não numéricos (6 URLs)                  | `Expected 404 but received 500` |
| status volta ao orçamento sem Referer       | redirect para `/`               |
| busca com acento em maiúsculas              | 0 resultados                    |
| `%`/`_` como texto                          | `%` listava todos               |
| endereço com 256 caracteres                 | sem erro de validação           |
| e-mail com maiúsculas no comando (2 testes) | login falha / 2ª oficina criada |
| e-mail em minúsculas no perfil              | gravado como digitado           |
| PDF com fonte em subset                     | 879 KB > 150 KB                 |

O teste de ordem dos itens, refeito no lote 5, foi conferido removendo o `orderBy('id')`: ele falha sem a correção.

## Estado final (`4d0718e`)

| Verificação                                                  | Resultado                                    |
| ------------------------------------------------------------ | -------------------------------------------- |
| `php artisan test --compact` (sqlite)                        | **88 passed (377 assertions)**               |
| Mesma suíte em PostgreSQL 17                                 | **88 passed (377 assertions)**               |
| `vendor/bin/pint --dirty`                                    | passed                                       |
| `phpstan analyse --level=0`                                  | No errors                                    |
| `npm run types:check`                                        | ok                                           |
| `npm run check` (vp: lint + format)                          | ok (código); docs formatados antes do commit |
| `npm run build`                                              | ok                                           |
| Migration: `migrate` → `rollback --step=1` → `migrate` em PG | ok                                           |

## Experimentos

| Experimento                                    | Antes                                 | Depois                                                                                |
| ---------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| Corrida de edição (30 rodadas, 2 × 15 updates) | 6/30 inconsistentes                   | **0/30**                                                                              |
| R3: 12 creates + 12 updates paralelos          | —                                     | sem deadlock, números únicos                                                          |
| PDF, 20 itens (bytes)                          | 879.772                               | **25.313**                                                                            |
| PDF, tempo de geração                          | 260 ms                                | 225 ms (ruído)                                                                        |
| Itens de um orçamento, 400 mil itens (PG)      | 23,45 ms                              | **0,17 ms**                                                                           |
| Ficha do cliente (PG)                          | 3,17 ms                               | **0,28 ms**                                                                           |
| Sugestões de itens (PG)                        | 31,05 ms                              | 30,79 ms (sem ganho)                                                                  |
| `moneyToCents`, 28 entradas                    | 7 malformadas viravam valores errados | 19 iguais; 7 malformadas → 0; "50 reais" e "US$ 10" → 0 (antes 5000/1000; deliberado) |
| Data padrão às 22h30 BRT                       | 2026-10-20                            | **2026-10-19**                                                                        |

## E2E no navegador (Chrome do app, 375×812 e desktop)

| Fluxo                                            | Resultado                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| Login → dashboard → novo orçamento (mobile)      | ok, data local                                                    |
| Item com "-10,00"                                | total R$ 0,00 (antes R$ 10,00)                                    |
| `fetch` do PDF com sessão                        | `application/pdf`, 23.354 B                                       |
| `fetch` sem sessão                               | 200 + HTML do login com `redirected` (o sinal que o código trata) |
| Sessão apagada no banco → "Baixar PDF" → login → | **volta para o orçamento #001**                                   |

## Não validado

- Primeiro run verde do CI no GitHub (exige push).
- iPhone/Safari e Android reais (share, ícone, teclado).
- Volume e collation do PostgreSQL de produção (`lower()` com acento depende do locale; no laboratório funcionou).
- Mailer de produção (S06) e proxy da Railway (S04).

## Comandos para reproduzir

```bash
cd ../orcamentos-mission360 && php artisan test --compact
```

```bash
cd ../orcamentos-mission360 && DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT=55432 DB_DATABASE=app DB_USERNAME=app DB_PASSWORD=app php artisan test --compact
```

```bash
cd ../orcamentos-mission360 && npm run types:check && npm run check && npm run build
```
