/* ==========================================================================
   CEZAR — Chapter 02 · site.js
   GSAP 3.15 (ScrollTrigger + SplitText + DrawSVG + CustomEase) + Lenis.
   مبني على محرّك موقع .ATHR (تريك 09: «Reference another project»).
   القواعد: حركة بطيئة واثقة، مفيش bounce/elastic/glitch.
   العربي بيتقسم سطور/كلمات بس — الحروف للإنجليزي بس.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ok = window.gsap && window.ScrollTrigger && window.SplitText && window.CustomEase;

  /* ---------- قايمة الموبايل (شغّالة حتى من غير حركة) ---------- */
  const menuBtn = $('.nav__menu'), menu = $('#menu');
  if (menuBtn && menu) {
    const setMenu = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  const particles = () => window.CZParticles && CZParticles.init($('[data-particles]'), 'assets/img/emblem-light.png');

  const unlockIntro = () => { root.classList.remove('intro'); try { sessionStorage.setItem('cz-intro', '1'); } catch (e) {} };
  const failsafe = setTimeout(() => { root.classList.add('motion-off'); unlockIntro(); }, 5000);

  if (!ok || reduce) {
    clearTimeout(failsafe);
    root.classList.add('motion-off');
    unlockIntro();
    particles();
    const fg = $('[data-mring-fg]'), mn = $('[data-mring-n]');
    if (fg && mn) { fg.setAttribute('stroke-dashoffset', String(1 - 9 / 24)); mn.textContent = '9'; }
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, ...(window.DrawSVGPlugin ? [DrawSVGPlugin] : []));
  CustomEase.create('cz', '0.16,1,0.3,1');
  CustomEase.create('czInOut', '0.76,0,0.24,1');
  gsap.defaults({ ease: 'cz', duration: 1 });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY, behavior: 'smooth' });
  }));

  const ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  ready.then(() => {
    clearTimeout(failsafe);
    const intro = root.classList.contains('intro');
    if (intro && lenis) lenis.stop();
    cursor();
    nav();
    heroScroll();
    headings();
    fades();
    statement();
    banks();
    cards();
    cross();
    ppl();
    programs();
    clock();
    plans();
    member();
    family();
    giant();
    magnet();
    particles();
    tweak();
    const go = () => { heroIntro(); requestAnimationFrame(() => ScrollTrigger.refresh()); };
    if (intro) loader(go); else go();
  });

  /* ---------- 0 · المقدمة: الشعار بيترسم ← بيتملى ← عدّاد ← ستارة ---------- */
  function loader(done) {
    const el = $('.loader');
    if (!el) { unlockIntro(); done(); return; }
    const paths = $$('.loader__em path', el), em = $('.loader__em', el), count = $('.loader__count', el);
    const n = { v: 0 };
    const tl = gsap.timeline({ onComplete: () => { unlockIntro(); el.remove(); if (lenis) lenis.start(); } });
    if (window.DrawSVGPlugin) tl.fromTo(paths, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.7, stagger: 0.2, ease: 'czInOut' }, 0);
    tl.to(paths, { fillOpacity: 1, strokeOpacity: 0, duration: 0.7, stagger: 0.1, ease: 'cz' }, 1.45)
      .to(n, { v: 100, duration: 2.1, ease: 'czInOut', onUpdate: () => { count.textContent = String(Math.round(n.v)).padStart(3, '0'); } }, 0.05)
      .fromTo(el, { '--lp': 0 }, { '--lp': 1, duration: 2.1, ease: 'czInOut' }, 0.05)
      .to(em, { scale: 1.08, duration: 0.6, ease: 'czInOut' }, 2.1)
      .to(['.loader__row', em], { opacity: 0, y: -24, duration: 0.5, ease: 'czInOut' }, 2.25)
      .fromTo(el, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'czInOut' }, 2.45)
      .add(done, 2.6);
  }

  /* ---------- 1 · الهيرو ----------
     وضعين: صورة كاملة (افتراضي) أو «مبنى مفرّغ» — المبنى قدّام وCEZAR وراه،
     والسكرول بيقرّبك من المبنى والحروف بتتفرّق. */
  let heroTitle = null;
  const isCut = () => !!$('.hero.hero--cut');
  function heroIntro() {
    gsap.to('.nav', { opacity: 1, duration: 0.9, delay: 0.9 });
    const tl = gsap.timeline();
    if (isCut()) {
      tl.fromTo('[data-hero-building]', { yPercent: 16, opacity: 0, scale: 0.94 }, { yPercent: 0, opacity: 1, scale: 1, duration: 2.4, ease: 'cz' }, 0)
        .fromTo('.hero__big .hbi', { yPercent: 110 }, { yPercent: 0, duration: 1.6, stagger: 0.08, ease: 'cz' }, 0.25);
    } else {
      tl.fromTo('.hero__img', { scale: 1.25 }, { scale: 1, duration: 2.6, ease: 'cz' }, 0)
        .fromTo('.hero__word .hwi', { yPercent: 110 }, { yPercent: 0, duration: 1.5, stagger: 0.07, ease: 'cz' }, 0.2);
    }
    if (heroTitle) tl.fromTo(heroTitle.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.6);
    tl.fromTo('[data-hero-fade]', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.95);
  }
  function heroScroll() {
    const t = $('[data-hero-lines]');
    if (t) heroTitle = SplitText.create(t, { type: 'lines', mask: 'lines', linesClass: 'ln' });
    gsap.set('[data-hero-fade]', { opacity: 0 });
    if (heroTitle) gsap.set(heroTitle.lines, { yPercent: 110 });
    const cut = isCut();
    gsap.set(cut ? '.hero__big .hbi' : '.hero__word .hwi', { yPercent: 110 });
    if (cut) gsap.set('[data-hero-building]', { opacity: 0 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: cut ? '+=95%' : '+=75%', scrub: 1, pin: true, anticipatePin: 1 },
    });
    tl.to('.hero__row', { opacity: 0, y: -60, ease: 'none' }, 0)
      .to('.hero__meta', { opacity: 0, ease: 'none' }, 0);
    if (cut) {
      tl.to('[data-hero-building]', { scale: 1.5, yPercent: 10, ease: 'none' }, 0)
        .to('.hero__big .hb', { x: (i) => (i - 2) * window.innerWidth * 0.1, opacity: 0.12, ease: 'none' }, 0)
        .to('[data-hero-sky]', { opacity: 0.35, ease: 'none' }, 0);
    } else {
      tl.fromTo('[data-hero-frame]', { '--hc': 0 }, { '--hc': 1, ease: 'none' }, 0)
        .to('.hero__word .hw', { yPercent: (i) => [-14, -38, -22, -46, -28][i] || -30, ease: 'none' }, 0);
    }
  }

  /* ---------- Nav ---------- */
  function nav() {
    const el = $('[data-nav]');
    if (!el) return;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        el.classList.toggle('is-solid', y > 60);
        el.classList.toggle('is-hidden', y > 700 && self.direction === 1);
      },
    });
  }

  /* ---------- العناوين: سطور بتطلع من ورا ماسك (عربي = سطور مش حروف) ---------- */
  function headings() {
    $$('[data-lines]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
        onSplit: (self) => gsap.fromTo(self.lines, { yPercent: 115 }, {
          yPercent: 0, duration: 1.3, stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
      });
    });
    $$('.sec-head .mono').forEach((m) => gsap.fromTo(m, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 1.1, scrollTrigger: { trigger: m, start: 'top 90%', once: true } }));
  }
  function fades() {
    $$('[data-fade]').forEach((el) => gsap.fromTo(el, { opacity: 0, y: 26 }, {
      opacity: 1, y: 0, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    }));
  }

  /* ---------- 2 · الجملة: الكلمات بتنوّر واحدة واحدة ---------- */
  function statement() {
    const el = $('[data-words]');
    if (!el) return;
    const split = SplitText.create(el, { type: 'words', wordsClass: 'w' });
    gsap.fromTo(split.words, { opacity: 0.1, filter: 'blur(8px)', y: 10 }, {
      opacity: 1, filter: 'blur(0px)', y: 0, ease: 'none', stagger: 0.14,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.8 },
    });
  }

  /* ---------- 3 · فرعين في نفس الحتة: الشوارع بتترسم ← الفرعين ← الطريق بينهم ← VIP ---------- */
  function banks() {
    const sec = $('[data-banks]');
    if (!sec) return;
    const q = (s) => $$(s, sec);
    gsap.set(q('.vip-chip'), { x: 0, y: 0, xPercent: -50, yPercent: -50 });
    gsap.set(q('[data-b]'), { opacity: 0 });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: sec, pin: true, start: 'top top', end: '+=170%', scrub: 1, anticipatePin: 1 },
    });
    if (window.DrawSVGPlugin) tl.fromTo(q('.map__roads path, .map__ring'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1, stagger: 0.06, ease: 'power2.inOut' }, 0);
    tl.fromTo(q('.map__park, .map__label'), { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.05 }, 0.75)
      .fromTo(q('[data-b="ename"], [data-b="wname"]'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3 }, 0.6)
      .fromTo(q('[data-b="b1"]'), { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 1)
      .fromTo(q('[data-b="b1"] .pin__card'), { clipPath: 'inset(0 0 100% 0 round 16px)' }, { clipPath: 'inset(0 0 0% 0 round 16px)', duration: 0.35, ease: 'power2.out' }, 1.1)
      .fromTo(q('[data-b="b2"]'), { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 1.45)
      .fromTo(q('[data-b="b2"] .pin__card'), { clipPath: 'inset(0 0 100% 0 round 16px)' }, { clipPath: 'inset(0 0 0% 0 round 16px)', duration: 0.35, ease: 'power2.out' }, 1.55);
    if (window.DrawSVGPlugin) tl.fromTo(q('.bridge__draw'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, 1.95);
    tl.fromTo(q('.bridge__flow'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 2.5)
      .fromTo(q('[data-b="vip"]'), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 2.4)
      .fromTo(q('[data-b="line"]'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 2.65)
      .to({}, { duration: 0.45 });
    gsap.fromTo(q('.banks__head > *'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, scrollTrigger: { trigger: sec, start: 'top 75%', once: true } });
  }

  /* ---------- 4 · كروت الفرعين ---------- */
  function cards() {
    const box = $('[data-bcards]');
    if (!box) return;
    const cs = $$('.bcard', box);
    gsap.fromTo(cs, { opacity: 0, y: 90 }, { opacity: 1, y: 0, duration: 1.3, stagger: 0.14, scrollTrigger: { trigger: box, start: 'top 85%', once: true } });
    gsap.fromTo(cs.map((c) => $('.bcard__n', c)), { yPercent: 100 }, { yPercent: 0, duration: 1.4, stagger: 0.14, delay: 0.3, ease: 'czInOut', scrollTrigger: { trigger: box, start: 'top 85%', once: true } });
  }

  /* ---------- 5 · جوّه: شريط أفقي بيعدّي النيل من فرع للتاني ---------- */
  function cross() {
    const pin = $('[data-cross]');
    if (!pin) return;
    const track = $('[data-cross-track]', pin), bar = $('[data-cross-bar]', pin), mark = $('[data-cross-mark]', pin);
    const nowEl = $('[data-cross-now]', pin), countEl = $('[data-cross-count]', pin);
    const zones = $$('.zone', track);
    const photos = zones.filter((z) => z.dataset.zb !== 'nile');
    const nileIdx = zones.findIndex((z) => z.dataset.zb === 'nile');
    const BR = {}; (window.CZ ? CZ.branches : []).forEach((b) => { BR[b.id] = b; });
    let curB = 'b1';
    const setNow = (b) => {
      if (b === curB || !BR[b]) return;
      curB = b;
      nowEl.classList.toggle('is-b2', b === 'b2');
      const parts = [...nowEl.children];
      gsap.to(parts, {
        yPercent: -110, opacity: 0, duration: 0.25, ease: 'power2.in', overwrite: true,
        onComplete: () => {
          parts[0].textContent = BR[b].n; parts[1].textContent = `${BR[b].name} · ${BR[b].short}`;
          gsap.fromTo(parts, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'cz' });
        },
      });
    };
    const update = () => {
      const mid = window.innerWidth / 2;
      let best = 0, bd = 1e9;
      zones.forEach((z, i) => { const r = z.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
      const z = zones[best];
      if (z.dataset.zb !== 'nile') setNow(z.dataset.zb);
      else { const c = z.getBoundingClientRect().left + z.offsetWidth / 2; const rtl = getComputedStyle(track).direction === 'rtl'; setNow((rtl ? c > mid : c < mid) ? 'b2' : 'b1'); }
      const pi = photos.indexOf(z);
      if (pi >= 0) countEl.textContent = `${String(pi + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
    };
    if (mark && nileIdx > 0) mark.style.insetInlineStart = (nileIdx / (zones.length - 1) * 100).toFixed(1) + '%';
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const rtl = getComputedStyle(track).direction === 'rtl';
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => (rtl ? 1 : -1) * dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, pin: true, start: 'top top', end: () => '+=' + dist(), scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress.toFixed(4)})`; update(); },
        },
      });
      const parts = zones.filter((z) => z.dataset.zb !== 'nile').map((z) => gsap.fromTo($('img', z), { xPercent: rtl ? -7 : 7 }, {
        xPercent: rtl ? 7 : -7, ease: 'none',
        scrollTrigger: { trigger: z, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      }));
      const nileText = gsap.fromTo($('.nile__ar', track), { scale: 0.7, opacity: 0.2 }, {
        scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: zones[nileIdx], containerAnimation: tween, start: 'left 80%', end: 'center center', scrub: true },
      });
      const rise = gsap.fromTo(zones, { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 1.3, stagger: 0.06, scrollTrigger: { trigger: pin, start: 'top 75%', once: true } });
      return () => { parts.forEach((p) => p.kill()); nileText.kill(); rise.kill(); };
    });
    mm.add('(max-width: 899px)', () => {
      const onScroll = () => update();
      track.addEventListener('scroll', onScroll, { passive: true });
      const a = gsap.fromTo(zones, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.06, scrollTrigger: { trigger: pin, start: 'top 85%', once: true } });
      return () => { track.removeEventListener('scroll', onScroll); a.kill(); };
    });
  }

  /* ---------- 6 · PUSH PULL LEGS: صفين عكس بعض + ميل حسب سرعة السكرول ---------- */
  function ppl() {
    const wrap = $('[data-ppl]');
    if (!wrap) return;
    const rows = $$('.ppl__row', wrap);
    rows.forEach((row) => {
      const dir = Number(row.dataset.dir || 1);
      const travel = () => Math.min(row.scrollWidth * 0.4, window.innerWidth * 0.9);
      gsap.fromTo(row, { x: () => (dir > 0 ? 0 : -travel()) }, {
        x: () => (dir > 0 ? -travel() : 0), ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
      });
    });
    const skewTo = gsap.quickTo(rows, 'skewX', { duration: 0.6, ease: 'cz' });
    ScrollTrigger.create({
      trigger: wrap, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => skewTo(gsap.utils.clamp(-9, 9, self.getVelocity() / -300)),
      onLeave: () => skewTo(0), onLeaveBack: () => skewTo(0),
    });
  }

  /* ---------- 7 · البرامج: الخطوط بتترسم + صورة بتتبع الماوس ---------- */
  function programs() {
    const list = $('[data-prog]');
    if (!list) return;
    const rows = $$('.prog__row', list);
    gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 82%', once: true } })
      .fromTo(rows, { '--s': 0 }, { '--s': 1, duration: 1.6, stagger: 0.1, ease: 'czInOut' }, 0)
      .fromTo(rows.map((r) => r.children[0]), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, stagger: 0.1 }, 0.2)
      .fromTo(rows.map((r) => [r.children[1], r.children[2]]).flat(), { opacity: 0 }, { opacity: 1, duration: 1, stagger: 0.05 }, 0.5);
    peek();
  }
  function peek() {
    const pk = $('.peek');
    if (!pk || !fine) return;
    const img = $('img', pk);
    const xTo = gsap.quickTo(pk, 'x', { duration: 0.8, ease: 'cz' });
    const yTo = gsap.quickTo(pk, 'y', { duration: 0.8, ease: 'cz' });
    const rTo = gsap.quickTo(pk, 'rotation', { duration: 0.9, ease: 'cz' });
    let lastX = 0;
    window.addEventListener('pointermove', (e) => {
      xTo(e.clientX - pk.offsetWidth - 34); yTo(e.clientY - pk.offsetHeight / 2);
      rTo(gsap.utils.clamp(-6, 6, (e.clientX - lastX) * 0.4)); lastX = e.clientX;
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-peek]');
      if (!t || t.contains(e.relatedTarget)) return;
      img.src = t.dataset.peek;
      gsap.to(pk, { opacity: 1, '--pc': 0, duration: 0.8, overwrite: 'auto' });
      gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.1, overwrite: 'auto' });
    });
    document.addEventListener('pointerout', (e) => {
      const t = e.target.closest('[data-peek]');
      if (!t || t.contains(e.relatedTarget)) return;
      gsap.to(pk, { '--pc': 1, opacity: 0, duration: 0.6, ease: 'czInOut', overwrite: 'auto' });
    });
  }

  /* ---------- 8 · الساعة: القرص بيلف ويترسم أول ما يظهر ---------- */
  function clock() {
    const d = $('[data-dial]');
    if (!d) return;
    gsap.set('[data-ticks]', { rotation: -90, transformOrigin: '0 0', opacity: 0 });
    ScrollTrigger.create({
      trigger: d, start: 'top 75%', once: true,
      onEnter: () => {
        gsap.to('[data-ticks]', { rotation: 0, opacity: 1, duration: 1.8, ease: 'cz' });
        gsap.fromTo('.dial__track', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.6, ease: 'czInOut' });
        gsap.fromTo('[data-hand]', { scaleY: 0, transformOrigin: '0 0' }, { scaleY: 1, duration: 1.2, delay: 0.8 });
        if (window.CZDial) window.CZDial.show();
      },
    });
    gsap.fromTo('[data-days] button', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.05, scrollTrigger: { trigger: '[data-days]', start: 'top 90%', once: true } });
  }

  /* ---------- 9 · الباقات: النقط بتتملى ---------- */
  function animatePanel(panel) {
    if (!panel) return;
    const rows = $$('[data-plan]', panel);
    gsap.fromTo(rows, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07, overwrite: 'auto' });
    rows.forEach((r, i) => {
      const on = $$('.dots i.on', r);
      gsap.fromTo(on, { scale: 0 }, { scale: 1, duration: 0.5, stagger: 0.025, delay: 0.25 + i * 0.07, ease: 'back.out(2)', overwrite: 'auto' });
      const n = $('.plan__n', r);
      const v = parseInt(n.firstChild.textContent, 10);
      if (v) { const o = { v: 0 }; gsap.to(o, { v, duration: 1.2, delay: 0.2 + i * 0.07, ease: 'czInOut', onUpdate: () => { n.firstChild.textContent = Math.round(o.v); } }); }
    });
  }
  function plans() {
    const first = $('[data-panel="monthly"]');
    if (!first) return;
    gsap.set($$('[data-plan]', first), { opacity: 0 });
    ScrollTrigger.create({ trigger: first, start: 'top 82%', once: true, onEnter: () => animatePanel(first) });
    document.addEventListener('cz:panel', (e) => animatePanel(e.detail));
    gsap.fromTo('.tabs button', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, scrollTrigger: { trigger: '.tabs', start: 'top 90%', once: true } });
  }

  /* ---------- 10 · بوابة الأعضاء: الكارت بيميل مع الماوس والحلقة بتعدّ ---------- */
  function member() {
    const stage = $('[data-mstage]');
    if (!stage) return;
    const card = $('[data-mcard]', stage), fg = $('[data-mring-fg]', stage), num = $('[data-mring-n]', stage);
    gsap.fromTo(card, { y: 120, rotation: -8, opacity: 0 }, { y: 0, rotation: -4, opacity: 1, duration: 1.6, scrollTrigger: { trigger: stage, start: 'top 80%', once: true } });
    gsap.fromTo('[data-mring]', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, delay: 0.3, scrollTrigger: { trigger: stage, start: 'top 80%', once: true } });
    const o = { used: 0 };
    gsap.to(o, {
      used: 15, duration: 2.2, ease: 'czInOut', delay: 0.6,
      scrollTrigger: { trigger: stage, start: 'top 75%', once: true },
      onUpdate: () => { const left = 24 - o.used; num.textContent = Math.round(left); fg.setAttribute('stroke-dashoffset', String(1 - left / 24)); },
    });
    gsap.set(fg, { attr: { 'stroke-dashoffset': 0 } });
    if (!fine) return;
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.8, ease: 'cz' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.8, ease: 'cz' });
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 22);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 18);
    });
    stage.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  /* ---------- 11 · العيلة ---------- */
  function family() {
    const img = $('[data-family-img]');
    if (!img) return;
    gsap.fromTo(img, { yPercent: -9 }, { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.family', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.family__img img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.family', start: 'top bottom', end: 'center center', scrub: true } });
  }

  /* ---------- الفوتر: CEZAR عملاقة حرف حرف ---------- */
  function giant() {
    const g = $('.foot__giant');
    if (!g) return;
    gsap.fromTo($$('span', g), { yPercent: 100 }, {
      yPercent: 0, duration: 1.5, stagger: 0.07, ease: 'czInOut',
      scrollTrigger: { trigger: g, start: 'top 95%', once: true },
    });
  }

  /* ---------- المؤشر ---------- */
  function cursor() {
    const c = $('.cursor');
    if (!c || !fine) return;
    root.classList.add('has-cursor');
    const label = $('.cursor__label', c);
    const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    const size = (s, text) => {
      gsap.to(c, { width: s, height: s, margin: -s / 2, duration: 0.6, ease: 'cz', overwrite: 'auto' });
      label.textContent = text || '';
      gsap.to(label, { opacity: text ? 1 : 0, scale: text ? 1 : 0.4, duration: 0.4, overwrite: 'auto' });
    };
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor], a, button, [data-cross]');
      if (!t) return;
      if (t.hasAttribute('data-cross')) size(84, 'Scroll');
      else if (t.hasAttribute('data-cursor')) size(t.dataset.cursor ? 92 : 0, t.dataset.cursor);
      else size(46);
    });
    document.addEventListener('pointerout', (e) => {
      const t = e.target.closest('[data-cursor], a, button, [data-cross]');
      if (t && !t.contains(e.relatedTarget)) size(10);
    });
    root.addEventListener('pointerleave', () => gsap.to(c, { opacity: 0, duration: 0.3 }));
    root.addEventListener('pointerenter', () => gsap.to(c, { opacity: 1, duration: 0.3 }));
  }

  /* ---------- زرار مغناطيسي ---------- */
  function magnet() {
    if (!fine) return;
    $$('[data-magnet]').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.7, ease: 'cz' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.7, ease: 'cz' });
      const zone = btn.parentElement;
      zone.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const near = Math.abs(dx) < r.width / 2 + 70 && Math.abs(dy) < r.height / 2 + 60;
        xTo(near ? dx * 0.25 : 0); yTo(near ? dy * 0.3 : 0);
      });
      zone.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- /tweak (تريك 23): سلايدرز ← Bake ---------- */
  function tweak() {
    if (!/[?&]tweak/.test(location.search)) return;
    const cs = getComputedStyle(root);
    const fields = [
      { label: 'Accent', type: 'color', v: cs.getPropertyValue('--lime').trim() || '#A8DC42', apply: (v) => root.style.setProperty('--lime', v), css: (v) => `--lime: ${v};` },
      { label: 'CEZAR max (px)', min: 200, max: 520, step: 10, v: 380, apply: (v) => root.style.setProperty('--hero-word', `clamp(88px, ${(v / 17.7).toFixed(2)}vw, ${v}px)`), css: (v) => `--hero-word: clamp(88px, ${(v / 17.7).toFixed(2)}vw, ${v}px);` },
      { label: 'H2 max (px)', min: 56, max: 140, step: 2, v: 92, apply: (v) => root.style.setProperty('--h2', `clamp(40px, ${(v / 16.4).toFixed(2)}vw, ${v}px)`), css: (v) => `--h2: clamp(40px, ${(v / 16.4).toFixed(2)}vw, ${v}px);` },
      { label: 'Section space (px)', min: 100, max: 380, step: 4, v: 260, apply: (v) => root.style.setProperty('--sec', `clamp(${Math.round(v * 0.54)}px, 22vh, ${v}px)`), css: (v) => `--sec: clamp(${Math.round(v * 0.54)}px, 22vh, ${v}px);` },
      { label: 'Grain', min: 0, max: 0.2, step: 0.01, v: 0.07, apply: (v) => root.style.setProperty('--grain', v), css: (v) => `--grain: ${v};` },
      { label: 'Motion speed', min: 0.25, max: 1.75, step: 0.05, v: 1, apply: (v) => gsap.globalTimeline.timeScale(v), css: () => '' },
    ];
    const vals = fields.map((f) => f.v);
    const box = document.createElement('div');
    box.className = 'tweak';
    box.innerHTML = '<h4>TWEAK — CEZAR</h4>' + fields.map((f, i) => f.type === 'color'
      ? `<label>${f.label}<output id="tw${i}">${f.v}</output><input type="color" value="${f.v}" data-i="${i}"></label>`
      : `<label>${f.label}<output id="tw${i}">${f.v}</output><input type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${f.v}" data-i="${i}"></label>`).join('') + '<button type="button">Bake</button><pre></pre>';
    document.body.appendChild(box);
    box.addEventListener('input', (e) => {
      const i = +e.target.dataset.i, v = fields[i].type === 'color' ? e.target.value : +e.target.value;
      vals[i] = v; $('#tw' + i, box).textContent = v; fields[i].apply(v); ScrollTrigger.refresh();
    });
    $('button', box).addEventListener('click', () => {
      const css = ':root {\n' + fields.map((f, i) => f.css(vals[i])).filter(Boolean).map((l) => '  ' + l).join('\n') + '\n}';
      const pre = $('pre', box); pre.textContent = css; pre.style.display = 'block';
      if (navigator.clipboard) navigator.clipboard.writeText(css).catch(() => {});
    });
  }
})();
