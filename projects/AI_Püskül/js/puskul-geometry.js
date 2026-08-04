/**
 * Püskül 3D Geometry Container
 * 4 farklı hücre tipini import edip birleştirerek püskül geometrisini oluşturur
 * 
 * Coordinate System:
 * - X (Kırmızı): Sağ/Sol
 * - Y (Yeşil): Ön/Arka
 * - Z (Mavi): Yukarı/Aşağı (Z-up system)
 */

class PuskulGeometry {
    constructor(M = 50, H = 100, sides = 4, placement = 'corner', outerRadius = 300, innerRadius = null, mainCellType = 'BADEM', interCellType = 'FITIL', cellMultiplier = 2, customOuterBoundary = null) {
        this.M = M; // Module size
        this.H = H; // Total height
        this.name = 'PÜSKÜL';

        // 🎯 PÜSKÜL PARAMETRELERİ (Tasarım Tercihleri)
        this.sides = Math.max(4, Math.min(8, sides)); // 4-8 gen arası
        this.placement = placement; // 'corner' (köşe) veya 'edge' (kenar)

        // 🆕 İKİ NGON SİSTEMİ
        this.outerRadius = outerRadius; // Dış ngon (Ana hücre c1'leri)
        this.innerRadius = innerRadius !== null ? innerRadius : outerRadius * (2/3); // İç ngon (TÜM a1'ler) - Varsayılan: 2/3 oranı

        // 🆕 CUSTOM OUTER BOUNDARY (Koordinat bazlı katman sistemi için)
        // Eğer bu parametre verilirse, outerRadius yerine bu boundary noktaları kullanılır
        this.customOuterBoundary = customOuterBoundary; // [{x, y, z, pointName, cellName, cellIndex}, ...]
        
        // 🆕 HÜCRE TİPİ SİSTEMİ (Otomatik Mod)
        this.mainCellType = mainCellType; // Ana hücre tipi (BADEM, YAPRAK, vb.)
        this.interCellType = interCellType; // Ara hücre tipi (FITIL, KAZAYAGI, YOK, vb.)
        
        // 🆕 HÜCRE ÇEŞİTLİLİĞİ
        this.cellMultiplier = Math.max(1, Math.min(3, cellMultiplier)); // 1-3 arası: sides × multiplier
        
        // 🎯 HÜCRE TİPLERİ (dinamik - sides × cellMultiplier)
        this.totalCells = this.calculateTotalCells(); // Ana + Ara hücreler
        this.cells = {};
        for (let i = 0; i < this.totalCells; i++) {
            this.cells[`cell${i + 1}`] = null;
        }
        
        // 🔗 Orijinal master noktaları sakla (snap için)
        this.originalMasterPoints = {};
        
        // 🎯 Pozisyonları hesapla
        this.cellPositions = this.calculateCellPositions();
        
        console.log('🎀 PuskulGeometry Container initialized');
        console.log(`📐 Sides: ${this.sides}, Placement: ${this.placement}, Multiplier: ${this.cellMultiplier}`);
        if (this.customOuterBoundary) {
            console.log(`🔷 Custom Outer Boundary: ${this.customOuterBoundary.length} points (coordinate-based layer system)`);
            console.log(`🔵 Inner Radius: ${this.innerRadius}`);
        } else {
            console.log(`🔵 Outer Radius: ${this.outerRadius}, Inner Radius: ${this.innerRadius}`);
        }
        console.log(`🎨 Cell Types: Main=${this.mainCellType}, Inter=${this.interCellType}`);
        console.log(`📦 Waiting for ${this.totalCells} cell geometries...`);
    }
    
    /**
     * 🔢 Toplam hücre sayısını hesapla
     * cellMultiplier: Her segment'teki hücre sayısı
     * multiplier=1: 1 ana per segment
     * multiplier=2: 1 ana + 1 ara per segment
     * multiplier=3: 2 ana + 2 ara per segment
     */
    calculateTotalCells() {
        // multiplier = 1 → Sadece ana hücreler
        if (this.cellMultiplier === 1) {
            return this.sides;
        }
        
        // multiplier > 1 ama ara hücre YOK → Sadece ana
        if (this.interCellType === 'YOK' || this.interCellType === 'NONE') {
            return this.sides;
        }
        
        // multiplier = 2 → sides × 2 (1 ana + 1 ara per segment)
        // multiplier = 3 → sides × 4 (2 ana + 2 ara per segment)
        if (this.cellMultiplier === 3) {
            return this.sides * 4; // Her segment: 2 ana + 2 ara
        }
        
        return this.sides * this.cellMultiplier; // multiplier = 2
    }
    
