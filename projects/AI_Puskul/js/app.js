/**

 * Püskül 3D Viewer Application

 * Independent 3D viewer for Mukarnas Püskül cell

 */



class PuskulViewer {

    constructor() {

        this.scene = null;

        this.camera = null;

        this.renderer = null;

        this.controls = null;

        this.puskulMesh = null;



        // 🏗️ ÇOKLU KATMAN SİSTEMİ

        this.currentLayer = 1;          // Aktif katman

        this.layers = {

            1: {

                // En üst katman - varsayılan değerler

                sides: 6,

                placement: 'corner',

                outerRadius: 300,

                innerRadius: 160,

                mainCellType: 'BADEM',

                interCellType: 'FITIL',

                cellMultiplier: 2,

                geometry: null,  // PuskulGeometry instance

                visible: true,

                cellCustomParams: {}, // 🎨 Hücre özel parametreleri (bu katmana özel ratio değerleri)

                // 🎨 Görsel Ayarlar (Katmana Özel)

                bademRadialRatio: 0.403,      // b1/d1 radyal konum oranı

                bademNarrowFactor: 1.0,       // b1/d1 daralma faktörü (1.0=yapışık)

                enableSnap: true,             // Geometri deformasyonu aktif mi?

                snapThreshold: 5,             // Deformasyon gücü (0-20)

                showSnapConnections: false,   // Gap görselleştirme

                showCenterLines: true,        // Merkez çizgileri göster

                showBademRadialCircle: true,  // Yeşil radyal çember göster

                // 🎯 Katman Geçiş Yüzeyi (Extrude)

                extrudeMesh: null,            // Outer boundary'den yukarı doğru extrude edilmiş yüzey

                transitionHeight: 20          // Geçiş yüzeyi yüksekliği (0-50 birim)

            }

        };

        this.maxLayers = 5;  // Maksimum katman sayısı

        // 🎯 PÜSKÜL SONU MODÜLÜ (En alt katman - tüm katmanların altında)
        this.puskulSonu = {
            geometry: null,      // PuskulSonuGeometry instance
            mesh: null,          // Three.js mesh
            wireframeMesh: null, // Wireframe mesh
            visible: true,       // Görünürlük
            H: 40,               // Yükseklik (başlangıç: 40)
            fillet: 9.0,         // Fillet değeri (0-200, max: H)
            filletSegments: 16,  // Fillet yay segment sayısı (1-32)
            linesOnly: false     // Yüzey gösterimi (linesOnly=false)
        };

        // 🖼️ PIP (Mini Ortografik Görünüm)

        this.pipCamera = null;

        this.pipRenderer = null;

        this.pipControls = null;

        this.showPip = true;

        this.wireframeMesh = null;

        this.pointsMesh = null;

        this.puskulGeometry = null;  // Aktif katmanın geometrisi (geriye uyumluluk)

        this.labelSprites = [];  // Text labels

        this.debugLines = [];    // 🧪 Debug için çizgiler

        this.debugSpheres = [];  // 🔴 DEBUG: a1/c1 küreleri



        this.M = 50;  // Module size

        this.H = 170; // Height



        // 🎀 PÜSKÜL TASARIM PARAMETRELERİ

        this.puskulSides = 6;           // 4-8 gen arası

        this.puskulPlacement = 'corner'; // 'corner' veya 'edge'



        // 🆕 İKİ NGON SİSTEMİ

        this.outerRadius = 300;         // Dış ngon (Ana hücre c1'leri)

        this.innerRadius = 160;         // İç ngon (TÜM hücre a1'leri) - Varsayılan: 160 birim

        

        this.puskulRadius = 100;        // DEPRECATED: Eski sistem (geriye uyumluluk için)

        this.cellSize = 18;             // Hücre boyutu

        this.showGrid = true;           // Grid görünürlüğü

        this.polygonGuideMesh = null;   // Gen planı sarı çizgi (dış ngon - outerRadius)

        this.innerPolygonGuideMesh = null; // İç ngon mavi kesikli çizgi (innerRadius - a1'ler)

        this.edgeGuideLines = [];       // Kenarlara dik mavi çizgiler

        this.cornerGuideLines = [];     // Köşelere yeşil çizgiler

        

        // 🔗 Yan Tutunma Sistemi

        this.enableSnap = true;           // Tutunma aktif mi?

        this.snapThreshold = 5;           // Tutunma mesafesi (birim)

        this.showSnapConnections = false; // Görselleştirme varsayılan kapalı (ara hücre YOK ise açılır)

        this.snapConnectionMeshes = [];   // b1-d1 bağlantı çizgileri

        this.snapPointMeshes = [];        // b1, d1 nokta işaretleri

        

        // 🔴 Merkez Çizgileri Sistemi (b1/d1 → Merkez)

        this.showCenterLines = true;      // Merkez çizgileri göster

        this.centerLineMeshes = [];       // b1/d1'den merkeze kırmızı çizgiler

        

        // 🟢 Badem Radyal Oran Sistemi (b1/d1 konumu)

        this.bademRadialRatio = 0.403;    // Default: %40.3 (PNG analizinden)

        this.showBademRadialCircle = true; // Yeşil çember göster

        

        // 🌉 Köprü Yüzey Sistemi (Ana-Ara hücre arası bağlantı yüzeyleri)

        this.showBridgeSurfaces = true;   // Köprü yüzeylerini göster

        this.bridgeMesh = null;           // Köprü yüzeyleri mesh'i

        this.bademRadialCircleMesh = null; // Yeşil çember mesh

        

        // 🎚️ Badem Daralma (b1/d1 Boşluk Sistemi)

        this.bademNarrowFactor = 1.0;     // Default: 1.0 (yapışık), <1.0 (boşluk oluşur)

        

        // 🔍 Zoom Extent Control

        this.hasInitialZoomExtent = false; // İlk açılışta zoom extent yapıldı mı?

        

        // 🎨 Hücre Tipi Atama Sistemi (Otomatik)

        this.mainCellType = 'BADEM';     // Ana hücre tipi (köşe veya kenar)

        this.interCellType = 'FITIL';    // Ara hücre tipi (kenar veya köşe, veya 'YOK')

        this.cellMultiplier = 2;         // 1-3 arası: sides × multiplier (1=sadece ana, 2=ana+1ara, 3=ana+2ara)

        

        // ESKİ - Geriye uyumluluk için

        this.cellAssignmentMode = 'auto'; // DEPRECATED

        this.cellTypeAssignments = [];    // DEPRECATED

        this.manualCellTypeOverrides = {}; // Manual cell type per cellName

        

        // 🆕 Manuel Mod Alt Seçenek: Tip Seçimi mi Edit mi?

        this.manualModeShowDropdowns = false; // false: Edit aktif, true: Dropdown'lar aktif

        

        // 🗂️ Manuel mod seçimlerini sakla (otomatik moda geçince backup, geri dönünce restore)

        this.manualModeBackup = null; // { cellTypeMapping: {}, overrides: {}, customParams: {} }

        

        // 📊 Hücre özel parametreleri (edit panelden değiştirilenler)

        // ✅ cellCustomParams artık katmana özel - her layer.cellCustomParams kendi objesini tutuyor

        // this.cellCustomParams getter/setter ile aktif layer'a yönlendirilecek



        // 🔧 Hücre Detay Edit Sistemi (CellEditor modülü)

        this.cellEditor = null; // CellEditor instance (DOMContentLoaded'da oluşturulacak)

        // 🎨 UI Manager (Panel reorganization, Save/Load, Export)

        this.uiManager = null; // UIManager instance (DOMContentLoaded'da oluşturulacak)

        this.configManager = null; // ConfigManager instance (oluşturulacak)

        this.exportManager = null; // ExportManager instance (oluşturulacak)



        // 🎨 Manuel Mod Hover Sistemi

        this.hoveredCellName = null;        // Şu anda hover edilen hücre

        this.hoverHighlightMesh = null;     // Mavi highlight mesh

        this.hoveredDropdownRow = null;     // Şu anda vurgulanan dropdown row

        

        // 📋 POZİSYON KURALLARI (docs'tan)

        this.positionRules = {

            'B': ['corner', 'edge'],  // Badem: Her yerde

            'F': ['corner', 'edge'],  // Fitil: Her yerde

            'Y': ['edge'],            // Yaprak: Sadece kenar (corner OLAMAZ)

            'K': ['corner', 'edge']   // Kazayağı: Her yerde (Fitil gibi, SADECE ara hücre olarak)

        };

        

        this.slaveRatio = 0.09;   // 🎚️ Seviye 2-3: master'dan c1'e kayma oranı (%9)

        this.slaveRatio2 = 0.096; // 🎚️ Seviye 4-5: ratio1'in üzerine EKSTRA kayma (%9.6, toplam %18.6)

        // PÜSKÜL: ratioZ5 KALDIRILDI (w5 ve z5 yok)

        this.ratioDelta = this.slaveRatio2; // 🎯 Ekstra kayma: 0.096 (%9.6)

        

        this.showWireframe = true;

        this.showPoints = true;

        this.showLabels = true;

        

        // 🎯 İnteraktif nokta düzenleme için

        this.editablePointMeshes = [];  // Master noktaların mesh'leri

        this.selectedPoint = null;      // Seçili master nokta

        this.isDragging = false;

        this.raycaster = new THREE.Raycaster();

        this.mouse = new THREE.Vector2();

        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);  // XY plane



        this.init();



        // 🔧 cellCustomParams getter/setter: Aktif layer'ın cellCustomParams'ına yönlendir

