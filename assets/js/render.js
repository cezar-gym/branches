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

  /* ---------- مواعيد «اليوم بالتقويم» لكل فرع (بما فيها كمالة الفجر من امبارح) ---------- */
  const daySegs = (br, d) => {
    const S = segsOf(br);
    const prev = (S[String((d + 6) % 7)] || []).filter((s) => s.to > 1440).map((s) => ({ g: s.g, from: 0, to: s.to - 1440 }));
    const cur = (S[String(d)] || []).map((s) => ({ g: s.g, from: s.from, to: Math.min(s.to, 1440), end: s.to }));
    return prev.concat(cur).filter((s) => s.to > s.from);
  };
  const segAt = (br, d, m) => daySegs(br, d).find((s) => m >= s.from && m < s.to);
  const nextFor = (br, d, m, g) => {
    const today = daySegs(br, d).filter((s) => s.g === g && s.from > m).sort((a, b) => a.from - b.from)[0];
    if (today) return hm(today.from);
    const tm = daySegs(br, (d + 1) % 7).filter((s) => s.g === g).sort((a, b) => a.from - b.from)[0];
    return tm ? `بكرة ${hm(tm.from)}` : '';
  };
  const coverage = (brs, d, g) => {
    const iv = brs.flatMap((br) => daySegs(br, d).filter((s) => s.g === g)).sort((a, b) => a.from - b.from);
    let tot = 0, cs = -1, ce = -1;
    iv.forEach((s) => { if (s.from > ce) { if (ce > cs) tot += ce - cs; cs = s.from; ce = s.to; } else ce = Math.max(ce, s.to); });
    if (ce > cs) tot += ce - cs;
    return tot;
  };
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
    const build = (enter) => {
      const items = D.gallery[br];
      deck.innerHTML = items.map((g, i) => `
        <figure class="dcard" data-i="${i}" style="--img:url('${abs(`assets/img/${g.img}@s.webp`)}')">
          <div class="dcard__frame"><img src="assets/img/${g.img}@s.webp" width="860" height="${Math.round(860 * g.h / g.w)}" alt="${g.name} — ${B[br].name}" draggable="false"${i > 3 ? ' loading="lazy"' : ''}></div>
          <figcaption><b>${g.name}</b><span class="lat">${g.latin}</span></figcaption>
          <span class="dcard__zoom" aria-hidden="true">${ico('arrows-maximize')}</span>
        </figure>`).join('');
      cards = $$('.dcard', deck); cur = 0;
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

  /* ---------- «مين فاتح؟» — ساعة 12 ساعة:
     الدايرة الكبيرة = الفرع التاني (فسفوري)، والصغيرة جوّاها = الفرع الأول (أبيض).
     العقرب بيتسحب بالصباع، ولما يعدّي 12 بيقلب ص/م (وبعد نص الليل اليوم اللي بعده). ---------- */
  const dial = $('[data-dial]');
  if (dial) {
    const svg = $('[data-dial-svg]', dial), arcsG = $('[data-arcs]', svg), ticksG = $('[data-ticks]', svg);
    const hand = $('[data-hand]', svg), hit = $('.d12__hit', svg), nowDot = $('[data-now-dot]', svg);
    const R = { b2: 232, b1: 166 };
    const pt = (deg, r) => { const a = (deg - 90) * Math.PI / 180; return [Math.cos(a) * r, Math.sin(a) * r]; };
    const f2 = (v) => v.toFixed(2);
    let tk = '';
    for (let h = 0; h < 12; h++) {
      const deg = h * 30;
      [[208, 256], [142, 190]].forEach(([r0, r1]) => { const [x0, y0] = pt(deg, r0), [x1, y1] = pt(deg, r1); tk += `<line class="d12__tick" x1="${f2(x0)}" y1="${f2(y0)}" x2="${f2(x1)}" y2="${f2(y1)}"/>`; });
      const [nx, ny] = pt(deg, 281);
      tk += `<text class="d12__num${h % 3 === 0 ? ' is-major' : ''}" x="${f2(nx)}" y="${f2(ny + 9)}" text-anchor="middle">${h || 12}</text>`;
    }
    ticksG.innerHTML = tk;
    const arcD = (d0, d1, r) => {
      d1 = Math.min(d1, d0 + 359.95);
      const [x0, y0] = pt(d0, r), [x1, y1] = pt(d1, r);
      return `M${f2(x0)} ${f2(y0)} A${r} ${r} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${f2(x1)} ${f2(y1)}`;
    };
    const order = [6, 0, 1, 2, 3, 4, 5];
    const now0 = new Date(), today = now0.getDay();
    const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
    const daysBox = $('[data-days]'), gBox = $('[data-hf-g]'), halfBox = $('[data-hf-half]');
    const result = $('[data-hf-result]'), cover = $('[data-hf-cover]'), dTime = $('[data-dial-time]'), dAmpm = $('[data-dial-ampm]');
    daysBox.innerHTML = order.map((d) => `<button type="button" data-day="${d}" aria-pressed="${d === today}">${dayNames[d]}${d === today ? '<span class="t">النهارده</span>' : ''}</button>`).join('');
    let day = today, g = 'men', at = Math.round(nowMin() / 5) * 5 % 1440, shown = false;
    const half = () => (at >= 720 ? 1 : 0);

    /* العنوان تحت كل دايرة بلونها */
    const a2 = $('[data-addr="b2"]', dial), a1 = $('[data-addr="b1"]', dial);
    if (a2) a2.textContent = `الفرع التاني — ${shortAddr(B.b2)}`;
    if (a1) a1.textContent = `الفرع الأول — ${shortAddr(B.b1)}`;

    /* العقرب: زاوية مرئية مستمرة (ممكن تعدّي 360 في اللفّة) */
    const proxy = { d: 0 };
    const setHand = (deg) => hand.setAttribute('transform', `rotate(${f2(deg)})`);
    const handNow = (deg) => { if (G) G.killTweensOf(proxy); proxy.d = deg; setHand(deg); };
    const turnTo = (deg, dur = 0.9) => {
      if (!anim) { handNow(deg); return; }
      G.to(proxy, { d: deg, duration: dur, ease: 'cz', overwrite: true, onUpdate: () => setHand(proxy.d) });
    };
    const degOf = (m) => (m % 720) / 2;
    const shortest = (target) => { const cur = ((proxy.d % 360) + 360) % 360; const diff = ((target - cur + 540) % 360) - 180; return proxy.d + diff; };

    function drawArcs(animate) {
      const h0 = half() * 720;
      let i = 0;
      arcsG.innerHTML = ['b2', 'b1'].map((id) => daySegs(id, day).map((s) => {
        const from = Math.max(s.from, h0), to = Math.min(s.to, h0 + 720);
        if (to <= from) return '';
        return `<path class="d12__arc ${id}${s.g === g ? '' : ' other'}" d="${arcD((from - h0) / 2, (to - h0) / 2, R[id])}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${animate && anim ? 1 : 0}" data-k="${i++}"/>`;
      }).join('')).join('');
      if (animate && anim) G.to($$('.d12__arc', arcsG), { attr: { 'stroke-dashoffset': 0 }, duration: 1, stagger: 0.08, ease: 'czInOut' });
      $$('button', halfBox).forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.half === half())));
      $$('button', daysBox).forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.day === day)));
      $$('button', gBox).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.g === g)));
      const both = coverage(['b1', 'b2'], day, g), one = Math.max(coverage(['b1'], day, g), coverage(['b2'], day, g));
      const hw = (v) => (v >= 3 && v <= 10 ? 'ساعات' : 'ساعة');
      const hb = Math.round(both / 60), ho = Math.round(one / 60);
      cover.innerHTML = `يوم ${dayNames[day]}: ال${GN[g]} يقدروا يتمرنوا <b>${hb}</b> ${hw(hb)} من 24 بالفرعين مع بعض — فرع واحد لوحده أقصاه <b>${ho}</b> ${hw(ho)}.`;
      update();
    }
    let lastRes = '';
    function update() {
      const h12 = Math.floor(at / 60) % 12 || 12;
      dTime.textContent = `${h12}:${pad(at % 60)}`;
      dAmpm.textContent = half() ? 'مساءً' : 'صباحًا';
      svg.setAttribute('aria-valuenow', String(at));
      svg.setAttribute('aria-valuetext', `${dayNames[day]} ${hm(at)}`);
      const nm = nowMin(), h0 = half() * 720;
      const showNow = day === new Date().getDay() && nm >= h0 && nm < h0 + 720;
      if (showNow) { const [x, y] = pt((nm - h0) / 2, 199); nowDot.setAttribute('cx', f2(x)); nowDot.setAttribute('cy', f2(y)); }
      nowDot.style.opacity = showNow ? 1 : 0;
      const open = [];
      const html = ['b2', 'b1'].map((id) => {
        const b = B[id], s = segAt(id, day, at), isOpen = !!(s && s.g === g);
        if (isOpen) open.push(id);
        const nx = nextFor(id, day, at, g);
        const st = isOpen ? `فاتح ${GL[g]} لحد ${hm(s.end || s.to)}` : s ? `فترة ${GN[s.g]} دلوقتي${nx ? ` — ${GL[g]} من ${nx}` : ''}` : `مقفول${nx ? ` — بيفتح ${GL[g]} ${nx}` : ''}`;
        return `<div class="hf-br ${id}${isOpen ? ' is-open' : ''}"><div><b><span class="n lat">${b.n}</span> ${b.name}</b><div class="st">${st}</div></div>${isOpen ? `<a href="${b.maps}" target="_blank" rel="noopener">الخريطة</a>` : ''}</div>`;
      }).join('');
      if (html !== lastRes) { result.innerHTML = html; lastRes = html; }
      svg.classList.toggle('b2-open', open.includes('b2'));
      svg.classList.toggle('b1-open', open.includes('b1'));
    }
    const setDay = (d) => { day = (d + 7) % 7; };
    /* عبور الساعة 12 أثناء السحب */
    const cross = (dir) => {
      if (dir > 0) { if (half()) { setDay(day + 1); at -= 720; } else at += 720; }
      else if (half()) at -= 720; else { setDay(day - 1); at += 720; }
      buzz(14); drawArcs(true);
    };

    /* السحب: من الزرار الفسفوري بس (عشان السكرول على الموبايل يفضل شغّال)، والضغط على الدايرة بيودّي العقرب هناك */
    const angleOf = (e) => {
      const r = svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      let a = Math.atan2(dx, -dy) * 180 / Math.PI; if (a < 0) a += 360;
      return { a, dist: Math.hypot(dx, dy) * 600 / r.width };
    };
    let dragging = false, lastA = 0, tap = null;
    hit.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    svg.addEventListener('pointerdown', (e) => {
      if (e.target === hit) {
        dragging = true; lastA = angleOf(e).a;
        try { svg.setPointerCapture(e.pointerId); } catch (er) {}
        dial.classList.add('is-drag'); buzz(6); e.preventDefault();
        return;
      }
      tap = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    svg.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const { a } = angleOf(e);
      if (lastA > 270 && a < 90) cross(1); else if (lastA < 90 && a > 270) cross(-1);
      lastA = a;
      const m = Math.min(715, Math.round((a * 2) / 5) * 5);
      const nat = half() * 720 + m;
      if (Math.floor(nat / 60) !== Math.floor(at / 60)) buzz(4);
      at = nat;
      handNow(m / 2);
      update();
    });
    const stop = () => { if (!dragging) return; dragging = false; dial.classList.remove('is-drag'); };
    svg.addEventListener('pointerup', (e) => {
      if (dragging) { stop(); return; }
      if (!tap || tap.id !== e.pointerId) return;
      const moved = Math.hypot(e.clientX - tap.x, e.clientY - tap.y); tap = null;
      if (moved > 10) return;
      const { a, dist } = angleOf(e);
      if (dist < 118 || dist > 300) return;
      const m = Math.min(705, Math.round((a * 2) / 15) * 15);
      at = half() * 720 + m; buzz(6);
      turnTo(shortest(m / 2), 0.8); update();
    });
    svg.addEventListener('pointercancel', () => { stop(); tap = null; });
    svg.addEventListener('keydown', (e) => {
      const step = { ArrowUp: 15, ArrowRight: 15, ArrowDown: -15, ArrowLeft: -15, PageUp: 60, PageDown: -60 }[e.key];
      if (!step) return;
      e.preventDefault();
      let v = at + step;
      if (v >= 1440) { setDay(day + 1); v -= 1440; } else if (v < 0) { setDay(day - 1); v += 1440; }
      const flip = (v >= 720) !== (at >= 720);
      at = v;
      if (flip) drawArcs(true);
      turnTo(shortest(degOf(at)), 0.4); update();
    });
    daysBox.addEventListener('click', (e) => { const b = e.target.closest('[data-day]'); if (b && +b.dataset.day !== day) { day = +b.dataset.day; buzz(5); drawArcs(true); } });
    gBox.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b && b.dataset.g !== g) { g = b.dataset.g; buzz(5); drawArcs(true); } });
    halfBox.addEventListener('click', (e) => {
      const b = e.target.closest('[data-half]'); if (!b || +b.dataset.half === half()) return;
      const toPM = +b.dataset.half === 1;
      at += toPM ? 720 : -720; buzz(8);
      turnTo(proxy.d + (toPM ? 360 : -360), 1.2);
      drawArcs(true);
    });
    $('[data-hf-now]').addEventListener('click', () => {
      const flip = (Math.round(nowMin() / 5) * 5 % 1440 >= 720) !== (at >= 720) || day !== new Date().getDay();
      day = new Date().getDay(); at = Math.round(nowMin() / 5) * 5 % 1440; buzz(8);
      turnTo(shortest(degOf(at)), 1);
      if (flip) drawArcs(true); else update();
    });
    const show = () => {
      if (shown) return; shown = true;
      drawArcs(true);
      if (anim) { proxy.d = degOf(at) - 360; setHand(proxy.d); turnTo(degOf(at), 2); } else handNow(degOf(at));
    };
    handNow(degOf(at));
    if (!anim) show(); else update();
    setInterval(() => { if (!dragging) update(); }, 30000);
    window.CZDial = { show };
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
