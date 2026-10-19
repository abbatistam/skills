# Async Component Error Handling

## Rule

For user-facing async components, choose an intentional loading and failure experience. Use `loadingComponent` and `errorComponent` for UI states, and add `onError` when failed loads should be retried or handled programmatically.

## Why This Matters

Network failures, timeouts, and server errors can reject the loader promise. Without a loading or error component, the async wrapper has no local fallback UI for those states.

## Bad Code

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

// No local loading/error UI. If the loader rejects, Vue reports the error
// through its component error handling, but this component has no fallback view.
const AsyncWidget = defineAsyncComponent(() =>
  import('./Widget.vue')
)
</script>
```

```vue
<script setup>
import { defineAsyncComponent, ref } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

const isLoading = ref(true)
const Widget = defineAsyncComponent({
  // This clears the flag only when the import fulfills. On rejection,
  // the callback does not run and the flag stays true.
  loader: () => import('./Widget.vue').then((module) => {
    isLoading.value = false
    return module
  })
})
</script>

<template>
  <LoadingSpinner v-if="isLoading" />
  <Widget />
</template>
```

`Promise.prototype.finally()` runs after either fulfillment or rejection. It is useful for cleanup, but it does not handle or recover from a rejected loader; provide an error state as well.

## Good Code

```vue
<script setup>
import { defineAsyncComponent } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ErrorDisplay from './ErrorDisplay.vue'

const AsyncWidget = defineAsyncComponent({
  loader: () => import('./Widget.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,    // Prevent loading flicker
  timeout: 10000 // Show error after 10 seconds
})
</script>
```

```vue
<script setup>
import { defineAsyncComponent } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ErrorDisplay from './ErrorDisplay.vue'

// With retry logic using onError
const AsyncWidget = defineAsyncComponent({
  loader: () => import('./Widget.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) {
      // Retry up to 3 times
      retry()
    } else {
      // Give up and show error component
      fail()
    }
  }
})
</script>
```

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

// Fallback component pattern - catch in loader
const AsyncWidget = defineAsyncComponent(() =>
  import('./Widget.vue').catch(() => import('./WidgetFallback.vue'))
)
</script>
```

## onError Callback Parameters

The `onError` callback receives four arguments:

| Parameter | Type | Description |
|-----------|------|-------------|
| `error` | `Error` | The error that caused the load to fail |
| `retry` | `Function` | Call to retry loading the component |
| `fail` | `Function` | Call to give up and show errorComponent |
| `attempts` | `number` | Number of load attempts so far |

## Key Points

1. Always provide an `errorComponent` for production applications
2. Use `timeout` to prevent indefinite loading states
3. Consider retry logic with `onError` for transient network issues
4. The `delay` option (default 200ms) prevents loading flicker on fast networks
5. Use the fallback pattern (`.catch()` in loader) when you want a seamless degradation

## References

- [Vue.js Async Components Documentation](https://vuejs.org/guide/components/async)
- [Vue core: async component implementation](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/apiAsyncComponent.ts)
- [MDN: Promise.prototype.finally()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally)
