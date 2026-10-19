---
title: Suspense Error Handling and SSR Hydration
impact: MEDIUM
impactDescription: Separating async dependency handling from hydration mismatches avoids unsupported workarounds
type: gotcha
tags: [vue3, suspense, ssr, hydration, async-components]
---

# Suspense Error Handling and SSR Hydration

`<Suspense>` is experimental. It coordinates components with async `setup()` and async components; it is not a general fix for server/client markup differences.

## Handle async dependencies and errors intentionally

`<Suspense>` displays its `#fallback` while supported async dependencies are pending. It does not provide an error slot or catch errors by itself. Handle async errors with `onErrorCaptured()` on an ancestor, or set `suspensible: false` and configure the async component's own loading and error states.

Vue Router's lazy route imports do not trigger `<Suspense>` themselves. Async components nested inside the route can still be dependencies of a surrounding `<Suspense>`.

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const AsyncDashboard = defineAsyncComponent(() => import('./Dashboard.vue'))
</script>

<template>
  <Suspense>
    <AsyncDashboard />
    <template #fallback>
      Loading dashboard...
    </template>
  </Suspense>
</template>
```

## Diagnose hydration mismatches

Hydration expects the client render to match the server-rendered HTML. Vue's SSR guide identifies invalid HTML nesting and server/client state differences as common causes. A mismatch is not evidence that async components inside `<Suspense>` are generally unsupported; inspect the rendered markup and data used on both sides first.

Vue documents one specific caveat: replacing an errored child component from a parent deep inside `<Suspense>` can cause an SSR hydration mismatch. Move fallible setup logic into an ancestor where it can be caught before rendering the child that may fail.

Do not use `onErrorCaptured()` as a generic hydration-mismatch detector. It handles descendant errors; for hydration mismatches, compare the server-rendered HTML with the client's initial render and follow the causes in Vue's SSR guide.

## Reference

- [Vue.js Suspense Guide](https://vuejs.org/guide/built-ins/suspense.html)
- [Vue.js Async Components Guide](https://vuejs.org/guide/components/async.html)
- [Vue.js Server-Side Rendering: Hydration Mismatch](https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch)
- [Vue.js Lifecycle API: Error Capturing Caveats](https://vuejs.org/api/options-lifecycle.html#errorcaptured)
