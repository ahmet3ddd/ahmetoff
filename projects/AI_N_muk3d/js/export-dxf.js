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

    function writeHeader(ctx, bbox) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'HEADER');
        pair(ctx, 9, '$ACADVER'); pair(ctx, 1, 'AC1009');
        pair(ctx, 9, '$INSBASE');
        pair(ctx, 10, '0.0'); pair(ctx, 20, '0.0'); pair(ctx, 30, '0.0');
        pair(ctx, 9, '$EXTMIN');
        pair(ctx, 10, fnum(bbox.minX)); pair(ctx, 20, fnum(bbox.minY)); pair(ctx, 30, fnum(bbox.minZ));
        pair(ctx, 9, '$EXTMAX');
        pair(ctx, 10, fnum(bbox.maxX)); pair(ctx, 20, fnum(bbox.maxY)); pair(ctx, 30, fnum(bbox.maxZ));
        pair(ctx, 9, '$CLAYER'); pair(ctx, 8, '0');
        pair(ctx, 0, 'ENDSEC');
    }

    function writeTables(ctx) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'TABLES');
        pair(ctx, 0, 'TABLE');
        pair(ctx, 2, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 70, 4);
        pair(ctx, 0, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 2, '0');
        pair(ctx, 70, 0);
        pair(ctx, 62, 7);
        pair(ctx, 6, 'CONTINUOUS');
        pair(ctx, 0, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 2, 'MUK_ELEV');
        pair(ctx, 70, 64);
        pair(ctx, 62, 3);
        pair(ctx, 6, 'CONTINUOUS');
        pair(ctx, 0, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 2, 'MUK_PLAN');
        pair(ctx, 70, 64);
        pair(ctx, 62, 5);
        pair(ctx, 6, 'CONTINUOUS');
        pair(ctx, 0, 'LAYER');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 2, 'MUK_3D');
        pair(ctx, 70, 64);
        pair(ctx, 62, 2);
        pair(ctx, 6, 'CONTINUOUS');
        pair(ctx, 0, 'ENDTAB');
        pair(ctx, 0, 'ENDSEC');
    }

    function writeBlocks(ctx) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'BLOCKS');
        pair(ctx, 0, 'ENDSEC');
    }

    function writeLine(ctx, a, b, layer, z) {
        pair(ctx, 0, 'LINE');
        pair(ctx, 5, nextHandle(ctx));
        pair(ctx, 8, layer);
        pair(ctx, 10, fnum(a.x));
        pair(ctx, 20, fnum(a.y));
        pair(ctx, 30, fnum(z));
        pair(ctx, 11, fnum(b.x));
        pair(ctx, 21, fnum(b.y));
        pair(ctx, 31, fnum(z));
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

    function writeEntities(ctx, result, planShiftY) {
        pair(ctx, 0, 'SECTION');
        pair(ctx, 2, 'ENTITIES');

        // 3D model: her ucgen bir 3DFACE (Max'teki mesh karsiligi)
        for (let c = 0; c < result.cells.length; c++) {
            const cell = result.cells[c];
            for (let f = 0; f < cell.faces.length; f++) {
                const tri = cell.faces[f];
                write3DFace(
                    ctx,
                    cell.vertices[tri[0]],
                    cell.vertices[tri[1]],
                    cell.vertices[tri[2]],
                    'MUK_3D'
                );
            }
        }

        for (let i = 0; i < result.elevPolylines.length; i++) {
            const pl = result.elevPolylines[i];
            writeLine(ctx, pl[0], pl[1], 'MUK_ELEV', 0);
        }
        for (let i = 0; i < result.planPolylines.length; i++) {
            const pl = result.planPolylines[i];
            writeLine(
                ctx,
                { x: pl[0].x, y: pl[0].y + planShiftY },
                { x: pl[1].x, y: pl[1].y + planShiftY },
                'MUK_PLAN',
                0
            );
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
        if (!result || !result.cells.length) {
            throw new Error('DXF icin geometri yok.');
        }
        const elevBb = Geom.getBoundingBox2D(result.elevPolylines);
        const planBb = Geom.getBoundingBox2D(result.planPolylines);

        // Plan, kesitin altina bosluk birakilarak yerlestirilir (ust uste binmesin)
        const gap = Math.max(elevBb.height, planBb.height, 10) * 0.25;
        const planShiftY = elevBb.minY - gap - planBb.maxY;

        const bb3 = result.bbox;
        const bbox = {
            minX: Math.min(elevBb.minX, planBb.minX, bb3.minX),
            minY: Math.min(planBb.minY + planShiftY, bb3.minY),
            maxX: Math.max(elevBb.maxX, planBb.maxX, bb3.maxX),
            maxY: Math.max(elevBb.maxY, bb3.maxY),
            minZ: Math.min(0, bb3.minZ),
            maxZ: Math.max(0, bb3.maxZ)
        };

        const ctx = { out: [], handle: 0x20 };
        writeHeader(ctx, bbox);
        writeTables(ctx);
        writeBlocks(ctx);
        writeEntities(ctx, result, planShiftY);
        pair(ctx, 0, 'EOF');

        downloadText(ctx.out.join('\r\n') + '\r\n', filename, 'application/dxf');
    }

    global.exportDXF = exportDXF;
})(window);
