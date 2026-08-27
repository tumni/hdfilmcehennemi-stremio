# HDFilmCehennemi Stremio - Dağıtım (Deployment) Kılavuzu

Bu kılavuz, HDFilmCehennemi Stremio addon'unun VPS üzerindeki production durumunu yönetmeniz için hazırlanmıştır.

## Servis Yönetimi (systemd)

Addon servisi `systemd` ile çalışmaktadır.
- **Servis Durumu:** `sudo systemctl status hdfc-stremio`
- **Servisi Başlatma:** `sudo systemctl start hdfc-stremio`
- **Servisi Durdurma:** `sudo systemctl stop hdfc-stremio`
- **Servisi Yeniden Başlatma (Restart):** `sudo systemctl restart hdfc-stremio`

## Günlük Otomatik Kontrol (Healthcheck Timer)

Sistem her gün otomatik olarak scraping pipeline'ını test eder.
- **Timer Durumu:** `sudo systemctl status hdfc-healthcheck.timer`
- **Son Çalışma Logları:** `sudo journalctl -u hdfc-healthcheck.service -n 50 --no-pager`

## Logları İzleme

Log rotation aktiftir, ancak anlık logları izlemek isterseniz:
- **Tüm Logları İzle:** `sudo journalctl -u hdfc-stremio -f`
- **Son 100 Satır Log:** `sudo journalctl -u hdfc-stremio -n 100 --no-pager`

## Manuel Kontroller ve CLI Araçları

Proje dizinine (`/opt/hdfilmcehennemi-stremio`) giderek aşağıdaki komutları çalıştırabilirsiniz:
- **Manuel Healthcheck:** `npm run healthcheck` (Tüm sistemi test eder)
- **Sistem Durumu:** `npm run status` (Aktif decoder pipeline, hata logları sayısını vs. gösterir)
- **Kapsamlı Test:** `npm test`

## Nginx ve SSL Kontrolü

Nginx proxy olarak Node.js 7000 portunu 443 portuna yönlendirmektedir.
- **Nginx Durumu:** `sudo systemctl status nginx`
- **Nginx Config Testi:** `sudo nginx -t`
- **SSL Yenileme Kontrolü:** `sudo certbot renew --dry-run`

## Active Decoder Profile ve Rollback

Sistem HDFilmCehennemi algoritma değiştirirse bunu otomatik AST analizi ile çözer ve yeni profil oluşturur.
- **Aktif Profil Konumu:** `/opt/hdfilmcehennemi-stremio/runtime/decoder-profile.json`
- **Hata (Failure) Snapshotları:** `/opt/hdfilmcehennemi-stremio/runtime/failures/`
- **Rollback (Önceki Profile Dönme):** Eğer yeni profil çalışmazsa, klasördeki `decoder-profile.previous.json` dosyasını `decoder-profile.json` üzerine yazarak rollback yapabilirsiniz. (Ardından `npm start` veya `systemctl restart hdfc-stremio` ile yeniden başlatın, genelde runtime hot-reload çalışır.)
