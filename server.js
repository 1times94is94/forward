import express from "express";
import httpProxy from "http-proxy";

const app = express();

const TARGET = "https://russian-school-of-math.xyz";
//const TARGET_HOST = "REAL_HOST_HEADER";

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: true,
  xfwd: false
});

// Remove obvious proxy fingerprints
proxy.on("proxyReq", (proxyReq) => {
//  proxyReq.setHeader("Host", TARGET_HOST);
  proxyReq.removeHeader("x-forwarded-for");
  proxyReq.removeHeader("x-forwarded-proto");
  proxyReq.removeHeader("x-forwarded-host");
});

// Stream errors cleanly
proxy.on("error", (err, req, res) => {
  res.writeHead(502);
  res.end("Bad gateway");
});

// Catch *everything*
app.use((req, res) => {
  proxy.web(req, res, {
    target: TARGET,
    selfHandleResponse: false
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Proxy listening on", port);
});
