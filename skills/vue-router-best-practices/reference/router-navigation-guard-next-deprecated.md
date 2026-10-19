---
title: Prefer Return-based Vue Router Navigation Guards
impact: MEDIUM
impactDescription: Return-based guards are easier to reason about, while callback-based next() remains supported and is needed for beforeRouteEnter instance callbacks
type: gotcha
tags: [vue3, vue-router, navigation-guards, migration, async]
---

# Prefer Return-based Vue Router Navigation Guards

**Impact: MEDIUM** - Prefer return-based guards for ordinary allow, cancel, and redirect decisions. Vue Router still supports the third `next()` argument, but marks its callback API deprecated and requires exactly one call on every path. Do not remove the `next(vm => ...)` callback from `beforeRouteEnter` when code needs the entering component instance: that guard runs before the instance exists, and it is the only guard that supports this callback.

## Task Checklist

- [ ] Prefer return-based syntax for ordinary allow, cancel, and redirect decisions
- [ ] If retaining the third `next` argument, call it exactly once on every path
- [ ] Keep `next(vm => ...)` in `beforeRouteEnter` when the entering component instance is required
- [ ] Use async/await pattern for asynchronous checks
- [ ] Return false to cancel, return route to redirect, return nothing to proceed

## The Problem

```javascript
// LEGACY STYLE: Prefer a return-based guard for this decision
router.beforeEach((to, from, next) => {
  if (!isAuthenticated) {
    next('/login')  // Easy to forget this call
  }
  // BUG: next() not called when authenticated - navigation hangs!
})

// WRONG: Multiple next() calls
router.beforeEach((to, from, next) => {
  if (!isAuthenticated) {
    next('/login')
  }
  next()  // BUG: Called twice when not authenticated!
})

// WRONG: next() in async code without proper handling
router.beforeEach(async (to, from, next) => {
  const user = await fetchUser()
  if (!user) {
    next('/login')
  }
  next()  // Still gets called even after redirect!
})
```

## Solution: Use Return-Based Guards

```javascript
// CORRECT: Return-based syntax (modern Vue Router 4+)
router.beforeEach((to, from) => {
  if (!isAuthenticated) {
    return '/login'  // Redirect
  }
  // Return nothing (undefined) to proceed
})

// CORRECT: Return false to cancel navigation
router.beforeEach((to, from) => {
  if (hasUnsavedChanges) {
    return false  // Cancel navigation
  }
})

// CORRECT: Async with return-based syntax
router.beforeEach(async (to, from) => {
  const user = await fetchUser()
  if (!user) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  // Proceed with navigation
})
```

## Return Values Explained

```javascript
router.beforeEach((to, from) => {
  // Return nothing/undefined - allow navigation
  return

  // Return false - cancel navigation, stay on current route
  return false

  // Return string path - redirect to path
  return '/login'

  // Return route object - redirect with full control
  return { name: 'Login', query: { redirect: to.fullPath } }

  // Return Error - cancel and trigger router.onError()
  return new Error('Navigation cancelled')
})
```

## Retaining the Callback API

The third `next` argument is still supported. When a guard uses it, call it exactly once in every possible path. In `beforeRouteEnter`, its callback form is the documented way to access the entering component instance after navigation is confirmed:

```javascript
const UserDetails = {
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.loadUser(to.params.id)
    })
  },
}
```

For guards that do not need that callback, return-based control flow usually makes the result clearer. If retaining `next`, follow this control-flow pattern:

```javascript
// CORRECT: Exactly one next() call per code path
router.beforeEach((to, from, next) => {
  if (!isAuthenticated) {
    next('/login')
    return  // CRITICAL: Exit after calling next()
  }

  if (!hasPermission(to)) {
    next('/forbidden')
    return  // CRITICAL: Exit after calling next()
  }

  next()  // Only reached if all checks pass
})
```

## Error Handling Pattern

```javascript
router.beforeEach(async (to, from) => {
  try {
    await validateAccess(to)
    // Proceed
  } catch (error) {
    if (error.status === 401) {
      return '/login'
    }
    if (error.status === 403) {
      return '/forbidden'
    }
    // Log error and proceed anyway (or return false)
    console.error('Access validation failed:', error)
    return false
  }
})
```

## Key Points

1. **Prefer return-based syntax** - It makes allow, cancel, and redirect outcomes explicit
2. **The third `next` argument is still supported but deprecated in the current API reference** - If used, call it exactly once per path
3. **Keep the `beforeRouteEnter` callback when needed** - It runs after navigation confirmation with the entering component instance
4. **Async guards work with either style** - Return a redirect or nothing; if using `next`, guard against calling it more than once
5. **Test all code paths** - Every branch must resolve the navigation exactly once

## Reference
- [Vue Router Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html) — return-based guard outcomes, continued support for the optional `next` argument, and the callback exception for `beforeRouteEnter`.
- [Vue Router API: `NavigationGuardNext`](https://router.vuejs.org/api/interfaces/navigationguardnext) — currently marks the callback API deprecated and says it will be removed in a future version.
- [RFC: Remove next() from Navigation Guards](https://github.com/vuejs/rfcs/discussions/302)
