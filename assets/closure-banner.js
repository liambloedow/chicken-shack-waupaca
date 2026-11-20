/* ---------------------------------------------------------------------------
   Site notice bar — self-expiring banners.

   EDIT THE CONFIGS BELOW. Times are Central (America/Chicago) wall-clock,
   written exactly as they read on a Wisconsin clock. No timezone suffix: the
   comparison is made against Central time regardless of where the visitor is
   browsing from.

   Set a notice's `start` and `end` to the same value (or clear them) to switch
   that notice off entirely.

   Stacking: every active notice gets its own bar, stacked in NOTICES order.
   The one exception is CLOSURE: while it is active it is the only bar shown,
   because nothing else on the site applies while the shop is shut.
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

/* Breakfast launch. Stacks above WINTER (both run from late November), and
   like WINTER it cannot be dismissed. `modifier` takes a space-separated
   list: the promo colours plus the announce treatment. */
var BREAKFAST = {
  start: "2026-11-20T00:00:00",
  end:   "2026-12-20T00:00:00",
  message: "Now serving breakfast — open at 6 AM!",
  dismissible: false,
  modifier: "closure-banner--promo closure-banner--announce"
};

/* Seasonal announcement. Long-running, so it sits last: dated specials stack
   above it, and a closure replaces it. */
var WINTER = {
  start: "2026-11-01T00:00:00",
  end:   "2027-03-01T00:00:00",
  message: "Open all winter — we're not closing for the season!",
  dismissible: false // standing announcement, not a time-boxed promo
};