    /**
     * 🎯 Hücre pozisyonlarını hesapla (Ana ve Ara hücreler)
     * 🆕 YENİ SİSTEM: Her segment'te cellMultiplier kadar hücre
     * multiplier=1: 1 ana
     * multiplier=2: 1 ana + 1 ara
     * multiplier=3: 2 ana + 2 ara
     * 🔷 CUSTOM BOUNDARY: Eğer customOuterBoundary varsa, outer noktalar boundary'den alınır
     */
    calculateCellPositions() {
        const positions = {};

        // 🎯 a1 BAZLI SİSTEM: a1 innerRadius'ta, c1 outerRadius/customBoundary'de
        // Her hücre için gerçek depth ve rotation hesaplanır

        this.cellTypeMapping = {};
        let cellIndex = 0;

        let cellsPerSegment = 1;
        if (this.cellMultiplier === 2) cellsPerSegment = 2;
        if (this.cellMultiplier === 3) cellsPerSegment = 4;

        // 🔷 Custom boundary varsa hazırla
        const useCustomBoundary = this.customOuterBoundary && this.customOuterBoundary.length > 0;

        for (let i = 0; i < this.sides; i++) {
            const segmentStartAngle = (2 * Math.PI * i) / this.sides - Math.PI / 2;
            const segmentEndAngle = (2 * Math.PI * (i + 1)) / this.sides - Math.PI / 2;

            let outer_c1, outer_c2;

            let boundaryTargetIndex = null;

            if (useCustomBoundary) {
                // 🔷 CUSTOM BOUNDARY: Parent katmanın a1 noktalarından outer noktaları al
                // customOuterBoundary = parent layer'ın her hücresinin a1'i (cell index sırasına göre)
                // Bu layer'ın hücreleri de aynı sırayla boundary noktalarını kullanmalı

                // BASIT MANTIK: Her segment'te kaç hücre var?
                // Segment i için ilk hücre: i * cellsPerSegment
                // Bu hücrenin outer noktası: boundary[i * cellsPerSegment]

                const firstCellInSegment = i * cellsPerSegment;
                const firstCellInNextSegment = ((i + 1) % this.sides) * cellsPerSegment;
                boundaryTargetIndex = firstCellInNextSegment;

                outer_c1 = this.customOuterBoundary[firstCellInSegment] || { x: 0, y: 0 };
                outer_c2 = this.customOuterBoundary[firstCellInNextSegment] || { x: 0, y: 0 };

                if (i === 0) {
                    console.log(`🔷 Boundary kullanımı: ${this.customOuterBoundary.length} nokta, ${this.sides} segment, ${cellsPerSegment} hücre/segment`);
                }
                console.log(`  Segment ${i}: cell ${firstCellInSegment} → cell ${firstCellInNextSegment}`);
            } else {
                // ✨ NORMAL: outerRadius kullan (daire/ngon)
                outer_c1 = { x: this.outerRadius * Math.cos(segmentStartAngle), y: this.outerRadius * Math.sin(segmentStartAngle) };
                outer_c2 = { x: this.outerRadius * Math.cos(segmentEndAngle), y: this.outerRadius * Math.sin(segmentEndAngle) };
            }

            // İç ngon her zaman innerRadius kullanır
            const inner_c1 = { x: this.innerRadius * Math.cos(segmentStartAngle), y: this.innerRadius * Math.sin(segmentStartAngle) };
            const inner_c2 = { x: this.innerRadius * Math.cos(segmentEndAngle), y: this.innerRadius * Math.sin(segmentEndAngle) };
            
            for (let j = 0; j < cellsPerSegment; j++) {
                cellIndex++;
                const cellName = `cell${cellIndex}`;
                
                let isMain = true;
                if (this.placement === 'corner') {
                    if (this.cellMultiplier === 2) isMain = (j === 0);
                    else if (this.cellMultiplier === 3) isMain = (j % 2 === 0);
                } else { // edge
                    if (this.cellMultiplier === 1) isMain = true;
                    else if (this.cellMultiplier === 2) isMain = (j === 1);
                    else if (this.cellMultiplier === 3) isMain = (j % 2 === 1);
                }

                let t = j / cellsPerSegment;
                if (this.placement === 'corner') {
                    if (this.cellMultiplier === 1 || (this.cellMultiplier === 2 && j === 0)) t = 0;
                } else { // edge
                    if (this.cellMultiplier === 1) t = 0.5;
                    else if (this.cellMultiplier === 2 && j === 0) t = 0;
                }
                
                const cellType = isMain ? this.mainCellType : this.interCellType;
                
                // Normal: a1=inner, c1=outer (tüm hücreler için)
                const a1_target = {
                    x: inner_c1.x + (inner_c2.x - inner_c1.x) * t,
                    y: inner_c1.y + (inner_c2.y - inner_c1.y) * t
                };
                const c1_target = {
                    x: outer_c1.x + (outer_c2.x - outer_c1.x) * t,
                    y: outer_c1.y + (outer_c2.y - outer_c1.y) * t
                };
                
                const dx = c1_target.x - a1_target.x;
                const dy = c1_target.y - a1_target.y;
                const cellDepth = Math.sqrt(dx*dx + dy*dy);
                const rotation = Math.atan2(dy, dx) + Math.PI / 2;
                
                const x = a1_target.x;
                const y = a1_target.y;
                
                // 🐛 DEBUG: Rotation debug (gerekirse aktif edin)
                // console.log(`🔄 ${cellName} (${cellType}): rotation=${(rotation * 180 / Math.PI).toFixed(1)}°, placement=${this.placement}, isMain=${isMain}, t=${t.toFixed(3)}`);
                
                positions[cellName] = { 
                    x, y, z: 0, 
                    rotation,
                    type: isMain ? 'main' : 'inter',
                    depth: cellDepth
                };
                
                this.cellTypeMapping[cellName] = cellType;

                // 🔷 CUSTOM BOUNDARY: Her hücrenin c6'sını parent katmanın karşılık gelen hücresinin a1'ine eşle
                if (useCustomBoundary) {
                    // cellIndex 1'den başlıyor, boundary array 0'dan başlıyor
                    const boundaryIndex = cellIndex - 1;

                    if (cellName === 'cell2') {
                        console.log(`\n🔍 CELL2 BOUNDARY CHECK:`);
                        console.log(`   cellIndex=${cellIndex}, boundaryIndex=${boundaryIndex}`);
                        console.log(`   customOuterBoundary.length=${this.customOuterBoundary.length}`);
                    }

                    if (boundaryIndex < this.customOuterBoundary.length) {
                        const boundaryPoint = this.customOuterBoundary[boundaryIndex];

                        if (cellName === 'cell2') {
                            console.log(`   boundaryPoint:`, boundaryPoint);
                        }

                        if (boundaryPoint) {
                            positions[cellName].c6TargetWorld = {
                                x: boundaryPoint.x,
                                y: boundaryPoint.y,
                                z: boundaryPoint.z ?? 0,
                                boundaryPointName: boundaryPoint.pointName || null,
                                boundaryCellName: boundaryPoint.cellName || null,
                                boundaryCellIndex: boundaryPoint.cellIndex ?? boundaryIndex
                            };

                            // 🎯 c6→a1 ALIGNMENT: Hücre pozisyonunu c6'nın boundary noktasına denk gelecek şekilde ayarla
                            // c6'nın lokal koordinatları: {x: 0, y: -M, z: ...} (c1 ile aynı x,y)
                            // a1'in lokal koordinatları: {x: 0, y: 0, z: 0}
                            // Offset: c6'dan a1'e gitmek için +M Y offseti gerekiyor

                            const c6LocalX = 0;
                            const c6LocalY = -cellDepth; // c6, c1 ile aynı Y'de (lokal -M, yani -cellDepth)

                            // Rotation uygula (hücrenin local frame'inden world frame'e)
                            const cos = Math.cos(rotation);
                            const sin = Math.sin(rotation);
                            const c6WorldOffsetX = c6LocalX * cos - c6LocalY * sin;
                            const c6WorldOffsetY = c6LocalX * sin + c6LocalY * cos;

                            // Yeni hücre pozisyonu: boundary point (c6'nın hedefi) - c6'nın lokal offset'i
                            positions[cellName].x = boundaryPoint.x - c6WorldOffsetX;
                            positions[cellName].y = boundaryPoint.y - c6WorldOffsetY;

                            if (cellName === 'cell2') {
                                console.log(`🎯 DEBUG cell2 ALIGNMENT:`);
                                console.log(`   Boundary Point (L1.a1): x=${boundaryPoint.x.toFixed(2)}, y=${boundaryPoint.y.toFixed(2)}`);
                                console.log(`   c6 lokal: x=${c6LocalX.toFixed(2)}, y=${c6LocalY.toFixed(2)} (cellDepth=${cellDepth.toFixed(2)})`);
                                console.log(`   Rotation: ${(rotation * 180 / Math.PI).toFixed(1)}°, cos=${cos.toFixed(3)}, sin=${sin.toFixed(3)}`);
                                console.log(`   c6 world offset: x=${c6WorldOffsetX.toFixed(2)}, y=${c6WorldOffsetY.toFixed(2)}`);
                                console.log(`   Yeni hücre pozisyonu: x=${positions[cellName].x.toFixed(2)}, y=${positions[cellName].y.toFixed(2)}`);
                            }

                            console.log(`🔷 ${cellName} (${cellType}) c6 → boundary[${boundaryIndex}] (${boundaryPoint.cellName}.${boundaryPoint.pointName || 'a1'}) - Pozisyon düzeltildi: (${positions[cellName].x.toFixed(2)}, ${positions[cellName].y.toFixed(2)})`);
                        } else {
                            console.warn(`⚠️ ${cellName}: Boundary noktası null (index ${boundaryIndex})`);
                        }
                    } else {
                        console.warn(`⚠️ ${cellName}: Boundary index aşımı (${boundaryIndex} >= ${this.customOuterBoundary.length})`);
                    }
                }
            }
        }
        
        let mainCount = 0, interCount = 0;
        Object.values(this.cellTypeMapping).forEach(type => {
            if (type === this.mainCellType) mainCount++;
            else interCount++;
        });
        
        console.log(`📍 ${this.totalCells} hücre pozisyonu hesaplandı (${mainCount} ana + ${interCount} ara)`);
        console.log(`✅ a1 bazlı sistem: a1'ler innerRadius=${this.innerRadius} üzerinde sabitlendi`);
        
        return positions;
    }
    
