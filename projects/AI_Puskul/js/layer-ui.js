/**
 * Katman yonetimi arayuz baglantilari + toast bildirimi
 *
 * Eskiden index.html icinde inline duran katman scriptleri buraya tasindi.
 * Uyari kutulari (alert) yerine muk3d gorsel dilindeki toast kullanilir.
 */

(function () {
    'use strict';

    /**
     * Kisa bildirim goster
     * @param {string} message
     * @param {'ok'|'error'|''} [kind]
     */
    function showToast(message, kind) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const t = document.createElement('div');
        t.className = 'toast' + (kind ? ' ' + kind : '');
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2600);
    }

    window.showToast = showToast;

    document.addEventListener('DOMContentLoaded', function () {

        const layerSelector = document.getElementById('layer-selector');

        // ---------------------------------------------------- katman secimi
        if (layerSelector) {
            layerSelector.addEventListener('change', function () {
                const selectedLayer = parseInt(this.value, 10);
                console.log(`🏗️ Katman secildi: ${selectedLayer}`);

                if (window.puskulViewer) {
                    window.puskulViewer.switchLayer(selectedLayer);
                }
            });
        }

        // ------------------------------------------------------ katman ekle
        const addLayerBtn = document.getElementById('add-layer-btn');
        if (addLayerBtn) {
            addLayerBtn.addEventListener('click', function () {
                if (!window.puskulViewer) {
                    console.warn('⚠️ PuskulViewer henuz hazir degil');
                    showToast('Viewer henuz hazir degil', 'error');
                    return;
                }

                const newLayerNum = window.puskulViewer.addLayer();
                if (!newLayerNum) return;

                window.puskulViewer.updateLayerSelector();
                window.puskulViewer.switchLayer(newLayerNum);

                if (layerSelector) layerSelector.value = newLayerNum;

                const layer = window.puskulViewer.layers[newLayerNum];
                const yerlesim = layer.placement === 'corner' ? 'Kose' : 'Kenar';
                showToast(
                    `Katman ${newLayerNum} eklendi - ${yerlesim}, dis ${layer.outerRadius} / ic ${layer.innerRadius}`,
                    'ok'
                );
            });
        }

        // ------------------------------------------------------- katman sil
        const removeLayerBtn = document.getElementById('remove-layer-btn');
        if (removeLayerBtn) {
            removeLayerBtn.addEventListener('click', function () {
                if (!window.puskulViewer) {
                    console.warn('⚠️ PuskulViewer henuz hazir degil');
                    showToast('Viewer henuz hazir degil', 'error');
                    return;
                }

                const currentLayer = window.puskulViewer.currentLayer;

                if (currentLayer === 1) {
                    showToast('Katman 1 silinemez', 'error');
                    return;
                }

                if (!confirm(`Katman ${currentLayer} silinecek. Emin misiniz?`)) return;

                const success = window.puskulViewer.removeLayer(currentLayer);
                if (!success) return;

                window.puskulViewer.updateLayerSelector();
                if (layerSelector) layerSelector.value = 1;

                showToast(`Katman ${currentLayer} silindi`, 'ok');
            });
        }

        // ------------------------------------------------- gecis yuzeyi
        const transitionHeightSlider = document.getElementById('transition-height-slider');
        const transitionHeightLabel = document.getElementById('transition-height-label');
        const lockTransitionHeight = document.getElementById('lock-transition-height');

        if (transitionHeightSlider) {
            transitionHeightSlider.addEventListener('input', function () {
                const value = parseFloat(this.value);
                if (transitionHeightLabel) transitionHeightLabel.textContent = value;

                if (window.puskulViewer && window.puskulViewer.layerTransition) {
                    const isLocked = lockTransitionHeight && lockTransitionHeight.checked;
                    if (isLocked) {
                        window.puskulViewer.layerTransition.setGlobalHeight(value);
                    } else {
                        window.puskulViewer.layerTransition.setLayerHeight(
                            window.puskulViewer.currentLayer, value
                        );
                    }
                }
            });
        }

        if (lockTransitionHeight) {
            lockTransitionHeight.addEventListener('change', function () {
                const isLocked = this.checked;
                console.log(`🔒 Yukseklik kilidi: ${isLocked ? 'Aktif' : 'Pasif'}`);

                if (window.puskulViewer && window.puskulViewer.layerTransition) {
                    window.puskulViewer.layerTransition.setLockHeight(isLocked);
                }
            });
        }

        console.log('🏗️ Katman yonetimi sistemi hazir');
    });
})();
