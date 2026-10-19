---
name: create-adaptable-composable
description: Create a Vue 3.3+ composable that accepts plain values, refs, or getters when appropriate. Normalize inputs with toValue() inside reactive effects, and require a writable Ref or explicit setter when changes must flow back to the caller. Use this skill when user asks for an adaptable or reusable composable.
license: MIT
metadata:
  author: github.com/vuejs-ai
  version: "17.0.0"
compatibility: Requires Vue 3.3+; Nuxt projects must use Vue 3.3+.
---

# Create Adaptable Composable

Adaptable composables are reusable functions that can accept both reactive and non-reactive inputs. This allows developers to use the composable in a variety of contexts without worrying about the reactivity of the inputs.

Steps to design an adaptable composable in Vue.js:
1. Confirm the composable's purpose and API design and expected inputs/outputs.
2. Identify inputs params that should be reactive (MaybeRef / MaybeRefOrGetter).
3. Use `toValue()` inside a reactive effect to normalize values, refs, or getters while tracking dependencies.
4. Implement the core logic of the composable using Vue's reactivity APIs.

## Core Type Concepts

### Type Utilities

```ts
/**
 * value or Ref (including shallow and writable computed refs)
 */
export type MaybeRef<T = any> = T | Ref<T> | ShallowRef<T> | WritableComputedRef<T>;

/**
 * MaybeRef<T> + ComputedRef<T> + () => T
 */
export type MaybeRefOrGetter<T = any> = MaybeRef<T> | ComputedRef<T> | (() => T);
```

### Policy and Rules

- Read-only, computed-friendly input: use `MaybeRefOrGetter`
- Changes must write through to the caller: require `Ref<T>` or an explicit getter/setter contract. A plain value accepted by `MaybeRef<T>` cannot receive writes back from the composable.
- Use `MaybeRef<T>` only when a plain value and a ref are both valid inputs and the composable does not promise to mutate the caller's plain value.
- Parameter might be a function value (callback/predicate/comparator): do not use `MaybeRefOrGetter`, or you may accidentally invoke it as a getter.
- DOM/Element targets: if you want computed/derived targets, use `MaybeRefOrGetter`.

`toValue()` and `MaybeRefOrGetter<T>` were added in Vue 3.3. Call `toValue()` inside `watch()` / `watchEffect()` when changes to a ref or getter must remain tracked. Use `toRef()` when a ref-like source is specifically needed, rather than as a general substitute for `toValue()`.

### Examples

Adaptable `useDocumentTitle` Composable: read-only title parameter

```ts
import { watch, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export function useDocumentTitle(title: MaybeRefOrGetter<string>) {
  watch(() => toValue(title), (t) => {
    document.title = t
  }, { immediate: true })
}
```

Adaptable `useCounter` Composable: two-way writable count parameter

```ts
import type { Ref } from 'vue'

function useCounter(count: Ref<number>) {
  function add() {
    count.value++
  }
  return { add }
}
```

The caller passes a writable ref when it expects the composable to update its state:

```ts
import { ref } from 'vue'

const count = ref(0)
const { add } = useCounter(count)
```

## Sources

- [Vue: Composables](https://vuejs.org/guide/reusability/composables.html) — accepting values, refs, or getters; tracking normalized inputs inside reactive effects; and composable side-effect conventions.
- [Vue: Reactivity API — Utilities](https://vuejs.org/api/reactivity-utilities.html#tovalue) — `toValue()`, `MaybeRef`, `MaybeRefOrGetter`, and Vue 3.3+ availability.
