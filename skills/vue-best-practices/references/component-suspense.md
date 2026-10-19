---
title: Suspense Component Best Practices
impact: MEDIUM
impactDescription: Suspense coordinates async dependencies and fallback UI, but remains an experimental Vue feature
type: best-practice
tags: [vue3, suspense, async-components, async-setup, loading, fallback, router, transition, keepalive]
---

# Suspense Component Best Practices

`<Suspense>` coordinates async components and components with async `setup()` (including top-level `await` in `<script setup>`). It renders a fallback while its default slot's async dependencies resolve. Vue still documents `<Suspense>` as experimental, so check the current documentation and version before making it a foundational application contract.

## Task List

- Give both the default and fallback slots one immediate child node
- Handle async failures separately; `<Suspense>` does not provide its own error handling
- Use `timeout` when a resolved boundary switches to new async content and fallback timing matters
- Change the default slot's root identity only when a new async view should trigger a new pending state
- Use nested `suspensible` boundaries only when their async work should be coordinated by a parent
- Account for async component loading options being controlled by the nearest Suspense boundary

## Initial Loading and Reverting to Pending

On initial render, Vue evaluates the default slot. If it encounters async dependencies, it displays the fallback until they resolve. Both slots accept one immediate child, so group multiple nodes under an element or component.

```vue
<template>
  <Suspense>
    <main>
      <AsyncHeader />
      <AsyncDashboard />
    </main>

    <template #fallback>
      <p role="status">Loading dashboard…</p>
    </template>
  </Suspense>
</template>
```

After the boundary resolves, it returns to pending only when the default slot's root node is replaced. Async work deeper in the same root does not retrigger the fallback. When a new root is rendered, the old content remains visible until the new content resolves or `timeout` elapses; `timeout="0"` shows the fallback immediately on that revert.

```vue
<template>
  <Suspense :timeout="200">
    <component :is="currentView" :key="viewId" />

    <template #fallback>
      <p role="status">Loading view…</p>
    </template>
  </Suspense>
</template>
```

Use a changing `key` only when the new identity should make the boundary pending again. `timeout` does not change the initial pending behavior.

## Coordinate Nested Boundaries

Nested `<Suspense>` boundaries are supported in Vue 3.3+. Add `suspensible` to a nested boundary when the parent should also wait for its async dependencies; without it, the nested boundary manages its own loading state.

```vue
<template>
  <Suspense>
    <LayoutShell>
      <Suspense suspensible>
        <AsyncWidget />
        <template #fallback>Loading widget…</template>
      </Suspense>
    </LayoutShell>

    <template #fallback>Loading page…</template>
  </Suspense>
</template>
```

Async components are suspensible by default. Inside a Suspense boundary, that boundary controls their loading state and their `loadingComponent`, `errorComponent`, `delay`, and `timeout` options are ignored. Set `suspensible: false` in `defineAsyncComponent()` when the component should manage its own loading state.

## Combine with Router, Transitions, and Cached Views

When these wrappers are combined, Vue's documented nesting order is `RouterView` → `Transition` → `KeepAlive` → `Suspense`. Remove wrappers the application does not need.

```vue
<template>
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <Transition mode="out-in">
        <KeepAlive>
          <Suspense>
            <component :is="Component" />
            <template #fallback>Loading route…</template>
          </Suspense>
        </KeepAlive>
      </Transition>
    </template>
  </RouterView>
</template>
```

Vue Router's lazy route imports are separate from async components and do not themselves trigger Suspense; async descendants can still trigger it.

## Track Loading and Handle Errors

The boundary emits `pending`, `resolve`, and `fallback` events. Use them when an outer loading indicator or instrumentation needs the boundary's state. Async errors need a separate error-capture strategy, such as `onErrorCaptured()` in an ancestor; the fallback slot handles pending work, not failures.

## Sources

- [Vue: Suspense](https://vuejs.org/guide/built-ins/suspense.html) — experimental status, async dependencies, slot constraints, timeout behavior, events, error handling, nesting order, and nested boundaries.
- [Vue: Async Components](https://vuejs.org/guide/components/async.html#using-with-suspense) — interaction between `defineAsyncComponent` and Suspense.
- [Vue Router: Lazy Loading Routes](https://router.vuejs.org/guide/advanced/lazy-loading.html) — route component imports and the distinction from async components.
