sudo sed -i 's/server_name 89.252.153.147;/server_name 89.252.153.147 cnt-147.153.252.89.compute.cenuta.cloud;/g' /etc/nginx/sites-available/hdfc-stremio
sudo systemctl restart nginx
sudo certbot --nginx -d cnt-147.153.252.89.compute.cenuta.cloud --non-interactive --agree-tos -m taspelin333@gmail.com --redirect
sudo sed -i 's/BASE_URL=https:\/\/89.252.153.147/BASE_URL=https:\/\/cnt-147.153.252.89.compute.cenuta.cloud/g' /opt/hdfilmcehennemi-stremio/.env
sudo systemctl restart hdfc-stremio
