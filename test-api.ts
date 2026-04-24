import { getWebCatalog } from './src/lib/asofix.ts';
import fs from 'fs';

async function extractFromWebCatalog() {
  console.log('Iniciando extracción desde catálogo web...');
  try {
    let page = 1;
    let hasMore = true;
    let totalVehicles = 0;
    const catalogData: any = { brands: {} };

    while (hasMore) {
      console.log(`Obteniendo página ${page}...`);
      const response = await getWebCatalog({ page: page.toString(), per_page: '100' });
      const items = response.data || [];
      
      if (items.length === 0) {
        hasMore = false;
        break;
      }

      for (const item of items) {
        totalVehicles++;
        const brandName = item.brand_name;
        const modelName = item.model_name;
        const versionName = item.version || 'Generica';
        const fuelType = item.car_fuel_type;

        if (brandName) {
          if (!catalogData.brands[brandName]) {
            catalogData.brands[brandName] = { models: {} };
          }
          if (modelName) {
            if (!catalogData.brands[brandName].models[modelName]) {
              catalogData.brands[brandName].models[modelName] = { versions: {} };
            }
            if (!catalogData.brands[brandName].models[modelName].versions[versionName]) {
                catalogData.brands[brandName].models[modelName].versions[versionName] = { fuels: new Set() };
            }
            if (fuelType) {
                catalogData.brands[brandName].models[modelName].versions[versionName].fuels.add(fuelType);
            }
          }
        }
      }
      
      page++;
      // Limitando a 20 páginas por ahora para probar
      if (page > 20) {
         hasMore = false;
      }
    }

    console.log(`Extracción completa. Vehículos procesados: ${totalVehicles}`);
    
    // Transformar a un array más amigable
    const finalCatalog = Object.keys(catalogData.brands).map(brand => ({
       brand,
       models: Object.keys(catalogData.brands[brand].models).map(model => ({
           model,
           versions: Object.keys(catalogData.brands[brand].models[model].versions).map(version => ({
               version,
               fuels: Array.from(catalogData.brands[brand].models[model].versions[version].fuels)
           }))
       }))
    }));

    fs.writeFileSync('./src/data/extracted-catalog.json', JSON.stringify(finalCatalog, null, 2));
    console.log('Catálogo guardado en ./src/data/extracted-catalog.json');

  } catch (error) {
    console.error('Error:', error);
  }
}

extractFromWebCatalog();
