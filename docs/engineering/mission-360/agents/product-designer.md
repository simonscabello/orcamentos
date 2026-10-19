# Relatório — Product Designer (Tratto / Orçamentos)

Análise estática, somente leitura. Nada foi executado no navegador; contrastes foram calculados a partir dos tokens OKLCH de `resources/css/app.css` (script em `scratchpad/ux/contrast.py`).

## Escopo investigado

- Páginas: `resources/js/pages/{dashboard,customers/*,vehicles/form,estimates/*}.tsx`
- Layout/navegação: `resources/js/layouts/app-layout.tsx`, `resources/js/components/app-nav.tsx`, `components/ui/page-header.tsx`
- Primitivas: `components/ui/{button,input,field,badge,empty-state,sonner}.tsx`, `components/search-field.tsx`, `components/estimate-list-item.tsx`
- Utilitários/feedback: `lib/format.ts`, `hooks/use-flash-toast.ts`, `app.tsx`
- Backend que afeta a UX: `EstimateController`, `VehicleController`, `CustomerController`, `EstimateRequest`, `routes/web.php` (manifest), `bootstrap/app.php`
- PWA/tema: `public/sw.js`, `resources/views/app.blade.php`, `config/brand.php`, `resources/css/app.css`
- `docs/manual-test.md`, `docs/sistema.md`

## Jornada: primeiro orçamento de um cliente novo (caminho mais curto possível)

| #   | Tela                                                                  | Ação (toque)                                                                                                                                                                 | Digitação            |
| --- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | Início (`dashboard.tsx:38-49`)                                        | "Novo cliente"                                                                                                                                                               | —                    |
| 2   | Novo cliente (`customers/form.tsx`)                                   | "Salvar cliente"                                                                                                                                                             | nome (+ telefone)    |
| 3   | Cliente (redirect `CustomerController.php:35`)                        | "Adicionar veículo" (`customers/show.tsx:118-127`)                                                                                                                           | —                    |
| 4   | Novo veículo (cliente pré-selecionado, `VehicleController.php:18-24`) | "Salvar veículo"                                                                                                                                                             | modelo (+ placa/cor) |
| 5   | Cliente de novo (redirect `VehicleController.php:33`)                 | **não há "Novo orçamento" aqui** → usar "Novo" do cabeçalho (`app-layout.tsx:72-80`)                                                                                         | —                    |
| 6   | Novo orçamento                                                        | abrir select de cliente + escolher o cliente novo (o padrão é `customers[0]` alfabético, `estimates/form.tsx:44-46`); veículo é auto-selecionado se único (`form.tsx:51-56`) | descrição + valor    |
| 7   |                                                                       | "Salvar orçamento"                                                                                                                                                           | —                    |
| 8   | Orçamento (show)                                                      | "Compartilhar"                                                                                                                                                               | —                    |

**Total: ~8 toques de navegação/ação + 2 toques no select, 7 carregamentos de tela, 4 campos mínimos digitados.** Partindo de "Novo orçamento" é pior: os links "Cadastrar cliente/veículo" do formulário (`form.tsx:185-191`, `228-238`) saem da tela, descartam os itens já digitados e não voltam para o orçamento. Meta razoável: 4–5 toques / 3 telas (criar cliente+veículo inline ou voltar ao orçamento com o cliente selecionado).

## Achados confirmados

### P1

1. **Cliente errado pré-selecionado no novo orçamento.** `estimates/form.tsx:44-46` usa `customers[0]` (ordem alfabética, `EstimateController.php:79`) como padrão e, se esse cliente tem 1 veículo, já seleciona o veículo (`form.tsx:51-56`). Um usuário apressado preenche itens e salva para o cliente errado; o PDF sai com nome/veículo errados. Impacto alto (documento enviado ao cliente final), confiança alta, esforço baixo (iniciar com `''` e/ou aceitar `?customer_id=`).
2. **Jornada cliente→veículo→orçamento quebrada.** `customers/show.tsx` não tem CTA "Novo orçamento"; `EstimateController::create` (`:29-32`) ignora `customer_id` na query; após salvar veículo o redirect vai para o cliente (`VehicleController.php:33`), não para o orçamento. Resultado: 7 telas e reseleção manual do cliente (ver tabela). Confiança alta, esforço baixo-médio.
3. **Perda de rascunho do orçamento.** `useForm` sem chave de `remember` (`form.tsx:50`), sem aviso de saída. Links "Cadastrar cliente/veículo", "Voltar", "Cancelar" e a navegação inferior descartam itens digitados sem confirmação. É exatamente o momento em que o usuário descobre que falta o veículo. Confiança alta, esforço baixo (`useForm('estimate-create', …)` / `useRemember` + `?return=estimate`).

### P2

