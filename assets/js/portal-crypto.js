/* ==========================================================================
   CEZAR — portal-crypto.js
   تشفير بيانات الأعضاء عشان الموقع يفضل static (GitHub Pages) من غير سيرفر:
   • كل عضو ليه سجل متشفّر لوحده بـ AES-GCM 256.
   • المفتاح = PBKDF2-SHA256 (رقم العضوية + آخر 4 أرقام من الموبايل).
   • اسم السجل = SHA-256 لرقم العضوية + salt — فالملف مفيهوش ولا اسم ولا رقم مكشوف.
   يعني محدش يقدر يقرا اشتراك حد من غير الرقمين مع بعض.
   شغّال في المتصفح وفي Node 18+ (نفس الكود للتصدير وللدخول).
   ========================================================================== */
(function (g) {
  'use strict';
  const subtle = g.crypto && g.crypto.subtle;
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const b64 = (u8) => {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  const clean = (v) => String(v == null ? '' : v).replace(/[^\d]/g, '');

  async function idOf(salt, code) {
    return hex(await subtle.digest('SHA-256', enc.encode(salt + '|' + clean(code)))).slice(0, 24);
  }
  async function keyOf(salt, code, pin, iter) {
    const base = await subtle.importKey('raw', enc.encode(clean(code) + '|' + clean(pin)), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt + '|' + clean(code)), iterations: iter },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }
  async function seal(obj, salt, code, pin, iter) {
    const key = await keyOf(salt, code, pin, iter);
    const iv = g.crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))));
    const out = new Uint8Array(iv.length + ct.length);
    out.set(iv); out.set(ct, iv.length);
    return b64(out);
  }
  async function open(blob, salt, code, pin, iter) {
    const raw = unb64(blob);
    const key = await keyOf(salt, code, pin, iter);
    const pt = await subtle.decrypt({ name: 'AES-GCM', iv: raw.subarray(0, 12) }, key, raw.subarray(12));
    return JSON.parse(dec.decode(pt));
  }
  const newSalt = () => b64(g.crypto.getRandomValues(new Uint8Array(16)));

  g.CZCrypto = { ok: !!subtle, idOf, seal, open, newSalt, clean };
})(typeof window !== 'undefined' ? window : globalThis);
