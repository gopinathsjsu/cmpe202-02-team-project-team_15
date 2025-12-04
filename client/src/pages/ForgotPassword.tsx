import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

type Step = 'email' | 'verify' | 'reset';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  // Check if coming from reset link (cross-device support)
  useEffect(() => {
    const verified = searchParams.get('verified');
    const verifiedEmail = searchParams.get('email');
    const token = searchParams.get('token');
    if (verified === 'true' && verifiedEmail) {
      const decodedEmail = decodeURIComponent(verifiedEmail).toLowerCase().trim();
      const decodedToken = token ? decodeURIComponent(token) : null;
      console.log('ForgotPassword page: Received verified email from URL:', {
        email: decodedEmail,
        hasToken: !!decodedToken,
        tokenLength: decodedToken?.length
      });
      setEmail(decodedEmail);
      
      // Store token if provided (from link verification)
      if (decodedToken) {
        console.log('Storing verified token for password reset');
        setVerifiedToken(decodedToken);
      }
      
      // Automatically advance to reset step since link was verified
      setTimeout(() => {
        setStep('reset');
        showSuccess('Verified', 'You can now set your new password.');
      }, 500);
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      showError('Email Required', 'Email is required');
      setLoading(false);
      return;
    }

    try {
      await authAPI.forgotPassword(email.toLowerCase().trim());
      showSuccess('Email Sent', 'Check your inbox for the code or click the reset link.');
      setStep('verify');
      setResendCooldown(60); // 60 second cooldown
    } catch (err: any) {
      showError('Send Failed', err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!resetCode || resetCode.length !== 6) {
      showError('Invalid Code', 'Please enter a valid 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.verifyResetCode(email.toLowerCase().trim(), resetCode);
      if (response.data.success) {
        setVerifiedCode(resetCode);
        setStep('reset');
        showSuccess('Code Verified', 'You can now set your new password.');
      }
    } catch (err: any) {
      showError('Verification Failed', err.response?.data?.message || 'Invalid or expired reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email.toLowerCase().trim());
      showSuccess('Email Sent', 'Check your inbox.');
      setResendCooldown(60);
    } catch (err: any) {
      showError('Resend Failed', err.response?.data?.message || 'Failed to resend reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      showError('Invalid Password', 'Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Resetting password with:', {
        email: email.toLowerCase().trim(),
        hasCode: !!verifiedCode,
        hasToken: !!verifiedToken,
        code: verifiedCode,
        token: verifiedToken ? verifiedToken.substring(0, 10) + '...' : null
      });

      await authAPI.resetPassword(
        email.toLowerCase().trim(),
        formData.password,
        verifiedCode || undefined,
        verifiedToken || undefined
      );
      
      // Show success toast
      showSuccess('Password Reset Successful', 'Redirecting to login page...');
      
      showSuccess('Success', 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to reset password. Please try again.';
      showError('Reset Failed', errorMessage);
      showError('Password Reset Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">CM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Market</h1>
          <p className="text-gray-600">Buy and sell on your campus</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step === 'email' ? 'bg-gray-900 text-white' : 'bg-green-500 text-white'
            }`}>
              {step === 'email' ? '1' : <CheckCircle className="w-5 h-5" />}
            </div>
            <div className={`w-16 h-1 ${step !== 'email' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step === 'verify' ? 'bg-gray-900 text-white' : 
              step === 'reset' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {step === 'reset' ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <div className={`w-16 h-1 ${step === 'reset' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step === 'reset' ? 'bg-gray-900 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Verify */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-600">
                We sent a reset code to <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Reset Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                />
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Enter the 6-digit code from your email
                </p>
                <p className="mt-1 text-sm text-gray-500 text-center">
                  Or click the reset link in your email to verify automatically
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || resetCode.length !== 6}
                className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Change Email
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center mb-6">
              <Lock className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Set New Password</h2>
              <p className="text-gray-600">
                Create a new password for <strong>{email}</strong>
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

