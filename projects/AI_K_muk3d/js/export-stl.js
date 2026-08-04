// STL export - mukarnas mesh (global, file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.MukarnasGeom;
    const THREE = global.THREE;

    function buildAsciiSTL(geometries) {
        const parts = ['solid mukarnas\n'];

        for (let g = 0; g < geometries.length; g++) {
            const geom = geometries[g];
            const pos = geom.attributes.position;
            const idx = geom.index;

            if (idx) {
                const arr = idx.array;
                for (let i = 0; i < arr.length; i += 3) {
                    parts.push(triangleToStl(pos, arr[i], arr[i + 1], arr[i + 2]));
                }
            } else {
                for (let i = 0; i < pos.count; i += 3) {
                    parts.push(triangleToStl(pos, i, i + 1, i + 2));
                }
            }
        }

        parts.push('endsolid mukarnas\n');
        return parts.join('');
    }

    function fmt(n) {
        if (!Number.isFinite(n)) return '0.000000e+00';
        return n.toExponential(6);
    }

    function triangleToStl(pos, a, b, c) {
        const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a);
        const bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b);
        const cx = pos.getX(c), cy = pos.getY(c), cz = pos.getZ(c);

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
        filename = filename || 'kose-mukarnas.stl';

        if (!result || !result.meshes || result.meshes.length === 0) {
            throw new Error('STL için mesh yok (H > 0 gerekli).');
        }

        const geometries = Geom.resultToGeometries(result, THREE, 'max');
        if (geometries.length === 0) {
            throw new Error('STL için geometri oluşturulamadı.');
        }

        const stl = buildAsciiSTL(geometries);
        downloadText(stl, filename, 'model/stl');

        for (let i = 0; i < geometries.length; i++) {
            geometries[i].dispose();
        }
    }

    global.exportSTL = exportSTL;
})(window);
