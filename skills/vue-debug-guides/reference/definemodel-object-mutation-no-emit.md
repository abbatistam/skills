---
title: defineModel Nested Mutations Do Not Emit Model Updates
impact: MEDIUM
impactDescription: Nested object mutations bypass the model ref setter, so no update:modelValue event is emitted
type: gotcha
tags: [vue3, v-model, defineModel, objects, reactivity, two-way-binding]
---

# defineModel Nested Mutations Do Not Emit Model Updates

**Impact: MEDIUM** - `defineModel()` emits `update:modelValue` when its ref value is assigned. Mutating a nested property such as `model.value.user.name = 'Ari'` does not assign to the model ref, so it does not emit that event.

The object is still shared by reference. If the parent passed a reactive object, a nested mutation can change the parent's object directly; the data may appear updated even though no model update event was emitted. That implicit mutation can make data flow harder to reason about.

`defineModel()` is available in Vue 3.4+. Before 3.4, use a prop and an `update:` event.

## Task Checklist

- [ ] Decide whether the child should mutate a shared object or ask the parent to update it
- [ ] Replace `model.value` when the component contract requires an `update:modelValue` event
- [ ] Avoid describing nested mutation as an emitted model update

## Nested mutation and replacement

```vue
<script setup lang="ts">
const model = defineModel<{ user: { name: string } }>({ required: true })

function mutateNestedValue(newName: string) {
  // Mutates the shared object but does not emit update:modelValue.
  model.value.user.name = newName
}

function emitReplacement(newName: string) {
  // Assigning the model ref emits update:modelValue to the parent.
  model.value = {
    ...model.value,
    user: {
      ...model.value.user,
      name: newName
    }
  }
}
</script>
```

The replacement pattern is useful when the parent should own the mutation and receive an explicit update event. Nested mutation can still be appropriate when parent and child intentionally share mutable state; document that contract clearly.

## Reference

- [Vue.js Component v-model](https://vuejs.org/guide/components/v-model.html)
- [Vue.js Props: Mutating Object / Array Props](https://vuejs.org/guide/components/props.html#mutating-object-array-props)
- [Vue core: `useModel` ref setter](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/helpers/useModel.ts)
