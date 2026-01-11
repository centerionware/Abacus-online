# 🧮 Abacus.js Documentation

A high-performance, touch-optimized interactive abacus component. Designed for student-level teachers to embed instantly into any website or LMS (like GoHighLevel, Moodle, or WordPress).

---

## 🚀 Quick Start (For Teachers)

Simply include the script in your page header or footer:

```html
<script src="https://your-cdn-path/abacus.min.js"></script>
```

Then, add an element with one of our **magic classes**.

### 1. Full Interactive App (Recommended)
Using a `div` creates a complete app with a header, live total display, style switcher, and reset button.

```html
<!-- A Japanese Soroban with the full dashboard -->
<div class="abacus-soroban" style="height: 600px; width: 100%;"></div>
```

### 2. Minimal Bead-Only Mode
Using a `canvas` tag (or setting `data-ui="false"`) renders **only** the beads. This is perfect for custom math worksheets where you don't want the student to see the "cheat" total.

```html
<!-- Just the beads, no total display or buttons -->
<canvas class="abacus-school" style="height: 400px; width: 600px;"></canvas>
```

---

## ⚙️ Configuration (Data Attributes)

You can customize the abacus behavior by adding `data-` attributes to your tags.

| Attribute | Effect | Values |
| :--- | :--- | :--- |
| `data-decimals` | Sets the unit rod position | `0`, `1`, `2`, `3`, `4` |
| `data-style` | Changes the layout | `SOROBAN`, `SUANPAN`, `SCHOOL` |
| `data-ui` | Force show/hide UI | `true` (Full App), `false` (Beads Only) |

### Example: Decimal Point Positioning
To set an abacus for currency (2 decimal places), place the decimal marker on the second rod from the right:

```html
<div class="abacus-soroban" data-decimals="2" style="height: 500px;"></div>
```

### Example: Customizing Style via Attributes
You can use the generic `abacus-js` class and specify style via data:

```html
<div class="abacus-js" data-style="SUANPAN" style="height: 500px;"></div>
```

---

## 🎨 Supported Styles

*   **`abacus-soroban` (Japanese)**: 1 upper bead (value 5), 4 lower beads (value 1). Standard modern learning tool.
*   **`abacus-suanpan` (Chinese)**: 2 upper beads (value 5), 5 lower beads (value 1). Supports traditional base-16 or decimal.
*   **`abacus-school` (Rekenrek)**: 10 beads per row, horizontal. Excellent for early counting and base-5 visualization.

---

## 🛠 Advanced (For Developers)

### Programmatic Creation
If you need to create an abacus dynamically via JavaScript:

```javascript
const myAbacus = InteractiveAbacus.create('#my-container', {
  style: 'SOROBAN',
  decimals: 2,
  showUI: true
});
```

### Listening for Changes
The component dispatches a standard JavaScript event whenever a bead is moved. You can use this to build auto-grading math quizzes:

```javascript
const abacusElement = document.querySelector('.abacus-soroban');

abacusElement.addEventListener('abacus:change', (event) => {
  const currentTotal = event.detail.total;
  console.log("Student set the value to:", currentTotal);
  
  if (currentTotal === 12.50) {
    alert("Correct answer!");
  }
});
```

---
*Built with high-performance HTML5 Canvas. Smooth on iPad, Android, and Desktop.*