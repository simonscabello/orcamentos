# Deploy no Railway

Este projeto não traz `railway.toml` nem `railway.json`: Config as Code está depreciado. A documentação atual recomenda Infrastructure as Code, gerado por `railway config init` em `.railway/railway.ts`. Como este diretório não está autenticado ou ligado a uma conta Railway, o arquivo não foi inventado com IDs fictícios.

## Primeiro deploy

1. Instale a CLI (`npm i -g @railway/cli`) e execute `railway login`.
2. Na raiz do repositório, execute `railway init` para criar o projeto (ou `railway link` para um existente).
3. No painel, adicione **PostgreSQL** em **New → Database → PostgreSQL**. O projeto terá somente este serviço e o serviço da aplicação.
4. Conecte o repositório GitHub ao serviço da aplicação, com a raiz apontando para este projeto.
5. Execute `railway config init`, revise `.railway/railway.ts`, depois `railway config plan` e `railway config apply`. Use essa configuração para registrar as opções de deploy, nunca os formatos legados.

## Variáveis da aplicação

No serviço Laravel, configure:

```text
APP_ENV=production
APP_DEBUG=false
APP_KEY=<resultado de php artisan key:generate --show>
APP_URL=https://<dominio>
LOG_CHANNEL=stderr
DB_CONNECTION=pgsql
DB_URL=${{Postgres.DATABASE_URL}}
RAILPACK_SKIP_MIGRATIONS=true
```

Railpack detecta PHP/Laravel e Vite; não crie Dockerfile. Defina o build para executar `npm run build` se a detecção não o fizer automaticamente. Em Deploy, use `php artisan migrate --force` como **Pre-deploy command**: ele roda na rede privada após o build e antes de a nova versão receber tráfego; uma falha bloqueia o deploy. Não execute seeders em produção.

Defina `/up` como **Healthcheck Path** e gere o domínio em Networking. `LOG_CHANNEL=stderr` envia logs para o painel e `railway logs`. Use `railway logs` após o primeiro deploy para conferir build, migration e servidor.

Por fim, faça push no repositório ou execute `railway up`. Não há worker, cron, volume de aplicação nem uploads persistentes neste MVP. O filesystem de deploy é efêmero; o PDF é gerado na resposta e não é salvo.
