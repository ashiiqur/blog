// blog.ashiqur.in - shared behaviour

(function () {
  "use strict";

  /* theme toggle (data-theme already set pre-paint by inline head script) */
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var root = document.documentElement;
      var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* mobile nav */
  var navToggle = document.querySelector(".nav-toggle");
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
      });
    });
  }

  /* footer year */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* NOTE: previously toggled a `.contain-bounce` class (see styles.css)
     on/off based on scroll position, to stop the bottom rubber-band
     bounce from chaining into the mobile browser's own toolbar hide/show
     handling. Removed: flipping overscroll-behavior on <body> mid-gesture
     — which is what happens the instant scroll position crosses the top
     boundary while a touch/momentum scroll is still active — desyncs the
     browser's native toolbar/pull-to-refresh state machine. That's what
     left the toolbar stuck mid-animation on both edges, only resolved by
     a hard fling that forces the browser to resync. Left at the default
     (auto) overscroll behaviour on both edges instead — see styles.css. */

  /* scroll fade-up */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = document.querySelectorAll(".fade-up");
  if (items.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      items.forEach(function (el) { io.observe(el); });
    }
  }

  /* reading progress bar (post pages only) */
  var bar = document.querySelector(".progress-bar");
  if (bar) {
    var onScroll = function () {
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop;
      var height = doc.scrollHeight - doc.clientHeight;
      var pct = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = pct + "%";
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();


if (window.matchMedia('(pointer: fine)').matches) {

  const track = document.createElement('div');
  track.classList.add('custom-scrollbar-track');
  
  const thumb = document.createElement('div');
  thumb.classList.add('custom-scrollbar-thumb');
  
  track.appendChild(thumb);
  document.body.appendChild(track);

  let isScrolling = false;
  let isNearEdge = false;
  let isDragging = false;
  let scrollTimeout;

  function updateScrollbar() {
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    // 1. Automatically find the header and measure its height
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 0;
    
    // 2. Adjust the track to start below the header
    track.style.top = `${headerHeight}px`;
    track.style.height = `calc(100vh - ${headerHeight}px)`;

    const trackHeight = clientHeight - headerHeight;

    if (scrollHeight <= clientHeight) {
      track.style.display = 'none';
      return;
    } else {
      track.style.display = 'block';
    }

    // 3. Calculate thumb height based on the new, shorter track
    const thumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, 40);
    thumb.style.height = `${thumbHeight}px`;

    // 4. Calculate position within the new track bounds
    const scrollTop = window.scrollY;
    const maxScroll = scrollHeight - clientHeight;
    const maxThumb = trackHeight - thumbHeight;
    const thumbTop = (scrollTop / maxScroll) * maxThumb;
    
    thumb.style.transform = `translateY(${thumbTop}px)`;
  }

  function updateVisibility() {
    if (isScrolling || isNearEdge || isDragging) {
      track.classList.add('is-visible');
      updateScrollbar();
    } else {
      track.classList.remove('is-visible');
    }
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    isScrolling = true;
    // Just show the track here — don't call updateVisibility() (which
    // calls updateScrollbar()) synchronously on every raw scroll event.
    // scroll fires many times per gesture, and updateScrollbar() reads
    // layout (scrollHeight/clientHeight/offsetHeight) then writes styles,
    // forcing a synchronous layout each time it's called outside rAF —
    // that's what caused the stutter. The rAF block below already
    // recomputes position/size at most once per frame, which is the
    // only place that needs to happen.
    track.classList.add('is-visible');

    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateScrollbar();
        ticking = false;
      });
      ticking = true;
    }
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      updateVisibility();
    }, 1000);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) {
      isNearEdge = window.innerWidth - e.clientX < 40;
      updateVisibility();
    }
  });

  let startY = 0;
  let startScrollTop = 0;

  thumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startScrollTop = window.scrollY;
    
    document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
    document.body.style.userSelect = 'none'; 
    updateVisibility();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    // Account for header height during the drag calculation
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const trackHeight = clientHeight - headerHeight;

    const maxScroll = scrollHeight - clientHeight;
    const maxThumb = trackHeight - thumb.offsetHeight;
    
    const deltaY = e.clientY - startY;
    const scrollDelta = (deltaY / maxThumb) * maxScroll;
    
    window.scrollTo({
      top: startScrollTop + scrollDelta,
      behavior: 'auto' 
    });
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.documentElement.style.removeProperty('scroll-behavior');
      document.body.style.userSelect = '';
      updateVisibility();
    }
  });

  window.addEventListener('resize', updateScrollbar);
  
  updateScrollbar();

}

