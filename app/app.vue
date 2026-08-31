<template>
  <div class="site">
    <header class="site-head">
      <div class="wrap head-inner">
        <NuxtLink to="/" class="logo">
          <span class="logo-mark" aria-hidden="true" />
          <span class="logo-text">minimo's <em>toy box</em></span>
        </NuxtLink>
        <nav class="head-nav">
          <a href="https://github.com/minimo" target="_blank" rel="noopener">GitHub</a>
        </nav>
      </div>
    </header>

    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.site { min-height: 100vh; display: flex; flex-direction: column; }
main { flex: 1; }

.site-head {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
  background: rgba(10, 12, 20, .72);
  border-bottom: 1px solid var(--line);
}
.head-inner {
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo { display: flex; align-items: center; gap: 10px; }
.logo-mark {
  width: 14px; height: 14px; border-radius: 4px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
}
.logo-text { font-weight: 800; letter-spacing: -.01em; font-size: 16px; }
.logo-text em {
  font-style: normal;
  background: linear-gradient(100deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.head-nav { font-size: 13px; color: var(--muted); }
.head-nav a:hover { color: var(--accent); }
</style>
