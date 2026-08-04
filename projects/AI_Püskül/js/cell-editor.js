/**
 * 🔧 Cell Editor Module
 * Handles cell selection, highlight, and detail panel editing
 * Supports group editing (type + placement based grouping)
 */

class CellEditor {
    constructor(viewer) {
        this.viewer = viewer;
        this.selectedCellName = null;
        this.selectedCellGroup = null; // type_placement (e.g., "BADEM_corner")
        this.panelOpen = false;
        
        // Highlight meshes
        this.highlightMeshes = [];      // Seçili hücre (mat sarı)
        this.groupHighlightMeshes = []; // Grup hücreleri (sönük sarı)
        
        // Manual type overrides (for manual assignment mode)
        this.manualTypeOverrides = {};
        
        console.log('🔧 CellEditor initialized');
    }
    
    /**
     * 🔍 Tıklanan noktaya en yakın hücreyi bul
     */
    findClosestCell(x, y) {
        if (!this.viewer.puskulGeometry || !this.viewer.puskulGeometry.cellPositions) return null;
        
        let closestCell = null;
        let minDist = Infinity;
        
        Object.keys(this.viewer.puskulGeometry.cellPositions).forEach(cellName => {
            const pos = this.viewer.puskulGeometry.cellPositions[cellName];
            const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                closestCell = cellName;
            }
        });
        
