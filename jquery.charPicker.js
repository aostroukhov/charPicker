/*!
 * jquery.charPicker.js  v1.1.0
 * jQuery-плагин: вставка спецсимволов и эмодзи в input / textarea
 *
 * Требования: jQuery >= 1.9
 * Лицензия: MIT
 *
 * Безопасность:
 *  - Нет eval(), нет innerHTML с пользовательскими данными
 *  - Все DOM-операции через jQuery/createElement
 *  - XSS невозможен: символы вставляются как text-узлы
 *  - Все спецсимволы (кавычки и др.) заданы через \uXXXX
 *
 * API:
 *  $(el).charPicker([options])       — инициализация
 *  $(el).charPicker('destroy')       — удаление
 *  $(el).charPicker('open')          — открыть попап
 *  $(el).charPicker('close')         — закрыть попап
 *
 * Опции:
 *  recentMax  {number}   32        — макс. символов в «Недавних»
 *  position   {string}  'auto'    — 'auto' | 'top' | 'bottom'
 *  panels     {Array|null} null   — фильтр панелей по id; null = все
 *                                   Пример: ['smileys','arrows','math']
 *  onOpen     {Function} null
 *  onClose    {Function} null
 *  onSelect   {Function} null     — function(char, name)
 */
;(function ($) {
  'use strict';

  /* ================================================================
     ГЛОБАЛЬНАЯ ИСТОРИЯ «Недавних»
     Единая для всех экземпляров на странице.
     ================================================================ */
  var _globalRecent    = [];
  var _globalRecentMax = 32;

  function globalAddRecent(item, max) {
    _globalRecentMax = max || _globalRecentMax;
    _globalRecent = $.grep(_globalRecent, function (r) { return r.c !== item.c; });
    _globalRecent.unshift(item);
    if (_globalRecent.length > _globalRecentMax) {
      _globalRecent = _globalRecent.slice(0, _globalRecentMax);
    }
  }

  /* ================================================================
     ДАННЫЕ СИМВОЛОВ
     Все литеральные символы, потенциально конфликтующие с JS-кавычками
     (одинарными или двойными), заданы через Unicode-эскейп \uXXXX.
     ================================================================ */
  var GROUPS = [
    { id: 'recent',  label: '\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435', icon: '\u{1F550}', chars: [] },

    {
      id: 'smileys', label: '\u0421\u043C\u0430\u0439\u043B\u044B', icon: '\u{1F600}',
      chars: [
        {c:'\u{1F600}',n:'grinning smile \u0443\u043B\u044B\u0431\u043A\u0430'},
        {c:'\u{1F601}',n:'beaming smile \u0437\u0443\u0431\u0430\u0441\u0442\u0430\u044F \u0443\u043B\u044B\u0431\u043A\u0430'},
        {c:'\u{1F602}',n:'joy tears \u0441\u043C\u0435\u0445 \u0441\u043E \u0441\u043B\u0435\u0437\u0430\u043C\u0438'},
        {c:'\u{1F923}',n:'rolling floor \u043A\u0430\u0442\u0430\u044E\u0441\u044C \u0441\u043E \u0441\u043C\u0435\u0445\u0443'},
        {c:'\u{1F603}',n:'smiley \u0448\u0438\u0440\u043E\u043A\u0430\u044F \u0443\u043B\u044B\u0431\u043A\u0430'},
        {c:'\u{1F604}',n:'smile \u0441\u0447\u0430\u0441\u0442\u044C\u0435'},
        {c:'\u{1F605}',n:'sweat smile \u0445\u043E\u043B\u043E\u0434\u043D\u044B\u0439 \u043F\u043E\u0442'},
        {c:'\u{1F606}',n:'laughing \u0441\u043C\u0435\u0445 \u0437\u0430\u043A\u0440\u044B\u0442\u044B\u0435 \u0433\u043B\u0430\u0437\u0430'},
        {c:'\u{1F609}',n:'wink \u043F\u043E\u0434\u043C\u0438\u0433\u0438\u0432\u0430\u043D\u0438\u0435'},
        {c:'\u{1F60A}',n:'blush \u0440\u0443\u043C\u044F\u043D\u0435\u0446'},
        {c:'\u{1F60B}',n:'yum \u0432\u043A\u0443\u0441\u043D\u044F\u0442\u0438\u043D\u0430'},
        {c:'\u{1F60E}',n:'sunglasses \u043A\u0440\u0443\u0442\u043E\u0439'},
        {c:'\u{1F60D}',n:'heart eyes \u0432\u043B\u044E\u0431\u043B\u0451\u043D\u043D\u044B\u0439'},
        {c:'\u{1F970}',n:'smiling hearts \u043E\u0431\u043E\u0436\u0430\u043D\u0438\u0435'},
        {c:'\u{1F618}',n:'kissing heart \u043F\u043E\u0446\u0435\u043B\u0443\u0439'},
        {c:'\u{1F929}',n:'star struck \u0437\u0432\u0451\u0437\u0434\u044B \u0432 \u0433\u043B\u0430\u0437\u0430\u0445'},
        {c:'\u{1F973}',n:'partying \u043F\u0440\u0430\u0437\u0434\u043D\u0438\u043A'},
        {c:'\u{1F60F}',n:'smirk \u0443\u0445\u043C\u044B\u043B\u043A\u0430'},
        {c:'\u{1F612}',n:'unamused \u043D\u0435\u0434\u043E\u0432\u043E\u043B\u044C\u0441\u0442\u0432\u043E'},
        {c:'\u{1F61E}',n:'disappointed \u0440\u0430\u0437\u043E\u0447\u0430\u0440\u043E\u0432\u0430\u043D\u0438\u0435'},
        {c:'\u{1F614}',n:'pensive \u0437\u0430\u0434\u0443\u043C\u0447\u0438\u0432\u043E\u0441\u0442\u044C'},
        {c:'\u{1F61F}',n:'worried \u043E\u0431\u0435\u0441\u043F\u043E\u043A\u043E\u0435\u043D\u043D\u043E\u0441\u0442\u044C'},
        {c:'\u{1F615}',n:'confused \u0440\u0430\u0441\u0442\u0435\u0440\u044F\u043D\u043D\u043E\u0441\u0442\u044C'},
        {c:'\u{1F641}',n:'frowning \u0441\u043B\u0435\u0433\u043A\u0430 \u0433\u0440\u0443\u0441\u0442\u043D\u043E'},
        {c:'\u2639\uFE0F',n:'frown \u0433\u0440\u0443\u0441\u0442\u044C'},
        {c:'\u{1F622}',n:'cry \u0441\u043B\u0435\u0437\u0430'},
        {c:'\u{1F62D}',n:'loudly crying \u043F\u043B\u0430\u0447\u0443'},
        {c:'\u{1F97A}',n:'pleading \u0443\u043C\u043E\u043B\u044F\u044E'},
        {c:'\u{1F624}',n:'triumph \u0444\u044B\u0440\u043A\u0430\u043D\u044C\u0435'},
        {c:'\u{1F620}',n:'angry \u0437\u043B\u043E\u0441\u0442\u044C'},
        {c:'\u{1F621}',n:'rage \u044F\u0440\u043E\u0441\u0442\u044C'},
        {c:'\u{1F92C}',n:'symbols on mouth \u0440\u0443\u0433\u0430\u043D\u044C'},
        {c:'\u{1F608}',n:'devil smiling \u0437\u043B\u043E\u0439 \u0441\u043C\u0430\u0439\u043B'},
        {c:'\u{1F47F}',n:'angry face horns \u0437\u043B\u043E\u0439 imp'},
        {c:'\u{1F480}',n:'skull \u0447\u0435\u0440\u0435\u043F'},
        {c:'\u2620\uFE0F',n:'skull crossbones \u0447\u0435\u0440\u0435\u043F \u0438 \u043A\u043E\u0441\u0442\u0438'},
        {c:'\u{1F4A9}',n:'pile poop \u043A\u0443\u0447\u043A\u0430'},
        {c:'\u{1F921}',n:'clown \u043A\u043B\u043E\u0443\u043D'},
        {c:'\u{1F47B}',n:'ghost \u043F\u0440\u0438\u0432\u0438\u0434\u0435\u043D\u0438\u0435'},
        {c:'\u{1F47D}',n:'alien \u0438\u043D\u043E\u043F\u043B\u0430\u043D\u0435\u0442\u044F\u043D\u0438\u043D'},
        {c:'\u{1F916}',n:'robot \u0440\u043E\u0431\u043E\u0442'}
      ]
    },

    {
      id: 'gestures', label: '\u0416\u0435\u0441\u0442\u044B', icon: '\u{1F44B}',
      chars: [
        {c:'\u{1F44B}',n:'wave \u043F\u0440\u0438\u0432\u0435\u0442'},
        {c:'\u270B',n:'raised hand \u0441\u0442\u043E\u043F'},
        {c:'\u{1F590}\uFE0F',n:'hand \u043B\u0430\u0434\u043E\u043D\u044C'},
        {c:'\u{1F596}',n:'vulcan \u0432\u0443\u043B\u043A\u0430\u043D'},
        {c:'\u{1F44C}',n:'ok \u043E\u043A\u0435\u0439'},
        {c:'\u270C\uFE0F',n:'victory \u043F\u043E\u0431\u0435\u0434\u0430'},
        {c:'\u{1F91E}',n:'crossed fingers \u0441\u043A\u0440\u0435\u0449\u0451\u043D\u043D\u044B\u0435 \u043F\u0430\u043B\u044C\u0446\u044B'},
        {c:'\u{1F91F}',n:'love you hand \u043B\u044E\u0431\u043B\u044E'},
        {c:'\u{1F918}',n:'horns rock \u0440\u043E\u043A'},
        {c:'\u{1F919}',n:'call me \u043F\u043E\u0437\u0432\u043E\u043D\u0438'},
        {c:'\u{1F448}',n:'point left \u0432\u043B\u0435\u0432\u043E'},
        {c:'\u{1F449}',n:'point right \u0432\u043F\u0440\u0430\u0432\u043E'},
        {c:'\u{1F446}',n:'point up \u0432\u0432\u0435\u0440\u0445'},
        {c:'\u261D\uFE0F',n:'index up \u0432\u0432\u0435\u0440\u0445 \u043E\u0434\u0438\u043D'},
        {c:'\u{1F447}',n:'point down \u0432\u043D\u0438\u0437'},
        {c:'\u{1F44D}',n:'thumbs up \u043B\u0430\u0439\u043A'},
        {c:'\u{1F44E}',n:'thumbs down \u0434\u0438\u0437\u043B\u0430\u0439\u043A'},
        {c:'\u270A',n:'fist \u043A\u0443\u043B\u0430\u043A'},
        {c:'\u{1F44A}',n:'oncoming fist \u0443\u0434\u0430\u0440'},
        {c:'\u{1F44F}',n:'clap \u0430\u043F\u043B\u043E\u0434\u0438\u0441\u043C\u0435\u043D\u0442\u044B'},
        {c:'\u{1F64C}',n:'raising hands \u0443\u0440\u0430'},
        {c:'\u{1FAF6}',n:'heart hands \u0441\u0435\u0440\u0434\u0446\u0435 \u0440\u0443\u043A\u0430\u043C\u0438'},
        {c:'\u{1F450}',n:'open hands \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0435 \u0440\u0443\u043A\u0438'},
        {c:'\u{1F932}',n:'palms \u043B\u0430\u0434\u043E\u043D\u0438'},
        {c:'\u{1F91D}',n:'handshake \u0440\u0443\u043A\u043E\u043F\u043E\u0436\u0430\u0442\u0438\u0435'},
        {c:'\u{1F64F}',n:'folded hands \u0441\u043F\u0430\u0441\u0438\u0431\u043E'},
        {c:'\u{1F4AA}',n:'muscle \u043C\u044B\u0448\u0446\u0430'},
        {c:'\u{1F595}',n:'middle finger \u0441\u0440\u0435\u0434\u043D\u0438\u0439 \u043F\u0430\u043B\u0435\u0446'},
        {c:'\u270D\uFE0F',n:'writing hand \u043F\u0438\u0448\u0443'}
      ]
    },

    {
      id: 'nature', label: '\u041F\u0440\u0438\u0440\u043E\u0434\u0430', icon: '\u{1F33F}',
      chars: [
        {c:'\u{1F436}',n:'dog \u0441\u043E\u0431\u0430\u043A\u0430'},{c:'\u{1F431}',n:'cat \u043A\u043E\u0442'},
        {c:'\u{1F42D}',n:'mouse \u043C\u044B\u0448\u044C'},{c:'\u{1F439}',n:'hamster \u0445\u043E\u043C\u044F\u043A'},
        {c:'\u{1F430}',n:'rabbit \u043A\u0440\u043E\u043B\u0438\u043A'},{c:'\u{1F98A}',n:'fox \u043B\u0438\u0441\u0430'},
        {c:'\u{1F43B}',n:'bear \u043C\u0435\u0434\u0432\u0435\u0434\u044C'},{c:'\u{1F43C}',n:'panda \u043F\u0430\u043D\u0434\u0430'},
        {c:'\u{1F428}',n:'koala \u043A\u043E\u0430\u043B\u0430'},{c:'\u{1F42F}',n:'tiger \u0442\u0438\u0433\u0440'},
        {c:'\u{1F981}',n:'lion \u043B\u0435\u0432'},{c:'\u{1F42E}',n:'cow \u043A\u043E\u0440\u043E\u0432\u0430'},
        {c:'\u{1F437}',n:'pig \u0441\u0432\u0438\u043D\u044C\u044F'},{c:'\u{1F438}',n:'frog \u043B\u044F\u0433\u0443\u0448\u043A\u0430'},
        {c:'\u{1F435}',n:'monkey \u043E\u0431\u0435\u0437\u044C\u044F\u043D\u0430'},{c:'\u{1F414}',n:'chicken \u043A\u0443\u0440\u0438\u0446\u0430'},
        {c:'\u{1F427}',n:'penguin \u043F\u0438\u043D\u0433\u0432\u0438\u043D'},{c:'\u{1F426}',n:'bird \u043F\u0442\u0438\u0446\u0430'},
        {c:'\u{1F986}',n:'duck \u0443\u0442\u043A\u0430'},{c:'\u{1F985}',n:'eagle \u043E\u0440\u0451\u043B'},
        {c:'\u{1F989}',n:'owl \u0441\u043E\u0432\u0430'},{c:'\u{1F987}',n:'bat \u043B\u0435\u0442\u0443\u0447\u0430\u044F \u043C\u044B\u0448\u044C'},
        {c:'\u{1F43A}',n:'wolf \u0432\u043E\u043B\u043A'},{c:'\u{1F434}',n:'horse \u043B\u043E\u0448\u0430\u0434\u044C'},
        {c:'\u{1F984}',n:'unicorn \u0435\u0434\u0438\u043D\u043E\u0440\u043E\u0433'},{c:'\u{1F41D}',n:'bee \u043F\u0447\u0435\u043B\u0430'},
        {c:'\u{1F98B}',n:'butterfly \u0431\u0430\u0431\u043E\u0447\u043A\u0430'},{c:'\u{1F40C}',n:'snail \u0443\u043B\u0438\u0442\u043A\u0430'},
        {c:'\u{1F41E}',n:'ladybug \u0431\u043E\u0436\u044C\u044F \u043A\u043E\u0440\u043E\u0432\u043A\u0430'},
        {c:'\u{1F338}',n:'sakura blossom \u0446\u0432\u0435\u0442\u043E\u043A'},{c:'\u{1F339}',n:'rose \u0440\u043E\u0437\u0430'},
        {c:'\u{1F33B}',n:'sunflower \u043F\u043E\u0434\u0441\u043E\u043B\u043D\u0443\u0445'},
        {c:'\u{1F33F}',n:'herb \u0442\u0440\u0430\u0432\u0430'},{c:'\u{1F343}',n:'leaves \u043B\u0438\u0441\u0442\u044C\u044F'},
        {c:'\u{1F331}',n:'seedling \u0440\u043E\u0441\u0442\u043E\u043A'},{c:'\u{1F332}',n:'evergreen \u0434\u0435\u0440\u0435\u0432\u043E'},
        {c:'\u{1F334}',n:'palm tree \u043F\u0430\u043B\u044C\u043C\u0430'},
        {c:'\u2600\uFE0F',n:'sun \u0441\u043E\u043B\u043D\u0446\u0435'},{c:'\u26C5',n:'partly cloudy \u043E\u0431\u043B\u0430\u043A\u0430'},
        {c:'\u2744\uFE0F',n:'snowflake \u0441\u043D\u0435\u0433'},{c:'\u{1F308}',n:'rainbow \u0440\u0430\u0434\u0443\u0433\u0430'},
        {c:'\u{1F30A}',n:'wave \u0432\u043E\u043B\u043D\u0430'},{c:'\u{1F525}',n:'fire \u043E\u0433\u043E\u043D\u044C'},
        {c:'\u{1F4A7}',n:'droplet \u043A\u0430\u043F\u043B\u044F'}
      ]
    },

    {
      id: 'food', label: '\u0415\u0434\u0430', icon: '\u{1F355}',
      chars: [
        {c:'\u{1F34E}',n:'apple \u044F\u0431\u043B\u043E\u043A\u043E'},{c:'\u{1F34A}',n:'orange \u0430\u043F\u0435\u043B\u044C\u0441\u0438\u043D'},
        {c:'\u{1F34B}',n:'lemon \u043B\u0438\u043C\u043E\u043D'},{c:'\u{1F347}',n:'grapes \u0432\u0438\u043D\u043E\u0433\u0440\u0430\u0434'},
        {c:'\u{1F353}',n:'strawberry \u043A\u043B\u0443\u0431\u043D\u0438\u043A\u0430'},
        {c:'\u{1F352}',n:'cherries \u0432\u0438\u0448\u043D\u044F'},{c:'\u{1F351}',n:'peach \u043F\u0435\u0440\u0441\u0438\u043A'},
        {c:'\u{1F96D}',n:'mango \u043C\u0430\u043D\u0433\u043E'},{c:'\u{1F34D}',n:'pineapple \u0430\u043D\u0430\u043D\u0430\u0441'},
        {c:'\u{1F965}',n:'coconut \u043A\u043E\u043A\u043E\u0441'},{c:'\u{1F95D}',n:'kiwi \u043A\u0438\u0432\u0438'},
        {c:'\u{1F345}',n:'tomato \u043F\u043E\u043C\u0438\u0434\u043E\u0440'},{c:'\u{1F951}',n:'avocado \u0430\u0432\u043E\u043A\u0430\u0434\u043E'},
        {c:'\u{1F966}',n:'broccoli \u0431\u0440\u043E\u043A\u043A\u043E\u043B\u0438'},{c:'\u{1F955}',n:'carrot \u043C\u043E\u0440\u043A\u043E\u0432\u044C'},
        {c:'\u{1F33D}',n:'corn \u043A\u0443\u043A\u0443\u0440\u0443\u0437\u0430'},{c:'\u{1F336}\uFE0F',n:'hot pepper \u043F\u0435\u0440\u0435\u0446'},
        {c:'\u{1F9C4}',n:'garlic \u0447\u0435\u0441\u043D\u043E\u043A'},{c:'\u{1F9C5}',n:'onion \u043B\u0443\u043A'},
        {c:'\u{1F35E}',n:'bread \u0445\u043B\u0435\u0431'},{c:'\u{1F950}',n:'croissant \u043A\u0440\u0443\u0430\u0441\u0441\u0430\u043D'},
        {c:'\u{1F355}',n:'pizza \u043F\u0438\u0446\u0446\u0430'},{c:'\u{1F354}',n:'burger \u0431\u0443\u0440\u0433\u0435\u0440'},
        {c:'\u{1F32E}',n:'taco \u0442\u0430\u043A\u043E'},{c:'\u{1F35C}',n:'noodles \u043B\u0430\u043F\u0448\u0430'},
        {c:'\u{1F363}',n:'sushi \u0441\u0443\u0448\u0438'},{c:'\u{1F369}',n:'donut \u043F\u043E\u043D\u0447\u0438\u043A'},
        {c:'\u{1F382}',n:'cake \u0442\u043E\u0440\u0442'},{c:'\u{1F366}',n:'ice cream \u043C\u043E\u0440\u043E\u0436\u0435\u043D\u043E\u0435'},
        {c:'\u2615',n:'coffee \u043A\u043E\u0444\u0435'},{c:'\u{1F375}',n:'tea \u0447\u0430\u0439'},
        {c:'\u{1F37A}',n:'beer \u043F\u0438\u0432\u043E'},{c:'\u{1F377}',n:'wine \u0432\u0438\u043D\u043E'},
        {c:'\u{1F942}',n:'champagne \u0448\u0430\u043C\u043F\u0430\u043D\u0441\u043A\u043E\u0435'}
      ]
    },

    {
      id: 'symbols_emo', label: '\u0421\u0438\u043C\u0432\u043E\u043B\u044B', icon: '\u{1F4AF}',
      chars: [
        {c:'\u2764\uFE0F',n:'heart \u0441\u0435\u0440\u0434\u0446\u0435'},{c:'\u{1F9E1}',n:'orange heart'},
        {c:'\u{1F49B}',n:'yellow heart'},{c:'\u{1F49A}',n:'green heart'},
        {c:'\u{1F499}',n:'blue heart'},{c:'\u{1F49C}',n:'purple heart'},
        {c:'\u{1F5A4}',n:'black heart'},{c:'\u{1F90D}',n:'white heart'},
        {c:'\u{1F494}',n:'broken heart \u0440\u0430\u0437\u0431\u0438\u0442\u043E\u0435 \u0441\u0435\u0440\u0434\u0446\u0435'},
        {c:'\u{1F495}',n:'two hearts \u0434\u0432\u0430 \u0441\u0435\u0440\u0434\u0446\u0430'},
        {c:'\u{1F496}',n:'sparkling heart \u0441\u0432\u0435\u0440\u043A\u0430\u044E\u0449\u0435\u0435 \u0441\u0435\u0440\u0434\u0446\u0435'},
        {c:'\u{1F498}',n:'cupid arrow heart \u0441\u0442\u0440\u0435\u043B\u0430 \u0441\u0435\u0440\u0434\u0446\u0435'},
        {c:'\u262E\uFE0F',n:'peace \u043C\u0438\u0440'},{c:'\u262F\uFE0F',n:'yin yang \u0438\u043D\u044C-\u044F\u043D\u044C'},
        {c:'\u2B50',n:'star \u0437\u0432\u0435\u0437\u0434\u0430'},{c:'\u{1F31F}',n:'glowing star \u044F\u0440\u043A\u0430\u044F \u0437\u0432\u0435\u0437\u0434\u0430'},
        {c:'\u2728',n:'sparkles \u0438\u0441\u043A\u0440\u044B'},{c:'\u{1F4A5}',n:'boom \u0432\u0437\u0440\u044B\u0432'},
        {c:'\u{1F389}',n:'party popper \u043A\u043E\u043D\u0444\u0435\u0442\u0442\u0438'},
        {c:'\u{1F388}',n:'balloon \u0448\u0430\u0440\u0438\u043A'},{c:'\u{1F514}',n:'bell \u043A\u043E\u043B\u043E\u043A\u043E\u043B'},
        {c:'\u{1F4AF}',n:'hundred points \u0441\u0442\u043E \u043E\u0447\u043A\u043E\u0432'},
        {c:'\u2705',n:'check mark \u0433\u0430\u043B\u043E\u0447\u043A\u0430'},{c:'\u274C',n:'cross mark \u043A\u0440\u0435\u0441\u0442'},
        {c:'\u26A0\uFE0F',n:'warning \u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435'},
        {c:'\u{1F6AB}',n:'no entry \u0437\u0430\u043F\u0440\u0435\u0442'},{c:'\u267B\uFE0F',n:'recycle \u043F\u0435\u0440\u0435\u0440\u0430\u0431\u043E\u0442\u043A\u0430'},
        {c:'\u{1F534}',n:'red circle'},{c:'\u{1F7E0}',n:'orange circle'},
        {c:'\u{1F7E1}',n:'yellow circle'},{c:'\u{1F7E2}',n:'green circle'},
        {c:'\u{1F535}',n:'blue circle'},{c:'\u{1F7E3}',n:'purple circle'},
        {c:'\u26AB',n:'black circle'},{c:'\u26AA',n:'white circle'}
      ]
    },

    {
      id: 'arrows', label: '\u0421\u0442\u0440\u0435\u043B\u043A\u0438', icon: '\u2192',
      chars: [
        {c:'\u2190',n:'\u043B\u0435\u0432\u043E left arrow'},{c:'\u2192',n:'\u0432\u043F\u0440\u0430\u0432\u043E right arrow'},
        {c:'\u2191',n:'\u0432\u0432\u0435\u0440\u0445 up arrow'},{c:'\u2193',n:'\u0432\u043D\u0438\u0437 down arrow'},
        {c:'\u2196',n:'\u0432\u043B\u0435\u0432\u043E-\u0432\u0432\u0435\u0440\u0445 upper left'},
        {c:'\u2197',n:'\u0432\u043F\u0440\u0430\u0432\u043E-\u0432\u0432\u0435\u0440\u0445 upper right'},
        {c:'\u2198',n:'\u0432\u043F\u0440\u0430\u0432\u043E-\u0432\u043D\u0438\u0437 lower right'},
        {c:'\u2199',n:'\u0432\u043B\u0435\u0432\u043E-\u0432\u043D\u0438\u0437 lower left'},
        {c:'\u2194',n:'\u0434\u0432\u0443\u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u0430\u044F left right'},
        {c:'\u2195',n:'\u0432\u0432\u0435\u0440\u0445-\u0432\u043D\u0438\u0437 up down'},
        {c:'\u21A9',n:'\u0432\u043E\u0437\u0432\u0440\u0430\u0442 leftwards hook'},
        {c:'\u21AA',n:'\u0432\u043F\u0435\u0440\u0451\u0434 rightwards hook'},
        {c:'\u21D0',n:'\u0434\u0432\u043E\u0439\u043D\u0430\u044F \u0432\u043B\u0435\u0432\u043E double left'},
        {c:'\u21D2',n:'\u0434\u0432\u043E\u0439\u043D\u0430\u044F \u0432\u043F\u0440\u0430\u0432\u043E double right'},
        {c:'\u21D1',n:'\u0434\u0432\u043E\u0439\u043D\u0430\u044F \u0432\u0432\u0435\u0440\u0445 double up'},
        {c:'\u21D3',n:'\u0434\u0432\u043E\u0439\u043D\u0430\u044F \u0432\u043D\u0438\u0437 double down'},
        {c:'\u21D4',n:'\u0434\u0432\u043E\u0439\u043D\u0430\u044F \u0434\u0432\u0443\u043D\u0430\u043F\u0440 double left right'},
        {c:'\u27F5',n:'\u0434\u043B\u0438\u043D\u043D\u0430\u044F \u0432\u043B\u0435\u0432\u043E long left'},
        {c:'\u27F6',n:'\u0434\u043B\u0438\u043D\u043D\u0430\u044F \u0432\u043F\u0440\u0430\u0432\u043E long right'},
        {c:'\u27F7',n:'\u0434\u043B\u0438\u043D\u043D\u0430\u044F \u0434\u0432\u0443\u043D\u0430\u043F\u0440 long left right'},
        {c:'\u27F9',n:'\u0434\u043B\u0438\u043D\u043D\u0430\u044F \u0434\u0432\u043E\u0439\u043D\u0430\u044F \u0432\u043F\u0440 long double right'},
        {c:'\u21BB',n:'\u043F\u043E \u0447\u0430\u0441\u043E\u0432\u043E\u0439 clockwise'},
        {c:'\u21BA',n:'\u043F\u0440\u043E\u0442\u0438\u0432 \u0447\u0430\u0441\u043E\u0432\u043E\u0439 counterclockwise'},
        {c:'\u2934',n:'\u0432\u0438\u0440\u0430\u0436 \u0432\u0432\u0435\u0440\u0445 curved up'},
        {c:'\u2935',n:'\u0432\u0438\u0440\u0430\u0436 \u0432\u043D\u0438\u0437 curved down'},
        {c:'\u27A4',n:'\u0437\u0430\u043A\u0440\u0430\u0448\u0435\u043D\u043D\u0430\u044F \u0432\u043F\u0440 filled right'},
        {c:'\u25B6',n:'\u0442\u0440\u0435\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A \u0432\u043F\u0440 right triangle'},
        {c:'\u25C0',n:'\u0442\u0440\u0435\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A \u0432\u043B\u0435\u0432 left triangle'},
        {c:'\u25B2',n:'\u0442\u0440\u0435\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A \u0432\u0432\u0435\u0440\u0445 up triangle'},
        {c:'\u25BC',n:'\u0442\u0440\u0435\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A \u0432\u043D\u0438\u0437 down triangle'}
      ]
    },

    {
      id: 'math', label: '\u041C\u0430\u0442\u0435\u043C\u0430\u0442\u0438\u043A\u0430', icon: '\u2211',
      chars: [
        {c:'\u00B1',n:'\u043F\u043B\u044E\u0441-\u043C\u0438\u043D\u0443\u0441 plus minus'},
        {c:'\u00D7',n:'\u0443\u043C\u043D\u043E\u0436\u0435\u043D\u0438\u0435 multiply'},
        {c:'\u00F7',n:'\u0434\u0435\u043B\u0435\u043D\u0438\u0435 divide'},
        {c:'\u2260',n:'\u043D\u0435 \u0440\u0430\u0432\u043D\u043E not equal'},
        {c:'\u2248',n:'\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E almost equal'},
        {c:'\u2261',n:'\u0442\u043E\u0436\u0434\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E identical'},
        {c:'\u2264',n:'\u043C\u0435\u043D\u044C\u0448\u0435 \u0438\u043B\u0438 \u0440\u0430\u0432\u043D\u043E less equal'},
        {c:'\u2265',n:'\u0431\u043E\u043B\u044C\u0448\u0435 \u0438\u043B\u0438 \u0440\u0430\u0432\u043D\u043E greater equal'},
        {c:'\u226A',n:'\u043C\u043D\u043E\u0433\u043E \u043C\u0435\u043D\u044C\u0448\u0435 much less'},
        {c:'\u226B',n:'\u043C\u043D\u043E\u0433\u043E \u0431\u043E\u043B\u044C\u0448\u0435 much greater'},
        {c:'\u221E',n:'\u0431\u0435\u0441\u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0441\u0442\u044C infinity'},
        {c:'\u2205',n:'\u043F\u0443\u0441\u0442\u043E\u0435 \u043C\u043D\u043E\u0436\u0435\u0441\u0442\u0432\u043E empty set'},
        {c:'\u2208',n:'\u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 element of'},
        {c:'\u2209',n:'\u043D\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 not element'},
        {c:'\u2282',n:'\u043F\u043E\u0434\u043C\u043D\u043E\u0436\u0435\u0441\u0442\u0432\u043E subset'},
        {c:'\u2283',n:'\u043D\u0430\u0434\u043C\u043D\u043E\u0436\u0435\u0441\u0442\u0432\u043E superset'},
        {c:'\u2229',n:'\u043F\u0435\u0440\u0435\u0441\u0435\u0447\u0435\u043D\u0438\u0435 intersection'},
        {c:'\u222A',n:'\u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 union'},
        {c:'\u2211',n:'\u0441\u0443\u043C\u043C\u0430 sum sigma'},
        {c:'\u220F',n:'\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 product'},
        {c:'\u221A',n:'\u043A\u043E\u0440\u0435\u043D\u044C square root'},
        {c:'\u221B',n:'\u043A\u0443\u0431\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043A\u043E\u0440\u0435\u043D\u044C cube root'},
        {c:'\u222B',n:'\u0438\u043D\u0442\u0435\u0433\u0440\u0430\u043B integral'},
        {c:'\u2202',n:'\u0447\u0430\u0441\u0442\u043D\u0430\u044F \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u043D\u0430\u044F partial'},
        {c:'\u2207',n:'\u043D\u0430\u0431\u043B\u0430 nabla'},
        {c:'\u03C0',n:'\u043F\u0438 pi'},{c:'\u03B1',n:'\u0430\u043B\u044C\u0444\u0430 alpha'},
        {c:'\u03B2',n:'\u0431\u0435\u0442\u0430 beta'},{c:'\u03B3',n:'\u0433\u0430\u043C\u043C\u0430 gamma'},
        {c:'\u03B4',n:'\u0434\u0435\u043B\u044C\u0442\u0430 delta'},{c:'\u03B5',n:'\u044D\u043F\u0441\u0438\u043B\u043E\u043D epsilon'},
        {c:'\u03BB',n:'\u043B\u044F\u043C\u0431\u0434\u0430 lambda'},{c:'\u03BC',n:'\u043C\u044E mu'},
        {c:'\u03C3',n:'\u0441\u0438\u0433\u043C\u0430 sigma'},{c:'\u03C6',n:'\u0444\u0438 phi'},
        {c:'\u03C9',n:'\u043E\u043C\u0435\u0433\u0430 omega'},{c:'\u03B8',n:'\u0442\u0435\u0442\u0430 theta'},
        {c:'\u00B0',n:'\u0433\u0440\u0430\u0434\u0443\u0441 degree'},
        {c:'\u2030',n:'\u043F\u0440\u043E\u043C\u0438\u043B\u043B\u0435 per mille'},
        {c:'\u00BC',n:'\u043E\u0434\u043D\u0430 \u0447\u0435\u0442\u0432\u0435\u0440\u0442\u0430\u044F one quarter'},
        {c:'\u00BD',n:'\u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0430 one half'},
        {c:'\u00BE',n:'\u0442\u0440\u0438 \u0447\u0435\u0442\u0432\u0435\u0440\u0442\u0438 three quarters'}
      ]
    },

    {
      id: 'typography', label: '\u0422\u0438\u043F\u043E\u0433\u0440\u0430\u0444\u0438\u043A\u0430', icon: '\u00AB',
      chars: [
        /* Кавычки — только \uXXXX, никаких литеральных символов внутри JS-строк */
        {c:'\u00AB',n:'\u0451\u043B\u043E\u0447\u043A\u0430 left guillemet'},
        {c:'\u00BB',n:'\u0451\u043B\u043E\u0447\u043A\u0430 right guillemet'},
        {c:'\u201C',n:'\u043B\u0435\u0432\u0430\u044F \u0434\u0432\u043E\u0439\u043D\u0430\u044F \u043A\u0430\u0432\u044B\u0447\u043A\u0430 left double quote'},
        {c:'\u201D',n:'\u043F\u0440\u0430\u0432\u0430\u044F \u0434\u0432\u043E\u0439\u043D\u0430\u044F \u043A\u0430\u0432\u044B\u0447\u043A\u0430 right double quote'},
        {c:'\u2018',n:'\u043B\u0435\u0432\u0430\u044F \u043E\u0434\u0438\u043D\u0430\u0440\u043D\u0430\u044F \u043A\u0430\u0432\u044B\u0447\u043A\u0430 left single quote'},
        {c:'\u2019',n:'\u043F\u0440\u0430\u0432\u0430\u044F \u043E\u0434\u0438\u043D\u0430\u0440\u043D\u0430\u044F \u043A\u0430\u0432\u044B\u0447\u043A\u0430 right single quote'},
        {c:'\u201E',n:'\u043D\u0438\u0436\u043D\u044F\u044F \u0434\u0432\u043E\u0439\u043D\u0430\u044F \u043A\u0430\u0432\u044B\u0447\u043A\u0430 double low quote'},
        {c:'\u201A',n:'\u043D\u0438\u0436\u043D\u044F\u044F \u043E\u0434\u0438\u043D\u0430\u0440\u043D\u0430\u044F \u043A\u0430\u0432\u044B\u0447\u043A\u0430 single low quote'},
        {c:'\u275D',n:'\u0442\u044F\u0436\u0451\u043B\u0430\u044F \u043A\u0430\u0432\u044B\u0447\u043A\u0430 heavy quotation open'},
        {c:'\u275E',n:'\u0442\u044F\u0436\u0451\u043B\u0430\u044F \u043A\u0430\u0432\u044B\u0447\u043A\u0430 heavy quotation close'},
        /* Тире и пунктуация */
        {c:'\u2014',n:'\u0434\u043B\u0438\u043D\u043D\u043E\u0435 \u0442\u0438\u0440\u0435 em dash'},
        {c:'\u2013',n:'\u0441\u0440\u0435\u0434\u043D\u0435\u0435 \u0442\u0438\u0440\u0435 en dash'},
        {c:'\u2010',n:'\u0434\u0435\u0444\u0438\u0441 hyphen'},
        {c:'\u2026',n:'\u043C\u043D\u043E\u0433\u043E\u0442\u043E\u0447\u0438\u0435 ellipsis'},
        {c:'\u00B7',n:'\u0441\u0440\u0435\u0434\u043D\u044F\u044F \u0442\u043E\u0447\u043A\u0430 middle dot'},
        {c:'\u2022',n:'\u043C\u0430\u0440\u043A\u0435\u0440 bullet'},
        {c:'\u25E6',n:'\u0431\u0435\u043B\u044B\u0439 \u043C\u0430\u0440\u043A\u0435\u0440 white bullet'},
        {c:'\u25B8',n:'\u043C\u0430\u043B\u044B\u0439 \u0442\u0440\u0435\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A small triangle'},
        /* Юридические */
        {c:'\u00A7',n:'\u043F\u0430\u0440\u0430\u0433\u0440\u0430\u0444 section'},
        {c:'\u00B6',n:'\u0430\u0431\u0437\u0430\u0446 pilcrow'},
        {c:'\u2020',n:'\u043A\u0438\u043D\u0436\u0430\u043B dagger'},
        {c:'\u2021',n:'\u0434\u0432\u043E\u0439\u043D\u043E\u0439 \u043A\u0438\u043D\u0436\u0430\u043B double dagger'},
        {c:'\u00A9',n:'\u0430\u0432\u0442\u043E\u0440\u0441\u043A\u043E\u0435 \u043F\u0440\u0430\u0432\u043E copyright'},
        {c:'\u00AE',n:'\u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043E registered'},
        {c:'\u2122',n:'\u0442\u043E\u0440\u0433\u043E\u0432\u0430\u044F \u043C\u0430\u0440\u043A\u0430 trademark'},
        {c:'\u2103',n:'\u0446\u0435\u043B\u044C\u0441\u0438\u0439 celsius'},
        {c:'\u2109',n:'\u0444\u0430\u0440\u0435\u043D\u0433\u0435\u0439\u0442 fahrenheit'},
        {c:'\u2116',n:'\u043D\u043E\u043C\u0435\u0440 numero'},
        {c:'\u203C',n:'\u0434\u0432\u043E\u0439\u043D\u043E\u0439 \u0432\u043E\u0441\u043A\u043B \u0437\u043D\u0430\u043A double exclamation'},
        {c:'\u2049',n:'\u0432\u043E\u0441\u043A\u043B-\u0432\u043E\u043F\u0440\u043E\u0441 exclamation question'},
        /* Невидимые */
        {c:'\u00AD',n:'\u043C\u044F\u0433\u043A\u0438\u0439 \u043F\u0435\u0440\u0435\u043D\u043E\u0441 soft hyphen'},
        {c:'\u200B',n:'\u043D\u0443\u043B\u0435\u0432\u043E\u0439 \u043F\u0440\u043E\u0431\u0435\u043B zero width space'},
        {c:'\u00A0',n:'\u043D\u0435\u0440\u0430\u0437\u0440\u044B\u0432\u043D\u044B\u0439 \u043F\u0440\u043E\u0431\u0435\u043B non breaking space'}
      ]
    },

    {
      id: 'currency', label: '\u0412\u0430\u043B\u044E\u0442\u044B', icon: '\u20AC',
      chars: [
        {c:'\u0024',n:'\u0434\u043E\u043B\u043B\u0430\u0440 dollar'},{c:'\u20AC',n:'\u0435\u0432\u0440\u043E euro'},
        {c:'\u00A3',n:'\u0444\u0443\u043D\u0442 pound'},{c:'\u00A5',n:'\u0438\u0435\u043D\u0430 yen'},
        {c:'\u20BD',n:'\u0440\u0443\u0431\u043B\u044C ruble'},{c:'\u20BF',n:'\u0431\u0438\u0442\u043A\u043E\u0438\u043D bitcoin'},
        {c:'\u20B4',n:'\u0433\u0440\u0438\u0432\u043D\u0430 hryvnia'},{c:'\u20B8',n:'\u0442\u0435\u043D\u0433\u0435 tenge'},
        {c:'\u20BA',n:'\u043B\u0438\u0440\u0430 lira'},{c:'\u20A9',n:'\u0432\u043E\u043D\u0430 won'},
        {c:'\u20B9',n:'\u0440\u0443\u043F\u0438\u044F rupee'},{c:'\u20A6',n:'\u043D\u0430\u0439\u0440\u0430 naira'},
        {c:'\u0E3F',n:'\u0431\u0430\u0442 baht'},{c:'\u20AB',n:'\u0434\u043E\u043D\u0433 dong'},
        {c:'\u00A2',n:'\u0446\u0435\u043D\u0442 cent'},{c:'\u00A4',n:'\u0432\u0430\u043B\u044E\u0442\u0430 currency sign'},
        {c:'\u20A1',n:'\u043A\u043E\u043B\u043E\u043D colon'},{c:'\u20AD',n:'\u043A\u0438\u043F kip'},
        {c:'\u20AE',n:'\u0442\u0443\u0433\u0440\u0438\u043A tugrik'},{c:'\u20B1',n:'\u043F\u0435\u0441\u043E peso'},
        {c:'\u20B2',n:'\u0433\u0443\u0430\u0440\u0430\u043D\u0438 guarani'},{c:'\u20B5',n:'\u0441\u0435\u0434\u0438 cedi'},
        {c:'\u20BC',n:'\u043C\u0430\u043D\u0430\u0442 manat'},{c:'\u20BE',n:'\u043B\u0430\u0440\u0438 lari'},
        {c:'\uFDFC',n:'\u0440\u0438\u044F\u043B rial'}
      ]
    },

    {
      id: 'diacritics', label: '\u0410\u043A\u0446\u0435\u043D\u0442\u044B', icon: '\u00C0',
      chars: [
        {c:'\u00C0',n:'A grave'},{c:'\u00C1',n:'A acute'},{c:'\u00C2',n:'A circumflex'},
        {c:'\u00C3',n:'A tilde'},{c:'\u00C4',n:'A umlaut'},{c:'\u00C5',n:'A ring'},
        {c:'\u00C6',n:'AE ligature'},{c:'\u00C7',n:'C cedilla'},
        {c:'\u00C8',n:'E grave'},{c:'\u00C9',n:'E acute'},{c:'\u00CA',n:'E circumflex'},
        {c:'\u00CB',n:'E umlaut'},{c:'\u00CC',n:'I grave'},{c:'\u00CD',n:'I acute'},
        {c:'\u00CE',n:'I circumflex'},{c:'\u00CF',n:'I umlaut'},
        {c:'\u00D1',n:'N tilde'},{c:'\u00D2',n:'O grave'},{c:'\u00D3',n:'O acute'},
        {c:'\u00D4',n:'O circumflex'},{c:'\u00D5',n:'O tilde'},{c:'\u00D6',n:'O umlaut'},
        {c:'\u00D8',n:'O slash'},{c:'\u00D9',n:'U grave'},{c:'\u00DA',n:'U acute'},
        {c:'\u00DB',n:'U circumflex'},{c:'\u00DC',n:'U umlaut'},{c:'\u00DD',n:'Y acute'},
        {c:'\u00DF',n:'eszett sharp s'},{c:'\u00E0',n:'a grave'},{c:'\u00E1',n:'a acute'},
        {c:'\u00E2',n:'a circumflex'},{c:'\u00E3',n:'a tilde'},{c:'\u00E4',n:'a umlaut'},
        {c:'\u00E5',n:'a ring'},{c:'\u00E6',n:'ae ligature'},{c:'\u00E7',n:'c cedilla'},
        {c:'\u00E8',n:'e grave'},{c:'\u00E9',n:'e acute'},{c:'\u00EA',n:'e circumflex'},
        {c:'\u00EB',n:'e umlaut'},{c:'\u00F1',n:'n tilde'},{c:'\u00F6',n:'o umlaut'},
        {c:'\u00FC',n:'u umlaut'},{c:'\u0151',n:'o double acute'},{c:'\u0171',n:'u double acute'},
        {c:'\u0153',n:'oe ligature'},{c:'\u0161',n:'s caron'},{c:'\u017E',n:'z caron'},
        {c:'\u010D',n:'c caron'},{c:'\u0159',n:'r caron'},{c:'\u011B',n:'e caron'},
        {c:'\u016F',n:'u ring'},{c:'\u0105',n:'a ogonek'},{c:'\u0119',n:'e ogonek'},
        {c:'\u015B',n:'s acute'},{c:'\u017A',n:'z acute'},{c:'\u017C',n:'z dot'},
        {c:'\u0142',n:'l stroke'}
      ]
    }
  ];

  /* ================================================================
     УТИЛИТЫ
     ================================================================ */
  function insertAtCursor(el, text) {
    var start = el.selectionStart;
    var end   = el.selectionEnd;
    el.value  = el.value.slice(0, start) + text + el.value.slice(end);
    var pos   = start + text.length;
    el.selectionStart = el.selectionEnd = pos;
    $(el).trigger('input').trigger('change');
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  /* ================================================================
     МОДУЛЬ ТРАНСЛИТЕРАЦИИ РАСКЛАДКИ КЛАВИАТУРЫ
     ----------------------------------------------------------------
     Проблема: пользователь ищет «сердце», но у него включена латинская
     раскладка и он набирает «cthwwt» (каждая кнопка — её русский эквивалент).
     Или наоборот: ищет «arrow», но набирает «фккщц» в кириллице.

     Решение: перед поиском строим список «вариантов» запроса:
       1. Оригинальный запрос (как есть).
       2. Конвертация латиница → кириллица (пользователь набирал русское
          слово, но раскладка была английской).
       3. Конвертация кириллица → латиница (пользователь набирал английское
          слово, но раскладка была русской).

     По всем вариантам ищем в n-строке символа, результаты объединяем
     без дубликатов. Порядок совпадений: сначала по оригиналу, затем
     по транслитам — так «правильный» ввод всегда идёт первым.

     Поддерживаемые раскладки:
       - Стандартная русская ЙЦУКЕН (Windows / macOS / Linux)
       - Стандартная английская QWERTY

     Дополнительные символы (`[`, `]`, `;`, `'` и пр.) также учтены,
     так как они используются в именах символов (например «left bracket»).
     ================================================================ */

  /**
   * Таблица соответствия клавиш: латиница (QWERTY) → кириллица (ЙЦУКЕН).
   * Ключ   — латинский символ в нижнем регистре.
   * Значение — кириллический символ, который стоит на той же физической клавише.
   *
   * Источник: стандартная Russian PC keyboard layout (ГОСТ Р 52659–2006).
   */
  var _LAT_TO_CYR = {
    'q':'\u0439', 'w':'\u0446', 'e':'\u0443', 'r':'\u043a', 't':'\u0435',
    'y':'\u043d', 'u':'\u0433', 'i':'\u0448', 'o':'\u0449', 'p':'\u0437',
    '[':'\u0445', ']':'\u044a',
    'a':'\u0444', 's':'\u044b', 'd':'\u0432', 'f':'\u0430', 'g':'\u043f',
    'h':'\u0440', 'j':'\u043e', 'k':'\u043b', 'l':'\u0434', ';':'\u0436',
    "'":'\u044d',
    'z':'\u044f', 'x':'\u0447', 'c':'\u0441', 'v':'\u043c', 'b':'\u0438',
    'n':'\u0442', 'm':'\u044c', ',':'\u0431', '.':'\u044e'
    /*
     * Клавиша «ё» (\u0451) находится на `~, но в именах символов она
     * встречается редко, поэтому опущена — при необходимости добавьте:
     * '`': '\u0451'
     */
  };

  /**
   * Обратная таблица: кириллица → латиница.
   * Строится автоматически из _LAT_TO_CYR, чтобы не дублировать данные
   * и исключить ошибки рассинхронизации таблиц.
   */
  var _CYR_TO_LAT = (function () {
    var map = {};
    for (var lat in _LAT_TO_CYR) {
      if (_LAT_TO_CYR.hasOwnProperty(lat)) {
        map[_LAT_TO_CYR[lat]] = lat; // кириллический символ → латинский
      }
    }
    return map;
  }());

  /**
   * Конвертирует строку посимвольно по заданной таблице.
   * Символы, которых нет в таблице, остаются без изменений
   * (например, цифры, пробелы, уже «правильные» символы).
   *
   * @param  {string} str   Исходная строка
   * @param  {Object} table Таблица замен { from: to, … }
   * @return {string}       Строка после конвертации
   */
  function _convertLayout(str, table) {
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var ch  = str[i];
      var key = ch.toLowerCase(); // таблицы хранят только нижний регистр
      out += table.hasOwnProperty(key) ? table[key] : ch;
      /*
       * Регистр при конвертации намеренно не восстанавливается:
       * поиск в _doSearch всегда ведётся в нижнем регистре (toLowerCase),
       * поэтому сохранять оригинальный регистр нет смысла.
       */
    }
    return out;
  }

  /**
   * Возвращает массив уникальных вариантов запроса для поиска.
   *
   * Пример 1 — пользователь хотел написать «сердце», но раскладка EN:
   *   input:   'cthwwt'  (латиница)
   *   вариант 1: 'cthwwt'           — оригинал (ничего не найдёт)
   *   вариант 2: 'сердце'           — после lat→cyr (найдёт!)
   *   вариант 3: конвертация cy→lat не применима (входные данные — латиница)
   *
   * Пример 2 — пользователь хотел написать «arrow», но раскладка RU:
   *   input:   'фккщц'  (кириллица)
   *   вариант 1: 'фккщц'            — оригинал (не найдёт)
   *   вариант 2: lat→cyr не применима (входные данные — кириллица)
   *   вариант 3: 'arrow'            — после cyr→lat (найдёт!)
   *
   * Пример 3 — пользователь пишет правильно «heart»:
   *   input:   'heart'
   *   вариант 1: 'heart'            — оригинал (найдёт сразу)
   *   вариант 2: 'рейкт'            — после lat→cyr (не найдёт, но это не ошибка)
   *   Итог: дубликатов нет, поиск корректен.
   *
   * @param  {string}   q  Запрос в нижнем регистре
   * @return {string[]}    Массив вариантов, начиная с оригинала
   */
  function _queryVariants(q) {
    var variants = [q]; // вариант 0 — оригинальный запрос

    // Вариант 1: предположим, что пользователь набирал кириллицу
    // в латинской раскладке → конвертируем lat→cyr
    var asCyr = _convertLayout(q, _LAT_TO_CYR);
    if (asCyr !== q) {
      variants.push(asCyr);
    }

    // Вариант 2: предположим, что пользователь набирал латиницу
    // в кириллической раскладке → конвертируем cyr→lat
    var asLat = _convertLayout(q, _CYR_TO_LAT);
    if (asLat !== q && asLat !== asCyr) {
      variants.push(asLat);
    }

    return variants;
    /*
     * Итоговый массив содержит 1–3 строки (дубликаты исключены).
     * _doSearch проверяет каждый вариант против item.n и объединяет
     * результаты, удаляя дубликаты по item.c.
     */
  }

  /* ================================================================
     ПЛАГИН
     ================================================================ */
  var pluginName = 'charPicker';
  var dataKey    = 'cp-instance';

  function CharPicker(el, options) {
    this.$el     = $(el);
    this.el      = el;
    this.options = $.extend({}, CharPicker.defaults, options);
    this._open   = false;
    this._curTab = null;

    _globalRecentMax = this.options.recentMax;
    this._groups = this._filterGroups();
    this._init();
  }

  CharPicker.defaults = {
    recentMax : 32,
    position  : 'auto',   // 'auto' | 'top' | 'bottom'
    /**
     * panels: null              — показать все панели
     * panels: ['smileys','math'] — только эти
     * panels: []                — ни одной (только «Недавние» если были)
     *
     * Доступные id панелей:
     *   smileys, gestures, nature, food, symbols_emo,
     *   arrows, math, typography, currency, diacritics
     * (Панель 'recent' добавляется автоматически при наличии истории)
     */
    panels    : null,
    onOpen    : null,
    onClose   : null,
    onSelect  : null
  };

  CharPicker.prototype = {

    _filterGroups: function () {
      var panels = this.options.panels;
      if (!panels) { return GROUPS; }
      return $.grep(GROUPS, function (g) {
        return g.id === 'recent' || $.inArray(g.id, panels) !== -1;
      });
    },

    _init: function () {
      var self = this;

      this.$wrapper = $('<span class="jcp"></span>');
      this.$el.before(this.$wrapper);
      this.$wrapper.append(this.$el);

      this.$trigger = $('<button type="button" class="jcp__trigger" aria-haspopup="dialog" aria-expanded="false"></button>');
      this.$trigger.attr('title', '\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0441\u0438\u043C\u0432\u043E\u043B \u0438\u043B\u0438 \u044D\u043C\u043E\u0434\u0437\u0438');
      this.$trigger.html(
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
          '<circle cx="12" cy="12" r="10"/>' +
          '<path d="M8 14s1.5 2 4 2 4-2 4-2"/>' +
          '<line x1="9" y1="9" x2="9.01" y2="9"/>' +
          '<line x1="15" y1="9" x2="15.01" y2="9"/>' +
        '</svg>'
      );
      this.$wrapper.append(this.$trigger);

      this.$tooltip = $('<div class="jcp__tooltip" role="tooltip"></div>');
      $('body').append(this.$tooltip);

      this._buildPopup();

      this.$trigger.on('click.cp', function (e) {
        e.stopPropagation();
        self._toggle();
      });

      $(document).on('click.cp.' + this._uid(), function (e) {
        if (self._open && !$(e.target).closest(self.$popup).length) {
          self.close();
        }
      });

      $(document).on('keydown.cp.' + this._uid(), function (e) {
        if (self._open && e.key === 'Escape') {
          self.close();
          self.$trigger.focus();
        }
      });

      $(window).on('scroll.cp.' + this._uid() + ' resize.cp.' + this._uid(), function () {
        if (self._open) { self.close(); }
      });
    },

    _uid: function () {
      if (!this.__uid) {
        this.__uid = 'cp' + Math.random().toString(36).slice(2, 8);
      }
      return this.__uid;
    },

    _buildPopup: function () {
      var self = this;

      this.$popup = $('<div class="jcp__popup" role="dialog" aria-modal="true"></div>');
      this.$popup.attr('aria-label', '\u0412\u044B\u0431\u043E\u0440 \u0441\u0438\u043C\u0432\u043E\u043B\u0430');

      var $sw = $('<div class="jcp__search"></div>');
      this.$search = $('<input type="search" class="jcp__search-input" autocomplete="off" spellcheck="false">');
      this.$search.attr('placeholder', '\u041F\u043E\u0438\u0441\u043A\u2026');
      $sw.append(this.$search);
      this.$popup.append($sw);

      this.$tabs = $('<div class="jcp__tabs" role="tablist"></div>');
      this.$popup.append(this.$tabs);

      this.$body = $('<div class="jcp__body"></div>');
      this.$popup.append(this.$body);

      $.each(this._groups, function (i, group) {
        if (group.id === 'recent') { return; }
        self.$tabs.append(
          $('<div class="jcp__tab" role="tab" tabindex="0"></div>')
            .attr('data-group', group.id)
            .attr('title', group.label)
            .text(group.icon)
        );
      });

      // Активировать первую доступную вкладку
      var firstId = null;
      $.each(this._groups, function (i, g) {
        if (g.id !== 'recent') { firstId = g.id; return false; }
      });
      if (firstId) { this._selectTab(firstId); }

      this.$search.on('input.cp', debounce(function () {
        self._doSearch($.trim($(this).val()));
      }, 200));

      this.$tabs.on('click.cp keydown.cp', '.jcp__tab', function (e) {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') { return; }
        self.$search.val('');
        self._selectTab($(this).data('group'));
      });

      this.$body.on('click.cp', '.jcp__char', function () {
        self._insertChar($(this).data('char'), $(this).data('name'));
      });

      this.$body.on('mouseover.cp', '.jcp__char', function (e) {
        var n = $(this).data('name') || '';
        if (n) { self.$tooltip.text(n).addClass('jcp__tooltip--visible'); self._posTooltip(e); }
      });
      this.$body.on('mousemove.cp', '.jcp__char', function (e) { self._posTooltip(e); });
      this.$body.on('mouseleave.cp', '.jcp__char', function () { self.$tooltip.removeClass('jcp__tooltip--visible'); });

      $('body').append(this.$popup);
      this.$popup.hide();
    },

    _posTooltip: function (e) {
      this.$tooltip.css({ left: e.clientX + 12, top: e.clientY - 28 });
    },

    _selectTab: function (gid) {
      this._curTab = gid;
      this.$tabs.find('.jcp__tab').removeClass('jcp__tab--active');
      this.$tabs.find('[data-group="' + gid + '"]').addClass('jcp__tab--active');
      this._renderGroup(gid);
    },

    _renderGroup: function (gid) {
      this.$body.empty();

      var group = null;
      $.each(this._groups, function (i, g) {
        if (g.id === gid) { group = g; return false; }
      });
      if (!group) { return; }

      // Недавние — всегда из глобального хранилища
      if (gid !== 'recent' && _globalRecent.length > 0) {
        this.$body.append(this._sectionTitle('\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435'));
        this.$body.append(this._makeGrid(_globalRecent));
      }

      var chars = (gid === 'recent') ? _globalRecent : group.chars;

      if (gid === 'recent' && chars.length === 0) {
        this.$body.append($('<div class="jcp__empty">\u0412\u044B \u0435\u0449\u0451 \u043D\u0435 \u0432\u044B\u0431\u0438\u0440\u0430\u043B\u0438 \u0441\u0438\u043C\u0432\u043E\u043B\u044B</div>'));
        return;
      }

      if (gid !== 'recent') {
        this.$body.append(this._sectionTitle(group.label));
      }
      this.$body.append(this._makeGrid(chars));
    },

    _sectionTitle: function (text) {
      return $('<div class="jcp__section-title"></div>').text(text);
    },

    _makeGrid: function (chars) {
      var $g = $('<div class="jcp__grid"></div>');
      $.each(chars, function (i, item) {
        var $ch = $('<div class="jcp__char" tabindex="0" role="button"></div>');
        $ch.data('char', item.c).data('name', item.n).attr('aria-label', item.n);
        $ch[0].appendChild(document.createTextNode(item.c));
        if (/^[\u0000-\u00FF\u2000-\u27FF]/.test(item.c)) { $ch.addClass('jcp__char--sym'); }
        $g.append($ch);
      });
      return $g;
    },

    _doSearch: function (query) {
      this.$body.empty();
      if (!query) { this._renderGroup(this._curTab); return; }

      var q = query.toLowerCase();

      /*
       * ── Поиск с учётом раскладки клавиатуры ──────────────────────
       *
       * _queryVariants(q) возвращает массив из 1–3 строк:
       *   [0] q           — оригинальный запрос (как ввёл пользователь)
       *   [1] lat→cyr     — если пользователь набирал русское в EN-раскладке
       *   [2] cyr→lat     — если пользователь набирал английское в RU-раскладке
       *
       * Мы перебираем все варианты и объединяем совпадения в один массив.
       * Порядок результатов: сначала совпавшие по оригиналу, затем —
       * найденные только благодаря конвертации раскладки.
       * Дубликаты исключаются через хэш-таблицу seen{}.
       */
      var variants = _queryVariants(q); // ['cthwwt', 'сердце'] или ['heart', 'рейкт']

      var res  = [];
      var seen = {};

      /*
       * Внешний цикл — по вариантам запроса.
       * Важно: обходим варианты в порядке [оригинал, конвертации],
       * чтобы символы, найденные «правильным» написанием, шли первыми.
       */
      $.each(variants, function (vi, variant) {
        /*
         * Внутренний цикл — по группам и символам.
         * Пропускаем 'recent' — история не индексируется повторно.
         */
        $.each(this._groups, function (i, group) {
          if (group.id === 'recent') { return; }
          $.each(group.chars, function (j, item) {
            if (seen[item.c]) { return; } // уже добавлен по другому варианту

            var name = item.n.toLowerCase();

            var match =
              name.indexOf(variant) !== -1  // имя содержит вариант запроса
              || item.c === query;           // либо символ точно совпадает с оригиналом

            if (match) {
              res.push(item);
              seen[item.c] = true;
            }
          });
        }.bind(this));
      }.bind(this));

      /*
       * Подсказка о раскладке: показываем только если нашли результаты
       * НЕ по оригинальному запросу (т.е. конвертация помогла).
       * Для этого проверяем, есть ли совпадения по оригиналу отдельно.
       */
      var origRes  = [];
      var origSeen = {};
      $.each(this._groups, function (i, group) {
        if (group.id === 'recent') { return; }
        $.each(group.chars, function (j, item) {
          if (!origSeen[item.c] &&
              (item.n.toLowerCase().indexOf(q) !== -1 || item.c === query)) {
            origRes.push(item);
            origSeen[item.c] = true;
          }
        });
      });

      /*
       * Флаг: результаты получены «вслепую» (только благодаря конвертации).
       * Используется для формирования заголовка секции с пояснением.
       */
      var layoutHelped = res.length > 0 && origRes.length === 0;

      if (!res.length) {
        this.$body.append($('<div class="jcp__empty">\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u{1F50D}</div>'));
        return;
      }

      /*
       * Заголовок: если раскладка «помогла» — указываем,
       * что поиск выполнен по сконвертированному запросу.
       * Это помогает пользователю понять, почему нашлось то, что нашлось.
       */
      var title = layoutHelped
        ? '\u0420\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430: ' + res.length  // «Раскладка: N»
        : '\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B: ' + res.length; // «Результаты: N»

      this.$body.append(this._sectionTitle(title));

      /*
       * Если поиск сработал благодаря конвертации раскладки —
       * добавляем ненавязчивую подсказку под заголовком,
       * чтобы пользователь понял, что произошло автоматически.
       * Подсказка показывается только один раз за сессию поиска
       * и не блокирует результаты.
       */
      if (layoutHelped) {
        var hint = $('<div class="jcp__layout-hint"></div>');
        // Показываем какой вариант запроса реально сработал:
        // берём первый вариант, отличающийся от оригинала
        var variants2 = _queryVariants(q);
        var usedVariant = variants2.length > 1 ? variants2[1] : q;
        hint.text('\u2139\uFE0F \u0420\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430: \u00AB' + usedVariant + '\u00BB');
        // «ℹ️ Раскладка: «сердце»»
        this.$body.append(hint);
      }

      this.$body.append(this._makeGrid(res));
    },

    _insertChar: function (c, n) {
      // Обновить глобальную историю
      globalAddRecent({ c: c, n: n }, this.options.recentMax);

      // Вкладка «Недавние» — добавить если панель разрешена
      var hasRecent = false;
      $.each(this._groups, function (i, g) { if (g.id === 'recent') { hasRecent = true; return false; } });
      if (hasRecent) { this._ensureRecentTab(); }

      this.el.focus();
      insertAtCursor(this.el, c);

      if (typeof this.options.onSelect === 'function') {
        this.options.onSelect.call(this.el, c, n);
      }
      this.$tooltip.removeClass('jcp__tooltip--visible');
    },

    _ensureRecentTab: function () {
      if (!this.$tabs.find('[data-group="recent"]').length) {
        this.$tabs.prepend(
          $('<div class="jcp__tab" role="tab" tabindex="0"></div>')
            .attr('data-group', 'recent')
            .attr('title', '\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435')
            .text('\u{1F550}')
        );
      }
    },

    _positionPopup: function () {
      var o  = this.$trigger.offset();
      var tH = this.$trigger.outerHeight();
      var pH = this.$popup.outerHeight();
      var pW = this.$popup.outerWidth();
      var wH = $(window).height();
      var wW = $(window).width();
      var sT = $(window).scrollTop();

      var pos = this.options.position;
      if (pos === 'auto') {
        pos = (wH + sT - o.top - tH < pH && o.top - sT > wH + sT - o.top - tH) ? 'top' : 'bottom';
      }

      var top      = (pos === 'top') ? o.top - pH - 6 : o.top + tH + 6;
      var posClass = (pos === 'top') ? 'jcp__popup--pos-top' : 'jcp__popup--pos-bottom';
      var left     = o.left;

      if (left + pW > wW - 10) { left = Math.max(10, wW - pW - 10); posClass += ' jcp__popup--pos-right'; }

      this.$popup.removeClass('jcp__popup--pos-bottom jcp__popup--pos-top jcp__popup--pos-right').addClass(posClass).css({ top: top, left: left });
    },

    open: function () {
      if (this._open) { return; }
      this._open = true;
      this.$trigger.addClass('jcp__trigger--active').attr('aria-expanded', 'true');
      this.$popup.show();
      this._positionPopup();
      this.$search.val('').focus();
      var startTab = this._curTab;
      if (!startTab) {
        $.each(this._groups, function (i, g) { if (g.id !== 'recent') { startTab = g.id; return false; } });
      }
      this._renderGroup(startTab || 'smileys');
      if (typeof this.options.onOpen === 'function') { this.options.onOpen.call(this.el); }
    },

    close: function () {
      if (!this._open) { return; }
      this._open = false;
      this.$trigger.removeClass('jcp__trigger--active').attr('aria-expanded', 'false');
      this.$popup.hide();
      this.$tooltip.removeClass('jcp__tooltip--visible');
      if (typeof this.options.onClose === 'function') { this.options.onClose.call(this.el); }
    },

    _toggle: function () { this._open ? this.close() : this.open(); },

    destroy: function () {
      this.close();
      $(document).off('click.cp.' + this._uid() + ' keydown.cp.' + this._uid());
      $(window).off('scroll.cp.' + this._uid() + ' resize.cp.' + this._uid());
      this.$wrapper.before(this.$el);
      this.$wrapper.remove();
      this.$popup.remove();
      this.$tooltip.remove();
      this.$el.removeData(dataKey);
    }
  };

  /* ================================================================
     $.fn
     ================================================================ */
  $.fn[pluginName] = function (optionsOrMethod) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this.each(function () {
      var inst = $(this).data(dataKey);
      if (typeof optionsOrMethod === 'string') {
        if (inst && typeof inst[optionsOrMethod] === 'function') {
          inst[optionsOrMethod].apply(inst, args);
        } else {
          $.error('jQuery.' + pluginName + ': \u043C\u0435\u0442\u043E\u0434 "' + optionsOrMethod + '" \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D');
        }
      } else if (!inst) {
        $(this).data(dataKey, new CharPicker(this, optionsOrMethod));
      }
    });
  };

}(jQuery));
