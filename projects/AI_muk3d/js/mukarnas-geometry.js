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
            planPoints: planPoints,
            planTriangle: planPoints.concat([cloneV(planPoints[0])])
        };
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
        autoBbxDivisor
    };
})(window);
