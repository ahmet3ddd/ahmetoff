/**
 * 🔌 Cell Loader - Harici Hücre Yükleme Sistemi
 * 4 farklı hücre tipini yükleyip Püskül geometrisine aktarır
 * 
 * KULLANIM:
 * const loader = new CellLoader(puskulViewer);
 * loader.loadAllCells();
 */

class CellLoader {
    constructor(viewer) {
        this.viewer = viewer;
        this.cellsToLoad = viewer.puskulGeometry.totalCells; // 🆕 Dinamik: sides × 2
        this.loadedCells = 0;

        console.log(`🔌 CellLoader initialized (${this.cellsToLoad} cells to load)`);
    }
    
    /**
     * 📦 Tüm hücreleri yükle
     * 🆕 YENİ: puskulGeometry.getCellType() kullanarak otomatik tip atama
     */
    async loadAllCells() {
        console.log(`📦 Starting to load ${this.cellsToLoad} cells...`);
        console.log(`🔍 DEBUG: cellTypeMapping:`, this.viewer.puskulGeometry.cellTypeMapping);
        
        try {
            const totalCells = this.viewer.puskulGeometry.totalCells;
            console.log(`🔍 DEBUG: totalCells=${totalCells}, cellsToLoad=${this.cellsToLoad}`);
            
            // Her yeni yükleme turu öncesinde sayaçları sıfırla
            this.cellsToLoad = totalCells;
            this.loadedCells = 0;
            
            // Her hücre için döngü
            for (let i = 0; i < totalCells; i++) {
                const cellName = `cell${i + 1}`;
                const cellType = this.viewer.puskulGeometry.getCellType(cellName);
                
                console.log(`📥 ${cellName} → ${cellType} (mainCellType=${this.viewer.puskulGeometry.mainCellType}, interCellType=${this.viewer.puskulGeometry.interCellType})`);
                
                // Hücre tipine göre oluştur
                this.createCellByType(cellName, cellType);
            }
            
            console.log(`✅ ${this.cellsToLoad} hücre yükleme başlatıldı`);
            
        } catch (error) {
            console.error('❌ Error loading cells:', error);
        }
    }
    
