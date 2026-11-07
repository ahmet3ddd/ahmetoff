#!/usr/bin/env bash
# Seçki Dublaj kurulumu — Ubuntu için tek komut:
#   bash <(curl -fsSL https://ahmetoff.com/ahmetoff/projects/secki/dublaj/install.sh)
set -euo pipefail

BASE="https://ahmetoff.com/ahmetoff/projects/secki/dublaj"
DIR="$HOME/.secki-dublaj"
HOST="${SECKI_HOST:-dublaj.ahmetoff.com}"
TUNNEL="secki-dublaj"
PAGE="https://ahmetoff.com/ahmetoff/projects/secki/"

say(){ printf '\n\033[1;33m== %s\033[0m\n' "$*"; }

say "1/6 Gerekli paketler kuruluyor (parolanı sorabilir)"
sudo apt-get update -qq
sudo apt-get install -y -qq ffmpeg python3-venv python3-pip qrencode curl >/dev/null
if ! command -v cloudflared >/dev/null 2>&1; then
  ARCH="$(dpkg --print-architecture)"
  curl -fsSL -o /tmp/cloudflared.deb "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb"
  sudo dpkg -i /tmp/cloudflared.deb >/dev/null
fi

say "2/6 Python ortamı hazırlanıyor (birkaç dakika sürebilir)"
mkdir -p "$DIR"
[ -d "$DIR/venv" ] || python3 -m venv "$DIR/venv"
"$DIR/venv/bin/pip" install -q --upgrade pip
"$DIR/venv/bin/pip" install -q --upgrade "yt-dlp[default]" faster-whisper edge-tts deep-translator numpy deno
curl -fsSL "$BASE/server.py" -o "$DIR/server.py"
if [ ! -s "$DIR/token" ]; then
  python3 -c "import secrets;print(secrets.token_hex(16))" > "$DIR/token"
  chmod 600 "$DIR/token"
fi
TOKEN="$(cat "$DIR/token")"

say "3/6 Cloudflare tüneli ($HOST)"
if [ ! -f "$HOME/.cloudflared/cert.pem" ]; then
  echo "Tarayıcı açılacak: listeden ahmetoff.com'u seç ve Authorize'a bas. Sonra buraya dön."
  cloudflared tunnel login
fi
if ! cloudflared tunnel info "$TUNNEL" >/dev/null 2>&1; then
  cloudflared tunnel create "$TUNNEL" >/dev/null
fi
TID="$(cloudflared tunnel list -o json | python3 -c "import sys,json;print([t['id'] for t in json.load(sys.stdin) if t['name']=='$TUNNEL'][0])")"
cloudflared tunnel route dns --overwrite-dns "$TUNNEL" "$HOST" >/dev/null 2>&1 || cloudflared tunnel route dns "$TUNNEL" "$HOST" || true
cat > "$DIR/tunnel.yml" <<EOF
tunnel: $TID
credentials-file: $HOME/.cloudflared/$TID.json
ingress:
  - hostname: $HOST
    service: http://127.0.0.1:8765
  - service: http_status:404
EOF

say "4/6 Arka plan servisleri kuruluyor"
mkdir -p "$HOME/.config/systemd/user"
cat > "$HOME/.config/systemd/user/secki-dublaj.service" <<EOF
[Unit]
Description=Secki Dublaj servisi
After=network-online.target

[Service]
Environment=PATH=$DIR/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=$DIR/venv/bin/python $DIR/server.py
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF
cat > "$HOME/.config/systemd/user/secki-tunnel.service" <<EOF
[Unit]
Description=Secki Dublaj Cloudflare tuneli
After=network-online.target

[Service]
ExecStart=$(command -v cloudflared) tunnel --no-autoupdate --config $DIR/tunnel.yml run $TUNNEL
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF
# yt-dlp'yi her gün güncel tut (YouTube sık değişiyor)
cat > "$HOME/.config/systemd/user/secki-update.service" <<EOF
[Service]
Type=oneshot
ExecStart=$DIR/venv/bin/pip install -q --upgrade "yt-dlp[default]"
EOF
cat > "$HOME/.config/systemd/user/secki-update.timer" <<EOF
[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF
systemctl --user daemon-reload
systemctl --user enable --now secki-dublaj.service secki-tunnel.service secki-update.timer >/dev/null
systemctl --user restart secki-dublaj.service secki-tunnel.service
sudo loginctl enable-linger "$USER" || true

say "5/6 Bağlantı deneniyor"
OK=0
for i in $(seq 1 30); do
  H="$(curl -fsS "https://$HOST/health?t=$TOKEN" 2>/dev/null || true)"
  case "$H" in *'"auth": true'*) OK=1; break;; esac
  sleep 3
done
if [ "$OK" = 1 ]; then echo "Servis çalışıyor: https://$HOST"; else
  echo "Servis henüz dışarıdan yanıt vermiyor. Birkaç dakika sonra Seçki'den tekrar dene."
  echo "Durum için: systemctl --user status secki-dublaj secki-tunnel"
fi

say "6/6 Telefona ve tarayıcıya aktarım"
PAYLOAD="$(printf '{"d":{"u":"https://%s","t":"%s"}}' "$HOST" "$TOKEN" | base64 -w0)"
URL="${PAGE}#k=${PAYLOAD}"
qrencode -s 10 -o "$DIR/telefon-qr.png" "$URL"
xdg-open "$URL" >/dev/null 2>&1 || true
xdg-open "$DIR/telefon-qr.png" >/dev/null 2>&1 || true
echo
echo "Tamam. Açılan QR'ı telefonun kamerasıyla okut; Seçki dublaj servisine bağlanır."
echo "QR dosyası: $DIR/telefon-qr.png"