        return closestCell;
    }
    
    /**
     * 🎯 Hücre seç ve detay panelini aç
     */
    selectCell(cellName) {
        this.selectedCellName = cellName;
        
        // Grup belirle: type + placement
        const cellObj = this.viewer.puskulGeometry.cells?.[cellName];
        const pos = this.viewer.puskulGeometry.cellPositions?.[cellName];
        if (!cellObj || !pos) return;
        
        const cellType = cellObj.type || 'BADEM';
        const cellPlacement = pos.type === 'main' ? this.viewer.puskulPlacement : 
                              (this.viewer.puskulPlacement === 'corner' ? 'edge' : 'corner');
        
        this.selectedCellGroup = `${cellType}_${cellPlacement}`;
        
        // Highlight sistemi uygula
        this.highlightSelection(cellName, cellType, cellPlacement);
        
        // Detay panelini aç ve doldur
        this.openDetailPanel(cellName, cellType, cellPlacement);
    }
    
    /**
     * 🎨 Seçili hücre ve grubunu highlight et
     */
    highlightSelection(cellName, cellType, cellPlacement) {
        // Eski highlight'ları temizle
        this.clearHighlights();

        // 🏗️ Aktif katmanın mesh Z pozisyonunu al (hücrelerle aynı seviyede olması için)
        const currentLayer = this.viewer.layers[this.viewer.currentLayer];
        const layerZOffset = currentLayer?.mesh ? currentLayer.mesh.position.z : this.viewer.getLayerZOffset(this.viewer.currentLayer);
        const geometryMaxZ = currentLayer?.geometryMaxZ || 0;

        // Seçili hücre için mat sarı highlight
        const selectedCell = this.viewer.puskulGeometry.cells?.[cellName];
        const selectedPos = this.viewer.puskulGeometry.cellPositions?.[cellName];
        if (selectedCell && selectedPos) {
            const highlight = this.createCellHighlight(
                selectedCell,
                selectedPos,
                0xFFFF00, // Mat sarı
                0.6,
                layerZOffset,
                geometryMaxZ
            );
            if (highlight) {
                this.viewer.scene.add(highlight);
                this.highlightMeshes.push(highlight);
            }
        }

        // Aynı gruptaki diğer hücreleri sönük sarı ile highlight et
        Object.keys(this.viewer.puskulGeometry.cells || {}).forEach(cName => {
            if (cName === cellName) return; // Seçili hücreyi atla

            const cellObj = this.viewer.puskulGeometry.cells[cName];
            const pos = this.viewer.puskulGeometry.cellPositions?.[cName];
            if (!cellObj || !pos) return;

            const cType = cellObj.type || 'BADEM';
            const cPlacement = pos.type === 'main' ? this.viewer.puskulPlacement :
                               (this.viewer.puskulPlacement === 'corner' ? 'edge' : 'corner');

            if (cType === cellType && cPlacement === cellPlacement) {
                const highlight = this.createCellHighlight(
                    cellObj,
                    pos,
                    0xAAAA00, // Sönük sarı
                    0.3,
                    layerZOffset,
                    geometryMaxZ
                );
                if (highlight) {
                    this.viewer.scene.add(highlight);
                    this.groupHighlightMeshes.push(highlight);
                }
            }
        });

        console.log(`🎨 Highlight: 1 seçili + ${this.groupHighlightMeshes.length} grup (mesh.position.z: ${layerZOffset.toFixed(2)}, geometryMaxZ: ${geometryMaxZ.toFixed(2)})`);
    }
    
    /**
     * 🔨 Tek hücre için highlight mesh oluştur
     */
    createCellHighlight(cellObj, position, color, opacity, layerZOffset = 0, geometryMaxZ = 0) {
        if (!cellObj || !cellObj.getVertices || !cellObj.getIndices) return null;

        // Hücre geometrisini klonla
        const vertices = cellObj.getVertices();
        const indices = cellObj.getIndices();

        const geometry = new THREE.BufferGeometry();
        const transformedVerts = [];

        // Rotasyon ve pozisyon uygula
        const cos = Math.cos(position.rotation);
        const sin = Math.sin(position.rotation);

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const z = vertices[i + 2];

            // Rotasyon
            const rx = x * cos - y * sin;
            const ry = x * sin + y * cos;

            // Pozisyon ekle + mesh Z pozisyonu + geometryMaxZ
            // render-utils.js'deki mesh.position.z = zOffset - transitionHeight - geometryMaxZ
            // formülüne uygun olarak preview'lar da aynı seviyeye yerleştirilir
            transformedVerts.push(
                rx + position.x,
                ry + position.y,
                z + position.z + layerZOffset + geometryMaxZ  // 🏗️ Mesh seviyesine hizalama
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(transformedVerts, 3));
        geometry.setIndex(Array.from(indices));
        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            side: THREE.DoubleSide,
            depthTest: false // Her zaman üstte göster
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = 999; // En üstte render et

        return mesh;
    }
    
    /**
     * 🎯 Püskül Sonu için highlight mesh oluştur
     */
    createPuskulSonuHighlight() {
        if (!this.viewer.puskulSonu.mesh) return;
        
        const mesh = this.viewer.puskulSonu.mesh;
        const geometry = mesh.geometry.clone();
        
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,  // Sarı
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthTest: false
        });
        
        const highlightMesh = new THREE.Mesh(geometry, material);
        highlightMesh.position.copy(mesh.position);
        highlightMesh.rotation.copy(mesh.rotation);
        highlightMesh.scale.copy(mesh.scale);
        highlightMesh.renderOrder = 999;
        
        this.viewer.scene.add(highlightMesh);
        this.highlightMeshes.push(highlightMesh);
    }
    
    /**
     * 🧹 Highlight'ları temizle
     */
    clearHighlights() {
        this.highlightMeshes.forEach(m => this.viewer.scene.remove(m));
        this.highlightMeshes = [];
        this.groupHighlightMeshes.forEach(m => this.viewer.scene.remove(m));
        this.groupHighlightMeshes = [];
    }
    
    /**
     * 📋 Detay panelini aç
     */
    openDetailPanel(cellName, cellType, placement) {
        const panel = document.getElementById('cell-detail-panel');
        if (!panel) return;
        
        panel.style.display = 'block';
        this.panelOpen = true;
        
        // 🖼️ PIP'i sola kaydır (Y değişmesin - üstte kalsın)
        const pipContainer = document.getElementById('pip-container');
        if (pipContainer) {
            pipContainer.style.left = 'auto';
            pipContainer.style.right = '304px'; // Detay panelinin soluna
            pipContainer.style.top = '12px'; // Üst hizada (Y değişmez)
            pipContainer.style.bottom = 'auto';
        }
        
        // 🎯 PÜSKÜL SONU için özel panel
        if (cellType === 'PUSKUL_SONU') {
            this.openPuskulSonuPanel();
            return;
        }
        
        // 🔄 Normal hücre paneli açılıyorsa, Püskül Sonu kontrollerini gizle ve standart kontrolleri göster
        const puskulSonuContainer = document.getElementById('puskul-sonu-controls');
        if (puskulSonuContainer) {
            puskulSonuContainer.style.display = 'none';
        }
        
        // Tüm standart kontrolleri yeniden göster (Püskül Sonu tarafından gizlenmişlerse)
        const allControls = panel.querySelectorAll('div, h4, label, input, select, button');
        allControls.forEach(el => {
            // Püskül Sonu container'ını atla
            if (el.id !== 'puskul-sonu-controls' && !el.closest('#puskul-sonu-controls')) {
                // Sadece style.display = 'none' olanları göster
                if (el.style.display === 'none') {
                    el.style.display = '';
                }
            }
        });
        
        // Grup adını göster
        const groupName = document.getElementById('detail-group-name');
        if (groupName) groupName.textContent = `${cellType} (${placement})`;
        
        // 🎯 Ratio 3 (w5, z5) sadece BADEM için
        var ratio3El = document.getElementById('detail-ratio3');
        var ratio3Container = ratio3El ? ratio3El.parentElement : null;
        if (ratio3Container) {
            ratio3Container.style.display = (cellType === 'BADEM') ? 'block' : 'none';
        }
        
        // 🎯 KAZAYAGI için ratio 3 gizle (ratioZ5 yok)
        if (cellType === 'KAZAYAGI') {
            if (ratio3Container) {
                ratio3Container.style.display = 'none';
            }
        }
        
        // Mevcut ratio değerlerini al
        const cellObj = this.viewer.puskulGeometry.cells?.[cellName];
        if (cellObj && cellObj.geometry) {
            const geo = cellObj.geometry;
            // 🎯 TÜM HÜCRE TİPLERİ: 0-1 arası normalize oran
            let r1, r2, r3;
            if (cellType === 'BADEM') {
                // Yerleşime göre default değerler
                const layer = this.viewer.layers[this.viewer.currentLayer];
                const isEdgePlacement = layer && layer.placement === 'edge';

                r1 = geo.slaveRatio || 0.09; // Her iki durumda da aynı
                r2 = geo.slaveRatio2 || (isEdgePlacement ? 0.2 : 0.096);
                r3 = geo.ratioZ5 || 0.35; // Varsayılan 0.35
            } else if (cellType === 'YAPRAK') {
                r1 = geo.slaveRatio || 0.09;
                r2 = geo.slaveRatio2 || 0.096;
                r3 = 0.09; // ratioZ5 yok ama göster
            } else if (cellType === 'KAZAYAGI') {
                r1 = geo.slaveRatio || 0.09; // 🎯 Artık normalize (0-1)
                r2 = geo.slaveRatio2 || 0.186; // 🎯 Artık normalize (0-1)
                r3 = 0.09; // ratioZ5 yok
            } else { // FITIL
                // Yerleşime göre default değerler
                const layer = this.viewer.layers[this.viewer.currentLayer];
                const isEdgePlacement = layer && layer.placement === 'edge';

                if (isEdgePlacement) {
                    r1 = geo.slaveRatio || 0.01; // Kenar yerleşimi için
                    r2 = geo.slaveRatio2 || 0.045; // Kenar yerleşimi için
                } else {
                    r1 = geo.slaveRatio || 0.09; // Köşe yerleşimi için
                    r2 = geo.slaveRatio2 || 0.096; // Köşe yerleşimi için
                }
                r3 = 0.09;
            }
            
            document.getElementById('detail-ratio1').value = r1;
            document.getElementById('detail-ratio1-label').textContent = r1.toFixed(3);
            document.getElementById('detail-ratio2').value = r2;
            document.getElementById('detail-ratio2-label').textContent = r2.toFixed(3);
            
            // Ratio 2 toplam göster (ratio1 + ratio2)
            const r2Total = r1 + r2;
            const r2TotalSpan = document.getElementById('detail-ratio2-total');
            if (r2TotalSpan) r2TotalSpan.textContent = r2Total.toFixed(3);
            
            document.getElementById('detail-ratio3').value = r3;
            document.getElementById('detail-ratio3-label').textContent = r3.toFixed(3);
            
            // 🎯 Z Level değerlerini göster
            const zLevels = geo.zLevels || { z2: 5, z3: 30, z4: 35, z5: 65, z6: 85 };
            document.getElementById('detail-z2').value = zLevels.z2;
            document.getElementById('detail-z2-label').textContent = `${zLevels.z2}/91`;
            document.getElementById('detail-z3').value = zLevels.z3;
            document.getElementById('detail-z3-label').textContent = `${zLevels.z3}/91`;
            document.getElementById('detail-z4').value = zLevels.z4;
            document.getElementById('detail-z4-label').textContent = `${zLevels.z4}/91`;
            document.getElementById('detail-z5').value = zLevels.z5;
            document.getElementById('detail-z5-label').textContent = `${zLevels.z5}/91`;
            document.getElementById('detail-z6').value = zLevels.z6;
            document.getElementById('detail-z6-label').textContent = `${zLevels.z6}/91`;
        }
        
        // Event listener'ları ekle
        this.addEventListeners();
        
        console.log('📋 Detay paneli açıldı:', this.selectedCellGroup);
    }
    
    /**
     * 🎧 Event listener'ları ekle (realtime güncelleme için)
     */
    addEventListeners() {
        // Önce eski listener'ları temizle
        this.removeEventListeners();
        
        // Bound fonksiyonları sakla (removeEventListener için)
        this.ratio1Handler = () => {
        const ratio1Slider = document.getElementById('detail-ratio1');
                const r1Val = parseFloat(ratio1Slider.value);
                document.getElementById('detail-ratio1-label').textContent = r1Val.toFixed(3);
                const r2Elem = document.getElementById('detail-ratio2');
                const r2 = r2Elem ? parseFloat(r2Elem.value) : 0;
                const r2Total = r1Val + r2;
                const r2TotalElem = document.getElementById('detail-ratio2-total');
                if (r2TotalElem) r2TotalElem.textContent = r2Total.toFixed(3);
                this.previewEdits();
        };
        
        this.ratio2Handler = () => {
            const ratio2Slider = document.getElementById('detail-ratio2');
                const r2Val = parseFloat(ratio2Slider.value);
                document.getElementById('detail-ratio2-label').textContent = r2Val.toFixed(3);
                const r1Elem = document.getElementById('detail-ratio1');
                const r1 = r1Elem ? parseFloat(r1Elem.value) : 0;
                const r2Total = r1 + r2Val;
                const r2TotalElem = document.getElementById('detail-ratio2-total');
                if (r2TotalElem) r2TotalElem.textContent = r2Total.toFixed(3);
                this.previewEdits();
        };
        
        this.ratio3Handler = () => {
            const ratio3Slider = document.getElementById('detail-ratio3');
            document.getElementById('detail-ratio3-label').textContent = parseFloat(ratio3Slider.value).toFixed(3);
            this.previewEdits();
        };
        
        this.z2Handler = () => {
            const z2Slider = document.getElementById('detail-z2');
            document.getElementById('detail-z2-label').textContent = `${z2Slider.value}/91`;
            this.previewEdits();
        };
        
        this.z3Handler = () => {
            const z3Slider = document.getElementById('detail-z3');
            document.getElementById('detail-z3-label').textContent = `${z3Slider.value}/91`;
            this.previewEdits();
        };
        
        this.z4Handler = () => {
            const z4Slider = document.getElementById('detail-z4');
            document.getElementById('detail-z4-label').textContent = `${z4Slider.value}/91`;
            this.previewEdits();
        };
        
        this.z5Handler = () => {
            const z5Slider = document.getElementById('detail-z5');
            document.getElementById('detail-z5-label').textContent = `${z5Slider.value}/91`;
            this.previewEdits();
        };
        
        this.z6Handler = () => {
            const z6Slider = document.getElementById('detail-z6');
            document.getElementById('detail-z6-label').textContent = `${z6Slider.value}/91`;
            this.previewEdits();
        };
        
        // Ratio slider'ları
        const ratio1Slider = document.getElementById('detail-ratio1');
        const ratio2Slider = document.getElementById('detail-ratio2');
        const ratio3Slider = document.getElementById('detail-ratio3');
        
        if (ratio1Slider) {
            ratio1Slider.addEventListener('input', this.ratio1Handler);
        }
        if (ratio2Slider) {
            ratio2Slider.addEventListener('input', this.ratio2Handler);
        }
        if (ratio3Slider) {
            ratio3Slider.addEventListener('input', this.ratio3Handler);
        }
        
        // Z Level slider'ları
        const z2Slider = document.getElementById('detail-z2');
        const z3Slider = document.getElementById('detail-z3');
        const z4Slider = document.getElementById('detail-z4');
        const z5Slider = document.getElementById('detail-z5');
        const z6Slider = document.getElementById('detail-z6');
        
        if (z2Slider) {
            z2Slider.addEventListener('input', this.z2Handler);
        }
        if (z3Slider) {
            z3Slider.addEventListener('input', this.z3Handler);
        }
        if (z4Slider) {
            z4Slider.addEventListener('input', this.z4Handler);
        }
        if (z5Slider) {
            z5Slider.addEventListener('input', this.z5Handler);
        }
        if (z6Slider) {
            z6Slider.addEventListener('input', this.z6Handler);
        }
    }
    
    /**
     * 🎧 Event listener'ları kaldır
     */
    removeEventListeners() {
        // Ratio slider'ları
        const ratio1Slider = document.getElementById('detail-ratio1');
        const ratio2Slider = document.getElementById('detail-ratio2');
        const ratio3Slider = document.getElementById('detail-ratio3');
        
        if (ratio1Slider && this.ratio1Handler) {
            ratio1Slider.removeEventListener('input', this.ratio1Handler);
        }
        if (ratio2Slider && this.ratio2Handler) {
            ratio2Slider.removeEventListener('input', this.ratio2Handler);
        }
        if (ratio3Slider && this.ratio3Handler) {
            ratio3Slider.removeEventListener('input', this.ratio3Handler);
        }
        
        // Z Level slider'ları
        const z2Slider = document.getElementById('detail-z2');
        const z3Slider = document.getElementById('detail-z3');
        const z4Slider = document.getElementById('detail-z4');
        const z5Slider = document.getElementById('detail-z5');
        const z6Slider = document.getElementById('detail-z6');
        
        if (z2Slider && this.z2Handler) {
            z2Slider.removeEventListener('input', this.z2Handler);
        }
        if (z3Slider && this.z3Handler) {
            z3Slider.removeEventListener('input', this.z3Handler);
        }
        if (z4Slider && this.z4Handler) {
            z4Slider.removeEventListener('input', this.z4Handler);
        }
        if (z5Slider && this.z5Handler) {
            z5Slider.removeEventListener('input', this.z5Handler);
        }
        if (z6Slider && this.z6Handler) {
            z6Slider.removeEventListener('input', this.z6Handler);
        }
    }
    
    /**
     * ✕ Detay panelini kapat
     */
    closeDetailPanel() {
        // Event listener'ları kaldır
        this.removeEventListeners();
        
        const panel = document.getElementById('cell-detail-panel');
        if (panel) panel.style.display = 'none';
        this.panelOpen = false;
        this.selectedCellName = null;
        this.selectedCellGroup = null;
        
        // 🖼️ PIP'i sağ üste geri al (varsayılan pozisyon)
        const pipContainer = document.getElementById('pip-container');
        if (pipContainer) {
            pipContainer.style.bottom = 'auto';
            pipContainer.style.left = 'auto';
            pipContainer.style.right = '12px';
            pipContainer.style.top = '12px';
        }
        
        // Highlight'ları temizle
        this.clearHighlights();
    }
    
    /**
     * 👁️ Seçili hücrede realtime preview (sadece seçili hücre güncellenir)
     */
    previewEdits() {
        if (!this.selectedCellName) return;
        
        const cellObj = this.viewer.puskulGeometry.cells?.[this.selectedCellName];
        const cellPos = this.viewer.puskulGeometry.cellPositions?.[this.selectedCellName];
        if (!cellObj || !cellObj.geometry || !cellPos) return;
        
        const cellType = cellObj.type || 'BADEM';
        const ratio1Elem = document.getElementById('detail-ratio1');
        const ratio2Elem = document.getElementById('detail-ratio2');
        const ratio3Elem = document.getElementById('detail-ratio3');
        const r1 = ratio1Elem ? parseFloat(ratio1Elem.value) : 0.09;
        const r2 = ratio2Elem ? parseFloat(ratio2Elem.value) : 0.186;
        const r3 = ratio3Elem ? parseFloat(ratio3Elem.value) : 0.09; // ratioZ5
        
        // 🎯 Z Level değerlerini al
        const z2Elem = document.getElementById('detail-z2');
        const z3Elem = document.getElementById('detail-z3');
        const z4Elem = document.getElementById('detail-z4');
        const z5Elem = document.getElementById('detail-z5');
        const z6Elem = document.getElementById('detail-z6');
        const zLevels = {
            z2: z2Elem ? parseInt(z2Elem.value) : 5,
            z3: z3Elem ? parseInt(z3Elem.value) : 30,
            z4: z4Elem ? parseInt(z4Elem.value) : 35,
            z5: z5Elem ? parseInt(z5Elem.value) : 65,
            z6: z6Elem ? parseInt(z6Elem.value) : 85
        };
        
        // 🎯 Depth: a1/c1 offset pasif olduğu için varsayılan değer kullan
        const newDepth = cellPos.depth;
        
        // 🎯 TÜM HÜCRE TİPLERİ: 0-1 arası normalize oran kullanıyor
        // BADEM: oran (0-1)
        if (cellType === 'BADEM') {
            cellObj.geometry.M = newDepth;
            cellObj.geometry.slaveRatio = r1;
            cellObj.geometry.slaveRatio2 = r2;
            cellObj.geometry.ratioZ5 = r3;
            cellObj.geometry.zLevels = zLevels;
            const newGeom = cellObj.geometry.updateDimensions(
                newDepth, 
                this.viewer.H, 
                r1, 
                r2,
                r3, // ratioZ5
                zLevels
            );
            this.updateCellVertices(cellObj, newGeom);
        }
        // KAZAYAGI: oran (0-1) - Artık normalize
        else if (cellType === 'KAZAYAGI') {
            console.log('🦶 KAZAYAGI preview:', { r1, r2, zLevels });
            cellObj.geometry.M = newDepth;
            cellObj.geometry.slaveRatio = r1; // 🎯 Normalize (0-1)
            cellObj.geometry.slaveRatio2 = r2; // 🎯 Normalize (0-1)
            cellObj.geometry.zLevels = zLevels;
            const newGeom = cellObj.geometry.updateDimensions(
                newDepth, 
                this.viewer.H, 
                r1, 
                r2,
                zLevels
            );
            this.updateCellVertices(cellObj, newGeom);
        }
        // YAPRAK: oran (0-1) - Badem gibi
        else if (cellType === 'YAPRAK') {
            cellObj.geometry.M = newDepth;
            cellObj.geometry.slaveRatio = r1;
            cellObj.geometry.slaveRatio2 = r2;
            cellObj.geometry.zLevels = zLevels;
            if (cellObj.geometry.radialRatio !== undefined) {
                cellObj.geometry.radialRatio = this.viewer.bademRadialRatio;
            }
            if (cellObj.geometry.narrowFactor !== undefined) {
                cellObj.geometry.narrowFactor = this.viewer.bademNarrowFactor;
            }
            const newGeom = cellObj.geometry.updateDimensions(
                newDepth, 
                this.viewer.H, 
                r1, 
                r2,
                null, // ratioZ5 yok
                zLevels,
                this.viewer.bademRadialRatio,
                this.viewer.bademNarrowFactor
            );
            this.updateCellVertices(cellObj, newGeom);
        }
        // FITIL: oran (0-1) - Artık normalize
        else if (cellType === 'FITIL') {
            cellObj.geometry.M = newDepth;
            cellObj.geometry.slaveRatio = r1; // 🎯 Normalize (0-1)
            cellObj.geometry.slaveRatio2 = r2; // 🎯 Normalize (0-1)
            cellObj.geometry.zLevels = zLevels;
            const newGeom = cellObj.geometry.updateDimensions(
                newDepth, 
                this.viewer.H, 
                r1, 
                r2,
                zLevels
            );
            this.updateCellVertices(cellObj, newGeom);
        }
        
        // 🏗️ Aktif katmanın mesh'ini güncelle
        const currentLayer = this.viewer.layers[this.viewer.currentLayer];
        if (currentLayer && currentLayer.mesh) {
            const geometry = this.viewer.puskulGeometry.createThreeGeometry();
            currentLayer.mesh.geometry.dispose();
            currentLayer.mesh.geometry = geometry;

            // 🔲 Wireframe'i de güncelle
            if (currentLayer.wireframeMesh) {
                const edgesGeometry = new THREE.EdgesGeometry(geometry, 1);
                currentLayer.wireframeMesh.geometry.dispose();
                currentLayer.wireframeMesh.geometry = edgesGeometry;
            }

            // Geriye uyumluluk için global mesh'leri de güncelle (eğer aktif katmansa)
            if (this.viewer.puskulMesh === currentLayer.mesh) {
                this.viewer.puskulMesh.geometry = geometry;
            }
            if (this.viewer.wireframeMesh === currentLayer.wireframeMesh) {
                this.viewer.wireframeMesh.geometry = currentLayer.wireframeMesh.geometry;
            }
        }

        // 🌉 Köprü yüzeylerini de güncelle (sadece aktif katman için)
        this.viewer.createBridgeSurfacesForLayer(this.viewer.currentLayer);

        // 🎨 Tüm highlight'ları yenile (hem seçili hem grup)
        if (this.selectedCellName && this.selectedCellGroup) {
            const [cellType, placement] = this.selectedCellGroup.split('_');
            this.highlightSelection(this.selectedCellName, cellType, placement);
        }
    }
    
    /**
     * ✅ Detay panelindeki değişiklikleri uygula (grup veya tek hücre)
     */
    applyEdits() {
        if (!this.selectedCellName || !this.selectedCellGroup) return;
        
        // Panelden değerleri al
        const ratio1Elem = document.getElementById('detail-ratio1');
        const ratio2Elem = document.getElementById('detail-ratio2');
        const ratio3Elem = document.getElementById('detail-ratio3');
        const applyScopeElem = document.getElementById('detail-apply-scope');
        const zAllLayerElem = document.getElementById('detail-z-all-layer');
        const r1 = ratio1Elem ? parseFloat(ratio1Elem.value) : 0.09;
        const r2 = ratio2Elem ? parseFloat(ratio2Elem.value) : 0.186;
        const r3 = ratio3Elem ? parseFloat(ratio3Elem.value) : 0.09; // ratioZ5
        const applyScope = applyScopeElem ? applyScopeElem.value : 'single';
        const zAllLayer = zAllLayerElem ? zAllLayerElem.checked : false;
        
        // 🎯 Z Level değerlerini al
        const z2Elem = document.getElementById('detail-z2');
        const z3Elem = document.getElementById('detail-z3');
        const z4Elem = document.getElementById('detail-z4');
        const z5Elem = document.getElementById('detail-z5');
        const z6Elem = document.getElementById('detail-z6');
        const zLevels = {
            z2: z2Elem ? parseInt(z2Elem.value) : 5,
            z3: z3Elem ? parseInt(z3Elem.value) : 30,
            z4: z4Elem ? parseInt(z4Elem.value) : 35,
            z5: z5Elem ? parseInt(z5Elem.value) : 65,
            z6: z6Elem ? parseInt(z6Elem.value) : 85
        };
        
        // Grup belirleme: type_placement
        const [cellType, placement] = this.selectedCellGroup.split('_');

        console.log(`🎯 Apply scope: ${applyScope}, Cell type: ${cellType}, Placement: ${placement}`);

        // Apply scope'a göre hücreleri belirle
        const cellsToUpdate = [];
        const zCellsToUpdate = []; // Z level için ayrı liste

        if (applyScope === 'single') {
            cellsToUpdate.push(this.selectedCellName);
            console.log(`📌 Single mode: Sadece ${this.selectedCellName} güncellenecek`);
        } else {
            // Grup: aynı type ve placement'taki tüm hücreler
            Object.keys(this.viewer.puskulGeometry.cells || {}).forEach(cellName => {
                const cellObj = this.viewer.puskulGeometry.cells[cellName];
                const pos = this.viewer.puskulGeometry.cellPositions?.[cellName];
                if (!cellObj || !pos) return;
                
                const cType = cellObj.type || 'BADEM';
                const cPlacement = pos.type === 'main' ? this.viewer.puskulPlacement : 
                                   (this.viewer.puskulPlacement === 'corner' ? 'edge' : 'corner');
                
                if (cType === cellType && cPlacement === placement) {
                    cellsToUpdate.push(cellName);
                }
            });
            console.log(`📌 Group mode: ${cellsToUpdate.length} hücre güncellenecek (${cellType}, ${placement})`);
        }
        
        // 🎯 Z Level için: "Tüm katman" seçiliyse TÜM hücreler (tip bağımsız)
        if (zAllLayer) {
            Object.keys(this.viewer.puskulGeometry.cells || {}).forEach(cellName => {
                zCellsToUpdate.push(cellName);
            });
        } else {
            // Normal: sadece grup/single
            zCellsToUpdate.push(...cellsToUpdate);
        }
        
        // Prefix belirle (grup için aynı)
        const prefix = cellType === 'FITIL' ? 'F' : 'B';
        
        // Her hücre için güncelle
        cellsToUpdate.forEach(cellName => {
            const cellObj = this.viewer.puskulGeometry.cells?.[cellName];
            const cellPos = this.viewer.puskulGeometry.cellPositions?.[cellName];
            if (!cellObj || !cellObj.geometry || !cellPos) return;
            
            // 🎯 Depth: a1/c1 offset pasif olduğu için varsayılan değer kullan
            const newDepth = cellPos.depth;
            
            // 🎯 TÜM HÜCRE TİPLERİ: 0-1 arası normalize oran kullanıyor
            // BADEM: oran (0-1)
            if (cellType === 'BADEM') {
                cellObj.geometry.M = newDepth;
                cellObj.geometry.slaveRatio = r1;
                cellObj.geometry.slaveRatio2 = r2;
                cellObj.geometry.ratioZ5 = r3;
                cellObj.geometry.zLevels = zLevels;
                const newGeom = cellObj.geometry.updateDimensions(
                    newDepth,
                    this.viewer.H,
                    r1,
                    r2,
                    r3, // ratioZ5
                    zLevels
                );
                this.updateCellVertices(cellObj, newGeom);
            }
            // KAZAYAGI: oran (0-1) - Artık normalize
            else if (cellType === 'KAZAYAGI') {
                cellObj.geometry.M = newDepth;
                cellObj.geometry.slaveRatio = r1; // 🎯 Normalize (0-1)
                cellObj.geometry.slaveRatio2 = r2; // 🎯 Normalize (0-1)
                cellObj.geometry.zLevels = zLevels;
                const newGeom = cellObj.geometry.updateDimensions(
                    newDepth, 
                    this.viewer.H, 
                    r1, 
                    r2,
                    zLevels
                );
                this.updateCellVertices(cellObj, newGeom);
            }
            // YAPRAK: oran (0-1) - Badem gibi
            else if (cellType === 'YAPRAK') {
                cellObj.geometry.M = newDepth;
                cellObj.geometry.slaveRatio = r1;
                cellObj.geometry.slaveRatio2 = r2;
                cellObj.geometry.zLevels = zLevels;
                if (cellObj.geometry.radialRatio !== undefined) {
                    cellObj.geometry.radialRatio = this.viewer.bademRadialRatio;
                }
                if (cellObj.geometry.narrowFactor !== undefined) {
                    cellObj.geometry.narrowFactor = this.viewer.bademNarrowFactor;
                }
                const newGeom = cellObj.geometry.updateDimensions(
                    newDepth, 
                    this.viewer.H, 
                    r1, 
                    r2,
                    null, // ratioZ5 yok
                    zLevels,
                    this.viewer.bademRadialRatio,
                    this.viewer.bademNarrowFactor
                );
                this.updateCellVertices(cellObj, newGeom);
            }
            // FITIL: oran (0-1) - Artık normalize
            else if (cellType === 'FITIL') {
                cellObj.geometry.M = newDepth;
                cellObj.geometry.slaveRatio = r1; // 🎯 Normalize (0-1)
                cellObj.geometry.slaveRatio2 = r2; // 🎯 Normalize (0-1)
                cellObj.geometry.zLevels = zLevels;
                const newGeom = cellObj.geometry.updateDimensions(
                    newDepth, 
                    this.viewer.H, 
                    r1, 
                    r2,
                    zLevels
                );
                this.updateCellVertices(cellObj, newGeom);
            }
        });
        
        // 🎯 Z Level'ı ayrı olarak uygula (zCellsToUpdate listesine)
        if (zAllLayer || zCellsToUpdate.length > 0) {
            zCellsToUpdate.forEach(cellName => {
                const cellObj = this.viewer.puskulGeometry.cells?.[cellName];
                if (!cellObj || !cellObj.geometry) return;
                
                cellObj.geometry.zLevels = zLevels;
                const cType = cellObj.type || 'BADEM';
                const cPrefix = cType === 'FITIL' ? 'F' : 'B';
                
                if (cType === 'BADEM') {
                    const newGeom = cellObj.geometry.updateDimensions(
                        cellObj.geometry.M,
                        this.viewer.H,
                        cellObj.geometry.slaveRatio,
                        cellObj.geometry.slaveRatio2,
                        cellObj.geometry.ratioZ5,
                        zLevels
                    );
                    this.updateCellVertices(cellObj, newGeom);
                } else if (cType === 'KAZAYAGI') {
                    const newGeom = cellObj.geometry.updateDimensions(
                        cellObj.geometry.M,
                        this.viewer.H,
                        cellObj.geometry.slaveRatio,
                        cellObj.geometry.slaveRatio2,
                        zLevels
                    );
                    this.updateCellVertices(cellObj, newGeom);
                } else if (cType === 'YAPRAK') {
                    const newGeom = cellObj.geometry.updateDimensions(
                        cellObj.geometry.M,
                        this.viewer.H,
                        cellObj.geometry.slaveRatio,
                        cellObj.geometry.slaveRatio2,
                        null, // ratioZ5 yok
                        zLevels,
                        cellObj.geometry.radialRatio, // radialRatio ekle
                        cellObj.geometry.narrowFactor // narrowFactor ekle
                    );
                    this.updateCellVertices(cellObj, newGeom);
                } else if (cType === 'FITIL') {
                    const newGeom = cellObj.geometry.updateDimensions(
                        cellObj.geometry.M,
                        this.viewer.H,
                        cellObj.geometry.slaveRatio,
                        cellObj.geometry.slaveRatio2,
                        zLevels
                    );
                    this.updateCellVertices(cellObj, newGeom);
                }
            });
        }
        
        // 📊 Özel parametreleri kaydet (backup/restore için)
        cellsToUpdate.forEach(cellName => {
            if (!this.viewer.cellCustomParams[cellName]) {
                this.viewer.cellCustomParams[cellName] = {};
            }
            this.viewer.cellCustomParams[cellName].ratio1 = r1;
            this.viewer.cellCustomParams[cellName].ratio2 = r2;
            this.viewer.cellCustomParams[cellName].ratio3 = r3;
        });
        
        // Z level'ları kaydet
        zCellsToUpdate.forEach(cellName => {
            if (!this.viewer.cellCustomParams[cellName]) {
                this.viewer.cellCustomParams[cellName] = {};
            }
            this.viewer.cellCustomParams[cellName].zLevels = { ...zLevels };
        });
        
        console.log(`📊 Parametreler kaydedildi: ${cellsToUpdate.length} hücre (ratio), ${zCellsToUpdate.length} hücre (zLevels)`);

        // Birleşik mesh'i güncelle (köprü yüzeyleri de dahil)
        // skipChildReload=true: Sadece hücre parametreleri değişti, child layer'ları yenileme
        this.viewer.updateGeometryAfterCellLoad(true);

        // 🎨 Highlight'ı yenile (grup güncellendi)
        if (applyScope === 'group') {
            const [cellType, placement] = this.selectedCellGroup.split('_');
            this.highlightSelection(this.selectedCellName, cellType, placement);
        }

        console.log(`✅ ${cellsToUpdate.length} hücre güncellendi (${applyScope}): r1=${r1.toFixed(3)}, r2=${r2.toFixed(3)}, r3=${r3.toFixed(3)}`);
        if (zAllLayer) console.log(`✅ ${zCellsToUpdate.length} hücreye Z level uygulandı (TÜM KATMAN)`);
        else console.log(`✅ ${zCellsToUpdate.length} hücreye Z level uygulandı (grup/single)`);
    }
    
    /**
     * 🔄 Hücre vertices/indices güncelle (helper)
     */
    updateCellVertices(cellObj, newGeometry) {
        const newPositions = newGeometry.attributes.position.array;
        const verts = cellObj.getVertices();
        verts.length = 0;
        for (let i = 0; i < newPositions.length; i++) verts.push(newPositions[i]);
        
        const idx = newGeometry.index.array;
        const inds = cellObj.getIndices();
        inds.length = 0;
        for (let i = 0; i < idx.length; i++) inds.push(idx[i]);
    }
    
    /**
     * 🎮 Event listener'ları bağla
     */
    setupEventListeners() {
        // Panel kapat butonu
        const closeBtn = document.getElementById('close-detail-panel');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDetailPanel());
        }
        
        // Ratio ve Z Level sliderları için event listener'lar
        // addEventListeners() fonksiyonu içinde panel açılırken ekleniyor
        // Bu duplicate event listener'ları önler
        
        // Apply butonu
        const applyBtn = document.getElementById('detail-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyEdits());
        }
        
        console.log('🎮 CellEditor event listeners kuruldu');
    }
    
    /**
     * 🎯 Püskül Sonu için özel panel aç
     */
    openPuskulSonuPanel() {
        const panel = document.getElementById('cell-detail-panel');
        if (!panel) return;
        
        // State'i ayarla
        this.panelOpen = true;
        this.selectedCellName = 'PUSKUL_SONU';
        this.selectedCellGroup = 'PUSKUL_SONU';
        
        // Grup adını göster
        const groupName = document.getElementById('detail-group-name');
        if (groupName) groupName.textContent = 'PÜSKÜL SONU';
        
        // Tüm kontrolleri gizle (X butonu ve parent container'ı hariç)
        const allControls = panel.querySelectorAll('div, h4, label, input, select, button');
        allControls.forEach(el => {
            // X butonu ve parent container'ı koru
            const isCloseBtn = el.id === 'close-detail-panel';
            const hasCloseBtn = el.querySelector && el.querySelector('#close-detail-panel') !== null;
            const isGroupName = el.id === 'detail-group-name';
            const isPuskulSonu = el.id && el.id.includes('puskul-sonu-');
            
            if (!isCloseBtn && !hasCloseBtn && !isGroupName && !isPuskulSonu) {
                el.style.display = 'none';
            }
        });
        
        // Püskül Sonu kontrollerini oluştur (eğer yoksa)
        let puskulSonuContainer = document.getElementById('puskul-sonu-controls');
        if (!puskulSonuContainer) {
            puskulSonuContainer = document.createElement('div');
            puskulSonuContainer.id = 'puskul-sonu-controls';
            puskulSonuContainer.style.marginTop = '10px';
            panel.appendChild(puskulSonuContainer);
        }
        puskulSonuContainer.style.display = 'block';
        
        // ✕ Kapat (X) butonu - HTML'de zaten mevcut, sadece görünürlüğünü garanti et
        const closeBtn = document.getElementById('close-detail-panel');
        if (closeBtn) {
            closeBtn.style.display = 'inline-block';
            closeBtn.style.visibility = 'visible';
        }
        
        // Panel'i göster
        panel.style.display = 'block';
        
        // Mevcut değerleri al
        const H = this.viewer.puskulSonu.H;
        const fillet = this.viewer.puskulSonu.fillet;
        const filletSegments = this.viewer.puskulSonu.filletSegments;
        
        // HTML içeriğini oluştur
        puskulSonuContainer.innerHTML = `
            <h4>Püskül Sonu Ayarları</h4>
            <div class="control-group">
                <label for="puskul-sonu-h-slider">Yükseklik (H): <span id="puskul-sonu-h-label">${H}</span></label>
                <input type="range" id="puskul-sonu-h-slider" min="40" max="200" step="10" value="${H}">
                <p class="hint">Püskül Sonu modülünün yüksekliği (40-200).</p>
            </div>
            <div class="control-group">
                <label for="puskul-sonu-fillet-slider">Fillet: <span id="puskul-sonu-fillet-label">${fillet.toFixed(1)}</span></label>
                <input type="range" id="puskul-sonu-fillet-slider" min="0" max="${Math.min(200, H)}" step="0.5" value="${fillet}">
                <p class="hint">Köşe yuvarlatma yarıçapı (0-200, max: H değeri).</p>
            </div>
            <div class="control-group">
                <label for="puskul-sonu-segments-slider">Fillet segment sayısı: <span id="puskul-sonu-segments-label">${filletSegments}</span></label>
                <input type="range" id="puskul-sonu-segments-slider" min="1" max="32" step="1" value="${filletSegments}">
                <p class="hint">Fillet yayı için segment sayısı (1-32).</p>
            </div>
            <button id="puskul-sonu-apply" class="btn btn-primary btn-block">Uygula</button>
        `;
        
        // Event listener'ları ekle
        const hSlider = document.getElementById('puskul-sonu-h-slider');
        const filletSlider = document.getElementById('puskul-sonu-fillet-slider');
        const segmentsSlider = document.getElementById('puskul-sonu-segments-slider');
        const applyBtn = document.getElementById('puskul-sonu-apply');
        
        if (hSlider) {
            hSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('puskul-sonu-h-label').textContent = value;
                
                // Fillet slider'ın max değerini güncelle
                if (filletSlider) {
                    const currentFillet = parseFloat(filletSlider.value);
                    const newMax = Math.min(200, value);
                    filletSlider.max = newMax;
                    
                    // Eğer mevcut fillet değeri yeni max'tan büyükse, max'a çek
                    if (currentFillet > newMax) {
                        filletSlider.value = newMax;
                        document.getElementById('puskul-sonu-fillet-label').textContent = newMax.toFixed(1);
                    }
                }
                
                this.previewPuskulSonuEdits();
            });
        }
        
        if (filletSlider) {
            filletSlider.addEventListener('input', (e) => {
                let value = parseFloat(e.target.value);
                const maxH = hSlider ? parseInt(hSlider.value) : 200;
                
                // Fillet değeri H'yi geçemez kuralı
                if (value > maxH) {
                    value = maxH;
                    filletSlider.value = value;
                }
                
                document.getElementById('puskul-sonu-fillet-label').textContent = value.toFixed(1);
                this.previewPuskulSonuEdits();
            });
        }
        
        if (segmentsSlider) {
            segmentsSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('puskul-sonu-segments-label').textContent = value;
                this.previewPuskulSonuEdits();
            });
        }
        
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyPuskulSonuEdits());
        }
        
        console.log('📋 Püskül Sonu paneli açıldı');
    }
    
    /**
     * 👁️ Püskül Sonu için realtime preview
     */
    previewPuskulSonuEdits() {
        if (!this.viewer.puskulSonu.geometry) return;
        
        const hSlider = document.getElementById('puskul-sonu-h-slider');
        const filletSlider = document.getElementById('puskul-sonu-fillet-slider');
        const segmentsSlider = document.getElementById('puskul-sonu-segments-slider');
        
        if (!hSlider || !filletSlider || !segmentsSlider) return;
        
        const H = parseInt(hSlider.value);
        let fillet = parseFloat(filletSlider.value);
        const filletSegments = parseInt(segmentsSlider.value);
        
        // Fillet değeri H'yi geçemez kuralı (preview için de geçerli)
        if (fillet > H) {
            fillet = H;
        }
        
        // Segment sayısı değiştiyse geometriyi tamamen yeniden oluştur
        if (filletSegments !== this.viewer.puskulSonu.geometry.filletSegments) {
            this.viewer.puskulSonu.geometry.filletSegments = filletSegments;
            this.viewer.puskulSonu.filletSegments = filletSegments;
        }
        
        // Geometriyi güncelle
        this.viewer.puskulSonu.geometry.updateDimensions(this.viewer.M, H, fillet);
        
        // Mesh'i güncelle
        if (this.viewer.puskulSonu.mesh) {
            const geometry = this.viewer.puskulSonu.geometry.createThreeGeometry();
            this.viewer.puskulSonu.mesh.geometry.dispose();
            this.viewer.puskulSonu.mesh.geometry = geometry;
        }
        
        // Wireframe'i güncelle (threshold=10 ile çapraz iç çizgileri filtrele)
        if (this.viewer.puskulSonu.wireframeMesh) {
            const edgesGeometry = new THREE.EdgesGeometry(this.viewer.puskulSonu.mesh.geometry, 10);
            this.viewer.puskulSonu.wireframeMesh.geometry.dispose();
            this.viewer.puskulSonu.wireframeMesh.geometry = edgesGeometry;
        }
        
        // Highlight'ı güncelle (eğer varsa)
        if (this.highlightMeshes.length > 0) {
            // Eski highlight'ı temizle
            this.clearHighlights();
            // Yeni highlight oluştur
            this.createPuskulSonuHighlight();
        }
    }
    
    /**
     * ✅ Püskül Sonu değişikliklerini uygula
     */
    applyPuskulSonuEdits() {
        if (!this.viewer.puskulSonu.geometry) return;
        
        const hSlider = document.getElementById('puskul-sonu-h-slider');
        const filletSlider = document.getElementById('puskul-sonu-fillet-slider');
        const segmentsSlider = document.getElementById('puskul-sonu-segments-slider');
        
        if (!hSlider || !filletSlider || !segmentsSlider) return;
        
        const H = parseInt(hSlider.value);
        let fillet = parseFloat(filletSlider.value);
        const filletSegments = parseInt(segmentsSlider.value);
        
        // Fillet değeri H'yi geçemez kuralı
        if (fillet > H) {
            fillet = H;
            filletSlider.value = fillet;
            document.getElementById('puskul-sonu-fillet-label').textContent = fillet.toFixed(1);
            console.warn(`⚠️ Fillet değeri H değerini geçemez. Fillet ${fillet} olarak ayarlandı.`);
        }
        
        // Değerleri kaydet
        this.viewer.puskulSonu.H = H;
        this.viewer.puskulSonu.fillet = fillet;
        this.viewer.puskulSonu.filletSegments = filletSegments;
        
        // Geometriyi güncelle
        this.viewer.puskulSonu.geometry.updateDimensions(this.viewer.M, H, fillet);
        
        // Mesh'i güncelle
        this.viewer.updatePuskulSonu();
        
        console.log(`✅ Püskül Sonu güncellendi: H=${H}, Fillet=${fillet.toFixed(1)}, Segments=${filletSegments}`);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CellEditor;
} else {
    window.CellEditor = CellEditor;
}

