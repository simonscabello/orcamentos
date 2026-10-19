**Não recomendo o merge ainda.** Há uma falha no novo fluxo de reautenticação do PDF, além de uma regressão restrita ao SQLite e lacunas nas correções e nos testes. Não identifiquei P0/P1.

1. **P2 — Reautenticação do PDF termina em resposta incompatível com Inertia.**  
   [resources/js/pages/estimates/show.tsx:92](resources/js/pages/estimates/show.tsx:92)  
   **Evidência:** o GET do PDF sem sessão salva `/estimates/{id}/pdf` em `url.intended`. Confirmei que o Fortify redireciona para esse endereço após o login. Como o formulário de login usa Inertia, o PDF é recebido pela navegação AJAX e tratado como resposta inválida, sem concluir o fluxo esperado.  
   **Correção:** fazer a reautenticação retornar à página do orçamento; testar sessão expirada → login → novo download.

2. **P2 — A validação monetária ainda transforma entradas malformadas em valores válidos — lacuna preexistente.**  
   [resources/js/lib/format.ts:34](resources/js/lib/format.ts:34)  
   **Evidência:** executei a função: `10,,50` resulta em **1.000 centavos**, e `1,2,3` em **120 centavos**. A nova guarda verifica caracteres, mas permite separadores inválidos; o restante do parser descarta informação silenciosamente. O servidor recebe um inteiro positivo e aceita.  
   **Correção:** validar o formato completo antes da conversão, rejeitando vírgulas repetidas e agrupamentos inválidos; adicionar testes desses casos.

3. **P2 — Os testes não demonstram a correção de concorrência.**  
   [tests/Feature/EstimateIntegrityTest.php:23](tests/Feature/EstimateIntegrityTest.php:23)  
   **Evidência:** o teste cria e atualiza sequencialmente. Ele também passa com o comportamento anterior, sem o novo `lockForUpdate()`. Executar essa mesma suíte em PostgreSQL não cria duas transações concorrentes.  
   **Correção:** adicionar teste com duas conexões e intercalamento controlado, verificando os itens finais e `total === soma(items.amount)`. O teste deve falhar quando o lock é removido.

4. **P3 — Busca regride para nomes com acentos maiúsculos no SQLite.**  
   [app/Support/SearchTerm.php:17](app/Support/SearchTerm.php:17)  
   **Evidência:** reproduzi em SQLite: buscar `JOÃO` em um registro chamado `JOÃO` encontrava antes e deixa de encontrar agora. O `mb_strtolower()` produz `joão`, enquanto o `lower()` padrão do SQLite produz `joÃO`. A fixture nova usa `João`, ocultando essa assimetria.  
   **Correção:** usar normalização Unicode compatível nos dois lados no SQLite e testar nomes armazenados também em maiúsculas. Não reproduzi esse problema em PostgreSQL.

5. **P3 — O filtro numérico ainda permite IDs que causam erro 500 — lacuna preexistente.**  
   [routes/web.php:55](routes/web.php:55)  
   **Evidência:** `9223372036854775808` passa em `[0-9]+`, mas não cabe no `int` PHP. Reproduzi o `TypeError` no dispatcher Laravel. O teste cobre apenas `abc`.  
   **Correção:** validar também a faixa do identificador antes da chamada ao controller, retornando 404 para valores fora dela; cobrir GET, PUT e PATCH.

6. **P3 — O teste de ordenação pode passar sem o `orderBy`.**  
   [tests/Feature/EstimateIntegrityTest.php:53](tests/Feature/EstimateIntegrityTest.php:53)  
   **Evidência:** inserção e leitura simples já retornam a ordem esperada no SQLite sem ordenação explícita. Além disso, apenas o primeiro e o último item são conferidos; uma troca dos dois intermediários passa.  
   **Correção:** comparar a sequência completa e criar uma condição adversa, por exemplo usando `PRAGMA reverse_unordered_selects=ON` no teste SQLite.

7. **P3 — O teste de subsetting prova tamanho, mas não integridade do PDF.**  
   [tests/Feature/EstimateTenantTest.php:149](tests/Feature/EstimateTenantTest.php:149)  
   **Evidência:** qualquer resposta 200 abaixo de 150 KB satisfaz a nova asserção, inclusive um PDF vazio ou sem os textos acentuados. O teste existente de `%PDF` também não garante esse conteúdo.  
   **Correção:** manter o limite de tamanho e verificar o texto extraído do PDF, incluindo itens, valores e acentos; verificar as fontes incorporadas se a intenção for provar subsetting.

A revisão usou inspeção do diff e reproduções isoladas em memória. Não executei a suíte completa no ambiente somente leitura, não alterei arquivos e não acessei `.env`.
