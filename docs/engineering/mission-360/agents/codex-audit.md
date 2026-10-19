Li `CLAUDE.md` e `docs/sistema.md`. Não li `.env`, não inicializei o Laravel e não alterei arquivos. O TypeScript passou; executei apenas verificações sem escrita, incluindo conversão monetária e formatação em memória.

Não identifiquei evidência suficiente para P0/P1, IDOR direto entre oficinas ou N+1 nos fluxos principais. A criação usa transação, trava da oficina e índice único para a numeração; o servidor recalcula os totais em centavos.

**Comprovados pelo código ou por reprodução isolada**

1. **P2 — Conversão monetária transforma entrada inválida em cobrança positiva. Confiança: alta.**  
   `moneyToCents("-10,00")` retorna `1000`; `"abc12,34"` retorna `1234`. O formulário envia esses resultados como valores válidos. Evidência: [format.ts:27](resources/js/lib/format.ts:27), [form.tsx:129](resources/js/pages/estimates/form.tsx:129). **Correção mínima:** validar o formato completo antes da conversão, rejeitando sinal negativo, letras e separadores inválidos.

2. **P2 — E-mail com maiúsculas pode impedir o próximo login. Confiança: alta.**  
   O comando e a edição de perfil salvam o e-mail sem normalização, enquanto o Fortify converte o login para minúsculas. No PostgreSQL padrão, `Joao@exemplo.com` difere de `joao@exemplo.com`. Evidência: [CreateBusinessCommand.php:54](app/Console/Commands/CreateBusinessCommand.php:54), [ProfileController.php:33](app/Http/Controllers/Settings/ProfileController.php:33), [fortify.php:63](config/fortify.php:63). **Correção mínima:** normalizar antes da validação de unicidade e persistência; revisar registros existentes.

3. **P2 — Endereço aceito pela validação excede a coluna. Confiança: alta.**  
   A validação permite 500 caracteres; a migration declara `string`, cujo limite padrão é 255. Entre 256 e 500 caracteres passam pela validação e falham na gravação no PostgreSQL. Evidência: [BusinessRequest.php:21](app/Http/Requests/BusinessRequest.php:21), [migration:20](database/migrations/0001_01_01_000000_create_users_table.php:20). **Correção mínima:** reduzir para `max:255` ou ampliar a coluna por uma nova migration.

4. **P2 — Transferir veículo deixa orçamentos com cliente incompatível. Confiança: alta.**  
   A edição permite trocar `vehicle.customer_id`, mas os orçamentos existentes conservam seu `customer_id`. A verificação de compatibilidade ocorre somente ao salvar o orçamento. Evidência: [VehicleController.php:47](app/Http/Controllers/VehicleController.php:47), [EstimateRequest.php:36](app/Http/Requests/EstimateRequest.php:36). **Correção mínima:** bloquear a transferência quando houver orçamento vinculado, até definir como preservar o histórico.

5. **P2 — Middleware `verified` não exige verificação de e-mail. Confiança: alta.**  
   `User` não implementa `MustVerifyEmail`; portanto, o middleware permite usuários autenticados com e-mail não verificado, inclusive após alteração no perfil. Evidência: [User.php:31](app/Models/User.php:31), [web.php:37](routes/web.php:37), [middleware instalado:34](vendor/laravel/framework/src/Illuminate/Auth/Middleware/EnsureEmailIsVerified.php:34). **Correção mínima:** implementar o contrato e completar o envio inicial/reenvio. O impacto está limitado a contas já autenticadas.

6. **P2 — Listagens e seletores carregam toda a oficina. Confiança: alta.**  
   Clientes e orçamentos terminam em `get()`, sem paginação. Criar/editar orçamento também transfere todos os clientes e veículos. O custo cresce continuamente, especialmente em celular e nas buscas sucessivas. Evidência: [CustomerController.php:19](app/Http/Controllers/CustomerController.php:19), [EstimateController.php:24](app/Http/Controllers/EstimateController.php:24), [EstimateController.php:76](app/Http/Controllers/EstimateController.php:76). **Correção mínima:** paginar listagens e buscar opções sob demanda, com veículos filtrados pelo cliente. Não medi degradação em produção.

7. **P2 — Data padrão avança antes da meia-noite brasileira. Confiança: alta.**  
   O formulário usa UTC via `toISOString()`. Reproduzido: em São Paulo, `19/10/2026 22:30` preenche `2026-10-20`. Evidência: [form.tsx:59](resources/js/pages/estimates/form.tsx:59). **Correção mínima:** montar `YYYY-MM-DD` usando a data local ou receber do servidor a data no fuso definido pelo negócio.

