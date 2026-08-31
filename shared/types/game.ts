/** ゲーム1本の諸元。data/games.json の各要素がこの形に対応する */
export interface Game {
  /** URL に使う識別子。英小文字とハイフンのみ。重複不可 */
  slug: string
  title: string
  /** 一覧カードに出る 1 行キャッチ */
  tagline: string
  /** 詳細ページの本文。改行で段落が分かれる。省略可 */
  description?: string

  /** デプロイ済みのゲーム本体 URL。未公開なら空文字にして status を wip にする */
  url: string
  /** ソースコードの置き場。省略可 */
  repo?: string

  /** public/thumbs/ 配下のファイル名。未指定なら自動生成のプレースホルダが出る */
  thumb?: string
  /** 詳細ページに並べるスクリーンショット。public/shots/ 配下のファイル名 */
  shots?: string[]

  genre: Genre[]
  /** 使用ライブラリ・フレームワーク。表記はそのまま出るので統一しておく */
  tech: string[]
  controls: Control[]
  /** スマホ・タブレットで遊べるか */
  mobile: boolean

  /** 制作年。リポジトリの初コミット年を基準にしている */
  year: number
  status: Status
  /** トップの注目枠に大きく出す */
  featured?: boolean
}

export type Genre =
  | 'shooting' | 'action' | 'strategy' | 'puzzle' | 'rpg'
  | 'simulation' | 'table' | 'toy' | '3d'

export type Control = 'mouse' | 'keyboard' | 'touch' | 'gamepad'

export type Status = 'playable' | 'wip' | 'archive'

export const GENRE_LABELS: Record<Genre, string> = {
  shooting: 'シューティング',
  action: 'アクション',
  strategy: 'ストラテジー',
  puzzle: 'パズル',
  rpg: 'RPG',
  simulation: 'シミュレーション',
  table: 'テーブル',
  toy: 'トイ・実験',
  '3d': '3D',
}

export const CONTROL_LABELS: Record<Control, string> = {
  mouse: 'マウス',
  keyboard: 'キーボード',
  touch: 'タッチ',
  gamepad: 'ゲームパッド',
}

export const STATUS_LABELS: Record<Status, string> = {
  playable: '公開中',
  wip: '制作中',
  archive: 'アーカイブ',
}
