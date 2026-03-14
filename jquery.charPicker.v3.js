/*!
 * jquery.charPicker.v3.js  v3.1.0
 * jQuery-адаптер для charPicker.core.js.
 *
 * Требования: jQuery >= 1.9, jquery.loadBundle.js (опционально)
 *
 * Этот файл (~3 КБ) подключается вместе со страницей.
 * charPicker.core.js + charPicker.core.css загружаются лениво —
 * только при первой попытке открыть диалог.
 *
 * ── API ────────────────────────────────────────────────────────────
 *   $(el).charPicker(options)        — инициализация
 *   $(el).charPicker('open')         — открыть (опц. якорь вторым аргументом)
 *   $(el).charPicker('open', btn)    — открыть, позиционировать у btn
 *   $(el).charPicker('close')        — закрыть
 *   $(el).charPicker('toggle')       — переключить
 *   $(el).charPicker('destroy')      — удалить плагин
 *
 * ── Опции ──────────────────────────────────────────────────────────
 *   coreJs   {string}  URL charPicker.core.js   (по умолч. — та же папка что и этот файл)
 *   coreCss  {string}  URL charPicker.core.css  (по умолч. — та же папка что и этот файл)
 *   trigger  {string|false|Element|jQuery|Function}  — управление кнопкой
 *   anchor   {Element|string}  — статический якорь позиционирования
 *
 *   + все опции CharPicker: data, dataUrl, recentMax, position, align,
 *     closeOnPick, panels, debug, onOpen, onClose, onSelect, onDataError
 *
 * ── Опция trigger ──────────────────────────────────────────────────
 *   'auto'        — (по умолч.) плагин создаёт кнопку рядом с полем
 *   false         — кнопка не создаётся, вызов только через API:
 *                     $(el).charPicker('open', anchorElement)
 *   Element/jQuery — готовая кнопка, плагин вешает click сам
 *   function(openFn) — колбэк, получает функцию открытия:
 *                     trigger: function(open) {
 *                       $('#btn').on('click', function(e) {
 *                         open(e.currentTarget);
 *                       });
 *                     }
 *
 * ── Prefetch CSS ───────────────────────────────────────────────────
 *   При наличии $.getCss (из jquery.loadBundle.js) CSS начинает
 *   загружаться при первом фокусе на поле — до клика на кнопку.
 */
