# Interactive Abacus.js

A high-performance, touch-optimized abacus for educators. Easily embed Japanese, Chinese, or School-style abacuses into your web pages.

## 🚀 Easy Setup (For Teachers)

Simply include the script, then add one of these classes to your elements.

### 1. Include the Library
```html
<script src="https://your-cdn.com/abacus.min.js"></script>
```

### 2. Use "Style" Classes
No JavaScript required! Just add the class for the style you want:

```html
<!-- A Japanese Soroban with full UI (header/total) -->
<div class="abacus-soroban" style="height: 500px; width: 100%;"></div>

<!-- A Chinese Suanpan -->
<div class="abacus-suanpan" style="height: 500px; width: 100%;"></div>

<!-- A School / IKEA style abacus -->
<div class="abacus-school" style="height: 400px; width: 100%;"></div>
```

## 🎨 Minimal Mode (Canvas only)
If you just want the abacus beads without the header and "Total" display, apply the class directly to a `<canvas>` element:

```html
<canvas class="abacus-soroban" style="height: 400px; width: 600px;"></canvas>
```

## 🛠 Configuration Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-decimals` | Initial decimal places | `0` |
| `data-ui` | Force show/hide UI shell | `true` (div) / `false` (canvas) |

## 💡 Developer API

```javascript
// Manual init
const myAbacus = InteractiveAbacus.create('#my-id', {
  style: 'SOROBAN',
  decimals: 2,
  showUI: true
});

// Watch for changes
document.querySelector('#my-id').addEventListener('abacus:change', (e) => {
  alert('Student set value to: ' + e.detail.total);
});
```

---
*Created for Math Educators everywhere.*
