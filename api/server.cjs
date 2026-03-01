const https = require("https")
const http = require("http")
const fs = require("fs")

const targetPort = 4000
const securePort = 4001

const options = {
  key: fs.readFileSync("./api.worklient.test+2-key.pem"),
  cert: fs.readFileSync("./api.worklient.test+2.pem"),
}

https
  .createServer(options, (req, res) => {
    const proxyReq = http.request(
      {
        hostname: "localhost",
        port: targetPort,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (proxyRes) => {
        // Forward status code
        res.statusCode = proxyRes.statusCode || 500

        // Forward all headers exactly as received (including multi-value Set-Cookie)
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            res.setHeader(key, value)
          }
        })

        // Pipe response body
        proxyRes.pipe(res, { end: true })
      }
    )

    proxyReq.on("error", (err) => {
      res.statusCode = 502
      res.end("Proxy error")
    })

    req.pipe(proxyReq, { end: true })
  })
  .listen(securePort, () => {
    console.log(
      `🔐 HTTPS proxy running at https://api.worklient.test:${securePort}`
    )
  })