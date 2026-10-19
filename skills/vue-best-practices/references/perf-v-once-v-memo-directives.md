---
title: Use v-once and v-memo Deliberately
impact: MEDIUM
impactDescription: These directives can skip subtree updates, but incorrect dependencies can leave rendered output stale
type: efficiency
tags: [vue3, performance, v-once, v-memo, optimization, directives]
---

# Use `v-once` and `v-memo` Deliberately

`v-once` renders a subtree once and skips its future updates. `v-memo` conditionally skips subtree updates when every value in its dependency array is unchanged. These are manual optimizations for specific cases; profile first and prefer clear reactive code unless update work is measurable.

## `v-once`: Freeze a Subtree After Its First Render

Use `v-once` only when the displayed value is intentionally a snapshot and must not reflect later changes.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const receipt = ref({ id: 'R-1042', total: 48.5 })
</script>

<template>
  <!-- This receipt is intentionally shown as the first-render snapshot. -->
  <section v-once>
    <p>Receipt {{ receipt.id }}</p>
    <p>Total: {{ receipt.total }}</p>
  </section>
</template>
```

If the receipt should respond to changes in `receipt`, remove `v-once`. Do not use it simply because content looks static in the initial state.

## `v-memo`: Skip a Subtree When Its Dependencies Are Unchanged

`v-memo` is available in Vue 3.2+. Its dependency array must have a fixed length and include every changing value that affects the subtree. An incomplete array can cause stale output. With `v-for`, put `v-memo` on the same element as `v-for`.

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Item {
  id: number
  label: string
}

const items: Item[] = Array.from({ length: 2_000 }, (_, id) => ({
  id,
  label: `Item ${id + 1}`
}))
const selectedId = ref<number | null>(null)
</script>

<template>
  <ul>
    <li
      v-for="item in items"
      :key="item.id"
      v-memo="[item.id === selectedId]"
      :class="{ selected: item.id === selectedId }"
    >
      {{ item.label }}
    </li>
  </ul>
</template>
```

Here the labels and item identities are immutable, and selection is the only changing input rendered by each row. If rows also depend on changing data, include those values in the dependency array or do not memoize that subtree. Vue's documentation identifies large lists as the common use case and describes `v-memo` as a micro-optimization that should be used rarely.

An empty dependency array makes `v-memo` functionally equivalent to `v-once`; use `v-once` when that intent is clearer.

## Validate Before Keeping the Optimization

- Confirm the memoized output updates for every relevant state change.
- Test changes to the selected item, item data, and list membership.
- Compare performance with and without the directive using representative data.
- Remove the directive if the measured benefit does not justify the added dependency bookkeeping.

## Sources

- [Vue: Performance — `v-once` and `v-memo`](https://vuejs.org/guide/best-practices/performance.html#update-optimizations) — intended use as update optimizations.
- [Vue: Built-in Directives — `v-once` and `v-memo`](https://vuejs.org/api/built-in-directives.html#v-memo) — subtree behavior, Vue 3.2+ availability, fixed dependency arrays, and `v-for` usage.
