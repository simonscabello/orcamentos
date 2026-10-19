# 08 — Revisão de performance

Fonte: [agents/performance-engineer.md](agents/performance-engineer.md) (medições em sqlite com dados sintéticos) e medições desta missão em PostgreSQL 17 (lote 4).

## Baseline medida (sqlite, 200 clientes, 500 orçamentos × 20 itens)

| Página                        | Queries | Mediana     | Payload    |
| ----------------------------- | ------- | ----------- | ---------- |
| Dashboard                     | 3       | 12 ms       | 2,9 KB     |
| Clientes (200)                | 1       | 67 ms       | 36 KB      |
| Orçamentos (500)              | 3       | 250–400 ms  | 213 KB     |
| Orçamentos (2.000)            | 3       | 1,1–1,6 s   | 732 KB     |
| Orçamento show (20/100 itens) | 4       | 20/35 ms    | 5/31 KB    |
| Orçamento edit/create         | 4/2     | 54/46–86 ms | 39/35 KB   |
| PDF (20 itens)                | 5       | ~250 ms     | **859 KB** |

Não há N+1: a contagem de queries não cresce com o volume. Variação de tempo de 30–50% entre execuções; contagens e bytes são confiáveis.

## Melhorias implementadas e medidas

| Item                                           | Antes     | Depois                 | Como medido                                                                                    |
| ---------------------------------------------- | --------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| P-01 Tamanho do PDF (subsetting de fonte)      | 879.772 B | **25.313 B** (−97%)    | `scratchpad/pdf/render.php`, mesmo orçamento de 20 itens; tempo 260 → 225 ms (dentro do ruído) |
| P-01 no navegador                              | —         | 23.354 B               | `fetch` real em `/estimates/1/pdf`                                                             |
| P-04 Itens de um orçamento (PG, 400 mil itens) | 23,45 ms  | **0,17 ms**            | `EXPLAIN ANALYZE`                                                                              |
| P-05 Ficha do cliente (PG)                     | 3,17 ms   | **0,28 ms**            | `EXPLAIN ANALYZE`                                                                              |
| P-06 Sugestões de itens (PG)                   | 31,05 ms  | 30,79 ms (sem melhora) | `EXPLAIN ANALYZE`                                                                              |

O ganho do PDF é o de maior impacto para o usuário: o arquivo enviado pelo WhatsApp cai de ~0,9 MB para ~25 KB, o que também encurta a espera antes do `navigator.share` (UX-H1).

## Abertos (backlog)

| ID   | Sev. | Item                                                                                   | Evidência                                              | Proposta                                                                                                            |
| ---- | ---- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| P-02 | P3   | `/estimates` e `/customers` sem paginação; ~0,42 KB por orçamento no payload           | `EstimateController@index`, `CustomerController@index` | Infinite scroll do Inertia 3 (`Inertia::scroll`) + seleção de colunas. Gatilho: oficina com mais de ~500 orçamentos |
| P-03 | P3   | Formulário de orçamento envia todos os clientes e veículos (35–39 KB com 200 clientes) | `formData()`                                           | Buscar cliente sob demanda (`useHttp`) e veículos do cliente escolhido                                              |
| P-06 | P3   | `itemSuggestions` varre os itens de todas as oficinas                                  | `EXPLAIN` acima                                        | Limitar aos últimos N orçamentos da oficina                                                                         |
| P-07 | P4   | Bundle de entrada ~432 KB bruto / ~134 KB gzip, carregado também no login              | build de 15/09                                         | Avaliar só se houver queixa de carregamento                                                                         |
| P-08 | P4   | Busca `like '%x%'` não usa índice                                                      | —                                                      | `pg_trgm` só se a busca ficar lenta em volume real                                                                  |

Volume real de produção não foi consultado (sem acesso). Toda priorização de P-02/P-03 deve partir desse número.
