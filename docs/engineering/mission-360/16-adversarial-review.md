# 16 — Revisões adversariais

Quatro revisões, cada uma feita por um agente com o papel `adversarial-reviewer` (`.claude/agents/adversarial-reviewer.md`), em contexto isolado e sem acesso às conclusões que deveria defender. Duas revisões independentes do **Codex CLI** complementaram R1 e R3.

| Revisão | Momento                      | Objeto                                                 | Resultado                                                                                                    |
| ------- | ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| R1      | Após o reconhecimento        | 25 achados consolidados + código de produção `efebe2d` | 19 confirmados, 2 parciais, 1 refutado como prioridade, 3 inconclusivos; 6 achados novos no código do origin |
| R2      | Após auditoria e arquitetura | docs 04–12                                             | 17 contestações (6 médias/altas), todas aceitas e aplicadas                                                  |
| R3      | Após a implementação         | diff `efebe2d..fcb654f`                                | 9 aprovadas, 4 com ressalva, 0 reprovadas; + Codex: 7 achados                                                |
| R4      | Antes da entrega             | branch e documentação finais                           | ver seção R4                                                                                                 |

## R1 — Reconhecimento

**O ponto de partida estava errado.** Os 9 agentes da Fase 1 leram o checkout local (`df32258`), que estava **5 commits atrás** de `origin/main` (produção). O arquiteto percebeu; a R1 revalidou tudo contra `efebe2d`.

Recalibrações de severidade (o que os agentes propuseram → o que ficou):

| Achado                       | Proposto | R1                         | Motivo                                                     |
| ---------------------------- | -------- | -------------------------- | ---------------------------------------------------------- |
| CI quebrado                  | P1       | P2                         | Grave para o processo, mas não afeta o usuário diretamente |
| Exclusão do último usuário   | P1       | P2 (depois P3 na R2)       | Exige senha, não vaza dados, 1 usuário                     |
| PDF de 880 KB                | P1       | P2                         | Lento, mas funciona                                        |
| Edição concorrente           | P2       | P3                         | Um usuário por oficina; botão bloqueia o duplo clique      |
| Data em UTC, `moneyToCents`  | P2       | P3                         | O total aparece ao vivo, o que permite notar o erro        |
| CHECK constraints            | P3       | Refutado como prioridade   | A validação na aplicação já cobre                          |
| Status "Enviado" inacessível | P1/P2    | **Já corrigido no origin** | `PATCH /status` em `efebe2d`                               |

Achados novos da R1 no código do origin: subconsulta `withCount('estimates')` sem índice (N1), `itemSuggestions` varrendo itens de todas as oficinas (N2), `back()` no status sem Referer (N3), "enviado" marcado ao resolver o share (N5). Isolamento de `duplicate`, `status` e `vehicle_id` provado (N4).

Recomendações refutadas por exagero: RLS, global scope, `REPEATABLE READ` no PDF, CHECK constraints imediatas, paginação imediata.

## R2 — Auditoria e arquitetura

Contestações aceitas e o que mudou:

| #      | Contestação                                                                        | Ação                                                       |
| ------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1      | Backup/restore do Postgres de produção ausente de todos os docs                    | Novo T22 e item **C0** no topo do backlog                  |
| 2      | `logoutOtherDevices()` não faz nada sem o middleware `auth.session`                | Q2 e S08 corrigidos                                        |
| 3      | Condição do spoof de XFF (S04) estava invertida                                    | S04 reescrito                                              |
| 4      | Ordem do backlog: segurança antes de observabilidade não faz sentido com 1 oficina | Ordem revista (E5 antes de Q1–Q4)                          |
| 5, 11  | T03 e S01 superestimados para o cenário real                                       | T03 → P3; S01 → P3; C2/C4 viraram Q9/Q10                   |
| 6      | Mailer de produção é "provável `log`", não só possível                             | S06 marcado como provável                                  |
| 7      | ADR-002 descartava o lock otimista com premissa falsa (`updated_at` já existe)     | ADR corrigido; registrada a perda silenciosa               |
| 8      | ADR-001 "Aceita" sem nenhum run no GitHub                                          | Status "pendente do primeiro run verde"                    |
| 9      | Critério do C1 só testável quebrando produção                                      | Aceite trocado por configuração visível + deploy observado |
| 10     | Contradição ADR-007 × doc 06 sobre a cascata                                       | Alinhado ao teste em PG                                    |
| 12, 13 | Critérios de E1/E5 não verificáveis como escritos                                  | E1 fail-closed; E5 com monitor externo                     |
| 14     | UX-H1 e T21 fora do backlog                                                        | C5 e C6                                                    |
| 15–17  | Contagem de status, links para docs ainda inexistentes, Q4 dependente de rede      | Corrigidos                                                 |

