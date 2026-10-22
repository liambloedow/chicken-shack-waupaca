/* ---------------------------------------------------------------------------
   Site notice bar — self-expiring banners.

   EDIT THE CONFIGS BELOW. Times are Central (America/Chicago) wall-clock,
   written exactly as they read on a Wisconsin clock. No timezone suffix: the
   comparison is made against Central time regardless of where the visitor is
   browsing from.

   Set a notice's `start` and `end` to the same value (or clear them) to switch
   that notice off entirely.

   Precedence: the first active notice in NOTICES wins, so a closure always
   outranks a promo. Only one bar ever renders.
--------------------------------------------------------------------------- */

/* Temporary closure. Dormant unless the dates are updated. */
var CLOSURE = {
  start: "2026-08-22T00:00:00",
  end:   "2026-08-26T16:00:00", // banner disappears at reopen time (Wed 4:00 PM)
  message: "Temporarily Closed — Due to a power surge, we're closed through Tuesday. We'll reopen Wednesday, August 26. Thank you for your patience!"
};

/* Same-day special. `showPhone` appends the shop's number, read from the
   contact section, as a tap-to-call link. `modifier` styles it as a promo
   rather than an alert. */
var PROMO = {
  start: "2026-10-22T00:00:00",
  end:   "2026-10-25T19:00:00", // Sunday close
  message: "Game Day Chicken Specials — 18 wings $10, or a 9-piece chicken strip box with fries $10. Call in your order for pickup!",
  showPhone: true,
  modifier: "closure-banner--promo"
};

(function (w, d) {
  'use strict';

  var NOTICES = [CLOSURE, PROMO]; // order = precedence; closure outranks promo
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

  /* "2026-10-15T00:00:00" -> "20261015000000" (same sortable shape) */
  function configKey(iso) {
    return String(iso || '').replace(/[-:T]/g, '').slice(0, 14);
  }

  /* Generic window test. Every notice gates on this one implementation. */
  function isNoticeActive(notice) {
    if (!notice) return false;
    var start = configKey(notice.start);
    var end = configKey(notice.end);
    if (!start || !end || start >= end) return false;
    var now = centralNowKey();
    return now >= start && now < end;
  }

  /* Thin wrapper. The hours-row gating still depends on this specifically:
     a promo must never mark Saturday and Sunday closed. */
  function isClosureActive() {
    return isNoticeActive(CLOSURE);
  }

  function activeNotice() {
    for (var i = 0; i < NOTICES.length; i++) {
      if (isNoticeActive(NOTICES[i])) return NOTICES[i];
    }
    return null;
  }

  var dismissed = false;
  var timer = null;

  /* Copy the number straight out of the contact section so the banner can
     never drift from the real one. Returns false if the markup has none. */
  function syncPhoneFromContact() {
    var targets = d.querySelectorAll('.tel-from-contact');
    if (!targets.length) return false;
    var source = d.querySelector('.contact-card a[href^="tel:"]') || d.querySelector('a[href^="tel:"]');
    if (!source) return false; // no number in the markup; leave the fallback alone
    for (var i = 0; i < targets.length; i++) {
      targets[i].setAttribute('href', source.getAttribute('href'));
      targets[i].textContent = source.textContent.trim();
    }
    return true;
  }

  function render(banner, notice) {
    var msg = banner.querySelector('.closure-message');
    var phone = banner.querySelector('.closure-phone');

    if (msg) msg.textContent = notice ? notice.message : '';
    if (phone) phone.hidden = !(notice && notice.showPhone);

    // Apply only the active notice's modifier; clear any other.
    for (var i = 0; i < NOTICES.length; i++) {
      var m = NOTICES[i].modifier;
      if (m) banner.classList.toggle(m, !!notice && notice.modifier === m);
    }
  }

  function apply() {
    var notice = activeNotice();
    var closure = isClosureActive();
    var banner = d.getElementById('closure-banner');
    var note = d.getElementById('closure-hours-note');

    if (banner) {
      render(banner, notice);
      banner.hidden = !notice || dismissed;
    }

    /* The hours note and the Saturday/Sunday row swap belong to the closure
       only — a promo leaves published hours untouched. Both variants sit in
       the markup, so this reverts on its own when the window expires. */
    if (note) note.hidden = !closure; // the inline hours note is not dismissible

    /* The promo block carries the promo's own content, so it shows only when
       the promo is the winning notice. If a closure were ever active at the
       same time, closure wins and the specials stay hidden — advertising
       game-day pickup while shut would be worse than showing nothing. */
    var block = d.getElementById('promo-block');
    if (block) block.hidden = (notice !== PROMO);

    var i, normal = d.querySelectorAll('.closure-normal'), swap = d.querySelectorAll('.closure-swap');
    for (i = 0; i < normal.length; i++) normal[i].hidden = closure;
    for (i = 0; i < swap.length; i++) swap[i].hidden = !closure;

    if (!notice && !closure && timer) { w.clearInterval(timer); timer = null; }
  }

  function init() {
    var banner = d.getElementById('closure-banner');
    if (banner) {
      syncPhoneFromContact(); // contact section has parsed by now
      var close = banner.querySelector('.closure-dismiss');
      if (close) close.addEventListener('click', function () {
        dismissed = true;
        banner.hidden = true;
      });
    }
    apply();
    // Re-check so a tab left open past the end time does not keep a stale bar.
    if (activeNotice() || isClosureActive()) timer = w.setInterval(apply, RECHECK_MS);
  }

  /* The banner markup sits directly above this script, so render it now,
     before the rest of the page parses. Waiting for DOMContentLoaded would
     insert the bar after first paint and shift the whole page down. The
     phone link's href already ships in the markup; init() re-syncs it from
     the contact section once that has parsed. */
  (function earlyPass() {
    var banner = d.getElementById('closure-banner');
    if (!banner) return;
    var notice = activeNotice();
    render(banner, notice);
    banner.hidden = !notice;
  })();

  /* The hours note and contact section live further down, so the rest waits. */
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();

  /* Shared so the hours gating and any other consumer use the same date
     logic, never a copy. */
  w.ClosureBanner = {
    CLOSURE: CLOSURE,
    PROMO: PROMO,
    NOTICES: NOTICES,
    isNoticeActive: isNoticeActive,
    isClosureActive: isClosureActive,
    activeNotice: activeNotice
  };
})(window, document);
