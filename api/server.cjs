const https = require("https")
const http = require("http")
const fs = require("fs")

const targetPort = 4000
const securePort = 4001

const options = {
  key: fs.readFileSync("./api.local.worklient.test-key.pem"),
  cert: fs.readFileSync("./api.local.worklient.test.pem"),
}

https.createServer(options, (req, res) => {
  const proxyReq = http.request(
    {
      hostname: "localhost",
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res, { end: true })
    }
  )

  req.pipe(proxyReq, { end: true })
}).listen(securePort, () => {
  console.log(`🔐 HTTPS proxy running at https://api.local.worklient.test:${securePort}`)
})