;(function ($) {
  'use strict';

  var PLUGIN = 'charPicker';
  var STUB_DATA_KEY = 'cp3-stub'; // ключ $.data для хранения экземпляра Stub

  /* ── Базовый путь к файлам ядра ──────────────────────────────────
     Вычисляется один раз при загрузке плагина.
     Ищем <script src> содержащий имя этого файла, берём его директорию.
     Fallback — жёсткий путь на случай если скрипт загружен через eval/XHR. */
  var _BASE_URL = (function() {
    var SELF = 'jquery.charPicker';  // часть имени этого файла
    // 1. document.currentScript — работает при синхронной загрузке <script>
    if (document.currentScript && document.currentScript.src) {
      return document.currentScript.src.replace(/[^/]+$/, '');
    }
    // 2. Ищем среди всех <script> последний с нашим именем в src
    var scripts = document.querySelectorAll('script[src]');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src.indexOf(SELF) !== -1) {
        return scripts[i].src.replace(/[^/]+$/, '');
      }
    }
    // 3. Fallback — пустая строка означает относительный путь (та же папка)
    return '';
  }());

  /* ══════════════════════════════════════════════════════════════════
     Stub — заглушка, живёт с момента инициализации до загрузки ядра.

     До загрузки: хранит опции, управляет кнопкой-триггером.
     После загрузки: делегирует все вызовы экземпляру CharPicker.

     Кнопка в режиме 'auto' остаётся в DOM навсегда —
     charPicker.core.js больше не создаёт собственный wrap/кнопку.
     ══════════════════════════════════════════════════════════════════ */
  function Stub(el, opts) {
    this.el       = el;
    this.$el      = $(el);
    this.o        = $.extend({}, Stub.defaults, opts);
    this._core    = null;    // экземпляр CharPicker после загрузки ядра
    this._loading = false;   // флаг: загрузка уже идёт
    this._btn     = null;    // кнопка-триггер (только trigger:'auto')
    this._wrap    = null;    // обёртка вокруг поля (только trigger:'auto')
    this._triggerEl = null;  // DOM-элемент триггера для передачи якоря в open()

    this._initTrigger();
    this._prefetchCss();
  }

  Stub.defaults = {
    coreJs:  _BASE_URL + 'charPicker.core.js',
    coreCss: _BASE_URL + 'charPicker.core.css',

    // trigger: управляет созданием кнопки открытия диалога
    // Подробнее — в шапке файла и в комментарии _initTrigger().
    trigger: 'auto',

    // anchor: статический якорь позиционирования попапа.
    // Приоритет: аргумент open(anchor) > этот параметр > triggerEl > el.
    anchor: null,

    // Опции CharPicker — передаются в ядро как есть:
    data:        null,
    dataUrl:     null,
    recentMax:   32,
    position:    'auto',
    align:       'field',
    closeOnPick: false,
    panels:      null,
    debug:       false,
    onOpen:      null,
    onClose:     null,
    onSelect:    null,
    onDataError: null
  };

  Stub.prototype = {

    /* ── Инициализация триггера ────────────────────────────────────
       Четыре режима управляются опцией trigger:

       'auto'         — создаём wrap + кнопку рядом с полем.
                        Inline-стили дублируют CSS — кнопка видна
                        до загрузки charPicker.core.css.

       false          — кнопка не создаётся. Только внешний API:
                          $(el).charPicker('open', anchorEl)

       Element/jQuery — готовая кнопка. Вешаем click сами,
                        передаём её как якорь позиционирования.

       function(open) — колбэк, получает функцию open(anchor).
                        this внутри колбэка = DOM-элемент поля.  */
    _initTrigger: function() {
      var self = this;
      var triggerOpt = this.o.trigger;

      if (triggerOpt === false) return; // режим «без кнопки»

      // Режим «готовый элемент»
      if (triggerOpt && (triggerOpt.nodeType === 1 || (typeof triggerOpt.jquery === 'string' && triggerOpt.length))) {
        var el = triggerOpt.nodeType === 1 ? triggerOpt : triggerOpt[0];
        this._triggerEl = el;
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          self.open(el);
        });
        return;
      }

      // Режим «колбэк»
      if (typeof triggerOpt === 'function') {
        triggerOpt.call(this.el, function(anchor) { self.open(anchor); });
        return;
      }

      // Режим 'auto' — создаём wrap + кнопку.
      // Inline-стили дублируют .jcp / .jcp__trigger из charPicker.core.css:
      // кнопка корректно отображается ДО загрузки CSS-файла.
      this._wrap = document.createElement('span');
      this._wrap.className  = 'jcp';
      this._wrap.style.cssText = 'display:inline-flex;align-items:center;' +
        'position:relative;vertical-align:middle;';
      this.el.parentNode.insertBefore(this._wrap, this.el);
      this._wrap.appendChild(this.el);

      this._btn = document.createElement('button');
      this._btn.type        = 'button';
      this._btn.className   = 'jcp__trigger';
      this._btn.style.cssText =
        'display:inline-flex;align-items:center;justify-content:center;' +
        'width:2.2em;height:2.2em;flex:0 0 auto;margin-left:4px;padding:0;' +
        'border:1px solid #c8cfd8;border-radius:6px;background:#f4f6f8;' +
        'color:#555;cursor:pointer;user-select:none;';
      this._btn.setAttribute('aria-haspopup', 'dialog');
      this._btn.setAttribute('aria-expanded', 'false');
      this._btn.setAttribute('title', 'Вставить символ');
      this._btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="10"/>' +
        '<path d="M8 14s1.5 2 4 2 4-2 4-2"/>' +
        '<line x1="9" y1="9" x2="9.01" y2="9"/>' +
        '<line x1="15" y1="9" x2="15.01" y2="9"/>' +
        '</svg>';
      this._wrap.appendChild(this._btn);
      this._triggerEl = this._btn;

      this._btn.addEventListener('click', function(e) {
        e.stopPropagation();
        self.open(self._btn);
      });
    },

    /* ── Prefetch CSS ──────────────────────────────────────────────
       При первом фокусе на поле начинаем загружать CSS заранее.
       К моменту клика на кнопку стили уже в кэше браузера.
       Требует $.getCss из jquery.loadBundle.js.                   */
    _prefetchCss: function() {
      if (typeof $.getCss !== 'function') return;
      var self = this;
      this.$el.one('focus.cpLazy', function() {
        $.getCss(self.o.coreCss);
      });
    },

    /* ── Открытие диалога ──────────────────────────────────────────
       При первом вызове загружает ядро (JS + CSS параллельно),
       создаёт экземпляр CharPicker и сразу открывает диалог.
       При повторных вызовах — делегирует напрямую в core.

       anchor — якорь позиционирования попапа. Приоритет:
         аргумент > opts.anchor > _triggerEl > el              */
    open: function(anchor) {
      var self    = this;
      var pendingAnchor = anchor || this.o.anchor || this._triggerEl || this.el;

      // Ядро уже загружено — делегируем напрямую
      if (self._core) {
        self._core.open(pendingAnchor);
        return;
      }

      // Загрузка уже идёт — не дублируем
      if (self._loading) return;
      self._loading = true;

      // Визуальная обратная связь на кнопке во время загрузки
      var $loadingBtn = self._btn ? $(self._btn) : $(); // кнопка для индикатора загрузки
      $loadingBtn.prop('disabled', true).addClass('jcp__trigger--loading');

      var loader = typeof $.loadBundle === 'function'
        ? $.loadBundle(self.o.coreCss, self.o.coreJs)
        : _fallbackLoad(self.o.coreCss, self.o.coreJs);

      loader
        .then(function() {
          self._loading = false;
          $loadingBtn.prop('disabled', false).removeClass('jcp__trigger--loading');
          self.$el.off('focus.cpLazy');

          
          // Снимаем rect ДО вызова new CharPicker() — конструктор может изменить DOM,
          // после чего getBoundingClientRect() вернёт нули для перемещённых элементов.
          if (pendingAnchor && typeof pendingAnchor.getBoundingClientRect === 'function') {
            var r = pendingAnchor.getBoundingClientRect();
            pendingAnchor = { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
          }

          self._core = new window.CharPicker(self.el, _pickCoreOpts(self.o));
          self._core.open(pendingAnchor);
        })
        .catch(function(err) {
          self._loading = false;
          $loadingBtn.prop('disabled', false).removeClass('jcp__trigger--loading');
          console.error('charPicker: failed to load core:', err);
        });
    },

    close: function() {
      if (this._core) this._core.close();
    },

    toggle: function(anchor) {
      if (this._core) {
        this._core.toggle(anchor || this._triggerEl);
      } else {
        this.open(anchor);
      }
    },

    /* ── Удаление плагина ──────────────────────────────────────────
       Снимает обработчики, удаляет попап, убирает wrap.          */
    destroy: function() {
      this.$el.off('focus.cpLazy');
      if (this._core) this._core.destroy();
      // Убираем wrap и возвращаем поле на место (только режим 'auto')
      if (this._wrap && this._wrap.parentNode) {
        this._wrap.parentNode.insertBefore(this.el, this._wrap);
        this._wrap.parentNode.removeChild(this._wrap);
      }
      this.$el.removeData(STUB_DATA_KEY);
    }

  }; // Stub.prototype

  /* ── Утилиты ─────────────────────────────────────────────────────*/

  /** Вычленяет из опций Stub только те, что понимает CharPicker */
  function _pickCoreOpts(o) {
    return {
      data:        o.data,
      dataUrl:     o.dataUrl,
      recentMax:   o.recentMax,
      position:    o.position,
      align:       o.align,
      closeOnPick: o.closeOnPick,
      panels:      o.panels,
      debug:       o.debug,
      onOpen:      o.onOpen,
      onClose:     o.onClose,
      onSelect:    o.onSelect,
      onDataError: o.onDataError
    };
  }

  /**
   * Резервная загрузка CSS + JS если $.loadBundle недоступен.
   * Оба файла грузятся параллельно через Promise.all.
   */
  function _fallbackLoad(cssHref, jsSrc) {
    function loadLink(href) {
      return new Promise(function(resolve, reject) {
        var el   = document.createElement('link');
        el.rel   = 'stylesheet';
        el.href  = href;
        el.onload  = resolve;
        el.onerror = function() { reject(new Error('CSS load failed: ' + href)); };
        document.head.appendChild(el);
      });
    }
    function loadScript(src) {
      return new Promise(function(resolve, reject) {
        var el   = document.createElement('script');
        el.src   = src;
        el.async = true;
        el.onload  = resolve;
        el.onerror = function() { reject(new Error('Script load failed: ' + src)); };
        document.head.appendChild(el);
      });
    }
    return Promise.all([loadLink(cssHref), loadScript(jsSrc)]);
  }

  /* ══════════════════════════════════════════════════════════════════
     $.fn.charPicker — точка входа
     ══════════════════════════════════════════════════════════════════ */
  $.fn[PLUGIN] = function(optOrMethod) {
    var args = Array.prototype.slice.call(arguments, 1);

    return this.each(function() {
      var stub = $(this).data(STUB_DATA_KEY);

      if (typeof optOrMethod === 'string') {
        // Вызов метода: 'open', 'close', 'toggle', 'destroy'
        // Дополнительные аргументы передаются в метод:
        //   $(el).charPicker('open', anchorElement)
        if (!stub) {
          $.error('charPicker: метод "' + optOrMethod + '" вызван до инициализации');
          return;
        }
        if (typeof stub[optOrMethod] === 'function') {
          stub[optOrMethod].apply(stub, args);
        } else {
          $.error('charPicker: неизвестный метод "' + optOrMethod + '"');
        }
      } else {
        // Инициализация — создаём Stub если ещё нет
        if (!stub) {
          stub = new Stub(this, optOrMethod || {});
          $(this).data(STUB_DATA_KEY, stub);
        }
      }
    });
  };

}(jQuery));
