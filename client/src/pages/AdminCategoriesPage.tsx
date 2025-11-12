import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

interface Category {
  _id: string;
  name: string;
  description?: string;
  listingCount?: number;
  createdAt: string;
  updatedAt: string;
}

const AdminCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, showSuccess, showError, hideToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/admin/categories');
      setCategories(response.data.data.categories || []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setFormError('Category name is required');
      return;
    }

    const loadingToastId = showLoading(
      "Creating Category",
      "Please wait while we create the new category..."
    );

    try {
      setFormLoading(true);
      setFormError(null);
      
      await api.post('/api/admin/categories', {
        name: categoryName.trim(),
        description: categoryDescription.trim()
      });
      
      // Refresh categories list
      await fetchCategories();
      
      // Close modal and reset form
      setShowCreateModal(false);
      setCategoryName('');
      setCategoryDescription('');
      
      // Hide loading and show success
      hideToast(loadingToastId);
      showSuccess(
        "Category Added Successfully!",
        `"${categoryName.trim()}" has been added to the categories list.`
      );
    } catch (err: any) {
      console.error('Failed to create category:', err);
      
      // Hide loading and show error
      hideToast(loadingToastId);
      const errorMsg = err.response?.data?.message || 'Failed to create category';
      setFormError(errorMsg);
      showError(
        "Failed to Create Category",
        errorMsg
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !categoryName.trim()) {
      setFormError('Category name is required');
      return;
    }

    const loadingToastId = showLoading(
      "Updating Category",
      "Please wait while we update the category..."
    );

    try {
      setFormLoading(true);
      setFormError(null);
      
      await api.put(`/api/admin/categories/${selectedCategory._id}`, {
        name: categoryName.trim(),
        description: categoryDescription.trim()
      });
      
      // Refresh categories list
      await fetchCategories();
      
      // Close modal and reset form
      setShowEditModal(false);
      setSelectedCategory(null);
      setCategoryName('');
      setCategoryDescription('');
      
      // Hide loading and show success
      hideToast(loadingToastId);
      showSuccess(
        "Category Updated Successfully!",
        `"${categoryName.trim()}" has been updated.`
      );
    } catch (err: any) {
      console.error('Failed to update category:', err);
      
      // Hide loading and show error
      hideToast(loadingToastId);
      const errorMsg = err.response?.data?.message || 'Failed to update category';
      setFormError(errorMsg);
      showError(
        "Failed to Update Category",
        errorMsg
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    const loadingToastId = showLoading(
      "Deleting Category",
      "Please wait while we delete the category..."
    );

    try {
      setFormLoading(true);
      setFormError(null);
      
      await api.delete(`/api/admin/categories/${selectedCategory._id}`);
      
      const categoryName = selectedCategory.name;
      
      // Refresh categories list
      await fetchCategories();
      
      // Close modal
      setShowDeleteModal(false);
      setSelectedCategory(null);
      
      // Hide loading and show success
      hideToast(loadingToastId);
      showSuccess(
        "Category Deleted Successfully!",
        `"${categoryName}" has been removed from the categories list.`
      );
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      
      // Hide loading and show error
      hideToast(loadingToastId);
      const errorMsg = err.response?.data?.message || 'Failed to delete category';
      setFormError(errorMsg);
      showError(
        "Failed to Delete Category",
        errorMsg
      );
    } finally {
      setFormLoading(false);
    }
  };

  const openCreateModal = () => {
    setCategoryName('');
    setCategoryDescription('');
    setFormError(null);
    setShowCreateModal(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setFormError(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setFormError(null);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setFormError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Category Management</h1>
              <p className="text-gray-600 mt-1">Add, rename, or delete categories</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Category</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">Loading categories...</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Listings
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No categories found. Create your first category to get started.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{category.description || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{category.listingCount || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditModal(category)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                            title="Edit category"
                          >
                            <Pencil className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(category)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Category</h2>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="e.g., Electronics"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Brief description of the category"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {formLoading ? 'Creating...' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Category</h2>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {formLoading ? 'Updating...' : 'Update Category'}
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Delete Category</h2>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the category <span className="font-semibold">"{selectedCategory.name}"</span>?
              </p>
              {selectedCategory.listingCount && selectedCategory.listingCount > 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                  <strong>Warning:</strong> This category has {selectedCategory.listingCount} listing(s). 
                  You must reassign or delete those listings before deleting this category.
                </div>
              ) : (
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCategory}
                disabled={formLoading || (selectedCategory.listingCount && selectedCategory.listingCount > 0)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {formLoading ? 'Deleting...' : 'Delete Category'}
              </button>
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default AdminCategoriesPage;

