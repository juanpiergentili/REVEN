
import fs from 'fs';

const PROPS = [
  { id: '02', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: '06', name: 'Buenos Aires' },
  { id: '14', name: 'Córdoba' },
  { id: '82', name: 'Santa Fe' },
  { id: '50', name: 'Mendoza' }
];

async function fetchTop() {
  const geoData = {};

  for (const prov of PROPS) {
    console.log(`Fetching ${prov.name}...`);
    try {
      const res = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${prov.id}&campos=id,nombre&max=1000`);
      const data = await res.json();
      geoData[prov.id] = {
        name: prov.name,
        localities: data.localidades.sort((a, b) => a.nombre.localeCompare(b.nombre))
      };
    } catch (e) {
      console.error(`Error for ${prov.name}:`, e);
    }
  }

  fs.writeFileSync('./src/data/geo-fallback.json', JSON.stringify({
    provincias: PROPS,
    data: geoData
  }, null, 2));
  
  console.log('Saved to ./src/data/geo-fallback.json');
}

fetchTop();
