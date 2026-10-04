# Avaliação heurística de usabilidade (Nielsen)

Avaliação das telas autenticadas do sistema (início, orçamentos, clientes, veículos e ajustes da oficina), considerando o público principal: dono ou funcionário de oficina, no celular (375–430px), muitas vezes com pressa e com as mãos ocupadas.

Legenda: ✅ cumpre · ⚠️ cumpre parcialmente · ❌ viola.

| #   | Heurística                                 | Antes | Depois |
| --- | ------------------------------------------ | ----- | ------ |
| 1   | Visibilidade do status do sistema          | ⚠️    | ✅     |
| 2   | Correspondência com o mundo real           | ✅    | ✅     |
| 3   | Controle e liberdade do usuário            | ❌    | ✅     |
| 4   | Consistência e padrões                     | ⚠️    | ✅     |
| 5   | Prevenção de erros                         | ❌    | ✅     |
| 6   | Reconhecimento em vez de memorização       | ⚠️    | ✅     |
| 7   | Flexibilidade e eficiência de uso          | ⚠️    | ✅     |
| 8   | Estética e design minimalista              | ✅    | ✅     |
| 9   | Reconhecer, diagnosticar e recuperar erros | ⚠️    | ✅     |
| 10  | Ajuda e documentação                       | ❌    | ⚠️     |

---

## 1. Visibilidade do status do sistema — ⚠️ → ✅

**O que já funcionava:** botões com estado de carregamento ("Salvando...", "Gerando PDF..."), barra de progresso do Inertia, indicador de busca, toasts de sucesso após salvar e total do orçamento recalculado ao vivo.

**Problema:** o orçamento tinha status (Rascunho/Enviado), mas o formulário sempre gravava `draft` e não havia como mudar. Na prática, todo orçamento aparecia como **Rascunho** para sempre, mesmo depois de compartilhado. O status mentia sobre o estado real. Além disso, no início os orçamentos recentes não mostravam o status, e o download do PDF não confirmava que tinha terminado.

**Melhorias implementadas:**

- Na tela do orçamento: selo "Rascunho" / "Enviado ao cliente" e botão **Marcar como enviado** / **Voltar para rascunho** (`PATCH /estimates/{id}/status`).
- Quando o compartilhamento nativo é concluído, o orçamento vira **Enviado** automaticamente.
- Campo **Situação** no formulário, com uma frase que explica o que cada opção significa.
- Status exibido também na lista de recentes do início.
- Toast "orcamento-003.pdf baixado." ao terminar o download.

## 2. Correspondência entre o sistema e o mundo real — ✅

**Exemplo positivo:** a linguagem é a da oficina ("Orçamento", "Cliente", "Veículo", "Placa", "Observações"), os valores usam `R$ 1.234,56`, as datas `dd/mm/aaaa`, o telefone é formatado como `(11) 98765-4321` e a placa é convertida para maiúsculas. O número do orçamento (`#003`) segue o padrão de talões de papel.

**Ajuste menor:** o selo "Enviado" passou a "Enviado ao cliente", que deixa claro _para quem_ foi enviado.

## 3. Controle e liberdade do usuário — ❌ → ✅

**Problema:** no formulário de orçamento, os atalhos "Cadastrar cliente" e "Cadastrar veículo", a navegação inferior ou o "Voltar" descartavam **sem aviso** tudo o que tinha sido digitado (cliente, itens e valores). Remover um item também era definitivo, sem confirmação nem desfazer.

**Melhorias implementadas:**

- Hook `useUnsavedChanges`: antes de sair de um formulário com alterações não salvas (orçamento, cliente, veículo, dados da oficina), o sistema pede confirmação. Vale também para fechar ou recarregar a aba.
- Remover item mostra o toast "Item 2 removido." com o botão **Desfazer**, que devolve o item à mesma posição. Optamos por desfazer em vez de diálogo de confirmação para não adicionar um toque a cada remoção.
- O status pode ser revertido ("Voltar para rascunho").

## 4. Consistência e padrões — ⚠️ → ✅

**Problemas:**

- A mesma ação tinha nomes diferentes: "Cadastrar cliente" / "Novo cliente", "Adicionar" / "Adicionar veículo" / "Cadastrar veículo", "Gerar orçamento" / "Novo orçamento".
- No cabeçalho mobile da tela **Clientes**, havia um botão "+ Novo" (que criava um **orçamento**) e, logo abaixo, um botão "+" só com ícone (que criava um **cliente**). Dois "+" com significados diferentes na mesma tela.
- Editar era um ícone de lápis sem texto em algumas telas e o texto "Editar" em outras.

**Melhorias implementadas:**

- Vocabulário único: **Novo cliente**, **Novo veículo**, **Novo orçamento** e **Editar**.
- O atalho do cabeçalho mobile passou a ser "+ Orçamento", e as ações de página ganharam texto visível ("+ Novo cliente", "+ Novo orçamento").
- Botões "Editar" e "Duplicar" com ícone e texto na ficha do cliente e no orçamento.
- O selo de status aparece da mesma forma no início e na listagem.

## 5. Prevenção de erros — ❌ → ✅

**Problemas:**

- No formulário de orçamento, apertar "Enter"/"Ir" no teclado do celular dentro de um item **enviava o formulário inteiro**, salvando o orçamento pela metade (ou disparando erros de validação).
- No cadastro de veículo aberto pelo menu (sem cliente indicado), o **primeiro cliente da lista vinha selecionado**, o que facilitava vincular o veículo ao cliente errado sem perceber.
- Não havia orientação sobre o formato do valor (vírgula ou ponto).

**Melhorias implementadas:**

