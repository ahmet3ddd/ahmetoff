// Koseli Mukarnas - docs/mukkap-10_V1.ms
(function (global) {
    'use strict';

    const PHI = 1.618033988749895;

    /**
     * Max kaynagindaki yuzeyler: [[0,2,1],[1,2,3],[2,4,3],[0,4,5],[6,4,0]].
     * [1,2,3] (pp2-pp3-pp4) ust yatay ucgeni hicbir kopyada cizilmez.
     * [6,4,0] (pp7-pp5-pp1) taban ucgeni ise yalniz Z=0'a, yani grid
     * duzlemine oturan hucrelerde (ana dizinin ilki + her siranin ilk
     * elemani) cizilmez; yukaridaki kopyalarda durur. Taban hucrelerinde
     * pp7 (indis 6) hicbir yuzeyde kalmadigi icin kose listesi 6'ya
     * kisaltilir.
     */
    const CELL_FACES = [[0, 2, 1], [2, 4, 3], [0, 4, 5], [6, 4, 0]];
    const CELL_FACES_TABAN = CELL_FACES.slice(0, 3);

    function vec3(x, y, z) {
        return { x: x, y: y, z: z };
    }

    function addOffset(v, o) {
        return vec3(v.x + o.x, v.y + o.y, v.z + o.z);
    }

    /**
     * Hucrenin yerel koseleri. X'te asa, Z'de asabaH, Y'de asabaDerinlik
     * kadar yer kaplar. Y derinligi ayri bir olcudur: A1.5 ile Y=0 duzlemi
     * arasindaki dik mesafe budur.
     */
    function buildCellLocal(asa, asabaH, asabaDerinlik) {
        return [
            vec3(0, 0, 0),
            vec3(0, 0, asabaH),
            vec3(asa, 0, asabaH),
            vec3(asa, asabaDerinlik, asabaH),
            vec3(asa, asabaDerinlik, 0),
            vec3(asa, 0, asabaH),
            vec3(0, asabaDerinlik, 0)
        ];
    }

    function mirrorX(v, planeX) {
        return vec3(2 * planeX - v.x, v.y, v.z);
    }

    function pushCell(cells, asa, asabaH, asabaDerinlik, offset, mirrored) {
        const taban = Math.abs(offset.z) < 1e-9;
        const local = buildCellLocal(asa, asabaH, asabaDerinlik);
        const vertices = (taban ? local.slice(0, 6) : local).map(function (v) {
            return addOffset(v, offset);
        });
        cells.push({
            vertices: vertices,
            faces: taban ? CELL_FACES_TABAN : CELL_FACES,
            taban: taban,
            mirrored: !!mirrored,
            module: mirrored ? 'B' : 'A',
            cellId: mirrored ? null : cells.length
        });
    }

    function stackAlongX(cells, asa, asabaH, asabaDerinlik, asabaAdet) {
        for (let d = 1; d < asabaAdet; d++) {
            pushCell(cells, asa, asabaH, asabaDerinlik, vec3(asa * d, 0, asabaH * d), false);
        }
    }

    function addSiraCopies(cells, asa, asabaH, asabaDerinlik, asabaAdet, sira) {
        if (sira <= 1) return;
        for (let siradizi = 1; siradizi < sira; siradizi++) {
            // siralar Y'de asabaDerinlik kadar geriler
            const y = asabaDerinlik * siradizi;
            pushCell(cells, asa, asabaH, asabaDerinlik, vec3(asa * siradizi, y, 0), false);
            const innerCount = asabaAdet - (siradizi + 1);
            for (let ic = 1; ic <= innerCount; ic++) {
                pushCell(
                    cells,
                    asa,
                    asabaH,
                    asabaDerinlik,
                    vec3(asa * siradizi + asa * ic, y, asabaH * ic),
                    false
                );
            }
        }
    }

    /**
     * Sira adedi asaba adedinden az oldugunda son siranin arkasinda, zeminden
     * ust katmana kadar uzanan bir aciklik kalir. Bu aciklik Y eksenine dik
     * (X-Z duzlemine paralel) tek bir duvarla kapatilir; duvar son siranin
     * merdiven profilini izler, altta zemine, ust-sag ucta simetri duzlemine
     * dayanir. Ornek (sira 1, asaba 4): duvarin sinir noktalari A1.5, A1.4,
     * A2.5, A2.4, ... A4.5 ve A1.5-B1.5 dogrusunun simetri duzlemini kestigi
     * zemin noktasidir. Kolonlara bolunur: i. kolon C(i).5 ile C(i+1).5
     * arasinda, zeminden o basamagin altina kadar uzanan dikdortgendir.
     */
    function buildBackWall(asa, asabaH, asabaDerinlik, asabaAdet, sira) {
        const siradizi = sira - 1;                  // son sira
        const hucreAdet = asabaAdet - siradizi;     // son siradaki hucre sayisi
        if (hucreAdet < 2) return null;             // sira == asaba adedi: aciklik yok

        const yDuvar = asabaDerinlik * (siradizi + 1);
        const vertices = [];
        const faces = [];

        for (let i = 1; i < hucreAdet; i++) {
            const x0 = asa * (siradizi + i);
            const x1 = asa * (siradizi + i + 1);
            const zUst = asabaH * i;
            const b = vertices.length;
            vertices.push(
                vec3(x0, yDuvar, 0),
                vec3(x0, yDuvar, zUst),
                vec3(x1, yDuvar, zUst),
                vec3(x1, yDuvar, 0)
            );
            // normal +Y: duvar modelin disina bakar
            faces.push([b, b + 1, b + 2], [b, b + 2, b + 3]);
        }

        return {
            vertices: vertices,
            faces: faces,
            kind: 'duvar',
            taban: false,
            mirrored: false,
            module: 'A',
            cellId: null
        };
    }

    /**
     * Yanak panelleri (derinlik > 0 iken uretilir). Her hucrenin on yuz
     * ucgeninin iki dik kenari -Y yonune supurulur:
     *   Ai.1 -> Ai.2 : dusey kenar (X = asa*i), Z'de bir asaba h
     *   Ai.2 -> Ai.3 : yatay kenar (Z = asabaH*(i+1)), X'te bir asa
     * Hucreler boyunca bu kenarlar kesintisiz bir merdiven profili
     * olusturur; yanak o profilin derinlik kadar one tasinmis halidir.
     * B modulunde aynalanir.
     */
    function buildYanak(asa, asabaH, asabaAdet, derinlik) {
        if (!(derinlik > 0)) return [];
        const paneller = [];

        function panel(kose) {
            paneller.push({
                vertices: kose,
                faces: [[0, 1, 2], [0, 2, 3]],
                // yalniz dortgen konturu cizilir, ucgen kosegeni gorunmez
                outline: [0, 1, 2, 3],
                kind: 'yanak',
                taban: false,
                mirrored: false,
                module: 'A',
                cellId: null
            });
        }

        for (let i = 0; i < asabaAdet; i++) {
            const xA = asa * i;
            const xB = xA + asa;
            const zA = asabaH * i;
            const zB = zA + asabaH;
            // Ai.1 -> Ai.2 (dusey)
            panel([
                vec3(xA, 0, zA), vec3(xA, 0, zB),
                vec3(xA, -derinlik, zB), vec3(xA, -derinlik, zA)
            ]);
            // Ai.2 -> Ai.3 (yatay)
            panel([
                vec3(xA, 0, zB), vec3(xB, 0, zB),
                vec3(xB, -derinlik, zB), vec3(xA, -derinlik, zB)
            ]);
        }
        return paneller;
    }

    /** Simetri aynasi: X = 0 (YZ duzlemi) */
    function symmetryPlaneX() {
        return 0;
    }

    /** pp5 = kose 5 (a5), indeks 4 */
    const A5_VERTEX_INDEX = 4;

    /** En ust A hucre (max Z pp1; esitlikte max X) */
    function findTopACellIndex(cells) {
        let idx = -1;
        let ref = null;
        const eps = 1e-9;
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].module !== 'A' || cells[i].kind) continue;
            const p = cells[i].vertices[0];
            if (
                !ref ||
                p.z > ref.z + eps ||
                (Math.abs(p.z - ref.z) <= eps && p.x > ref.x + eps) ||
                (Math.abs(p.z - ref.z) <= eps && Math.abs(p.x - ref.x) <= eps && p.y > ref.y + eps)
            ) {
                ref = p;
                idx = i;
            }
        }
        return idx;
    }

    /**
     * Modul A'nin sahnedeki yerlesimi. Yalniz X'te kaydirilir: en ust
     * modulun a5 (pp5) noktasi X=0'a, yani simetri duzlemine oturur.
     * Y ve Z'de kaydirma yoktur:
     *   Y -> ilk modulun yuzu (pp1-pp3-pp2 on duvari) Y=0 duzleminde durur,
     *        model +Y yonune dogru uzar, sonraki siralar bunu izler.
     *   Z -> taban hucreleri zemine (Z=0) oturur, model +Z yonune yukselir;
     *        asaba/sira artinca asagi sarkmaz, yukari dogru cogalir.
     */
    function placeModuleA(cells) {
        const idx = findTopACellIndex(cells);
        if (idx < 0) return { dx: 0, dy: 0, dz: 0 };
        const p5 = cells[idx].vertices[A5_VERTEX_INDEX];
        const dx = -p5.x;
        const dy = 0;
        const dz = 0;
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) < 1e-9) {
            return { dx: 0, dy: 0, dz: 0 };
        }
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].module !== 'A') continue;
            for (let v = 0; v < cells[i].vertices.length; v++) {
                const vert = cells[i].vertices[v];
                vert.x += dx;
                vert.y += dy;
                vert.z += dz;
            }
        }
        return { dx: dx, dy: dy, dz: dz };
    }

    /**
     * Simetri aktifken ayna duzlemine (X=0) tam oturan yuzeyler cizilmez:
     * her siranin en ust hucresinin yan duvari ([2,4,3], pp3-pp5-pp4) bu
     * duzlemdedir ve B modulunun aynadaki esiyle cakisip birbirine yapisan
     * cift yuzey olusturur. Yuzey A'da kaldirilinca aynada B'de de olmaz.
     */
    function removeSymmetryPlaneFaces(cells, eps) {
        const planeX = symmetryPlaneX();
        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            const onPlane = function (vi) {
                return Math.abs(c.vertices[vi].x - planeX) < eps;
            };
            c.faces = c.faces.filter(function (f) {
                return !(onPlane(f[0]) && onPlane(f[1]) && onPlane(f[2]));
            });
        }
    }

    function applySymmetryMirror(cells) {
        const planeX = symmetryPlaneX();
        const mirrored = [];
        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            const verts = c.vertices.map(function (v) {
                return mirrorX(v, planeX);
            });
            const faces = c.faces.map(function (f) {
                return [f[0], f[2], f[1]];
            });
            mirrored.push({
                vertices: verts,
                faces: faces,
                outline: c.outline,
                kind: c.kind,
                taban: c.taban,
                mirrored: true,
                module: 'B',
                cellId: c.cellId
            });
        }
        return cells.concat(mirrored);
    }

    /**
     * Yukseklik cozumu. Altin oran acikken olcu orandan uretilir; manuel
     * degerler burada tuketilmez, cagiran tarafta saklanip oran kapaninca
     * geri kullanilir. Oran kapaliyken hangi alanin elle girildigi
     * (params.hKaynak: 'asaba' | 'toplam') belirleyicidir, digeri ondan
     * turetilir; boylece iki alan birbiriyle celismez.
     */
    function resolveHeights(params, p1p2mesafe) {
        const asabaAdet = Math.max(1, Math.floor(Number(params.asabaAdet) || 1));
        const asa = p1p2mesafe / asabaAdet;
        const altinOran = params.altinOran !== false;
        let asabaH = Number(params.asabaH) || 0;
        let toplamH = Number(params.toplamH) || 0;

        if (altinOran) {
            asabaH = asa * PHI;
            toplamH = asabaH * asabaAdet;
        } else if (params.hKaynak === 'asaba' && asabaH > 0) {
            toplamH = asabaH * asabaAdet;
        } else if (toplamH > 0) {
            asabaH = toplamH / asabaAdet;
        } else if (asabaH > 0) {
            toplamH = asabaH * asabaAdet;
        } else {
            asabaH = asa * PHI;
            toplamH = asabaH * asabaAdet;
        }

        return {
            asa: asa,
            asabaH: Math.max(0.001, asabaH),
            toplamH: toplamH,
            asabaAdet: asabaAdet
        };
    }

    /**
     * Derinlik cozumu (yukseklik cozumunun Y eksenindeki esi). Olcu, A1.5
     * ile Y=0 duzlemi arasindaki dik mesafedir; siralar Y'de bu kadar
     * gerileyerek dizildigi icin toplam = asaba derinligi x sira. Hangi
     * alanin elle girildigi (params.dKaynak: 'asaba' | 'toplam') belirleyici,
     * digeri ondan turetilir. Ikisi de bos ise hucre plandaki karesel
     * halini korur: derinlik = asa.
     */
    function resolveDepths(params, asa, sira) {
        const girilenAsaba = Number(params.asabaDerinlik) || 0;
        const girilenToplam = Number(params.toplamDerinlik) || 0;

        // Yalniz kaynak alan belirleyicidir: bos/0 ise otomatige donulur,
        // diger alanin eski degerine kayilmaz.
        let asabaDerinlik = 0;
        if (params.dKaynak === 'asaba') {
            asabaDerinlik = girilenAsaba;
        } else if (params.dKaynak === 'toplam') {
            asabaDerinlik = girilenToplam > 0 ? girilenToplam / sira : 0;
        }

        const otomatik = !(asabaDerinlik > 0);
        if (otomatik) asabaDerinlik = asa;

        return {
            asabaDerinlik: Math.max(0.001, asabaDerinlik),
            toplamDerinlik: asabaDerinlik * sira,
            otomatik: otomatik
        };
    }

    function generateMukarnas(params) {
        const aciklik = Math.max(0.001, Number(params.aciklik) || 100);
        const p1p2mesafe = aciklik / 2;
        let sira = Math.max(1, Math.floor(Number(params.sira) || 1));

        const dims = resolveHeights(params, p1p2mesafe);
        const asabaAdet = dims.asabaAdet;
        const asa = dims.asa;
        const asabaH = dims.asabaH;

        if (sira > asabaAdet) sira = asabaAdet;

        const derinlikler = resolveDepths(params, asa, sira);
        const asabaDerinlik = derinlikler.asabaDerinlik;

        const cells = [];
        pushCell(cells, asa, asabaH, asabaDerinlik, vec3(0, 0, 0), false);
        stackAlongX(cells, asa, asabaH, asabaDerinlik, asabaAdet);
        addSiraCopies(cells, asa, asabaH, asabaDerinlik, asabaAdet, sira);

        const arkaDuvar = buildBackWall(asa, asabaH, asabaDerinlik, asabaAdet, sira);
        if (arkaDuvar) cells.push(arkaDuvar);

        const derinlik = Math.max(0, Number(params.derinlik) || 0);
        const yanaklar = buildYanak(asa, asabaH, asabaAdet, derinlik);
        for (let i = 0; i < yanaklar.length; i++) cells.push(yanaklar[i]);

        const shiftA = placeModuleA(cells);
        const shiftX = shiftA.dx;
        const showModuleB = !!params.showModuleB;

        if (showModuleB) {
            removeSymmetryPlaneFaces(cells, asa * 1e-6);
            const all = applySymmetryMirror(cells);
            cells.length = 0;
            for (let i = 0; i < all.length; i++) cells.push(all[i]);
        }

        const edges = collectEdges(cells);

        return {
            aciklik: aciklik,
            p1p2mesafe: p1p2mesafe,
            asa: asa,
            asabaH: asabaH,
            asabaAdet: asabaAdet,
            toplamH: dims.toplamH,
            asabaDerinlik: asabaDerinlik,
            toplamDerinlik: derinlikler.toplamDerinlik,
            derinlikOtomatik: derinlikler.otomatik,
            derinlik: derinlik,
            sira: sira,
            shiftX: shiftX,
            shiftY: shiftA.dy,
            shiftZ: shiftA.dz,
            showModuleB: showModuleB,
            symmetryPlaneX: symmetryPlaneX(),
            cells: cells,
            edges: edges,
            planPolylines: edgesToPlanPolylines(edges),
            elevPolylines: edgesToElevPolylines(edges),
            bbox: getBoundingBox3D(cells),
            error: null
        };
    }

    function edgeKey(a, b) {
        const ka = a.x + ',' + a.y + ',' + a.z;
        const kb = b.x + ',' + b.y + ',' + b.z;
        return ka < kb ? ka + '|' + kb : kb + '|' + ka;
    }

    /**
     * Tel kafes kenarlari. Arka duvar tek parca gorunmeli, o yuzden hic
     * kenar vermez. Bir hucrede 'outline' varsa (yanak panelleri) yalniz o
     * kontur cizilir; ucgenleme kosegenleri disarida kalir.
     */
    function collectEdges(cells) {
        const seen = {};
        const edges = [];

        function addEdge(a, b) {
            const k = edgeKey(a, b);
            if (seen[k]) return;
            seen[k] = true;
            edges.push({ a: a, b: b });
        }

        for (let c = 0; c < cells.length; c++) {
            const cell = cells[c];
            if (cell.kind === 'duvar') continue;
            const verts = cell.vertices;

            if (cell.outline) {
                const o = cell.outline;
                for (let i = 0; i < o.length; i++) {
                    addEdge(verts[o[i]], verts[o[(i + 1) % o.length]]);
                }
                continue;
            }

            const faces = cell.faces;
            for (let f = 0; f < faces.length; f++) {
                const tri = faces[f];
                addEdge(verts[tri[0]], verts[tri[1]]);
                addEdge(verts[tri[1]], verts[tri[2]]);
                addEdge(verts[tri[2]], verts[tri[0]]);
            }
        }
        return edges;
    }

    function edgesToPlanPolylines(edges) {
        return edges.map(function (e) {
            return [
                { x: e.a.x, y: e.a.y },
                { x: e.b.x, y: e.b.y }
            ];
        });
    }

    function edgesToElevPolylines(edges) {
        return edges.map(function (e) {
            return [
                { x: e.a.x, y: e.a.z },
                { x: e.b.x, y: e.b.z }
            ];
        });
    }

    function getBoundingBox3D(cells) {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (let c = 0; c < cells.length; c++) {
            const verts = cells[c].vertices;
            for (let i = 0; i < verts.length; i++) {
                const v = verts[i];
                if (v.x < minX) minX = v.x;
                if (v.y < minY) minY = v.y;
                if (v.z < minZ) minZ = v.z;
                if (v.x > maxX) maxX = v.x;
                if (v.y > maxY) maxY = v.y;
                if (v.z > maxZ) maxZ = v.z;
            }
        }
        if (!isFinite(minX)) {
            return { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1, width: 1, height: 1, depth: 1 };
        }
        return {
            minX: minX, minY: minY, minZ: minZ,
            maxX: maxX, maxY: maxY, maxZ: maxZ,
            width: maxX - minX,
            height: maxZ - minZ,
            depth: maxY - minY
        };
    }

    function getBoundingBox2D(polylines) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < polylines.length; i++) {
            const pl = polylines[i];
            for (let j = 0; j < pl.length; j++) {
                const p = pl[j];
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            }
        }
        if (!isFinite(minX)) {
            return { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 };
        }
        return {
            minX: minX, minY: minY, maxX: maxX, maxY: maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    function mergeMeshBuffers(resultOrCells) {
        const cells = resultOrCells.cells || resultOrCells;
        const positions = [];
        const indices = [];
        let base = 0;
        for (let c = 0; c < cells.length; c++) {
            const cell = cells[c];
            const verts = cell.vertices;
            const faces = cell.faces;
            for (let i = 0; i < verts.length; i++) {
                positions.push(verts[i].x, verts[i].y, verts[i].z);
            }
            for (let f = 0; f < faces.length; f++) {
                const tri = faces[f];
                indices.push(base + tri[0], base + tri[1], base + tri[2]);
            }
            base += verts.length;
        }
        return { positions: positions, indices: indices };
    }

    /** Max pp1..pp7 kose numaralari (1 tabanli) */
    const VERTEX_LABELS = [1, 2, 3, 4, 5, 6, 7];

    global.MukarnasGeom = {
        PHI: PHI,
        VERTEX_LABELS: VERTEX_LABELS,
        generateMukarnas: generateMukarnas,
        getBoundingBox2D: getBoundingBox2D,
        getBoundingBox3D: getBoundingBox3D,
        mergeMeshBuffers: mergeMeshBuffers
    };
})(window);
