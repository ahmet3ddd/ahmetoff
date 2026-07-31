# ahmetoff

Bu repo bir "monorepo" iskeletidir — birden fazla bağımsız projenin bir arada tutulması için düzen sağlar.

Benim amacım: sen projelerini buraya kopyalarsın; ben gelen projeleri inceleyip (isteğe bağlı) README ve gerekli açıklamaları hazırlayarak düzenlemelere yardımcı olurum. Sen repo sahibi olarak bu repo üzerinden aktif yönetim yapmak zorunda değilsin.

Özet yapı
- /projects/: Her bağımsız proje için bir alt klasör burada olacak. Örnek: `projects/my-service/`
- README_TEMPLATE.md: Her projeye koyacağın README'in şablonu
- LICENSE: Bu repoda root-level lisans olarak MIT (tüm repoya genel lisans bilgisi). Projenin sahibi istersen proje bazında farklı lisans ekleyebilir.
- .gitignore: Çok-dilli temel ayarlar
- CONTRIBUTING.md, CODE_OF_CONDUCT.md: Katkı ve davranış kuralları (kısa)

Kısa kullanım
1. Yeni bir proje eklemek için `projects/<project-name>/` altında bir klasör oluştur ve tüm proje dosyalarını buraya kopyala.
2. Her proje için bir `README.md` koy (README_TEMPLATE.md'ı kopyalayarak kullanabilirsin).
3. Varsayılan olarak her proje kendi CI iş akışını barındırsın — buraya global CI eklenmedi.
4. Projeyi ekledikten sonra bana haber ver; ben yeni projeyi inceleyip eksik README/başlangıç dokümantasyonu ekleyebilirim.

Notlar
- Repo public: Evet
- Issue/PR şablonları: Yok (sen istemiştin)
- Ben seni PR/issue ile zorunlu olarak etiketlemem; sen haber verdiğinde inceleme yaparım.

