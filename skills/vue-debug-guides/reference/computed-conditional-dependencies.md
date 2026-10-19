---
title: Computed Dependencies Follow the Executed Branches
impact: MEDIUM
impactDescription: Understanding branch-based dependency tracking prevents unnecessary subscriptions and false stale-value diagnoses
type: gotcha
tags: [vue3, computed, reactivity, dependency-tracking]
---

# Computed Dependencies Follow the Executed Branches

**Impact: MEDIUM** - A computed getter tracks the reactive properties it reads while it runs. Conditional branches therefore produce conditional dependencies: a property not read on the current run does not need to invalidate that result. When a tracked condition changes, Vue reruns the getter and collects the dependencies from the new branch.

This is normal behavior, not a stale-value bug. Do not read every possible dependency just to force a computed property to subscribe to it; doing so can cause unnecessary recomputation.

## Task Checklist

- [ ] Identify which reactive reads occur on each branch
- [ ] Confirm that a reactive condition selecting a branch is itself tracked
- [ ] Read a value unconditionally only when the result depends on it in every branch

## Conditional dependency tracking

```vue
<script setup>
import { ref, computed } from 'vue'

const showDetails = ref(false)
const details = ref('Important data')

const summary = computed(() => {
  if (!showDetails.value) return 'Hidden'
  return details.value
})

// While hidden, changing details does not recompute summary; its result is
// still 'Hidden'. Changing showDetails reruns the getter, which then tracks
// details and returns its current value.
</script>
```

Short-circuit expressions behave the same way:

```javascript
import { ref, computed } from 'vue'

const password = ref('')
const confirmPassword = ref('')

const isValid = computed(() =>
  password.value.length > 0 && password.value === confirmPassword.value
)
```

When `password` is empty, `confirmPassword` is not read because the first operand determines the result. Once `password` changes to a non-empty value, Vue reruns the getter and begins tracking `confirmPassword` too.

## Reference

- [Vue.js Computed Properties](https://vuejs.org/guide/essentials/computed.html)
- [Vue.js Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Vue core: reactive effect dependency cleanup](https://github.com/vuejs/core/blob/main/packages/reactivity/src/effect.ts)
