---
title: Create Stateful Methods in Lifecycle Hooks
impact: MEDIUM
impactDescription: A stateful wrapper created in shared component options can be reused across instances
type: capability
tags: [vue3, options-api, debounce, throttle, lifecycle, cleanup]
---

# Create Stateful Methods in Lifecycle Hooks

If a stateful wrapper such as `debounce()` is created while the component options are defined, reused component instances can share that wrapper's internal state. A debounced callback in one instance can therefore affect another instance.

Create one wrapper per instance in `created()` when instances need independent timing/state. Cancel pending work in `unmounted()` when it could run after removal or act on stale instance state.

## Task Checklist

- [ ] Do not create a stateful wrapper once in the shared component options when each instance needs independent state
- [ ] Create per-instance wrappers in `created()` when instances must not share debounce/throttle state
- [ ] Cancel pending work in `unmounted()` when a callback could outlive the instance or produce stale effects

**Incorrect:**
```javascript
import { debounce } from 'lodash-es'

export default {
  methods: {
    // WRONG: All component instances share this debounced function!
    // If used in a v-for, clicking one button affects all instances
    handleClick: debounce(function() {
      this.performSearch()
    }, 500)
  }
}
```

**Correct:**
```javascript
import { debounce } from 'lodash-es'

export default {
  created() {
    // CORRECT: Each instance gets its own debounced function
    this.debouncedSearch = debounce(this.performSearch, 500)
  },
  unmounted() {
    // Cancel pending work so it cannot run after this instance is removed
    this.debouncedSearch.cancel()
  },
  methods: {
    handleClick() {
      this.debouncedSearch()
    },
    performSearch() {
      // Actual search logic
    }
  }
}
```

## Reference
- [Vue.js Reactivity Fundamentals - Stateful Methods](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#stateful-methods) — shared debounce state across reused components, per-instance creation in `created()`, and cancellation as a cleanup recommendation.
