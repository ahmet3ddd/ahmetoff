// Köşe Mukarnas geometri — docs/23-v1.ms portu (global, file:// uyumlu)
(function (global) {
    'use strict';

    const PHI = 1.618;
    const COLOR_MAIN = 0x64c864;
    const COLOR_YANAK = 0x96c864;

    /**
     * 2D plan katmanları (DXF katman adları da bunlar):
     *   PLAN   - kullanıcının seçtiği plan üçgeni
     *   BOLUM  - birinci asabanın x ölçüsü kenarları (P1-pp2, P1-pp3)
     *   HUCRE  - asaba baklavaları + köşegenleri (mukarnas plan kafesi)
     *   KONTUR - kafesin dış sınırı (kademeli/merdivenli kontur)
     *   YANAK  - yanak panellerinin plandaki izi (derinlik > 0 ise)
     */
    const EDGE_LAYERS = ['PLAN', 'BOLUM', 'HUCRE', 'KONTUR', 'YANAK'];

    /** |P1–P3| ile |P1–P2| arasındaki bağıl fark bu oranı aşarsa uyarı verilir. */
    const KENAR_TOLERANS = 0.005;

    function kenarFarkOrani(a, b) {
        const ref = Math.max(Math.abs(a), Math.abs(b));
        return ref > 1e-9 ? Math.abs(a - b) / ref : 0;
    }

    /**
     * P3'ü, P1'e göre yönünü koruyarak |P1–P2| uzaklığına oturtur (eşit kenar).
     * P3 ile P1 çakışıksa P1–P2'ye dik yön kullanılır.
     */
    function esitKenarP3(plan) {
        const p1 = plan.p1;
        const p2 = plan.p2;
        const p3 = plan.p3;
        const hedef = dist2d(p1, p2);
        if (!(hedef > 1e-9)) return { x: p3.x, y: p3.y };

        let dx = p3.x - p1.x;
        let dy = p3.y - p1.y;
        let len = Math.hypot(dx, dy);
        if (len < 1e-9) {
            // yön yoksa: P1–P2'yi +90° döndür
            dx = -(p2.y - p1.y);
            dy = (p2.x - p1.x);
            len = Math.hypot(dx, dy);
            if (len < 1e-9) return { x: p3.x, y: p3.y };
        }
        return {
            x: p1.x + (dx / len) * hedef,
            y: p1.y + (dy / len) * hedef
        };
    }

    function v3(x, y, z) {
        return { x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 };
    }

    /** 3ds Max: Z yukarı, plan XY. Three.js: Y yukarı, yer düzlemi XZ. */
    function maxToThree(p) {
        return v3(p.x, p.z, p.y);
    }

    function getBoundingBoxThree(bb) {
        const corners = [
            maxToThree(v3(bb.minX, bb.minY, bb.minZ)),
            maxToThree(v3(bb.maxX, bb.maxY, bb.maxZ)),
            maxToThree(v3(bb.minX, bb.maxY, bb.minZ)),
            maxToThree(v3(bb.maxX, bb.minY, bb.maxZ))
        ];
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (let i = 0; i < corners.length; i++) {
            const p = corners[i];
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

    function dist2d(a, b) {
        return Math.hypot(b.x - a.x, b.y - a.y);
    }

    function lerp3(a, b, t) {
        return v3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t
        );
    }

    function sub(a, b) {
        return v3(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    function normalize(v) {
        const len = Math.hypot(v.x, v.y, v.z) || 1;
        return v3(v.x / len, v.y / len, v.z / len);
    }

    function refinePlanPoints(p1, p2, p3, asa, p1p2mesafe) {
        const t = p1p2mesafe > 1e-9 ? asa / p1p2mesafe : 0;
        const pp1 = v3(p1.x, p1.y, p1.z);
        const pp2 = lerp3(p1, p2, t);
        const pp3 = lerp3(p3, p1, 1 - t);
        const pp2h = v3(pp2.x, pp2.y, pp2.z);
        const pp3h = v3(pp3.x, pp3.y, pp3.z);
        const pp3kopyafark = Math.sqrt(asa * asa / 2);
        return { pp1, pp2, pp3, pp2h, pp3h, pp3kopyafark };
    }

    function computeKeyPoints(plan, asa, asabaH, asabaAdet) {
        const p1 = v3(plan.p1.x, plan.p1.y, plan.p1.z || 0);
        const p2 = v3(plan.p2.x, plan.p2.y, plan.p2.z || 0);
        const p3 = v3(plan.p3.x, plan.p3.y, plan.p3.z || 0);
        const p1p2mesafe = dist2d(p1, p2);
        const refined = refinePlanPoints(p1, p2, p3, asa, p1p2mesafe);

        // Vektörel Açıortay Hesabı
        const v_p1_pp2 = sub(refined.pp2, refined.pp1);
        const v_p1_pp3 = sub(refined.pp3, refined.pp1);

        const pp1arka = v3(
            refined.pp1.x + v_p1_pp2.x + v_p1_pp3.x,
            refined.pp1.y + v_p1_pp2.y + v_p1_pp3.y,
            refined.pp3.z + asabaH * (asabaAdet - 1)
        );

        return Object.assign({ p1, p2, p3, p1p2mesafe, pp1arka }, refined);
    }

    function faceNormal(vertices, face) {
        const a = vertices[face[0]];
        const b = vertices[face[1]];
        const c = vertices[face[2]];
        const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
        const vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
        return v3(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    }

    /**
     * Yatay yüzeylerin normalini yukarı çevirir (malzeme altta kalır).
     * Aşağı bakan yatay yüzeyler tek yüzlü çizen programlarda (AutoCAD /
     * 3ds Max gölgeli görünüm, STL dilimleyiciler) görünmez kalıyordu;
     * özellikle yanak şeritleri bu yüzden DXF'te kaybolmuş görünüyordu.
     * Eğik ve düşey yüzeylerin özgün yönü korunur.
     */
    function orientFacesUp(meshes) {
        for (let m = 0; m < meshes.length; m++) {
            const mesh = meshes[m];
            mesh.faces = mesh.faces.map(function (face) {
                if (face.length < 3) return face.slice();
                const n = faceNormal(mesh.vertices, face);
                const yatay = Math.abs(n.z) > Math.hypot(n.x, n.y);
                return (yatay && n.z < -1e-9) ? face.slice().reverse() : face.slice();
            });
        }
        return meshes;
    }

    function offsetMesh(vertices, faces, dx, dy, dz) {
        const verts = vertices.map(function (p) {
            return v3(p.x + dx, p.y + dy, p.z + dz);
        });
        return {
            vertices: verts,
            faces: faces.map(function (f) { return f.slice(); })
        };
    }

    /** * YENİ: Sadece ön taraftaki (P2 ve P3'e bakan) belirli kenarları dik olarak aşağı indirir.
     * P1'e uzanan uzun iç kenarları aşağı indirmez, yanakları kutu olmaktan kurtarır.
     */
    function extrudeSpecificEdgeDown(vertices, faces, edgeStart, edgeEnd, distance) {
        const newVerts = vertices.map(function(p) { return v3(p.x, p.y, p.z); });
        const newFaces = faces.map(function(f) { return f.slice(); });

        if (edgeStart == null || edgeEnd == null) return { vertices: newVerts, faces: newFaces };

        const vStart = vertices[edgeStart];
        const vEnd = vertices[edgeEnd];

        const idxDropStart = newVerts.length;
        newVerts.push(v3(vStart.x, vStart.y, vStart.z - distance));
        
        const idxDropEnd = newVerts.length;
        newVerts.push(v3(vEnd.x, vEnd.y, vEnd.z - distance));

        // Dikdörtgen yüzeyi oluştur (Ön yüzey)
        newFaces.push([idxDropStart, idxDropEnd, edgeEnd]);
        newFaces.push([idxDropStart, edgeEnd, edgeStart]);

        return { vertices: newVerts, faces: newFaces };
    }

    function buildMainMesh(kp, asabaH, asabaAdet) {
        const zTop = asabaH * asabaAdet;
        const zLow = asabaH * (asabaAdet - 1);

        const vertices = [
            v3(kp.pp1.x, kp.pp1.y, kp.pp1.z + zTop),
            v3(kp.pp2.x, kp.pp2.y, kp.pp2.z + zLow),
            v3(kp.pp3.x, kp.pp3.y, kp.pp3.z + zLow),
            v3(kp.pp2h.x, kp.pp2h.y, kp.pp2h.z + zTop),
            v3(kp.pp3h.x, kp.pp3h.y, kp.pp3h.z + zTop),
            v3(kp.pp1arka.x, kp.pp1arka.y, kp.pp1arka.z)
        ];

        const faces = [
            [0, 2, 1],
            [0, 1, 3],
            [0, 4, 2],
            [1, 2, 5]      // pp2–pp3–pp1arka: yatay arka yüzey
        ];

        // pp1arka'ya bağlı yüzey yataydır ve taban sırasında tam Z=0'a, yani grid
        // düzlemine oturur. O sıradaki hücrelerde bu yüzey de pp1arka noktası da
        // üretilmez (indis 5 kullanılmadığı için köşe listesi 5'e kısaltılır).
        const arkasizVerts = vertices.slice(0, 5);
        const arkasizFaces = faces.slice(0, 3);

        function govde(dizi) {
            const arkaZ = asabaH * (asabaAdet - 1 - dizi);
            return arkaZ <= 1e-9
                ? { vertices: arkasizVerts, faces: arkasizFaces }
                : { vertices: vertices, faces: faces };
        }

        const tepe = govde(0);
        const meshes = [{
            name: 'Kose_mukarnas',
            color: COLOR_MAIN,
            vertices: tepe.vertices,
            faces: tepe.faces
        }];

        if (asabaAdet > 1) {
            const v_edge2 = sub(kp.pp2, kp.pp1);
            const v_edge3 = sub(kp.pp3, kp.pp1);

            for (let dizi = 1; dizi <= asabaAdet - 1; dizi++) {
                const g = govde(dizi);
                const dx1 = v_edge2.x * dizi;
                const dy1 = v_edge2.y * dizi;
                const o1 = offsetMesh(g.vertices, g.faces, dx1, dy1, -asabaH * dizi);
                meshes.push({
                    name: 'Kose_mukarnas_kopya_' + dizi,
                    color: COLOR_MAIN,
                    vertices: o1.vertices,
                    faces: o1.faces
                });

                for (let icdizi = 1; icdizi <= dizi; icdizi++) {
                    const a = dizi - icdizi;
                    const b = icdizi;
                    const dx2 = v_edge2.x * a + v_edge3.x * b;
                    const dy2 = v_edge2.y * a + v_edge3.y * b;
                    const o2 = offsetMesh(g.vertices, g.faces, dx2, dy2, -asabaH * dizi);
                    meshes.push({
                        name: 'Kose_mukarnas_ickopya_' + dizi + '_' + icdizi,
                        color: COLOR_MAIN,
                        vertices: o2.vertices,
                        faces: o2.faces
                    });
                }
            }
        }

        return meshes;
    }

    function buildYanakPanel(kp, asabaH, asabaAdet, derinlik, facePair, edgeStart, edgeEnd) {
        const zTop = asabaH * asabaAdet;
        const zLow = asabaH * (asabaAdet - 1);

        const vec2 = sub(kp.pp2h, kp.pp1);
        const vec3 = sub(kp.pp3h, kp.pp1);

        let n2 = normalize(v3(vec2.y, -vec2.x, 0));
        if (n2.x * vec3.x + n2.y * vec3.y > 0) { 
            n2 = v3(-n2.x, -n2.y, 0);
        }

        let n3 = normalize(v3(vec3.y, -vec3.x, 0));
        if (n3.x * vec2.x + n3.y * vec2.y > 0) {
            n3 = v3(-n3.x, -n3.y, 0);
        }

        const off2 = v3(n2.x * derinlik, n2.y * derinlik, 0);
        const off3 = v3(n3.x * derinlik, n3.y * derinlik, 0);

        const pp10 = v3(kp.pp1.x + off2.x, kp.pp1.y + off2.y, kp.pp1.z + zTop);
        const pp9  = v3(kp.pp2h.x + off2.x, kp.pp2h.y + off2.y, kp.pp2h.z + zTop);
        
        const pp8 = v3(kp.pp1.x + off3.x, kp.pp1.y + off3.y, kp.pp1.z + zTop);
        const pp7 = v3(kp.pp3h.x + off3.x, kp.pp3h.y + off3.y, kp.pp3h.z + zTop);

        let pp11 = v3(kp.pp1.x + off2.x + off3.x, kp.pp1.y + off2.y + off3.y, kp.pp1.z + zTop);
        const det = vec2.x * vec3.y - vec2.y * vec3.x;
        if (Math.abs(det) > 1e-6) {
            const dx = pp8.x - pp10.x;
            const dy = pp8.y - pp10.y;
            const t = (dx * vec3.y - dy * vec3.x) / det;
            pp11 = v3(pp10.x + t * vec2.x, pp10.y + t * vec2.y, kp.pp1.z + zTop);
        }

        const vertices = [
            v3(kp.pp1.x, kp.pp1.y, kp.pp1.z + zTop),        // 0: pp1
            v3(kp.pp2.x, kp.pp2.y, kp.pp2.z + zLow),        // 1: pp2
            v3(kp.pp3.x, kp.pp3.y, kp.pp3.z + zLow),        // 2: pp3
            v3(kp.pp2h.x, kp.pp2h.y, kp.pp2h.z + zTop),     // 3: pp2h
            v3(kp.pp3h.x, kp.pp3h.y, kp.pp3h.z + zTop),     // 4: pp3h
            v3(kp.pp1arka.x, kp.pp1arka.y, kp.pp1arka.z),   // 5: pp1arka
            pp7,                                            // 6: pp7
            pp8,                                            // 7: pp8
            pp9,                                            // 8: pp9
            pp10,                                           // 9: pp10
            pp11                                            // 10: pp11
        ];

        const faces = facePair.map(function (f) {
            return [f[0] - 1, f[1] - 1, f[2] - 1];
        });

        if (edgeStart !== null && edgeEnd !== null) {
            return extrudeSpecificEdgeDown(vertices, faces, edgeStart, edgeEnd, asabaH);
        }
        return { vertices: vertices, faces: faces };
    }

    function buildYanakMeshes(kp, asabaH, asabaAdet, derinlik) {
        if (derinlik <= 0) return [];

        const panels = [
            // yanak: Sadece pp7(6) ile pp3h(4) arasındaki P3 tarafına bakan kısa kenar aşağı iniyor. P1'e uzanan uzun kenarlar inmiyor.
            { name: 'yanak', facePair: [[7, 5, 1], [8, 7, 1]], edgeStart: 6, edgeEnd: 4 },
            
            // yyanak: Sadece pp2h(3) ile pp9(8) arasındaki P2 tarafına bakan kısa kenar aşağı iniyor. P1'e uzanan uzun kenarlar inmiyor.
            { name: 'yyanak', facePair: [[4, 9, 1], [10, 1, 9]], edgeStart: 3, edgeEnd: 8 },
            
            // yyyanak (P1 arkası bağlayıcı köşe): dik inen yüzeyi yok.
            { name: 'yyyanak', facePair: [[8, 1, 11], [10, 11, 1]], edgeStart: null, edgeEnd: null }
        ];

        const meshes = [];
        for (let i = 0; i < panels.length; i++) {
            const p = panels[i];
            const geom = buildYanakPanel(
                kp, asabaH, asabaAdet, derinlik, p.facePair, p.edgeStart, p.edgeEnd
            );
            meshes.push({
                name: p.name,
                color: COLOR_YANAK,
                vertices: geom.vertices,
                faces: geom.faces
            });
        }

        if (asabaAdet > 1) {
            const v_edge2 = sub(kp.pp2, kp.pp1);
            const v_edge3 = sub(kp.pp3, kp.pp1);
            
            const bases = meshes.filter(function (b) {
                return b.name === 'yanak' || b.name === 'yyanak';
            });
            
            for (let dizi = 1; dizi <= asabaAdet - 1; dizi++) {
                for (let m = 0; m < bases.length; m++) {
                    const b = bases[m];
                    const dx = b.name === 'yanak' ? v_edge3.x * dizi : v_edge2.x * dizi;
                    const dy = b.name === 'yanak' ? v_edge3.y * dizi : v_edge2.y * dizi;
                    
                    const o = offsetMesh(b.vertices, b.faces, dx, dy, -asabaH * dizi);
                    meshes.push({
                        name: b.name + '_k' + dizi,
                        color: COLOR_YANAK,
                        vertices: o.vertices,
                        faces: o.faces
                    });
                }
            }
        }

        return meshes;
    }

    function resolveAsa(p1p2mesafe, asabaAdet, xManuel, asaInput) {
        if (xManuel) {
            const v = Number(asaInput);
            return Number.isFinite(v) && v > 0 ? v : p1p2mesafe;
        }
        if (asabaAdet > 1) {
            return p1p2mesafe / asabaAdet;
        }
        return p1p2mesafe;
    }

    /**
     * Plan kafesinin taban vektörleri: pp1 orijin, v2 = pp1->pp2, v3 = pp1->pp3.
     * Bir hücrenin (asabanın) plandaki izi bu iki vektörün gerdiği baklavadır.
     */
    function planLatticeVectors(kp) {
        return {
            o: { x: kp.pp1.x, y: kp.pp1.y },
            v2: { x: kp.pp2.x - kp.pp1.x, y: kp.pp2.y - kp.pp1.y },
            v3: { x: kp.pp3.x - kp.pp1.x, y: kp.pp3.y - kp.pp1.y }
        };
    }

    /**
     * Yalnız tek hücreye ait kalan kenarlardan dış konturu tek bir kapalı
     * polyline olarak dolaştırır. Beklenmeyen topolojide boş döner.
     */
    function traceOutline(sides, pt) {
        const adj = {};
        const nodes = {};

        Object.keys(sides).forEach(function (key) {
            const s = sides[key];
            if (s.count !== 1) return;
            const ka = s.a[0] + ':' + s.a[1];
            const kb = s.b[0] + ':' + s.b[1];
            nodes[ka] = s.a;
            nodes[kb] = s.b;
            (adj[ka] = adj[ka] || []).push(kb);
            (adj[kb] = adj[kb] || []).push(ka);
        });

        const keys = Object.keys(adj).sort();
        if (keys.length < 3) return [];

        const visited = {};
        const loop = [keys[0]];
        visited[keys[0]] = true;
        let cur = keys[0];

        while (true) {
            const next = (adj[cur] || []).filter(function (k) { return !visited[k]; })[0];
            if (!next) break;
            visited[next] = true;
            loop.push(next);
            cur = next;
        }

        if (loop.length !== keys.length) return [];

        return loop.map(function (k) { return pt(nodes[k][0], nodes[k][1]); });
    }

    /**
     * Plandaki asaba yerleşimi: (a,b) tam sayı kafes noktalarında a+b <= adet-1
     * olan her hücre bir baklava. MaxScript'teki kopya/ickopya dizilişinin
     * plandaki birebir karşılığıdır (dış sınır kademeli/merdivenlidir).
     */
    function collectPlanLayout(kp, asabaAdet) {
        const n = Math.max(1, Math.floor(asabaAdet));
        const L = planLatticeVectors(kp);
        const sides = {};
        const cells = [];
        const edges = [];

        function pt(a, b) {
            return {
                x: L.o.x + L.v2.x * a + L.v3.x * b,
                y: L.o.y + L.v2.y * a + L.v3.y * b
            };
        }

        function countSide(a1, b1, a2, b2) {
            const k1 = a1 + ':' + b1;
            const k2 = a2 + ':' + b2;
            const key = k1 < k2 ? k1 + '|' + k2 : k2 + '|' + k1;
            if (sides[key]) {
                sides[key].count++;
            } else {
                sides[key] = { count: 1, a: [a1, b1], b: [a2, b2] };
            }
        }

        for (let dizi = 0; dizi < n; dizi++) {
            // Taban sırasında pp1arka yüzeyi Z=0'a (grid düzlemine) otururdu; o
            // yüzey üretilmediği için hücrenin plandaki izi baklava değil üçgendir.
            const taban = (dizi === n - 1);

            for (let b = 0; b <= dizi; b++) {
                const a = dizi - b;
                const c00 = pt(a, b);
                const c10 = pt(a + 1, b);
                const c11 = pt(a + 1, b + 1);
                const c01 = pt(a, b + 1);

                if (taban) {
                    cells.push({
                        level: dizi,
                        a: a,
                        b: b,
                        points: [c00, c10, c01],
                        diag: null
                    });
                    edges.push({ layer: 'HUCRE', points: [c00, c10, c01], closed: true });

                    countSide(a, b, a + 1, b);
                    countSide(a + 1, b, a, b + 1);   // hipotenüs (eski köşegen)
                    countSide(a, b + 1, a, b);
                } else {
                    cells.push({
                        level: dizi,
                        a: a,
                        b: b,
                        points: [c00, c10, c11, c01],
                        diag: [c10, c01]
                    });
                    edges.push({ layer: 'HUCRE', points: [c00, c10, c11, c01], closed: true });
                    edges.push({ layer: 'HUCRE', points: [c10, c01], closed: false });

                    countSide(a, b, a + 1, b);
                    countSide(a + 1, b, a + 1, b + 1);
                    countSide(a + 1, b + 1, a, b + 1);
                    countSide(a, b + 1, a, b);
                }
            }
        }

        const outline = traceOutline(sides, pt);
        if (outline.length > 2) {
            edges.push({ layer: 'KONTUR', points: outline, closed: true });
        }

        return { cells: cells, edges: edges, outline: outline };
    }

    /** Kullanıcının verdiği plan üçgeni + birinci asabanın x ölçüsü kenarları. */
    function collectEdges2d(plan, kp) {
        return [
            {
                layer: 'PLAN',
                points: [plan.p1, plan.p2, plan.p3, plan.p1],
                closed: true
            },
            {
                layer: 'BOLUM',
                points: [
                    { x: plan.p1.x, y: plan.p1.y },
                    { x: kp.pp2.x, y: kp.pp2.y }
                ],
                closed: false
            },
            {
                layer: 'BOLUM',
                points: [
                    { x: plan.p1.x, y: plan.p1.y },
                    { x: kp.pp3.x, y: kp.pp3.y }
                ],
                closed: false
            }
        ];
    }

    /** Mesh kenarlarının XY izdüşümü (yanak paneller için kullanılır). */
    function projectMeshEdges2d(meshes, layer) {
        const edges = [];
        const seen = {};

        function edgeKey(a, b) {
            const k1 = a.x.toFixed(4) + ',' + a.y.toFixed(4);
            const k2 = b.x.toFixed(4) + ',' + b.y.toFixed(4);
            return k1 < k2 ? k1 + '|' + k2 : k2 + '|' + k1;
        }

        function addEdge(a, b) {
            if (Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6) return;
            const key = edgeKey(a, b);
            if (seen[key]) return;
            seen[key] = true;
            edges.push({
                layer: layer,
                points: [{ x: a.x, y: a.y }, { x: b.x, y: b.y }],
                closed: false
            });
        }

        for (let m = 0; m < meshes.length; m++) {
            const mesh = meshes[m];
            const verts = mesh.vertices;
            for (let f = 0; f < mesh.faces.length; f++) {
                const face = mesh.faces[f];
                for (let i = 0; i < face.length; i++) {
                    addEdge(verts[face[i]], verts[face[(i + 1) % face.length]]);
                }
            }
        }
        return edges;
    }

    function computeBBox2d(plan, edges) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        function grow(p) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }

        grow(plan.p1);
        grow(plan.p2);
        grow(plan.p3);
        for (let i = 0; i < edges.length; i++) {
            const pts = edges[i].points;
            for (let k = 0; k < pts.length; k++) grow(pts[k]);
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

    function getBoundingBox(meshes, plan) {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        function grow(p) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.z < minZ) minZ = p.z;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
            if (p.z > maxZ) maxZ = p.z;
        }

        if (plan) {
            grow(plan.p1);
            grow(plan.p2);
            grow(plan.p3);
        }

        for (let m = 0; m < meshes.length; m++) {
            const verts = meshes[m].vertices;
            for (let i = 0; i < verts.length; i++) {
                grow(verts[i]);
            }
        }

        if (!isFinite(minX)) {
            return { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1, width: 1, height: 1, depth: 1 };
        }

        return {
            minX, minY, minZ, maxX, maxY, maxZ,
            width: maxX - minX,
            height: maxY - minY,
            depth: maxZ - minZ
        };
    }

    function getPlanTemplates() {
        return {
            eskenar: {
                p1: { x: 0, y: 0, z: 0 },
                p2: { x: 100, y: 0, z: 0 },
                p3: { x: 50, y: 86.60254037844386, z: 0 }
            },
            dik: {
                p1: { x: 0, y: 0, z: 0 },
                p2: { x: 100, y: 0, z: 0 },
                p3: { x: 0, y: 80, z: 0 }
            }
        };
    }

    function generateMukarnas(params) {
        const plan = {
            p1: v3(params.p1.x, params.p1.y, 0),
            p2: v3(params.p2.x, params.p2.y, 0),
            p3: v3(params.p3.x, params.p3.y, 0)
        };

        const asabaAdet = Math.max(1, Math.floor(Number(params.asabaAdet) || 1));
        let asabaH = Number(params.asabaH) || 0;
        let toplamH = Number(params.toplamH) || 0;
        const derinlik = Math.max(0, Number(params.derinlik) || 0);
        const xManuel = !!params.xManuel;

        const p1p2mesafe = dist2d(plan.p1, plan.p2);
        const p1p3mesafe = dist2d(plan.p1, plan.p3);
        const asa = resolveAsa(p1p2mesafe, asabaAdet, xManuel, params.asa);

        const useGoldenRatio = !!params.useGoldenRatio &&
            toplamH <= 0 &&
            asabaAdet === 1 &&
            !xManuel;

        if (useGoldenRatio) {
            asabaH = p1p2mesafe * PHI;
            toplamH = asabaH * asabaAdet;
        } else if (toplamH > 0 && asabaAdet >= 1) {
            asabaH = toplamH / asabaAdet;
        } else if (asabaH > 0) {
            toplamH = asabaH * asabaAdet;
        }

        const warnings = [];
        if (p1p2mesafe < 1e-6) {
            warnings.push('P1—P2 mesafesi çok küçük');
        }
        if (asa <= 0 || asa > p1p2mesafe * 1.0001) {
            warnings.push('X ölçüsü (asa) geçersiz; P1—P2 uzunluğunu aşmamalı');
        }
        // Orijinal MaxScript eşit kenarlı (90°) köşe varsayar. Kenarlar eşit
        // değilse asaba genişliği iki kenarda farklı olur; hücreler kayık çıkar.
        if (p1p2mesafe > 1e-6 && kenarFarkOrani(p1p3mesafe, p1p2mesafe) > KENAR_TOLERANS) {
            warnings.push('P1—P3 (' + p1p3mesafe.toFixed(2) + ') ≠ P1—P2 (' + p1p2mesafe.toFixed(2) +
                '): asaba genişliği iki kenarda farklı — "Kenarları eşitle" ile düzeltebilirsiniz');
        }

        const kpPreview = computeKeyPoints(plan, Math.min(asa, p1p2mesafe), 1, 1);

        if (asabaH <= 0) {
            const previewLayout = collectPlanLayout(kpPreview, asabaAdet);
            const previewEdges = collectEdges2d(plan, kpPreview).concat(previewLayout.edges);
            return {
                plan,
                p1p2mesafe,
                p1p3mesafe,
                asa,
                asabaH: 0,
                toplamH: 0,
                asabaAdet,
                derinlik,
                useGoldenRatio,
                meshes: [],
                keyPoints: kpPreview,
                planCells: previewLayout.cells,
                edges2d: previewEdges,
                bbox: getBoundingBox([], plan),
                bbox2d: computeBBox2d(plan, previewEdges),
                warnings: ['Yükseklik (H veya asaba h) > 0 gerekli'].concat(warnings)
            };
        }

        const kp = computeKeyPoints(plan, asa, asabaH, asabaAdet);
        const meshes = buildMainMesh(kp, asabaH, asabaAdet);
        const yanak = buildYanakMeshes(kp, asabaH, asabaAdet, derinlik);

        const layout = collectPlanLayout(kp, asabaAdet);
        const edges2d = collectEdges2d(plan, kp)
            .concat(layout.edges)
            .concat(projectMeshEdges2d(yanak, 'YANAK'));

        for (let i = 0; i < yanak.length; i++) {
            meshes.push(yanak[i]);
        }
        orientFacesUp(meshes);

        return {
            plan,
            p1p2mesafe,
            p1p3mesafe,
            asa,
            asabaH,
            toplamH,
            asabaAdet,
            derinlik,
            useGoldenRatio,
            keyPoints: kp,
            meshes,
            planCells: layout.cells,
            edges2d,
            bbox: getBoundingBox(meshes, plan),
            bbox2d: computeBBox2d(plan, edges2d),
            warnings
        };
    }

    function meshToBufferGeometry(mesh, THREE, coordSystem) {
        const useThree = coordSystem !== 'max';
        const verts = mesh.vertices;
        const positions = [];
        const indices = [];

        for (let f = 0; f < mesh.faces.length; f++) {
            const face = mesh.faces[f];
            if (face.length < 3) continue;
            const base = positions.length / 3;
            for (let i = 0; i < face.length; i++) {
                const raw = verts[face[i]];
                const p = useThree ? maxToThree(raw) : raw;
                positions.push(p.x, p.y, p.z);
            }
            if (face.length === 3) {
                indices.push(base, base + 1, base + 2);
            } else {
                for (let i = 1; i < face.length - 1; i++) {
                    indices.push(base, base + i, base + i + 1);
                }
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions,  3));
        geom.setIndex(indices);
        geom.computeVertexNormals();
        return geom;
    }

    function resultToGeometries(result, THREE, coordSystem) {
        const geometries = [];
        for (let i = 0; i < result.meshes.length; i++) {
            geometries.push(meshToBufferGeometry(result.meshes[i], THREE, coordSystem));
        }
        return geometries;
    }

    function getBoundingBox2d(result) {
        if (result.bbox2d) return result.bbox2d;
        const bb = result.bbox;
        return {
            minX: bb.minX,
            minY: bb.minY,
            maxX: bb.maxX,
            maxY: bb.maxY,
            width: bb.width,
            height: bb.height
        };
    }

    global.MukarnasGeom = {
        PHI,
        COLOR_MAIN,
        COLOR_YANAK,
        EDGE_LAYERS,
        KENAR_TOLERANS,
        kenarFarkOrani,
        esitKenarP3,
        generateMukarnas,
        getPlanTemplates,
        getBoundingBox,
        getBoundingBox2d,
        maxToThree,
        getBoundingBoxThree,
        meshToBufferGeometry,
        resultToGeometries,
        collectPlanLayout,
        dist2d,
        refinePlanPoints,
        resolveAsa
    };
})(window);