        Object.defineProperty(this, 'cellCustomParams', {

            get() {

                const activeLayer = this.layers[this.currentLayer];

                if (!activeLayer) {

                    console.warn(`⚠️ cellCustomParams getter: Layer ${this.currentLayer} bulunamadı`);

                    return {};

                }

                if (!activeLayer.cellCustomParams) {

                    activeLayer.cellCustomParams = {};

                }

                return activeLayer.cellCustomParams;

            },

            set(value) {

                const activeLayer = this.layers[this.currentLayer];

                if (activeLayer) {

                    activeLayer.cellCustomParams = value;

                } else {

                    console.warn(`⚠️ cellCustomParams setter: Layer ${this.currentLayer} bulunamadı`);

                }

            }

        });

    }

    /**
     * 🎯 Püskül Sonu modülünü oluştur (en alt katman - tüm katmanların altında)
     */
    createPuskulSonu() {
        console.log('🎯 Püskül Sonu modülü oluşturuluyor...');

        // En alt katmanın Z pozisyonunu hesapla
        let bottomZ = 0;
        let bottomLayer = null;
        let bottomLayerNum = null;
        const layerNumbers = Object.keys(this.layers).map(n => parseInt(n)).sort((a, b) => a - b);
        
        if (layerNumbers.length > 0) {
            // En alt katmanı bul
            bottomLayerNum = layerNumbers[layerNumbers.length - 1];
            bottomLayer = this.layers[bottomLayerNum];
            
            if (bottomLayer) {
                // En alt katmanın alt Z pozisyonunu hesapla
                const bottomLayerTop = this.getLayerZOffset(bottomLayerNum);
                
                // Transition height ve actual height'ı al
                let transitionHeight;
                if (this.layerTransition && this.layerTransition.lockHeight) {
                    transitionHeight = this.layerTransition.globalHeight !== undefined
                        ? this.layerTransition.globalHeight
                        : 20;
                } else {
                    transitionHeight = bottomLayer.transitionHeight !== undefined
                        ? bottomLayer.transitionHeight
                        : 20;
                }
                
                const actualHeight = bottomLayer.actualHeight !== undefined
                    ? bottomLayer.actualHeight
                    : this.H;
                
                // En alt katmanın alt Z pozisyonu (katmanın alt hizası)
                bottomZ = bottomLayerTop - transitionHeight - actualHeight;
                console.log(`📍 En alt katman (${bottomLayerNum}) alt Z: ${bottomZ.toFixed(2)}`);
            }
        }

        // Püskül merkezini hesapla (0, 0) - püskül merkezi genellikle (0, 0)
        const puskulCenterX = 0;
        const puskulCenterY = 0;

        // 🎯 Üst katmanın (en alt katman) a1, b1, d1 noktalarını al (yalnızca innerRadius'taki hücreler)
        const topLayerPoints = [];
        if (bottomLayer && bottomLayer.geometry) {
            const geometry = bottomLayer.geometry;
            const totalCells = geometry.totalCells || 0;
            const targetInnerRadius = bottomLayer.innerRadius ?? this.innerRadius;
            const radiusTolerance = Math.max(2, targetInnerRadius * 0.01); // %1 veya 2 birim
            
            for (let i = 0; i < totalCells; i++) {
                const cellName = `cell${i + 1}`;
                const cell = geometry.cells[cellName];
                const pos = geometry.cellPositions[cellName];
                
                if (!cell || !pos || !cell.geometry || !cell.geometry.points) continue;
                
                const cellGeo = cell.geometry;
                const cellType = cell.type || 'BADEM';
                const prefix = cellType === 'FITIL' ? 'F' : 
                              (cellType === 'KAZAYAGI' ? 'K' : 
                              (cellType === 'YAPRAK' ? 'Y' : 'B'));
                
                // a1, b1, d1 noktalarını al
                const a1 = cellGeo.points[`${prefix}-a1`];
                const b1 = cellGeo.points[`${prefix}-b1`];
                const d1 = cellGeo.points[`${prefix}-d1`];
                
                if (a1 && b1 && d1) {
                    // World koordinatlarına dönüştür
                    const cos = Math.cos(pos.rotation);
                    const sin = Math.sin(pos.rotation);
                    
                    const transformToWorld = (pt) => {
                        const worldX = pos.x + (pt.x * cos - pt.y * sin);
                        const worldY = pos.y + (pt.x * sin + pt.y * cos);
                        const worldZ = bottomZ; // Katmanın alt hizası
                        return { x: worldX, y: worldY, z: worldZ };
                    };
                    
                    const a1w = transformToWorld(a1);
                    const b1w = transformToWorld(b1);
                    const d1w = transformToWorld(d1);
                    
                    // Yalnızca a1 world koordinatı innerRadius üzerinde olan hücreleri dahil et
                    const r = Math.hypot(a1w.x, a1w.y);
                    if (Math.abs(r - targetInnerRadius) <= radiusTolerance) {
                        topLayerPoints.push({
                            a1: a1w,
                            b1: b1w,
                            d1: d1w,
                            cellName: cellName
                        });
                    }
                }
            }
            
            console.log(`📍 Üst katmandan ${topLayerPoints.length} hücre noktası alındı (innerRadius filtreli)`);

            // ⚠️ Geri dönüş: Filtre sıfır dönerse İÇ HALKAYI otomatik seç
            if (topLayerPoints.length === 0) {
                // Tüm hücreleri aday olarak topla (dönüşümü yaparak)
                const candidates = [];
                for (let i = 0; i < totalCells; i++) {
                    const cellName = `cell${i + 1}`;
                    const cell = geometry.cells[cellName];
                    const pos = geometry.cellPositions[cellName];
                    if (!cell || !pos || !cell.geometry || !cell.geometry.points) continue;

                    const cellGeo = cell.geometry;
                    const cellType = cell.type || 'BADEM';
                    const prefix = cellType === 'FITIL' ? 'F' : (cellType === 'KAZAYAGI' ? 'K' : (cellType === 'YAPRAK' ? 'Y' : 'B'));

                    const a1 = cellGeo.points[`${prefix}-a1`];
                    const b1 = cellGeo.points[`${prefix}-b1`];
                    const d1 = cellGeo.points[`${prefix}-d1`];
                    if (!a1 || !b1 || !d1) continue;

                    const cos = Math.cos(pos.rotation);
                    const sin = Math.sin(pos.rotation);
                    const transformToWorld = (pt) => {
                        const worldX = pos.x + (pt.x * cos - pt.y * sin);
                        const worldY = pos.y + (pt.x * sin + pt.y * cos);
                        const worldZ = bottomZ;
                        return { x: worldX, y: worldY, z: worldZ };
                    };
                    const a1w = transformToWorld(a1);
                    const b1w = transformToWorld(b1);
                    const d1w = transformToWorld(d1);

                    candidates.push({ a1: a1w, b1: b1w, d1: d1w, cellName, r: Math.hypot(a1w.x, a1w.y) });
                }

                if (candidates.length > 0) {
                    // En iç halka yarıçapını bul (a1 tabanlı)
                    const minR = candidates.reduce((m, c) => Math.min(m, c.r), Infinity);
                    const eps = Math.max(2, minR * 0.01); // 2 birim veya %1 tolerans
                    candidates.forEach(c => {
                        if (Math.abs(c.r - minR) <= eps) {
                            topLayerPoints.push({ a1: c.a1, b1: c.b1, d1: c.d1, cellName: c.cellName });
                        }
                    });
                    console.warn(`⚠️ innerRadius filtresi boş döndü; iç halka otomatik seçildi (minR=${minR.toFixed(2)}, seçilen=${topLayerPoints.length})`);
                }
            }
        }

        // Püskül Sonu geometrisini oluştur
        this.puskulSonu.geometry = new PuskulSonuGeometry(
            this.M,
            this.puskulSonu.H,
            this.puskulSonu.fillet,
            puskulCenterX,
            puskulCenterY,
            topLayerPoints,  // 🎯 Üst katman noktaları
            bottomZ,         // 🎯 Z başlangıç pozisyonu
            this.puskulSonu.filletSegments // 🎚️ Fillet segment sayısı
        );

        // Three.js geometrisini oluştur
        const geometry = this.puskulSonu.geometry.createThreeGeometry();

        // Mesh oluştur
        const material = new THREE.MeshPhongMaterial({
            color: 0x8B4789,  // Mor renk (püskül ile aynı)
            flatShading: true,
            shininess: 30,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Z pozisyonunu ayarla (katmanın alt hizasından başlar, aşağı doğru H kadar)
        // Geometri içinde Z koordinatları: 0 (üst) → -H (alt)
        // Mesh pozisyonu: bottomZ (katmanın alt hizası) - geometri içinde Z=0 buraya denk gelir
        mesh.position.z = bottomZ;
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.visible = this.puskulSonu.visible;
        this.scene.add(mesh);
        this.puskulSonu.mesh = mesh;

        // Wireframe mesh (threshold=10 ile çapraz iç çizgileri filtrele)
        const edgesGeometry = new THREE.EdgesGeometry(geometry, 10);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
            transparent: true,
            opacity: 0.8
        });

        const wireframe = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        wireframe.position.z = bottomZ;  // Mesh ile aynı Z pozisyonu
        wireframe.visible = this.puskulSonu.visible && this.showWireframe;
        this.scene.add(wireframe);
        this.puskulSonu.wireframeMesh = wireframe;

        console.log(`✅ Püskül Sonu modülü oluşturuldu (Z: ${mesh.position.z.toFixed(2)}, H: ${this.puskulSonu.H}, Fillet: ${this.puskulSonu.fillet})`);
    }

    /**
     * 🎯 Püskül Sonu modülünü güncelle
     */
    updatePuskulSonu() {
        // Eğer geometry yoksa oluştur
        if (!this.puskulSonu.geometry) {
            this.createPuskulSonu();
            
            // 🎨 Gri mod aktifse uygula
            if (this.uiManager && this.uiManager.grayMode) {
                this.uiManager.refreshGrayMode();
            }
            return;
        }

        // Eski mesh'leri temizle
        if (this.puskulSonu.mesh) {
            this.scene.remove(this.puskulSonu.mesh);
            if (this.puskulSonu.mesh.geometry) {
                this.puskulSonu.mesh.geometry.dispose();
            }
            this.puskulSonu.mesh = null;
        }
        if (this.puskulSonu.wireframeMesh) {
            this.scene.remove(this.puskulSonu.wireframeMesh);
            if (this.puskulSonu.wireframeMesh.geometry) {
                this.puskulSonu.wireframeMesh.geometry.dispose();
            }
            this.puskulSonu.wireframeMesh = null;
        }

        // Geometriyi tamamen yeniden oluştur (güncel katman verileriyle)
        this.puskulSonu.geometry = null;
        this.createPuskulSonu();
        
        // 🎨 Gri mod aktifse uygula
        if (this.uiManager && this.uiManager.grayMode) {
            this.uiManager.refreshGrayMode();
        }
    }



    /**

     * 🔌 Harici hücre geometrilerini yükle

     */

    loadExternalCells() {

        console.log('🔌 Loading external cell geometries...');

        console.log('📦 Cell loading system ready');

        console.log('💡 Use: viewer.loadCell(cellName, geometry)');

    }

    

    /**

     * 🎯 Açılışta otomatik mock hücreler yükle

     */

    autoLoadMockCells() {

        console.log('🎯 Auto-loading cells on startup...');

        console.log('🔍 Checking BademGeometry:', typeof BademGeometry !== 'undefined' ? 'LOADED ✅' : 'NOT LOADED ❌');

        

        // DOMContentLoaded'dan sonra çağrılacağı için cellLoader henüz hazır olmayabilir

        // Window scope'a bir flag ekle

        this.needsAutoLoad = true;

    }

    

    /**

     * 🟡 Gen planı sarı çizgisini oluştur (düzenli çokgen outline)

     */

    createPolygonGuide() {
        // 🚫 Polygon guide çizgileri devre dışı
        return;
        // Delegate to PolygonGuideUtils module
        PolygonGuideUtils.createPolygonGuide(this);
    }

    

    /**

     * 📏 Gen kenar uzunluğunu hesapla

     * Düzenli çokgende kenar uzunluğu = 2 * r * sin(π / n)

     */

    calculateEdgeLength(radius, sides) {
        // Delegate to PolygonGuideUtils module
        return PolygonGuideUtils.calculateEdgeLength(radius, sides);
    }

    

    /**

     * 🎨 Manuel mod için hücre atama UI'sını oluştur

     */

    createCellAssignmentUI() {

        const panel = document.getElementById('cell-assignment-panel');

        panel.innerHTML = `

            <div class="panel-head">

                <h3>Hücre tiplerini seç</h3>

                <label class="checkbox-row">

                    <input type="checkbox" id="manual-show-dropdowns" ${this.manualModeShowDropdowns ? 'checked' : ''}>

                    <span>Dropdown</span>

                </label>

            </div>

            <p class="hint">

                İşaretli: tip seçimi (dropdown) | İşaretsiz: edit modu

            </p>
        `;

        

        // Dropdown container oluştur

        const dropdownContainer = document.createElement('div');

        dropdownContainer.id = 'manual-dropdown-container';

        dropdownContainer.style.display = this.manualModeShowDropdowns ? 'block' : 'none';

        panel.appendChild(dropdownContainer);

        

        const total = this.puskulGeometry?.totalCells || this.puskulSides * (this.cellMultiplier === 3 ? 4 : this.cellMultiplier);

        

        // Her hücre için dropdown oluştur (totalCells bazlı)

        for (let i = 0; i < total; i++) {

            const cellNum = i + 1;

            const cellKey = `cell${cellNum}`;

            const row = document.createElement('div');

            row.className = 'cell-row';

            row.setAttribute('data-cell-name', cellKey); // 🆕 Cell name eklendi

            

            const label = document.createElement('label');

            label.textContent = `Cell ${cellNum}:`;

            label.style.pointerEvents = 'none'; // Label'a tıklama row'a gitmeli

            

            const select = document.createElement('select');

            select.id = `cell-type-select-${cellNum}`;


            

            // Geçerli tipleri sun

            ['BADEM', 'FITIL', 'YAPRAK', 'KAZAYAGI'].forEach(code => {

                const option = document.createElement('option');

                option.value = code;

                option.textContent = code;



                // 🎯 Gerçek hücre tipini bul (öncelik sırası):

                // 1. Manuel override (kullanıcı değiştirmişse)

                // 2. CellTypeMapping (geometrinin tip ataması - en güvenilir)

                // 3. Yüklenmiş hücrenin gerçek tipi

                // 4. Fallback: layer'ın mainCellType'ı

                const cellObj = this.puskulGeometry?.cells?.[cellKey];

                const current = this.manualCellTypeOverrides[cellKey] ||

                               this.puskulGeometry?.cellTypeMapping?.[cellKey] ||

                               cellObj?.type ||

                               this.mainCellType;



                option.selected = (current === code);

                select.appendChild(option);

            });

            

            // Change event

            select.addEventListener('change', () => {

                this.manualCellTypeOverrides[cellKey] = select.value;

                console.log(`🎨 ${cellKey} type → ${select.value} (manual)`);

                

                // Mevcut highlight'ı koru

                const wasHighlighted = this.hoveredCellName === cellKey;

                

                // Hücreleri yeniden yükle

                this.reloadCellsWithRules();

                

                // Highlight'ı geri getir (hücreler yüklendikten sonra)

                if (wasHighlighted) {

                    // Kısa bir gecikme ile highlight'ı yeniden uygula

                    setTimeout(() => {

                        this.highlightCellForManualMode(cellKey);

                        console.log(`🔵 Highlight korundu: ${cellKey}`);

                    }, 100);

                }

            });

            

            // 🆕 Hover event - Dropdown'a hover edilince sahneyi highlight et

            row.addEventListener('mouseenter', () => {

                this.highlightCellForManualMode(cellKey);

            });

            

            // Mouseleave artık temizlemiyor - sticky highlight

            // (Başka hücreye geçince veya mod değişince temizlenir)

            

            row.appendChild(label);

            row.appendChild(select);

            dropdownContainer.appendChild(row);

        }

        

        // Checkbox event listener

        const checkbox = document.getElementById('manual-show-dropdowns');

        if (checkbox) {

            checkbox.addEventListener('change', (e) => {

                this.manualModeShowDropdowns = e.target.checked;

                dropdownContainer.style.display = this.manualModeShowDropdowns ? 'block' : 'none';

                

                if (this.manualModeShowDropdowns) {

                    // Dropdown modu: Mavi hover aktif, edit kapalı

                    console.log('📋 Manuel mod: Dropdown aktif, edit kapalı');

                } else {

                    // Edit modu: Mavi hover kapalı, edit aktif

                    this.clearManualHoverHighlight();

                    console.log('✏️ Manuel mod: Edit aktif, dropdown kapalı');

                }

            });

        }

        

        console.log('🎨 Cell assignment UI (manual) created for', total, 'cells');

    }

    

    /**

     * 📋 Belirli bir yerleşim için kullanılabilir hücre tiplerini döndür

     */

    getAvailableCellTypes(placement) {

        const types = [];

        

        // Kuralları kontrol et

        if (this.positionRules['B'].includes(placement)) {

            types.push({ code: 'B', name: 'Badem' });

        }

        if (this.positionRules['F'].includes(placement)) {

            types.push({ code: 'F', name: 'Fitil' });

        }

        if (this.positionRules['Y'] && this.positionRules['Y'].includes(placement)) {

            types.push({ code: 'Y', name: 'Yaprak' });

        }

        if (this.positionRules['Z'].includes(placement)) {

            types.push({ code: 'Z', name: 'Kazayağı' });

        }

        

        return types;

    }

    

    /**

     * 🔄 Hücreleri kurallara göre yeniden yükle

     */

    reloadCellsWithRules() {

        if (!window.cellLoader) {

            console.warn('⚠️ CellLoader not ready');

            return;

        }



        // Manuel hover highlight'ı temizleme - dropdown change'de korunacak

        // (Sadece mod değişirse temizlenir)

        

        // 🆕 YENİ SİSTEM: puskulGeometry.getCellType() otomatik tip ataması yapar

        console.log(`🔄 Reloading ${this.puskulGeometry.totalCells} cells...`);

        

        // Püskül geometrisini güncellemek gerekebilir

        this.puskulGeometry.sides = this.puskulSides;

        this.puskulGeometry.placement = this.puskulPlacement;

        this.puskulGeometry.outerRadius = this.outerRadius; // 🔴 Kritik: outerRadius güncelle

        this.puskulGeometry.innerRadius = this.innerRadius; // 🔵 Kritik: innerRadius güncelle

        this.puskulGeometry.mainCellType = this.mainCellType;

        this.puskulGeometry.interCellType = this.interCellType;

        this.puskulGeometry.cellMultiplier = this.cellMultiplier;

        

        // totalCells'i yeniden hesapla

        this.puskulGeometry.totalCells = this.puskulGeometry.calculateTotalCells();

        

        // Pozisyonları ve mapping'i yeniden hesapla

        this.puskulGeometry.cellPositions = this.puskulGeometry.calculateCellPositions();

        

        // Manuel atama aktifse tipleri override et

        if (this.cellAssignmentMode === 'manual' && this.puskulGeometry?.cellTypeMapping) {

            const mapping = { ...this.puskulGeometry.cellTypeMapping };

            Object.keys(mapping).forEach(cellName => {

                if (this.manualCellTypeOverrides[cellName]) {

                    mapping[cellName] = this.manualCellTypeOverrides[cellName];

                }

            });

            this.puskulGeometry.cellTypeMapping = mapping;

        }



        // Hücreleri yeniden yükle (sadece aktif katman - eski sistem)

        window.cellLoader.reloadAllCells();



        // 🎨 Cell editor açıksa seçimi koru ve highlight yenile

        // NOT: updateGeometryAfterCellLoad içinde zaten highlight yenileniyor

    }



    /**

     * 🏗️ Parent katman güncellendiğinde child layer'ları yeniden yükle

     * Aktif katman değiştiğinde (ngon, radius, H) child layer'lar otomatik güncellenir

     */

    reloadChildLayersAfterParentUpdate() {

        // Aktif katmanın child layer'larını bul

        const childLayerNums = [];

        for (const layerNum in this.layers) {

            const num = parseInt(layerNum);

            const layer = this.layers[num];

            if (layer && layer.parentLayer === this.currentLayer) {

                childLayerNums.push(num);

            }

        }



        if (childLayerNums.length === 0) return;



        console.log(`🏗️ ${childLayerNums.length} child layer bulundu, parent değişikliklerine göre güncelleniyor...`);



        // Her child layer için Promise oluştur

        const reloadPromises = childLayerNums.map(childNum => {

            const childLayer = this.layers[childNum];

            if (!childLayer || !childLayer.geometry) return Promise.resolve();



            // 🔢 Child layer'ın ngon sayısını parent'ın GÜNCEL değerine eşitle

            childLayer.sides = this.puskulGeometry.sides;



            // 🔵 Kaskad kuralı: Child'ın outerRadius'u parent'ın innerRadius'una eşit olmalı

            const parentLayer = this.layers[this.currentLayer];

            const newChildOuterRadius = parentLayer.innerRadius;



            // ⚠️ outerRadius'u güncelle

            childLayer.outerRadius = newChildOuterRadius;



            // ⚠️ KURAL: innerRadius ASLA outerRadius'tan büyük olamaz

            const minGap = 10; // Minimum boşluk

            if (childLayer.innerRadius >= newChildOuterRadius - minGap) {

                childLayer.innerRadius = Math.max(newChildOuterRadius - minGap, minGap);

                console.warn(`  ⚠️ Layer ${childNum} innerRadius düzeltildi: ${childLayer.innerRadius} (outer=${newChildOuterRadius})`);

            }



            console.log(`  🔄 Layer ${childNum}: outer=${newChildOuterRadius}, inner=${childLayer.innerRadius}`);



            // 🔷 Custom boundary güncelleme: Aktif parent katmandan yeni boundary al

            if (typeof LayerBoundary !== 'undefined' && parentLayer.geometry) {

                const parentZOffset = this.getLayerZOffset(this.currentLayer);

                const newBoundary = LayerBoundary.extractBoundaryPoints(parentLayer, parentZOffset);



                if (newBoundary && newBoundary.length > 0) {

                    childLayer.geometry.customOuterBoundary = newBoundary;

                    console.log(`  🔷 Layer ${childNum}: ${newBoundary.length} boundary point`);

                }

            }



            // Child layer geometrisini güncelle

            childLayer.geometry.sides = this.puskulGeometry.sides;

            childLayer.geometry.placement = childLayer.placement;

            childLayer.geometry.outerRadius = newChildOuterRadius;

            childLayer.geometry.innerRadius = childLayer.innerRadius;

            childLayer.geometry.H = this.H; // ✅ H değerini de güncelle

            childLayer.geometry.mainCellType = childLayer.mainCellType;

            childLayer.geometry.interCellType = childLayer.interCellType;

            childLayer.geometry.cellMultiplier = childLayer.cellMultiplier;



            // totalCells'i ve pozisyonları yeniden hesapla

            childLayer.geometry.totalCells = childLayer.geometry.calculateTotalCells();

            childLayer.geometry.cellPositions = childLayer.geometry.calculateCellPositions();



            // Child layer'ın hücrelerini temizle

            childLayer.geometry.cells = {};

            childLayer.geometry.originalMasterPoints = {};

            for (let i = 0; i < childLayer.geometry.totalCells; i++) {

                childLayer.geometry.cells[`cell${i + 1}`] = null;

            }



            // Child layer yükleme Promise'i döndür

            return new Promise((resolve) => {

                setTimeout(() => {

                    const oldGeometry = this.puskulGeometry;

                    const oldLayer = this.currentLayer;

                    // 🎨 Görsel ayarları da geçici olarak kaydet

                    const oldBademRadialRatio = this.bademRadialRatio;

                    const oldBademNarrowFactor = this.bademNarrowFactor;

                    const oldEnableSnap = this.enableSnap;

                    const oldSnapThreshold = this.snapThreshold;

                    const oldShowSnapConnections = this.showSnapConnections;

                    const oldShowCenterLines = this.showCenterLines;

                    const oldShowBademRadialCircle = this.showBademRadialCircle;

                    // ⚠️ KRITIK: outerRadius/innerRadius'u da kaydet

                    const oldOuterRadius = this.outerRadius;

                    const oldInnerRadius = this.innerRadius;

                    // 🎨 CellEditor durumunu kaydet (highlight'lar kaybolmasın)
                    const cellEditorWasOpen = this.cellEditor && this.cellEditor.panelOpen;
                    const savedCellName = cellEditorWasOpen ? this.cellEditor.selectedCellName : null;
                    const savedCellGroup = cellEditorWasOpen ? this.cellEditor.selectedCellGroup : null;

                    // Geçici olarak child layer'a geç

                    this.currentLayer = childNum;

                    this.puskulGeometry = childLayer.geometry;

                    // ⚠️ KRITIK: Child layer'ın outerRadius/innerRadius'unu yükle

                    this.outerRadius = childLayer.outerRadius;

                    this.innerRadius = childLayer.innerRadius;

                    console.log(`  🔧 Child layer ${childNum} için geçici radius: outer=${this.outerRadius}, inner=${this.innerRadius}`);

                    // 🎨 Child layer'ın görsel ayarlarını yükle

                    this.bademRadialRatio = childLayer.bademRadialRatio;

                    this.bademNarrowFactor = childLayer.bademNarrowFactor;

                    this.enableSnap = childLayer.enableSnap;

                    this.snapThreshold = childLayer.snapThreshold;

                    this.showSnapConnections = childLayer.showSnapConnections;

                    this.showCenterLines = childLayer.showCenterLines;

                    this.showBademRadialCircle = childLayer.showBademRadialCircle;



                    // CellLoader'ı child layer için kullan

                    const tempLoader = new CellLoader(this);

                    tempLoader.loadAllCells().then(() => {

                        console.log(`  ✅ Layer ${childNum} cells reloaded`);



                        // Eski katmana ve görsel ayarlara geri dön

                        this.currentLayer = oldLayer;

                        this.puskulGeometry = oldGeometry;

                        // ⚠️ KRITIK: outerRadius/innerRadius'u geri yükle

                        this.outerRadius = oldOuterRadius;

                        this.innerRadius = oldInnerRadius;

                        this.bademRadialRatio = oldBademRadialRatio;

                        this.bademNarrowFactor = oldBademNarrowFactor;

                        this.enableSnap = oldEnableSnap;

                        this.snapThreshold = oldSnapThreshold;

                        this.showSnapConnections = oldShowSnapConnections;

                        this.showCenterLines = oldShowCenterLines;

                        this.showBademRadialCircle = oldShowBademRadialCircle;

                        // 🎨 CellEditor durumunu geri yükle
                        if (cellEditorWasOpen && savedCellName && savedCellGroup) {
                            // Highlight'ları eski layer'da yeniden oluştur
                            const [cellType, placement] = savedCellGroup.split('_');
                            this.cellEditor.selectedCellName = savedCellName;
                            this.cellEditor.selectedCellGroup = savedCellGroup;
                            this.cellEditor.highlightSelection(savedCellName, cellType, placement);
                        }

                        // 🎯 Child layer hücreleri yüklendi, şimdi parent'a göre hizala

                        this.alignChildToParentLayer(childNum, childLayer.parentLayer);



                        resolve();

                    });

                }, 100);

            });

        });



        // TÜM child layer'lar yüklendikten SONRA render et

        Promise.all(reloadPromises).then(() => {

            console.log(`✅ Tüm child layer'lar yüklendi ve hizalandı`);

            this.renderAllLayers();

            this.createAllBridgeSurfaces();

            // 🎯 Katman geçiş yüzeylerini oluştur

            if (this.layerTransition) {

                this.layerTransition.createAllTransitionSurfaces();

            }

        });

    }



    /**

     * 🤖 Otomatik mod için hücre tiplerini oluştur

     * 🆕 DEPRECATED: puskulGeometry.getCellType() kullanın

     */

    generateAutoCellTypes() {

        console.warn('⚠️ generateAutoCellTypes() DEPRECATED');

        const types = [];

        const sides = this.puskulSides;

        

        // ESKİ MANTIK: Geriye uyumluluk için

            for (let i = 0; i < sides; i++) {

                types.push(i % 2 === 0 ? 'B' : 'F');

        }

        

        return types;

    }

    

    /**

     * 🔗 Yan tutunma bağlantılarını görselleştir (b1-d1 snap)

     */

    createSnapConnections() {

        // Eski görselleştirmeleri temizle

        this.snapConnectionMeshes.forEach(mesh => this.scene.remove(mesh));

        this.snapConnectionMeshes = [];

        this.snapPointMeshes.forEach(mesh => this.scene.remove(mesh));

        this.snapPointMeshes = [];

        

        if (!this.showSnapConnections) {

            return;

        }

        

        const totalCells = this.puskulGeometry.totalCells; // 🆕 totalCells kullan

        const positions = this.puskulGeometry.cellPositions;

        

        // Her hücre çifti için bağlantıyı kontrol et (kurallara göre: b1-d1 veya Fitil↔Badem c1)

        for (let i = 0; i < totalCells; i++) {

            const currentCell = `cell${i + 1}`;

            const nextCell = `cell${((i + 1) % totalCells) + 1}`; // Döngüsel (son→ilk)

            

            const pos1 = positions[currentCell];

            const pos2 = positions[nextCell];

            

            if (!pos1 || !pos2) continue;

            

            // Hücre objelerini al

            const cellObj1 = this.puskulGeometry.cells[currentCell];

            const cellObj2 = this.puskulGeometry.cells[nextCell];

            if (!cellObj1 || !cellObj2) continue;

            const geo1 = cellObj1.geometry;

            const geo2 = cellObj2.geometry;

            if (!geo1 || !geo2 || !geo1.masterPoints || !geo2.masterPoints) continue;

            

            // Tip → prefix eşlemesi

            const prefix1 = cellObj1.type === 'FITIL' ? 'F' : 

                           (cellObj1.type === 'KAZAYAGI' ? 'K' : 

                           (cellObj1.type === 'YAPRAK' ? 'Y' : 'B'));

            const prefix2 = cellObj2.type === 'FITIL' ? 'F' : 

                           (cellObj2.type === 'KAZAYAGI' ? 'K' : 

                           (cellObj2.type === 'YAPRAK' ? 'Y' : 'B'));

            

            // Bağlantı kuralı (puskul-geometry.applySnap ile aynı mantık)

            const isFitilOrKazayak1 = (prefix1 === 'F' || prefix1 === 'K');

            const isFitilOrKazayak2 = (prefix2 === 'F' || prefix2 === 'K');

            

            let p1Name = 'b1';

            let p2Name = 'd1';

            if (isFitilOrKazayak1 && !isFitilOrKazayak2) {

                // Fitil/Kazayağı → Badem/Yaprak: Fitil.b1 ↔ Badem.c1

                p1Name = 'b1';

                p2Name = 'c1';

            } else if (!isFitilOrKazayak1 && isFitilOrKazayak2) {

                // Badem/Yaprak → Fitil/Kazayağı: Badem.c1 ↔ Fitil.d1

                p1Name = 'c1';

                p2Name = 'd1';

            }

            

            // Master noktaları al

            const mp1 = geo1.masterPoints[`${prefix1}-${p1Name}`];

            const mp2 = geo2.masterPoints[`${prefix2}-${p2Name}`];

            if (!mp1 || !mp2) continue;

            

            // Local→World dönüşümü

            const cos1 = Math.cos(pos1.rotation);

            const sin1 = Math.sin(pos1.rotation);

            const p1_x = pos1.x + (mp1.x * cos1 - mp1.y * sin1);

            const p1_y = pos1.y + (mp1.x * sin1 + mp1.y * cos1);

            

            // Z düzlemi: a1 seviyesinde çiz (z = a1)

            // KRİTİK: geometry.points kullan (c6=0 normalize edilmiş), masterPoints DEĞİL

            const a1p1 = geo1.points?.[`${prefix1}-a1`];

            const a1p2 = geo2.points?.[`${prefix2}-a1`];

            const a1_1_world_z = pos1.z + ((a1p1 && typeof a1p1.z === 'number') ? a1p1.z : 0);

            const a1_2_world_z = pos2.z + ((a1p2 && typeof a1p2.z === 'number') ? a1p2.z : 0);

            // Her nokta kendi hücresinin a1 Z düzleminde

            const p1_z = a1_1_world_z;

            

            const cos2 = Math.cos(pos2.rotation);

            const sin2 = Math.sin(pos2.rotation);

            const p2_x = pos2.x + (mp2.x * cos2 - mp2.y * sin2);

            const p2_y = pos2.y + (mp2.x * sin2 + mp2.y * cos2);

            const p2_z = a1_2_world_z; // kendi a1 düzleminde

            

            // Mesafe hesapla (3D)

            const distance = Math.sqrt(

                (p1_x - p2_x) ** 2 + 

                (p1_y - p2_y) ** 2 +

                (p1_z - p2_z) ** 2

            );

            

            // Renk kodlama

            let color = 0x00ff00; // Yeşil (iyi)

            if (distance > 5) {

                color = 0xff0000; // Kırmızı (kötü)

            } else if (distance > 1) {

                color = 0xff8800; // Turuncu (orta)

            }

            

            // b1-d1 arası çizgi

            const linePoints = [

                new THREE.Vector3(p1_x, p1_y, p1_z),

                new THREE.Vector3(p2_x, p2_y, p2_z)

            ];

            const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);

            const lineMaterial = new THREE.LineBasicMaterial({ 

                color: color,

                linewidth: 3,

                transparent: true,

                opacity: 0.8

            });

            const line = new THREE.Line(lineGeometry, lineMaterial);

            this.scene.add(line);

            this.snapConnectionMeshes.push(line);

            

            // b1 noktası işaretçisi (küçük küre)

            const b1Sphere = new THREE.Mesh(

                new THREE.SphereGeometry(2, 8, 8),

                new THREE.MeshBasicMaterial({ color: 0xffff00, opacity: 0.7, transparent: true })

            );

            b1Sphere.position.set(p1_x, p1_y, p1_z);

            this.scene.add(b1Sphere);

            this.snapPointMeshes.push(b1Sphere);

            

            // d1 noktası işaretçisi

            const d1Sphere = new THREE.Mesh(

                new THREE.SphereGeometry(2, 8, 8),

                new THREE.MeshBasicMaterial({ color: 0x00ffff, opacity: 0.7, transparent: true })

            );

            d1Sphere.position.set(p2_x, p2_y, p2_z);

            this.scene.add(d1Sphere);

            this.snapPointMeshes.push(d1Sphere);

            

            console.log(`🔗 Cell ${i+1}→${((i+1)%totalCells)+1}: ${prefix1}-${p1Name} ↔ ${prefix2}-${p2Name} gap = ${distance.toFixed(2)} (${color === 0x00ff00 ? '✅' : color === 0xff8800 ? '⚠️' : '❌'})`);

        }

        

        console.log(`🔗 Snap connections created: ${this.snapConnectionMeshes.length} connections`);

    }

    

    

    /**

     * 🔴 Merkez çizgilerini oluştur (Badem/Yaprak b1/d1 → Püskül merkezi)

     * BADEM ve YAPRAK hücreleri için çalışır

     * Merkez noktası: (0, 0, b1/d1_Z) - Her nokta kendi Z seviyesindeki merkeze çizilir

     */

    createCenterLines() {
        // 🚫 Merkez çizgileri devre dışı
        return;

        // Eski çizgileri temizle

        this.centerLineMeshes.forEach(mesh => this.scene.remove(mesh));

        this.centerLineMeshes = [];



        if (!this.showCenterLines) {

            return;

        }



        const totalCells = this.puskulGeometry.totalCells;

        const positions = this.puskulGeometry.cellPositions;

        

        // Her hücreyi kontrol et

        for (let i = 0; i < totalCells; i++) {

            const cellName = `cell${i + 1}`;

            const cellObj = this.puskulGeometry.cells[cellName];

            const pos = positions[cellName];

            

            if (!cellObj || !pos) continue;

            

            // BADEM ve YAPRAK hücrelerini işle

            if (cellObj.type !== 'BADEM' && cellObj.type !== 'YAPRAK') continue;

            

            const geo = cellObj.geometry;

            if (!geo || !geo.masterPoints) continue;

            

            // Prefix belirle (B=Badem, Y=Yaprak)

            const prefix = cellObj.type === 'YAPRAK' ? 'Y' : 'B';

            

            // Master noktalarını al

            const b1 = geo.masterPoints[`${prefix}-b1`];

            const d1 = geo.masterPoints[`${prefix}-d1`];

            

            if (!b1 || !d1) continue;

            

            // b1 ve d1'i world koordinatlarına dönüştür

            const cos = Math.cos(pos.rotation);

            const sin = Math.sin(pos.rotation);

            

            // b1 world pozisyonu

            const b1_world_x = pos.x + (b1.x * cos - b1.y * sin);

            const b1_world_y = pos.y + (b1.x * sin + b1.y * cos);

            // Z koordinatı: a1 seviyesinde (a1.z normalize edilmiş)

            const a1 = geo.points?.[`${prefix}-a1`];

            const b1_world_z = pos.z + (a1 && typeof a1.z === 'number' ? a1.z : 0);

            

            // d1 world pozisyonu

            const d1_world_x = pos.x + (d1.x * cos - d1.y * sin);

            const d1_world_y = pos.y + (d1.x * sin + d1.y * cos);

            const d1_world_z = pos.z + (a1 && typeof a1.z === 'number' ? a1.z : 0);

            

            // b1 → merkez çizgisi (kırmızı) - Merkez b1'in Z seviyesinde

            const b1Center = new THREE.Vector3(0, 0, b1_world_z);

            const b1LinePoints = [

                new THREE.Vector3(b1_world_x, b1_world_y, b1_world_z),

                b1Center

            ];

            const b1LineGeometry = new THREE.BufferGeometry().setFromPoints(b1LinePoints);

            const b1LineMaterial = new THREE.LineBasicMaterial({ 

                color: 0xff0000, // Kırmızı

                linewidth: 2,

                transparent: true,

                opacity: 0.8

            });

            const b1Line = new THREE.Line(b1LineGeometry, b1LineMaterial);

            this.scene.add(b1Line);

            this.centerLineMeshes.push(b1Line);

            

            // d1 → merkez çizgisi (kırmızı) - Merkez d1'in Z seviyesinde

            const d1Center = new THREE.Vector3(0, 0, d1_world_z);

            const d1LinePoints = [

                new THREE.Vector3(d1_world_x, d1_world_y, d1_world_z),

                d1Center

            ];

            const d1LineGeometry = new THREE.BufferGeometry().setFromPoints(d1LinePoints);

            const d1LineMaterial = new THREE.LineBasicMaterial({ 

                color: 0xff0000, // Kırmızı

                linewidth: 2,

                transparent: true,

                opacity: 0.8

            });

            const d1Line = new THREE.Line(d1LineGeometry, d1LineMaterial);

            this.scene.add(d1Line);

            this.centerLineMeshes.push(d1Line);

            

            console.log(`🔴 ${cellName} (${cellObj.type}): b1 → merkez(Z=${b1_world_z.toFixed(1)}), d1 → merkez(Z=${d1_world_z.toFixed(1)})`);

        }

        

        console.log(`🔴 Merkez çizgileri oluşturuldu: ${this.centerLineMeshes.length} çizgi (${this.centerLineMeshes.length / 2} hücre)`);

    }

    

    /**

     * 🟢 Badem/Yaprak radyal çemberini oluştur (b1/d1 konumunu gösteren yeşil çember)

     * Bu çember, gerçek hücrelerin b1 noktalarından oluşturulur (tam çakışma için)

     */

    createBademRadialCircle() {
        // 🚫 Yeşil radyal çember devre dışı
        return;

        // Eski çemberi temizle

        if (this.bademRadialCircleMesh) {

            this.scene.remove(this.bademRadialCircleMesh);

            this.bademRadialCircleMesh = null;

        }



        if (!this.showBademRadialCircle) {

            return;

        }



        const totalCells = this.puskulGeometry.totalCells;

        const positions = this.puskulGeometry.cellPositions;

        const circleVertices = [];

        

        // Her badem/yaprak hücresinin b1 noktasını topla

        let cellCount = 0;

        for (let i = 0; i < totalCells; i++) {

            const cellName = `cell${i + 1}`;

            const cellObj = this.puskulGeometry.cells[cellName];

            const pos = positions[cellName];

            

            if (!cellObj || !pos) continue;

            if (cellObj.type !== 'BADEM' && cellObj.type !== 'YAPRAK') continue;

            

            const geo = cellObj.geometry;

            if (!geo || !geo.masterPoints) continue;

            

            // Prefix belirle

            const prefix = cellObj.type === 'YAPRAK' ? 'Y' : 'B';

            const b1 = geo.masterPoints[`${prefix}-b1`];

            if (!b1) continue;

            

            // b1'i world koordinatlarına dönüştür

            const cos = Math.cos(pos.rotation);

            const sin = Math.sin(pos.rotation);

            const b1_world_x = pos.x + (b1.x * cos - b1.y * sin);

            const b1_world_y = pos.y + (b1.x * sin + b1.y * cos);

            

            circleVertices.push(b1_world_x, b1_world_y, 0); // Z=0 (a1 seviyesinde)

            cellCount++;

        }

        

        // İlk noktayı tekrar ekle (kapalı döngü)

        if (circleVertices.length >= 3) {

            circleVertices.push(circleVertices[0], circleVertices[1], circleVertices[2]);

        }

        

        if (circleVertices.length === 0) {

            console.warn('⚠️ Hiç badem/yaprak hücresi yok, yeşil çember çizilemiyor');

            return;

        }

        

        // Geometri oluştur

        const circleGeometry = new THREE.BufferGeometry();

        circleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(circleVertices, 3));

        

        // Yeşil materyal

        const circleMaterial = new THREE.LineBasicMaterial({

            color: 0x00ff00,  // Yeşil

            linewidth: 2,

            transparent: true,

            opacity: 0.7

        });

        

        // Line mesh oluştur

        this.bademRadialCircleMesh = new THREE.Line(circleGeometry, circleMaterial);

        this.scene.add(this.bademRadialCircleMesh);

        

        console.log(`🟢 Radyal çember oluşturuldu: ${cellCount} hücre b1 noktasından (radialRatio=${(this.bademRadialRatio * 100).toFixed(1)}%)`);

    }

    /**

     * 🌉 Komşu hücreler arası köprü yüzeylerini oluştur

     * Ana ve ara hücreler arasındaki boşlukları dolduran yüzeyler

     */

    createBridgeSurfaces() {

        // Gösterilmeyecekse çık

        if (!this.showBridgeSurfaces) {

            return;

        }



        // Aktif katman için köprü yüzeyleri oluştur

        this.createBridgeSurfacesForLayer(this.currentLayer);

    }



    /**

     * 🌉 Belirli bir katman için köprü yüzeylerini oluştur

     * @param {number} layerNum - Katman numarası

     */

    createBridgeSurfacesForLayer(layerNum) {

        const layer = this.layers[layerNum];

        if (!layer || !layer.geometry) {

            console.warn(`⚠️ Katman ${layerNum} geometrisi bulunamadı!`);

            return;

        }



        // Eski köprü mesh'lerini temizle (artık array)

        if (layer.bridgeMesh) {

            if (Array.isArray(layer.bridgeMesh)) {

                layer.bridgeMesh.forEach(mesh => {

                    this.scene.remove(mesh);

                    if (mesh.geometry) mesh.geometry.dispose();

                    if (mesh.material) mesh.material.dispose();

                });

            } else {

                this.scene.remove(layer.bridgeMesh);

                if (layer.bridgeMesh.geometry) layer.bridgeMesh.geometry.dispose();

                if (layer.bridgeMesh.material) layer.bridgeMesh.material.dispose();

            }

            layer.bridgeMesh = null;

        }



        // Gösterilmeyecekse çık

        if (!this.showBridgeSurfaces) {

            return;

        }



        // Köprü yüzeylerini oluştur (artık array döner)

        const bridges = layer.geometry.createAllBridgeSurfaces();



        if (!bridges || bridges.length === 0) {

            console.warn(`⚠️ Katman ${layerNum} köprü geometrisi oluşturulamadı!`);

            return;

        }



        // 🎨 Z pozisyonunu al - köprü yüzeyler mesh ile aynı seviyede olmalı
        // Layer mesh'i zaten render edilmiş, direkt onun position'unu kullan
        const bridgeZPosition = layer.mesh ? layer.mesh.position.z : this.getLayerZOffset(layerNum);
        console.log(`🌉 Katman ${layerNum} köprü Z pozisyonu: ${bridgeZPosition.toFixed(2)} (mesh.position.z)`);

        // Her köprü için ayrı mesh oluştur

        const bridgeMeshes = [];

        bridges.forEach((bridgeData, index) => {

            // Hücre tipine göre koyu renk belirle
            let bridgeColor;
            if (bridgeData.type1 === 'BADEM' || bridgeData.type2 === 'BADEM') {
                bridgeColor = 0x8B0000; // Koyu kırmızı (BADEM)
            } else if (bridgeData.type1 === 'FITIL' || bridgeData.type2 === 'FITIL') {
                bridgeColor = 0x00008B; // Koyu mavi (FITIL)
            } else if (bridgeData.type1 === 'YAPRAK' || bridgeData.type2 === 'YAPRAK') {
                bridgeColor = 0x006400; // Koyu yeşil (YAPRAK)
            } else if (bridgeData.type1 === 'KAZAYAGI' || bridgeData.type2 === 'KAZAYAGI') {
                bridgeColor = 0x8B8B00; // Koyu sarı (KAZAYAGI)
            } else {
                bridgeColor = 0x808080; // Varsayılan gri
            }

            const bridgeMaterial = new THREE.MeshPhongMaterial({

                color: bridgeColor,

                shininess: 40,

                flatShading: true,

                side: THREE.DoubleSide

            });



            const bridgeMesh = new THREE.Mesh(bridgeData.geometry, bridgeMaterial);

            bridgeMesh.castShadow = true;

            bridgeMesh.receiveShadow = true;

            bridgeMesh.position.z = bridgeZPosition; // Mesh ile aynı seviyede

            bridgeMesh.visible = layer.visible;

            bridgeMesh.name = `Bridge_${index + 1}_${bridgeData.cellName1}_${bridgeData.cellName2}`;



            this.scene.add(bridgeMesh);

            bridgeMeshes.push(bridgeMesh);

        });



        // Layer'a kaydet (artık array)

        layer.bridgeMesh = bridgeMeshes;



        // Aktif katmansa global bridgeMesh'i de güncelle (ilk mesh)

        if (layerNum == this.currentLayer) {

            this.bridgeMesh = bridgeMeshes[0];

        }



        // console.log(`🌉 Katman ${layerNum} köprü yüzeyleri oluşturuldu (${bridgeMeshes.length} köprü, her biri farklı renkte, Z: ${zOffset})`);

        // 🎨 Gri mod aktifse uygula
        if (this.uiManager && this.uiManager.grayMode) {
            this.uiManager.refreshGrayMode();
        }

    }



    /**

     * 🌉 Tüm katmanlar için köprü yüzeylerini oluştur

     */

    createAllBridgeSurfaces() {

        if (!this.showBridgeSurfaces) {

            return;

        }



        Object.keys(this.layers).forEach(layerNum => {

            const layer = this.layers[layerNum];

            if (layer.geometry && layer.visible) {

                this.createBridgeSurfacesForLayer(parseInt(layerNum));

            }

        });



        console.log('🌉 Tüm katmanlar için köprü yüzeyleri oluşturuldu');

    }

    

    /**

     * 🎨 Manuel mod için hücreyi mavi ile highlight et (sahne + dropdown)

     */

    highlightCellForManualMode(cellName) {

        // Aynı hücre zaten highlight'lıysa tekrar yapma

        if (this.hoveredCellName === cellName) {

            return;

        }

        

        // Önceki highlight'ı temizle

        this.clearManualHoverHighlight();

        

        // Yeni hücreyi kaydet

        this.hoveredCellName = cellName;

        

        // 1. SAHNE: Mavi highlight mesh oluştur (cell-editor yöntemiyle)

        const cellObj = this.puskulGeometry.cells?.[cellName];

        const pos = this.puskulGeometry.cellPositions?.[cellName];



        if (cellObj && pos && cellObj.getVertices && cellObj.getIndices) {

            // 🏗️ Aktif katmanın mesh Z pozisyonunu ve geometryMaxZ'yi al (cell-editor ile aynı mantık)

            const currentLayer = this.layers[this.currentLayer];

            const layerZOffset = currentLayer?.mesh ? currentLayer.mesh.position.z : this.getLayerZOffset(this.currentLayer);

            const geometryMaxZ = currentLayer?.geometryMaxZ || 0;



            // Cell-editor'daki aynı yöntemi kullan

            const vertices = cellObj.getVertices();

            const indices = cellObj.getIndices();



            const geometry = new THREE.BufferGeometry();

            const transformedVerts = [];



            // Rotasyon ve pozisyon uygula

            const cos = Math.cos(pos.rotation);

            const sin = Math.sin(pos.rotation);



            for (let i = 0; i < vertices.length; i += 3) {

                const x = vertices[i];

                const y = vertices[i + 1];

                const z = vertices[i + 2];



                // Rotasyon

                const rx = x * cos - y * sin;

                const ry = x * sin + y * cos;



                // Pozisyon ekle + katman Z offset'i + geometryMaxZ (cell-editor ile aynı)

                transformedVerts.push(

                    rx + pos.x,

                    ry + pos.y,

                    z + pos.z + layerZOffset + geometryMaxZ  // 🏗️ Mesh seviyesine hizalama

                );

            }

            

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(transformedVerts, 3));

            geometry.setIndex(Array.from(indices));

            geometry.computeVertexNormals();

            

            // Mavi highlight material (cell-editor'daki gibi)

            const material = new THREE.MeshBasicMaterial({

                color: 0x00ccff,  // Parlak mavi

                transparent: true,

                opacity: 0.5,     // Biraz şeffaf

                side: THREE.DoubleSide,

                depthTest: false  // Her zaman üstte göster

            });

            

            this.hoverHighlightMesh = new THREE.Mesh(geometry, material);

            this.hoverHighlightMesh.renderOrder = 999; // En üstte render et

            this.scene.add(this.hoverHighlightMesh);

            

            console.log(`🔵 Mavi highlight mesh eklendi: ${cellName}, vertices: ${transformedVerts.length / 3}`);

        }

        

        // 2. DROPDOWN: Row'u vurgula (açık mavi arka plan + border)

        const panel = document.getElementById('cell-assignment-panel');

        if (panel) {

            const row = panel.querySelector(`[data-cell-name="${cellName}"]`);

            if (row) {

                row.classList.add('highlight');

                this.hoveredDropdownRow = row;

                

                // Scroll to view (eğer görünmüyorsa)

                row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            }

        }

        

        console.log(`🎨 Manuel hover: ${cellName} highlighted (mavi)`);

    }

    

    /**

     * 🎨 Manuel mod hover highlight'ını temizle

     */

    clearManualHoverHighlight() {

        // Sahne highlight'ı temizle

        if (this.hoverHighlightMesh) {

            this.scene.remove(this.hoverHighlightMesh);

            this.hoverHighlightMesh.geometry.dispose();

            this.hoverHighlightMesh.material.dispose();

            this.hoverHighlightMesh = null;

        }

        

        // Dropdown vurguyu temizle

        if (this.hoveredDropdownRow) {

            this.hoveredDropdownRow.classList.remove('highlight');

            this.hoveredDropdownRow = null;

        }

        

        this.hoveredCellName = null;

    }

    

    /**

     * 🔄 Hücre yüklendikten sonra geometriyi güncelle

     * @param {boolean} skipChildReload - Child layer'ları yenilemeyi atla (hücre düzenlemesinde kullan)

     */

    updateGeometryAfterCellLoad(skipChildReload = false) {

        const stats = this.puskulGeometry.getStats();



        if (stats.isReady) {

            console.log('🎉 All cells loaded! Updating geometry...');



            // 🔗 SNAP UYGULA: updateDesign ile snap'i uygula

            const geometry = this.puskulGeometry.updateDesign(

                this.puskulSides,

                this.puskulPlacement,

                this.outerRadius,

                this.innerRadius,

                this.enableSnap,

                this.snapThreshold,

                this.cellMultiplier

            );



            // 🏗️ Aktif katmanın geometrisini kaydet

            const currentLayerData = this.layers[this.currentLayer];

            if (currentLayerData) {

                currentLayerData.geometry = this.puskulGeometry;

                console.log(`💾 Katman ${this.currentLayer} geometrisi kaydedildi`);

            }



            // 🏗️ Layer 1'deyse ve child layer'lar varsa, önce onları yeniden yükle

            // Bu, Layer 1 değiştiğinde (ngon, radius, H) child layer'ların otomatik güncellenmesini sağlar

            // SADECE yapısal özellikler değiştiğinde (hücre düzenlemesinde değil)

            // ⚠️ ÖNEMLİ: Köprü ve geçiş yüzeylerinden ÖNCE child layer'lar reload edilmeli!

            if (!skipChildReload) {

                this.reloadChildLayersAfterParentUpdate();

            }



            // 🏗️ Çok katmanlı render sistemi: Tüm katmanları render et

            this.renderAllLayers();



            console.log(`✅ Geometry updated with snap: ${this.enableSnap} (threshold: ${this.snapThreshold})`);



            // Stats güncelle (Accordion kaldırıldı, elementler artık yok)
            const loadedCellsEl = document.getElementById('loaded-cells');
            if (loadedCellsEl) loadedCellsEl.textContent = stats.loadedCells;

            const totalCellsEl = document.getElementById('total-cells');
            if (totalCellsEl) totalCellsEl.textContent = stats.totalCells;



            // Yan tutunma bağlantılarını güncelle

            this.createSnapConnections();



            // 🔴 Merkez çizgilerini güncelle

            this.createCenterLines();



            // 🟢 Badem radyal çemberini güncelle

            this.createBademRadialCircle();



            // 🌉 Tüm katmanlar için köprü yüzeylerini oluştur

            // ⚠️ Child layer yoksa VEYA skipChildReload=true ise burada oluştur

            // ⚠️ Child layer varsa ve skipChildReload=false ise reloadChildLayersAfterParentUpdate içinde oluşturulacak

            const hasChildLayers = Object.values(this.layers).some(layer => layer && layer.parentLayer === this.currentLayer);

            if (skipChildReload || !hasChildLayers) {

                this.createAllBridgeSurfaces();

                // 🎯 Katman geçiş yüzeylerini oluştur

                if (this.layerTransition) {

                    this.layerTransition.createAllTransitionSurfaces();

                }

            }



            // 🏗️ Child layer'dayken (Layer 2+) hücre tipi değiştirilirse, alignment'ı yeniden uygula

            // SADECE tüm hücreler yüklendiyse (stats.isReady) çalıştır - yoksa her hücre için tekrar eder

            if (this.currentLayer > 1 && stats.isReady) {

                const currentLayerData = this.layers[this.currentLayer];

                if (currentLayerData && currentLayerData.parentLayer) {

                    console.log(`🎯 Layer ${this.currentLayer} hücre tipi değişti - alignment yeniden uygulanıyor...`);

                    this.alignChildToParentLayer(this.currentLayer, currentLayerData.parentLayer);

                    this.updateInterCellsAfterAlignment(this.currentLayer);



                    // ✅ Alignment sonrası render ve bridge surfaces güncelle

                    this.renderAllLayers();

                    this.createAllBridgeSurfaces();

                    // 🎯 Katman geçiş yüzeylerini oluştur

                    if (this.layerTransition) {

                        this.layerTransition.createAllTransitionSurfaces();

                    }

                    console.log(`✅ Layer ${this.currentLayer} alignment tamamlandı ve render edildi`);

                }

            }



            // 🔍 İlk açılışta bir kere zoom extent yap

            if (!this.hasInitialZoomExtent) {

                setTimeout(() => {

                    this.zoomExtent();

                    console.log('🔍 İlk açılış: Otomatik zoom extent yapıldı');

                }, 150);

                this.hasInitialZoomExtent = true; // Flag'i set et

            }

            

            // 🎨 Cell editor açıksa highlight'ları yenile

            if (this.cellEditor && this.cellEditor.panelOpen && this.cellEditor.selectedCellName) {

                const cellName = this.cellEditor.selectedCellName;

                const cellObj = this.puskulGeometry.cells?.[cellName];

                const pos = this.puskulGeometry.cellPositions?.[cellName];

                if (cellObj && pos) {

                    const cellType = cellObj.type || 'BADEM';

                    const cellPlacement = pos.type === 'main' ? this.puskulPlacement : 

                                          (this.puskulPlacement === 'corner' ? 'edge' : 'corner');

                    this.cellEditor.highlightSelection(cellName, cellType, cellPlacement);

                }

            }

            // 🎯 Püskül Sonu modülünü güncelle (tüm katmanlar render edildikten sonra)
            this.updatePuskulSonu();

        } else {

            console.log(`📊 ${stats.loadedCells}/${stats.totalCells} cells loaded. Waiting for remaining cells...`);

        }

    }

    

    /**

     * 🔄 Püskül tasarımını güncelle (gen sayısı veya yerleşim değiştiğinde)

     */

    updatePuskulDesign() {

        console.log(`🎨 Updating Püskül design: ${this.puskulSides} sides, ${this.puskulPlacement} placement, outer: ${this.outerRadius}, inner: ${this.innerRadius}, snap: ${this.enableSnap}`);



        // Gen planı sarı çizgisini güncelle

        this.createPolygonGuide();

        

        // Yan tutunma görselleştirmesini güncelle

        this.createSnapConnections();

        

        // 🟢 Badem radyal çemberini güncelle

        this.createBademRadialCircle();

        

        // 🎯 Hücreleri yeniden yükle (outerRadius, innerRadius vb. değişmiş olabilir)

        if (window.cellLoader) {

            // Manuel modda UI'yi güncelle

            if (this.cellAssignmentMode === 'manual') {

                this.createCellAssignmentUI();

            }

            this.reloadCellsWithRules();

            return; // updateGeometryAfterCellLoad içinde mesh güncellenecek

        }

        

        // 🎯 Eğer mock hücreler yüklüyse, yeni hücreleri de yükle

        const stats = this.puskulGeometry.getStats();

        if (stats.loadedCells > 0 && stats.loadedCells < stats.totalCells) {

            // Eksik hücreleri mock olarak yükle

            if (window.cellLoader) {

                console.log(`📦 Auto-loading ${stats.totalCells - stats.loadedCells} additional mock cells...`);

                window.cellLoader.loadMockCells();

                return; // updateGeometryAfterCellLoad içinde mesh güncellenecek

            }

        }

        

        // 🔄 Geometriyi güncelle

        const geometry = this.puskulGeometry.updateDesign(

            this.puskulSides,

            this.puskulPlacement,

            this.outerRadius,

            this.innerRadius,

            this.enableSnap,

            this.snapThreshold,

            this.cellMultiplier

        );

        

        // Mesh'leri güncelle

        this.scene.remove(this.puskulMesh);

        this.scene.remove(this.wireframeMesh);



        // Main mesh'i güncelle

        this.puskulMesh.geometry.dispose();

        this.puskulMesh.geometry = geometry;

        this.scene.add(this.puskulMesh);



        // Wireframe'i güncelle

        const edgesGeometry = new THREE.EdgesGeometry(geometry, 1);

        this.wireframeMesh.geometry.dispose();

        this.wireframeMesh.geometry = edgesGeometry;

        this.scene.add(this.wireframeMesh);

        

        // 🌉 Köprü yüzeylerini güncelle (geometri güncellendikten sonra)

        this.createBridgeSurfaces();

        

        // Stats güncelle (Accordion kaldırıldı, elementler artık yok)
        const loadedCellsEl2 = document.getElementById('loaded-cells');
        if (loadedCellsEl2) loadedCellsEl2.textContent = stats.loadedCells;

        const totalCellsEl2 = document.getElementById('total-cells');
        if (totalCellsEl2) totalCellsEl2.textContent = stats.totalCells;

        

        console.log('✅ Püskül design updated');

    }



    init() {

        console.log('🚀 Püskül Viewer başlatılıyor...');

        console.log('📦 THREE.js version:', THREE.REVISION);

        

        this.setupScene();

        this.setupCamera();

        this.setupRenderer();

        this.setupControls();

        this.setupPipView();  // 🖼️ Mini ortografik görünüm

        this.setupLights();

        this.createPuskulMesh();

        this.setupEventListeners();

        this.createPolygonGuide();  // 🟡 Gen planı sarı çizgi

        this.loadExternalCells();  // 🔌 Harici hücreleri yükle

        this.autoLoadMockCells();  // 🎯 Açılışta otomatik yükle

        this.createSnapConnections();  // 🔗 Yan tutunma görselleştirme

        this.createCenterLines();  // 🔴 Merkez çizgileri

        this.createBademRadialCircle();  // 🟢 Badem radyal çemberi

        this.createBridgeSurfaces();  // 🌉 Köprü yüzeyleri

        // 🎯 Püskül Sonu modülü updateGeometryAfterCellLoad içinde oluşturulacak
        // (katmanlar render edildikten sonra)

        this.animate();

        

        console.log('✅ Initialization complete!');

        console.log('📷 Camera position:', this.camera.position);

        console.log('🎯 Camera target:', this.controls.target);

        console.log('⬆️ Coordinate System: Z-UP (Mavi eksen yukarı gösterir)');

        

        // Hide loading screen

        document.getElementById('loading').classList.add('hidden');

    }



    setupScene() {
        // Delegate to SceneSetup module
        SceneSetup.setupScene(this);
    }



    setupCamera() {
        // Delegate to SceneSetup module
        SceneSetup.setupCamera(this);
    }



    setupRenderer() {
        // Delegate to SceneSetup module
        SceneSetup.setupRenderer(this);
    }



    setupControls() {
        // Delegate to SceneSetup module
        SceneSetup.setupControls(this);
    }

    setupLights() {
        // Delegate to SceneSetup module
        SceneSetup.setupLights(this);
    }

    createPuskulMesh() {

        // 🎀 Püskül Container oluştur (tasarım parametreleriyle)

        this.puskulGeometry = new PuskulGeometry(

            this.M, 

            this.H, 

            this.puskulSides, 

            this.puskulPlacement,

            this.outerRadius,

            this.innerRadius,

            this.mainCellType,

            this.interCellType,

            this.cellMultiplier

        );

        

        console.log('🎨 Püskül Container created:', {

            M: this.M,

            H: this.H,

            sides: this.puskulSides,

            placement: this.puskulPlacement,

            outerRadius: this.outerRadius,

            innerRadius: this.innerRadius,

            mainCellType: this.mainCellType,

            interCellType: this.interCellType,

            cellMultiplier: this.cellMultiplier

        });

        

        // 🎯 Geçici olarak boş geometri göster

        const geometry = this.puskulGeometry.createThreeGeometry();



        // Main mesh with flat shading

        const material = new THREE.MeshPhongMaterial({

            color: 0x8B4789,

            shininess: 60,

            flatShading: true,

            side: THREE.DoubleSide

        });

        

        this.puskulMesh = new THREE.Mesh(geometry, material);

        this.puskulMesh.castShadow = true;

        this.puskulMesh.receiveShadow = true;

        this.scene.add(this.puskulMesh);



        // Wireframe overlay

        const edgesGeometry = new THREE.EdgesGeometry(geometry, 1);

        const wireframeMaterial = new THREE.LineBasicMaterial({ 

            color: 0xffffff,

            linewidth: 2

        });

        this.wireframeMesh = new THREE.LineSegments(edgesGeometry, wireframeMaterial);

        this.scene.add(this.wireframeMesh);



        const stats = this.puskulGeometry.getStats();

        console.log('✅ Püskül container ready:', stats);

        console.log('📍 Scene has', this.scene.children.length, 'objects');

    }



    createPointsMesh() {

        // 🎯 Nokta görselleştirme şimdilik devre dışı

        // 4 harici hücre yüklendiğinde aktif edilecek

        console.log('📍 Point visualization disabled - waiting for cell data');

    }

    

    /**

     * 🧪 DEBUG: Polyline görselleştirme (şimdilik devre dışı)

     */

    createDebugPolylines() {

        // Debug çizgileri devre dışı - harici hücreler için yeniden yapılandırılacak

        console.log('🔍 Debug polylines disabled');

        return;

        

        /*

        // Eski debug çizgilerini temizle

        this.debugLines.forEach(line => this.scene.remove(line));

        this.debugLines = [];

        

        const points = this.puskulGeometry.points;

        

        // 🟡 MASTER POLYLİNE: Y-a1 → Y-b1 → Y-c1 → Y-d1 → Y-a1 (kapalı)

        const masterPolylinePoints = [

            new THREE.Vector3(points['Y-a1'].x, points['Y-a1'].y, points['Y-a1'].z),

            new THREE.Vector3(points['Y-b1'].x, points['Y-b1'].y, points['Y-b1'].z),

            new THREE.Vector3(points['Y-c1'].x, points['Y-c1'].y, points['Y-c1'].z),

            new THREE.Vector3(points['Y-d1'].x, points['Y-d1'].y, points['Y-d1'].z),

            new THREE.Vector3(points['Y-a1'].x, points['Y-a1'].y, points['Y-a1'].z)  // Kapalı döngü

        ];

        

        const masterGeometry = new THREE.BufferGeometry().setFromPoints(masterPolylinePoints);

        const masterMaterial = new THREE.LineBasicMaterial({ 

            color: 0xffff00,  // Sarı

            linewidth: 3,

            transparent: true,

            opacity: 0.8

        });

        const masterLine = new THREE.Line(masterGeometry, masterMaterial);

        this.scene.add(masterLine);

        this.debugLines.push(masterLine);

        

        // 🟢 SLAVE POLYLİNE: Y-a2 → Y-b2 → Y-c6 → Y-d2 → Y-a2 (kapalı)

        // Z=0 düzleminde izdüşüm olarak çiz (geometrik test için)

        const slavePolylinePoints = [

            new THREE.Vector3(points['Y-a2'].x, points['Y-a2'].y, 0),  // Z=0 izdüşüm

            new THREE.Vector3(points['Y-b2'].x, points['Y-b2'].y, 0),  // Z=0 izdüşüm

            new THREE.Vector3(points['Y-c6'].x, points['Y-c6'].y, 0),  // Z=0 izdüşüm (c1'e denk düşmeli)

            new THREE.Vector3(points['Y-d2'].x, points['Y-d2'].y, 0),  // Z=0 izdüşüm

            new THREE.Vector3(points['Y-a2'].x, points['Y-a2'].y, 0)   // Kapalı döngü

        ];

        

        const slaveGeometry = new THREE.BufferGeometry().setFromPoints(slavePolylinePoints);

        const slaveMaterial = new THREE.LineBasicMaterial({ 

            color: 0x00ff00,  // Yeşil

            linewidth: 2,

            transparent: true,

            opacity: 0.6

        });

        const slaveLine = new THREE.Line(slaveGeometry, slaveMaterial);

        this.scene.add(slaveLine);

        this.debugLines.push(slaveLine);

        

        // 📊 Geometrik analiz - Konsola yazdır

        console.log('\n🧪 ========== GEOMETRİK ANALİZ ==========');

        console.log('🟡 Master Polyline (Sarı):');

        console.log('  Y-a1:', points['Y-a1'].x.toFixed(2), points['Y-a1'].y.toFixed(2));

        console.log('  Y-b1:', points['Y-b1'].x.toFixed(2), points['Y-b1'].y.toFixed(2));

        console.log('  Y-c1:', points['Y-c1'].x.toFixed(2), points['Y-c1'].y.toFixed(2));

        console.log('  Y-d1:', points['Y-d1'].x.toFixed(2), points['Y-d1'].y.toFixed(2));



        console.log('\n🟢 Slave Polyline (Yeşil) - XY İzdüşümü:');

        console.log('  Y-a2:', points['Y-a2'].x.toFixed(2), points['Y-a2'].y.toFixed(2), '(z=' + points['Y-a2'].z.toFixed(2) + ')');

        console.log('  Y-b2:', points['Y-b2'].x.toFixed(2), points['Y-b2'].y.toFixed(2), '(z=' + points['Y-b2'].z.toFixed(2) + ')');

        console.log('  Y-c6:', points['Y-c6'].x.toFixed(2), points['Y-c6'].y.toFixed(2), '(z=' + points['Y-c6'].z.toFixed(2) + ')');

        console.log('  Y-d2:', points['Y-d2'].x.toFixed(2), points['Y-d2'].y.toFixed(2), '(z=' + points['Y-d2'].z.toFixed(2) + ')');

        

        // Merkez noktaları karşılaştır

        const masterCenter = {

            x: (points['Y-a1'].x + points['Y-b1'].x + points['Y-c1'].x + points['Y-d1'].x) / 4,

            y: (points['Y-a1'].y + points['Y-b1'].y + points['Y-c1'].y + points['Y-d1'].y) / 4

        };



        const slaveCenter = {

            x: (points['Y-a2'].x + points['Y-b2'].x + points['Y-c6'].x + points['Y-d2'].x) / 4,

            y: (points['Y-a2'].y + points['Y-b2'].y + points['Y-c6'].y + points['Y-d2'].y) / 4

        };

        

        console.log('\n📍 Merkez Noktalar:');

        console.log('  Master Center:', masterCenter.x.toFixed(2), masterCenter.y.toFixed(2));

        console.log('  Slave Center:', slaveCenter.x.toFixed(2), slaveCenter.y.toFixed(2));

        console.log('  Offset:', 

            (slaveCenter.x - masterCenter.x).toFixed(2), 

            (slaveCenter.y - masterCenter.y).toFixed(2));

        

        console.log('\n✅ İki polyline Z=0 düzleminde görüntüleniyor.');

        console.log('💡 Yeşil çizgi, sarı çizginin içinde ve paralel olmalı!\n');

        

        // 🔵 DEBUG yardımcı projeksiyon noktaları

        const d4_projection = new THREE.Vector3(points['Y-d4'].x, points['Y-d4'].y, 0);

        const b4_projection = new THREE.Vector3(points['Y-b4'].x, points['Y-b4'].y, 0);

        const a2_projection = new THREE.Vector3(points['Y-a2'].x, points['Y-a2'].y, 0);

        const a3_projection = new THREE.Vector3(points['Y-a3'].x, points['Y-a3'].y, 0);

        const b2_projection = new THREE.Vector3(points['Y-b2'].x, points['Y-b2'].y, 0);

        const d2_projection = new THREE.Vector3(points['Y-d2'].x, points['Y-d2'].y, 0);

                // PÜSKÜL: z5 ve w5 KALDIRILDI

        const c1_projection = new THREE.Vector3(points['Y-c1'].x, points['Y-c1'].y, 0);

        

                // PÜSKÜL: z5 ve w5 DEBUG ÇİZGİLERİ KALDIRILDI

        

        // 🆕 PÜSKÜL: Mavi çizgi (SAĞ) - b4'ten başlayıp a2-b2'ye paralel, a1-c1 hattına kadar

        // a2-b2 yönünü hesapla

        const a2b2_vector = {

            x: b2_projection.x - a2_projection.x,

            y: b2_projection.y - a2_projection.y

        };



        // a1 izdüşümünü al

        const a1_projection = new THREE.Vector3(points['Y-a1'].x, points['Y-a1'].y, 0);

        

        // b4'ten a2-b2 yönünde uzanan çizgi ile a1-c1 hattının kesişimini bul

        const intersection = this.lineIntersection(

            {x: b4_projection.x, y: b4_projection.y},

            {x: b4_projection.x + a2b2_vector.x * 100, y: b4_projection.y + a2b2_vector.y * 100},

            {x: a1_projection.x, y: a1_projection.y},

            {x: c1_projection.x, y: c1_projection.y}

        );

        

        // Mavi çizgi (SAĞ): b4'ten kesişim noktasına

        const offsetA2 = new THREE.Vector3(b4_projection.x, b4_projection.y, 0);

        const offsetB2 = intersection ? 

            new THREE.Vector3(intersection.x, intersection.y, 0) : 

            new THREE.Vector3(b4_projection.x + a2b2_vector.x, b4_projection.y + a2b2_vector.y, 0);

        

        const offsetLinePoints = [offsetA2, offsetB2];

        const offsetLineGeometry = new THREE.BufferGeometry().setFromPoints(offsetLinePoints);

        const offsetLineMaterial = new THREE.LineBasicMaterial({ 

            color: 0x0000ff,  // Mavi

            linewidth: 3,

            transparent: true,

            opacity: 0.9

        });

        const offsetLine = new THREE.Line(offsetLineGeometry, offsetLineMaterial);

        this.scene.add(offsetLine);

        this.debugLines.push(offsetLine);

        

        // 🆕 PÜSKÜL: Mavi çizgi (SOL) - d4'ten başlayıp a2-d2'ye paralel, a1-c1 hattına kadar

        // a2-d2 yönünü hesapla

        const a2d2_vector = {

            x: d2_projection.x - a2_projection.x,

            y: d2_projection.y - a2_projection.y

        };

        

        // d4'ten a2-d2 yönünde uzanan çizgi ile a1-c1 hattının kesişimini bul

        const intersectionLeft = this.lineIntersection(

            {x: d4_projection.x, y: d4_projection.y},

            {x: d4_projection.x + a2d2_vector.x * 100, y: d4_projection.y + a2d2_vector.y * 100},

            {x: a1_projection.x, y: a1_projection.y},

            {x: c1_projection.x, y: c1_projection.y}

        );

        

        // Mavi çizgi (SOL): d4'ten kesişim noktasına

        const offsetA2Left = new THREE.Vector3(d4_projection.x, d4_projection.y, 0);

        const offsetB2Left = intersectionLeft ? 

            new THREE.Vector3(intersectionLeft.x, intersectionLeft.y, 0) : 

            new THREE.Vector3(d4_projection.x + a2d2_vector.x, d4_projection.y + a2d2_vector.y, 0);

        

        const offsetLinePointsLeft = [offsetA2Left, offsetB2Left];

        const offsetLineGeometryLeft = new THREE.BufferGeometry().setFromPoints(offsetLinePointsLeft);

        const offsetLineMaterialLeft = new THREE.LineBasicMaterial({ 

            color: 0x0000ff,  // Mavi

            linewidth: 3,

            transparent: true,

            opacity: 0.9

        });

        const offsetLineLeft = new THREE.Line(offsetLineGeometryLeft, offsetLineMaterialLeft);

        this.scene.add(offsetLineLeft);

        this.debugLines.push(offsetLineLeft);

        

        console.log('\n🟢 ========== DEBUG ÇİZGİLER (PÜSKÜL) ==========');

        console.log('🔵 Mavi çizgi (SAĞ): b4\'ten başlayıp a2-b2\'ye paralel, a1-c1 hattına kadar');

        console.log('🔵 a2-b2 yön vektörü:', a2b2_vector.x.toFixed(2), a2b2_vector.y.toFixed(2));

        console.log('🔵 Başlangıç (b4):', b4_projection.x.toFixed(2), b4_projection.y.toFixed(2));

        if (intersection) {

            console.log('🔵 Bitiş (a1-c1 kesişimi):', intersection.x.toFixed(2), intersection.y.toFixed(2));

            const blueLength = Math.sqrt((intersection.x - b4_projection.x) ** 2 + (intersection.y - b4_projection.y) ** 2);

            console.log('🔵 Mavi çizgi (SAĞ) uzunluğu:', blueLength.toFixed(2), 'birim');

        }

        // SOL mavi çizgi isteğe bağlı olarak kaldırıldı

        console.log('🟢 Y-d4 izdüşümü:', d4_projection.x.toFixed(2), d4_projection.y.toFixed(2));

        console.log('🟢 Y-b4 izdüşümü:', b4_projection.x.toFixed(2), b4_projection.y.toFixed(2));

        console.log('🟢 Y-a2 izdüşümü:', a2_projection.x.toFixed(2), a2_projection.y.toFixed(2));

        console.log('🟢 Y-a3 izdüşümü:', a3_projection.x.toFixed(2), a3_projection.y.toFixed(2));

        console.log('🟢 Çizgiler Z=0 düzleminde görüntüleniyor.\n');



        

        // 🧮 MATEMATİKSEL DOĞRULAMA

        this.verifySlavePointsOnPolyline(points);

        */

    }

    

    /**

     * 🧮 Slave noktaların master polyline üzerinde olup olmadığını matematiksel olarak doğrula

     * (Şimdilik devre dışı)

     */

    verifySlavePointsOnPolyline(points) {

        return;

        /*

        console.log('\n🧮 ========== MATEMATİKSEL DOĞRULAMA ==========');

        

        // Her slave nokta için, hangi master segment'e ait olduğunu ve uzaklığını hesapla

        const slavePoints = [

            { name: 'Y-a2', point: points['Y-a2'], masterStart: 'Y-a1', masterEnd: 'Y-b1' },

            { name: 'Y-b2', point: points['Y-b2'], masterStart: 'Y-b1', masterEnd: 'Y-c1' },

            { name: 'Y-d2', point: points['Y-d2'], masterStart: 'Y-d1', masterEnd: 'Y-a1' }

        ];

        

        slavePoints.forEach(slave => {

            const slavePos = { x: slave.point.x, y: slave.point.y };

            const startPos = { x: points[slave.masterStart].x, y: points[slave.masterStart].y };

            const endPos = { x: points[slave.masterEnd].x, y: points[slave.masterEnd].y };

            

            // Nokta-Segment arası en kısa mesafe

            const distance = this.pointToSegmentDistance(slavePos, startPos, endPos);

            

            // Segment üzerindeki en yakın noktayı bul

            const closestPoint = this.closestPointOnSegment(slavePos, startPos, endPos);

            

            // Slave noktanın segment üzerinde olup olmadığını kontrol et

            const isOnSegment = distance < 0.01; // 0.01 birim tolerans

            

            console.log(`\n📍 ${slave.name}:`);

            console.log(`  Koordinat: (${slavePos.x.toFixed(3)}, ${slavePos.y.toFixed(3)})`);

            console.log(`  Test Segment: ${slave.masterStart} → ${slave.masterEnd}`);

            console.log(`  Segment'e uzaklık: ${distance.toFixed(3)} birim`);

            console.log(`  Segment üzerindeki en yakın nokta: (${closestPoint.x.toFixed(3)}, ${closestPoint.y.toFixed(3)})`);

            console.log(`  Segment üzerinde mi?: ${isOnSegment ? '✅ EVET' : '❌ HAYIR'}`);

            

            // Paralel mi kontrol et (vektör yönü)

            const segmentVector = { x: endPos.x - startPos.x, y: endPos.y - startPos.y };

            const toSlaveVector = { x: slavePos.x - startPos.x, y: slavePos.y - startPos.y };

            

            // İç çarpım (dot product) ile açı kontrolü

            const dotProduct = segmentVector.x * toSlaveVector.x + segmentVector.y * toSlaveVector.y;

            const segmentLength = Math.sqrt(segmentVector.x ** 2 + segmentVector.y ** 2);

            const toSlaveLength = Math.sqrt(toSlaveVector.x ** 2 + toSlaveVector.y ** 2);

            const cosAngle = dotProduct / (segmentLength * toSlaveLength);

            const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);

            

            console.log(`  Segment ile açısı: ${angle.toFixed(2)}° ${angle < 5 ? '✅ Paralel!' : '⚠️ Açılı'}`);

        });

        

        // 🎯 ÖNEMLİ SONUÇ

        console.log('\n🎯 ========== SONUÇ ==========');

        console.log('Formül Analizi:');

        console.log('  a2 = a1 + (c1 - a1) × 0.09');

        console.log('  b2 = b1 + (c1 - b1) × 0.09');

        console.log('  d2 = d1 + (c1 - d1) × 0.09');

        console.log('');

        console.log('Bu formül, her slave noktayı kendi master noktasından');

        console.log('C1 noktasına doğru %9 oranında hareket ettirir.');

        console.log('');

        console.log('❓ Slave noktalar master polyline üzerinde mi?');

        console.log('   → HAYIR, master polyline üzerinde DEĞİLLER.');

        console.log('   → Master polyline\'ın İÇİNDE ama segment üzerinde değiller.');

        console.log('');

        console.log('✅ Bu geometrik olarak DOĞRU mu?');

        console.log('   → EVET, eğer hücre c1\'e doğru daralan bir koni ise.');

        console.log('   → Slave noktalar da aynı şekilde c1\'e doğru daralmalı.');

        console.log('');

        console.log('📐 Alternatif formül (eğer parallel offset istiyorsanız):');

        console.log('   Her slave nokta, kendi segment\'inin MERKEZİNE doğru');

        console.log('   dik olarak içeri çekilmeli (inset/offset).');

        console.log('========================================\n');

        */

    }

    

    /**

     * İki çizginin kesişim noktasını hesapla

     * Line 1: p1 -> p2

     * Line 2: p3 -> p4

     */

    lineIntersection(p1, p2, p3, p4) {

        const x1 = p1.x, y1 = p1.y;

        const x2 = p2.x, y2 = p2.y;

        const x3 = p3.x, y3 = p3.y;

        const x4 = p4.x, y4 = p4.y;

        

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        

        if (Math.abs(denom) < 0.0001) {

            return null; // Paralel çizgiler

        }

        

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

        

            return {

            x: x1 + t * (x2 - x1),

            y: y1 + t * (y2 - y1)

        };

    }

    

    /**

     * Nokta ile segment arasındaki en kısa mesafeyi hesapla

     */

    pointToSegmentDistance(point, segStart, segEnd) {

        const A = point.x - segStart.x;

        const B = point.y - segStart.y;

        const C = segEnd.x - segStart.x;

        const D = segEnd.y - segStart.y;



        const dot = A * C + B * D;

        const lenSq = C * C + D * D;

        let param = -1;



        if (lenSq !== 0) param = dot / lenSq;



        let xx, yy;



        if (param < 0) {

            xx = segStart.x;

            yy = segStart.y;

        } else if (param > 1) {

            xx = segEnd.x;

            yy = segEnd.y;

        } else {

            xx = segStart.x + param * C;

            yy = segStart.y + param * D;

        }



        const dx = point.x - xx;

        const dy = point.y - yy;



        return Math.sqrt(dx * dx + dy * dy);

    }



    /**

     * Segment üzerindeki en yakın noktayı bul

     */

    closestPointOnSegment(point, segStart, segEnd) {

        const A = point.x - segStart.x;

        const B = point.y - segStart.y;

        const C = segEnd.x - segStart.x;

        const D = segEnd.y - segStart.y;



        const dot = A * C + B * D;

        const lenSq = C * C + D * D;

        let param = -1;



        if (lenSq !== 0) param = dot / lenSq;



        if (param < 0) {

            return { x: segStart.x, y: segStart.y };

        } else if (param > 1) {

            return { x: segEnd.x, y: segEnd.y };

        } else {

            return {

                x: segStart.x + param * C,

                y: segStart.y + param * D

            };

        }

    }



    createTextLabel(text, x, y, z, color = '#00ff00') {

        // Create canvas for text

        const canvas = document.createElement('canvas');

        const context = canvas.getContext('2d');

        canvas.width = 256;

        canvas.height = 64;



        // Draw text on canvas

        context.fillStyle = '#000000';

        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = 'Bold 24px Arial';

        context.fillStyle = color;  // Parametreden gelen renk

        context.textAlign = 'center';

        context.textBaseline = 'middle';

        context.fillText(text, canvas.width / 2, canvas.height / 2);



        // Create texture from canvas

        const texture = new THREE.Texture(canvas);

        texture.needsUpdate = true;



        // Create sprite material

        const spriteMaterial = new THREE.SpriteMaterial({ 

            map: texture,

            transparent: true,

            opacity: 0.9

        });



        // Create sprite

        const sprite = new THREE.Sprite(spriteMaterial);

        sprite.position.set(x, y, z + 5);  // Z-up: offset yukarı Z ekseninde

        sprite.scale.set(20, 5, 1);  // Scale the sprite



        return sprite;

    }



    updateGeometry() {

        // 🎀 Püskül geometri güncellemesi (H değiştiğinde)

        console.log('🔄 Updating geometry with H:', this.H);



        // Aktif katmanın geometrisinde H'yi güncelle

        this.puskulGeometry.H = this.H;



        // Aktif katmanın layer objesinde H'yi güncelle

        const activeLayer = this.layers[this.currentLayer];

        if (activeLayer && activeLayer.geometry) {

            activeLayer.geometry.H = this.H;

        }



        // 🔄 Child layer'ların H değerlerini de güncelle

        for (const layerNum in this.layers) {

            const layer = this.layers[layerNum];

            if (layer && layer.geometry && layer.geometry !== this.puskulGeometry) {

                layer.geometry.H = this.H;

                console.log(`🔄 Layer ${layerNum} H güncellendi: ${this.H}`);

            }

        }



        // 🆕 YENİ SİSTEM: H değiştiğinde hücreleri yeniden yükle

        // reloadCellsWithRules() child layer'ları da yeniden yükler

        if (window.cellLoader) {

            this.reloadCellsWithRules();

        }

    }



    setupEventListeners() {

        // 🎀 PÜSKÜL TASARIM PARAMETRELERİ

        const debounce = (fn, delay = 50) => {  // 120ms → 50ms (daha akışkan)

            let t;

            return (...args) => {

                clearTimeout(t);

                t = setTimeout(() => fn.apply(this, args), delay);

            };

        };

        const updateSummary = () => {

            const depth = Math.max(0, this.outerRadius - this.innerRadius);

            const depthSpan = document.getElementById('depth-value');

            if (depthSpan) depthSpan.textContent = depth.toFixed(0);

            const total = this.puskulGeometry?.totalCells || (this.puskulSides * (this.cellMultiplier === 3 ? 4 : this.cellMultiplier));

            let main = 0, inter = 0;

            if (this.puskulGeometry?.cellTypeMapping) {

                Object.values(this.puskulGeometry.cellTypeMapping).forEach(t => {

                    if (t === this.mainCellType) main++; else inter++;

                });

            } else {

                // Yaklaşık dağılım

                if (this.cellMultiplier === 1) { main = this.puskulSides; inter = 0; }

                else if (this.cellMultiplier === 2) { main = this.puskulSides; inter = this.puskulSides; }

                else { main = this.puskulSides * 2; inter = this.puskulSides * 2; }

            }

            const cellsSummary = document.getElementById('cells-summary');

            if (cellsSummary) cellsSummary.textContent = `${total} (${main} ana + ${inter} ara)`;

        };

        const enforceMinGap = () => {

            // ⚠️ TÜM KATMANLAR için minimum gap kontrolü yap

            const minGap = 10;

            const warn = document.getElementById('radius-warning');

            if (this.innerRadius >= this.outerRadius - minGap) {

                this.innerRadius = this.outerRadius - minGap;

                // 🏗️ Aktif katmanın layer objesini de güncelle

                const activeLayer = this.layers[this.currentLayer];

                if (activeLayer) {

                    activeLayer.innerRadius = this.innerRadius;

                    console.log(`⚠️ enforceMinGap: Katman ${this.currentLayer} innerRadius düzeltildi: ${this.innerRadius}`);

                }

                const innerSlider = document.getElementById('inner-radius-slider');

                const innerLabel = document.getElementById('inner-radius-label');

                if (innerSlider) innerSlider.value = this.innerRadius;

                if (innerLabel) innerLabel.textContent = this.innerRadius;

                if (warn) warn.style.display = 'block';

            } else if (warn) {

                warn.style.display = 'none';

            }

        };

        const maybeAutoSnapUI = () => {

            const hasInter = !(this.interCellType === 'YOK' || this.interCellType === 'NONE');

            const snapSlider = document.getElementById('snap-threshold-slider');

            const narrowSlider = document.getElementById('badem-narrow-factor-slider');

            const narrowNote = document.getElementById('badem-narrow-note');



            if (hasInter) {

                // Ara hücre VARSA: Snap otomatik tam, Daralma pasif

                if (snapSlider) { snapSlider.disabled = true; }

                if (narrowSlider) {

                    narrowSlider.value = 1.0; // Otomatik 1.0 yap (yapışık)

                    narrowSlider.disabled = true;

                }

                if (narrowNote) narrowNote.style.display = 'block';

                this.bademNarrowFactor = 1.0; // Değeri de güncelle

                document.getElementById('badem-narrow-factor-label').textContent = '1.00';

                document.getElementById('badem-narrow-percentage').textContent = '100';

                document.getElementById('badem-gap-percentage').textContent = '0';

                this.showSnapConnections = false;

                this.createSnapConnections(); // Gizle

            } else {

                // Ara hücre YOKSA: Snap ayarlanabilir, Daralma aktif

                if (snapSlider) { snapSlider.disabled = false; }

                if (narrowSlider) { narrowSlider.disabled = false; }

                if (narrowNote) narrowNote.style.display = 'none';

                this.showSnapConnections = true;

                this.createSnapConnections(); // Göster

            }

        };



        // Katman görünürlüğü toggle

        const layerVisibilityToggle = document.getElementById('layer-visibility-toggle');

        if (layerVisibilityToggle) {

            layerVisibilityToggle.addEventListener('change', (e) => {

                const isVisible = e.target.checked;

                this.toggleLayerVisibility(this.currentLayer, isVisible);

                console.log(`👁️ Aktif katman görünürlüğü değiştirildi: Katman ${this.currentLayer} -> ${isVisible ? 'göster' : 'gizle'}`);

            });

        }

        

        // Gen sayısı slider

        const sidesSlider = document.getElementById('sides-slider');

        if (sidesSlider) {

            sidesSlider.addEventListener('input', debounce((e) => {

                this.puskulSides = parseInt(e.target.value);

                document.getElementById('sides-label').textContent = this.puskulSides;

                const sidesValueEl = document.getElementById('sides-value');
                if (sidesValueEl) sidesValueEl.textContent = this.puskulSides;

                const totalCellsEl3 = document.getElementById('total-cells');
                if (totalCellsEl3) totalCellsEl3.textContent = this.puskulSides * 2; // legacy



                // Cascade kural: Katman 1'in sides değişirse tüm alt katmanların sides'ı değişir

                if (this.currentLayer === 1) {

                    for (let layerNum = 2; layerNum <= this.maxLayers; layerNum++) {

                        const childLayer = this.layers[layerNum];

                        if (childLayer) {

                            const oldSides = childLayer.sides;

                            childLayer.sides = this.puskulSides;



                            // ⚠️ KURAL: innerRadius ASLA outerRadius'tan büyük olamaz

                            const minGap = 10;

                            if (childLayer.innerRadius >= childLayer.outerRadius - minGap) {

                                childLayer.innerRadius = Math.max(childLayer.outerRadius - minGap, minGap);

                                console.warn(`  ⚠️ Katman ${layerNum} innerRadius düzeltildi: ${childLayer.innerRadius} (outer=${childLayer.outerRadius})`);

                            }



                            console.log(`🔗 Kaskad: Katman ${layerNum} ngon sayısı güncellendi: ${oldSides} → ${this.puskulSides}, inner=${childLayer.innerRadius}`);



                            // Geometrisi varsa güncelle

                            if (childLayer.geometry) {

                                childLayer.geometry.sides = this.puskulSides;

                                childLayer.geometry.innerRadius = childLayer.innerRadius; // Düzeltilmiş innerRadius'u uygula

                                childLayer.geometry.totalCells = childLayer.geometry.calculateTotalCells();

                                childLayer.geometry.cellPositions = childLayer.geometry.calculateCellPositions();

                                console.log(`  🔄 Katman ${layerNum} geometry güncellendi (totalCells=${childLayer.geometry.totalCells})`);

                            }

                        }

                    }

                }



                enforceMinGap();

                this.updatePuskulDesign();

                updateSummary();

            }));

        }



        // Yerleşim tipi (köşe/kenar)

        const placementRadios = document.querySelectorAll('input[name="placement"]');

        placementRadios.forEach(radio => {

            radio.addEventListener('change', (e) => {

                this.puskulPlacement = e.target.value;

                const placementText = e.target.value === 'corner' ? 'Köşe' : 'Kenar';

                const placementValueEl = document.getElementById('placement-value');
                if (placementValueEl) placementValueEl.textContent = placementText;

                // Yerleşim değiştiğinde hücre parametrelerini güncelle
                const isEdge = e.target.value === 'edge';

                // Fitil (ara hücre) parametreleri
                const fitilRatio1 = isEdge ? 0.035 : 0.12;
                const fitilRatio2 = isEdge ? 0.1 : 0.2;

                // Badem (ana hücre) parametreleri
                const bademRatio1 = isEdge ? 0.09 : 0.09;
                const bademRatio2 = isEdge ? 0.2 : 0.096;
                const bademRatio3 = 0.35; // Her iki durumda da aynı

                const layer = this.layers[this.currentLayer];
                if (layer && layer.geometry) {
                    const totalCells = layer.geometry.totalCells;

                    // Yerleşime göre hangi numaralar ana/ara hücre olduğunu belirle
                    // Köşe: Ana=tek, Ara=çift
                    // Kenar: Ana=çift, Ara=tek
                    const anaStart = isEdge ? 2 : 1;
                    const araStart = isEdge ? 1 : 2;

                    // Ara hücreleri (FITIL) güncelle
                    for (let i = araStart; i <= totalCells; i += 2) {
                        const cellName = `cell${i}`;
                        if (!this.cellCustomParams[cellName]) {
                            this.cellCustomParams[cellName] = {};
                        }
                        this.cellCustomParams[cellName].ratio1 = fitilRatio1;
                        this.cellCustomParams[cellName].ratio2 = fitilRatio2;
                    }

                    // Ana hücreleri (BADEM) güncelle
                    for (let i = anaStart; i <= totalCells; i += 2) {
                        const cellName = `cell${i}`;
                        if (!this.cellCustomParams[cellName]) {
                            this.cellCustomParams[cellName] = {};
                        }
                        this.cellCustomParams[cellName].ratio1 = bademRatio1;
                        this.cellCustomParams[cellName].ratio2 = bademRatio2;
                        this.cellCustomParams[cellName].ratio3 = bademRatio3;
                    }

                    console.log(`📐 Yerleşim değişti (${placementText}):`);
                    console.log(`  Ana hücreler: ${isEdge ? 'çift numaralar' : 'tek numaralar'}`);
                    console.log(`  Ara hücreler: ${isEdge ? 'tek numaralar' : 'çift numaralar'}`);
                    console.log(`  Fitil: ratio1=${fitilRatio1}, ratio2=${fitilRatio2}`);
                    console.log(`  Badem: ratio1=${bademRatio1}, ratio2=${bademRatio2}, ratio3=${bademRatio3}`);
                }

                // Eğer hücre düzenle paneli açıksa, paneli güncelle
                if (this.cellEditor && this.cellEditor.selectedCellName) {
                    const selectedCell = layer.geometry.cells[this.cellEditor.selectedCellName];
                    if (selectedCell) {
                        this.cellEditor.showEditPanel(this.cellEditor.selectedCellName, this.cellEditor.selectedCellGroup);
                    }
                }

                enforceMinGap();

                this.updatePuskulDesign();

            });

        });



        // 🆕 Ana Hücre Tipi

        const mainCellTypeSelect = document.getElementById('main-cell-type');

        if (mainCellTypeSelect) {

            mainCellTypeSelect.addEventListener('change', (e) => {

                this.mainCellType = e.target.value;

                console.log(`🎯 Ana hücre tipi değişti: ${this.mainCellType}`);



                // 🔗 Aktif layer'ın mainCellType'ını da güncelle

                const currentLayerData = this.layers[this.currentLayer];

                if (currentLayerData) {

                    currentLayerData.mainCellType = this.mainCellType;

                    console.log(`   Layer ${this.currentLayer}.mainCellType güncellendi`);

                }



                enforceMinGap();

                this.updatePuskulDesign();

                updateSummary();

            });

        }



        // 🆕 Ara Hücre Tipi

        const interCellTypeSelect = document.getElementById('inter-cell-type');

        if (interCellTypeSelect) {

            interCellTypeSelect.addEventListener('change', (e) => {

                this.interCellType = e.target.value;

                console.log(`🎯 Ara hücre tipi değişti: ${this.interCellType}`);

                

                // 🆕 Ara hücre YOK ise multiplier'ı 1 yap

                if (this.interCellType === 'YOK' || this.interCellType === 'NONE') {

                    this.cellMultiplier = 1;

                    const multiplierSlider = document.getElementById('multiplier-slider');

                    if (multiplierSlider) {

                        multiplierSlider.value = 1;

                        multiplierSlider.disabled = true; // Devre dışı

                    }

                    document.getElementById('multiplier-label').textContent = 1;

                } else {

                    // Ara hücre varsa multiplier'ı aktif et ve en az 2 yap

                    if (this.cellMultiplier === 1) {

                        this.cellMultiplier = 2; // 🔴 Ara hücre seçilince en az 2 olmalı

                    }

                    const multiplierSlider = document.getElementById('multiplier-slider');

                    if (multiplierSlider) {

                        multiplierSlider.disabled = false;

                        multiplierSlider.value = this.cellMultiplier;

                    }

                    document.getElementById('multiplier-label').textContent = this.cellMultiplier;

                }



                // 🔗 Aktif layer'ın interCellType'ını da güncelle

                const currentLayerData = this.layers[this.currentLayer];

                if (currentLayerData) {

                    currentLayerData.interCellType = this.interCellType;

                    console.log(`   Layer ${this.currentLayer}.interCellType güncellendi`);

                }



                enforceMinGap();

                this.updatePuskulDesign();

                maybeAutoSnapUI();

                updateSummary();

            });

        }



        // 🆕 Hücre Çeşitliliği (Multiplier) slider

        const multiplierSlider = document.getElementById('multiplier-slider');

        if (multiplierSlider) {

            multiplierSlider.addEventListener('input', debounce((e) => {

                this.cellMultiplier = parseInt(e.target.value);

                document.getElementById('multiplier-label').textContent = this.cellMultiplier;

                console.log(`🔢 Cell multiplier değişti: ${this.cellMultiplier}`);

                

                // 🆕 multiplier=1 seçilince ara hücre dropdown'ını "YOK" yap

                if (this.cellMultiplier === 1) {

                    this.interCellType = 'YOK';

                    const interSelect = document.getElementById('inter-cell-type');

                    if (interSelect) {

                        interSelect.value = 'YOK';

                        interSelect.disabled = true; // Devre dışı

                    }

                } else {

                    // multiplier > 1 ise ara hücre aktif

                    const interSelect = document.getElementById('inter-cell-type');

                    if (interSelect) {

                        interSelect.disabled = false;

                        // Eğer YOK seçiliyse, FITIL'e çevir

                        if (this.interCellType === 'YOK' || this.interCellType === 'NONE') {

                            this.interCellType = 'FITIL';

                            interSelect.value = 'FITIL';

                        }

                    }

                }



                // 🏗️ Aktif katmanın layer objesini de güncelle

                const currentLayerObj = this.layers[this.currentLayer];

                if (currentLayerObj) {

                    currentLayerObj.cellMultiplier = this.cellMultiplier;

                }



                enforceMinGap();

                this.updatePuskulDesign();

                maybeAutoSnapUI();

                updateSummary();

            }));

        }



        // 🆕 Dış Ngon (outerRadius) slider

        const outerRadiusSlider = document.getElementById('outer-radius-slider');

        if (outerRadiusSlider) {

            outerRadiusSlider.addEventListener('input', debounce((e) => {

                this.outerRadius = parseInt(e.target.value);

                document.getElementById('outer-radius-label').textContent = this.outerRadius;



                // 🏗️ Aktif katmanın layer objesini güncelle

                const currentLayerObj = this.layers[this.currentLayer];

                if (currentLayerObj) {

                    currentLayerObj.outerRadius = this.outerRadius;

                    console.log(`🔄 Katman ${this.currentLayer} outerRadius güncellendi: ${this.outerRadius}`);

                }



                enforceMinGap();



                // 🔗 Kaskad: enforceMinGap() innerRadius'u değiştirdiyse, child layer'ların outerRadius'larını güncelle

                for (let layerNum = this.currentLayer + 1; layerNum <= this.maxLayers; layerNum++) {

                    const childLayer = this.layers[layerNum];

                    if (!childLayer) continue;



                    // Her alt katmanın outerRadius'u, bir üst katmanın innerRadius'una eşittir

                    const parentLayer = this.layers[layerNum - 1];

                    if (parentLayer) {

                        const oldOuterRadius = childLayer.outerRadius;

                        childLayer.outerRadius = parentLayer.innerRadius;



                        // ⚠️ KURAL: innerRadius ASLA outerRadius'tan büyük olamaz

                        const minGap = 10;

                        if (childLayer.innerRadius >= childLayer.outerRadius - minGap) {

                            childLayer.innerRadius = Math.max(childLayer.outerRadius - minGap, minGap);

                            console.warn(`  ⚠️ Katman ${layerNum} innerRadius düzeltildi: ${childLayer.innerRadius} (outer=${childLayer.outerRadius})`);

                        }



                        console.log(`🔗 Kaskad: Katman ${layerNum} outerRadius güncellendi: ${oldOuterRadius} → ${parentLayer.innerRadius}, inner=${childLayer.innerRadius}`);



                        // Geometrisi varsa güncelle

                        if (childLayer.geometry) {

                            childLayer.geometry.outerRadius = childLayer.outerRadius;

                            childLayer.geometry.innerRadius = childLayer.innerRadius;

                        }

                    }

                }



                this.updatePuskulDesign();

                updateSummary();

            }));

        }

        

        // 🆕 İç Ngon (innerRadius) slider

        const innerRadiusSlider = document.getElementById('inner-radius-slider');

        if (innerRadiusSlider) {

            innerRadiusSlider.addEventListener('input', debounce((e) => {

                this.innerRadius = parseInt(e.target.value);

                document.getElementById('inner-radius-label').textContent = this.innerRadius;



                // 🏗️ Aktif katmanın layer objesini güncelle

                const currentLayerObj = this.layers[this.currentLayer];

                if (currentLayerObj) {

                    currentLayerObj.innerRadius = this.innerRadius;

                    console.log(`🔄 Katman ${this.currentLayer} innerRadius güncellendi: ${this.innerRadius}`);

                }



                // 🔗 Kaskad: Aktif katmandan sonraki tüm alt katmanların outerRadius'larını güncelle

                for (let layerNum = this.currentLayer + 1; layerNum <= this.maxLayers; layerNum++) {

                    const childLayer = this.layers[layerNum];

                    if (!childLayer) continue;



                    // Her alt katmanın outerRadius'u, bir üst katmanın innerRadius'una eşittir

                    const parentLayer = this.layers[layerNum - 1];

                    if (parentLayer) {

                        const oldOuterRadius = childLayer.outerRadius;

                        childLayer.outerRadius = parentLayer.innerRadius;



                        // ⚠️ KURAL: innerRadius ASLA outerRadius'tan büyük olamaz

                        const minGap = 10; // Minimum boşluk

                        if (childLayer.innerRadius >= childLayer.outerRadius - minGap) {

                            childLayer.innerRadius = Math.max(childLayer.outerRadius - minGap, minGap);

                            console.warn(`  ⚠️ Katman ${layerNum} innerRadius düzeltildi: ${childLayer.innerRadius} (outer=${childLayer.outerRadius})`);

                        }



                        console.log(`🔗 Kaskad: Katman ${layerNum} outerRadius güncellendi: ${oldOuterRadius} → ${parentLayer.innerRadius}, inner=${childLayer.innerRadius}`);



                        // Geometrisi varsa güncelle

                        if (childLayer.geometry) {

                            childLayer.geometry.outerRadius = childLayer.outerRadius;

                            childLayer.geometry.innerRadius = childLayer.innerRadius;

                        }

                    }

                }



                enforceMinGap();

                this.updatePuskulDesign();

                updateSummary();



                // NOT: realignAllChildLayers() artık updateGeometryAfterCellLoad() içinde çağrılıyor

            }));

        }

        

        // DEPRECATED: Eski radius slider (geriye uyumluluk)

        const radiusSlider = document.getElementById('radius-slider');

        if (radiusSlider) {

            radiusSlider.addEventListener('input', (e) => {

                this.puskulRadius = parseInt(e.target.value);

                document.getElementById('radius-label').textContent = this.puskulRadius;

                this.updatePuskulDesign();

            });

        }

        

        // DEPRECATED: Hücre boyutu slider (kaldırıldı - artık depth otomatik)

        // DEPRECATED: Module slider (kaldırıldı - artık depth = outerRadius - innerRadius)



        // Height slider

        const heightSlider = document.getElementById('height-slider');

        if (heightSlider) {

            heightSlider.addEventListener('input', debounce((e) => {

                this.H = parseInt(e.target.value);

                document.getElementById('h-label').textContent = this.H;

                enforceMinGap();

                this.updateGeometry();

                updateSummary();

            }));

        }



        // Başlangıç UI sync

        enforceMinGap();

        maybeAutoSnapUI();

        updateSummary();

        

        // Wireframe toggle (alt orta buton)

        const wireframeBtn = document.getElementById('show-wireframe');

        if (wireframeBtn) {

            // Başlangıç stili

            wireframeBtn.classList.toggle('active', this.showWireframe);

            

            wireframeBtn.addEventListener('click', () => {

                this.showWireframe = !this.showWireframe;

                // Tüm katmanların wireframe'lerini güncelle

                Object.keys(this.layers).forEach(layerNum => {

                    const layer = this.layers[layerNum];

                    if (layer && layer.wireframeMesh) {

                        layer.wireframeMesh.visible = this.showWireframe;

                    }

                });

                // Geriye uyumluluk için global wireframeMesh'i de güncelle

                if (this.wireframeMesh) {

                    this.wireframeMesh.visible = this.showWireframe;

                }

                // Püskül Sonu wireframe'ini güncelle
                if (this.puskulSonu && this.puskulSonu.wireframeMesh) {
                    this.puskulSonu.wireframeMesh.visible = this.showWireframe;
                }

                // Buton stilini güncelle

                wireframeBtn.classList.toggle('active', this.showWireframe);

                console.log('📐 Wireframe:', this.showWireframe ? 'Açık' : 'Kapalı');

            });

        }

        

        // Grid toggle (alt orta buton)

        const gridBtn = document.getElementById('toggle-grid');

        if (gridBtn) {

            // Başlangıç stili

            gridBtn.classList.toggle('active', this.showGrid);

            

            gridBtn.addEventListener('click', () => {

                this.showGrid = !this.showGrid;

                this.gridHelper.visible = this.showGrid;

                // Buton stilini güncelle

                gridBtn.classList.toggle('active', this.showGrid);

                console.log('🌐 Grid:', this.showGrid ? 'Açık' : 'Kapalı');

            });

        }

        

        // PIP toggle (alt orta buton)

        const pipBtn = document.getElementById('toggle-pip');

        if (pipBtn) {

            // Başlangıç stili

            pipBtn.classList.toggle('active', this.showPip);

            

            pipBtn.addEventListener('click', () => {

                this.showPip = !this.showPip;

                const pipContainer = document.getElementById('pip-container');

                pipContainer.style.display = this.showPip ? 'block' : 'none';

                // Buton stilini güncelle

                pipBtn.classList.toggle('active', this.showPip);

                console.log('🖼️ PIP:', this.showPip ? 'Açık' : 'Kapalı');

            });

        }

        

        // Enable snap toggle (gerçek tutunma)

        // Snap threshold slider (kademeli snap gücü)

        const snapThresholdSlider = document.getElementById('snap-threshold-slider');

        if (snapThresholdSlider) {

            snapThresholdSlider.addEventListener('input', (e) => {

                this.snapThreshold = parseFloat(e.target.value);

                const percentage = (this.snapThreshold / 20 * 100).toFixed(0);

                document.getElementById('snap-threshold-label').textContent = this.snapThreshold;

                document.getElementById('snap-percentage').textContent = percentage;



                // 🏗️ Aktif katmanın layer objesini de güncelle

                const currentLayerObj = this.layers[this.currentLayer];

                if (currentLayerObj) {

                    currentLayerObj.snapThreshold = this.snapThreshold;

                }



                if (this.enableSnap) {

                    this.updatePuskulDesign();

                } else {

                    // Snap kapalı bile olsa görselleştirmeyi güncelle

                    this.createSnapConnections();

                }

            });

        }


        // 🟢 Badem radyal oran slider

        const bademRadialRatioSlider = document.getElementById('badem-radial-ratio-slider');

        if (bademRadialRatioSlider) {

            bademRadialRatioSlider.addEventListener('input', debounce((e) => {

                this.bademRadialRatio = parseFloat(e.target.value);

                const percentage = (this.bademRadialRatio * 100).toFixed(1);

                document.getElementById('badem-radial-ratio-label').textContent = this.bademRadialRatio.toFixed(3);

                document.getElementById('badem-radial-ratio-percentage').textContent = percentage;



                // 🏗️ Aktif katmanın layer objesini de güncelle

                const currentLayerObj = this.layers[this.currentLayer];

                if (currentLayerObj) {

                    currentLayerObj.bademRadialRatio = this.bademRadialRatio;

                }



                console.log(`🟢 Badem radyal oran değişti: ${percentage}%`);



                // Yeşil çemberi güncelle

                this.createBademRadialCircle();

                

                // Tüm badem hücrelerini yeni oran ile yeniden yükle

                if (window.cellLoader) {

                    window.cellLoader.reloadAllCells();

                }

            }));

        }


        // 🎚️ Badem daralma faktörü slider (b1/d1 boşluk)

        const bademNarrowFactorSlider = document.getElementById('badem-narrow-factor-slider');

        if (bademNarrowFactorSlider) {

            bademNarrowFactorSlider.addEventListener('input', debounce((e) => {

                this.bademNarrowFactor = parseFloat(e.target.value);

                const percentage = (this.bademNarrowFactor * 100).toFixed(0);

                const gapPercentage = ((1 - this.bademNarrowFactor) * 100).toFixed(0);

                document.getElementById('badem-narrow-factor-label').textContent = this.bademNarrowFactor.toFixed(2);

                document.getElementById('badem-narrow-percentage').textContent = percentage;

                document.getElementById('badem-gap-percentage').textContent = gapPercentage;



                // 🏗️ Aktif katmanın layer objesini de güncelle

                const currentLayerObj = this.layers[this.currentLayer];

                if (currentLayerObj) {

                    currentLayerObj.bademNarrowFactor = this.bademNarrowFactor;

                }



                console.log(`🎚️ Badem daralma faktörü değişti: ${percentage}% (boşluk: ${gapPercentage}%)`);



                // Tüm badem hücrelerini yeni faktör ile yeniden yükle

                if (window.cellLoader) {

                    window.cellLoader.reloadAllCells();

                }

            }));

        }

        // ⌨️ Sol panel sliderları: Klavyede sağ/sol ile 1 birim değişim (integer step'li)
        const leftPanelSliderIds = [
            'sides-slider',
            'outer-radius-slider',
            'inner-radius-slider',
            'multiplier-slider',
            'height-slider',
            'snap-threshold-slider',
            'badem-radial-ratio-slider',
            'badem-narrow-factor-slider',
            'transition-height-slider'
        ];

        leftPanelSliderIds.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;

            // Hover edildiğinde odak ver ki klavye okları çalışsın
            el.addEventListener('mouseenter', () => { try { el.focus(); } catch (e) {} });

            // Focus alınca: integer step'li sol panel sliderlarda step=1 yap (default klavye davranışı için)
            el.addEventListener('focusin', () => {
                const orig = isNaN(parseFloat(el.step)) ? 1 : parseFloat(el.step);
                if (orig >= 1) {
                    el.dataset.origStep = el.step || '1';
                    el.step = '1';
                }
            });

            // Blur olunca: orijinal step'i geri yükle
            el.addEventListener('focusout', () => {
                if (el.dataset && el.dataset.origStep !== undefined) {
                    el.step = el.dataset.origStep;
                    delete el.dataset.origStep;
                }
            });

            el.addEventListener('keydown', (e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                // Eğer focus sırasında step=1'e alınmışsa, tarayıcının default davranışını kullan
                // (Bu durumda burada hiçbir işlem yapma)
                const originalStep = isNaN(parseFloat(el.step)) ? 1 : parseFloat(el.step);
                if (originalStep === 1 && el.dataset && el.dataset.origStep !== undefined) {
                    return; // default davranış 1 birim artırıp/azaltsın
                }

                e.preventDefault();
                const useStep = (originalStep >= 1) ? 1 : originalStep; // integer step'lerde 1, fractional'da kendi step'i

                const min = isNaN(parseFloat(el.min)) ? -Infinity : parseFloat(el.min);
                const max = isNaN(parseFloat(el.max)) ? Infinity : parseFloat(el.max);
                const cur = isNaN(parseFloat(el.value)) ? 0 : parseFloat(el.value);

                let next = cur;
                if (e.key === 'ArrowRight') next = Math.min(max, cur + useStep);
                else next = Math.max(min, cur - useStep);

                // Geçici step override (tarayıcı kısıtını aşmak için)
                const restore = el.step;
                el.step = String(useStep);
                el.value = String(next);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.step = restore;
            });
        });


        // 🎨 Cell assignment mode (otomatik/manuel)

        const assignmentModeRadios = document.querySelectorAll('input[name="assignment-mode"]');

        assignmentModeRadios.forEach(radio => {

            radio.addEventListener('change', (e) => {

                const oldMode = this.cellAssignmentMode;

                this.cellAssignmentMode = e.target.value;

                const panel = document.getElementById('cell-assignment-panel');

                

                // Manuel mod değiştiğinde hover highlight'ı temizle

                this.clearManualHoverHighlight();

                

                if (e.target.value === 'manual') {

                    // MANUEL MODA GEÇİŞ

                    panel.style.display = 'block';

                    

                    // Backup'tan geri yükle (varsa)

                    if (this.manualModeBackup) {

                        console.log('🗂️ Manuel mod: Önceki seçimler geri yükleniyor...');

                        

                        // Overrides'ı geri yükle

                        this.manualCellTypeOverrides = { ...this.manualModeBackup.overrides };

                        

                        // Geometry mapping'i geri yükle

                        if (this.puskulGeometry?.cellTypeMapping) {

                            this.puskulGeometry.cellTypeMapping = { ...this.manualModeBackup.cellTypeMapping };

                        }

                        

                        // Custom parametreleri geri yükle (edit panelden değiştirilenleri)

                        this.cellCustomParams = this.manualModeBackup.customParams ? 

                            JSON.parse(JSON.stringify(this.manualModeBackup.customParams)) : {};

                        

                        // Hücreleri yeniden yükle (backup'taki tiplerle + parametrelerle)

                        this.reloadCellsWithRules();

                        

                        const customCount = Object.keys(this.cellCustomParams).length;

                        console.log(`✅ Manuel seçimler geri yüklendi (${customCount} hücre özel parametre)`);

                    }

                    

                    this.createCellAssignmentUI();

                } else {

                    // OTOMATİK MODA GEÇİŞ

                    panel.style.display = 'none';

                    

                    // Manuel mod seçimlerini backup'la

                    if (oldMode === 'manual') {

                        console.log('🗂️ Manuel seçimler yedekleniyor...');

                        

                        this.manualModeBackup = {

                            overrides: { ...this.manualCellTypeOverrides },

                            cellTypeMapping: this.puskulGeometry?.cellTypeMapping ? 

                                { ...this.puskulGeometry.cellTypeMapping } : {},

                            customParams: JSON.parse(JSON.stringify(this.cellCustomParams)) // Deep copy

                        };

                        

                        const customCount = Object.keys(this.cellCustomParams).length;

                        console.log(`✅ Manuel seçimler yedeklendi: ${Object.keys(this.manualModeBackup.overrides).length} override, ${customCount} custom params`);

                    }

                    

                    // Otomatik moda geç ve hücreleri yeniden yükle

                    this.reloadCellsWithRules();

                }

                

                console.log('🎨 Cell assignment mode:', e.target.value);

            });

        });



        // 🔧 Detay Paneli Event Listeners

        // CellEditor tarafından yönetiliyor (cell-editor.js)

        

        // 🖱️ Çift tıklama ile Zoom Extent (Canvas'ta boşluğa çift tık)

        this.renderer.domElement.addEventListener('dblclick', (e) => {

            // Raycasting - mesh'e çarptı mı kontrol et

            const rect = this.renderer.domElement.getBoundingClientRect();

            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;

            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            

            this.raycaster.setFromCamera(this.mouse, this.camera);

            const intersects = this.raycaster.intersectObject(this.puskulMesh);

            

            // Boşluğa çift tıklandıysa zoom extent

            if (intersects.length === 0) {

                this.zoomExtent();

            }

        });



        // Window resize

        window.addEventListener('resize', () => {

            const container = document.getElementById('canvas-container');

            this.camera.aspect = container.clientWidth / container.clientHeight;

            this.camera.updateProjectionMatrix();

            this.renderer.setSize(container.clientWidth, container.clientHeight);

        });



        // 🎯 MOUSE EVENTS - Master noktaları düzenlemek için

        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));

        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));

        this.renderer.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));

        

        // ⌨️ KLAVYE KONTROLLERI - Slider'lar için sağ/sol ok tuşları + ESC ile iptal

        document.addEventListener('keydown', (e) => {

            // ESC tuşu - Manuel-dropdown mod highlight'ı temizle

            if (e.key === 'Escape' || e.key === 'Esc') {

                if (this.cellAssignmentMode === 'manual' && this.manualModeShowDropdowns && this.hoveredCellName) {

                    this.clearManualHoverHighlight();

                    console.log('⌨️ ESC: Manuel hover temizlendi');

                    return;

                }

            }

            

            // Hedef slider'ı belirle: odaklı, hover'lı ya da en son kullanılan
            // Bir kereye mahsus son kullanılan slider'ı izlemek için dinleyiciler ekle
            if (!this._rangeTrackersAdded) {
                this._rangeTrackersAdded = true;
                document.addEventListener('focusin', (ev) => {
                    const t = ev.target;
                    if (t && t.tagName === 'INPUT' && t.type === 'range') {
                        this._lastRangeSlider = t;
                    }
                });
                document.addEventListener('pointerdown', (ev) => {
                    const t = ev.target;
                    if (t && t.tagName === 'INPUT' && t.type === 'range') {
                        this._lastRangeSlider = t;
                    }
                });
                document.addEventListener('mouseover', (ev) => {
                    const t = ev.target;
                    if (t && t.tagName === 'INPUT' && t.type === 'range') {
                        this._hoverRangeSlider = t;
                    }
                });
            }

            let targetEl = document.activeElement;
            if (!(targetEl && targetEl.tagName === 'INPUT' && targetEl.type === 'range')) {
                // Hover altındaki slider'ı dene
                const ranges = document.querySelectorAll('input[type="range"]');
                for (const r of ranges) {
                    if (r.matches(':hover')) { targetEl = r; break; }
                }
            }
            if (!(targetEl && targetEl.tagName === 'INPUT' && targetEl.type === 'range')) {
                // Son kullanılan slider'ı dene
                if (this._lastRangeSlider && document.contains(this._lastRangeSlider)) {
                    targetEl = this._lastRangeSlider;
                }
            }
            if (!(targetEl && targetEl.tagName === 'INPUT' && targetEl.type === 'range')) {
                return;
            }

            

            // Sağ/Sol ok tuşları

            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {

                const isLeftPanelSlider = typeof targetEl.id === 'string' && targetEl.id.endsWith('-slider');
                const originalStepForTarget = isNaN(parseFloat(targetEl.step)) ? 1 : parseFloat(targetEl.step);

                // Sol panel integer slider: focus sırasında step=1'e alındıysa default davranışı bırak
                if (isLeftPanelSlider && originalStepForTarget === 1 && targetEl.dataset && targetEl.dataset.origStep !== undefined) {
                    return;
                }

                e.preventDefault(); // Default davranışı engelle (manuel işlem yapacağız)

                // Orijinal step'i al
                const originalStep = isNaN(parseFloat(targetEl.step)) ? 1 : parseFloat(targetEl.step);

                // Sol paneldeki integer step'li sliderlar için klavyede 1 birimlik adım kullan
                // (fractional step'li sol panel sliderlarda mevcut step korunur)
                const useStep = (isLeftPanelSlider && originalStep >= 1) ? 1 : originalStep;

                // Tarayıcı step kısıtını aşmak için geçici olarak step'i useStep'e ayarla
                const restoreStepAfter = targetEl.step;
                targetEl.step = String(useStep);

                const currentValue = isNaN(parseFloat(targetEl.value)) ? 0 : parseFloat(targetEl.value);
                const min = isNaN(parseFloat(targetEl.min)) ? -Infinity : parseFloat(targetEl.min);
                const max = isNaN(parseFloat(targetEl.max)) ? Infinity : parseFloat(targetEl.max);

                let newValue = currentValue;
                if (e.key === 'ArrowRight') {
                    newValue = Math.min(max, currentValue + useStep);
                } else {
                    newValue = Math.max(min, currentValue - useStep);
                }

                // Slider değerini güncelle
                targetEl.value = String(newValue);

                // Input event tetikle (slider'ın kendi event listener'ı çalışsın)
                targetEl.dispatchEvent(new Event('input', { bubbles: true }));

                // Orijinal step'i geri yükle
                targetEl.step = restoreStepAfter;

                console.log(`⌨️ Klavye: ${targetEl.id} → ${newValue}`);

            }

        });

    }



    /**

     * 🎯 Mouse Down - Hücre seçimi (CellEditor'a delege) + Manuel mod davranışı

     */

    onMouseDown(event) {

        event.preventDefault();



        // Mouse koordinatlarını normalize et (-1 to +1)

        const rect = this.renderer.domElement.getBoundingClientRect();

        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;



        // Raycasting - AKTIF katmanın mesh'i yerine TÜM görünür katmanları kontrol et

        this.raycaster.setFromCamera(this.mouse, this.camera);



        // Tüm görünür katman mesh'lerini topla

        const visibleLayerMeshes = [];

        Object.entries(this.layers).forEach(([layerNum, layer]) => {

            if (layer.visible && layer.mesh) {

                visibleLayerMeshes.push(layer.mesh);

            }

        });

        // 🎯 Püskül Sonu mesh'ini de ekle (eğer görünürse)
        if (this.puskulSonu.visible && this.puskulSonu.mesh) {
            visibleLayerMeshes.push(this.puskulSonu.mesh);
        }

        const intersects = this.raycaster.intersectObjects(visibleLayerMeshes);



        console.log('🖱️ Mouse down:', intersects.length, 'intersects on', visibleLayerMeshes.length, 'visible layers');



        if (intersects.length > 0) {

            // Mesh'e tıklandı

            const clickPoint = intersects[0].point;

            const clickedMesh = intersects[0].object;

            console.log('🎯 Click point:', clickPoint);



            // 🎯 Püskül Sonu mesh'ine tıklandı mı?
            if (clickedMesh === this.puskulSonu.mesh) {
                if (this.cellEditor) {
                    // Eski highlight'ları temizle
                    this.cellEditor.clearHighlights();
                    
                    // Püskül Sonu için highlight oluştur
                    this.cellEditor.createPuskulSonuHighlight();
                    
                    // Püskül Sonu için özel panel aç (openPuskulSonuPanel içinde state set edilecek)
                    this.cellEditor.openDetailPanel('PUSKUL_SONU', 'PUSKUL_SONU', '');
                    console.log('🎯 Püskül Sonu seçildi');
                }
                return; // Püskül Sonu seçildi, diğer işlemleri yapma
            }

            // 🔄 Tıklanan mesh'in katmanını bul ve aktif katman yap

            const clickedLayerNum = this.findLayerByMesh(clickedMesh);

            if (clickedLayerNum && clickedLayerNum !== this.currentLayer) {

                console.log(`🔄 Katman değişimi: ${this.currentLayer} → ${clickedLayerNum}`);

                this.switchLayer(clickedLayerNum);

                this.updateLayerUI();



                // Layer selector'ı güncelle

                const layerSelector = document.getElementById('layer-selector');

                if (layerSelector) {

                    layerSelector.value = clickedLayerNum;

                }

            }



            if (this.cellAssignmentMode === 'manual') {

                // MANUEL MOD: Checkbox durumuna göre davran

                if (this.manualModeShowDropdowns) {

                    // Dropdown modu: Sadece mavi highlight, edit yok

                    if (this.cellEditor) {

                        const cellName = this.cellEditor.findClosestCell(clickPoint.x, clickPoint.y);

                        if (cellName) {

                            if (cellName !== this.hoveredCellName) {

                                this.highlightCellForManualMode(cellName);

                            }

                            console.log('🎨 Manuel-Dropdown: Hücre vurgulandı:', cellName);

                        }

                    }

                } else {

                    // Edit modu: Edit paneli aç

                    if (this.cellEditor) {

                        const cellName = this.cellEditor.findClosestCell(clickPoint.x, clickPoint.y);

                        if (cellName) {

                            this.cellEditor.selectCell(cellName);

                            console.log('✏️ Manuel-Edit: Hücre seçildi:', cellName);

                        }

                    }

                }

            } else {

                // OTOMATIK MOD: Edit paneli açabilir (normal davranış)

                if (this.cellEditor) {

                    const cellName = this.cellEditor.findClosestCell(clickPoint.x, clickPoint.y);

                    if (cellName) {

                        this.cellEditor.selectCell(cellName);

                        console.log('🎯 Otomatik: Hücre seçildi (edit):', cellName);

                    }

                }

            }

        }

        // Boşluğa tıklama artık hiçbir şey yapmıyor (highlight kalıcı)

    }



    /**

     * 🎯 Mouse Move - Manuel modda hover sistemi (sadece dropdown modu aktifken)

     */

    onMouseMove(event) {

        // Manuel mod ve dropdown modu aktif mi kontrol et

        if (this.cellAssignmentMode !== 'manual' || !this.manualModeShowDropdowns) {

            // Eğer manuel-dropdown değilse hover highlight'ı temizle

            if (this.hoveredCellName) {

                this.clearManualHoverHighlight();

            }

            return;

        }

        

        // Throttle için (her 150ms'de bir kontrol et - performance)

        if (!this._lastMouseMoveTime) {

            this._lastMouseMoveTime = 0;

        }

        const now = Date.now();

        if (now - this._lastMouseMoveTime < 150) {

            return;

        }

        this._lastMouseMoveTime = now;

        

        // 🐛 DEBUG

        if (!this._debugLoggedOnce) {

            console.log('🖱️ onMouseMove çalışıyor (manuel mod aktif)');

            this._debugLoggedOnce = true;

        }

        

        // Mouse koordinatlarını normalize et

        const rect = this.renderer.domElement.getBoundingClientRect();

        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        

        // Raycasting - TÜM görünür katmanları kontrol et

        this.raycaster.setFromCamera(this.mouse, this.camera);



        const visibleLayerMeshes = [];

        Object.entries(this.layers).forEach(([layerNum, layer]) => {

            if (layer.visible && layer.mesh) {

                visibleLayerMeshes.push(layer.mesh);

            }

        });



        const intersects = this.raycaster.intersectObjects(visibleLayerMeshes);

        

        if (intersects.length > 0) {

            // Hover edilen nokta

            const hoverPoint = intersects[0].point;

            

            // En yakın hücreyi bul

            if (this.cellEditor) {

                const cellName = this.cellEditor.findClosestCell(hoverPoint.x, hoverPoint.y);

                if (cellName) {

                    if (cellName !== this.hoveredCellName) {

                        this.highlightCellForManualMode(cellName);

                    }

                }

            }

        }

        // Mouse mesh dışına çıksa bile highlight kalıcı kalır (sticky)

        // Boşluğa tıklayarak temizlenebilir

    }



    /**

     * 🎯 Mouse Up - Şimdilik devre dışı

     */

    onMouseUp(event) {

        // Eski drag sistemi devre dışı

        return;

    }



    /**

     * 🔍 Zoom Extent - Tüm sahneyi kameraya sığdır

     */

    zoomExtent() {
        // Delegate to ViewUtils module
        ViewUtils.zoomExtent(this);
    }

    

    /**

     * 🔄 Geometry'yi master noktalardan yeniden oluştur

     */

    updateGeometryFromPoints() {

        // Mesh'leri güncelle

        this.scene.remove(this.puskulMesh);

        this.scene.remove(this.wireframeMesh);



        // Yeni geometry oluştur

        const geometry = this.puskulGeometry.createThreeGeometry();



        // Main mesh'i güncelle

        this.puskulMesh.geometry.dispose();

        this.puskulMesh.geometry = geometry;

        this.scene.add(this.puskulMesh);



        // Wireframe'i güncelle - EdgesGeometry kullanarak çapraz çizgileri gizle

        const edgesGeometry = new THREE.EdgesGeometry(geometry, 1);  // 1 derece eşik

        this.wireframeMesh.geometry.dispose();

        this.wireframeMesh.geometry = edgesGeometry;

        this.scene.add(this.wireframeMesh);



        // Noktaları yeniden oluştur (slave noktaları güncellenecek)

        this.createPointsMesh();

    }



    /**

     * 🖼️ PIP (Picture-in-Picture) mini ortografik görünüm

     */

    setupPipView() {

        const pipContainer = document.getElementById('pip-container');

        

        // Ortografik kamera (Top view - Z-up)

        // 🔍 Başlangıç zoom: outerRadius'a göre fit yap

        const margin = 40;

        const initialZoom = (this.outerRadius || 150) + margin;

        

        this.pipCamera = new THREE.OrthographicCamera(

            -initialZoom, initialZoom,  // left, right

            initialZoom, -initialZoom,  // top, bottom

            0.1, 5000  // Far: 2000 → 5000 (far clip sorunu çözüldü)

        );

        this.pipCamera.position.set(0, 0, 1000);  // Yukarıdan bak (200'den 1000'e - daha uzak)

        this.pipCamera.up.set(0, 1, 0);  // Y yukarı (top view için)

        this.pipCamera.lookAt(0, 0, 0);

        

        // Ayrı renderer (küçük canvas)

        this.pipRenderer = new THREE.WebGLRenderer({ 

            antialias: true,

            alpha: true 

        });

        this.pipRenderer.setSize(pipContainer.clientWidth, pipContainer.clientHeight);

        this.pipRenderer.setPixelRatio(window.devicePixelRatio);

        pipContainer.appendChild(this.pipRenderer.domElement);

        

        // PIP için basit kontroller

        this.pipControls = {

            isDragging: false,

            lastX: 0,

            lastY: 0,

            zoom: initialZoom  // 🔍 outerRadius + margin ile başla

        };

        

        console.log(`🖼️ PIP başlangıç zoom: ${initialZoom} (outerRadius=${this.outerRadius} + margin=${margin})`);

        

        // Mouse events

        const canvas = this.pipRenderer.domElement;

        

        canvas.addEventListener('mousedown', (e) => {

            this.pipControls.isDragging = true;

            this.pipControls.lastX = e.clientX;

            this.pipControls.lastY = e.clientY;

        });

        

        canvas.addEventListener('mousemove', (e) => {

            if (this.pipControls.isDragging) {

                const dx = e.clientX - this.pipControls.lastX;

                const dy = e.clientY - this.pipControls.lastY;

                

                // Pan (ortografik kamera için)

                const panSpeed = 0.5;

                this.pipCamera.left -= dx * panSpeed;

                this.pipCamera.right -= dx * panSpeed;

                this.pipCamera.top += dy * panSpeed;

                this.pipCamera.bottom += dy * panSpeed;

                this.pipCamera.updateProjectionMatrix();

                

                this.pipControls.lastX = e.clientX;

                this.pipControls.lastY = e.clientY;

            }

        });

        

        canvas.addEventListener('mouseup', () => {

            this.pipControls.isDragging = false;

        });

        

        canvas.addEventListener('mouseleave', () => {

            this.pipControls.isDragging = false;

        });

        

        // Zoom (mouse wheel) - Mouse pozisyonuna göre zoom

        canvas.addEventListener('wheel', (e) => {

            e.preventDefault();

            

            // Mouse pozisyonunu canvas üzerinde al

            const rect = canvas.getBoundingClientRect();

            const mouseX = e.clientX - rect.left;

            const mouseY = e.clientY - rect.top;

            

            // Normalized koordinatlar (-1 to 1)

            const normalizedX = (mouseX / rect.width) * 2 - 1;

            const normalizedY = -(mouseY / rect.height) * 2 + 1;

            

            // Mouse pozisyonunu world koordinatlarına çevir (zoom öncesi)

            const worldX_before = this.pipCamera.left + (normalizedX + 1) / 2 * (this.pipCamera.right - this.pipCamera.left);

            const worldY_before = this.pipCamera.bottom + (normalizedY + 1) / 2 * (this.pipCamera.top - this.pipCamera.bottom);

            

            // Zoom uygula

            const zoomSpeed = 10;

            const oldZoom = this.pipControls.zoom;

            this.pipControls.zoom += e.deltaY > 0 ? zoomSpeed : -zoomSpeed;

            this.pipControls.zoom = Math.max(50, Math.min(300, this.pipControls.zoom));

            

            const zoomFactor = this.pipControls.zoom / oldZoom;

            

            // Kamera bounds'larını güncelle

            const centerX = (this.pipCamera.left + this.pipCamera.right) / 2;

            const centerY = (this.pipCamera.top + this.pipCamera.bottom) / 2;

            

            this.pipCamera.left = centerX - this.pipControls.zoom;

            this.pipCamera.right = centerX + this.pipControls.zoom;

            this.pipCamera.top = centerY + this.pipControls.zoom;

            this.pipCamera.bottom = centerY - this.pipControls.zoom;

            

            // Mouse pozisyonunu world koordinatlarına çevir (zoom sonrası)

            const worldX_after = this.pipCamera.left + (normalizedX + 1) / 2 * (this.pipCamera.right - this.pipCamera.left);

            const worldY_after = this.pipCamera.bottom + (normalizedY + 1) / 2 * (this.pipCamera.top - this.pipCamera.bottom);

            

            // Farkı telafi et (mouse'un altındaki nokta sabit kalsın)

            const offsetX = worldX_before - worldX_after;

            const offsetY = worldY_before - worldY_after;

            

            this.pipCamera.left += offsetX;

            this.pipCamera.right += offsetX;

            this.pipCamera.top += offsetY;

            this.pipCamera.bottom += offsetY;

            

            this.pipCamera.updateProjectionMatrix();

        });

        

        // Çift tıklama - Reset view

        canvas.addEventListener('dblclick', () => {

            // Fit to outer radius (bir miktar margin ile)

            const margin = 40;

            const fit = (this.outerRadius || 150) + margin;

            this.pipControls.zoom = fit;

            this.pipCamera.left = -fit;

            this.pipCamera.right = fit;

            this.pipCamera.top = fit;

            this.pipCamera.bottom = -fit;

            this.pipCamera.position.set(0, 0, 200);

            this.pipCamera.lookAt(0, 0, 0);

            this.pipCamera.updateProjectionMatrix();

            console.log('🔄 PIP fit-to-outerRadius:', fit);

        });

        

        console.log('🖼️ PIP ortografik görünüm eklendi');

        

        // 🔄 PIP resize observer - container boyutu değiştiğinde kare oranını koru

        const resizeObserver = new ResizeObserver(() => {

            if (this.pipRenderer && pipContainer) {

                const width = pipContainer.clientWidth;

                const height = pipContainer.clientHeight;

                

                // Kare oranını zorla (width = height)

                const size = Math.max(width, height); // En büyük boyutu al

                pipContainer.style.width = size + 'px';

                pipContainer.style.height = size + 'px';

                

                // Canvas'ı güncelle

                this.pipRenderer.setSize(size, size);

                console.log(`🖼️ PIP resized (kare): ${size}x${size}`);

            }

        });

        resizeObserver.observe(pipContainer);

    }



    /**

     * 🏗️ Katman Yönetimi Metodları

     */



    /**

     * Yeni katman ekle

     * @param {number} parentLayer - Üst katman numarası (opsiyonel, varsayılan: mevcut katman)

     * @returns {number} Yeni katman numarası

     */

    addLayer(parentLayer = null) {

        const parent = parentLayer || this.currentLayer;

        const parentData = this.layers[parent];



        if (!parentData) {

            console.error(`❌ Parent layer ${parent} bulunamadı!`);

            return null;

        }



        // Yeni katman numarası - Parent katmanın hemen altındaki boş slot'u bul

        let newLayerNum = parent + 1;

        while (this.layers[newLayerNum]) {

            newLayerNum++;

        }



        if (newLayerNum > this.maxLayers) {

            console.error(`❌ Maksimum katman sayısına ulaşıldı (${this.maxLayers})`);

            return null;

        }



        // 🎯 Gerçek parent'ı bul: Yeni katman numarasından geriye doğru mevcut ilk katmanı bul

        let actualParent = newLayerNum - 1;

        while (actualParent > 0 && !this.layers[actualParent]) {

            actualParent--;

        }



        if (actualParent === 0 || !this.layers[actualParent]) {

            console.error(`❌ Gerçek parent layer bulunamadı! (newLayerNum: ${newLayerNum})`);

            return null;

        }



        const actualParentData = this.layers[actualParent];



        console.log(`🔗 Yeni katman ${newLayerNum} için gerçek parent: Katman ${actualParent} (seçili: ${parent})`);



        // 🎯 Kaskad Kuralları Uygula - Gerçek parent'ın değerlerini kullan

        const newPlacement = actualParentData.placement === 'corner' ? 'edge' : 'corner';

        const newOuterRadius = actualParentData.innerRadius; // Üst katmanın innerRadius = alt katmanın outerRadius



        // 📊 Katman numarasına göre sabit inner radius değerleri

        const innerRadiusPresets = {

            1: 160,  // Katman 1

            2: 150,  // Katman 2

            3: 100,  // Katman 3

            4: 70,   // Katman 4

            5: 35    // Katman 5

        };

        let newInnerRadius = innerRadiusPresets[newLayerNum]; // Sadece preset değeri kullan



        // ⚠️ KURAL: innerRadius ASLA outerRadius'tan büyük olamaz

        const minGap = 10;

        if (newInnerRadius >= newOuterRadius - minGap) {

            newInnerRadius = Math.max(newOuterRadius - minGap, minGap);

            console.warn(`⚠️ Yeni katman ${newLayerNum} innerRadius düzeltildi: preset=${innerRadiusPresets[newLayerNum]} → ${newInnerRadius} (outer=${newOuterRadius})`);

        }



        // 🔢 Gen sayısı: Gerçek parent'ın sides değerini kullan

        const newSides = (actualParent === 1 && this.currentLayer === 1) ? this.puskulSides : actualParentData.sides;



        // Yeni katman verisi

        const newLayer = {

            sides: newSides, // Gen sayısı üst katmandan (güncel değer)

            placement: newPlacement,  // Yerleşim tersi

            outerRadius: newOuterRadius,

            innerRadius: newInnerRadius,

            mainCellType: 'YAPRAK',  // Varsayılan

            interCellType: 'KAZAYAGI', // Varsayılan

            cellMultiplier: 2,

            geometry: null,

            visible: true,

            cellCustomParams: {}, // 🎨 Hücre özel parametreleri (bu katmana özel ratio değerleri)

            parentLayer: actualParent,  // Gerçek üst katman referansı

            // 🎨 Görsel Ayarlar (Katmana Özel) - Default değerler

            bademRadialRatio: 0.403,      // b1/d1 radyal konum oranı

            bademNarrowFactor: 1.0,       // b1/d1 daralma faktörü (1.0=yapışık)

            enableSnap: true,             // Geometri deformasyonu aktif mi?

            snapThreshold: 5,             // Deformasyon gücü (0-20)

            showSnapConnections: false,   // Gap görselleştirme

            showCenterLines: true,        // Merkez çizgileri göster

            showBademRadialCircle: true,  // Yeşil radyal çember göster

            // 🎯 Katman Geçiş Yüzeyi

            transitionHeight: 20          // Varsayılan geçiş yüzeyi yüksekliği (0-50 birim)

        };



        this.layers[newLayerNum] = newLayer;



        console.log(`🏗️ Yeni katman eklendi: Katman ${newLayerNum}`);

        console.log(`📐 Yerleşim: ${newPlacement} (üst katman: ${actualParentData.placement})`);

        console.log(`🔵 Outer: ${newOuterRadius}, Inner: ${newInnerRadius}`);

        console.log(`🔢 Sides: ${newSides} (parent katman ${actualParent}: ${actualParentData.sides})`);



        // 🎯 Yeni katman için geometri oluştur

        if (typeof PuskulGeometry !== 'undefined') {

            // 🔷 Parent katman 1 ise, boundary noktalarını çıkar

            let customBoundary = null;

            console.log(`🔍 DEBUG: parent=${parent}, parentData.geometry=${!!parentData.geometry}, LayerBoundary=${typeof LayerBoundary}`);



            if (parent === 1 && parentData.geometry && typeof LayerBoundary !== 'undefined') {

                console.log(`✅ Boundary çıkarma koşulu sağlandı, parent layer ${parent}'den noktalar alınıyor...`);

                const zOffset = this.getLayerZOffset(parent);

                customBoundary = LayerBoundary.extractBoundaryPoints(parentData, zOffset);



                if (customBoundary && customBoundary.length > 0) {

                    console.log(`🔷 Layer ${newLayerNum}: Parent katman ${parent}'den ${customBoundary.length} boundary noktası alındı`);



                    // 📏 DEBUG: Boundary'yi kalın yeşil çizgi ile görselleştir

                    // Yeni katmanın Z seviyesinde çiz

                    const newLayerZ = this.getLayerZOffset(newLayerNum);

                    LayerBoundary.visualizeBoundaryLine(customBoundary, this.scene, newLayerZ, 0x00ff00, 5);

                    console.log(`📏 Yeşil boundary çizgisi Layer ${newLayerNum} seviyesinde (Z=${newLayerZ})`);

                } else {

                    console.warn(`⚠️ Layer ${parent}'den boundary noktaları alınamadı, normal outerRadius kullanılacak`);

                    customBoundary = null;

                }

            }



            newLayer.geometry = new PuskulGeometry(

                newLayer.innerRadius, // M (depth)

                this.H,

                newLayer.sides,

                newLayer.placement,

                newLayer.outerRadius,

                newLayer.innerRadius,

                newLayer.mainCellType,

                newLayer.interCellType,

                newLayer.cellMultiplier,

                customBoundary  // 🔷 Custom outer boundary (opsiyonel)

            );

            console.log(`💾 Katman ${newLayerNum} geometrisi oluşturuldu${customBoundary ? ' (coordinate-based)' : ''}`);



            // Hücreleri otomatik yükle

            if (window.cellLoader) {

                setTimeout(() => {

                    // Aktif katmanı geçici olarak değiştir

                    const oldLayer = this.currentLayer;

                    const oldGeometry = this.puskulGeometry;

                    const oldSides = this.puskulSides;

                    const oldPlacement = this.puskulPlacement;

                    const oldOuterRadius = this.outerRadius;

                    const oldInnerRadius = this.innerRadius;

                    const oldMainCellType = this.mainCellType;

                    const oldInterCellType = this.interCellType;

                    const oldCellMultiplier = this.cellMultiplier;



                    this.currentLayer = newLayerNum;

                    this.puskulGeometry = newLayer.geometry;

                    this.puskulSides = newLayer.sides;

                    this.puskulPlacement = newLayer.placement;

                    this.outerRadius = newLayer.outerRadius;

                    this.innerRadius = newLayer.innerRadius;

                    this.mainCellType = newLayer.mainCellType;

                    this.interCellType = newLayer.interCellType;

                    this.cellMultiplier = newLayer.cellMultiplier;



                    console.log(`🔄 Geçici olarak Katman ${newLayerNum}'e geçildi (hücre yüklemesi için)`);

                    console.log(`   📊 Katman ${newLayerNum} başlangıç değerleri: outer=${this.outerRadius}, inner=${this.innerRadius}`);

                    const tempLoader = new CellLoader(this);

                    tempLoader.loadAllCells().then(() => {

                        console.log(`🎯 Katman ${newLayerNum} hücreleri yüklendi (geçici loader)`);



                        // ✅ innerRadius zaten oluşturma aşamasında minGap kontrolünden geçti (satır 5696-5706)

                        // Restore gereksiz, mevcut değerleri kullan

                        console.log(`   ✅ Katman ${newLayerNum} radius değerleri: outer=${newLayer.outerRadius}, inner=${newLayer.innerRadius}`);

                        const loadedCount = Object.values(newLayer.geometry.cells || {}).filter(cell => cell !== null).length;

                        console.log(`📦 Katman ${newLayerNum} yüklenen hücre sayısı: ${loadedCount}/${newLayer.geometry.totalCells}`);



                        // 🎯 c6→a1 ALIGNMENT: Alt katmanın her hücresinin c6'sını üst katmanın a1'ine hizala

                        if (parent >= 1) {

                            this.alignChildToParentLayer(newLayerNum, parent);

                        }



                        this.currentLayer = oldLayer;

                        this.puskulGeometry = oldGeometry;

                        this.puskulSides = oldSides;

                        this.puskulPlacement = oldPlacement;

                        this.outerRadius = oldOuterRadius;

                        this.innerRadius = oldInnerRadius;

                        this.mainCellType = oldMainCellType;

                        this.interCellType = oldInterCellType;

                        this.cellMultiplier = oldCellMultiplier;

                        console.log(`🔁 Katman ${oldLayer}'e geri dönüldü`);



                        this.renderAllLayers();

                        // 🎯 Köprü yüzeylerini güncelle
                        this.createAllBridgeSurfaces();

                        // 🎯 Geçiş yüzeylerini güncelle
                        if (this.layerTransition) {
                            this.layerTransition.createAllTransitionSurfaces();
                        }

                    }).catch(error => {

                        console.error(`❌ Katman ${newLayerNum} hücreleri yüklenemedi:`, error);



                        this.currentLayer = oldLayer;

                        this.puskulGeometry = oldGeometry;

                        this.puskulSides = oldSides;

                        this.puskulPlacement = oldPlacement;

                        this.outerRadius = oldOuterRadius;

                        this.innerRadius = oldInnerRadius;

                        this.mainCellType = oldMainCellType;

                        this.interCellType = oldInterCellType;

                        this.cellMultiplier = oldCellMultiplier;

                    });

                }, 100);

            }

        }



        return newLayerNum;

    }



    /**

     * Aktif katmanı değiştir

     * @param {number} layerNum - Katman numarası

     */

    switchLayer(layerNum) {

        if (!this.layers[layerNum]) {

            console.error(`❌ Katman ${layerNum} bulunamadı!`);

            return;

        }



        const oldLayer = this.currentLayer;

        this.currentLayer = layerNum;



        // Aktif katman verilerini ana değişkenlere kopyala (geriye uyumluluk)

        const layer = this.layers[layerNum];

        this.puskulSides = layer.sides;

        this.puskulPlacement = layer.placement;

        this.outerRadius = layer.outerRadius;

        this.innerRadius = layer.innerRadius;

        this.mainCellType = layer.mainCellType;

        this.interCellType = layer.interCellType;

        this.cellMultiplier = layer.cellMultiplier;

        this.puskulGeometry = layer.geometry;

        // 🎨 Görsel ayarları yükle (katmana özel)

        this.bademRadialRatio = layer.bademRadialRatio;

        this.bademNarrowFactor = layer.bademNarrowFactor;

        this.enableSnap = layer.enableSnap;

        this.snapThreshold = layer.snapThreshold;

        this.showSnapConnections = layer.showSnapConnections;

        this.showCenterLines = layer.showCenterLines;

        this.showBademRadialCircle = layer.showBademRadialCircle;



        // 🔄 Geometry senkronizasyonu: Layer objesindeki değerler geometry'ye aktarılmalı

        if (layer.geometry) {

            layer.geometry.sides = layer.sides;

            layer.geometry.outerRadius = layer.outerRadius;

            layer.geometry.innerRadius = layer.innerRadius;

            layer.geometry.mainCellType = layer.mainCellType;

            layer.geometry.interCellType = layer.interCellType;

            layer.geometry.cellMultiplier = layer.cellMultiplier;

            console.log(`🔄 Katman ${layerNum} geometrisi senkronize edildi: outer=${layer.outerRadius}, inner=${layer.innerRadius}`);

        }



        console.log(`🏗️ Katman değiştirildi: ${oldLayer} → ${layerNum}`);



        // UI'yi güncelle

        this.updateLayerUI();



        // 🎨 Manuel mod açıksa dropdown'ları da güncelle (hücreler yüklendikten sonra)

        // Kısa bir gecikme ile - geometri ve hücreler yüklensin

        if (this.cellAssignmentMode === 'manual') {

            setTimeout(() => {

                this.createCellAssignmentUI();

                console.log(`🔄 Layer ${layerNum} dropdown'ları güncellendi`);

            }, 100);

        }

    }



    /**

     * Mesh'e göre hangi katmana ait olduğunu bul

     * @param {THREE.Mesh} mesh - Tıklanan mesh

     * @returns {number|null} Katman numarası veya null

     */

    findLayerByMesh(mesh) {

        for (const [layerNum, layer] of Object.entries(this.layers)) {

            if (layer.mesh === mesh) {

                return parseInt(layerNum);

            }

        }

        return null;

    }



    /**

     * Katman sil

     * @param {number} layerNum - Silinecek katman numarası

     */

    removeLayer(layerNum) {

        if (layerNum === 1) {

            console.error('❌ Layer 1 silinemez!');

            return false;

        }



        if (!this.layers[layerNum]) {

            console.error(`❌ Katman ${layerNum} bulunamadı!`);

            return false;

        }



        console.log(`🗑️ Katman ${layerNum} siliniyor...`);



        // Katmanın mesh'lerini sahneden kaldır

        const layer = this.layers[layerNum];

        if (layer.mesh) {

            this.scene.remove(layer.mesh);

            if (layer.mesh.geometry) layer.mesh.geometry.dispose();

            if (layer.mesh.material) layer.mesh.material.dispose();

        }

        if (layer.wireframeMesh) {

            this.scene.remove(layer.wireframeMesh);

            if (layer.wireframeMesh.geometry) layer.wireframeMesh.geometry.dispose();

            if (layer.wireframeMesh.material) layer.wireframeMesh.material.dispose();

        }

        if (layer.bridgeMesh) {

            // bridgeMesh array olabilir (birden fazla köprü yüzeyi)

            if (Array.isArray(layer.bridgeMesh)) {

                layer.bridgeMesh.forEach(mesh => {

                    this.scene.remove(mesh);

                    if (mesh.geometry) mesh.geometry.dispose();

                    if (mesh.material) mesh.material.dispose();

                });

            } else {

                this.scene.remove(layer.bridgeMesh);

                if (layer.bridgeMesh.geometry) layer.bridgeMesh.geometry.dispose();

                if (layer.bridgeMesh.material) layer.bridgeMesh.material.dispose();

            }

        }

        // Geçiş yüzeyini temizle (transition surface)

        if (layer.extrudeMesh) {

            this.scene.remove(layer.extrudeMesh);

            if (layer.extrudeMesh.geometry) layer.extrudeMesh.geometry.dispose();

            if (layer.extrudeMesh.material) layer.extrudeMesh.material.dispose();

        }



        // Katmanı sil

        delete this.layers[layerNum];



        // Eğer silinen katman aktif katmansa, Layer 1'e geç

        if (this.currentLayer === layerNum) {

            this.switchLayer(1);

        }



        console.log(`✅ Katman ${layerNum} silindi`);

        // 🎯 Püskül Sonu modülünü güncelle (yeni en alt katmana göre)
        this.updatePuskulSonu();

        return true;

    }



    /**

     * Aktif katmanın UI bilgilerini güncelle

     */

    updateLayerUI() {

        const layer = this.layers[this.currentLayer];

        if (!layer) return;



        // Katman bilgi kartını güncelle

        const sidesElem = document.getElementById('layer-info-sides');

        const placementElem = document.getElementById('layer-info-placement');

        const mainElem = document.getElementById('layer-info-main');

        const interElem = document.getElementById('layer-info-inter');



        if (sidesElem) sidesElem.textContent = layer.sides;

        if (placementElem) placementElem.textContent = layer.placement === 'corner' ? 'Köşe' : 'Kenar';

        if (mainElem) mainElem.textContent = layer.mainCellType;

        if (interElem) interElem.textContent = layer.interCellType;



        // 🎨 HTML dropdown'larını da güncelle (sol paneldeki Ana/Ara Hücre Tipi)

        const mainCellTypeSelect = document.getElementById('main-cell-type');

        const interCellTypeSelect = document.getElementById('inter-cell-type');

        if (mainCellTypeSelect) mainCellTypeSelect.value = layer.mainCellType;

        if (interCellTypeSelect) interCellTypeSelect.value = layer.interCellType;



        // Görünürlük checkbox'ını güncelle

        const visibilityToggle = document.getElementById('layer-visibility-toggle');

        if (visibilityToggle) {

            visibilityToggle.checked = layer.visible;

        }



        // 🔵 Inner radius slider ve label'ını güncelle

        const innerRadiusSlider = document.getElementById('inner-radius-slider');

        const innerRadiusLabel = document.getElementById('inner-radius-label');

        if (innerRadiusSlider) innerRadiusSlider.value = layer.innerRadius;

        if (innerRadiusLabel) innerRadiusLabel.textContent = layer.innerRadius;



        // 🔴 Outer radius slider ve label'ını güncelle (sadece Katman 1 için)

        if (this.currentLayer === 1) {

            const outerRadiusSlider = document.getElementById('outer-radius-slider');

            const outerRadiusLabel = document.getElementById('outer-radius-label');

            if (outerRadiusSlider) outerRadiusSlider.value = layer.outerRadius;

            if (outerRadiusLabel) outerRadiusLabel.textContent = layer.outerRadius;

        }



        const puskulShapeHeading = document.getElementById('puskul-shape-heading');

        if (puskulShapeHeading) {

            puskulShapeHeading.style.display = (this.currentLayer === 1) ? 'block' : 'none';

        }



        // Gen sayısı slider'ını sadece Katman 1'de göster

        const sidesControlGroup = document.getElementById('sides-control-group');

        if (sidesControlGroup) {

            sidesControlGroup.style.display = (this.currentLayer === 1) ? 'block' : 'none';



            // Katman 1'de ise slider değerini güncelle

            if (this.currentLayer === 1) {

                const sidesSlider = document.getElementById('sides-slider');

                const sidesLabel = document.getElementById('sides-label');

                const sidesValue = document.getElementById('sides-value');

                if (sidesSlider) sidesSlider.value = layer.sides;

                if (sidesLabel) sidesLabel.textContent = layer.sides;

                if (sidesValue) sidesValue.textContent = layer.sides;

            }

        }



        // Dış Ngon (outerRadius) slider'ını sadece Katman 1'de göster

        const outerRadiusControlGroup = document.getElementById('outer-radius-control-group');

        if (outerRadiusControlGroup) {

            outerRadiusControlGroup.style.display = (this.currentLayer === 1) ? 'block' : 'none';

        }



        // Hücre Yerleşimi kontrolünü sadece Katman 1'de göster

        const placementControlGroup = document.getElementById('placement-control-group');

        if (placementControlGroup) {

            placementControlGroup.style.display = (this.currentLayer === 1) ? 'block' : 'none';

        }



        // Hücre Çeşitliliği kontrolünü sadece Katman 1'de göster

        const multiplierControlGroup = document.getElementById('multiplier-control-group');

        if (multiplierControlGroup) {

            multiplierControlGroup.style.display = (this.currentLayer === 1) ? 'block' : 'none';

        }



        // Diğer katmanlarda outerRadius bilgisini göster (read-only)

        if (this.currentLayer > 1) {

            const parentLayer = this.layers[this.currentLayer - 1];

            if (parentLayer) {

                // İç ngon label'ının altına bilgi ekle

                const innerRadiusLabel = document.getElementById('inner-radius-label');

                if (innerRadiusLabel && innerRadiusLabel.parentElement) {

                    // Mevcut info paragraph'ı güncelle veya ekle

                    let infoP = innerRadiusLabel.parentElement.parentElement.querySelector('.outer-radius-info');

                    if (!infoP) {

                        infoP = document.createElement('p');

                        infoP.className = 'outer-radius-info hint hint-ok';

                        innerRadiusLabel.parentElement.parentElement.insertBefore(infoP, innerRadiusLabel.parentElement.nextSibling);

                    }

                    infoP.textContent = `🔗 Dış Ngon (Katman ${this.currentLayer - 1}'den): ${parentLayer.innerRadius} birim`;

                }

            }

        } else {

            // Katman 1'de info paragraph'ı kaldır

            const infoP = document.querySelector('.outer-radius-info');

            if (infoP) {

                infoP.remove();

            }

        }



        // Kaskad göstergesini güncelle

        const cascadeIndicator = document.getElementById('cascade-indicator');

        if (cascadeIndicator) {

            const hasLowerLayer = this.layers[this.currentLayer + 1];

            cascadeIndicator.style.display = hasLowerLayer ? 'block' : 'none';

        }



        // 🎨 Görsel ayar slider/checkbox'larını güncelle

        const bademRadialRatioSlider = document.getElementById('badem-radial-ratio-slider');

        const bademRadialRatioLabel = document.getElementById('badem-radial-ratio-label');

        const bademRadialRatioPercentage = document.getElementById('badem-radial-ratio-percentage');

        if (bademRadialRatioSlider) bademRadialRatioSlider.value = layer.bademRadialRatio;

        if (bademRadialRatioLabel) bademRadialRatioLabel.textContent = layer.bademRadialRatio.toFixed(3);

        if (bademRadialRatioPercentage) bademRadialRatioPercentage.textContent = (layer.bademRadialRatio * 100).toFixed(1);



        const bademNarrowFactorSlider = document.getElementById('badem-narrow-factor-slider');

        const bademNarrowFactorLabel = document.getElementById('badem-narrow-factor-label');

        const bademNarrowPercentage = document.getElementById('badem-narrow-percentage');

        const bademGapPercentage = document.getElementById('badem-gap-percentage');

        if (bademNarrowFactorSlider) bademNarrowFactorSlider.value = layer.bademNarrowFactor;

        if (bademNarrowFactorLabel) bademNarrowFactorLabel.textContent = layer.bademNarrowFactor.toFixed(2);

        if (bademNarrowPercentage) bademNarrowPercentage.textContent = (layer.bademNarrowFactor * 100).toFixed(0);

        if (bademGapPercentage) bademGapPercentage.textContent = ((1 - layer.bademNarrowFactor) * 100).toFixed(0);



        const snapThresholdSlider = document.getElementById('snap-threshold-slider');

        const snapThresholdLabel = document.getElementById('snap-threshold-label');

        const snapPercentage = document.getElementById('snap-percentage');

        if (snapThresholdSlider) snapThresholdSlider.value = layer.snapThreshold;

        if (snapThresholdLabel) snapThresholdLabel.textContent = layer.snapThreshold;

        if (snapPercentage) snapPercentage.textContent = (layer.snapThreshold / 20 * 100).toFixed(0);



        // cellMultiplier slider'ını güncelle (sadece Katman 1'de görünür)

        if (this.currentLayer === 1) {

            const multiplierSlider = document.getElementById('multiplier-slider');

            const multiplierLabel = document.getElementById('multiplier-label');

            if (multiplierSlider) multiplierSlider.value = layer.cellMultiplier;

            if (multiplierLabel) multiplierLabel.textContent = layer.cellMultiplier;

        }



        // Görsel mesh'lerin görünürlüğünü güncelle

        this.snapConnectionMeshes.forEach(mesh => mesh.visible = layer.showSnapConnections);

        this.snapPointMeshes.forEach(mesh => mesh.visible = layer.showSnapConnections);

        this.centerLineMeshes.forEach(mesh => mesh.visible = layer.showCenterLines);

        if (this.bademRadialCircleMesh) {

            this.bademRadialCircleMesh.visible = layer.showBademRadialCircle;

        }

    }



    /**

     * Katman selector dropdown'ını güncelle

     */

    updateLayerSelector() {

        const selector = document.getElementById('layer-selector');

        if (!selector) return;



        // Mevcut seçimi sakla

        const currentValue = selector.value;



        // Tüm option'ları temizle

        selector.innerHTML = '';



        // Her katman için option ekle

        Object.keys(this.layers).sort((a, b) => a - b).forEach(layerNum => {

            const option = document.createElement('option');

            option.value = layerNum;



            if (layerNum == 1) {

                option.textContent = `Katman 1 (En Üst)`;

            } else {

                option.textContent = `Katman ${layerNum}`;

            }



            option.selected = (layerNum == this.currentLayer);

            selector.appendChild(option);

        });



        console.log(`🔄 Layer selector güncellendi: ${Object.keys(this.layers).length} katman`);

    }



    /**

     * Katmanın Z pozisyonunu hesapla

     * @param {number} layerNum - Katman numarası

     * @returns {number} Z offset değeri

     */

    getLayerZOffset(layerNum) {
        // Delegate to RenderUtils module
        return RenderUtils.getLayerZOffset(this, layerNum);
    }

    renderLayer(layerNum) {
        // Delegate to RenderUtils module
        RenderUtils.renderLayer(this, layerNum);
    }

    renderAllLayers() {
        // Delegate to RenderUtils module
        RenderUtils.renderAllLayers(this);
    }



    /**

     * Katman görünürlüğünü toggle et

     * @param {number} layerNum - Katman numarası

     * @param {boolean} visible - Görünür mü?

     */

    toggleLayerVisibility(layerNum, visible) {

        const layer = this.layers[layerNum];

        if (!layer) {

            console.error(`❌ Katman ${layerNum} bulunamadı`);

            return;

        }



        layer.visible = visible;



        // Mesh'leri göster/gizle

        if (layer.mesh) {

            layer.mesh.visible = visible;

        }

        if (layer.wireframeMesh) {

            layer.wireframeMesh.visible = visible;

        }

        // Köprü mesh'leri (array olabilir)
        if (layer.bridgeMesh) {
            if (Array.isArray(layer.bridgeMesh)) {
                layer.bridgeMesh.forEach(mesh => {
                    mesh.visible = visible;
                });
            } else {
                layer.bridgeMesh.visible = visible;
            }
        }

        // Geçiş yüzeyi mesh'i
        if (layer.extrudeMesh) {
            layer.extrudeMesh.visible = visible;
        }

        console.log(`👁️ Katman ${layerNum} ${visible ? 'gösterildi' : 'gizlendi'}`);

    }



    /**

     * 🧪 SIMPLE TEST: Sadece cell1 için a1 ve c1 göster (sarı)

     */

    debugSimpleTest() {

        console.log('🧪 SIMPLE TEST: SEÇİLİ HÜCRE - Layer1.a1 ↔ Layer2.c1 eşitlemesi');



        // Seçili hücreyi al (cell editor'dan)

        const selectedCellName = this.cellEditor?.selectedCellName;

        if (!selectedCellName) {

            console.error('❌ Hiçbir hücre seçilmemiş! Önce Layer 2\'de bir hücreye tıklayın.');

            return;

        }



        const layer1 = this.layers[1];

        const layer2 = this.layers[2];



        if (!layer1 || !layer1.geometry) {

            console.error('❌ Layer 1 yok');

            return;

        }

        if (!layer2 || !layer2.geometry) {

            console.error('❌ Layer 2 yok');

            return;

        }



        // Debug grubu temizle

        if (this.debugAlignmentGroup) {

            this.scene.remove(this.debugAlignmentGroup);

        }

        this.debugAlignmentGroup = new THREE.Group();



        // Layer 2 seçili hücre

        const cell2Obj = layer2.geometry.cells[selectedCellName];

        const cell2Pos = layer2.geometry.cellPositions[selectedCellName];

        const layer2ZOffset = this.getLayerZOffset(2);



        if (!cell2Obj || !cell2Obj.geometry || !cell2Obj.geometry.points) {

            console.error(`❌ Layer 2 ${selectedCellName} - geometry yok`);

            return;

        }



        const cell2Type = cell2Obj.type || 'UNKNOWN';

        const prefix2 = cell2Type === 'BADEM' ? 'B' :

                       cell2Type === 'FITIL' ? 'F' :

                       cell2Type === 'KAZAYAGI' ? 'K' :

                       cell2Type === 'YAPRAK' ? 'Y' : 'X';



        console.log(`\n📍 SEÇİLİ HÜCRE (Layer 2): ${selectedCellName} (${cell2Type})`);



        // Layer 2 - c1 noktası (büyük sarı küre)

        const c1Point = cell2Obj.geometry.points[`${prefix2}-c1`];

        if (c1Point) {

            const cos = Math.cos(cell2Pos.rotation);

            const sin = Math.sin(cell2Pos.rotation);

            const c1World = {

                x: cell2Pos.x + (c1Point.x * cos - c1Point.y * sin),

                y: cell2Pos.y + (c1Point.x * sin + c1Point.y * cos),

                z: c1Point.z + cell2Pos.z + layer2ZOffset

            };



            const c1Sphere = new THREE.Mesh(

                new THREE.SphereGeometry(4, 16, 16),

                new THREE.MeshBasicMaterial({ color: 0xffff00, opacity: 0.9, transparent: true })

            );

            c1Sphere.position.set(c1World.x, c1World.y, c1World.z);

            this.debugAlignmentGroup.add(c1Sphere);

            console.log(`  🟡 Layer2.c1: (${c1World.x.toFixed(2)}, ${c1World.y.toFixed(2)}, ${c1World.z.toFixed(2)})`);

        }



        // Layer 1 - aynı isimli hücrenin a1 noktası (küçük sarı küre)

        const cell1Obj = layer1.geometry.cells[selectedCellName];

        const cell1Pos = layer1.geometry.cellPositions[selectedCellName];

        const layer1ZOffset = this.getLayerZOffset(1);



        if (cell1Obj && cell1Obj.geometry && cell1Obj.geometry.points && cell1Pos) {

            const cell1Type = cell1Obj.type || 'UNKNOWN';

            const prefix1 = cell1Type === 'BADEM' ? 'B' :

                           cell1Type === 'FITIL' ? 'F' :

                           cell1Type === 'KAZAYAGI' ? 'K' :

                           cell1Type === 'YAPRAK' ? 'Y' : 'X';



            const a1Point = cell1Obj.geometry.points[`${prefix1}-a1`];

            if (a1Point) {

                const cos = Math.cos(cell1Pos.rotation);

                const sin = Math.sin(cell1Pos.rotation);

                const a1World = {

                    x: cell1Pos.x + (a1Point.x * cos - a1Point.y * sin),

                    y: cell1Pos.y + (a1Point.x * sin + a1Point.y * cos),

                    z: a1Point.z + cell1Pos.z + layer1ZOffset

                };



                const a1Sphere = new THREE.Mesh(

                    new THREE.SphereGeometry(2, 16, 16),

                    new THREE.MeshBasicMaterial({ color: 0xffff00, opacity: 0.9, transparent: true })

                );

                a1Sphere.position.set(a1World.x, a1World.y, a1World.z);

                this.debugAlignmentGroup.add(a1Sphere);

                console.log(`  🟡 Layer1.a1: (${a1World.x.toFixed(2)}, ${a1World.y.toFixed(2)}, ${a1World.z.toFixed(2)})`);



                // Mesafe hesapla

                if (c1Point) {

                    const cos2 = Math.cos(cell2Pos.rotation);

                    const sin2 = Math.sin(cell2Pos.rotation);

                    const c1World = {

                        x: cell2Pos.x + (c1Point.x * cos2 - c1Point.y * sin2),

                        y: cell2Pos.y + (c1Point.x * sin2 + c1Point.y * cos2)

                    };

                    const distance = Math.sqrt(

                        Math.pow(a1World.x - c1World.x, 2) +

                        Math.pow(a1World.y - c1World.y, 2)

                    );

                    console.log(`  📏 Layer1.a1 ↔ Layer2.c1 mesafe: ${distance.toFixed(2)}`);

                }

            }

        } else {

            console.warn(`⚠️ Layer 1'de ${selectedCellName} hücresi bulunamadı`);

        }



        // c6TargetWorld varsa göster

        if (cell2Pos.c6TargetWorld) {

            console.log(`  🎯 c6TargetWorld: (${cell2Pos.c6TargetWorld.x.toFixed(2)}, ${cell2Pos.c6TargetWorld.y.toFixed(2)})`);

        } else {

            console.log(`  ❌ c6TargetWorld YOK!`);

        }



        this.scene.add(this.debugAlignmentGroup);

        console.log('\n✅ Simple test tamamlandı - küçük sarı=Layer1.a1, büyük sarı=Layer2.c1');

    }



    /**

     * 🎯 Alt katmanın her hücresinin c6 noktasını üst katmanın karşılık gelen hücresinin a1 noktasına hizala

     * Her hücrenin c6 lokal koordinatını değiştirerek alignment sağla

     * @param {number} childLayerNum - Alt katman numarası

     * @param {number} parentLayerNum - Üst katman numarası

     */

    alignChildToParentLayer(childLayerNum, parentLayerNum) {

        console.log(`🎯 Layer ${childLayerNum} → Layer ${parentLayerNum} alignment başlatılıyor (c6→a1)...`);



        const parentLayer = this.layers[parentLayerNum];

        const childLayer = this.layers[childLayerNum];



        if (!parentLayer || !parentLayer.geometry || !childLayer || !childLayer.geometry) {

            console.error(`❌ Layer ${parentLayerNum} veya Layer ${childLayerNum} bulunamadı!`);

            return;

        }



        const parentGeo = parentLayer.geometry;

        const childGeo = childLayer.geometry;



        let alignedCount = 0;



        // Her hücre için alignment yap

        for (let i = 0; i < Math.min(parentGeo.totalCells, childGeo.totalCells); i++) {

            const cellName = `cell${i + 1}`;

            const parentCell = parentGeo.cells[cellName];

            const parentCellPos = parentGeo.cellPositions[cellName];

            const childCell = childGeo.cells[cellName];

            const childCellPos = childGeo.cellPositions[cellName];



            if (!parentCell || !parentCellPos || !childCell || !childCellPos) continue;

            if (!parentCell.geometry || !childCell.geometry) continue;



            // Parent'ın a1 noktasını bul

            const parentType = parentCell.type || 'UNKNOWN';

            const parentPrefix = parentType === 'BADEM' ? 'B' :

                                parentType === 'FITIL' ? 'F' :

                                parentType === 'KAZAYAGI' ? 'K' :

                                parentType === 'YAPRAK' ? 'Y' : 'X';

            const parent_a1 = parentCell.geometry.points[`${parentPrefix}-a1`];



            if (!parent_a1) continue;



            // Parent'ın a1'ini world koordinatına çevir

            const cos1 = Math.cos(parentCellPos.rotation);

            const sin1 = Math.sin(parentCellPos.rotation);

            const a1World = {

                x: parentCellPos.x + (parent_a1.x * cos1 - parent_a1.y * sin1),

                y: parentCellPos.y + (parent_a1.x * sin1 + parent_a1.y * cos1)

            };



            // a1World'i child hücresinin local frame'ine çevir

            const cos2 = Math.cos(childCellPos.rotation);

            const sin2 = Math.sin(childCellPos.rotation);



            // World'den local'e dönüşüm (ters rotation)

            const dx = a1World.x - childCellPos.x;

            const dy = a1World.y - childCellPos.y;

            const c6Local = {

                x: dx * cos2 + dy * sin2,      // Ters rotation

                y: -dx * sin2 + dy * cos2

            };



            // Child hücresinin geometrisinde c6'yı override et

            if (childCell.geometry.setC6Override) {

                childCell.geometry.setC6Override(c6Local.x, c6Local.y);



                // ✅ Hücre wrapper'ın vertices cache'ini güncelle

                const newCellGeometry = childCell.geometry.createThreeGeometry();

                const newVertices = Array.from(newCellGeometry.attributes.position.array);

                const newIndices = Array.from(newCellGeometry.index.array);



                // Cache'i güncelle

                const oldVertices = childCell.getVertices();

                const oldIndices = childCell.getIndices();

                oldVertices.length = 0;

                oldIndices.length = 0;

                oldVertices.push(...newVertices);

                oldIndices.push(...newIndices);



                alignedCount++;



                if (i === 0) { // İlk hücre için debug

                    console.log(`\n🎯 ${cellName} ALIGNMENT:`);

                    console.log(`   Parent(L${parentLayerNum}).a1 world: (${a1World.x.toFixed(2)}, ${a1World.y.toFixed(2)})`);

                    console.log(`   Child(L${childLayerNum}) pos: (${childCellPos.x.toFixed(2)}, ${childCellPos.y.toFixed(2)})`);

                    console.log(`   Child.c6 YENİ lokal: (${c6Local.x.toFixed(2)}, ${c6Local.y.toFixed(2)})`);

                    console.log(`   ✅ Vertices cache güncellendi: ${newVertices.length/3} vertices`);

                }

            } else {

                console.warn(`⚠️ ${cellName}: setC6Override metodu yok (${childCell.type})`);

            }

        }



        console.log(`✅ Layer ${childLayerNum} → Layer ${parentLayerNum}: ${alignedCount} hücre hizalandı (c6→a1)`);



        // 🔄 Ara hücreleri (Kazayağı) komşu hücrelerin c6'larına göre güncelle

        this.updateInterCellsAfterAlignment(childLayerNum);

    }



    /**

     * 🔄 Ara hücreleri (Kazayağı) komşu ana hücrelerin (Yaprak) c6 noktalarına göre güncelle

     * @param {number} layerNum - Katman numarası

     */

    updateInterCellsAfterAlignment(layerNum) {

        const layer = this.layers[layerNum];

        if (!layer || !layer.geometry) return;



        const geo = layer.geometry;

        let updatedCount = 0;



        for (let i = 0; i < geo.totalCells; i++) {

            const cellName = `cell${i + 1}`;

            const cell = geo.cells[cellName];

            const cellPos = geo.cellPositions[cellName];



            if (!cell || !cellPos || !cell.geometry) continue;



            // Sadece ara hücreleri güncelle (KAZAYAGI veya FITIL)

            if (cell.type !== 'KAZAYAGI' && cell.type !== 'FITIL') continue;



            // Komşu hücreleri bul (cellMultiplier=2 için: çift indexler ana, tek indexler ara)

            const leftNeighborIndex = i - 1 < 0 ? geo.totalCells - 1 : i - 1;

            const rightNeighborIndex = (i + 1) % geo.totalCells;



            const leftNeighborName = `cell${leftNeighborIndex + 1}`;

            const rightNeighborName = `cell${rightNeighborIndex + 1}`;



            const leftCell = geo.cells[leftNeighborName];

            const leftCellPos = geo.cellPositions[leftNeighborName];

            const rightCell = geo.cells[rightNeighborName];

            const rightCellPos = geo.cellPositions[rightNeighborName];



            if (!leftCell || !leftCellPos || !rightCell || !rightCellPos) continue;

            if (!leftCell.geometry || !rightCell.geometry) continue;



            // Sol ve sağ komşuların c6 noktalarını al

            const leftType = leftCell.type || 'UNKNOWN';

            const leftPrefix = leftType === 'YAPRAK' ? 'Y' : leftType === 'BADEM' ? 'B' : 'F';

            const rightType = rightCell.type || 'UNKNOWN';

            const rightPrefix = rightType === 'YAPRAK' ? 'Y' : rightType === 'BADEM' ? 'B' : 'F';



            const leftC6 = leftCell.geometry.points[`${leftPrefix}-c6`];

            const rightC6 = rightCell.geometry.points[`${rightPrefix}-c6`];



            if (!leftC6 || !rightC6) continue;



            // Komşuların c6 noktalarını world koordinatına çevir

            const cosL = Math.cos(leftCellPos.rotation);

            const sinL = Math.sin(leftCellPos.rotation);

            const leftC6World = {

                x: leftCellPos.x + (leftC6.x * cosL - leftC6.y * sinL),

                y: leftCellPos.y + (leftC6.x * sinL + leftC6.y * cosL)

            };



            const cosR = Math.cos(rightCellPos.rotation);

            const sinR = Math.sin(rightCellPos.rotation);

            const rightC6World = {

                x: rightCellPos.x + (rightC6.x * cosR - rightC6.y * sinR),

                y: rightCellPos.y + (rightC6.x * sinR + rightC6.y * cosR)

            };



            // Kazayağı hücresinin local frame'ine çevir

            const cosK = Math.cos(cellPos.rotation);

            const sinK = Math.sin(cellPos.rotation);



            const dxL = leftC6World.x - cellPos.x;

            const dyL = leftC6World.y - cellPos.y;

            const leftC6Local = {

                x: dxL * cosK + dyL * sinK,

                y: -dxL * sinK + dyL * cosK

            };



            const dxR = rightC6World.x - cellPos.x;

            const dyR = rightC6World.y - cellPos.y;

            const rightC6Local = {

                x: dxR * cosK + dyR * sinK,

                y: -dxR * sinK + dyR * cosK

            };



            // Kazayağı geometrisini güncelle

            if (cell.geometry.setB1D1FromNeighbors) {

                cell.geometry.setB1D1FromNeighbors(leftC6Local, rightC6Local);



                // Vertices cache'ini güncelle

                const newCellGeometry = cell.geometry.createThreeGeometry();

                const newVertices = Array.from(newCellGeometry.attributes.position.array);

                const newIndices = Array.from(newCellGeometry.index.array);



                const oldVertices = cell.getVertices();

                const oldIndices = cell.getIndices();

                oldVertices.length = 0;

                oldIndices.length = 0;

                oldVertices.push(...newVertices);

                oldIndices.push(...newIndices);



                updatedCount++;



                if (updatedCount === 1) {

                    console.log(`\n🔄 ${cellName} (KAZAYAGI) komşu güncelleme:`);

                    console.log(`   Sol komşu (${leftNeighborName}): c6 world=(${leftC6World.x.toFixed(2)}, ${leftC6World.y.toFixed(2)})`);

                    console.log(`   Sağ komşu (${rightNeighborName}): c6 world=(${rightC6World.x.toFixed(2)}, ${rightC6World.y.toFixed(2)})`);

                    console.log(`   Kazayak d1 local: (${leftC6Local.x.toFixed(2)}, ${leftC6Local.y.toFixed(2)})`);

                    console.log(`   Kazayak b1 local: (${rightC6Local.x.toFixed(2)}, ${rightC6Local.y.toFixed(2)})`);

                }

            }

        }



        if (updatedCount > 0) {

            console.log(`✅ Layer ${layerNum}: ${updatedCount} ara hücre (Kazayağı) komşularına göre güncellendi`);

        }

    }



    /**

     * ❓ Bir katmanın child katmanları var mı kontrol et

     * @param {number} parentLayerNum - Parent katman numarası

     * @returns {boolean} - Child katman varsa true

     */

    hasChildLayers(parentLayerNum) {

        for (const layerNum in this.layers) {

            const layer = this.layers[layerNum];

            if (layer && layer.parentLayer === parentLayerNum) {

                return true;

            }

        }

        return false;

    }



    /**

     * 🔄 Bir parent katmanın tüm alt katmanlarını yeniden hizala

     * Parent katmanın geometrisi değiştiğinde (innerRadius, outerRadius vs.) kullanılır

     * @param {number} parentLayerNum - Parent katman numarası

     */

    realignAllChildLayers(parentLayerNum) {

        console.log(`\n🔄 Layer ${parentLayerNum} değişti - tüm alt katmanlar yeniden hizalanıyor...`);



        // Bu parent'a bağlı tüm child katmanları bul

        const childLayers = [];

        for (const layerNum in this.layers) {

            const num = parseInt(layerNum);

            const layer = this.layers[num];



            // Parent'ın child'ı ise ekle

            if (layer && layer.parentLayer === parentLayerNum) {

                childLayers.push(num);

            }

        }



        if (childLayers.length === 0) {

            console.log(`   ℹ️ Layer ${parentLayerNum}'ın child katmanı yok`);

            return;

        }



        console.log(`   📋 ${childLayers.length} child katman bulundu: ${childLayers.join(', ')}`);



        // Her child katmanı için alignment yap

        for (const childLayerNum of childLayers) {

            this.alignChildToParentLayer(childLayerNum, parentLayerNum);



            // Bu child'ın da child'ları varsa onları da realign et (recursive)

            this.realignAllChildLayers(childLayerNum);

        }



        // Tüm katmanları yeniden render et

        this.renderAllLayers();



        console.log(`✅ Layer ${parentLayerNum} ve tüm alt katmanları yeniden hizalandı\n`);

    }



    /**

     * 🔍 DEBUG: Layer 1 a1 ve Layer 2 c6 alignment görselleştirmesi

     * Her hücre çifti için Layer1.a1 ve Layer2.c6'yı aynı renk küre çifti ile göster

     */



    animate() {

        requestAnimationFrame(() => this.animate());



        this.controls.update();

        this.renderer.render(this.scene, this.camera);



        // 🖼️ PIP render

        if (this.showPip && this.pipRenderer) {

            this.pipRenderer.render(this.scene, this.pipCamera);

        }

    }

}



