# 11 — Registros de decisão de arquitetura (ADRs)

Formato curto: contexto, decisão, alternativas, consequências. Status **Aceita** = aplicada nesta missão na branch `mission-360`, ainda sujeita à aprovação do merge. **Proposta** = depende do dono do produto.

---

## ADR-001 — O CI roda a suíte em PostgreSQL além de sqlite

**Status:** Aceita na branch (commit `b616ee1`); **pendente do primeiro run verde no GitHub**, que exige push.

**Contexto:** o CI nunca passou, porque `composer setup` migrava num Postgres inexistente. Além disso, bugs desta auditoria como T05 e T11 só aparecem em PostgreSQL (T04 também, mas só com concorrência, que a suíte não exercita), e a suíte rodava apenas em sqlite.

**Decisão:** serviço `postgres:17-alpine` no job (porta 5434, como no `docker-compose.yml`). A suíte roda em sqlite (rápida, via `composer ci:check`) e de novo em PostgreSQL.

**Alternativas:** (a) trocar o `.env.example` para sqlite no CI: mais simples, mas não pega as diferenças de banco; (b) só PostgreSQL: perde a execução rápida local.

**Consequências:** o job fica um pouco mais longo (não medido no GitHub). O CI **ainda não bloqueia o deploy**: isso exige configurar proteção de branch no GitHub e/ou "wait for CI" na Railway (decisão do dono, ver 17).

---

## ADR-002 — Lock pessimista na edição de orçamento

**Status:** Aceita (commit `eae48e2`).

**Contexto:** `UpdateEstimate` apaga e recria os itens. Sem lock, duas gravações simultâneas intercalavam e deixavam o total diferente da soma (6/30 rodadas em PG).

**Decisão:** `Estimate::lockForUpdate()->findOrFail()` dentro da transação, como `CreateEstimate` já faz com a `Business`.

**Alternativas:** (a) lock otimista comparando o `updated_at` (que já existe) enviado pelo formulário: detecta "edição sobre versão antiga" sem coluna nova, mas exige UX de conflito; (b) diffs item a item: mais código, mesmo problema de concorrência.

**Consequências:** a segunda edição espera a primeira e vence ("last write wins" coerente). A primeira edição é perdida **em silêncio** — aceitável com um usuário por oficina; revisar quando houver mais. O lock otimista fica para quando houver mais de um usuário por oficina.

---

## ADR-003 — Índices explícitos em chaves estrangeiras consultadas

**Status:** Aceita (commit `fcb654f`).

**Contexto:** o PostgreSQL não cria índice para FK. Itens do orçamento e contagens por veículo faziam seq scan em tabelas de todas as oficinas.

**Decisão:** migration aditiva com índices em `estimate_items.estimate_id`, `estimates.vehicle_id` e `vehicles.customer_id`. Toda FK nova que for consultada deve ganhar índice na mesma migration.

**Consequências:** consultas de 23 ms → 0,17 ms (400 mil itens). Pequeno custo de escrita. As sugestões de itens não melhoraram (P-06).

---

## ADR-004 — Manter multi-tenancy por coluna, com escopo explícito

**Status:** Aceita (decisão de não mudar).

**Contexto:** a missão pede não impor multi-tenancy, mas o código já é multi-tenant por `business_id`, correto e testado.

**Decisão:** manter banco único, coluna `business_id`, `forBusiness()` explícito e teste de 404 por endpoint. Não adotar global scope, RLS, pacote de tenancy nem subdomínio.

**Alternativas:** global scope (esconde o filtro e complica comandos/admin); RLS (exige `SET` por request e role por conexão); schema por tenant (incompatível com migrations automáticas a cada push).

**Consequências:** o isolamento depende de disciplina, mitigada por testes. Reavaliar com os gatilhos do doc 09.

---

## ADR-005 — PDF gerado na hora, sem armazenamento, com subsetting de fonte

**Status:** Aceita (subsetting no commit `eae48e2`; o resto já era assim).

**Contexto:** o disco da Railway é efêmero e não há bucket. Cada PDF embutia a DejaVu Sans inteira (~860 KB).

**Decisão:** continuar gerando sob demanda, síncrono, e ativar `enable_font_subsetting`.

**Alternativas:** fila + armazenamento S3 (infraestrutura nova, sem necessidade medida); trocar DomPDF por Browsershot/Chromium (dependência pesada).

**Consequências:** PDF de ~25 KB e ~250 ms. Um PDF reemitido reflete os dados atuais do cliente/veículo (ver ADR-006).

---

## ADR-006 — Imutabilidade do orçamento enviado

**Status:** Decidida em 2026-10-19: o orçamento enviado pode ser editado, e cada edição guarda a versão anterior (opção "versionar"; implementação no PR C). O texto abaixo é a análise original.

**Contexto:** hoje um orçamento "Enviado" pode ser editado sem rastro, e o PDF reemitido muda se o cliente ou o veículo mudar.

**Opções:**

1. **Mínima:** gravar `sent_at` e avisar "este orçamento já foi enviado" ao editar.
2. **Recomendada:** ao editar um orçamento enviado, oferecer "Duplicar como revisão" (reaproveita o fluxo `duplicate` que já existe) e guardar `revision_of_id`.
3. **Completa:** snapshot JSON de cliente, veículo e itens no envio. Só se houver disputa real com cliente.

**Por que não agora:** muda regra de negócio e schema; precisa de conversa com a funilaria.

---

## ADR-007 — Regra do último usuário da oficina (PROPOSTA)

**Status:** Proposta (S01 / D6).

**Opções:** (a) bloquear a exclusão do último usuário com mensagem em pt-BR (menor mudança); (b) excluir a oficina e todos os dados (LGPD, irreversível; a cascata a partir de `businesses` funcionou no PG de laboratório, mas precisa de teste próprio com orçamentos); (c) remover a opção da UI e tratar por suporte.

**Recomendação:** com um único usuário em produção, (a) e (c) têm o mesmo efeito prático; (a) dá mensagem clara e é a menor mudança. (b) só com fluxo de encerramento de conta e confirmação forte. A ação já exige senha e não vaza dados, por isso P3.
