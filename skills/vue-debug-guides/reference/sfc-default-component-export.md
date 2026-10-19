---
title: SFC Script Blocks Need a Default Component Export
impact: MEDIUM
impactDescription: An SFC's default export must be its component; named exports may coexist in a normal script block
type: gotcha
tags: [vue3, sfc, export, script-block, composition-api]
---

# SFC Script Blocks Need a Default Component Export

**Impact: MEDIUM** - A `.vue` module must default-export its component so normal imports resolve to the component. A regular `<script>` block is an ES module and may also contain named exports. `<script setup>` is different: it is compiled as the component's `setup()` function and does not allow ES module exports.

## Task Checklist

- [ ] Ensure the SFC has a default export for its component
- [ ] Named exports may coexist in a regular `<script>` block
- [ ] Do not add ES module exports inside `<script setup>`
- [ ] Put shared logic in a composable or module when it should be reused independently

**Incorrect - Exporting the component only as a named export:**
```vue
<!-- MyComponent.vue -->
<script>
export const MyComponent = {
  data() {
    return { count: 0 }
  }
}
</script>

<template>
  <div>{{ count }}</div>
</template>
```

**Correct - The component is the default export; named exports can coexist:**
```vue
<!-- MyComponent.vue - Options API -->
<script>
export const DEFAULT_COUNT = 0

export default {
  data() {
    return { count: DEFAULT_COUNT }
  }
}
</script>

<template>
  <div>{{ count }}</div>
</template>
```

```vue
<!-- MyComponent.vue - Composition API with script setup -->
<script setup>
// GOOD: No export needed, component is auto-exported
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div>{{ count }}</div>
</template>
```

## Exporting Types Alongside Script Setup

For TypeScript, use a separate regular script block for type exports:

```vue
<script lang="ts">
// Regular script block for exports
export interface User {
  id: number
  name: string
}

export type Status = 'pending' | 'active' | 'inactive'
</script>

<script setup lang="ts">
// Setup script for component logic
import { ref } from 'vue'

const users = ref<User[]>([])
</script>

<template>
  <ul>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

## Sharing Utilities Across Components

Don't put shared code in component script blocks. Create separate files:

```typescript
// utils/constants.ts
export const ITEMS_PER_PAGE = 20
export const API_BASE_URL = '/api/v1'

// utils/helpers.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString()
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}
```

```vue
<!-- ProductList.vue -->
<script setup>
// GOOD: Import shared utilities from external files
import { ITEMS_PER_PAGE } from '@/utils/constants'
import { formatCurrency } from '@/utils/helpers'
import { ref } from 'vue'

const products = ref([])
</script>
```

## Using `<script setup>`

`<script setup>` is compiled as the component's `setup()` body, so it cannot contain ESM exports. Put a named export in the regular `<script>` block or, for reusable logic, in a separate module.

```javascript
// Importing a .vue file without a specifier uses its default component export.
import MyComponent from './MyComponent.vue'
```

Named exports from an SFC are valid ESM exports. When logic should be shared independently of the component, a composable or utility module is usually a clearer boundary.

## Reference
- [Vue.js SFC Syntax Specification](https://vuejs.org/api/sfc-spec.html)
- [Vue core compiler tests for named exports in SFC scripts](https://github.com/vuejs/core/blob/main/packages/compiler-sfc/__tests__/compileScript.spec.ts)
- [Vue.js Composition API - Composables](https://vuejs.org/guide/reusability/composables.html)
