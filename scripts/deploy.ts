import { Client } from 'basic-ftp';
import { config } from 'dotenv';
import path from 'path';
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

  const client = new Client();

  try {
    console.log(`\n🔌  Conectando a ${FTP_HOST}...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: false,
    });

    console.log(`📂  Navegando a ${FTP_REMOTE_DIR}...`);
    await client.ensureDir(FTP_REMOTE_DIR);
    await client.cd(FTP_REMOTE_DIR);

    console.log('🚀  Limpiando archivos críticos en el servidor para evitar caché...');
    try {
      await client.remove('index.html');
    } catch {
      // Ignorar si no existe
    }

    console.log('🚀  Subiendo archivos (puede tardar según el peso)...\n');
    client.trackProgress((info) => {
      if (info.name) {
        process.stdout.write(`   ↑ ${info.name}\n`);
      }
    });

    await client.uploadFromDir(distPath);

    client.trackProgress();
    console.log('\n✅  Deploy completado! Tu app está en vivo en reven.com.ar');
  } catch (err) {
    console.error('\n❌  Error durante el deploy:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