/* pixel portrait + copy-to-clipboard + last-updated stamp */
(function () {
  "use strict";

  /* copy-to-clipboard, delegated so it works on any [data-copy] button */
  function fallbackCopy(text, cb) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    if (cb) cb();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-copy]") : null;
    if (!btn) return;
    var value = btn.getAttribute("data-copy");
    if (!value) return;

    var done = function () {
      btn.setAttribute("data-copied", "true");
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(function () {
        btn.removeAttribute("data-copied");
      }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done, function () { fallbackCopy(value, done); });
    } else {
      fallbackCopy(value, done);
    }
  });

  /* pixel portrait — reads /ashiqur.png, center-crops it to a square,
     and paints it onto a small canvas that's then stretched up with
     crisp/pixelated scaling. Deliberately avoids ctx.getImageData():
     most browsers block reading pixel data back out of a canvas when
     the page is opened via file:// instead of http(s)://, which
     silently produced an empty box before. Painting the canvas (and
     recolouring it, below) has no such restriction.

     Recolouring: ashiqur.png is only ever used for its shape — its
     own alpha channel says which pixels are "the subject" and which
     are transparent background. drawImage brings that alpha channel
     into the canvas untouched. Switching to compositeOperation
     "source-in" and filling with the theme's accent colour then
     keeps that exact alpha shape but replaces every visible pixel's
     colour with the flat accent colour (Porter-Duff source-in:
     resultAlpha = fillAlpha × photoAlpha, so a fully opaque fill
     inherits the photo's own alpha precisely — non-transparent
     pixels get tinted, transparent pixels stay transparent). No CSS
     masking involved, so there's no separate mask-image resource to
     fail to load. */
  var mount = document.getElementById("avatar-pixel");
  if (mount) {
    var GRID = 32;
    var portraitImg = null;
    var portraitCtx = null;

    function accentColor() {
      return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    }

    function paintPortrait() {
      if (!portraitImg || !portraitCtx) return;
      var side = Math.min(portraitImg.naturalWidth, portraitImg.naturalHeight);
      var sx = (portraitImg.naturalWidth - side) / 2;
      var sy = (portraitImg.naturalHeight - side) / 2;

      portraitCtx.clearRect(0, 0, GRID, GRID);
      portraitCtx.globalCompositeOperation = "source-over";
      portraitCtx.drawImage(portraitImg, sx, sy, side, side, 0, 0, GRID, GRID);

      portraitCtx.globalCompositeOperation = "source-in";
      portraitCtx.fillStyle = accentColor();
      portraitCtx.fillRect(0, 0, GRID, GRID);
      portraitCtx.globalCompositeOperation = "source-over";
    }

    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.className = "pixel-canvas";
      canvas.width = GRID;
      canvas.height = GRID;
      portraitCtx = canvas.getContext("2d");
      portraitCtx.imageSmoothingEnabled = true;
      portraitCtx.imageSmoothingQuality = "high";
      portraitImg = img;
      mount.innerHTML = "";
      mount.appendChild(canvas);
      mount.classList.add("is-ready");
      paintPortrait();
    };
    img.onerror = function () {
      console.warn('[avatar-pixel] could not load "ashiqur.png". Check that the file sits in the same folder as index.html and that the name matches exactly (lowercase, .png).');
    };
    img.src = "ashiqur.png";

    /* repaint in the new accent colour whenever the theme toggles */
    var themeObserver = new MutationObserver(paintPortrait);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
  }

  /* special circles — each one declares its photo via [data-photo].
     The SVG placeholder icon inside is the fallback and is visible by
     default; if the photo actually loads, we set it as the element's
     background and add .has-photo, which hides the icon via CSS. If
     the file is missing (wrong path, not uploaded yet, etc.) the load
     just fails silently and the SVG stays put — no broken image, no
     empty circle. */
  document.querySelectorAll(".special-circle[data-photo]").forEach(function (el) {
    var src = el.getAttribute("data-photo");
    if (!src) return;
    var probe = new Image();
    probe.onload = function () {
      el.style.backgroundImage = "url('" + src + "')";
      el.classList.add("has-photo");
    };
    probe.onerror = function () {
      console.warn('[special-circle] could not load "' + src + '" — showing the fallback icon instead.');
    };
    probe.src = src;
  });

  /* last-updated stamp(s), taken from the page's own modified date.
     Any element with [data-updated-stamp="<prefix>"] gets filled in —
     currently the footer line and the one under the pixel portrait. */
  var updatedEls = document.querySelectorAll("[data-updated-stamp]");
  if (updatedEls.length) {
    var d = new Date(document.lastModified);
    if (!isNaN(d.getTime())) {
      var opts = { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
      var stamp = d.toLocaleString("en-US", opts);
      updatedEls.forEach(function (el) {
        var prefix = el.getAttribute("data-updated-stamp") || "Updated";
        el.textContent = prefix + " " + stamp;
      });
    }
  }
})();

