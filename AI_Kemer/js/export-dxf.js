// DXF export (global - file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.KemerGeom;

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
        pair(ctx, 10, fnum(bbox.minX)); pair(ctx, 20, fnum(bbox.minY)); pair(ctx, 30, '0.0');
        pair(ctx, 9, '$EXTMAX');
        pair(ctx, 10, fnum(bbox.maxX)); pair(ctx, 20, fnum(bbox.maxY)); pair(ctx, 30, '0.0');
        pair(ctx, 9, '$LIMMIN');
        pair(ctx, 10, fnum(bbox.minX)); pair(ctx, 20, fnum(bbox.minY));
        pair(ctx, 9, '$LIMMAX');
        pair(ctx, 10, fnum(bbox.maxX)); pair(ctx, 20, fnum(bbox.maxY));
        pair(ctx, 9, '$ORTHOMODE'); pair(ctx, 70, 0);
        pair(ctx, 9, '$REGENMODE'); pair(ctx, 70, 1);
        pair(ctx, 9, '$FILLMODE');  pair(ctx, 70, 1);
        pair(ctx, 9, '$QTEXTMODE'); pair(ctx, 70, 0);
        pair(ctx, 9, '$MIRRTEXT');  pair(ctx, 70, 1);
        pair(ctx, 9, '$LUNITS');    pair(ctx, 70, 2);
        pair(ctx, 9, '$LUPREC');    pair(ctx, 70, 4);
        pair(ctx, 9, '$AUNITS');    pair(ctx, 70, 0);
        pair(ctx, 9, '$AUPREC');    pair(ctx, 70, 0);
        pair(ctx, 9, '$CLAYER');    pair(ctx, 8, 'KEMER');
        pair(ctx, 9, '$CELTYPE');   pair(ctx, 6, 'BYLAYER');
        pair(ctx, 9, '$CECOLOR');   pair(ctx, 62, 256);
        pair(ctx, 9, '$HANDLING');  pair(ctx, 70, 1);
        pair(ctx, 9, '$HANDSEED');  pair(ctx, 5, handleSeedHex);
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

        pair(ctx, 0, 'TABLE');
        pair(ctx, 2, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 70, 1);
        pair(ctx, 0, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 2, 'KEMER');
        pair(ctx, 70, 64);
        pair(ctx, 62, 7);
        pair(ctx, 6, 'CONTINUOUS');
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

    function writeEntities(ctx, result) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'ENTITIES');

        for (let u = 0; u < result.archUnits.length; u++) {
            const unit = result.archUnits[u];
            const ring = Geom.getClosedPolygon(unit);
            if (ring) {
                writePolyline(ctx, ring, 'KEMER', true);
            } else {
                writePolyline(ctx, unit.inner, 'KEMER', false);
            }
        }

        pair(ctx, 0, 'ENDSEC');
    }

    function downloadText(content, filename, mime) {
        const blob = new Blob([content], { type: mime });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function exportDXF(result, filename) {
        filename = filename || 'kemer.dxf';
        const bbox = Geom.getBoundingBox(result);
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
