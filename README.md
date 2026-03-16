# charPicker v3

jQuery-плагин для вставки спецсимволов и эмодзи в поля `input` и `textarea`.

**Ядро (`charPicker.core.js`) не зависит от jQuery** и загружается лениво — только при первом открытии диалога. Страница подключает только лёгкий адаптер (~3 КБ).

---

## Файлы

| Файл | Когда подключать | Размер |
|---|---|---|
| `jquery.charPicker.v3.js` | С загрузкой страницы | ~3 КБ |
| `charPicker.core.js` | Автоматически при первом open() | ~40 КБ |
| `charPicker.core.css` | Автоматически при первом open() | ~5 КБ |
| `charpicker-data.min.json` | По запросу через `dataUrl` | ~170 КБ |

---

## Быстрый старт

```html
<!-- Подключение -->
<script src="/js/jquery.loadBundle.js"></script>
<script src="/js/jquery.charPicker.v3.js"></script>

<!-- Инициализация -->
<script>
$('.my-field').charPicker({
  dataUrl: '/js/charpicker-data.min.json'
});
</script>
```

Пути к `charPicker.core.js` и `charPicker.core.css` вычисляются автоматически — они должны лежать в той же папке что и `jquery.charPicker.v3.js`.

---

## Режимы trigger

### `trigger: 'auto'` — кнопка создаётся автоматически

```js
$('#my-field').charPicker({ dataUrl: '/js/data.json' });
```

Плагин оборачивает поле в `<span class="jcp">` и добавляет кнопку-триггер справа.

### `trigger: false` — только внешний вызов через API

```js
$('#my-field').charPicker({ trigger: false, dataUrl: '/js/data.json' });

// Открытие с позиционированием у кнопки:
$('#my-btn').on('click', function() {
  $('#my-field').charPicker('open', this);
});
```

### `trigger: Element | jQuery` — готовая кнопка

```js
$('#my-field').charPicker({
  trigger: $('#toolbar .emoji-btn'),  // плагин вешает click сам
  dataUrl: '/js/data.json'
});
```

Попап позиционируется относительно переданной кнопки.

### `trigger: function(openFn)` — колбэк

```js
$('#my-field').charPicker({
  trigger: function(open) {
    // this = DOM-элемент поля
    var $btn = $('<button>☺</button>');
    $btn.on('click', function(e) { open(e.currentTarget); });
    $(this).closest('.form').find('.toolbar').append($btn);
  },
  dataUrl: '/js/data.json'
});
```

---

## Все опции

| Опция | Тип | По умолч. | Описание |
|---|---|---|---|
| `dataUrl` | string | `null` | URL JSON-файла с данными. При ошибке — fallback на встроенные данные |
| `data` | Array | `null` | Готовый массив групп. Приоритет выше `dataUrl` |
| `panels` | Array | `null` | Фильтр групп по id: `['smileys', 'math']`. `null` — все группы |
| `trigger` | см. выше | `'auto'` | Режим создания кнопки-триггера |
| `anchor` | Element | `null` | Статический якорь позиционирования |
| `position` | string | `'auto'` | Вертикаль попапа: `'auto'` \| `'top'` \| `'bottom'` |
| `align` | string | `'field'` | Горизонталь попапа: `'field'` \| `'anchor'` \| `'cursor'` |
| `closeOnPick` | boolean | `false` | Закрывать диалог после выбора символа |
| `recentMax` | number | `32` | Макс. символов в разделе «Недавние» |
| `onOpen` | Function | `null` | Вызывается при открытии. `this` = DOM-элемент поля |
| `onClose` | Function | `null` | Вызывается при закрытии. `this` = DOM-элемент поля |
| `onSelect` | Function(char, name) | `null` | Вызывается при выборе символа |
| `onDataError` | Function(Error) | `null` | Вызывается при ошибке загрузки `dataUrl` |
| `coreJs` | string | авто | URL `charPicker.core.js` |
| `coreCss` | string | авто | URL `charPicker.core.css` |
| `debug` | boolean | `false` | Подробный лог в консоль |

### Опция `align`

| Значение | Поведение |
|---|---|
| `'field'` | Левый край попапа совпадает с левым краем поля ввода |
| `'anchor'` | Левый край попапа совпадает с левым краем кнопки/якоря |
| `'cursor'` | Попап открывается у точки клика (для MouseEvent/TouchEvent) |

---

## API

```js
// Открыть диалог
$('#my-field').charPicker('open');

// Открыть с позиционированием у элемента
$('#my-field').charPicker('open', document.getElementById('my-btn'));

// Закрыть
$('#my-field').charPicker('close');

// Переключить (open/close)
$('#my-field').charPicker('toggle');

// Удалить плагин
$('#my-field').charPicker('destroy');
```

### Прямой вызов CharPicker (без jQuery)

```js
var cp = new CharPicker(inputElement, {
  dataUrl: '/js/data.json',
  onSelect: function(char, name) { console.log(char, name); }
});

cp.open(anchorElement);  // Element | jQuery | MouseEvent | TouchEvent | null
cp.close();
cp.toggle(anchor);
cp.destroy();
```

---

## Формат данных

```json
{
  "version": "2.1.0",
  "groups": [
    {
      "id": "smileys",
      "label": "Смайлы",
      "labelEn": "Smileys",
      "icon": "😀",
      "subgroups": [
        {
          "label": "Счастье",
          "labelEn": "Happy",
          "chars": [
            { "c": "😀", "n": "улыбка grinning face" },
            { "c": "😂", "n": "слёзы радости tears of joy" }
          ]
        }
      ]
    },
    {
      "id": "math",
      "label": "Математика",
      "labelEn": "Math",
      "icon": "∑",
      "chars": [
        { "c": "±", "n": "плюс минус plus minus" }
      ]
    }
  ]
}
```