// Initialize when page loads

window.addEventListener('DOMContentLoaded', () => {

    const viewer = new PuskulViewer();

    console.log('🚀 Püskül 3D Viewer başlatıldı!');



    // Make viewer globally accessible for debugging

    window.puskulViewer = viewer;

    // Paneli ilk katmanın değerleriyle güncelle
    const layer1 = viewer.layers[1];
    if (layer1) {
        // Gen sayısı
        const sidesSlider = document.getElementById('sides-slider');
        const sidesLabel = document.getElementById('sides-label');
        if (sidesSlider && sidesLabel) {
            sidesSlider.value = layer1.sides;
            sidesLabel.textContent = layer1.sides;
        }

        // İç ngon çapı
        const innerRadiusSlider = document.getElementById('inner-radius-slider');
        const innerRadiusLabel = document.getElementById('inner-radius-label');
        if (innerRadiusSlider && innerRadiusLabel) {
            innerRadiusSlider.value = layer1.innerRadius;
            innerRadiusLabel.textContent = layer1.innerRadius;
        }

        // Yükseklik
        const heightSlider = document.getElementById('height-slider');
        const hLabel = document.getElementById('h-label');
        if (heightSlider && hLabel) {
            heightSlider.value = viewer.H;
            hLabel.textContent = viewer.H;
        }

        // Sağ üst layer-info panelini güncelle
        const layerInfoSides = document.getElementById('layer-info-sides');
        if (layerInfoSides) {
            layerInfoSides.textContent = layer1.sides;
        }

        console.log('✅ Panel ilk katman değerleriyle güncellendi');
    }



    // 🔌 Cell Loader'ı başlat (global erişim için)

    window.cellLoader = new CellLoader(viewer);

    

    // 🔧 Cell Editor'ı başlat (global erişim için)

    if (typeof CellEditor !== 'undefined') {

        viewer.cellEditor = new CellEditor(viewer);

        viewer.cellEditor.setupEventListeners();

        window.cellEditor = viewer.cellEditor; // Debug için

        console.log('🔧 CellEditor başlatıldı');

    } else {

        console.warn('⚠️ CellEditor not loaded!');

    }

    // 🎯 Layer Transition'ı başlat

    if (typeof LayerTransition !== 'undefined') {

        viewer.layerTransition = new LayerTransition(viewer);

        window.layerTransition = viewer.layerTransition; // Debug için

        console.log('🎯 LayerTransition başlatıldı');

    } else {

        console.warn('⚠️ LayerTransition not loaded!');

    }

    // 🎨 UI Manager'ı başlat (Sağ panel, üst bar, gri mod)

    if (typeof UIManager !== 'undefined') {

        viewer.uiManager = new UIManager(viewer);

        viewer.uiManager.initialize();

        window.uiManager = viewer.uiManager; // Debug için

        console.log('🎨 UIManager başlatıldı');

    } else {

        console.warn('⚠️ UIManager not loaded!');

    }

    // 💾 Config Manager'ı başlat (Save/Load)

    if (typeof ConfigManager !== 'undefined') {

        viewer.configManager = new ConfigManager(viewer);

        window.configManager = viewer.configManager; // Debug için

        console.log('💾 ConfigManager başlatıldı');

    } else {

        console.warn('⚠️ ConfigManager not loaded!');

    }

    // 📤 Export Manager'ı başlat (STL/DXF)

    if (typeof ExportManager !== 'undefined') {

        viewer.exportManager = new ExportManager(viewer);

        window.exportManager = viewer.exportManager; // Debug için

        console.log('📤 ExportManager başlatıldı');

    } else {

        console.warn('⚠️ ExportManager not loaded!');

    }



    // 🎯 Otomatik hücre yükleme (eğer init sırasında flag set edildiyse)

    if (viewer.needsAutoLoad) {

        console.log('🎯 Starting auto-load...');

        console.log('🔍 BademGeometry available:', typeof BademGeometry !== 'undefined');

        console.log('🔍 FitilGeometry available:', typeof FitilGeometry !== 'undefined');



        // 🎨 İlk katman için özel ratio değerlerini ayarla

        const layer1 = viewer.layers[1];
        const isEdgePlacement = layer1.placement === 'edge';

        // Yerleşime göre hangi numaralar ana/ara hücre olduğunu belirle
        // Köşe: Ana=tek (1,3,5,7,9,11), Ara=çift (2,4,6,8,10,12)
        // Kenar: Ana=çift (2,4,6,8,10,12), Ara=tek (1,3,5,7,9,11)
        const anaStart = isEdgePlacement ? 2 : 1;
        const araStart = isEdgePlacement ? 1 : 2;

        // Fitil (ara hücre) parametreleri
        const fitilRatio1 = isEdgePlacement ? 0.035 : 0.12;
        const fitilRatio2 = isEdgePlacement ? 0.1 : 0.2;

        // Badem (ana hücre) parametreleri
        const bademRatio1 = isEdgePlacement ? 0.09 : 0.09;
        const bademRatio2 = isEdgePlacement ? 0.2 : 0.096;
        const bademRatio3 = 0.35;

        // Ara hücreler (FITIL)
        for (let i = araStart; i <= 12; i += 2) {

            viewer.cellCustomParams[`cell${i}`] = {

                ratio1: fitilRatio1,

                ratio2: fitilRatio2

            };

        }

        // Ana hücreler (BADEM)
        for (let i = anaStart; i <= 12; i += 2) {

            viewer.cellCustomParams[`cell${i}`] = {

                ratio1: bademRatio1,

                ratio2: bademRatio2,

                ratio3: bademRatio3

            };

        }

        console.log(`📐 İlk katman yerleşimi: ${layer1.placement}`);
        console.log(`  Ana hücreler (BADEM): ${isEdgePlacement ? 'çift numaralar' : 'tek numaralar'} - ratio1=${bademRatio1}, ratio2=${bademRatio2}, ratio3=${bademRatio3}`);
        console.log(`  Ara hücreler (FITIL): ${isEdgePlacement ? 'tek numaralar' : 'çift numaralar'} - ratio1=${fitilRatio1}, ratio2=${fitilRatio2}`);



        setTimeout(() => {

            window.cellLoader.loadAllCells(); // 🆕 YENİ SİSTEM: Tüm hücreleri otomatik tip atamasıyla yükle

        }, 200);

    }

});

