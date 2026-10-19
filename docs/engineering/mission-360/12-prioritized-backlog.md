# 12 — Backlog priorizado

Critérios: impacto para a oficina, risco reduzido, esforço (P ≤ 2 h, M ≤ 1 dia, G > 1 dia), dependências e facilidade de validação. IDs remetem aos documentos 04–09.

## 1. Correções críticas e verificações de produção

Não há P0/P1 abertos. Estes itens dependem de você (acesso ao GitHub/Railway ou decisão) e vêm primeiro porque protegem os dados e o deploy.

| #   | Item                                            | Esforço | Depende de        | Critério de aceite                                                                                                                                                |
| --- | ----------------------------------------------- | ------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C0  | **Backup do PostgreSQL de produção** (T22)      | P       | Painel da Railway | Backup automático habilitado e **um restore de teste** num banco descartável com as mesmas contagens de `businesses`, `customers`, `estimates` e `estimate_items` |
| C1  | **Deploy esperar o CI** (T02)                   | P       | Railway/GitHub    | "Wait for CI" ativo na Railway (não exige PR para dev solo); um deploy observado aguardando o check `tests`                                                       |
| C3  | **E-mail de produção** (S06, provável `log`)    | P       | Painel da Railway | Um e-mail de "Esqueci minha senha" recebido de fato; ou a opção removida da tela e documentada                                                                    |
| C5  | **Porta do Postgres local** (T21)               | P       | —                 | `docker compose up` e `.env` local usam uma porta livre; `migrate` local nunca alcança o banco de outro projeto                                                   |
| C6  | **Compartilhar no iPhone e no Android** (UX-H1) | P       | Aparelho real     | Compartilhar um orçamento pelo WhatsApp funciona nos dois; se falhar no iOS, abre item de correção                                                                |

## 2. Quick wins

| #   | Item                                                  | Esforço | Critério de aceite                                                                                                               |
| --- | ----------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Throttle + mensagem genérica no forgot-password (S02) | P       | 7º POST em 1 min → 429; e-mail inexistente recebe a mesma mensagem que o existente                                               |
| Q2  | Encerrar outras sessões ao trocar a senha (S08)       | P       | `auth.session` nas rotas autenticadas + `logoutOtherDevices()`; teste: após trocar a senha, outra sessão recebe 302 para o login |
| Q3  | Senha atual obrigatória ao trocar o e-mail (S03)      | P       | Teste: PATCH com e-mail novo sem `current_password` → erro de validação                                                          |
| Q4  | `business:create` com `Password::defaults()` (S07)    | P       | Teste em ambiente `production` com `Http::fake` para o HIBP: senha de 8 caracteres é recusada                                    |
| Q9  | Regra do último usuário (S01, ADR-007)                | P       | Teste: o único usuário recebe erro em pt-BR ao tentar excluir a conta                                                            |
| Q10 | Verificar e-mails com maiúsculas em produção (T03)    | P       | `select count(*) from users where email <> lower(email)` = 0                                                                     |
| Q5  | Headers de segurança (S05)                            | P       | Respostas trazem HSTS (só produção), nosniff, `X-Frame-Options: DENY`, `Referrer-Policy`                                         |
| Q6  | Toast pt-BR para 419/403/404 em visitas Inertia (T14) | P       | Sessão expirada mostra "Sua sessão expirou, entre de novo" em vez do modal HTML                                                  |
| Q7  | Contraste da borda dos inputs ≥ 3:1 (UX08)            | P       | Medição dos tokens `--input` ≥ 3:1 nos dois temas                                                                                |
| Q8  | Alvos de toque ≥ 44px (UX12)                          | P       | Remover item, links e Voltar com ≥ 44×44 px                                                                                      |

## 3. Melhorias estruturais

