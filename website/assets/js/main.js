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
    themeMeta.setAttribute('content', root.getAttribute('data-theme') === 'light' ? '#F7F3EE' : '#0B0B0B');
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

  /* ---------- The house builds as the visitor scrolls through the five steps ---------- */
  var story = $('[data-scrub]');
  if (story) {
    var storySteps = $$('.story-steps li', story);
    var storyParts = $$('[data-from]', story).map(function (el) {
      var out = (el.getAttribute('data-out') || '').split(',');
      return {
        el: el,
        from: Number(el.getAttribute('data-from')),
        to: Number(el.getAttribute('data-to')),
        outFrom: out.length === 2 ? Number(out[0]) : null,
        outTo: out.length === 2 ? Number(out[1]) : null
      };
    });
    var unit = function (v) { return Math.max(0, Math.min(1, v)); };
    var storyActive = -1;

    scrollJobs.push(function () {
      var vh = window.innerHeight;
      // the reading line sits lower on phones, where the drawing is pinned above the text
      var line = vh * (window.innerWidth >= 900 ? 0.55 : 0.78);
      var mids = storySteps.map(function (li) { var r = li.getBoundingClientRect(); return (r.top + r.bottom) / 2; });
      var share = 1 / mids.length;

      // each step owns an equal share of the build, complete when its text reaches the reading line
      var p;
      if (line <= mids[0]) {
        p = share * unit(1 - (mids[0] - line) / (vh * 0.6));
      } else if (line >= mids[mids.length - 1]) {
        p = 1;
      } else {
        var i = 0;
        while (i < mids.length - 2 && line >= mids[i + 1]) i++;
        p = share * (i + 1 + (line - mids[i]) / (mids[i + 1] - mids[i]));
      }

      storyParts.forEach(function (part) {
        part.el.style.setProperty('--t', unit((p - part.from) / (part.to - part.from)).toFixed(3));
        if (part.outFrom !== null) part.el.style.setProperty('--o', (1 - unit((p - part.outFrom) / (part.outTo - part.outFrom))).toFixed(3));
      });

      var nearest = 0, gapNow = Infinity;
      mids.forEach(function (m, n) { var d = Math.abs(m - line); if (d < gapNow) { gapNow = d; nearest = n; } });
      if (nearest !== storyActive) {
        storyActive = nearest;
        storySteps.forEach(function (li, n) { li.classList.toggle('is-active', n === nearest); });
      }
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
        property: el.property ? el.property.value.trim() : '',
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
  $$('[data-year]').forEach(function (el) { el.textContent = today.getFullYear(); });
})();