4. **Data padrão em UTC.** `form.tsx:59` `new Date().toISOString().slice(0,10)`: no Brasil (UTC-3), entre 21h e 24h a data sugerida é **amanhã**. Confiança alta, esforço trivial (montar a data com `getFullYear/getMonth/getDate`).
5. **Status "Enviado" inalcançável.** `status` existe no form (`form.tsx:60`) e é validado (`EstimateRequest.php:22`), mas nenhuma UI o altera (grep sem outros usos). Todo orçamento fica "Rascunho" para sempre (`estimate-list-item.tsx:43-55`, `show.tsx:150-160`), o que torna o badge enganoso. Sugestão: marcar como enviado ao compartilhar com sucesso, ou toggle no show.
6. **PDF com sessão expirada vira HTML salvo como `.pdf`.** `show.tsx:58-66` só checa `response.ok`; com sessão expirada o `auth` redireciona para `/login`, o `fetch` segue e recebe 200 HTML, que é baixado/compartilhado como `orcamento-XXX.pdf`. Confiança média-alta (raciocínio sobre middleware padrão; não testado em runtime). Fix: checar `response.redirected` / `content-type: application/pdf`.
7. **Bordas de input com contraste 1,49:1 (claro) / 1,68:1 (escuro)** — `--input` em `app.css:112/160`, usado em `input.tsx:5`. WCAG 1.4.11 pede 3:1; em oficina/luz solar os campos “somem”. Esforço baixo (escurecer `--input`).
8. **Erros de validação pouco visíveis em formulário longo.** Não há foco/rolagem para o primeiro erro nem toast de resumo (`form.tsx:136-149`; `use-flash-toast.ts` só trata flash/5xx/rede). Erros de item podem ficar atrás da barra fixa de total (`form.tsx:427`). Confiança alta na ausência de tratamento; o comportamento exato de scroll após erro não foi verificado.
9. **Busca por telefone depende da máscara digitada.** Telefone é salvo como digitado (`customers/form.tsx:64-77`, sem normalização; `CustomerRequest` só `max:40`) e a busca é `like` textual (`CustomerController.php:18`, `EstimateController.php:23`). Quem salvou "(11) 99999-0000" não é achado por "1199999". Confiança alta. Fix: normalizar dígitos no salvar e na busca.
10. **Sem "duplicar orçamento".** Não existe rota/ação (`routes/web.php:47`). Para oficina, repetir revisão/serviço comum é frequente. Gap de funcionalidade, não bug.
11. **419 (CSRF/sessão expirada) sem tratamento.** `use-flash-toast.ts:25-37` só intercepta ≥500; `bootstrap/app.php` não customiza 419. PWA aberta por horas → "Page Expired" no modal do Inertia e o formulário se perde. Confiança média (plausível, padrão do Inertia).

### P3

12. **Enter no campo de descrição submete o orçamento** (submissão implícita; `form.tsx:325-343` sem `enterKeyHint`). No Android, "Ir" envia com itens incompletos → erros.
13. **Alvos de toque < 44px**: remover item `icon-sm` 36px (`button.tsx:28`, `form.tsx:306-319`); links "Cadastrar cliente/veículo" `min-h-9` (`form.tsx:187, 235`); "Voltar" `min-h-9` (`page-header.tsx:37`); botões `sm` h-9 em `customers/show.tsx:79,106`. Passam WCAG 2.2 AA (24px), abaixo do ideal mobile.
14. **Placa sem `maxLength`/normalização** (`vehicles/form.tsx:126-150`): hífen/espaço não removidos → "ABC-1234" ≠ "ABC1234" na busca. Bom: `autoCapitalize="characters"`, `uppercase`, `spellCheck=false`.
15. **Placeholder 2,95:1 no tema claro** (`input.tsx:5` `placeholder:text-muted-foreground/70`). Exemplos (“0,00”, “ABC1D23”) ficam ilegíveis ao sol.
16. **Erro em vermelho no escuro 4,47:1** (`--destructive` dark vs card) — limítrofe para `text-sm`.
17. **Rótulos da navegação inferior 11px** (`app-layout.tsx:106`); estado ativo depende de cor + escala (há `aria-current`, ok).
18. **PWA**: `sw.js` sem `fetch` → sem página offline; ícone só SVG com `purpose: "any maskable"` (`routes/web.php:28-33`) e `apple-touch-icon` SVG (`app.blade.php:47`) — iOS não usa SVG, gera ícone de screenshot. `theme-color` segue o SO, não a preferência do app (`app.blade.php:8-9`).
19. **`docs/manual-test.md:5` manda "crie uma conta"**, mas não há cadastro público (CLAUDE.md). Doc desatualizada.
20. Telefone sem máscara durante digitação (`customers/form.tsx`), só formatado na exibição (`format.ts:73-85`).

### O que está bom (não mexer)

