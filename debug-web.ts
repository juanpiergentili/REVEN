import { getWebCatalog } from './src/lib/asofix';

async function debugWeb() {
  try {
    const response = await getWebCatalog({ per_page: '1' });
    console.log('Sample Item:', JSON.stringify(response.data?.[0], null, 2));
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugWeb();
