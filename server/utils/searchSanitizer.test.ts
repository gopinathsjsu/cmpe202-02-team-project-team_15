/**
 * Tests for Search Query Sanitization
 * Run with: npm test or ts-node searchSanitizer.test.ts
 */

import {
  validateAndSanitizeSearchQuery,
  sanitizeSearchQuery,
  sanitizePrice,
  sanitizeCategory,
  sanitizePagination
} from './searchSanitizer';

// Test cases
const testCases = [
  {
    name: 'Normal search query',
    input: { q: 'laptop' },
    shouldPass: true,
    description: 'Basic text search should work'
  },
  {
    name: 'Query with special regex characters',
    input: { q: 'laptop.*' },
    shouldPass: false,
    description: 'Should block greedy regex patterns'
  },
  {
    name: 'Query with MongoDB injection attempt',
    input: { q: '{"$gt": ""}' },
    shouldPass: false,
    description: 'Should block MongoDB operators'
  },
  {
    name: 'Extremely long query',
    input: { q: 'a'.repeat(200) },
    shouldPass: true,
    description: 'Should truncate long queries to 100 chars'
  },
  {
    name: 'XSS attempt in query',
    input: { q: '<script>alert("xss")</script>' },
    shouldPass: false,
    description: 'Should block script tags'
  },
  {
    name: 'Valid price range',
    input: { minPrice: '10', maxPrice: '100' },
    shouldPass: true,
    description: 'Valid price range should pass'
  },
  {
    name: 'Invalid price range (min > max)',
    input: { minPrice: '100', maxPrice: '10' },
    shouldPass: false,
    description: 'Should reject min > max'
  },
  {
    name: 'Negative price',
    input: { minPrice: '-50' },
    shouldPass: false,
    description: 'Should reject negative prices'
  },
  {
    name: 'Excessive page size',
    input: { pageSize: '10000' },
    shouldPass: true,
    description: 'Should limit page size to max (100)'
  },
  {
    name: 'Valid category',
    input: { category: 'Electronics' },
    shouldPass: true,
    description: 'Normal category name should work'
  },
  {
    name: 'Category with special chars',
    input: { category: 'Electronics<script>' },
    shouldPass: false,
    description: 'Should block special characters in category'
  },
  {
    name: 'Unicode escape attempt',
    input: { q: '\\u0041\\u0042' },
    shouldPass: false,
    description: 'Should block unicode escapes'
  },
  {
    name: 'ReDoS attempt with nested groups',
    input: { q: '((((((((((text))))))))))' },
    shouldPass: false,
    description: 'Should block excessive parentheses (ReDoS protection)'
  },
  {
    name: 'Empty query with filters',
    input: { minPrice: '10', maxPrice: '50', category: 'Books' },
    shouldPass: true,
    description: 'Filtering without search query should work'
  }
];

// Run tests
console.log('🧪 Running Search Sanitization Tests\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = validateAndSanitizeSearchQuery(testCase.input);
  const actualPass = result.isValid;
  const expectedPass = testCase.shouldPass;
  const testPassed = actualPass === expectedPass;

  if (testPassed) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${testCase.name}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${testCase.name}`);
    console.log(`   Expected: ${expectedPass ? 'PASS' : 'FAIL'}`);
    console.log(`   Got: ${actualPass ? 'PASS' : 'FAIL'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  console.log(`   Description: ${testCase.description}`);
  console.log('');
});

console.log('='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

// Additional demonstration of sanitization
console.log('\n📝 Sanitization Examples:\n');

const examples = [
  { input: 'normal text', expected: 'normal\\ text' },
  { input: 'price: $100', expected: undefined },
  { input: 'a'.repeat(150), expected: 'Truncated to 100 chars' }
];

examples.forEach((example) => {
  const sanitized = sanitizeSearchQuery(example.input);
  console.log(`Input: "${example.input.substring(0, 50)}${example.input.length > 50 ? '...' : ''}"`);
  console.log(`Output: "${sanitized || 'BLOCKED'}"`);
  console.log('');
});

// Price sanitization examples
console.log('💰 Price Sanitization Examples:\n');

const priceExamples = [
  '10.50',
  '-5',
  '9999999',
  'not a number',
  '100.999'
];

priceExamples.forEach((price) => {
  const sanitized = sanitizePrice(price);
  console.log(`Input: "${price}" → Output: ${sanitized ?? 'REJECTED'}`);
});

// Pagination examples
console.log('\n📄 Pagination Sanitization Examples:\n');

const paginationExamples = [
  { page: '1', pageSize: '20' },
  { page: '-1', pageSize: '5000' },
  { page: 'abc', pageSize: 'xyz' },
  { page: '9999', pageSize: '1' }
];

paginationExamples.forEach((input) => {
  const result = sanitizePagination(input.page, input.pageSize);
  console.log(`Input: page=${input.page}, pageSize=${input.pageSize}`);
  console.log(`Output: page=${result.page}, pageSize=${result.pageSize}`);
  console.log('');
});

export {};