| #   | Item                                                                                                                         | Esforço | Critério de aceite                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Teste que percorre as rotas autenticadas com ids de outra oficina (ADR-004)                                                  | M       | Fail-closed: uma rota com parâmetro que não esteja no mapa do teste faz o teste falhar; um endpoint sem `forBusiness` também                    |
| E2  | Paginação/infinite scroll em orçamentos e clientes (P-02)                                                                    | M       | `/estimates` envia ≤ 30 itens por página; busca e filtro por veículo continuam funcionando                                                      |
| E3  | Cliente com busca no formulário; veículos sob demanda (P-03, UX13)                                                           | M       | Payload do create < 10 KB com 1.000 clientes                                                                                                    |
| E4  | Sugestões de itens limitadas aos últimos N orçamentos (P-06)                                                                 | P       | `EXPLAIN` sem seq scan global; sugestões continuam isoladas por oficina (teste existente)                                                       |
| E5  | Observabilidade: rastreamento de erros (ex.: Sentry ou Nightwatch), `/up` checando o banco e monitor de uptime externo (T13) | M       | Exceção em produção gera alerta; com o banco fora, `/up` retorna 500 **e** o monitor externo avisa (o healthcheck da Railway só roda no deploy) |
| E6  | Limpar sobras do starter kit e subir o PHPStan para level 5 (T17, T20)                                                       | M       | `composer ci:check` verde com level ≥ 5                                                                                                         |
| E7  | Migrar URLs fixas para Wayfinder (T18)                                                                                       | M       | `grep "href={\`/"`sem ocorrências em`pages/`                                                                                                    |

## 4. Evoluções funcionais (dependem de conversa com a funilaria)

| #   | Item                                                          | Pergunta | Critério de aceite                                                                |
| --- | ------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| F1  | Revisão de orçamento enviado (ADR-006)                        | D2       | Editar orçamento enviado oferece "Duplicar como revisão"; o original fica intacto |
| F2  | Validade em dias no PDF                                       | D3       | Campo opcional; o PDF mostra "Válido até dd/mm/aaaa"                              |
| F3  | Botão WhatsApp com mensagem pronta para o telefone do cliente | —        | Abre `wa.me/55DDDNÚMERO?text=...`; desabilitado se o cliente não tem telefone     |
| F4  | Filtro por status na lista                                    | —        | `?status=sent` filtra; o estado da UI persiste na URL                             |
| F5  | Quantidade × unitário e/ou peça vs. mão de obra               | D4       | Totais por tipo no PDF; o total continua calculado no servidor em centavos        |
| F6  | Regra de troca de dono do veículo (T06)                       | D1       | Ou bloqueada com mensagem, ou o orçamento guarda snapshot                         |
| F7  | Cadastro de cliente/veículo inline no formulário              | —        | Criar cliente sem sair do orçamento, sem perder itens                             |

## 5. Preparação para SaaS (só com gatilho; ver doc 09)

| #   | Item                                               | Gatilho                                   |
| --- | -------------------------------------------------- | ----------------------------------------- |
| S-1 | `business:add-user` + `users.role` (owner/member)  | 1ª oficina pedindo login para funcionário |
| S-2 | `businesses.plan` + `active_until`                 | Decisão comercial                         |
| S-3 | Encerramento de conta com exclusão completa (LGPD) | Abrir para oficinas de terceiros          |

## 6. Ideias não aprovadas (registradas, sem ação)

Catálogo de serviços com preços; fotos do dano (exige bucket); integração com seguradoras; relatórios; autosave de rascunho; app nativo; NF-e/estoque/financeiro (fora do escopo, para não virar ERP).

## Ordem sugerida (revista na R2)

C0 → C1 → C3 → C5 → E5 → C6 → conversar com a funilaria (D1–D7) → Q6–Q8 (UX) → Q1–Q4, Q9–Q10 (segurança, ~1 dia) → E1 → F1/F2/F3.

Os itens de segurança vieram para depois da observabilidade: com uma oficina, sem cadastro público e com o próprio dev operando, saber quando algo quebra em produção vale mais que endurecer ataques de baixa probabilidade (R2, contestação 4).
