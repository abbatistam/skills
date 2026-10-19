---
title: State-driven Animations with CSS Transitions and Style Bindings
impact: LOW
impactDescription: Reactive style bindings can drive CSS transitions and state-dependent visual changes
type: best-practice
tags: [vue3, animation, css, transition, style-binding, state, interactive]
---

# State-driven Animations with CSS Transitions and Style Bindings

**Impact: LOW** - For visual changes driven by state or user input, bind the relevant style values and use CSS transitions where interpolation is appropriate. Choose the animated properties and update frequency based on the effect and measured browser behavior.

## Task List

- Use `:style` binding for dynamic properties that change frequently
- Add CSS `transition` property to smoothly animate between values
- Consider `transform` and `opacity` when they express the effect; they usually avoid per-frame layout work
- For complex value interpolation, use watchers with animation libraries

## Basic Pattern

```vue
<script setup>
import { ref } from 'vue'

const hue = ref(0)

function onMousemove(e) {
  // Map mouse X position to hue (0-360)
  const rect = e.currentTarget.getBoundingClientRect()
  hue.value = Math.round((e.clientX - rect.left) / rect.width * 360)
}
</script>

<template>
  <div
    @mousemove="onMousemove"
    :style="{ backgroundColor: `hsl(${hue}, 80%, 50%)` }"
    class="interactive-area"
  >
    <p>Move your mouse across this div...</p>
    <p>Hue: {{ hue }}</p>
  </div>
</template>

<style>
.interactive-area {
  transition: background-color 0.3s ease;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
```

## Common Use Cases

### Following Mouse Position

```vue
<script setup>
import { ref } from 'vue'

const x = ref(0)
const y = ref(0)

function onMousemove(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  x.value = e.clientX - rect.left
  y.value = e.clientY - rect.top
}
</script>

<template>
  <div
    class="container"
    @mousemove="onMousemove"
  >
    <div
      class="follower"
      :style="{
        transform: `translate(${x}px, ${y}px)`
      }"
    />
  </div>
</template>

<style>
.container {
  position: relative;
  height: 300px;
}

.follower {
  position: absolute;
  width: 20px;
  height: 20px;
  background: blue;
  border-radius: 50%;
  /* Smooth following with transition */
  transition: transform 0.1s ease-out;
  /* Prevent the follower from triggering mousemove */
  pointer-events: none;
}
</style>
```

### Progress Animation

```vue
<script setup>
import { ref } from 'vue'

const progress = ref(0)
</script>

<template>
  <div class="progress-container">
    <div
      class="progress-bar"
      :style="{ width: `${progress}%` }"
    />
  </div>
  <input
    type="range"
    v-model.number="progress"
    min="0"
    max="100"
  />
</template>

<style>
.progress-container {
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}
</style>
```

### Scroll-based Animation

```vue
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const scrollY = ref(0)

const heroOpacity = computed(() => {
  return Math.max(0, 1 - scrollY.value / 300)
})

const scrollOffset = computed(() => {
  return scrollY.value * 0.5  // Parallax effect
})

function handleScroll() {
  scrollY.value = window.scrollY
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div
    class="hero"
    :style="{
      opacity: heroOpacity,
      transform: `translateY(${scrollOffset}px)`
    }"
  >
    <h1>Scroll Down</h1>
  </div>
</template>

<style>
.hero {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Note: No transition for scroll-based animations - they should be instant */
}
</style>
```

### Color Theme Transition

```vue
<script setup>
import { ref, computed } from 'vue'

const isDark = ref(false)

const themeStyles = computed(() => ({
  '--bg-color': isDark.value ? '#1a1a1a' : '#ffffff',
  '--text-color': isDark.value ? '#ffffff' : '#1a1a1a',
  backgroundColor: 'var(--bg-color)',
  color: 'var(--text-color)'
}))

function toggleTheme() {
  isDark.value = !isDark.value
}
</script>

<template>
  <div
    class="app"
    :style="themeStyles"
  >
    <button @click="toggleTheme">Toggle Theme</button>
    <p>Current theme: {{ isDark ? 'Dark' : 'Light' }}</p>
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  transition: background-color 0.5s ease, color 0.5s ease;
}
</style>
```

## Advanced: Numerical Tweening with Watchers

For smooth number animations (counters, stats), use watchers with animation libraries:

```vue
<script setup>
import { computed, ref, reactive, watch } from 'vue'
import gsap from 'gsap'

const targetNumber = ref(0)
const tweened = reactive({ value: 0 })

// Computed for display
const displayNumber = computed(() => tweened.value)

watch(targetNumber, (newValue) => {
  gsap.to(tweened, {
    duration: 0.5,
    value: Number(newValue) || 0,
    ease: 'power2.out'
  })
})
</script>

<template>
  <div>
    <input v-model.number="targetNumber" type="number" />
    <p class="counter">{{ displayNumber.toFixed(0) }}</p>
  </div>
</template>
```

## Performance Considerations

```vue
<style>
  /* Often efficient properties to animate */
.element {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* AVOID: Properties that trigger layout recalculation */
.element {
  transition: width 0.3s ease, height 0.3s ease, margin 0.3s ease;
}

</style>
```

`transform` and `opacity` generally avoid layout recalculation during animation, but do not guarantee that every animation is smooth or GPU-accelerated. Properties such as `width`, `height`, and `margin` can trigger layout; choose based on the design and profile the result. MDN recommends treating `will-change` as a last resort because overuse can consume resources and make performance worse.

For scroll-driven effects, avoid assuming that updating reactive state on every scroll event will be inexpensive. Measure the specific page, and consider browser-native CSS scroll-driven animations when they fit the required browser support.

## Sources

- [Vue: Animation Techniques](https://vuejs.org/guide/extras/animation.html#state-driven-animations) — style bindings for state-driven transitions, including color and dimension changes.
- [Vue: Transition Performance Considerations](https://vuejs.org/guide/built-ins/transition.html#performance-considerations) — layout and animation behavior for `transform` and `opacity` compared with properties such as `height` and `margin`.
- [MDN: `will-change`](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) — rendering hints, resource costs, and guidance to use the property only for existing performance problems.
- [MDN: Scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations) — browser-native scroll timeline techniques and compatibility information.
