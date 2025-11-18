import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || token.length !== 64) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        console.log('Verifying email with token:', {
          token: token.substring(0, 10) + '...',
          length: token.length
        });
        
        // Call backend API to verify with JSON accept header
        // The token in the URL is the secure token from email link
        const response = await api.get(`/api/auth/verify-email/${token}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.data.success) {
          setStatus('success');
          const isAlreadyVerified = response.data.data?.alreadyVerified;
          setMessage(isAlreadyVerified 
            ? 'Email was already verified! You can complete your registration.' 
            : 'Email verified successfully!');
          
          const verifiedEmail = response.data.data?.email || '';
          
          console.log('Verification successful, redirecting to signup with email:', verifiedEmail);
          
          // Always redirect to signup page in the same tab
          // Use a delay to ensure backend has saved the verification
          setTimeout(() => {
            navigate(`/signup?verified=true&email=${encodeURIComponent(verifiedEmail)}`);
          }, 1500); // Delay to ensure DB write completes
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Verification failed.');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Verification failed. The link may have expired or already been used.';
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verifying Email</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting to signup page...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/signup')}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go to Signup
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

