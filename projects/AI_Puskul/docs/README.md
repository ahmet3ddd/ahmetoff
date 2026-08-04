# Püskül 3D Viewer

Mukarnas mimarisindeki püskül yapılarını 3D olarak görüntüleyen ve düzenleyen profesyonel bir tasarım aracı.

## 🎯 Özellikler

### 🎨 Geometri ve Görselleştirme
- ✅ **4 Hücre Tipi:** Badem, Yaprak, Fitil, Kazayağı
- ✅ **Çok Katmanlı Sistem:** Sınırsız katman desteği
- ✅ **İki Ngon Sistemi:** Inner/Outer radius kontrolü
- ✅ **Grid ve Radial Plan:** Esnek geometri modları
- ✅ **Wireframe ve Nokta Görünümü:** Detaylı geometri analizi
- ✅ **Ngon Görselleştirme:** Dinamik çokgen gösterimi

### 🛠️ Düzenleme Özellikleri
- ✅ **Cell Editor:** Hücre bazlı ratio ve Z level düzenleme
- ✅ **Layer Transition:** Katmanlar arası geçiş yüzeyleri
- ✅ **Snap/Deformasyon:** Hücre bağlantı sistemı
- ✅ **Custom Boundary:** Çok katmanlı hizalama
- ✅ **PIP Görünüm:** Ortografik top view

### 📊 Kontrol ve Yönetim
- ✅ **Orbit Kontrolleri:** Three.js OrbitControls
- ✅ **Export/Import:** Proje kaydetme ve yükleme
- ✅ **Dinamik Parametreler:** Realtime güncelleme
- ✅ **Grup/Tekli Düzenleme:** Esnek edit modları

## 📂 Dosya Yapısı

```
puskul-3d-viewer/
├── 🌐 ANA DOSYALAR
│   ├── index.html                    # UI + HTML yapısı
│   ├── app.js                        # Ana viewer uygulaması (PuskulViewer class)
│   ├── puskul-geometry.js           # Püskül container sınıfı
│   ├── cell-loader.js               # Hücre yükleme sistemi
│   ├── cell-editor.js               # Hücre düzenleme modülü
│   └── layer-transition.js          # Katman geçiş yüzeyleri
│
├── 📦 CELLS/ (Hücre Geometrileri)
│   ├── badem-geometry.js            # Badem hücresi (B- prefix)
│   ├── yaprak-geometry.js           # Yaprak hücresi (Y- prefix)
│   ├── fitil-geometry.js            # Fitil hücresi (F- prefix)
│   ├── kazayak-geometry.js          # Kazayağı hücresi (K- prefix)
│   ├── README.md                    # Hücre interface dokümantasyonu
│   ├── BADEM_POLAR_CONSTRAINT.md    # Polar kısıtlama notları
│   └── POLAR_CONSTRAINT_SUMMARY.md  # Özet doküman
│
├── 🛠️ UTILS/ (Yardımcı Modüller)
│   ├── render-utils.js              # Render ve animasyon
│   ├── scene-setup.js               # Sahne kurulumu
│   ├── view-utils.js                # Kamera kontrolleri
│   ├── ui-utils.js                  # UI yönetimi
│   ├── polygon-guide.js             # Çokgen yardımcı çizgiler
│   ├── config-utils.js              # Konfigürasyon
│   └── export-utils.js              # Export/Import işlemleri
│
└── 📄 DOKÜMANTASYON
    ├── README.md                    # Bu dosya
    ├── PUSKUL_KURALLARI.md         # Tasarım kuralları
    └── debug.html                   # Debug sayfası
```

## 🚀 Kullanım

1. **Tarayıcıda Açın:**
   ```
   puskul-3d-viewer/index.html
   ```
   dosyasını herhangi bir modern tarayıcıda açın.

