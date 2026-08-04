/**
 * Yaprak 3D Geometry
 * Yaprak hücresi için geometri sınıfı
 * 
 * Coordinate System:
 * - Plan (p) view: X, Y coordinates
 * - Front (f) view: X, Z coordinates
 * - Combined: Full 3D (X, Y, Z)
 */

class YaprakGeometry {
    constructor(M = 1, H = 1, slaveRatio = 0.09, slaveRatio2 = 0.096, sectorAngle = null, innerRadius = null, outerRadius = null, sectorIndex = 0, zLevels = null, radialRatio = 0.403, narrowFactor = 1.0) {
        this.M = M; // Module size
        this.H = H; // Total height
        this.slaveRatio = slaveRatio;   // 🎯 Seviye 2-3: master'dan c1'e kayma oranı (varsayılan %9)
        this.slaveRatio2 = slaveRatio2; // 🎯 Seviye 4-5: ratio1'in üzerine EKSTRA kayma (varsayılan %9.6, toplam %18.6) - Badem gibi
        // YAPRAK: ratioZ5 KALDIRILDI (w5 ve z5 yok)
        this.sectorAngle = sectorAngle; // 🎯 Radial planda sektör açısı (radyan)
        this.innerRadius = innerRadius; // 🎯 Radial planda iç yarıçap
        this.outerRadius = outerRadius; // 🎯 Radial planda dış yarıçap
        this.sectorIndex = sectorIndex; // 🎯 Radial planda sektör indexi (rotation için)
        this.zLevels = zLevels || { z2: 5, z3: 30, z4: 35, z5: 65, z6: 85 }; // 🎯 Z seviyeleri (H oranları)
        this.radialRatio = radialRatio; // 🎯 b1/d1'in radyal konumu (varsayılan %40.3)
        this.narrowFactor = narrowFactor; // 🎯 b1/d1 daralma faktörü (varsayılan 1.0=yapışık)
        this.name = 'YAPRAK';

        // 🎯 4 ANA KONTROL NOKTASI (Master Points) - NORMALIZED (M=1)
        // Varsayılan: MODULE_SIZE = 50px ile uyumlu
        const ORIGINAL_DEPTH = 50.0;   // Derinlik (px) - MODULE_SIZE ile uyumlu
        const ORIGINAL_WIDTH = 50.0;   // Genişlik (b1-d1 arası, px)

        // GRID PLAN varsayılan değerler (PİKSEL cinsinden) - Badem ile AYNI
        let a1_y = 0.0;      // ARKA (Y=0) - İÇ (innerRadius)
        let b1_x = 25.0;     // SAĞ X (piksel) - 50px genişlik için
        let b1_y = -20.0;    // SAĞ Y (piksel) - %40 dışarıda (50*0.4=20)
        let c1_y = -50.0;    // ÖN (Y=-50) - DIŞ (outerRadius)
        let d1_x = -25.0;    // SOL X (piksel) - 50px genişlik için
        let d1_y = -20.0;    // SOL Y (piksel) - %40 dışarıda

        console.log(`🔍 YaprakGeometry params: sectorAngle=${sectorAngle}, innerRadius=${innerRadius}, outerRadius=${outerRadius}`);

        if (sectorAngle !== null && innerRadius !== null && outerRadius !== null) {
            // RADIAL PLAN: Derinlik katman kalınlığına göre ayarlanır
            const depth = outerRadius - innerRadius;  // Real piksel

            // 🍃 YAPRAK: Badem ile TAMAMEN AYNI - M ile scale
            a1_y = 0;           // a1 (ARKA) = 0 (innerRadius'ta)
            c1_y = -M;          // c1 (ÖN) = -M (Badem gibi!) - Constructor'dan gelen M

            // ✨ POLAR KOORDINAT SİSTEMİ: b1/d1 arc sınırlarında
            // b1 (SAĞ) → Sektörün +sectorAngle/2 sınırında
            // d1 (SOL) → Sektörün -sectorAngle/2 sınırında

            // Yaprak geometrisinde b1-d1 arasındaki mesafe:
            // Orijinal PNG'de b1.x = 0.64 (normalized, M=1 için)
            // Bu, innerRadius'tan itibaren hesaplanan bir arc mesafesi

            const halfAngle = sectorAngle / 2;

            // ✨ KRİTİK: Radial planda Y = radyal derinlik (innerRadius'tan dışa)
            // Orijinal PNG'de (grid plan):
            //   a1: x=0.0,  y=0.62  (ARKA - merkeze yakın)
            //   b1: x=0.64, y=0.12  (SAĞ - ortada)
            //   c1: x=0.0,  y=-0.62 (ÖN - merkeze uzak)
            //   d1: x=-0.64, y=0.12 (SOL - ortada)

            // Radial planda bunlar radyal mesafe olarak yorumlanıyor:
            // Y=0 → innerRadius (en yakın)
            // Y=-1.0 → outerRadius (en uzak)

            // a1: Y=0.62 → ama radial'de Y=0 olmalı (innerRadius'ta)
            // b1,d1: Y=0.12 → radial'de daha dışarıda olmalı
            // c1: Y=-0.62 → radial'de en dışta

            // PNG'deki 0.62 offset'i kaldırıp normalize edelim:
            const png_a1_y = 0.62;
            const png_b1_y = 0.12;
            const png_c1_y = -0.62;

            // Radial depth oranları (a1=0, c1=-1.0 olacak şekilde normalize)
            const total_depth = png_a1_y - png_c1_y;  // 0.62 - (-0.62) = 1.24

            // b1'in radyal derinliği (radialRatio kullan - Badem gibi)
            const b1_depth_ratio = this.radialRatio;  // Kullanıcı kontrollü (varsayılan 0.403)

            // b1, innerRadius'tan depth*radialRatio mesafede
            const b1_radial_distance = innerRadius + (depth * b1_depth_ratio);

            // ✨ YENİ YAKLAŞIM: b1/d1 mesh local frame'de tangent mesafe
            // Mesh innerRadius'ta, rotation SONRA uygulanacak
            // b1 sektör sınırında, halfAngle kadar açıda olmalı
            // Local X = radyal mesafedeki tangent offset
            // 🎚️ narrowFactor: b1/d1 daralma (1.0=tam sınırda, <1.0=içeride, boşluk oluşur)
            const b1_x_real = b1_radial_distance * Math.tan(halfAngle) * this.narrowFactor;
            const d1_x_real = -b1_x_real;  // Simetrik

            // Y koordinatı: M ile scale (Badem gibi - depth değil!)
            b1_y = -b1_depth_ratio * M;  // M ile ölçeklendir
            d1_y = b1_y;

            // X koordinatı: M ile ölçekle (Badem gibi)
            const scaleX = M / depth; // M'ye ölçekle
            b1_x = b1_x_real * scaleX;
            d1_x = d1_x_real * scaleX;

            // Debug log (devre dışı)
            // console.log(`   → Sector ${this.sectorIndex}: b1_radial_dist=${b1_radial_distance.toFixed(1)}px, b1_x_real=${b1_x_real.toFixed(1)}px`);
        } else {
            console.log(`⚠️ Radial parametreler eksik, varsayılan NORMALIZED boyutlar kullanılıyor`);
        }

        // 🍃 YAPRAK ÖZEL: a1 İÇ ama ARKADA (b1/d1'den daha geride)
        // a1 innerRadius'ta ama Y=0'da (ARKA)
        // c1 outerRadius'ta, Y=-depth'ta (ÖN)
        this.masterPoints = {
            'Y-a1': { x: 0.0,   y: a1_y,  z: 0.0 },     // İÇ + ARKA (innerRadius, Y=0)
            'Y-b1': { x: b1_x,  y: b1_y,  z: 0.0 },     // SAĞ
            'Y-c1': { x: 0.0,   y: c1_y,  z: 0.0 },     // DIŞ + ÖN (outerRadius, Y=-depth)
            'Y-d1': { x: d1_x,  y: d1_y,  z: 0.0 }      // SOL
        };
        
        this.c6Override = null; // Opsiyonel: c6 noktası için harici hedef
        
        console.log(`🍃 YAPRAK MasterPoints: a1.y=${a1_y.toFixed(2)}, b1.y=${b1_y.toFixed(2)}, c1.y=${c1_y.toFixed(2)}, depth=${this.M.toFixed(2)}`);
        
        // 🔍 Debug: c1.y depth ile eşit mi kontrol et
        if (Math.abs(c1_y + this.M) > 0.01) {
            console.warn(`⚠️ YAPRAK c1.y (${c1_y.toFixed(2)}) != -depth (${-this.M.toFixed(2)})`);
        }

        this.points = this.generatePoints();
        this.faces = this.generateFaces();
    }
    
