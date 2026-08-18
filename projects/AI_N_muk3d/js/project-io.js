// Proje kaydet / ac (.json). Chrome'un File System Access API'si varsa
// Windows'un kendi "Farkli Kaydet" / "Ac" penceresi acilir; kullanilamadigi
// ortamlarda (ornegin file:// ile acildiginda) indirme klasorune / dosya
// secme kutusuna dusulur.
(function (global) {
    'use strict';

    const TIP = 'mukkap3d-proje';
    const SURUM = 1;

    const PICKER = {
        types: [{
            description: 'Mukkap3D proje',
            accept: { 'application/json': ['.json'] }
        }]
    };

    function paketle(parametreler) {
        return JSON.stringify({
            tip: TIP,
            surum: SURUM,
            parametreler: parametreler
        }, null, 2);
    }

    function coz(metin) {
        let veri;
        try {
            veri = JSON.parse(metin);
        } catch (e) {
            throw new Error('Dosya okunamadi (gecerli JSON degil).');
        }
        if (!veri || veri.tip !== TIP) {
            throw new Error('Bu dosya bir Mukkap3D projesi degil.');
        }
        if (!veri.parametreler || typeof veri.parametreler !== 'object') {
            throw new Error('Proje dosyasinda parametre yok.');
        }
        if (veri.surum > SURUM) {
            throw new Error('Proje daha yeni bir surumle kaydedilmis (v' + veri.surum + ').');
        }
        return veri.parametreler;
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

    function dosyaSecKutusu() {
        return new Promise(function (resolve, reject) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.addEventListener('change', function () {
                const f = input.files && input.files[0];
                if (f) resolve(f);
                else reject(new Error('Dosya secilmedi.'));
            });
            input.click();
        });
    }

    /** Kullanici pencereyi kapattiginda hata degil, iptal sayilir. */
    function iptalMi(e) {
        return e && (e.name === 'AbortError' || e.name === 'NotAllowedError');
    }

    async function kaydet(parametreler, onerilenAd) {
        const metin = paketle(parametreler);

        if (typeof global.showSaveFilePicker === 'function') {
            try {
                const secim = Object.assign({ suggestedName: onerilenAd }, PICKER);
                const handle = await global.showSaveFilePicker(secim);
                const akis = await handle.createWritable();
                await akis.write(metin);
                await akis.close();
                return { ad: handle.name, pencere: true };
            } catch (e) {
                if (iptalMi(e)) return { iptal: true };
                // izin verilmeyen ortam: indirmeye dus
            }
        }

        indir(metin, onerilenAd);
        return { ad: onerilenAd, pencere: false };
    }

    async function ac() {
        let dosya = null;

        if (typeof global.showOpenFilePicker === 'function') {
            try {
                const secilenler = await global.showOpenFilePicker(PICKER);
                dosya = secilenler[0] ? await secilenler[0].getFile() : null;
            } catch (e) {
                if (iptalMi(e)) return { iptal: true };
                // izin verilmeyen ortam: dosya secme kutusuna dus
            }
        }

        if (!dosya) dosya = await dosyaSecKutusu();

        const metin = await dosya.text();
        return { parametreler: coz(metin), ad: dosya.name };
    }

    global.ProjectIO = {
        kaydet: kaydet,
        ac: ac,
        pencereVar: function () {
            return typeof global.showSaveFilePicker === 'function';
        }
    };
})(window);
