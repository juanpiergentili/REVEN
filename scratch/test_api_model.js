
async function test() {
  const modelId = 158; 
  const url = `https://argautos.com/api/v1/models/${modelId}`;
  console.log('Fetching:', url);
  try {
    const res = await fetch(url);
    const d = await res.json();
    console.log(JSON.stringify(d, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
