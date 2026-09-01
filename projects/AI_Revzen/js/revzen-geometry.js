// Revzen geometri motoru (global - file:// uyumlu)
// Kaynak: docs/3dsmax_script/revzen_DK-v1.ms, revzen_TMT-v1.ms, revzen_PK-v1.ms
// Filgozu formu: docs/Filgözü_Revzen.jpg olcumlerinden turetildi.
(function (global) {
    'use strict';

    const DEG = Math.PI / 180;
    const ARC_SAMPLES = 72;

    // --- Kemer sabitleri (MaxScript dosyalarindan birebir turetildi) -------
    // TMT : tek merkezli teget kemer -> r = En/2, yay 0-60 ve 120-180 +
    //       tepe noktasina teget dogrular.
    //       yukselik = (En/2) / cos(30) = En * 0.5773503
    const TMT_RISE = 1 / (2 * Math.cos(30 * DEG));

    // PK  : penci kemer -> iki merkezli, merkez ofseti En/10, r = 0.6*En
    //       yukselik = sqrt(r^2 - d^2) = En * 0.5916080
    const PK_R = 0.6;
    const PK_D = 0.1;
    const PK_RISE = Math.sqrt(PK_R * PK_R - PK_D * PK_D);
    const PK_ANG = Math.acos(PK_D / PK_R) / DEG;   // 80.40593 derece

    const TYPE_LABELS = {
        duz:      'Düz (Dikdörtgen)',
        dk:       'Tam Kemerli (DK)',
        tmt:      'T.M.T. Kemerli',
        pk:       'Penci Kemerli',
        dairesel: 'Dairesel (Oculus)'
    };

    const FORM_LABELS = { daire: 'Daire', filgozu: 'Filgözü' };

    const DIZILIMLER = {
        stagger: 'Şaşırtmalı',
        tight:   'Şaşırtmalı (sık)',
        grid:    'Düz'
    };

    // Filgozu referans orani. Olculu CAD kurgusu (docs/Filgözü_Revzen.jpg ve
    // 2026-09-01 tarihli olcu ekran goruntusu): r = En/2 dairesi + teget
    // dogrular, teget noktasi tam 45 derecede ve teget parcasi = r.
    // sin(t0) = En/Boy oldugundan t0 = 45 -> Boy/En = 1/sin45 = sqrt(2).
    // Onceki 1.43 kaba piksel okumasiydi (70x100 px), %1.1 fazlaydi.
    const FILGOZU_ORAN = Math.SQRT2;   // 1.4142135...

    const CAM_PALET = ['#c8452f', '#2f6fb0', '#3f8f5a', '#d9a334', '#7b4fa0', '#cfc9b8'];

    const MAX_ADAY = 60000;    // izgara aday ust siniri
    const MAX_GOZ  = 1500;     // uretilecek goz ust siniri
    const MIN_PARCA = 0.04;    // kesik parcanin tam gozun en az bu kadari olmasi gerekir
    // Kenar boslugu 0 verilse bile desen ile kontur arasinda sac teli bir bant
    // birakilir. Sifir kalinlikta temas eden bir goz artik "delik" degil kontura
    // acilan bir centiktir; hem extrude ucgenlemesini hem CAD boolean'ini bozar.
    const MIN_KENAR = 0.015;   // goz eninin orani

    // --- yardimcilar -------------------------------------------------------

    function sampleArc(cx, cy, r, fromDeg, toDeg, samples) {
        const out = [];
        const a0 = fromDeg * DEG;
        const a1 = toDeg * DEG;
        const n = samples || ARC_SAMPLES;
        for (let i = 0; i <= n; i++) {
            const a = a0 + (a1 - a0) * (i / n);
            out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
        }
        return out;
    }

    function signedArea(ring) {
        let a = 0;
        for (let i = 0, n = ring.length; i < n; i++) {
            const p = ring[i], q = ring[(i + 1) % n];
            a += p.x * q.y - q.x * p.y;
        }
        return a / 2;
    }

    function polyArea(ring) { return Math.abs(signedArea(ring)); }

    function ensureCCW(ring) {
        return signedArea(ring) < 0 ? ring.slice().reverse() : ring;
    }

    function bboxOfRing(ring) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of ring) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }

    // Kapali poligonu disa dogru miter ofsetler (MaxScript applyOffset karsiligi)
    function offsetClosed(ring, d) {
        const n = ring.length;
        if (n < 3 || d === 0) return ring.slice();

        const nrm = new Array(n);
        for (let i = 0; i < n; i++) {
            const p = ring[i], q = ring[(i + 1) % n];
            const dx = q.x - p.x, dy = q.y - p.y;
            const L = Math.hypot(dx, dy) || 1;
            nrm[i] = { x: dy / L, y: -dx / L };   // CCW halkada disa bakan normal
        }

        const out = new Array(n);
        for (let i = 0; i < n; i++) {
            const n1 = nrm[(i - 1 + n) % n];
            const n2 = nrm[i];
            let mx = n1.x + n2.x, my = n1.y + n2.y;
            const L = Math.hypot(mx, my);
            if (L < 1e-9) {
                out[i] = { x: ring[i].x + d * n2.x, y: ring[i].y + d * n2.y };
                continue;
            }
            mx /= L; my /= L;
            let cosH = mx * n1.x + my * n1.y;
            if (cosH < 0.15) cosH = 0.15;         // sivri kose patlamasini engelle
            const len = d / cosH;
            out[i] = { x: ring[i].x + len * mx, y: ring[i].y + len * my };
        }
        return out;
    }

    function pointInRing(px, py, ring) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i].x, yi = ring[i].y;
            const xj = ring[j].x, yj = ring[j].y;
            if (((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    function distToSegment(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay;
        const L2 = dx * dx + dy * dy;
        let t = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
        if (t < 0) t = 0; else if (t > 1) t = 1;
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }

    function distToRing(px, py, ring) {
        let best = Infinity;
        for (let i = 0, n = ring.length; i < n; i++) {
            const p = ring[i], q = ring[(i + 1) % n];
            const d = distToSegment(px, py, p.x, p.y, q.x, q.y);
            if (d < best) best = d;
        }
        return best;
    }

    function circlePoly(cx, cy, r, segments) {
        const n = segments || 32;
        const out = [];
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
        }
        return out;
    }

    // Filgozu: tek merkezli yay + uclara teget dogrular.
    // Yani T.M.T. kemer kurgusunun ust/alt aynalanmis hali.
    //   a = W/2 (yaricap), b = H/2 (yari yukseklik), sin(t0) = a/b
    // Referans cizimde H/W = sqrt(2) -> t0 = 45 derece (tam deger, yuvarlama yok).
    function filgozuPoly(cx, cy, W, H, quarter) {
        const a = W / 2;
        const b = Math.max(H / 2, a * 1.0005);
        const t0 = Math.asin(Math.min(1, a / b));
        const q = Math.max(3, quarter || 10);
        const pts = [];
        const arc = function (t) {
            pts.push({ x: cx + a * Math.cos(t), y: cy + a * Math.sin(t) });
        };

        for (let i = 0; i <= q; i++) arc(t0 * (i / q));                 // (a,0) -> ust sag gecis
        pts.push({ x: cx, y: cy + b });                                 // ust uc
        for (let i = 0; i <= 2 * q; i++) {                              // ust sol -> alt sol gecis
            arc(Math.PI - t0 + 2 * t0 * (i / (2 * q)));
        }
        pts.push({ x: cx, y: cy - b });                                 // alt uc
        for (let i = 0; i < q; i++) arc(-t0 + t0 * (i / q));            // alt sag -> baslangic (haric)
        return pts;
    }

    function translatePoly(poly, dx, dy) {
        const out = new Array(poly.length);
        for (let i = 0; i < poly.length; i++) {
            out[i] = { x: poly[i].x + dx, y: poly[i].y + dy };
        }
        return out;
    }

    function boundCircle(P) {
        let cx = 0, cy = 0;
        for (const q of P) { cx += q.x; cy += q.y; }
        cx /= P.length; cy /= P.length;
        let r = 0;
        for (const q of P) r = Math.max(r, Math.hypot(q.x - cx, q.y - cy));
        return { x: cx, y: cy, r: r };
    }

    // Iki konveks poligon arasindaki en kucuk mesafe.
    // Sinir dairesi budamasi ile karsilikli olmayan koseler atlanir.
    function polyMinDist(A, B) {
        const bcA = boundCircle(A), bcB = boundCircle(B);
        let best = Infinity;

        for (let i = 0; i < A.length; i++) {
            const p = A[i];
            if (Math.hypot(p.x - bcB.x, p.y - bcB.y) - bcB.r >= best) continue;
            for (let j = 0, m = B.length; j < m; j++) {
                const q = B[j], r = B[(j + 1) % m];
                const d = distToSegment(p.x, p.y, q.x, q.y, r.x, r.y);
                if (d < best) best = d;
            }
        }
        for (let i = 0; i < B.length; i++) {
            const p = B[i];
            if (Math.hypot(p.x - bcA.x, p.y - bcA.y) - bcA.r >= best) continue;
            for (let j = 0, m = A.length; j < m; j++) {
                const q = A[j], r = A[(j + 1) % m];
                const d = distToSegment(p.x, p.y, q.x, q.y, r.x, r.y);
                if (d < best) best = d;
            }
        }
        return best;
    }

    // --- konveks bolgeye kirpma (Sutherland-Hodgman) ----------------------
    // Pencere bosluk konturu her tipte konveks oldugu icin, kenar boslugu
    // kadar iceri otelenmis yari-duzlemlerin kesisimi bolgeyi tam verir.

    function insetPlanes(ring, inset) {
        const planes = [];
        for (let i = 0, n = ring.length; i < n; i++) {
            const p = ring[i], q = ring[(i + 1) % n];
            const dx = q.x - p.x, dy = q.y - p.y;
            const L = Math.hypot(dx, dy);
            if (L < 1e-12) continue;
            const nx = dy / L, ny = -dx / L;      // CCW halkada disa bakan normal
            planes.push({ nx: nx, ny: ny, c: nx * p.x + ny * p.y - inset });
        }
        return planes;
    }

    // Sutherland-Hodgman, bir kose kirpma duzlemi uzerine tam denk geldiginde
    // ayni noktayi iki kez uretir (sifir uzunluklu kenar). Bu da extrude
    // sirasinda bozuk ucgen ve acik kenara yol acar. Ardisik (ve bas-son)
    // tekrarlari ile sifir alanli koseleri temizler.
    function cleanPoly(poly, eps) {
        const n = poly.length;
        if (n < 3) return poly;

        const out = [];
        for (let i = 0; i < n; i++) {
            const p = poly[i];
            if (out.length) {
                const q = out[out.length - 1];
                if (Math.abs(p.x - q.x) <= eps && Math.abs(p.y - q.y) <= eps) continue;
            }
            out.push(p);
        }
        while (out.length > 1) {
            const a = out[0], b = out[out.length - 1];
            if (Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps) out.pop();
            else break;
        }
        if (out.length < 3) return out;

        const res = [];
        const m = out.length;
        for (let i = 0; i < m; i++) {
            const a = out[(i - 1 + m) % m], b = out[i], c = out[(i + 1) % m];
            const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
            if (Math.abs(cross) <= eps * eps) continue;
            res.push(b);
        }
        return res.length >= 3 ? res : out;
    }

    function clipToPlane(poly, pl) {
        const out = [];
        const n = poly.length;
        for (let i = 0; i < n; i++) {
            const A = poly[i], B = poly[(i + 1) % n];
            const da = pl.nx * A.x + pl.ny * A.y - pl.c;
            const db = pl.nx * B.x + pl.ny * B.y - pl.c;
            const ain = da <= 0, bin = db <= 0;
            if (ain) out.push(A);
            if (ain !== bin) {
                const t = da / (da - db);
                out.push({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t });
            }
        }
        return out;
    }

    // Bir gozu bolgeye yerlestirir. kes=false ise yalnizca tam sigan gozler
    // kabul edilir; kes=true ise sinira denk gelen gozler kirpilir.
    // jit: yalnizca FIILEN kirpilan gozlere uygulanan simgesel tedirginlik.
    // Tam sigan gozlerin yerlesimi bundan etkilenmez; boylece "Kenarlarda kes"
    // secenegini acip kapatmak tam gozlerin yerini degistirmez.
    function fitUnit(unit, cx, cy, bound, planes, kes, minAlan, eps, jit) {
        const yakin = [];
        for (let i = 0; i < planes.length; i++) {
            const pl = planes[i];
            const d = pl.nx * cx + pl.ny * cy - pl.c;
            if (d >= bound) return null;          // sinir dairesi tamamen disarida
            if (d > -bound) yakin.push(pl);
        }

        const p = translatePoly(unit, cx, cy);
        if (yakin.length === 0) return { poly: p, tam: true };

        let tasan = false;
        for (let i = 0; i < yakin.length && !tasan; i++) {
            const pl = yakin[i];
            for (let k = 0; k < p.length; k++) {
                if (pl.nx * p[k].x + pl.ny * p[k].y - pl.c > 1e-9) { tasan = true; break; }
            }
        }
        if (!tasan) return { poly: p, tam: true };
        if (!kes) return null;

        let cur = p;
        for (let i = 0; i < yakin.length; i++) {
            const pl0 = yakin[i];
            const pl = jit ? { nx: pl0.nx, ny: pl0.ny, c: pl0.c - jit } : pl0;
            cur = clipToPlane(cur, pl);
            if (cur.length < 3) return null;
        }
        cur = cleanPoly(cur, eps);
        if (cur.length < 3) return null;
        if (polyArea(cur) < minAlan) return null;
        return { poly: cur, tam: false };
    }

    // --- kemer profilleri --------------------------------------------------

    function archRise(type, en) {
        switch (type) {
            case 'dk':  return en / 2;
            case 'tmt': return en * TMT_RISE;
            case 'pk':  return en * PK_RISE;
            default:    return 0;
        }
    }

    // Pencere bosluk konturu. Orijin sol-alt (0,0), genislik en, yukseklik boy.
    function buildOpening(type, en, boy) {
        if (type === 'dairesel') {
            // elips; en == boy oldugunda tam daire (oculus)
            const rx = en / 2, ry = boy / 2;
            const cx = en / 2, cy = boy / 2;
            const pts = [];
            const n = ARC_SAMPLES * 2;
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2;
                pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
            }
            return { ring: ensureCCW(pts), rise: boy, springY: 0 };
        }

        if (type === 'duz') {
            const pts = [
                { x: 0,  y: 0   }, { x: en, y: 0   },
                { x: en, y: boy }, { x: 0,  y: boy }
            ];
            return { ring: pts, rise: 0, springY: boy };
        }

        const rise = archRise(type, en);
        const springY = boy - rise;
        if (springY < 0) {
            return {
                ring: null, rise: rise, springY: springY,
                error: 'Boy (' + boy.toFixed(1) + ') kemer yüksekliğinden (' +
                       rise.toFixed(1) + ') küçük olamaz.'
            };
        }

        const pts = [{ x: 0, y: 0 }, { x: en, y: 0 }];
        let arc;

        if (type === 'dk') {
            // Yarim daire : Arc radius:(ara/2) from:0 to:180
            arc = sampleArc(en / 2, springY, en / 2, 0, 180, ARC_SAMPLES);

        } else if (type === 'tmt') {
            // 0-60 yay + tepeye teget dogru + 120-180 yay (tek merkez)
            const r = en / 2, cx = en / 2;
            const seg = Math.max(8, Math.round(ARC_SAMPLES / 3));
            const right = sampleArc(cx, springY, r, 0, 60, seg);
            const left  = sampleArc(cx, springY, r, 120, 180, seg);
            arc = right.concat([{ x: cx, y: boy }], left);

        } else { // pk
            const r = PK_R * en, d = PK_D * en;
            const right = sampleArc(en / 2 - d, springY, r, 0, PK_ANG, ARC_SAMPLES);
            const left  = sampleArc(en / 2 + d, springY, r, 180 - PK_ANG, 180, ARC_SAMPLES);
            arc = right.concat(left.slice(1));   // tepe noktasi ortak
        }

        for (const p of arc) pts.push(p);
        return { ring: pts, rise: rise, springY: springY };
    }

    // --- goz (delik) dizilimi ---------------------------------------------

    function unitPoly(form, W, H) {
        return (form === 'filgozu')
            ? filgozuPoly(0, 0, W, H, 10)
            : circlePoly(0, 0, W / 2, 32);
    }

    // Capraz komsuyla arada 'hedef' kadar bosluk kalacak satir adimini cozer.
    // Fonksiyon duzgun ve artan; yanlis konum (Illinois) yontemi ikiye bolmeye
    // gore cok daha az degerlendirmeyle yakinsar.
    function solveRowStep(unit, pitch, hedef, lo, hi) {
        const f = function (S) {
            return polyMinDist(unit, translatePoly(unit, pitch / 2, S)) - hedef;
        };
        const fLo = f(lo);
        if (fLo >= 0) return lo;
        let a = lo, b = hi, fa = fLo, fb = f(hi);
        if (fb < 0) return hi;
        for (let i = 0; i < 20; i++) {
            if (b - a < 1e-7 * (hi - lo + 1)) break;
            const m = (fb !== fa) ? (b - fb * (b - a) / (fb - fa)) : (a + b) / 2;
            const mm = (m > a && m < b) ? m : (a + b) / 2;
            const fm = f(mm);
            if (Math.abs(fm) < 1e-6 * (hedef + 1)) return mm;
            if (fm < 0) { a = mm; fa = fm; fb /= 2; }
            else        { b = mm; fb = fm; fa /= 2; }
        }
        return b;
    }

    // Satir adimi.
    //   grid   : sıralar ust uste, aralik = H + ara
    //   stagger: capraz komsuyla arada da TAM 'ara' kalir; yani bandin kalinligi
    //            her yonde ayni olur (parametre soyledigini uretir).
    //   tight  : referans filgozu cizimindeki siki orgu (S = H - ara). Orada
    //            capraz bar yatay bardan bir miktar incedir. Guvenlik icin
    //            capraz boslugun ara/2'nin altina dusmesine ve normal adimi
    //            asmasina izin verilmez.
    let _rsCache = null;
    function rowStepFor(form, unit, W, H, pitch, ara, dizilim) {
        if (dizilim === 'grid') return H + ara;

        const key = form + '|' + W + '|' + H + '|' + pitch + '|' + ara + '|' + dizilim;
        if (_rsCache && _rsCache.key === key) return _rsCache.v;

        const altSinir = (H + ara) / 2;          // ayni sutundaki komsu (2 satir)
        let v;

        if (form !== 'filgozu') {
            const normal = pitch * Math.sqrt(3) / 2;   // altigen paket: her yonde 'ara'
            if (dizilim !== 'tight') {
                v = normal;
            } else {
                const hedef = W + ara * 0.5;
                const k = hedef * hedef - (pitch / 2) * (pitch / 2);
                const guvenli = k > 0 ? Math.sqrt(k) : altSinir;
                v = Math.min(normal, Math.max(H - ara, altSinir, guvenli));
            }
        } else {
            const normal = solveRowStep(unit, pitch, ara, altSinir, H + ara);
            if (dizilim !== 'tight') {
                v = normal;
            } else {
                const guvenli = solveRowStep(unit, pitch, ara * 0.5, altSinir, H + ara);
                v = Math.min(normal, Math.max(H - ara, altSinir, guvenli));
            }
        }

        _rsCache = { key: key, v: v };
        return v;
    }

    function packGoz(ring, o) {
        const W = o.cap;
        if (!(W > 0)) return { goz: [], kesik: 0, warn: null };

        const form = (o.form === 'filgozu') ? 'filgozu' : 'daire';
        const H = (form === 'filgozu') ? W * Math.max(1.02, o.oran || FILGOZU_ORAN) : W;
        const pitch = W + o.ara;
        if (!(pitch > 0)) return { goz: [], kesik: 0, warn: null };

        const dizilim = o.dizilim || 'stagger';
        const stagger = (dizilim !== 'grid');
        const kes = o.kes !== false;
        const unit = unitPoly(form, W, H);

        let bound = 0;
        for (const q of unit) bound = Math.max(bound, Math.hypot(q.x, q.y));

        const rowStep = rowStepFor(form, unit, W, H, pitch, o.ara, dizilim);
        if (!(rowStep > 0)) return { goz: [], kesik: 0, warn: null };

        const kenarEt = Math.max(o.kenar, W * MIN_KENAR);
        const planes = insetPlanes(ring, kenarEt);
        const bb = bboxOfRing(ring);

        // Desen kaydirma: izgaranin pencere icindeki konumunu oteler.
        // Bir adim (pitch / rowStep) kadar kaydirmak deseni ayni yere getirir;
        // anlamli aralik bu yuzden bir adimla sinirlidir. Ise yaradigi yer,
        // desenin kenarlara / kemer basligina nasil oturdugunu ayarlamaktir.
        const kayX = Number(o.kayX) || 0;
        const kayY = Number(o.kayY) || 0;

        // Sutun fazi pencere ortasina, satir fazi esige oturur; kaydirma ikisini
        // de oteler. kMin/kMax kaydirilmis tabana gore hesaplandigi icin izgara
        // menzili kendiliginden dogru kalir.
        const xBase = (bb.minX + bb.maxX) / 2 + kayX;
        const yBase = bb.minY + kenarEt + H / 2 + kayY;
        const pay = kes ? H : 0;
        const kMin = Math.floor((bb.minY - pay - yBase) / rowStep);
        const kMax = Math.ceil((bb.maxY + pay - yBase) / rowStep);
        const jMax = Math.ceil(bb.width / pitch) + 2 +
                     Math.ceil(Math.abs(kayX) / pitch);

        const satir = kMax - kMin + 1;
        if (satir <= 0) return { goz: [], kesik: 0, warn: null };
        if (satir * (2 * jMax + 1) > MAX_ADAY) {
            return { goz: [], kesik: 0, warn: 'Göz çapı çok küçük — ızgara sınırı aşıldı.' };
        }

        const minAlan = polyArea(unit) * MIN_PARCA;
        // Kirpma artigi temizleme toleransi. Goz eninin on binde ikisinden kisa
        // kenarlar birlestirilir; bunlar cizimde gorunmez ama extrude sirasinda
        // sifir alanli ucgen uretir.
        const eps = Math.max(1e-6, W * 2e-4);

        // Simgesel tedirginlik (simulation of simplicity):
        // Ayni kirpma dogrusuna denk gelen iki gozun duz kenarlari TAM esdogrusal
        // olursa three.js'in delik-koprulemesi bozulur (kapanmamis kenarlar).
        // Her gozun kirpma cizgisini altin oran dizisiyle, goz eninin binde 5'ini
        // asmayan ve tamamen belirlenimci bir miktarda ayristiriyoruz. Ciktinin
        // 2D, DXF ve 3D hallerinin tumu ayni poligonu kullanir.
        const jitOlcek = kes ? W * 5e-3 : 0;
        const goz = [];
        let truncated = false, kesik = 0;

        for (let k = kMin; k <= kMax && !truncated; k++) {
            const y = yBase + k * rowStep;
            const kOdd = (((k % 2) + 2) % 2) === 1;
            const xOff = (stagger && kOdd) ? pitch / 2 : 0;
            for (let j = -jMax; j <= jMax; j++) {
                const x = xBase + xOff + j * pitch;
                let jit = 0;
                if (jitOlcek > 0) {
                    const t = (k * 131 + j * 7919) * 0.6180339887498949;
                    jit = (t - Math.floor(t)) * jitOlcek;
                }
                const fit = fitUnit(unit, x, y, bound, planes, kes, minAlan, eps, jit);
                if (!fit) continue;
                if (goz.length >= MAX_GOZ) { truncated = true; break; }
                if (!fit.tam) kesik++;
                goz.push({
                    x: x, y: y, r: W / 2, w: W, h: H,
                    poly: fit.poly, tam: fit.tam,
                    ci: ((((k + j) % CAM_PALET.length) + CAM_PALET.length) % CAM_PALET.length)
                });
            }
        }

        return {
            goz: goz,
            kesik: kesik,
            pitch: pitch,
            rowStep: rowStep,
            gozH: H,
            kenarEt: kenarEt,
            warn: truncated ? ('Göz sayısı ' + MAX_GOZ + ' ile sınırlandı.') : null
        };
    }

    // --- ana uretici -------------------------------------------------------

    function generateRevzen(params) {
        const type     = params.type || 'tmt';
        const en       = Math.max(0.001, Number(params.en) || 0);
        const boy      = Math.max(0.001, Number(params.boy) || 0);
        const kalinlik = Math.max(0, Number(params.kalinlik) || 0);
        const cap      = Math.max(0, Number(params.gozCap) || 0);
        const ara      = Math.max(0, Number(params.gozAra) || 0);
        const kenar    = Math.max(0, Number(params.kenar) || 0);
        const form     = (params.gozForm === 'filgozu') ? 'filgozu' : 'daire';
        const oran     = Math.max(1.02, Number(params.oran) || FILGOZU_ORAN);
        const kayX     = Number(params.kaydirmaX) || 0;
        const kayY     = Number(params.kaydirmaY) || 0;
        // Eski cagrilarla uyum: dizilim verilmemisse stagger bayragindan turet.
        const dizilim  = DIZILIMLER[params.dizilim]
            ? params.dizilim
            : (params.stagger === false ? 'grid' : 'stagger');

        const op = buildOpening(type, en, boy);
        if (!op.ring) {
            return {
                type: type, en: en, boy: boy, kalinlik: kalinlik,
                rise: op.rise, springY: op.springY,
                inner: null, outer: null, goz: [], kesik: 0,
                gozForm: form, palette: CAM_PALET, error: op.error
            };
        }

        const inner = ensureCCW(op.ring);
        const outer = kalinlik > 0 ? offsetClosed(inner, kalinlik) : null;

        let packed = { goz: [], kesik: 0, warn: null, pitch: 0, rowStep: 0, gozH: 0, kenarEt: kenar };
        if (cap > 0) {
            packed = packGoz(inner, {
                cap: cap, ara: ara, kenar: kenar, form: form, oran: oran,
                dizilim: dizilim, kes: params.kes !== false,
                kayX: kayX, kayY: kayY
            });
        }

        return {
            type: type, en: en, boy: boy, kalinlik: kalinlik,
            rise: op.rise, springY: op.springY,
            inner: inner, outer: outer,
            goz: packed.goz, kesik: packed.kesik,
            gozForm: form, gozH: packed.gozH, kenarEt: packed.kenarEt,
            dizilim: dizilim, kaydirmaX: kayX, kaydirmaY: kayY,
            pitch: packed.pitch, rowStep: packed.rowStep,
            palette: CAM_PALET, warn: packed.warn
        };
    }

    function getBoundingBox(result) {
        const rings = [];
        if (result.outer) rings.push(result.outer);
        if (result.inner) rings.push(result.inner);
        if (rings.length === 0) {
            return { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 };
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const ring of rings) {
            for (const p of ring) {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            }
        }
        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }

    global.RevzenGeom = {
        generateRevzen: generateRevzen,
        getBoundingBox: getBoundingBox,
        offsetClosed:   offsetClosed,
        circlePoly:     circlePoly,
        filgozuPoly:    filgozuPoly,
        insetPlanes:    insetPlanes,
        clipToPlane:    clipToPlane,
        cleanPoly:      cleanPoly,
        polyMinDist:    polyMinDist,
        polyArea:       polyArea,
        ensureCCW:      ensureCCW,
        signedArea:     signedArea,
        archRise:       archRise,
        pointInRing:    pointInRing,
        distToRing:     distToRing,
        TYPE_LABELS:    TYPE_LABELS,
        FORM_LABELS:    FORM_LABELS,
        DIZILIMLER:     DIZILIMLER,
        CAM_PALET:      CAM_PALET,
        FILGOZU_ORAN:   FILGOZU_ORAN,
        MIN_KENAR:      MIN_KENAR,
        TMT_RISE:       TMT_RISE,
        PK_RISE:        PK_RISE,
        PK_ANG:         PK_ANG
    };
})(window);
