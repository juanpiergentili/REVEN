
import fs from 'fs';

async function fetchAll() {
  console.log('Fetching provinces...');
  const provRes = await fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&max=100');
  const provData = await provRes.json();
  const provinces = provData.provincias.sort((a, b) => a.nombre.localeCompare(b.nombre));

  const geoData = {};

  for (const prov of provinces) {
    console.log(`Fetching localities for ${prov.nombre}...`);
    // Note: The API sometimes limits to 500 or 1000, so we use max=5000 to be sure we get all
    const locRes = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${prov.id}&campos=id,nombre&max=5000`);
    const locData = await locRes.json();
    geoData[prov.id] = {
      name: prov.nombre,
      localities: locData.localidades.sort((a, b) => a.nombre.localeCompare(b.nombre))
    };
  }

  fs.writeFileSync('./src/data/geo-argentina.json', JSON.stringify({
    provincias: provinces,
    data: geoData
  }, null, 2));
  
  console.log('Done! Saved to ./src/data/geo-argentina.json');
}

fetchAll().catch(console.error);
