# Köşe Mukarnas

Köşe mukarnaslarını üçgen plan üzerinden parametrik olarak 2B ve 3B kurgulayan, tarayıcıda çalışan bir tasarım aracı.

**▶ Canlı demo:** https://ahmet3ddd.github.io/ahmetoff/projects/AI_K_muk3d/

<img src="../../assets/shot-kmuk3d.png" alt="Köşe Mukarnas" width="100%" />

## Özellikler

- **Plan şablonları** — eşkenar üçgen, dik üçgen veya özel koordinat girişi
- **Plan noktaları** — P1, P2, P3 doğrudan koordinatla ya da sürükleyerek düzenlenir; kenar eşitleme yardımcıları
- **Mukarnas parametreleri** — asaba adedi, toplam H, asaba h, yanak derinlik, plandan bağımsız X ölçüsü
- Asaba sayısına göre kademeli hücre bölünmesi; eş zamanlı 2B plan ve 3B görünüm
- **DXF**, **STL** ve **PNG** dışa aktarım

Asaba adedi arttıkça plan üçgeni alt hücrelere bölünür ve 3B form kademelenir (örn. asaba = 3 → 6 hücre).

## Kullanım

Kurulum gerekmez. `index.html` dosyasını tarayıcıda aç (3B için internet bağlantısı gerekir — Three.js CDN'den yüklenir).

Eşit kenar notu: orijinal MaxScript eşit kenarlı köşe varsayar. `|P1–P3| ≠ |P1–P2|` olduğunda asaba genişliği iki kenarda farklı olur ve araç uyarı verir. *P3'ü şimdi eşitle* tek seferlik düzeltir; *Kenarları eşit tut* seçeneği P3 yönünü koruyarak uzunluğu sürekli sabit tutar.

## Dizin yapısı

```
index.html              Arayüz
css/style.css           Görsel dil
js/
  main.js               Ana uygulama
  mukarnas-geometry.js  Plan ve kademe geometrisi
  viewer-2d.js          2B plan görünümü
  viewer-3d.js          3B görünüm
  export-dxf.js / export-stl.js / export-png.js
assets/                 Plan şeması (SVG)
docs/                   Orijinal MaxScript kaynakları ve referans görseller
scripts/                Geometri ve koordinat test betikleri
```

## Teknoloji

Saf HTML/CSS/JavaScript + [Three.js](https://threejs.org) r147.

---

← [Tüm projeler](../../)
