import { useState, useContext } from "react";
import { toast } from "react-toastify";
import { isAxiosError } from "axios";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import api from "../utils/axiosInstance";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  // Only use toast for server-side errors, not inline validation
  const { executeRecaptcha } = useGoogleReCaptcha();
  const navigate = useNavigate();

  // Validate input fields and show errors below each input
  const validate = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    if (!email) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailError("Invalid email format.");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    }
    return valid;
  };

  /**
   * Handle login form submit
   * - Validate inputs
   * - Call login API
   * - Show inline errors for validation
   * - Show toast for server errors
   * - Redirect to email sent page if email not verified
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      if (!executeRecaptcha) {
        toast.error("Recaptcha is not ready.");
        return;
      }
      const token = await executeRecaptcha("login");
      const response = await api.post("/users/authenticate", {
        email,
        password,
        recaptchaToken: token,
      });

      login(response.data.accessToken);
      toast.success("Logged in successfully!");
      navigate("/");

    } catch (err: unknown) {
      if (isAxiosError(err) && err.response && err.response.data?.error) {
        const { code, message } = err.response.data.error;
        if (code === "EMAIL_NOT_VERIFIED") {
          navigate("/email-sent", { state: { email } });
        } else if (code === "INVALID_CREDENTIALS") {
          toast.error("Invalid email or password.");
        } else {
          toast.error(message || "Login failed. Please try again.");
        }
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center mt-20">
      <div className="bg-white rounded-xl shadow-2xl p-10 w-full max-w-md flex flex-col">
        <p className="text-3xl font-semibold">Welcome back!</p>
        <p className="text-[#525a6a] mt-2">Log in to your account.</p>
        <form
          className="space-y-5 w-full mt-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="mb-2">
            <input
              type="email"
              placeholder="Email"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring focus:ring-lime-400 ${
                emailError ? "border-red-400" : "border-gray-200"
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>
          <div className="relative flex items-center mb-2">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring focus:ring-lime-400 pr-10 ${
                passwordError ? "border-red-400" : "border-gray-200"
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-4 inset-y-0 flex items-center text-gray-400 cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                // Eye icon (visible)
                <svg
                  className="size-5 fill-gray-400"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 0h48v48H0z" fill="none" />
                  <g id="Shopicon">
                    <path
                      d="M24,38c12,0,20-14,20-14s-8-14-20-14S4,24,4,24S12,38,24,38z M24,14c7.072,0,12.741,6.584,15.201,9.992
                    C36.728,27.396,31.024,34,24,34c-7.072,0-12.741-6.584-15.201-9.992C11.272,20.604,16.976,14,24,14z"
                    />
                    <path
                      d="M24,32c4.418,0,8-3.582,8-8s-3.582-8-8-8s-8,3.582-8,8S19.582,32,24,32z M24,20c2.206,0,4,1.794,4,4c0,2.206-1.794,4-4,4
                    s-4-1.794-4-4C20,21.794,21.794,20,24,20z"
                    />
                  </g>
                </svg>
              ) : (
                // Eye-off icon (hidden)
                <svg
                  className="size-5 fill-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.254 13.9749V17H12.754V13.9672C14.2271 13.846 15.6039 13.3931 16.8015 12.6851L18.3545 15.375L19.6535 14.625L18.0318 11.816C19.1746 10.8606 20.1061 9.61996 20.6917 8.2749L19.3164 7.67617C18.7623 8.94881 17.8318 10.1208 16.7002 10.9556C16.673 10.9757 16.6456 10.9957 16.618 11.0155C15.3326 11.9381 13.7363 12.4901 12.0009 12.4999C12.0006 12.4999 12.0002 12.4999 11.9999 12.4999L11.9542 12.5C11.9538 12.5 11.9535 12.5 11.9532 12.5C10.229 12.4998 8.64029 11.9643 7.35483 11.0613C6.16376 10.2246 5.23552 9.07427 4.69969 7.74421L3.30835 8.30472C3.87054 9.70022 4.7854 10.922 5.94395 11.872L4.3545 14.625L5.65354 15.375L7.18138 12.7287C8.38861 13.4274 9.77393 13.8685 11.254 13.9749Z"
                  />
                </svg>
              )}
            </button>
          </div>
          {passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
          {/* Server errors are shown via toast, not inline */}
          <button
            type="submit"
            className="w-full bg-lime-400 text-gray-900 font-semibold py-3 rounded-lg hover:bg-lime-300 transition cursor-pointer disabled:opacity-60 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-6 w-6 text-gray-900"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Log in"
            )}
          </button>
        </form>
        <div className="flex items-center w-full my-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-4 text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        <button
          //   onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 py-3 rounded-lg shadow cursor-pointer hover:bg-gray-100"
        >
          <img
            className="h-5"
            src="https://raw.githubusercontent.com/Loopple/loopple-public-assets/main/motion-tailwind/img/logos/logo-google.png"
            alt=""
          />
          <span className="font-medium text-gray-700">
            Continue with Google
          </span>
        </button>
      </div>
    </div>
  );
};

export const Login = () => (
  <GoogleReCaptchaProvider reCaptchaKey={SITE_KEY}>
    <LoginForm />
  </GoogleReCaptchaProvider>
);
