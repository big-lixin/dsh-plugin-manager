import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const BEGIN = '# >>> dsh-plugin-manager'
const END = '# <<< dsh-plugin-manager'
const PHASE = { 0: 'pending', 1: 'loading', 2: 'active', 3: 'failed', 4: null, 5: 'unloading' }

/** A plugin is user-installed when its module specifier is outside the shipped scope. */
function isCustomName(name) {
  return typeof name === 'string' && name.length > 0 &&
    !name.startsWith('@deepseek-ai/') && !name.startsWith('cordis:')
}

function shortName(name) {
  const base = name.startsWith('@') ? name.slice(name.indexOf('/') + 1) : name
  return base.replace(/^cordis:/, '').replace(/^cordis-plugin-/, '').replace(/^dsh-(host-|client-)?/, '')
}

function listEntries(loader) {
  const entries = []
  for (const entry of loader.entries()) {
    if (entry.options.group) continue
    const name = String(entry.options.name)
    const fiber = entry.fiber
    const phase = fiber ? (PHASE[fiber.state] ?? null) : null
    entries.push({
      id: String(entry.id),
      rowId: String(entry.options.id ?? entry.id),
      name,
      short: shortName(name),
      enabled: !entry.disabled,
      phase,
      custom: isCustomName(name),
    })
  }
  return entries
}

function patchFilePath(ctx) {
  const fromService = ctx.get('dshHomePath')
  if (typeof fromService === 'function') return fromService('cordis.patch.yml')
  if (typeof fromService === 'string' && fromService.length > 0) return join(fromService, 'cordis.patch.yml')
  return join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'cordis.patch.yml')
}

async function readPatch(file) {
  try {
    return await readFile(file, 'utf8')
  } catch {
    return ''
  }
}

/**
 * Merge one disabled flag into the user patch layer. The managed block between
 * BEGIN/END holds one `- id: <rowId>` + `disabled: true` pair per disabled
 * custom plugin; everything else in the file is preserved verbatim. Patch
 * targets are loader ROW ids (`entry.options.id`), never runtime entry ids.
 */
function rewritePatch(content, rowId, disabled) {
  const out = []
  const managed = []
  let inManaged = false
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim()
    if (t === BEGIN) { inManaged = true; continue }
    if (t === END) { inManaged = false; continue }
    if (inManaged) {
      const m = t.match(/^-\s*id:\s*(\S+)/)
      if (m) managed.push(m[1])
      continue
    }
    if (t === '[]') continue
    out.push(line)
  }
  while (out.length > 0 && out[out.length - 1].trim() === '') out.pop()
  if (out.length === 0) {
    out.push('# dsh user-level patch layer, applied over every profile.')
    out.push('# The block between the dsh-plugin-manager markers is managed by')
    out.push('# Settings > Plugins > Plugin Manager; edit other lines freely.')
  }
  const next = managed.filter((x, i) => x !== rowId && managed.indexOf(x) === i)
  if (disabled) next.push(rowId)
  const hasUserEntries = out.some((l) => l.trim().startsWith('-'))
  let text = out.join('\n')
  if (next.length > 0) {
    if (text.length > 0) text += '\n'
    text += BEGIN + '\n'
    for (const x of next) text += `- id: ${x}\n  disabled: true\n`
    text += END + '\n'
  } else if (hasUserEntries) {
    text += '\n'
  } else {
    if (text.length > 0) text += '\n'
    text += '[]\n'
  }
  return text
}

function send(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

export default {
  name: 'dsh-plugin-manager',
  // Hard dependencies: cordis parks this entry until both services exist.
  // Reading webServer lazily via ctx.get() races boot-time concurrent mounts.
  inject: ['loader', 'webServer'],
  apply(ctx) {
    const webServer = ctx.webServer
    const loader = ctx.loader

    const handleList = (req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method not allowed' })
      send(res, 200, { entries: listEntries(loader), patchFile: patchFilePath(ctx) })
    }

    const handleSetDisabled = async (req, res) => {
      if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' })
      try {
        const body = await readBody(req)
        const id = String(body.id ?? '')
        const disabled = body.disabled === true
        let found = null
        for (const entry of loader.entries()) {
          if (entry.options.group) continue
          if (String(entry.options.id ?? entry.id) === id || String(entry.id) === id) { found = entry; break }
        }
        if (found === null) return send(res, 404, { error: `unknown plugin entry: ${id}` })
        const name = String(found.options.name)
        if (!isCustomName(name)) return send(res, 403, { error: `core component is read-only: ${name}` })
        const rowId = String(found.options.id ?? found.id)
        const file = patchFilePath(ctx)
        const text = rewritePatch(await readPatch(file), rowId, disabled)
        await writeFile(file, text, 'utf8')
        send(res, 200, { ok: true, patchFile: file })
      } catch (error) {
        send(res, 500, { error: String((error && error.message) || error) })
      }
    }

    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: '/__plugin-manager__/list',
      handler: handleList,
    }), 'dsh-plugin-manager: list route')
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: '/__plugin-manager__/set-disabled',
      handler: handleSetDisabled,
    }), 'dsh-plugin-manager: set-disabled route')
  },
}
