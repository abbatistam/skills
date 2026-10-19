---
title: Component Fallthrough Attributes Best Practices
impact: MEDIUM
impactDescription: Incorrect $attrs access and reactivity assumptions can cause undefined values and watchers that never run
type: best-practice
tags: [vue3, attrs, fallthrough-attributes, composition-api, reactivity]
---

# Component Fallthrough Attributes Best Practices

**Impact: MEDIUM** - Fallthrough attributes are straightforward once you follow Vue's conventions: hyphenated names use bracket notation, listener keys are camelCase `onX`, and `useAttrs()` is current-but-not-reactive.

## Task List

- Access hyphenated attribute names with bracket notation (for example `attrs['data-testid']`)
- Access event listeners with camelCase `onX` keys (for example `attrs.onClick`)
- Do not `watch()` values returned from `useAttrs()`; those watchers do not trigger on attr changes
- Use `onUpdated()` only when a side effect must read the latest attrs after an update
- Promote frequently observed attrs to props when reactive observation is required

## Access Attribute and Listener Keys Correctly

Hyphenated attribute names preserve their original casing in JavaScript, so dot notation does not work for keys that include `-`.

**BAD:**
```vue
<script setup>
import { useAttrs } from 'vue'

const attrs = useAttrs()

console.log(attrs.data-testid)  // Syntax error
console.log(attrs.dataTestid)   // undefined for data-testid
console.log(attrs['on-click'])  // undefined
console.log(attrs['@click'])    // undefined
</script>
```

**GOOD:**
```vue
<script setup>
import { useAttrs } from 'vue'

const attrs = useAttrs()

console.log(attrs['data-testid'])
console.log(attrs['aria-label'])
console.log(attrs['foo-bar'])

console.log(attrs.onClick)
console.log(attrs.onCustomEvent)
console.log(attrs.onMouseEnter)
</script>
```

### Naming Reference

| Parent Usage | Access in `attrs` |
|--------------|-------------------|
| `class="foo"` | `attrs.class` |
| `data-id="123"` | `attrs['data-id']` |
| `aria-label="..."` | `attrs['aria-label']` |
| `foo-bar="baz"` | `attrs['foo-bar']` |
| `@click="fn"` | `attrs.onClick` |
| `@custom-event="fn"` | `attrs.onCustomEvent` |
| `@update:modelValue="fn"` | `attrs['onUpdate:modelValue']` |

## `useAttrs()` Is Not Reactive

`useAttrs()` always reflects the latest values, but it is intentionally not reactive for watcher tracking.

**BAD:**
```vue
<script setup>
import { watch, watchEffect, useAttrs } from 'vue'

const attrs = useAttrs()

watch(
  () => attrs.someAttr,
  (newValue) => {
    console.log('Changed:', newValue) // Never runs on attr changes
  }
)

watchEffect(() => {
  console.log(attrs.class) // Runs on setup, not on attr updates
})
</script>
```

**GOOD:**
```vue
<script setup>
import { onUpdated, useAttrs } from 'vue'

const attrs = useAttrs()

onUpdated(() => {
  console.log('Latest attrs:', attrs)
})
</script>
```

**GOOD:**
```vue
<script setup>
import { watch } from 'vue'

const props = defineProps({
  someAttr: String
})

watch(
  () => props.someAttr,
  (newValue) => {
    console.log('Changed:', newValue)
  }
)
</script>
```

## Common Patterns

### Read optional attrs when setup runs

```vue
<script setup>
import { useAttrs } from 'vue'

const attrs = useAttrs()

const hasTestId = 'data-testid' in attrs
const ariaLabel = attrs['aria-label'] ?? 'Default label'
</script>
```

These values are snapshots from setup. `useAttrs()` returns the latest attrs when read, but is not reactive; a `computed()` based on `attrs` will not re-run when an attribute changes. Declare an attribute as a prop if the component needs reactive observation.

### Forward listeners after internal logic

```vue
<script setup>
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

function handleClick(event) {
  console.log('Internal handling first')
  attrs.onClick?.(event)
}
</script>

<template>
  <button @click="handleClick">
    <slot />
  </button>
</template>
```

## TypeScript Notes

`useAttrs()` is typed as `Record<string, unknown>`, so cast individual keys when needed.

```vue
<script setup lang="ts">
import { useAttrs } from 'vue'

const attrs = useAttrs()

const testId = attrs['data-testid'] as string | undefined
const onClick = attrs.onClick as ((event: MouseEvent) => void) | undefined
</script>
```

## Sources

- [Vue: Fallthrough Attributes](https://vuejs.org/guide/components/attrs.html) — preserved attribute casing, listener keys, `inheritAttrs`, `useAttrs()`, and its non-reactive behavior.
- [Vue: Lifecycle Hooks](https://vuejs.org/guide/essentials/lifecycle.html#registering-lifecycle-hooks) — `onUpdated()` timing and the warning against mutating state from the hook.
