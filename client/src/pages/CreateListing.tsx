import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ImagePlus } from 'lucide-react';
import BackButton from '../components/BackButton';

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Sports',
  'Toys',
  'Home & Garden',
  'Automotive',
  'Other'
];

const CreateListing = () => {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [addedPhoto, setAddedPhoto] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddPhoto = () => {
    if (photoUrl.trim()) {
      setAddedPhoto(photoUrl);
      setPhotoUrl('');
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const newListing = {
        photo: addedPhoto,
        itemName,
        category,
        price,
        description
      };

      // You can later replace this with a Supabase insert or API call
      console.log('New Listing Created:', newListing);

      navigate('/search'); // ✅ Navigate back to search
    } catch (err) {
      console.error('Error creating listing:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPhotoUrl('');
    setItemName('');
    setCategory('');
    setPrice('');
    setDescription('');
    setAddedPhoto('');
  };

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
        <BackButton />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Listing</h1>

          <form onSubmit={handleCreateListing} className="space-y-6">
            {/* ---------- Photo Upload ---------- */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Item Photo
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Enter photo URL"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-colors">
                {addedPhoto ? (
                  <div className="relative">
                    <img
                      src={addedPhoto}
                      alt="Item preview"
                      className="max-h-48 mx-auto rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setAddedPhoto('')}
                      className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-xs">×</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <ImagePlus className="mx-auto text-gray-400 mb-3" size={48} />
                    <button
                      type="button"
                      className="flex items-center gap-2 mx-auto text-gray-700 font-medium hover:text-gray-900 transition-colors"
                    >
                      <Upload size={18} />
                      Upload Photo
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      or paste image URL above
                    </p>
                  </>
                )}
              </div>
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
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
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
    </div>
  );
};

export default CreateListing;
