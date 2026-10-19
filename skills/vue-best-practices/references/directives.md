---
title: Directive Best Practices
impact: MEDIUM
impactDescription: Custom directives are powerful but easy to misuse; following patterns prevents leaks, invalid usage, and unclear abstractions
type: best-practice
tags: [vue3, directives, custom-directives, composition, typescript]
---

# Directive Best Practices

**Impact: MEDIUM** - Directives are for low-level DOM access. Use them sparingly, keep them side-effect safe, and prefer components or composables when you need stateful or reusable UI behavior.

## Task List

- Use directives only when you need direct DOM access
- Do not mutate directive arguments or binding objects
- Clean up timers, listeners, and observers in `unmounted`
- Register directives in `<script setup>` with the `v-` prefix
- In TypeScript projects, type directive values and augment template directive types
- Prefer components or composables for complex behavior

## Treat Directive Arguments as Read-Only

Directive bindings are not reactive storage. Don’t write to them.

```ts
const vFocus = {
  mounted(el, binding) {
    // binding.value is read-only
    el.focus()
  }
}
```

## Avoid Applying Directives to Component Tags

Vue does not recommend applying custom directives to component tags: they are applied to the component's root node, and a multi-root component ignores the directive and emits a warning. Put the directive on the intended DOM element inside the component when you control that template.

**BAD:**
```vue
<MyInput v-focus />
```

**GOOD:**
```vue
<!-- MyInput.vue -->
<script setup>
const vFocus = (el) => el.focus()
</script>

<template>
  <input v-focus />
</template>
```

## Clean Up Side Effects in `unmounted`

Any timers, listeners, or observers must be removed to avoid leaks.

```ts
const vResize = {
  mounted(el) {
    const observer = new ResizeObserver(() => {})
    observer.observe(el)
    el._observer = observer
  },
  unmounted(el) {
    el._observer?.disconnect()
  }
}
```

## Prefer Function Shorthand for Single-Hook Directives

If you only need `mounted`/`updated`, use the function form.

```ts
const vAutofocus = (el) => el.focus()
```

## Use the `v-` Prefix and Script Setup Registration

```vue
<script setup>
const vFocus = (el) => el.focus()
</script>

<template>
  <input v-focus />
</template>
```

## Type Custom Directives in TypeScript Projects

Use `Directive<Element, ValueType>` so `binding.value` is typed, and augment Vue's template types so directives are recognized in SFC templates.

**BAD:**
```ts
// Untyped directive value and no template type augmentation
export const vHighlight = {
  mounted(el, binding) {
    el.style.backgroundColor = binding.value
  }
}
```

**GOOD:**
```ts
import type { Directive } from 'vue'

type HighlightDirective = Directive<HTMLElement, string>

export const vHighlight = {
  mounted(el, binding) {
    el.style.backgroundColor = binding.value
  }
} satisfies HighlightDirective

declare module 'vue' {
  interface GlobalDirectives {
    vHighlight: HighlightDirective
  }
}
```

Augment `GlobalDirectives` when the directive is registered with `app.directive()` and should be recognized across templates. Vue's current TypeScript guide uses this interface for global directive type hints.

## Handle SSR with `getSSRProps`

Directive hooks such as `mounted` and `updated` do not run during SSR. If a directive sets attributes/classes that affect rendered HTML, provide an SSR equivalent via `getSSRProps` to avoid hydration mismatches.

**BAD:**
```ts
const vTooltip = {
  mounted(el, binding) {
    el.setAttribute('data-tooltip', binding.value)
    el.classList.add('has-tooltip')
  }
}
```

**GOOD:**
```ts
const vTooltip = {
  mounted(el, binding) {
    el.setAttribute('data-tooltip', binding.value)
    el.classList.add('has-tooltip')
  },
  getSSRProps(binding) {
    return {
      'data-tooltip': binding.value,
      class: 'has-tooltip'
    }
  }
}
```

## Prefer Declarative Templates When Possible

If a standard attribute or binding works, use it instead of a directive.

## Decide Between Directives and Components

Use a directive for DOM-level behavior. Use a component when behavior affects structure, state, or rendering.

## Sources

- [Vue: Custom Directives](https://vuejs.org/guide/reusability/custom-directives.html) — intended use, hooks, read-only binding arguments, function shorthand, and component-tag caveats.
- [Vue: TypeScript with Composition API — Global Custom Directives](https://vuejs.org/guide/typescript/composition-api.html#typing-global-custom-directives) — `Directive` typing and `GlobalDirectives` augmentation.
- [Vue: SSR](https://vuejs.org/guide/scaling-up/ssr.html#custom-directives) — `getSSRProps` when a directive must contribute attributes to server-rendered HTML.
