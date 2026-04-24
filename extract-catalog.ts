import fs from 'fs';
import { getBrands, getModels, getVersions } from './src/lib/asofix';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractFullCatalog() {
  console.log('🚀 Iniciando extracción de catálogo completo de Asofix...');
  const catalog: any = [];

  try {
    // 1. Obtener todas las marcas
    const brandsResponse = await getBrands();
    const brands = brandsResponse.data || [];
    console.log(`📦 Se encontraron ${brands.length} marcas.`);

    for (const brand of brands) {
      console.log(`🔹 Extrayendo modelos para: ${brand.name}...`);
      
      const modelsResponse = await getModels(brand.id);
      const models = modelsResponse.data || [];
      const brandData: any = {
        id: brand.id,
        name: brand.name,
        models: []
      };

      for (const model of models) {
        console.log(`  - ${model.name}`);
        
        // 2. Obtener versiones para cada modelo
        // Nota: Agregamos un pequeño delay para no saturar la API
        await delay(100); 
        const versionsResponse = await getVersions(brand.id, model.id);
        const versions = (versionsResponse.data || []).map((v: any) => ({
          id: v.id,
          name: v.short_name || v.name
        }));

        brandData.models.push({
          id: model.id,
          name: model.name,
          versions: versions
        });
      }

      catalog.push(brandData);
      
      // Guardar progreso parcial
      fs.writeFileSync('./src/data/vehicle-catalog-full.json', JSON.stringify(catalog, null, 2));
    }

    console.log('✅ Catálogo completo descargado con éxito en: ./src/data/vehicle-catalog-full.json');
  } catch (error) {
    console.error('❌ Error durante la extracción:', error);
  }
}

extractFullCatalog();
