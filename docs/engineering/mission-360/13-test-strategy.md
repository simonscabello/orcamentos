# 13 — Estratégia de testes

## Pirâmide adotada

| Camada                   | Ferramenta                            | Onde                                      | Papel                                                                             |
| ------------------------ | ------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| Feature/HTTP (principal) | Pest + `RefreshDatabase`              | `tests/Feature`                           | Contratos das rotas, validação, isolamento entre oficinas, integridade financeira |
| Unitário                 | Pest                                  | `tests/Unit`                              | `BrazilianFormat` (formatação usada no PDF)                                       |
| Banco real               | mesma suíte com `DB_CONNECTION=pgsql` | CI (passo "Run Tests on PostgreSQL")      | Tamanho de coluna, `lower()`, `ORDER BY`, migrations                              |
| Concorrência             | script com processos paralelos em PG  | `scratchpad/race/` (reproduzível, abaixo) | Prova o lock da edição; não cabe na suíte                                         |
| Front (lógica pura)      | script Node comparando antes/depois   | `scratchpad/fmt/check.ts`                 | `moneyToCents`, `todayIsoDate`                                                    |
| E2E manual               | navegador do app, viewport 375×812    | [07](07-ux-product-review.md)             | Fluxos críticos no celular                                                        |

**Por que não há teste JS automatizado:** o projeto não tem runner de testes de front configurado. Adicionar um (Vitest via `vp test`) é decisão de dependência/estrutura e fica no backlog. A lógica crítica de dinheiro foi validada por script com 23 casos (ver 15).

## Regras

1. Todo endpoint novo ganha um teste de 404 com id de outra oficina (`CLAUDE.md`).
2. Teste de correção deve **falhar sem a correção**. Verificado nesta missão: as falhas antes das correções estão em [15](15-validation-results.md); o teste de ordem foi refeito porque passava sem o `orderBy` (apontado pela R3 e pelo Codex).
3. Dados sintéticos, factories e `Business::factory()` para a "outra oficina".
4. Nada de banco real: sqlite em memória e PostgreSQL descartável (`docker run --rm`).

## Cobertura dos casos pedidos pela missão

| Caso                                            | Teste                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Valores com centavos, totalização               | `EstimateIntegrityTest` (45000 + 12050 + 30001 → editado para 50099 + 1 = 50100), `EstimateTenantTest`                    |
| Arredondamento / formatos de entrada            | Script `check.ts` (23 casos); o servidor só aceita inteiros (`EstimateRequest`)                                           |
| Desconto percentual e fixo                      | **Não existe a funcionalidade** (D4); nada a testar                                                                       |
| Item removido ou editado                        | `EstimateIntegrityTest` › recalculates the total…                                                                         |
| Cliente/veículo inexistente ou de outra oficina | `EstimateTenantTest` (foreign vehicle em create e update)                                                                 |
| Dupla submissão                                 | Front bloqueia (`Button loading`); back sem idempotência — risco aceito, documentado                                      |
| Acesso a orçamento alheio / manipulação de ids  | `EstimateTenantTest`, `EstimateUsabilityTest`, `EstimateIntegrityTest` (edit/update alheio, ids não numéricos e gigantes) |
| Arquivos inválidos                              | Não há upload no sistema                                                                                                  |
| Falha/integridade do PDF                        | `EstimateTenantTest` (content-type, `%PDF`, fonte em subset, < 150 KB); `PdfEstimatePresentationTest`                     |
| Repetição de requisições / edição simultânea    | Script de corrida em PG (30 rodadas × 2 processos × 15 edições)                                                           |
| Perda de conexão ao salvar                      | Front: toast de `networkError` (existente); não automatizado                                                              |
| Sessão expirada no PDF                          | E2E manual no navegador (ver 15)                                                                                          |

## Como rodar

```bash
php artisan test --compact
```

```bash
docker run -d --rm --name orc-pg-lab -e POSTGRES_PASSWORD=app -e POSTGRES_USER=app -e POSTGRES_DB=app -p 127.0.0.1:55432:5432 postgres:17-alpine
```

```bash
DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT=55432 DB_DATABASE=app DB_USERNAME=app DB_PASSWORD=app php artisan test --compact
```

Nunca use a porta 5434 nesta máquina enquanto ela pertencer a outro projeto (T21).

### Script de corrida (edição concorrente)

O `run.sh` faz 30 rodadas. Em cada uma, dois processos PHP chamam `UpdateEstimate` 15 vezes no mesmo orçamento (um com 2 itens, outro com 3). Depois, `check.php` confere se `total = soma(amount)` e se há 2 ou 3 itens. O `boot.php` aborta se o banco não for o de laboratório (porta 55432). Os arquivos estão no scratchpad desta sessão. Para tê-los no repositório, o lugar seria `tests/` com aprovação (evitei criar pasta nova).

## Lacunas conhecidas

- Sem teste automatizado de concorrência na suíte; sem teste JS; sem E2E automatizado (Playwright/Dusk não instalados).
- Hipóteses de iOS (share após `fetch`, ícone SVG) só verificáveis em aparelho.
