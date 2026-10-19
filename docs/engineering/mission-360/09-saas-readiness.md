# 09 — Prontidão para SaaS

Fonte: [agents/saas-architect.md](agents/saas-architect.md). **Nada desta seção foi implementado.** São opções e gatilhos para decidir depois.

## Ponto de partida

O sistema **já é multi-tenant por coluna**: toda tabela de negócio tem `business_id`, todo acesso usa `forBusiness()` e há testes de 404 entre oficinas. A pergunta não é "como virar multi-tenant", e sim "o que precisa existir quando houver várias oficinas pagantes".

| Dimensão                      | Hoje                                                                | Avaliação                                                                             |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Isolamento de dados           | `business_id` + scope explícito, sem global scope                   | Correto e testado; depende de disciplina (todo endpoint novo precisa do teste de 404) |
| Identidade                    | `User belongsTo Business` (1 oficina por usuário)                   | Suficiente para "um dono, alguns funcionários"                                        |
| Onboarding                    | `php artisan business:create` via shell                             | Ok para poucas oficinas; vira gargalo com dezenas                                     |
| Usuários e papéis             | Sem convite, sem papéis                                             | Primeira lacuna real quando houver funcionário                                        |
| Configuração por oficina      | Dados no PDF (`businesses`); marca do produto em `config/brand.php` | Separação correta                                                                     |
| Planos/limites/cobrança       | Inexistentes                                                        | Adiar                                                                                 |
| Exclusão/portabilidade (LGPD) | Exclusão de conta deixa a oficina órfã (S01)                        | Precisa de regra antes de abrir para terceiros                                        |

## Opções (resumo)

| Tema                       | Opção recomendada quando chegar a hora                                        | Gatilho                                   | Não fazer agora                                                                  |
| -------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| Papéis                     | coluna `users.role` (owner/member) + Policies                                 | 1ª oficina pedindo login para funcionário | RBAC granular, spatie/permission                                                 |
| Usuário em várias oficinas | pivot `business_user` + oficina atual na sessão                               | Contador ou rede pedindo                  | Migrar `users.business_id`                                                       |
| Planos e limites           | `businesses.plan` + `active_until` + `config/plans.php`; checar só na criação | Decisão comercial                         | Tabela de planos, medição de uso, Pennant                                        |
| Cobrança                   | Manual (Pix/boleto) + flag por oficina                                        | ~10–20 pagantes ou >1–2 h/mês de cobrança | Gateway, checkout, bloqueio automático (exigem fila/cron, que não existem)       |
| Roteamento                 | Sessão (como hoje)                                                            | Página pública por oficina → URL assinada | Subdomínio (mexe em `trustProxies`, TLS wildcard, PWA)                           |
| Banco                      | Banco único + `business_id`                                                   | Exigência contratual de isolamento físico | Schema/banco por tenant (inviável com migrations automáticas a cada push)        |
| Defesa em profundidade     | Teste que percorre todas as rotas com id de outra oficina                     | Antes de abrir para terceiros             | RLS no Postgres, global scope (custo alto, ganho marginal com a cobertura atual) |

## Preparação barata e segura (candidatos ao backlog, seção "Preparação para SaaS")

1. Teste genérico que percorre `route:list` e prova 404 para ids de outra oficina (protege endpoints futuros).
2. Regra para o último usuário (S01) e comando `business:add-user`.
3. `business:create` com `Password::defaults()` e e-mail normalizado (este último já feito).
4. Centralizar "oficina atual" num único ponto (`$request->user()->business_id` está espalhado), sem mudar o comportamento. Só vale fazer junto com a primeira feature que precisar.

Ver ADR-004 em [11-architecture-decisions.md](11-architecture-decisions.md).