2. **Kontroller:**
   - **Sol Fare + Sürükle:** 3D modeli döndür (Orbit)
   - **Tekerlek:** Yakınlaş/Uzaklaş (Zoom)
   - **Sağ Fare + Sürükle:** Sahneyi kaydır (Pan)
   - **Modül Slider:** M değerini değiştir (20-100)
   - **Yükseklik Slider:** H değerini değiştir (50-200)

3. **Butonlar:**
   - **Wireframe Aç/Kapat:** Wireframe çizgilerini göster/gizle
   - **Noktalar Göster:** Geometri noktalarını göster/gizle
   - **İsimleri Göster:** Nokta isimlerini (Y-a1, vb.) göster/gizle
   - **Görünümü Sıfırla:** Kamerayı başlangıç pozisyonuna getir

## 📐 Geometri Detayları

### Hücre Tipleri ve Prefix Sistemi

**İsimlendirme:** `[PREFIX]-[nokta]`

| Hücre | Prefix | Nokta Sayısı | Kullanım |
|-------|--------|--------------|----------|
| **BADEM** | B- | 16 (4M+12S) | Ana hücre |
| **YAPRAK** | Y- | 16 (4M+12S) | Ana hücre |
| **FİTİL** | F- | 20 | Ara hücre |
| **KAZAYAĞI** | K- | 16+ | Ara hücre |

**Nokta Kategorileri:**
- **Master Points (4):** a1, b1, c1, d1 (kullanıcı düzenleyebilir)
- **Slave Points:** Otomatik hesaplanan bağımlı noktalar
- **Special Points:** w5, z5 (Badem), x4, x5, y4, y5 (Fitil)

### Nokta Sistemi (Badem/Yaprak)

**Seviyeler (Z ekseni notu):**
- Püskül geometri üretiminde tepe noktası `c6` referans alınır ve iç hesaplamalarda `c6` seviyesinin Z=0'a normalize edildiği kabul edilir. Birleşik geometri oluşturulurken ek Z ofset uygulanmaz (c6 zaten 0 kabul edilir).
- Aşağıdaki oranlar, seviyelerin yükseklik içindeki göreli konumlarını ifade eder. Tasarım mantığı yukarıdan aşağıya doğrudur (tepe→taban, -Z yönü):
- **Level 1 (Taban):** Y-a1, Y-b1, Y-c1, Y-d1 (4 Master nokta)
- **Level 2 (≈ 5/91 · H):** Y-a2, Y-b2, Y-d2 (3 Slave nokta)
- **Level 3 (≈ 30/91 · H):** Y-a3, Y-b3, Y-d3 (3 Slave nokta) - **PÜSKÜL özelliği: a3 eklendi!**
- **Level 4 (≈ 35/91 · H):** Y-a4, Y-b4, Y-d4 (3 Slave nokta) - **PÜSKÜL özelliği: a4 eklendi!**
- **Level 5 (≈ 65/91 · H):** Y-a5, Y-b5, Y-d5 (3 Slave nokta) - **PÜSKÜL özelliği: a5 eklendi!**
- **Level 6 (≈ 85/91 · H):** Y-c6 (1 Slave nokta - tepe)

**Toplam:** 16 nokta (4 Master + 12 Slave)

