/**
 * Turkce metinleri UTF-8 olarak yazar (bu dosya yalnizca ASCII).
 * mukarnas-geometry.js DOKUNULMAZ (StrReplace bozabilir).
 * Calistir: node web/scripts/ensure-utf8-tr.js
 */
const fs = require('fs');
const path = require('path');
const web = path.join(__dirname, '..');

function w(rel, content) {
    fs.writeFileSync(path.join(web, rel), content, { encoding: 'utf8' });
    console.log('OK', rel);
}

const indexHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>K\u00f6\u015fe Mukarnas - (web)</title>
    <link rel="stylesheet" href="css/style.css" />
</head>
<body>
    <header class="topbar">
        <h1>K\u00f6\u015fe Mukarnas - (web)</h1>
        <motion.div class="topbar-actions">
            <button id="btn-help" type="button" title="Nas\u0131l Kullan\u0131l\u0131r">?</button>
            <button id="btn-reset" type="button" title="Parametreleri s\u0131f\u0131rla">S\u0131f\u0131rla</button>
            <button id="btn-fit-camera" type="button" title="3D kameray\u0131 nesneye oturt">Kamera</button>
            <span class="topbar-sep"></span>
            <button id="btn-export-stl" type="button">STL</button>
            <button id="btn-export-dxf" type="button">DXF</button>
            <button id="btn-export-png" type="button">PNG</button>
        </div>
    </header>
    <main class="layout">
        <aside class="sidebar">
            <section class="panel">
                <h2>Plan \u015eablonu</h2>
                <label class="radio"><input type="radio" name="plan-sablon" value="eskenar" checked /> E\u015fkenar \u00fc\u00e7gen</label>
                <label class="radio"><input type="radio" name="plan-sablon" value="dik" /> Dik \u00fc\u00e7gen</label>
                <label class="radio"><input type="radio" name="plan-sablon" value="ozel" /> \u00d6zel (koordinat)</label>
                <div class="preview-img"><img id="plan-preview" src="assets/plan-diagram.svg" alt="Plan \u00f6nizleme" /></motion.div>
            </section>
            <section class="panel">
                <h2>Plan Noktalar\u0131</h2>
                <div class="field-row"><span class="pt-label">P1</span><input id="p1-x" type="number" step="0.1" value="0" /><input id="p1-y" type="number" step="0.1" value="0" /></motion.div>
                <div class="field-row"><span class="pt-label">P2</span><input id="p2-x" type="number" step="0.1" value="100" /><input id="p2-y" type="number" step="0.1" value="0" /></motion.div>
                <motion.div class="field-row"><span class="pt-label">P3</span><input id="p3-x" type="number" step="0.1" value="50" /><input id="p3-y" type="number" step="0.1" value="86.6" /></motion.div>
                <div class="readout">P1\u2013P2 mesafe: <span id="readout-p1p2">\u2014</span><br />P1\u2013P3 mesafe: <span id="readout-p1p3">\u2014</span></motion.div>
                <label class="checkbox-field"><input id="chk-esit-kenar" type="checkbox" /> Kenarlar\u0131 e\u015fit tut (|P1\u2013P3| = |P1\u2013P2|)</label>
                <button id="btn-esitle" class="mini-btn" type="button">P3'\u00fc \u015fimdi e\u015fitle</button>
            </section>
            <section class="panel">
                <h2>Mukarnas Parametreleri</h2>
                <div class="field"><label for="param-asaba-adet">Asaba adedi</label><input id="param-asaba-adet" type="number" value="1" min="1" max="50" step="1" /></motion.div>
                <div class="field"><label for="param-toplam-h">Toplam H</label><input id="param-toplam-h" type="number" value="0" min="0" step="0.1" /></motion.div>
                <div class="field"><label for="param-asaba-h">Asaba h</label><input id="param-asaba-h" type="number" value="0" min="0.1" step="0.1" /></motion.div>
                <div class="field"><label for="param-derinlik">Yanak derinlik</label><input id="param-derinlik" type="number" value="0" min="0" step="0.5" /></motion.div>
                <label class="checkbox-field"><input id="chk-x-manuel" type="checkbox" /> X \u00f6l\u00e7\u00fcs\u00fc plandan ba\u011f\u0131ms\u0131z</label>
                <div class="field"><label for="param-x-mesafe">X \u00f6l\u00e7\u00fcs\u00fc (asa)</label><input id="param-x-mesafe" type="number" value="100" min="0.1" step="0.1" disabled /></motion.div>
                <div class="readout">x \u00f6l\u00e7\u00fcs\u00fc (hesap): <span id="readout-x-asa">\u2014</span></motion.div>
            </section>
            <section class="panel">
                <h2>Durum</h2>
                <p class="status-line"><strong>Yap\u0131lacak:</strong> <span id="not1">Plan\u0131 d\u00fczenleyin; \u00e7izim otomatik g\u00fcncellenir.</span></p>
                <p class="status-line"><strong>Bitmi\u015f:</strong> <span id="not2">\u2014</span></p>
                <p class="status-line"><span id="not3">X \u00f6l\u00e7\u00fcs\u00fc: \u2014</span></p>
            </section>
            <section class="panel panel-footer"><p class="hint">Orijinal MaxScript: <code>docs/23-v1.ms</code></p></section>
        </aside>
        <section class="viewports">
            <div class="viewport viewport-2d"><div class="viewport-title">2D Plan</div><motion.div id="view2d" class="view2d-container"></div></motion.div>
            <div class="viewport viewport-3d"><div class="viewport-title">3D G\u00f6r\u00fcn\u00fcm</div><div id="view3d" class="view3d-container"></div></motion.div>
        </section>
    </main>
    <div id="help-overlay" class="help-overlay" hidden>
        <div class="help-modal">
            <div class="help-header"><h2>Nas\u0131l Kullan\u0131l\u0131r</h2><button id="btn-help-close" type="button">&times;</button></motion.div>
            <div class="help-body">
                <p><strong>A\u00e7\u0131l\u0131\u015f:</strong> <code>web/index.html</code> dosyas\u0131na \u00e7ift t\u0131klay\u0131n.</p>
                <h3>Plan</h3>
                <p>P1\u2013P3 \u00fc\u00e7geni; asaba adedi 1: x=P1\u2013P2; fazla: x=P1\u2013P2/adet. tablo2 \u00f6rne\u011fi: asaba adedi=3, H=3\u00d7asaba h.</p>
                <p><strong>E\u015fit kenar:</strong> orijinal MaxScript e\u015fit kenarl\u0131 k\u00f6\u015fe varsayar. |P1\u2013P3| \u2260 |P1\u2013P2| ise asaba geni\u015fli\u011fi iki kenarda farkl\u0131 olur ve uyar\u0131 \u00e7\u0131kar. <em>P3'\u00fc \u015fimdi e\u015fitle</em> tek seferlik d\u00fczeltir; <em>Kenarlar\u0131 e\u015fit tut</em> i\u015faretliyse P3 y\u00f6n\u00fcn\u00fc koruyup s\u00fcrekli |P1\u2013P2| uzunlu\u011funda tutulur (P3'\u00fc s\u00fcr\u00fcklerken yaln\u0131z a\u00e7\u0131 de\u011fi\u015fir).</p>
                <h3>2D Plan katmanlar\u0131</h3>
                <ul>
                    <li><strong>Ye\u015fil \u00fc\u00e7gen (PLAN):</strong> sizin verdi\u011finiz plan; k\u00f6\u015feler s\u00fcr\u00fcklenebilir.</li>
                    <li><strong>Mavi baklavalar (HUCRE):</strong> asabalar\u0131n plandaki izi; her h\u00fccre bir asaba, k\u00f6\u015fegen pp2\u2013pp3. Dolgu tonu kademeyi g\u00f6sterir (a\u00e7\u0131k = \u00fcst kademe). Taban s\u0131ras\u0131 \u00fc\u00e7gendir: o s\u0131radaki pp1arka y\u00fczeyi grid d\u00fczlemine (Z=0) oturdu\u011fu i\u00e7in \u00e7izilmez.</li>
                    <li><strong>Beyaz \u00e7izgi (KONTUR):</strong> kafesin d\u0131\u015f s\u0131n\u0131r\u0131; asa \u00f6l\u00e7\u00fcs\u00fc plana tam b\u00f6l\u00fcn\u00fcyorsa plan \u00fc\u00e7geniyle \u00e7ak\u0131\u015f\u0131r.</li>
                    <li><strong>Turuncu (BOLUM):</strong> birinci asaban\u0131n x \u00f6l\u00e7\u00fcs\u00fc.</li>
                    <li><strong>Kesikli ye\u015fil (YANAK):</strong> yanak panellerinin plandaki izi (derinlik &gt; 0 iken).</li>
                </ul>
                <p>Ayn\u0131 katman adlar\u0131 DXF'e de yaz\u0131l\u0131r.</p>
                <h3>Export</h3>
                <p>STL, DXF, PNG. <strong>DXF 3D'dir:</strong> mukarnas y\u00fczeyleri 3DFACE olarak <code>MUKARNAS</code>, yanaklar <code>YANAK_3D</code> katman\u0131na yaz\u0131l\u0131r; plan \u00e7izgileri Z=0'da ayr\u0131 katmanlarda kal\u0131r (PLAN, BOLUM, HUCRE, KONTUR, YANAK). 3ds Max'e al\u0131rken <strong>Weld vertices</strong> i\u015faretle.</p>
                <p><strong>Eksenler:</strong> Hesaplama Max gibi (plan XY, y\u00fckseklik Z). 3D \u00f6nizleme Three.js (Y yukar\u0131). STL Max Z-yukar\u0131 kal\u0131r.</p>
            </motion.div>
        </motion.div>
    </motion.div>
    <script src="https://unpkg.com/three@0.147.0/build/three.min.js"></script>
    <script src="https://unpkg.com/three@0.147.0/examples/js/controls/OrbitControls.js"></script>
    <script src="js/mukarnas-geometry.js"></script>
    <script src="js/viewer-2d.js"></script>
    <script src="js/viewer-3d.js"></script>
    <script src="js/export-stl.js"></script>
    <script src="js/export-dxf.js"></script>
    <script src="js/export-png.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
