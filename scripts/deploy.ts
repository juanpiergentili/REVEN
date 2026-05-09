import { Client } from 'basic-ftp';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

config({ path: '.env.deploy' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');

const FTP_HOST = process.env.FTP_HOST!;
const FTP_USER = process.env.FTP_USER!;
const FTP_PASS = process.env.FTP_PASS!;
const FTP_REMOTE_DIR = process.env.FTP_REMOTE_DIR ?? '/public_html';

if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
  console.error('❌  Faltan credenciales en .env.deploy (FTP_HOST, FTP_USER, FTP_PASS)');
  process.exit(1);
}

async function deploy() {
  console.log('\n🔨  Buildeando la app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Inyectar timestamp en el HTML para romper caché de proxy/CDN
  const indexPath = path.join(distPath, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');
  const ts = Date.now();
  // Agregar query string a los assets para forzar recarga
  html = html.replace(/\/assets\/(index-[^"]+\.js)"/g, `/assets/$1?v=${ts}"`);
  html = html.replace(/\/assets\/(index-[^"]+\.css)"/g, `/assets/$1?v=${ts}"`);
  // Agregar meta tag con timestamp para identificar la versión
  html = html.replace('</head>', `  <meta name="deploy-ts" content="${ts}" />\n  </head>`);
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log(`📌  Timestamp inyectado: ${ts}`);

  const client = new Client();

  try {
    console.log(`\n🔌  Conectando a ${FTP_HOST}...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: true,
      secureOptions: { rejectUnauthorized: false },
    });

    console.log(`📂  Navegando a ${FTP_REMOTE_DIR}...`);
    await client.ensureDir(FTP_REMOTE_DIR);
    await client.cd(FTP_REMOTE_DIR);

    console.log('🧹  Limpiando TODO el servidor (excepto cgi-bin)...');
    const list = await client.list();
    for (const item of list) {
      if (item.name === 'cgi-bin') continue;
      try {
        if (item.isDirectory) {
          await client.removeDir(item.name);
          console.log(`   🗑  Carpeta ${item.name}/ eliminada`);
        } else {
          await client.remove(item.name);
          console.log(`   🗑  ${item.name} eliminado`);
        }
      } catch {
        console.log(`   ⚠  No se pudo eliminar ${item.name} (omitido)`);
      }
    }

    console.log('🚀  Subiendo archivos (puede tardar según el peso)...\n');
    client.trackProgress((info) => {
      if (info.name) {
        process.stdout.write(`   ↑ ${info.name}\n`);
      }
    });

    await client.uploadFromDir(distPath);

    // Subir index.html una segunda vez para asegurar que es el último archivo tocado
    console.log('\n📄  Re-subiendo index.html (forzar sobreescritura)...');
    await client.uploadFrom(indexPath, 'index.html');

    client.trackProgress();
    console.log('\n✅  Deploy completado! Tu app está en vivo en reven.com.ar');
    console.log(`    Versión: ${ts}`);
  } catch (err) {
    console.error('\n❌  Error durante el deploy:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
