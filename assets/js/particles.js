/* ==========================================================================
   CEZAR — particles.js
   الشعار بيتجمّع من آلاف النقط لما القسم يظهر، والماوس/الصباع بيفرّقها.
   فكرة «Particle reveal» من Canvas UI (تريك 15) — مكتوبة من الصفر، Canvas 2D، من غير مكتبات.
   ========================================================================== */
window.CZParticles = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#A8DC42', '#F3F1EB'];
  const tilt = { x: 0, y: 0 }; // ميل الموبايل (-1..1) — كل نقطة بتتحرك بعمق مختلف

  function init(canvas, src) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement;
    let W = 0, H = 0, pts = [], running = false, visible = false;
    let formStart = 0, formed = reduce ? 1 : 0;
    const mouse = { x: -1e4, y: -1e4 };
    const img = new Image();
    img.decoding = 'async';
    img.src = src;

    function layout() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H || !img.naturalWidth) return;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ew = Math.min(W * (W < 700 ? 0.86 : 0.6), 620);
      const eh = ew * img.naturalHeight / img.naturalWidth;
      const ox = (W - ew) / 2, oy = Math.max(70, H * 0.36 - eh / 2);
      const gap = W < 700 ? 4 : 5;
      const oc = document.createElement('canvas');
      oc.width = Math.round(ew); oc.height = Math.round(eh);
      const o = oc.getContext('2d');
      o.drawImage(img, 0, 0, oc.width, oc.height);
      const d = o.getImageData(0, 0, oc.width, oc.height).data;
      const next = [];
      for (let y = 0; y < oc.height; y += gap) {
        for (let x = 0; x < oc.width; x += gap) {
          const i = (y * oc.width + x) * 4;
          if (d[i + 3] > 150) next.push({ tx: ox + x, ty: oy + y, c: d[i + 1] > d[i] + 30 ? 0 : 1 });
        }
      }
      pts = next.map((n, k) => {
        const p = pts[k] || {
          x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0,
          sx: Math.random() * W, sy: H * 0.2 + Math.random() * H * 0.8, d: Math.random(), w: Math.random() * 6.28,
        };
        return Object.assign(p, n);
      });
      if (!running) draw(performance.now(), true);
    }

    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function draw(now, still) {
      ctx.clearRect(0, 0, W, H);
      if (formStart && formed < 1) formed = Math.min(1, (now - formStart) / 2600);
      const size = W < 700 ? 1.8 : 2.2;
      const R = W < 700 ? 70 : 110, R2 = R * R;
      for (let c = 0; c < 2; c++) {
        ctx.fillStyle = COLORS[c];
        for (let k = 0; k < pts.length; k++) {
          const p = pts[k];
          if (p.c !== c) continue;
          const local = ease(Math.max(0, Math.min(1, formed * 1.55 - p.d * 0.55)));
          let hx = p.sx + (p.tx - p.sx) * local;
          let hy = p.sy + (p.ty - p.sy) * local;
          if (!still) {
            hx += tilt.x * 16 * (0.4 + p.d); hy += tilt.y * 16 * (0.4 + p.d);
            hx += Math.sin(now * 0.0011 + p.w) * 0.7;
            hy += Math.cos(now * 0.0013 + p.w) * 0.7;
            const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const dist = Math.sqrt(d2) || 1, f = (1 - dist / R) * 5.5;
              p.vx += (dx / dist) * f; p.vy += (dy / dist) * f;
            }
            p.vx = (p.vx + (hx - p.x) * 0.055) * 0.84;
            p.vy = (p.vy + (hy - p.y) * 0.055) * 0.84;
            p.x += p.vx; p.y += p.vy;
          } else { p.x = hx; p.y = hy; }
          ctx.globalAlpha = 0.35 + local * 0.6;
          ctx.fillRect(p.x, p.y, size, size);
        }
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      if (!running) return;
      draw(now, false);
      requestAnimationFrame(loop);
    }
    const start = () => { if (running || reduce) return; running = true; requestAnimationFrame(loop); };
    const stop = () => { running = false; };

    img.onload = () => {
      layout();
      if (reduce) { formed = 1; draw(0, true); return; }
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) { if (!formStart) formStart = performance.now(); start(); } else stop();
      }, { threshold: 0.2 });
      io.observe(host);
    };
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
    const setM = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    host.addEventListener('pointermove', setM, { passive: true });
    host.addEventListener('pointerdown', setM, { passive: true });
    host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  }
  const setTilt = (x, y) => { tilt.x = x; tilt.y = y; };
  return { init, tilt: setTilt };
})();
