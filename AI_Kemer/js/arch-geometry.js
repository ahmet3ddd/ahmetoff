// Kemer geometri (global - file:// uyumlu)
(function (global) {
    'use strict';

    const SAMPLES_PER_ARC = 48;
    const DEG2RAD = Math.PI / 180;

    function sampleArc(cx, cy, r, fromDeg, toDeg, samples) {
        const out = [];
        const a0 = fromDeg * DEG2RAD;
        const a1 = toDeg * DEG2RAD;
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const a = a0 + (a1 - a0) * t;
            out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
        }
        return out;
    }

    function tegetCurve(t, ara, baslik) {
        const x   = ara * t - ara / 2 + t * baslik;
        const xxx = ara * t - ara / 4 + t * baslik;
        const y   = ara / 1.1547004;
        const z   = ara * 1.1547004;
        const r   = ara / 2;

        const leftArc  = sampleArc(x, 0, r, 180, 120, SAMPLES_PER_ARC);
        const peak     = [{ x: x,   y: z / 2 }];
        const rightTan = [{ x: xxx, y: y / 2 }];
        const rightArc = sampleArc(x, 0, r,  60,   0, SAMPLES_PER_ARC);

        return [...leftArc, ...peak, ...rightTan, ...rightArc.slice(1)];
    }

    function penciCurve(t, ara, baslik, genislikAcc) {
        const penci = ara / 10;
        const m1 = penci * 6 + genislikAcc + t * baslik;
        const m2 = penci * 4 + genislikAcc + t * baslik;
        const r  = ara / 2 + penci;

        const leftArc  = sampleArc(m1, 0, r, 180,  99.594, SAMPLES_PER_ARC);
        const rightArc = sampleArc(m2, 0, r,  80.406,  0, SAMPLES_PER_ARC);

        return [...leftArc, ...rightArc.slice(1)];
    }

    function offsetPolyline(curve, distance) {
        const n = curve.length;
        const out = new Array(n);
        for (let i = 0; i < n; i++) {
            let tx, ty;
            if (i === 0) {
                tx = curve[1].x - curve[0].x;
                ty = curve[1].y - curve[0].y;
            } else if (i === n - 1) {
                tx = curve[n - 1].x - curve[n - 2].x;
                ty = curve[n - 1].y - curve[n - 2].y;
            } else {
                tx = curve[i + 1].x - curve[i - 1].x;
                ty = curve[i + 1].y - curve[i - 1].y;
            }
            const len = Math.hypot(tx, ty);
            if (len === 0) {
                out[i] = { x: curve[i].x, y: curve[i].y };
                continue;
            }
            const nx = -ty / len;
            const ny =  tx / len;
            out[i] = {
                x: curve[i].x + distance * nx,
                y: curve[i].y + distance * ny
            };
        }
        return out;
    }

    function calcAra(mesafe, bol, baslik) {
        if (baslik > 0) {
            return (mesafe - (bol + 1) * baslik) / bol;
        }
        return mesafe / bol;
    }

    function generateArch(params) {
        const type = params.type || 'teget';
        const mesafe   = Math.max(0.001, Number(params.mesafe) || 0);
        const bol      = Math.max(1, Math.floor(Number(params.bol) || 1));
        const baslik   = Math.max(0, Number(params.baslik) || 0);
        const kalinlik = Math.max(0, Number(params.kalinlik) || 0);

        const ara = calcAra(mesafe, bol, baslik);
        const archUnits = [];

        if (ara <= 0) {
            return {
                ara,
                archUnits,
                error: 'Gecersiz parametreler: ara <= 0'
            };
        }

        let genislikAcc = 0;
        for (let t = 1; t <= bol; t++) {
            const inner = (type === 'penci')
                ? penciCurve(t, ara, baslik, genislikAcc)
                : tegetCurve(t, ara, baslik);

            const outer = (kalinlik > 0) ? offsetPolyline(inner, kalinlik) : null;

            archUnits.push({ inner, outer, kalinlik });

            if (type === 'penci') {
                genislikAcc += ara;
            }
        }

        return { ara, archUnits };
    }

    function getClosedPolygon(unit) {
        if (!unit.outer) return null;
        const ring = unit.inner.slice();
        for (let i = unit.outer.length - 1; i >= 0; i--) {
            ring.push(unit.outer[i]);
        }
        return ring;
    }

    function getBoundingBox(result) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        for (const unit of result.archUnits) {
            const sets = [unit.inner];
            if (unit.outer) sets.push(unit.outer);
            for (const set of sets) {
                for (const p of set) {
                    if (p.x < minX) minX = p.x;
                    if (p.y < minY) minY = p.y;
                    if (p.x > maxX) maxX = p.x;
                    if (p.y > maxY) maxY = p.y;
                }
            }
        }
        if (!isFinite(minX)) {
            return { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 };
        }
        return {
            minX, minY, maxX, maxY,
            width:  maxX - minX,
            height: maxY - minY
        };
    }

    global.KemerGeom = {
        generateArch,
        getClosedPolygon,
        getBoundingBox
    };
})(window);
