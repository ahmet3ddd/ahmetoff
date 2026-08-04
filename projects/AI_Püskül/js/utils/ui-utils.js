/**
 * 🎨 UI Manager
 * Handles UI reorganization, right panel, top bar, and visual modes
 *
 * @author PuskulViewer
 * @version 1.0.0
 */

class UIManager {
    /**
     * @param {PuskulViewer} viewer - Ana viewer referansı
     */
    constructor(viewer) {
        this.viewer = viewer;
        this.grayMode = false; // Gri mod durumu
        this.originalColors = new Map(); // Orijinal renkleri sakla

        console.log('🎨 UIManager initialized');
    }

    /**
     * 🎨 Initialize UI - Üst bar oluştur
     */
    initialize() {
        this.createTopBar();
        console.log('✅ UI initialization tamamlandı');
    }


    /**
     * 📋 Üst bar bağlantıları
     *
     * Butonlar index.html içindeki <header class="topbar"> içinde statik
     * olarak durur; burada yalnızca event listener'lar bağlanır.
     */
    createTopBar() {
        this.attachTopBarListeners();
        console.log('📋 Üst bar bağlandı');
    }

    /**
     * 🔗 Üst bar buton event listener'ları
     */
    attachTopBarListeners() {
        const btnSave = document.getElementById('btn-save');
        const btnLoad = document.getElementById('btn-load');
        const btnExportStl = document.getElementById('btn-export-stl');
        const btnExportDxf = document.getElementById('btn-export-dxf');
        const btnGrayMode = document.getElementById('btn-gray-mode');
        const btnFitCamera = document.getElementById('btn-fit-camera');
        const btnHelp = document.getElementById('btn-help');
        const btnHelpClose = document.getElementById('btn-help-close');
        const helpOverlay = document.getElementById('help-overlay');

        if (btnSave) {
            btnSave.addEventListener('click', () => {
                if (this.viewer.configManager) {
                    this.viewer.configManager.downloadConfig();
                } else {
                    this.notify('ConfigManager henüz yüklenmedi', 'error');
                }
            });
        }

        if (btnLoad) {
            btnLoad.addEventListener('click', () => {
                if (this.viewer.configManager) {
                    this.viewer.configManager.uploadConfig();
                } else {
                    this.notify('ConfigManager henüz yüklenmedi', 'error');
                }
            });
        }

        if (btnExportStl) {
            btnExportStl.addEventListener('click', () => this.showExportDialog('STL'));
        }

        if (btnExportDxf) {
            btnExportDxf.addEventListener('click', () => this.showExportDialog('DXF'));
        }

        if (btnGrayMode) {
            btnGrayMode.addEventListener('click', () => {
                this.toggleGrayMode();
            });
        }

        if (btnFitCamera) {
            btnFitCamera.addEventListener('click', () => {
                this.viewer.zoomExtent();
            });
        }

        if (btnHelp) {
            btnHelp.addEventListener('click', () => {
                this.showHelpDialog();
            });
        }

        if (btnHelpClose) {
            btnHelpClose.addEventListener('click', () => this.hideHelpDialog());
        }

        if (helpOverlay) {
            helpOverlay.addEventListener('click', (e) => {
                if (e.target === helpOverlay) this.hideHelpDialog();
            });
        }

        // Export modal kapatma
        const btnExportClose = document.getElementById('btn-export-close');
        const exportOverlay = document.getElementById('export-overlay');

        if (btnExportClose) {
            btnExportClose.addEventListener('click', () => this.hideExportDialog());
        }

        if (exportOverlay) {
            exportOverlay.addEventListener('click', (e) => {
                if (e.target === exportOverlay) this.hideExportDialog();
            });
        }

        // ESC ile açık modali kapat
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            this.hideHelpDialog();
            this.hideExportDialog();
        });
    }

    /**
     * 🔔 Toast bildirimi (layer-ui.js içindeki showToast'a köprü)
     * @param {string} message
     * @param {'ok'|'error'|''} [kind]
     */
    notify(message, kind) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, kind);
        } else {
            console.warn(message);
        }
    }

    /**
     * ❓ Yardım modalını göster
     */
    showHelpDialog() {
        const overlay = document.getElementById('help-overlay');
        if (overlay) overlay.hidden = false;
    }

    /**
     * ❓ Yardım modalını gizle
     */
    hideHelpDialog() {
        const overlay = document.getElementById('help-overlay');
        if (overlay) overlay.hidden = true;
    }

    /**
     * 🎨 Gri mod toggle
     */
    toggleGrayMode() {
        this.grayMode = !this.grayMode;

        const btn = document.getElementById('btn-gray-mode');
        if (btn) {
            btn.classList.toggle('active', this.grayMode);
            btn.textContent = this.grayMode ? 'Renkli' : 'Gri Mod';
        }

        if (this.grayMode) {
            this.applyGrayMode();
        } else {
            this.restoreOriginalColors();
        }

        console.log(`🎨 Gri mod: ${this.grayMode ? 'Aktif' : 'Pasif'}`);
    }

    /**
     * 🎨 Gri mod uygula
     */
    applyGrayMode() {
        const grayColor = 0x888888; // Orta gri

        // Tüm katmanlar için mesh'leri gri yap
        for (let layerNum in this.viewer.layers) {
            const layer = this.viewer.layers[layerNum];

            // Ana mesh
            if (layer.mesh && layer.mesh.material) {
                // Orijinal rengi sakla (sadece ilk kez)
                const meshKey = `layer${layerNum}_mesh`;
                if (!this.originalColors.has(meshKey)) {
                    this.originalColors.set(meshKey, layer.mesh.material.color.getHex());
                }
                layer.mesh.material.color.setHex(grayColor);
            }

            // Köprü yüzeyleri
            if (layer.bridgeMesh) {
                if (Array.isArray(layer.bridgeMesh)) {
                    layer.bridgeMesh.forEach((mesh, index) => {
                        if (mesh && mesh.material) {
                            const key = `layer${layerNum}_bridge${index}`;
                            if (!this.originalColors.has(key)) {
                                this.originalColors.set(key, mesh.material.color.getHex());
                            }
                            mesh.material.color.setHex(grayColor);
                        }
                    });
                } else if (layer.bridgeMesh.material) {
                    const key = `layer${layerNum}_bridge`;
                    if (!this.originalColors.has(key)) {
                        this.originalColors.set(key, layer.bridgeMesh.material.color.getHex());
                    }
                    layer.bridgeMesh.material.color.setHex(grayColor);
                }
            }

            // Geçiş yüzeyi
            if (layer.extrudeMesh && layer.extrudeMesh.material) {
                const key = `layer${layerNum}_extrude`;
                if (!this.originalColors.has(key)) {
                    this.originalColors.set(key, layer.extrudeMesh.material.color.getHex());
                }
                layer.extrudeMesh.material.color.setHex(grayColor);
            }
        }

        // Püskül Sonu modülü
        if (this.viewer.puskulSonu && this.viewer.puskulSonu.mesh && this.viewer.puskulSonu.mesh.material) {
            const key = 'puskulSonu_mesh';
            if (!this.originalColors.has(key)) {
                this.originalColors.set(key, this.viewer.puskulSonu.mesh.material.color.getHex());
            }
            this.viewer.puskulSonu.mesh.material.color.setHex(grayColor);
        }

        console.log('🎨 Gri mod uygulandı');
    }

    /**
     * 🔄 Gri modu güncelle (mesh'ler yeniden oluşturulduğunda çağrılır)
     */
    refreshGrayMode() {
        if (this.grayMode) {
            this.applyGrayMode();
        }
    }

    /**
     * 🎨 Orijinal renkleri geri yükle
     */
    restoreOriginalColors() {
        // Tüm katmanlar için orijinal renkleri geri yükle
        for (let layerNum in this.viewer.layers) {
            const layer = this.viewer.layers[layerNum];

            // Ana mesh
            if (layer.mesh && layer.mesh.material) {
                const key = `layer${layerNum}_mesh`;
                if (this.originalColors.has(key)) {
                    layer.mesh.material.color.setHex(this.originalColors.get(key));
                }
            }

            // Köprü yüzeyleri
            if (layer.bridgeMesh) {
                if (Array.isArray(layer.bridgeMesh)) {
                    layer.bridgeMesh.forEach((mesh, index) => {
                        if (mesh.material) {
                            const key = `layer${layerNum}_bridge${index}`;
                            if (this.originalColors.has(key)) {
                                mesh.material.color.setHex(this.originalColors.get(key));
                            }
                        }
                    });
                } else if (layer.bridgeMesh.material) {
                    const key = `layer${layerNum}_bridge`;
                    if (this.originalColors.has(key)) {
                        layer.bridgeMesh.material.color.setHex(this.originalColors.get(key));
                    }
                }
            }

            // Geçiş yüzeyi
            if (layer.extrudeMesh && layer.extrudeMesh.material) {
                const key = `layer${layerNum}_extrude`;
                if (this.originalColors.has(key)) {
                    layer.extrudeMesh.material.color.setHex(this.originalColors.get(key));
                }
            }
        }

        // Püskül Sonu modülü
        if (this.viewer.puskulSonu && this.viewer.puskulSonu.mesh && this.viewer.puskulSonu.mesh.material) {
            const key = 'puskulSonu_mesh';
            if (this.originalColors.has(key)) {
                this.viewer.puskulSonu.mesh.material.color.setHex(this.originalColors.get(key));
            }
        }

        // Renk haritasını temizle
        this.originalColors.clear();
    }

    /**
     * 📤 Export modalını göster
     *
     * index.html içindeki statik #export-overlay kullanılır; kapsam
     * butonları (tüm katmanlar / aktif katman) seçilen formata bağlanır.
     *
     * @param {'STL'|'DXF'} format
     */
    showExportDialog(format) {
        if (!this.viewer.exportManager) {
            this.notify('ExportManager henüz yüklenmedi', 'error');
            return;
        }

        const overlay = document.getElementById('export-overlay');
        const title = document.getElementById('export-title');
        const btnAll = document.getElementById('export-all');
        const btnLayer = document.getElementById('export-layer');
        if (!overlay || !btnAll || !btnLayer) return;

        if (title) title.textContent = `${format} olarak dışa aktar`;

        // Önceki bağlantıları temizle (klonlayarak)
        const freshAll = btnAll.cloneNode(true);
        const freshLayer = btnLayer.cloneNode(true);
        btnAll.replaceWith(freshAll);
        btnLayer.replaceWith(freshLayer);

        const run = (layerNum) => {
            if (format === 'DXF') {
                this.viewer.exportManager.exportDXF(layerNum);
            } else {
                this.viewer.exportManager.exportSTL(layerNum);
            }
            this.hideExportDialog();
        };

        freshAll.addEventListener('click', () => run(null));
        freshLayer.addEventListener('click', () => run(this.viewer.currentLayer));

        overlay.hidden = false;
    }

    /**
     * 📤 Export modalını gizle
     */
    hideExportDialog() {
        const overlay = document.getElementById('export-overlay');
        if (overlay) overlay.hidden = true;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
}
