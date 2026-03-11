# ☺ jquery.charPicker

> jQuery-плагин для вставки спецсимволов и эмодзи в поля `input` и `textarea`.  
> Эмулирует на десктопных браузерах функциональность эмодзи-клавиатуры мобильных устройств.

[![Version](https://img.shields.io/badge/version-1.1.0-blue)](#)
[![jQuery](https://img.shields.io/badge/jQuery-%E2%89%A51.9-orange)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)
[![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)](#)

---

## Возможности

- 🔍 **Строка поиска** — поиск по русскому и латинскому названию символа
- 🕐 **Недавние** — глобальная история последних выборов, общая для всех полей на странице
- 📁 **Группы** — эмодзи и спецсимволы по тематическим панелям
- 🎛 **Фильтр панелей** — включение/отключение нужных групп через параметр `panels`
- 🖱 **Тултипы** — название символа при наведении
- 📍 **Умное позиционирование** — попап открывается вверх или вниз в зависимости от места на экране
- ♿ **Доступность** — `role="dialog"`, `aria-label`, навигация клавиатурой (Tab / Enter / Escape)
- 🔒 **Безопасность** — нет `eval()`, нет `innerHTML` с пользовательскими данными, XSS невозможен
- 🪶 **Без зависимостей** — только jQuery, все данные встроены в JS-файл

---

## Установка

### Скачать файлы

```
jquery.charPicker.js
jquery.charPicker.css
```

### Подключить

```html
<link rel="stylesheet" href="jquery.charPicker.css">
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="jquery.charPicker.js"></script>
```

---

## Быстрый старт

```html
<input type="text" id="my-input" placeholder="Введите текст…">

<script>
  $('#my-input').charPicker();
</script>
```

После инициализации рядом с полем появится кнопка-триггер (☺). При нажатии открывается попап с выбором символа.

---

## API

### Инициализация

```javascript
$(selector).charPicker([options]);
```

### Методы

```javascript
$(selector).charPicker('open');     // Открыть попап
$(selector).charPicker('close');    // Закрыть попап
$(selector).charPicker('destroy');  // Снести плагин, вернуть элемент в исходное состояние
```

---

## Опции

| Опция | Тип | По умолчанию | Описание |
|-------|-----|-------------|----------|
| `recentMax` | `number` | `32` | Максимальное количество символов в панели «Недавние» |
| `position` | `string` | `'auto'` | Позиция попапа: `'auto'` \| `'top'` \| `'bottom'` |
| `panels` | `Array\|null` | `null` | Список id панелей для отображения. `null` — показать все |
| `onOpen` | `function` | `null` | Коллбэк при открытии попапа |
| `onClose` | `function` | `null` | Коллбэк при закрытии попапа |
| `onSelect` | `function` | `null` | Коллбэк при выборе символа: `function(char, name)` |

---

## Параметр `panels`

С помощью `panels` можно показать только нужные группы символов.

```javascript
// Только эмодзи-смайлы и стрелки
$('#f1').charPicker({ panels: ['smileys', 'arrows'] });

// Только математические символы и валюты
$('#f2').charPicker({ panels: ['math', 'currency'] });

// Только типографика (кавычки, тире, спецзнаки)
$('#f3').charPicker({ panels: ['typography'] });

// Все панели (поведение по умолчанию)
$('#f4').charPicker({ panels: null });
```

### Доступные id панелей

| id | Содержимое |
|----|-----------|
| `smileys` | Эмодзи-смайлы и выражения лица |
| `gestures` | Жесты рук |
| `nature` | Животные, растения, погода |
| `food` | Еда и напитки |
| `symbols_emo` | Символьные эмодзи (сердца, звёзды, знаки) |
| `arrows` | Стрелки всех видов |
| `math` | Математические знаки и греческий алфавит |
| `typography` | Кавычки, тире, типографические знаки |
| `currency` | Знаки валют |
| `diacritics` | Диакритические символы (À, é, ñ, ö…) |

> Панель `recent` («Недавние») добавляется автоматически при первом выборе символа — управлять ею через `panels` не нужно.

---

## Примеры

### Минимальная инициализация

```javascript
$('input[type="text"]').charPicker();
$('textarea').charPicker();
```

### С коллбэком

```javascript
$('#editor').charPicker({
  panels: ['smileys', 'gestures', 'symbols_emo'],
  onSelect: function(char, name) {
    console.log('Вставлен:', char, '—', name);
  }
});
```

### Только спецсимволы (без эмодзи)

```javascript
$('#code-editor').charPicker({
  panels: ['arrows', 'math', 'typography', 'currency']
});
```

### Принудительное открытие

```javascript
$('#my-field').charPicker();             // инициализация
$('#open-btn').on('click', function() {
  $('#my-field').charPicker('open');
});
```

### Уничтожение и переинициализация

```javascript
$('#my-field').charPicker('destroy');    // снести
$('#my-field').charPicker({ panels: ['math'] }); // пересоздать с другими опциями
```

---

## Глобальная история («Недавние»)

История последних выбранных символов **едина для всех полей** на странице. Если пользователь выбрал символ в одном поле — он появится в «Недавних» и в других полях с плагином.

История хранится **в памяти** (in-memory) — сбрасывается при перезагрузке страницы. Для персистентности можно использовать `localStorage` на уровне приложения (плагин предоставляет коллбэк `onSelect`).

---

## Сборка CSS из SCSS

Исходные стили написаны на SCSS и находятся в файле `jquery.charPicker.scss`. Файл содержит:
- все переменные (`$cp-*`) с флагом `!default` для переопределения
- примеси (`@mixin`): `hide-scrollbar`, `thin-scrollbar`, `no-select`
- все стили плагина без вложений (SCSS-код плоский, совместим с любым SCSS-компилятором)

Для компиляции:

```bash
# Dart Sass
sass jquery.charPicker.scss jquery.charPicker.css

# Node.js (node-sass)
node-sass jquery.charPicker.scss jquery.charPicker.css

# npx (без глобальной установки)
npx sass jquery.charPicker.scss jquery.charPicker.css
```

### Кастомизация через переменные SCSS

Переопределите переменные **перед** импортом файла:

```scss
// Шире попап
$cp-popup-width: 380px;

// Другая цветовая схема
$cp-color-accent:      #e85d04;
$cp-color-accent-dark: #c44a00;

// Крупнее символы
$cp-char-size:       40px;
$cp-char-font-size:  24px;

@import 'jquery.charPicker';
```

---

## Безопасность

- Все символы вставляются через `document.createTextNode()` — XSS невозможен
- Нет `eval()`, нет `innerHTML` с пользовательскими данными
- Типографические символы (`'`, `'`, `"`, `"` и др.) записаны через `\uXXXX` — нет конфликтов с JS-строками
- Попап закрывается при клике вне его области, по `Escape`, при скролле и ресайзе

---

## Поддержка браузеров

| Браузер | Версия |
|---------|--------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 12+ |
| Edge | 79+ |
| Opera | 47+ |

> Для поддержки IE11 замените `\u{1F600}` (ES2015 Unicode escape) на суррогатные пары `\uD83D\uDE00` и не используйте `const`/`let` в SCSS-переменных. Сам JS-код плагина уже написан на ES5.

---

## Структура файлов

```
jquery.charPicker/
├── jquery.charPicker.js     # Плагин (ES5, jQuery ≥ 1.9)
├── jquery.charPicker.scss   # Исходные стили (SCSS)
├── jquery.charPicker.css    # Скомпилированные стили
├── demo.html                # Демо-страница
└── README.md
```

---

## Разработка

Плагин написан в паттерне jQuery Plugin Boilerplate (IIFE + `$.fn`). Структура:

```
(function($) {
  // Глобальное хранилище «Недавних» (_globalRecent)
  // Данные групп символов (GROUPS)
  // Класс CharPicker (конструктор + прототип)
  // $.fn.charPicker — точка входа
}(jQuery));
```

---

## Лицензия

MIT © 2024

Разрешается свободно использовать, копировать, изменять и распространять в любых целях при сохранении оригинального уведомления об авторских правах.
