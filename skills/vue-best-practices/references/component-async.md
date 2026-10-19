---
title: Async Component Best Practices
impact: MEDIUM
impactDescription: Async component loading and hydration choices affect bundle loading, loading feedback, and when server-rendered content becomes interactive
type: best-practice
tags: [vue3, async-components, ssr, hydration, performance, ux]
---

# Async Component Best Practices

Use async components to split code that is not needed immediately, and provide loading or error UI when the user experience needs it. Treat lazy hydration as an SSR optimization to apply when its interaction trade-offs fit the component; it is not a default requirement.

## Task List

- Use `defineAsyncComponent` when a component should load on demand; use the router's route lazy-loading API for route components
- Add loading and error components when they improve feedback or recovery
- Set `delay` or `timeout` only when the defaults do not fit the desired UX
- For SSR, consider a hydration strategy only after deciding when the component must become interactive
- Use only the hydration helpers needed by the application

## Load a Component on Demand

`defineAsyncComponent` calls its loader when the wrapper is rendered. With a build tool, a dynamic `import()` can create a separate chunk.

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const AsyncComments = defineAsyncComponent(() => import('./Comments.vue'))
</script>

<template>
  <AsyncComments />
</template>
```

Use this for component trees that are not needed at initial render. Vue Router has its own lazy route component pattern; prefer that for route-level splitting.

## Handle Loading and Failure States

The options object supports `loadingComponent`, `errorComponent`, `delay`, and `timeout`. The default loading delay is `200` ms, and the default timeout is `Infinity`. A timeout only displays an error component when one is configured; it does not replace application-level error handling.

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ErrorDisplay from './ErrorDisplay.vue'

const AsyncDashboard = defineAsyncComponent({
  loader: () => import('./Dashboard.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  // Keep the defaults unless product behavior calls for different values.
  delay: 200,
  timeout: 30_000
})
</script>
```

`delay` controls when the loading component appears. `timeout` sets when a pending load is treated as timed out. They are independent options; configure either only when the desired behavior differs from its default.

## Defer Hydration for SSR Components

In Vue 3.5+, an async component rendered by an SSR application can provide a hydration strategy. Choose a trigger that matches the component's role: for example, visibility for below-the-fold content or interaction for a control that should activate on demand. Before hydration, server-rendered markup is not yet managed by Vue, so consider what should happen if a user interacts with it early.

```ts
import {
  defineAsyncComponent,
  hydrateOnInteraction,
  hydrateOnVisible
} from 'vue'

const AsyncComments = defineAsyncComponent({
  loader: () => import('./Comments.vue'),
  hydrate: hydrateOnVisible({ rootMargin: '100px' })
})

const AsyncMap = defineAsyncComponent({
  loader: () => import('./Map.vue'),
  hydrate: hydrateOnInteraction('click')
})
```

Hydration strategies apply to SSR. They do not replace code splitting, and should be evaluated against the component's accessibility, interaction, and performance requirements.

## Sources

- [Vue: Async Components](https://vuejs.org/guide/components/async.html) — loading options, defaults, and Vue 3.5+ lazy hydration strategies.
- [Vue: Performance](https://vuejs.org/guide/best-practices/performance.html#code-splitting) — async components and code splitting.
- [Vue Router: Lazy Loading Routes](https://router.vuejs.org/guide/advanced/lazy-loading.html) — route component lazy loading.
