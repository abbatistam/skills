# Tailwind CSS Dynamic Class Generation

## Rule

Do not construct Tailwind CSS class names from partial strings. Tailwind scans source text for complete candidates; an interpolated class that is absent as a complete string will not have a generated utility rule.

## Why This Matters

- Tailwind uses static analysis at build time to determine which CSS classes to include
- Dynamically constructed class names (e.g., `bg-${color}-500`) are invisible to Tailwind's scanner
- Missing candidates are not generated into the stylesheet, so the class has no Tailwind utility rule at runtime

## Bad Code

```vue
<script setup>
const props = defineProps({
  color: String, // 'red', 'blue', 'green'
  size: String   // 'sm', 'md', 'lg'
})
</script>

<template>
  <!-- WRONG: Tailwind cannot detect these classes -->
  <div :class="`bg-${color}-500 text-${size}`">
    Content
  </div>

  <!-- WRONG: String concatenation -->
  <div :class="'p-' + padding">
    Content
  </div>

  <!-- WRONG: Template literal in array -->
  <div :class="[`gap-x-${spacing}`]">
    Content
  </div>
</template>
```

## Good Code

```vue
<script setup>
const props = defineProps({
  color: String,
  size: String
})

// Use a mapping object with complete class names
const colorClasses = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500'
}

const sizeClasses = {
  sm: 'text-sm p-2',
  md: 'text-base p-4',
  lg: 'text-lg p-6'
}
</script>

<template>
  <!-- CORRECT: Full class names that Tailwind can detect -->
  <div :class="[colorClasses[color], sizeClasses[size]]">
    Content
  </div>
</template>
```

## Using Conditional Objects

```vue
<script setup>
const props = defineProps({
  variant: String // 'primary', 'secondary', 'danger'
})
</script>

<template>
  <!-- CORRECT: All class names are complete strings -->
  <button :class="{
    'bg-blue-500 hover:bg-blue-600': variant === 'primary',
    'bg-gray-500 hover:bg-gray-600': variant === 'secondary',
    'bg-red-500 hover:bg-red-600': variant === 'danger'
  }">
    Click me
  </button>
</template>
```

## Explicitly Include Classes Not Present in Scanned Sources

Avoid this when a static mapping is possible. If a finite set of classes must be generated even though no scanned source contains them, use the mechanism matching the project's Tailwind version.

Tailwind CSS v4:

```css
@import "tailwindcss";
@source inline("bg-red-500 bg-blue-500 bg-green-500");
```

Tailwind CSS v3:

```javascript
// tailwind.config.js
module.exports = {
  safelist: [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    // Or use patterns (use sparingly - increases bundle size)
    {
      pattern: /bg-(red|blue|green)-(100|500|900)/
    }
  ]
}
```

The v3 `safelist` option is not the v4 API; v4 uses `@source inline()`.

## Alternative: CSS Custom Properties

For truly dynamic values, use CSS custom properties:

```vue
<script setup>
const props = defineProps({
  customColor: String // Any hex color
})
</script>

<template>
  <!-- Use CSS variable for truly dynamic values -->
  <div
    class="dynamic-bg"
    :style="{ '--dynamic-color': customColor }"
  >
    Content
  </div>
</template>

<style>
.dynamic-bg {
  background-color: var(--dynamic-color);
}
</style>
```

## References

- [Tailwind CSS v4: Detecting Classes in Source Files](https://tailwindcss.com/docs/detecting-classes-in-source-files) — static detection, complete class names, `@source`, and `@source inline()`.
- [Tailwind CSS v3: Content Configuration](https://v3.tailwindcss.com/docs/content-configuration#safelisting-classes) — v3 source scanning and `safelist` configuration.
