---
title: Boolean Props: Runtime Defaults and Type Inference
impact: MEDIUM
impactDescription: Absent Boolean props resolve to false, and type-based defineProps reflects that resolved value
type: gotcha
tags: [vue3, typescript, props, boolean, defineProps]
---

# Boolean Props: Runtime Defaults and Type Inference

**Impact: MEDIUM** - Vue casts an absent Boolean prop to `false` unless an explicit default overrides that behavior. Type-based `defineProps` accounts for this special case: for `disabled?: boolean`, `props.disabled` is typed as `boolean`, not `boolean | undefined`. If the component needs an undefined state, declare that default explicitly.

## Task Checklist

- [ ] Understand that an absent Boolean prop resolves to `false` by default
- [ ] Know that type-based `defineProps` types an optional Boolean prop as `boolean`
- [ ] Set an explicit `undefined` default when the component needs a three-state Boolean
- [ ] Document this Vue-specific behavior for your team

## The Gotcha

```vue
<script setup lang="ts">
interface Props {
  disabled?: boolean
}

const props = defineProps<Props>()

const isDisabled: boolean = props.disabled
// If omitted, Vue resolves this Boolean prop to false.
// TypeScript also rejects checking props.disabled === undefined because its
// inferred type is boolean.
</script>

<template>
  <!-- When used without the prop -->
  <MyComponent />
  <!-- disabled is false, NOT undefined -->
</template>
```

## Why This Happens

Vue has special "boolean casting" behavior inherited from HTML boolean attributes:

```vue
<!-- All of these make disabled = true -->
<MyComponent disabled />
<MyComponent :disabled="true" />
<MyComponent disabled="" />

<!-- An absent Boolean prop resolves to false -->
<MyComponent />

<!-- Explicit false -->
<MyComponent :disabled="false" />
```

This is by design to match how HTML works:
```html
<!-- HTML: presence means true, absence means false -->
<button disabled>Can't click</button>
<button>Can click</button>
```

## Solutions

### Solution 1: Be Explicit with withDefaults

Make your intention clear:

```vue
<script setup lang="ts">
interface Props {
  disabled?: boolean
}

// Explicitly document the default
const props = withDefaults(defineProps<Props>(), {
  disabled: false  // Now it's clear this defaults to false
})
</script>
```

### Solution 2: Declare an Explicit Undefined Default

If the component needs to distinguish `undefined` from `false`, set the Boolean prop's default to `undefined`:

```vue
<script setup lang="ts">
interface Props {
  toggleState?: boolean
}

// Vue 3.3.5+ preserves boolean | undefined for an explicit undefined default.
const props = withDefaults(defineProps<Props>(), {
  toggleState: undefined
})

if (props.toggleState === undefined) {
  // No preference was provided.
} else if (props.toggleState) {
  // Enabled.
} else {
  // Explicitly disabled.
}
</script>
```

In Vue 3.3.5+, Vue's TypeScript support also preserves `boolean | undefined` for this explicit undefined default. Vue 3.3.4's `withDefaults` type mapping did not preserve this distinction.

### Solution 3: Use null for "Not Set"

```vue
<script setup lang="ts">
interface Props {
  // null = not set, false = explicitly off, true = explicitly on
  selected?: boolean | null
}

const props = withDefaults(defineProps<Props>(), {
  selected: null
})

// Three distinct states
if (props.selected === null) {
  console.log('Selection not specified')
} else if (props.selected) {
  console.log('Selected')
} else {
  console.log('Explicitly not selected')
}
</script>
```

## Boolean Casting Order

Vue also has special behavior when Boolean and String are both valid:

```typescript
// Order matters in runtime declaration!
defineProps({
  // Boolean first: empty string becomes true
  disabled: [Boolean, String]
})

// <MyComponent disabled /> → disabled = true
// <MyComponent disabled="" /> → disabled = true
```

```typescript
defineProps({
  // String first: empty string stays as string
  disabled: [String, Boolean]
})

// <MyComponent disabled /> → disabled = ''
// <MyComponent disabled="" /> → disabled = ''
```

With type-based declaration, Boolean always takes priority for absent props.

## Explicit `undefined` Is Different from an Omitted Prop

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref } from 'vue'

// This binding is present even while its value is undefined.
const darkMode = ref<boolean | undefined>(undefined)
</script>

<template>
  <ThemeToggle :darkMode="darkMode" />
</template>
```

If the child must also preserve `undefined` when the parent omits the prop, declare `undefined` as its default:

```vue
<!-- ThemeToggle.vue -->
<script setup lang="ts">
const props = defineProps({
  darkMode: {
    type: Boolean,
    default: undefined
  }
})
</script>

<template>
  <span>{{ props.darkMode === undefined ? 'Use system preference' : props.darkMode ? 'Dark' : 'Light' }}</span>
</template>
```

If the parent omits `darkMode` entirely and the child has no explicit undefined default, Vue resolves the absent Boolean prop to `false`.

## TypeScript Type Accuracy

The Vue type system handles this, but it can be confusing:

```typescript
interface Props {
  disabled?: boolean
}

const props = defineProps<Props>()

// At compile time: boolean
// When omitted at runtime: false

// In Vue 3.3.5+, withDefaults(..., { disabled: undefined }) also preserves
// boolean | undefined in the inferred type.
```

## Reference
- [Vue.js Props - Boolean Casting](https://vuejs.org/guide/components/props.html#boolean-casting)
- [Vue core v3.3.5: defineProps Boolean prop typing and withDefaults inference](https://github.com/vuejs/core/blob/v3.3.5/packages/runtime-core/src/apiSetupHelpers.ts)
- [Vue core PR: preserving `boolean | undefined` with an explicit undefined default](https://github.com/vuejs/core/pull/8602)
