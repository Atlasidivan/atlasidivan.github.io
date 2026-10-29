# AGENTS.md — Codex proje talimatları

**Oturum başında sırayla:** bu dosyayı, ardından `AI_HANDOFF.md`'yi oku; `git status` ve `git log -5` ile son değişikliklere bak.

- Rol: yedek geliştirici. Claude Code'un yarım bıraktığı "Devam eden görev"den devam et; projeyi sıfırdan kurma, mimariyi gerekçesiz değiştirme, çalışan kodu yeniden yazma.
- Yığın ve kurallar `CLAUDE.md` ile aynıdır (statik site, `data/features.json` tek veri kaynağı, kaynaksız konum yok, yayın en son).
- Bitirdiğinde: `python -m http.server 8000` ile Chrome'da test et, `AI_HANDOFF.md`'yi güncelle ("Aktif geliştirici: Codex", yapılanlar, test sonucu, sıradaki iş), commit at.
- Riskli git işlemleri (force push, reset --hard, geçmiş yeniden yazma) kullanıcı onayı olmadan yapılmaz. Gizli bilgi dosyalara yazılmaz.
