---
title: Composable Organization Patterns
impact: MEDIUM
impactDescription: Well-structured composables improve maintainability, reusability, and update performance
type: best-practice
tags: [vue3, composables, composition-api, code-organization, api-design, readonly, utilities]
---

# Composable Organization Patterns

**Impact: MEDIUM** - Treat composables as reusable, stateful building blocks and keep their code organized by feature concern. This keeps large components maintainable and prevents hard-to-debug mutation and API design issues.

## Task List

- Extract cohesive workflows or actual reuse; keep simple local state in its component
- Keep related state, actions, and lifecycle cleanup together
- Expose consumer-facing state and actions; keep internal refs and helpers private
- Use options objects for optional configuration, not to hide unrelated dependencies
- Return readonly state when mutations must go through actions
- Keep pure utility functions as plain utilities

## Choose an Extraction Boundary

Reactive state alone does not justify a composable. Extract when a reusable capability or substantial workflow can hide its implementation behind a useful API. If a split requires mutual callbacks or access to most of the caller's state, reconsider ownership or keep the logic together.

**Appropriate local state for a single disclosure:**
```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const expanded = shallowRef(false)
</script>

<template>
  <button type="button" :aria-expanded="expanded" @click="expanded = !expanded">
    Details
  </button>
  <p v-if="expanded">Additional information</p>
</template>
```

## Keep Composable APIs Focused

- Return the state and operations consumers need. Keep request handles, bookkeeping, and private helpers internal.
- When composing composables, preserve meaningful capability boundaries rather than re-exporting every internal member.
- Create shared state once per intended scope and pass or provide that instance. Calling a stateful composable in each consumer usually creates separate state.
- Keep DOM refs, focus, and pointer handling with their owning UI or composable. Share only the state or operations needed for coordination.

## Use Options Object Pattern for Composable Parameters

**BAD:**
```javascript
export function useFetch(url, method, headers, timeout, retries, immediate) {
  // hard to read and easy to misorder
}

useFetch('/api/users', 'GET', null, 5000, 3, true)
```

**GOOD:**
```javascript
export function useFetch(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    timeout = 30000,
    retries = 0,
    immediate = true
  } = options

  // implementation
  return { method, headers, timeout, retries, immediate }
}

useFetch('/api/users', {
  method: 'POST',
  timeout: 5000,
  retries: 3
})
```

```typescript
interface UseCounterOptions {
  initial?: number
  min?: number
  max?: number
  step?: number
}

export function useCounter(options: UseCounterOptions = {}) {
  const { initial = 0, min = -Infinity, max = Infinity, step = 1 } = options
  // implementation
}
```

## Return Readonly State with Explicit Actions

**BAD:**
```javascript
export function useCart() {
  const items = ref([])
  const total = computed(() => items.value.reduce((sum, item) => sum + item.price, 0))
  return { items, total } // any consumer can mutate directly
}

const { items } = useCart()
items.value.push({ id: 1, price: 10 })
```

**GOOD:**
```javascript
import { ref, computed, readonly } from 'vue'

export function useCart() {
  const _items = ref([])

  const total = computed(() =>
    _items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  function addItem(product, quantity = 1) {
    const existing = _items.value.find(item => item.id === product.id)
    if (existing) {
      existing.quantity += quantity
      return
    }
    _items.value.push({ ...product, quantity })
  }

  function removeItem(productId) {
    _items.value = _items.value.filter(item => item.id !== productId)
  }

  return {
    items: readonly(_items),
    total,
    addItem,
    removeItem
  }
}
```

## Keep Utilities as Utilities

**BAD:**
```javascript
export function useFormatters() {
  const formatDate = (date) => new Intl.DateTimeFormat('en-US').format(date)
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  return { formatDate, formatCurrency }
}

const { formatDate } = useFormatters()
```

**GOOD:**
```javascript
// utils/formatters.js
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US').format(date)
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
```

```javascript
// composables/useInvoiceSummary.js
import { computed } from 'vue'
import { formatCurrency } from '@/utils/formatters'

export function useInvoiceSummary(invoiceRef) {
  const totalLabel = computed(() => formatCurrency(invoiceRef.value.total))
  return { totalLabel }
}
```
