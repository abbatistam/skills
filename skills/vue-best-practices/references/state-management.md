---
title: State Management Strategy
impact: HIGH
impactDescription: Choosing the wrong store pattern can cause SSR request leaks, brittle mutation flows, and poor scaling
type: best-practice
tags: [vue3, state-management, pinia, composables, ssr, vueuse]
---

# State Management Strategy

**Impact: HIGH** - Keep state local until multiple parts of the app need to share it. When state is shared, choose a composable, app-scoped store, or Pinia based on ownership, SSR requirements, and the tooling the application needs.

## Task List

- Keep state local first, then promote to shared/global only when needed
- Do not share a module-level mutable singleton across SSR requests
- Expose global state as readonly and mutate through explicit actions
- Consider Pinia for new applications and when its conventions, DevTools integration, plugins, or SSR support fit the app
- Avoid exporting mutable module-level reactive state directly

## Choose the Lightest Store Approach

- **Feature composable:** Default for reusable logic with local/feature-level state.
- **Module-scoped shared state:** Small SPA-only cases where one store per browser runtime is intended. Do not reuse this singleton across SSR requests.
- **App/request-scoped state:** SSR applications need a fresh store instance per request, provided through the app or created with a store library that supports SSR.
- **Pinia:** Vue's recommended state-management library for new applications; useful when conventions, DevTools, plugins, and SSR support are valuable.

## Avoid Exporting Mutable Module State

**BAD:**
```ts
// store/cart.ts
import { reactive } from 'vue'

export const cart = reactive({
  items: [] as Array<{ id: string; qty: number }>
})
```

**GOOD:**
```ts
// composables/useCartStore.ts
import { reactive, readonly } from 'vue'

let _store: ReturnType<typeof createCartStore> | null = null

function createCartStore() {
  const state = reactive({
    items: [] as Array<{ id: string; qty: number }>
  })

  function addItem(id: string, qty = 1) {
    const existing = state.items.find((item) => item.id === id)
    if (existing) {
      existing.qty += qty
      return
    }
    state.items.push({ id, qty })
  }

  return {
    state: readonly(state),
    addItem
  }
}

export function useCartStore() {
  if (!_store) _store = createCartStore()
  return _store
}
```

This module-singleton pattern is for a client-only SPA. In SSR, create the store per app/request or use a request-safe store setup; importing a mutable module singleton into server rendering can leak one request's state into another.

## Scope Shared State Per SSR Request

Module singletons live for the runtime lifetime. Reusing mutable module state during SSR can leak state between requests.

**BAD:**
```ts
// shared singleton reused across requests
const cartStore = useCartStore()

export function useServerCart() {
  return cartStore
}
```

**GOOD:**

> `pinia` dependency required.

```ts
// stores/cart.ts
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as Array<{ id: string; qty: number }>
  }),
  actions: {
    addItem(id: string, qty = 1) {
      const existing = this.items.find((item) => item.id === id)
      if (existing) {
        existing.qty += qty
        return
      }
      this.items.push({ id, qty })
    }
  }
})
```

## Use `createGlobalState` for Small SPA Global State

> `@vueuse/core` dependency required.

If the app is non-SSR and already uses VueUse, `createGlobalState` removes singleton boilerplate.

```ts
import { createGlobalState } from '@vueuse/core'
import { computed, ref } from 'vue'

export const useAuthState = createGlobalState(() => {
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => token.value !== null)

  function setToken(next: string | null) {
    token.value = next
  }

  return {
    token,
    isAuthenticated,
    setToken
  }
})
```

Use `createGlobalState` only where one runtime-wide instance is intended. Verify its lifecycle and SSR behavior before using a singleton helper in a server-rendered application.

## Sources

- [Vue: State Management](https://vuejs.org/guide/scaling-up/state-management.html) — shared reactive state, module-singleton SSR risks, and Pinia's recommendation for new applications.
- [Vue: SSR — Cross-Request State Pollution](https://vuejs.org/guide/scaling-up/ssr.html#cross-request-state-pollution) — why mutable module state must not be shared across server requests.
- [Pinia: SSR](https://pinia.vuejs.org/ssr/) — server rendering and per-request store usage.
- [VueUse: `createGlobalState`](https://vueuse.org/shared/createGlobalState/) — singleton composable behavior.
