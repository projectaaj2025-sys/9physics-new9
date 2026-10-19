# Промпт для переноса мини-игр из 9 в 8 класс

> Цель: повторить в `8physic-new` те же мини-игры, что добавлены в `9physics-new9` (слайдеры + сборка цепи), адаптировать под темы 8 класса (теплота и электричество).

## 1. Что копировать из 9 класса

Из `physics-quest-9-grade.html` (eb624d2+) скопируй 3 блока:

**A) CSS** — перед `</style>` вставь:
```css
/* ===== Мини-игры лаборатории ===== */
.lab-overlay ... (весь блок .lab-overlay → .lab-hint из 9 класса)
```

**B) HTML** — перед `<div id="shop-modal"` вставь:
```html
<div id="lab-overlay" class="lab-overlay"> ... весь lab-panel ... </div>
```
И в HUD добавь кнопку:
```html
<button id="btn-lab" class="btn-pause" ...>🔬 Лаб</button>
```
перед `<button id="btn-pause"`.

**C) JS** — перед `const Mechanics = {` вставь весь `const LabGames = { ... };`

> Весь JS уже без зависимостей, работает на `localStorage` и `showNotification`.

## 2. Адаптировать LEVELS_CONFIG 8 класса

В 8 классе темы:
- `§1-§17` — теплотa: `теплопроводность, Q=c·m·ΔT, Q=λm, Q=Lm, КПД`
- `§18-§31` — электричество: `Кулон, Ома, сопротивления, Джоуля-Ленца`
- Лабы `№1-11` (смешивание воды, плавление льда, цепь и т.д.)

Для каждой лабы добавь в `LabGames.configs` запись по ID уровня:

### Примеры для 8 класса (скопируй как есть, поменяй ID под свои уровни):

**Лаб 1 — Смешивание воды (Q):**
```js
45: { type:"slider", title:"🔬 Лаб 1: Смешивание", desc:"Q = c·m·ΔT, c=4200. Смешали 0.3кг горячей 80°C и 0.5кг холодной 20°C. Подбери ΔT чтобы Q≈50400 Дж", sliders:[{id:"m", label:"Масса m, кг", min:0.2, max:0.8, step:0.1, val:0.3}, {id:"dT", label:"ΔT, °C", min:10, max:60, step:5, val:20}], formula:v=>4200*v.m*v.dT, target:50400, tol:3000, unit:"Дж", formulaStr:"Q = c·m·ΔT" },
```

**Лаб 2 — Удельная теплота плавления:**
```js
46: { type:"slider", title:"🔬 Лаб 2: Плавление льда", desc:"Q=λ·m, λ=340000 Дж/кг. Подбери m чтобы Q≈68000 Дж", sliders:[{id:"m", label:"Масса льда m, кг", min:0.1, max:0.4, step:0.05, val:0.2}], formula:v=>340000*v.m, target:68000, tol:5000, unit:"Дж", formulaStr:"Q = λ·m" },
```

**Лаб 3-6 — Электричество (цепь):**
```js
// Для последовательного соединения
50: { type:"circuit", title:"⚡ Собери цепь: последовательно", desc:"Собери цепь: батарея → ключ → два резистора последовательно → лампа. Включи все.", },
// Для параллельного
51: { type:"circuit", title:"⚡ Собери цепь: параллельно", desc:"Собери параллельную цепь: две ветви. Включи все элементы." },
```

**Для измерения (7кл-аналог, можно оставить в 8 как демо):**
```js
99: { type:"slider", title:"⚖️ Плотность", desc:"ρ=m/V, алюминий 2.7 г/см³", sliders:[{id:"m", label:"m, г", min:10, max:120, step:5, val:54}, {id:"V", label:"V, см³", min:10, max:50, step:2, val:20}], formula:v=>v.m/v.V, target:2.7, tol:0.15, unit:"г/см³", formulaStr:"ρ=m/V" },
```

## 3. Подключить запуск

В `Game.startLevel` после:
```js
if(typeof Mechanics!=="undefined") Mechanics.setup(this.levelConfig, this);
```
добавь:
```js
if(typeof LabGames!=="undefined") LabGames.reset();
if(typeof LabGames!=="undefined" && LabGames.configs[this.currentLevel]) setTimeout(()=>LabGames.tryShow(this.currentLevel, this), 800);
```

И в `Mechanics.setup` добавь показ кнопки:
```js
const labBtn=document.getElementById("btn-lab");
if(labBtn) labBtn.style.display=(levelConfig.mechanic==="lab"||LabGames.configs[levelConfig.id])?"":"none";
```

Слушатели уже внутри `LabGames` блока (`lab-check`/`lab-close`/`btn-lab`).

## 4. Проверка

1. `node --check` на самый большой `<script>` — должен быть `0`.
2. Открой уровень 45 — через 0.8с должен всплыть `lab-overlay`. Слайдеры меняют `lab-result` live. `Проверить` даёт `+120 очков` при `|res-target|<=tol`.
3. Цепь: клик по 4 ячейкам → `Цепь собрана!` → бонус.
4. На телефоне: слайдеры крупные, `font-size 16px`, панель скроллится.

## 5. Опционально Supabase

В 9 классе уже есть панель в учительской (`#supa-url/#supa-key`, `localStorage orbita9_supa`). Скопируй тот же `<div class="teacher-help">` с супой после `quick-assign-panel` — он работает офлайн (если пусто — только PQ9R), если заполнен — дублирует `Storage.addPlaythrough` в `supabase.from('results').insert`.

---

> Готово! После этого 7/8/9 будут единой серией по механике: **7кл — измерь/взвесь, 8кл — нагрей/собери цепь, 9кл — рассчитай ускорение/волну**. При объединении в один проект просто вынеси `LabGames.configs` в `content/7.js`, `content/8.js`, `content/9.js`.
