/* ---------------------------------------------------------------------------
   Temporary closure banner.

   EDIT HERE if the reopen date slips. Times are Central (America/Chicago)
   wall-clock, written exactly as they read on a Wisconsin clock. No timezone
   suffix: the comparison is done against Central time regardless of where the
   visitor is browsing from.

   Set `start` and `end` to the same value (or clear them) to switch the
   banner off entirely.
--------------------------------------------------------------------------- */
var CLOSURE = {
  start: "2026-08-22T00:00:00",
  end:   "2026-08-26T16:00:00", // banner disappears at reopen time (Wed 4:00 PM)
  message: "Temporarily Closed — Due to a power surge, we're closed through Tuesday. We'll reopen Wednesday, August 26. Thank you for your patience!"
};

(function (w, d) {
  'use strict';

  var RECHECK_MS = 60000;

  /* Current Central wall-clock as a sortable YYYYMMDDHHMMSS key.
     Using Intl with timeZone means we never do manual UTC offset maths, so
     this stays correct across DST and for visitors in any timezone. */
  function centralNowKey() {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    var get = function (type) {
      for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value;
      return '00';
    };
    var hour = get('hour');
    if (hour === '24') hour = '00'; // some engines report midnight as 24
    return get('year') + get('month') + get('day') + hour + get('minute') + get('second');
  }

  /* "2026-08-22T00:00:00" -> "20260822000000" (same sortable shape) */
  function configKey(iso) {
    return String(iso || '').replace(/[-:T]/g, '').slice(0, 14);
  }

  function isClosureActive() {
    var start = configKey(CLOSURE.start);
    var end = configKey(CLOSURE.end);
    if (!start || !end || start >= end) return false;
    var now = centralNowKey();
    return now >= start && now < end;
  }

  var dismissed = false;

  function apply() {
    var active = isClosureActive();
    var banner = d.getElementById('closure-banner');
    var note = d.getElementById('closure-hours-note');

    if (banner) banner.hidden = !active || dismissed;
    if (note) note.hidden = !active; // the inline hours note is not dismissible

    /* Saturday and Sunday fall inside the closure, so swap their published
       hours for the same muted "Closed" pill Monday and Tuesday already use.
       Both variants sit in the markup, so this reverts on its own when the
       window expires. */
    var i, normal = d.querySelectorAll('.closure-normal'), swap = d.querySelectorAll('.closure-swap');
    for (i = 0; i < normal.length; i++) normal[i].hidden = active;
    for (i = 0; i < swap.length; i++) swap[i].hidden = !active;

    if (!active && timer) { w.clearInterval(timer); timer = null; }
  }

  var timer = null;

  function init() {
    var banner = d.getElementById('closure-banner');
    if (banner) {
      var text = banner.querySelector('.closure-text');
      if (text) text.textContent = CLOSURE.message;
      var close = banner.querySelector('.closure-dismiss');
      if (close) close.addEventListener('click', function () {
        dismissed = true;
        banner.hidden = true;
      });
    }
    apply();
    // Re-check so a tab left open overnight does not keep a stale banner.
    if (isClosureActive()) timer = w.setInterval(apply, RECHECK_MS);
  }

  /* The banner markup sits directly above this script, so unhide it now,
     before the rest of the page parses. Waiting for DOMContentLoaded would
     insert the bar after first paint and shift the whole page down. */
  (function earlyPass() {
    var banner = d.getElementById('closure-banner');
    if (!banner) return;
    var text = banner.querySelector('.closure-text');
    if (text) text.textContent = CLOSURE.message;
    banner.hidden = !isClosureActive();
  })();

  /* The inline hours note lives further down the document, so the rest waits. */
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();

  // Shared so the inline hours note uses the same date logic, never a copy.
  w.ClosureBanner = { CLOSURE: CLOSURE, isClosureActive: isClosureActive };
})(window, document);
