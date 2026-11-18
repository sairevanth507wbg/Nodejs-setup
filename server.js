// Minimal Node.js app for Posit Connect. Standard library only — no npm dependencies.
//
// Connect sets PORT and proxies requests to it. The app is served under a path prefix
// (e.g. /content/<guid>/), so links in the HTML are relative ("api/info", not "/api/info").

const http = require("node:http");
const os = require("node:os");

const port = Number(process.env.PORT) || 3000;
const startedAt = new Date();

function runtimeInfo() {
  return {
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    hostname: os.hostname(),
    pid: process.pid,
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    runningOnConnect: Boolean(process.env.CONNECT_SERVER || process.env.RSTUDIO_PRODUCT),
  };
}

function page(info) {
  const rows = Object.entries(info)
    .map(([k, v]) => `<tr><th>${k}</th><td>${String(v)}</td></tr>`)
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hello Node.js</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 3rem auto; padding: 0 1rem; color: #1f2937; }
    h1 { margin-bottom: .25rem; }
    p { color: #4b5563; }
    table { border-collapse: collapse; width: 100%; margin-top: 1.5rem; }
    th, td { text-align: left; padding: .5rem .75rem; border-bottom: 1px solid #e5e7eb; }
    th { width: 40%; font-weight: 600; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Hello from Node ${info.node}</h1>
  <p>Running on Posit Connect. JSON: <a href="api/info">api/info</a> · Health: <a href="health">health</a></p>
  <table>${rows}</table>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  // Strip any query string; match on the last path segment so the Connect prefix doesn't matter.
  const path = (req.url || "/").split("?")[0].replace(/\/+$/, "");
  const last = path.split("/").pop();

  if (last === "health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok\n");
  }
  if (path.endsWith("/api/info") || path === "api/info") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(runtimeInfo(), null, 2));
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(page(runtimeInfo()));
});

server.listen(port, () => console.log(`hello-nodejs listening on port ${port}`));

// Let Connect stop the process cleanly.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
