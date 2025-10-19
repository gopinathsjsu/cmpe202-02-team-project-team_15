import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category';
import Listing, { IPhoto } from '../models/Listing';
import { User } from '../models/User';

// Load environment variables
dotenv.config();

// Seed data types for database seeding
export interface SeedUser {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  status: 'pending_verification' | 'active' | 'suspended' | 'deleted';
}

export interface SeedCategory {
  name: string;
  description: string;
}

export interface SeedListing {
  title: string;
  description: string;
  price: number;
  status: 'ACTIVE' | 'SOLD';
  photos: IPhoto[];
  categoryName: string;
}

const users: SeedUser[] = [
  {
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@university.edu',
    password_hash: 'passwordhash',
    status: 'active'
  },
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@university.edu',
    password_hash: 'passwordhash',
    status: 'active'
  },
  {
    first_name: 'Mike',
    last_name: 'Chen',
    email: 'mike.chen@university.edu',
    password_hash: 'passwordhash',
    status: 'active'
  },
  {
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@university.edu',
    password_hash: 'passwordhash',
    status: 'active'
  },
  {
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@university.edu',
    password_hash: 'passwordhash',
    status: 'active'
  }
];

const categories: SeedCategory[] = [
  { name: 'Books', description: 'Textbooks, novels, and educational materials' },
  { name: 'Electronics', description: 'Laptops, phones, gadgets, and accessories' },
  { name: 'Furniture', description: 'Desks, chairs, and room furniture' },
  { name: 'Clothing', description: 'Clothes, shoes, and accessories' },
  { name: 'Sports & Recreation', description: 'Sports equipment and recreational items' },
  { name: 'Home & Kitchen', description: 'Kitchen appliances and home items' },
  { name: 'Transportation', description: 'Bikes, scooters, and transportation items' },
  { name: 'Other', description: 'Miscellaneous items' }
];

