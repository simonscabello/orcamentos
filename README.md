# Orçamentos

MVP mobile-first para oficinas criarem orçamentos profissionais em poucos minutos. É um monólito SaaS Laravel: cada usuário pertence a uma oficina e todos os dados de clientes, veículos e orçamentos são isolados por empresa.

## Stack

Laravel 13, PHP 8.5, PostgreSQL, React 19, TypeScript, Inertia 3, Tailwind 4, Vite, Pest e DomPDF.

## Executar localmente

Requisitos: PHP 8.5, Composer, Node 24+, npm e Docker.

```bash
cp .env.example .env
docker compose up -d
composer install
npm install
php artisan key:generate
php artisan migrate
npm run build
composer run dev
```

Abra `http://localhost:8000`. O Compose contém apenas PostgreSQL 17, com banco, usuário e senha `app`, volume persistente e porta local `5434` (a porta interna do container continua `5432`).

## Qualidade

```bash
vendor/bin/pint
npm run check
npm run types:check
npm run build
php artisan test
```

## Criar uma oficina

Com o cadastro público desabilitado, crie oficinas pelo comando abaixo:

```bash
php artisan business:create
```

Também é possível informar os dados sem perguntas interativas:

```bash
php artisan business:create --name="Oficina do André" --owner="André" --email="andre@example.com" --password="uma-senha-segura"
```

## Estrutura

`businesses`, `users`, `customers`, `vehicles`, `estimates` e `estimate_items`. Valores são inteiros em centavos; o total é sempre calculado no servidor. A sequência visível é única por `business_id`.

Rotas autenticadas: `/dashboard`, `/customers`, `/vehicles`, `/estimates`, `/settings/business`. PDFs são gerados sob demanda em `/estimates/{id}/pdf`. O PWA usa manifest e service worker sem cache de páginas autenticadas.

## Deploy

O deploy de produção usa Railway/Railpack, sem Dockerfile ou Compose. Consulte [docs/railway.md](docs/railway.md).