/* ---------- shared lazy background-image loader ----------
   Used for both the Posts grid tiles and the Works thumbnails below.
   Nothing is fetched until an element is actually inside the visible
   viewport (or, if it starts out inside a hidden tab panel, until
   switching to that tab brings it into view) — IntersectionObserver
   watches every element up front, but each file is only requested once
   it's genuinely on screen, so a long grid doesn't fire off dozens of
   requests on load. rootMargin is deliberately "0px": no pre-fetch
   buffer before/after the viewport edge, so scrolling never triggers a
   batch of items that merely happen to be close to view — only what's
   currently rendered inside the browser's actual viewport (root: null
   already tracks that viewport's real, current size — it's recomputed
   live as the window/device is resized, so this always reflects the
   real browsing-device view size, not a guess). Same probe-first
   approach as the pixel portrait and special circles elsewhere on the
   page: try loading the file, and only touch the DOM once it's
   confirmed to exist; a missing file (or an empty/absent data-img)
   leaves whatever placeholder already renders in place, untouched. */
function lazyLoadBackgrounds(elements, options) {
  options = options || {};
  var getTarget = options.getTarget || function (el) { return el; };
  var onLoaded = options.onLoaded;
  elements = Array.prototype.slice.call(elements);
  if (!elements.length) return;

  function loadOne(el) {
    var target = getTarget(el);
    var src = el.getAttribute("data-img");
    if (!target || !src) return;
    var probe = new Image();
    probe.onload = function () {
      target.style.backgroundImage = "url('" + src + "')";
      if (onLoaded) onLoaded(target, el);
    };
    probe.onerror = function () {
      console.warn('[lazy-image] could not load "' + src + '" — showing the fallback icon instead.');
    };
    probe.src = src;
  }

  if (!("IntersectionObserver" in window)) {
    /* no observer support — just load everything up front */
    elements.forEach(loadOne);
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          loadOne(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: "0px", threshold: 0 }
  );
  elements.forEach(function (el) { observer.observe(el); });
}

/* post tiles (Posts tab) — preview images. Applies to all three tile
   types — photo, video and file — the only difference is which
   placeholder svg stays put when there's nothing to load:
     - Photo tiles (also used for gif tiles — same grid markup and
       .post-media--photo class, so a GIF grid thumbnail probes and
       fades in exactly like a photo one): found → set as the
       background and fade out the placeholder camera icon (.has-photo).
       Missing → left exactly as it already renders, placeholder icon
       included.
     - Video tiles: found → set as the poster behind the play icon. The
       play icon stays regardless — it's a permanent "this plays" cue, not
       a "no file yet" fallback, so a found poster doesn't hide it.
     - File tiles (pdf/zip/etc.): found → set as the background and fade
       out the placeholder document icon (.has-preview); the format tag
       (PDF/ZIP…) stays visible as a small badge either way. Missing →
       left exactly as it already renders, placeholder icon + tag included. */
(function () {
  "use strict";
  var tiles = document.querySelectorAll(".post-tile[data-img]");
  lazyLoadBackgrounds(tiles, {
    getTarget: function (tile) { return tile.querySelector(".post-media"); },
    onLoaded: function (media) {
      if (media.classList.contains("post-media--photo")) {
        media.classList.add("has-photo");
      } else if (media.classList.contains("post-media--file")) {
        media.classList.add("has-preview");
      }
    }
  });
})();

/* Works list — thumbnail images. Same lazy, probe-first pattern: found →
   set as the background and fade out the placeholder icon (.has-photo).
   Missing (or no data-img on the card yet) → placeholder icon stays. */
(function () {
  "use strict";
  var thumbs = document.querySelectorAll(".work-thumb[data-img]");
  lazyLoadBackgrounds(thumbs, {
    onLoaded: function (thumb) { thumb.classList.add("has-photo"); }
  });
})();


/* qualifications / experience — one search bar filters both columns.
   Matches against each .entry's full text (date, title, org, description,
   tag), so typing "college", a school name, or a role all work the same
   way. Uses inline style.display rather than the [hidden] attribute,
   since .entry already sets display:grid in the stylesheet and would
   otherwise win the cascade over the browser's default [hidden] rule. */
