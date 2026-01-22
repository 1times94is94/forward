import express from "express";
import http from "http";
import httpProxy from "http-proxy";

const TARGET = "https://russian-school-of-math.xyz";
const TARGET_WS = "wss://russian-school-of-math.xyz";

const app = express();

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: true,
  ws: true,
  xfwd: false
});

proxy.on("proxyReq", (proxyReq) => {
  proxyReq.removeHeader("x-forwarded-for");
  proxyReq.removeHeader("x-forwarded-proto");
  proxyReq.removeHeader("x-forwarded-host");
});

proxy.on("error", (err, req, res) => {
  if (res?.writeHead) {
    res.writeHead(502);
    res.end("Bad gateway");
  }
});

app.use((req, res) => {
  proxy.web(req, res, { target: TARGET });
});

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  if (!req.url.startsWith("/api")) {
    socket.destroy();
    return;
  }

  proxy.ws(req, socket, head, {
    target: TARGET_WS
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("Proxy + WS listening on", port);
});
