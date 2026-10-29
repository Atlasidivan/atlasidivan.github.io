# CLAUDE.md — Claude Code proje talimatları

**Oturum başında önce `AI_HANDOFF.md` dosyasını oku.** Codex çalıştıysa git değişikliklerini ve test sonuçlarını doğrula, sonra kaldığın yerden devam et.

- Rol: ana geliştirici ve mimari sorumlusu. Codex yedek geliştiricidir; aynı anda yalnız bir ajan kod değiştirir.
- Yığın: statik HTML/CSS/Vanilla JS (ES Modules) + Leaflet (`vendor/`). Framework, backend, veritabanı ekleme.
- Veri tek kaynak: `data/features.json`. Konum/sınır/yer adı uydurma; her kayıt `source` içermeli, belirsizse `confidence` düşür veya `tanimsiz` yap.
- Dairesel harita oryantasyonu: üst Doğu, alt Batı, sol Kuzey, sağ Güney; merkez Balasagun. Geometrik dönüşüm yapma.
- Her önemli adımdan sonra `AI_HANDOFF.md`'yi güncelle (kısa); mümkünse commit at. Kayıt tutmayı son ana bırakma.
- GitHub Pages yayını EN SON aşamadır; geliştirme bitmeden yayımlama.
- Gizli bilgi / token ortak dosyalara yazılmaz.
