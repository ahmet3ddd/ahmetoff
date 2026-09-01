// Ortak mesh uretici (viewer-3d + export-stl tarafindan kullanilir)
(function (global) {
    'use strict';

    const Geom = global.RevzenGeom;

    const HOLE_SEGMENTS = 18;

    function toVec2(ring) {
        const out = new Array(ring.length);
        for (let i = 0; i < ring.length; i++) {
            out[i] = new global.THREE.Vector2(ring[i].x, ring[i].y);
        }
        return out;
    }

    function shapeFromRing(ring) {
        return new global.THREE.Shape(toVec2(ring));
    }

    function pathFromRing(ring) {
        return new global.THREE.Path(toVec2(ring));
    }

    function extrude(shape, depth) {
        const g = new global.THREE.ExtrudeGeometry(shape, {
            depth: depth,
            bevelEnabled: false,
            curveSegments: 8,
            steps: 1
        });
        g.translate(0, 0, -depth / 2);
        g.computeVertexNormals();
        return g;
    }

    // Cerceve: dis kontur, ic kontur delik olarak. Derinlik = cerceveDerinlik.
    function buildFrameGeometry(result, depth) {
        if (!result || !result.outer || !result.inner) return null;
        const d = Math.max(0.001, Number(depth) || 0);
        const shape = shapeFromRing(result.outer);
        shape.holes.push(pathFromRing(result.inner));
        return extrude(shape, d);
    }

    // Panel (alci levha): ic kontur, gozler delik olarak. Derinlik = panelDerinlik.
    // Goz konturu hazir poligon olarak gelir (daire, filgozu veya kirpilmis parca).
    function buildPanelGeometry(result, depth) {
        if (!result || !result.inner) return null;
        const d = Math.max(0.001, Number(depth) || 0);
        const shape = shapeFromRing(result.inner);
        const goz = result.goz || [];
        for (let i = 0; i < goz.length; i++) {
            const poly = goz[i].poly ||
                Geom.circlePoly(goz[i].x, goz[i].y, goz[i].r, HOLE_SEGMENTS);
            if (poly.length < 3) continue;
            shape.holes.push(pathFromRing(poly));
        }
        return extrude(shape, d);
    }

    // Renkli cam levhalari: her renk icin tek bir birlesik geometri.
    // Tum goz konturlari konveks (daire, filgozu ve bunlarin yari-duzlem
    // kirpimlari), bu yuzden agirlik merkezinden yelpaze ucgenleme gecerli.
    function buildGlassGeometries(result) {
        const goz = (result && result.goz) || [];
        if (goz.length === 0) return [];

        const pal = result.palette || Geom.CAM_PALET;
        const buckets = new Array(pal.length);
        for (let i = 0; i < pal.length; i++) buckets[i] = [];
        for (const h of goz) {
            const poly = h.poly || Geom.circlePoly(h.x, h.y, h.r, 20);
            if (poly.length < 3) continue;
            buckets[h.ci % pal.length].push(poly);
        }

        const out = [];
        for (let ci = 0; ci < pal.length; ci++) {
            const list = buckets[ci];
            if (list.length === 0) continue;

            let triCount = 0;
            for (const p of list) triCount += p.length;

            const pos = new Float32Array(triCount * 9);
            const nrm = new Float32Array(triCount * 9);
            let o = 0;

            for (const p of list) {
                let gx = 0, gy = 0;
                for (const q of p) { gx += q.x; gy += q.y; }
                gx /= p.length; gy /= p.length;

                for (let s = 0; s < p.length; s++) {
                    const A = p[s], B = p[(s + 1) % p.length];
                    pos[o]     = gx;  pos[o + 1] = gy;  pos[o + 2] = 0;
                    pos[o + 3] = A.x; pos[o + 4] = A.y; pos[o + 5] = 0;
                    pos[o + 6] = B.x; pos[o + 7] = B.y; pos[o + 8] = 0;
                    nrm[o] = 0; nrm[o + 1] = 0; nrm[o + 2] = 1;
                    nrm[o + 3] = 0; nrm[o + 4] = 0; nrm[o + 5] = 1;
                    nrm[o + 6] = 0; nrm[o + 7] = 0; nrm[o + 8] = 1;
                    o += 9;
                }
            }

            const g = new global.THREE.BufferGeometry();
            g.setAttribute('position', new global.THREE.BufferAttribute(pos, 3));
            g.setAttribute('normal',   new global.THREE.BufferAttribute(nrm, 3));
            out.push({ color: pal[ci], geometry: g });
        }
        return out;
    }

    global.RevzenMesh = {
        buildFrameGeometry: buildFrameGeometry,
        buildPanelGeometry: buildPanelGeometry,
        buildGlassGeometries: buildGlassGeometries,
        HOLE_SEGMENTS: HOLE_SEGMENTS
    };
})(window);
