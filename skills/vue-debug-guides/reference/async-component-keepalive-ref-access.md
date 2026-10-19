---
title: Accessing Async Component Refs with KeepAlive
impact: MEDIUM
impactDescription: Async component refs may be empty before resolution, and cached instances use activation lifecycle hooks
type: gotcha
tags: [vue3, async-components, keep-alive, template-refs]
---

# Accessing Async Component Refs with KeepAlive

An async component ref is not available until the component has resolved and mounted. Code that accesses it should handle the initial `null` value. `<KeepAlive>` deactivates and caches an instance instead of unmounting it; use `onActivated()` inside a cached component for work that should run on initial mount and each reactivation.

```vue
<script setup>
import { defineAsyncComponent, ref, shallowRef } from 'vue'
import OtherWidget from './OtherWidget.vue'

const AsyncWidget = defineAsyncComponent(() => import('./Widget.vue'))
const widgetRef = ref(null)
const currentComponent = shallowRef(AsyncWidget)

function refreshIfReady() {
  widgetRef.value?.refresh?.()
}

function switchComponent() {
  currentComponent.value = currentComponent.value === AsyncWidget ? OtherWidget : AsyncWidget
}
</script>

<template>
  <KeepAlive>
    <component :is="currentComponent" ref="widgetRef" />
  </KeepAlive>
  <button @click="refreshIfReady">Refresh when ready</button>
  <button @click="switchComponent">Switch component</button>
</template>
```

If the child uses `<script setup>`, expose methods that a parent should call with `defineExpose()`. For behavior owned by the cached child itself, register `onActivated()` in that child rather than treating a parent ref as available before the async component resolves.

```vue
<script setup>
import { onActivated } from 'vue'

onActivated(() => {
  // Runs on initial mount and whenever this cached component is reactivated.
  refreshVisibleData()
})

function refreshVisibleData() {
  // Refresh data owned by this component.
}
</script>
```

## Reference

- [Vue.js Async Components](https://vuejs.org/guide/components/async.html)
- [Vue.js KeepAlive: Lifecycle of Cached Instance](https://vuejs.org/guide/built-ins/keep-alive.html#lifecycle-of-cached-instance)
- [Vue.js Template Refs](https://vuejs.org/guide/essentials/template-refs.html)
- [Vue core: async component implementation](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/apiAsyncComponent.ts)
