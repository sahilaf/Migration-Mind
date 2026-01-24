import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get redirect path from localStorage (set during OAuth initiation)
        const redirectTo = localStorage.getItem('authRedirectTo') || '/dashboard';

        // If we already have a session (e.g., returning user), skip exchange
        const existing = await supabase.auth.getSession();
        if (existing.data.session) {
          // Clear the stored redirect path
          localStorage.removeItem('authRedirectTo');
          navigate(redirectTo, { replace: true });
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const errorDescription = params.get('error_description');
        const code = params.get('code');

        if (errorDescription) {
          console.error('Auth error:', errorDescription);
          localStorage.removeItem('authRedirectTo');
          navigate('/login', { replace: true });
          return;
        }

        if (!code) {
          localStorage.removeItem('authRedirectTo');
          navigate('/login', { replace: true });
          return;
        }

        // Exchange the OAuth code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Session exchange failed:', error);
          localStorage.removeItem('authRedirectTo');
          navigate('/login', { replace: true });
          return;
        }

        if (data.session) {
          // Clear the stored redirect path
          localStorage.removeItem('authRedirectTo');
          navigate(redirectTo, { replace: true });
        } else {
          localStorage.removeItem('authRedirectTo');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Callback error:', error);
        localStorage.removeItem('authRedirectTo');
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
}
