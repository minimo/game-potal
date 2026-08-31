import rawGames from '~~/data/games.json'
import type { Game, Genre } from '~~/shared/types/game'

const games = rawGames as Game[]

/** タイトルのアルファベット順。同名は slug で安定させる */
const sorted = [...games].sort((a, b) =>
  a.title.localeCompare(b.title, 'ja', { sensitivity: 'base', numeric: true })
  || a.slug.localeCompare(b.slug),
)

export function useGames() {
  return sorted
}

export function useGame(slug: string): Game | undefined {
  return games.find(g => g.slug === slug)
}

/** 実際に使われているジャンルだけを、件数の多い順に返す */
export function useGenres(): { value: Genre, count: number }[] {
  const counts = new Map<Genre, number>()
  for (const g of games) {
    for (const genre of g.genre) counts.set(genre, (counts.get(genre) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
}

export function useTechs(): string[] {
  return [...new Set(games.flatMap(g => g.tech))].sort((a, b) => a.localeCompare(b))
}

/** サムネ未設定のときに使う、slug から決まる安定した色 */
export function slugHue(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360
  return h
}
