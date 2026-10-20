---
title: Preserve this When Passing Methods from Reactive Objects
impact: MEDIUM
impactDescription: Passing an unbound method from a hand-rolled reactive object can lose its receiver
type: gotcha
tags: [vue3, state-management, reactive, methods, templates, this-binding]
---

# Preserve this When Passing Methods from Reactive Objects

This guidance applies to a hand-rolled store built with Vue's `reactive()` when a method depends on dynamic `this`. Passing `store.increment` as a template method handler passes the function as a callback; it does not call it as `store.increment()`. Use the call expression `@click="store.increment()"` or a closure that calls it through the store so the receiver is preserved.

Vue's event-handling guide distinguishes a member-path method handler such as `foo.bar` from an inline call such as `foo()`. The receiver behavior then follows JavaScript's method-call rules.

## Task Checklist

- [ ] For a hand-rolled reactive-object method that uses `this`, call it through the object: `@click="store.increment()"`
- [ ] Avoid passing that method as a bare callback: `@click="store.increment"`
- [ ] Use a closure or a closure-based action when the method should not rely on dynamic `this`
- [ ] Test store method calls work correctly with `this` references

## The Problem

```javascript
// store.js
import { reactive } from 'vue'

export const store = reactive({
  count: 0,
  increment() {
    this.count++  // 'this' should refer to the store
  }
})
```

```vue
<template>
  <!-- WRONG: Without parentheses, 'this' binding may be lost -->
  <button @click="store.increment">
    {{ store.count }}
  </button>
</template>
```

When you write `@click="store.increment"` (without parentheses), Vue passes the method as a callback to the event handler. The method gets called without being bound to the store object, so `this` inside `increment()` may be `undefined` or the global object instead of the store.

## The Solution

```vue
<template>
  <!-- CORRECT: With parentheses, method is called with correct context -->
  <button @click="store.increment()">
    {{ store.count }}
  </button>
</template>
```

With parentheses, you're telling Vue to call `store.increment()` directly, which preserves the `this` context as the store object.

## Why This Happens

In JavaScript, when you reference a method without calling it, you get the function itself without its binding:

```javascript
const store = {
  count: 0,
  increment() {
    this.count++
  }
}

// With parentheses - correct context
store.increment()  // this === store ✓

// Without parentheses - getting the function
const fn = store.increment
fn()  // this === undefined (in strict mode) ✗
```

Vue's event handler behavior:
- `@click="store.increment"` - Vue receives `store.increment` as a function and calls it later
- `@click="store.increment()"` - Vue evaluates `store.increment()` when the event fires

## Alternative Solutions

### 1. Use Arrow Functions in the Template

```vue
<template>
  <button @click="() => store.increment()">
    {{ store.count }}
  </button>
</template>
```

### 2. Bind Methods in the Store Definition

```javascript
// store.js
import { reactive } from 'vue'

const state = reactive({
  count: 0
})

// Methods defined separately, arrow functions don't have 'this' issues
export const store = {
  get count() { return state.count },
  increment: () => { state.count++ }
}
```

### 3. Use Pinia's documented action pattern

Pinia actions have their own store-instance `this` contract. The official action guide shows calling an action as a method in the template:

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++  // Pinia ensures 'this' is correct
    }
  }
})
```

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'
const counter = useCounterStore()
</script>

<template>
  <button @click="counter.increment()">Increment</button>
</template>
```

### 4. Wrap in a Local Function

```vue
<script setup>
import { store } from './store'

// Wrap store method to ensure correct binding
function increment() {
  store.increment()
}
</script>

<template>
  <!-- Now safe to use without parentheses -->
  <button @click="increment">
    {{ store.count }}
  </button>
</template>
```

## When This Matters

This guidance specifically affects:
- Hand-rolled reactive stores using `reactive()`
- Methods that reference `this` inside them
- Direct method references in templates without parentheses

It does not establish rules for Pinia actions or Vue component methods. Pinia documents actions as using the store instance for `this` and demonstrates calling them with `store.action()` in the template. Vue also auto-binds Options API component methods. Follow those APIs' documented patterns rather than applying the hand-rolled store example to every method.

## Quick Reference

| Pattern | Safe? | Notes |
|---------|-------|-------|
| `@click="store.method()"` | Yes | Calls the method through the reactive object |
| `@click="store.method"` | Risky | A callback reference may lose `this` |
| `@click="() => store.method()"` | Yes | The closure calls through the object |
| `@click="localMethod"` | Yes for Options API methods | Vue binds component methods to the instance |
| Pinia: `@click="store.action()"` | Yes | Matches Pinia's documented template pattern |

*Only problematic if the method uses `this`

## Reference
- [Vue.js Event Handling](https://vuejs.org/guide/essentials/event-handling.html#method-vs-inline-detection) — member-path method handlers versus inline call expressions.
- [Vue.js Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) — Options API methods are automatically bound to the component instance.
- [Pinia Actions](https://pinia.vuejs.org/core-concepts/actions.html) — actions use the store instance for `this` and are shown called as methods in templates.
- [MDN: `this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) — JavaScript receiver rules for method calls.
