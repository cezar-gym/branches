/* ==========================================================================
   CEZAR — portal-model.js
   1) fromSystem(): بيحوّل نسخة احتياطية من «نظام إدارة سيزر» لسجل لكل عضو — بتاريخه في الفرعين.
   2) demo():       أعضاء تجريبيين بتواريخ نسبية للنهارده.
   3) view():       الحالة اللحظية + أرقام كل فرع.
   الفروع في السجل بمفاتيح ثابتة: b1 = الفرع الأول (الرئيسي) · b2 = الفرع الجديد.
   VIP = اشتراك في الفرع الجديد بيفتح الفرع الأول كمان (اسم الباقة فيه VIP أو plan.vip = true).
   ========================================================================== */
(function (g) {
  'use strict';
  const DAY = 86400000;
  const iso = (d) => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const day0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const dayDiff = (a, b) => Math.round((day0(a) - day0(b)) / DAY);
  const isVip = (name, plan) => !!((plan && (plan.vip || (plan.access && plan.access.length > 1))) || /vip/i.test(name || ''));

  /* رقم الموبايل المصري بأي شكل → 01xxxxxxxxx */
  function phone(v) {
    let d = String(v == null ? '' : v).replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[^\d]/g, '');
    if (d.startsWith('0020')) d = d.slice(4);
    else if (d.startsWith('20') && d.length === 12) d = d.slice(2);
    if (d.length === 10 && d[0] === '1') d = '0' + d;
    return d;
  }

  /* ---------- 1 · من نسخة النظام ---------- */
  function fromSystem(db, opts) {
    opts = opts || {};
    const now = opts.now || new Date();
    const keepFrom = iso(addDays(now, -(opts.days || 140)));
    const bkey = {}; let n = 2;
    (db.branches || []).forEach((b) => { bkey[b.id] = b.isMain ? 'b1' : 'b' + n++; });
    const plans = {}; (db.plans || []).forEach((p) => { plans[p.id] = p; });
    const staff = {}; (db.staff || []).forEach((s) => { staff[s.id] = s.name; });
    const subsBy = {}; (db.subs || []).forEach((s) => { (subsBy[s.memberId] = subsBy[s.memberId] || []).push(s); });
    const attBy = {}; (db.attend || []).forEach((a) => { if (a.inAt >= keepFrom) (attBy[a.memberId] = attBy[a.memberId] || []).push([a.inAt.slice(0, 16), bkey[a.branchId] || 'b1']); });
    const out = [], skipped = [];
    (db.members || []).forEach((m) => {
      const ph = phone(m.phone);
      if (!m.code || ph.length !== 11) { skipped.push(m.code || m.id); return; }
      const subs = (subsBy[m.id] || []).slice().sort((a, b) => (a.startAt < b.startAt ? -1 : 1));
      const cur = subs.filter((s) => s.status === 'active' || s.status === 'frozen').pop() || subs[subs.length - 1] || null;
      const pl = cur && plans[cur.planId];
      out.push({
        code: String(m.code), pin: ph,
        rec: {
          v: 2, code: String(m.code), name: m.name, gender: m.gender === 'f' ? 'f' : 'm',
          home: bkey[m.branchId] || 'b1', joinedAt: m.joinedAt || '', lockerNo: m.lockerNo || '',
          blocked: m.status === 'blocked',
          sub: cur ? {
            plan: cur.planName, type: pl ? pl.type : '', branch: bkey[cur.branchId] || bkey[m.branchId] || 'b1',
            vip: isVip(cur.planName, pl), startAt: cur.startAt, endAt: cur.endAt, months: cur.months || 1,
            sessionsTotal: cur.sessionsTotal || null, sessionsUsed: cur.sessionsUsed || 0,
            price: cur.price || 0, listPrice: cur.listPrice || cur.price || 0, discount: cur.discount || 0, paid: cur.paid || 0,
            coach: cur.coachId ? (staff[cur.coachId] || '') : '',
            status: cur.status, freezeFrom: cur.freezeFrom || '', freezeTo: cur.freezeTo || '',
            freezes: (cur.freezes || []).map((f) => ({ from: f.from, to: f.to, days: f.days, reason: f.reason || '' })),
          } : null,
          history: subs.slice(-8).reverse().map((s) => ({ plan: s.planName, branch: bkey[s.branchId] || 'b1', vip: isVip(s.planName, plans[s.planId]), startAt: s.startAt, endAt: s.endAt, price: s.price || 0, paid: s.paid || 0 })),
          attend: (attBy[m.id] || []).sort((a, b) => (a[0] < b[0] ? -1 : 1)),
          at: now.toISOString(),
        },
      });
    });
    return { members: out, skipped };
  }

  /* ---------- 2 · أعضاء تجريبيين ---------- */
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function demo(now) {
    now = now || new Date();
    const T = (n) => iso(addDays(now, n));
    const mk = (code, ph, name, gender, home, plan, total, start, end, o) => {
      const r = rng(+code);
      const attend = [];
      const from = o.attFrom != null ? o.attFrom : start, to = o.attTo != null ? o.attTo : 0;
      let used = 0;
      for (let d = Math.max(-120, from); d <= to; d++) {
        if (o.freeze && d >= o.freeze[0] && d <= o.freeze[1]) continue;
        const dt = addDays(now, d);
        if (r() < (o.rate || 0.6) * (dt.getDay() === 5 ? 0.4 : 1)) {
          if (d === 0 && now.getHours() < 19) continue;
          const h = gender === 'f' ? 17 + Math.floor(r() * 4) : (r() < 0.6 ? 19 + Math.floor(r() * 4) : 8 + Math.floor(r() * 3));
          const b = typeof o.where === 'function' ? o.where(d, r) : home;
          attend.push([iso(dt) + 'T' + String(h).padStart(2, '0') + ':' + String(Math.floor(r() * 60)).padStart(2, '0'), b]);
          if (d >= start) used++;
        }
      }
      const sub = {
        plan, type: o.type || 'monthly', branch: home, vip: !!o.vip, startAt: T(start), endAt: T(end), months: 1,
        sessionsTotal: total, sessionsUsed: Math.min(total, o.used != null ? o.used : used),
        price: o.price, listPrice: o.price, discount: 0, paid: o.paid != null ? o.paid : o.price,
        coach: o.coach || '', status: o.freeze ? 'frozen' : (end < 0 ? 'expired' : 'active'),
        freezeFrom: o.freeze ? T(o.freeze[0]) : '', freezeTo: o.freeze ? T(o.freeze[1]) : '',
        freezes: o.freeze ? [{ from: T(o.freeze[0]), to: T(o.freeze[1]), days: o.freeze[1] - o.freeze[0] + 1, reason: 'سفر' }] : [],
      };
      const history = [{ plan, branch: home, vip: !!o.vip, startAt: sub.startAt, endAt: sub.endAt, price: sub.price, paid: sub.paid }].concat(o.history || []);
      return { code, pin: ph, rec: { v: 2, code, name, gender, home, joinedAt: T(o.joined || -200), lockerNo: o.locker || '', blocked: false, sub, history, attend, at: now.toISOString(), demo: true } };
    };
    return [
      mk('2041', '01012345678', 'أحمد سامي', 'm', 'b2', 'VIP 30 حصة', 30, -12, 18, {
        vip: true, price: 1200, used: 19, rate: 0.75, coach: 'كابتن عبدالله ياسر', locker: '17', attFrom: -84,
        where: (d, r) => (d < -40 ? 'b1' : r() < 0.3 ? 'b1' : 'b2'),
        history: [{ plan: 'VIP 16 حصة', branch: 'b2', vip: true, startAt: T(-42), endAt: T(-12), price: 1000, paid: 1000 }, { plan: 'جولد', branch: 'b1', startAt: T(-72), endAt: T(-42), price: 850, paid: 850 }],
      }),
      mk('1031', '01123456789', 'منة خالد', 'f', 'b1', 'سيلفر', 16, -26, 4, { price: 700, used: 14, rate: 0.55, attFrom: -70,
        history: [{ plan: 'سيلفر', branch: 'b1', startAt: T(-56), endAt: T(-26), price: 700, paid: 700 }] }),
      mk('2057', '01234567890', 'يوسف عادل', 'm', 'b2', 'بلاتينيوم', 20, -14, 23, { price: 900, used: 6, rate: 0.6, freeze: [-3, 9], attFrom: -60,
        history: [{ plan: 'برونز', branch: 'b2', startAt: T(-44), endAt: T(-14), price: 800, paid: 800 }] }),
      mk('1102', '01555123456', 'مصطفى حسن', 'm', 'b1', 'برونز', 12, -36, -6, { price: 650, paid: 450, used: 9, rate: 0.35, attFrom: -84, attTo: -8 }),
    ];
  }

  /* ---------- 3 · الحالة اللحظية ---------- */
  function view(rec, now) {
    now = now || new Date();
    const s = rec.sub;
    const v = { status: 'none', left: null, total: null, daysLeft: null, daysTotal: null, due: 0, frozenNow: false, alerts: [], access: [rec.home || 'b1'] };
    if (s && s.vip) v.access = ['b1', 'b2'];
    if (!s) return v;
    v.total = s.sessionsTotal;
    v.left = s.sessionsTotal == null ? null : Math.max(0, s.sessionsTotal - (s.sessionsUsed || 0));
    v.daysTotal = Math.max(1, dayDiff(s.endAt, s.startAt));
    v.daysLeft = dayDiff(s.endAt, now);
    v.due = Math.max(0, (s.price || 0) - (s.paid || 0));
    v.frozenNow = !!(s.freezeFrom && s.freezeTo && iso(now) >= s.freezeFrom && iso(now) <= s.freezeTo);
    if (rec.blocked) v.status = 'blocked';
    else if (v.frozenNow) v.status = 'frozen';
    else if (v.daysLeft < 0 || s.status === 'expired') v.status = 'expired';
    else if (v.left === 0) v.status = 'used';
    else v.status = 'active';
    if (v.status === 'active') {
      if (v.left != null && v.left <= 3) v.alerts.push({ k: 'low', t: v.left === 1 ? 'فاضلك جلسة واحدة.' : v.left === 2 ? 'فاضلك جلستين بس.' : `فاضلك ${v.left} جلسات بس.`, d: 'جدّد دلوقتي عشان متقفش في النص.' });
      if (v.daysLeft <= 5) v.alerts.push({ k: 'soon', t: v.daysLeft === 0 ? 'اشتراكك بيخلص النهارده.' : `اشتراكك بيخلص بعد ${v.daysLeft} ${v.daysLeft <= 10 && v.daysLeft >= 3 ? 'أيام' : 'يوم'}.`, d: 'الجلسات اللي مش هتلحقها بتروح مع آخر يوم.' });
    }
    if (v.due > 0) v.alerts.push({ k: 'due', t: `فاضل ${v.due.toLocaleString('en-US')} ج من قيمة الاشتراك.`, d: 'تقدر تسدّدها في الاستقبال.' });
    return v;
  }

  /* الحضور: [تاريخ, فرع] — السجلات القديمة كانت تاريخ بس */
  const visit = (a, home) => (Array.isArray(a) ? a : [a, home || 'b1']);

  g.CZModel = { fromSystem, demo, view, visit, phone, iso, addDays, dayDiff };
})(typeof window !== 'undefined' ? window : globalThis);
