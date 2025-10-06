import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              School Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced"
              placeholder="Enter your password"
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
            {loading ? '' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/signup" className="text-gray-600 hover:text-gray-800 text-sm transition-colors duration-200">
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
