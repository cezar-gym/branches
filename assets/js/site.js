/* ==========================================================================
   CEZAR — site.js · v4 (الموبايل أولًا)
   GSAP 3.15 (ScrollTrigger + SplitText + DrawSVG + CustomEase) + Lenis.
   الحركة مصممة للصباع والموبايل: ميل الموبايل (gyro) بيحرّك الهيرو والكارت والجزيئات،
   الخريطة بتترسم والنقطة بتمشي من فرع للتاني، والكروت بتطلع من ورا ماسك.
   على الكمبيوتر الماوس بيعمل نفس الميل. مفيش bounce/elastic/glitch.
   العربي بيتقسم سطور/كلمات بس — الحروف للإنجليزي بس.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ok = window.gsap && window.ScrollTrigger && window.SplitText && window.CustomEase;
  const buzz = window.CZBuzz || (() => {});

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
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- Smooth scroll (العجلة بس — اللمس بيفضل native عشان يبقى سلس على الموبايل) ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('cz:lock', () => { if (lenis) lenis.stop(); });
  document.addEventListener('cz:unlock', () => { if (lenis) lenis.start(); });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault(); buzz(5);
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
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
    nowStrip();
    statement();
    banks();
    cards();
    deck();
    ppl();
    programs();
    clock();
    plans();
    member();
    family();
    giant();
    particles();
    tilt();
    dock(); // بعد الـpin عشان مواضع الأقسام تتحسب صح
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

  /* ---------- 1 · الهيرو: المبنى بيطلع قدّام CEZAR، والسكرول بيقرّبك والحروف بتتفرّق ---------- */
  let heroTitle = null;
  function heroIntro() {
    gsap.to('.nav', { opacity: 1, duration: 0.9, delay: 0.6 });
    const tl = gsap.timeline();
    tl.fromTo('.hero__sky img', { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 2.6, ease: 'cz' }, 0)
      .fromTo('[data-hero-building]', { yPercent: 14, opacity: 0, scale: 0.94 }, { yPercent: 0, opacity: 1, scale: 1, duration: 2.2, ease: 'cz' }, 0.05)
      .fromTo('.hero__big .hbi', { yPercent: 110 }, { yPercent: 0, duration: 1.5, stagger: 0.07, ease: 'cz' }, 0.2)
      .fromTo('.hero__gym i', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'czInOut' }, 0.7)
      .fromTo('.hero__gym span', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.2, ease: 'cz' }, 0.75);
    if (heroTitle) tl.fromTo(heroTitle.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.1 }, 0.55);
    tl.fromTo('[data-hero-fade]', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09 }, 0.85)
      .fromTo('[data-tilt-btn]', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8 }, 1.4);
  }
  function heroScroll() {
    const t = $('[data-hero-lines]');
    if (t) heroTitle = SplitText.create(t, { type: 'lines', mask: 'lines', linesClass: 'ln' });
    gsap.set('[data-hero-fade]', { opacity: 0 });
    if (heroTitle) gsap.set(heroTitle.lines, { yPercent: 110 });
    gsap.set('.hero__big .hbi', { yPercent: 110 });
    gsap.set(['[data-hero-building]', '.hero__sky img', '.hero__gym span'], { opacity: 0 });
    gsap.set('.hero__gym i', { scaleX: 0 });
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } })
      .to('[data-hero-building]', { scale: 1.2, yPercent: 8, ease: 'none' }, 0)
      .to('.hero__big .hb', { x: (i) => (i - 2) * window.innerWidth * 0.13, yPercent: -40, opacity: 0.08, ease: 'none' }, 0)
      .to('.hero__gym', { opacity: 0, yPercent: -60, ease: 'none', duration: 0.5 }, 0)
      .to('[data-hero-sky]', { yPercent: 14, opacity: 0.35, ease: 'none' }, 0)
      .to('.hero__meta', { opacity: 0, ease: 'none', duration: 0.4 }, 0)
      .to('.hero__copy', { yPercent: -12, opacity: 0, ease: 'none', duration: 0.5 }, 0.5);
  }

  /* ---------- ميل الموبايل (gyro) — والماوس على الكمبيوتر ----------
     الهيرو: المبنى والحروف بيتحركوا عكس بعض (عمق). الكارت بيميل ولمعته بتتحرك.
     الجزيئات كل واحدة بعمق مختلف. على iOS لازم إذن، فبيظهر زرار «فعّل حركة الموبايل». */
  function tilt() {
    const bld = $('[data-hero-building]'), word = $('[data-hero-word]'), card = $('[data-mcard]');
    const q = (el, p, d = 1.1) => (el ? gsap.quickTo(el, p, { duration: d, ease: 'power3' }) : () => {});
    const bx = q(bld, 'x'), by = q(bld, 'y'), wx = q(word, 'x'), wy = q(word, 'y');
    const cx = q(card, 'rotationY', 0.9), cy = q(card, 'rotationX', 0.9);
    const apply = (nx, ny) => {
      bx(nx * -16); by(ny * -8); wx(nx * 26); wy(ny * 14);
      cx(nx * 18); cy(ny * -14);
      if (card) card.style.setProperty('--sheen', `${(nx * 45).toFixed(1)}%`);
      if (window.CZParticles && CZParticles.tilt) CZParticles.tilt(nx, ny);
    };
    if (fine) {
      window.addEventListener('pointermove', (e) => apply((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2), { passive: true });
      return;
    }
    let b0 = null;
    const clamp = gsap.utils.clamp(-1, 1);
    const onOri = (e) => {
      if (e.gamma == null || e.beta == null) return;
      if (b0 === null) b0 = e.beta;
      b0 += (e.beta - b0) * 0.01; // بيرجع للنص بالراحة
      apply(clamp(e.gamma / 22), clamp((e.beta - b0) / 22));
    };
    const listen = () => window.addEventListener('deviceorientation', onOri, { passive: true });
    const btn = $('[data-tilt-btn]');
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      if (!btn) return;
      btn.hidden = false;
      btn.addEventListener('click', () => {
        DOE.requestPermission().then((s) => {
          if (s === 'granted') { listen(); buzz(10); }
          gsap.to(btn, { opacity: 0, scale: 0.8, duration: 0.4, onComplete: () => { btn.hidden = true; } });
        }).catch(() => { btn.hidden = true; });
      });
    } else if (DOE) listen();
  }

  /* ---------- Nav + الشريط السفلي ---------- */
  function nav() {
    const el = $('[data-nav]');
    if (!el) return;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        el.classList.toggle('is-solid', y > 40);
        el.classList.toggle('is-hidden', y > 600 && self.direction === 1 && !root.classList.contains('is-locked'));
      },
    });
  }
  function dock() {
    const el = $('[data-dock]');
    if (!el) return;
    el.classList.add('is-away');
    ScrollTrigger.create({ start: () => innerHeight * 0.35, end: 'max', onToggle: (s) => el.classList.toggle('is-away', !s.isActive) });
    $$('[data-dock-to]', el).forEach((a) => {
      const sec = $('#' + a.dataset.dockTo);
      if (!sec) return;
      ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => a.classList.toggle('is-on', s.isActive) });
    });
  }

  /* ---------- العناوين: سطور بتطلع من ورا ماسك ---------- */
  function headings() {
    $$('[data-lines]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
        onSplit: (self) => gsap.fromTo(self.lines, { yPercent: 115 }, {
          yPercent: 0, duration: 1.2, stagger: 0.11, scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        }),
      });
    });
    $$('.sec-head .mono, .sec-head p:not(.mono)').forEach((m) => gsap.fromTo(m, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, scrollTrigger: { trigger: m, start: 'top 92%', once: true } }));
  }
  function fades() {
    $$('[data-fade]').forEach((el) => gsap.fromTo(el, { opacity: 0, y: 26 }, {
      opacity: 1, y: 0, duration: 1.1, scrollTrigger: { trigger: el, start: 'top 94%', once: true },
    }));
  }

  /* ---------- 2 · دلوقتي ---------- */
  function nowStrip() {
    const box = $('[data-now]');
    if (!box) return;
    gsap.fromTo(box.children, { opacity: 0, y: 34, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.1, scrollTrigger: { trigger: box, start: 'top 94%', once: true } });
  }

  /* ---------- 3 · الجملة: الكلمات بتنوّر واحدة واحدة ---------- */
  function statement() {
    const el = $('[data-words]');
    if (!el) return;
    const split = SplitText.create(el, { type: 'words', wordsClass: 'w' });
    gsap.fromTo(split.words, { opacity: 0.1, filter: 'blur(6px)', y: 10 }, {
      opacity: 1, filter: 'blur(0px)', y: 0, ease: 'none', stagger: 0.14,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: 0.8 },
    });
  }

  /* ---------- 4 · الخريطة: الشوارع ← الميدان ← الفرعين ← نقطة بتمشي من فرع للتاني ← VIP ---------- */
  function banks() {
    const sec = $('[data-banks]');
    if (!sec) return;
    const q = (s) => $$(s, sec);
    const route = $('[data-route]', sec), walker = $('[data-walker]', sec);
    const len = route ? route.getTotalLength() : 0;
    gsap.set(q('.vip-chip'), { x: 0, y: 0, xPercent: -50, yPercent: -50 });
    gsap.set(q('[data-b]'), { opacity: 0 });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: sec, pin: true, start: 'top top', end: '+=160%', scrub: 0.8, anticipatePin: 1 },
    });
    tl.fromTo(q('.map__minor path'), { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.03 }, 0);
    if (window.DrawSVGPlugin) {
      tl.fromTo(q('.map__roads path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, stagger: 0.05, ease: 'power2.inOut' }, 0)
        .fromTo(q('.map__ring'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, 0.35);
    }
    tl.fromTo(q('.map__park'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.35, ease: 'power3.out' }, 0.75)
      .fromTo(q('.map__label'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.07 }, 0.8)
      .fromTo(q('.map__poi'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.25, stagger: 0.08, ease: 'power3.out' }, 0.9)
      .fromTo(q('[data-b="b1"]'), { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, 1.1)
      .fromTo(q('[data-b="b2"]'), { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, 1.3);
    if (route) {
      if (window.DrawSVGPlugin) tl.fromTo(route, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power1.inOut' }, 1.65);
      const p = { v: 0 };
      tl.fromTo(walker, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 1.65)
        .fromTo(p, { v: 0 }, {
          v: 1, duration: 0.9, ease: 'power1.inOut',
          onUpdate: () => { const pt = route.getPointAtLength(p.v * len); walker.setAttribute('cx', pt.x.toFixed(1)); walker.setAttribute('cy', pt.y.toFixed(1)); },
        }, 1.65)
        .fromTo(q('.route__flow'), { opacity: 0 }, { opacity: 0.9, duration: 0.2 }, 2.5);
    }
    tl.fromTo(q('[data-b="vip"]'), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 2.5)
      .fromTo(q('[data-b="line"], [data-b="note"]'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3 }, 2.65)
      .to({}, { duration: 0.4 });
    gsap.fromTo(q('.banks__head > *'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, scrollTrigger: { trigger: sec, start: 'top 78%', once: true } });
  }

  /* ---------- 5 · كروت الفرعين: الصورة بتتكشف من تحت ورقمها بيطلع ---------- */
  function cards() {
    $$('.bcard').forEach((c) => {
      gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 88%', once: true } })
        .fromTo(c, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 1.1 }, 0)
        .fromTo($('.bcard__media', c), { '--rc': 1 }, { '--rc': 0, duration: 1.3, ease: 'czInOut' }, 0)
        .fromTo($('.bcard__media img', c), { scale: 1.25 }, { scale: 1, duration: 1.7 }, 0)
        .fromTo($('.bcard__n', c), { yPercent: 100 }, { yPercent: 0, duration: 1.2, ease: 'czInOut' }, 0.45)
        .fromTo($('.bcard__body', c).children, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06 }, 0.3);
    });
  }

  /* ---------- 6 · الكوتشينة: الكروت بتنزل على بعض أول ما تظهر ---------- */
  function deck() {
    const d = $('[data-deck]');
    if (!d || !window.CZDeck) return;
    gsap.set(d.children, { opacity: 0 });
    ScrollTrigger.create({ trigger: d, start: 'top 85%', once: true, onEnter: () => CZDeck.intro() });
    gsap.fromTo('.inside__bar, .deck__ui', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1, scrollTrigger: { trigger: '.inside__bar', start: 'top 92%', once: true } });
  }

  /* ---------- 7 · PUSH PULL LEGS: صفين عكس بعض + ميل حسب سرعة السكرول ---------- */
  function ppl() {
    const wrap = $('[data-ppl]');
    if (!wrap) return;
    const rows = $$('.ppl__row', wrap);
    rows.forEach((row) => {
      const dir = Number(row.dataset.dir || 1);
      const travel = () => Math.min(row.scrollWidth * 0.4, window.innerWidth * 1.2);
      gsap.fromTo(row, { x: () => (dir > 0 ? 0 : -travel()) }, {
        x: () => (dir > 0 ? -travel() : 0), ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
      });
    });
    const skewTo = gsap.quickTo(rows, 'skewX', { duration: 0.6, ease: 'cz' });
    ScrollTrigger.create({
      trigger: wrap, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => skewTo(gsap.utils.clamp(-10, 10, self.getVelocity() / -260)),
      onLeave: () => skewTo(0), onLeaveBack: () => skewTo(0),
    });
  }

  /* ---------- 8 · البرامج ---------- */
  function programs() {
    const list = $('[data-acc]');
    if (!list) return;
    const items = $$('.acc__item', list);
    gsap.fromTo(items, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, scrollTrigger: { trigger: list, start: 'top 88%', once: true } });
    gsap.fromTo($$('.acc__plus', list), { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.9, stagger: 0.08, delay: 0.3, scrollTrigger: { trigger: list, start: 'top 88%', once: true } });
  }

  /* ---------- 9 · الساعة: السويتش بيطلع، والدايرة بتكبر والشريط بيتملي لمكانه ---------- */
  function clock() {
    const sec = $('[data-clock]');
    if (!sec) return;
    const sw = $('[data-brswitch]', sec), ring = $('[data-ring]', sec);
    gsap.set([sw, ring, '.ring-note', '.ring-addr'], { opacity: 0 });
    ScrollTrigger.create({
      trigger: ring, start: 'top 80%', once: true,
      onEnter: () => {
        gsap.timeline()
          .fromTo(sw, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9 }, 0)
          .fromTo(ring, { opacity: 0, scale: 0.86, rotation: -12 }, { opacity: 1, scale: 1, rotation: 0, duration: 1.4 }, 0.1)
          .fromTo(['.ring-note', '.ring-addr'], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.6)
          .add(() => { if (window.CZRing) CZRing.show(); }, 0.3);
      },
    });
  }

  /* ---------- 10 · الباقات: الكروت بتدخل من الجنب والنقط بتتملى والرقم بيعدّ ---------- */
  function animatePanel(panel) {
    if (!panel) return;
    const rows = $$('[data-plan]', panel);
    gsap.fromTo(rows, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1, stagger: 0.07, overwrite: 'auto' });
    rows.forEach((r, i) => {
      const on = $$('.dots i.on', r);
      gsap.fromTo(on, { scale: 0 }, { scale: 1, duration: 0.45, stagger: 0.02, delay: 0.25 + i * 0.07, ease: 'back.out(2)', overwrite: 'auto' });
      const n = $('.plan__n', r);
      const v = parseInt(n.firstChild.textContent, 10);
      if (v) { const o = { v: 0 }; gsap.to(o, { v, duration: 1.1, delay: 0.2 + i * 0.07, ease: 'czInOut', onUpdate: () => { n.firstChild.textContent = Math.round(o.v); } }); }
    });
  }
  function plans() {
    const first = $('[data-panel="monthly"]');
    if (!first) return;
    gsap.set($$('[data-plan]', first), { opacity: 0 });
    ScrollTrigger.create({ trigger: first, start: 'top 88%', once: true, onEnter: () => animatePanel(first) });
    document.addEventListener('cz:panel', (e) => animatePanel(e.detail));
    gsap.fromTo('.tabs button', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, scrollTrigger: { trigger: '.tabs', start: 'top 94%', once: true } });
    const vip = $('[data-vip-card]');
    if (vip) {
      gsap.timeline({ scrollTrigger: { trigger: vip, start: 'top 88%', once: true } })
        .fromTo(vip, { opacity: 0, y: 50, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1.1 }, 0)
        .fromTo($('.vip__word', vip), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1 }, 0.2)
        .fromTo($$('.vip__opt', vip), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: 'back.out(1.6)' }, 0.5);
    }
  }

  /* ---------- 11 · بوابة الأعضاء: الكارت بيطفو وبيميل مع الموبايل، والحلقة بتعدّ ---------- */
  function member() {
    const stage = $('[data-mstage]');
    if (!stage) return;
    const card = $('[data-mcard]', stage), fg = $('[data-mring-fg]', stage), num = $('[data-mring-n]', stage);
    gsap.fromTo(card, { y: 120, rotation: -8, opacity: 0 }, { y: 0, rotation: -4, opacity: 1, duration: 1.6, scrollTrigger: { trigger: stage, start: 'top 85%', once: true } });
    gsap.fromTo('[data-mring]', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, delay: 0.3, scrollTrigger: { trigger: stage, start: 'top 85%', once: true } });
    gsap.to(stage, { y: -10, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const o = { used: 0 };
    gsap.to(o, {
      used: 15, duration: 2.2, ease: 'czInOut', delay: 0.6,
      scrollTrigger: { trigger: stage, start: 'top 80%', once: true },
      onUpdate: () => { const left = 24 - o.used; num.textContent = Math.round(left); fg.setAttribute('stroke-dashoffset', String(1 - left / 24)); },
    });
    gsap.set(fg, { attr: { 'stroke-dashoffset': 0 } });
    gsap.fromTo('.member__list li', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.9, stagger: 0.08, scrollTrigger: { trigger: '.member__list', start: 'top 92%', once: true } });
  }

  /* ---------- 12 · العيلة: الصورة بتتكشف من تحت ---------- */
  function family() {
    const fig = $('.family__fig');
    if (!fig) return;
    gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } })
      .fromTo(fig, { '--rc': 1 }, { '--rc': 0, duration: 1.5, ease: 'czInOut' }, 0)
      .fromTo($('img', fig), { scale: 1.3 }, { scale: 1, duration: 2 }, 0);
  }

  /* ---------- الفوتر: CEZAR عملاقة حرف حرف ---------- */
  function giant() {
    const g = $('.foot__giant');
    if (!g) return;
    gsap.fromTo($$('span', g), { yPercent: 100 }, {
      yPercent: 0, duration: 1.4, stagger: 0.07, ease: 'czInOut',
      scrollTrigger: { trigger: g, start: 'top 98%', once: true },
    });
  }

  /* ---------- المؤشر (كمبيوتر بس) ---------- */
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
    const sel = '[data-cursor], a, button, [data-deck], [data-view-gal]';
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest(sel);
      if (!t) return;
      if (t.hasAttribute('data-deck')) size(84, 'Drag');
      else if (t.hasAttribute('data-view-gal')) size(84, 'View');
      else if (t.hasAttribute('data-cursor')) size(t.dataset.cursor ? 92 : 0, t.dataset.cursor);
      else size(46);
    });
    document.addEventListener('pointerout', (e) => {
      const t = e.target.closest(sel);
      if (t && !t.contains(e.relatedTarget)) size(10);
    });
    root.addEventListener('pointerleave', () => gsap.to(c, { opacity: 0, duration: 0.3 }));
    root.addEventListener('pointerenter', () => gsap.to(c, { opacity: 1, duration: 0.3 }));
  }

  /* ---------- /tweak (تريك 23): سلايدرز ← Bake ---------- */
  function tweak() {
    if (!/[?&]tweak/.test(location.search)) return;
    const cs = getComputedStyle(root);
    const fields = [
      { label: 'Accent', type: 'color', v: cs.getPropertyValue('--lime').trim() || '#BDF73B', apply: (v) => root.style.setProperty('--lime', v), css: (v) => `--lime: ${v};` },
      { label: 'Gutter (px)', min: 12, max: 40, step: 1, v: 20, apply: (v) => root.style.setProperty('--gx', `${v}px`), css: (v) => `--gx: ${v}px;` },
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