    /**
     * 🔄 Tasarım parametrelerini güncelle
     */
    updateDesign(sides, placement, outerRadius = null, innerRadius = null, enableSnap = false, snapThreshold = 5, cellMultiplier = null) {
        const oldSides = this.sides;
        const oldTotalCells = this.totalCells;
        
        this.sides = Math.max(4, Math.min(8, sides));
        
        if (cellMultiplier !== null) {
            this.cellMultiplier = Math.max(1, Math.min(3, cellMultiplier));
        }
        
        this.totalCells = this.calculateTotalCells(); // Yeniden hesapla
        this.placement = placement;
        
        if (outerRadius !== null) {
            this.outerRadius = outerRadius;
        }
        if (innerRadius !== null) {
            this.innerRadius = innerRadius;
        } else {
            // innerRadius belirtilmemişse, outerRadius'un 2/3'ü olarak ayarla
            this.innerRadius = this.outerRadius * (2/3);
        }
        
        // Hücre sayısı değiştiyse, cells dictionary'yi yeniden oluştur
        if (oldTotalCells !== this.totalCells) {
            const oldCells = { ...this.cells };
            this.cells = {};
            
            for (let i = 0; i < this.totalCells; i++) {
                const cellName = `cell${i + 1}`;
                // Eski hücreyi koru (varsa)
                this.cells[cellName] = oldCells[cellName] || null;
            }
        }
        
        // Pozisyonları yeniden hesapla
        this.cellPositions = this.calculateCellPositions();
        
        // 🔗 Snap durumuna göre geometri ayarla
        if (enableSnap) {
            // Snap AÇIK: Kademeli deformasyon uygula
            this.applySnap(snapThreshold);
        } else {
            // Snap KAPALI: Orijinal geometrilere dön
            this.restoreOriginalGeometry();
        }
        
        console.log(`🔄 Design updated: ${this.sides} sides, ${this.placement} placement, outer: ${this.outerRadius}, inner: ${this.innerRadius}, snap: ${enableSnap}`);
        
        return this.createThreeGeometry();
    }
    
