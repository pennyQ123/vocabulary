import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const NOTES_FILE = path.resolve('./src/data/user_notes.json')
const PROGRESS_FILE = path.resolve('./src/data/user_progress.json')

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}', 'utf8')
  }
}

function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return true
  }
  return false
}

// Vite plugin: REST API for notes
function notesPlugin() {
  return {
    name: 'notes-api',
    configureServer(server) {
      ensureFile(NOTES_FILE)

      server.middlewares.use('/api/notes', (req, res) => {
        if (cors(req, res)) return

        if (req.method === 'GET') {
          const url = new URL(req.url, 'http://localhost')
          const word = url.searchParams.get('word')
          const notes = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'))
          res.setHeader('Content-Type', 'application/json')
          if (word) res.end(JSON.stringify({ content: notes[word] || '' }))
          else res.end(JSON.stringify(notes))
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            try {
              const { word, content } = JSON.parse(body)
              const notes = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'))
              if (content.trim()) notes[word] = content.trim()
              else delete notes[word]
              fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end()
      })
    },
  }
}

// Progress persistence
function progressPlugin() {
  return {
    name: 'progress-api',
    configureServer(server) {
      ensureFile(PROGRESS_FILE)

      server.middlewares.use('/api/progress', (req, res) => {
        if (cors(req, res)) return

        if (req.method === 'GET') {
          const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(progress))
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            try {
              const { word, total, correct, unknownCount, lastDrill } = JSON.parse(body)
              const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
              progress[word] = { total, correct, unknownCount, lastDrill }
              fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), notesPlugin(), progressPlugin()],
  base: '/vocabulary/',
  build: { emptyOutDir: true },
})
