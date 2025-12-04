import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Eye, EyeOff, Check, X } from "lucide-react";

// Password validation helper
const validatePassword = (password: string) => ({
  minLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
});

const PasswordRequirement: React.FC<{ met: boolean; text: string }> = ({
  met,
  text,
}) => (
  <div
    className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
      met ? "text-green-600" : "text-gray-400"
    }`}
  >
    {met ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    <span>{text}</span>
  </div>
);

const Auth: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  // Password validation state
  const passwordValidation = validatePassword(signupData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const { login, signup, user } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  // Redirect to /search if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/search", { replace: true });
    }
  }, [user, navigate]);

  // Set active tab based on current route
  useEffect(() => {
    if (location.pathname === "/signup") {
      setActiveTab("signup");
    } else {
      setActiveTab("login");
    }
  }, [location.pathname]);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(loginData.email, loginData.password);
      if (success) {
        navigate("/search");
      } else {
        showError("Login Failed", "Invalid credentials");
      }
    } catch (err: any) {
      // Display the specific error message from the backend
      showError("Login Failed", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate password requirements
    if (!isPasswordValid) {
      showError("Invalid Password", "Please ensure your password meets all requirements");
      setLoading(false);
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      showError("Password Mismatch", "Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const success = await signup(
        signupData.email,
        signupData.password,
        signupData.firstName,
        signupData.lastName,
        showAdmin ? adminKey : undefined
      );

      if (success) {
        showSuccess("Account Created", "Please log in to continue");
        navigate("/login");
        // Clear signup form
        setSignupData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setAdminKey("");
        setShowAdmin(false);
      } else {
        showError("Signup Failed", "Please try again.");
      }
    } catch (err: any) {
      showError("Signup Failed", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">CM</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Campus Market
          </h1>
          <p className="text-gray-500 text-sm">Buy and sell on your campus</p>
        </div>

        {/* Login/Sign Up Tabs */}
        <div className="flex mb-8 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => navigate("/login")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "login"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "signup"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="loginEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                School Email
              </label>
              <input
                type="text"
                id="loginEmail"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="student@university.edu"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="loginPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  id="loginPassword"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="w-full px-3 py-2 pr-10 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignupSubmit} className="space-y-6">
            {/* Register as Admin toggle */}
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="registerAsAdmin"
                checked={showAdmin}
                onChange={() => setShowAdmin(!showAdmin)}
                className="mr-2"
              />
              <label
                htmlFor="registerAsAdmin"
                className="text-sm text-gray-700"
              >
                Register as admin
              </label>
            </div>
            {showAdmin && (
              <div>
                <label
                  htmlFor="adminKey"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Admin Secret Key
                </label>
                <input
                  type="password"
                  id="adminKey"
                  name="adminKey"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter admin key"
                  autoComplete="off"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="signupFirstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="signupFirstName"
                  name="firstName"
                  value={signupData.firstName}
                  onChange={handleSignupChange}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="signupLastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="signupLastName"
                  name="lastName"
                  value={signupData.lastName}
                  onChange={handleSignupChange}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signupEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                School Email
              </label>
              <input
                type="text"
                id="signupEmail"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="student@university.edu"
                required
              />
            </div>

            <div>
              <label
                htmlFor="signupPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showSignupPassword ? "text" : "password"}
                  id="signupPassword"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  className="w-full px-3 py-2 pr-10 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showSignupPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Requirements Checklist */}
              {signupData.password && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1.5">
                  <PasswordRequirement
                    met={passwordValidation.minLength}
                    text="At least 8 characters"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasUppercase}
                    text="One uppercase letter"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasNumber}
                    text="One number"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasSymbol}
                    text="One special character (!@#$%^&*)"
                  />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="signupConfirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="signupConfirmPassword"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  className="w-full px-3 py-2 pr-10 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Match Check */}
              {signupData.confirmPassword && (
                <div className="mt-2">
                  <PasswordRequirement
                    met={signupData.password === signupData.confirmPassword}
                    text="Passwords match"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !isPasswordValid ||
                signupData.password !== signupData.confirmPassword
              }
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                loading ||
                !isPasswordValid ||
                signupData.password !== signupData.confirmPassword
                  ? "bg-gray-400 cursor-not-allowed text-gray-200"
                  : "bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              }`}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Demo Note */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Demo: Use test@sjsu.edu for testing
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
