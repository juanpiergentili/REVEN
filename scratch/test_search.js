
async function test() {
  const url = 'https://argautos.com/api/v1/search?q=FIAT%20TORO';
  console.log('Searching:', url);
  const res = await fetch(url);
  const d = await res.json();
  console.log(JSON.stringify(d, null, 2).substring(0, 1000));
}
test();
