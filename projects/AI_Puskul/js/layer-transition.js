/**
 * 🎯 Katman Geçiş Yüzeyleri (Layer Transition Surfaces)
 *
 * Bu modül katmanlar arası geçiş yüzeylerini yönetir.
 * Outer boundary'den yukarı doğru a1-a2 mesafesi kadar extrude edilen yüzeyler oluşturur.
 *
 * @author PuskulViewer
 * @version 1.0.0
 */

class LayerTransition {
    /**
     * @param {PuskulViewer} viewer - Ana viewer referansı
     */
    constructor(viewer) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.layers = viewer.layers;
        this.showTransitionSurface = true; // Görünürlük (varsayılan açık - sürekli göster)
        this.lockHeight = false;  // Tüm katmanlar aynı yükseklik mi?
        this.globalHeight = 20;   // Kilit aktifken kullanılacak yükseklik (varsayılan 20 birim)

        // Her katman için varsayılan yükseklik
        for (let layerNum in this.layers) {
            if (!this.layers[layerNum].transitionHeight) {
                this.layers[layerNum].transitionHeight = 20; // Varsayılan 20 birim
            }
        }
    }

    /**
     * 🎯 Katman outer boundary noktalarını al (gerçek hücre c1 noktalarından, transform edilmiş)
     * @param {object} layer - Katman objesi
     * @param {number} zLevel - Z seviyesi
     * @returns {Array} Boundary noktaları [{x, y, z}, ...]
     */
    getLayerOuterBoundary(layer, zLevel) {
        if (!layer || !layer.geometry || !layer.geometry.cells) return [];
        if (!layer.geometry.cellPositions) {
            console.warn('⚠️ cellPositions bulunamadı');
            return [];
        }

        const points = [];
        const totalCells = layer.geometry.totalCells;
        const cellPositions = layer.geometry.cellPositions;

        // Tüm hücreleri tara ve dış boundary noktalarını topla
        for (let i = 0; i < totalCells; i++) {
            const cellName = `cell${i + 1}`;
            const cellObj = layer.geometry.cells[cellName];
            const pos = cellPositions[cellName];

            if (!cellObj || !cellObj.geometry || !cellObj.geometry.points || !pos) continue;

            const geo = cellObj.geometry;
            const cellType = cellObj.type;

            // Prefix belirle
            let prefix;
            if (cellType === 'BADEM') prefix = 'B';
            else if (cellType === 'YAPRAK') prefix = 'Y';
            else if (cellType === 'FITIL') prefix = 'F';
            else if (cellType === 'KAZAYAGI') prefix = 'K';
            else continue;

            // c1 noktası lokal koordinatlarda
            const c1Local = geo.points[`${prefix}-c1`];
            if (!c1Local) continue;

            // Transform: rotation + translation
            // rotation: hücrenin yönü (radyan)
            // (x, y): hücrenin a1 noktasının dünya koordinatları
            const cos = Math.cos(pos.rotation);
            const sin = Math.sin(pos.rotation);

            // Lokal c1'i döndür
            const c1Rotated_x = c1Local.x * cos - c1Local.y * sin;
            const c1Rotated_y = c1Local.x * sin + c1Local.y * cos;

            // Translate et
            const c1World_x = pos.x + c1Rotated_x;
            const c1World_y = pos.y + c1Rotated_y;

            points.push({
                x: c1World_x,
                y: c1World_y,
                z: zLevel,
                cellName: cellName,
                cellType: cellType
            });
        }

        console.log(`✓ Toplam ${points.length} boundary noktası toplandı`);
        return points;
    }

    /**
     * 🎯 Katman geçiş yüzeyi oluştur (outer boundary'den yukarı extrude)
     * @param {number} layerNum - Katman numarası
     */
    createLayerTransitionSurface(layerNum) {
        const layer = this.layers[layerNum];
        if (!layer) return;

        // Eski mesh'i temizle
        if (layer.extrudeMesh) {
            this.scene.remove(layer.extrudeMesh);
            if (layer.extrudeMesh.geometry) layer.extrudeMesh.geometry.dispose();
            if (layer.extrudeMesh.material) layer.extrudeMesh.material.dispose();
            layer.extrudeMesh = null;
        }

        // Z seviyesini al
        // Transition surface layer TOP'undan başlamalı (mesh'in üstünde!)
        // Her katman: transition -> mesh sıralamasında
        const layerTop = this.viewer.getLayerZOffset(layerNum);
        const zLevel = layerTop; // Transition surface layer top'dan başlar

        // Outer boundary noktalarını al
        const boundaryPoints = this.getLayerOuterBoundary(layer, zLevel);
        if (boundaryPoints.length === 0) return;

        // Yükseklik: Kilit aktifse global, değilse katmana özel
        const extrudeHeight = this.lockHeight ? this.globalHeight : layer.transitionHeight;

        // Yükseklik 0 ise çizme
        if (extrudeHeight === 0) {
            console.log(`🎯 Layer ${layerNum} yükseklik 0, çizilmiyor`);
            return;
        }

        // Extrude mesh oluştur (flat shading için her üçgen ayrı vertex'lerle)
        const vertices = [];

        const numPoints = boundaryPoints.length;

        // Yan yüzeyler (quad'lar -> 2 triangle, her biri ayrı vertex'lerle)
        for (let i = 0; i < numPoints; i++) {
            const nextI = (i + 1) % numPoints;

            const pCurr = boundaryPoints[i];
            const pNext = boundaryPoints[nextI];

            // Üst noktalar (layer'ın üstü)
            const topCurr = { x: pCurr.x, y: pCurr.y, z: pCurr.z };
            const topNext = { x: pNext.x, y: pNext.y, z: pNext.z };

            // Alt noktalar (aşağı doğru extrude)
            const bottomCurr = { x: pCurr.x, y: pCurr.y, z: pCurr.z - extrudeHeight };
            const bottomNext = { x: pNext.x, y: pNext.y, z: pNext.z - extrudeHeight };

            // Triangle 1: bottomCurr, topCurr, bottomNext
            vertices.push(bottomCurr.x, bottomCurr.y, bottomCurr.z);
            vertices.push(topCurr.x, topCurr.y, topCurr.z);
            vertices.push(bottomNext.x, bottomNext.y, bottomNext.z);

            // Triangle 2: bottomNext, topCurr, topNext
            vertices.push(bottomNext.x, bottomNext.y, bottomNext.z);
            vertices.push(topCurr.x, topCurr.y, topCurr.z);
            vertices.push(topNext.x, topNext.y, topNext.z);
        }

        // BufferGeometry oluştur (index kullanmadan, her üçgen ayrı)
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.computeVertexNormals(); // flatShading için gerekli

        // Material (turuncu, ışık/gölge ile)
        // Not: Her üçgen için ayrı vertex'ler kullandığımız için zaten flat shading olacak
        const material = new THREE.MeshLambertMaterial({
            color: 0xc07a3a,
            side: THREE.DoubleSide
        });

        layer.extrudeMesh = new THREE.Mesh(geometry, material);
        layer.extrudeMesh.visible = layer.visible; // Katman görünürse geçiş yüzeyi de görünür
        this.scene.add(layer.extrudeMesh);

        console.log(`🎯 Layer ${layerNum} geçiş yüzeyi oluşturuldu (height: ${extrudeHeight.toFixed(2)}, locked: ${this.lockHeight})`);

        // 🎨 Gri mod aktifse uygula
        if (this.viewer.uiManager && this.viewer.uiManager.grayMode) {
            this.viewer.uiManager.refreshGrayMode();
        }
    }

    /**
     * 🎯 Tüm katmanlar için geçiş yüzeylerini oluştur
     */
    createAllTransitionSurfaces() {
        // Her katman için geçiş yüzeyini oluştur
        for (let layerNum in this.layers) {
            if (this.layers[layerNum]) {
                this.createLayerTransitionSurface(parseInt(layerNum));
            }
        }
    }

    /**
     * 🎯 Belirli bir katmanın geçiş yüzeyini temizle
     * @param {number} layerNum - Katman numarası
     */
    clearLayerTransitionSurface(layerNum) {
        const layer = this.layers[layerNum];
        if (!layer) return;

        if (layer.extrudeMesh) {
            this.scene.remove(layer.extrudeMesh);
            if (layer.extrudeMesh.geometry) layer.extrudeMesh.geometry.dispose();
            if (layer.extrudeMesh.material) layer.extrudeMesh.material.dispose();
            layer.extrudeMesh = null;
        }
    }

    /**
     * 🎯 Tüm geçiş yüzeylerini temizle
     */
    clearAllTransitionSurfaces() {
        for (let layerNum in this.layers) {
            if (this.layers[layerNum]) {
                this.clearLayerTransitionSurface(parseInt(layerNum));
            }
        }
    }

    /**
     * 🎯 Aktif katmanın yüksekliğini değiştir (cascade update ile)
     * @param {number} layerNum - Katman numarası
     * @param {number} height - Yükseklik (birim)
     */
    setLayerHeight(layerNum, height) {
        const layer = this.layers[layerNum];
        if (!layer) return;

        layer.transitionHeight = height;
        console.log(`🎯 Layer ${layerNum} geçiş yüzeyi yüksekliği: ${height}`);

        // Bu katmanın mesh'ini yeniden render et (pozisyon değişti: transitionHeight'a bağlı)
        if (typeof RenderUtils !== 'undefined') {
            RenderUtils.renderLayer(this.viewer, layerNum);
        }

        // Bu katmanın köprü yüzeylerini güncelle (mesh pozisyonu değişti)
        if (this.viewer.createBridgeSurfacesForLayer) {
            this.viewer.createBridgeSurfacesForLayer(layerNum);
        }

        // Bu katmanın geçiş yüzeyini güncelle
        this.createLayerTransitionSurface(layerNum);

        // 🎨 Eğer bu katman aktifse ve hücre seçiliyse preview'ları güncelle
        if (this.viewer.currentLayer === layerNum && this.viewer.cellEditor &&
            this.viewer.cellEditor.panelOpen && this.viewer.cellEditor.selectedCellName) {
            const cellName = this.viewer.cellEditor.selectedCellName;
            const cellObj = this.viewer.puskulGeometry.cells?.[cellName];
            const cellPos = this.viewer.puskulGeometry.cellPositions?.[cellName];
            if (cellObj && cellPos) {
                const cellType = cellObj.type || 'BADEM';
                const cellPlacement = cellPos.type === 'main' ? this.viewer.puskulPlacement :
                                     (this.viewer.puskulPlacement === 'corner' ? 'edge' : 'corner');
                this.viewer.cellEditor.highlightSelection(cellName, cellType, cellPlacement);
                console.log(`🎨 Preview'lar güncellendi (Layer ${layerNum} height değişti)`);
            }
        }

        // Child layer'ları cascade güncelle (Z offset değişti)
        this.updateChildLayersAfterHeightChange(layerNum);
        
        // 🎯 Püskül Sonu modülünü güncelle (en alt katman değişmiş olabilir)
        if (this.viewer.updatePuskulSonu) {
            this.viewer.updatePuskulSonu();
            console.log(`🎯 Püskül Sonu modülü güncellendi (Layer ${layerNum} height değişti)`);
        }
    }

    /**
     * 🎯 Global yükseklik değiştir (kilit aktifken, cascade update ile)
     * @param {number} height - Yükseklik (birim)
     */
    setGlobalHeight(height) {
        this.globalHeight = height;
        console.log(`🎯 Global geçiş yüzeyi yüksekliği: ${height} (locked: ${this.lockHeight})`);

        if (this.lockHeight) {
            // Tüm katmanları yeniden render et (mesh pozisyonları transitionHeight'a bağlı)
            if (typeof RenderUtils !== 'undefined') {
                for (let layerNum in this.layers) {
                    const layerNumInt = parseInt(layerNum);
                    RenderUtils.renderLayer(this.viewer, layerNumInt);
                }
            }

            // 🎨 Gri mod aktifse yeniden uygula (mesh'ler yeniden oluşturuldu)
            if (this.viewer.uiManager && this.viewer.uiManager.grayMode) {
                this.viewer.uiManager.refreshGrayMode();
            }

            // Tüm katmanların köprü yüzeylerini güncelle
            if (this.viewer.createAllBridgeSurfaces) {
                this.viewer.createAllBridgeSurfaces();
            }

            // Tüm katmanların geçiş yüzeylerini güncelle
            this.createAllTransitionSurfaces();

            // 🎨 Eğer aktif katmanda hücre seçiliyse preview'ları güncelle
            if (this.viewer.cellEditor && this.viewer.cellEditor.panelOpen && this.viewer.cellEditor.selectedCellName) {
                const cellName = this.viewer.cellEditor.selectedCellName;
                const cellObj = this.viewer.puskulGeometry.cells?.[cellName];
                const cellPos = this.viewer.puskulGeometry.cellPositions?.[cellName];
                if (cellObj && cellPos) {
                    const cellType = cellObj.type || 'BADEM';
                    const cellPlacement = cellPos.type === 'main' ? this.viewer.puskulPlacement :
                                         (this.viewer.puskulPlacement === 'corner' ? 'edge' : 'corner');
                    this.viewer.cellEditor.highlightSelection(cellName, cellType, cellPlacement);
                    console.log(`🎨 Preview'lar güncellendi (global height değişti)`);
                }
            }
            
            // 🎯 Püskül Sonu modülünü güncelle (tüm katmanlar değişti)
            if (this.viewer.updatePuskulSonu) {
                this.viewer.updatePuskulSonu();
                console.log(`🎯 Püskül Sonu modülü güncellendi (global height değişti)`);
            }
        }
    }

    /**
     * 🎯 Yükseklik kilidini aç/kapa (cascade update ile)
     * @param {boolean} locked - Kilit durumu
     */
    setLockHeight(locked) {
        this.lockHeight = locked;
        console.log(`🎯 Yükseklik kilidi: ${locked ? 'Aktif (tüm katmanlar aynı)' : 'Pasif (katman başına)'}`);

        // Tüm katmanları yeniden render et (mesh pozisyonları transitionHeight'a bağlı)
        if (typeof RenderUtils !== 'undefined') {
            for (let layerNum in this.layers) {
                const layerNumInt = parseInt(layerNum);
                RenderUtils.renderLayer(this.viewer, layerNumInt);
            }
        }

        // Tüm katmanların köprü yüzeylerini güncelle
        if (this.viewer.createAllBridgeSurfaces) {
            this.viewer.createAllBridgeSurfaces();
        }

        // Tüm geçiş yüzeylerini güncelle
        this.createAllTransitionSurfaces();

        // 🎨 Eğer aktif katmanda hücre seçiliyse preview'ları güncelle
        if (this.viewer.cellEditor && this.viewer.cellEditor.panelOpen && this.viewer.cellEditor.selectedCellName) {
            const cellName = this.viewer.cellEditor.selectedCellName;
            const cellObj = this.viewer.puskulGeometry.cells?.[cellName];
            const cellPos = this.viewer.puskulGeometry.cellPositions?.[cellName];
            if (cellObj && cellPos) {
                const cellType = cellObj.type || 'BADEM';
                const cellPlacement = cellPos.type === 'main' ? this.viewer.puskulPlacement :
                                     (this.viewer.puskulPlacement === 'corner' ? 'edge' : 'corner');
                this.viewer.cellEditor.highlightSelection(cellName, cellType, cellPlacement);
                console.log(`🎨 Preview'lar güncellendi (lock height değişti: ${locked})`);
            }
        }
        
        // 🎯 Püskül Sonu modülünü güncelle (kilit durumu değişti, tüm katmanlar etkilendi)
        if (this.viewer.updatePuskulSonu) {
            this.viewer.updatePuskulSonu();
            console.log(`🎯 Püskül Sonu modülü güncellendi (lock height değişti: ${locked})`);
        }
    }

    /**
     * 🎯 Geçiş yüzeylerini göster/gizle
     * @param {boolean} show - Göster/Gizle
     */
    setVisibility(show) {
        this.showTransitionSurface = show;
        console.log(`🎯 Geçiş yüzeyi görünürlük: ${show}`);

        if (show) {
            // Gösterilecekse yeniden oluştur
            this.createAllTransitionSurfaces();
        } else {
            // Gizlenecekse temizle
            this.clearAllTransitionSurfaces();
        }
    }

    /**
     * 🎯 Parent yükseklik değişiminden sonra child layer'ları cascade güncelle
     * @param {number} parentLayerNum - Parent katman numarası
     */
    updateChildLayersAfterHeightChange(parentLayerNum) {
        console.log(`🔄 Layer ${parentLayerNum} yükseklik değişti, child layer'lar güncelleniyor...`);

        // Tüm katmanları tara ve parent'ı değişen katman olanları bul
        for (let layerNum in this.layers) {
            const layer = this.layers[layerNum];
            const layerNumInt = parseInt(layerNum);

            // Bu katmanın parent'ı değişen katman mı?
            const isDirectChild = layer.parentLayer === parentLayerNum;
            const isImplicitChild = !layer.parentLayer && layerNumInt === parentLayerNum + 1;

            if (isDirectChild || isImplicitChild) {
                console.log(`  🔄 Layer ${layerNum} güncelleniyor (parent: ${parentLayerNum})`);

                // Bu katmanın mesh'ini yeniden render et (Z offset değişti)
                if (typeof RenderUtils !== 'undefined') {
                    RenderUtils.renderLayer(this.viewer, layerNumInt);
                }

                // Bu katmanın köprü yüzeylerini güncelle (mesh pozisyonu değişti)
                if (this.viewer.createBridgeSurfacesForLayer) {
                    this.viewer.createBridgeSurfacesForLayer(layerNumInt);
                }

                // Bu katmanın geçiş yüzeyini yeniden oluştur
                this.createLayerTransitionSurface(layerNumInt);

                // 🎨 Eğer bu katman aktifse ve hücre seçiliyse preview'ları güncelle
                if (this.viewer.currentLayer === layerNumInt && this.viewer.cellEditor &&
                    this.viewer.cellEditor.panelOpen && this.viewer.cellEditor.selectedCellName) {
                    const cellName = this.viewer.cellEditor.selectedCellName;
                    const cellObj = this.viewer.puskulGeometry.cells?.[cellName];
                    const cellPos = this.viewer.puskulGeometry.cellPositions?.[cellName];
                    if (cellObj && cellPos) {
                        const cellType = cellObj.type || 'BADEM';
                        const cellPlacement = cellPos.type === 'main' ? this.viewer.puskulPlacement :
                                             (this.viewer.puskulPlacement === 'corner' ? 'edge' : 'corner');
                        this.viewer.cellEditor.highlightSelection(cellName, cellType, cellPlacement);
                        console.log(`🎨 Preview'lar güncellendi (Child layer ${layerNum} cascade update)`);
                    }
                }

                // Bu katmanın da child'ları varsa onları da güncelle (recursive)
                this.updateChildLayersAfterHeightChange(layerNumInt);
            }
        }
    }
}
