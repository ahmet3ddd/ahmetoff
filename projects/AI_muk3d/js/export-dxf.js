// DXF export - mukarnas mesh (global - file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.MukarnasGeom;

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
        pair(ctx, 10, fnum(bbox.minX)); pair(ctx, 20, fnum(bbox.minY)); pair(ctx, 30, fnum(bbox.minZ));
        pair(ctx, 9, '$EXTMAX');
        pair(ctx, 10, fnum(bbox.maxX)); pair(ctx, 20, fnum(bbox.maxY)); pair(ctx, 30, fnum(bbox.maxZ));
        pair(ctx, 9, '$CLAYER'); pair(ctx, 8, 'MUKARNA');
        pair(ctx, 9, '$HANDSEED'); pair(ctx, 5, handleSeedHex);
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

        pair(ctx, 0, 'TABLE');
        pair(ctx, 2, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 70, 2);
        pair(ctx, 0, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 2, 'MUKARNA');
        pair(ctx, 70, 64);
        pair(ctx, 62, 7);
        pair(ctx, 6, 'CONTINUOUS');
        pair(ctx, 0, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 2, 'PLAN');
        pair(ctx, 70, 64);
        pair(ctx, 62, 5);
        pair(ctx, 6, 'CONTINUOUS');
        pair(ctx, 0, 'ENDTAB');

        pair(ctx, 0, 'ENDSEC');
    }

    function writeBlocks(ctx) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'BLOCKS');
        pair(ctx, 0, 'ENDSEC');
    }

    function writeLine(ctx, a, b, layer) {
        pair(ctx, 0, 'LINE');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 8, layer);
        pair(ctx, 10, fnum(a.x)); pair(ctx, 20, fnum(a.y)); pair(ctx, 30, fnum(a.z));
        pair(ctx, 11, fnum(b.x)); pair(ctx, 21, fnum(b.y)); pair(ctx, 31, fnum(b.z));
    }

    function writePolyline2D(ctx, points, layer, closed) {
        if (!points || points.length < 2) return;
        pair(ctx, 0, 'POLYLINE');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 8, layer);
        pair(ctx, 66, 1);
        pair(ctx, 70, closed ? 1 : 0);
        pair(ctx, 10, '0.0');
        pair(ctx, 20, '0.0');
        pair(ctx, 30, '0.0');

        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            pair(ctx, 0, 'VERTEX');
            pair(ctx, 5, nextHandle(ctx));
            pair(ctx, 8, layer);
            pair(ctx, 10, fnum(p.x));
            pair(ctx, 20, fnum(p.y));
            pair(ctx, 30, '0.0');
            pair(ctx, 70, 0);
        }

        pair(ctx, 0, 'SEQEND');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 8, layer);
    }

    function write3DFace(ctx, a, b, c, layer) {
        pair(ctx, 0, '3DFACE');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 8, layer);
        pair(ctx, 10, fnum(a.x)); pair(ctx, 20, fnum(a.y)); pair(ctx, 30, fnum(a.z));
        pair(ctx, 11, fnum(b.x)); pair(ctx, 21, fnum(b.y)); pair(ctx, 31, fnum(b.z));
        pair(ctx, 12, fnum(c.x)); pair(ctx, 22, fnum(c.y)); pair(ctx, 32, fnum(c.z));
        pair(ctx, 13, fnum(c.x)); pair(ctx, 23, fnum(c.y)); pair(ctx, 33, fnum(c.z));
    }

    function writeEntities(ctx, result) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'ENTITIES');

        const mesh = result.mesh;
        const verts = mesh.vertices;

        const planPts = result.planPoints || (result.planTriangle ? result.planTriangle.slice(0, 3) : null);
        if (planPts && planPts.length >= 3) {
            const closed = planPts.slice();
            if (closed.length === 3) {
                closed.push(closed[0]);
            } else if (closed.length === 4) {
                closed.push(closed[0]);
            }
            writePolyline2D(ctx, closed, 'PLAN', true);
        }

        for (let fi = 0; fi < mesh.faces.length; fi++) {
            const f = mesh.faces[fi];
            const a = verts[f[0]];
            const b = verts[f[1]];
            const c = verts[f[2]];
            write3DFace(ctx, a, b, c, 'MUKARNA');
        }

        const drawn = {};
        for (let fi = 0; fi < mesh.faces.length; fi++) {
            const f = mesh.faces[fi];
            for (let e = 0; e < 3; e++) {
                const ia = f[e];
                const ib = f[(e + 1) % 3];
                const key = ia < ib ? ia + '-' + ib : ib + '-' + ia;
                if (drawn[key]) continue;
                drawn[key] = true;
                writeLine(ctx, verts[ia], verts[ib], 'MUKARNA');
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
        filename = filename || 'mukarnas.dxf';
        if (!result || !result.mesh) {
            throw new Error('DXF icin gecerli mesh yok');
        }

        const bbox = Geom.getBoundingBox(result);
        const ctx = { out: [], handle: 0x20 };

        writeTables(ctx);
        writeBlocks(ctx);
        writeEntities(ctx, result);
        pair(ctx, 0, 'EOF');

        const handleSeedHex = ctx.handle.toString(16).toUpperCase();
        const headerLines = [];
        writeHeader({ out: headerLines }, bbox, handleSeedHex);

        const text = headerLines.concat(ctx.out).join('\r\n') + '\r\n';
        downloadText(text, filename, 'application/dxf');
    }

    global.exportDXF = exportDXF;
})(window);
