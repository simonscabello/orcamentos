# Deploy no Railway

## Como funciona

O serviço `app` do Railway está ligado ao repositório GitHub. **Cada push na branch `main` dispara automaticamente build e deploy em produção** (https://orcamentos.up.railway.app). Não é preciso rodar `railway up`.

Fluxo de cada deploy:

1. **Build** com Railpack, que detecta PHP/Laravel e Vite (`npm run build`). Não existe Dockerfile.
2. **Pre-deploy:** `php artisan migrate --force`. Roda antes da nova versão receber tráfego; se falhar, o deploy é bloqueado e a versão anterior continua no ar.
3. **Healthcheck** em `/up` (timeout de 300s).

A infraestrutura está descrita em `.railway/railway.ts`: serviço `app` e PostgreSQL com volume. As variáveis usam `preserve()`, ou seja, os valores ficam só no painel do Railway. Para mudar a infraestrutura:

```bash
railway config plan    # mostra o que mudaria, sem aplicar
railway config apply   # aplica após confirmação
```

## Variáveis da aplicação

```text
APP_ENV=production
APP_DEBUG=false
APP_KEY=<resultado de php artisan key:generate --show>
APP_URL=https://orcamentos.up.railway.app
LOG_CHANNEL=stderr
DB_CONNECTION=pgsql
DB_URL=${{Postgres.DATABASE_URL}}
RAILPACK_SKIP_MIGRATIONS=true
```

`RAILPACK_SKIP_MIGRATIONS=true` evita rodar migrations duas vezes, porque o pre-deploy já cuida disso.

## HTTPS atrás do proxy

O Railway encerra o HTTPS no proxy e repassa a requisição em HTTP para a aplicação. Por isso:

- `bootstrap/app.php` tem `$middleware->trustProxies(at: '*')`;
- `AppServiceProvider` chama `URL::forceHttps()` em produção.

Sem isso o Laravel gera URLs `http://` para CSS/JS, o navegador bloqueia (*mixed content*) e a tela fica preta.

## Cuidados

- Rode os testes antes de fazer push na `main`; o CI do GitHub roda em paralelo, mas não bloqueia o deploy.
- Migrations devem ser seguras para dados existentes. Nunca edite migration já publicada; crie uma nova.
- Não execute seeders em produção. Para criar uma oficina: `railway ssh` e depois `php artisan business:create`.
- Logs: painel do Railway ou `railway logs`.
- Não há worker, cron nem uploads persistentes. O filesystem é efêmero; o PDF é gerado na resposta e não é salvo.
