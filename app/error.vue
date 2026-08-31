<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <div class="wrap err">
    <p class="eyebrow">Error {{ error.statusCode }}</p>
    <h1>{{ error.statusCode === 404 ? 'ページが見つかりません' : '問題が発生しました' }}</h1>
    <NuxtLink to="/" class="btn" @click="clearError({ redirect: '/' })">一覧にもどる</NuxtLink>
  </div>
</template>

<style scoped>
.err { padding: 120px 0; text-align: center; }
h1 { font-size: 26px; margin: 0 0 24px; }
</style>