    /**
     * 🔗 Yan tutunmayı uygula (GEOMETRİ DEFORMASYONU ile - Kademeli)
     * 🆕 YENİ KURALLAR:
     * 1. Badem.c1 SABİT - Fitil ona doğru gelir
     * 2. Badem-Badem: Her iki nokta da ortaya doğru
     * 3. Fitil.a1: İki Badem'in b1/d1'i ona doğru + Fitil.a1 de ortaya
     * 4. 🆕 Ara hücre varsa: Otomatik TAM snap (snapStrength = 1.0)
     */
    applySnap(threshold) {
        // 🆕 ARA HÜCRE VARSA: Otomatik tam snap
        const hasInterCells = (this.interCellType !== 'YOK' && this.interCellType !== 'NONE');
        
        let snapStrength;
        if (hasInterCells) {
            snapStrength = 1.0; // Tam snap (ara hücre varsa)
            console.log(`🔗 Applying FULL snap (ara hücre mevcut, auto-snap aktif)`);
        } else {
        const maxThreshold = 20; // Max threshold değeri
            snapStrength = threshold / maxThreshold; // 0-1 arası snap gücü (ayarlanabilir)
            console.log(`🔗 Applying PROGRESSIVE snap with threshold: ${threshold} (${(snapStrength*100).toFixed(0)}%)`);
        }
        
        // 🎯 AŞAMA 1: Normal yan bağlantılar (b1-d1 veya c1-b1/d1)
        for (let i = 0; i < this.totalCells; i++) {
            const currentCell = `cell${i + 1}`;
            const nextCell = `cell${((i + 1) % this.totalCells) + 1}`;
            
            const pos1 = this.cellPositions[currentCell];
            const pos2 = this.cellPositions[nextCell];
            const cell1 = this.cells[currentCell];
            const cell2 = this.cells[nextCell];
            
            if (!pos1 || !pos2 || !cell1 || !cell2) continue;
            
            // Orijinal master noktaları al
            const orig1 = this.originalMasterPoints[currentCell];
            const orig2 = this.originalMasterPoints[nextCell];
            
            if (!orig1 || !orig2) continue;
            
            // 🎯 Hücre tiplerini kontrol et
            const prefix1 = orig1.prefix || 'B';
            const prefix2 = orig2.prefix || 'B';
            
            let point1_name, point2_name;
            let point1_data, point2_data;
            let isFixedConnection = false; // Badem.c1 sabit mi?
            
            // 🔗 FİTİL/KAZAYAĞI-BADEM BAĞLANMA KURALLARI
            // Kazayağı (K) da Fitil (F) gibi davranır
            const isFitilOrKazayak1 = (prefix1 === 'F' || prefix1 === 'K');
            const isFitilOrKazayak2 = (prefix2 === 'F' || prefix2 === 'K');
            
            if (isFitilOrKazayak1 && !isFitilOrKazayak2) {
                // Cell1 Fitil/Kazayağı, Cell2 Badem/Yaprak: Fitil.b1 → Badem.c1 (SABİT)
                point1_name = 'b1';
                point2_name = 'c1';
                point1_data = orig1.b1;
                point2_data = orig2.c1;
                isFixedConnection = true; // c1 sabit!
            } else if (!isFitilOrKazayak1 && isFitilOrKazayak2) {
                // Cell1 Badem/Yaprak, Cell2 Fitil/Kazayağı: Badem.c1 (SABİT) ← Fitil.d1
                point1_name = 'c1';
                point2_name = 'd1';
                point1_data = orig1.c1;
                point2_data = orig2.d1;
                isFixedConnection = true; // c1 sabit!
            } else {
                // Normal (Badem-Badem vb.): Cell1.b1 ↔ Cell2.d1
                point1_name = 'b1';
                point2_name = 'd1';
                point1_data = orig1.b1;
                point2_data = orig2.d1;
                isFixedConnection = false; // İkisi de hareket eder
            }
            
            // Orijinal point1 world pozisyonu
            const cos1 = Math.cos(pos1.rotation);
            const sin1 = Math.sin(pos1.rotation);
            const point1_orig_world_x = pos1.x + (point1_data.x * cos1 - point1_data.y * sin1);
            const point1_orig_world_y = pos1.y + (point1_data.x * sin1 + point1_data.y * cos1);
            
            // Orijinal point2 world pozisyonu
            const cos2 = Math.cos(pos2.rotation);
            const sin2 = Math.sin(pos2.rotation);
            const point2_orig_world_x = pos2.x + (point2_data.x * cos2 - point2_data.y * sin2);
            const point2_orig_world_y = pos2.y + (point2_data.x * sin2 + point2_data.y * cos2);
            
            // Gap hesapla
            const gap = Math.sqrt(
                (point1_orig_world_x - point2_orig_world_x) ** 2 + 
                (point1_orig_world_y - point2_orig_world_y) ** 2
            );
            
            // 🎯 Snap hedef noktası
            let snapX, snapY;
            
            if (isFixedConnection) {
                // 🔒 Badem.c1 SABİT - Fitil/Kazayağı ona doğru gelir
                if (isFitilOrKazayak1) {
                    // Fitil/Kazayağı solda, Badem sağda: Hedef = Badem.c1
                    snapX = point2_orig_world_x;
                    snapY = point2_orig_world_y;
                } else {
                    // Badem solda, Fitil/Kazayağı sağda: Hedef = Badem.c1
                    snapX = point1_orig_world_x;
                    snapY = point1_orig_world_y;
                }
            } else {
                // Normal: Orta nokta
                snapX = (point1_orig_world_x + point2_orig_world_x) / 2;
                snapY = (point1_orig_world_y + point2_orig_world_y) / 2;
            }
            
            // 🎚️ Kademeli interpolation
            let point1_new_world_x, point1_new_world_y;
            let point2_new_world_x, point2_new_world_y;
            
            if (isFixedConnection) {
                // 🔒 Sabit bağlantı: Sadece Fitil/Kazayağı noktası hareket eder
                if (isFitilOrKazayak1) {
                    // Fitil/Kazayağı.b1 hareket eder, Badem.c1 sabit
                    point1_new_world_x = point1_orig_world_x + (snapX - point1_orig_world_x) * snapStrength;
                    point1_new_world_y = point1_orig_world_y + (snapY - point1_orig_world_y) * snapStrength;
                    point2_new_world_x = point2_orig_world_x; // Sabit
                    point2_new_world_y = point2_orig_world_y; // Sabit
                } else {
                    // Badem.c1 sabit, Fitil/Kazayağı.d1 hareket eder
                    point1_new_world_x = point1_orig_world_x; // Sabit
                    point1_new_world_y = point1_orig_world_y; // Sabit
                    point2_new_world_x = point2_orig_world_x + (snapX - point2_orig_world_x) * snapStrength;
                    point2_new_world_y = point2_orig_world_y + (snapY - point2_orig_world_y) * snapStrength;
                }
            } else {
                // Normal: Her iki nokta da ortaya doğru
                point1_new_world_x = point1_orig_world_x + (snapX - point1_orig_world_x) * snapStrength;
                point1_new_world_y = point1_orig_world_y + (snapY - point1_orig_world_y) * snapStrength;
                point2_new_world_x = point2_orig_world_x + (snapX - point2_orig_world_x) * snapStrength;
                point2_new_world_y = point2_orig_world_y + (snapY - point2_orig_world_y) * snapStrength;
            }
            
            // Local'e çevir - point1
            const point1_local_x = point1_new_world_x - pos1.x;
            const point1_local_y = point1_new_world_y - pos1.y;
            const point1_geom_x = point1_local_x * cos1 + point1_local_y * sin1;
            const point1_geom_y = -point1_local_x * sin1 + point1_local_y * cos1;
            
            // Local'e çevir - point2
            const point2_local_x = point2_new_world_x - pos2.x;
            const point2_local_y = point2_new_world_y - pos2.y;
            const point2_geom_x = point2_local_x * cos2 + point2_local_y * sin2;
            const point2_geom_y = -point2_local_x * sin2 + point2_local_y * cos2;
            
            // Geometrileri güncelle
            if (cell1.updateMasterPoint) {
                cell1.updateMasterPoint(`${prefix1}-${point1_name}`, point1_geom_x, point1_geom_y);
            }
            if (cell2.updateMasterPoint) {
                cell2.updateMasterPoint(`${prefix2}-${point2_name}`, point2_geom_x, point2_geom_y);
            }
            
            const newGap = gap * (1 - snapStrength);
            const fixedMarker = isFixedConnection ? ' 🔒' : '';
            console.log(`  🔗 SNAP ${(snapStrength*100).toFixed(0)}%: Cell${i+1}.${point1_name} ↔ Cell${((i+1)%this.totalCells)+1}.${point2_name}${fixedMarker} (gap: ${gap.toFixed(2)} → ${newGap.toFixed(2)})`);
        }
        
        // 🎯 AŞAMA 2: Fitil.a1 üçlü snap (Badem1.b1 ← Fitil.a1 → Badem2.d1)
        for (let i = 0; i < this.totalCells; i++) {
            const currentCell = `cell${i + 1}`;
            const prevCell = `cell${((i - 1 + this.totalCells) % this.totalCells) + 1}`;
            const nextCell = `cell${((i + 1) % this.totalCells) + 1}`;
            
            const cell_current = this.cells[currentCell];
            const cell_prev = this.cells[prevCell];
            const cell_next = this.cells[nextCell];
            
            const pos_current = this.cellPositions[currentCell];
            const pos_prev = this.cellPositions[prevCell];
            const pos_next = this.cellPositions[nextCell];
            
            if (!cell_current || !cell_prev || !cell_next) continue;
            if (!pos_current || !pos_prev || !pos_next) continue;
            
            const orig_current = this.originalMasterPoints[currentCell];
            const orig_prev = this.originalMasterPoints[prevCell];
            const orig_next = this.originalMasterPoints[nextCell];
            
            if (!orig_current || !orig_prev || !orig_next) continue;
            
            // Sadece Fitil/Kazayağı için bu snap uygulanır
            const prefix_current = orig_current.prefix || 'B';
            const prefix_prev = orig_prev.prefix || 'B';
            const prefix_next = orig_next.prefix || 'B';
            
            const isFitilOrKazayakCurrent = (prefix_current === 'F' || prefix_current === 'K');
            const isFitilOrKazayakPrev = (prefix_prev === 'F' || prefix_prev === 'K');
            const isFitilOrKazayakNext = (prefix_next === 'F' || prefix_next === 'K');
            
            if (!isFitilOrKazayakCurrent) continue; // Sadece Fitil/Kazayağı için
            if (isFitilOrKazayakPrev || isFitilOrKazayakNext) continue; // Komşular Fitil/Kazayağı olmamalı
            
            // 🎯 Üçlü snap: Badem1.b1 ← Fitil.a1 → Badem2.d1
            
            // Fitil.a1 world pozisyonu
            const cos_current = Math.cos(pos_current.rotation);
            const sin_current = Math.sin(pos_current.rotation);
            const a1_world_x = pos_current.x + (orig_current.a1.x * cos_current - orig_current.a1.y * sin_current);
            const a1_world_y = pos_current.y + (orig_current.a1.x * sin_current + orig_current.a1.y * cos_current);
            
            // Badem1.b1 world pozisyonu (sol komşu)
            const cos_prev = Math.cos(pos_prev.rotation);
            const sin_prev = Math.sin(pos_prev.rotation);
            const b1_prev_world_x = pos_prev.x + (orig_prev.b1.x * cos_prev - orig_prev.b1.y * sin_prev);
            const b1_prev_world_y = pos_prev.y + (orig_prev.b1.x * sin_prev + orig_prev.b1.y * cos_prev);
            
            // Badem2.d1 world pozisyonu (sağ komşu)
            const cos_next = Math.cos(pos_next.rotation);
            const sin_next = Math.sin(pos_next.rotation);
            const d1_next_world_x = pos_next.x + (orig_next.d1.x * cos_next - orig_next.d1.y * sin_next);
            const d1_next_world_y = pos_next.y + (orig_next.d1.x * sin_next + orig_next.d1.y * cos_next);
            
            // 🎯 Ortak hedef: 3 noktanın ortalaması
            const snapX_triple = (a1_world_x + b1_prev_world_x + d1_next_world_x) / 3;
            const snapY_triple = (a1_world_y + b1_prev_world_y + d1_next_world_y) / 3;
            
            // Her nokta hedefe doğru hareket eder
            
            // Fitil.a1
            const a1_new_world_x = a1_world_x + (snapX_triple - a1_world_x) * snapStrength;
            const a1_new_world_y = a1_world_y + (snapY_triple - a1_world_y) * snapStrength;
            const a1_local_x = a1_new_world_x - pos_current.x;
            const a1_local_y = a1_new_world_y - pos_current.y;
            const a1_geom_x = a1_local_x * cos_current + a1_local_y * sin_current;
            const a1_geom_y = -a1_local_x * sin_current + a1_local_y * cos_current;
            
            // Badem1.b1
            const b1_prev_new_world_x = b1_prev_world_x + (snapX_triple - b1_prev_world_x) * snapStrength;
            const b1_prev_new_world_y = b1_prev_world_y + (snapY_triple - b1_prev_world_y) * snapStrength;
            const b1_prev_local_x = b1_prev_new_world_x - pos_prev.x;
            const b1_prev_local_y = b1_prev_new_world_y - pos_prev.y;
            const b1_prev_geom_x = b1_prev_local_x * cos_prev + b1_prev_local_y * sin_prev;
            const b1_prev_geom_y = -b1_prev_local_x * sin_prev + b1_prev_local_y * cos_prev;
            
            // Badem2.d1
            const d1_next_new_world_x = d1_next_world_x + (snapX_triple - d1_next_world_x) * snapStrength;
            const d1_next_new_world_y = d1_next_world_y + (snapY_triple - d1_next_world_y) * snapStrength;
            const d1_next_local_x = d1_next_new_world_x - pos_next.x;
            const d1_next_local_y = d1_next_new_world_y - pos_next.y;
            const d1_next_geom_x = d1_next_local_x * cos_next + d1_next_local_y * sin_next;
            const d1_next_geom_y = -d1_next_local_x * sin_next + d1_next_local_y * cos_next;
            
            // Geometrileri güncelle
            if (cell_current.updateMasterPoint) {
                cell_current.updateMasterPoint(`${prefix_current}-a1`, a1_geom_x, a1_geom_y);
            }
            if (cell_prev.updateMasterPoint) {
                cell_prev.updateMasterPoint(`${prefix_prev}-b1`, b1_prev_geom_x, b1_prev_geom_y);
            }
            if (cell_next.updateMasterPoint) {
                cell_next.updateMasterPoint(`${prefix_next}-d1`, d1_next_geom_x, d1_next_geom_y);
            }
            
            console.log(`  🔗 ÜÇLÜ SNAP ${(snapStrength*100).toFixed(0)}%: ${prevCell}.b1 ← ${currentCell}.a1 → ${nextCell}.d1`);
        }
    }
    
