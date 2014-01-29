(function ($, document) {

  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  $.fn.quickpicker = function(options) {
    var now = new Date();

    var settings = $.extend({
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      hideOnPick: true,
      visibleOnLoad: false
    }, options);

    var header = $('<div>').addClass('qck-header'),
        units = $('<div>').addClass('qck-units'),
        display = $('<div>').addClass('qck-display'),
        picker = $('<div>').addClass('qck-picker').append(header).append(units),
        container = this.append(display).append(picker);

    if (!container.hasClass('quickpicker')) container.addClass('quickpicker');

    for (var i=0; i<3; i++) {
      var baseDate = new Date(settings.start.getFullYear(), settings.start.getMonth(), 1);
      units.append(createUnit(d8(baseDate).add(i, 'Month')));
    }

    selectRange(settings.start, settings.end);
    picker.append(pagination());
    makeSelectable();
    updateHeader();

    display.click(function () {
      picker.toggle();
    });

    if (settings.visibleOnLoad) picker.show();

    function pick(start, end) {
      if (settings.hideOnPick) picker.hide();
      if (sameMonth(start, end)) display.html(d8(start).format('m d') + ' - ' + d8(end).format('d, Y'));
      else if (sameYear(start, end)) display.html(d8(start).format('m d') + ' - ' + d8(end).format('m d, Y'));
      else display.html(d8(start).format('m d, Y') + ' - ' + d8(end).format('m d, Y'));
    }

    function updateHeader() {
      var visibleUnits = units.find('.qck-unit:not([style="display: none;"])'),
          start = new Date(visibleUnits.find('.qck-day').first().data('qck-timestamp')),
          end = new Date(visibleUnits.find('.qck-day').last().data('qck-timestamp'));
      header.html(sameYear(start, end) ? start.getFullYear() : (start.getFullYear() + ' - ' + end.getFullYear()));
    }

    function sameYear(start, end) {
      return start.getFullYear() === end.getFullYear();
    }

    function sameMonth(start, end) {
      return sameYear(start, end) && start.getMonth() === end.getMonth();
    }

    function pagination() {
      var fragment = $('<div>'),
          back = $('<div>').addClass('qck-navigate qck-back').click(backHandler),
          forward = $('<div>').addClass('qck-navigate qck-forward').click(forwardHandler);
      return fragment.append(back).append(forward).children();
    }

    function selectRange(start, end) {
      pick(start, end);
      picker.find('.qck-day').filter(function (i, day) {
        return d8($(day).data('qck-timestamp')).between(start, end);
      }).addClass('qck-selected');
    }

    function findUnit(date) {
      return units.find('.qck-unit[data-index=' + d8(date).format('Y-m') + ']');
    }

    function createUnit(date) {
      var title = $('<div>').addClass('qck-title').html(d8(date).format('m'));
      return unit = $('<div>').addClass('qck-unit').attr('data-index', d8(date).format('Y-m')).append(title).append(createBody(date));
    }

    function createBody(date) {
      return $('<div>').addClass('qck-body').append(weekDays()).append(prevMonthDays(date)).append(monthDays(date));
    }

    function weekDays() {
      var fragment = $('<div>'), weekDay = lastSunday();
      for (var nextSunday = d8(weekDay).add(7, 'Date'); weekDay.getDate() !== nextSunday.getDate(); weekDay = d8(weekDay).add(1, 'Date'))
        fragment.append($('<div>').html(d8(weekDay).format('w')));
      return fragment.children();
    }

    function prevMonthDays(date) {
      var fragment = $('<div>'), day = firstDayOfTheMonth(date);
      for (var i=0; i < day.getDay(); i++)
        fragment.append($('<div>'));
      return fragment.children();
    }

    function monthDays(date) {
      var fragment = $('<div>'), day = firstDayOfTheMonth(date);
      for (var month = day.getMonth(); month === day.getMonth(); day = d8(day).add(1, 'Date'))
        fragment.append($('<div>').addClass('qck-day').data('qck-timestamp', day.getTime()).html(day.getDate()));
      return fragment.children();
    }

    function firstDayOfTheMonth(date) {
      return new Date(new Date(date).setDate(1));
    }

    function lastSunday() {
      var today = new Date();
      return d8(today).add(-1 * today.getDay(), 'Date');
    }

    function makeSelectable() {
      picker.delegate('.qck-day', 'click', dayClickHandler);
      picker.delegate('.qck-day', 'mouseover', dayMouseoverHandler);
    }

    function dayClickHandler() {
      var selecting = picker.data('qck-selecting');
      selecting ? stopSelection() : startSelection(picker.find('.qck-day'), $(this));
      picker.data('qck-selecting', !selecting);
    }

    function dayMouseoverHandler() {
      if (picker.data('qck-selecting')) expandSelection(picker.find('.qck-day'), $(this));
    }

    function startSelection(days, first) {
      days.removeClass('qck-first qck-selected');
      first.addClass('qck-first qck-selected');
      picker.addClass('qck-selecting');
    }

    function stopSelection() {
      var range = findSelectionRange();
      picker.find('.qck-first.qck-selected').removeClass('qck-first');
      picker.removeClass('qck-selecting').data('qck-selecting', false);
      pick(range.start, range.end);
    }

    function expandSelection(days, last) {
      var first = picker.find('.qck-first.qck-selected');
      startSelection(days, first);
      days.filter(function (i, day) {
        var time = $(day).data('qck-timestamp'), firstTime = first.data('qck-timestamp'), lastTime = last.data('qck-timestamp');
        return (time >= firstTime && time <= lastTime) || (time <= firstTime && time >= lastTime);
      }).addClass('qck-selected');
    }

    function findSelectionRange() {
      var range = picker.find('.qck-selected');
      return { start: new Date(range.first().data('qck-timestamp')), end: new Date(range.last().data('qck-timestamp')) };
    }

    function backHandler() {
      paginate(-1, units.find('.qck-unit:visible').first(), 'prepend', function (date) {
        units.find('.qck-unit:visible').last().hide();
        updateHeader();
      });
    }

    function forwardHandler() {
      paginate(1, units.find('.qck-unit:visible').last(), 'append', function (date) {
        units.find('.qck-unit:visible').first().hide();
        updateHeader();
      });
    }

    function paginate(diff, hidingUnit, method, callback) {
      var timestamp = hidingUnit.find('.qck-day').first().data('qck-timestamp'),
          date = d8(timestamp).add(diff, 'Month'), unit = findUnit(date);
      if (unit.size() > 0) unit.show();
      else units[method](createUnit(date));
      callback(date);
    }

    return picker;
  };

  function d8(date) {
    var dateCopy = new Date(date);

    return {
      add: function(value, attribute) {
        var originalValue = dateCopy['get' + attribute]();
        return new Date(dateCopy['set' + attribute](originalValue + value));
      },

      between: function(start, end) {
        return dateCopy.getTime() >= start.getTime() && dateCopy.getTime() <= end.getTime();
      },

      format: function(f) {
        var map = { w: weekDayNames[dateCopy.getDay()], m: monthNames[dateCopy.getMonth()], d: dateCopy.getDate(), Y: dateCopy.getFullYear() };
        return f.replace('m', map.m).replace('d', map.d).replace('Y', map.Y).replace('w', map.w);
      }
    };
  }

  $(document).ready(function () {
    $('.quickpicker').quickpicker();
  });

})(jQuery, window.document);
