# Püskül 3D - Web

Mukarnas püskül (sarkıt) yapılarının parametrik 3D modellemesi ve görselleştirmesi.
Tarayıcıda çalışır, kurulum gerektirmez.

Arayüz **AI_muk3d/web** projesinin görsel diliyle kurulmuştur: koyu panel yüzeyleri,
altın vurgu rengi, üst eylem çubuğu + sol parametre kolonu + tam ekran viewport.

## Çalıştırma

`index.html` dosyasına çift tıklayın veya basit bir sunucu üzerinden açın:

```bash
python -m http.server 8000
# http://localhost:8000
```

Three.js (r140) CDN üzerinden yüklenir, internet bağlantısı gerekir.

## Arayüz

| Bölüm | İçerik |
| --- | --- |
| Üst çubuk | Yardım, Kaydet / Yükle (JSON), Gri Mod, Kamera, STL / DXF export |
| Sol kolon | Katman yönetimi, püskül şekil tasarımı, hücre tipi atama, yan tutunma, badem/yaprak oranları |
| Viewport | 3D görünüm (Z yukarı), sağ üstte PIP ortografik üst görünüm, altta Wireframe / Grid / PIP anahtarları |
| Detay paneli | Hücreye çift tıklayınca açılır: ratio ayarları ve Z seviyeleri |

Fare: *sol tuş* orbit, *sağ tuş* pan, *tekerlek* zoom.

## Dizin yapısı

```
index.html              Arayüz iskeleti
css/style.css           Görsel dil (renk jetonları, panel/viewport/modal stilleri)
js/
  app.js                Ana uygulama (PuskulViewer)
  puskul-geometry.js    Püskül plan + yerleşim geometrisi
  puskul-sonu-geometry.js
  cell-loader.js        Hücre yükleme / tip eşleme
  cell-editor.js        Hücre düzenleme paneli
  layer-transition.js   Katmanlar arası geçiş yüzeyleri
  layer-boundary.js     Katman sınırları
  layer-ui.js           Katman arayüz bağlantıları + toast bildirimi
  cells/                Badem, Fitil, Yaprak, Kazayağı hücre geometrileri
  utils/                Sahne kurulumu, render, plan kılavuzu, UI, config, export
docs/                   Kural ve tasarım dokümanları
```

## Renk jetonları

`css/style.css` içindeki `:root` değişkenleri tek kaynaktır:

| Jeton | Değer | Kullanım |
| --- | --- | --- |
| `--bg` | `#1e1f22` | Sayfa ve viewport zemini (3D sahne arkaplanı da aynı) |
| `--panel` | `#2a2c30` | Üst çubuk, sol kolon, modal gövdesi |
| `--panel-2` | `#34373c` | Panel kartları |
| `--border` | `#3f4248` | Tüm kenarlıklar |
| `--accent` | `#d6a04a` | Vurgu, aktif durum, sayısal okumalar |
| `--ok` / `--info` / `--danger` | `#3aa05c` / `#5b8fd6` / `#c0533a` | Durum renkleri |

Aynı palet 3D sahneye de taşınır: katman mesh renkleri (`RenderUtils.LAYER_COLORS`),
tel kafes, plan kılavuz çizgileri ve geçiş yüzeyi bu jetonlarla uyumludur.

## Export

- **STL** — ASCII mesh; tüm katmanlar veya yalnız aktif katman.
- **DXF** — 3DFACE + kenar çizgileri; tüm katmanlar veya yalnız aktif katman.
- **Kaydet / Yükle** — tüm katman ve hücre ayarları JSON olarak.

## Dokümanlar

- `docs/PUSKUL_KURALLARI.md` — püskül yerleşim ve hücre kuralları
- `docs/HUCRE_BAGLANTI_VE_KOPRU_YUZEY_RAPORU.md` — hücre bağlantıları, köprü yüzeyler
- `docs/BADEM_POLAR_CONSTRAINT.md`, `docs/POLAR_CONSTRAINT_SUMMARY.md` — badem polar kısıtları
- `docs/README.md` — önceki sürümün ayrıntılı teknik notları
