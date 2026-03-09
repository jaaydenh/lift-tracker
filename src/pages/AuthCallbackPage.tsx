import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../auth/supabaseClient';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href,
      );

      if (error) {
        setError(error.message);
      } else {
        navigate('/', { replace: true });
      }
    };

    void handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-6 space-y-4">
        <p className="text-red-400">{error}</p>
        <a href="/" className="text-blue-400 underline">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <p className="text-lg">Signing you in...</p>
    </div>
  );
}
