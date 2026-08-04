const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'mukarnas-geometry.js'), 'utf8');
const fn = new Function('window', code + '\nreturn window.MukarnasGeom;');
const G = fn({});
const r = G.generateMukarnas({
    p1: { x: 0, y: 0 },
    p2: { x: 100, y: 0 },
    p3: { x: 50, y: 86.6 },
    asabaAdet: 1,
    toplamH: 161.8,
    asabaH: 161.8,
    derinlik: 0
});
const v0 = r.meshes[0].vertices[0];
const t0 = G.maxToThree(v0);
console.log('Max pp1 top:', v0.x, v0.y, v0.z);
console.log('Three:', t0.x, t0.y, t0.z, '(Y should be height ~161.8)');
const bb3 = G.getBoundingBoxThree(r.bbox);
console.log('Three bbox height (Y):', bb3.height.toFixed(1));
