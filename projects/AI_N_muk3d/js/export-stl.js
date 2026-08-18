(function (global) {
    'use strict';

    const Geom = global.MukarnasGeom;

    function fmt(n) {
        if (!Number.isFinite(n)) return '0.000000e+00';
        return n.toExponential(6);
    }

    function triangleToStl(ax, ay, az, bx, by, bz, cx, cy, cz) {
        const ux = bx - ax, uy = by - ay, uz = bz - az;
        const vx = cx - ax, vy = cy - ay, vz = cz - az;
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len; ny /= len; nz /= len;
        return (
            '  facet normal ' + fmt(nx) + ' ' + fmt(ny) + ' ' + fmt(nz) + '\n' +
            '    outer loop\n' +
            '      vertex ' + fmt(ax) + ' ' + fmt(ay) + ' ' + fmt(az) + '\n' +
            '      vertex ' + fmt(bx) + ' ' + fmt(by) + ' ' + fmt(bz) + '\n' +
            '      vertex ' + fmt(cx) + ' ' + fmt(cy) + ' ' + fmt(cz) + '\n' +
            '    endloop\n' +
            '  endfacet\n'
        );
    }

    function buildAsciiSTL(result) {
        const parts = ['solid mukarnas\n'];
        const merged = Geom.mergeMeshBuffers(result);
        const pos = merged.positions;
        const idx = merged.indices;
        for (let i = 0; i < idx.length; i += 3) {
            const ia = idx[i] * 3;
            const ib = idx[i + 1] * 3;
            const ic = idx[i + 2] * 3;
            parts.push(triangleToStl(
                pos[ia], pos[ia + 1], pos[ia + 2],
                pos[ib], pos[ib + 1], pos[ib + 2],
                pos[ic], pos[ic + 1], pos[ic + 2]
            ));
        }
        parts.push('endsolid mukarnas\n');
        return parts.join('');
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

    function exportSTL(result, filename) {
        filename = filename || 'mukarnas.stl';
        if (!result || !result.cells.length) {
            throw new Error('STL icin geometri yok.');
        }
        downloadText(buildAsciiSTL(result), filename, 'model/stl');
    }

    global.exportSTL = exportSTL;
})(window);
