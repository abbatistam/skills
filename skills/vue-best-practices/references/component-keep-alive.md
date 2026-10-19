---
title: KeepAlive Component Best Practices
impact: HIGH
impactDescription: KeepAlive preserves inactive component instances, which changes their lifecycle and state lifetime
type: best-practice
tags: [vue3, keepalive, cache, performance, router, dynamic-components]
---

# KeepAlive Component Best Practices

`<KeepAlive>` caches component instances when dynamically switching among components. Use it when preserving local state across switches is part of the intended behavior. Cached instances remain alive while deactivated, so plan when their state or background work should be refreshed or stopped.

## Task List

- Use `<KeepAlive>` only when preserving component state across switches is useful
- Use `include` or `exclude` when only some component types should be cached
- Set `max` when the application needs a bound on the number of cached instances
- Use `onActivated` and `onDeactivated` for work tied to cached-view visibility
- Decide how cached views refresh data and handle sensitive state

## Preserve State Across Dynamic Component Switches

Without `<KeepAlive>`, switching away from a dynamic component normally unmounts it, so its local state is discarded. Wrap the dynamic component when returning to the previous instance should restore its state:

```vue
<template>
  <KeepAlive>
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

Use ordinary mounting when a fresh instance on each visit is the desired behavior. Caching is a lifecycle and state-lifetime choice, not a general performance requirement.

## Select Cached Component Types and Bound the Cache

By default, `<KeepAlive>` caches component instances rendered inside it. `include` and `exclude` match component names; `max` is optional and, when set, limits the number of cached instances using least-recently-used eviction.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const currentView = ref('Dashboard')
</script>

<template>
  <KeepAlive :max="5" include="Dashboard,Settings">
    <component :is="currentView" />
  </KeepAlive>
</template>
```

Ensure components have names that match the `include` or `exclude` values. Since Vue 3.2.34, a single-file component using `<script setup>` infers its name from the filename; otherwise, declare the name explicitly when needed.

```vue
<!-- Settings.vue -->
<script setup lang="ts">
defineOptions({ name: 'Settings' })
</script>
```

`max` is not required for every use. Choose it when a bounded cache is important for the application; a smaller cap can evict instances users expect to revisit with state intact.

## Refresh or Pause Cached Views

A cached component is deactivated instead of unmounted. Use activation hooks to refresh data or resume work when the view returns, and deactivation hooks to pause timers or subscriptions that should not run while hidden.

```vue
<script setup lang="ts">
import { onActivated, onDeactivated } from 'vue'

onActivated(() => {
  refreshData()
  resumePolling()
})

onDeactivated(() => {
  pausePolling()
})
</script>
```

`onActivated` also runs on initial mount, and `onDeactivated` also runs when the component is unmounted. Make refresh operations safe for both initial activation and later returns.

For route views, decide whether parameter or query changes should reuse the current instance or create a separately cached view. A `key` affects component identity and can result in multiple cached instances; it is not a targeted cache eviction API. Use route watchers or activation hooks to refresh reused views, and use `max`/`include`/`exclude` to control cache membership and size.

## Sources

- [Vue: KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html) — default caching, name matching, the Vue 3.2.34 `<script setup>` filename inference, `max`, LRU eviction, and activation hooks.
- [Vue: Lifecycle Hooks](https://vuejs.org/guide/essentials/lifecycle.html#registering-lifecycle-hooks) — lifecycle hook registration and timing.
