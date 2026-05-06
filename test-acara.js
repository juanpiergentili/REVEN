const BASE_URL = 'https://argautos.com/api/v1';

async function testFiatPalio() {
  try {
    const brandsRes = await fetch(`${BASE_URL}/brands?per_page=100`);
    const brandsData = await brandsRes.json();
    const fiatBrand = brandsData.data.find(b => b.name.toLowerCase() === 'fiat');

    if (!fiatBrand) {
      console.log('Fiat not found');
      return;
    }

    const modelsRes = await fetch(`${BASE_URL}/brands/${fiatBrand.id}/models?per_page=100`);
    const modelsData = await modelsRes.json();
    const palioModel = modelsData.data.find(m => m.name.toLowerCase().includes('palio'));

    if (!palioModel) {
      console.log('Palio not found');
      return;
    }

    console.log(`Found Model: ${palioModel.name} (ID: ${palioModel.id})`);

    const verRes = await fetch(`${BASE_URL}/models/${palioModel.id}/versions?per_page=100`);
    const verData = await verRes.json();
    const firstVer = verData.data[0];

    if (!firstVer) {
      console.log('No versions found');
      return;
    }

    console.log(`Found Version: ${firstVer.name} (ID: ${firstVer.id})`);

    const valRes = await fetch(`${BASE_URL}/versions/${firstVer.id}/valuations?currency=ars&sources=acara`);
    const valData = await valRes.json();
    console.log(JSON.stringify(valData, null, 2));

  } catch(e) {
    console.error(e);
  }
}

testFiatPalio();
