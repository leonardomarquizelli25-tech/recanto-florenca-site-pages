var dsnMeta = document.querySelector('meta[name="sentry-dsn"]');
var dsn = dsnMeta ? dsnMeta.content.trim() : "";

if (dsn) {
  import("./observability-sentry.bundle.js")
    .then((module) => {
      module.initObservability(dsn);
    })
    .catch((error) => {
      console.warn("Observabilidade indisponível.", error);
    });
}
