/**
 * Püskül Sonu 3D Geometry
 * Based on PNG image analysis with detailed point coordinates
 * 
 * Coordinate System:
 * - Plan (p) view: X, Y coordinates
 * - Front (f) view: X, Z coordinates
 * - Combined: Full 3D (X, Y, Z)
 */

class PuskulSonuGeometry {
    constructor(M = 1, H = 1, fillet = 9.0, puskulCenterX = 0, puskulCenterY = 0, topLayerPoints = null, startZ = 0, filletSegments = 16) {
        this.M = M; // Module size
        this.H = H; // Total height
        this.fillet = fillet; // 🎚️ Fillet değeri (0-200, max: H)
        this.filletSegments = filletSegments; // 🎚️ Fillet yay segment sayısı (1-32)
        this.puskulCenterX = puskulCenterX; // 🎯 Püskül merkez X koordinatı
        this.puskulCenterY = puskulCenterY; // 🎯 Püskül merkez Y koordinatı
        this.topLayerPoints = topLayerPoints || []; // 🎯 Üst katmanın a1, b1, d1 noktaları
        this.startZ = startZ; // 🎯 Z başlangıç pozisyonu (katmanın alt hizası)
        this.name = 'PUSKUL_SONU';

        // 🎯 4 ANA KONTROL NOKTASI (Master Points) - NORMALIZED (M=1)
        // Varsayılan: MODULE_SIZE = 50px ile uyumlu
        const ORIGINAL_DEPTH = 50.0;   // Derinlik (px) - MODULE_SIZE ile uyumlu
        const ORIGINAL_WIDTH = 50.0;   // Genişlik (b1-d1 arası, px)

        // GRID PLAN varsayılan değerler (NORMALIZED)
        let a1_y = 0.0;      // ARKA (Y=0)
        let b1_x = 0.5;      // SAĞ X (normalized)
        let b1_y = -0.24;    // SAĞ Y (normalized)
        let c1_y = -1.0;     // ÖN (Y=-1.0) - normalized
        let d1_x = -0.5;     // SOL X (normalized)
        let d1_y = -0.24;    // SOL Y (normalized)

        this.masterPoints = {
            'P-a1': { x: 0.0,   y: a1_y,  z: 0.0 },     // ARKA (iç kenar)
            'P-b1': { x: b1_x,  y: b1_y,  z: 0.0 },     // SAĞ
            'P-c1': { x: 0.0,   y: c1_y,  z: 0.0 },     // ÖN (dış kenar)
            'P-d1': { x: d1_x,  y: d1_y,  z: 0.0 }      // SOL
        };

        this.points = this.generatePoints();
        this.faces = this.generateFaces();
    }
    
    /**
     * 🎚️ Fillet değerini güncelle
     */
    updateFillet(newFillet) {
        this.fillet = newFillet;
        this.points = this.generatePoints();
        console.log(`🎚️ Fillet güncellendi: ${newFillet.toFixed(1)}`);
    }
    
