
async function test() {
  const modelId = 158; // Fiat Toro (I'll guess one or try to find it)
  // Let's find Fiat (Brand 19) first if needed, but I'll try a common ID
  const url = `https://argautos.com/api/v1/models/${modelId}/versions?relations=valuations&per_page=5`;
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