(function (w, d) {
  'use strict';

  var NOTICES = [CLOSURE, PROMO, BREAKFAST, WINTER]; // order = stacking order, top to bottom
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

  /* Notices are closable by default; a notice opts out with dismissible:false. */
  function isDismissible(notice) {
    return !!notice && notice.dismissible !== false;
  }

  /* Every notice in its window, in stacking order. A closure overrides the
     lot: while it is active it is the only entry. */
  function activeNotices() {
    if (isClosureActive()) return [CLOSURE];
    var list = [];
    for (var i = 0; i < NOTICES.length; i++) {
      if (NOTICES[i] !== CLOSURE && isNoticeActive(NOTICES[i])) list.push(NOTICES[i]);
    }
    return list;
  }

  /* Top bar, kept for anything that only cares about the leading notice. */
  function activeNotice() {
    return activeNotices()[0] || null;
  }

  var dismissed = {}; // NOTICES index -> true once its X is pressed
  var template = null; // detached copy of the bar markup that ships in the HTML
  var timer = null;

  function keyOf(notice) {
    return String(NOTICES.indexOf(notice));
  }

  /* Active notices that have not been closed. Non-dismissible ones always stay. */
  function visibleNotices(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (!(isDismissible(list[i]) && dismissed[keyOf(list[i])])) out.push(list[i]);
    }
    return out;
  }

  /* Copy the number straight out of the contact section so the banner can
     never drift from the real one. The detached template is synced too, so a
     bar created later carries the same number. Returns false if the markup
     has none. */
  function syncPhoneFromContact() {
    var source = d.querySelector('.contact-card a[href^="tel:"]') || d.querySelector('a[href^="tel:"]');
    if (!source) return false; // no number in the markup; leave the fallback alone
    var targets = [].slice.call(d.querySelectorAll('.tel-from-contact'));
    if (template) targets = targets.concat([].slice.call(template.querySelectorAll('.tel-from-contact')));
    for (var i = 0; i < targets.length; i++) {
      targets[i].setAttribute('href', source.getAttribute('href'));
      targets[i].textContent = source.textContent.trim();
    }
    return targets.length > 0;
  }

  function classTokens(modifier) {
    return String(modifier || '').split(/\s+/).filter(Boolean);
  }

  /* One bar per notice. Its classes are fixed at creation because a bar only
     ever shows the notice it was made for. */
  function createBar(notice) {
    var bar = template.cloneNode(true);
    var key = keyOf(notice);
    bar.setAttribute('data-notice', key);
    var t = classTokens(notice.modifier);
    for (var i = 0; i < t.length; i++) bar.classList.add(t[i]);

    var msg = bar.querySelector('.closure-message');
    if (msg) msg.textContent = notice.message;
    var phone = bar.querySelector('.closure-phone');
    if (phone) phone.hidden = !notice.showPhone;

    var close = bar.querySelector('.closure-dismiss');
    if (close) {
      close.hidden = !isDismissible(notice);
      close.addEventListener('click', function () {
        if (!isDismissible(notice)) return;
        dismissed[key] = true;
        apply();
      });
    }
    return bar;
  }

  /* Bring the stack in line with `list` while touching as little as possible.
     Bars that stay keep their node: re-inserting one would restart its
     entrance animation on every re-check. Only new bars are inserted, and an
     existing bar moves only if the order genuinely changed. */
  function renderStack(stack, list) {
    var want = {}, i;
    for (i = 0; i < list.length; i++) want[keyOf(list[i])] = true;

    var child = stack.firstElementChild, next;
    while (child) {
      next = child.nextElementSibling;
      if (!want[child.getAttribute('data-notice')]) stack.removeChild(child);
      child = next;
    }

    var cursor = stack.firstElementChild;
    for (i = 0; i < list.length; i++) {
      var key = keyOf(list[i]);
      var bar = stack.querySelector(':scope > [data-notice="' + key + '"]') || createBar(list[i]);
      if (bar === cursor) cursor = cursor.nextElementSibling;
      else stack.insertBefore(bar, cursor);
    }
    stack.hidden = list.length === 0;
  }

  /* The bar markup in the HTML is the template, not a live bar. Lift it out
     so every bar, including the first, comes from the same clone path. */
  function takeTemplate(stack) {
    if (template) return true;
    var bar = stack.querySelector('.notice-bar');
    if (!bar) return false;
    template = stack.removeChild(bar);
    return true;
  }

  function apply() {
    var list = activeNotices();
    var closure = isClosureActive();
    var stack = d.getElementById('closure-banner');
    var note = d.getElementById('closure-hours-note');

    if (stack && takeTemplate(stack)) renderStack(stack, visibleNotices(list));

    /* The hours note and the Saturday/Sunday row swap belong to the closure
       only — a promo leaves published hours untouched. Both variants sit in
       the markup, so this reverts on its own when the window expires. */
    if (note) note.hidden = !closure; // the inline hours note is not dismissible

    /* The promo block carries the promo's own content, so it shows only while
       the promo is live. A closure empties the list down to itself, so the
       specials stay hidden while shut — advertising game-day pickup then
       would be worse than showing nothing. */
    var block = d.getElementById('promo-block');
    if (block) block.hidden = list.indexOf(PROMO) === -1;

    var i, normal = d.querySelectorAll('.closure-normal'), swap = d.querySelectorAll('.closure-swap');
    for (i = 0; i < normal.length; i++) normal[i].hidden = closure;
    for (i = 0; i < swap.length; i++) swap[i].hidden = !closure;

    if (!list.length && timer) { w.clearInterval(timer); timer = null; }
  }

  function init() {
    syncPhoneFromContact(); // contact section has parsed by now
    apply();
    // Re-check so a tab left open past an end time does not keep a stale bar.
    if (activeNotices().length && !timer) timer = w.setInterval(apply, RECHECK_MS);
  }

  /* The banner markup sits directly above this script, so render it now,
     before the rest of the page parses. Waiting for DOMContentLoaded would
     insert the bars after first paint and shift the whole page down. The
     phone link's href already ships in the markup; init() re-syncs it from
     the contact section once that has parsed. */
  (function earlyPass() {
    var stack = d.getElementById('closure-banner');
    if (stack && takeTemplate(stack)) renderStack(stack, visibleNotices(activeNotices()));
  })();

  /* The hours note and contact section live further down, so the rest waits. */
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();

  /* Shared so the hours gating and any other consumer use the same date
     logic, never a copy. */
  w.ClosureBanner = {
    CLOSURE: CLOSURE,
    PROMO: PROMO,
    BREAKFAST: BREAKFAST,
    WINTER: WINTER,
    NOTICES: NOTICES,
    isNoticeActive: isNoticeActive,
    isClosureActive: isClosureActive,
    activeNotices: activeNotices,
    activeNotice: activeNotice
  };
})(window, document);
