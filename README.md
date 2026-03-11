# ☺ jquery.charPicker

> jQuery-плагин для вставки спецсимволов и эмодзи в поля `input` и `textarea`.  
> Эмулирует на десктопных браузерах функциональность эмодзи-клавиатуры мобильных устройств.

[![Version](https://img.shields.io/badge/version-1.2.0-blue)](#)
[![jQuery](https://img.shields.io/badge/jQuery-%E2%89%A51.9-orange)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](#лицензия)
[![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)](#)
[![CSS: BEM](https://img.shields.io/badge/CSS-BEM-blueviolet)](#bem-и-стили)
[![ES5](https://img.shields.io/badge/JS-ES5-yellow)](#поддержка-браузеров)

---

## Содержание

- [Возможности](#возможности)
- [Быстрый старт](#быстрый-старт)
- [Установка](#установка)
- [API](#api)
- [Опции](#опции)
- [Панели символов](#панели-символов)
- [Поиск и умная раскладка](#поиск-и-умная-раскладка)
- [Глобальная история](#глобальная-история-недавние)
- [BEM и стили](#bem-и-стили)
- [Архитектура](#архитектура)
- [Примеры](#примеры)
- [Безопасность](#безопасность)
- [Поддержка браузеров](#поддержка-браузеров)
- [Структура файлов](#структура-файлов)
- [Лицензия](#лицензия)

---

## Возможности

| | Возможность | Описание |
|---|---|---|
| 🔍 | **Поиск** | По русскому и латинскому имени символа, debounce 200 мс |
| ⌨️ | **Умная раскладка** | Находит символы даже при вводе в неправильной раскладке EN↔RU |
| 🕐 | **Недавние** | Глобальная история, единая для всех полей на странице |
| 📁 | **10 панелей** | ~372 символа: эмодзи, типографика, математика, валюты, диакритика |
| 🎛 | **Фильтр панелей** | Включение/отключение групп через опцию `panels` |
| 📍 | **Умное позиционирование** | Попап открывается вверх/вниз и прижимается к краям экрана |
| 🖱 | **Тултипы** | Всплывающее название символа при наведении |
| ♿ | **Доступность** | `role="dialog"`, `role="tab"`, `aria-label`, `aria-expanded`, Tab / Enter / Escape |
| 🔒 | **Безопасность** | Нет `eval()`, нет `innerHTML` с данными — XSS исключён |
| 🎨 | **BEM CSS** | Именование по BEM, блок `.jcp`, без конфликтов с вашими стилями |
| 🪶 | **Без зависимостей** | Только jQuery ≥ 1.9, данные встроены в JS-файл |

---

## Быстрый старт

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="jquery.charPicker.css">
</head>
<body>
  <input type="text" id="field" placeholder="Введите текст…">

  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="jquery.charPicker.js"></script>
  <script>
    $('#field').charPicker();
  </script>
</body>
</html>
```

После инициализации справа от поля появится кнопка ☺. По клику открывается попап с поиском, вкладками групп и сеткой символов. Клик по символу вставляет его в позицию курсора поля.

---

## Установка

### Вручную

Скачайте два файла и подключите в проект:

```
jquery.charPicker.js    — плагин
jquery.charPicker.css   — стили
```

```html
<link rel="stylesheet" href="jquery.charPicker.css">
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="jquery.charPicker.js"></script>
```

Файл CSS подключается в `<head>`, JS-файл плагина — **после** jQuery.

---

## API

### Инициализация

```javascript
$(selector).charPicker();            // настройки по умолчанию
$(selector).charPicker(options);     // с объектом опций
```

Плагин можно применить к нескольким полям сразу — каждый экземпляр независим, история «Недавних» общая:

```javascript
$('input[type="text"], textarea').charPicker();
```

Повторный вызов `.charPicker()` на уже инициализированном элементе **игнорируется** — двойная инициализация невозможна.

### Методы

Методы вызываются строкой первым аргументом:

```javascript
$(selector).charPicker('open');      // открыть попап программно
$(selector).charPicker('close');     // закрыть попап программно
$(selector).charPicker('destroy');   // полностью удалить плагин
```

**`open`** — открывает попап и фокусирует строку поиска. Позиционирование пересчитывается при каждом открытии. Если уже открыт — вызов игнорируется.

**`close`** — закрывает попап, снимает тултип, обновляет `aria-expanded`. Если уже закрыт — игнорируется.

**`destroy`** — полностью демонтирует плагин: снимает все обработчики (только свои), удаляет из DOM обёртку `.jcp`, попап `.jcp__popup` и тултип `.jcp__tooltip`, возвращает `input`/`textarea` в исходное место в DOM, удаляет данные экземпляра из jQuery `.data()`. После `destroy` элемент можно заново инициализировать.

### Прямой доступ к экземпляру

```javascript
var inst = $('#field').data('cp-instance');
if (inst) inst.close();
```

---

## Опции

```javascript
$(selector).charPicker({
  recentMax : 32,       // макс. символов в «Недавних»
  position  : 'auto',  // 'auto' | 'top' | 'bottom'
  panels    : null,    // null = все; ['smileys','math'] = только эти; [] = ни одной
  onOpen    : null,    // function(), this = el
  onClose   : null,    // function(), this = el
  onSelect  : null     // function(char, name), this = el
});
```

### Таблица всех опций

| Опция | Тип | По умолчанию | Описание |
|---|---|---|---|
| `recentMax` | `number` | `32` | Максимум символов в «Недавних». При превышении старые вытесняются |
| `position` | `string` | `'auto'` | Вертикальное расположение попапа: `'auto'` `'top'` `'bottom'` |
| `panels` | `Array\|null` | `null` | Список id групп. `null` — все. `[]` — ни одной |
| `onOpen` | `function` | `null` | При открытии попапа. `this` — целевой DOM-элемент |
| `onClose` | `function` | `null` | При закрытии попапа. `this` — целевой DOM-элемент |
| `onSelect` | `function` | `null` | При выборе символа: `function(char, name)`. `this` — DOM-элемент |

### position

| Значение | Поведение |
|---|---|
| `'auto'` | Вниз если достаточно места, вверх если снизу тесно |
| `'bottom'` | Всегда под полем |
| `'top'` | Всегда над полем |

При любом значении попап дополнительно прижимается к правому краю окна, если не умещается слева.

### onSelect

```javascript
$('#field').charPicker({
  onSelect: function(char, name) {
    // char — вставленный символ,  например '😀'
    // name — его составное имя,   например 'grinning smile улыбка'
    // this  — DOM-элемент input/textarea
    // this.value уже содержит обновлённое значение
    console.log('Вставлен:', char, '—', name);
  }
});
```

---

## Панели символов

### Справочник панелей

| id | Иконка | Содержимое | Символов |
|---|---|---|---|
| `smileys` | 😀 | Смайлы, эмоции, выражения лица | 41 |
| `gestures` | 👋 | Жесты рук | 29 |
| `nature` | 🌿 | Животные, растения, природа, погода | 44 |
| `food` | 🍕 | Еда, напитки, фрукты, овощи | 34 |
| `symbols_emo` | 💯 | Сердца, звёзды, знаки, цветные круги | 35 |
| `arrows` | → | Стрелки всех видов, указатели | 30 |
| `math` | ∑ | Математика, греческий алфавит, дроби | 42 |
| `typography` | « | Кавычки, тире, типографические знаки | 33 |
| `currency` | € | Знаки валют мира | 25 |
| `diacritics` | À | Диакритические символы (À, é, ñ, ü, š…) | 59 |

**Итого:** ~372 символа в 10 группах.

> Панель `recent` («Недавние») управляется автоматически — появляется после первого выбора символа. Указывать её в `panels` не нужно.

### Примеры фильтрации

```javascript
$('#f').charPicker({ panels: null });                                        // все
$('#f').charPicker({ panels: ['smileys','gestures','nature','food','symbols_emo'] }); // только эмодзи
$('#f').charPicker({ panels: ['arrows','math','typography','currency','diacritics'] }); // без эмодзи
$('#price').charPicker({ panels: ['currency'] });                            // одна группа
$('#editor').charPicker({ panels: ['typography', 'arrows'] });               // типографика
$('#f').charPicker({ panels: [] });                                          // ни одной
```

---

## Поиск и умная раскладка

### Имена символов

Каждый символ имеет составное двуязычное имя — поиск работает по обоим языкам:

```
😀  →  'grinning smile улыбка'
→   →  'вправо right arrow'
©   →  'авторское право copyright'
```

Поиск — подстрока в имени без учёта регистра, debounce 200 мс.

### Алгоритм коррекции раскладки

Пользователь часто набирает запрос в неправильной раскладке. Плагин строит до трёх вариантов каждого запроса:

```
[0]  оригинал      — как ввёл пользователь
[1]  lat → cyr     — если набирал русское в EN-раскладке
[2]  cyr → lat     — если набирал английское в RU-раскладке
```

| Хотел найти | Набрал (раскладка) | Нашёл |
|---|---|---|
| `сердце` | `cthlwt` (EN) | ❤️ и похожие |
| `arrow` | `фккщц` (RU) | → ← ↑ ↓ и др. |
| `улыбка` | `ekmirrf` (EN) | 😀 😊 😄 |

Когда сработала конвертация — появляется подсказка «ℹ️ Раскладка: «сердце»».

Таблицы ЙЦУКЕН←→QWERTY построены по ГОСТ Р 52659–2006. Обратная таблица строится автоматической инверсией прямой — рассинхронизация невозможна.

---

## Глобальная история («Недавние»)

История **единая для всех полей** на странице. Выбор в поле A появляется в «Недавних» поля B.

```
input#title    ──┐
textarea#body  ──┼──→  _globalRecent: [ '😀', '→', '©', … ]
input#comment  ──┘
```

Новый символ: дубликат удаляется → символ в начало → хвост обрезается по `recentMax`.

История in-memory — сбрасывается при перезагрузке. Для персистентности:

```javascript
$('#field').charPicker({
  onSelect: function(char, name) {
    var saved = JSON.parse(localStorage.getItem('jcp-recent') || '[]');
    saved = [{ c: char, n: name }].concat(
      saved.filter(function(x) { return x.c !== char; })
    ).slice(0, 32);
    localStorage.setItem('jcp-recent', JSON.stringify(saved));
  }
});
```

---

## BEM и стили

### Методология

Стили плагина написаны по **BEM**. Блок `.jcp` — пространство имён плагина (jQuery + charPicker), специфичный и не конфликтующий:

```
Блок:        .jcp
Элемент:     .jcp__trigger   .jcp__popup   .jcp__tab   .jcp__char   …
Модификатор: .jcp__trigger--active   .jcp__tab--active   .jcp__char--sym   …
```

### Полная карта классов

| Класс | Тип BEM | Назначение |
|---|---|---|
| `.jcp` | Блок | Корневая обёртка поля + кнопки |
| `.jcp__trigger` | Элемент | Кнопка открытия попапа |
| `.jcp__trigger--active` | Модификатор | Попап открыт |
| `.jcp__popup` | Элемент | Всплывающий пикер |
| `.jcp__popup--pos-bottom` | Модификатор | Попап под полем |
| `.jcp__popup--pos-top` | Модификатор | Попап над полем |
| `.jcp__popup--pos-right` | Модификатор | Выравнивание по правому краю экрана |
| `.jcp__search` | Элемент | Панель поиска (обёртка) |
| `.jcp__search-input` | Элемент | Поле ввода запроса |
| `.jcp__tabs` | Элемент | Строка вкладок групп |
| `.jcp__tab` | Элемент | Одна вкладка-иконка |
| `.jcp__tab--active` | Модификатор | Активная вкладка |
| `.jcp__body` | Элемент | Прокручиваемая область символов |
| `.jcp__section-title` | Элемент | Заголовок секции |
| `.jcp__grid` | Элемент | Flex-сетка символов |
| `.jcp__char` | Элемент | Одна ячейка символа |
| `.jcp__char--sym` | Модификатор | Не-эмодзи символ (serif-шрифт) |
| `.jcp__tooltip` | Элемент | Тултип с именем символа (fixed) |
| `.jcp__tooltip--visible` | Модификатор | Тултип показан |
| `.jcp__empty` | Элемент | Заглушка «ничего не найдено» |
| `.jcp__layout-hint` | Элемент | Подсказка о конвертации раскладки |

### Переменные SCSS

```scss
// Размеры
$cp-popup-width        : 320px   !default;
$cp-popup-body-height  : 240px   !default;
$cp-char-size          : 34px    !default;
$cp-char-font-size     : 20px    !default;
$cp-char-font-size-sym : 16px    !default;
$cp-trigger-size       : 2.2em   !default;
$cp-border-radius      : 10px    !default;
$cp-border-radius-sm   : 6px     !default;
$cp-z-popup            : 9999    !default;
$cp-z-tooltip          : 99999   !default;

// Цвета
$cp-color-bg           : #fff        !default;
$cp-color-bg-panel     : #f8f9fb     !default;
$cp-color-accent       : #5b9bd5     !default;
$cp-color-accent-dark  : #2d6da8     !default;
$cp-color-text         : #333        !default;
$cp-color-border       : #c8cfd8     !default;
$cp-color-tooltip-bg   : #1a2233     !default;
```

### Кастомная тема

```scss
// Тёмная тема
$cp-color-bg        : #1c1c2e;
$cp-color-bg-panel  : #25253a;
$cp-color-text      : #e2e2f0;
$cp-color-border    : #3a3a55;
$cp-color-accent    : #f59e0b;
$cp-color-accent-dark: #d97706;

@import 'jquery.charPicker';
```

### Компиляция

```bash
sass jquery.charPicker.scss jquery.charPicker.css
sass --style=compressed jquery.charPicker.scss jquery.charPicker.min.css
npx sass jquery.charPicker.scss jquery.charPicker.css
```

---

## Архитектура

### Структура JS-файла

```
;(function ($) {
  'use strict';

  ┌── Глобальная история ──────────────────────────────────────────┐
  │   _globalRecent []          массив {c, n} — выбранные символы │
  │   _globalRecentMax          лимит (из опции recentMax)         │
  │   globalAddRecent(item)     добавить/поднять в истории         │
  └────────────────────────────────────────────────────────────────┘

  ┌── Данные символов ─────────────────────────────────────────────┐
  │   GROUPS []                 10 групп + 'recent' (пустой)       │
  │   { id, label, icon, chars: [{ c, n }, …] }                   │
  │   ~372 символа, кавычки и спецсимволы через \uXXXX             │
  └────────────────────────────────────────────────────────────────┘

  ┌── Утилиты ─────────────────────────────────────────────────────┐
  │   insertAtCursor(el, text)  вставка в selectionStart..End      │
  │   debounce(fn, delay)       задержка с clearTimeout            │
  └────────────────────────────────────────────────────────────────┘

  ┌── Модуль умного поиска ────────────────────────────────────────┐
  │   _LAT_TO_CYR {}            QWERTY → ЙЦУКЕН (ГОСТ Р 52659)    │
  │   _CYR_TO_LAT {}            автоинверсия _LAT_TO_CYR (IIFE)   │
  │   _convertLayout(s, map)    посимвольная конвертация строки    │
  │   _queryVariants(q)         → [оригинал, lat→cyr, cyr→lat]    │
  └────────────────────────────────────────────────────────────────┘

  ┌── CharPicker ──────────────────────────────────────────────────┐
  │   constructor(el, options)                                     │
  │   ├── _filterGroups()       фильтр GROUPS по опции panels      │
  │   └── _init()               DOM-сборка, привязка событий       │
  │                                                                │
  │   _uid()                    уникальный namespace событий       │
  │   _buildPopup()             создать и заполнить попап          │
  │   _posTooltip(e)            позиция тултипа по курсору         │
  │   _selectTab(gid)           переключить активную вкладку       │
  │   _renderGroup(gid)         отрисовать группу символов         │
  │   _sectionTitle(text)       создать DOM-заголовок секции       │
  │   _makeGrid(chars)          создать сетку .jcp__char           │
  │   _doSearch(query)          поиск с вариантами раскладки       │
  │   _insertChar(c, n)         вставить символ, обновить историю  │
  │   _ensureRecentTab()        добавить вкладку «Недавние»        │
  │   _positionPopup()          вычислить top/left попапа          │
  │   _toggle()                 open ↔ close                      │
  │                                                                │
  │   open()   close()   destroy()   ← публичные методы           │
  └────────────────────────────────────────────────────────────────┘

  ┌── $.fn.charPicker ─────────────────────────────────────────────┐
  │   Диспетчер: инициализация или вызов метода по строке          │
  │   Хранение: $(el).data('cp-instance') → экземпляр CharPicker  │
  └────────────────────────────────────────────────────────────────┘

}(jQuery));
```

### Изоляция экземпляров

Каждый экземпляр получает уникальный идентификатор:

```javascript
this.__uid = 'cp' + Math.random().toString(36).slice(2, 8); // 'cp4k9m2x'
$(document).on('click.cp.cp4k9m2x', handler);  // привязка
$(document).off('click.cp.cp4k9m2x');          // снятие в destroy
```

`destroy()` удаляет **только свои** обработчики — соседние экземпляры не затрагиваются.

### DOM-структура

```html
<!-- .jcp заменяет исходный input в DOM-потоке -->
<span class="jcp">
  <input type="text" …>
  <button class="jcp__trigger"><svg…></svg></button>
</span>

<!-- Попап и тултип — в <body>, позиционируются абсолютно/fixed -->
<div class="jcp__popup jcp__popup--pos-bottom" role="dialog" aria-modal="true">
  <div class="jcp__search">
    <input class="jcp__search-input" type="search" …>
  </div>
  <div class="jcp__tabs" role="tablist">
    <div class="jcp__tab jcp__tab--active" data-group="smileys">😀</div>
    <div class="jcp__tab" data-group="arrows">→</div>
    …
  </div>
  <div class="jcp__body">
    <div class="jcp__section-title">Результаты: 5</div>
    <div class="jcp__layout-hint">ℹ️ Раскладка: «сердце»</div>
    <div class="jcp__grid">
      <div class="jcp__char" role="button" aria-label="…">😀</div>
      <div class="jcp__char jcp__char--sym" role="button" aria-label="…">©</div>
      …
    </div>
  </div>
</div>
<div class="jcp__tooltip" role="tooltip">grinning smile улыбка</div>
```

---

## Примеры

### Минимальная инициализация

```javascript
$('#comment').charPicker();
$('input[type="text"], textarea').charPicker(); // сразу все поля
```

### Только спецсимволы (без эмодзи)

```javascript
$('#article').charPicker({
  panels: ['typography', 'currency', 'arrows', 'math', 'diacritics']
});
```

### Чат — эмодзи, компактная история

```javascript
$('#chat').charPicker({
  panels   : ['smileys', 'gestures', 'symbols_emo'],
  recentMax: 16
});
```

### Несколько полей с разными наборами

```javascript
$('#title').charPicker({ panels: ['typography'] });
$('#body').charPicker();
$('#price').charPicker({ panels: ['currency', 'math'] });
```

### Открытие из внешней кнопки

```javascript
$('#field').charPicker();
$('#btn').on('click', function () { $('#field').charPicker('open'); });
```

### Позиционирование над полем

```javascript
$('#footer-input').charPicker({ position: 'top' });
```

### Коллбэки

```javascript
$('#editor').charPicker({
  onOpen  : function () { console.log('opened:', this.id); },
  onClose : function () { console.log('closed'); },
  onSelect: function (char, name) {
    console.log('char:', char, 'name:', name);
    analytics.track('char_inserted', { char, name });
  }
});
```

### Уничтожение и переинициализация

```javascript
$('#f').charPicker('destroy');
$('#f').charPicker({ panels: ['math'], position: 'top' });
```

### Закрыть все перед отправкой формы

```javascript
$('form').on('submit', function () {
  $(this).find('input, textarea').each(function () {
    var inst = $(this).data('cp-instance');
    if (inst) inst.close();
  });
});
```

---

## Безопасность

**XSS-защита** — символы вставляются только через `document.createTextNode()`:

```javascript
$ch[0].appendChild(document.createTextNode(item.c));  // в сетке попапа
el.value = el.value.slice(0, start) + text + el.value.slice(end); // в поле
```

Даже строка `<script>alert(1)</script>` будет отображена как текст, не выполнена.

**Нет eval и Function** — все DOM-элементы создаются через jQuery с константными строками.

**Экранирование кавычек** — типографические символы, совпадающие с кавычками JS (`'`, `'`, `"`, `"`, `«`, `»` и др.), заданы через `\uXXXX`:

```javascript
{ c: '\u2018', n: 'левая одинарная кавычка left single quote' }
```

**Изоляция событий** — `destroy()` снимает только свои обработчики через уникальный namespace. Соседние экземпляры и сторонний код не затрагиваются.

**Автозакрытие** — попап закрывается по клику вне него, по `Escape`, при скролле и `resize`.

---

## Поддержка браузеров

| Браузер | Минимальная версия |
|---|---|
| Chrome / Chromium | 60+ |
| Firefox | 55+ |
| Safari | 12+ |
| Edge (Chromium) | 79+ |
| Opera | 47+ |

**jQuery:** ≥ 1.9. Рекомендуется jQuery 3.x.

**Эмодзи:** зависит от ОС. Windows 10+, macOS 10.14+, Android 9+, iOS 13+ поддерживают Unicode 11+.

> **IE11:** JS написан на ES5 и в целом совместим. Исключение — литералы `'\u{1F600}'` (ES2015 Unicode escape). Для IE11 замените на суррогатные пары: `'\uD83D\uDE00'`.

---

## Структура файлов

```
jquery.charPicker/
├── jquery.charPicker.js      # Плагин (ES5, jQuery ≥ 1.9)     ~980 строк
├── jquery.charPicker.scss    # Исходные стили (SCSS + BEM)     ~380 строк
├── jquery.charPicker.css     # Скомпилированные стили           ~295 строк
├── demo.html                 # Интерактивная демо-страница
└── README.md
```

---

## Лицензия

MIT © 2024

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```