    /**
     * 🎚️ Slave ratio'yu güncelle (master'dan c1'e kayma oranı - Seviye 2-3)
     */
    updateSlaveRatio(newRatio) {
        this.slaveRatio = newRatio;
        this.points = this.generatePoints();
        console.log(`🎚️ Slave ratio (Level 1) güncellendi: ${(newRatio * 100).toFixed(1)}%`);
    }
    
    /**
     * 🎚️ Slave ratio 2'yi güncelle (master'dan c1'e kayma oranı - Seviye 4-5)
     */
    updateSlaveRatio2(newRatio) {
        this.slaveRatio2 = newRatio;
        this.points = this.generatePoints();
        console.log(`🎚️ Slave ratio 2 (Level 2) güncellendi: ${(newRatio * 100).toFixed(1)}%`);
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
     * c6 noktası için opsiyonel local override uygula
     * @param {number} x - Local X koordinatı
     * @param {number} y - Local Y koordinatı
     */
    /**
     * Apply an optional local override for the c6 point
     * @param {number} x - Local X coordinate
     * @param {number} y - Local Y coordinate
     */
    setC6Override(x, y) {
        this.c6Override = { x, y };
        // c6, c1 ile aynı x,y'de, bu yüzden c1'i de güncelle
        this.masterPoints['Y-c1'].x = x;
        this.masterPoints['Y-c1'].y = y;
        this.points = this.generatePoints();
        console.log(`✅ Yaprak c6 (ve c1) override: (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }

    /**
     * Clear the c6 override if present
     */
    clearC6Override() {
        if (this.c6Override) {
            this.c6Override = null;
            this.points = this.generatePoints();
            console.log('c6 override cleared');
        }
    }

    /**
     * Generate all 3D points based on PNG analysis
     * 🎯 PARAMETRIK SISTEM: 4 ana kontrol noktası + bağımlı noktalar
     * Ana noktalar: B-a1, B-b1, B-c1, B-d1 (taban seviye, user editable)
     * Bağımlı noktalar: Otomatik hesaplanır
     */
    generatePoints() {
        const M = this.M;
        const H = this.H;

        // Generating points
        
        // 4 ANA KONTROL NOKTASI (Master) - Kullanıcı tarafından düzenlenebilir
        const a1 = this.masterPoints['Y-a1'];
        const b1 = this.masterPoints['Y-b1'];
        const c1 = this.masterPoints['Y-c1'];
        const d1 = this.masterPoints['Y-d1'];
        
        // 🧮 BAĞIMLI NOKTALARI HESAPLA (Slave Points)
        // Formül: Ana noktalardan belli oranlarda içeriye doğru
        
        // Seviye 2 noktaları - Kullanıcı tarafından ayarlanabilir oran
        const ratio = this.slaveRatio;  // 🎚️ Dinamik oran (varsayılan 0.09 = %9)
        
        const a2 = {
            x: a1.x + (c1.x - a1.x) * ratio,
            y: a1.y + (c1.y - a1.y) * ratio,
            z: (this.zLevels.z2 / 91.0) * H  // zLevels.z2 kullan
        };
        
        const b2 = {
            x: b1.x + (c1.x - b1.x) * ratio,
            y: b1.y + (c1.y - b1.y) * ratio,
            z: (this.zLevels.z2 / 91.0) * H
        };
        
        const d2 = {
            x: d1.x + (c1.x - d1.x) * ratio,
            y: d1.y + (c1.y - d1.y) * ratio,
            z: (this.zLevels.z2 / 91.0) * H
        };
        
        // Seviye 3 noktaları - a3, b3, d3 - YAPRAK: a3 VAR!
        const a3 = {
            x: a2.x,  // a2 ile aynı X
            y: a2.y,  // a2 ile aynı Y
            z: (this.zLevels.z3 / 91.0) * H  // zLevels.z3 kullan
        };
        
        const b3 = {
            x: b1.x + (c1.x - b1.x) * ratio,
            y: b1.y + (c1.y - b1.y) * ratio,
            z: (this.zLevels.z3 / 91.0) * H  // zLevels.z3 kullan
        };
        
        const d3 = {
            x: d1.x + (c1.x - d1.x) * ratio,
            y: d1.y + (c1.y - d1.y) * ratio,
            z: (this.zLevels.z3 / 91.0) * H
        };
        
        // Seviye 4 ve 5 - İkinci oran ile C1'e gidiyor!
        // NOT: ratio2 artık ratio1'in ÜZERİNE ekstra kayma olarak hesaplanıyor (Badem gibi)
        const ratio2Total = this.slaveRatio + this.slaveRatio2;  // 🎚️ Toplam kayma (ratio1 + ratio2)
        
        // b4, b5: b1'den c1'e doğru (ratio1 + ratio2 ile)
        const b4 = {
            x: b1.x + (c1.x - b1.x) * ratio2Total,
            y: b1.y + (c1.y - b1.y) * ratio2Total,
            z: (this.zLevels.z4 / 91.0) * H  // zLevels.z4 kullan
        };
        
        const b5 = {
            x: b1.x + (c1.x - b1.x) * ratio2Total,
            y: b1.y + (c1.y - b1.y) * ratio2Total,
            z: (this.zLevels.z5 / 91.0) * H  // zLevels.z5 kullan
        };
        
        // d4, d5: d1'den c1'e doğru (ratio1 + ratio2 ile)
        const d4 = {
            x: d1.x + (c1.x - d1.x) * ratio2Total,
            y: d1.y + (c1.y - d1.y) * ratio2Total,
            z: (this.zLevels.z4 / 91.0) * H  // zLevels.z4 kullan
        };
        
        const d5 = {
            x: d1.x + (c1.x - d1.x) * ratio2Total,
            y: d1.y + (c1.y - d1.y) * ratio2Total,
            z: (this.zLevels.z5 / 91.0) * H  // zLevels.z5 kullan
        };
        
        // YAPRAK: w5 ve z5 noktaları KALDIRILDI
        
        // Seviye 6 - c1'den yukarı
        const c6 = {
            x: c1.x,
            y: c1.y,
            z: (this.zLevels.z6 / 91.0) * H  // zLevels.z6 kullan
        };

        if (this.c6Override) {
            c6.x = this.c6Override.x;
            c6.y = this.c6Override.y;
        }

        // 🎯 B-a4 NOKTASI: İki paralel çizginin kesişimi
        // Çizgi 1: b4'ün (x,y) koordinatında Z=0'da başlayan, a2-b2'ye paralel çizgi
        // Çizgi 2: d4'ün (x,y) koordinatında Z=0'da başlayan, a2-d2'ye paralel çizgi
        // Parametrik denklemler:
        // Çizgi 1: P = (b4.x, b4.y) + t * (b2.x - a2.x, b2.y - a2.y)
        // Çizgi 2: P = (d4.x, d4.y) + s * (d2.x - a2.x, d2.y - a2.y)
        
        const dir1_x = b2.x - a2.x;  // a2-b2 yön vektörü X
        const dir1_y = b2.y - a2.y;  // a2-b2 yön vektörü Y
        const dir2_x = d2.x - a2.x;  // a2-d2 yön vektörü X
        const dir2_y = d2.y - a2.y;  // a2-d2 yön vektörü Y
        
        // Kesişim noktası hesabı (2D çizgi kesişimi)
        // b4.x + t * dir1_x = d4.x + s * dir2_x
        // b4.y + t * dir1_y = d4.y + s * dir2_y
        
        const denominator = dir1_x * dir2_y - dir1_y * dir2_x;
        let a4_x = a2.x;  // Varsayılan değer
        let a4_y = a2.y;  // Varsayılan değer
        
        if (Math.abs(denominator) > 0.0001) {  // Çizgiler paralel değilse
            const t = ((d4.x - b4.x) * dir2_y - (d4.y - b4.y) * dir2_x) / denominator;
            a4_x = b4.x + t * dir1_x;
            a4_y = b4.y + t * dir1_y;
        }
        
        const a4 = {
            x: a4_x,
            y: a4_y,
            z: b4.z  // Z değeri b4 ile aynı
        };

        // 🎯 B-a5 NOKTASI: a4'ün x,y koordinatlarında, b5'in z'sinde
        const a5 = {
            x: a4_x,
            y: a4_y,
            z: b5.z  // Z değeri b5 ile aynı
        };

        // Nokta objelerini oluştur
        const points = {
            // 🎯 4 ANA KONTROL NOKTASI (Master Points)
            'Y-a1': { ...a1, level: 1, type: 'master', display: 'Y-a1', editable: true },
            'Y-b1': { ...b1, level: 1, type: 'master', display: 'Y-b1', editable: true },
            'Y-c1': { ...c1, level: 1, type: 'master', display: 'Y-c1', editable: true },
            'Y-d1': { ...d1, level: 1, type: 'master', display: 'Y-d1', editable: true },

            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 2
            'Y-a2': { ...a2, level: 2, type: 'slave', display: 'Y-a2', editable: false },
            'Y-b2': { ...b2, level: 2, type: 'slave', display: 'Y-b2', editable: false },
            'Y-d2': { ...d2, level: 2, type: 'slave', display: 'Y-d2', editable: false },

            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 3 (YAPRAK: a3 dahil!)
            'Y-a3': { ...a3, level: 3, type: 'slave', display: 'Y-a3', editable: false },
            'Y-b3': { ...b3, level: 3, type: 'slave', display: 'Y-b3', editable: false },
            'Y-d3': { ...d3, level: 3, type: 'slave', display: 'Y-d3', editable: false },

            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 4 (ratio=18.6%, sadece b ve d)
            'Y-a4': { ...a4, level: 4, type: 'slave', display: 'Y-a4', editable: false },
            'Y-b4': { ...b4, level: 4, type: 'slave', display: 'Y-b4', editable: false },
            'Y-d4': { ...d4, level: 4, type: 'slave', display: 'Y-d4', editable: false },

            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 5 (ratio=18.6%, sadece b ve d)
            'Y-a5': { ...a5, level: 5, type: 'slave', display: 'Y-a5', editable: false },
            'Y-b5': { ...b5, level: 5, type: 'slave', display: 'Y-b5', editable: false },
            'Y-d5': { ...d5, level: 5, type: 'slave', display: 'Y-d5', editable: false },

            // YAPRAK: w5 ve z5 noktaları KALDIRILDI

            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 6
            'Y-c6': { ...c6, level: 6, type: 'slave', display: 'Y-c6', editable: false }
        };
        
        // 🔄 Z NORMALIZASYONU: c6'yı Z=0 yap, diğerlerini negatif yap (aşağı doğru büyür)
        const topZ = c6.z;
        Object.keys(points).forEach((key) => {
            const zVal = (points[key].z !== undefined) ? points[key].z : 0.0;
            points[key].z = zVal - topZ; // c6 = 0 olur, diğerleri negatif
        });
        
        console.log('✅ Master Points:', Object.keys(this.masterPoints).length);
        console.log('✅ Slave Points:', Object.keys(points).filter(k => points[k].type === 'slave').length);
        console.log('✅ YAPRAK: a3, a4 ve a5 eklendi, w5 ve z5 silindi');
        console.log(`🔄 Z normalized: c6 = 0, a1 = ${points['Y-a1'].z.toFixed(2)}`);
        
        return points;
    }

    /**
     * Generate faces (quad surfaces) connecting the points
     * Based on the surface structure visible in PNG
     * Quad format: [point1, point2, point3, point4] - clockwise or counter-clockwise order
     */
    generateFaces() {
        // Define quad faces for 3D yaprak geometry
        const faces = [];

        // 🎯 İLK QUAD YÜZEY: Y-a1, Y-b1, Y-b2, Y-a2 (seviye 1-2 arası)
        // Bu yüzey taban seviyesinden ikinci seviyeye geçişi temsil eder
        faces.push(['Y-a1', 'Y-b1', 'Y-b2', 'Y-a2']);

        // 🎯 İKİNCİ QUAD YÜZEY: Y-a1, Y-a2, Y-d2, Y-d1 (sol-alt panel)
        // Bu yüzey sol taraftaki dikey paneli temsil eder
        faces.push(['Y-a1', 'Y-a2', 'Y-d2', 'Y-d1']);

        // 🎯 ÜÇÜNCÜ YÜZEY: Y-a2, Y-b2, Y-b3, Y-a3 (quad yüzey) - YAPRAK: a3 eklendi
        // Bu yüzey ön kısımda seviye 2-3 arası geçişi temsil eder (a2-a3 dikey bağlantı)
        faces.push(['Y-a2', 'Y-b2', 'Y-b3', 'Y-a3']);

        // 🎯 DÖRDÜNCÜ YÜZEY: Y-a4, Y-a3, Y-b3 (üçgen yüzey) - YAPRAK: a3-a4 geçişi
        // Bu yüzey a3'ten a4'e sağ tarafta geçişi temsil eder
        faces.push(['Y-a4', 'Y-a3', 'Y-b3']);

        // 🎯 BEŞİNCİ YÜZEY: Y-a4, Y-b3, Y-b4 (üçgen yüzey) - YAPRAK: a3 → a4
        // Bu yüzey ön kısımda seviye 3-4 geçişi temsil eder
        faces.push(['Y-a4', 'Y-b3', 'Y-b4']);

        // 🎯 ALTINCI YÜZEY: Y-a4, Y-b4, Y-b5, Y-a5 (quad yüzey) - YAPRAK: a4-a5-b5-b4
        // Bu yüzey ön kısımdan yukarı geçişi temsil eder (sağ taraf)
        faces.push(['Y-a4', 'Y-b4', 'Y-b5', 'Y-a5']);

        // 🎯 YEDİNCİ YÜZEY: Y-a5, Y-b5, Y-c6 (üçgen yüzey) - YAPRAK: a4 → a5
        // Bu yüzey sağ taraftan tepe noktasına doğru geçişi temsil eder
        faces.push(['Y-a5', 'Y-b5', 'Y-c6']);

        // 🎯 SEKİZİNCİ YÜZEY: Y-a2, Y-a3, Y-d3, Y-d2 (quad yüzey) - YAPRAK: a3 eklendi
        // Bu yüzey sol tarafta seviye 2-3 geçişi temsil eder (a2-a3 dikey bağlantı)
        faces.push(['Y-a2', 'Y-a3', 'Y-d3', 'Y-d2']);

        // 🎯 DOKUZUNCU YÜZEY: Y-a3, Y-a4, Y-d3 (üçgen yüzey) - YAPRAK: a3-a4 geçişi
        // Bu yüzey a3'ten a4'e sol tarafta geçişi temsil eder
        faces.push(['Y-a3', 'Y-a4', 'Y-d3']);

        // 🎯 ONUNCU YÜZEY: Y-a4, Y-d4, Y-d3 (üçgen yüzey) - YAPRAK: a3 → a4
        // Bu yüzey sol tarafta seviye 3-4 geçişi temsil eder
        faces.push(['Y-a4', 'Y-d4', 'Y-d3']);

        // 🎯 ON BİRİNCİ YÜZEY: Y-d4, Y-a4, Y-a5, Y-d5 (quad yüzey) - YAPRAK: d4-a4-a5-d5
        // Bu yüzey sol taraftan yukarı geçişi temsil eder (sol taraf)
        faces.push(['Y-d4', 'Y-a4', 'Y-a5', 'Y-d5']);

        // 🎯 ON İKİNCİ YÜZEY: Y-a5, Y-c6, Y-d5 (üçgen yüzey) - YAPRAK: a4 → a5
        // Bu yüzey sol taraftan tepe noktasına doğru geçişi temsil eder
        faces.push(['Y-a5', 'Y-c6', 'Y-d5']);

        console.log('🔷 1. Quad yüzey: Y-a1 → Y-b1 → Y-b2 → Y-a2');
        console.log('🔷 2. Quad yüzey: Y-a1 → Y-a2 → Y-d2 → Y-d1');
        console.log('🔷 3. Quad yüzey: Y-a2 → Y-b2 → Y-b3 → Y-a3 (YAPRAK)');
        console.log('🔺 4. Yüzey: Y-a4 → Y-a3 → Y-b3 (YAPRAK: a3-a4 geçişi)');
        console.log('🔺 5. Yüzey: Y-a4 → Y-b3 → Y-b4 (YAPRAK: a4 eklendi)');
        console.log('🔷 6. Quad yüzey: Y-a4 → Y-b4 → Y-b5 → Y-a5 (YAPRAK: sağ quad)');
        console.log('🔺 7. Yüzey: Y-a5 → Y-b5 → Y-c6 (YAPRAK: a5 eklendi)');
        console.log('🔷 8. Quad yüzey: Y-a2 → Y-a3 → Y-d3 → Y-d2 (YAPRAK) [FIXED WINDING]');
        console.log('🔺 9. Yüzey: Y-a3 → Y-a4 → Y-d3 (YAPRAK: a3-a4 geçişi)');
        console.log('🔺 10. Yüzey: Y-a4 → Y-d4 → Y-d3 (YAPRAK: a4 eklendi)');
        console.log('🔷 11. Quad yüzey: Y-d4 → Y-a4 → Y-a5 → Y-d5 (YAPRAK: sol quad)');
        console.log('🔺 12. Yüzey: Y-a5 → Y-c6 → Y-d5 (YAPRAK: a5 eklendi) [FIXED WINDING]');
        console.log('📊 Toplam yüzey sayısı:', faces.length);

        return faces;
    }

    /**
     * Create Three.js BufferGeometry
     * Supports both triangular and quad faces
     */
    createThreeGeometry() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        // Create vertex array
        const pointKeys = Object.keys(this.points);
        const pointIndexMap = {};
        
        pointKeys.forEach((key, idx) => {
            const pt = this.points[key];
            vertices.push(pt.x, pt.y, pt.z);
            pointIndexMap[key] = idx;
        });

        // Create index array from faces (supporting quads)
        this.faces.forEach(face => {
            if (face.length === 4) {
                // 🔷 QUAD FACE: Split into two triangles
                const [p1, p2, p3, p4] = face;
                if (pointIndexMap[p1] !== undefined && 
                    pointIndexMap[p2] !== undefined && 
                    pointIndexMap[p3] !== undefined &&
                    pointIndexMap[p4] !== undefined) {
                    
                    // Triangle 1: p1, p2, p3
                    indices.push(
                        pointIndexMap[p1],
                        pointIndexMap[p2],
                        pointIndexMap[p3]
                    );
                    
                    // Triangle 2: p1, p3, p4
                    indices.push(
                        pointIndexMap[p1],
                        pointIndexMap[p3],
                        pointIndexMap[p4]
                    );
                }
            } else if (face.length === 3) {
                // 🔺 TRIANGULAR FACE: Direct triangle
            const [p1, p2, p3] = face;
            if (pointIndexMap[p1] !== undefined && 
                pointIndexMap[p2] !== undefined && 
                pointIndexMap[p3] !== undefined) {
                indices.push(
                    pointIndexMap[p1],
                    pointIndexMap[p2],
                    pointIndexMap[p3]
                );
                }
            }
        });

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        // geometry.computeVertexNormals(); // REMOVED: flatShading:true in material handles this

        console.log('📐 Geometry created:', {
            vertices: vertices.length / 3,
            triangles: indices.length / 3,
            quads: this.faces.filter(f => f.length === 4).length,
            totalFaces: this.faces.length,
            points: pointKeys.length
        });

        return geometry;
    }

    /**
     * Get all point coordinates for visualization
     */
    getPointsArray() {
        const pointsArray = Object.entries(this.points).map(([name, coords]) => ({
            name,
            ...coords
        }));
        
        console.log('📍 Nokta İsimleri:', pointsArray.map(p => p.display || p.name).join(', '));
        
        return pointsArray;
    }

    /**
     * Update geometry with new M, H, and optional ratio values
     */
    updateDimensions(M, H, slaveRatio = null, slaveRatio2 = null, ratioZ5 = null, zLevels = null, radialRatio = null, narrowFactor = null) {
        this.M = M;
        this.H = H;
        if (slaveRatio !== null) {
            this.slaveRatio = slaveRatio;
        }
        if (slaveRatio2 !== null) {
            this.slaveRatio2 = slaveRatio2;
        }
        // YAPRAK: ratioZ5 parametresi yok ama imza uyumluluğu için kabul et
        if (zLevels !== null) {
            this.zLevels = zLevels;
        }
        if (radialRatio !== null) {
            this.radialRatio = radialRatio;
        }
        if (narrowFactor !== null) {
            this.narrowFactor = narrowFactor;
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
            slaveRatio: this.slaveRatio,
            totalPoints: Object.keys(this.points).length,
            totalFaces: this.faces.length,
            levels: 7,
            longAxis: this.M * 1.414, // M * sqrt(2)
            shortAxis: this.M * 0.707  // M / sqrt(2)
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YaprakGeometry;
} else {
    window.YaprakGeometry = YaprakGeometry;
}

