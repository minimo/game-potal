<script setup lang="ts">
import type { Game } from '~~/shared/types/game'

const props = defineProps<{ game: Game }>()

const hue = computed(() => slugHue(props.game.slug))

/** サムネ未設定でも成立するよう、slug 由来の色でプレースホルダを描く */
const placeholderStyle = computed(() => ({
  background:
    `radial-gradient(120% 90% at 20% 0%, hsl(${hue.value} 70% 42% / .85), transparent 60%),`
    + `linear-gradient(160deg, hsl(${(hue.value + 40) % 360} 60% 26%), #0d1018)`,
}))

const initials = computed(() =>
  props.game.title.replace(/[^A-Za-z0-9ぁ-んァ-ヶ一-龠]/g, '').slice(0, 2).toUpperCase(),
)
</script>

<template>
  <div class="thumb">
    <img
      v-if="game.thumb"
      :src="`/thumbs/${game.thumb}`"
      :alt="game.title"
      loading="lazy"
      decoding="async"
    >
    <div v-else class="thumb-ph" :style="placeholderStyle">
      <span>{{ initials }}</span>
    </div>
  </div>
</template>

<style scoped>
.thumb {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #0d1018;
}
.thumb img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .45s cubic-bezier(.2, .7, .3, 1);
}
.thumb-ph {
  width: 100%; height: 100%;
  display: grid;
  place-items: center;
}
.thumb-ph span {
  font-size: clamp(28px, 6vw, 44px);
  font-weight: 800;
  letter-spacing: .1em;
  color: rgba(255, 255, 255, .82);
  text-shadow: 0 2px 20px rgba(0, 0, 0, .5);
}
</style>
