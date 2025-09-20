# Escape Game Web Bundle (Operator Manual)

## Files
- `style.css` – Global styles (layout, timer bar, answer dock).
- `script.js` – Core logic (team param, persistent timer, answer dock).
- `puzzle-1.html` – Sample puzzle page (starts the timer).
- `puzzle-2.html`, `puzzle-3.html` – Sample continuation pages.
- `timeup.html` – Timer expiration landing.
- `nfc-order.html` – NFC order puzzle (sequence-only, no PIN).
- `admin-reset.html` – Local admin reset utility.

## How to Use
1. **Deploy all files** to a static hosting (HTTPS recommended).
2. **Start page**: Use `puzzle-1.html?team=A` to begin a run for Team A.
3. **Timer**: The timer starts on `puzzle-1.html` via meta tags. It persists across pages.
4. **Answer flow**: Set `data-answers` and `data-target` in each page `<body>`.
5. **NFC Order Puzzle**:
   - Program NFC tags with URLs like:
     - `nfc-order.html?team=A&nfc=A&seq=A,B,C,D&next=puzzle-1.html`
     - `nfc-order.html?team=A&nfc=B&seq=A,B,C,D&next=puzzle-1.html`
     - `nfc-order.html?team=A&nfc=C&seq=A,B,C,D&next=puzzle-1.html`
     - `nfc-order.html?team=A&nfc=D&seq=A,B,C,D&next=puzzle-1.html`
   - The page tracks progress in LocalStorage per team, resets on mistake, and navigates to `next` on success.
6. **Admin Reset**:
   - Visit `admin-reset.html` on the same device to clear sequence or all NFC usage keys.

## Customization Tips
- Change timer length on the *first page* with `<meta name="timer-duration-sec" content="1800">`.
- For page-specific expiration routes, add `<meta name="timer-expire-target" content="timeup.html">` to any page.
- Add multiple accepted answers: `data-answers="answer, another, 대안"`.
- Hide the dock on certain pages by omitting `data-answers` (no dock is rendered).

## Notes
- LocalStorage is **per device & browser**. Team progress is isolated by `?team=` and key prefixes.
- Use distinct NFC tag IDs (`nfc=A|B|C|D`) and keep the required sequence in `seq` param.
