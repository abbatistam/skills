---
title: defineModel Default Value Can Cause Parent-Child Desync
impact: HIGH
impactDescription: Default values in defineModel don't sync back to parent, causing state inconsistency
type: capability
tags: [vue3, v-model, defineModel, components, props, two-way-binding]
---

# defineModel Default Value Can Cause Parent-Child Desync

**Impact: HIGH** - When `defineModel()` has a default value and the parent provides no value, the child receives the default while the parent's ref stays `undefined`. Assigning that same default back through the model ref does not emit an update event, so the parent remains `undefined` until an update changes it.

`defineModel()` requires Vue 3.4+. In earlier versions, declare the model prop and corresponding `update:` event explicitly.

This subtle bug can cause confusing behavior where the parent component shows one value while the child shows another, and updates may not propagate correctly.

## Task Checklist

- [ ] Initialize the parent model when the parent owns the source of truth
- [ ] Don't rely on defineModel defaults as the primary source of truth
- [ ] If defaults are needed, also set them in the parent component
- [ ] Don't assign the same default value to the model to try to force an update event
- [ ] Test components with and without v-model props provided

**Problem - Parent and child out of sync:**
```html
<!-- ChildComponent.vue -->
<script setup>
// Default value of 1 if parent doesn't provide value
const model = defineModel({ default: 1 })
</script>

<template>
  <input v-model="model" type="number">
  <!-- Shows: 1 (from default) -->
</template>
```

```html
<!-- ParentComponent.vue -->
<script setup>
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

// PROBLEM: Parent ref is undefined, not synced with child's default
const myValue = ref()  // undefined
</script>

<template>
  <ChildComponent v-model="myValue" />

  <!-- DESYNC: Child shows 1, but parent shows undefined -->
  <p>Parent value: {{ myValue }}</p>  <!-- Shows: undefined -->

  <!-- Parent remains undefined until the child emits a changed value -->
</template>
```

**Solution 1 - Always provide initial value from parent:**
```html
<!-- ParentComponent.vue -->
<script setup>
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

// CORRECT: Parent provides the initial value
const myValue = ref(1)  // Match the expected default
</script>

<template>
  <ChildComponent v-model="myValue" />
  <p>Parent value: {{ myValue }}</p>  <!-- Shows: 1, stays in sync -->
</template>
```

**Incorrect - Reassigning the same value does not force synchronization:**
```html
<!-- ChildComponent.vue -->
<script setup>
import { onMounted } from 'vue'

const model = defineModel({ default: 1 })

// This assignment is ignored when the model already equals 1.
onMounted(() => {
  if (model.value === 1) {
    model.value = 1
  }
})
</script>

<template>
  <input v-model="model" type="number">
</template>
```

If the parent owns the value, initialize it there. If a child is intentionally responsible for initializing parent state, model that as an explicit update event in the component API; do not rely on a same-value assignment.

**Solution 3 - Use required prop or explicit undefined handling:**
```html
<!-- ChildComponent.vue -->
<script setup>
import { computed } from 'vue'

// Mark as required - TypeScript will warn if not provided
const model = defineModel({ required: true })

// Or handle undefined explicitly
const safeModel = computed({
  get: () => model.value ?? 1,  // Provide fallback
  set: (val) => { model.value = val }
})
</script>

<template>
  <input v-model="safeModel" type="number">
</template>
```

Do not use a prop validator to detect that the parent model was omitted when the child declares a default: Vue validates the resolved child prop value, which is the default, not `undefined`.

## Reference
- [Vue.js Component v-model](https://vuejs.org/guide/components/v-model.html)
- [Vue core: useModel implementation](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/helpers/useModel.ts)
- [Vue core: prop resolution and validation](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/componentProps.ts)
