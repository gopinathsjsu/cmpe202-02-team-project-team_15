import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting signup form:', formData);
      const success = await signup(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        showAdmin ? adminKey : undefined
      );
      
      if (success) {
        console.log('Signup successful, navigating to login');
        navigate('/login');
      } else {
        console.log('Signup failed - success was false');
        setError('Signup failed. Please check your email domain (.edu required) and try again.');
      }
    } catch (err) {
      console.error('Signup catch block:', err);
      setError('Signup failed. Please check your email domain (.edu required) and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">CM</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Campus Market</h1>
          <p className="text-gray-500 text-sm">Buy and sell on your campus</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Register as Admin toggle */}
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="registerAsAdmin"
              checked={showAdmin}
              onChange={() => setShowAdmin(!showAdmin)}
              className="mr-2"
            />
            <label htmlFor="registerAsAdmin" className="text-sm text-gray-700">Register as admin</label>
          </div>
          {showAdmin && (
            <div>
              <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Secret Key
              </label>
              <input
                type="password"
                id="adminKey"
                name="adminKey"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced"
                placeholder="Enter admin key"
                autoComplete="off"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced"
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced"
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              School Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced"
              placeholder="student@university.edu"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced"
              placeholder="Create a strong password"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced"
              placeholder="Confirm your password"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center message-enter">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 btn-enhanced ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed btn-loading' 
                : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
            }`}
          >
            {loading ? '' : 'Create Account'}
          </button>
        </form>

        {/* small harmless comment added to increase commit count */}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-gray-600 hover:text-gray-800 text-sm transition-colors duration-200">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;