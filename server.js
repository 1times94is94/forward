import express from "express";
import http from "http";
import httpProxy from "http-proxy";

const TARGET = "https://russian-school-of-math.xyz";
const TARGET_WS = "wss://russian-school-of-math.xyz/ws";
//const TARGET_HOST = "REAL_HOST_HEADER";

const app = express();

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: true,
  ws: true,
  xfwd: false
});

// Force Host + clean headers (HTTP)
proxy.on("proxyReq", (proxyReq) => {
//  proxyReq.setHeader("Host", TARGET_HOST);
  proxyReq.removeHeader("x-forwarded-for");
  proxyReq.removeHeader("x-forwarded-proto");
  proxyReq.removeHeader("x-forwarded-host");
});

// Force Host for WS too
proxy.on("proxyReqWs", (proxyReq) => {
  proxyReq.setHeader("Host", TARGET_HOST);
});

// Handle proxy errors
proxy.on("error", (err, req, res) => {
  if (res.writeHead) {
    res.writeHead(502);
    res.end("Bad gateway");
  }
});

// HTTP → proxy
app.use((req, res) => {
  proxy.web(req, res, { target: TARGET });
});

// Create raw server
const server = http.createServer(app);

// 🔴 THIS IS THE CRITICAL PART 🔴
server.on("upgrade", (req, socket, head) => {
  if (!req.url.startsWith("/ws")) {
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
