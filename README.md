# Interactive Abacus.js

A high-performance, touch-optimized abacus component. Perfect for GoHighLevel, Moodle, or custom educational sites.

## 🚀 The "Easy" Way (Teachers)

Just add the script and apply the class to your `<div>` or `<canvas>`.

```html
<!-- 1. Include the Library -->
<script src="https://your-cdn.com/abacus.min.js"></script>

<!-- 2. Add an element with the 'abacus-js' class -->
<div class="abacus-js" 
     data-style="SOROBAN" 
     data-decimals="2" 
     style="height: 500px; width: 100%;">
</div>
```

## 🛠 Configuration Attributes

| Attribute | Description | Options |
|-----------|-------------|---------|
| `data-style` | The abacus layout | `SOROBAN`, `SUANPAN`, `SCHOOL` |
| `data-decimals` | Decimal places | `0`, `1`, `2`, `3`, `4` |
| `data-ui` | Show header/total | `true` (default), `false` |

## 💡 Developer API

For manual control:

```javascript
const myAbacus = InteractiveAbacus.create('#my-element', {
  style: 'SUANPAN',
  decimals: 0
});

// Listen for total changes
document.querySelector('#my-element').addEventListener('abacus:change', (e) => {
  console.log('Current Total:', e.detail.total);
});
```

---
*Created for Math Educators everywhere.*
