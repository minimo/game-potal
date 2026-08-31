# game-portal — minimo's toy box

つくったブラウザゲームを一箇所に集めたカタログサイト。サイト名は **minimo's toy box**。

ゲーム本体はそれぞれ別のホスティングにデプロイ済みで、このサイトは
**諸元・説明・URL の管理と、そこへの導線だけ**を担当します。
ゲームのビルドやホスティングには一切関与しません。

## 使い方

```bash
npm ci             # 初回のみ。package-lock.json どおりに入れる
npm run dev        # http://localhost:3000
npm run validate   # games.json の書式チェック
npm run generate   # .output/public に静的サイトを出力
```

### npm のバージョンについて

依存を**追加・更新する**とき（`npm install <pkg>` や `npm update`）は **npm 11 以上**が必要です。
npm 10 系には依存ツリーを組み立てる際に落ちるバグがあり、`Cannot read properties of null
(reading 'edgesOut')` というエラーで停止します。

```bash
npm install -g npm@latest    # 恒久的に上げる場合
npx npm@11 install <pkg>     # 一度だけ回避する場合
```

`npm ci` は package-lock.json のとおりに展開するだけなので、npm 10 でも問題なく動きます。

## ゲームを追加する

`data/games.json` の配列に1件足すだけです。並び順は制作年の新しい順に自動で整列するので、
書く場所はどこでも構いません。

```json
{
  "slug": "my-game",
  "title": "MY GAME",
  "tagline": "一覧カードに出る1行の紹介",
  "description": "詳細ページの本文。改行で段落が分かれます。省略可。",
  "url": "https://example.com/my-game/",
  "repo": "https://github.com/minimo/my-game",
  "thumb": "my-game.png",
  "shots": ["my-game-1.png", "my-game-2.png"],
  "genre": ["shooting", "3d"],
  "tech": ["three.js", "Nuxt 4"],
  "controls": ["mouse", "keyboard"],
  "mobile": false,
  "year": 2026,
  "status": "playable",
  "featured": false
}
```

各項目の意味と取りうる値は `shared/types/game.ts` に定義してあります。
エディタで補完が効くので、そちらを見ながら書くのが早いです。

| 項目 | 必須 | 備考 |
|---|---|---|
| `slug` | ✓ | URL に使う。英小文字・数字・ハイフンのみ。あとから変えるとリンクが切れる |
| `title` / `tagline` | ✓ | |
| `url` | ✓ | 未公開なら空文字にして `status` を `wip` に。PLAY ボタンが無効化される |
| `genre` | ✓ | `shooting` `action` `strategy` `puzzle` `rpg` `simulation` `table` `toy` `3d` |
| `controls` | ✓ | `mouse` `keyboard` `touch` `gamepad` |
| `mobile` | ✓ | スマホで遊べるか。カードに「スマホ可」バッジが出る |
| `year` | ✓ | 制作年。リポジトリの初コミット年を基準にしている。並び順に使う |
| `status` | ✓ | `playable` / `wip` / `archive`。`archive` は一覧のトグルを ON にしないと出ない |
| `description` | | 詳細ページ本文 |
| `thumb` | | `public/thumbs/` のファイル名。**未指定なら slug 由来の色でプレースホルダが出る** |
| `shots` | | `public/shots/` のファイル名の配列 |
| `featured` | | トップの PICK UP 枠に大きく出す。3件まで表示 |

書き終えたら `npm run validate` で slug の重複や URL 抜けを確認できます。

## サムネイル

手で用意しても、自動で撮ってもかまいません。

- **手で用意する場合** … `public/thumbs/` に置いて `thumb` にファイル名を書く。16:10 前後、幅 1280px 程度が目安
- **自動で撮る場合** … 公開中の URL にアクセスしてタイトル画面を撮影します

```bash
npm i -D playwright && npx playwright install chromium
npm run thumbs                      # thumb 未設定のゲームだけ撮影
npm run thumbs -- --force           # 全件撮り直し
npm run thumbs -- my-game           # slug 指定
```

撮影結果は `public/thumbs/<slug>.png` に出ますが、`games.json` は自動では書き換えません。
出来を確認してから `thumb` に書いてください。ローディングが長いゲームは
`scripts/shoot-thumbs.mjs` の `SETTLE_MS` を増やすとうまく撮れます。

## デプロイ

`npm run generate` で `.output/public` に完全な静的サイトが出ます。そのまま配信してください。
詳細ページも静的 HTML として書き出されるので、OGP と検索インデックスが効きます。

サブディレクトリに置く場合は base URL を指定します。

```bash
NUXT_APP_BASE_URL=/portal/ npm run generate
```

## 構成

```
data/games.json            全ゲームのメタデータ（ここだけ触れば運用できる）
shared/types/game.ts       上記の型定義とラベル
app/pages/index.vue        一覧・検索・ジャンル絞り込み
app/pages/g/[slug].vue     詳細ページ
app/components/GameCard.vue / GameThumb.vue
app/assets/main.css        配色などのデザイントークン
scripts/validate.mjs       games.json の検証
scripts/shoot-thumbs.mjs   サムネイル自動撮影
```

配色を変えたい場合は `app/assets/main.css` の `:root` にある変数を触ってください。