`.replace(/motion\./g, '');

w('index.html', indexHtml);

(function () {
    const files = ['js/export-stl.js', 'js/viewer-3d.js', 'js/viewer-2d.js'];
    const fixes = [
        [/^\/\/.*$/m, null],
        [/throw new Error\('STL[^']+'\);/g, null],
        [/throw new Error\('STL[^']+'\);/g, null]
    ];
    const headers = {
        'js/viewer-3d.js': '// 3D Three.js viewer \u2014 mukarnas mesh (global, file:// uyumlu)',
        'js/viewer-2d.js': '// 2D plan viewer \u2014 mukarnas plan kafesi + s\u00fcr\u00fcklenebilir P1\u2013P3 (global, file:// uyumlu)'
    };
    const stlErrors = [
        "            throw new Error('STL i\u00e7in mesh yok (H > 0 gerekli).');",
        "            throw new Error('STL i\u00e7in geometri olu\u015fturulamad\u0131.');"
    ];
    for (let f = 0; f < files.length; f++) {
        const rel = files[f];
        let lines = fs.readFileSync(path.join(web, rel), 'utf8').split('\n');
        if (headers[rel]) lines[0] = headers[rel];
        if (rel === 'js/export-stl.js') {
            let si = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('throw new Error') && lines[i].includes('STL')) {
                    lines[i] = stlErrors[si++] || lines[i];
                }
            }
        }
        fs.writeFileSync(path.join(web, rel), lines.join('\n'), 'utf8');
        console.log('OK', rel);
    }
})();

console.log('Bitti. mukarnas-geometry.js elle duzenlendi; bu script ona dokunmaz.');
