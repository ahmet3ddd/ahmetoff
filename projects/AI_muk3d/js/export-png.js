// PNG export (global - file:// uyumlu)
(function (global) {
    'use strict';

    function loadImage(src) {
        return new Promise(function (resolve, reject) {
            const img = new Image();
            img.onload = function () { resolve(img); };
            img.onerror = function (e) { reject(new Error('SVG yuklenemedi: ' + e)); };
            img.src = src;
        });
    }

    function canvasToDownload(canvas, filename) {
        return new Promise(function (resolve, reject) {
            canvas.toBlob(function (blob) {
                if (!blob) {
                    reject(new Error('Canvas to Blob basarisiz'));
                    return;
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
                resolve();
            }, 'image/png');
        });
    }

    const exportPNG = {
        from2D: function (viewer2d, filename) {
            filename = filename || 'mukarnas-2d.png';
            const svg = viewer2d.getSVGElement();
            if (!svg) return Promise.reject(new Error('2D SVG bulunamadi'));

            const rect = svg.getBoundingClientRect();
            const w = Math.max(1, Math.round(rect.width));
            const h = Math.max(1, Math.round(rect.height));

            const clone = svg.cloneNode(true);
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clone.setAttribute('width', String(w));
            clone.setAttribute('height', String(h));

            const xml = new XMLSerializer().serializeToString(clone);
            const svgBlob = new Blob(
                ['<?xml version="1.0" encoding="UTF-8"?>\n', xml],
                { type: 'image/svg+xml;charset=utf-8' }
            );
            const url = URL.createObjectURL(svgBlob);

            return loadImage(url).then(function (img) {
                const dpr = window.devicePixelRatio || 1;
                const canvas = document.createElement('canvas');
                canvas.width = w * dpr;
                canvas.height = h * dpr;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#1e1f22';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.scale(dpr, dpr);
                ctx.drawImage(img, 0, 0, w, h);
                URL.revokeObjectURL(url);
                return canvasToDownload(canvas, filename);
            }).catch(function (err) {
                URL.revokeObjectURL(url);
                throw err;
            });
        },

        from3D: function (viewer3d, filename) {
            filename = filename || 'mukarnas-3d.png';
            const canvas = viewer3d.getRendererCanvas();
            if (!canvas) return Promise.reject(new Error('3D canvas bulunamadi'));
            return canvasToDownload(canvas, filename);
        }
    };

    global.exportPNG = exportPNG;
})(window);
