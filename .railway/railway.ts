import { defineRailway, postgres, preserve, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "us-east4-eqdc4a" });
  Postgres.networking = { privateNetworkEndpoint: "postgres" };
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "us-east4-eqdc4a", sizeMB: 5000 });
  const app = service("app", {
    replicas: { "us-east4-eqdc4a": 1 },
    env: { APP_DEBUG: preserve(), APP_ENV: preserve(), APP_KEY: preserve(), APP_NAME: preserve(), CACHE_STORE: preserve(), DB_CONNECTION: preserve(), DB_URL: preserve(), FILESYSTEM_DISK: preserve(), LOG_CHANNEL: preserve(), QUEUE_CONNECTION: preserve(), RAILPACK_SKIP_MIGRATIONS: preserve(), SESSION_DRIVER: preserve() },
  });
  app.build = { builder: "railpack" };
  app.deploy = {
    preDeployCommand: ["php artisan migrate --force"],
    healthcheckPath: "/up",
    healthcheckTimeout: 300,
  };

  return project("orcamentos", {
    resources: [Postgres, app, postgresVolume],
  });
});