**PÜSKÜL Farkı:**
- ✅ **a3, a4, a5 noktaları VAR** (Badem'de yok)
- ❌ **w5 ve z5 noktaları YOK** (Badem'de var)
- ❌ **Level 7 YOK** (Badem'de a7 ve c7 var)

### Nokta Hesaplama Yöntemleri

#### 🎯 LEVEL 1 - Master Points (Kontrol Noktaları)
**Taban seviyesi (z=0), kullanıcı tarafından düzenlenebilir:**

- **Y-a1:** `{x: 0.0, y: a1_y, z: 0.0}` - ARKA nokta (iç kenar)
- **Y-b1:** `{x: b1_x, y: b1_y, z: 0.0}` - SAĞ nokta
- **Y-c1:** `{x: 0.0, y: c1_y, z: 0.0}` - ÖN nokta (dış kenar)
- **Y-d1:** `{x: d1_x, y: d1_y, z: 0.0}` - SOL nokta

> **Not:** Grid planda varsayılan değerler normalize edilmiştir. Radial planda sektör açısına göre polar koordinatlara dönüştürülür.

#### 🎯 LEVEL 2 - Slave Points (Bağımlı Noktalar)
**Yükseklik: ≈ 5H/91 (c6=0 normalize referansına göre)**

**Y-a2:** Master noktalardan c1'e doğru kayma (slaveRatio oranında)
```javascript
x = a1.x + (c1.x - a1.x) * slaveRatio
y = a1.y + (c1.y - a1.y) * slaveRatio
z = (5.0 / 91.0) * H
```
> slaveRatio = 0.09 (varsayılan %9)

**Y-b2:** b1'den c1'e doğru kayma
```javascript
x = b1.x + (c1.x - b1.x) * slaveRatio
y = b1.y + (c1.y - b1.y) * slaveRatio
z = (5.0 / 91.0) * H
```

**Y-d2:** d1'den c1'e doğru kayma
```javascript
x = d1.x + (c1.x - d1.x) * slaveRatio
y = d1.y + (c1.y - d1.y) * slaveRatio
z = (5.0 / 91.0) * H
```

#### 🎯 LEVEL 3 - Slave Points (PÜSKÜL Özelliği)
**Yükseklik: ≈ 30H/91 (c6=0 normalize referansına göre)**

**Y-a3:** a2 ile aynı XY düzleminde, farklı Z seviyesinde
```javascript
x = a2.x  // a2 ile aynı
y = a2.y  // a2 ile aynı
z = (30.0 / 91.0) * H  // b3 ile aynı Z
```
> **PÜSKÜL özelliği:** a3 noktası Badem'de yoktur!

**Y-b3:** b1'den c1'e doğru kayma (aynı ratio)
```javascript
x = b1.x + (c1.x - b1.x) * slaveRatio
y = b1.y + (c1.y - b1.y) * slaveRatio
z = (30.0 / 91.0) * H
```

**Y-d3:** d1'den c1'e doğru kayma (aynı ratio)
```javascript
x = d1.x + (c1.x - d1.x) * slaveRatio
y = d1.y + (c1.y - d1.y) * slaveRatio
z = (30.0 / 91.0) * H
```

#### 🎯 LEVEL 4 - Slave Points (PÜSKÜL Özelliği)
**Yükseklik: ≈ 35H/91 (c6=0 normalize referansına göre)**

**Y-a4:** İki paralel çizginin kesişim noktası
```javascript
// Çizgi 1: b4'ün (x,y)'sinden başlayıp a2-b2 doğrultusunda
// Çizgi 2: d4'ün (x,y)'sinden başlayıp a2-d2 doğrultusunda

dir1 = {x: b2.x - a2.x, y: b2.y - a2.y}  // a2-b2 yön vektörü
dir2 = {x: d2.x - a2.x, y: d2.y - a2.y}  // a2-d2 yön vektörü

// Parametrik kesişim hesabı
denominator = dir1.x * dir2.y - dir1.y * dir2.x
t = ((d4.x - b4.x) * dir2.y - (d4.y - b4.y) * dir2.x) / denominator

x = b4.x + t * dir1.x
y = b4.y + t * dir1.y
z = b4.z  // b4 ile aynı Z
```
> **PÜSKÜL özelliği:** a4 noktası Badem'de yoktur!

**Y-b4:** b1'den c1'e doğru kayma (slaveRatio2 oranında)
```javascript
x = b1.x + (c1.x - b1.x) * slaveRatio2
y = b1.y + (c1.y - b1.y) * slaveRatio2
z = (35.0 / 91.0) * H
```
> slaveRatio2 = 0.186 (varsayılan %18.6)

**Y-d4:** d1'den c1'e doğru kayma (slaveRatio2 oranında)
```javascript
x = d1.x + (c1.x - d1.x) * slaveRatio2
y = d1.y + (c1.y - d1.y) * slaveRatio2
z = (35.0 / 91.0) * H
```

#### 🎯 LEVEL 5 - Slave Points (PÜSKÜL Özelliği)
**Yükseklik: ≈ 65H/91 (c6=0 normalize referansına göre)**

**Y-a5:** a4 ile aynı XY düzleminde, farklı Z seviyesinde
```javascript
x = a4.x  // a4 ile aynı
y = a4.y  // a4 ile aynı
z = (65.0 / 91.0) * H  // b5 ile aynı Z
```
> **PÜSKÜL özelliği:** a5 noktası Badem'de yoktur!

**Y-b5:** b1'den c1'e doğru kayma (slaveRatio2 oranında)
```javascript
x = b1.x + (c1.x - b1.x) * slaveRatio2
y = b1.y + (c1.y - b1.y) * slaveRatio2
z = (65.0 / 91.0) * H
```

**Y-d5:** d1'den c1'e doğru kayma (slaveRatio2 oranında)
```javascript
x = d1.x + (c1.x - d1.x) * slaveRatio2
y = d1.y + (c1.y - d1.y) * slaveRatio2
z = (65.0 / 91.0) * H
```

#### 🎯 LEVEL 6 - Tepe Noktası
**Yükseklik: ≈ 85H/91 (c6=0 normalize referansına göre)**

**Y-c6:** c1'in dikey olarak yukarısında
```javascript
x = c1.x  // c1 ile aynı X
y = c1.y  // c1 ile aynı Y
z = (85.0 / 91.0) * H
```

### Yüzey Yapısı

**Toplam 12 Yüzey:** 5 Quad + 7 Triangle

#### Quad Yüzeyler (Dörtgen)
1. **Y-a1 → Y-b1 → Y-b2 → Y-a2** (Taban-Seviye 2, sağ)
2. **Y-a1 → Y-a2 → Y-d2 → Y-d1** (Taban-Seviye 2, sol)
3. **Y-a2 → Y-b2 → Y-b3 → Y-a3** (Seviye 2-3, sağ) - **PÜSKÜL: a3 içerir**
4. **Y-a4 → Y-b4 → Y-b5 → Y-a5** (Seviye 4-5, sağ) - **PÜSKÜL: a4-a5 içerir**
5. **Y-a2 → Y-a3 → Y-d3 → Y-d2** (Seviye 2-3, sol) - **PÜSKÜL: a3 içerir**
6. **Y-d4 → Y-a4 → Y-a5 → Y-d5** (Seviye 4-5, sol) - **PÜSKÜL: a4-a5 içerir**

#### Triangle Yüzeyler (Üçgen)
7. **Y-a4 → Y-a3 → Y-b3** (a3-a4 geçişi, sağ) - **PÜSKÜL: a3-a4 bağlantısı**
8. **Y-a4 → Y-b3 → Y-b4** (a4 geçişi, sağ)
9. **Y-a5 → Y-b5 → Y-c6** (Tepe, sağ)
10. **Y-a3 → Y-a4 → Y-d3** (a3-a4 geçişi, sol) - **PÜSKÜL: a3-a4 bağlantısı**
11. **Y-a4 → Y-d4 → Y-d3** (a4 geçişi, sol)
12. **Y-a5 → Y-c6 → Y-d5** (Tepe, sol)

### Katman Sistemi (Layer System)

**Özellikler:**
- **Çok Katmanlı:** Sınırsız katman ekleme
- **Parent-Child İlişkisi:** Hiyerarşik yapı
- **Otomatik Z Offset:** Recursive hesaplama
- **Layer Transition:** Katmanlar arası geçiş yüzeyleri
- **Custom Boundary:** c6 → a1 hizalama

**Katman Parametreleri:**
```javascript
{
    sides: 4-8,                    // Ngon kenar sayısı
    placement: 'corner' | 'edge',  // Yerleşim tipi
    outerRadius: 100-500,          // Dış ngon yarıçapı
    innerRadius: 50-400,           // İç ngon yarıçapı
    mainCellType: 'BADEM' | 'YAPRAK',
    interCellType: 'FITIL' | 'KAZAYAGI' | 'YOK',
    cellMultiplier: 1-3,           // Ana + ara hücre çarpanı
    H: 50-200,                     // Katman yüksekliği
    transitionHeight: 0-100        // Geçiş yüzeyi yüksekliği
}
```

### Parametrik Değerler

- **M (Modül):** Hücre derinliği (outerRadius - innerRadius)
- **H (Yükseklik):** Toplam dikey yükseklik
- **slaveRatio (r1):** Level 2-3 için master'dan c1'e kayma oranı (varsayılan: 0.09)
- **slaveRatio2 (r2):** Level 4-5 için kayma oranı (varsayılan: 0.096-0.20)
- **ratioZ5 (r3):** Badem için özel oran (varsayılan: 0.35)
- **radialRatio:** b1/d1'in radyal konumu (varsayılan: 0.403)
- **narrowFactor:** b1/d1 daralma faktörü (varsayılan: 1.0)

#### Oran Varsayılanları (Hücre Tipi ve Yerleşime Göre)
- **BADEM**
  - `slaveRatio (r1)`: 0.09
  - `slaveRatio2 (r2)`: Kenar yerleşimi (edge) için 0.20, köşe yerleşimi (corner) için 0.096
  - `ratioZ5 (r3)`: 0.35 varsayılan (sadece Badem)
- **YAPRAK**
  - `slaveRatio (r1)`: 0.09
  - `slaveRatio2 (r2)`: 0.096
- **FITIL**
  - `slaveRatio (r1)`: 0.09 (normalize)
  - `slaveRatio2 (r2)`: 0.096 (normalize) — yerleşime göre editörde farklı başlangıçlar kullanılabilir
- **KAZAYAGI**
  - `slaveRatio (r1)`: 0.09 (normalize)
  - `slaveRatio2 (r2)`: 0.186 (normalize)

Not: Bu varsayılanlar editör tarafından hücre tipine ve aktif katmanın yerleşimine göre ön değer olarak set edilir ve panelden değiştirilebilir.

## 🔧 Teknik Detaylar

**Kullanılan Teknolojiler:**
- Three.js r140 (CDN)
- OrbitControls
- Vanilla JavaScript (ES6+)
- HTML5 Canvas

**Koordinat Sistemi (Z-UP):**
- **X (Kırmızı):** Sağ/Sol
- **Y (Yeşil):** Ön/Arka (Radial planda: Radyal derinlik)
- **Z (Mavi):** ⬆️ YUKARI (CAD standardı)

Not: Hücre içi geometride `c6` tepe noktası Z=0'a normalize edilir; birleşik geometri oluştururken ek Z kaydırma yapılmaz.

**Grid Plan vs Radial Plan:**
- **Grid Plan:** Standart kartezyen koordinat sistemi (a1_y=0, c1_y=-1.0)
- **Radial Plan:** Polar koordinat sistemi (innerRadius → outerRadius, sektör açısı ile)

Ek Radial Parametreler (Badem/Yaprak):
- `radialRatio`: Dış/iç dağılım oranı (varsayılan ≈ 0.403)
- `narrowFactor`: b1/d1 boşluk daraltma faktörü (varsayılan 1.0)

## 🎨 Renkler

- **Yüzeyler:** Mor (#8B4789)
- **Wireframe:** Siyah (#333333)
- **Geometri Noktaları:** Yeşil (#00FF00)
- **Grid:** Koyu gri
- **Eksenler:** RGB (X=Kırmızı, Y=Yeşil, Z=Mavi)

## 📊 İstatistikler

Konsola bakın (F12 → Console) detaylı bilgi için:
- **Toplam nokta sayısı:** 16 (4 Master + 12 Slave)
- **Toplam yüzey sayısı:** 12 (5 Quad + 7 Triangle)
- **Modül (M):** Ayarlanabilir (20-100)
- **Yükseklik (H):** Ayarlanabilir (50-200)
- **Slave Ratio 1:** 0.09 (Level 2-3 için)
- **Slave Ratio 2:** 0.186 (Level 4-5 için)

## ⚠️ Notlar

- Bu proje **ana Mukarnas projesinden tamamen bağımsızdır**
- CDN kullanılıyor, internet bağlantısı gerekir
- Modern tarayıcılarda çalışır (Chrome, Firefox, Edge, Safari)
- Local server gerekmez, doğrudan HTML açılabilir
- **PÜSKÜL'e özel:** a3, a4, a5 noktaları Badem geometrisinde yoktur
- Master noktalar (a1, b1, c1, d1) kullanıcı tarafından düzenlenebilir
- Slave noktalar master noktalara bağımlı olarak otomatik hesaplanır

### Snap ve Bağlantı Kuralları (Özet)
- **Badem–Badem:** Yan noktalar orta noktaya doğru yaklaşır (b1 ↔ d1)
- **Fitil/Kazayağı ↔ Badem/Yaprak:** Komşu Badem/Yaprak `c1` noktası sabittir; Fitil/Kazayağı `b1`/`d1` ona doğru hareket eder
- **Fitil a1 Üçlü Snap:** `Badem(b1) ← Fitil(a1) → Badem(d1)` üçlü ortalama hedefine yaklaşır
- **Ara hücre varsa:** Otomatik tam snap uygulanır (snap gücü = 1.0)

Detaylar için `PUSKUL_KURALLARI.md` dosyasına bakın.

## 🔍 Geliştirme

Konsola şunları yazarak test edebilirsiniz:

```javascript
// Viewer nesnesine eriş (püskül viewer artık)
window.puskulViewer

// Geometri bilgilerini al
window.puskulViewer.puskulGeometry.getStats()

// Nokta listesini al
window.puskulViewer.puskulGeometry.getPointsArray()

// Master noktayı güncelle (örnek)
window.puskulViewer.puskulGeometry.updateMasterPoint('Y-b1', 0.5, -0.1)

// Slave ratio'yu değiştir
window.puskulViewer.puskulGeometry.updateSlaveRatio(0.15) // %15
```

## 📝 Sürüm Geçmişi

**v4.0.0** - Kasım 2025 (Mevcut)
- ✅ **4 Hücre Tipi:** Badem, Yaprak, Fitil, Kazayağı tam entegre
- ✅ **Katman Sistemi:** Çok katmanlı yapı, parent-child ilişkisi
- ✅ **Layer Transition:** Katmanlar arası geçiş yüzeyleri
- ✅ **Cell Editor:** Hücre bazlı düzenleme paneli
- ✅ **Custom Boundary:** Multi-layer alignment (c6 → a1)
- ✅ **PIP Görünüm:** Ortografik top view
- ✅ **Export/Import:** Proje kaydetme sistemi
- ✅ **Snap/Deformasyon:** Gelişmiş bağlantı kuralları
- ✅ **Custom Z Levels:** Kullanıcı kontrollü Z seviyeleri
- ✅ **Radial Parametreler:** radialRatio ve narrowFactor

**v3.0.0** - Ekim 2025
- Püskül modülü için ilk sürüm
- Grid ve Radial plan desteği
- Temel geometri sistemi

---

**Proje:** MukarnasPro  
**Modül:** Püskül 3D Test Viewer  
**Durum:** Bağımsız Test Ortamı  
**Geometri Tipi:** Parametrik 3D (4 Master Point + 12 Dependent Point)


