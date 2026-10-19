---
title: Use Class-based Animations for Non-Enter/Leave Effects
impact: LOW
impactDescription: Class toggles let Vue state trigger CSS animations on elements that remain in the DOM
type: best-practice
tags: [vue3, animation, css, class-binding, state]
---

# Use Class-based Animations for Non-Enter/Leave Effects

**Impact: LOW** - For animations on elements that remain in the DOM, toggle a CSS class from reactive state. Use Vue's `<Transition>` for enter/leave effects and `<TransitionGroup>` for items inserted, removed, or moved in a list.

## Task List

- Use class-based animations for elements staying in the DOM
- Use `<Transition>` for enter/leave animations and `<TransitionGroup>` for list changes
- Combine CSS animations with Vue's class bindings (`:class`)
- Prefer the `animationend` event to remove a class when its CSS animation finishes; handle the event only on the animated element
- Respect the user's reduced-motion preference for nonessential motion

**When to Use Class-based Animations:**
- User feedback (shake on error, pulse on success)
- Attention-grabbing effects (highlight changes)
- Hover/focus states that need more than CSS transitions
- Any animation where the element stays mounted

**When to Use Transition Component:**
- Elements entering/leaving the DOM (v-if/v-show)
- Route transitions
- List item additions/removals

## Basic Pattern

```vue
<script setup>
import { ref } from 'vue'

const showError = ref(false)

function submitForm() {
  if (!isValid()) {
    // Trigger shake animation
    showError.value = true

  }
}
</script>

<template>
  <div
    :class="{ shake: showError }"
    @animationend.self="showError = false"
  >
    <button @click="submitForm">Submit</button>
    <span v-if="showError">This feature is disabled!</span>
  </div>
</template>

<style>
.shake {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}
</style>
```

## Common Animation Patterns

### Pulse on Success

```vue
<script setup>
import { ref } from 'vue'

const saved = ref(false)

async function save() {
  await saveData()
  saved.value = true
}
</script>

<template>
  <button
    @click="save"
    @animationend.self="saved = false"
    :class="{ pulse: saved }"
  >
    {{ saved ? 'Saved!' : 'Save' }}
  </button>
</template>

<style>
.pulse {
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>
```

### Highlight on Change

```vue
<script setup>
import { ref, watch } from 'vue'

const value = ref(0)
const justUpdated = ref(false)

watch(value, () => {
  justUpdated.value = true
})
</script>

<template>
  <div
    :class="{ highlight: justUpdated }"
    @animationend.self="justUpdated = false"
  >
    Value: {{ value }}
  </div>
</template>

<style>
.highlight {
  animation: highlight 1s ease-out;
}

@keyframes highlight {
  0% { background-color: yellow; }
  100% { background-color: transparent; }
}
</style>
```

### Bounce Attention

```vue
<script setup>
import { ref } from 'vue'

const needsAttention = ref(false)

function notifyUser() {
  needsAttention.value = true
  // No setTimeout needed - using animationend event
}
</script>

<template>
  <div
    :class="{ bounce: needsAttention }"
    @animationend.self="needsAttention = false"
  >
    <BellIcon />
  </div>
</template>

<style>
.bounce {
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
```

## Using animationend Event

Instead of `setTimeout`, use the `animationend` event for cleaner code:

```vue
<script setup>
import { ref } from 'vue'

const isAnimating = ref(false)

function triggerAnimation() {
  isAnimating.value = true
  // Class is automatically removed when animation ends
}
</script>

<template>
  <div
    :class="{ animate: isAnimating }"
    @animationend.self="isAnimating = false"
  >
    Content
  </div>
</template>
```

`transform` can be efficient to animate, but it does not guarantee GPU acceleration in every browser. Avoid adding `will-change` preemptively; profile the actual animation and target devices. Consider a reduced-motion alternative for nonessential motion:

```css
@media (prefers-reduced-motion: reduce) {
  .shake,
  .pulse,
  .highlight,
  .bounce {
    animation: none;
  }
}
```


## Sources

- [Vue: Animation Techniques](https://vuejs.org/guide/extras/animation.html#class-based-animations) — class-based animations for elements that do not enter or leave the DOM.
- [Vue: Transition](https://vuejs.org/guide/built-ins/transition.html) — when to use `<Transition>` and `<TransitionGroup>`, plus CSS animation behavior.
- [Vue: Transition Performance Considerations](https://vuejs.org/guide/built-ins/transition.html#performance-considerations) — performance characteristics of `transform` and `opacity` compared with layout-triggering properties.
- [MDN: `animationend`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationend_event) — event fired when a CSS animation completes.
- [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — CSS media query for a user's reduced-motion preference.
