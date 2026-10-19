# 06 — Revisão de banco de dados (PostgreSQL)

Fonte: [agents/database-specialist.md](agents/database-specialist.md). Todos os experimentos rodaram num **PostgreSQL 17 descartável** (`orc-pg-lab`, `127.0.0.1:55432`), nunca no banco de produção nem no container de outro projeto da porta 5434.

## Esquema e integridade

| Tabela           | Integridade no banco                                                                                | Lacunas                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `businesses`     | PK                                                                                                  | `address varchar(255)` (validação aceitava 500, corrigido)                                                  |
| `users`          | FK `business_id` cascade, `unique(email)`                                                           | unique diferencia maiúsculas (T03)                                                                          |
| `customers`      | FK cascade, índice `(business_id, name)`                                                            | —                                                                                                           |
| `vehicles`       | FKs cascade, índices `(business_id, customer_id)` e `(business_id, plate)`                          | sem índice só em `customer_id` (**adicionado**); placa sem unicidade (D5)                                   |
| `estimates`      | FKs (cliente/veículo `restrict`), `unique(business_id, number)`, índice `(business_id, created_at)` | sem índice em `vehicle_id` (**adicionado**); sem CHECK de status/valores; sem FK composta com `business_id` |
| `estimate_items` | FK cascade                                                                                          | sem índice em `estimate_id` (**adicionado**); sem posição                                                   |

## Transações, locks e concorrência

| Cenário                                                                                         | Resultado medido                                                             | Situação                                           |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| Numeração concorrente (8 processos × 50 criações)                                               | 1..400 sem duplicata, sem buraco, sem erro                                   | OK: `lockForUpdate` na `businesses` + unique       |
| Duas edições simultâneas do mesmo orçamento                                                     | **6/30 rodadas** com total ≠ soma dos itens (ex.: total 4, soma 13, 5 itens) | Corrigido: `lockForUpdate` no orçamento → **0/30** |
| Exclusão em cascata de uma oficina                                                              | funciona no PG                                                               | Não há rota para isso                              |
| Deadlock entre `CreateEstimate` (lock em `businesses`) e `UpdateEstimate` (lock em `estimates`) | Não há ordem cruzada: cada Action trava um único recurso                     | Analisado na R3                                    |

Script reproduzível: `scratchpad/race/run.sh` (descrito em [15-validation-results.md](15-validation-results.md)).

## Índices (lote 4)

Migration aditiva `2026_10_19_131037_add_foreign_key_indexes_to_estimates_tables`. Medido com 50 oficinas, 10 mil clientes/veículos, 50 mil orçamentos e 400 mil itens:

| Consulta                                                | Antes                           | Depois                               |
| ------------------------------------------------------- | ------------------------------- | ------------------------------------ |
| Itens de um orçamento (show/edit/PDF/update)            | Parallel Seq Scan, **23,45 ms** | Bitmap Index Scan, **0,17 ms**       |
| Ficha do cliente (`withCount('estimates')` por veículo) | 2 Seq Scans, **3,17 ms**        | Index Scans, **0,28 ms**             |
| `itemSuggestions` (join itens × orçamentos da oficina)  | Seq Scan, 31,05 ms              | Seq Scan, 30,79 ms — **sem melhora** |

O índice não ajudou as sugestões: o planner prefere o hash join sobre a tabela inteira. Opções para o backlog (DB10): limitar às descrições dos últimos N orçamentos da oficina, ou guardar `business_id` nos itens. Nenhuma das duas foi feita, por falta de medição de volume real.

Em produção, `CREATE INDEX` (não concorrente) bloqueia escritas na tabela durante a criação. Com o volume atual (uma oficina), isso deve levar milissegundos. Se o volume crescer muito antes do deploy, usar `CREATE INDEX CONCURRENTLY` numa migration sem transação.

## Diferenças sqlite (testes) × PostgreSQL (produção)

| Diferença                            | Consequência                           | Mitigação                                        |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------ |
| sqlite ignora o tamanho de `varchar` | T05 passava nos testes                 | CI agora roda a suíte também em PG (lote 1)      |
| `lower()` do sqlite só trata ASCII   | busca com acento se comporta diferente | `mb_strtolower` no PHP; teste com nome acentuado |
| `lockForUpdate` é no-op no sqlite    | concorrência só testável em PG         | script de corrida em PG                          |
| Ordem sem `ORDER BY`                 | ordem dos itens não garantida          | `orderBy('id')`                                  |

## Recomendações não implementadas

| ID   | Sev. | Item                                            | Por que não agora                                                                                                                 |
| ---- | ---- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| DB04 | P4   | CHECK de status e de valores > 0                | A validação da aplicação já cobre; um CHECK pode falhar o deploy se houver dado legado fora da regra (R1 refutou como prioridade) |
| DB05 | P4   | FK composta `(business_id, customer_id)`        | Exige índices únicos compostos e reescrita de FKs publicadas; ganho só defensivo                                                  |
| DB07 | P3   | `unique(lower(email))`                          | Precisa antes conferir os e-mails já gravados em produção                                                                         |
| DB08 | P4   | `latest()` empata em registros do mesmo segundo | Cosmético; ordenar por `id` como desempate quando houver paginação                                                                |
| DB10 | P3   | Consulta de sugestões de itens                  | Ver acima                                                                                                                         |
| DB11 | P3   | Paginação de clientes e orçamentos              | Mudança de UX (scroll infinito); ver backlog                                                                                      |
