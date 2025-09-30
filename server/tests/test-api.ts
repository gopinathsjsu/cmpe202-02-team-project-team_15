import axios, { AxiosResponse } from 'axios';
import { SearchResponse } from '../types';

const BASE_URL = 'http://localhost:5000';

interface BasicResponse {
  message: string;
}

interface CategoryResponse {
  _id: string;
  name: string;
  description?: string;
}

interface SearchResponseWithCategories extends SearchResponse {
  categories?: CategoryResponse[];
  filters?: any;
}

async function testAPI(): Promise<void> {
  try {
    console.log('🚀 Testing Campus Marketplace API...\n');

    // Test 1: Basic endpoint
    console.log('1. Testing basic endpoint...');
    const basicResponse: AxiosResponse<BasicResponse> = await axios.get(`${BASE_URL}/`);
    console.log('✅ Basic endpoint:', basicResponse.data);
    console.log('');

    // Test 2: Get categories
    console.log('2. Testing categories endpoint...');
    const categoriesResponse: AxiosResponse<CategoryResponse[]> = await axios.get(`${BASE_URL}/api/listings/categories`);
    console.log('✅ Categories:', categoriesResponse.data);
    console.log('');

    // Test 3: Search all listings
    console.log('3. Testing search endpoint (all listings)...');
    const searchResponse: AxiosResponse<SearchResponseWithCategories> = await axios.get(`${BASE_URL}/api/listings/search`);
    console.log('✅ Search results:', {
      totalItems: searchResponse.data.page.total,
      itemsCount: searchResponse.data.items.length,
      categories: searchResponse.data.categories?.length || 0
    });
    console.log('');

    // Test 4: Search with filters
    console.log('4. Testing search with filters...');
    const filteredResponse: AxiosResponse<SearchResponseWithCategories> = await axios.get(`${BASE_URL}/api/listings/search?maxPrice=200&sort=price_asc`);
    console.log('✅ Filtered search results:', {
      totalItems: filteredResponse.data.page.total,
      itemsCount: filteredResponse.data.items.length,
      filters: filteredResponse.data.filters
    });
    console.log('');

    // Test 5: Search by category (if categories exist)
    if (categoriesResponse.data.length > 0) {
      const firstCategory = categoriesResponse.data[0].name;
      console.log(`5. Testing search by category: ${firstCategory}...`);
      const categoryResponse: AxiosResponse<SearchResponse> = await axios.get(`${BASE_URL}/api/listings/search?category=${encodeURIComponent(firstCategory)}`);
      console.log('✅ Category search results:', {
        category: firstCategory,
        totalItems: categoryResponse.data.page.total,
        itemsCount: categoryResponse.data.items.length
      });
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testAPI();
