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

/**
 * タイトル画面からプレイ中の画面まで進める操作。SETTLE_MS 待ったあとに順に実行する。
 * 座標は VIEWPORT 上の px。ここにないゲームはタイトル画面（自動再生デモはその画面）を撮る。
 *
 *   ['tap', x, y]          押して 120ms 後に離す（tmlib.js は一瞬のクリックを取りこぼす）
 *   ['key', key]           キーを押して離す
 *   ['hold', key, ms]      キーを押し続ける
 *   ['text', label]        その文字のボタン（複数あれば最後のもの）の中心を tap
 *   ['drag', [x, y], [x, y]]
 *   ['zoom', x, y, n]      (x, y) でホイールを n 回奥へ回して寄る
 *   ['wait', ms]
 */
const PLAY = {
  'quest-for-tanelorn': [['key', 'z'], ['wait', 2500], ['key', 'z'], ['wait', 6000], ['hold', 'ArrowRight', 1500], ['key', 'z'], ['hold', 'ArrowRight', 2500], ['key', 'z'], ['wait', 200]],
  'the-stars-my-destination': [['tap', 640, 400], ['wait', 3000], ['tap', 640, 400], ['wait', 9000]],
  // 言語選択 → 初回チュートリアルを SKIP → PLAY → NORMAL
  'shotgun-poker': [['tap', 528, 397], ['wait', 3000], ['tap', 776, 61], ['wait', 3000], ['tap', 640, 320], ['wait', 2000], ['tap', 640, 320], ['wait', 6000]],
  'quick-draw-ex': [['tap', 640, 700], ['wait', 6000]],
  'touch-de-shot': [['tap', 640, 600], ['wait', 3000], ['drag', [640, 650], [560, 550]], ['wait', 3000]],
  'planet-buster-revision': [['tap', 640, 474], ['wait', 3000], ['tap', 640, 474], ['wait', 10000]],
  'planet-strike': [['key', 'Space'], ['wait', 4000], ['key', 'm'], ['wait', 3000]], // 立体銀河図
  'no-life-king': [['tap', 640, 432], ['wait', 20000]],
  'shooting-360': [['key', 'z'], ['wait', 8000], ['hold', 'z', 4000]],
  'planet-buster': [['tap', 400, 400], ['wait', 6000]],
  'planet-buster-2': [['tap', 400, 400], ['wait', 2500], ['tap', 400, 512], ['wait', 1000], ['tap', 400, 512], ['wait', 17000]],
  'fruits-slash': [['tap', 400, 400], ['wait', 6000]],
  'return-of-hayabusa': [['tap', 400, 400], ['wait', 6000]],
  'apple-catch': [['tap', 400, 400], ['wait', 6000]],
  'hiyoko-fly-high': [['tap', 640, 560], ['wait', 8000], ['tap', 640, 500], ['wait', 8000]],
  'the-stars-my-destination-original': [['tap', 400, 400], ['wait', 6000]],
  // 開戦 → 全軍突撃 → ×3 → 前線に寄る。遅いと夜になって暗い
  'the-last-battalion': [
    ['tap', 640, 513], ['wait', 5000], ['text', '開戦する'], ['wait', 3000],
    ['tap', 482, 750], ['wait', 1500], ['text', '全軍突撃'], ['wait', 500],
    ['tap', 686, 750], ['wait', 300], ['tap', 686, 750], ['wait', 5000],
    ['zoom', 620, 300, 6], ['wait', 6000],
  ],
}

async function tap(page, x, y) {
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.waitForTimeout(120)
  await page.mouse.up()
}

async function play(page, steps) {
  for (const [op, a, b, c] of steps) {
    if (op === 'tap') {
      await tap(page, a, b)
    }
    else if (op === 'text') {
      const box = await page.getByText(a).last().boundingBox()
      await tap(page, box.x + box.width / 2, box.y + box.height / 2)
    }
    else if (op === 'zoom') {
      await page.mouse.move(a, b)
      for (let i = 0; i < c; i++) {
        await page.mouse.wheel(0, -250)
        await page.waitForTimeout(150)
      }
      // カーソルを画面の端へ逃がして、ホバー表示を写さない
      await page.mouse.move(VIEWPORT.width - 10, b)
    }
    else if (op === 'key') {
      await page.keyboard.down(a)
      await page.waitForTimeout(120)
      await page.keyboard.up(a)
    }
    else if (op === 'hold') {
      await page.keyboard.down(a)
      await page.waitForTimeout(b)
      await page.keyboard.up(a)
    }
    else if (op === 'drag') {
      await page.mouse.move(a[0], a[1])
      await page.mouse.down()
      await page.mouse.move(b[0], b[1], { steps: 10 })
      await page.mouse.up()
    }
    else if (op === 'wait') {
      await page.waitForTimeout(a)
    }
  }
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

// GPU を使わないと three.js 製はコマ送りになり、プレイ画面まで進まない
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })

const shot = []

for (const game of targets) {
  const page = await context.newPage()
  try {
    await page.goto(game.url, { waitUntil: 'load', timeout: 45000 })
    // ローディングやタイトルのアニメーションが落ち着くまで待つ
    await page.waitForTimeout(SETTLE_MS)
    if (PLAY[game.slug]) await play(page, PLAY[game.slug])

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