- "Enter" na descrição vai para o valor; no valor, vai para o próximo item; no último valor, cria um novo item. O teclado mostra "Avançar" (`enterKeyHint="next"`).
- O formulário de veículo não pré-seleciona cliente, a menos que a tela de origem indique qual é (mesmo comportamento já adotado no orçamento).
- Texto de apoio "Use vírgula para os centavos, como em 1.250,00." na seção de itens.
- O aviso de alterações não salvas (heurística 3) também previne perda de dados.

## 6. Reconhecimento em vez de memorização — ⚠️ → ✅

**O que já funcionava:** listas mostram cliente, veículo, placa, data e valor; o select de cliente inclui o telefone e o de veículo inclui a placa; o filtro por veículo mostra de quem é o carro.

**Problema:** a oficina repete os mesmos serviços ("Troca de óleo", "Alinhamento", "Pintura do para-choque"), mas precisava digitá-los do zero e lembrar da grafia usada antes. Ações importantes dependiam de ícones sem rótulo.

**Melhorias implementadas:**

- Sugestões de descrição de itens: o formulário recebe até 100 descrições já usadas pela oficina (mais recentes primeiro) e as oferece enquanto o usuário digita (`<datalist>`).
- Botões com texto visível (veja a heurística 4).
- A situação do orçamento é escolhida por opções nomeadas, com explicação, em vez de exigir que o usuário saiba o que "draft" significa.

## 7. Flexibilidade e eficiência de uso — ⚠️ → ✅

**O que já funcionava:** atalhos por veículo na ficha do cliente, veículo único selecionado automaticamente, busca com atualização enquanto digita e foco automático no item recém-adicionado.

**Problema:** orçamentos parecidos (mesmo cliente voltando, revisões periódicas, pacotes de serviço) precisavam ser montados do zero.

**Melhorias implementadas:**

- Botão **Duplicar** no orçamento: abre um novo orçamento com o mesmo cliente, veículo, itens e observações, com a data de hoje e status Rascunho.
- Sugestões de itens (heurística 6) e navegação por "Enter" entre os campos (heurística 5) aceleram o preenchimento para quem já conhece o sistema, sem atrapalhar o iniciante.

## 8. Estética e design minimalista — ✅

**Exemplo positivo:** cartões com hierarquia clara, uma coluna no celular, uma ação principal por tela, total fixo no rodapé do formulário e estados vazios com uma única ação. As cores semânticas (laranja para ação, verde para enviado, vermelho para remover) são usadas com moderação.

**Cuidados nas mudanças:** os elementos novos foram adicionados sem poluir a tela: o guia de primeiros passos só aparece enquanto não existem orçamentos, o controle de status é um botão discreto (ghost) ao lado do selo, e a dica de formato de valor aparece uma única vez na seção, não em cada item.

**Sugestão futura (não implementada):** no formulário de orçamento, os rótulos "Descrição do serviço" e "Valor" se repetem em todos os itens. Em orçamentos longos, dá para exibir os rótulos só no primeiro item no desktop, mantendo `aria-label` nos demais.

## 9. Ajuda aos usuários a reconhecer, diagnosticar e recuperar erros — ⚠️ → ✅

**O que já funcionava:** mensagens de validação em português, específicas e ligadas ao campo (`aria-describedby`, `role="alert"`), além de toasts para erro de servidor e falta de internet.

**Problemas:**

- Em orçamentos com vários itens, o erro de um item lá embaixo ficava fora da tela (atrás do rodapé fixo). O usuário tocava em "Salvar" e aparentemente nada acontecia.
- O erro do PDF dizia apenas "Tente novamente", sem oferecer o botão para isso.

**Melhorias implementadas:**

- `focusFirstError`: depois de uma validação com erro, a tela rola até o primeiro campo inválido, coloca o foco nele e mostra "Revise os 2 campos destacados para continuar." Aplicado nos formulários de orçamento, cliente, veículo e oficina.
- Falha ao gerar o PDF: o toast explica a causa provável ("Verifique sua internet") e traz o botão **Tentar de novo**.

## 10. Ajuda e documentação — ❌ → ⚠️

**Problema:** não havia nenhuma ajuda dentro do sistema. Um usuário novo, com a oficina vazia, via apenas "Nenhum orçamento ainda" e precisava descobrir sozinho que o caminho é cliente → veículo → orçamento → PDF.

**Melhorias implementadas:**

- Guia **Primeiros passos** no início, exibido enquanto a oficina não tem orçamentos: quatro etapas numeradas, com link para cada uma e marcação automática do que já foi feito (cliente cadastrado, veículo cadastrado).
- Textos de apoio contextuais: formato do valor, significado de cada status e lembrete para marcar como enviado depois de baixar o PDF.

**Por que ainda ⚠️:** não existe uma central de ajuda ou FAQ. **Próximo passo sugerido:** uma página `/ajuda` curta (como compartilhar pelo WhatsApp, como instalar o app na tela inicial, como corrigir um orçamento já enviado), com link em Ajustes.

---

## Resumo das mudanças

- **Backend:** rota `PATCH /estimates/{id}/status`; parâmetro `?duplicate=` em `/estimates/create`; prop `itemSuggestions` no formulário; prop `onboarding` no início. Tudo com escopo por oficina e testes em `tests/Feature/EstimateUsabilityTest.php`.
- **Frontend:** `useUnsavedChanges`, `focusFirstError`, desfazer remoção de item, navegação por Enter, campo Situação, botões Duplicar / Marcar como enviado, guia Primeiros passos e padronização de rótulos.
- **Sem migrations** e sem novas variáveis de ambiente.
