import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import { apiService, ICategory, IListing } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const EditListing = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    price: '',
    description: '',
    photos: [] as Array<{ url: string; alt: string }>,
    status: 'ACTIVE' as 'ACTIVE' | 'SOLD'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories and listing in parallel
        const [categoriesData, listingData] = await Promise.all([
          apiService.getCategories(),
          id ? apiService.getListingById(id) : Promise.reject('No listing ID'),
        ]);

        setCategories(categoriesData);

        // Populate form
        setFormData({
          title: listingData.title,
          categoryId: typeof listingData.categoryId === 'string' 
            ? listingData.categoryId 
            : listingData.categoryId._id,
          price: listingData.price.toString(),
          description: listingData.description,
          photos: listingData.photos || [],
          status: listingData.status,
        });
      } catch (err) {
        console.error('Failed to load listing:', err);
        showError(
          'Failed to Load Listing',
          'Unable to load listing details. Redirecting to search page.'
        );
        navigate('/search');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!id) {
        throw new Error('No listing ID');
      }

      // Update the listing
      await apiService.updateListing(id, {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        categoryId: formData.categoryId,
        photos: formData.photos,
        status: formData.status,
      });

      showSuccess(
        'Listing Updated Successfully!',
        'Your changes have been saved.'
      );
      
      // Redirect based on status
      if (formData.status === 'SOLD') {
        navigate('/my-listings?filter=SOLD');
      } else {
        navigate(`/listing/${id}`);
      }
    } catch (err: any) {
      console.error('Failed to update listing:', err);
      showError(
        'Failed to Update Listing',
        err.response?.data?.error || 'Please try again later.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/search');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CM</span>
                </div>
                <span className="font-semibold text-gray-900">Campus Market</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Listing</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Photos (up to 5)
              </label>
              <ImageUpload
                maxImages={5}
                onImagesChange={(photos) => setFormData({ ...formData, photos })}
                existingImages={formData.photos}
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Item Name
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Calculus Textbook 8th Edition"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                id="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the condition, features, and any important details about your item..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'SOLD' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="SOLD">Sold</option>
              </select>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition-colors"
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

export default EditListing;
