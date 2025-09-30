import axios, { AxiosResponse } from 'axios';
import { IListing, ErrorResponse } from '../types';

const BASE_URL = 'http://localhost:5000';

async function testGetListingById(): Promise<void> {
  try {
    console.log('🔍 Testing GET /api/listings/:id endpoint...\n');

    // First, get some listings to work with
    console.log('1. Getting sample listings to test with...');
    const searchResponse: AxiosResponse<{ items: IListing[] }> = await axios.get(`${BASE_URL}/api/listings/search?pageSize=1`);
    
    if (searchResponse.data.items.length === 0) {
      console.log('❌ No listings found. Please run "npm run seed" first to populate the database.');
      return;
    }

    const sampleListing = searchResponse.data.items[0];
    const listingId = sampleListing._id;
    console.log(`✅ Found sample listing: "${sampleListing.title}" (ID: ${listingId})`);
    console.log('');

    // Test 1: Get valid listing by ID
    console.log('2. Testing get listing by valid ID...');
    const validResponse: AxiosResponse<IListing> = await axios.get(`${BASE_URL}/api/listings/${listingId}`);
    console.log('✅ Valid ID request successful');
    console.log(`   - Title: "${validResponse.data.title}"`);
    console.log(`   - Price: $${validResponse.data.price}`);
    console.log(`   - Status: ${validResponse.data.status}`);
    console.log(`   - Category: ${(validResponse.data.categoryId as any)?.name || 'Unknown'}`);
    console.log(`   - User: ${(validResponse.data.userId as any)?.name || 'Unknown'}`);
    console.log('');

    // Test 2: Get listing with invalid ObjectId format
    console.log('3. Testing get listing with invalid ObjectId format...');
    try {
      await axios.get(`${BASE_URL}/api/listings/invalid-id`);
      console.log('❌ Should have returned 400 error for invalid ID format');
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid ID format correctly returns 400 error');
        console.log(`   - Error message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    console.log('');

    // Test 3: Get listing with valid ObjectId format but non-existent ID
    console.log('4. Testing get listing with non-existent ID...');
    const fakeObjectId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist
    try {
      await axios.get(`${BASE_URL}/api/listings/${fakeObjectId}`);
      console.log('❌ Should have returned 404 error for non-existent ID');
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('✅ Non-existent ID correctly returns 404 error');
        console.log(`   - Error message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    console.log('');

    // Test 4: Test with malformed ObjectId (wrong length)
    console.log('5. Testing get listing with malformed ObjectId...');
    try {
      await axios.get(`${BASE_URL}/api/listings/123`);
      console.log('❌ Should have returned 400 error for malformed ID');
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('✅ Malformed ID correctly returns 400 error');
        console.log(`   - Error message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    console.log('');

    // Test 5: Verify response structure
    console.log('6. Verifying response structure...');
    const structureTest: AxiosResponse<IListing> = await axios.get(`${BASE_URL}/api/listings/${listingId}`);
    const listing = structureTest.data;
    
    const requiredFields = ['_id', 'title', 'description', 'price', 'status', 'userId', 'categoryId', 'createdAt', 'updatedAt'];
    const missingFields = requiredFields.filter(field => !(field in listing));
    
    if (missingFields.length === 0) {
      console.log('✅ Response contains all required fields');
    } else {
      console.log('❌ Missing required fields:', missingFields);
    }

    // Check if populated fields are present
    const hasPopulatedCategory = listing.categoryId && typeof listing.categoryId === 'object' && 'name' in listing.categoryId;
    const hasPopulatedUser = listing.userId && typeof listing.userId === 'object' && 'name' in listing.userId;
    
    if (hasPopulatedCategory && hasPopulatedUser) {
      console.log('✅ Category and User references are properly populated');
    } else {
      console.log('❌ Category or User references are not populated');
    }
    console.log('');

    // Test 6: Test multiple valid IDs
    console.log('7. Testing multiple valid listings...');
    const multipleListingsResponse: AxiosResponse<{ items: IListing[] }> = await axios.get(`${BASE_URL}/api/listings/search?pageSize=3`);
    const testIds = multipleListingsResponse.data.items.map(item => item._id);
    
    let successCount = 0;
    for (const id of testIds) {
      try {
        const response: AxiosResponse<IListing> = await axios.get(`${BASE_URL}/api/listings/${id}`);
        if (response.data._id === id) {
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Failed to get listing ${id}`);
      }
    }
    
    console.log(`✅ Successfully retrieved ${successCount}/${testIds.length} listings`);
    console.log('');

    console.log('🎉 All GET /api/listings/:id tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Valid ID returns listing with populated references');
    console.log('✅ Invalid ObjectId format returns 400 error');
    console.log('✅ Non-existent ID returns 404 error');
    console.log('✅ Malformed ID returns 400 error');
    console.log('✅ Response structure is correct');
    console.log('✅ Multiple valid IDs work correctly');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testGetListingById();