    /**
     * 🎯 Püskül merkezini güncelle
     */
    updatePuskulCenter(x, y) {
        this.puskulCenterX = x;
        this.puskulCenterY = y;
        this.points = this.generatePoints();
        console.log(`🎯 Püskül merkezi güncellendi: (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }
    
    /**
     * 4 ana kontrol noktasını güncelle
     */
    updateMasterPoint(pointName, x, y) {
        if (this.masterPoints[pointName]) {
            this.masterPoints[pointName].x = x;
            this.masterPoints[pointName].y = y;
            // Z koordinatı hep 0 (taban seviye)
            this.masterPoints[pointName].z = 0.0;
            
            // Bütün noktaları yeniden hesapla
            this.points = this.generatePoints();
            
            console.log(`🎯 ${pointName} güncellendi:`, this.masterPoints[pointName]);
        }
    }

    /**
     * Generate all 3D points based on PNG analysis
     * 🎯 PARAMETRIK SISTEM: 4 ana kontrol noktası + bağımlı noktalar
     * Ana noktalar: P-a1, P-b1, P-c1, P-d1 (taban seviye, user editable)
     * Bağımlı noktalar: Otomatik hesaplanır
     */
    generatePoints() {
        // 4 ANA KONTROL NOKTASI (Master) - Kullanıcı tarafından düzenlenebilir
        const a1 = this.masterPoints['P-a1'];
        const b1 = this.masterPoints['P-b1'];
        const c1 = this.masterPoints['P-c1'];
        const d1 = this.masterPoints['P-d1'];

        // 🎯 Pm noktası: Püskül merkezi (x, y) + Y ekseninde +50 birim
        // Orijinal kodda: Pm = { x: a1.x, y: a1.y + 50, z: a1.z }
        // Bizim projede: Pm = püskül merkezi (x, y) + Y ekseninde +50 birim
        const Pm = {
            x: this.puskulCenterX,
            y: this.puskulCenterY + 50,  // +Y = 50 yönünde
            z: 0.0
        };

        // Nokta objelerini oluştur - Master Points + Pm
        const points = {
            // 🎯 4 ANA KONTROL NOKTASI (Master Points)
            'P-a1': { ...a1, level: 1, type: 'master', display: 'P-a1', editable: true },
            'P-b1': { ...b1, level: 1, type: 'master', display: 'P-b1', editable: true },
            'P-c1': { ...c1, level: 1, type: 'master', display: 'P-c1', editable: true },
            'P-d1': { ...d1, level: 1, type: 'master', display: 'P-d1', editable: true },
            // 🎯 Pm noktası (püskül merkezi)
            'P-Pm': { ...Pm, level: 1, type: 'reference', display: 'Pm', editable: false }
        };
        
        console.log('✅ Master Points:', Object.keys(points).length);
        
        return points;
    }

    /**
     * Generate faces (quad surfaces) connecting the points
     * L şeklinde yüzeyler: b1/a1/d1 → (aşağı H kadar) → (Pm noktasına)
     */
    generateFaces() {
        const faces = [];
        
        // L şeklinde yüzeyler oluşturulacak (loft yüzeyleri)
        // Bu yüzeyler createThreeGeometry'de oluşturulacak
        
        return faces;
    }

    /**
     * Create Three.js BufferGeometry
     * L şeklinde loft yüzeyleri oluşturur
     * Her hücre için a1, b1, d1 noktalarından L çizgileri oluşturur
     */
    createThreeGeometry() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        // 🎯 Püskül merkezi (geometri içinde 0,0,0 - relatif koordinatlar)
        const Pm = {
            x: 0,  // Püskül merkezi geometri içinde 0,0
            y: 0,  // Püskül merkezi geometri içinde 0,0
            z: -this.H  // Aşağıya H kadar (geometri içinde)
        };
        
        // 🎯 Üst katman noktaları yoksa boş geometri döndür
        if (!this.topLayerPoints || this.topLayerPoints.length === 0) {
            console.warn('⚠️ Püskül Sonu: Üst katman noktaları bulunamadı');
            geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
            geometry.setIndex([]);
            return geometry;
        }
        
        // Her hücre için L çizgilerini topla ve açısal sıraya koy
        const lCurves = [];
        
        this.topLayerPoints.forEach((cellPoints, cellIndex) => {
            // Her hücre için 3 L çizgisi: a1, b1, d1'den
            const startPoints = [
                { name: 'a1', point: cellPoints.a1 },
                { name: 'b1', point: cellPoints.b1 },
                { name: 'd1', point: cellPoints.d1 }
            ];
            
            startPoints.forEach(({ name, point }) => {
                // Nokta yoksa atla
                if (!point || point.x === undefined || point.y === undefined) {
                    console.warn(`⚠️ Püskül Sonu: ${cellPoints.cellName}.${name} noktası eksik, atlanıyor`);
                    return;
                }
                // L çizgisinin iki segmenti + fillet:
                // 1. Dikey segment: point (Z=startZ) → (fillet başlangıcı, Z=startZ-H+fillet)
                // 2. Fillet yayı: köşe noktasında yuvarlatma
                // 3. Yatay segment: (fillet bitişi) → Pm (Z=startZ-H)
                
                // Geometri içinde Z koordinatları: 0 (üst, katmanın alt hizası) → -H (alt)
                // point.z = startZ (katmanın alt hizası) ama geometri içinde 0 olarak normalize ediyoruz
                const relativeX = point.x - this.puskulCenterX;  // Püskül merkezine göre relatif
                const relativeY = point.y - this.puskulCenterY;  // Püskül merkezine göre relatif
                const topZ = 0;  // Geometri içinde üst (katmanın alt hizası)
                const bottomZ = -this.H;  // Geometri içinde alt (aşağıya H kadar)
                
                // Yatay yön vektörü (köşeden Pm'ye - püskül merkezine)
                const horizontalDir = new THREE.Vector3(-relativeX, -relativeY, 0);
                const horizontalDist = horizontalDir.length();
                if (horizontalDist > 0) {
                    horizontalDir.normalize();
                } else {
                    horizontalDir.set(0, 0, 0);
                }
                
                // Fillet yarıçapını mesafeye göre orantılı yap (iç L'ler daha küçük fillet)
                // En dış noktadan referans al (tüm noktalar arasında en uzak olanı bul)
                let maxDist = 100;  // Fallback
                if (this.topLayerPoints.length > 0) {
                    // İlk hücrenin tüm noktalarından (a1, b1, d1) en uzak olanı bul
                    const firstCell = this.topLayerPoints[0];
                    const distances = [];
                    if (firstCell.a1) distances.push(Math.hypot(firstCell.a1.x - this.puskulCenterX, firstCell.a1.y - this.puskulCenterY));
                    if (firstCell.b1) distances.push(Math.hypot(firstCell.b1.x - this.puskulCenterX, firstCell.b1.y - this.puskulCenterY));
                    if (firstCell.d1) distances.push(Math.hypot(firstCell.d1.x - this.puskulCenterX, firstCell.d1.y - this.puskulCenterY));
                    if (distances.length > 0) {
                        maxDist = Math.max(...distances);
                    }
                }
                const distRatio = horizontalDist / maxDist;  // 0-1 arası (iç: küçük, dış: 1)
                
                // Fillet yarıçapını XY'de orantılı, Z'de sabit tut
                // XY: Mesafeye göre ölçekle → Plandan paralel
                // Z: Sabit kal → Önden paralel
                const filletRadiusXY = this.fillet * Math.max(0.3, distRatio);  // Yatay: Orantılı (min %30)
                const filletRadiusZ = this.fillet;   // Dikey: Sabit (tüm L'lerde aynı)
                
                // Dikey segmentin bitişi: köşeden fillet yarıçapı (Z) kadar yukarıda
                const verticalEnd = new THREE.Vector3(
                    relativeX,
                    relativeY,
                    bottomZ + filletRadiusZ
                );
                
                // Yatay segmentin başlangıcı: köşeden fillet yarıçapı (XY) kadar Pm yönünde
                const horizontalStart = new THREE.Vector3(
                    relativeX + horizontalDir.x * filletRadiusXY,
                    relativeY + horizontalDir.y * filletRadiusXY,
                    bottomZ
                );
                
                // Segment 1: Dikey (tepe noktasından fillet başlangıcına)
                const verticalPoints = [
                    new THREE.Vector3(relativeX, relativeY, topZ),  // Üst (katmanın alt hizası, Z=0)
                    verticalEnd
                ];
                
                // Fillet yayı (90 derece yay - XY ve Z ayrı yarıçaplarla elips yay)
                const filletPoints = [];
                if (filletRadiusXY > 0 && filletRadiusZ > 0) {
                    const numFilletPoints = this.filletSegments;
                    const filletCenter = new THREE.Vector3(
                        relativeX + horizontalDir.x * filletRadiusXY,
                        relativeY + horizontalDir.y * filletRadiusXY,
                        bottomZ + filletRadiusZ
                    );
                    
                    for (let i = 0; i <= numFilletPoints; i++) {
                        const t = i / numFilletPoints;
                        const angle = t * Math.PI / 2;  // 0'dan 90 dereceye
                        
                        const arcPoint = new THREE.Vector3(
                            filletCenter.x - horizontalDir.x * filletRadiusXY * Math.sin(angle),
                            filletCenter.y - horizontalDir.y * filletRadiusXY * Math.sin(angle),
                            filletCenter.z - filletRadiusZ * Math.cos(angle)
                        );
                        
                        filletPoints.push(arcPoint);
                    }
                }
                
                // Segment 2: Yatay (fillet bitişinden Pm'ye - püskül merkezine)
                const horizontalPoints = [
                    horizontalStart,
                    new THREE.Vector3(Pm.x, Pm.y, bottomZ)  // Püskül merkezi (0,0,-H)
                ];
                
                // Açısal anahtar (püskül merkezine göre)
                const angleKey = Math.atan2(relativeY, relativeX);
                
                lCurves.push({
                    angle: angleKey,
                    vertical: verticalPoints,
                    fillet: filletPoints,
                    horizontal: horizontalPoints
                });
            });
        });
        
        // Açısal sıraya göre sırala
        lCurves.sort((a, b) => a.angle - b.angle);
        
        console.log(`📊 Püskül Sonu: ${this.topLayerPoints.length} hücre → ${lCurves.length} L eğrisi oluşturuldu`);
        
        // Loft yüzeyleri oluştur - 3 GRUP: Dikey → Fillet → Yatay (her grup kendi içinde döngüsel)
        let vertexOffset = 0;
        
        // GRUP 1: Dikey segment yüzeyleri (üstten fillete kadar)
        for (let i = 0; i < lCurves.length; i++) {
            const nextIdx = (i + 1) % lCurves.length;  // Döngüsel: son → ilk
            const vCurve1 = lCurves[i].vertical;
            const vCurve2 = lCurves[nextIdx].vertical;
            
            if (vCurve1.length > 0 && vCurve2.length > 0) {
                const loftData = this.createLoftGeometry(vCurve1, vCurve2);
                vertices.push(...loftData.vertices);
                loftData.indices.forEach(idx => indices.push(idx + vertexOffset));
                vertexOffset += loftData.vertices.length / 3;
            }
        }
        
        // GRUP 2: Fillet yüzeyleri (90° yaylar)
        for (let i = 0; i < lCurves.length; i++) {
            const nextIdx = (i + 1) % lCurves.length;  // Döngüsel: son → ilk
            const filletCurve1 = lCurves[i].fillet;
            const filletCurve2 = lCurves[nextIdx].fillet;
            
            if (filletCurve1.length > 0 && filletCurve2.length > 0) {
                const loftData = this.createLoftGeometry(filletCurve1, filletCurve2);
                vertices.push(...loftData.vertices);
                loftData.indices.forEach(idx => indices.push(idx + vertexOffset));
                vertexOffset += loftData.vertices.length / 3;
            }
        }
        
        // GRUP 3: Yatay segment yüzeyleri (filletten merkeze kadar)
        for (let i = 0; i < lCurves.length; i++) {
            const nextIdx = (i + 1) % lCurves.length;  // Döngüsel: son → ilk
            const hCurve1 = lCurves[i].horizontal;
            const hCurve2 = lCurves[nextIdx].horizontal;
            
            if (hCurve1.length > 0 && hCurve2.length > 0) {
                const loftData = this.createLoftGeometry(hCurve1, hCurve2);
                vertices.push(...loftData.vertices);
                loftData.indices.forEach(idx => indices.push(idx + vertexOffset));
                vertexOffset += loftData.vertices.length / 3;
            }
        }
        
        if (vertices.length > 0) {
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
        } else {
            geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
            geometry.setIndex([]);
        }

        console.log('📐 Püskül Sonu Geometry created:', {
            vertices: vertices.length / 3,
            triangles: indices.length / 3
        });

        return geometry;
    }
    
    /**
     * İki eğri arasında loft yüzeyi oluştur
     */
    createLoftGeometry(curve1, curve2) {
        const numSegments = Math.max(curve1.length, curve2.length);
        const resampledCurve1 = this.resampleCurve(curve1, numSegments);
        const resampledCurve2 = this.resampleCurve(curve2, numSegments);
        
        const vertices = [];
        const indices = [];
        
        for (let i = 0; i < numSegments; i++) {
            vertices.push(resampledCurve1[i].x, resampledCurve1[i].y, resampledCurve1[i].z);
            vertices.push(resampledCurve2[i].x, resampledCurve2[i].y, resampledCurve2[i].z);
        }
        
        for (let i = 0; i < numSegments - 1; i++) {
            const idx1 = i * 2;
            const idx2 = i * 2 + 1;
            const idx3 = (i + 1) * 2;
            const idx4 = (i + 1) * 2 + 1;
            
            indices.push(idx1, idx2, idx3);
            indices.push(idx2, idx4, idx3);
        }
        
        return { vertices, indices };
    }
    
    /**
     * Eğriyi yeniden örnekle
     */
    resampleCurve(curve, numPoints) {
        if (curve.length === numPoints) {
            return curve;
        }
        
        const resampled = [];
        const totalLength = this.calculateCurveLength(curve);
        
        for (let i = 0; i < numPoints; i++) {
            const t = i / (numPoints - 1);
            const targetDistance = t * totalLength;
            const point = this.getPointAtDistance(curve, targetDistance);
            resampled.push(point);
        }
        
        return resampled;
    }
    
    /**
     * Eğrinin toplam uzunluğunu hesapla
     */
    calculateCurveLength(curve) {
        let length = 0;
        for (let i = 0; i < curve.length - 1; i++) {
            length += curve[i].distanceTo(curve[i + 1]);
        }
        return length;
    }
    
    /**
     * Eğri üzerinde belirli bir mesafedeki noktayı bul
     */
    getPointAtDistance(curve, targetDistance) {
        let accumulatedDistance = 0;
        
        for (let i = 0; i < curve.length - 1; i++) {
            const segmentLength = curve[i].distanceTo(curve[i + 1]);
            
            if (accumulatedDistance + segmentLength >= targetDistance) {
                const t = (targetDistance - accumulatedDistance) / segmentLength;
                return new THREE.Vector3().lerpVectors(curve[i], curve[i + 1], t);
            }
            
            accumulatedDistance += segmentLength;
        }
        
        return curve[curve.length - 1].clone();
    }

    /**
     * Get all point coordinates for visualization
     */
    getPointsArray() {
        const pointsArray = Object.entries(this.points).map(([name, coords]) => ({
            name,
            ...coords
        }));
        
        return pointsArray;
    }

    /**
     * Update geometry with new M, H, and fillet values
     */
    updateDimensions(M, H, fillet = null) {
        this.M = M;
        this.H = H;
        if (fillet !== null) {
            this.fillet = fillet;
        }
        this.points = this.generatePoints();
        return this.createThreeGeometry();
    }

    /**
     * Get geometry statistics
     */
    getStats() {
        return {
            name: this.name,
            module: this.M,
            height: this.H,
            fillet: this.fillet,
            totalPoints: Object.keys(this.points).length,
            totalFaces: this.faces.length
        };
    }
    
    /**
     * Get vertices and indices for compatibility with cell system
     */
    getVertices() {
        const geometry = this.createThreeGeometry();
        const positions = geometry.attributes.position;
        const vertices = [];
        for (let i = 0; i < positions.count; i++) {
            vertices.push(positions.getX(i), positions.getY(i), positions.getZ(i));
        }
        return vertices;
    }
    
    /**
     * Get indices for compatibility with cell system
     */
    getIndices() {
        const geometry = this.createThreeGeometry();
        if (geometry.index) {
            return Array.from(geometry.index.array);
        }
        return [];
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuskulSonuGeometry;
} else {
    window.PuskulSonuGeometry = PuskulSonuGeometry;
}

