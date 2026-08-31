#!/usr/bin/env node
/**
 * 公開済みのゲーム URL に Playwright でアクセスし、タイトル画面をサムネイルとして保存する。
 *
 *   npm i -D playwright && npx playwright install chromium
 *   npm run thumbs              … thumb 未設定のゲームだけ撮影
 *   npm run thumbs -- --force   … すべて撮り直す
 *   npm run thumbs -- planet-strike glshooter2   … slug 指定
 *
 * 撮影後、games.json の thumb は自動では書き換えない。
 * 出力ファイル名を確認してから thumb フィールドに書いてください
 * （自動生成に頼らず手で用意したサムネを、スクリプトが上書きしないようにするため）。
 */
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/thumbs')

/** タイトル画面が出るまでの待ち時間(ms)。重いゲームは増やす */
const SETTLE_MS = 6000
const VIEWPORT = { width: 1280, height: 800 }

let chromium
try {
  ({ chromium } = await import('playwright'))
}
catch {
  console.error('playwright が入っていません:\n  npm i -D playwright && npx playwright install chromium')
  process.exit(1)
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const only = args.filter(a => !a.startsWith('--'))

const games = JSON.parse(await readFile(resolve(root, 'data/games.json'), 'utf8'))

const targets = games.filter((g) => {
  if (!g.url) return false
  if (only.length) return only.includes(g.slug)
  return force || !g.thumb
})

if (!targets.length) {
  console.log('撮影対象がありません。--force で全件撮り直せます。')
  process.exit(0)
}

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })

for (const game of targets) {
  const page = await context.newPage()
  try {
    await page.goto(game.url, { waitUntil: 'load', timeout: 45000 })
    // ローディングやタイトルのアニメーションが落ち着くまで待つ
    await page.waitForTimeout(SETTLE_MS)
    const file = resolve(outDir, `${game.slug}.png`)
    await page.screenshot({ path: file })
    console.log(`✓ ${game.slug}.png  ← ${game.url}`)
  }
  catch (err) {
    console.error(`✗ ${game.slug}: ${err.message}`)
  }
  finally {
    await page.close()
  }
}

await browser.close()
console.log(`\npublic/thumbs/ に保存しました。games.json の thumb に "<slug>.png" を設定してください。`)
