import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Mail, CheckCircle, Eye, EyeOff, Check, X } from 'lucide-react';

type Step = 'email' | 'verify' | 'register';

// Password validation helper
const validatePassword = (password: string) => ({
  minLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
});

const PasswordRequirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <div className={`flex items-center gap-2 text-sm transition-colors duration-200 ${met ? 'text-green-600' : 'text-gray-400'}`}>
    {met ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    <span>{text}</span>
  </div>
);

const Signup: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password validation state
  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if coming from verification link (cross-device support)
  useEffect(() => {
    const verified = searchParams.get('verified');
    const verifiedEmail = searchParams.get('email');
    if (verified === 'true' && verifiedEmail) {
      const decodedEmail = decodeURIComponent(verifiedEmail).toLowerCase().trim();
      console.log('Signup page: Received verified email from URL:', decodedEmail);
      setEmail(decodedEmail);
      
      // Increased delay to ensure backend has saved the verification
      setTimeout(() => {
        // Verify the email is actually verified on backend
        console.log('Signup page: Checking verification for:', decodedEmail);
        authAPI.checkVerification(decodedEmail)
          .then(response => {
            console.log('Signup page: Check verification response:', response.data);
            // Response structure: { success: true, data: { email: '...', verified: true, userExists?: true } }
            const data = response.data?.data;
            if (data?.userExists) {
              setError('An account with this email already exists. Please login instead.');
              setStep('email');
              return;
            }
            const isVerified = data?.verified;
            console.log('Signup page: Is verified?', isVerified);
            if (isVerified) {
              // Automatically advance to registration step since email is verified
              setStep('register');
              setSuccess('Email verified successfully! You can now complete your registration.');
              setError(''); // Clear any previous errors
            } else {
              console.error('Signup page: Verification not found for email:', decodedEmail, 'Response:', response.data);
              setError('Email verification not found. Please verify your email again.');
              setStep('email');
            }
          })
          .catch((err) => {
            console.error('Signup page: Check verification error:', err);
            setError('Could not verify email status. Please try again.');
            setStep('email');
          });
      }, 1000); // Increased delay to ensure DB write is complete
    }
  }, [searchParams]);

  // Note: Removed postMessage listener since verification link now opens in same tab

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Check verification status when email changes (for cross-device support)
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (email && email.includes('@')) {
        try {
          const response = await authAPI.checkVerification(email);
          // Response structure: { success: true, data: { email: '...', verified: true, userExists?: true } }
          const data = response.data?.data;
          if (data?.userExists) {
            setError('An account with this email already exists. Please login instead.');
            setStep('email');
            return;
          }
          if (data?.verified) {
            setStep('register');
            setSuccess('Email already verified! You can now complete your registration.');
          }
        } catch (err) {
          // Silently fail - email might not be verified yet
        }
      }
    };

    // Debounce the check
    const timer = setTimeout(() => {
      if (step === 'email' && email) {
        checkEmailVerification();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [email, step]);

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    // Validate .edu domain (unless admin)
    if (!showAdmin) {
      const emailDomain = email.split('@')[1];
      if (!emailDomain || !emailDomain.endsWith('.edu')) {
        setError('Email must be from an educational institution (.edu domain)');
        setLoading(false);
        return;
      }
    }

    // First check if already verified (for cross-device scenario)
    try {
      const checkResponse = await authAPI.checkVerification(email);
      // Response structure: { success: true, data: { email: '...', verified: true, userExists?: true } }
      const data = checkResponse.data?.data;
      if (data?.userExists) {
        setError('An account with this email already exists. Please login instead.');
        setLoading(false);
        return;
      }
      if (data?.verified) {
        setStep('register');
        setSuccess('Email already verified! You can now complete your registration.');
        setLoading(false);
        return;
      }
    } catch (err) {
      // Continue to send verification if check fails
    }

    try {
      await authAPI.requestVerification(email);
      setSuccess('Verification email sent! Check your inbox for the code or click the verification link.');
      setStep('verify');
      setResendCooldown(60); // 60 second cooldown
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      setLoading(false);
      return;
    }

    try {
      await authAPI.verifyCode(email, verificationCode);
      setSuccess('Email verified successfully!');
      setStep('register');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError('');
    try {
      await authAPI.requestVerification(email);
      setSuccess('Verification email resent!');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password requirements
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const success = await signup(
        email,
        formData.password,
        formData.firstName,
        formData.lastName,
        showAdmin ? adminKey : undefined
      );
      
      if (success) {
        navigate('/login');
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
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
          <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">CM</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Campus Market</h1>
          <p className="text-gray-500 text-sm">Buy and sell on your campus</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'email' ? 'bg-gray-900 text-white' : step === 'verify' ? 'bg-gray-900 text-white' : 'bg-green-500 text-white'}`}>
              {step === 'register' ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <div className={`w-16 h-1 ${step === 'verify' || step === 'register' ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'verify' ? 'bg-gray-900 text-white' : step === 'register' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
              {step === 'register' ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <div className={`w-16 h-1 ${step === 'register' ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'register' ? 'bg-gray-900 text-white' : 'bg-gray-300 text-gray-600'}`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Email Verification Request */}
        {step === 'email' && (
          <form onSubmit={handleRequestVerification} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                School Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced"
                placeholder="student@university.edu"
                required
                disabled={loading}
              />
            </div>

            {/* Register as Admin toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="registerAsAdmin"
                checked={showAdmin}
                onChange={() => setShowAdmin(!showAdmin)}
                className="mr-2"
                disabled={loading}
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
                  disabled={loading}
                />
              </div>
            )}

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
              {loading ? 'Sending...' : 'Send Verification Email'}
            </button>
          </form>
        )}

        {/* Step 2: Verify Email */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center mb-4">
              <Mail className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <h2 className="text-xl font-semibold text-gray-900">Check Your Email</h2>
              <p className="text-sm text-gray-600 mt-2">
                We sent a verification code to <strong>{email}</strong>
              </p>
            </div>

            {/* Show success if verified via link */}
            {success && success.includes('via link') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">{success}</p>
                </div>
                <p className="text-xs text-green-600 mt-2">Redirecting to registration...</p>
              </div>
            )}

            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="verificationCode"
                name="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Or click the verification link in your email to verify automatically
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center message-enter">{error}</div>
            )}
            {success && (
              <div className="text-green-600 text-sm text-center message-enter">{success}</div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 btn-enhanced ${
                  loading || verificationCode.length !== 6
                    ? 'bg-gray-400 cursor-not-allowed btn-loading' 
                    : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                }`}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              {/* Show "Continue to Registration" button if already verified via link */}
              {success && success.includes('via link') && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('register');
                    setSuccess('Email verified successfully! You can now complete your registration.');
                  }}
                  className="w-full py-2 px-4 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-all duration-300"
                >
                  Continue to Registration
                </button>
              )}

              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || resendCooldown > 0}
                className="w-full py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setVerificationCode('');
                  setError('');
                  setSuccess('');
                }}
                className="w-full py-2 px-4 rounded-lg font-medium text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading}
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Complete Registration */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="text-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h2 className="text-xl font-semibold text-gray-900">Complete Registration</h2>
              <p className="text-sm text-gray-600 mt-2">
                Email verified: <strong>{email}</strong>
              </p>
            </div>

            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">{success}</div>
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced"
                  placeholder="Create a strong password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Requirements Checklist */}
              {formData.password && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1.5">
                  <PasswordRequirement met={passwordValidation.minLength} text="At least 8 characters" />
                  <PasswordRequirement met={passwordValidation.hasUppercase} text="One uppercase letter" />
                  <PasswordRequirement met={passwordValidation.hasNumber} text="One number" />
                  <PasswordRequirement met={passwordValidation.hasSymbol} text="One special character (!@#$%^&*)" />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 shadow-inner input-enhanced"
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Match Check */}
              {formData.confirmPassword && (
                <div className="mt-2">
                  <PasswordRequirement 
                    met={formData.password === formData.confirmPassword} 
                    text="Passwords match" 
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center message-enter">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !isPasswordValid || formData.password !== formData.confirmPassword}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 btn-enhanced ${
                loading || !isPasswordValid || formData.password !== formData.confirmPassword
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200 btn-loading' 
                  : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
              }`}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

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
