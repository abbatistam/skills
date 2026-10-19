---
title: Suspense Controls Async Component Loading State
impact: MEDIUM
impactDescription: Async component loading options are ignored inside Suspense; pending UI belongs to its fallback and failures need separate error handling
type: gotcha
tags: [vue3, suspense, async-components, loading, error-handling]
---

# Suspense Controls Async Component Loading State

**Impact: MEDIUM** - When an async component renders inside a parent `<Suspense>`, its `loadingComponent`, `errorComponent`, `delay`, and `timeout` options are ignored. The Suspense fallback controls pending UI. Suspense does not handle errors itself; use an error-capture strategy in an ancestor.

## Task Checklist

- [ ] Confirm whether the async component is inside a `<Suspense>` boundary
- [ ] Use `suspensible: false` when the component must manage its own loading UI
- [ ] Use the parent `<Suspense>` fallback for pending UI when Suspense should coordinate loading
- [ ] Handle rejected loaders with an error-capture strategy outside the Suspense fallback
- [ ] Provide a retry action when users can recover from a failed load

**Incorrect:**
```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const AsyncDashboard = defineAsyncComponent({
  loader: () => import('./Dashboard.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  timeout: 3000
})
</script>

<template>
  <Suspense>
    <AsyncDashboard />
    <template #fallback>Loading...</template>
  </Suspense>
</template>
```

**Correct (component handles its own states):**
```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const AsyncDashboard = defineAsyncComponent({
  loader: () => import('./Dashboard.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  timeout: 3000,
  suspensible: false
})
</script>

<template>
  <AsyncDashboard />
</template>
```

**Correct (Suspense owns pending UI; an ancestor handles errors):**
```vue
<script setup>
import { onErrorCaptured, ref } from 'vue'
import AsyncDashboard from './AsyncDashboard.vue'

const error = ref(null)

onErrorCaptured((err) => {
  error.value = err
  return false
})
</script>

<template>
  <ErrorDisplay v-if="error" :error="error" />

  <Suspense v-else>
    <AsyncDashboard />
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
```

## Sources

- [Vue: Suspense](https://vuejs.org/guide/built-ins/suspense.html) — async component options under Suspense and its lack of built-in error handling.
- [Vue: Async Components](https://vuejs.org/guide/components/async.html#loading-and-error-states) — component-level loading and error options.
- [Vue: Error Handling](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) — capturing descendant component errors.
