<script setup lang="ts">
import { GENRE_LABELS, type Genre } from '~~/shared/types/game'

const games = useGames()
const genres = useGenres()

const query = ref('')
const activeGenre = ref<Genre | 'all'>('all')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return games.filter((g) => {
    if (activeGenre.value !== 'all' && !g.genre.includes(activeGenre.value)) return false
    if (!q) return true
    // タイトル・キャッチ・技術名のどれかに引っかかれば通す
    return [g.title, g.tagline, ...g.tech].join(' ').toLowerCase().includes(q)
  })
})
</script>

<template>
  <div>
    <section class="hero">
      <div class="wrap">
        <h1 class="hero-title">minimo's <em>toy box</em></h1>
      </div>
    </section>

    <section class="wrap catalog">
      <div class="toolbar">
        <input
          v-model="query"
          type="search"
          class="search"
          placeholder="タイトル・技術で絞り込む"
          aria-label="ゲームを検索"
        >
      </div>

      <div class="chips" role="group" aria-label="ジャンルで絞り込む">
        <button
          class="chip"
          :class="{ active: activeGenre === 'all' }"
          @click="activeGenre = 'all'"
        >
          すべて
        </button>
        <button
          v-for="g in genres"
          :key="g.value"
          class="chip"
          :class="{ active: activeGenre === g.value }"
          @click="activeGenre = g.value"
        >
          {{ GENRE_LABELS[g.value] }}<span class="chip-count">{{ g.count }}</span>
        </button>
      </div>

      <p class="result-count">{{ filtered.length }} 件</p>

      <div v-if="filtered.length" class="grid">
        <GameCard v-for="g in filtered" :key="g.slug" :game="g" />
      </div>
      <p v-else class="empty">条件に合うゲームがありませんでした。</p>
    </section>
  </div>
</template>

<style scoped>
.hero { padding: 64px 0 40px; }
.hero-title {
  margin: 0 0 14px;
  font-size: clamp(30px, 6vw, 60px);
  line-height: 1.12;
  white-space: nowrap;
  font-weight: 800;
  letter-spacing: -.03em;
}
.hero-title em {
  font-style: normal;
  background: linear-gradient(100deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.section-title {
  font-size: 12px;
  letter-spacing: .2em;
  color: var(--muted);
  font-weight: 700;
  margin: 0 0 14px;
}

.catalog { padding-bottom: 80px; }
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}
.search {
  flex: 1 1 260px;
  padding: 11px 16px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
}
.search:focus { outline: none; border-color: var(--accent); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: color .15s, border-color .15s, background .15s;
}
.chip:hover { color: var(--text); border-color: var(--accent); }
.chip.active {
  color: #0a0c14;
  background: var(--accent);
  border-color: var(--accent);
  font-weight: 700;
}
.chip-count { font-size: 11px; opacity: .7; }

.result-count { font-size: 12px; color: var(--muted); margin: 0 0 12px; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}
.empty { color: var(--muted); padding: 40px 0; }
</style>
