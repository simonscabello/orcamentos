# 03 — Inventário de funcionalidades

Base: `efebe2d` (produção). Fonte: [agents/business-analyst.md](agents/business-analyst.md), relido contra `origin/main`; as diferenças estão marcadas com **(origin)**.

Legenda: **EXISTENTE** = funciona de ponta a ponta · **PARCIAL** = existe com lacunas · **AUSENTE** · **NÃO VERIFICADA** = depende de aparelho ou ambiente real.

| Funcionalidade                                         | Status                                           | Evidência / observação                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Login, 2FA, reset de senha                             | EXISTENTE / reset **NÃO VERIFICADO** em produção | Fortify. O mailer de produção não está declarado no IaC (S06)                                                             |
| Cadastro público                                       | AUSENTE (decisão)                                | Teste garante que não há `/register`; oficina via `business:create`                                                       |
| Múltiplos usuários por oficina                         | AUSENTE                                          | Não há comando nem tela para convidar o 2º usuário                                                                        |
| Clientes (nome, telefone)                              | EXISTENTE                                        | `CustomerController`; sem e-mail, documento ou endereço                                                                   |
| Veículos (modelo, placa, cor)                          | EXISTENTE                                        | Sem ano, chassi, km; placa sem normalização/unicidade                                                                     |
| Cadastro rápido de cliente/veículo dentro do orçamento | PARCIAL                                          | Links "Novo cliente/veículo" saem do formulário; o hook `use-unsaved-changes` **(origin)** avisa antes de perder os itens |
| Novo orçamento a partir do cliente/veículo             | EXISTENTE **(origin)**                           | `customers/show.tsx:112`, `create?vehicle_id=`                                                                            |
| Pré-seleção do cliente                                 | Corrigido **(origin)**                           | Não pré-seleciona mais o primeiro cliente (`faec511`)                                                                     |
| Itens com descrição + valor                            | EXISTENTE                                        | Sem quantidade × unitário, tipo peça/mão de obra ou desconto                                                              |
| Sugestões de itens já usados                           | EXISTENTE **(origin)**                           | `datalist` com as últimas 100 descrições da oficina                                                                       |
| Catálogo de serviços / templates                       | AUSENTE                                          | As sugestões cobrem parte da necessidade                                                                                  |
| Duplicar orçamento                                     | EXISTENTE **(origin)**                           | `create?duplicate=`; isolado por oficina (provado na R1)                                                                  |
| Numeração sequencial por oficina                       | EXISTENTE                                        | Testado com concorrência real em PG (8 × 50 sem duplicata)                                                                |
| Versionamento / histórico                              | AUSENTE                                          | Editar sobrescreve; não há `sent_at` nem log                                                                              |
| Status rascunho/enviado                                | EXISTENTE **(origin)**                           | `PATCH /status`; compartilhar marca "enviado" automaticamente                                                             |
| Aprovação / recusa / validade                          | AUSENTE                                          | Depende de conversa com o cliente (D3)                                                                                    |
| PDF A4 com dados da oficina                            | EXISTENTE                                        | 880 KB → **25 KB** após o lote 2                                                                                          |
| Compartilhar (Web Share)                               | EXISTENTE / **NÃO VERIFICADO** no iOS            | `navigator.share` após `fetch`; ativação do toque pode expirar (UX-H1)                                                    |
| Link direto para WhatsApp do cliente                   | AUSENTE                                          | Só pelo menu de compartilhar do sistema                                                                                   |
| Busca (nome, telefone, placa)                          | EXISTENTE                                        | Acentos e curingas corrigidos no lote 2                                                                                   |
| Filtros (status, período)                              | AUSENTE                                          | Só `?vehicle_id=` **(origin)**                                                                                            |
| Paginação                                              | AUSENTE                                          | `->get()` em clientes e orçamentos (P-02)                                                                                 |
| Rascunho automático / recuperação                      | PARCIAL                                          | Status "rascunho" existe; não há autosave. Há o aviso de alterações não salvas **(origin)**                               |
| Relatórios operacionais                                | AUSENTE                                          | Dashboard mostra só os 5 últimos                                                                                          |
| Onboarding                                             | EXISTENTE **(origin)**                           | Guia de primeiros passos no dashboard                                                                                     |
| PWA instalável                                         | EXISTENTE / ícone iOS **NÃO VERIFICADO**         | Manifest dinâmico; SW sem cache (por decisão)                                                                             |
| Modo escuro                                            | EXISTENTE                                        | `HandleAppearance`                                                                                                        |
| Exclusão de conta                                      | EXISTENTE com defeito                            | Deixa a oficina órfã (S01)                                                                                                |

## Melhorias, separadas por grau de certeza

**Confirmadas pelo código (prontas para backlog):** paginação de orçamentos (P-02), bloquear exclusão do último usuário (S01), regra para troca de dono do veículo (D1), botão WhatsApp com mensagem pronta, filtro por status.

**Oportunidades promissoras (validar com uso):** validade em dias impressa no PDF; "duplicar como nova versão" quando o orçamento já foi enviado; histórico de orçamentos do cliente; seleção de cliente com busca em vez de `<select>` nativo.

**Hipóteses que exigem conversa com a funilaria:** quantidade × unitário; peças vs. mão de obra; desconto à vista/Pix; seguradora (sinistro, franquia); aprovação formal pelo cliente; fotos do dano (exige armazenamento persistente, inexistente hoje); vários usuários por oficina; uso em desktop.

Fora de escopo, para não virar ERP: estoque, financeiro, ordens de serviço completas, NF-e.
