---
title: Properly Handle Async Updates with nextTick and flushPromises
impact: HIGH
impactDescription: Race conditions and flaky tests occur when async DOM updates or API calls complete after assertions run
type: gotcha
tags: [vue3, testing, async, flushPromises, nextTick, vitest, vue-test-utils, race-condition]
---

# Properly Handle Async Updates with nextTick and flushPromises

**Impact: HIGH** - Vue updates the DOM asynchronously. Without properly awaiting these updates, tests may assert against stale DOM state, causing intermittent failures and false negatives.

Use `await` with triggers and `setValue` to wait for Vue's DOM update. Use `nextTick` after programmatic reactive changes. Use `flushPromises` to drain handlers for promises that the test has already arranged to resolve (for example, a mocked request). It does not settle an intentionally pending promise or advance fake timers; control those with the promise or timer APIs used by the test.

## Task Checklist

- [ ] Always await `trigger()` and `setValue()` calls
- [ ] Use `await nextTick()` after programmatic reactive state changes
- [ ] Use `await flushPromises()` after mocked or otherwise settled promises whose handlers update the component
- [ ] Resolve deferred promises and advance fake timers explicitly; `flushPromises()` does neither
- [ ] Consider using `waitFor` from testing-library for polling assertions

**Incorrect:**
```javascript
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchComponent from './SearchComponent.vue'

// BAD: Not awaiting trigger - assertion runs before DOM updates
test('search filters results', () => {
  const wrapper = mount(SearchComponent)

  wrapper.find('input').setValue('vue')  // Missing await!
  wrapper.find('button').trigger('click')  // Missing await!

  // This assertion likely fails - DOM hasn't updated yet
  expect(wrapper.findAll('.result').length).toBe(3)
})

// BAD: Using nextTick for API calls
test('loads data from API', async () => {
  const wrapper = mount(DataLoader)

  await nextTick()  // This won't wait for the API call!

  // Assertion runs before fetch completes
  expect(wrapper.find('.data').text()).toBe('Loaded data')
})
```

**Correct:**
```javascript
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchComponent from './SearchComponent.vue'
import DataLoader from './DataLoader.vue'

// CORRECT: Await trigger and setValue
test('search filters results', async () => {
  const wrapper = mount(SearchComponent)

  await wrapper.find('input').setValue('vue')
  await wrapper.find('button').trigger('click')

  expect(wrapper.findAll('.result').length).toBe(3)
})

// CORRECT: Use flushPromises for API calls
test('loads data from API', async () => {
  const wrapper = mount(DataLoader)

  // Wait for all pending promises to resolve
  await flushPromises()

  expect(wrapper.find('.data').text()).toBe('Loaded data')
})
```

The examples that call `flushPromises()` assume the API dependency is mocked to settle. The helper does not make a real or deferred request finish.

## When to Use Each Method

### `await trigger()` / `await setValue()` - User Interactions
```javascript
// These methods return nextTick internally
await wrapper.find('button').trigger('click')
await wrapper.find('input').setValue('new value')
await wrapper.find('form').trigger('submit')
```

### `await nextTick()` - Programmatic Reactive Updates
```javascript
import { nextTick } from 'vue'

test('reflects programmatic state changes', async () => {
  const wrapper = mount(Counter)

  // Direct state modification (when testing with exposed internals)
  wrapper.vm.count = 5

  await nextTick()  // Wait for Vue to update DOM

  expect(wrapper.find('.count').text()).toBe('5')
})
```

### `await flushPromises()` - Settled External Promises
```javascript
import { flushPromises } from '@vue/test-utils'

test('displays fetched data', async () => {
  const wrapper = mount(UserProfile, {
    props: { userId: 1 }
  })

  // Wait for component's API call to complete
  await flushPromises()

  expect(wrapper.find('.username').text()).toBe('John')
})

// Arrange the API response to settle, then drain its handlers once.
test('processes data after fetch', async () => {
  const wrapper = mount(DataProcessor)

  // e.g. mock the request with a resolved promise before mounting.
  await flushPromises()

  expect(wrapper.find('.processed').exists()).toBe(true)
})
```

## Common Pattern: Combining Methods
```javascript
test('submits form and shows success', async () => {
  const wrapper = mount(ContactForm)

  // Fill form (awaiting each interaction)
  await wrapper.find('#name').setValue('John')
  await wrapper.find('#email').setValue('john@example.com')

  // Submit form
  await wrapper.find('form').trigger('submit')

  // Wait for API submission to complete
  await flushPromises()

  // Assert success state
  expect(wrapper.find('.success-message').exists()).toBe(true)
})
```

## Testing with MSW or Mock APIs

This example uses MSW 3.x in Node-based tests: import handlers from `msw/http`, and import `setupServer` from `msw/node`. MSW 3 requires Node.js 22+. MSW 2 uses the same `http`/`HttpResponse` handler API but exports those from `msw`; MSW 1 uses the older `rest` API. Match the installed major version and the project's supported Node version.

```javascript
import { mount, flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw/http'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import UserCard from './UserCard.vue'

const server = setupServer(
  http.get('/api/user', () => HttpResponse.json({ name: 'John' }))
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('displays user data', async () => {
  const wrapper = mount(UserCard)

  await flushPromises()

  expect(wrapper.find('.name').text()).toBe('John')
})
```

If a request is intentionally deferred, resolve it in the test before flushing promise handlers. With fake timers, advance the relevant timer explicitly and then await the Vue update if needed.

## Reference
- [Vue Test Utils - Asynchronous Behavior](https://test-utils.vuejs.org/guide/advanced/async-suspense)
- [Vue Test Utils API - `flushPromises`](https://test-utils.vuejs.org/api/#flushpromises) — flushes resolved promise handlers.
- [Vue.js Testing Guide](https://vuejs.org/guide/scaling-up/testing)
- [MSW: Node.js integration](https://mswjs.io/guides/integrations/node) — Node setup and test lifecycle.
- [MSW: `setupServer`](https://mswjs.io/api/setup-server/) — current handler API using `http` and `HttpResponse`.
- [MSW: 2.x to 3.x migration](https://mswjs.io/docs/migrations/2.x-to-3.x) — package entry points and Node.js 22 minimum.
