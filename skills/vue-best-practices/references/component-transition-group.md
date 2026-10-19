---
title: TransitionGroup Component Best Practices
impact: MEDIUM
impactDescription: TransitionGroup animates list items as they enter, leave, or move; stable item identity is important for correct updates
type: best-practice
tags: [vue3, transition-group, animation, lists, keys]
---

# TransitionGroup Component Best Practices

Use `<TransitionGroup>` when elements in a list are inserted, removed, or moved. Unlike `<Transition>`, its children must have unique keys. In Vue 3 it renders no wrapper by default; set `tag` when the list needs a semantic or styled container.

## Task List

- Use `<TransitionGroup>` for list transitions; use `<Transition>` for a single changing child
- Give each repeated item a stable, unique key
- Set `tag` when the list needs a semantic or styled wrapper element
- Use CSS transition classes for simple enter, leave, or move effects
- Use JavaScript hooks when CSS alone cannot express the required sequence

## Animate List Changes

```vue
<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </TransitionGroup>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: opacity 180ms ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
}

.list-move {
  transition: transform 180ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .list-enter-active,
  .list-leave-active,
  .list-move {
    transition: none;
  }
}
</style>
```

Use a key based on the item's identity, such as `item.id`, rather than its current array index when items can be reordered or removed. Vue uses keys to track which item is entering, leaving, or moving.

`<TransitionGroup>` has no `mode` prop. If a view swap needs out-in or in-out sequencing, use `<Transition>` around that single view instead.

## Sources

- [Vue: TransitionGroup](https://vuejs.org/guide/built-ins/transition-group.html) — list transitions, unique keys, wrapper tags, move classes, and JavaScript hooks.
- [Vue: Transition](https://vuejs.org/guide/built-ins/transition.html) — single-child transitions and transition modes.
- [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — reduced-motion media query.
