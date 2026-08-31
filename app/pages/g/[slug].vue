<script setup lang="ts">
import { GENRE_LABELS, CONTROL_LABELS, STATUS_LABELS } from '~~/shared/types/game'

const route = useRoute()
const game = useGame(String(route.params.slug))

if (!game) {
  throw createError({ statusCode: 404, statusMessage: 'ゲームが見つかりません', fatal: true })
}

const g = game!
const canPlay = computed(() => g.status !== 'wip' && g.url !== '')

useSeoMeta({
  title: `${g.title} — minimo's toy box`,
  description: g.tagline,
  ogTitle: g.title,
  ogDescription: g.tagline,
  ogType: 'website',
  ogImage: g.thumb ? `/thumbs/${g.thumb}` : undefined,
  twitterCard: g.thumb ? 'summary_large_image' : 'summary',
})
</script>

<template>
  <article class="wrap detail">
    <NuxtLink to="/" class="back">← 一覧にもどる</NuxtLink>

    <div class="head">
      <div class="head-media">
        <GameThumb :game="g" />
      </div>

      <div class="head-info">
        <p class="eyebrow">{{ g.genre.map(x => GENRE_LABELS[x]).join(' / ') }}</p>
        <h1 class="title">{{ g.title }}</h1>

        <div class="badges">
          <span v-if="g.mobile" class="badge badge-mobile">スマホ可</span>
          <span v-if="g.status === 'wip'" class="badge badge-wip">制作中</span>
          <span v-else-if="g.status === 'archive'" class="badge badge-archive">アーカイブ</span>
        </div>

        <div class="actions">
          <a
            class="btn btn-play"
            :href="canPlay ? g.url : undefined"
            :aria-disabled="!canPlay"
            target="_blank"
            rel="noopener"
          >{{ canPlay ? '▶ PLAY' : '準備中' }}</a>
          <a v-if="g.repo" class="btn" :href="g.repo" target="_blank" rel="noopener">
            ソースコード
          </a>
        </div>
        <p v-if="!canPlay" class="note">このゲームはまだ公開されていません。</p>
      </div>
    </div>

    <div class="cols">
      <aside class="specs">
        <h2 class="section-title">SPEC</h2>
        <dl>
          <dt>ジャンル</dt>
          <dd>{{ g.genre.map(x => GENRE_LABELS[x]).join('、') }}</dd>
          <dt>使用技術</dt>
          <dd>{{ g.tech.join('、') }}</dd>
          <dt>操作</dt>
          <dd>{{ g.controls.map(x => CONTROL_LABELS[x]).join('、') }}</dd>
          <dt>対応端末</dt>
          <dd>{{ g.mobile ? 'PC / スマートフォン' : 'PC' }}</dd>
          <dt>制作年</dt>
          <dd>{{ g.year }}</dd>
          <dt>状態</dt>
          <dd>{{ STATUS_LABELS[g.status] }}</dd>
        </dl>
      </aside>
    </div>

    <section v-if="g.shots?.length" class="shots">
      <h2 class="section-title">SCREENSHOTS</h2>
      <div class="shots-grid">
        <img
          v-for="s in g.shots"
          :key="s"
          :src="`/shots/${s}`"
          :alt="`${g.title} のスクリーンショット`"
          loading="lazy"
        >
      </div>
    </section>
  </article>
</template>

<style scoped>
.detail { padding: 32px 0 0; }
.back { font-size: 13px; color: var(--muted); }
.back:hover { color: var(--accent); }

.head {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 32px;
  align-items: center;
  margin: 22px 0 48px;
}
@media (max-width: 820px) {
  .head { grid-template-columns: 1fr; gap: 22px; }
}
.head-media {
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--line);
}
.title {
  margin: 0 0 8px;
  font-size: clamp(28px, 5vw, 42px);
  font-weight: 800;
  line-height: 1.2;
}
.badges { display: flex; gap: 6px; margin-bottom: 20px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; }
.note { margin: 12px 0 0; font-size: 12px; color: var(--warn); }

.section-title {
  font-size: 12px;
  letter-spacing: .2em;
  color: var(--muted);
  font-weight: 700;
  margin: 0 0 14px;
}

.cols { max-width: 420px; }

.specs {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-soft);
  padding: 20px;
}
.specs dl {
  margin: 0;
  display: grid;
  grid-template-columns: 5.5em 1fr;
  gap: 8px 12px;
  font-size: 13px;
}
.specs dt { color: var(--muted); }
.specs dd { margin: 0; }

.shots { margin-top: 56px; }
.shots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.shots-grid img {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--line);
  display: block;
}
</style>
