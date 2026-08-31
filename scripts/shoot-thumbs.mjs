#!/usr/bin/env node
/**
 * 公開済みのゲーム URL に Playwright でアクセスし、タイトル画面をサムネイルとして保存する。
 *
 *   npm i -D playwright && npx playwright install chromium
 *   npm run thumbs              … thumb 未設定のゲームだけ撮影
 *   npm run thumbs -- --force   … すべて撮り直す
 *   npm run thumbs -- planet-strike glshooter2   … slug 指定
 *   npm run thumbs -- --write   … 撮れたものを games.json の thumb に書き戻す
 *
 * --write を付けない限り games.json は書き換えない。
 * 手で用意したサムネをスクリプトが勝手に上書きしないようにするため。
 *
 * 出力は data/screenshot/<slug>.jpg。public/ ではなくビルド時に
 * Vite が取り込む（app/components/GameThumb.vue を参照）。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'data/screenshot')
const gamesPath = resolve(root, 'data/games.json')

/** タイトル画面が出るまでの待ち時間(ms)。重いゲームは増やす */
const SETTLE_MS = 8000
const VIEWPORT = { width: 1280, height: 800 }
/** これより小さい canvas は「まだ描かれていない」とみなして全画面撮影に落とす */
const MIN_CANVAS = 120

/**
 * 描画領域がビューポートより小さく、右や下に白余白が出るゲーム。
 * canvas 自体はビューポート全面なので要素切り出しでは削れず、座標で指定する。
 */
const CLIP = {
  'planet-buster': { x: 0, y: 0, width: 800, height: 800 },
  'fruits-slash': { x: 0, y: 0, width: 800, height: 800 },
  'return-of-hayabusa': { x: 0, y: 0, width: 800, height: 800 },
}

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
const write = args.includes('--write')
const only = args.filter(a => !a.startsWith('--'))

const games = JSON.parse(await readFile(gamesPath, 'utf8'))

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
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })

const shot = []

for (const game of targets) {
  const page = await context.newPage()
  try {
    await page.goto(game.url, { waitUntil: 'load', timeout: 45000 })
    // ローディングやタイトルのアニメーションが落ち着くまで待つ
    await page.waitForTimeout(SETTLE_MS)

    // 縦長ゲームは画面の大半が余白になるので、ゲーム領域だけ切り出す。
    // canvas がない enchant.js 製は #enchant-stage が実体。
    let target = page
    let box = null
    let how = '全画面'
    const clip = CLIP[game.slug]
    if (clip) {
      how = `clip ${clip.width}x${clip.height}`
    }
    else {
      for (const sel of ['canvas', '#enchant-stage']) {
        const el = page.locator(sel).first()
        if (!await el.count()) continue
        const b = await el.boundingBox()
        if (!b || b.width < MIN_CANVAS || b.height < MIN_CANVAS) continue
        target = el
        box = b
        how = `${sel} ${Math.round(b.width)}x${Math.round(b.height)}`
        break
      }
    }

    const name = `${game.slug}.jpg`
    await target.screenshot({ path: resolve(outDir, name), type: 'jpeg', quality: 82, ...(clip ? { clip } : {}) })
    shot.push([game.slug, name])
    console.log(`✓ ${name}  ← ${game.url}  (${how})`)
  }
  catch (err) {
    console.error(`✗ ${game.slug}: ${err.message}`)
  }
  finally {
    await page.close()
  }
}

await browser.close()

if (write && shot.length) {
  const byslug = new Map(shot)
  for (const g of games) {
    const name = byslug.get(g.slug)
    if (name) g.thumb = name
  }
  await writeFile(gamesPath, `${JSON.stringify(games, null, 2)}\n`, 'utf8')
  console.log(`\ngames.json の thumb を ${shot.length} 件更新しました。`)
}
else {
  console.log(`\ndata/screenshot/ に ${shot.length} 件保存しました。--write で games.json の thumb に書き戻せます。`)
}