    /**
     * 🔄 Orijinal geometriye dön (snap iptal)
     */
    restoreOriginalGeometry() {
        console.log('🔄 Restoring original geometry (snap OFF)');
        
        // Her hücre için
        for (let i = 0; i < this.totalCells; i++) {
            const cellName = `cell${i + 1}`;
            const cell = this.cells[cellName];
            const orig = this.originalMasterPoints[cellName];
            
            if (!cell || !orig) continue;
            
            // Tüm master noktaları orijinal değerlere geri al (prefix'e göre)
            const prefix = orig.prefix || 'B';
            
            if (cell.updateMasterPoint) {
                if (orig.a1) cell.updateMasterPoint(`${prefix}-a1`, orig.a1.x, orig.a1.y);
                if (orig.b1) cell.updateMasterPoint(`${prefix}-b1`, orig.b1.x, orig.b1.y);
                if (orig.c1) cell.updateMasterPoint(`${prefix}-c1`, orig.c1.x, orig.c1.y);
                if (orig.d1) cell.updateMasterPoint(`${prefix}-d1`, orig.d1.x, orig.d1.y);
            }
            
            console.log(`  🔄 ${cellName} restored to original`);
        }
    }
    
    /**
     * 🎨 Hücre tipini al (cellTypeMapping'den)
     * @param {string} cellName - Hücre adı (cell1, cell2, ...)
     * @returns {string} - Hücre tipi ('BADEM', 'FITIL', vb.)
     */
    getCellType(cellName) {
        return this.cellTypeMapping?.[cellName] || this.mainCellType;
    }
    
