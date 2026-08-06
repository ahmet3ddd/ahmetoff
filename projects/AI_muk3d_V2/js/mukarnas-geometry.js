// Mukarnas hucre geometrisi (global - file:// uyumlu)
// Port: docs/BADEM-ciz-or.ms, YAPRAK-ciz.ms, FITIL-ciz.ms, KAZ-ciz.ms (+ yrm varyantlari)
(function (global) {
    'use strict';

    const DEG2RAD = Math.PI / 180;
    const RAD2DEG = 180 / Math.PI;

    function v3(x, y, z) {
        return { x: x || 0, y: y || 0, z: z || 0 };
    }

    function cloneV(p) { return v3(p.x, p.y, p.z); }

    function add(a, b) { return v3(a.x + b.x, a.y + b.y, a.z + b.z); }

    function sub(a, b) { return v3(a.x - b.x, a.y - b.y, a.z - b.z); }

    function scale(p, s) { return v3(p.x * s, p.y * s, p.z * s); }

    function dist(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }

    function cross(a, b) {
        return v3(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
    }

    function normalize(p) {
        const len = Math.hypot(p.x, p.y, p.z);
        if (len < 1e-12) return v3(0, 0, 0);
        return scale(p, 1 / len);
    }

    function lerp(a, b, t) {
        return v3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t
        );
    }

    function angleBetween(a, b) {
        const na = normalize(a);
        const nb = normalize(b);
        let c = dot(na, nb);
        c = Math.max(-1, Math.min(1, c));
        return Math.acos(c);
    }

    function withZ(p, dz) { return v3(p.x, p.y, p.z + dz); }

    function withZPct(p, asaba, pct) {
        return v3(p.x, p.y, p.z + (asaba * pct) / 100);
    }

    /** Kapali ucgen spline (p1-p2-p3-p1) */
    function closedTriangle(p1, p2, p3) {
        return [cloneV(p1), cloneV(p2), cloneV(p3)];
    }

    function refineSegment(knots, segNum, fraction) {
        const n = knots.length;
        const i = segNum - 1;
        const j = (i + 1) % n;
        const pt = lerp(knots[i], knots[j], fraction);
        const out = knots.slice();
        out.splice(i + 1, 0, pt);
        return out;
    }

    function knotAt(knots, index1) {
        return cloneV(knots[index1 - 1]);
    }

    function calcAutoAsaba(p1, p2, p3) {
        const d1 = dist(p2, p1);
        const d2 = dist(p2, p3);
        const asabaen = (d1 + d2) / 2;
        return Math.ceil(asabaen * 1.618);
    }

    const BBX_DIVISOR = {
        badem: 14,
        yaprak: 14,
        fitil: 12.5,
        kaz: 12
    };

    function autoBbxDivisor(type) {
        return BBX_DIVISOR[type] || 14;
    }

    /** Plan uzerinde P1 -> pp2 mesafesi (aax) */
    function calcAraMesafeFromBbx(p1, p2, p3, bbx) {
        const ac = angleBetween(sub(p2, p1), sub(p3, p1));
        const sinAc = Math.sin(ac);
        if (sinAc < 1e-9) return 0;
        return bbx / sinAc;
    }

    function resolveBbx(type, p1, p2, p3, asaba, params) {
        params = params || {};
        const div = autoBbxDivisor(type);
        const autoBbx = asaba / div;
        const ac = angleBetween(sub(p2, p1), sub(p3, p1));
        const aa = dist(p1, p2);
        const sinAc = Math.sin(ac);
        let bbx;
        let bbx2;
        let araMesafe;

        if (params.autoAraMesafe !== false) {
            bbx = autoBbx;
            bbx2 = autoBbx;
            araMesafe = calcAraMesafeFromBbx(p1, p2, p3, bbx);
        } else {
            araMesafe = Number(params.araMesafe);
            if (!Number.isFinite(araMesafe) || araMesafe <= 0) {
                bbx = autoBbx;
                araMesafe = calcAraMesafeFromBbx(p1, p2, p3, bbx);
            } else {
                araMesafe = Math.min(araMesafe, aa * 0.999);
                bbx = araMesafe * (sinAc > 1e-9 ? sinAc : 1);
            }
            bbx2 = bbx;
        }

        return { bbx: bbx, bbx2: bbx2, araMesafe: araMesafe };
    }

    const PP5H_AUTO_RATIO = 1 / 4.5;

    function pp5hFraction(pp4, p2t, cut) {
        const len = dist(pp4, p2t);
        if (len < 1e-9) return 0;
        if (!cut || cut.autoAraMesafe78 !== false) {
            return PP5H_AUTO_RATIO;
        }
        let d = Number(cut.araMesafe78);
        if (!Number.isFinite(d) || d <= 0) {
            return PP5H_AUTO_RATIO;
        }
        d = Math.min(d, len * 0.999);
        return d / len;
    }

    function prepareBademKnots(p1, p2, p3, asaba, cut) {
        cut = cut || {};
        const bbx = cut.bbx != null ? cut.bbx : asaba / 14;
        const bbx2 = cut.bbx2 != null ? cut.bbx2 : bbx;

        let knots = closedTriangle(p1, p2, p3);

        const ac = angleBetween(sub(p2, p1), sub(p3, p1));
        const aa = dist(p1, p2);
        const aax = bbx / Math.sin(ac);
        knots = refineSegment(knots, 1, aax / aa);
        let pp2 = knotAt(knots, 2);
        pp2 = withZPct(pp2, asaba, 5);

        const bc = angleBetween(sub(p2, p3), sub(p1, p3));
        const bb = dist(p3, p2);
        const bbxa = bbx / Math.sin(bc);
        knots = refineSegment(knots, 3, 1 - (bbxa / bb));
        let pp3 = knotAt(knots, 4);
        pp3 = withZPct(pp3, asaba, 5);

        const p2x = knotAt(knots, 3);
        const bb2 = dist(pp3, p2x);
        const bbxa2 = bbx2 / Math.sin(bc);
        knots = refineSegment(knots, 3, 1 - (bbxa2 / bb2));
        const pp4 = knotAt(knots, 4);

        const p2t = knotAt(knots, 2);
        const pp5h = lerp(pp4, p2t, pp5hFraction(pp4, p2t, cut));
        const p2h = knotAt(knots, 3);

        return { pp2: pp2, pp3: pp3, pp4: pp4, p2t: p2t, p2h: p2h, pp5h: pp5h };
    }

    function calcAraMesafe78(p1, p2, p3, asaba, cut) {
        const k = prepareBademKnots(p1, p2, p3, asaba, cut);
        return dist(k.pp5h, k.pp4);
    }

    function buildMesh(vertices, faces1) {
        const faces = faces1.map(function (f) {
            return [f[0] - 1, f[1] - 1, f[2] - 1];
        });
        return { vertices: vertices, faces: faces };
    }

    const WELD_TOLERANCE = 1e-5;

    /** Ayni x,y,z koordinatli koseleri tek noktada birlestir */
    function weldMeshVertices(mesh, tolerance) {
        tolerance = tolerance !== undefined ? tolerance : WELD_TOLERANCE;
        const verts = mesh.vertices;
        const keyMap = Object.create(null);
        const newVerts = [];
        const vertexRemap = new Array(verts.length);

        function quantKey(v) {
            const q = function (n) { return Math.round(n / tolerance); };
            return q(v.x) + ',' + q(v.y) + ',' + q(v.z);
        }

        for (let i = 0; i < verts.length; i++) {
            const v = verts[i];
            const key = quantKey(v);
            if (keyMap[key] === undefined) {
                keyMap[key] = newVerts.length;
                newVerts.push(cloneV(v));
            }
            vertexRemap[i] = keyMap[key];
        }

        const newFaces = [];
        for (let fi = 0; fi < mesh.faces.length; fi++) {
            const f = mesh.faces[fi];
            const a = vertexRemap[f[0]];
            const b = vertexRemap[f[1]];
            const c = vertexRemap[f[2]];
            if (a === b || b === c || a === c) continue;
            newFaces.push([a, b, c]);
        }

        return {
            vertices: newVerts,
            faces: newFaces,
            vertexRemap: vertexRemap
        };
    }

    // ---- Kenar fillet (badem 7-8 / 16-17, referans: web/badem.STL) ----

    const FILLET_AUTO_EDGE_RATIO = 2 / 3;
    const FILLET_MAX_RATIO = 0.45;
    const FILLET_MIN_SEGMENTS = 1;
    const FILLET_MAX_SEGMENTS = 32;

    function clampFilletSegments(n) {
        n = Math.round(Number(n));
        if (!Number.isFinite(n)) n = 3;
        return Math.max(FILLET_MIN_SEGMENTS, Math.min(FILLET_MAX_SEGMENTS, n));
    }

    /** p noktasinin (vFrom + t*u) dogrusuna dik bileseni */
    function edgePerp(vFrom, u, p) {
        const d = sub(p, vFrom);
        return sub(d, scale(u, dot(d, u)));
    }

    function otherVertexOfFace(face, ia, ib) {
        for (let i = 0; i < 3; i++) {
            if (face[i] !== ia && face[i] !== ib) return face[i];
        }
        return -1;
    }

    function hasDirectedEdge(f, x, y) {
        return (f[0] === x && f[1] === y) ||
               (f[1] === x && f[2] === y) ||
               (f[2] === x && f[0] === y);
    }

    /** Poligonu apex konumundan yelpaze ile ucgenle (sarim yonu korunur) */
    function fanTriangulate(poly, apexPos, outFaces) {
        const n = poly.length;
        for (let i = 1; i <= n - 2; i++) {
            outFaces.push([
                poly[apexPos % n],
                poly[(apexPos + i) % n],
                poly[(apexPos + i + 1) % n]
            ]);
        }
    }

    /** Newell yontemiyle poligon normali */
    function polygonNormal(poly, verts) {
        const n = v3(0, 0, 0);
        for (let i = 0; i < poly.length; i++) {
            const a = verts[poly[i]];
            const b = verts[poly[(i + 1) % poly.length]];
            n.x += (a.y - b.y) * (a.z + b.z);
            n.y += (a.z - b.z) * (a.x + b.x);
            n.z += (a.x - b.x) * (a.y + b.y);
        }
        return n;
    }

    /**
     * Yelpaze tepesini gecerlilik kontroluyle sec: tum yelpaze ucgenlerinin
     * normali poligon normaliyle ayni yonde olmali (katlanma olmasin).
     * preferredPos denenir; olmazsa diger koseler denenir.
     */
    function fanTriangulateSafe(poly, preferredPos, verts, outFaces) {
        const n = poly.length;
        const nPoly = polygonNormal(poly, verts);

        function apexOk(apexPos) {
            for (let i = 1; i <= n - 2; i++) {
                const a = verts[poly[apexPos % n]];
                const b = verts[poly[(apexPos + i) % n]];
                const c = verts[poly[(apexPos + i + 1) % n]];
                const tn = cross(sub(b, a), sub(c, a));
                if (dot(tn, nPoly) <= 1e-9) return false;
            }
            return true;
        }

        let apex = -1;
        if (apexOk(preferredPos)) apex = preferredPos;
        else {
            for (let p = 0; p < n; p++) {
                if (p !== preferredPos && apexOk(p)) { apex = p; break; }
            }
        }
        if (apex === -1) apex = preferredPos;
        fanTriangulate(poly, apex, outFaces);
        return apex !== -1;
    }

    /**
     * mesh icindeki (ia, ib) kenarini badem.STL referansindaki yapiyla
     * fillet yapar:
     *  - Kenara komsu A/B ucgenleri s kadar geri kirpilir (esit gerileme).
     *  - Kesitte iki yuze tegel cember yayi N segmentle ornekleneir.
     *  - Yay HER IKI ucta yan duvar duzlemine yatirilir (miter): duvar,
     *    sabit kenari etrafinda A-taraf gerileme noktasina pivot eder ve
     *    duvar poligonu yay uzerinden yeniden orulur.
     *  - Uctaki diger komsu ucgenlerde eski kose ilgili yay ucuyla
     *    degistirilir; kapak/bolme eklenmez.
     *  - Eski kose koseleri (ia, ib) yuzeylerden cikar ama dizide kalir
     *    (kose numaralamasi sabit).
     * size: A ve B yuzeyleri uzerindeki gerileme; null/0 -> otomatik
     * (kenar boyunun 2/3'u). Basarisizsa null doner (mesh degismez).
     */
    function filletMeshEdge(mesh, ia, ib, size, segments) {
        const verts = mesh.vertices;
        const faces = mesh.faces;
        if (ia === ib || !verts[ia] || !verts[ib]) return null;

        const adjacent = [];
        for (let fi = 0; fi < faces.length; fi++) {
            const f = faces[fi];
            const hasA = f[0] === ia || f[1] === ia || f[2] === ia;
            const hasB = f[0] === ib || f[1] === ib || f[2] === ib;
            if (hasA && hasB) adjacent.push(fi);
        }
        if (adjacent.length !== 2) return null;

        let fAIdx = adjacent[0];
        let fBIdx = adjacent[1];
        if (!hasDirectedEdge(faces[fAIdx], ia, ib)) {
            fAIdx = adjacent[1];
            fBIdx = adjacent[0];
        }
        if (!hasDirectedEdge(faces[fAIdx], ia, ib) ||
            !hasDirectedEdge(faces[fBIdx], ib, ia)) return null;

        const oppA = otherVertexOfFace(faces[fAIdx], ia, ib);
        const oppB = otherVertexOfFace(faces[fBIdx], ia, ib);
        if (oppA < 0 || oppB < 0 || oppA === oppB) return null;

        /**
         * Uc analizi: yayin yatirilacagi duvar yuzu (iki opp'u birden iceren
         * veya hicbirini icermeyen tek yuz) + eski koseyi yay ucuyla
         * degistirecek flank yuzleri (tek opp icerenler).
         */
        function analyzeEnd(endV) {
            const walls = [];
            const flanks = [];
            for (let fi = 0; fi < faces.length; fi++) {
                if (fi === fAIdx || fi === fBIdx) continue;
                const f = faces[fi];
                if (f[0] !== endV && f[1] !== endV && f[2] !== endV) continue;
                const hasOppA = f.indexOf(oppA) !== -1;
                const hasOppB = f.indexOf(oppB) !== -1;
                if (hasOppA === hasOppB) walls.push(fi);
                else flanks.push({ fi: fi, side: hasOppA ? 0 : 1 });
            }
            if (walls.length !== 1) return null;
            const wf = faces[walls[0]];
            const others = [];
            for (let i = 0; i < 3; i++) {
                if (wf[i] !== endV) others.push(wf[i]);
            }
            if (others.length !== 2) return null;
            return { wallIdx: walls[0], w1: others[0], w2: others[1], flanks: flanks };
        }

        const end7 = analyzeEnd(ia);
        const end8 = analyzeEnd(ib);
        if (!end7 || !end8) return null;

        const p7 = verts[ia];
        const p8 = verts[ib];
        const edgeLen = dist(p7, p8);
        if (edgeLen < 1e-9) return null;
        const u = scale(sub(p8, p7), 1 / edgeLen);

        const wA = edgePerp(p7, u, verts[oppA]);
        const wB = edgePerp(p7, u, verts[oppB]);
        const hA = Math.hypot(wA.x, wA.y, wA.z);
        const hB = Math.hypot(wB.x, wB.y, wB.z);
        if (hA < 1e-9 || hB < 1e-9) return null;
        const aHat = scale(wA, 1 / hA);
        const bHat = scale(wB, 1 / hB);

        const cosAlpha = dot(aHat, bHat);
        if (cosAlpha > 0.995 || cosAlpha < -0.995) return null;

        const sMax = FILLET_MAX_RATIO * Math.min(hA, hB);
        let s = Number(size);
        if (!Number.isFinite(s) || s <= 0) {
            s = FILLET_AUTO_EDGE_RATIO * edgeLen;
        }
        s = Math.min(s, sMax);
        if (s < 1e-9) return null;

        const N = clampFilletSegments(segments);

        /**
         * Verilen boyut icin yay siralarini kur (deltalar s ile dogrusal).
         * Kesit ofsetleri o_j iki yuze tegel cember yayindan; her ucta
         * duvar duzlemine (sabit kenar + A-taraf gerileme noktasi) izdusum.
         */
        function buildRows(sVal) {
            const halfCos = Math.sqrt((1 + cosAlpha) / 2);
            const center = scale(normalize(add(aHat, bHat)), sVal / halfCos);
            const tanA = scale(aHat, sVal);
            const tanB = scale(bHat, sVal);
            const radius = dist(tanA, center);
            if (radius < 1e-12) return null;
            const dir0 = scale(sub(tanA, center), 1 / radius);
            const dirN = scale(sub(tanB, center), 1 / radius);
            const cosPhi = Math.max(-1, Math.min(1, dot(dir0, dirN)));
            const phiTotal = Math.acos(cosPhi);
            let ortho = sub(dirN, scale(dir0, cosPhi));
            const orthoLen = Math.hypot(ortho.x, ortho.y, ortho.z);
            if (orthoLen < 1e-12) return null;
            ortho = scale(ortho, 1 / orthoLen);

            const offsets = [];
            for (let j = 0; j <= N; j++) {
                if (j === 0) { offsets.push(tanA); continue; }
                if (j === N) { offsets.push(tanB); continue; }
                const phi = phiTotal * j / N;
                offsets.push(add(center, scale(
                    add(scale(dir0, Math.cos(phi)), scale(ortho, Math.sin(phi))),
                    radius
                )));
            }

            // Yay, ucun ORIJINAL duvar duzlemine yatirilir. Boylece yay
            // uclari duvarin eski kenarlarinin (or. 4-7 ve 7-9 hatlari)
            // uzerine duser ve plan dogrultulari korunur.
            function endRows(endPt, endInfo) {
                const w1p = verts[endInfo.w1];
                const w2p = verts[endInfo.w2];
                let n = cross(sub(w2p, w1p), sub(endPt, w1p));
                const nl = Math.hypot(n.x, n.y, n.z);
                if (nl < 1e-12) return null;
                n = scale(n, 1 / nl);
                const denom = dot(u, n);
                if (Math.abs(denom) < 0.02) return null;
                const rows = [];
                const deltas = [];
                for (let j = 0; j <= N; j++) {
                    const p = add(endPt, offsets[j]);
                    const d = -dot(sub(p, w1p), n) / denom;
                    rows.push(add(p, scale(u, d)));
                    deltas.push(d);
                }
                return { rows: rows, deltas: deltas };
            }

            const e7 = endRows(p7, end7);
            const e8 = endRows(p8, end8);
            if (!e7 || !e8) return null;
            return { row7: e7.rows, row8: e8.rows, d7: e7.deltas, d8: e8.deltas };
        }

        /** Yay, duvarin sabit kenarini (w1-w2) gecerse kucultme orani */
        function wallCrossShrink(rowPts, endVert, endInfo) {
            const a = verts[endInfo.w1];
            const b = verts[endInfo.w2];
            const ab = sub(b, a);
            const abLen = Math.hypot(ab.x, ab.y, ab.z);
            if (abLen < 1e-9) return 1;
            const abU = scale(ab, 1 / abLen);
            const cPerp = edgePerp(a, abU, endVert);
            const hW = Math.hypot(cPerp.x, cPerp.y, cPerp.z);
            if (hW < 1e-9) return 1;
            const n0 = scale(cPerp, 1 / hW);
            let k = 1;
            for (let i = 0; i < rowPts.length; i++) {
                const g = dot(edgePerp(a, abU, rowPts[i]), n0);
                if (g < 0.05 * hW) {
                    const kj = (0.95 * hW) / (hW - g);
                    if (kj > 0 && kj < k) k = kj;
                }
            }
            return k;
        }

        /** Siralar cok kisalirsa (uclar kesisirse) kucultme orani */
        function rowLenShrink(rowsObj) {
            let k = 1;
            for (let j = 0; j <= N; j++) {
                const gain = rowsObj.d8[j] - rowsObj.d7[j];
                if (edgeLen + gain < 0.05 * edgeLen) {
                    const kj = (0.95 * edgeLen) / (-gain);
                    if (kj > 0 && kj < k) k = kj;
                }
            }
            return k;
        }

        let rows = buildRows(s);
        if (!rows) return null;
        const shrink = Math.min(
            wallCrossShrink(rows.row7, p7, end7),
            wallCrossShrink(rows.row8, p8, end8),
            rowLenShrink(rows)
        );
        if (shrink < 1) {
            s *= shrink;
            if (s < 1e-9) return null;
            rows = buildRows(s);
            if (!rows) return null;
        }

        const base = verts.length;
        for (let j = 0; j <= N; j++) verts.push(rows.row7[j]);
        for (let j = 0; j <= N; j++) verts.push(rows.row8[j]);
        const q7 = function (j) { return base + j; };
        const q8 = function (j) { return base + (N + 1) + j; };
        const arc7 = [];
        const arc8 = [];
        for (let j = 0; j <= N; j++) {
            arc7.push(q7(j));
            arc8.push(q8(j));
        }

        const newFaces = [];

        /** (x,y) kenarini iceren, wallIdx disindaki yuzu bul */
        function faceAcrossEdge(x, y, excludeIdx) {
            for (let fi = 0; fi < faces.length; fi++) {
                if (fi === excludeIdx) continue;
                const f = faces[fi];
                if (f.indexOf(x) !== -1 && f.indexOf(y) !== -1) return fi;
            }
            return -1;
        }

        /**
         * Duvar ucgeninde uc kosesini yay dizisiyle degistirip poligonu
         * yay sonrasindaki duvar kosesinden yelpazele (referans yapisi).
         */
        function stitchWallArc(endInfo, corner, arcIdx) {
            const face = faces[endInfo.wallIdx];
            const pos = face.indexOf(corner);
            const prev = face[(pos + 2) % 3];
            const next = face[(pos + 1) % 3];
            // Giris kenarindaki (prev-corner) komsu yuz A tarafinda ise
            // yay A ucundan (q0) baslar, degilse B ucundan (qN)
            const acrossIdx = faceAcrossEdge(prev, corner, endInfo.wallIdx);
            let startAtA;
            if (acrossIdx === fAIdx) startAtA = true;
            else if (acrossIdx === fBIdx) startAtA = false;
            else if (acrossIdx !== -1 && faces[acrossIdx].indexOf(oppA) !== -1) startAtA = true;
            else startAtA = false;

            const seq = startAtA ? arcIdx.slice() : arcIdx.slice().reverse();
            const poly = [];
            for (let e = 0; e < 3; e++) {
                const v = face[e];
                if (v === corner) {
                    for (let si = 0; si < seq.length; si++) poly.push(seq[si]);
                } else {
                    poly.push(v);
                }
            }
            fanTriangulateSafe(poly, poly.indexOf(next), verts, newFaces);
        }

        const flankSub = Object.create(null);
        for (let i = 0; i < end7.flanks.length; i++) {
            const fl = end7.flanks[i];
            flankSub[fl.fi] = { corner: ia, idx: fl.side === 0 ? q7(0) : q7(N) };
        }
        for (let i = 0; i < end8.flanks.length; i++) {
            const fl = end8.flanks[i];
            flankSub[fl.fi] = { corner: ib, idx: fl.side === 0 ? q8(0) : q8(N) };
        }

        for (let fi = 0; fi < faces.length; fi++) {
            const f = faces[fi];
            if (fi === fAIdx) {
                newFaces.push(f.map(function (v) {
                    return v === ia ? q7(0) : (v === ib ? q8(0) : v);
                }));
            } else if (fi === fBIdx) {
                newFaces.push(f.map(function (v) {
                    return v === ia ? q7(N) : (v === ib ? q8(N) : v);
                }));
            } else if (fi === end7.wallIdx) {
                stitchWallArc(end7, ia, arc7);
            } else if (fi === end8.wallIdx) {
                stitchWallArc(end8, ib, arc8);
            } else if (flankSub[fi]) {
                const sub7 = flankSub[fi];
                newFaces.push(f.map(function (v) {
                    return v === sub7.corner ? sub7.idx : v;
                }));
            } else {
                newFaces.push(f);
            }
        }

        // Yay seridi
        for (let j = 0; j < N; j++) {
            newFaces.push([q7(j), q7(j + 1), q8(j + 1)]);
            newFaces.push([q7(j), q8(j + 1), q8(j)]);
        }

        mesh.faces = newFaces;

        const extraIndices = [];
        for (let j = base; j < verts.length; j++) extraIndices.push(j);
        return {
            edge: [ia, ib],
            size: s,
            segments: N,
            extraStart: base,
            extraIndices: extraIndices
        };
    }

    /** Badem 7-8 kenari icin otomatik fillet boyutu (kenarin 2/3'u) */
    function calcFillet78Auto(p1, p2, p3, asaba, cut) {
        const k = prepareBademKnots(p1, p2, p3, asaba, cut);
        const v7 = withZPct(k.pp5h, asaba, 80);
        const v8 = withZPct(k.pp4, asaba, 80);
        return FILLET_AUTO_EDGE_RATIO * dist(v7, v8);
    }

    /** p1-p2 dogrusuna gore XY aynasi */
    function reflectPointAcrossP1P2(p, p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const vx = p.x - p1.x;
        const vy = p.y - p1.y;
        const d = vx * nx + vy * ny;
        return v3(p.x - 2 * d * nx, p.y - 2 * d * ny, p.z);
    }

    /** Tam mod: p1-p2 eksenine gore ayna simetri (MaxScript Symmetry) */
    function applySymmetry(mesh, p1, p2) {
        const verts = mesh.vertices;
        const faces = mesh.faces;

        function reflect(p) {
            return reflectPointAcrossP1P2(p, p1, p2);
        }

        const n = verts.length;
        const mirrored = verts.map(reflect);
        const allVerts = verts.concat(mirrored);
        const mirroredFaces = faces.map(function (f) {
            return [f[0] + n, f[2] + n, f[1] + n];
        });
        return {
            vertices: allVerts,
            faces: faces.concat(mirroredFaces)
        };
    }

    /** Yarim sag: hucreyi p1-p2 eksenine gore aynala */
    function mirrorMeshAcrossP1P2(mesh, p1, p2) {
        const verts = mesh.vertices.map(function (v) {
            const r = reflectPointAcrossP1P2(v, p1, p2);
            return v3(r.x, r.y, v.z);
        });
        const faces = mesh.faces.map(function (f) {
            return [f[0], f[2], f[1]];
        });
        return { vertices: verts, faces: faces };
    }

    function buildBadem(p1, p2, p3, asaba, half, cut) {
        const k = prepareBademKnots(p1, p2, p3, asaba, cut);

        const vertices = [
            cloneV(p1), cloneV(p3), cloneV(k.pp3), cloneV(k.pp2),
            withZPct(k.pp3, asaba, 40),
            withZPct(k.pp4, asaba, 50),
            withZPct(k.pp5h, asaba, 80),
            withZPct(k.pp4, asaba, 80),
            withZPct(k.p2h, asaba, 95),
            withZPct(p3, asaba, 100),
            withZPct(k.p2h, asaba, 100)
        ];

        const faces = [
            [1, 3, 2], [1, 4, 3], [2, 3, 10], [10, 3, 5], [5, 6, 10],
            [6, 8, 10], [8, 9, 10], [9, 11, 10], [3, 4, 5], [4, 6, 5],
            [6, 4, 8], [4, 7, 8], [8, 7, 9], [4, 9, 7]
        ];

        let mesh = buildMesh(vertices, faces);
        if (!half) mesh = applySymmetry(mesh, p1, p2);
        return mesh;
    }

    function buildYaprak(p1, p2, p3, asaba, half, cut) {
        cut = cut || {};
        const bbx = cut.bbx != null ? cut.bbx : asaba / 14;
        const bbx2 = cut.bbx2 != null ? cut.bbx2 : bbx;

        let knots = closedTriangle(p1, p2, p3);

        const ac = angleBetween(sub(p2, p1), sub(p3, p1));
        const aa = dist(p1, p2);
        const aax = bbx / Math.sin(ac);
        knots = refineSegment(knots, 1, aax / aa);
        let pp2 = knotAt(knots, 2);
        pp2 = withZPct(pp2, asaba, 5);

        const bc = angleBetween(sub(p2, p3), sub(p1, p3));
        const bb = dist(p3, p2);
        const bbxa = bbx / Math.sin(bc);
        knots = refineSegment(knots, 3, 1 - (bbxa / bb));
        let pp3 = knotAt(knots, 4);
        pp3 = withZPct(pp3, asaba, 5);

        const p2x = knotAt(knots, 3);
        const bb2 = dist(pp3, p2x);
        const bbxa2 = bbx2 / Math.sin(bc);
        knots = refineSegment(knots, 3, 1 - (bbxa2 / bb2));
        const pp4 = knotAt(knots, 4);

        const p2t = knotAt(knots, 2);
        const aax3 = dist(p1, p2t);
        const aaxy = dist(p2, p2t);
        knots = refineSegment(knots, 2, aax3 / aaxy);
        const ppy = knotAt(knots, 3);

        const vertices = [
            cloneV(p1), cloneV(p3), cloneV(pp3), cloneV(pp2),
            withZPct(pp3, asaba, 40),
            withZPct(p2t, asaba, 45),
            withZPct(pp4, asaba, 50),
            withZPct(ppy, asaba, 50),
            withZPct(ppy, asaba, 80),
            withZPct(pp4, asaba, 80),
            withZPct(p2, asaba, 95),
            withZPct(p2, asaba, 100),
            withZPct(p3, asaba, 100)
        ];

        const faces = [
            [1, 3, 2], [1, 4, 3], [3, 4, 5], [5, 4, 6], [5, 6, 7],
            [8, 7, 6], [7, 8, 9], [7, 9, 10], [11, 10, 9], [13, 2, 3],
            [13, 3, 5], [13, 5, 7], [13, 7, 10], [13, 10, 12], [10, 11, 12]
        ];

        let mesh = buildMesh(vertices, faces);
        if (!half) mesh = applySymmetry(mesh, p1, p2);
        return mesh;
    }

    function buildFitil(p1, p2, p3, asaba, half, cut) {
        cut = cut || {};
        const bbx = cut.bbx != null ? cut.bbx : asaba / 12.5;
        const oran = dist(p1, p3) / dist(p1, p2);

        let knots = closedTriangle(p1, p2, p3);

        const ac = angleBetween(sub(p2, p1), sub(p3, p1));
        const aa = dist(p1, p2);
        const aax = bbx / Math.sin(ac);

        knots = refineSegment(knots, 1, aax / aa);
        const pf2 = knotAt(knots, 2);
        const pf3 = knotAt(knots, 3);
        const pf4 = knotAt(knots, 4);

        const afc = angleBetween(sub(pf3, pf2), sub(pf4, pf2));
        const aaf = dist(p1, pf2);
        const aaxf = aaf * Math.cos(ac);
        const abf = aaf * Math.sin(ac);
        const accDeg = 180 - (ac * RAD2DEG + afc * RAD2DEG + 90);
        const bxf = abf * Math.tan(accDeg * DEG2RAD);
        const ftl = aaxf - bxf;
        const oranf = 1 - (ftl / dist(p1, p3));
        knots = refineSegment(knots, 4, oranf);
        const pf5 = knotAt(knots, 5);

        const oranff = 1 - (ftl / dist(pf5, pf4));
        knots = refineSegment(knots, 4, oranff);

        const pfff5 = knotAt(knots, 5);
        const pfff6 = knotAt(knots, 6);
        const pfff2 = knotAt(knots, 2);
        const pfff4 = knotAt(knots, 4);
        const pfff3 = knotAt(knots, 3);

        const f3 = dist(pfff5, pfff6);
        const f4 = dist(pfff2, pfff4);
        const oranfff = 1 - (f3 / f4);
        const pfts2 = lerp(pfff4, pfff2, oranfff);

        const vertices = [
            cloneV(p1),
            withZPct(pfff6, asaba, 5),
            withZPct(pfff2, asaba, 5),
            withZPct(pfff6, asaba, 45),
            withZPct(pfff2, asaba, 45),
            withZPct(pfff5, asaba, 50),
            withZPct(pfts2, asaba, 50),
            withZPct(pfts2, asaba, 80),
            withZPct(pfff5, asaba, 80),
            withZPct(pfff4, asaba, 95),
            withZPct(pfff2, asaba, 80),
            withZPct(pfff3, asaba, 95),
            withZPct(pfff4, asaba, 100),
            withZPct(pfff3, asaba, 100)
        ];

        const faces = [
            [1, 3, 2], [2, 3, 4], [3, 5, 4], [4, 5, 6], [5, 7, 6],
            [6, 7, 8], [6, 8, 9], [9, 8, 10], [7, 5, 11], [8, 7, 11],
            [8, 11, 10], [10, 11, 12], [13, 10, 12], [12, 14, 13]
        ];

        let mesh = buildMesh(vertices, faces);
        if (!half) mesh = applySymmetry(mesh, p1, p2);
        return mesh;
    }

    function buildKaz(p1, p2, p3, asaba, half, cut) {
        cut = cut || {};
        const bbx = cut.bbx != null ? cut.bbx : asaba / 12;
        const oran = dist(p1, p3) / dist(p1, p2);

        let knots = closedTriangle(p1, p2, p3);

        const ac = angleBetween(sub(p2, p1), sub(p3, p1));
        const aa = dist(p1, p2);
        const aax = bbx / Math.sin(ac);
        const oran1 = aax * oran;
        const bbx2 = oran1 / dist(p1, p3);

        knots = refineSegment(knots, 3, 1 - bbx2);
        let p4 = knotAt(knots, 4);

        knots = refineSegment(knots, 1, aax / aa);
        const px = knotAt(knots, 5);
        const bbx3 = dist(p1, px) / dist(p3, px);
        knots = refineSegment(knots, 4, 1 - bbx3);
        const p5 = knotAt(knots, 5);

        let pp2 = knotAt(knots, 2);
        const aaxx = dist(p1, pp2) / dist(p2, pp2);
        knots = refineSegment(knots, 2, aaxx);
        const pp3 = knotAt(knots, 3);

        p4 = withZPct(p4, asaba, 5);
        pp2 = withZPct(pp2, asaba, 5);

        const vertices = [
            cloneV(p1), cloneV(p4), cloneV(pp2),
            withZPct(pp2, asaba, 40),
            withZPct(p4, asaba, 40),
            withZPct(pp3, asaba, 50),
            withZPct(p5, asaba, 50),
            withZPct(p5, asaba, 80),
            withZPct(pp3, asaba, 80),
            withZPct(p2, asaba, 95),
            withZPct(p3, asaba, 95),
            withZPct(p2, asaba, 100),
            withZPct(p3, asaba, 100)
        ];

        const faces = [
            [1, 3, 2], [2, 3, 4], [2, 4, 5], [5, 4, 6], [5, 6, 7],
            [7, 6, 8], [6, 9, 8], [8, 9, 10], [11, 8, 10], [11, 10, 12],
            [11, 12, 13]
        ];

        let mesh = buildMesh(vertices, faces);
        if (!half) mesh = applySymmetry(mesh, p1, p2);
        return mesh;
    }

    function mergeMeshes(meshA, meshB) {
        const offset = meshA.vertices.length;
        const vertices = meshA.vertices.concat(meshB.vertices);
        const facesB = meshB.faces.map(function (f) {
            return [f[0] + offset, f[1] + offset, f[2] + offset];
        });
        return {
            vertices: vertices,
            faces: meshA.faces.concat(facesB)
        };
    }

    const BUILDERS = {
        badem: buildBadem,
        yaprak: buildYaprak,
        fitil: buildFitil,
        kaz: buildKaz
    };

    function generateMukarnas(params) {
        const type = params.type || 'badem';
        const variant = params.variant || 'tam';
        const p1 = params.p1 || v3(0, 0, 0);
        const p2 = params.p2 || v3(100, 0, 0);
        const p3 = params.p3 || v3(50, 80, 0);
        const p4 = params.p4 || reflectPointAcrossP1P2(p3, p1, p2);

        let asaba = Number(params.asaba) || 0;
        if (params.autoAsaba || asaba <= 0) {
            asaba = calcAutoAsaba(p1, p2, p3);
            if (variant === 'tam-asym') {
                const asaba4 = calcAutoAsaba(p1, p2, p4);
                asaba = Math.ceil((asaba + asaba4) / 2);
            }
        }

        const builder = BUILDERS[type];
        if (!builder) {
            return { error: 'Gecersiz tip: ' + type, mesh: null, asaba: asaba };
        }

        const cut = resolveBbx(type, p1, p2, p3, asaba, params);
        cut.autoAraMesafe78 = params.autoAraMesafe78;
        cut.araMesafe78 = params.araMesafe78;

        let mesh;
        try {
            if (variant === 'tam-asym') {
                const meshP3 = builder(p1, p2, p3, asaba, true, cut);
                const meshP4 = builder(p1, p2, p4, asaba, true, cut);
                // p4 eksene gore karsi taraftaysa ayni sarim ters yonelim
                // uretir; yuzleri cevirerek butun mesh'i tutarli tut
                const sideOf = function (p) {
                    return (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x);
                };
                if (sideOf(p3) * sideOf(p4) < 0) {
                    meshP4.faces = meshP4.faces.map(function (f) {
                        return [f[0], f[2], f[1]];
                    });
                }
                mesh = mergeMeshes(meshP3, meshP4);
            } else {
                const half = (variant === 'sol' || variant === 'sag');
                mesh = builder(p1, p2, p3, asaba, half, cut);
                if (variant === 'sag') {
                    mesh = mirrorMeshAcrossP1P2(mesh, p1, p2);
                }
            }
        } catch (err) {
            return { error: err.message || String(err), mesh: null, asaba: asaba };
        }

        const welded = weldMeshVertices(mesh);
        mesh = { vertices: welded.vertices, faces: welded.faces };
        const vertexRemap = welded.vertexRemap;

        // Badem 7-8 (ve simetride 16-17) kenarlari: fillet applyFillet78 ile
        // SONRADAN, guncel (duzenlenmis) geometri uzerinde uygulanir.
        // Kaynak oncesi 0-tabanli ciftler: yarim mesh'te (7,8); ayna /
        // ikinci yarim +11 ofsetle (18,19) -> kaynak sonrasi 16-17.
        let creaseEdges = null;
        if (type === 'badem') {
            const preWeldCreases = [[6, 7]];
            if (variant === 'tam' || variant === 'tam-asym') {
                preWeldCreases.push([17, 18]);
            }
            creaseEdges = preWeldCreases.map(function (ce) {
                return [vertexRemap[ce[0]], vertexRemap[ce[1]]];
            });
        }

        let planPoints;
        if (variant === 'tam-asym') {
            planPoints = [cloneV(p1), cloneV(p2), cloneV(p3), cloneV(p4)];
        } else {
            const planP3 = variant === 'sag' ? reflectPointAcrossP1P2(p3, p1, p2) : cloneV(p3);
            planPoints = [cloneV(p1), cloneV(p2), planP3];
        }

        let araMesafe78 = null;
        if (type === 'badem') {
            araMesafe78 = calcAraMesafe78(p1, p2, p3, asaba, cut);
        }

        return {
            type: type,
            variant: variant,
            asaba: asaba,
            bbx: cut.bbx,
            araMesafe: cut.araMesafe,
            araMesafe78: araMesafe78,
            p1: p1, p2: p2, p3: p3, p4: variant === 'tam-asym' ? p4 : null,
            mesh: mesh,
            vertexRemap: vertexRemap,
            creaseEdges: creaseEdges,
            filletInfo: null,
            planPoints: planPoints,
            planTriangle: planPoints.concat([cloneV(planPoints[0])])
        };
    }

    /**
     * Sonuctaki mesh'in KOPYASINA 7-8 / 16-17 fillet'ini uygular.
     * Mesh o anki haliyle (duzenleme modundaki yukseklik degisiklikleri
     * dahil) kullanilir; yay her cagrida guncel yuzey acilarina gore
     * yeniden hesaplanir. Orijinal sonuc degistirilmez.
     */
    function applyFillet78(result, params) {
        params = params || {};
        if (!result || !result.mesh || !result.creaseEdges ||
            result.creaseEdges.length === 0) {
            return result;
        }

        const mesh = {
            vertices: result.mesh.vertices.map(cloneV),
            faces: result.mesh.faces.map(function (f) {
                return [f[0], f[1], f[2]];
            })
        };

        const segments = clampFilletSegments(params.filletSegments);
        const manualSize = (params.autoFilletSize === false)
            ? Number(params.filletSize)
            : null;

        const firstExtraIndex = mesh.vertices.length;
        const creases = [];
        for (let i = 0; i < result.creaseEdges.length; i++) {
            const e = result.creaseEdges[i];
            const info = filletMeshEdge(mesh, e[0], e[1], manualSize, segments);
            if (info) creases.push(info);
        }

        const out = Object.assign({}, result);
        if (creases.length > 0) {
            out.mesh = mesh;
            out.filletInfo = {
                segments: creases[0].segments,
                size: creases[0].size,
                firstExtraIndex: firstExtraIndex,
                creases: creases
            };
        } else {
            out.filletInfo = null;
        }
        return out;
    }

    function getBoundingBox(result) {
        if (!result || !result.mesh) {
            return { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1, width: 1, height: 1, depth: 1 };
        }
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (const p of result.mesh.vertices) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.z < minZ) minZ = p.z;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
            if (p.z > maxZ) maxZ = p.z;
        }
        return {
            minX, minY, minZ, maxX, maxY, maxZ,
            width: maxX - minX,
            height: maxY - minY,
            depth: maxZ - minZ
        };
    }

    function meshToThreeGeometry(mesh) {
        const positions = [];
        const indices = [];
        for (const v of mesh.vertices) {
            positions.push(v.x, v.y, v.z);
        }
        for (const f of mesh.faces) {
            indices.push(f[0], f[1], f[2]);
        }
        return { positions: positions, indices: indices };
    }

    global.MukarnasGeom = {
        generateMukarnas,
        getBoundingBox,
        meshToThreeGeometry,
        weldMeshVertices,
        reflectPointAcrossP1P2,
        v3,
        calcAutoAsaba,
        resolveBbx,
        calcAraMesafeFromBbx,
        calcAraMesafe78,
        autoBbxDivisor,
        filletMeshEdge,
        applyFillet78,
        calcFillet78Auto,
        clampFilletSegments
    };
})(window);
