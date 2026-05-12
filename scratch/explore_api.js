
async function test() {
  // 1. Find Fiat Brand
  const brandsRes = await fetch('https://argautos.com/api/v1/brands?per_page=100');
  const brandsData = await brandsRes.json();
  const fiat = brandsData.data.find(b => b.name.toLowerCase() === 'fiat');
  console.log('Fiat Brand:', fiat);

  if (fiat) {
    // 2. Find Toro Model
    const modelsRes = await fetch(`https://argautos.com/api/v1/brands/${fiat.id}/models?per_page=100`);
    const modelsData = await modelsRes.json();
    const toro = modelsData.data.find(m => m.name.toLowerCase().includes('toro'));
    console.log('Toro Model:', toro);

    if (toro) {
      // 3. Try to get valuations for the whole model
      const valUrl = `https://argautos.com/api/v1/models/${toro.id}/valuations`;
      console.log('Trying valuations:', valUrl);
      const valRes = await fetch(valUrl);
      const valData = await valRes.json();
      console.log('Valuations result:', JSON.stringify(valData, null, 2).substring(0, 500));
    }
  }
}
test();