    /**
     * 🗺️ Tüm hücre tiplerini al
     * @returns {Object} - {cell1: 'BADEM', cell2: 'FITIL', ...}
     */
    getAllCellTypes() {
        return { ...this.cellTypeMapping };
    }
    
    /**
     * 🔌 Harici hücre geometrisini yükle
     * @param {string} cellName - Hücre adı (cell1, cell2, cell3, cell4)
     * @param {Object} cellGeometry - Hücre geometri objesi
     */
    loadCell(cellName, cellGeometry) {
        if (this.cells.hasOwnProperty(cellName)) {
            this.cells[cellName] = cellGeometry;
            
            // 🔗 Orijinal master noktaları sakla (tüm hücre tipleri için)
            if (cellGeometry.geometry && cellGeometry.geometry.masterPoints) {
                const masters = cellGeometry.geometry.masterPoints;
                
                // Hücre tipini belirle (B-, F-, Y-, Z- prefix'ine göre)
                const cellType = cellGeometry.type || 'BADEM'; // 'BADEM', 'FITIL', vb.
                let prefix = 'B'; // Varsayılan
                
                if (cellType === 'FITIL') prefix = 'F';
                else if (cellType === 'YAPRAK') prefix = 'Y';
                else if (cellType === 'KAZAYAGI') prefix = 'K';
                
                // Tüm master noktaları sakla (a1, b1, c1, d1)
                const a1Key = `${prefix}-a1`;
                const b1Key = `${prefix}-b1`;
                const c1Key = `${prefix}-c1`;
                const d1Key = `${prefix}-d1`;
                
                if (masters[a1Key] && masters[b1Key] && masters[c1Key] && masters[d1Key]) {
                    this.originalMasterPoints[cellName] = {
                        a1: { ...masters[a1Key] },
                        b1: { ...masters[b1Key] },
                        c1: { ...masters[c1Key] },
                        d1: { ...masters[d1Key] },
                        prefix: prefix  // Prefix'i de sakla
                    };
                    console.log(`✅ ${cellName} loaded (${cellType}, prefix: ${prefix})`);
                } else {
                    console.warn(`⚠️ ${cellName}: Master noktalar bulunamadı for prefix ${prefix}`);
                }
            }
            
            this.checkAllCellsLoaded();
        } else {
            console.error(`❌ Invalid cell name: ${cellName}`);
        }
    }
    
    /**
     * ✔️ Tüm hücrelerin yüklenip yüklenmediğini kontrol et
     */
    checkAllCellsLoaded() {
        const loadedCells = Object.values(this.cells).filter(cell => cell !== null).length;
        console.log(`📊 Loaded cells: ${loadedCells}/${this.totalCells}`);
        
        if (loadedCells === this.totalCells) {
            console.log('🎉 All cells loaded! Ready to create geometry.');
        }
    }
    
    /**
     * 🏗️ Birleştirilmiş Three.js geometrisini oluştur
     */
    createThreeGeometry() {
        // Tüm hücreler yüklü mü kontrol et
        const allLoaded = Object.values(this.cells).every(cell => cell !== null);
        
        if (!allLoaded) {
            console.warn('⚠️ Not all cells are loaded yet. Creating empty geometry.');
            
            // Boş ama geçerli bir geometri oluştur
            const emptyGeometry = new THREE.BufferGeometry();
            emptyGeometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
            emptyGeometry.setIndex([]);
            return emptyGeometry;
        }
        
        // 🎯 Birleştirilmiş geometri için arrays
        const combinedVertices = [];
        const combinedIndices = [];
        let vertexOffset = 0;
        
        // 🔄 Her hücreyi doğru pozisyonda birleştir
        Object.keys(this.cells).forEach((cellName, index) => {
            const cell = this.cells[cellName];
            const position = this.cellPositions[cellName];
            
            if (cell && cell.getVertices && cell.getIndices) {
                // Hücreden vertices ve indices al
                const vertices = cell.getVertices();
                const indices = cell.getIndices();
                
                // ✅ Z ALIGNMENT:
                // Hücre geometrileri içinde c6 zaten Z=0'a normalize ediliyor.
                // Bu nedenle burada ek bir Z offset uygulanmamalı.
                
                // Pozisyon ve rotasyon uygula
                for (let i = 0; i < vertices.length; i += 3) {
                    const x = vertices[i];
                    const y = vertices[i + 1];
                    const z = vertices[i + 2];
                    
                    // 1️⃣ Rotasyon uygula (Z ekseni etrafında)
                    const cos = Math.cos(position.rotation);
                    const sin = Math.sin(position.rotation);
                    const rotatedX = x * cos - y * sin;
                    const rotatedY = x * sin + y * cos;
                    
                    // 2️⃣ Pozisyon ekle (Z offset YOK - c6 zaten 0)
                    combinedVertices.push(
                        rotatedX + position.x,
                        rotatedY + position.y,
                        z + position.z
                    );
                }
                
                // Index'leri offset ile ekle
                for (let i = 0; i < indices.length; i++) {
                    combinedIndices.push(indices[i] + vertexOffset);
                }
                
                vertexOffset += vertices.length / 3;
            }
        });
        
        // 🎨 Three.js BufferGeometry oluştur
        const geometry = new THREE.BufferGeometry();
        
        if (combinedVertices.length > 0) {
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(combinedVertices, 3));
            geometry.setIndex(combinedIndices);
            geometry.computeVertexNormals();
        } else {
            // Hiç vertex yoksa boş ama geçerli geometri
            geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
            geometry.setIndex([]);
        }
        
        console.log('📐 Combined Geometry created:', {
            vertices: combinedVertices.length / 3,
            triangles: combinedIndices.length / 3,
            cells: this.totalCells
        });

