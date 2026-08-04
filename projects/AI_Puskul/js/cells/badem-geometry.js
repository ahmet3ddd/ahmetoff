/**
 * Badem (Deltoid) 3D Geometry
 * Based on PNG image analysis with detailed point coordinates
 * 
 * Coordinate System:
 * - Plan (p) view: X, Y coordinates
 * - Front (f) view: X, Z coordinates
 * - Combined: Full 3D (X, Y, Z)
 */

class BademGeometry {
    constructor(M = 1, H = 1, slaveRatio = 0.09, slaveRatio2 = 0.096, ratioZ5 = 0.09, sectorAngle = null, innerRadius = null, outerRadius = null, sectorIndex = 0, zLevels = null, radialRatio = 0.403, narrowFactor = 1.0) {
        this.M = M; // Module size
        this.H = H; // Total height
        this.slaveRatio = slaveRatio;   // 🎯 Seviye 2-3: master'dan c1'e kayma oranı (varsayılan %9)
        this.slaveRatio2 = slaveRatio2; // 🎯 Seviye 4-5: ratio1'in üzerine EKSTRA kayma (varsayılan %9.6, toplam %18.6)
        this.ratioZ5 = ratioZ5;         // 🎯 B-z5: d4'ten a2'ye kayma oranı (varsayılan %9)
        this.sectorAngle = sectorAngle; // 🎯 Radial planda sektör açısı (radyan)
        this.innerRadius = innerRadius; // 🎯 Radial planda iç yarıçap
        this.outerRadius = outerRadius; // 🎯 Radial planda dış yarıçap
        this.sectorIndex = sectorIndex; // 🎯 Radial planda sektör indexi (rotation için)
        this.zLevels = zLevels || { z2: 5, z3: 30, z4: 35, z5: 65, z6: 85 }; // 🎯 Z seviyeleri (H oranları)
        this.radialRatio = radialRatio; // 🎯 b1/d1'in radyal konumu (a1→c1 arası oran, varsayılan %40.3)
        this.narrowFactor = narrowFactor; // 🎯 b1/d1 daralma faktörü (sektör sınırından içeri, varsayılan 1.0=yapışık, 0.8=%20 boşluk)
        this.name = 'BADEM';

        // 🎯 4 ANA KONTROL NOKTASI (Master Points) - M ile ölçekli
        // M parametresi = Hücre derinliği (outerRadius - innerRadius)
        
        // GRID PLAN değerleri (M ile ölçeklendirilmiş)
        let a1_y = 0.0;              // ARKA (Y=0)
        let b1_x = M * 0.5;          // SAĞ X (M'nin yarısı)
        let b1_y = -M * 0.24;        // SAĞ Y (M'nin %24'ü)
        let c1_y = -M;               // ÖN (Y=-M) - Derinlik
        let d1_x = -M * 0.5;         // SOL X (M'nin yarısı)
        let d1_y = -M * 0.24;        // SOL Y (M'nin %24'ü)

        console.log(`🔍 BademGeometry params: sectorAngle=${sectorAngle}, innerRadius=${innerRadius}, outerRadius=${outerRadius}`);

        if (sectorAngle !== null && innerRadius !== null && outerRadius !== null) {
            // RADIAL PLAN: Derinlik katman kalınlığına göre ayarlanır
            const depth = outerRadius - innerRadius;  // Real piksel

            // a1 İÇ KENARDA, c1 DIŞ KENARDA (M ile ölçekli)
            a1_y = 0;           // a1 (ARKA) = 0
            c1_y = -M;          // c1 (ÖN) = -M (derinlik)

            // ✨ POLAR KOORDINAT SİSTEMİ: b1/d1 arc sınırlarında
            // b1 (SAĞ) → Sektörün +sectorAngle/2 sınırında
            // d1 (SOL) → Sektörün -sectorAngle/2 sınırında

            // Badem geometrisinde b1-d1 arasındaki mesafe:
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

            // 🎯 PNG'den çıkarılan orijinal analiz (referans, artık kullanılmıyor):
            // const png_a1_y = 0.62;
            // const png_b1_y = 0.12;
            // const png_c1_y = -0.62;
            // const total_depth = png_a1_y - png_c1_y;  // 0.62 - (-0.62) = 1.24
            // const b1_depth_ratio = (png_a1_y - png_b1_y) / total_depth;  // (0.62-0.12)/1.24 = 0.403

            // 🎚️ YENİ SİSTEM: Kullanıcı tarafından ayarlanabilir radyal oran
            // Default: 0.403 (PNG analizinden), Ayarlanabilir: 0.2 - 0.8 arası
            const b1_depth_ratio = this.radialRatio;

            // b1, innerRadius'tan depth*radialRatio mesafede
            const b1_radial_distance = innerRadius + (depth * b1_depth_ratio);

            // ✨ YENİ YAKLAŞIM: b1/d1 mesh local frame'de tangent mesafe
            // Mesh innerRadius'ta, rotation SONRA uygulanacak
            // b1 sektör sınırında, halfAngle kadar açıda olmalı
            // Local X = radyal mesafedeki tangent offset
            // 🎚️ narrowFactor: b1/d1 daralma (1.0=tam sınırda, <1.0=içeride, boşluk oluşur)
            const b1_x_real = b1_radial_distance * Math.tan(halfAngle) * this.narrowFactor;
            const d1_x_real = -b1_x_real;  // Simetrik

            // Y koordinatı M ile ölçekli
            b1_y = -b1_depth_ratio * M;  // M ile ölçeklendir
            d1_y = b1_y;

            // X koordinatı M ile ölçekli (artık normalize etmiyoruz)
            const scaleX = M / depth; // M'ye ölçekle
            b1_x = b1_x_real * scaleX;
            d1_x = d1_x_real * scaleX;

            // Debug log (devre dışı)
            // console.log(`   → Sector ${this.sectorIndex}: b1_radial_dist=${b1_radial_distance.toFixed(1)}px, b1_x_real=${b1_x_real.toFixed(1)}px`);
        } else {
            console.log(`✅ Grid plan kullanılıyor (M=${M} ile ölçekli)`);
        }

        this.masterPoints = {
            'B-a1': { x: 0.0,   y: a1_y,  z: 0.0 },     // ARKA (iç kenar)
            'B-b1': { x: b1_x,  y: b1_y,  z: 0.0 },     // SAĞ
            'B-c1': { x: 0.0,   y: c1_y,  z: 0.0 },     // ÖN (dış kenar)
            'B-d1': { x: d1_x,  y: d1_y,  z: 0.0 }      // SOL
        };

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
     * c6 noktası için opsiyonel local override uygula (multi-layer alignment için)
     * @param {number} x - Local X koordinatı
     * @param {number} y - Local Y koordinatı
     */
    setC6Override(x, y) {
        this.c6Override = { x, y };
        // c6, c1 ile aynı x,y'de, bu yüzden c1'i de güncelle
        this.masterPoints['B-c1'].x = x;
        this.masterPoints['B-c1'].y = y;
        this.points = this.generatePoints();
        console.log(`✅ Badem c6 (ve c1) override: (${x.toFixed(2)}, ${y.toFixed(2)})`);
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
        const a1 = this.masterPoints['B-a1'];
        const b1 = this.masterPoints['B-b1'];
        const c1 = this.masterPoints['B-c1'];
        const d1 = this.masterPoints['B-d1'];
        
        // 🧮 BAĞIMLI NOKTALARI HESAPLA (Slave Points)
        // Formül: Ana noktalardan belli oranlarda içeriye doğru
        
        // Seviye 2 noktaları - Kullanıcı tarafından ayarlanabilir oran
        const ratio = this.slaveRatio;  // 🎚️ Dinamik oran (varsayılan 0.09 = %9)
        
        // 🎯 Z Level oranlarını al (kullanıcı tarafından ayarlanabilir)
        const z2_ratio = this.zLevels.z2 / 91.0;
        const z3_ratio = this.zLevels.z3 / 91.0;
        const z4_ratio = this.zLevels.z4 / 91.0;
        const z5_ratio = this.zLevels.z5 / 91.0;
        const z6_ratio = this.zLevels.z6 / 91.0;
        
        const a2 = {
            x: a1.x + (c1.x - a1.x) * ratio,
            y: a1.y + (c1.y - a1.y) * ratio,
            z: z2_ratio * H  // 🎯 Kullanıcı kontrollü
        };
        
        const b2 = {
            x: b1.x + (c1.x - b1.x) * ratio,
            y: b1.y + (c1.y - b1.y) * ratio,
            z: z2_ratio * H
        };
        
        const d2 = {
            x: d1.x + (c1.x - d1.x) * ratio,
            y: d1.y + (c1.y - d1.y) * ratio,
            z: z2_ratio * H
        };
        
        // Seviye 3 noktaları - b3, d3 (z=30) - NOT: a3 yok!
        const b3 = {
            x: b1.x + (c1.x - b1.x) * ratio,
            y: b1.y + (c1.y - b1.y) * ratio,
            z: z3_ratio * H  // 🎯 Kullanıcı kontrollü
        };
        
        const d3 = {
            x: d1.x + (c1.x - d1.x) * ratio,
            y: d1.y + (c1.y - d1.y) * ratio,
            z: z3_ratio * H
        };
        
        // Seviye 4 ve 5 - İkinci oran ile C1'e gidiyor!
        // NOT: ratio2 artık ratio1'in ÜZERİNE ekstra kayma olarak hesaplanıyor
        const ratio2Total = this.slaveRatio + this.slaveRatio2;  // 🎚️ Toplam kayma (ratio1 + ratio2)
        
        // b4, b5: b1'den c1'e doğru (ratio1 + ratio2 ile)
        const b4 = {
            x: b1.x + (c1.x - b1.x) * ratio2Total,
            y: b1.y + (c1.y - b1.y) * ratio2Total,
            z: z4_ratio * H  // 🎯 Kullanıcı kontrollü
        };
        
        const b5 = {
            x: b1.x + (c1.x - b1.x) * ratio2Total,
            y: b1.y + (c1.y - b1.y) * ratio2Total,
            z: z5_ratio * H  // 🎯 Kullanıcı kontrollü
        };
        
        // d4, d5: d1'den c1'e doğru (ratio1 + ratio2 ile)
        const d4 = {
            x: d1.x + (c1.x - d1.x) * ratio2Total,
            y: d1.y + (c1.y - d1.y) * ratio2Total,
            z: z4_ratio * H
        };
        
        const d5 = {
            x: d1.x + (c1.x - d1.x) * ratio2Total,
            y: d1.y + (c1.y - d1.y) * ratio2Total,
            z: z5_ratio * H
        };
        
        // 🆕 B-z5: d4'ten a2'ye giden yol üzerinde (özel nokta)
        // Z değeri d5 ile aynı
        const ratioZ5 = this.ratioZ5;
        const z5 = {
            x: d4.x + (a2.x - d4.x) * ratioZ5,
            y: d4.y + (a2.y - d4.y) * ratioZ5,
            z: z5_ratio * H  // d5 ile aynı yükseklik
        };
        
        // 🆕 B-w5: b4'ten a2'ye giden yol üzerinde (özel nokta - z5'in simetriği)
        // Z değeri d5 ile aynı, aynı ratioZ5 ile kontrol edilir
        const w5 = {
            x: b4.x + (a2.x - b4.x) * ratioZ5,
            y: b4.y + (a2.y - b4.y) * ratioZ5,
            z: z5_ratio * H  // d5 ile aynı yükseklik
        };
        
        // Seviye 6 - c1'den yukarı
        const c6 = {
            x: c1.x,
            y: c1.y,
            z: z6_ratio * H  // 🎯 Kullanıcı kontrollü
        };

        // Nokta objelerini oluştur
        const points = {
            // 🎯 4 ANA KONTROL NOKTASI (Master Points)
            'B-a1': { ...a1, level: 1, type: 'master', display: 'B-a1', editable: true },
            'B-b1': { ...b1, level: 1, type: 'master', display: 'B-b1', editable: true },
            'B-c1': { ...c1, level: 1, type: 'master', display: 'B-c1', editable: true },
            'B-d1': { ...d1, level: 1, type: 'master', display: 'B-d1', editable: true },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 2
            'B-a2': { ...a2, level: 2, type: 'slave', display: 'B-a2', editable: false },
            'B-b2': { ...b2, level: 2, type: 'slave', display: 'B-b2', editable: false },
            'B-d2': { ...d2, level: 2, type: 'slave', display: 'B-d2', editable: false },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 3 (sadece b ve d)
            'B-b3': { ...b3, level: 3, type: 'slave', display: 'B-b3', editable: false },
            'B-d3': { ...d3, level: 3, type: 'slave', display: 'B-d3', editable: false },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 4 (ratio=18.6%, sadece b ve d)
            'B-b4': { ...b4, level: 4, type: 'slave', display: 'B-b4', editable: false },
            'B-d4': { ...d4, level: 4, type: 'slave', display: 'B-d4', editable: false },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 5 (ratio=18.6%, sadece b ve d)
            'B-b5': { ...b5, level: 5, type: 'slave', display: 'B-b5', editable: false },
            'B-d5': { ...d5, level: 5, type: 'slave', display: 'B-d5', editable: false },
            
            // 🆕 ÖZEL NOKTALAR - z5 ve w5: yeşil çizgiler üzerinde (simetrik)
            'B-z5': { ...z5, level: 5, type: 'special', display: 'B-z5', editable: false },
            'B-w5': { ...w5, level: 5, type: 'special', display: 'B-w5', editable: false },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 6
            'B-c6': { ...c6, level: 6, type: 'slave', display: 'B-c6', editable: false }
        };
        
        // Z ALIGNMENT: Keep top ridge (c6) at Z=0, grow downward as H increases
        const topZ = c6.z;
        Object.keys(points).forEach((key) => {
            const zVal = (points[key].z !== undefined) ? points[key].z : 0.0;
            points[key].z = zVal - topZ; // shift all points so c6 becomes 0 and others negative
        });
        
        console.log('✅ Master Points:', Object.keys(this.masterPoints).length);
        console.log('✅ Slave Points:', Object.keys(points).filter(k => points[k].type === 'slave').length);
        
        return points;
    }

    /**
     * Generate faces (quad surfaces) connecting the points
     * Based on the surface structure visible in PNG
     * Quad format: [point1, point2, point3, point4] - clockwise or counter-clockwise order
     */
    generateFaces() {
        // Define quad faces for 3D badem geometry
        const faces = [];

        // 🎯 İLK QUAD YÜZEY: B-a1, B-b1, B-b2, B-a2 (seviye 1-2 arası)
        // Bu yüzey taban seviyesinden ikinci seviyeye geçişi temsil eder
        faces.push(['B-a1', 'B-b1', 'B-b2', 'B-a2']);

        // 🎯 İKİNCİ QUAD YÜZEY: B-a1, B-a2, B-d2, B-d1 (sol-alt panel)
        // Bu yüzey sol taraftaki dikey paneli temsil eder
        faces.push(['B-a1', 'B-a2', 'B-d2', 'B-d1']);

        // 🎯 ÜÇÜNCÜ YÜZEY: B-a2, B-b2, B-b3 (üçgen yüzey)
        // Bu yüzey ön kısımda seviye 2-3 arası geçişi temsil eder
        faces.push(['B-a2', 'B-b2', 'B-b3']);

        // 🎯 DÖRDÜNCÜ YÜZEY: B-a2, B-b3, B-b4 (üçgen yüzey)
        // Bu yüzey ön kısımda seviye 2-3-4 geçişi temsil eder
        faces.push(['B-a2', 'B-b3', 'B-b4']);

        // 🎯 BEŞİNCİ YÜZEY: B-a2, B-b4, B-b5, B-w5 (quad yüzey)
        // Bu yüzey ön kısımdan merkez ridge'e doğru geçişi temsil eder
        faces.push(['B-a2', 'B-b4', 'B-b5', 'B-w5']);

        // 🎯 ALTINCI YÜZEY: B-a2, B-w5, B-c6 (üçgen yüzey)
        // Bu yüzey merkez ridge'den tepe noktasına doğru geçişi temsil eder
        faces.push(['B-a2', 'B-w5', 'B-c6']);

        // 🎯 YEDİNCİ YÜZEY: B-w5, B-b5, B-c6 (üçgen yüzey)
        // Bu yüzey merkez ridge'in sağ tarafından tepe noktasına geçişi temsil eder
        faces.push(['B-w5', 'B-b5', 'B-c6']);

        // 🎯 SEKİZİNCİ YÜZEY: B-a2, B-d3, B-d2 (üçgen yüzey)
        // Bu yüzey sol tarafta seviye 2-3 geçişi temsil eder
        faces.push(['B-a2', 'B-d3', 'B-d2']);

        // 🎯 DOKUZUNCU YÜZEY: B-a2, B-d4, B-d3 (üçgen yüzey)
        // Bu yüzey sol tarafta seviye 2-3-4 geçişi temsil eder
        faces.push(['B-a2', 'B-d4', 'B-d3']);

        // 🎯 ONUNCU YÜZEY: B-a2, B-z5, B-d5, B-d4 (quad yüzey)
        // Bu yüzey sol taraftan merkez ridge'e doğru geçişi temsil eder
        faces.push(['B-a2', 'B-z5', 'B-d5', 'B-d4']);

        // 🎯 ON BİRİNCİ YÜZEY: B-z5, B-c6, B-d5 (üçgen yüzey)
        // Bu yüzey merkez ridge'in sol tarafından tepe noktasına geçişi temsil eder
        faces.push(['B-z5', 'B-c6', 'B-d5']);

        // 🎯 ON İKİNCİ YÜZEY: B-a2, B-c6, B-z5 (üçgen yüzey)
        // Bu yüzey tepe noktasından merkez ridge sol tarafına geçişi temsil eder
        faces.push(['B-a2', 'B-c6', 'B-z5']);

        console.log('🔷 İlk quad yüzey oluşturuldu: B-a1 → B-b1 → B-b2 → B-a2');
        console.log('🔷 İkinci quad yüzey oluşturuldu: B-a1 → B-a2 → B-d2 → B-d1');
        console.log('🔺 Üçüncü yüzey oluşturuldu: B-a2 → B-b2 → B-b3');
        console.log('🔺 Dördüncü yüzey oluşturuldu: B-a2 → B-b3 → B-b4');
        console.log('🔷 Beşinci yüzey oluşturuldu: B-a2 → B-b4 → B-b5 → B-w5');
        console.log('🔺 Altıncı yüzey oluşturuldu: B-a2 → B-w5 → B-c6');
        console.log('🔺 Yedinci yüzey oluşturuldu: B-w5 → B-b5 → B-c6');
        console.log('🔺 Sekizinci yüzey oluşturuldu: B-a2 → B-d3 → B-d2');
        console.log('🔺 Dokuzuncu yüzey oluşturuldu: B-a2 → B-d4 → B-d3');
        console.log('🔷 Onuncu yüzey oluşturuldu: B-a2 → B-z5 → B-d5 → B-d4');
        console.log('🔺 On birinci yüzey oluşturuldu: B-z5 → B-c6 → B-d5');
        console.log('🔺 On ikinci yüzey oluşturuldu: B-a2 → B-c6 → B-z5');
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
        geometry.computeVertexNormals();

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
        if (ratioZ5 !== null) {
            this.ratioZ5 = ratioZ5;
        }
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
    module.exports = BademGeometry;
} else {
    window.BademGeometry = BademGeometry;
}

