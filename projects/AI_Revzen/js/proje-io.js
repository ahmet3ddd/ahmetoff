// Proje dosyasi ac / kaydet (global - file:// uyumlu)
//
// Tarayici destekliyorsa File System Access API kullanilir; bu durumda
// gercek "Farkli Kaydet" ve "Ac" pencereleri acilir. Desteklemeyen ya da
// izin vermeyen ortamlarda (bazi surumlerde file:// protokolu) indirme +
// gizli dosya secici ile ayni is yapilir.
(function (global) {
    'use strict';

    const UYGULAMA = 'Revzen 3D';
    const SURUM = 1;
    const TIPLER = [{
        description: 'Revzen projesi',
        accept: { 'application/json': ['.json'] }
    }];

    function destekVar() {
        return typeof global.showSaveFilePicker === 'function' &&
               typeof global.showOpenFilePicker === 'function';
    }

    // Yalnizca AbortError kullanicinin pencereyi kapatmasidir. NotAllowedError /
    // SecurityError ise pencerenin hic acilamamasidir (ornegin file:// altinda
    // opak kaynak); bu durumda yedek yola dusulmeli, sessizce vazgecilmemeli.
    function iptalMi(err) {
        return !!err && err.name === 'AbortError';
    }

    function indir(metin, ad) {
        const blob = new Blob([metin], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ad;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    // --- kaydet ------------------------------------------------------------

    function paketle(parametreler) {
        return JSON.stringify({
            uygulama: UYGULAMA,
            surum: SURUM,
            olusturma: new Date().toISOString(),
            parametreler: parametreler
        }, null, 2);
    }

    function kaydet(parametreler, onerilenAd) {
        const metin = paketle(parametreler);
        const ad = onerilenAd || 'revzen.json';

        if (!destekVar()) {
            indir(metin, ad);
            return Promise.resolve({ yontem: 'indirme', ad: ad });
        }

        return global.showSaveFilePicker({ suggestedName: ad, types: TIPLER })
            .then(function (tutamac) {
                return tutamac.createWritable().then(function (yazici) {
                    return yazici.write(metin)
                        .then(function () { return yazici.close(); })
                        .then(function () { return { yontem: 'pencere', ad: tutamac.name }; });
                });
            })
            .catch(function (err) {
                if (iptalMi(err)) return { yontem: 'iptal' };
                // Pencere acilamadiysa (izin/protokol) indirmeye dus
                indir(metin, ad);
                return { yontem: 'indirme', ad: ad, uyari: err.message };
            });
    }

    // --- ac ----------------------------------------------------------------

    function dosyaSecici() {
        return new Promise(function (cozumle, reddet) {
            const girdi = document.createElement('input');
            girdi.type = 'file';
            girdi.accept = '.json,application/json';
            girdi.style.display = 'none';
            document.body.appendChild(girdi);

            let bitti = false;
            const temizle = function () {
                if (girdi.parentNode) girdi.parentNode.removeChild(girdi);
            };

            girdi.addEventListener('change', function () {
                bitti = true;
                const d = girdi.files && girdi.files[0];
                temizle();
                if (!d) { cozumle({ yontem: 'iptal' }); return; }
                d.text().then(function (metin) {
                    cozumle({ yontem: 'secici', ad: d.name, metin: metin });
                }).catch(reddet);
            });

            // Iptal edildiginde change tetiklenmez; odak geri gelince temizle
            global.addEventListener('focus', function tekSefer() {
                global.removeEventListener('focus', tekSefer);
                setTimeout(function () {
                    if (!bitti) { temizle(); cozumle({ yontem: 'iptal' }); }
                }, 400);
            });

            girdi.click();
        });
    }

    function ac() {
        if (!destekVar()) return dosyaSecici();

        return global.showOpenFilePicker({ multiple: false, types: TIPLER })
            .then(function (liste) {
                const tutamac = liste[0];
                return tutamac.getFile().then(function (d) {
                    return d.text().then(function (metin) {
                        return { yontem: 'pencere', ad: d.name, metin: metin };
                    });
                });
            })
            .catch(function (err) {
                if (iptalMi(err)) return { yontem: 'iptal' };
                return dosyaSecici();
            });
    }

    // --- dogrulama ---------------------------------------------------------

    const SAYI_ALANLARI = {
        en:            { min: 0.001, max: 100000 },
        boy:           { min: 0.001, max: 100000 },
        kalinlik:      { min: 0,     max: 100000 },
        gozCap:        { min: 0,     max: 100000 },
        oran:          { min: 1.02,  max: 20 },
        gozAra:        { min: 0,     max: 100000 },
        kenar:         { min: 0,     max: 100000 },
        kaydirmaX:     { min: -100000, max: 100000 },
        kaydirmaY:     { min: -100000, max: 100000 },
        derinlik:      { min: 0.1,   max: 100000 },
        panelDerinlik: { min: 0.1,   max: 100000 }
    };
    const TIP_KUMESI    = ['duz', 'dk', 'tmt', 'pk', 'dairesel'];
    const FORM_KUMESI   = ['daire', 'filgozu'];
    const DIZILIM_KUMESI = ['stagger', 'tight', 'grid'];

    // Ham metinden guvenli parametre nesnesi cikarir. Tanimadigi alanlari
    // yok sayar, gecersiz degerleri atlar ve neyin atlandigini bildirir.
    function coz(metin) {
        let ham;
        try {
            ham = JSON.parse(metin);
        } catch (e) {
            return { hata: 'Dosya geçerli bir JSON değil.' };
        }
        if (!ham || typeof ham !== 'object') {
            return { hata: 'Dosya içeriği okunamadı.' };
        }
        if (ham.uygulama && ham.uygulama !== UYGULAMA) {
            return { hata: 'Bu dosya bir Revzen projesi değil (' + ham.uygulama + ').' };
        }

        const p = ham.parametreler || ham;
        if (!p || typeof p !== 'object') {
            return { hata: 'Dosyada parametre bulunamadı.' };
        }

        const cikti = {};
        const atlanan = [];

        for (const ad in SAYI_ALANLARI) {
            if (!(ad in p)) continue;
            const v = Number(p[ad]);
            const k = SAYI_ALANLARI[ad];
            if (Number.isFinite(v) && v >= k.min && v <= k.max) cikti[ad] = v;
            else atlanan.push(ad);
        }

        if ('type' in p)      { if (TIP_KUMESI.indexOf(p.type) >= 0) cikti.type = p.type; else atlanan.push('type'); }
        if ('gozForm' in p)   { if (FORM_KUMESI.indexOf(p.gozForm) >= 0) cikti.gozForm = p.gozForm; else atlanan.push('gozForm'); }
        if ('dizilim' in p)   { if (DIZILIM_KUMESI.indexOf(p.dizilim) >= 0) cikti.dizilim = p.dizilim; else atlanan.push('dizilim'); }
        else if ('stagger' in p) { cikti.dizilim = (p.stagger === false) ? 'grid' : 'stagger'; }

        if ('oranRef' in p)   cikti.oranRef = !!p.oranRef;
        if ('kes' in p)       cikti.kes = !!p.kes;
        if ('renkliCam' in p) cikti.renkliCam = !!p.renkliCam;
        if ('izgara' in p)    cikti.izgara = !!p.izgara;

        if (Object.keys(cikti).length === 0) {
            return { hata: 'Dosyada tanınan hiçbir parametre yok.' };
        }
        return { parametreler: cikti, atlanan: atlanan };
    }

    global.ProjeIO = {
        kaydet: kaydet,
        ac: ac,
        coz: coz,
        destekVar: destekVar,
        UYGULAMA: UYGULAMA,
        SURUM: SURUM
    };
})(window);