// Item templates for generating varied listings
const itemTemplates = {
  'Books': [
    { title: 'Calculus Textbook', basePrice: 80, descriptions: ['Stewart Calculus 8th Edition', 'Early Transcendentals 9th Edition', 'Single Variable Calculus 7th Edition'] },
    { title: 'Physics Textbook', basePrice: 120, descriptions: ['University Physics by Young & Freedman', 'Principles of Physics by Halliday', 'College Physics by Serway'] },
    { title: 'Chemistry Textbook', basePrice: 95, descriptions: ['General Chemistry by Petrucci', 'Chemistry: The Central Science', 'Organic Chemistry by Wade'] },
    { title: 'Biology Textbook', basePrice: 110, descriptions: ['Campbell Biology 12th Edition', 'Molecular Biology of the Cell', 'Principles of Biochemistry'] },
    { title: 'History Textbook', basePrice: 70, descriptions: ['A People\'s History of the United States', 'The American Pageant', 'World History: Patterns of Interaction'] },
    { title: 'Psychology Textbook', basePrice: 85, descriptions: ['Psychology: The Science of Mind', 'Cognitive Psychology by Sternberg', 'Social Psychology by Myers'] },
    { title: 'Economics Textbook', basePrice: 90, descriptions: ['Principles of Economics by Mankiw', 'Microeconomics by Pindyck', 'Macroeconomics by Krugman'] },
    { title: 'Literature Book', basePrice: 25, descriptions: ['The Great Gatsby', 'To Kill a Mockingbird', '1984 by George Orwell'] }
  ],
  'Electronics': [
    { title: 'MacBook Pro', basePrice: 1200, descriptions: ['13" 2020 model, excellent condition', '15" 2019 model with Touch Bar', 'M1 chip, barely used'] },
    { title: 'iPhone', basePrice: 600, descriptions: ['iPhone 12 Pro, 128GB storage', 'iPhone 13, great condition', 'iPhone 11 Pro Max, unlocked'] },
    { title: 'iPad', basePrice: 400, descriptions: ['iPad Air 4th generation', 'iPad Pro 11" with Apple Pencil', 'iPad 9th generation, perfect for notes'] },
    { title: 'Laptop', basePrice: 800, descriptions: ['Dell XPS 13, perfect for students', 'HP Pavilion, great for programming', 'Lenovo ThinkPad, business grade'] },
    { title: 'Headphones', basePrice: 150, descriptions: ['Sony WH-1000XM4, noise cancelling', 'AirPods Pro with case', 'Bose QuietComfort 35'] },
    { title: 'Monitor', basePrice: 200, descriptions: ['24" 1080p gaming monitor', '27" 4K display for design work', 'Ultrawide monitor for productivity'] },
    { title: 'Keyboard', basePrice: 80, descriptions: ['Mechanical gaming keyboard', 'Wireless Apple Magic Keyboard', 'Ergonomic split keyboard'] },
    { title: 'Mouse', basePrice: 40, descriptions: ['Logitech MX Master 3', 'Gaming mouse with RGB', 'Wireless optical mouse'] }
  ],
  'Furniture': [
    { title: 'Office Chair', basePrice: 150, descriptions: ['Ergonomic office chair, adjustable', 'Gaming chair with lumbar support', 'Executive leather chair'] },
    { title: 'Desk', basePrice: 200, descriptions: ['Standing desk converter', 'L-shaped corner desk', 'Minimalist writing desk'] },
    { title: 'Bookshelf', basePrice: 80, descriptions: ['5-tier wooden bookshelf', 'Corner bookshelf, space-saving', 'Industrial pipe bookshelf'] },
    { title: 'Bed Frame', basePrice: 300, descriptions: ['Queen size platform bed', 'Twin XL dorm bed frame', 'Storage bed with drawers'] },
    { title: 'Dresser', basePrice: 180, descriptions: ['6-drawer dresser with mirror', '4-drawer chest of drawers', 'Vintage wooden dresser'] },
    { title: 'Nightstand', basePrice: 60, descriptions: ['Bedside table with drawer', 'Floating nightstand', 'Industrial nightstand'] }
  ],
  'Clothing': [
    { title: 'Winter Jacket', basePrice: 75, descriptions: ['Warm puffer jacket, size M', 'Waterproof ski jacket, size L', 'Wool peacoat, size S'] },
    { title: 'Jeans', basePrice: 40, descriptions: ['Levi\'s 501 jeans, size 32x32', 'Skinny fit jeans, size 30x30', 'High-waisted jeans, size 28'] },
    { title: 'Sneakers', basePrice: 90, descriptions: ['Nike Air Force 1, size 10', 'Adidas Ultraboost, size 9', 'Converse Chuck Taylor, size 8.5'] },
    { title: 'Hoodie', basePrice: 35, descriptions: ['University hoodie, size L', 'Champion reverse weave hoodie', 'Vintage band hoodie, size M'] },
    { title: 'Dress Shirt', basePrice: 25, descriptions: ['White button-down shirt', 'Blue oxford shirt, size M', 'Striped dress shirt, size L'] }
  ],
  'Sports & Recreation': [
    { title: 'Basketball', basePrice: 25, descriptions: ['Official size basketball', 'Indoor/outdoor basketball', 'Spalding NBA basketball'] },
    { title: 'Tennis Racket', basePrice: 120, descriptions: ['Wilson Pro Staff tennis racket', 'Beginner tennis racket with case', 'Professional grade racket'] },
    { title: 'Yoga Mat', basePrice: 30, descriptions: ['Extra thick yoga mat', 'Travel yoga mat, lightweight', 'Eco-friendly cork yoga mat'] },
    { title: 'Dumbbells', basePrice: 80, descriptions: ['Adjustable dumbbell set', '20lb pair of dumbbells', 'Rubber coated weight set'] },
    { title: 'Soccer Ball', basePrice: 20, descriptions: ['FIFA approved soccer ball', 'Training soccer ball', 'Indoor futsal ball'] }
  ],
  'Home & Kitchen': [
    { title: 'Coffee Maker', basePrice: 45, descriptions: ['Single serve coffee maker', 'French press coffee maker', '12-cup drip coffee maker'] },
    { title: 'Microwave', basePrice: 80, descriptions: ['Compact dorm microwave', '1000W countertop microwave', 'Stainless steel microwave'] },
    { title: 'Mini Fridge', basePrice: 120, descriptions: ['4.4 cu ft mini refrigerator', 'Dorm-sized fridge with freezer', 'Energy efficient mini fridge'] },
    { title: 'Blender', basePrice: 60, descriptions: ['Personal smoothie blender', 'High-speed blender for shakes', 'Immersion hand blender'] },
    { title: 'Rice Cooker', basePrice: 35, descriptions: ['3-cup rice cooker', 'Programmable rice cooker', 'Multi-function rice cooker'] }
  ],
  'Transportation': [
    { title: 'Bicycle', basePrice: 300, descriptions: ['Mountain bike, 21-speed', 'Road bike for commuting', 'Hybrid bike, perfect for campus'] },
    { title: 'Electric Scooter', basePrice: 400, descriptions: ['Foldable electric scooter', 'Long-range e-scooter', 'Lightweight commuter scooter'] },
    { title: 'Skateboard', basePrice: 80, descriptions: ['Complete skateboard setup', 'Longboard for cruising', 'Electric skateboard'] },
    { title: 'Helmet', basePrice: 40, descriptions: ['Bike helmet, adjustable size', 'Skateboard helmet with pads', 'Multi-sport safety helmet'] }
  ],
  'Other': [
    { title: 'Backpack', basePrice: 50, descriptions: ['Laptop backpack with USB port', 'Hiking backpack, 40L capacity', 'School backpack with organizer'] },
    { title: 'Lamp', basePrice: 30, descriptions: ['LED desk lamp with USB charging', 'Floor lamp for reading', 'Adjustable architect lamp'] },
    { title: 'Plant', basePrice: 15, descriptions: ['Low-maintenance succulent', 'Snake plant for dorm room', 'Pothos in decorative pot'] },
    { title: 'Storage Box', basePrice: 25, descriptions: ['Under-bed storage container', 'Stackable storage bins', 'Decorative storage ottoman'] }
  ]
};

