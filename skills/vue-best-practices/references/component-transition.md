---
title: Transition Component Best Practices
impact: MEDIUM
impactDescription: Transition applies enter and leave effects to one element or component; child identity and CSS classes determine when they run
type: best-practice
tags: [vue3, transition, animation, performance, keys]
---

# Transition Component Best Practices

Vue's `<Transition>` applies enter and leave effects to one element or component. Use `<TransitionGroup>` for list items that are inserted, removed, or moved. For an element that stays in the DOM, use a CSS class or state-driven style binding instead.

## Task List

- Provide one element or component as the transition child
- Change the child's `key` when same-type content should be treated as a new identity
- Use `mode="out-in"` only when the old child should leave before the new child enters
- Respect reduced-motion preferences for nonessential motion
- Profile expensive animations; do not assume one property choice guarantees smoothness

## Transition Between States

Changing only text or props on the same element normally updates that element in place. A changing `key` tells Vue to treat it as a different vnode and run leave/enter effects.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const status = ref<'saving' | 'saved'>('saving')
</script>

<template>
  <Transition name="fade" mode="out-in">
    <p :key="status" role="status">
      {{ status === 'saving' ? 'Saving…' : 'Saved' }}
    </p>
  </Transition>
</template>
```

`mode="out-in"` is useful here if both states should not overlap. Omit `mode` when the default transition timing better fits the design.

## CSS Transition and Reduced Motion

```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
```

Vue detects CSS transitions or animations on the child and manages the corresponding transition classes. If CSS transition and animation rules coexist on the same element, specify the `type` prop so Vue knows which completion event to observe.

## Consider Animation Cost

`transform` and `opacity` usually avoid layout recalculation during animation. Properties such as `height` or `margin` can trigger layout and may cost more; use them when they express the desired layout change, then profile on representative devices. Reduced-motion styling and measured performance matter more than a blanket ban on a CSS property.

## Sources

- [Vue: Transition](https://vuejs.org/guide/built-ins/transition.html) — single-child behavior, keyed transitions, modes, CSS classes, `type`, and performance considerations.
- [Vue: TransitionGroup](https://vuejs.org/guide/built-ins/transition-group.html) — transitions for elements inserted, removed, or moved in lists.
- [Vue: Animation Techniques](https://vuejs.org/guide/extras/animation.html) — class-based and state-driven animations for elements that stay in the DOM.
- [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — user preference for reduced motion.
