---
title: Virtualize Large Lists
impact: HIGH
impactDescription: Rendering a large list at once can create substantial DOM and update work; virtualization renders only a window of items
type: efficiency
tags: [vue3, performance, virtual-list, large-data, dom, optimization]
---

# Virtualize Large Lists

Rendering thousands of list items can be slow because the browser must handle the resulting DOM nodes. Virtualization limits rendering to items in or near the viewport. Consider it when profiling shows that rendering or updating a large list is a bottleneck; there is no universal item-count threshold because row complexity, device, viewport, and update patterns vary.

## Task List

- Profile with representative data before choosing an optimization
- Choose a virtualizer that supports the list's layout, item sizing, scrolling, and SSR needs
- Provide stable item identities and accurate size information where the library requires them
- Test scrolling, keyboard interaction, accessibility, and data updates with realistic content
- Compare the virtualized result against a simpler paginated or windowed design where appropriate

## Fixed-Size Rows with `vue-virtual-scroller`

The following example uses the current Vue 3 API from `vue-virtual-scroller` v3. Its `RecycleScroller` is suited to rows with known sizes. The scroller and row sizes must agree; for variable-size content, use `DynamicScroller` and follow its measurement requirements.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/index.css'

interface User {
  id: number
  name: string
}

const users = ref<User[]>(
  Array.from({ length: 10_000 }, (_, index) => ({
    id: index + 1,
    name: `User ${index + 1}`
  }))
)
</script>

<template>
  <RecycleScroller
    class="user-list"
    :items="users"
    :item-size="56"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="user-row">{{ item.name }}</div>
  </RecycleScroller>
</template>

<style scoped>
.user-list {
  height: 600px;
}

.user-row {
  height: 56px;
}
</style>
```

Virtualization reduces the rendered window; it does not reduce the size of the `users` array or the cost of fetching and retaining all of its records. Use pagination or server-side filtering when those costs matter too.

## Variable-Size Rows

When row sizes are not known in advance, use a virtualizer that measures items or accepts estimates. For `vue-virtual-scroller` v3, `DynamicScroller` measures rendered rows and requires a minimum initial item size. Its documentation notes that variable-size mode can be performance-heavy with many items, so measure the result for the actual content.

## Choosing a Library

Two Vue-compatible options with maintained official documentation are:

- [`vue-virtual-scroller`](https://vue-virtual-scroller.netlify.app/guide/) — offers `RecycleScroller`, `DynamicScroller`, and headless composables. Version 3 is ESM-only and requires Vue 3.3+ for its generic component typing surface.
- [`@tanstack/vue-virtual`](https://tanstack.com/virtual/latest/docs/framework/vue/vue-virtual) — Vue adapter for TanStack's virtualizer; review its options and examples for the desired layout.

Check each library's current Vue and bundler requirements before adding it. Prefer a non-virtualized design when the measured list is already responsive or when virtualization's complexity does not fit the interaction. Because off-screen items are not all mounted, verify any requirements for browser find-in-page, printing, server-rendered output, keyboard navigation, and assistive technology with the selected library and target browsers.

## Sources

- [Vue: Performance — Virtualize Large Lists](https://vuejs.org/guide/best-practices/performance.html#virtualize-large-lists) — why large rendered lists can be slow and community library references.
- [vue-virtual-scroller: Getting Started](https://vue-virtual-scroller.netlify.app/guide/) and [`RecycleScroller`](https://vue-virtual-scroller.netlify.app/guide/recycle-scroller) — Vue version, ESM/CSS requirements, fixed-size rows, stable keys, and buffer behavior.
- [vue-virtual-scroller: `DynamicScroller`](https://vue-virtual-scroller.netlify.app/guide/dynamic-scroller) — variable-size measurement and caveats.
- [TanStack Virtual: Vue](https://tanstack.com/virtual/latest/docs/framework/vue/vue-virtual) — official Vue adapter API.
