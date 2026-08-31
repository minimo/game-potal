<script setup lang="ts">
import type { Game } from '~~/shared/types/game'

defineProps<{ game: Game }>()
</script>

<template>
  <NuxtLink :to="`/g/${game.slug}`" class="card">
    <div class="card-media">
      <GameThumb :game="game" />
      <div class="card-badges">
        <span v-if="game.genre.includes('3d')" class="badge badge-3d">3D</span>
        <span v-if="game.mobile" class="badge badge-mobile">スマホ可</span>
        <span v-if="game.status === 'wip'" class="badge badge-wip">制作中</span>
        <span v-else-if="game.status === 'archive'" class="badge badge-archive">アーカイブ</span>
      </div>
    </div>

    <div class="card-body">
      <h3 class="card-title">{{ game.title }}</h3>
      <div class="card-meta">
        <span>{{ game.year }}</span>
        <span class="dot" aria-hidden="true">·</span>
        <span>{{ game.tech.join(' / ') }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--bg-soft);
  transition: border-color .18s, transform .18s, box-shadow .18s;
}
.card:hover {
  border-color: rgba(77, 214, 255, .55);
  transform: translateY(-3px);
  box-shadow: 0 12px 34px rgba(0, 0, 0, .45);
}
.card:hover :deep(.thumb img) { transform: scale(1.06); }

.card-media { position: relative; }
.card-badges {
  position: absolute;
  left: 10px;
  bottom: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.card-badges .badge { background: rgba(10, 12, 20, .78); backdrop-filter: blur(4px); }

.card-body { padding: 14px 16px 16px; }
.card-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}
.card-meta {
  display: flex;
  gap: 6px;
  font-size: 11px;
  color: var(--muted);
  opacity: .8;
}
</style>