8. **P2 — Sessão expirada pode produzir um “PDF” contendo HTML. Confiança: alta.**  
   `fetch()` segue o redirecionamento para login; a resposta final pode ser HTTP 200. O código verifica apenas `ok` e salva qualquer corpo com extensão `.pdf`. Evidência: [show.tsx:57](resources/js/pages/estimates/show.tsx:57), [web.php:37](routes/web.php:37). **Correção mínima:** exigir `Content-Type: application/pdf` e tratar redirecionamento/expiração solicitando novo login.

9. **P2 — Há divergências que reprovam a formatação do CI. Confiança: alta.**  
   O CI chama `composer ci:check`, que executa `vp check`. O Oxfmt instalado, com as opções do projeto, encontrou diferenças nos dois documentos abaixo; eles não estão excluídos. Evidência: [composer.json:67](composer.json:67), [vite.config.ts:59](vite.config.ts:59), [sistema.md:18](docs/sistema.md:18), [railway.md:42](docs/railway.md:42). **Correção mínima:** formatar esses arquivos. Verifiquei a divergência em memória, sem executar o pipeline completo.

10. **P3 — Status “Enviado” não pode ser definido pela interface. Confiança: alta.**  
    Novos orçamentos recebem `draft`; não há campo para mudar o status, e compartilhar o PDF não o atualiza. Assim, o uso normal mantém o orçamento como rascunho. Evidência: [form.tsx:60](resources/js/pages/estimates/form.tsx:60), [show.tsx:88](resources/js/pages/estimates/show.tsx:88). **Correção mínima:** oferecer uma ação explícita “Marcar como enviado”.

11. **P3 — Busca ignora corretamente maiúsculas apenas em caracteres ASCII. Confiança: alta.**  
    O banco aplica `lower()`, mas o PHP usa `strtolower()`. Reproduzido: `"JOÃO"` vira `"joÃo"`, incompatível com `"joão"` no PostgreSQL usual. Evidência: [CustomerController.php:18](app/Http/Controllers/CustomerController.php:18), [EstimateController.php:23](app/Http/Controllers/EstimateController.php:23). **Correção mínima:** usar `mb_strtolower()` consistentemente ou `ILIKE` no PostgreSQL.

**Hipóteses — exigem reprodução concorrente, navegador ou inspeção da infraestrutura**

12. **P2 — Edições simultâneas podem duplicar itens e romper o total. Confiança: alta na plausibilidade.**  
    Quando apenas descrições mudam, o pai pode permanecer sem atributos alterados: o Eloquent não executa `UPDATE` nem adquire sua trava. Duas substituições de itens podem então intercalar exclusões/inserções. Evidência: [UpdateEstimate.php:12](app/Actions/UpdateEstimate.php:12), [Model.php:1399](vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php:1399). **Correção mínima:** buscar/travar o orçamento dentro da transação antes de alterar itens; validar com duas conexões PostgreSQL. Para impedir sobrescrita de edições antigas, acrescentar controle de versão.

13. **P2 — PDF pode combinar total antigo com itens novos. Confiança: alta na plausibilidade.**  
    O carregamento do orçamento e das relações usa consultas distintas, sem snapshot consistente. Uma edição confirmada entre essas consultas pode gerar documento cuja soma não corresponde ao total. Evidência: [EstimatePdfController.php:14](app/Http/Controllers/EstimatePdfController.php:14), [UpdateEstimate.php:14](app/Actions/UpdateEstimate.php:14). **Correção mínima:** carregar o conjunto em transação com snapshot consistente, como `REPEATABLE READ`, ou adotar travas coordenadas entre leitura e escrita.

14. **P2 — Deploy pode publicar mesmo com CI vermelho. Confiança: média sobre a configuração vigente.**  
    A documentação afirma explicitamente que o Railway publica em paralelo e que o CI não bloqueia o deploy. Não consultei as configurações remotas para confirmar seu estado atual. Evidência: [railway.md:46](docs/railway.md:46), [tests.yml:34](.github/workflows/tests.yml:34). **Correção mínima:** condicionar o deploy ao sucesso dos checks obrigatórios.

15. **P2 — Compartilhamento mobile pode perder a autorização do toque. Confiança: média.**  
    `navigator.share()` é chamado somente depois de baixar/gerar o PDF. Uma resposta lenta pode consumir a janela de ativação do usuário exigida pelo navegador; nesse caso, aparece apenas erro genérico. Evidência: [show.tsx:92](resources/js/pages/estimates/show.tsx:92), [show.tsx:98](resources/js/pages/estimates/show.tsx:98). **Correção mínima:** preparar o arquivo antes e oferecer um segundo toque para compartilhar; verificar em Safari/iOS e Chrome/Android.
