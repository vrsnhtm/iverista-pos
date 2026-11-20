import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { networkInterfaces } from 'node:os'

const root = resolve(process.cwd(), 'dist')
const parsedPort = Number.parseInt(process.env.PORT ?? '', 10)
const port = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 4173

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

function stamp() {
  return new Date().toLocaleTimeString('en-PH', { hour12: false })
}

function log(req, status, extra = '') {
  const ip = (req.socket.remoteAddress || '').replace('::ffff:', '')
  const ua = req.headers['user-agent'] || '-'
  console.log(`[${stamp()}] ${ip} ${req.method} ${req.url} -> ${status} ${extra} | ${ua}`)
}

async function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-cache',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

const server = createServer(async (req, res) => {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  } catch {
    log(req, 400)
    res.writeHead(400).end('Bad request')
    return
  }

  if (pathname === '/') pathname = '/index.html'

  const filePath = resolve(root, '.' + pathname)
  if (!filePath.startsWith(root + sep)) {
    log(req, 403)
    res.writeHead(403).end('Forbidden')
    return
  }

  try {
    const body = await readFile(filePath)
    log(req, 200, `${body.length}b`)
    await send(res, 200, body, TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream')
  } catch {
    // Single page app: unknown paths fall back to index.html
    try {
      const body = await readFile(resolve(root, 'index.html'))
      log(req, 200, 'index.html fallback')
      await send(res, 200, body, TYPES['.html'])
    } catch {
      log(req, 404)
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end(
        'Build not found. Run "npm run build" first.',
      )
    }
  }
})

server.on('error', (err) => {
  console.error(`Server error: ${err.message}`)
  process.exit(1)
})

server.listen(port, '0.0.0.0', () => {
  const addrs = []
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) addrs.push(net.address)
    }
  }
  console.log('Iverista POS is running.')
  console.log(`  This PC:  http://localhost:${port}`)
  for (const ip of addrs) console.log(`  Phone:    http://${ip}:${port}`)
  console.log('Leave this window open. Press Ctrl+C to stop.')
})
