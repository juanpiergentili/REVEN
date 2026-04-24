import { getBrands } from './src/lib/asofix';

async function testBrands() {
  try {
    const response = await getBrands();
    console.log('Full Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Test Error:', error);
  }
}

testBrands();
