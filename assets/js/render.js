/* ==========================================================================
   CEZAR — render.js
   كل حاجة بتتولّد من data.js: الهيرو، حالة كل فرع، كروت الفرعين،
   «مين فاتح؟» (ساعة الفرعين)، الأسعار لكل فرع + VIP، الفوتر، واتساب لكل فرع.
   شغّال من غير GSAP.
   ========================================================================== */
(() => {
  const D = window.CZ, H = window.CezarHours;
  if (!D || !H) return;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const SPRITE = 'assets/icons/sprite.svg';
  const ico = (n) => `<svg class="ico" aria-hidden="true"><use href="${SPRITE}#i-${n}"/></svg>`;
  const B = {}; D.branches.forEach((b) => { B[b.id] = b; });
  const waTo = (id, t) => `https://wa.me/${(B[id] || B.b1).whatsapp}?text=${encodeURIComponent(t)}`;
  const G = { men: 'رجالة', women: 'سيدات' };
  const GL = { men: 'للرجالة', women: 'للسيدات' };
  const dayNames = D.schedule.days;
  const segsOf = (id) => (B[id] && B[id].schedule) || D.schedule.segments;
  const sessionsWord = (n) => (n >= 3 && n <= 10 ? 'حصص' : 'حصة');
  const monthsWord = (n) => (n >= 3 && n <= 10 ? 'شهور' : 'شهر');
  const hm = (m) => H.clockFromMins(m);

  /* ---------- الهيرو: المبنى المفرّغ (رسم Gemini) ---------- */
  const hero = $('.hero'), bld = $('[data-hero-building]');
  if (hero && bld && D.hero && D.hero.cut) {
    hero.classList.add('hero--cut');
    if (D.hero.cutSmall) { bld.srcset = `${D.hero.cutSmall} 1100w, ${D.hero.cut} 2000w`; bld.sizes = '(max-width: 760px) 120vw, 1100px'; }
    bld.src = D.hero.cut;
    bld.alt = D.hero.alt || '';
  }

  /* ---------- واتساب: لو اللينك مش محدد له فرع، اسأل «أنهي فرع؟» ---------- */
  const sheet = $('[data-wa-sheet]'), opts = $('[data-wa-opts]');
  let lastFocus = null;
  const openSheet = (msg) => {
    if (!sheet) return false;
    opts.innerHTML = D.branches.map((b) => `<a class="${b.id}" href="${waTo(b.id, msg)}" target="_blank" rel="noopener"><span class="n">${b.n}</span><span><b>${b.name}</b><small>${b.short} · <span dir="ltr">${b.mobile}</span></small></span>${ico('brand-whatsapp')}</a>`).join('');
    lastFocus = document.activeElement;
    sheet.hidden = false;
    $('a', opts).focus();
    return true;
  };
  const closeSheet = () => { if (!sheet || sheet.hidden) return; sheet.hidden = true; if (lastFocus) lastFocus.focus(); };
  if (sheet) {
    $$('[data-wa-close]', sheet).forEach((x) => x.addEventListener('click', closeSheet));
    opts.addEventListener('click', (e) => { if (e.target.closest('a')) setTimeout(closeSheet, 50); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  }
  $$('[data-wa]').forEach((a) => {
    const br = a.dataset.br;
    a.href = waTo(br || 'b1', a.dataset.wa);
    if (!br) a.addEventListener('click', (e) => { if (openSheet(a.dataset.wa)) e.preventDefault(); });
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

  /* ---------- مفتوح دلوقتي؟ ---------- */
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  const statusText = (s, now) => {
    if (s.open) return `مفتوح دلوقتي · ${G[s.seg.g]} لحد ${H.clock(s.seg.end)}`;
    if (s.next) return `مقفول · بيفتح ${sameDay(s.next.start, now) ? '' : 'بكرة '}${H.clock(s.next.start)}`;
    return 'المواعيد';
  };
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
    const text = gs.length === 2 ? 'مفتوح دلوقتي · رجالة وسيدات' : gs.length ? `مفتوح دلوقتي · ${G[gs[0]]}` : statusText(st.b2, now);
    $$('[data-live]').forEach((el) => {
      el.classList.toggle('is-open', gs.length > 0);
      const t = $('[data-live-text]', el); if (t) t.textContent = text;
    });
  }
  live();
  setInterval(live, 30000);

  /* ---------- كروت الفرعين ---------- */
  const todaySlots = (id) => {
    const segs = segsOf(id)[String(new Date().getDay())] || [];
    return segs.map((s) => `${G[s.g]} ${hm(s.from)}–${hm(s.to)}`).join(' · ') || 'مقفول النهارده';
  };
  const bc = $('[data-bcards]');
  if (bc) {
    bc.innerHTML = D.branches.map((b) => `
      <article class="bcard bcard--${b.id}" data-bcard="${b.id}">
        <div class="bcard__media">
          <img src="assets/img/${b.img}.webp" srcset="assets/img/${b.img}@s.webp 860w, assets/img/${b.img}.webp 1600w" sizes="(max-width: 899px) 100vw, 50vw" alt="${b.name}" loading="lazy">
          <span class="bcard__n">${b.n}</span>
        </div>
        <div class="bcard__body">
          <p class="mono">${b.latin} — ${b.area}</p>
          <h3>${b.name}${b.isNew ? '<span class="newtag">NEW</span>' : ''}</h3>
          <p class="bcard__addr">${b.address}</p>
          <div class="bcard__today"><b>النهارده${b.scheduleNote ? ' · ' + b.scheduleNote : ''}</b><span>${todaySlots(b.id)}</span></div>
          <span class="live" data-live-branch="${b.id}"><i class="live__dot"></i><span data-live-text>—</span></span>
          ${D.vip && D.vip.to.includes(b.id) ? `<p class="bcard__vip"><b>VIP</b>${b.id === D.vip.from ? 'اشتراك VIP هنا بيفتحلك الفرع الأول كمان.' : 'مفتوح كمان لمشتركين VIP من الفرع الجديد.'}</p>` : ''}
          <div class="bcard__acts">
            <a class="btn btn--sm" href="${b.maps}" target="_blank" rel="noopener">${ico('map-pin')}الخريطة</a>
            <a class="btn btn--ghost btn--sm" href="${waTo(b.id, `أهلًا، عندي سؤال عن ${b.name}`)}" target="_blank" rel="noopener">${ico('brand-whatsapp')}<span dir="ltr">${b.mobile}</span></a>
            ${b.landline ? `<a class="btn btn--ghost btn--sm" href="tel:${b.landline.replace(/[^\d]/g, '')}">${ico('phone')}<span dir="ltr">${b.landline}</span></a>` : ''}
          </div>
        </div>
      </article>`).join('');
    live();
  }

  /* ---------- «مين فاتح؟» — ساعة الفرعين ---------- */
  const dial = $('[data-dial]');
  if (dial) {
    const R = { b1: 214, b2: 166 };
    const ticks = $('[data-ticks]', dial), arcs = $('[data-arcs]', dial), hand = $('[data-hand]', dial), pick = $('[data-pick]', dial);
    const pt = (deg, r) => { const a = (deg - 90) * Math.PI / 180; return [Math.cos(a) * r, Math.sin(a) * r]; };
    let tk = '';
    for (let h = 0; h < 24; h++) {
      const major = h % 6 === 0;
      const [x1, y1] = pt(h * 15, major ? 236 : 240), [x2, y2] = pt(h * 15, 252);
      tk += `<line class="dial__tick${major ? ' is-major' : ''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      if (major) { const [lx, ly] = pt(h * 15, 278); tk += `<text class="dial__lbl" x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle">${String(h).padStart(2, '0')}:00</text>`; }
    }
    ticks.innerHTML = tk;
    const arcPath = (a0m, a1m, r) => {
      const a0 = (a0m / 1440) * 360, a1 = (Math.min(a1m, a0m + 1439.5) / 1440) * 360;
      const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
      return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    };
    const order = [6, 0, 1, 2, 3, 4, 5];
    const now0 = new Date();
    const today = now0.getDay();
    const daysBox = $('[data-days]'), gBox = $('[data-hf-g]'), range = $('[data-hf-range]'), out = $('[data-hf-out]');
    const result = $('[data-hf-result]'), cover = $('[data-hf-cover]'), dTime = $('[data-dial-time]'), dDay = $('[data-dial-day]');
    daysBox.innerHTML = order.map((d) => `<button type="button" data-day="${d}" aria-pressed="${d === today}">${dayNames[d]}${d === today ? '<span class="t">النهارده</span>' : ''}</button>`).join('');
    let day = today, g = 'men', at = Math.floor((now0.getHours() * 60 + now0.getMinutes()) / 15) * 15;
    range.value = at;
    const fmt24 = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    function draw() {
      $$('button', daysBox).forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.day === day)));
      $$('button', gBox).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.g === g)));
      let i = 0;
      arcs.innerHTML = D.branches.map((b) => daySegs(b.id, day).map((s) => `<path class="dial__arc ${b.id}${s.g === g ? '' : ' other'}" d="${arcPath(s.from, s.to, R[b.id])}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" style="transition:stroke-dashoffset 1s var(--czio) ${0.08 + (i++) * 0.09}s"/>`).join('')).join('');
      requestAnimationFrame(() => requestAnimationFrame(() => $$('.dial__arc', arcs).forEach((p) => p.setAttribute('stroke-dashoffset', '0'))));
      const both = coverage(['b1', 'b2'], day, g), one = Math.max(coverage(['b1'], day, g), coverage(['b2'], day, g));
      const hw = (n) => (n >= 3 && n <= 10 ? 'ساعات' : 'ساعة');
      const hb = Math.round(both / 60), ho = Math.round(one / 60);
      cover.innerHTML = `يوم ${dayNames[day]}: ال${G[g]} يقدروا يتمرنوا <b>${hb}</b> ${hw(hb)} من 24 بالفرعين مع بعض — فرع واحد لوحده أقصاه <b>${ho}</b> ${hw(ho)}.`;
      update();
    }
    function update() {
      out.textContent = `${hm(at)}`;
      pick.setAttribute('transform', `rotate(${(at / 1440) * 360})`);
      const now = new Date();
      hand.style.opacity = day === now.getDay() ? 1 : 0;
      hand.setAttribute('transform', `rotate(${((now.getHours() * 60 + now.getMinutes()) / 1440) * 360})`);
      const open = [];
      result.innerHTML = D.branches.map((b) => {
        const s = segAt(b.id, day, at);
        const isOpen = !!(s && s.g === g);
        if (isOpen) open.push(b);
        const nx = nextFor(b.id, day, at, g);
        const st = isOpen ? `فاتح ${GL[g]} لحد ${hm(s.end || s.to)}${(s.end || 0) > 1440 ? ' الفجر' : ''}` : s ? `فترة ${G[s.g]} دلوقتي${nx ? ` — ${GL[g]} من ${nx}` : ''}` : `مقفول${nx ? ` — بيفتح ${GL[g]} ${nx}` : ''}`;
        return `<div class="hf-br${isOpen ? ' is-open' : ''}"><div><b>${b.n} · ${b.name}</b><div class="st">${st}</div></div>${isOpen ? `<a href="${b.maps}" target="_blank" rel="noopener">الخريطة ←</a>` : ''}</div>`;
      }).join('');
      dTime.textContent = fmt24(at);
      dDay.textContent = open.length === 2 ? `الفرعين فاتحين ${GL[g]}` : open.length ? `${open[0].name} فاتح ${GL[g]}` : `الفرعين مقفولين ${GL[g]}`;
    }
    daysBox.addEventListener('click', (e) => { const b = e.target.closest('[data-day]'); if (b) { day = +b.dataset.day; draw(); } });
    gBox.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) { g = b.dataset.g; draw(); } });
    range.addEventListener('input', () => { at = +range.value; update(); });
    draw();
    setInterval(update, 30000);
    window.CZDial = { show: draw };
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
  const dots = (n, of) => `<div class="dots${of > 24 ? ' dots--30' : ''}" aria-hidden="true">${Array.from({ length: of }, (_, i) => `<i${i < n ? ' class="on"' : ''}></i>`).join('')}</div>`;
  const price = (p) => `<p class="plan__price">${p.toLocaleString('en-US')}<small>ج</small></p>`;
  const pb = $('[data-plan-branch]');
  let pbr = 'b2';
  function renderPlans() {
    const P = D.plans[pbr], b = B[pbr];
    const btn = (msg) => `<a class="btn btn--sm" href="${waTo(pbr, msg + ` — ${b.name}`)}" target="_blank" rel="noopener">اشترك</a>`;
    $$('button', pb).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.br === pbr)));
    $('[data-plan-note]').textContent = `أسعار ${b.name} · ${b.short}`;
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
      const m = (a.note || '').match(/(\d+)\s*(?:جلس|حص)/); const n = m ? +m[1] : 0;
      return `
      <div class="plan" data-plan>
        <p class="plan__n">${n || '—'}<small>${n ? sessionsWord(n) : 'برنامج'}</small></p>
        ${n ? dots(n, 24) : '<div></div>'}
        <div class="plan__name"><h3>${a.name}</h3><p>${a.note || ''}</p></div>
        ${price(a.price)}
        ${btn(`أهلًا، عايز أشترك في ${a.name} (${a.price} ج)`)}
      </div>`;
    }).join('');
    $('[data-singles]').innerHTML = P.singles.map((s) => `<span>${s.name} <b>${s.price} ج</b></span>`).join('') + '<span>الأسعار بالجنيه المصري.</span>';
  }
  if (pb) {
    pb.innerHTML = D.branches.map((b) => `<button type="button" data-br="${b.id}" aria-pressed="${b.id === pbr}">${b.n} · ${b.name}</button>`).join('');
    renderPlans();
    pb.addEventListener('click', (e) => {
      const x = e.target.closest('[data-br]'); if (!x || x.dataset.br === pbr) return;
      pbr = x.dataset.br; renderPlans();
      const vis = $$('.panel').find((p) => !p.hidden);
      document.dispatchEvent(new CustomEvent('cz:panel', { detail: vis }));
    });
    const tabs = $$('[role="tab"]');
    const select = (tab) => {
      tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; });
      document.dispatchEvent(new CustomEvent('cz:panel', { detail: $('#' + tab.getAttribute('aria-controls')) }));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => { const k = { ArrowLeft: 1, ArrowRight: -1 }[e.key]; if (!k) return; const n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); select(n); });
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