- Dupla submissão: `Button loading` desabilita e põe `aria-busy` (`button.tsx:74-79`) em todos os forms; PDF desabilita os dois botões durante a geração (`show.tsx:245-268`). Submissão implícita por Enter também fica bloqueada com o botão desabilitado.
- Dinheiro: `inputMode="decimal"`, prefixo R$, `moneyToCents` robusto (vírgula, milhar, `10.5`), formatação no blur (`form.tsx:356-385`, `format.ts:28-62`); total ao vivo com `aria-live` (`form.tsx:434`).
- Erros de rede/5xx viram toast pt-BR (`use-flash-toast.ts`); compartilhar com fallback para download e `AbortError` ignorado (`show.tsx:85-116`).
- `Field` liga label/`aria-describedby`/`aria-invalid` (`field.tsx:38-62`); skip link; `prefers-reduced-motion`; safe areas; texto principal/muted com contraste ≥5:1 nos dois temas; botão primário 5,2:1 (claro) / 5,5:1 (escuro).
- Estados vazios com CTA em todas as listas e buscas.

## Hipóteses não verificadas

- **H1 (potencial P1): Compartilhar no iOS Safari falha após `await fetch`.** `navigator.share` exige ativação transitória; com PDF lento a ativação pode expirar → `NotAllowedError` → toast enganoso "Não foi possível gerar o PDF" (`show.tsx:85-116`). Testar em iPhone real com rede 3G. Mitigação: pré-buscar o blob ao abrir a página, ou tratar `NotAllowedError` com botão "Tocar para compartilhar".
- H2: `URL.revokeObjectURL` imediatamente após `click()` (`show.tsx:68-75`) pode abortar o download em Safari/Firefox.
- H3: com teclado aberto no Android (viewport redimensionado), barra inferior (64px) + barra de total fixa (~120px, `form.tsx:427`) ocupam metade da área visível ao editar itens.
- H4: após erro de validação, o Inertia pode resetar o scroll para o topo, afastando o usuário dos erros dos itens.
- H5: `select` nativo de clientes sem busca fica inviável com centenas de clientes.

## Quick wins de baixo risco

1. `form.tsx:44`: cliente inicial `''` em criação (ou o `customer_id` da query) — elimina P1 #1.
2. `EstimateController::create`: aceitar `?customer_id=` (validado por `forBusiness`) e adicionar botão "Novo orçamento" em `customers/show.tsx` — P1 #2.
3. `useForm('estimate:create', …)` (remember) no form de orçamento — P1 #3.
4. Data local em vez de `toISOString()` — P2 #4 (1 linha).
5. `fetchPdf`: rejeitar se `response.redirected` ou `content-type` ≠ `application/pdf`, com toast "Sua sessão expirou, entre novamente" — P2 #6.
6. Escurecer `--input` (claro ~`oklch(0.70 …)`, escuro ~`oklch(0.55 …)`) — P2 #7.
7. `enterKeyHint="next"` na descrição e prevenir Enter de submeter — P3 #12.
8. `icon-sm` → `icon` no botão de remover item; `min-h-11` nos links de cadastro — P3 #13.
9. Normalizar telefone (só dígitos) no `CustomerRequest::prepareForValidation` e busca por dígitos — P2 #9 (exige teste).
10. Corrigir `docs/manual-test.md:5`.

## Testes necessários

- Pest: `GET /estimates/create?customer_id=X` pré-seleciona o cliente e retorna nada/ignora para cliente de outra oficina (regra multi-tenant).
- Pest: `GET /estimates/{id}/pdf` sem sessão → redirect (documenta o comportamento que o front precisa tratar).
- Pest: busca de cliente/orçamento por telefone só com dígitos encontra registro salvo com máscara (após normalização).
- Unit (Vitest, se existir) ou teste manual: data padrão às 22h BRT.
- Manual em aparelho: iOS Safari compartilhar com rede lenta (H1); download no Safari (H2); teclado aberto no Android (H3); erro de validação no item 5 de 6 (H4/#8).

## Riscos e limitações

- Sem execução em navegador/aparelho; achados de runtime estão marcados como hipótese.
- Contraste calculado por conversão OKLCH→sRGB própria; diferenças de ±0,1 possíveis.
- Não revisei telas de auth/settings em profundidade nem o template do PDF.

## Perguntas para outros agentes

- **Backend/QA:** confirmar que `/estimates/{id}/pdf` sem sessão devolve 302→/login (e não 401), validando #6.
- **Backend:** há intenção de usar `status=sent`? Se sim, quem o define (compartilhar? botão?).
- **Segurança/multi-tenant:** ao aceitar `?customer_id=` em `estimates.create`, garantir filtro `forBusiness` + teste de 404/ignorar.
- **Produto:** duplicar orçamento e excluir orçamento/cliente estão no roadmap? (rotas `except('destroy')`).
