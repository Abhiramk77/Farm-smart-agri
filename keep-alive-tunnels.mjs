import localtunnel from 'localtunnel';

const startTunnel = async (port, subdomain, name) => {
  try {
    const tunnel = await localtunnel({ port, subdomain });
    console.log(`✅ ${name} deployed at: ${tunnel.url}`);

    tunnel.on('close', () => {
      console.log(`⚠️ ${name} tunnel closed. Restarting in 3 seconds...`);
      setTimeout(() => startTunnel(port, subdomain, name), 3000);
    });

    tunnel.on('error', (err) => {
      console.log(`❌ ${name} tunnel error:`, err);
    });
  } catch (err) {
    console.log(`❌ Failed to start ${name} tunnel. Retrying...`);
    setTimeout(() => startTunnel(port, subdomain, name), 3000);
  }
};

console.log('Starting permanent deployment tunnels...');
startTunnel(3000, 'farming-api-1234', 'Backend API');
startTunnel(5173, 'farming-web-1234', 'Frontend Web');

// Keep process alive
setInterval(() => {}, 1000 * 60 * 60);