    /**
     * 🔌 Tek bir hücreyi yükle
     */
    async loadCell(cellName, scriptPath) {
        return new Promise((resolve, reject) => {
            console.log(`📥 Loading ${cellName} from ${scriptPath}...`);
            
            // Script tag oluştur
            const script = document.createElement('script');
            script.src = scriptPath;
            
            script.onload = () => {
                console.log(`✅ ${cellName} script loaded`);
                
                // 🎯 Hücre class'ını kontrol et
                // Örnek: BademGeometry, FitilGeometry vb.
                // Bu kısım hücre dosyası yapısına göre değişecek
                
                this.loadedCells++;
                this.checkAllLoaded();
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ Failed to load ${cellName}`);
                reject(new Error(`Failed to load ${scriptPath}`));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * ✔️ Tüm hücreler yüklendi mi kontrol et
     */
    checkAllLoaded() {
        if (this.loadedCells === this.cellsToLoad) {
            console.log('🎉 All cells loaded!');
            this.viewer.updateGeometryAfterCellLoad();
        } else {
            console.log(`📊 Progress: ${this.loadedCells}/${this.cellsToLoad} cells loaded`);
        }
    }
    
    /**
     * 🆕 Hücre tipine göre geometri oluştur
     * @param {string} cellName - Hücre adı (cell1, cell2, ...)
     * @param {string} cellType - Hücre tipi ('BADEM', 'FITIL', 'YAPRAK', 'KAZAYAGI')
     */
    createCellByType(cellName, cellType) {
        const H = this.viewer.H;
        
        // 🎯 Hücrenin depth bilgisini al (position'dan)
        const position = this.viewer.puskulGeometry.cellPositions[cellName];
        const depth = position ? position.depth : this.viewer.M; // Varsayılan M
        
        console.log(`🔷 ${cellName} (${cellType}): depth=${depth ? depth.toFixed(1) : 'default'}, H=${H}`);
        console.log(`🔍 DEBUG: cellType="${cellType}", type: ${typeof cellType}, length: ${cellType.length}`);
        console.log(`🔍 DEBUG: cellType === 'KAZAYAGI': ${cellType === 'KAZAYAGI'}`);
        console.log(`🔍 DEBUG: KazayakGeometry available: ${typeof KazayakGeometry !== 'undefined'}`);
        
        let cellObject = null;
        
        switch (cellType) {
            case 'BADEM':
                cellObject = this.createBademCell(cellName, depth, H); // M yerine depth
                break;
            case 'FITIL':
                cellObject = this.createFitilCell(cellName, depth, H); // M yerine depth
                break;
            case 'YAPRAK':
                cellObject = this.createYaprakCell(cellName, depth, H);
                break;
            case 'KAZAYAGI':
                cellObject = this.createKazayakCell(cellName, depth, H);
                break;
            default:
                console.error(`❌ Bilinmeyen hücre tipi: ${cellType}, BADEM kullanılıyor`);
                cellObject = this.createBademCell(cellName, depth, H);
        }
        
        if (cellObject) {
            // Püskül geometrisine yükle
            this.viewer.puskulGeometry.loadCell(cellName, cellObject);
            this.loadedCells++;
            this.checkAllLoaded();
        }
    }
    
    /**
     * 🎯 Gerçek Badem geometrisi oluştur
     * @param {string} cellName - Hücre adı
     * @param {number} depth - Hücre derinliği (M parametresi olarak kullanılır)
     * @param {number} H - Hücre yüksekliği
     */
    createBademCell(cellName, depth = 50, H = 100) {
        console.log(`🔷 Creating real Badem geometry for ${cellName} (depth=${depth}, H=${H})...`);
        console.log(`   BademGeometry type check:`, typeof BademGeometry);
        console.log(`   Window scope check:`, typeof window.BademGeometry);
        
        // BademGeometry class'ını kullan
        if (typeof BademGeometry === 'undefined') {
            console.error('❌ BademGeometry not loaded! Using mock instead.');
            console.error('   Available in window:', Object.keys(window).filter(k => k.includes('Badem')));
            return this.createMockCell(cellName, 18);
        }
        
        console.log(`   ✅ BademGeometry found, creating instance...`);
        
        // Hücrenin pozisyon bilgilerini al (radial plan için)
        const position = this.viewer.puskulGeometry.cellPositions[cellName];
        const sectorAngle = (2 * Math.PI) / this.viewer.puskulSides;
        const sectorIndex = parseInt(cellName.replace('cell', '')) - 1;
        
        // 🟢 Radyal oran parametresi ekle
        const radialRatio = this.viewer.bademRadialRatio || 0.403;
        const narrowFactor = this.viewer.bademNarrowFactor || 1.0;
        
        let c6Override = null;
        if (position && position.c6TargetWorld) {
            const target = position.c6TargetWorld;
            const dx = target.x - position.x;
            const dy = target.y - position.y;
            const rot = position.rotation || 0;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);
            const localX = dx * cos + dy * sin;
            const localY = -dx * sin + dy * cos;
            c6Override = { x: localX, y: localY };
            const sourceLabel = target.boundaryPointName || target.pointName || 'boundary';
            console.log(`   c6 target mapped for ${cellName}: world=(${target.x.toFixed(2)}, ${target.y.toFixed(2)}) -> local=(${localX.toFixed(2)}, ${localY.toFixed(2)}) [${sourceLabel}]`);
        }

        // 📊 Custom parametreleri kontrol et (edit panelden değiştirilmişse)
        const customParams = this.viewer.cellCustomParams[cellName];
        const ratio1 = customParams?.ratio1 ?? 0.09;
        const ratio2 = customParams?.ratio2 ?? 0.096;
        const ratio3 = customParams?.ratio3 ?? 0.09;
        const zLevels = customParams?.zLevels ?? null;
        
        if (customParams) {
            console.log(`📊 ${cellName}: Custom parametreler kullanılıyor (r1=${ratio1.toFixed(3)}, r2=${ratio2.toFixed(3)}, r3=${ratio3.toFixed(3)})`);
        }
        
        // Gerçek Badem geometrisi oluştur (M parametresine depth kullan)
        const bademGeometry = new BademGeometry(
            depth,                          // M
            H,                              // H
            ratio1,                         // slaveRatio (ratio1) - custom veya default
            ratio2,                         // slaveRatio2 (ratio2) - custom veya default
            ratio3,                         // ratioZ5 - custom veya default
            sectorAngle,                    // sectorAngle (radial plan için)
            this.viewer.innerRadius,        // innerRadius
            this.viewer.outerRadius,        // outerRadius
            sectorIndex,                    // sectorIndex
            zLevels,                        // zLevels - custom veya default (null)
            radialRatio,                    // 🟢 radialRatio (yeni parametre)
            narrowFactor                    // 🎚️ narrowFactor (b1/d1 boşluk)
        );
        console.log(`   ✅ BademGeometry instance created (M=${depth}, radialRatio=${radialRatio.toFixed(3)})`);
        
        const threeGeometry = bademGeometry.createThreeGeometry();
        console.log(`   ✅ Three.js geometry created`);
        
        // Vertices ve indices'i al
        const vertices = [];
        const indices = [];
        
        const positions = threeGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i++) {
            vertices.push(positions[i]);
        }
        
        const indexArray = threeGeometry.index.array;
        for (let i = 0; i < indexArray.length; i++) {
            indices.push(indexArray[i]);
        }
        
        console.log(`✅ Badem geometry created: ${vertices.length / 3} vertices, ${indices.length / 3} triangles`);
        
        return {
            name: cellName,
            type: 'BADEM',
            geometry: bademGeometry,
            getVertices: () => vertices,
            getIndices: () => indices,
            updateDimensions: (M, H) => {
                console.log(`📐 ${cellName} (Badem) dimensions updated: M=${M}, H=${H}`);
                const newGeometry = bademGeometry.updateDimensions(M, H);
                
                // Yeni vertices/indices güncelle
                const newPositions = newGeometry.attributes.position.array;
                vertices.length = 0;
                for (let i = 0; i < newPositions.length; i++) {
                    vertices.push(newPositions[i]);
                }
                
                const newIndexArray = newGeometry.index.array;
                indices.length = 0;
                for (let i = 0; i < newIndexArray.length; i++) {
                    indices.push(newIndexArray[i]);
                }
            },
            // 🔗 Master noktayı güncelle (deformasyon için)
            updateMasterPoint: (pointName, x, y) => {
                console.log(`🎯 ${cellName}.${pointName} güncelleniyor: (${x.toFixed(2)}, ${y.toFixed(2)})`);
                bademGeometry.updateMasterPoint(pointName, x, y);
                const newGeometry = bademGeometry.createThreeGeometry();
                
                // Vertices güncelle
                const newPositions = newGeometry.attributes.position.array;
                vertices.length = 0;
                for (let i = 0; i < newPositions.length; i++) {
                    vertices.push(newPositions[i]);
                }
                
                const newIndexArray = newGeometry.index.array;
                indices.length = 0;
                for (let i = 0; i < newIndexArray.length; i++) {
                    indices.push(newIndexArray[i]);
                }
            }
        };
    }
    
    /**
     * 🎯 Mock hücre geometrisi oluştur (test için - fallback)
     */
    createMockCell(cellName, size = 20) {
        console.log(`🧪 Creating mock geometry for ${cellName}...`);
        
        // Basit bir küp geometrisi örneği
        const vertices = [];
        const indices = [];
        
        // Küp vertices (8 köşe)
        const s = size / 2;
        vertices.push(
            -s, -s, -s,  // 0
             s, -s, -s,  // 1
             s,  s, -s,  // 2
            -s,  s, -s,  // 3
            -s, -s,  s,  // 4
             s, -s,  s,  // 5
             s,  s,  s,  // 6
            -s,  s,  s   // 7
        );
        
        // Küp faces (12 üçgen)
        indices.push(
            0, 1, 2,  0, 2, 3, // alt
            4, 6, 5,  4, 7, 6, // üst
            0, 4, 5,  0, 5, 1, // ön
            2, 6, 7,  2, 7, 3, // arka
            0, 3, 7,  0, 7, 4, // sol
            1, 5, 6,  1, 6, 2  // sağ
        );
        
        return {
            name: cellName,
            type: 'MOCK',
            getVertices: () => vertices,
            getIndices: () => indices,
            updateDimensions: (M, H) => {
                console.log(`📐 ${cellName} (mock) dimensions updated: M=${M}, H=${H}`);
            }
        };
    }
    
    /**
     * 🔶 Gerçek Fitil geometrisi oluştur
     * @param {string} cellName - Hücre adı
     * @param {number} depth - Hücre derinliği (M parametresi olarak kullanılır)
     * @param {number} H - Hücre yüksekliği
     */
    createFitilCell(cellName, depth = 50, H = 100) {
        console.log(`🔶 Creating real Fitil geometry for ${cellName} (depth=${depth}, H=${H})...`);

        // FitilGeometry class'ını kullan
        if (typeof FitilGeometry === 'undefined') {
            console.error('❌ FitilGeometry not loaded! Using Badem instead.');
            return this.createBademCell(cellName, depth, H);
        }

        console.log(`   ✅ FitilGeometry found, creating instance...`);

        // 🔷 Boundary alignment - c6 target kontrolü
        const position = this.viewer.puskulGeometry.cellPositions[cellName];
        let c6Override = null;
        console.log(`🔍 FITIL ${cellName}: position.c6TargetWorld =`, position?.c6TargetWorld);
        if (position && position.c6TargetWorld) {
            const target = position.c6TargetWorld;
            const dx = target.x - position.x;
            const dy = target.y - position.y;
            const rot = position.rotation || 0;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);
            const localX = dx * cos + dy * sin;
            const localY = -dx * sin + dy * cos;
            c6Override = { x: localX, y: localY };
            const sourceLabel = target.boundaryPointName || target.pointName || 'boundary';
            console.log(`   ✅ c6 target mapped for ${cellName}: world=(${target.x.toFixed(2)}, ${target.y.toFixed(2)}) -> local=(${localX.toFixed(2)}, ${localY.toFixed(2)}) [${sourceLabel}]`);
        } else {
            console.log(`   ⚠️ ${cellName}: c6TargetWorld YOK!`);
        }

        // 📊 Custom parametreleri kontrol et (edit panelden değiştirilmişse)
        const customParams = this.viewer.cellCustomParams[cellName];
        const ratio1 = customParams?.ratio1 ?? 0.09; // 🎯 Normalize oran (varsayılan 0.09)
        const ratio2 = customParams?.ratio2 ?? 0.096; // 🎯 Normalize oran (varsayılan 0.096)
        const zLevels = customParams?.zLevels ?? null;

        if (customParams) {
            console.log(`📊 ${cellName}: Custom parametreler kullanılıyor (r1=${ratio1.toFixed(3)}, r2=${ratio2.toFixed(3)})`);
        }

        // Gerçek Fitil geometrisi oluştur (M parametresine depth kullan)
        const fitilGeometry = new FitilGeometry(depth, H, ratio1, ratio2, null, null, null, 0, zLevels, c6Override); // slaveRatio, slaveRatio2, zLevels, c6Override
        console.log(`   ✅ FitilGeometry instance created (M=${depth})`);
        const threeGeometry = fitilGeometry.createThreeGeometry();
        
        // Vertices ve indices'i al
        const vertices = [];
        const indices = [];
        
        const positions = threeGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i++) {
            vertices.push(positions[i]);
        }
        
        const indexArray = threeGeometry.index.array;
        for (let i = 0; i < indexArray.length; i++) {
            indices.push(indexArray[i]);
        }
        
        console.log(`✅ Fitil geometry created: ${vertices.length / 3} vertices, ${indices.length / 3} triangles`);
        
        return {
            name: cellName,
            type: 'FITIL',
            geometry: fitilGeometry,
            getVertices: () => vertices,
            getIndices: () => indices,
            updateDimensions: (M, H) => {
                console.log(`📐 ${cellName} (Fitil) dimensions updated: M=${M}, H=${H}`);
                const newGeometry = fitilGeometry.updateDimensions(M, H);
                const newPositions = newGeometry.attributes.position.array;
                vertices.length = 0;
                for (let i = 0; i < newPositions.length; i++) {
                    vertices.push(newPositions[i]);
                }
                const newIndexArray = newGeometry.index.array;
                indices.length = 0;
                for (let i = 0; i < newIndexArray.length; i++) {
                    indices.push(newIndexArray[i]);
                }
            },
            // 🔗 Master noktayı güncelle (snap için)
            updateMasterPoint: (pointName, x, y) => {
                console.log(`🎯 ${cellName}.${pointName} güncelleniyor: (${x.toFixed(2)}, ${y.toFixed(2)})`);
                fitilGeometry.updateMasterPoint(pointName, x, y);
                const newGeometry = fitilGeometry.createThreeGeometry();
                
                const newPositions = newGeometry.attributes.position.array;
                vertices.length = 0;
                for (let i = 0; i < newPositions.length; i++) {
                    vertices.push(newPositions[i]);
                }
                const newIndexArray = newGeometry.index.array;
                indices.length = 0;
                for (let i = 0; i < newIndexArray.length; i++) {
                    indices.push(newIndexArray[i]);
                }
            }
        };
    }
    
    /**
     * 🦶 Gerçek Kazayağı geometrisi oluştur (Fitil özelliklerine sahip)
     * @param {string} cellName - Hücre adı
     * @param {number} depth - Hücre derinliği (M parametresi olarak kullanılır)
     * @param {number} H - Hücre yüksekliği
     */
    createKazayakCell(cellName, depth = 50, H = 100) {
        console.log(`🦶 Creating real Kazayak geometry for ${cellName} (depth=${depth}, H=${H})...`);

        // KazayakGeometry class'ını kullan
        if (typeof KazayakGeometry === 'undefined') {
            console.error('❌ KazayakGeometry not loaded! Using Fitil instead.');
            return this.createFitilCell(cellName, depth, H);
        }

        console.log(`   ✅ KazayakGeometry found, creating instance...`);

        // 🔷 Boundary alignment - c6 target kontrolü
        const position = this.viewer.puskulGeometry.cellPositions[cellName];
        let c6Override = null;
        console.log(`🔍 KAZAYAK ${cellName}: position.c6TargetWorld =`, position?.c6TargetWorld);
        if (position && position.c6TargetWorld) {
            const target = position.c6TargetWorld;
            const dx = target.x - position.x;
            const dy = target.y - position.y;
            const rot = position.rotation || 0;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);
            const localX = dx * cos + dy * sin;
            const localY = -dx * sin + dy * cos;
            c6Override = { x: localX, y: localY };
            const sourceLabel = target.boundaryPointName || target.pointName || 'boundary';
            console.log(`   ✅ c6 target mapped for ${cellName}: world=(${target.x.toFixed(2)}, ${target.y.toFixed(2)}) -> local=(${localX.toFixed(2)}, ${localY.toFixed(2)}) [${sourceLabel}]`);
        } else {
            console.log(`   ⚠️ ${cellName}: c6TargetWorld YOK!`);
        }

        // 📊 Custom parametreleri kontrol et (edit panelden değiştirilmişse)
        const customParams = this.viewer.cellCustomParams[cellName];
        const ratio1 = customParams?.ratio1 ?? 0.09; // 🎯 Normalize oran (varsayılan 0.09)
        const ratio2 = customParams?.ratio2 ?? 0.186; // 🎯 Normalize oran (varsayılan 0.186)
        const zLevels = customParams?.zLevels ?? null;

        if (customParams) {
            console.log(`📊 ${cellName}: Custom parametreler kullanılıyor (r1=${ratio1.toFixed(3)}, r2=${ratio2.toFixed(3)})`);
        }

        // Gerçek Kazayak geometrisi oluştur (M parametresine depth kullan)
        // ⚠️ Radial parametreler GEÇİRİLMEZ - Fitil gibi, rotasyon combineGeometries'de yapılır
        const kazayakGeometry = new KazayakGeometry(
            depth,                          // M
            H,                              // H
            ratio1,                         // slaveRatio (normalize oran)
            ratio2,                         // slaveRatio2 (normalize oran)
            null,                           // sectorAngle - rotasyon dışarıda yapılacak
            null,                           // innerRadius - rotasyon dışarıda yapılacak
            null,                           // outerRadius - rotasyon dışarıda yapılacak
            0,                              // sectorIndex - kullanılmayacak
            zLevels,                        // zLevels
            this.viewer.puskulPlacement,    // placement - KÖŞE vs KENAR için farklı geometri!
            c6Override                      // 🔷 c6 boundary alignment
        );
        console.log(`   ✅ KazayakGeometry instance created (M=${depth})`);
        const threeGeometry = kazayakGeometry.createThreeGeometry();
        
        // Vertices ve indices'i al
        const vertices = [];
        const indices = [];
        
        const positions = threeGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i++) {
            vertices.push(positions[i]);
        }
        
        const indexArray = threeGeometry.index.array;
        for (let i = 0; i < indexArray.length; i++) {
            indices.push(indexArray[i]);
        }
        
        console.log(`✅ Kazayak geometry created: ${vertices.length / 3} vertices, ${indices.length / 3} triangles`);
        
        return {
            name: cellName,
            type: 'KAZAYAGI',
            geometry: kazayakGeometry,
            getVertices: () => vertices,
            getIndices: () => indices,
            updateDimensions: (M, H) => {
                console.log(`📐 ${cellName} (Kazayak) dimensions updated: M=${M}, H=${H}`);
                const newGeometry = kazayakGeometry.updateDimensions(M, H);
                const newPositions = newGeometry.attributes.position.array;
                vertices.length = 0;
                for (let i = 0; i < newPositions.length; i++) {
                    vertices.push(newPositions[i]);
                }
                const newIndexArray = newGeometry.index.array;
                indices.length = 0;
                for (let i = 0; i < newIndexArray.length; i++) {
                    indices.push(newIndexArray[i]);
                }
            },
            // 🔗 Master noktayı güncelle (snap için)
            updateMasterPoint: (pointName, x, y) => {
                console.log(`🎯 ${cellName}.${pointName} güncelleniyor: (${x.toFixed(2)}, ${y.toFixed(2)})`);
                kazayakGeometry.updateMasterPoint(pointName, x, y);
                const newGeometry = kazayakGeometry.createThreeGeometry();
                
                const newPositions = newGeometry.attributes.position.array;
                vertices.length = 0;
                for (let i = 0; i < newPositions.length; i++) {
                    vertices.push(newPositions[i]);
                }
                const newIndexArray = newGeometry.index.array;
                indices.length = 0;
                for (let i = 0; i < newIndexArray.length; i++) {
                    indices.push(newIndexArray[i]);
                }
            }
        };
    }
    
    /**
     * 🍃 Gerçek Yaprak geometrisi oluştur
     * @param {string} cellName - Hücre adı
     * @param {number} depth - Hücre derinliği (M parametresi olarak kullanılır)
     * @param {number} H - Hücre yüksekliği
     */
    createYaprakCell(cellName, depth = 50, H = 100) {
        console.log(`🍃 Creating real Yaprak geometry for ${cellName} (depth=${depth}, H=${H})...`);
        
        // YaprakGeometry class'ını kullan
        if (typeof YaprakGeometry === 'undefined') {
            console.error('❌ YaprakGeometry not loaded! Using Badem instead.');
            return this.createBademCell(cellName, depth, H);
        }
        
        console.log(`   ✅ YaprakGeometry found, creating instance...`);
        
        // Hücrenin pozisyon bilgilerini al (radial plan için)
        const position = this.viewer.puskulGeometry.cellPositions[cellName];
        const sectorAngle = (2 * Math.PI) / this.viewer.puskulSides;
        const sectorIndex = parseInt(cellName.replace('cell', '')) - 1;

        let c6Override = null;
        if (position && position.c6TargetWorld) {
            const target = position.c6TargetWorld;
            const dx = target.x - position.x;
            const dy = target.y - position.y;
            const rot = position.rotation || 0;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);
            const localX = dx * cos + dy * sin;
            const localY = -dx * sin + dy * cos;
            c6Override = { x: localX, y: localY };
            const sourceLabel = target.boundaryPointName || target.pointName || 'boundary';
            console.log(`   c6 target mapped for ${cellName}: world=(${target.x.toFixed(2)}, ${target.y.toFixed(2)}) -> local=(${localX.toFixed(2)}, ${localY.toFixed(2)}) [${sourceLabel}]`);
        }

        // 📊 Custom parametreleri kontrol et (edit panelden değiştirilmişse)
        const customParams = this.viewer.cellCustomParams[cellName];
        const ratio1 = customParams?.ratio1 ?? 0.09;
        const ratio2 = customParams?.ratio2 ?? 0.096; // EKSTRA (Badem gibi - 0.186'dan 0.096'ya)
        const zLevels = customParams?.zLevels ?? null;
        
        if (customParams) {
            console.log(`📊 ${cellName}: Custom parametreler kullanılıyor (r1=${ratio1.toFixed(3)}, r2=${ratio2.toFixed(3)})`);
        }
        
        // Radyal oran ve daralma parametreleri (Badem ile aynı)
        const radialRatio = this.viewer.bademRadialRatio || 0.403;
        const narrowFactor = this.viewer.bademNarrowFactor || 1.0;
        
        // Gerçek Yaprak geometrisi oluştur
        const yaprakGeometry = new YaprakGeometry(
            depth,                          // M
            H,                              // H
            ratio1,                         // slaveRatio (ratio1) - custom veya default
            ratio2,                         // slaveRatio2 (ratio2) - custom veya default
            sectorAngle,                    // sectorAngle (radial plan için)
            this.viewer.innerRadius,        // innerRadius
            this.viewer.outerRadius,        // outerRadius
            sectorIndex,                    // sectorIndex
            zLevels,                        // zLevels - custom veya default
            radialRatio,                    // radialRatio - Badem ile aynı
            narrowFactor                    // narrowFactor - Badem ile aynı
        );
        if (c6Override) {
            yaprakGeometry.setC6Override(c6Override.x, c6Override.y);
        }

        console.log(`   ✅ YaprakGeometry instance created (M=${depth})`);
        
        const threeGeometry = yaprakGeometry.createThreeGeometry();
        
        // Vertices ve indices'i al
        const vertices = [];
        const indices = [];
        
        const positions = threeGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i++) {
            vertices.push(positions[i]);
        }
        
        const indexArray = threeGeometry.index.array;
        for (let i = 0; i < indexArray.length; i++) {
            indices.push(indexArray[i]);
        }
        
        console.log(`✅ Yaprak geometry created: ${vertices.length / 3} vertices, ${indices.length / 3} triangles`);
        
        return {
            name: cellName,
            type: 'YAPRAK',
            geometry: yaprakGeometry,
            getVertices: () => vertices,
            getIndices: () => indices,
            updateDimensions: (M, H, r1, r2, r3, zLvls) => {
                console.log(`📐 ${cellName} (Yaprak) dimensions updated: M=${M}, H=${H}`);
                const newGeometry = yaprakGeometry.updateDimensions(M, H, r1, r2, r3, zLvls);
                
                // Yeni vertices/indices güncelle
                const newPositions = newGeometry.attributes.position.array;
                vertices.length = 0;
                for (let i = 0; i < newPositions.length; i++) {
                    vertices.push(newPositions[i]);
                }
                const newIndexArray = newGeometry.index.array;
                indices.length = 0;
                for (let i = 0; i < newIndexArray.length; i++) {
                    indices.push(newIndexArray[i]);
                }
            },
            // 🔗 Master noktayı güncelle (snap için)
            updateMasterPoint: (pointName, x, y) => {
                console.log(`🎯 ${cellName}.${pointName} güncelleniyor: (${x.toFixed(2)}, ${y.toFixed(2)})`);
                yaprakGeometry.updateMasterPoint(pointName, x, y);
                const newGeometry = yaprakGeometry.createThreeGeometry();
                
                const newPositions = newGeometry.attributes.position.array;
                vertices.length = 0;
                for (let i = 0; i < newPositions.length; i++) {
                    vertices.push(newPositions[i]);
                }
                const newIndexArray = newGeometry.index.array;
                indices.length = 0;
                for (let i = 0; i < newIndexArray.length; i++) {
                    indices.push(newIndexArray[i]);
                }
            }
        };
    }
    
    /**
     * 🔷 Gerçek Badem hücreleri yükle (tüm hücreler Badem olacak)
     */
    loadBademCells() {
        console.log('🔷 Loading REAL Badem cells...');
        
        // Mevcut sides sayısına göre hücre oluştur
        const sides = this.viewer.puskulGeometry.sides;
        const cells = this.viewer.puskulGeometry.cells;
        const M = this.viewer.M || 50;
        const H = this.viewer.H || 100;
        
        console.log(`📦 Target: ${sides} Badem cells (M=${M}, H=${H})`);
        
        let loadedCount = 0;
        
        // Dinamik olarak sides kadar Badem hücresi oluştur
        for (let i = 0; i < sides; i++) {
            const cellName = `cell${i + 1}`;
            
            // Eğer hücre zaten yüklüyse atla
            if (cells[cellName] !== null && cells[cellName] !== undefined) {
                console.log(`  ⏭️ ${cellName} already loaded, skipping...`);
                continue;
            }
            
            // Gerçek Badem hücre oluştur
            const cell = this.createBademCell(cellName, M, H);
            this.viewer.puskulGeometry.loadCell(cellName, cell);
            loadedCount++;
            console.log(`  ✅ ${cellName} created (BADEM)`);
        }
        
        console.log(`📊 Loaded ${loadedCount} new Badem cells`);
        
        // Geometriyi güncelle
        this.viewer.updateGeometryAfterCellLoad();
        
        console.log('✅ Badem cells loading complete');
    }
    
    /**
     * 🎨 Hücre tiplerini kurallara göre yükle (Otomatik/Manuel)
     * 🆕 DEPRECATED: Yeni loadAllCells() kullanın
     */
    loadCellsByRules(cellTypes = null) {
        console.warn('⚠️ loadCellsByRules() DEPRECATED, loadAllCells() kullanılıyor');
        this.loadAllCells();
    }
    
    /**
     * 🧪 Test için mock hücreleri yükle (fallback)
     */
    loadMockCells() {
        console.log('🧪 Using cells by rules instead of mock...');
        this.loadCellsByRules();
    }
    
    /**
     * 🔄 Tüm hücreleri yeniden yükle (cellTypes parametresi ile)
     */
    reloadAllCells(cellTypes = null) {
        console.log('🔄 Reloading all cells...');
        
        const totalCells = this.viewer.puskulGeometry.totalCells;
        
        // cellsToLoad'u güncelle
        this.cellsToLoad = totalCells;
        this.loadedCells = 0;
        
        // Tüm hücreleri temizle
        this.viewer.puskulGeometry.cells = {};
        this.viewer.puskulGeometry.originalMasterPoints = {};
        for (let i = 0; i < totalCells; i++) {
            this.viewer.puskulGeometry.cells[`cell${i + 1}`] = null;
        }
        
        // Yeniden yükle
        this.loadAllCells();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CellLoader;
} else {
    window.CellLoader = CellLoader;
}

