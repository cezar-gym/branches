/* ==========================================================================
   CEZAR — render.js · v4 (الموبايل أولًا)
   كل حاجة بتتولّد من data.js + كل التفاعل باللمس:
   شريط «دلوقتي»، شيت الفرع من الخريطة، كوتشينة الصور بالسحب، عارض الصور،
   الأكورديون، ساعة الـ12 ساعة (الفرع التاني برّه والأول جوّه) بعقرب بيتسحب بالصباع،
   الأسعار لكل فرع + VIP، الفوتر، واتساب «أنهي فرع؟». بيشتغل حتى من غير GSAP.
   ========================================================================== */
(() => {
  const D = window.CZ, H = window.CezarHours;
  if (!D || !H) return;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const G = window.gsap;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = !!G && !reduce;
  if (G && window.CustomEase) {
    G.registerPlugin(CustomEase);
    CustomEase.create('cz', '0.16,1,0.3,1');
    CustomEase.create('czInOut', '0.76,0,0.24,1');
  }
  const SPRITE = 'assets/icons/sprite.svg';
  const ico = (n) => `<svg class="ico" aria-hidden="true"><use href="${SPRITE}#i-${n}"/></svg>`;
  const B = {}; D.branches.forEach((b) => { B[b.id] = b; });
  const waTo = (id, t) => `https://wa.me/${(B[id] || B.b1).whatsapp}?text=${encodeURIComponent(t)}`;
  const GN = { men: 'رجالة', women: 'سيدات' };
  const GL = { men: 'للرجالة', women: 'للسيدات' };
  const dayNames = D.schedule.days;
  const segsOf = (id) => (B[id] && B[id].schedule) || D.schedule.segments;
  const sessionsWord = (n) => (n >= 3 && n <= 10 ? 'حصص' : 'حصة');
  const monthsWord = (n) => (n >= 3 && n <= 10 ? 'شهور' : 'شهر');
  const hm = (m) => H.clockFromMins(m);
  const pad = (n) => String(n).padStart(2, '0');
  const abs = (p) => new URL(p, location.href).href;
  const shortAddr = (b) => b.address.replace(/^.*?شرق النيل، /, '');
  /* اهتزازة خفيفة (أندرويد) — بتأكّد اللمسة من غير صوت */
  const buzz = (ms = 8) => {
    try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) {}
  };
  window.CZBuzz = buzz;

  /* ---------- قفل الصفحة لما شيت أو عارض مفتوح ---------- */
  let locks = 0;
  const lock = (on) => {
    locks = Math.max(0, locks + (on ? 1 : -1));
    root.classList.toggle('is-locked', locks > 0);
    document.dispatchEvent(new CustomEvent(locks > 0 ? 'cz:lock' : 'cz:unlock'));
  };

  /* ---------- شيت من تحت: بيطلع بنعومة، وبيتقفل بالسحب لتحت ---------- */
  function makeSheet(el) {
    if (!el) return null;
    const scrim = el.children[0], panel = el.children[1];
    let open = false, last = null;
    const show = () => {
      if (open) return;
      open = true; last = document.activeElement; el.hidden = false; lock(true);
      if (anim) {
        G.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' });
        G.fromTo(panel, { y: () => panel.offsetHeight + 40 }, { y: 0, duration: 0.8, ease: 'cz' });
        G.fromTo(panel.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.04, delay: 0.12, ease: 'cz' });
      }
      const f = $('a, button', panel); if (f) f.focus({ preventScroll: true });
    };
    const hide = () => {
      if (!open) return;
      open = false;
      const done = () => { el.hidden = true; if (G) G.set(panel, { clearProps: 'transform' }); scrim.style.opacity = ''; lock(false); if (last) last.focus({ preventScroll: true }); };
      if (anim) { G.to(scrim, { opacity: 0, duration: 0.3 }); G.to(panel, { y: panel.offsetHeight + 40, duration: 0.42, ease: 'power2.in', onComplete: done }); } else done();
    };
    el.addEventListener('click', (e) => { if (e.target.closest('[data-sheet-close], [data-wa-close]')) hide(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
    let y0 = null, dy = 0;
    panel.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
    panel.addEventListener('touchmove', (e) => {
      if (y0 === null || !G) return;
      dy = e.touches[0].clientY - y0;
      if (dy > 0 && panel.scrollTop <= 0) { e.preventDefault(); G.set(panel, { y: dy * 0.9 }); scrim.style.opacity = String(Math.max(0, 1 - dy / 420)); }
      else dy = 0;
    }, { passive: false });
    panel.addEventListener('touchend', () => {
      if (y0 === null) return;
      y0 = null;
      if (dy > 110) { buzz(6); hide(); }
      else if (dy > 0 && G) { G.to(panel, { y: 0, duration: 0.55, ease: 'cz' }); G.to(scrim, { opacity: 1, duration: 0.3 }); }
    });
    return { show, hide, panel };
  }

  /* ---------- واتساب: لو اللينك مش محدد له فرع، اسأل «أنهي فرع؟» ---------- */
  const waSheet = makeSheet($('[data-wa-sheet]'));
  const waOpts = $('[data-wa-opts]');
  if (waSheet) waOpts.addEventListener('click', (e) => { if (e.target.closest('a')) setTimeout(waSheet.hide, 80); });
  $$('[data-wa]').forEach((a) => {
    const br = a.dataset.br;
    a.href = waTo(br || 'b1', a.dataset.wa);
    if (!br && waSheet) a.addEventListener('click', (e) => {
      e.preventDefault(); buzz(6);
      waOpts.innerHTML = D.branches.map((b) => `<a class="${b.id}" href="${waTo(b.id, a.dataset.wa)}" target="_blank" rel="noopener"><span class="n">${b.n}</span><span><b>${b.name}</b><small>${b.short} · <span dir="ltr">${b.mobile}</span></small></span>${ico('brand-whatsapp')}</a>`).join('');
      waSheet.show();
    });
  });

  const todaySlots = (id) => {
    const segs = segsOf(id)[String(new Date().getDay())] || [];
    return segs.map((s) => `${GN[s.g]} ${hm(s.from)}–${hm(s.to)}`).join(' · ') || 'مقفول النهارده';
  };

  /* ---------- مفتوح دلوقتي؟ (النافبار + شريط «دلوقتي» + الكروت) ---------- */
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  const statusText = (s, now) => {
    if (s.open) return `مفتوح دلوقتي · ${GN[s.seg.g]} لحد ${H.clock(s.seg.end)}`;
    if (s.next) return `مقفول · بيفتح ${sameDay(s.next.start, now) ? '' : 'بكرة '}${H.clock(s.next.start)}`;
    return 'المواعيد';
  };
  const nowBox = $('[data-now]');
  function live() {
    const now = Date.now();
    const st = {};
    D.branches.forEach((b) => { st[b.id] = H.status(segsOf(b.id), new Date(now)); });
    $$('[data-live-branch]').forEach((el) => {
      const s = st[el.dataset.liveBranch];
      el.classList.toggle('is-open', s.open);
      $('[data-live-text]', el).textContent = statusText(s, now);
    });
    const gs = [...new Set(Object.values(st).filter((s) => s.open).map((s) => s.seg.g))];
    const text = gs.length === 2 ? 'مفتوح دلوقتي · رجالة وسيدات' : gs.length ? `مفتوح دلوقتي · ${GN[gs[0]]}` : statusText(st.b2, now);
    $$('[data-live]').forEach((el) => {
      el.classList.toggle('is-open', gs.length > 0);
      const t = $('[data-live-text]', el); if (t) t.textContent = text;
    });
    if (nowBox) {
      const html = ['b2', 'b1'].map((id) => {
        const b = B[id], s = st[id];
        const line = s.open ? `${GN[s.seg.g]} لحد ${H.clock(s.seg.end)}` : s.next ? `${GN[s.next.g]} من ${sameDay(s.next.start, now) ? '' : 'بكرة '}${H.clock(s.next.start)}` : b.short;
        return `<button class="now__item ${id}${s.open ? ' is-open' : ''}" type="button" data-sheet-open="${id}"><span class="n">${b.n}</span><span><b>${b.name}</b><small>${b.short} · ${line}</small></span><span class="st"><i></i>${s.open ? 'فاتح' : 'مقفول'}</span></button>`;
      }).join('');
      if (nowBox.dataset.html !== html) { nowBox.innerHTML = html; nowBox.dataset.html = html; }
    }
  }
  live();
  setInterval(live, 30000);

  /* ---------- الهيرو على الموبايل: المبنى بيتقاس عشان يقع بالظبط تحت «GYM» وفوق العنوان ----------
     صورة المبنى: طوله 0.698 من عرضه. لو الشاشة قصيرة المبنى بيصغر (وأطرافه بتدوب)،
     ولو طويلة بيفضل بعرض الشاشة والسما بتبان فوقه. التابلت والكمبيوتر ليهم CSS ثابت. */
  const heroEl = $('.hero');
  if (heroEl) {
    const hw = $('.hero__word', heroEl), hc = $('.hero__copy', heroEl);
    let lw = 0, lh = 0;
    const fitHero = (force) => {
      const W = window.innerWidth, Vh = document.documentElement.clientHeight;
      if (!force && W === lw && Math.abs(Vh - lh) < 120) return;   // شريط العنوان بيظهر ويختفي — مش محتاج نعيد
      lw = W; lh = Vh;
      heroEl.style.minHeight = '';
      if (heroEl.clientWidth >= 600) { heroEl.style.removeProperty('--sw'); heroEl.style.removeProperty('--base'); heroEl.classList.remove('hero--narrow'); return; }
      const w = heroEl.clientWidth;
      const top = hw.offsetTop + hw.offsetHeight + 8;
      let base = hc.offsetTop - 8;
      /* شاشة قصيرة جدًا (آيفون صغير والشرايط ظاهرة): الهيرو بيطول شوية بدل ما المبنى يتعصر */
      const lack = w * 0.8 * 0.698 - (base - top);
      if (lack > 0) { heroEl.style.minHeight = `${Math.ceil(heroEl.clientHeight + lack)}px`; base += lack; }
      const sw = Math.min(w, (base - top) / 0.698);
      heroEl.style.setProperty('--sw', `${sw.toFixed(1)}px`);
      heroEl.style.setProperty('--base', `${base.toFixed(1)}px`);
      heroEl.classList.toggle('hero--narrow', sw < w - 1);
    };
    fitHero(true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitHero(true));
    let rz;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => fitHero(false), 120); });
    window.CZFitHero = fitHero;
  }

  /* ---------- عارض الصور ملء الشاشة: سحب يمين/شمال، وسحب لتحت يقفل ---------- */
  const viewer = (() => {
    const el = $('[data-viewer]');
    if (!el) return null;
    const track = $('[data-viewer-track]', el), count = $('[data-viewer-count]', el), cap = $('[data-viewer-cap]', el);
    let list = [], idx = 0, open = false, last = null;
    const update = () => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (i === idx && count.dataset.set) return;
      idx = Math.max(0, Math.min(list.length - 1, i)); count.dataset.set = '1';
      count.textContent = `${pad(idx + 1)} / ${pad(list.length)}`;
      const it = list[idx] || {};
      cap.textContent = it.name ? `${it.name}${it.line ? ' — ' + it.line : ''}` : '';
    };
    let st;
    track.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(update, 60); }, { passive: true });
    const show = (items, start = 0) => {
      list = items; idx = start; last = document.activeElement; count.dataset.set = '';
      track.innerHTML = items.map((it, k) => `<figure class="viewer__item"><img src="${it.src}" alt="${it.alt || it.name || ''}"${Math.abs(k - start) > 1 ? ' loading="lazy"' : ''} decoding="async"></figure>`).join('');
      el.hidden = false; open = true; lock(true); buzz(5);
      track.scrollLeft = start * track.clientWidth;
      update();
      if (anim) {
        G.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' });
        const im = $$('img', track)[start];
        if (im) G.fromTo(im, { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'cz' });
        G.fromTo([cap, $('.viewer__top', el)], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.15, ease: 'cz' });
      }
      $('[data-viewer-close]', el).focus({ preventScroll: true });
    };
    const hide = () => {
      if (!open) return;
      open = false;
      const done = () => { el.hidden = true; track.innerHTML = ''; if (G) G.set([el, track], { clearProps: 'all' }); lock(false); if (last) last.focus({ preventScroll: true }); };
      if (anim) G.to(el, { opacity: 0, duration: 0.3, onComplete: done }); else done();
    };
    $('[data-viewer-close]', el).addEventListener('click', hide);
    document.addEventListener('keydown', (e) => {
      if (!open) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') track.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * track.clientWidth, behavior: 'smooth' });
    });
    /* سحب لتحت = قفل (بنقفل المحور بعد 10px عشان السحب الأفقي يفضل للصور) */
    let t0 = null, axis = null, dy = 0;
    track.addEventListener('touchstart', (e) => { if (e.touches.length > 1) { t0 = null; return; } t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY }; axis = null; dy = 0; }, { passive: true });
    track.addEventListener('touchmove', (e) => {
      if (!t0 || !G || e.touches.length > 1) return;
      const dx = e.touches[0].clientX - t0.x; dy = e.touches[0].clientY - t0.y;
      if (!axis && Math.hypot(dx, dy) > 10) axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
      if (axis === 'y') {
        e.preventDefault();
        G.set(track, { y: dy, scale: 1 - Math.min(Math.abs(dy) / 1600, 0.12) });
        el.style.backgroundColor = `rgba(0,0,0,${Math.max(0.25, 1 - Math.abs(dy) / 500)})`;
      }
    }, { passive: false });
    track.addEventListener('touchend', () => {
      if (!t0) return;
      t0 = null;
      if (axis === 'y' && Math.abs(dy) > 110) { buzz(6); hide(); }
      else if (axis === 'y' && G) { G.to(track, { y: 0, scale: 1, duration: 0.5, ease: 'cz' }); el.style.backgroundColor = ''; }
    });
    return { show, hide };
  })();
  const galleryItems = (br) => (D.gallery[br] || []).map((g) => ({ src: `assets/img/${g.img}.webp`, name: g.name, line: g.line, alt: `${g.name} — ${B[br].name}` }));
  document.addEventListener('click', (e) => {
    if (!viewer) return;
    const gal = e.target.closest('[data-view-gal]');
    if (gal) { viewer.show(galleryItems(gal.dataset.viewGal), 0); return; }
    const one = e.target.closest('[data-view-src]');
    if (one) viewer.show([{ src: one.dataset.viewSrc, alt: one.alt || '', name: one.dataset.viewName || '' }], 0);
  });

  /* ---------- كروت الفرعين ---------- */
  const bc = $('[data-bcards]');
  if (bc) {
    bc.innerHTML = ['b1', 'b2'].map((id) => {
      const b = B[id];
      return `
      <article class="bcard bcard--${b.id}" data-bcard="${b.id}">
        <div class="bcard__media" data-view-gal="${b.id}" role="button" tabindex="0" aria-label="صور ${b.name}">
          <img src="assets/img/${b.img}@s.webp" srcset="assets/img/${b.img}@s.webp 860w, assets/img/${b.img}.webp 1600w" sizes="(max-width: 899px) 100vw, 50vw" width="860" height="${b.img === 'b1-floor' ? 476 : 573}" alt="${b.name}" loading="lazy">
          <span class="bcard__n">${b.n}</span>
        </div>
        <div class="bcard__body">
          <p class="mono">${b.latin}</p>
          <h3>${b.name}${b.isNew ? '<span class="newtag">NEW</span>' : ''}</h3>
          <p class="bcard__addr">${b.address}</p>
          <div class="bcard__today"><b>النهارده${b.scheduleNote ? ' · ' + b.scheduleNote : ''}</b><span>${todaySlots(b.id)}</span></div>
          <span class="live" data-live-branch="${b.id}"><i class="live__dot"></i><span data-live-text>—</span></span>
          ${D.vip && D.vip.to.includes(b.id) ? `<p class="bcard__vip"><b>VIP</b>${b.id === D.vip.from ? 'اشتراك VIP هنا بيفتحلك الفرع الأول كمان.' : 'مفتوح كمان لمشتركين VIP من الفرع الجديد.'}</p>` : ''}
          <div class="bcard__acts">
            <a class="btn btn--sm" href="${b.maps}" target="_blank" rel="noopener">${ico('map-pin')}الخريطة</a>
            <a class="btn btn--ghost btn--sm" href="${waTo(b.id, `أهلًا، عندي سؤال عن ${b.name}`)}" target="_blank" rel="noopener">${ico('brand-whatsapp')}واتساب</a>
            ${b.landline ? `<a class="btn btn--ghost btn--sm" href="tel:${b.landline.replace(/[^\d]/g, '')}">${ico('phone')}<span dir="ltr">${b.landline}</span></a>` : ''}
          </div>
        </div>
      </article>`;
    }).join('');
    $$('[data-view-gal]', bc).forEach((m) => m.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); m.click(); } }));
    live();
  }

  /* ---------- شيت الفرع (من دبابيس الخريطة وشريط «دلوقتي») ---------- */
  const brSheet = makeSheet($('[data-sheet]'));
  const sheetBody = $('[data-sheet-body]');
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-sheet-open]');
    if (!t || !brSheet) return;
    const b = B[t.dataset.sheetOpen], now = Date.now(), s = H.status(segsOf(b.id), new Date(now));
    buzz(8);
    sheetBody.innerHTML = `
      <img class="sheet__img" src="assets/img/${b.img}@s.webp" width="860" height="${b.img === 'b1-floor' ? 476 : 573}" alt="${b.name}" data-view-gal="${b.id}">
      <p class="mono muted">${b.latin}</p>
      <h3>${b.name}${b.isNew ? '<span class="newtag">NEW</span>' : ''}</h3>
      <p>${b.address}</p>
      <div class="bcard__today"><b>النهارده${b.scheduleNote ? ' · ' + b.scheduleNote : ''}</b><span>${todaySlots(b.id)}</span></div>
      <span class="live${s.open ? ' is-open' : ''}"><i class="live__dot"></i><span>${statusText(s, now)}</span></span>
      ${D.vip && D.vip.to.includes(b.id) ? `<p class="bcard__vip"><b>VIP</b>${b.id === D.vip.from ? 'اشتراك VIP هنا بيفتحلك الفرع الأول كمان.' : 'مفتوح كمان لمشتركين VIP من الفرع الجديد.'}</p>` : ''}
      <div class="sheet__acts">
        <a class="btn btn--lime" href="${b.maps}" target="_blank" rel="noopener">${ico('map-pin')}افتح على الخريطة</a>
        <a class="btn btn--ghost btn--sm" href="${waTo(b.id, `أهلًا، عندي سؤال عن ${b.name}`)}" target="_blank" rel="noopener">${ico('brand-whatsapp')}واتساب</a>
        <a class="btn btn--ghost btn--sm" href="tel:${(b.landline || b.mobile).replace(/[^\d]/g, '')}">${ico('phone')}اتصل</a>
      </div>`;
    brSheet.show();
  });

  /* ---------- جوّه: كوتشينة صور — اسحب الكارت يطير، ودوس عليه يفتح كامل ---------- */
  (() => {
    const deck = $('[data-deck]');
    if (!deck || !D.gallery) return;
    const tabs = $('[data-deck-tabs]'), count = $('[data-deck-count]');
    let br = 'b2', cards = [], cur = 0, busy = false, drag = null;
    const n = () => cards.length;
    const slot = (k) => ({ x: 0, y: k * -22, scale: 1 - k * 0.065, rotation: k === 0 ? 0 : (k % 2 ? -1 : 1) * (1.6 + k * 0.9), opacity: k > 3 ? 0 : 1 });
    const place = (c, s, dur = 0.75, delay = 0) => {
      if (G) G.to(c, { ...s, duration: anim ? dur : 0, delay: anim ? delay : 0, ease: 'cz', overwrite: 'auto' });
      else { c.style.transform = `translateY(${s.y}px) scale(${s.scale}) rotate(${s.rotation}deg)`; c.style.opacity = s.opacity; }
    };
    const layout = (dur) => {
      cards.forEach((c, i) => {
        const k = (i - cur + n()) % n();
        c.style.zIndex = String(50 - k);
        c.setAttribute('aria-hidden', String(k !== 0));
        place(c, slot(k), dur);
      });
      count.textContent = `${pad(cur + 1)} / ${pad(n())}`;
    };
    /* الصور بتتحط لما الكوتشينة تقرب من الشاشة (كانت ~350KB بتتنزل مع أول الصفحة) */
    let near = false;
    const hydrate = () => {
      if (!near) return;
      $$('.dcard', deck).forEach((c) => {
        if (c.dataset.bg) { c.style.setProperty('--img', c.dataset.bg); delete c.dataset.bg; }
        const im = $('img[data-src]', c);
        if (im) { im.decoding = 'async'; im.src = im.dataset.src; im.removeAttribute('data-src'); }
      });
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near = true; hydrate(); io.disconnect(); } }, { rootMargin: '900px 0px' });
      io.observe(deck);
    } else near = true;
    const build = (enter) => {
      const items = D.gallery[br];
      deck.innerHTML = items.map((g, i) => `
        <figure class="dcard" data-i="${i}" data-bg="url('${abs(`assets/img/${g.img}@s.webp`)}')">
          <div class="dcard__frame"><img data-src="assets/img/${g.img}@s.webp" width="860" height="${Math.round(860 * g.h / g.w)}" alt="${g.name} — ${B[br].name}" draggable="false"${i > 3 ? ' loading="lazy"' : ''}></div>
          <figcaption><b>${g.name}</b><span class="lat">${g.latin}</span></figcaption>
          <span class="dcard__zoom" aria-hidden="true">${ico('arrows-maximize')}</span>
        </figure>`).join('');
      cards = $$('.dcard', deck); cur = 0;
      hydrate();
      if (enter && anim) {
        cards.forEach((c, i) => {
          const k = i; c.style.zIndex = String(50 - k);
          G.fromTo(c, { y: 140, opacity: 0, rotation: (i % 2 ? -1 : 1) * 10, scale: 0.9 }, { ...slot(k), duration: 1, delay: 0.05 + (cards.length - i) * 0.05, ease: 'cz' });
        });
        count.textContent = `${pad(1)} / ${pad(n())}`;
      } else layout(0);
    };
    const fling = (dir) => {
      const c = cards[cur], w = deck.offsetWidth;
      busy = true; buzz(8);
      cur = (cur + 1) % n();
      const finish = () => { c.style.zIndex = '1'; layout(); busy = false; };
      if (anim) {
        G.to(c, { x: dir * w * 1.25, y: -30, rotation: dir * 16, duration: 0.38, ease: 'power2.out', overwrite: 'auto', onComplete: finish });
        const nx = cards[cur]; G.to(nx, { ...slot(0), duration: 0.6, ease: 'cz', overwrite: 'auto' });
      } else finish();
    };
    const back = () => {
      if (busy) return;
      cur = (cur - 1 + n()) % n();
      const c = cards[cur];
      buzz(6);
      if (G) G.set(c, { x: -deck.offsetWidth * 1.2, y: -30, rotation: -16, opacity: 1 });
      c.style.zIndex = '60';
      layout();
    };
    deck.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('.dcard');
      if (!c || busy || c !== cards[cur] || (e.pointerType === 'mouse' && e.button !== 0)) return;
      drag = { c, id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), dx: 0, moved: false };
    });
    deck.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (!drag.moved && Math.abs(drag.dx) > 8 && Math.abs(drag.dx) > Math.abs(dy)) { drag.moved = true; try { deck.setPointerCapture(e.pointerId); } catch (er) {} }
      if (!drag.moved || !G) return;
      G.set(drag.c, { x: drag.dx, y: dy * 0.12, rotation: drag.dx * 0.06 });
      const p = Math.min(Math.abs(drag.dx) / (deck.offsetWidth * 0.5), 1);
      const nx = cards[(cur + 1) % n()], s0 = slot(1), s1 = slot(0);
      G.set(nx, { y: s0.y + (s1.y - s0.y) * p, scale: s0.scale + (s1.scale - s0.scale) * p, rotation: s0.rotation * (1 - p) });
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      if (e.type === 'pointercancel') { layout(0.6); return; }
      if (!d.moved) { if (viewer) viewer.show(galleryItems(br), cur); return; }
      const v = d.dx / Math.max(1, performance.now() - d.t0);
      if (Math.abs(d.dx) > deck.offsetWidth * 0.26 || Math.abs(v) > 0.55) fling(Math.sign(d.dx) || -1);
      else layout(0.6);
    };
    deck.addEventListener('pointerup', end);
    deck.addEventListener('pointercancel', end);
    deck.tabIndex = 0;
    deck.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); if (viewer) viewer.show(galleryItems(br), cur); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (!busy) fling(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); back(); }
    });
    $('[data-deck-next]').addEventListener('click', () => { if (!busy) fling(-1); });
    $('[data-deck-prev]').addEventListener('click', back);
    tabs.addEventListener('click', (e) => {
      const t = e.target.closest('[data-deck-br]');
      if (!t || t.dataset.deckBr === br) return;
      br = t.dataset.deckBr; buzz(6);
      $$('[data-deck-br]', tabs).forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
      if (anim) G.to(cards, { y: 160, opacity: 0, rotation: (i) => (i % 2 ? -8 : 8), duration: 0.45, stagger: 0.03, ease: 'power2.in', overwrite: 'auto', onComplete: () => build(true) });
      else build(false);
    });
    build(false);
    window.CZDeck = { intro: () => build(true) };
  })();

  /* ---------- البرامج: أكورديون باللمس ---------- */
  const refresh = () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); };
  function acc(btn, on) {
    const panel = btn.nextElementSibling;
    btn.setAttribute('aria-expanded', String(on));
    if (!anim) { panel.hidden = !on; refresh(); return; }
    if (on) {
      panel.hidden = false;
      G.fromTo(panel, { height: 0 }, { height: 'auto', duration: 0.75, ease: 'cz', onComplete: refresh });
      const kids = panel.children;
      G.fromTo(kids, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, delay: 0.1, ease: 'cz' });
      const img = $('img', panel); if (img) G.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.1, ease: 'cz' });
    } else {
      G.to(panel, { height: 0, duration: 0.5, ease: 'czInOut', onComplete: () => { panel.hidden = true; G.set(panel, { clearProps: 'height' }); refresh(); } });
    }
  }
  $$('[data-acc] .acc__btn').forEach((btn) => btn.addEventListener('click', () => {
    const opening = btn.getAttribute('aria-expanded') !== 'true';
    $$('[data-acc] .acc__btn[aria-expanded="true"]').forEach((b) => { if (b !== btn) acc(b, false); });
    acc(btn, opening); buzz(5);
  }));

  /* ---------- الساعة — زي الموقع القديم بالظبط ----------
     شريط بيتملي على محيط الدايرة كل ما الفترة الشغّالة تعدّي، ونوع الفترة والباقي منها
     في النص، والفترة الجاية تحت. السويتش فوقها بيبدّل بين الفرعين (أو اسحب الدايرة يمين/شمال).
     الفترات المتصلة (زي رجالة من 9 بالليل لـ7 الصبح وبعدها على طول من 7 لـ4) بتتحسب فترة واحدة. */
  const ringSec = $('[data-clock]');
  if (ringSec) {
    const fg = $('[data-ring-fg]', ringSec), head = $('[data-ring-head]', ringSec), ringEl = $('[data-ring]', ringSec);
    const gEl = $('[data-ring-group]', ringSec), cd = $('[data-ring-cd]', ringSec);
    const note = $('[data-ring-note]', ringSec), addr = $('[data-ring-addr]', ringSec), sw = $('[data-brswitch]', ringSec);
    const RAD = 120, CIRC = 2 * Math.PI * RAD;
    const ACC = { men: '#BDF73B', women: '#E8B14C' };          /* فسفوري للرجالة، ذهبي للسيدات */
    const GLOW = { men: 'rgba(189,247,59,.55)', women: 'rgba(232,177,76,.5)' };
    const statusOf = (id) => H.status(segsOf(id), new Date());
    /* أرقام Clash مش ثابتة العرض — كل رقم في خانة ثابتة عشان العدّاد ميرقصش كل ثانية */
    const digits = (str) => str.split('').map((c) => (c === ':' ? '<span class="c">:</span>' : `<i>${c}</i>`)).join('');
    let br = (statusOf('b2').open || !statusOf('b1').open) ? 'b2' : 'b1';
    let target = 0, tweening = false, shown = !anim, onScreen = true, drawn = -1;
    const view = { f: 0 };
    fg.style.strokeDasharray = CIRC;
    /* رأس الشريط بيمشي مع عقارب الساعة كل ما الشريط يتملي */
    const draw = (f) => {
      const a = f * Math.PI * 2;
      fg.style.strokeDashoffset = CIRC * (1 - f);
      head.setAttribute('cx', (140 + RAD * Math.sin(a)).toFixed(2));
      head.setAttribute('cy', (140 - RAD * Math.cos(a)).toFixed(2));
    };
    function paint() {
      const t = Date.now(), st = statusOf(br);
      $$('[data-br]', sw).forEach((b) => b.classList.toggle('is-open', statusOf(b.dataset.br).open));
      if (st.open) {
        const seg = st.seg, rest = seg.end - t;
        target = 1 - rest / (seg.end - seg.start);
        ringSec.classList.remove('shut');
        ringSec.style.setProperty('--acc', ACC[seg.g]);
        ringSec.style.setProperty('--acc-glow', GLOW[seg.g]);
        gEl.textContent = GN[seg.g];
        cd.innerHTML = digits(H.hhmm(rest));
        /* بعد الدمج، الفترة اللي بعدها بالضرورة نوع تاني */
        const flip = st.next;
        note.innerHTML = flip ? `بعدها <b>${GN[flip.g]}</b> — ${dayNames[flip.dow]} الساعة <b>${H.clock(flip.start)}</b>` : '';
      } else {
        target = 0;
        ringSec.classList.add('shut');
        ringSec.style.setProperty('--acc', '#9A9B91');
        ringSec.style.setProperty('--acc-glow', 'rgba(154,155,145,.35)');
        gEl.textContent = 'مقفول';
        if (st.next) {
          cd.innerHTML = digits(H.hhmm(st.next.start - t));
          note.innerHTML = `بيفتح <b>${GN[st.next.g]}</b> الساعة <b>${H.clock(st.next.start)}</b>`;
        } else { cd.textContent = '--:--:--'; note.textContent = ''; }
      }
      /* الشريط بيتحرك أقل من بيكسل في الدقيقة — مبنرسموش غير لما الفرق يبان */
      if (shown && !tweening && Math.abs(target - drawn) * CIRC > 0.35) { draw(target); drawn = target; }
    }
    /* الشريط بيتملي من الصفر لمكانه (أول ما القسم يظهر، ومع كل تبديل فرع) */
    function fill(dur) {
      if (!anim) { draw(target); return; }
      tweening = true; ringSec.classList.add('is-switch');
      G.fromTo(view, { f: 0 }, { f: target, duration: dur, ease: 'czInOut', overwrite: true, onUpdate: () => draw(view.f),
        onComplete: () => { tweening = false; drawn = target; requestAnimationFrame(() => ringSec.classList.remove('is-switch')); } });
    }
    function select(id) {
      br = id;
      sw.dataset.on = id;
      $$('[data-br]', sw).forEach((b) => { const on = b.dataset.br === id; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
      addr.textContent = `${B[id].name} — ${B[id].short}`;
      paint();
    }
    function toggle(id) {
      const next = id || (br === 'b1' ? 'b2' : 'b1');
      if (next === br) return;
      buzz(10); select(next);
      if (!shown) return;
      fill(1.15);
      if (anim) {
        G.fromTo([gEl, cd], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'cz' });
        G.fromTo([note, addr], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, delay: 0.15, ease: 'cz' });
      }
    }
    /* سويتش: الضغط على الفرع التاني بيختاره، والضغط على المختار بيقلب للتاني */
    sw.addEventListener('click', (e) => {
      const b = e.target.closest('[data-br]');
      toggle(b && b.dataset.br !== br ? b.dataset.br : null);
    });
    sw.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault(); toggle(); $(`[data-br="${br}"]`, sw).focus();
    });
    /* سحب الدايرة أو السويتش يمين/شمال = تبديل */
    [ringEl, sw].forEach((el) => {
      let x0 = null, y0 = 0;
      el.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; });
      el.addEventListener('pointerup', (e) => {
        if (x0 === null) return;
        const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
        if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          /* RTL: الفرع الأول يمين والجديد شمال → السحب ناحية فرع بيختاره */
          toggle(dx < 0 ? 'b2' : 'b1');
          el.dataset.swiped = '1'; setTimeout(() => { delete el.dataset.swiped; }, 60);
        }
      });
      el.addEventListener('pointercancel', () => { x0 = null; });
      el.addEventListener('click', (e) => { if (el.dataset.swiped) { e.stopPropagation(); e.preventDefault(); } }, true);
    });
    select(br);
    if (!anim) draw(target); else draw(0);
    setInterval(() => { if (onScreen) paint(); }, 1000);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        ringSec.classList.toggle('is-off', !onScreen);
        if (onScreen) paint();
      }, { rootMargin: '120px 0px' }).observe(ringSec);
    }
    window.CZRing = { show: () => { if (shown) return; shown = true; paint(); fill(1.7); } };
  }

  /* ---------- الأسعار لكل فرع + VIP ---------- */
  const vipBox = $('[data-vip]');
  if (vipBox && D.vip) {
    const v = D.vip;
    vipBox.innerHTML = `
      <div class="vip__card" data-vip-card>
        <span class="vip__word">VIP</span>
        <div><h3>اتمرن في الفرعين.</h3><p>${v.line}</p>
          <div class="vip__opts">${(v.options || []).map((o) => `<span class="vip__opt"><b>${o.price.toLocaleString('en-US')}</b><span>ج · ${o.sessions} ${sessionsWord(o.sessions)}</span></span>`).join('')}</div></div>
        <a class="btn btn--lime" href="${waTo(v.from, 'أهلًا، عايز أشترك VIP (الفرعين)')}" target="_blank" rel="noopener">اشترك VIP</a>
      </div>`;
  }
  const dots = (k, of) => `<div class="dots${of > 24 ? ' dots--30' : ''}" aria-hidden="true">${Array.from({ length: of }, (_, i) => `<i${i < k ? ' class="on"' : ''}></i>`).join('')}</div>`;
  const price = (p) => `<p class="plan__price">${p.toLocaleString('en-US')}<small>ج</small></p>`;
  const pb = $('[data-plan-branch]');
  let pbr = 'b2';
  function renderPlans() {
    const P = D.plans[pbr], b = B[pbr];
    const btn = (msg) => `<a class="btn btn--sm" href="${waTo(pbr, msg + ` — ${b.name}`)}" target="_blank" rel="noopener">اشترك</a>`;
    $$('button', pb).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.br === pbr)));
    $('[data-plan-note]').textContent = `أسعار ${b.name} · ${b.short} — اسحب الكروت`;
    const maxS = Math.max(...P.monthly.map((p) => p.sessions));
    $('[data-panel="monthly"]').innerHTML = P.monthly.map((p) => `
      <div class="plan" data-plan>
        <p class="plan__n">${p.sessions}<small>${sessionsWord(p.sessions)}</small></p>
        ${dots(p.sessions, maxS)}
        <div class="plan__name"><h3>${p.name}${p.popular ? '<span class="tag">مُرشّحة</span>' : ''}</h3><p>${p.note || ''}</p></div>
        ${price(p.price)}
        ${btn(`أهلًا، عايز أشترك في باقة ${p.name} (${p.sessions} ${sessionsWord(p.sessions)} — ${p.price} ج)`)}
      </div>`).join('');
    $('[data-panel="yearly"]').innerHTML = P.yearly.flatMap((y) => y.tiers.map((t) => `
      <div class="plan" data-plan>
        <p class="plan__n">${t.months}<small>${monthsWord(t.months)}</small></p>
        ${dots(t.months, 12)}
        <div class="plan__name"><h3>${y.name} — ${t.label}</h3><p>${t.perks || ''}</p></div>
        ${price(t.price)}
        ${btn(`أهلًا، عايز أشترك ${y.name} ${t.label} (${t.price} ج)`)}
      </div>`)).join('');
    $('[data-panel="private"]').innerHTML = P.private.flatMap((x) => x.options.map((o) => `
      <div class="plan" data-plan>
        <p class="plan__n">${o.sessions}<small>${sessionsWord(o.sessions)}</small></p>
        ${dots(o.sessions, 24)}
        <div class="plan__name"><h3>${x.name}</h3><p>${x.note || 'الكابتن معاك الحصة كلها.'}</p></div>
        ${price(o.price)}
        ${btn(`أهلًا، عايز ${x.name} ${o.sessions} ${sessionsWord(o.sessions)} (${o.price} ج)`)}
      </div>`)).join('');
    $('[data-panel="acts"]').innerHTML = P.activities.map((a) => {
      const m = (a.note || '').match(/(\d+)\s*(?:جلس|حص)/); const k = m ? +m[1] : 0;
      return `
      <div class="plan" data-plan>
        <p class="plan__n">${k || '—'}<small>${k ? sessionsWord(k) : 'برنامج'}</small></p>
        ${k ? dots(k, 24) : '<div></div>'}
        <div class="plan__name"><h3>${a.name}</h3><p>${a.note || ''}</p></div>
        ${price(a.price)}
        ${btn(`أهلًا، عايز أشترك في ${a.name} (${a.price} ج)`)}
      </div>`;
    }).join('');
    $('[data-singles]').innerHTML = P.singles.map((s) => `<span>${s.name} <b>${s.price} ج</b></span>`).join('') + '<span>الأسعار بالجنيه المصري.</span>';
    $$('.panel').forEach((p) => { p.scrollLeft = 0; });
  }
  if (pb) {
    pb.innerHTML = ['b2', 'b1'].map((id) => `<button type="button" data-br="${id}" aria-pressed="${id === pbr}">${B[id].n} · ${B[id].name}</button>`).join('');
    renderPlans();
    pb.addEventListener('click', (e) => {
      const x = e.target.closest('[data-br]'); if (!x || x.dataset.br === pbr) return;
      pbr = x.dataset.br; buzz(6); renderPlans();
      const vis = $$('.panel').find((p) => !p.hidden);
      document.dispatchEvent(new CustomEvent('cz:panel', { detail: vis }));
    });
    const tabs = $$('[role="tab"]');
    const select = (tab) => {
      tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; });
      const p = $('#' + tab.getAttribute('aria-controls')); p.scrollLeft = 0;
      buzz(5);
      document.dispatchEvent(new CustomEvent('cz:panel', { detail: p }));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => { const k = { ArrowLeft: 1, ArrowRight: -1 }[e.key]; if (!k) return; const nx = tabs[(i + k + tabs.length) % tabs.length]; nx.focus(); select(nx); });
    });
  }

  /* ---------- الفوتر ---------- */
  $$('[data-foot-branch]').forEach((el) => {
    const b = B[el.dataset.footBranch];
    el.innerHTML = `<h4>${b.n} — ${b.latin}</h4><ul>
      <li><a href="${b.maps}" target="_blank" rel="noopener">${ico('map-pin')}${b.short}</a></li>
      <li><a href="${waTo(b.id, `أهلًا، عندي سؤال عن ${b.name}`)}" target="_blank" rel="noopener">${ico('brand-whatsapp')}<span dir="ltr">${b.mobile}</span></a></li>
      ${b.landline ? `<li><a href="tel:${b.landline.replace(/[^\d]/g, '')}">${ico('phone')}<span dir="ltr">${b.landline}</span></a></li>` : ''}
    </ul>`;
  });
})();
