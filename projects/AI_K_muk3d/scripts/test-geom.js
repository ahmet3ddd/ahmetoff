const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'mukarnas-geometry.js'), 'utf8');
const fn = new Function('window', code + '\nreturn window.MukarnasGeom;');
const Geom = fn({});

let fail = 0;
function check(label, cond, extra) {
    console.log((cond ? '  ok  ' : ' FAIL ') + label + (extra !== undefined ? '  -> ' + extra : ''));
    if (!cond) fail++;
}

function run(name, params) {
    const r = Geom.generateMukarnas(params);
    const n = r.asabaAdet;
    const beklenenHucre = (n * (n + 1)) / 2;
    const layers = {};
    r.edges2d.forEach(function (e) { layers[e.layer] = (layers[e.layer] || 0) + 1; });

    console.log('\n[' + name + '] adet=' + n + ' asa=' + r.asa.toFixed(2) +
        ' mesh=' + r.meshes.length + ' katmanlar=' + JSON.stringify(layers));

    check('hücre sayısı = n(n+1)/2', r.planCells.length === beklenenHucre, r.planCells.length);
    check('üst sıralar baklava, taban sırası üçgen', r.planCells.every(function (c) {
        return c.level === n - 1
            ? (c.points.length === 3 && !c.diag)
            : (c.points.length === 4 && c.diag.length === 2);
    }));
    check('kademe 0..n-1', r.planCells.every(function (c) { return c.level >= 0 && c.level < n; }));
    check('tek kapalı dış kontur', (layers.KONTUR || 0) === 1);

    // pp1arka yüzeyi Z=0'a oturmamalı: hiçbir yüzeyin üç köşesi birden z=0 olmasın
    const zeminYuzey = r.meshes.filter(function (m) {
        return m.name.indexOf('Kose_mukarnas') === 0;
    }).reduce(function (acc, m) {
        return acc + m.faces.filter(function (f) {
            return f.every(function (i) { return Math.abs(m.vertices[i].z) < 1e-9; });
        }).length;
    }, 0);
    check('Z=0 düzleminde yatay yüzey yok', zeminYuzey === 0, zeminYuzey);

    // yatay yüzeylerin normali yukarı bakmalı (tek yüzlü çizimde kaybolmasın)
    function yuzNormal(v, f) {
        const a = v[f[0]], b = v[f[1]], c = v[f[2]];
        const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
        const w = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
        return { x: u.y * w.z - u.z * w.y, y: u.z * w.x - u.x * w.z, z: u.x * w.y - u.y * w.x };
    }
    const tersYatay = r.meshes.reduce(function (acc, m) {
        return acc + m.faces.filter(function (f) {
            const n = yuzNormal(m.vertices, f);
            return Math.abs(n.z) > Math.hypot(n.x, n.y) && n.z < -1e-9;
        }).length;
    }, 0);
    check('aşağı bakan yatay yüzey yok (yanak dahil)', tersYatay === 0, tersYatay);

    // taban sırasındaki hücrelerde pp1arka köşesi hiç üretilmemeli
    const arkaZeminde = r.meshes.filter(function (m) {
        return m.name.indexOf('Kose_mukarnas') === 0 && m.vertices.length > 5;
    }).filter(function (m) { return Math.abs(m.vertices[5].z) < 1e-9; }).length;
    check('taban sırasında pp1arka noktası yok', arkaZeminde === 0, arkaZeminde);

    // üst sıralarda arka yüzey duruyor: yüzey sayısı = 4*(üst hücre) + 3*(taban hücre)
    const tabanAdet = n;
    const ustAdet = beklenenHucre - tabanAdet;
    const anaYuzey = r.meshes.filter(function (m) {
        return m.name.indexOf('Kose_mukarnas') === 0;
    }).reduce(function (acc, m) { return acc + m.faces.length; }, 0);
    check('yüzey sayısı 4*üst + 3*taban', anaYuzey === 4 * ustAdet + 3 * tabanAdet,
        anaYuzey + ' / ' + (4 * ustAdet + 3 * tabanAdet));

    // hücre baklavaları ana mesh'lerin XY izdüşümüyle birebir örtüşmeli
    const anaMesh = r.meshes.filter(function (m) { return m.name.indexOf('Kose_mukarnas') === 0; });
    const meshKose = new Set();
    anaMesh.forEach(function (m) {
        m.vertices.forEach(function (v) {
            meshKose.add(v.x.toFixed(3) + ',' + v.y.toFixed(3));
        });
    });
    const kafesDisi = r.planCells.filter(function (c) {
        return c.points.some(function (p) { return !meshKose.has(p.x.toFixed(3) + ',' + p.y.toFixed(3)); });
    });
    check('hücre köşeleri mesh izdüşümüyle örtüşüyor', anaMesh.length === 0 || kafesDisi.length === 0, kafesDisi.length);

    // plan üçgeninin ağırlık merkezi kafesin içinde kalmalı (kafes üçgeni tümüyle örter)
    check('bbox2d kafesi kapsıyor', r.bbox2d.width >= Geom.dist2d(r.plan.p1, r.plan.p2) - 1e-6);
    return r;
}

