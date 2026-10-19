---
title: Use Stable Keys When List Item Identity Matters
impact: MEDIUM
impactDescription: Unstable keys can move component or DOM state to the wrong item when a list changes
type: gotcha
tags: [vue3, v-for, list-rendering, key, state, components]
---

# Use Stable Keys When List Item Identity Matters

When Vue updates a `v-for` list, it uses an in-place patch strategy by default. Give items stable, unique primitive keys when the rendered content has component state, temporary DOM state, or identity-sensitive transitions. For simple stateless content, an unkeyed list can be sufficient; Vue's guide also permits intentionally relying on in-place patching for performance.

The `key` attribute tells Vue how each rendered node maps to the data item. When items are inserted, removed, or reordered, stable keys let Vue preserve the correct component and DOM identity.

## Task Checklist

- [ ] Provide a unique, stable primitive `:key` when item identity or local state must follow an item (for example, a database ID)
- [ ] Avoid an array index key when items can be inserted, removed, or reordered; indices can be appropriate for a static list with no identity-sensitive state
- [ ] Use primitive values only (strings or numbers) - never use objects as keys
- [ ] On `<template v-for>`, place the key on the `<template>` tag itself (Vue 3 change)
- [ ] For component lists, provide stable keys so Vue can track component identity

**Incorrect:**
```html
<!-- WRONG: No key provided -->
<li v-for="item in items">{{ item.name }}</li>

<!-- RISKY: If the list changes order or length, the index no longer identifies the same item -->
<li v-for="(item, index) in items" :key="index">
  <input v-model="item.value" />
</li>

<!-- WRONG: Object as key -->
<li v-for="item in items" :key="item">{{ item.name }}</li>

<!-- WRONG (Vue 3): Key on child instead of template -->
<template v-for="item in items">
  <li :key="item.id">{{ item.name }}</li>
</template>
```

```javascript
// Bug demonstration: Using index as key
// Initial: ['Alice', 'Bob', 'Charlie'] at indices [0, 1, 2]
// After removing 'Bob': ['Alice', 'Charlie'] at indices [0, 1]
// Charlie now has index 1, so Vue reuses Bob's DOM/component state for Charlie!
```

**Correct:**
```html
<!-- CORRECT: Unique identifier as key -->
<li v-for="item in items" :key="item.id">
  {{ item.name }}
</li>

<!-- CORRECT: With components -->
<MyComponent
  v-for="item in items"
  :key="item.id"
  :item="item"
/>

<!-- CORRECT (Vue 3): Key on template tag -->
<template v-for="item in items" :key="item.id">
  <li>{{ item.name }}</li>
  <span>{{ item.description }}</span>
</template>

<!-- CORRECT: With stateful elements -->
<div v-for="user in users" :key="user.id">
  <input v-model="user.email" />
  <select v-model="user.role">
    <option value="admin">Admin</option>
    <option value="user">User</option>
  </select>
</div>
```

## When Stable Keys Matter Most

Use stable keys especially when v-for loops contain:
- Components with local state
- Form elements (`<input>`, `<select>`, `<textarea>`)
- Elements with initialization logic (mounted/created hooks)
- Animations or transitions
- Direct DOM manipulation

## Reference
- [Vue.js List Rendering - Maintaining State with `key`](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key) — in-place patching, when a key is recommended, and the primitive key constraint.
- [Vue 3 Migration Guide - Key on Template](https://v3-migration.vuejs.org/breaking-changes/key-attribute)