(function () {
  "use strict";
  var input = document.getElementById("quali-search");
  var columns = document.querySelectorAll(".split-col");
  if (!input || !columns.length) return;

  function norm(str) {
    return (str || "").toLowerCase().trim();
  }

  function filterColumn(col, query) {
    var ledger = col.querySelector("[data-ledger]");
    var empty = col.querySelector("[data-empty]");
    if (!ledger) return;
    var shown = 0;
    ledger.querySelectorAll(".entry").forEach(function (entry) {
      var match = query === "" || norm(entry.textContent).indexOf(query) !== -1;
      entry.style.display = match ? "" : "none";
      if (match) shown++;
    });
    if (empty) empty.style.display = shown === 0 ? "block" : "none";
  }

  input.addEventListener("input", function () {
    var query = norm(input.value);
    columns.forEach(function (col) { filterColumn(col, query); });
  });
})();

/* ledger scroll handoff — a .ledger column only has room for
   --ledger-height worth of entries before it scrolls internally.
     1. The column has no overflow to scroll at all (few entries, or
        everything filtered down by the search box) - every wheel tick
        should already move the page; there's nothing here to contain.
     2. The column DOES scroll. Whether a gesture chains into the page
        is decided ONCE, at that gesture's very first tick, from
        whether the column is already pinned at the edge the gesture is
        headed toward:
          - already pinned  -> the whole gesture hands off to the page,
            tick for tick, so scrolling with the cursor sitting over an
            already-scrolled column feels exactly as smooth as
            scrolling anywhere else on the page.
          - not pinned yet  -> the gesture scrolls the column normally;
            if it reaches the edge partway through, the rest of that
            same gesture is absorbed there instead of spilling into the
            page mid-read. Only a later, separate gesture (one that
            starts once this one has stopped) gets re-evaluated.
        Re-deciding on every tick instead of once per gesture was the
        earlier bug: it made a continuous scroll over an already-pinned
        column pass through only about once every GESTURE_GAP ms,
        instead of every tick, which read as stuttering/laggy.
   Wheel events carry no "gesture id", so a short pause is used as the
   cutoff between gestures: ticks less than GESTURE_GAP ms apart count
   as the same ongoing gesture, a longer pause starts a new one. This
   is a heuristic (inertial/momentum scrolling can trail off slowly
   enough near the very end to blur the line), but it matches the
   intended feel closely in practice. */
(function () {
  "use strict";
  var ledgers = document.querySelectorAll(".ledger");
  if (!ledgers.length) return;
  var GESTURE_GAP = 180; // ms of pause that counts as "this scroll motion has stopped"

  ledgers.forEach(function (ledger) {
    var lastWheelAt = 0;
    var chainThisGesture = false; // decided once, at the start of each scroll motion

    ledger.addEventListener("wheel", function (e) {
      var scrollable = ledger.scrollHeight > ledger.clientHeight;
      if (!scrollable) return; // nothing to scroll here - let the page take it natively

      var now = Date.now();
      var isGestureStart = now - lastWheelAt > GESTURE_GAP;
      lastWheelAt = now;

      var atTop = ledger.scrollTop <= 0;
      var atBottom = Math.ceil(ledger.scrollTop + ledger.clientHeight) >= ledger.scrollHeight;
      var pastEdge = (e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom);

      if (isGestureStart) {
        // A fresh scroll motion. If it's starting out already pinned at
        // the edge it's headed toward, there's nothing inside the column
        // for it to scroll at all - this whole motion belongs to the page.
        chainThisGesture = pastEdge;
      }

      if (!pastEdge) return; // still moving inside the list - normal internal scroll

      if (chainThisGesture) {
        // Already pinned at the start of this motion: don't touch it at
        // all - no preventDefault, no manual scrollBy. overscroll-behavior
        // is left at its default (auto), so the browser's own native
        // chaining takes this straight to the page itself, riding the
        // same compositor-driven momentum curve as scrolling anywhere
        // else - constant, uninterrupted velocity, not the coarser,
        // lower-fidelity motion you get from relaying individual wheel
        // ticks through a manual scrollBy call.
        return;
      }

      // This motion had room to scroll the column and only just reached
      // the edge - stop the browser's default here. That blocks both the
      // ledger's own rubber-band/overscroll bounce AND the native
      // chaining that would otherwise let this same tick spill into the
      // page, so it absorbs instead of leaking into the page mid-read.
      e.preventDefault();
      // A later, separate motion (one that starts once this one has
      // stopped) gets re-evaluated from the top, and chains immediately
      // - via native handoff, above - if it's now pinned.
    }, { passive: false });
  });
})();

