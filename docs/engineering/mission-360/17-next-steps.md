# 17 — Próximos passos

## Decisões que dependem de você

| #   | Decisão                             | Opções                                                                     | Recomendação                                                                                                     |
| --- | ----------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | **Integrar a branch `mission-360`** | Abrir PR para revisão / merge direto na `main` / descartar                 | PR, para o CI rodar antes; lembrando que **o merge na `main` publica em produção** e roda a migration de índices |
| 2   | Deploy esperar o CI (C1)            | "Wait for CI" na Railway / proteção de branch no GitHub / manter como está | "Wait for CI" na Railway                                                                                         |
| 3   | Backup de produção (C0)             | Confirmar no painel e fazer um restore de teste                            | Fazer antes do próximo deploy com migration                                                                      |
| 4   | E-mail de produção (C3)             | Configurar SMTP / remover "Esqueci minha senha"                            | Depende de quantas oficinas haverá em breve                                                                      |
| 5   | Último usuário (S01/D6)             | Bloquear / apagar a oficina / remover a opção                              | Bloquear com mensagem                                                                                            |
| 6   | Versionar `.claude/agents/`         | Liberar no `.gitignore` / manter local                                     | Manter local, a menos que mais pessoas usem o Claude Code no projeto                                             |

## Decisões do dono (2026-10-19)

| Tema                                           | Decisão                                                   | Entrega                                                                                     |
| ---------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Orçamento enviado pode ser alterado (D2)       | Sim, com versões para controle                            | **PR C**: cópia da versão anterior ao editar um orçamento enviado; PDF com "versão N"       |
| Mesmo carro com outra pessoa (D1/D5)           | Avisar e deixar seguir com o orçamento para a pessoa nova | **PR C**: aviso de placa já cadastrada; troca de dono de veículo com orçamento bloqueada    |
| Peças × mão de obra, quantidade, desconto (D4) | Pode, mantendo o modo manual (descrição + valor)          | **PR B**: tipo e quantidade × unitário opcionais por item; desconto em R$ ou % no orçamento |
| Validade (D3)                                  | Sim, opcional                                             | **PR A**                                                                                    |
| Seguradora (D7)                                | Sim, opcional                                             | **PR A**                                                                                    |

## Perguntas para a funilaria (D1–D7)

1. O veículo pode passar de um cliente para outro? Se sim, o orçamento antigo deve continuar mostrando o dono da época?
2. Depois de mandar o orçamento ao cliente, vocês ainda o alteram? Ou fazem um novo?
3. O cliente aprova formalmente? Precisa de validade ("válido por 7 dias")?
4. Cobram peças e mão de obra separadas? Quantidade × preço unitário? Dão desconto à vista/Pix?
5. A mesma placa pode aparecer duas vezes (dois cadastros do mesmo carro)?
6. Trabalham com seguradora (sinistro, franquia)?
7. Mais alguém da oficina vai usar o sistema? Pelo celular ou pelo computador?

## Ações operacionais imediatas (locais)

- **Porta 5434 desta máquina** pertence ao Postgres de outro projeto (`escalas-louvor-db-1`). Não rode `php artisan migrate` no checkout principal até mudar a porta deste projeto (C5).
- O checkout principal (`main`) estava 5 commits atrás de `origin/main`. Não foi atualizado nesta missão; um `git pull --ff-only` resolve, sem conflito com nada local.
- O container de laboratório `orc-pg-lab` (porta 55432) e a worktree `../orcamentos-mission360` podem ser removidos quando não forem mais úteis.

- O PR aberto do Dependabot (atualização de actions) também altera `.github/workflows/tests.yml`; segundo a R4, o merge com esta branch é limpo, mas vale mesclar um depois do outro e ver o CI.

## Sequência sugerida

1. Revisar o diff da branch `mission-360` (6 commits de código e testes + 1 de documentação).
2. Abrir PR e ver o CI verde (primeira vez na história do repositório).
3. C0 (backup) → merge (deploy) → C1 → C3.
4. Conversar com a funilaria (perguntas acima).
5. Seguir o [backlog](12-prioritized-backlog.md) na ordem revista.

## Limitações desta missão

- Nada foi verificado em produção (sem acesso por decisão): mailer, proxy, collation, volume, backup.
- Sem teste em aparelhos reais.
- Agentes da Fase 1 analisaram o commit anterior; a R1 revalidou, mas os relatórios em [agents/](agents/) refletem `df32258`.
- Sem testes JS automatizados nem teste de concorrência na suíte (o script de corrida está fora do repositório).
