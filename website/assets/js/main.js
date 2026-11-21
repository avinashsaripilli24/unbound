/* studio Unbound — behaviour: theme, language, navigation, motion, enquiry form */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var CFG = window.SU_CONFIG || {};
  var params = new URLSearchParams(location.search);

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  /* ---------- Theme: paper (light) / slate (dark) ---------- */
  var themeMeta = $('meta[name="theme-color"]');
  function paintThemeMeta() {
    if (!themeMeta) return;
    var onSlate = root.getAttribute('data-theme') === 'dark' || (doc.body && doc.body.getAttribute('data-page') === 'home');
    themeMeta.setAttribute('content', onSlate ? '#141615' : '#F1F0EC');
  }
  paintThemeMeta();
  $$('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set('su-theme', next);
      paintThemeMeta();
    });
  });
  // follow the system while the visitor has not chosen for themselves
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function (e) {
      if (store.get('su-theme') || params.get('theme')) return;
      root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      paintThemeMeta();
    };
    if (mq.addEventListener) mq.addEventListener('change', onScheme);
  }

  /* ---------- Language: English (in the page), Telugu and Hindi (loaded on demand) ---------- */
  var LANGS = { en: 'EN', te: 'తె', hi: 'हि' };
  var FONTS = {
    te: { family: 'Anek Telugu', sample: 'తెలుగు', url: 'https://fonts.googleapis.com/css2?family=Anek+Telugu:wght@300..700&display=swap' },
    hi: { family: 'Anek Devanagari', sample: 'हिन्दी', url: 'https://fonts.googleapis.com/css2?family=Anek+Devanagari:wght@300..700&display=swap' }
  };
  var originals = null;

  function remember() {
    if (originals) return;
    originals = { nodes: [], attrs: [], title: doc.title };
    $$('[data-i18n]').forEach(function (el) {
      originals.nodes.push({ el: el, key: el.getAttribute('data-i18n'), html: el.innerHTML });
    });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length < 2) return;
        var attr = bits[0].trim();
        originals.attrs.push({ el: el, attr: attr, key: bits[1].trim(), value: el.getAttribute(attr) });
      });
    });
  }

  function loadDictionary(lang) {
    return new Promise(function (resolve, reject) {
      if (lang === 'en' || (window.SU_LANG && window.SU_LANG[lang])) return resolve();
      var s = doc.createElement('script');
      s.src = 'assets/js/lang/' + lang + '.js';
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('language file missing')); };
      doc.head.appendChild(s);
    });
  }

  // resolves once the script's typeface is usable, so the first paint is not in a fallback face
  function loadFont(lang) {
    var font = FONTS[lang];
    if (!font) return Promise.resolve();
    var ready = function () {
      if (!doc.fonts || !doc.fonts.load) return null;
      return doc.fonts.load('400 1em "' + font.family + '"', font.sample).catch(function () {});
    };
    if ($('link[data-font="' + lang + '"]')) return Promise.resolve(ready());
    return new Promise(function (resolve) {
      var l = doc.createElement('link');
      l.rel = 'stylesheet';
      l.href = font.url;
      l.setAttribute('data-font', lang);
      l.onload = function () { resolve(ready()); };
      l.onerror = function () { resolve(); };
      doc.head.appendChild(l);
    });
  }

  function paint(lang) {
    remember();
    var dict = lang === 'en' ? null : (window.SU_LANG || {})[lang];
    originals.nodes.forEach(function (n) {
      n.el.innerHTML = dict && dict[n.key] != null ? dict[n.key] : n.html;
    });
    originals.attrs.forEach(function (a) {
      a.el.setAttribute(a.attr, dict && dict[a.key] != null ? dict[a.key] : a.value);
    });
    var titleKey = 'title.' + (doc.body.getAttribute('data-page') || 'home');
    doc.title = dict && dict[titleKey] ? dict[titleKey] : originals.title;
    root.setAttribute('lang', lang);
    $$('[data-lang-current]').forEach(function (el) { el.textContent = LANGS[lang]; });
    $$('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang));
    });
    doc.dispatchEvent(new CustomEvent('su:lang'));
  }

  function setLang(lang, save) {
    if (!LANGS[lang]) lang = 'en';
    var fontReady = loadFont(lang);
    return loadDictionary(lang).then(function () {
      paint(lang);
      if (save) store.set('su-lang', lang);
    }).catch(function () {
      paint('en');
    }).then(function () {
      // on first load the page is still hidden: give the typeface a moment, but never hold the page for long
      if (!root.classList.contains('i18n-wait')) return null;
      return Promise.race([fontReady, new Promise(function (r) { setTimeout(r, 1200); })]);
    }).then(function () {
      root.classList.remove('i18n-wait');
    });
  }

  var startLang = params.get('lang') || store.get('su-lang') || 'en';
  if (startLang !== 'en') setLang(startLang, !!params.get('lang'));
  else root.classList.remove('i18n-wait');
  setTimeout(function () { root.classList.remove('i18n-wait'); }, 2500);

  var langBtn = $('.lang-btn');
  var langMenu = $('.lang-menu');
  function closeLang() {
    if (!langMenu) return;
    langMenu.hidden = true;
    langBtn.setAttribute('aria-expanded', 'false');
  }
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = langMenu.hidden;
      langMenu.hidden = !open;
      langBtn.setAttribute('aria-expanded', String(open));
    });
    $$('[data-set-lang]').forEach(function (b) {
      b.addEventListener('click', function () {
        setLang(b.getAttribute('data-set-lang'), true);
        closeLang();
        langBtn.focus();
      });
    });
    doc.addEventListener('click', function (e) { if (!langMenu.contains(e.target)) closeLang(); });
  }

  /* ---------- Header and menu ---------- */
  var header = $('.site-header');
  var menuBtn = $('.menu-btn');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1040) setMenu(false); });
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeLang();
    setMenu(false);
  });

  var page = doc.body.getAttribute('data-page');
  $$('.nav a[data-nav], .footer-col a[data-nav]').forEach(function (a) {
    if (a.getAttribute('data-nav') === page) a.setAttribute('aria-current', 'page');
  });

  /* ---------- Reveal and draw on scroll ---------- */
  var watched = $$('.reveal, .draw');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    watched.forEach(function (el) { io.observe(el); });
  } else {
    watched.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Scroll work, done once per frame ---------- */
  var scrollJobs = [];
  var scrollQueued = false;
  function runScrollJobs() { scrollQueued = false; scrollJobs.forEach(function (job) { job(); }); }
  function queueScrollJobs() { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(runScrollJobs); } }
  window.addEventListener('scroll', queueScrollJobs, { passive: true });
  window.addEventListener('resize', queueScrollJobs);

  /* ---------- Stage bar (How We Work) ---------- */
  var stepper = $('[data-stepper]');
  if (stepper) {
    var stepLinks = $$('a', stepper);
    var stageSecs = $$('[data-stage]');
    scrollJobs.push(function () {
      var mark = window.innerHeight * 0.42;
      var active = -1;
      stageSecs.forEach(function (sec, i) { if (sec.getBoundingClientRect().top <= mark) active = i; });
      if (active === stageSecs.length - 1 && stageSecs[active].getBoundingClientRect().bottom < mark) active = -1;
      stepLinks.forEach(function (a, i) {
        if (i === active) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
    });
  }

  /* ---------- From idea to object: one drawing, five states ---------- */
  var evolve = $('[data-evolve]');
  if (evolve) {
    var evArt = $('.ev', evolve);
    var evSteps = $$('.evolve-steps li', evolve);
    var evLayers = $$('[data-at]', evArt);
    var evOut = $('[data-evolve-stage]', evolve);
    var evNow = -1;
    var showStage = function (n) {
      evLayers.forEach(function (layer) { layer.classList.toggle('on', Number(layer.getAttribute('data-at')) <= n); });
      evArt.classList.toggle('past-1', n > 1);
      evArt.classList.toggle('at-5', n >= 5);
      evSteps.forEach(function (li, i) { li.classList.toggle('is-active', i + 1 === n); });
      var name = n > 0 ? $('h3', evSteps[n - 1]).textContent : '';
      if (evOut) evOut.textContent = Math.max(1, n) + ' / 5' + (name ? ' · ' + name : '');
    };
    scrollJobs.push(function () {
      var vh = window.innerHeight;
      var box = evolve.getBoundingClientRect();
      var n = 0;
      if (box.top < vh * 0.8) {
        // the reading line sits lower on phones, where the drawing is pinned above the text
        var line = vh * (window.innerWidth >= 960 ? 0.5 : 0.74);
        var nearest = Infinity;
        evSteps.forEach(function (li, i) {
          var r = li.getBoundingClientRect();
          var d = Math.abs((r.top + r.bottom) / 2 - line);
          if (d < nearest) { nearest = d; n = i + 1; }
        });
      }
      if (n !== evNow) { evNow = n; showStage(n); }
    });
    doc.addEventListener('su:lang', function () { if (evNow >= 0) showStage(evNow); });
  }

  /* ---------- The slate: a gesture goes in, a drawing comes out ---------- */
  var slate = $('[data-slate]');
  if (slate && window.PointerEvent) {
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var board = $('.slate-user', slate);
    var shapeLayer = $('.slate-shapes', board);
    var labelLayer = $('.slate-labels', board);
    var clearBtn = $('[data-slate-clear]', slate);
    var demo = $('.hero-demo svg', slate);
    var items = [];
    var stroke = null;
    var rawPath = null;

    var make = function (name, attrs, parent) {
      var node = doc.createElementNS(SVG_NS, name);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      parent.appendChild(node);
      return node;
    };
    var at = function (e) { var r = board.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    var gap = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
    var f = function (n) { return n.toFixed(1); };
    // one pixel reads as ten millimetres, rounded the way a site measure would be
    var mm = function (px) {
      var text = String(Math.max(50, Math.round(px / 5) * 50));
      return text.length > 3 ? text.slice(0, -3) + ' ' + text.slice(-3) : text;
    };
    var note = function (parent, x, y, text, turn) {
      var t = make('text', { x: f(x), y: f(y), 'text-anchor': 'middle' }, parent);
      if (turn) t.setAttribute('transform', 'rotate(' + f(turn) + ' ' + f(x) + ' ' + f(y) + ')');
      t.textContent = text;
    };

    var draft = function (pts) {
      var a = pts[0], b = pts[pts.length - 1];
      var len = 0, i;
      for (i = 1; i < pts.length; i++) len += gap(pts[i - 1], pts[i]);
      var g = make('g', {}, shapeLayer);
      var gl = make('g', {}, labelLayer);

      if (len < 8) {
        make('circle', { 'class': 'dot', cx: f(a.x), cy: f(a.y), r: 5.5 }, gl);
      } else {
        var minY = Infinity, maxY = -Infinity, cx = 0, cy = 0;
        pts.forEach(function (p) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); cx += p.x; cy += p.y; });
        cx /= pts.length; cy /= pts.length;
        var chord = gap(a, b);
        var base = Math.max(a.y, b.y);
        var rise = base - minY;
        var span = Math.abs(b.x - a.x);

        if (len > 90 && chord < len * 0.22) {
          // a closed loop becomes a circle
          var r = 0;
          pts.forEach(function (p) { r += gap(p, { x: cx, y: cy }); });
          r /= pts.length;
          make('path', { 'class': 'shape', pathLength: 1, d: 'M' + f(cx + r) + ' ' + f(cy) + 'A' + f(r) + ' ' + f(r) + ' 0 1 1 ' + f(cx - r) + ' ' + f(cy) + 'A' + f(r) + ' ' + f(r) + ' 0 1 1 ' + f(cx + r) + ' ' + f(cy) }, g);
          var k = r * 0.7071;
          make('path', { 'class': 'tick', d: 'M' + f(cx - 6) + ' ' + f(cy) + 'H' + f(cx + 6) + 'M' + f(cx) + ' ' + f(cy - 6) + 'V' + f(cy + 6) + 'M' + f(cx) + ' ' + f(cy) + 'L' + f(cx + k) + ' ' + f(cy - k) }, gl);
          note(gl, cx + k / 2 + 10, cy - k / 2 + 10, 'R ' + mm(r), -45);
        } else if (span > 36 && rise > span * 0.55 && Math.abs(b.y - a.y) < span * 0.5 && maxY - base < rise * 0.2) {
          // a stroke that rises and returns to the ground becomes an arched opening
          var x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
          var rad = (x2 - x1) / 2;
          var spring = Math.min(base, minY + rad);
          make('path', { 'class': 'shape', pathLength: 1, d: 'M' + f(x1) + ' ' + f(base) + 'V' + f(spring) + 'A' + f(rad) + ' ' + f(rad) + ' 0 0 1 ' + f(x2) + ' ' + f(spring) + 'V' + f(base) }, g);
          make('path', { 'class': 'tick', d: 'M' + f(x1 - 16) + ' ' + f(base) + 'H' + f(x2 + 16) + 'M' + f(x1) + ' ' + f(base + 16) + 'H' + f(x2) + 'M' + f(x1) + ' ' + f(base + 10) + 'V' + f(base + 22) + 'M' + f(x2) + ' ' + f(base + 10) + 'V' + f(base + 22) }, gl);
          note(gl, (x1 + x2) / 2, base + 36, mm(x2 - x1) + ' × ' + mm(base - spring + rad));
        } else {
          // anything else becomes a straight line, squared up if it is nearly level or plumb
          var p = { x: a.x, y: a.y }, q = { x: b.x, y: b.y };
          var dx = q.x - p.x, dy = q.y - p.y;
          if (Math.abs(dy) < Math.abs(dx) * 0.12) q.y = p.y;
          else if (Math.abs(dx) < Math.abs(dy) * 0.12) q.x = p.x;
          dx = q.x - p.x; dy = q.y - p.y;
          var L = Math.hypot(dx, dy) || 1;
          var nx = -dy / L, ny = dx / L;
          make('path', { 'class': 'shape', pathLength: 1, d: 'M' + f(p.x) + ' ' + f(p.y) + 'L' + f(q.x) + ' ' + f(q.y) }, g);
          make('path', { 'class': 'tick', d: 'M' + f(p.x - nx * 6) + ' ' + f(p.y - ny * 6) + 'L' + f(p.x + nx * 6) + ' ' + f(p.y + ny * 6) + 'M' + f(q.x - nx * 6) + ' ' + f(q.y - ny * 6) + 'L' + f(q.x + nx * 6) + ' ' + f(q.y + ny * 6) }, gl);
          var deg = Math.atan2(dy, dx) * 180 / Math.PI;
          if (deg > 90) deg -= 180; else if (deg < -90) deg += 180;
          var side = ny > 0 ? -1 : 1;
          note(gl, (p.x + q.x) / 2 + nx * 14 * side, (p.y + q.y) / 2 + ny * 14 * side, mm(L), deg);
        }
      }

      items.push([g, gl]);
      if (items.length > 14) items.shift().forEach(function (node) { node.remove(); });
      if (clearBtn) clearBtn.hidden = false;
    };

    var endStroke = function (cancelled) {
      if (!stroke) return;
      var pts = stroke, path = rawPath;
      stroke = rawPath = null;
      path.classList.add('is-gone');
      setTimeout(function () { path.remove(); }, 600);
      if (!cancelled) draft(pts);
    };

    slate.addEventListener('pointerdown', function (e) {
      if (e.button || e.target.closest('a, button')) return;
      var p = at(e);
      stroke = [p];
      rawPath = make('path', { 'class': 'raw', d: 'M' + f(p.x) + ' ' + f(p.y) }, board);
      try { slate.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    });
    slate.addEventListener('pointermove', function (e) {
      if (!stroke) return;
      var p = at(e);
      if (gap(p, stroke[stroke.length - 1]) < 2) return;
      stroke.push(p);
      rawPath.setAttribute('d', rawPath.getAttribute('d') + 'L' + f(p.x) + ' ' + f(p.y));
    });
    slate.addEventListener('pointerup', function () { endStroke(false); });
    slate.addEventListener('pointercancel', function () { endStroke(true); });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        items.forEach(function (pair) { pair.forEach(function (node) { node.remove(); }); });
        items = [];
        if (demo) demo.classList.add('is-wiped');
        clearBtn.hidden = true;
      });
    }
  }

  /* ---------- Dimension strings that measure the real page ---------- */
  var measures = $$('[data-measure]');
  if (measures.length) {
    scrollJobs.push(function () {
      measures.forEach(function (m) { m.textContent = Math.round(m.parentElement.getBoundingClientRect().width); });
    });
  }
  runScrollJobs();

  /* ---------- Contact details from config.js ---------- */
  var contact = CFG.contact || {};
  var waNumber = String(contact.whatsapp || '').replace(/[^\d]/g, '');
  function waLink(text) { return 'https://wa.me/' + waNumber + (text ? '?text=' + encodeURIComponent(text) : ''); }

  $$('[data-contact]').forEach(function (el) {
    var type = el.getAttribute('data-contact');
    var value = contact[type];
    var label = $('[data-contact-text]', el);
    var row = el.closest('[data-contact-row]') || el;
    if (!value) { row.hidden = true; return; }
    row.hidden = false;
    if (type === 'phone') {
      el.href = 'tel:' + String(value).replace(/[^\d+]/g, '');
      if (label) label.textContent = value;
    } else if (type === 'email') {
      el.href = 'mailto:' + value;
      if (label) label.textContent = value;
    } else if (type === 'whatsapp') {
      el.href = waLink('Hello studio Unbound, I would like to talk about a project.');
      el.target = '_blank'; el.rel = 'noopener';
      if (label) label.textContent = '+' + waNumber;
    } else {
      el.href = value;
      el.target = '_blank'; el.rel = 'noopener';
    }
  });

  var company = CFG.company || {};
  $$('[data-company-row]').forEach(function (row) {
    var value = company[row.getAttribute('data-company-row')];
    if (!value) return;
    $('[data-company-text]', row).textContent = value;
    row.hidden = false;
    var list = row.closest('[data-company]');
    if (list) list.hidden = false;
  });

  /* ---------- Photographs from config.js ---------- */
  var photos = CFG.photos || {};
  $$('[data-photo]').forEach(function (el) {
    var src = photos[el.getAttribute('data-photo')];
    if (!src) return;
    var img = new Image();
    img.className = 'photo';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = el.getAttribute('data-photo-alt') || '';
    img.src = src;
    el.insertBefore(img, el.firstChild);
    el.classList.add('has-photo');
    el.hidden = false;
  });

  /* ---------- Enquiry form ---------- */
  var form = $('#enquiry');
  if (form) {
    var fcfg = CFG.form || {};
    var hasEndpoint = !!(fcfg.web3formsKey || fcfg.endpoint);
    var opened = Date.now();
    var sendBtn = $('[data-send]', form);
    var waBtn = $('[data-send-wa]', form);
    var status = {
      ok: $('[data-status="ok"]'),
      err: $('[data-status="err"]'),
      off: $('[data-status="off"]')
    };

    var interest = params.get('interest');
    if (interest && form.elements.interest) {
      var opt = $('option[value="' + interest.replace(/[^a-z]/g, '') + '"]', form.elements.interest);
      if (opt) form.elements.interest.value = opt.value;
    }

    if (waBtn) waBtn.hidden = !(waNumber && hasEndpoint);

    var show = function (name) {
      Object.keys(status).forEach(function (k) { if (status[k]) status[k].hidden = k !== name; });
      if (name && status[name]) status[name].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };

    var read = function () {
      var el = form.elements;
      var sel = el.interest;
      return {
        name: el.name.value.trim(),
        phone: el.phone.value.trim(),
        email: el.email.value.trim(),
        location: el.location.value.trim(),
        interest: sel && sel.value ? sel.options[sel.selectedIndex].text : '',
        property: el.property.value.trim(),
        vision: el.vision.value.trim()
      };
    };

    var compose = function (d) {
      var lines = ['New enquiry from the studio Unbound website', ''];
      [['Name', d.name], ['Phone', d.phone], ['Email', d.email], ['Property location', d.location],
        ['Looking for', d.interest], ['About the property', d.property], ['Wants to create', d.vision]]
        .forEach(function (row) { if (row[1]) lines.push(row[0] + ': ' + row[1]); });
      return lines.join('\n');
    };

    var viaWhatsApp = function () {
      if (!form.reportValidity()) return;
      window.open(waLink(compose(read())), '_blank', 'noopener');
    };
    if (waBtn) waBtn.addEventListener('click', viaWhatsApp);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = read();
      // spam traps: a hidden field people never see, and a form filled faster than a person can type
      if (form.elements.company.value || Date.now() - opened < 2500) { form.reset(); show('ok'); return; }

      if (!hasEndpoint) {
        if (waNumber) { window.open(waLink(compose(d)), '_blank', 'noopener'); return; }
        if (contact.email) {
          location.href = 'mailto:' + contact.email + '?subject=' + encodeURIComponent('Project enquiry: ' + d.name) +
            '&body=' + encodeURIComponent(compose(d));
          return;
        }
        show('off');
        return;
      }

      var url = fcfg.endpoint || 'https://api.web3forms.com/submit';
      var body = {
        subject: 'Website enquiry: ' + d.name + (d.location ? ' (' + d.location + ')' : ''),
        from_name: 'studio Unbound website',
        name: d.name, phone: d.phone, email: d.email, location: d.location,
        looking_for: d.interest, about_the_property: d.property, wants_to_create: d.vision,
        language: root.getAttribute('lang') || 'en'
      };
      if (fcfg.web3formsKey) body.access_key = fcfg.web3formsKey;

      sendBtn.disabled = true;
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          if (!res.ok || json.success === false) throw new Error('not sent');
          form.reset();
          show('ok');
        });
      }).catch(function () {
        show('err');
      }).then(function () {
        sendBtn.disabled = false;
      });
    });
  }

  /* ---------- Small things ---------- */
  var today = new Date();
  var two = function (n) { return (n < 10 ? '0' : '') + n; };
  $$('[data-year]').forEach(function (el) { el.textContent = today.getFullYear(); });
  $$('[data-today]').forEach(function (el) { el.textContent = two(today.getDate()) + '.' + two(today.getMonth() + 1) + '.' + today.getFullYear(); });
})();
