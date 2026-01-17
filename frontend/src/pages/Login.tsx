import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle, session, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Get redirect path from location state, default to dashboard
  const redirectTo = (location.state as any)?.redirectTo || '/dashboard';

  // If already logged in, go to the redirect destination
  useEffect(() => {
    if (!loading && session) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, session, navigate, redirectTo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    setSubmitting(true);
    try {
      const { session: newSession } = await signIn(
        formData.email,
        formData.password
      );

      // If email confirmation is required, Supabase won't return a session until confirmed
      if (!newSession) {
        setInfo("Check your email to confirm your account before logging in.");
      } else {
        navigate(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError("");
    try {
      // Store redirect path in localStorage for retrieval after OAuth callback
      if (redirectTo !== '/dashboard') {
        localStorage.setItem('authRedirectTo', redirectTo);
      }
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google login failed");
      setSubmitting(false);
    }
  };

  {
    /* UI updated - login page */
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col">
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-black to-black"></div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-6xl flex justify-between items-center">
          {/* LEFT TEXT */}
          <div className="text-white max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              Log In to Your <br />
              <span className="text-orange-500">Account</span>
            </h1>
            <p className="text-gray-400 mt-4">
              Unlock the full potential of your data.
            </p>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col items-center">
            {/* LOGIN CARD */}
            <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 shadow-xl text-white">
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3 bg-black/40 border border-white/20 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3 bg-black/40 border border-white/20 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 transition text-black font-semibold py-3 rounded-md text-base"
                >
                  {submitting ? "Logging in..." : "Log In"}
                </button>

                <p className="text-sm text-center text-gray-300 mt-4">
                  Don’t have an account?{" "}
                  <a href="/signup" className="text-orange-400 hover:underline">
                    Sign up
                  </a>
                </p>
              </form>
              {/* GOOGLE SIGN IN */}
              <div className="flex gap-4 mt-6 w-full justify-center">
                <button
                  onClick={handleGoogleLogin}
                  disabled={submitting}
                  className="flex items-center w-full justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-md text-sm text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%2334A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E"
                    className="w-5 h-5"
                  />
                  {submitting ? "Signing in..." : "Google"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER — TERMS & PRIVACY */}
      <footer className="relative z-10 text-gray-400 text-xs px-10 py-4 flex justify-between">
        <div className="flex gap-4">
          <a href="#" className="hover:text-white">
            Terms
          </a>
          <a href="#" className="hover:text-white">
            Privacy
          </a>
        </div>
      </footer>
    </div>
  );
}
