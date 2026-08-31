#!/usr/bin/env node
/** games.json の書き間違いを拾う。npm run generate の前に流すと事故が減る */
import { readFile, access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const games = JSON.parse(await readFile(resolve(root, 'data/games.json'), 'utf8'))

const GENRES = ['shooting', 'action', 'strategy', 'puzzle', 'rpg', 'simulation', 'table', 'toy', '3d']
const CONTROLS = ['mouse', 'keyboard', 'touch', 'gamepad']
const STATUSES = ['playable', 'wip', 'archive']

const errors = []
const seen = new Set()

for (const [i, g] of games.entries()) {
  const at = `[${i}] ${g.slug ?? '(slug なし)'}`
  if (!g.slug || !/^[a-z0-9-]+$/.test(g.slug)) errors.push(`${at}: slug は英小文字・数字・ハイフンのみ`)
  if (seen.has(g.slug)) errors.push(`${at}: slug が重複しています`)
  seen.add(g.slug)

  for (const key of ['title', 'tagline']) {
    if (!g[key]) errors.push(`${at}: ${key} が空です`)
  }
  if (typeof g.url !== 'string') errors.push(`${at}: url は文字列（未公開なら空文字）`)
  if (g.url && !/^https?:\/\//.test(g.url)) errors.push(`${at}: url は http(s):// で始めてください`)
  if (g.status === 'playable' && !g.url) errors.push(`${at}: status=playable なのに url が空です`)

  for (const x of g.genre ?? []) if (!GENRES.includes(x)) errors.push(`${at}: 未知のジャンル "${x}"`)
  for (const x of g.controls ?? []) if (!CONTROLS.includes(x)) errors.push(`${at}: 未知の操作 "${x}"`)
  if (!STATUSES.includes(g.status)) errors.push(`${at}: status は ${STATUSES.join(' | ')}`)
  if (typeof g.mobile !== 'boolean') errors.push(`${at}: mobile は true / false`)
  if (!Number.isInteger(g.year)) errors.push(`${at}: year は数値`)

  if (g.thumb) {
    try { await access(resolve(root, 'data/screenshot', g.thumb)) }
    catch { errors.push(`${at}: サムネイル data/screenshot/${g.thumb} が見つかりません`) }
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} 件の問題:\n` + errors.map(e => `  - ${e}`).join('\n'))
  process.exit(1)
}
console.log(`✓ ${games.length} 件、問題なし`)
