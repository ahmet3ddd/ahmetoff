// DXF export - 3D mukarnas (3DFACE) + plan çizgileri (global, file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.MukarnasGeom;

    /** 3D katmanlar: mesh yüzeyleri 3DFACE olarak bu katmanlara yazılır. */
    const MESH_LAYERS = ['MUKARNAS', 'YANAK_3D'];

    function meshLayer(mesh) {
        return mesh.name.indexOf('Kose_mukarnas') === 0 ? 'MUKARNAS' : 'YANAK_3D';
    }

    function pair(ctx, code, value) {
        ctx.out.push(String(code));
        ctx.out.push(String(value));
    }

    function nextHandle(ctx) {
        const h = ctx.handle.toString(16).toUpperCase();
        ctx.handle++;
        return h;
    }

    function fnum(n) {
        if (!Number.isFinite(n)) return '0.0';
        return n.toFixed(6);
    }

    function writeHeader(ctx, bbox, handleSeedHex) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'HEADER');
        pair(ctx, 9, '$ACADVER'); pair(ctx, 1, 'AC1009');
        pair(ctx, 9, '$INSBASE');
        pair(ctx, 10, '0.0'); pair(ctx, 20, '0.0'); pair(ctx, 30, '0.0');
        pair(ctx, 9, '$EXTMIN');
        pair(ctx, 10, fnum(bbox.minX)); pair(ctx, 20, fnum(bbox.minY)); pair(ctx, 30, fnum(bbox.minZ || 0));
        pair(ctx, 9, '$EXTMAX');
        pair(ctx, 10, fnum(bbox.maxX)); pair(ctx, 20, fnum(bbox.maxY)); pair(ctx, 30, fnum(bbox.maxZ || 0));
        pair(ctx, 9, '$LIMMIN');
        pair(ctx, 10, fnum(bbox.minX)); pair(ctx, 20, fnum(bbox.minY));
        pair(ctx, 9, '$LIMMAX');
        pair(ctx, 10, fnum(bbox.maxX)); pair(ctx, 20, fnum(bbox.maxY));
        pair(ctx, 9, '$ORTHOMODE'); pair(ctx, 70, 0);
        pair(ctx, 9, '$REGENMODE'); pair(ctx, 70, 1);
        pair(ctx, 9, '$FILLMODE'); pair(ctx, 70, 1);
        pair(ctx, 9, '$QTEXTMODE'); pair(ctx, 70, 0);
        pair(ctx, 9, '$MIRRTEXT'); pair(ctx, 70, 1);
        pair(ctx, 9, '$LUNITS'); pair(ctx, 70, 2);
        pair(ctx, 9, '$LUPREC'); pair(ctx, 70, 4);
        pair(ctx, 9, '$AUNITS'); pair(ctx, 70, 0);
        pair(ctx, 9, '$AUPREC'); pair(ctx, 70, 0);
        pair(ctx, 9, '$CLAYER'); pair(ctx, 8, 'PLAN');
        pair(ctx, 9, '$CELTYPE'); pair(ctx, 6, 'BYLAYER');
        pair(ctx, 9, '$CECOLOR'); pair(ctx, 62, 256);
        pair(ctx, 9, '$HANDLING'); pair(ctx, 70, 1);
        pair(ctx, 9, '$HANDSEED'); pair(ctx, 5, handleSeedHex);
        pair(ctx, 9, '$MEASUREMENT'); pair(ctx, 70, 0);
        pair(ctx, 0, 'ENDSEC');
    }

    function writeTables(ctx) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'TABLES');

        pair(ctx, 0, 'TABLE');
        pair(ctx, 2, 'LTYPE');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 70, 1);
        pair(ctx, 0, 'LTYPE');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 2, 'CONTINUOUS');
        pair(ctx, 70, 64);
        pair(ctx, 3, 'Solid line');
        pair(ctx, 72, 65);
        pair(ctx, 73, 0);
        pair(ctx, 40, '0.0');
        pair(ctx, 0, 'ENDTAB');

        // 3D mesh katmanları + 2D plan katmanları (AutoCAD renk indeksleri)
        const layers = MESH_LAYERS.concat(
            Geom.EDGE_LAYERS || ['PLAN', 'BOLUM', 'HUCRE', 'KONTUR', 'YANAK']
        );
        const colors = {
            MUKARNAS: 3, YANAK_3D: 4,
            PLAN: 3, BOLUM: 2, HUCRE: 5, KONTUR: 7, YANAK: 4
        };
        pair(ctx, 0, 'TABLE');
        pair(ctx, 2, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 70, layers.length);
        for (let i = 0; i < layers.length; i++) {
            pair(ctx, 0, 'LAYER');
            pair(ctx, 5, nextHandle(ctx));
            pair(ctx, 2, layers[i]);
            pair(ctx, 70, 64);
            pair(ctx, 62, colors[layers[i]] || (7 + i));
            pair(ctx, 6, 'CONTINUOUS');
        }
        pair(ctx, 0, 'ENDTAB');

        pair(ctx, 0, 'TABLE');
        pair(ctx, 2, 'STYLE');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 70, 1);
        pair(ctx, 0, 'STYLE');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 2, 'STANDARD');
        pair(ctx, 70, 64);
        pair(ctx, 40, '0.0');
        pair(ctx, 41, '1.0');
        pair(ctx, 50, '0.0');
        pair(ctx, 71, 0);
        pair(ctx, 42, '2.5');
        pair(ctx, 3, 'txt');
        pair(ctx, 4, '');
        pair(ctx, 0, 'ENDTAB');

        pair(ctx, 0, 'ENDSEC');
    }

    function writeBlocks(ctx) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'BLOCKS');
        pair(ctx, 0, 'ENDSEC');
    }

    function writePolyline(ctx, points, layerName, closed) {
        if (!points || points.length < 2) return;

        pair(ctx, 0, 'POLYLINE');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 8, layerName);
        pair(ctx, 66, 1);
        pair(ctx, 70, closed ? 1 : 0);
        pair(ctx, 10, '0.0');
        pair(ctx, 20, '0.0');
        pair(ctx, 30, '0.0');

        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            pair(ctx, 0, 'VERTEX');
            pair(ctx, 5, nextHandle(ctx));
            pair(ctx, 8, layerName);
            pair(ctx, 10, fnum(p.x));
            pair(ctx, 20, fnum(p.y));
            pair(ctx, 30, '0.0');
            pair(ctx, 70, 0);
        }

        pair(ctx, 0, 'SEQEND');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 8, layerName);
    }

    /** Bir üçgeni 3DFACE olarak yazar (dördüncü nokta = üçüncü). */
    function writeFace3d(ctx, a, b, c, layerName) {
        pair(ctx, 0, '3DFACE');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 8, layerName);
        pair(ctx, 10, fnum(a.x)); pair(ctx, 20, fnum(a.y)); pair(ctx, 30, fnum(a.z));
        pair(ctx, 11, fnum(b.x)); pair(ctx, 21, fnum(b.y)); pair(ctx, 31, fnum(b.z));
        pair(ctx, 12, fnum(c.x)); pair(ctx, 22, fnum(c.y)); pair(ctx, 32, fnum(c.z));
        pair(ctx, 13, fnum(c.x)); pair(ctx, 23, fnum(c.y)); pair(ctx, 33, fnum(c.z));
        pair(ctx, 70, 0);
    }

    function writeMeshes(ctx, result) {
        if (!result.meshes) return 0;
        let sayi = 0;

        for (let m = 0; m < result.meshes.length; m++) {
            const mesh = result.meshes[m];
            const layerName = meshLayer(mesh);
            const verts = mesh.vertices;

            for (let f = 0; f < mesh.faces.length; f++) {
                const face = mesh.faces[f];
                if (face.length < 3) continue;
                // dörtgen ve üstü: üçgen yelpazesine ayrılır
                for (let i = 1; i < face.length - 1; i++) {
                    writeFace3d(ctx, verts[face[0]], verts[face[i]], verts[face[i + 1]], layerName);
                    sayi++;
                }
            }
        }
        return sayi;
    }

    function writeEntities(ctx, result) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'ENTITIES');

        // 3D gövde: mesh yüzeyleri (Max eksenleri — plan XY, yükseklik Z)
        writeMeshes(ctx, result);

        // 2D plan çizgileri Z=0 düzleminde ayrı katmanlarda kalır
        if (result.edges2d) {
            for (let i = 0; i < result.edges2d.length; i++) {
                const edge = result.edges2d[i];
                writePolyline(ctx, edge.points, edge.layer || 'PLAN', !!edge.closed);
            }
        }

        pair(ctx, 0, 'ENDSEC');
    }

    function downloadText(content, filename, mime) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function exportDXF(result, filename) {
        filename = filename || 'kose-mukarnas.dxf';
        // Sınırlar 3D: mesh varsa yükseklik de kapsanır
        const bbox = (result.meshes && result.meshes.length)
            ? result.bbox
            : Geom.getBoundingBox2d(result);
        const ctx = { out: [], handle: 0x20 };

        writeTables(ctx);
        writeBlocks(ctx);
        writeEntities(ctx, result);
        pair(ctx, 0, 'EOF');

        const handleSeedHex = ctx.handle.toString(16).toUpperCase();
        const headerLines = [];
        writeHeader({ out: headerLines }, bbox, handleSeedHex);

        const all = headerLines.concat(ctx.out);
        const text = all.join('\r\n') + '\r\n';
        downloadText(text, filename, 'application/dxf');
    }

    global.exportDXF = exportDXF;
})(window);
