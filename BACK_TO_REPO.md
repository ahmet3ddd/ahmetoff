Hoş geldin! (Kısa hafıza notu)

- Hızlı kontrol: projects/ dizinine bak. Yeni projelere buradan başlayacaksın.
- Kısa eylem: projects/<project-name>/ oluştur, dosyalarını kopyala, README_TEMPLATE.md'ı kopyala ve README.md doldur.

Detaylı adımlar — adım adım

1) Yeni proje ekleme
   - Yeni bir klasör oluştur: projects/<project-name>/
   - Proje dosyalarını bu klasöre kopyala
   - `projects/README_TEMPLATE.md` dosyasını kopyalayıp `projects/<project-name>/README.md` olarak doldur
   - (İstersen) proje için `projects/<project-name>/LICENSE` ekle — aksi halde root-level MIT geçerli olur

2) Commit ve branch
   - Tercih edilen iş akışı: yeni bir branch oluştur (ör. `feature/<project-name>`) -> commit -> PR aç -> hedef `main`
   - Eğer sadece hızlı bir ekleme yapacaksan doğrudan `main`'e de commit edebilirsin, ama PR önerilir (geri alma kolaylığı için)

3) İnceleme talebi (benim yapacağım)
   - Projeyi ekledikten sonra bana bu chat üzerinden PR linkini gönder veya "Projeyi ekledim, incele" şeklinde yaz.
   - Ben gelen projeleri tarayıp eksik README ve başlangıç dökümantasyonunu hazırlayıp sana bir PR ile sunacağım.
   - İstersen ben doğrudan main'e commit de yapabilirim; otomatik değişiklik yapmamı istiyorsan bu chatte söyle (varsayılan: PR ile öneririm).

4) Kısa teknik hatırlatmalar
   - Default branch: `main`
   - Root lisans: MIT (LICENSE dosyası repoda)
   - Global CI yok: "Her proje kendi CI'sini kullansın" dedik — proje içine CI ekleyebilirsin
   - Issue/PR şablonları yok — sen ilgilenmek istemezsen bu boş kalacak

5) GitHub Pages (isteğe bağlı)
   - Basit landing page için `docs/index.html` konuldu. Yayınlamak istersen GitHub repo -> Settings -> Pages -> Branch: `main` / Folder: `/docs` seç ve Save.

6) Hızlı sorun giderme
   - Eğer bir şey yanlış giderse: bana bu chatte PR/branch linkini ver, ben düzeltmeyi öneririm.

Kısaca: ne zaman projeyi eklesen, bana PR linkini at ya da "incele" yaz — ben eksik README ve başlangıç dokümantasyonlarını tamamlayıp sana PR açacağım.

Linkler ve yollar (hatırlaman kolay olsun diye)
- Repo ana sayfa: https://github.com/ahmet3ddd/ahmetoff
- Projects dizini: https://github.com/ahmet3ddd/ahmetoff/tree/main/projects
- README şablonu: projects/README_TEMPLATE.md
- Landing page dosyası: docs/index.html
- Root README: README.md

Başlangıç için: hemen küçük bir proje ekle ve bana PR linkini gönder; ben incelemeye başlıyorum.