## R3 — Implementação (adversarial + Codex)

| Mudança                  | R3                                                                  | Codex                                                       | Resolução                                                                               |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| CI com Postgres          | Aprovada c/ ressalva (falta run no GitHub)                          | —                                                           | Pendente de push                                                                        |
| Lock no `UpdateEstimate` | Aprovada (sem deadlock com 12+12 paralelos)                         | P2: "teste não prova a concorrência"                        | **Aceito como lacuna**: a prova é o script de corrida em PG (13); não cabe na suíte     |
| E-mail minúsculo         | Aprovada c/ ressalva (registros antigos, unique sem caixa)          | —                                                           | Q10 + DB07 no backlog                                                                   |
| `address max:255`        | Aprovada                                                            | —                                                           | —                                                                                       |
| `orderBy('id')`          | **Teste não prova**                                                 | Idem                                                        | Teste refeito com `PRAGMA reverse_unordered_selects`; falha sem a correção (verificado) |
| `SearchTerm`             | Aprovada                                                            | **P3: regressão no sqlite** para nome gravado em maiúsculas | Corrigido: dois padrões (`mb_strtolower` + `strtolower`) + teste                        |
| Rotas numéricas          | Aprovada                                                            | P3: id com 19 dígitos → 500                                 | Corrigido: `[0-9]{1,18}` + teste                                                        |
| Subsetting do PDF        | Aprovada                                                            | P3: teste só mede tamanho                                   | Teste confere `%PDF` e `/BaseFont /XXXXXX+DejaVuSans`                                   |
| `moneyToCents`           | Aprovada c/ ressalva ("r$ 50" → 0)                                  | P2: `10,,50` → R$ 10,00                                     | Corrigido: só formatos válidos; aceita `r$`                                             |
| PDF com sessão expirada  | **Regressão**: depois do login, o Fortify mandava para a URL do PDF | P2, mesmo achado                                            | Corrigido com `location.reload()`; **validado no navegador**                            |
| Índices                  | Aprovada                                                            | —                                                           | —                                                                                       |

Duas revisões independentes chegaram ao mesmo defeito (redirect pós-login para o PDF) por caminhos diferentes: a R3 lendo o Inertia, o Codex lendo o Fortify. O lote 5 (`7a854cc`) existe por causa da R3.

## R4 — Antes da entrega

**Veredito:** pronto com ressalvas. Sem P0/P1/P2 novos. Suíte, tsc, `vp check`, PHPStan e Pint verdes. 14 afirmações dos docs amostradas, 13 conferem.

| Problema                                                                                                             | Sev. | Resolução                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| `",50"` e `".50"` (antes 50 centavos) passaram a virar 0 com a validação do lote 5                                   | P3   | Corrigido em `4d0718e`; 28 entradas recomparadas                                                                       |
| "50 reais" / "US$ 10" agora → 0, sem registro nos docs                                                               | P3   | Mantido como mudança deliberada e registrado em 14/15                                                                  |
| `PRAGMA` do teste de ordem poderia vazar se a asserção falhasse                                                      | P4   | `try/finally` em `4d0718e`                                                                                             |
| Doc 00 dizia "sem acento"; doc 04 não citava a regressão do lote 3 resolvida no lote 5; seção R4 vazia               | P4   | Corrigidos                                                                                                             |
| `docs/engineering` não commitado; links absolutos no relatório do Codex; PR do Dependabot também mexe em `tests.yml` | P4   | Docs commitados; caminhos tornados relativos; Dependabot registrado em 17 (o merge entre os dois é limpo segundo a R4) |

Nenhum dado sensível encontrado nos docs (busca pelos valores do seeder e do `.env`, sem imprimi-los).

Relatório completo: [agents/adversarial-r4.md](agents/adversarial-r4.md). Os relatórios R1–R3 e a revisão do Codex também estão em [agents/](agents/).