Группы могут иметь либо `subgroups`, либо прямой массив `chars` — не оба сразу.

---

## Поиск

Поиск работает по полю `n` (название символа). Поддерживается:

- **Прямой поиск** — по названию на любом языке: `"сердце"`, `"heart"`
- **Поиск символом** — `"♥"` найдёт символ напрямую
- **Конвертация раскладки EN↔RU** — `"cbvdjk"` найдёт `"символ"` (ввели латиницей в русской раскладке)
- **Нормализация ё→е** — `"ёлка"` и `"елка"` дают одинаковый результат

---

## Клавиатура

| Клавиша | Действие |
|---|---|
| `Tab` | Перемещение по элементам диалога |
| `↓` в поле поиска | Переход на первый символ в гриде |
| `← ↑ → ↓` в гриде | Навигация по символам с учётом числа колонок |
| `↑` / `←` с первого символа | Возврат на поле поиска |
| `Enter` / `Space` | Выбор символа |
| `Escape` | Закрыть диалог |

---

## История «Недавних»

Выбранные символы сохраняются в `localStorage['jcp_recent']`. История общая для всех экземпляров на странице (один origin). В приватном режиме или при ограничениях iframe работает только в памяти — без ошибок.

Ограничить размер истории:
```js
$('#my-field').charPicker({ recentMax: 16 });
```

---

## BEM-классы

| Класс | Описание |
|---|---|
| `.jcp` | Обёртка вокруг поля (только `trigger:'auto'`) |
| `.jcp__trigger` | Кнопка открытия (только `trigger:'auto'`) |
| `.jcp__trigger--active` | Попап открыт |
| `.jcp__trigger--loading` | Идёт загрузка ядра |
| `.jcp__popup` | Всплывающий диалог |
| `.jcp__popup--pos-bottom` | Попап открывается вниз |
| `.jcp__popup--pos-top` | Попап открывается вверх |
| `.jcp__popup--pos-right` | Попап сдвинут к правому краю |
| `.jcp__search-input` | Поле поиска |
| `.jcp__tabs` | Панель вкладок |
| `.jcp__tab` | Одна вкладка |
| `.jcp__tab--active` | Активная вкладка |
| `.jcp__body` | Прокручиваемая область с символами |
| `.jcp__char` | Один символ |
| `.jcp__char--sym` | Не-эмодзи символ (serif-шрифт) |
| `.jcp__tooltip` | Тултип с именем символа |
| `.jcp__tooltip--visible` | Тултип виден |

---

## SCSS-переменные

Переопределите до `@import`:

```scss
$cp-popup-width      : 320px;
$cp-popup-max-height : 420px;
$cp-char-size        : 34px;
$cp-trigger-size     : 2.2em;
$cp-color-accent     : #5b9bd5;
$cp-color-bg         : #fff;
$cp-z-popup          : 9999;
@import 'charPicker.core';
```

---

## Безопасность

- **XSS исключён** — символы вставляются через `document.createTextNode()`, `el.value` — никакого `innerHTML` с пользовательскими данными
- **Нет eval** — нет `eval()`, `new Function()` или динамической компиляции
- **Изоляция обработчиков** — `destroy()` снимает только свои обработчики событий
- **Встроенные данные в Base64** — символы вроде `'`, `"`, `«` не конфликтуют с JS-строками

---

## Требования

- jQuery ≥ 1.9
- `jquery.loadBundle.js` — для ленивой загрузки (опционально, есть fallback через `<script>`)
- ES5-совместимый браузер + Promise (IE11 с polyfill)

---

## Подключение без jquery.loadBundle

Если `$.loadBundle` недоступен, плагин использует встроенный fallback через динамические теги `<link>` и `<script>`:

```js
// Всё работает без jquery.loadBundle.js,
// но ядро загрузится чуть позже из-за отсутствия prefetch CSS
$('.my-field').charPicker({ dataUrl: '/js/data.json' });
```

---

## Локальная разработка (file://)

При открытии через `file://` XHR-запросы заблокированы браузером. Плагин автоматически переключается на встроенный набор данных (~645 символов, 5 групп). Для тестирования с полным набором откройте страницу через локальный веб-сервер (Live Server, `python -m http.server`, etc.).

---

## Changelog

### v3.1.0
- `charPicker.core.js` — архитектурно отделён от jQuery: не создаёт кнопок и wrap'ов, управляет только попапом
- `open(anchor)` — принимает Element, jQuery, MouseEvent, TouchEvent или plain-rect
- `position:fixed` для попапа — корректное позиционирование при прокрученной странице
- Опция `align` — горизонтальное выравнивание: `field` | `anchor` | `cursor`
- Опция `closeOnPick` — управление закрытием после выбора
- Клавиатурная навигация по гриду символов (стрелки, Enter/Space)
- Автоопределение пути к файлам ядра по расположению плагина
- Fallback на встроенные данные при ошибке `dataUrl` (в т.ч. `file://`)
- Защита от ложного закрытия при скролле после вставки символа
- Тултип `display:none` когда не виден — не перекрывает страницу
- Опция `debug:true` — подробный лог событий в консоль

### v3.0.0
- Разделение на `charPicker.core.js` + `jquery.charPicker.v3.js` (Stub-паттерн)
- Ленивая загрузка ядра при первом `open()`
- История «Недавних» сохраняется в `localStorage`
- Поиск с конвертацией раскладки EN↔RU и нормализацией ё→е

### v2.1.1
- Встроенные данные в Base64 (без AJAX)
- Drag-scroll вкладок
