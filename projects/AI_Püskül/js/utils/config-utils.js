/**
 * 💾 Configuration Manager
 * Handles saving and loading all viewer settings to/from JSON
 *
 * @author PuskulViewer
 * @version 1.0.0
 */

class ConfigManager {
    /**
     * @param {PuskulViewer} viewer - Ana viewer referansı
     */
    constructor(viewer) {
        this.viewer = viewer;
        console.log('💾 ConfigManager initialized');
    }

    /**
     * 💾 Tüm ayarları JSON olarak kaydet
     * @returns {Object} Configuration object
     */
    saveConfig() {
        const config = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            currentLayer: this.viewer.currentLayer,
            layers: {},
            globalSettings: this.saveGlobalSettings()
        };

        // Her katman için ayarları kaydet
        for (let layerNum in this.viewer.layers) {
            const layer = this.viewer.layers[layerNum];
            config.layers[layerNum] = this.saveLayerConfig(layerNum, layer);
        }

        console.log('💾 Configuration saved:', config);
        return config;
    }

    /**
     * 🔧 Global ayarları kaydet
     */
    saveGlobalSettings() {
        return {
            // Transition ayarları
            transitionHeight: this.viewer.layerTransition?.transitionHeight || 0,
            globalHeight: this.viewer.layerTransition?.globalHeight || 0,
            lockHeight: this.viewer.layerTransition?.lockHeight || false,

            // Snap ayarları
            enableSnap: this.viewer.enableSnap || false,
            snapDistance: this.viewer.snapDistance || 0.5,

            // Deformasyon ayarları
            maxDeformation: this.viewer.maxDeformation || 0,

            // Render ayarları
            grayMode: this.viewer.uiManager?.grayMode || false,

            // 🆕 UI State (Görsel toggle durumları)
            uiState: {
                showWireframe: this.viewer.showWireframe !== undefined ? this.viewer.showWireframe : true,
                showGrid: this.viewer.showGrid !== undefined ? this.viewer.showGrid : true,
                showPip: this.viewer.showPip !== undefined ? this.viewer.showPip : true,
                showPoints: this.viewer.showPoints !== undefined ? this.viewer.showPoints : false,
                showBridgeSurfaces: this.viewer.showBridgeSurfaces !== undefined ? this.viewer.showBridgeSurfaces : true
            },

            // 🎯 Püskül Sonu modülü ayarları
            puskulSonu: {
                visible: this.viewer.puskulSonu?.visible !== undefined ? this.viewer.puskulSonu.visible : true,
                H: this.viewer.puskulSonu?.H || 40,
                fillet: this.viewer.puskulSonu?.fillet || 9.0,
                filletSegments: this.viewer.puskulSonu?.filletSegments || 16
            }
        };
    }

    /**
     * 🔧 Katman ayarlarını kaydet
     */
    saveLayerConfig(layerNum, layer) {
        const layerConfig = {
            visible: layer.visible !== undefined ? layer.visible : true,
            color: layer.mesh?.material?.color?.getHex() || 0xffffff,

            // Layer özellikleri (geometry parametreleri)
            properties: {
                innerRadius: layer.innerRadius,
                outerRadius: layer.outerRadius,
                sides: layer.sides,
                placement: layer.placement,
                parentLayer: layer.parentLayer
            },

            // Katman hücreleri
            cells: {},

            // Transition ayarları
            transition: {
                height: layer.transitionHeight || 0,
                hasTransition: layer.extrudeMesh ? true : false
            },

            // Bridge ayarları
            bridges: layer.bridgeMesh ? (Array.isArray(layer.bridgeMesh) ? layer.bridgeMesh.length : 1) : 0,

            // Geometri bilgileri
            geometry: {
                maxZ: layer.geometryMaxZ || 0,
                meshPositionZ: layer.mesh?.position?.z || 0
            },

            // 🆕 Visual Parameters (Katmana özel görsel parametreler)
            visualParams: {
                bademRadialRatio: layer.bademRadialRatio !== undefined ? layer.bademRadialRatio : 0.403,
                bademNarrowFactor: layer.bademNarrowFactor !== undefined ? layer.bademNarrowFactor : 1.0,
                enableSnap: layer.enableSnap !== undefined ? layer.enableSnap : true,
                snapThreshold: layer.snapThreshold !== undefined ? layer.snapThreshold : 5,
                showSnapConnections: layer.showSnapConnections !== undefined ? layer.showSnapConnections : false,
                showCenterLines: layer.showCenterLines !== undefined ? layer.showCenterLines : true,
                showBademRadialCircle: layer.showBademRadialCircle !== undefined ? layer.showBademRadialCircle : true
            },

            // 🆕 Cell Types (Hücre tipi bilgileri)
            cellTypes: {
                mainCellType: layer.mainCellType || 'BADEM',
                interCellType: layer.interCellType || 'YOK',
                cellMultiplier: layer.cellMultiplier !== undefined ? layer.cellMultiplier : 1
            },

            // 🆕 Cell Custom Parameters (Hücre bazlı override parametreleri)
            cellCustomParams: layer.cellCustomParams || {}
        };

        // Badem hücrelerini kaydet
        if (this.viewer.cellPositions?.[layerNum]?.badem) {
            layerConfig.cells.badem = {};
            for (let key in this.viewer.cellPositions[layerNum].badem) {
                const cell = this.viewer.cellPositions[layerNum].badem[key];
                layerConfig.cells.badem[key] = {
                    x: cell.x,
                    y: cell.y,
                    z: cell.z,
                    placed: cell.placed || false,
                    type: cell.type || 'badem',
                    customParams: cell.customParams || {}
                };
            }
        }

        // Yaprak hücrelerini kaydet
        if (this.viewer.cellPositions?.[layerNum]?.yaprak) {
            layerConfig.cells.yaprak = {};
            for (let key in this.viewer.cellPositions[layerNum].yaprak) {
                const cell = this.viewer.cellPositions[layerNum].yaprak[key];
                layerConfig.cells.yaprak[key] = {
                    x: cell.x,
                    y: cell.y,
                    z: cell.z,
                    placed: cell.placed || false,
                    type: cell.type || 'yaprak',
                    customParams: cell.customParams || {}
                };
            }
        }

        // 🆕 Fitil hücrelerini kaydet
        if (this.viewer.cellPositions?.[layerNum]?.fitil) {
            layerConfig.cells.fitil = {};
            for (let key in this.viewer.cellPositions[layerNum].fitil) {
                const cell = this.viewer.cellPositions[layerNum].fitil[key];
                layerConfig.cells.fitil[key] = {
                    x: cell.x,
                    y: cell.y,
                    z: cell.z,
                    placed: cell.placed || false,
                    type: cell.type || 'fitil',
                    customParams: cell.customParams || {}
                };
            }
        }

        // 🆕 Kazayak hücrelerini kaydet
        if (this.viewer.cellPositions?.[layerNum]?.kazayak) {
            layerConfig.cells.kazayak = {};
            for (let key in this.viewer.cellPositions[layerNum].kazayak) {
                const cell = this.viewer.cellPositions[layerNum].kazayak[key];
                layerConfig.cells.kazayak[key] = {
                    x: cell.x,
                    y: cell.y,
                    z: cell.z,
                    placed: cell.placed || false,
                    type: cell.type || 'kazayak',
                    customParams: cell.customParams || {}
                };
            }
        }

        return layerConfig;
    }

    /**
     * 📂 Ayarları JSON'dan yükle
     * @param {Object} config - Configuration object
     */
    async loadConfig(config) {
        try {
            console.log('📂 Loading configuration...', config);

            // Versiyon kontrolü
            if (!config.version || config.version !== '1.0.0') {
                console.warn('⚠️ Config version mismatch, attempting to load anyway');
            }

            // Mevcut katmanları temizle
            this.clearAllLayers();

            // Global ayarları yükle
            this.loadGlobalSettings(config.globalSettings);

            // Katmanları yükle
            for (let layerNum in config.layers) {
                await this.loadLayerConfig(parseInt(layerNum), config.layers[layerNum]);
            }

            // UI'ı güncelle (katman listesi vb.)
            this.updateUI();

            // Not: Aktif katman timeout içinde hücre mesh'leri oluşturulduktan sonra ayarlanacak

            // Hücreler yüklenene kadar bekle, sonra mesh'leri oluştur ve transition/bridge ekle
            setTimeout(async () => {
                console.log('🔄 Config yükleme sonrası: Hücre mesh\'leri oluşturuluyor...');

                // ✅ cellMeshes objesini init et
                if (!this.viewer.cellMeshes) {
                    this.viewer.cellMeshes = {};
                }

                // Aktif katmanı ve parametreleri kaydet
                const originalCurrentLayer = this.viewer.currentLayer;
                const originalPuskulGeometry = this.viewer.puskulGeometry;
                const originalPuskulSides = this.viewer.puskulSides;
                const originalPuskulPlacement = this.viewer.puskulPlacement;
                const originalOuterRadius = this.viewer.outerRadius;
                const originalInnerRadius = this.viewer.innerRadius;
                const originalM = this.viewer.M;
                const originalBademRadialRatio = this.viewer.bademRadialRatio;
                const originalBademNarrowFactor = this.viewer.bademNarrowFactor;
                const originalMainCellType = this.viewer.mainCellType;
                const originalInterCellType = this.viewer.interCellType;
                const originalCellMultiplier = this.viewer.cellMultiplier;
                const originalCellCustomParams = this.viewer.cellCustomParams;

                // Her layer için hücre mesh'lerini SIRAYLA oluştur (Promise.all yerine sıralı)
                const layerNumbers = Object.keys(config.layers).map(n => parseInt(n)).sort((a, b) => a - b);
                
                for (const num of layerNumbers) {
                    const layerConfig = config.layers[num];
                    const layer = this.viewer.layers[num];

                    if (!layer || !layer.geometry) {
                        console.warn(`⚠️ Layer ${num}: geometry yok, atlanıyor`);
                        continue;
                    }

                    console.log(`🔄 Layer ${num}: Hücreler yükleniyor...`);

                    // 🔄 currentLayer'ı geçici olarak bu layer'a değiştir
                    this.viewer.currentLayer = num;
                    this.viewer.puskulGeometry = layer.geometry;
                    
                    // 🔄 Layer parametrelerini geçici olarak ayarla (CellLoader bunları kullanıyor)
                    this.viewer.puskulSides = layer.sides;
                    this.viewer.puskulPlacement = layer.placement;
                    this.viewer.outerRadius = layer.outerRadius;
                    this.viewer.innerRadius = layer.innerRadius;
                    this.viewer.M = layer.outerRadius - layer.innerRadius;
                    this.viewer.bademRadialRatio = layer.bademRadialRatio !== undefined ? layer.bademRadialRatio : 0.403;
                    this.viewer.bademNarrowFactor = layer.bademNarrowFactor !== undefined ? layer.bademNarrowFactor : 1.0;
                    this.viewer.mainCellType = layer.mainCellType || 'BADEM';
                    this.viewer.interCellType = layer.interCellType || 'YOK';
                    this.viewer.cellMultiplier = layer.cellMultiplier !== undefined ? layer.cellMultiplier : 1;
                    this.viewer.cellCustomParams = layer.cellCustomParams || {};

                    // ✅ Her layer için AYRI bir CellLoader oluştur ve hücreleri yükle
                    const tempLoader = new CellLoader(this.viewer);
                    
                    // loadAllCells() fonksiyonu senkron ama içinde hücreler tek tek yükleniyor
                    // Bu yüzden Promise ile sarmalayıp tamamlanmasını bekleyelim
                    await new Promise((resolve) => {
                        tempLoader.loadAllCells();
                        
                        // Tüm hücreler yüklendiğinde resolve et
                        const checkInterval = setInterval(() => {
                            const stats = layer.geometry.getStats();
                            if (stats.isReady) {
                                clearInterval(checkInterval);
                                console.log(`  ✓ Layer ${num}: ${stats.loadedCells} hücre yüklendi`);
                                
                                // Mesh'leri oluştur (renderLayer çağır)
                                if (typeof RenderUtils !== 'undefined') {
                                    RenderUtils.renderLayer(this.viewer, num);
                                    console.log(`  ✓ Layer ${num}: render edildi`);
                                } else {
                                    console.warn(`⚠️ RenderUtils bulunamadı, manuel render gerekebilir`);
                                }
                                
                                resolve();
                            }
                        }, 50); // 50ms'de bir kontrol et
                        
                        // Timeout: 10 saniye içinde yüklenmediyse pes et
                        setTimeout(() => {
                            clearInterval(checkInterval);
                            console.error(`❌ Layer ${num}: Timeout (hücreler yüklenemedi)`);
                            resolve(); // Yine de devam et
                        }, 10000);
                    });

                    // Transition yüzeyi
                    if (layerConfig.transition?.hasTransition && this.viewer.layerTransition) {
                        this.viewer.layerTransition.createLayerTransitionSurface(num);
                    }

                    // Bridge yüzeyleri
                    if (layerConfig.bridges > 0 && this.viewer.createBridgeSurfacesForLayer) {
                        this.viewer.createBridgeSurfacesForLayer(num);
                    }
                }

                // 🔄 Original currentLayer ve parametreleri restore et
                if (config.currentLayer && this.viewer.layers[config.currentLayer]) {
                    const targetLayer = this.viewer.layers[config.currentLayer];
                    this.viewer.currentLayer = config.currentLayer;
                    this.viewer.puskulGeometry = targetLayer.geometry;
                    this.viewer.puskulSides = targetLayer.sides;
                    this.viewer.puskulPlacement = targetLayer.placement;
                    this.viewer.outerRadius = targetLayer.outerRadius;
                    this.viewer.innerRadius = targetLayer.innerRadius;
                    this.viewer.M = targetLayer.outerRadius - targetLayer.innerRadius;
                    this.viewer.bademRadialRatio = targetLayer.bademRadialRatio;
                    this.viewer.bademNarrowFactor = targetLayer.bademNarrowFactor;
                    this.viewer.mainCellType = targetLayer.mainCellType;
                    this.viewer.interCellType = targetLayer.interCellType;
                    this.viewer.cellMultiplier = targetLayer.cellMultiplier;
                    this.viewer.cellCustomParams = targetLayer.cellCustomParams || {};
                    console.log(`🔄 Aktif katman restore edildi: ${config.currentLayer}`);
                } else {
                    // Config'te currentLayer yoksa orijinali kullan
                    this.viewer.currentLayer = originalCurrentLayer;
                    this.viewer.puskulGeometry = originalPuskulGeometry;
                    this.viewer.puskulSides = originalPuskulSides;
                    this.viewer.puskulPlacement = originalPuskulPlacement;
                    this.viewer.outerRadius = originalOuterRadius;
                    this.viewer.innerRadius = originalInnerRadius;
                    this.viewer.M = originalM;
                    this.viewer.bademRadialRatio = originalBademRadialRatio;
                    this.viewer.bademNarrowFactor = originalBademNarrowFactor;
                    this.viewer.mainCellType = originalMainCellType;
                    this.viewer.interCellType = originalInterCellType;
                    this.viewer.cellMultiplier = originalCellMultiplier;
                    this.viewer.cellCustomParams = originalCellCustomParams;
                }

                // Son olarak tüm katmanları render et
                if (typeof RenderUtils !== 'undefined') {
                    RenderUtils.renderAllLayers(this.viewer);
                }

                // UI'ı tekrar güncelle (katman listesi)
                this.updateUI();
                
                // Katman selector'ı güncelle
                if (this.viewer.updateLayerSelector) {
                    this.viewer.updateLayerSelector();
                }
                
                // Aktif katman UI'ını güncelle
                if (this.viewer.updateLayerUI) {
                    this.viewer.updateLayerUI();
                }
                
                // 🎨 Gri mod aktifse tüm mesh'lere uygula (mesh'ler oluştuktan sonra)
                if (this.viewer.uiManager && this.viewer.uiManager.grayMode) {
                    // originalColors'ı temizle (yeni mesh'ler için)
                    this.viewer.uiManager.originalColors.clear();
                    // Gri modu uygula
                    this.viewer.uiManager.applyGrayMode();
                    console.log('🎨 Gri mod tüm mesh\'lere uygulandı (config load sonrası)');
                }

                console.log('✅ Tüm katmanlar yüklendi ve render edildi');
            }, 500); // 500ms bekle (geometri hazır olsun)

            console.log('✅ Configuration loaded successfully');
            window.showToast?.('Ayarlar başarıyla yüklendi!', 'ok');

        } catch (error) {
            console.error('❌ Error loading configuration:', error);
            window.showToast?.('Ayarlar yüklenirken hata oluştu: ' + error.message, 'error');
        }
    }

    /**
     * 🗑️ Tüm katmanları temizle
     */
    clearAllLayers() {
        // ✅ cellMeshes ve cellPositions'ı init et
        if (!this.viewer.cellMeshes) {
            this.viewer.cellMeshes = {};
        }
        if (!this.viewer.cellPositions) {
            this.viewer.cellPositions = {};
        }

        const layerNums = Object.keys(this.viewer.layers).map(n => parseInt(n));

        layerNums.forEach(layerNum => {
            const layer = this.viewer.layers[layerNum];
            if (!layer) return;

            // Mesh'leri scene'den kaldır ve dispose et
            if (layer.mesh) {
                this.viewer.scene.remove(layer.mesh);
                if (layer.mesh.geometry) layer.mesh.geometry.dispose();
                if (layer.mesh.material) layer.mesh.material.dispose();
            }

            // Wireframe'i temizle
            if (layer.wireframeMesh) {
                this.viewer.scene.remove(layer.wireframeMesh);
                if (layer.wireframeMesh.geometry) layer.wireframeMesh.geometry.dispose();
                if (layer.wireframeMesh.material) layer.wireframeMesh.material.dispose();
            }

            // Bridge mesh'lerini temizle
            if (layer.bridgeMesh) {
                if (Array.isArray(layer.bridgeMesh)) {
                    layer.bridgeMesh.forEach(mesh => {
                        this.viewer.scene.remove(mesh);
                        if (mesh.geometry) mesh.geometry.dispose();
                        if (mesh.material) mesh.material.dispose();
                    });
                } else {
                    this.viewer.scene.remove(layer.bridgeMesh);
                    if (layer.bridgeMesh.geometry) layer.bridgeMesh.geometry.dispose();
                    if (layer.bridgeMesh.material) layer.bridgeMesh.material.dispose();
                }
            }

            // Extrude mesh'ini temizle
            if (layer.extrudeMesh) {
                this.viewer.scene.remove(layer.extrudeMesh);
                if (layer.extrudeMesh.geometry) layer.extrudeMesh.geometry.dispose();
                if (layer.extrudeMesh.material) layer.extrudeMesh.material.dispose();
            }

            // Cell mesh'lerini temizle
            if (this.viewer.cellMeshes && this.viewer.cellMeshes[layerNum]) {
                Object.values(this.viewer.cellMeshes[layerNum]).forEach(mesh => {
                    if (mesh) {
                        this.viewer.scene.remove(mesh);
                        if (mesh.geometry) mesh.geometry.dispose();
                        if (mesh.material) mesh.material.dispose();
                    }
                });
                delete this.viewer.cellMeshes[layerNum];
            }

            // cellPositions'ı temizle
            if (this.viewer.cellPositions && this.viewer.cellPositions[layerNum]) {
                delete this.viewer.cellPositions[layerNum];
            }

            // Layer objesini sil
            delete this.viewer.layers[layerNum];
        });

        console.log(`🗑️ ${layerNums.length} katman tamamen temizlendi`);
    }

    /**
     * 🔧 Global ayarları yükle
     */
    loadGlobalSettings(settings) {
        if (!settings) return;

        // Transition ayarları
        if (this.viewer.layerTransition) {
            if (settings.transitionHeight !== undefined) {
                this.viewer.layerTransition.transitionHeight = settings.transitionHeight;
            }
            if (settings.globalHeight !== undefined) {
                this.viewer.layerTransition.globalHeight = settings.globalHeight;
                // Slider güncelle
                const slider = document.getElementById('global-height-slider');
                if (slider) slider.value = settings.globalHeight;
                const value = document.getElementById('global-height-value');
                if (value) value.textContent = settings.globalHeight.toFixed(2);
            }
            if (settings.lockHeight !== undefined) {
                this.viewer.layerTransition.lockHeight = settings.lockHeight;
                const checkbox = document.getElementById('lock-height');
                if (checkbox) checkbox.checked = settings.lockHeight;
            }
        }

        // Snap ayarları
        if (settings.enableSnap !== undefined) {
            this.viewer.enableSnap = settings.enableSnap;
        }
        if (settings.snapDistance !== undefined) {
            this.viewer.snapDistance = settings.snapDistance;
        }

        // Deformasyon ayarları
        if (settings.maxDeformation !== undefined) {
            this.viewer.maxDeformation = settings.maxDeformation;
            const slider = document.getElementById('deformation-slider');
            if (slider) slider.value = settings.maxDeformation;
            const value = document.getElementById('deformation-value');
            if (value) value.textContent = settings.maxDeformation.toFixed(3);
        }

        // Gri mod - sadece state'i kaydet, mesh'ler oluştuktan sonra uygulanacak
        if (settings.grayMode !== undefined && this.viewer.uiManager) {
            // State'i sakla (mesh'ler oluştuktan sonra uygulanacak)
            this.viewer.uiManager.grayMode = settings.grayMode;
            
            // Butonu güncelle
            const btn = document.getElementById('btn-gray-mode');
            if (btn) {
                btn.classList.toggle('active', settings.grayMode);
                btn.textContent = settings.grayMode ? 'Renkli' : 'Gri Mod';
            }
            
            console.log(`🎨 Gri mod state kaydedildi: ${settings.grayMode ? 'Aktif' : 'Pasif'} (mesh'ler oluştuktan sonra uygulanacak)`);
        }

        // 🆕 UI State (Görsel toggle durumlarını restore et)
        if (settings.uiState) {
            // Wireframe
            if (settings.uiState.showWireframe !== undefined) {
                this.viewer.showWireframe = settings.uiState.showWireframe;
                this.updateWireframeVisibility();
            }
            // Grid
            if (settings.uiState.showGrid !== undefined) {
                this.viewer.showGrid = settings.uiState.showGrid;
                this.updateGridVisibility();
            }
            // PIP
            if (settings.uiState.showPip !== undefined) {
                this.viewer.showPip = settings.uiState.showPip;
                this.updatePipVisibility();
            }
            // Points
            if (settings.uiState.showPoints !== undefined) {
                this.viewer.showPoints = settings.uiState.showPoints;
                this.updatePointsVisibility();
            }
            // Bridge Surfaces
            if (settings.uiState.showBridgeSurfaces !== undefined) {
                this.viewer.showBridgeSurfaces = settings.uiState.showBridgeSurfaces;
                this.updateBridgeSurfacesVisibility();
            }

            // UI butonlarını güncelle
            this.updateUIButtons();
        }

        // 🎯 Püskül Sonu modülü ayarlarını yükle
        if (settings.puskulSonu) {
            if (settings.puskulSonu.visible !== undefined) {
                this.viewer.puskulSonu.visible = settings.puskulSonu.visible;
            }
            if (settings.puskulSonu.H !== undefined) {
                this.viewer.puskulSonu.H = settings.puskulSonu.H;
            }
            if (settings.puskulSonu.fillet !== undefined) {
                this.viewer.puskulSonu.fillet = settings.puskulSonu.fillet;
            }
            if (settings.puskulSonu.filletSegments !== undefined) {
                this.viewer.puskulSonu.filletSegments = settings.puskulSonu.filletSegments;
            }
            // Püskül Sonu'nu güncelle
            if (this.viewer.puskulSonu.geometry) {
                this.viewer.updatePuskulSonu();
            }
        }

        console.log('🔧 Global settings loaded');
    }

    /**
     * 🔧 Katman ayarlarını yükle
     */
    async loadLayerConfig(layerNum, layerConfig) {
        // Katman direkt oluştur (addLayer kullanma - yeni katman ekler)
        console.log(`📦 Loading layer ${layerNum}...`);

        // Layer özelliklerini yükle
        const props = layerConfig.properties || {};

        // Katman objesi oluştur
        this.viewer.layers[layerNum] = {
            visible: layerConfig.visible !== undefined ? layerConfig.visible : true,
            mesh: null,
            geometry: null,
            bridgeMesh: null,
            extrudeMesh: null,
            transitionHeight: layerConfig.transition?.height || 20,
            geometryMaxZ: layerConfig.geometry?.maxZ || 0,
            innerRadius: props.innerRadius,
            outerRadius: props.outerRadius,
            sides: props.sides,
            placement: props.placement,
            parentLayer: props.parentLayer,
            // 🆕 UI parametreleri (config'ten yükle, yoksa varsayılan)
            bademRadialRatio: layerConfig.visualParams?.bademRadialRatio !== undefined ?
                layerConfig.visualParams.bademRadialRatio : 0.403,
            bademNarrowFactor: layerConfig.visualParams?.bademNarrowFactor !== undefined ?
                layerConfig.visualParams.bademNarrowFactor : 1.0,
            enableSnap: layerConfig.visualParams?.enableSnap !== undefined ?
                layerConfig.visualParams.enableSnap : true,
            snapThreshold: layerConfig.visualParams?.snapThreshold !== undefined ?
                layerConfig.visualParams.snapThreshold : 5,
            showSnapConnections: layerConfig.visualParams?.showSnapConnections !== undefined ?
                layerConfig.visualParams.showSnapConnections : false,
            showCenterLines: layerConfig.visualParams?.showCenterLines !== undefined ?
                layerConfig.visualParams.showCenterLines : true,
            showBademRadialCircle: layerConfig.visualParams?.showBademRadialCircle !== undefined ?
                layerConfig.visualParams.showBademRadialCircle : true,
            // 🆕 Cell Types (config'ten yükle)
            mainCellType: layerConfig.cellTypes?.mainCellType || 'BADEM',
            interCellType: layerConfig.cellTypes?.interCellType || 'YOK',
            cellMultiplier: layerConfig.cellTypes?.cellMultiplier !== undefined ?
                layerConfig.cellTypes.cellMultiplier : 1,
            // 🆕 Cell Custom Params (config'ten yükle)
            cellCustomParams: layerConfig.cellCustomParams || {}
        };

        const layer = this.viewer.layers[layerNum];

        // PuskulGeometry oluştur
        if (typeof PuskulGeometry !== 'undefined' && props.outerRadius && props.sides) {
            // ✅ M parametresi: outerRadius - innerRadius (depth)
            const M = layer.outerRadius - layer.innerRadius;

            layer.geometry = new PuskulGeometry(
                M,                      // ✅ DOĞRU: M (module size/depth)
                this.viewer.H,          // H (height)
                layer.sides,            // sides (4-8)
                layer.placement,        // placement (corner/edge)
                layer.outerRadius,      // outerRadius
                layer.innerRadius       // innerRadius
            );
            console.log(`  ✓ Geometry oluşturuldu (M=${M}, sides: ${layer.sides}, placement: ${layer.placement})`);

            // NOT: Mesh oluşturma timeout içinde hücreler yüklendikten sonra yapılacak
        }

        // Görünürlük
        if (layerConfig.visible !== undefined) {
            layer.visible = layerConfig.visible;
            if (layer.mesh) layer.mesh.visible = layerConfig.visible;
        }

        // Renk
        if (layerConfig.color && layer.mesh?.material) {
            layer.mesh.material.color.setHex(layerConfig.color);
        }

        // Geometri bilgileri
        if (layerConfig.geometry) {
            if (layerConfig.geometry.maxZ !== undefined) {
                layer.geometryMaxZ = layerConfig.geometry.maxZ;
            }
            if (layerConfig.geometry.meshPositionZ !== undefined && layer.mesh) {
                layer.mesh.position.z = layerConfig.geometry.meshPositionZ;
            }
        }

        // Hücreleri yükle
        if (layerConfig.cells) {
            // ✅ cellPositions objesini önce init et
            if (!this.viewer.cellPositions) {
                this.viewer.cellPositions = {};
            }
            // cellPositions[layerNum] objesini hazırla
            if (!this.viewer.cellPositions[layerNum]) {
                this.viewer.cellPositions[layerNum] = { badem: {}, yaprak: {}, fitil: {}, kazayak: {} };
            }

            // Badem hücreleri
            if (layerConfig.cells.badem) {
                if (!this.viewer.cellPositions[layerNum].badem) {
                    this.viewer.cellPositions[layerNum].badem = {};
                }
                for (let key in layerConfig.cells.badem) {
                    const cellData = layerConfig.cells.badem[key];
                    this.viewer.cellPositions[layerNum].badem[key] = {
                        x: cellData.x,
                        y: cellData.y,
                        z: cellData.z,
                        placed: cellData.placed,
                        type: cellData.type,
                        customParams: cellData.customParams || {}
                    };
                }
            }

            // Yaprak hücreleri
            if (layerConfig.cells.yaprak) {
                if (!this.viewer.cellPositions[layerNum].yaprak) {
                    this.viewer.cellPositions[layerNum].yaprak = {};
                }
                for (let key in layerConfig.cells.yaprak) {
                    const cellData = layerConfig.cells.yaprak[key];
                    this.viewer.cellPositions[layerNum].yaprak[key] = {
                        x: cellData.x,
                        y: cellData.y,
                        z: cellData.z,
                        placed: cellData.placed,
                        type: cellData.type,
                        customParams: cellData.customParams || {}
                    };
                }
            }

            // 🆕 Fitil hücreleri
            if (layerConfig.cells.fitil) {
                if (!this.viewer.cellPositions[layerNum].fitil) {
                    this.viewer.cellPositions[layerNum].fitil = {};
                }
                for (let key in layerConfig.cells.fitil) {
                    const cellData = layerConfig.cells.fitil[key];
                    this.viewer.cellPositions[layerNum].fitil[key] = {
                        x: cellData.x,
                        y: cellData.y,
                        z: cellData.z,
                        placed: cellData.placed,
                        type: cellData.type,
                        customParams: cellData.customParams || {}
                    };
                }
            }

            // 🆕 Kazayak hücreleri
            if (layerConfig.cells.kazayak) {
                if (!this.viewer.cellPositions[layerNum].kazayak) {
                    this.viewer.cellPositions[layerNum].kazayak = {};
                }
                for (let key in layerConfig.cells.kazayak) {
                    const cellData = layerConfig.cells.kazayak[key];
                    this.viewer.cellPositions[layerNum].kazayak[key] = {
                        x: cellData.x,
                        y: cellData.y,
                        z: cellData.z,
                        placed: cellData.placed,
                        type: cellData.type,
                        customParams: cellData.customParams || {}
                    };
                }
            }
        }

        // ✅ HEMEN: cellPositions'ı puskulGeometry'ye kopyala
        if (this.viewer.cellPositions[layerNum] && layer.geometry) {
            const cellTypes = ['badem', 'yaprak', 'fitil', 'kazayak'];
            for (let cellType of cellTypes) {
                const cells = this.viewer.cellPositions[layerNum][cellType];
                if (cells) {
                    for (let key in cells) {
                        const cellData = cells[key];
                        if (!layer.geometry.cellPositions) {
                            layer.geometry.cellPositions = {};
                        }
                        layer.geometry.cellPositions[key] = {
                            x: cellData.x,
                            y: cellData.y,
                            z: cellData.z,
                            depth: layer.outerRadius - layer.innerRadius,
                            rotation: cellData.rotation || 0
                        };
                    }
                }
            }
        }

        // ✅ HEMEN: cellTypeMapping kur
        if (layer.geometry && layer.mainCellType && layer.interCellType) {
            layer.geometry.mainCellType = layer.mainCellType;
            layer.geometry.interCellType = layer.interCellType;
            layer.geometry.cellMultiplier = layer.cellMultiplier || 1;
            layer.geometry.totalCells = layer.sides * layer.geometry.cellMultiplier;

            // ✅ KRİTİK: calculateCellPositions() çağır - cellTypeMapping'i doldurur!
            layer.geometry.calculateCellPositions();
            console.log(`  ✓ Layer ${layerNum}: calculateCellPositions() çağrıldı`);
        }

        // Transition height ayarla (yüzey oluşturmadan)
        if (layerConfig.transition && this.viewer.layerTransition) {
            if (layerConfig.transition.height !== undefined) {
                layer.transitionHeight = layerConfig.transition.height;
            }
        }

        console.log(`🔧 Layer ${layerNum} loaded`);
    }

    /**
     * 💾 Ayarları dosyaya indir
     */
    downloadConfig() {
        try {
            const config = this.saveConfig();
            const jsonStr = JSON.stringify(config, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `puskul-config-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('💾 Config downloaded successfully');
            window.showToast?.('Ayarlar indirildi!', 'ok');

        } catch (error) {
            console.error('❌ Error downloading config:', error);
            window.showToast?.('İndirme hatası: ' + error.message, 'error');
        }
    }

    /**
     * 📂 Dosyadan ayarları yükle
     */
    uploadConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const config = JSON.parse(text);
                await this.loadConfig(config);

            } catch (error) {
                console.error('❌ Error loading file:', error);
                window.showToast?.('Dosya yükleme hatası: ' + error.message, 'error');
            }
        };

        input.click();
    }

    /**
     * 💾 LocalStorage'a otomatik kaydet (opsiyonel)
     */
    autoSave() {
        try {
            const config = this.saveConfig();
            localStorage.setItem('puskul-autosave', JSON.stringify(config));
            console.log('💾 Auto-saved to localStorage');
        } catch (error) {
            console.error('❌ Auto-save error:', error);
        }
    }

    /**
     * 📂 LocalStorage'dan otomatik yükle (opsiyonel)
     */
    autoLoad() {
        try {
            const saved = localStorage.getItem('puskul-autosave');
            if (saved) {
                const config = JSON.parse(saved);
                return config;
            }
        } catch (error) {
            console.error('❌ Auto-load error:', error);
        }
        return null;
    }

    /**
     * 🗑️ Otomatik kayıtları temizle
     */
    clearAutoSave() {
        localStorage.removeItem('puskul-autosave');
        console.log('🗑️ Auto-save cleared');
    }

    /**
     * 🔄 UI'ı güncelle (katman listesi vb.)
     */
    updateUI() {
        // Layer selector'ı güncelle (asıl selector app.js tarafından yönetilir)
        if (typeof this.viewer.updateLayerSelector === 'function') {
            this.viewer.updateLayerSelector();
            return;
        }

        const layerSelect = document.getElementById('layer-select');
        if (layerSelect) {
            layerSelect.innerHTML = '';

            const layerNums = Object.keys(this.viewer.layers).map(n => parseInt(n)).sort((a, b) => a - b);

            layerNums.forEach(num => {
                const option = document.createElement('option');
                option.value = num;
                option.textContent = `Katman ${num}`;
                if (num === this.viewer.currentLayer) {
                    option.selected = true;
                }
                layerSelect.appendChild(option);
            });

            console.log(`🔄 UI güncellendi: ${layerNums.length} katman`);
        }
    }

    /**
     * 🎨 Wireframe görünürlüğünü güncelle
     */
    updateWireframeVisibility() {
        for (let layerNum in this.viewer.layers) {
            const layer = this.viewer.layers[layerNum];
            if (layer.wireframeMesh) {
                layer.wireframeMesh.visible = this.viewer.showWireframe;
            }
        }
    }

    /**
     * 🎨 Grid görünürlüğünü güncelle
     */
    updateGridVisibility() {
        if (this.viewer.gridHelper) {
            this.viewer.gridHelper.visible = this.viewer.showGrid;
        }
    }

    /**
     * 🎨 PIP görünürlüğünü güncelle
     */
    updatePipVisibility() {
        const pipContainer = document.getElementById('pip-container');
        if (pipContainer) {
            pipContainer.style.display = this.viewer.showPip ? 'block' : 'none';
        }
    }

    /**
     * 🎨 Nokta görünürlüğünü güncelle
     */
    updatePointsVisibility() {
        // Not: Bu fonksiyon viewer'da tanımlı olabilir
        if (typeof this.viewer.updatePointsVisibility === 'function') {
            this.viewer.updatePointsVisibility();
        }
    }

    /**
     * 🎨 Köprü yüzeyleri görünürlüğünü güncelle
     */
    updateBridgeSurfacesVisibility() {
        for (let layerNum in this.viewer.layers) {
            const layer = this.viewer.layers[layerNum];
            if (layer.bridgeMesh) {
                if (Array.isArray(layer.bridgeMesh)) {
                    layer.bridgeMesh.forEach(mesh => {
                        mesh.visible = this.viewer.showBridgeSurfaces;
                    });
                } else {
                    layer.bridgeMesh.visible = this.viewer.showBridgeSurfaces;
                }
            }
        }
    }

    /**
     * 🔘 UI butonlarını güncelle (toggle durumları)
     */
    updateUIButtons() {
        // Etiketler sabit kalır; açık/kapalı durumu .active sınıfı ile gösterilir.

        // Wireframe butonu
        const wireframeBtn = document.getElementById('show-wireframe');
        if (wireframeBtn) {
            wireframeBtn.classList.toggle('active', this.viewer.showWireframe);
        }

        // Grid butonu
        const gridBtn = document.getElementById('toggle-grid');
        if (gridBtn) {
            gridBtn.classList.toggle('active', this.viewer.showGrid);
        }

        // PIP butonu
        const pipBtn = document.getElementById('toggle-pip');
        if (pipBtn) {
            pipBtn.classList.toggle('active', this.viewer.showPip);
        }

        console.log('🔘 UI butonları güncellendi');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
} else {
    window.ConfigManager = ConfigManager;
}
