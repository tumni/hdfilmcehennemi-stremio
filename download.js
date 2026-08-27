const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    sftp.fastGet('/opt/hdfilmcehennemi-stremio/scraper.js', 'scraper-vps.js', (err) => {
      conn.end();
      console.log('Downloaded scraper.js from VPS');
    });
  });
}).connect({
  host: '89.252.153.147',
  port: 22,
  username: 'ubuntu',
  password: 'ch6mrmMghW2brR',
  readyTimeout: 120000
});