// Generate 100 listings from templates
function generateListings(): SeedListing[] {
  const listings: SeedListing[] = [];
  const conditions = ['excellent', 'good', 'fair', 'like new', 'barely used'];
  const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'SOLD']; // 80% active, 20% sold
  
  let listingCount = 0;
  
  // Generate listings for each category
  Object.entries(itemTemplates).forEach(([categoryName, templates]) => {
    templates.forEach((template, templateIndex) => {
      // Generate 2-3 variations of each template
      const variations = Math.min(3, Math.ceil((100 - listingCount) / (Object.keys(itemTemplates).length * templates.length - templateIndex)));
      
      for (let i = 0; i < variations && listingCount < 100; i++) {
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
        const priceVariation = 0.7 + Math.random() * 0.6; // Price between 70% and 130% of base
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        listings.push({
          title: template.title + (i > 0 ? ` (${i + 1})` : ''),
          description: `${description}. ${condition.charAt(0).toUpperCase() + condition.slice(1)} condition. Perfect for students.`,
          price: Math.round(template.basePrice * priceVariation),
          status: status as 'ACTIVE' | 'SOLD',
          photos: [{ url: `https://example.com/${template.title.toLowerCase().replace(/\s+/g, '-')}-${i + 1}.jpg`, alt: template.title }],
          categoryName
        });
        
        listingCount++;
      }
    });
  });
  
  return listings.slice(0, 100); // Ensure exactly 100 items
}

async function seedDatabase(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/campus-market');
    console.log('Connected to MongoDB');
    
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
    
    // Generate 100 listings
    const generatedListings = generateListings();
    
    // Assign specific categories and random users to generated listings
    const listingsWithReferences = generatedListings.map(listing => {
      // Find the specific category for this listing
      const category = createdCategories.find(cat => cat.name === listing.categoryName);
      
      return {
        ...listing,
        userId: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        categoryId: category!._id
      };
    });
    
    // Insert generated listings
    const createdListings = await Listing.insertMany(listingsWithReferences);
    console.log('Generated listings created:', createdListings.length);
    
    console.log('Database seeded successfully!');
    console.log('\nSample data created:');
    console.log(`- ${createdUsers.length} users`);
    console.log(`- ${createdCategories.length} categories`);
    console.log(`- ${createdListings.length} listings`);
    
    // Show category distribution
    console.log('\nCategory distribution:');
    const categoryCounts: { [key: string]: number } = {};
    listingsWithReferences.forEach(listing => {
      const categoryName = createdCategories.find(cat => cat._id.equals(listing.categoryId))!.name;
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} items`);
    });
    
    // Show status distribution
    console.log('\nStatus distribution:');
    const statusCounts: { [key: string]: number } = {};
    listingsWithReferences.forEach(listing => {
      statusCounts[listing.status] = (statusCounts[listing.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} items`);
    });
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDatabase();
