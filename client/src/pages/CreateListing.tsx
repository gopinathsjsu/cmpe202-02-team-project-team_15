import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import Footer from '../components/Footer';
import { apiService, ICategory } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MIN_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 1000;
const PRICE_MIN = 1;
const MAX_IMAGES = 5;
const PRICE_MAX = 10000;

const CreateListing = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<Array<{ url: string; alt: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await apiService.getCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Find the selected category ID
      const selectedCategory = categories.find(cat => cat.name === category);
      if (!selectedCategory) {
        throw new Error('Please select a valid category');
      }

      const listingData = {
        title: itemName,
        description: description,
        price: parseFloat(price),
        categoryId: selectedCategory._id,
        photos: photos
      };

      const createdListing = await apiService.createListing(listingData);
      
      showSuccess(
        'Listing Created Successfully!',
        'Your listing has been posted to the marketplace.'
      );
      
      navigate('/search'); // ✅ Navigate back to search
    } catch (err) {
      console.error('Error creating listing:', err);
      showError(
        'Failed to Create Listing',
        'Please try again later.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setItemName('');
    setCategory('');
    setPrice('');
    setDescription('');
    setPhotos([]);
    navigate('/search');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---------- Header ---------- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <span className="font-semibold text-gray-900">Campus Market</span>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Listing</h1>

          <form onSubmit={handleCreateListing} className="space-y-6">
            {/* ---------- Photo Upload ---------- */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Item Photos (up to 5)
              </label>
              <ImageUpload
                maxImages={5}
                onImagesChange={setPhotos}
                existingImages={photos}
              />
            </div>

            {/* ---------- Item Name ---------- */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., iPhone 13 Pro"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
            </div>

            {/* ---------- Category ---------- */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    className="text-gray-600"
                  >
                    <path
                      d="M1 1L6 6L11 1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* ---------- Price ---------- */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
            </div>

            {/* ---------- Description ---------- */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item, its condition, and any other relevant details..."
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* ---------- Buttons ---------- */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Listing'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateListing;
