# 14 — Log de implementação

Branch `mission-360` (worktree `../orcamentos-mission360`), criada de `origin/main` `efebe2d`. **Nada foi enviado ao GitHub nem à Railway.** Cada lote é um commit.

| Commit    | Lote               | Arquivos                                                                                                                                                                                                                                                                                                                                    |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `b616ee1` | 1 — CI             | `.github/workflows/tests.yml`, `vite.config.ts`, `docs/railway.md`                                                                                                                                                                                                                                                                          |
| `eae48e2` | 2 — Backend        | `routes/web.php`, `app/Actions/UpdateEstimate.php`, `app/Models/Estimate.php`, `app/Http/Requests/BusinessRequest.php`, `app/Http/Requests/Settings/ProfileUpdateRequest.php`, `app/Console/Commands/CreateBusinessCommand.php`, `app/Http/Controllers/{Customer,Estimate,EstimatePdf}Controller.php`, `app/Support/SearchTerm.php`, testes |
| `8afda86` | 3 — Front          | `resources/js/lib/format.ts`, `resources/js/pages/estimates/{form,show}.tsx`                                                                                                                                                                                                                                                                |
| `fcb654f` | 4 — Índices        | `database/migrations/2026_10_19_131037_add_foreign_key_indexes_to_estimates_tables.php`                                                                                                                                                                                                                                                     |
| `7a854cc` | 5 — Ajustes pós-R3 | `show.tsx`, `format.ts`, `SearchTerm.php`, `routes/web.php`, testes                                                                                                                                                                                                                                                                         |
| `4d0718e` | 6 — Ajustes pós-R4 | `format.ts` (aceita ",50"), `EstimateIntegrityTest.php` (`finally`)                                                                                                                                                                                                                                                                         |

## Detalhe por mudança

### 1. CI com PostgreSQL (T01) — lote 1

- **Problema:** o workflow `tests` falhou em 9/9 execuções; `composer setup` migrava num Postgres inexistente.
- **Antes:** CI vermelho em todo push; lint/tipos/testes nunca rodavam no GitHub.
- **Mudança:** serviço `postgres:17-alpine` na porta 5434; passo extra rodando a suíte em PG; `.railway/**` (gerado pela ferramenta da Railway) fora do formatador; `docs/railway.md` formatado.
- **Verificação:** `npm run check` passa; suíte em PG local passa. **Falta ver o primeiro run verde no GitHub** (exige push).

### 2. Lock na edição (T04)

- **Antes:** 6/30 rodadas concorrentes deixavam total ≠ soma.
- **Mudança:** `Estimate::lockForUpdate()->findOrFail()` dentro da transação de `UpdateEstimate`.
- **Depois:** 0/30. A R3 testou 12 creates + 12 updates paralelos sem deadlock.

### 3. Endereço da oficina (T05)

- **Antes:** 256–500 caracteres passavam na validação e quebravam no PG (`varchar(255)`).
- **Mudança:** `max:255`. Teste: 256 → erro em pt-BR; 255 → ok.

### 4. E-mail em minúsculas (T03)

- **Antes:** `business:create --email=Joao@Exemplo.com` criava um usuário que não conseguia logar.
- **Mudança:** `mb_strtolower(trim())` no comando e `prepareForValidation` no perfil.
- **Limite:** registros antigos com maiúsculas em produção continuam afetados (Q10 no backlog; provavelmente nenhum, ver R2).

### 5. Ids não numéricos/gigantes (T10)

- **Antes:** `/estimates/abc` → 500.
- **Mudança:** `where([... => '[0-9]{1,18}'])` nas rotas de recurso, PDF e status. Teste com 8 URLs → 404.

### 6. Busca (T11)

- **Antes:** "JOÃO" não achava "João" no PG; `%` listava tudo.
- **Mudança:** `App\Support\SearchTerm` com `escape '\'` e dois padrões (`mb_strtolower` e `strtolower`, para não regredir no sqlite).

### 7. Ordem dos itens (T15) e status (T16)

- `items()->orderBy('id')`; o teste força a ordem reversa no sqlite e falha sem a correção.
- `PATCH /status` redireciona para `estimates.show` em vez de `back()`.

### 8. PDF com subsetting (P-01)

- **Antes:** 879.772 B. **Depois:** 25.313 B, com acentos íntegros (texto extraído com `pdftotext` e página renderizada).

### 9. Front: data, dinheiro, PDF (T07, T08, T09)

- `todayIsoDate()` no fuso local.
- `moneyToCents` só aceita formatos válidos (28 casos comparados antes/depois: 19 iguais; 7 malformados agora → 0; **mudança deliberada**: texto com letras como "50 reais" ou "US$ 10" também → 0, o campo mostra 0,00 e o servidor recusa, sem gravar valor errado).
- `fetchPdf` exige `application/pdf`; com a sessão expirada recarrega a página → login → volta ao orçamento (validado no navegador).

### 10. Índices (P-04/P-05)

- Migration aditiva; `down()` testado (rollback + migrate). Medições em [06](06-database-review.md).

## O que deliberadamente NÃO foi feito

Regras de negócio sem decisão (último usuário, troca de dono do veículo, imutabilidade do enviado), mudanças visuais (contraste, alvos de toque), paginação, dependências novas, limpeza de sobras do starter kit, qualquer coisa em produção.

## Outros arquivos criados

- `.claude/agents/*.md` (10 agentes) no checkout principal. **Não versionados**: `/.claude` está no `.gitignore`. Para compartilhar com o time, seria preciso liberar `.claude/agents/` no `.gitignore` (decisão sua).
- `docs/engineering/mission-360/` (esta documentação) na worktree.
