const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

const hostname = 'app.worklient.test'
const port = 3000
const dev = true

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('./api.worklient.test+2-key.pem'),
  cert: fs.readFileSync('./api.worklient.test+2.pem'),
}

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, hostname, () => {
    console.log(`🚀 Running at https://${hostname}:${port}`)
  })
})