/* back-link arrow — the hover/focus move is pure CSS (see .back-link-arrow
   in styles.css); this just gives the arrow the same forward nudge on
   click, mainly so touch devices (no hover state) still get the motion. */
(function () {
  "use strict";
  document.querySelectorAll(".back-link").forEach(function (link) {
    var arrow = link.querySelector(".back-link-arrow");
    if (!arrow) return;
    link.addEventListener("click", function () {
      arrow.classList.remove("is-clicked");
      void arrow.offsetWidth; // restart the animation on repeat clicks
      arrow.classList.add("is-clicked");
    });
    arrow.addEventListener("animationend", function () {
      arrow.classList.remove("is-clicked");
    });
  });
})();

/* post viewer — a popup for the Posts grid (Photos, Videos, Files).
   Clicking a tile (anywhere except its share/download buttons, which
   keep working exactly as before) opens one shared modal. What's shown
   inside, and which tools appear underneath, both depend on the tile's
   data-type:
     - photo / gif → the image itself, with Zoom, Download, Open
       original, Share. gif is treated identically to photo (a GIF is
       just an image — the browser animates it natively in an <img>),
       kept as its own data-type value only so a tile can be labelled a
       GIF distinctly from a still photo if that's ever useful.
     - video → a real <video> player (data-src), using data-img as its
       poster when present, with Download and Share.
     - file (pdf/zip/…) → the preview image if one loaded on the tile
       (same has-preview probe as above), otherwise the same placeholder
       icon + format tag the grid tile shows, with Open, Download, Share.
   ← → arrows step to the previous/next tile that's currently visible
   (so an active search filter is respected); the × button, the Escape
   key, or clicking the dimmed backdrop all close it. Arrow-Left/Right
   and Escape work the same way from the keyboard, and Tab is kept
   inside the popup while it's open. */
