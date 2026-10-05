/* ==========================================================================
   CEZAR — portal.js (بوابة الأعضاء — الفرعين)
   الدخول: رقم العضوية + رقم الموبايل المسجّل (بأي شكل: 010… أو +2010… أو بأرقام عربي).
   • تجريبي (CZ_PORTAL.demo): أعضاء وهميين من CZModel.demo().
   • حقيقي: سجل العضو متشفّر في data/portal.js وبيتفك بالرقمين دول بس.
   5 محاولات غلط = قفل دقيقة. الجلسة بتتنسي أول ما التاب يتقفل.
   ========================================================================== */
(() => {
  const D = window.CZ, H = window.CezarHours, P = window.CZ_PORTAL || { demo: true }, M = window.CZModel, C = window.CZCrypto;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = !!window.gsap && !reduce;
  if (anim && window.CustomEase) { gsap.registerPlugin(CustomEase); CustomEase.create('cz', '0.16,1,0.3,1'); gsap.defaults({ ease: 'cz', duration: 1 }); }
  const wa = (t, br) => `https://wa.me/${((D.branches.find((x) => x.id === br)) || D.branches[0]).whatsapp || D.contact.whatsapp}?text=${encodeURIComponent(t)}`;
  const G = { men: 'رجالة', women: 'سيدات' };
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const DAYS = D.schedule.days;
  const B = {}; D.branches.forEach((b) => { B[b.id] = b; });
  const segsOf = (id) => (B[id] && B[id].schedule) || D.schedule.segments;
  const fmtDate = (s, withYear = true) => { if (!s) return '—'; const d = new Date(s + (s.length === 10 ? 'T00:00' : '')); return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`; };
  const money = (n) => Number(n || 0).toLocaleString('en-US');
  const word = (n, one, few, many) => (n === 1 ? one : n === 2 ? few : n >= 3 && n <= 10 ? many : one);
  const TYPE = { monthly: 'شهري', yearly: 'طويل المدى', activity: 'نشاط', pt: 'برايفيت', single: 'جلسة واحدة' };
  const brTag = (id) => (B[id] ? `<span class="brtag brtag--${id}">${B[id].n} · ${B[id].short}</span>` : '');

  /* ---------- الحالة الحيّة (الفرعين) + لينكات واتساب ---------- */
  function live() {
    const el = $('[data-live]');
    if (!el) return;
    const st = D.branches.map((b) => [b, H.status(segsOf(b.id), new Date())]);
    const open = st.filter(([, s]) => s.open);
    el.classList.toggle('is-open', open.length > 0);
    $('[data-live-text]', el).textContent = open.length === st.length ? `الفرعين مفتوحين · ${G[open[0][1].seg.g]}` : open.length ? `${open[0][0].short} مفتوح دلوقتي` : 'الفرعين مقفولين دلوقتي';
  }
  live(); setInterval(live, 30000);
  $$('[data-wa]').forEach((a) => { a.href = wa(a.dataset.wa); });

  /* ---------- الدخول ---------- */
  const form = $('[data-form]'), code = $('#f-code'), pin = $('#f-pin'), err = $('#f-err'), go = $('[data-go]'), goL = $('[data-go-label]');
  const gate = $('[data-gate]'), dash = $('[data-dash]'), logoutBtn = $('[data-logout]');
  const SS = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: (k) => { try { sessionStorage.removeItem(k); } catch (e) {} } };
  code.addEventListener('input', () => { code.value = code.value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, ''); });
  [code, pin].forEach((el) => el.addEventListener('input', () => { el.closest('.field').classList.remove('is-bad'); err.textContent = ''; }));

  const fail = (msg, which) => {
    err.textContent = msg;
    (which || [code, pin]).forEach((el) => el.closest('.field').classList.add('is-bad'));
    if (anim) gsap.fromTo(form, { x: 0 }, { x: 0, keyframes: { x: [0, -10, 10, -6, 6, 0] }, duration: 0.5, ease: 'none' });
  };
  const busy = (on) => { go.setAttribute('aria-busy', String(on)); goL.textContent = on ? 'لحظة…' : 'ادخل'; };

  async function find(c, p) {
    if (P.demo) {
      const m = M.demo(new Date()).find((x) => x.code === c && x.pin === p);
      return m ? m.rec : null;
    }
    if (!C || !C.ok) throw new Error('nocrypto');
    const id = await C.idOf(P.salt, c);
    const blob = P.records && P.records[id];
    if (!blob) return null;
    try { return await C.open(blob, P.salt, c, p, P.iter); } catch (e) { return null; }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const until = +(SS.get('cz-lock') || 0);
    if (until > Date.now()) { fail(`محاولات كتير. استنى ${Math.ceil((until - Date.now()) / 1000)} ثانية وجرّب تاني.`); return; }
    const c = code.value.replace(/[^\d]/g, ''), p = M.phone(pin.value);
    if (c.length < 3) { fail('اكتب رقم العضوية — مكتوب على الكارت بتاعك.', [code]); code.focus(); return; }
    if (!/^01\d{9}$/.test(p)) { fail('اكتب رقم موبايلك اللي مسجّل بيه في الجيم — 11 رقم بيبدأ بـ 01.', [pin]); pin.focus(); return; }
    busy(true);
    let rec = null;
    try { rec = await find(c, p); } catch (x) { busy(false); fail('المتصفح ده مش بيدعم الدخول الآمن. جرّب كروم أو سفاري محدّث.'); return; }
    busy(false);
    if (!rec) {
      const n = +(SS.get('cz-fails') || 0) + 1;
      SS.set('cz-fails', String(n));
      if (n >= 5) { SS.set('cz-lock', String(Date.now() + 60000)); SS.set('cz-fails', '0'); }
      fail(n >= 5 ? 'محاولات كتير. استنى دقيقة وجرّب تاني.' : 'رقم العضوية ورقم الموبايل مش مظبوطين مع بعض. اتأكد منهم أو اسأل الاستقبال.');
      return;
    }
    SS.set('cz-fails', '0');
    SS.set('cz-who', JSON.stringify([c, p]));
    show(rec);
  });

  /* ---------- النسخة التجريبية ---------- */
  if (P.demo) {
    const box = $('[data-demo]'), list = $('[data-demo-list]');
    const labels = { active: 'ساري', frozen: 'مجمّد', expired: 'منتهي', used: 'الجلسات خلصت' };
    list.innerHTML = M.demo(new Date()).map((m) => {
      const v = M.view(m.rec);
      return `<button type="button" data-c="${m.code}" data-p="${m.pin}"><b>${m.rec.name} — ${labels[v.status] || ''}${m.rec.sub && m.rec.sub.vip ? ' · VIP' : ''}</b><span class="lat">${m.code} · ${m.pin}</span></button>`;
    }).join('');
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      code.value = b.dataset.c; pin.value = b.dataset.p;
      form.requestSubmit ? form.requestSubmit() : go.click();
    });
    box.hidden = false;
  }

  /* ---------- اللوحة ---------- */
  function show(rec) {
    const now = new Date();
    const v = M.view(rec, now);
    const s = rec.sub;
    const home = rec.home || 'b1';
    const first = rec.name.split(' ')[0];
    $('[data-d-no]').textContent = `Member № ${rec.code}${s && s.vip ? ' · VIP' : ''}`;
    $('[data-d-hello]').textContent = `أهلًا يا ${first}.`;
    const ST = { active: 'ساري', frozen: 'مجمّد', expired: 'منتهي', used: 'الجلسات خلصت', blocked: 'موقوف', none: 'مفيش اشتراك' };
    const chip = $('[data-d-status]');
    chip.className = 'chip s-' + v.status; chip.textContent = ST[v.status];

    /* تنبيهات */
    const alerts = [];
    if (v.status === 'expired') alerts.push({ k: 'expired', t: `اشتراكك خلص ${v.daysLeft === -1 ? 'امبارح' : `من ${-v.daysLeft} ${word(-v.daysLeft, 'يوم', 'يومين', 'أيام')}`}.`, d: 'الحديد مستنيك — جدّد وكمّل على نفس النظام.' });
    if (v.status === 'used') alerts.push({ k: 'used', t: 'جلساتك خلصت قبل التاريخ.', d: 'جدّد عشان تكمّل — أو اسأل عن باقة جلساتها أكتر.' });
    if (v.status === 'frozen') alerts.push({ k: 'frozen', t: `اشتراكك متجمّد لحد ${fmtDate(s.freezeTo, false)}.`, d: 'أيام التجميد بتتضاف على آخر اشتراكك.' });
    if (v.status === 'blocked') alerts.push({ k: 'blocked', t: 'العضوية موقوفة.', d: 'كلّم إدارة الجيم.' });
    v.alerts.forEach((a) => alerts.push(a));
    $('[data-d-alerts]').innerHTML = alerts.map((a) => `<div class="alert k-${a.k}"><div><b>${a.t}</b><span>${a.d}</span></div></div>`).join('');

    /* الحلقة */
    const ended = ['expired', 'blocked', 'none'].includes(v.status);
    const total = v.total || 0, left = ended || v.left == null ? 0 : v.left;
    const ticks = $('[data-d-ticks]');
    ticks.innerHTML = '';
    if (total && total <= 40) {
      let t = '';
      for (let i = 0; i < total; i++) {
        const a = (i / total) * Math.PI * 2;
        t += `<line class="ring__tick" x1="${(100 + Math.cos(a) * 77).toFixed(2)}" y1="${(100 + Math.sin(a) * 77).toFixed(2)}" x2="${(100 + Math.cos(a) * 95).toFixed(2)}" y2="${(100 + Math.sin(a) * 95).toFixed(2)}"/>`;
      }
      ticks.innerHTML = t;
    }
    $('[data-d-plan]').textContent = s ? s.plan : '—';
    $('[data-d-used]').textContent = s ? (s.sessionsUsed || 0) : 0;
    $('[data-d-total]').textContent = total || '—';
    $('[data-d-left-l]').textContent = ended ? (v.status === 'expired' ? 'الاشتراك خلص' : 'مفيش جلسات') : word(left, 'جلسة فاضلة', 'جلستين فاضلين', 'جلسات فاضلة');
    $('[data-d-days]').textContent = !s ? '—' : v.daysLeft < 0 ? 'خلص' : v.daysLeft === 0 ? 'آخر يوم النهارده' : `فاضل ${v.daysLeft} ${word(v.daysLeft, 'يوم', 'يومين', 'أيام')}`;
    $('[data-d-start]').textContent = s ? fmtDate(s.startAt, false) : '—';
    $('[data-d-end]').textContent = s ? fmtDate(s.endAt, false) : '—';
    const dayP = s ? Math.max(0, Math.min(1, v.daysLeft / v.daysTotal)) : 0;

    /* الكارت */
    $('[data-d-cardno]').textContent = `№ ${rec.code}`;
    $('[data-d-cardname]').textContent = rec.name;
    $('[data-d-cardplan]').textContent = s ? `${s.plan} · ${total} ${word(total, 'جلسة', 'جلستين', 'جلسات')}` : '—';
    $('[data-d-cardbr]').textContent = s && s.vip ? 'VIP · 01 + 02' : `${B[home].n} · ${B[home].latin}`;
    $('[data-d-cardvalid]').textContent = s ? `Valid ${s.endAt.slice(5).replace('-', '/')}` : '';
    const qrBox = $('[data-d-qr]');
    if (window.qrcode) { const q = qrcode(0, 'M'); q.addData('CEZAR:' + rec.code); q.make(); qrBox.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); }
    const flip = $('[data-flip]');
    flip.classList.remove('is-back');
    flip.onclick = () => flip.classList.toggle('is-back');

    /* التفاصيل */
    const facts = [];
    if (s) {
      facts.push(['الباقة', s.plan + (s.vip && !/vip/i.test(s.plan) ? ' <span class="vipb">VIP</span>' : '')], ['الاشتراك في', B[s.branch || home] ? B[s.branch || home].name : '—'], ['بدأت', fmtDate(s.startAt)], ['بتنتهي', fmtDate(s.endAt)]);
      facts.push(['السعر', s.discount ? `${money(s.price)} ج (خصم ${s.discount}%)` : `${money(s.price)} ج`], ['المدفوع', `${money(s.paid)} ج`]);
      if (v.due > 0) facts.push(['المتبقي', `${money(v.due)} ج`]);
      if (s.coach) facts.push(['الكابتن', s.coach]);
    }
    facts.push(['الفترة', rec.gender === 'f' ? 'سيدات' : 'رجالة'], ['النوع', s ? TYPE[s.type] || '—' : '—']);
    if (rec.lockerNo) facts.push(['اللوكر', `رقم ${rec.lockerNo}`]);
    if (rec.joinedAt) facts.push(['عضو من', fmtDate(rec.joinedAt)]);
    if (s && s.freezes && s.freezes.length) facts.push(['التجميد', s.freezes.map((f) => `${fmtDate(f.from, false)} ← ${fmtDate(f.to, false)}`).join(' · ')]);
    $('[data-d-facts]').innerHTML = facts.map(([k, val]) => `<div><dt>${k}</dt><dd>${val}</dd></div>`).join('');

    /* الحضور في الفرعين: 12 أسبوع، الأسبوع بيبدأ السبت */
    const visits = {}; const per = { b1: [], b2: [] };
    (rec.attend || []).forEach((a) => {
      const [ts, br] = M.visit(a, home); const d = ts.slice(0, 10);
      (visits[d] = visits[d] || new Set()).add(br);
      (per[br] = per[br] || []).push(ts);
    });
    const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
    const start = M.addDays(today0, -((today0.getDay() + 1) % 7) - 7 * 11);
    const order = [6, 0, 1, 2, 3, 4, 5];
    const fz = s && s.freezeFrom ? [s.freezeFrom, s.freezeTo] : null;
    let heat = '';
    order.forEach((dow, r) => {
      heat += `<span class="heat__day">${DAYS[dow]}</span>`;
      for (let w = 0; w < 12; w++) {
        const d = M.addDays(start, w * 7 + r), k = M.iso(d);
        const cls = ['heat__c'];
        if (d > today0) cls.push('is-future');
        else if (visits[k]) cls.push(visits[k].size > 1 ? 'both' : [...visits[k]][0]);
        else if (fz && k >= fz[0] && k <= fz[1]) cls.push('is-frozen');
        if (k === M.iso(today0)) cls.push('is-today');
        const where = visits[k] ? ' — ' + [...visits[k]].map((x) => B[x] ? B[x].short : x).join(' + ') : '';
        heat += `<i class="${cls.join(' ')}" title="${fmtDate(k, false)}${where}"></i>`;
      }
    });
    $('[data-d-heat]').innerHTML = heat;
    const keys = Object.keys(visits).sort();
    const monthKey = M.iso(today0).slice(0, 7);
    const thisMonth = keys.filter((k) => k.startsWith(monthKey)).length;
    const inWindow = keys.filter((k) => k >= M.iso(start)).length;
    const ago = keys.length ? M.dayDiff(today0, keys[keys.length - 1]) : null;
    const agoTxt = ago == null ? '—' : ago === 0 ? 'النهارده' : ago === 1 ? 'امبارح' : ago === 2 ? 'من يومين' : `من ${ago} ${word(ago, 'يوم', 'يومين', 'أيام')}`;
    $('[data-d-stats]').innerHTML =
      `<div class="stat"><b>${thisMonth}</b><span>زيارة الشهر ده</span></div>` +
      `<div class="stat"><b>${(inWindow / 12).toFixed(1)}</b><span>متوسط في الأسبوع</span></div>` +
      `<div class="stat"><b class="stat__ar">${agoTxt}</b><span>آخر زيارة</span></div>`;

    /* الفرعين: الدخول + الحضور + مواعيد فترته النهارده */
    const g = rec.gender === 'f' ? 'women' : 'men';
    const mins = now.getHours() * 60 + now.getMinutes();
    const winFrom = M.iso(start);
    $('[data-d-access]').textContent = v.access.length > 1 ? 'VIP — you can enter both' : `Home — ${B[home].latin}`;
    $('[data-d-brs]').innerHTML = D.branches.map((b) => {
      const can = v.access.includes(b.id);
      const list = (per[b.id] || []).filter((t) => t.slice(0, 10) >= winFrom);
      const last = (per[b.id] || []).slice().sort().pop();
      const segs = (segsOf(b.id)[String(now.getDay())] || []).filter((x) => x.g === g);
      const nowIn = segs.some((x) => mins >= x.from && mins < x.to);
      return `
        <div class="br-row br-row--${b.id}${can ? '' : ' is-off'}">
          <div class="br-row__head"><span class="br-row__n lat">${b.n}</span><div><b>${b.name}</b><span>${b.area}</span></div>
            <span class="br-row__acc">${can ? (b.id === home ? 'فرعك' : 'مفتوحلك بالـVIP') : 'مش ضمن اشتراكك'}</span></div>
          <div class="br-row__stats"><div><b class="lat">${list.length}</b><span>زيارة · 12 أسبوع</span></div><div><b>${last ? fmtDate(last.slice(0, 10), false) : '—'}</b><span>آخر مرة هنا</span></div></div>
          <ul class="hours">${segs.map((x) => `<li class="${mins >= x.from && mins < x.to ? 'is-now' : ''}"><span>${G[x.g]} النهارده</span><span>${H.clockFromMins(x.from)} — ${H.clockFromMins(x.to)}${x.to > 1440 ? ' (الفجر)' : ''}</span></li>`).join('') || '<li><span>مفيش فترة ليك النهارده</span></li>'}</ul>
          ${can && nowIn ? '<p class="br-row__open">مفتوحلك دلوقتي.</p>' : ''}
          ${!can && b.id === 'b1' ? `<a class="link-line lime br-row__up" href="${wa(`أهلًا، أنا ${rec.name} — رقم عضويتي ${rec.code}. عايز أعرف عن اشتراك VIP عشان أدخل الفرعين.`, 'b2')}" target="_blank" rel="noopener">عايز تدخل الفرعين؟ اسأل عن VIP</a>` : ''}
        </div>`;
    }).join('');

    /* السجل */
    $('[data-d-hist]').innerHTML = (rec.history || []).map((h) => {
      const due = (h.price || 0) - (h.paid || 0);
      return `<li><b>${h.plan}${h.vip && !/vip/i.test(h.plan) ? ' <span class="vipb">VIP</span>' : ''}</b><span class="when">${brTag(h.branch || home)} ${fmtDate(h.startAt, false)} — ${fmtDate(h.endAt)}</span><span class="amt">${money(h.price)}<small>ج</small>${due > 0 ? `<span class="due">فاضل ${money(due)} ج</span>` : ''}</span></li>`;
    }).join('') || '<li><span class="when">لسه مفيش اشتراكات قبل كده.</span></li>';

    /* التجديد */
    const renew = $('[data-d-renew]');
    $('[data-d-renew-l]').textContent = { expired: 'جدّد اشتراكك دلوقتي', used: 'جدّد اشتراكك دلوقتي', frozen: 'عايز تفك التجميد؟', none: 'اشترك دلوقتي' }[v.status] || 'جدّد اشتراكك';
    const brName = B[(s && s.branch) || home].name;
    renew.href = wa(`أهلًا، أنا ${rec.name} — رقم عضويتي ${rec.code} (${brName}). ${v.status === 'frozen' ? 'عايز أفك التجميد.' : `عايز أجدّد${s ? ' باقة ' + s.plan : ''}.`}`, (s && s.branch) || home);
    $('[data-d-updated]').textContent = rec.demo ? 'Demo data — بيانات تجريبية' : `Updated ${new Date(rec.at).toLocaleDateString('en-GB')}`;

    /* إظهار */
    gate.hidden = true; dash.hidden = false; logoutBtn.hidden = false;
    window.scrollTo(0, 0);
    const fg = $('[data-d-ringfg]'), bar = $('[data-d-daysbar]');
    const target = total ? 1 - left / total : 1;
    if (!anim) { fg.setAttribute('stroke-dashoffset', String(target)); $('[data-d-left]').textContent = left; bar.style.setProperty('--p', dayP); return; }
    gsap.fromTo('.dash__head > *', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 });
    gsap.fromTo('.alert', { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.9, stagger: 0.08, delay: 0.15 });
    gsap.fromTo('.tile', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07, delay: 0.2 });
    const o = { p: 1, n: 0 };
    gsap.to(o, { p: target, n: left, duration: 1.8, delay: 0.5, ease: 'power3.inOut', onUpdate: () => { fg.setAttribute('stroke-dashoffset', o.p.toFixed(4)); $('[data-d-left]').textContent = Math.round(o.n); } });
    gsap.fromTo(bar, { '--p': 0 }, { '--p': dayP, duration: 1.6, delay: 0.7, ease: 'power3.inOut' });
    gsap.fromTo('.heat__c', { scale: 0 }, { scale: 1, duration: 0.5, delay: 0.6, stagger: { each: 0.004, from: 'end' }, ease: 'back.out(2)' });
  }

  // الخروج بيعيد تحميل الصفحة عشان مفيش أي بيانات للعضو تفضل في الصفحة
  logoutBtn.addEventListener('click', () => { SS.del('cz-who'); location.replace(location.pathname); });

  /* ---------- رجوع تلقائي في نفس الجلسة ---------- */
  const who = SS.get('cz-who');
  if (who) {
    try { const [c, p] = JSON.parse(who); find(c, p).then((r) => { if (r) show(r); else SS.del('cz-who'); }); } catch (e) { SS.del('cz-who'); }
  }

  /* ---------- دخول الصفحة ---------- */
  if (anim && !who) {
    gsap.fromTo('.gate__media', { '--gc': 1 }, { '--gc': 0, duration: 1.4, ease: 'power3.inOut' });
    gsap.fromTo('.gate__media img', { scale: 1.25 }, { scale: 1, duration: 2.2 });
    gsap.fromTo('[data-in]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, delay: 0.3 });
    gsap.fromTo('[data-demo]', { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.9 });
  }
})();
