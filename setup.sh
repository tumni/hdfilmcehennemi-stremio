#!/bin/bash
set -e

echo "Updating packages..."
sudo apt update
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx unzip

echo "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

cd /opt/hdfilmcehennemi-stremio
echo "Installing dependencies..."
sudo npm install

echo "Creating low-privilege user..."
if id "hdfc" &>/dev/null; then
    echo "User hdfc already exists."
else
    sudo useradd -r -s /bin/false hdfc
fi

sudo chown -R hdfc:hdfc /opt/hdfilmcehennemi-stremio
sudo chmod 755 /opt/hdfilmcehennemi-stremio

echo "Setting up production .env..."
DOMAIN="89.252.153.147"
cat <<EOF | sudo tee /opt/hdfilmcehennemi-stremio/.env
PORT=7000
BASE_URL=https://$DOMAIN
LOG_LEVEL=info
PROXY_ENABLED=auto
NODE_ENV=production
EOF
sudo chown hdfc:hdfc /opt/hdfilmcehennemi-stremio/.env
sudo chmod 600 /opt/hdfilmcehennemi-stremio/.env

echo "Configuring systemd service..."
cat <<EOF | sudo tee /etc/systemd/system/hdfc-stremio.service
[Unit]
Description=HDFilmCehennemi Stremio Addon
After=network.target

[Service]
User=hdfc
WorkingDirectory=/opt/hdfilmcehennemi-stremio
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo "Configuring systemd timer for healthcheck..."
cat <<EOF | sudo tee /etc/systemd/system/hdfc-healthcheck.service
[Unit]
Description=HDFilmCehennemi Healthcheck

[Service]
Type=oneshot
User=hdfc
WorkingDirectory=/opt/hdfilmcehennemi-stremio
ExecStart=/usr/bin/npm run healthcheck
EOF

cat <<EOF | sudo tee /etc/systemd/system/hdfc-healthcheck.timer
[Unit]
Description=Run HDFilmCehennemi Healthcheck daily

[Timer]
OnCalendar=*-*-* 04:00:00
Timezone=Europe/Istanbul
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now hdfc-stremio
sudo systemctl enable --now hdfc-healthcheck.timer

echo "Configuring Nginx..."
cat <<EOF | sudo tee /etc/nginx/sites-available/hdfc-stremio
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:7000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        send_timeout 120s;
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/hdfc-stremio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "Setting up Firewall (UFW)..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "Deployment complete."