(function () {
  "use strict";

  var tiles = Array.prototype.slice.call(document.querySelectorAll(".post-tile"));
  if (!tiles.length) return;

  var ICONS = {
    close:   '<path d="M6 6l12 12M18 6L6 18"/>',
    prev:    '<path d="M15 6l-6 6 6 6"/>',
    next:    '<path d="M9 6l6 6-6 6"/>',
    download:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/>',
    share:   '<circle cx="18" cy="5" r="2.4"/><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="19" r="2.4"/><path d="M8.1 10.7l7.8-4.4M8.1 13.3l7.8 4.4"/>',
    open:    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
    zoomIn:  '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/>',
    zoomOut: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6"/>'
  };
  var PLACEHOLDER_SVG = {
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 16l-5.5-5-4 4L9 13l-6 6"/></svg>',
    gif: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 16l-5.5-5-4 4L9 13l-6 6"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.3v5.4l4.6-2.7-4.6-2.7Z" fill="currentColor" stroke="none"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/></svg>'
  };

  var modal, stage, toolbar, titleEl, dateEl, btnPrev, btnNext, btnClose, backdrop;
  var currentIndex = -1;
  var lastFocused = null;

  /* auto-hide close/prev/next — visible right after opening or stepping
     to another item, then fades out; any tap or mouse movement over the
     popup brings them back and restarts the timer. This never touches
     video playback — it only toggles a class, so a playing video keeps
     playing regardless of whether these controls are shown or hidden.
     The CSS that actually hides them only applies under the mobile
     (max-width: 640px) breakpoint, so on desktop this class has no
     visible effect and the controls stay on exactly as before. */
  var CONTROLS_HIDE_DELAY = 2500;
  var controlsHideTimer = null;

  function showControls() {
    if (!modal) return;
    modal.classList.add("controls-visible");
    clearTimeout(controlsHideTimer);
    controlsHideTimer = setTimeout(function () {
      modal.classList.remove("controls-visible");
    }, CONTROLS_HIDE_DELAY);
  }

  function stopControlsAutoHide() {
    clearTimeout(controlsHideTimer);
    controlsHideTimer = null;
  }

  function svg(pathMarkup, extraClass) {
    return '<svg class="' + (extraClass || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">' + pathMarkup + "</svg>";
  }

  function buildModal() {
    if (modal) return;
    modal = document.createElement("div");
    modal.className = "viewer";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Post viewer");

    modal.innerHTML =
      '<div class="viewer-backdrop"></div>' +
      '<button type="button" class="viewer-close" aria-label="Close">' + svg(ICONS.close) + "</button>" +
      '<button type="button" class="viewer-nav viewer-prev" aria-label="Previous">' + svg(ICONS.prev) + "</button>" +
      '<button type="button" class="viewer-nav viewer-next" aria-label="Next">' + svg(ICONS.next) + "</button>" +
      '<div class="viewer-panel">' +
        '<div class="viewer-stage"></div>' +
        '<div class="viewer-footer">' +
          '<div class="viewer-caption">' +
            '<span class="viewer-title"></span>' +
            '<span class="viewer-date"></span>' +
          "</div>" +
          '<div class="viewer-toolbar"></div>' +
        "</div>" +
      "</div>";

    document.body.appendChild(modal);

    stage = modal.querySelector(".viewer-stage");
    toolbar = modal.querySelector(".viewer-toolbar");
    titleEl = modal.querySelector(".viewer-title");
    dateEl = modal.querySelector(".viewer-date");
    btnPrev = modal.querySelector(".viewer-prev");
    btnNext = modal.querySelector(".viewer-next");
    btnClose = modal.querySelector(".viewer-close");
    backdrop = modal.querySelector(".viewer-backdrop");

    btnClose.addEventListener("click", closeViewer);
    backdrop.addEventListener("click", closeViewer);
    btnPrev.addEventListener("click", function () { step(-1); });
    btnNext.addEventListener("click", function () { step(1); });

    document.addEventListener("keydown", function (e) {
      if (modal.hidden) return;
      if (e.key === "Escape") { closeViewer(); }
      else if (e.key === "ArrowLeft") { step(-1); }
      else if (e.key === "ArrowRight") { step(1); }
      else if (e.key === "Tab") { trapFocus(e); }
    });

    /* tap (touch) or mouse movement anywhere over the popup reveals the
       controls; passive listeners only, so this never blocks or delays
       any other click/tap already handled elsewhere (zoom, video's own
       controls, close/backdrop/prev/next). */
    modal.addEventListener("pointerdown", showControls);
    modal.addEventListener("pointermove", showControls);
  }

  function trapFocus(e) {
    var focusables = Array.prototype.slice.call(modal.querySelectorAll("button:not([hidden])"));
    if (!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function visibleTiles() {
    /* respects whatever the Posts search box has hidden via inline
       style.display, so arrows only step through what's on screen */
    return tiles.filter(function (t) { return t.style.display !== "none"; });
  }

  function toolButton(action, label, iconPath) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "viewer-tool";
    b.setAttribute("data-action", action);
    b.innerHTML = svg(iconPath) + "<span>" + label + "</span>";
    return b;
  }

  function doShare(url, title) {
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  }

  function doDownload(url, name) {
    if (!url) return;
    var a = document.createElement("a");
    a.href = url;
    a.download = name || "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function placeholderMarkup(type, tag, previewSrc) {
    var tagHtml = tag ? '<span class="viewer-placeholder-tag">' + tag + "</span>" : "";
    if (previewSrc) {
      return '<div class="viewer-placeholder" data-has-preview="true">' +
               '<img class="viewer-placeholder-img" src="' + previewSrc + '" alt="" ' +
               "onerror=\"this.parentElement.setAttribute('data-has-preview','false')\">" +
               PLACEHOLDER_SVG[type] + tagHtml +
             "</div>";
    }
    return '<div class="viewer-placeholder">' + PLACEHOLDER_SVG[type] + tagHtml + "</div>";
  }

  function render(index) {
    var list = visibleTiles();
    if (!list.length) return;
    index = (index + list.length) % list.length;
    currentIndex = index;
    showControls();
    var tile = list[index];

    var type = tile.getAttribute("data-type") || "file";
    var src = tile.getAttribute("data-src") || "";
    var img = tile.getAttribute("data-img") || "";
    var titleText = (tile.querySelector(".post-title") || {}).textContent || "";
    var dateText = (tile.querySelector(".post-date") || {}).textContent || "";
    var tagText = (tile.querySelector(".tag") || {}).textContent || "";

    titleEl.textContent = titleText;
    dateEl.textContent = dateText;

    var playingVideo = stage.querySelector("video");
    if (playingVideo) playingVideo.pause();
    stage.innerHTML = "";
    toolbar.innerHTML = "";

    if (type === "photo" || type === "gif") {
      var fullSrc = src || img;
      if (fullSrc) {
        var photoEl = document.createElement("img");
        photoEl.className = "viewer-media viewer-media--photo";
        photoEl.alt = titleText;
        photoEl.draggable = false;
        photoEl.src = fullSrc;
        photoEl.onerror = function () { stage.innerHTML = placeholderMarkup(type, tagText); };
        stage.appendChild(photoEl);

        /* ---- pan & zoom ----
           The Zoom in/out buttons (and the scroll wheel) step the scale
           up or down smoothly — the CSS transition on .viewer-media--photo
           animates every step. Past 1x, dragging (mouse or touch, via
           Pointer Events so both work the same way) pans the image,
           clamped so it can't be dragged past its own edge. A plain
           click/tap that isn't a drag toggles between 1x and 2x. */
        var MIN_SCALE = 1, MAX_SCALE = 4, STEP = 0.75;
        var scale = 1, tx = 0, ty = 0;
        var dragging = false, dragMoved = false;
        var startX = 0, startY = 0, startTx = 0, startTy = 0;

        function clampNum(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

        function clampPan() {
          var overflowX = Math.max(0, (photoEl.clientWidth * scale - stage.clientWidth) / 2);
          var overflowY = Math.max(0, (photoEl.clientHeight * scale - stage.clientHeight) / 2);
          tx = clampNum(tx, -overflowX, overflowX);
          ty = clampNum(ty, -overflowY, overflowY);
        }

        function applyTransform() {
          photoEl.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
          photoEl.style.cursor = scale > MIN_SCALE ? "grab" : "zoom-in";
          zoomInBtn.disabled = scale >= MAX_SCALE;
          zoomOutBtn.disabled = scale <= MIN_SCALE;
        }

        function setScale(next) {
          var clamped = clampNum(next, MIN_SCALE, MAX_SCALE);
          if (clamped === scale) return;
          scale = clamped;
          if (scale === MIN_SCALE) { tx = 0; ty = 0; }
          clampPan();
          applyTransform();
        }

        var zoomInBtn = toolButton("zoom-in", "Zoom in", ICONS.zoomIn);
        zoomInBtn.addEventListener("click", function () { setScale(scale + STEP); });
        var zoomOutBtn = toolButton("zoom-out", "Zoom out", ICONS.zoomOut);
        zoomOutBtn.addEventListener("click", function () { setScale(scale - STEP); });
        toolbar.appendChild(zoomInBtn);
        toolbar.appendChild(zoomOutBtn);
        applyTransform();

        /* mouse wheel / trackpad — continuous, multiplicative so it feels
           smooth rather than jumping in fixed steps like the buttons */
        photoEl.addEventListener("wheel", function (e) {
          e.preventDefault();
          setScale(scale * (e.deltaY < 0 ? 1.12 : 0.89));
        }, { passive: false });

        photoEl.addEventListener("pointerdown", function (e) {
          if (scale <= MIN_SCALE) return;
          dragging = true;
          dragMoved = false;
          startX = e.clientX; startY = e.clientY;
          startTx = tx; startTy = ty;
          photoEl.classList.add("is-panning");
          photoEl.setPointerCapture(e.pointerId);
        });
        photoEl.addEventListener("pointermove", function (e) {
          if (!dragging) return;
          var dx = e.clientX - startX, dy = e.clientY - startY;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
          tx = startTx + dx; ty = startTy + dy;
          clampPan();
          photoEl.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
        });
        function endDrag() {
          if (!dragging) return;
          dragging = false;
          photoEl.classList.remove("is-panning");
          photoEl.style.cursor = scale > MIN_SCALE ? "grab" : "zoom-in";
        }
        photoEl.addEventListener("pointerup", endDrag);
        photoEl.addEventListener("pointercancel", endDrag);

        /* click-to-zoom, but only when the pointer sequence above wasn't
           actually a drag (dragMoved stays false for a plain tap/click) */
        photoEl.addEventListener("click", function () {
          if (dragMoved) { dragMoved = false; return; }
          setScale(scale > MIN_SCALE ? MIN_SCALE : 2);
        });

        var pdl = toolButton("download", "Download", ICONS.download);
        pdl.addEventListener("click", function () { doDownload(fullSrc, titleText); });
        toolbar.appendChild(pdl);

        var pop = toolButton("open", "Open original", ICONS.open);
        pop.addEventListener("click", function () { window.open(fullSrc, "_blank", "noopener"); });
        toolbar.appendChild(pop);
      } else {
        stage.innerHTML = placeholderMarkup(type, tagText);
      }
      var psh = toolButton("share", "Share", ICONS.share);
      psh.addEventListener("click", function () { doShare(src || window.location.href, titleText); });
      toolbar.appendChild(psh);

    } else if (type === "video") {
      if (src) {
        var videoEl = document.createElement("video");
        videoEl.className = "viewer-media viewer-media--video";

        videoEl.controls = true;
        videoEl.playsInline = true;
        if (img) videoEl.poster = img;
        videoEl.src = src;
        stage.appendChild(videoEl);

        var vop = toolButton("open", "Open original", ICONS.open);
        vop.addEventListener("click", function () { window.open(src, "_blank", "noopener"); });
        toolbar.appendChild(vop);

        var vdl = toolButton("download", "Download", ICONS.download);
        vdl.addEventListener("click", function () { doDownload(src, titleText); });
        toolbar.appendChild(vdl);
      } else {
        stage.innerHTML = placeholderMarkup("video", tagText, img);
      }
      var vsh = toolButton("share", "Share", ICONS.share);
      vsh.addEventListener("click", function () { doShare(src || window.location.href, titleText); });
      toolbar.appendChild(vsh);

    } else {
      /* generic file — pdf, zip, or anything else */
      stage.innerHTML = placeholderMarkup("file", tagText, img);
      if (src) {
        var fop = toolButton("open", "Open", ICONS.open);
        fop.addEventListener("click", function () { window.open(src, "_blank", "noopener"); });
        toolbar.appendChild(fop);

        var fdl = toolButton("download", "Download", ICONS.download);
        fdl.addEventListener("click", function () { doDownload(src, titleText); });
        toolbar.appendChild(fdl);
      }
      var fsh = toolButton("share", "Share", ICONS.share);
      fsh.addEventListener("click", function () { doShare(src || window.location.href, titleText); });
      toolbar.appendChild(fsh);
    }

    var multi = list.length > 1;
    btnPrev.hidden = !multi;
    btnNext.hidden = !multi;
  }

  /* Makes the device/browser Back button close the viewer instead of
     leaving the page. openViewer() pushes one history entry per open
     (not per next/prev step — browsing photos inside an open viewer
     shouldn't pile up entries); popstate below catches Back being
     pressed while the viewer is open and closes it instead of letting
     the navigation happen. The URL itself is left untouched (pushState
     is called with the current href) so this can't collide with the
     #entries/#posts/#works tab-restore hash logic elsewhere on the page. */
  var viewerHistoryPushed = false;

  function openViewer(tile) {
    buildModal();
    lastFocused = document.activeElement;
    var list = visibleTiles();
    var idx = list.indexOf(tile);
    render(idx === -1 ? 0 : idx);
    modal.hidden = false;
    document.body.classList.add("viewer-open");
    requestAnimationFrame(function () { modal.classList.add("is-open"); });
    btnClose.focus();

    try {
      history.pushState({ postViewer: true }, "", location.href);
      viewerHistoryPushed = true;
    } catch (e) {}
  }

  function closeViewer(opts) {
    opts = opts || {};
    if (!modal || modal.hidden) return;
    stopControlsAutoHide();
    modal.classList.remove("is-open");
    document.body.classList.remove("viewer-open");
    var playingVideo = stage.querySelector("video");
    if (playingVideo) playingVideo.pause();
    setTimeout(function () { modal.hidden = true; }, 200);
    if (lastFocused && lastFocused.focus) lastFocused.focus();

    /* Closing via the × button, backdrop, or Escape leaves the history
       entry openViewer() pushed still sitting there — walk it back so
       the *next* real Back press leaves the page right away instead of
       silently eating one press first. Skip this when we're already
       responding to a Back press (opts.fromPopstate): that press is
       what fired popstate in the first place, so the entry is already
       gone — calling history.back() again here would jump back an
       extra page on top of it. */
    if (viewerHistoryPushed && !opts.fromPopstate) {
      try { history.back(); } catch (e) {}
    }
    viewerHistoryPushed = false;
  }

  window.addEventListener("popstate", function () {
    if (modal && !modal.hidden) {
      closeViewer({ fromPopstate: true });
    }
  });

  function step(dir) {
    render(currentIndex + dir);
  }

  tiles.forEach(function (tile) {
    tile.setAttribute("tabindex", "0");
    var titleText = (tile.querySelector(".post-title") || {}).textContent;
    tile.setAttribute("aria-label", titleText ? "View " + titleText : "View post");

    tile.addEventListener("click", function (e) {
      if (e.target.closest(".post-actions")) return; // share/download keep their own behaviour
      openViewer(tile);
    });
    tile.addEventListener("keydown", function (e) {
      if (e.target.closest(".post-actions")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openViewer(tile);
      }
    });
  });
})();

/* PWA install support: registers the service worker so the browser can
   offer "Install app" and the site keeps working offline. Feature-detected,
   so it's a safe no-op in browsers that don't support it. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function (e) {
      console.warn("[sw] registration failed:", e);
    });
  });
}
