const mongoose = require('mongoose');
const Category = require('./models/Category');
const Listing = require('./models/Listing');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost/campus-marketplace', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const users = [
  {
    name: 'John Smith',
    email: 'john.smith@university.edu',
    role: 'student',
    campusId: 'STU001'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    role: 'student',
    campusId: 'STU002'
  },
  {
    name: 'Mike Chen',
    email: 'mike.chen@university.edu',
    role: 'student',
    campusId: 'STU003'
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@university.edu',
    role: 'student',
    campusId: 'STU004'
  },
  {
    name: 'Admin User',
    email: 'admin@university.edu',
    role: 'admin',
    campusId: 'ADM001'
  }
];

const categories = [
  { name: 'Books', description: 'Textbooks, novels, and educational materials' },
  { name: 'Electronics', description: 'Laptops, phones, gadgets, and accessories' },
  { name: 'Furniture', description: 'Desks, chairs, and room furniture' },
  { name: 'Clothing', description: 'Clothes, shoes, and accessories' },
  { name: 'Sports & Recreation', description: 'Sports equipment and recreational items' },
  { name: 'Home & Kitchen', description: 'Kitchen appliances and home items' },
  { name: 'Transportation', description: 'Bikes, scooters, and transportation items' },
  { name: 'Other', description: 'Miscellaneous items' }
];

const sampleListings = [
  {
    title: 'MacBook Pro 13" 2020',
    description: 'Excellent condition MacBook Pro, barely used. Perfect for students.',
    price: 1200,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/macbook.jpg', alt: 'MacBook Pro' }],
    categoryName: 'Electronics'
  },
  {
    title: 'Calculus Textbook',
    description: 'Stewart Calculus 8th Edition, good condition with some highlighting.',
    price: 80,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/calculus.jpg', alt: 'Calculus Textbook' }],
    categoryName: 'Books'
  },
  {
    title: 'Office Chair',
    description: 'Comfortable ergonomic office chair, adjustable height.',
    price: 150,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/chair.jpg', alt: 'Office Chair' }],
    categoryName: 'Furniture'
  },
  {
    title: 'iPhone 12 Pro',
    description: 'Great condition iPhone 12 Pro, 128GB storage. Includes charger and case.',
    price: 600,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/iphone.jpg', alt: 'iPhone 12 Pro' }],
    categoryName: 'Electronics'
  },
  {
    title: 'Physics Textbook',
    description: 'University Physics 14th Edition by Young and Freedman. Like new condition.',
    price: 120,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/physics.jpg', alt: 'Physics Textbook' }],
    categoryName: 'Books'
  },
  {
    title: 'Gaming Chair',
    description: 'Comfortable gaming chair with RGB lighting. Perfect for long study sessions.',
    price: 200,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/gaming-chair.jpg', alt: 'Gaming Chair' }],
    categoryName: 'Furniture'
  },
  {
    title: 'Bicycle',
    description: 'Mountain bike in good condition. Great for campus transportation.',
    price: 300,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/bike.jpg', alt: 'Mountain Bike' }],
    categoryName: 'Transportation'
  },
  {
    title: 'Winter Jacket',
    description: 'Warm winter jacket, size M. Perfect for cold campus winters.',
    price: 75,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/jacket.jpg', alt: 'Winter Jacket' }],
    categoryName: 'Clothing'
  },
  {
    title: 'Basketball',
    description: 'Official size basketball, good condition. Perfect for campus rec games.',
    price: 25,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/basketball.jpg', alt: 'Basketball' }],
    categoryName: 'Sports & Recreation'
  },
  {
    title: 'Coffee Maker',
    description: 'Dorm-friendly coffee maker, perfect for early morning classes.',
    price: 45,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/coffee-maker.jpg', alt: 'Coffee Maker' }],
    categoryName: 'Home & Kitchen'
  },
  {
    title: 'Chemistry Lab Manual',
    description: 'General Chemistry lab manual, 3rd edition. Barely used.',
    price: 35,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/chemistry.jpg', alt: 'Chemistry Lab Manual' }],
    categoryName: 'Books'
  },
  {
    title: 'Scooter',
    description: 'Electric scooter for campus commuting. Great condition, includes charger.',
    price: 400,
    status: 'ACTIVE',
    photos: [{ url: 'https://example.com/scooter.jpg', alt: 'Electric Scooter' }],
    categoryName: 'Transportation'
  }
];

async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Listing.deleteMany({});
    
    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log('Users created:', createdUsers.length);
    
    // Insert categories
    const createdCategories = await Category.insertMany(categories);
    console.log('Categories created:', createdCategories.length);
    
    // Assign specific categories and random users to sample listings
    const sampleListingsWithReferences = sampleListings.map(listing => {
      // Find the specific category for this listing
      const category = createdCategories.find(cat => cat.name === listing.categoryName);
      
      return {
        ...listing,
        userId: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        categoryId: category._id
      };
    });
    
    // Insert sample listings
    const createdListings = await Listing.insertMany(sampleListingsWithReferences);
    console.log('Sample listings created:', createdListings.length);
    
    console.log('Database seeded successfully!');
    console.log('\nSample data created:');
    console.log(`- ${createdUsers.length} users`);
    console.log(`- ${createdCategories.length} categories`);
    console.log(`- ${createdListings.length} listings`);
    
    // Show category distribution
    console.log('\nCategory distribution:');
    const categoryCounts = {};
    sampleListingsWithReferences.forEach(listing => {
      const categoryName = createdCategories.find(cat => cat._id.equals(listing.categoryId)).name;
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} items`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
