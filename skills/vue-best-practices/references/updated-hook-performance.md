---
title: Use Updated Hooks for Post-DOM Work
impact: MEDIUM
impactDescription: Updated hooks run after a component's DOM patch and can repeat work on unrelated renders
type: capability
tags: [vue3, vue2, lifecycle, updated, performance, reactivity, optimization]
---

# Use Updated Hooks for Post-DOM Work

`updated` / `onUpdated()` runs after a component has updated its DOM. Use it for work that specifically needs the patched DOM, such as synchronizing an imperative third-party widget. It is not a general-purpose listener for a particular state change: the hook does not identify which dependency caused the render, and it can run after unrelated updates.

## Task List

- Use `watch()` for side effects tied to specific reactive sources
- Use `computed()` for derived values
- Use `updated` / `onUpdated()` only when the component's DOM has to be read or synchronized after a patch
- Avoid unconditional changes to render-affecting state in the hook, which can create repeated updates
- Keep DOM work idempotent and measure it if it runs on a frequently updated component

## Watch the State That Owns the Side Effect

For an API call that should follow a specific value, watch that value rather than issuing the request after every render. If the request can be superseded, cancel or ignore stale work with the watcher's cleanup callback.

```ts
import { ref, watch } from 'vue'

const query = ref('')
const results = ref<string[]>([])

watch(query, async (value, _previous, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())

  const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, {
    signal: controller.signal
  })
  results.value = await response.json()
})
```

## Use Computed for Derived Data

```ts
import { computed, ref } from 'vue'

const numbers = ref([1, 2, 3, 4, 5])
const sum = computed(() => numbers.value.reduce((total, value) => total + value, 0))
```

Do not assign a derived value in `updated`; that duplicates state and can schedule another render. Keep the source state and derive the value declaratively.

## Synchronize Work That Needs the Patched DOM

Use `onUpdated()` when an imperative library must be notified after Vue patches the component's DOM. Keep the operation safe to run whenever the component updates, or track the relevant source with `watch()` and use a post-flush watcher when the DOM must already be updated.

```vue
<template>
  <div ref="chart-root"></div>
</template>

<script setup lang="ts">
import { onUpdated, useTemplateRef } from 'vue'

// useTemplateRef() requires Vue 3.5+. Initialize chartInstance with the
// imperative library used by the application.
const chartRoot = useTemplateRef<HTMLElement>('chart-root')

onUpdated(() => {
  if (chartRoot.value) chartInstance.resize(chartRoot.value)
})
</script>
```

For Vue versions before 3.5, declare `const chartRoot = ref<HTMLElement | null>(null)` and use a matching `ref="chartRoot"` template attribute.

If the operation changes reactive state that affects this component's render, guard it so it settles; otherwise it can cause an update loop. Do not use a fixed frame-rate threshold as a substitute for measuring the actual work.

## Sources

- [Vue: Lifecycle Hooks API — `onUpdated()`](https://vuejs.org/api/composition-api-lifecycle.html#onupdated) — callback timing and the warning about mutating component state from the hook.
- [Vue: Options Lifecycle — `updated`](https://vuejs.org/api/options-lifecycle.html#updated) — Options API equivalent.
- [Vue: Watchers — Side Effect Cleanup](https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup) — cancelling or cleaning up watcher effects.
- [Vue: Watchers — Callback Flush Timing](https://vuejs.org/guide/essentials/watchers.html#callback-flush-timing) — post-flush watchers for work that needs updated DOM.
- [Vue: Computed Properties](https://vuejs.org/guide/essentials/computed.html) — derived state.