run('eşkenar / 3 asaba', {
    p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, p3: { x: 50, y: 86.60254037844386 },
    asabaAdet: 3, toplamH: 300, asabaH: 100, derinlik: 0, xManuel: false
});

run('90° köşe / 4 asaba + yanak', {
    p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, p3: { x: 0, y: 100 },
    asabaAdet: 4, toplamH: 160, asabaH: 40, derinlik: 8, xManuel: false
});

run('tek asaba', {
    p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, p3: { x: 50, y: 86.60254037844386 },
    asabaAdet: 1, toplamH: 161.8, asabaH: 161.8, derinlik: 0, xManuel: false
});

// x ölçüsü elle verildiğinde kafes adımı da asa'ya uymalı (eski GRID hatası)
const man = run('elle x ölçüsü (asa=15)', {
    p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, p3: { x: 0, y: 100 },
    asabaAdet: 4, toplamH: 160, asabaH: 40, derinlik: 0, xManuel: true, asa: 15
});
const c0 = man.planCells[0];
check('kafes adımı = asa', Math.abs(Geom.dist2d(c0.points[0], c0.points[1]) - 15) < 1e-6,
    Geom.dist2d(c0.points[0], c0.points[1]).toFixed(3));

// yükseklik yokken de plan çizilmeli
const h0 = Geom.generateMukarnas({
    p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, p3: { x: 0, y: 100 },
    asabaAdet: 3, toplamH: 0, asabaH: 0, derinlik: 0
});
console.log('\n[H = 0]');
check('mesh yok ama plan kafesi var', h0.meshes.length === 0 && h0.planCells.length === 6, h0.planCells.length);
check('bbox2d üretildi', !!h0.bbox2d);

// ---- eşit kenar uyarısı ve düzeltmesi ----
console.log('\n[eşit kenar]');
function uyariVar(r) {
    return r.warnings.some(function (w) { return w.indexOf('P1—P3') === 0; });
}
const dik = Geom.generateMukarnas({
    p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, p3: { x: 0, y: 80 },
    asabaAdet: 4, toplamH: 160, asabaH: 40, derinlik: 0
});
check('eşit olmayan kenarda uyarı var', uyariVar(dik), dik.warnings[0]);
check('p1p3mesafe raporlanıyor', Math.abs(dik.p1p3mesafe - 80) < 1e-9);

const esk = Geom.generateMukarnas({
    p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, p3: { x: 50, y: 86.60254037844386 },
    asabaAdet: 4, toplamH: 160, asabaH: 40, derinlik: 0
});
check('eşkenarda uyarı yok', !uyariVar(esk));

const plan = { p1: { x: 10, y: 5 }, p2: { x: 110, y: 5 }, p3: { x: 10, y: 85 } };
const yeniP3 = Geom.esitKenarP3(plan);
check('eşitlenen P3 uzunluğu = |P1–P2|', Math.abs(Geom.dist2d(plan.p1, yeniP3) - 100) < 1e-9,
    Geom.dist2d(plan.p1, yeniP3).toFixed(4));
const aci0 = Math.atan2(plan.p3.y - plan.p1.y, plan.p3.x - plan.p1.x);
const aci1 = Math.atan2(yeniP3.y - plan.p1.y, yeniP3.x - plan.p1.x);
check('P3 yönü korunuyor', Math.abs(aci0 - aci1) < 1e-9);

const dejenere = Geom.esitKenarP3({ p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, p3: { x: 0, y: 0 } });
check('P3 = P1 iken dik yöne oturuyor',
    Math.abs(dejenere.x) < 1e-9 && Math.abs(dejenere.y - 100) < 1e-9,
    JSON.stringify(dejenere));

const esitlenmis = Geom.generateMukarnas({
    p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, p3: { x: 0, y: 100 },
    asabaAdet: 4, toplamH: 160, asabaH: 40, derinlik: 0
});
check('eşitledikten sonra uyarı kalkıyor', !uyariVar(esitlenmis));
const hucre0 = esitlenmis.planCells[0];
check('hücre kenarları eşit (kare modül)',
    Math.abs(Geom.dist2d(hucre0.points[0], hucre0.points[1]) -
        Geom.dist2d(hucre0.points[0], hucre0.points[3])) < 1e-9);

console.log('\n' + (fail === 0 ? 'TÜM KONTROLLER GEÇTİ' : fail + ' KONTROL BAŞARISIZ'));
process.exit(fail === 0 ? 0 : 1);