        return geometry;
    }

    /**
     * 📊 Geometri istatistiklerini al
     */
    getStats() {
        const loadedCells = Object.values(this.cells).filter(cell => cell !== null).length;
        
        return {
            name: this.name,
            module: this.M,
            height: this.H,
            sides: this.sides,
            placement: this.placement,
            outerRadius: this.outerRadius,
            innerRadius: this.innerRadius,
            mainCellType: this.mainCellType,
            interCellType: this.interCellType,
            loadedCells: loadedCells,
            totalCells: this.totalCells,
            isReady: loadedCells === this.totalCells
        };
    }
    
    /**
     * 🎯 Hücre pozisyonunu güncelle
     */
    updateCellPosition(cellName, x, y, z, rotation) {
        if (this.cellPositions.hasOwnProperty(cellName)) {
            this.cellPositions[cellName] = { x, y, z, rotation };
            console.log(`📍 ${cellName} position updated:`, { x, y, z, rotation });
        }
    }
    
    /**
     * 🔄 Geometriyi güncelle (boyutlar değiştiğinde)
     */
    updateDimensions(M, H) {
        this.M = M;
        this.H = H;
        
        // Her hücrenin boyutunu güncelle
        Object.values(this.cells).forEach(cell => {
            if (cell && cell.updateDimensions) {
                cell.updateDimensions(M, H);
            }
        });
        
        return this.createThreeGeometry();
    }
    
    /**
     * 🌉 Komşu hücreleri döndür (circular neighbor system)
     * @param {number} cellIndex - Hücre indexi (0-based)
     * @returns {object} - {prev: prevCellName, next: nextCellName}
     */
    getNeighbors(cellIndex) {
        const totalCells = this.totalCells;
        const prevIndex = (cellIndex - 1 + totalCells) % totalCells;
        const nextIndex = (cellIndex + 1) % totalCells;
        
        return {
            prev: `cell${prevIndex + 1}`,
            next: `cell${nextIndex + 1}`
        };
    }
    
    /**
     * 🌉 İki komşu hücre arasında köprü yüzeyleri oluştur
     * Tüm Z seviyeleri için ortak noktalardan quad/triangle yüzeyler örer
     * @param {string} cellName1 - İlk hücre adı (örn: 'cell1')
     * @param {string} cellName2 - İkinci hücre adı (örn: 'cell2')
     * @returns {object} - {vertices: [], indices: []} - BufferGeometry için data
     */
    createBridgeSurface(cellName1, cellName2) {
        const cell1 = this.cells[cellName1];
        const cell2 = this.cells[cellName2];

        if (!cell1 || !cell2) {
            console.warn(`⚠️ Bridge: Hücreler bulunamadı (${cellName1}, ${cellName2})`);
            return null;
        }

        const geo1 = cell1.geometry;
        const geo2 = cell2.geometry;
        
        if (!geo1 || !geo2 || !geo1.points || !geo2.points) {
            console.warn(`⚠️ Bridge: Geometri bulunamadı (${cellName1}, ${cellName2})`);
            return null;
        }
        
        const pos1 = this.cellPositions[cellName1];
        const pos2 = this.cellPositions[cellName2];
        
        if (!pos1 || !pos2) {
            console.warn(`⚠️ Bridge: Pozisyon bulunamadı (${cellName1}, ${cellName2})`);
            return null;
        }
        
        // 🎯 Hücre tiplerini belirle
        const prefix1 = cell1.type === 'FITIL' ? 'F' : 
                       (cell1.type === 'KAZAYAGI' ? 'K' : 
                       (cell1.type === 'YAPRAK' ? 'Y' : 'B'));
        const prefix2 = cell2.type === 'FITIL' ? 'F' : 
                       (cell2.type === 'KAZAYAGI' ? 'K' : 
                       (cell2.type === 'YAPRAK' ? 'Y' : 'B'));
        
        // 🌉 Bağlantı noktalarını belirle (hangi noktalar komşu hücrelere bakar)
        // cell1'in SAĞ tarafı → cell2'nin SOL tarafı
        
        let points1 = []; // cell1'den cell2'ye bakan noktalar
        let points2 = []; // cell2'den cell1'e bakan noktalar
        
        // 🎯 Bağlantı mantığı (PUSKUL_KURALLARI.md'ye göre)
        // cell1.b1 (sağ) → cell2.d1 (sol) veya cell2.a1 (Fitil durumu)
        
        this.findBridgePoints(geo1, geo2, prefix1, prefix2, points1, points2);
        
        if (points1.length === 0 || points2.length === 0) {
            console.warn(`⚠️ Bridge: Bağlantı noktaları bulunamadı (${cellName1}→${cellName2})`);
            return null;
        }
        
        // 🎨 Yüzey oluştur (vertices + indices)
        const vertices = [];
        const indices = [];
        
        // World koordinatlarına dönüştür
        const cos1 = Math.cos(pos1.rotation);
        const sin1 = Math.sin(pos1.rotation);
        const cos2 = Math.cos(pos2.rotation);
        const sin2 = Math.sin(pos2.rotation);
        
        // points1'i vertices'e ekle
        points1.forEach(pt => {
            const worldX = pos1.x + (pt.x * cos1 - pt.y * sin1);
            const worldY = pos1.y + (pt.x * sin1 + pt.y * cos1);
            const worldZ = pt.z + pos1.z;
            vertices.push(worldX, worldY, worldZ);
        });
        
        // points2'yi vertices'e ekle
        points2.forEach(pt => {
            const worldX = pos2.x + (pt.x * cos2 - pt.y * sin2);
            const worldY = pos2.y + (pt.x * sin2 + pt.y * cos2);
            const worldZ = pt.z + pos2.z;
            vertices.push(worldX, worldY, worldZ);
        });
        
        // Quad'lar oluştur (farklı nokta sayısı destekli)
        const n1 = points1.length;
        const n2 = points2.length;
        
        if (n1 < 2 || n2 < 2) {
            console.warn(`⚠️ Yetersiz nokta: ${cellName1}(${n1}) → ${cellName2}(${n2})`);
            return null;
        }

        // En küçük nokta sayısı
        const minPoints = Math.min(n1, n2);

        // Ara hücre kontrolü (FITIL veya KAZAYAGI)
        const cell1IsIntermediate = (prefix1 === 'F' || prefix1 === 'K');

        // Quad mesh (Z seviyelerine göre bağla)
        // Sol taraf (Ana→Ara): Eski pattern
        // Sağ taraf (Ara→Ana): Yeni pattern
        for (let i = 0; i < minPoints - 1; i++) {
            const i1_bottom = i;
            const i1_top = i + 1;
            const i2_bottom = n1 + i;
            const i2_top = n1 + i + 1;

            if (cell1IsIntermediate) {
                // Sağ taraf (Ara→Ana): Yeni pattern
                // İlk triangle: i, n1+i, n1+i+1
                indices.push(i1_bottom, i2_bottom, i2_top);
                // İkinci triangle: i, n1+i+1, i+1
                indices.push(i1_bottom, i2_top, i1_top);
            } else {
                // Sol taraf (Ana→Ara veya Ana→Ana): Eski pattern
                // İlk triangle: bottom-left → top-left → bottom-right
                indices.push(i1_bottom, i1_top, i2_bottom);
                // İkinci triangle: top-left → top-right → bottom-right
                indices.push(i1_top, i2_top, i2_bottom);
            }
        }

        // Eğer nokta sayıları farklıysa, fazla noktaları son noktaya bağla
        if (n1 > n2) {
            // cell1'de fazla nokta var
            for (let i = n2 - 1; i < n1 - 1; i++) {
                const i1_bottom = i;
                const i1_top = i + 1;
                const i2_last = n1 + n2 - 1;  // cell2'nin son noktası

                if (cell1IsIntermediate) {
                    // Sağ taraf: i, n1+n2-1, i+1
                    indices.push(i1_bottom, i2_last, i1_top);
                } else {
                    // Sol taraf: bottom → top → last_point
                    indices.push(i1_bottom, i1_top, i2_last);
                }
            }
        } else if (n2 > n1) {
            // cell2'de fazla nokta var
            for (let i = n1 - 1; i < n2 - 1; i++) {
                const i1_last = n1 - 1;  // cell1'in son noktası
                const i2_bottom = n1 + i;
                const i2_top = n1 + i + 1;

                // Triangle: last_point → bottom → top
                indices.push(i1_last, i2_bottom, i2_top);
            }
        }
        
        return {
            vertices: vertices,
            indices: indices,
            pointCount1: n1,
            pointCount2: n2
        };
    }
    
    /**
     * 🔍 İki hücre arasındaki köprü noktalarını bul
     * Her Z seviyesinde hangi noktalar bağlanacak
     * @private
     */
    findBridgePoints(geo1, geo2, prefix1, prefix2, points1, points2) {
        // 🎯 Her hücrenin kenarlarındaki noktaları bul (SAĞ/SOL)

        // 🔍 Her iki hücre de ana hücre mi? (BADEM-BADEM veya YAPRAK-YAPRAK)
        const isMainCell1 = (prefix1 === 'B' || prefix1 === 'Y');
        const isMainCell2 = (prefix2 === 'B' || prefix2 === 'Y');
        const bothMainCells = isMainCell1 && isMainCell2;

        // cell1'in SAĞ kenarı (b noktaları)
        const rightPoints1 = this.extractEdgePoints(geo1, prefix1, 'right', bothMainCells);

        // cell2'nin SOL kenarı (d noktaları veya a noktası Fitil için)
        const leftPoints2 = this.extractEdgePoints(geo2, prefix2, 'left', bothMainCells);

        points1.push(...rightPoints1);
        points2.push(...leftPoints2);
    }
    
    /**
     * 🔍 Hücrenin bir kenarındaki tüm noktaları çıkar (tüm Z seviyeleri)
     * @param {object} geometry - Hücre geometrisi
     * @param {string} prefix - Hücre prefix'i (B, F, K, Y)
     * @param {string} side - 'right' veya 'left'
     * @returns {Array} - [{x, y, z, name}, ...] - Z seviyesine göre sıralı
     * @private
     */
    extractEdgePoints(geometry, prefix, side, bothMainCells = false) {
        const points = [];
        const pointNames = Object.keys(geometry.points);

        // Kenar harfi
        const targetLetter = side === 'right' ? 'b' : 'd';

        // Her nokta için kontrol
        pointNames.forEach(name => {
            const pt = geometry.points[name];
            let shouldInclude = false;

            // SAĞ KENAR (b noktaları)
            if (side === 'right') {
                if (name.startsWith(`${prefix}-b`)) {
                    // Ana hücre (B/Y): b1 dahil
                    const isMainCell = (prefix === 'B' || prefix === 'Y');
                    if (isMainCell) {
                        shouldInclude = true; // b1, b2, ..., b6
                    }
                    // Ara hücre (F/K): b1 hariç, b2'den başla
                    else if (name !== `${prefix}-b1`) {
                        shouldInclude = true; // b2, ..., b6
                    }
                }
            }

            // SOL KENAR (d noktaları)
            else if (side === 'left') {
                if (name.startsWith(`${prefix}-d`)) {
                    // Ana hücre (B/Y): d1 dahil
                    const isMainCell = (prefix === 'B' || prefix === 'Y');
                    if (isMainCell) {
                        shouldInclude = true; // d1, d2, ..., d6
                    } else {
                        // Ara hücre (F/K): d1 atla, d2'den başla
                        if (name !== `${prefix}-d1`) {
                            shouldInclude = true; // d2, d3, ..., d6
                        }
                    }
                }
            }

            // 🆕 Üst seviye için c6 noktası (sadece Badem-Badem ve Yaprak-Yaprak için)
            // Fitil/Kazayağı'nda c6'lar çok yakın, Badem/Yaprak'ta gerçek boşluk var
            if (name === `${prefix}-c6` && (prefix === 'B' || prefix === 'Y')) {
                shouldInclude = true;
            }

            // Noktayı ekle
            if (shouldInclude) {
                points.push({
                    x: pt.x,
                    y: pt.y,
                    z: pt.z,
                    name: name,  // Debug için
                    level: pt.level || 0
                });
            }
        });

        // Z seviyesine göre sırala (alt'tan üst'e: z1 < z2 < ... < z6)
        points.sort((a, b) => a.z - b.z);

        return points;
    }
    
    /**
     * 🌉 Tüm komşu hücreler arası köprü yüzeylerini oluştur ve geometri döndür
     * @returns {Array} - Her köprü için {geometry, color, cellName1, cellName2} objelerinden oluşan dizi
     */
    createAllBridgeSurfaces() {
        const bridgeGeometries = [];
        
        // 🎨 Her köprü için farklı renk (debug için)
        const colors = [
            0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff,
            0xff8800, 0x88ff00, 0x0088ff, 0xff0088, 0x8800ff, 0x00ff88
        ];
        
        for (let i = 0; i < this.totalCells; i++) {
            const cellName1 = `cell${i + 1}`;
            const neighbors = this.getNeighbors(i);
            const cellName2 = neighbors.next;
            
            const bridgeData = this.createBridgeSurface(cellName1, cellName2);
            
            if (bridgeData) {
                const type1 = this.cells[cellName1]?.type || '?';
                const type2 = this.cells[cellName2]?.type || '?';

                const bridgeVertices = [];
                const bridgeIndices = [];

                bridgeData.vertices.forEach(v => bridgeVertices.push(v));
                bridgeData.indices.forEach(idx => bridgeIndices.push(idx));

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(bridgeVertices, 3));
                geometry.setIndex(bridgeIndices);
                geometry.computeVertexNormals();

                const color = colors[i % colors.length];

                bridgeGeometries.push({
                    geometry: geometry,
                    color: color,
                    cellName1: cellName1,
                    cellName2: cellName2,
                    type1: type1,
                    type2: type2,
                    pointCount1: bridgeData.pointCount1,
                    pointCount2: bridgeData.pointCount2
                });

                // console.log(`🌉 Bridge ${i + 1}: ${cellName1}(${type1}, ${bridgeData.pointCount1}pts) → ${cellName2}(${type2}, ${bridgeData.pointCount2}pts) - Color: #${color.toString(16)}`);
            }
        }
        
        console.log(`✅ Toplam ${bridgeGeometries.length} köprü yüzeyi oluşturuldu`);
        
        return bridgeGeometries;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuskulGeometry;
} else {
    window.PuskulGeometry = PuskulGeometry;
}

