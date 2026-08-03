import React, { useState } from 'react';
import { X } from 'lucide-react';
import { authAPI, playerAPI } from '@/lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (playerName: string) => void;
  onGuestLogin?: () => void;
  isLoading?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onGuestLogin,
  isLoading: initialLoading = false,
}) => {
  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation for create account mode
    if (mode === 'create') {
      if (!playerName.trim()) {
        setError('Please enter a player name');
        setIsLoading(false);
        return;
      }

      if (playerName.trim().length < 3) {
        setError('Player name must be at least 3 characters');
        setIsLoading(false);
        return;
      }

      if (playerName.trim().length > 20) {
        setError('Player name must be less than 20 characters');
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
    }

    // Common validation for both modes
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      let response;
      
      if (mode === 'create') {
        // Register new account
        response = await authAPI.register({
          email: email.trim(),
          password: password,
          playerName: playerName.trim(),
        });
      } else {
        // Login existing account
        response = await authAPI.login({
          email: email.trim(),
          password: password,
        });
      }
      
      // CRITICAL FIX: Better error handling with specific messages
      if (response.error) {
        setError(response.error);
        setIsLoading(false);
        return;
      }

      if (response?.data?.success && response.data.account) {
        // Save auth token and account info
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        if (response.data.account) {
          localStorage.setItem('playerName', response.data.account.playerName);
          localStorage.setItem('accountId', response.data.account.id.toString());
          localStorage.setItem('email', response.data.account.email);
        }
        
        // Save player stats if provided (for registration)
        if (response.data.playerStats) {
          localStorage.setItem('playerStats', JSON.stringify(response.data.playerStats));
        }
        
        setPlayerName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setIsLoading(false);
        setMode('login');
        onLogin(response.data.account.playerName);
        onClose();
      } else {
        setError(response?.data?.message || 'Authentication failed');
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error connecting to server. Please try again.';
      setError(errorMessage);
      console.error('Auth error:', err);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-purple-900 to-purple-950 rounded-lg border-2 border-purple-500 p-8 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            {mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
          </h2>
          <button onClick={onClose} className="text-purple-400 hover:text-purple-200 transition-colors" aria-label="Close login modal" disabled={isLoading}>
            <X size={24} />
          </button>
        </div>

        <p className="text-purple-300 text-center mb-6" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}>
          {mode === 'login' ? 'Enter your name to play' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-purple-300 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>EMAIL</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled={isLoading} className="w-full px-4 py-3 bg-purple-950/50 border-2 border-purple-500 rounded text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-300 focus:bg-purple-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>

          <div>
            <label htmlFor="password" className="block text-purple-300 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>PASSWORD</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" disabled={isLoading} className="w-full px-4 py-3 bg-purple-950/50 border-2 border-purple-500 rounded text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-300 focus:bg-purple-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>

          {mode === 'create' && (
            <>
              <div>
                <label htmlFor="playerName" className="block text-purple-300 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>PLAYER NAME</label>
                <input id="playerName" type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} onKeyPress={handleKeyPress} placeholder="Enter your name" disabled={isLoading} className="w-full px-4 py-3 bg-purple-950/50 border-2 border-purple-500 rounded text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-300 focus:bg-purple-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed" maxLength={20} autoFocus />
                <p className="text-purple-400 text-right mt-1" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>{playerName.length}/20</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-purple-300 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>CONFIRM PASSWORD</label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" disabled={isLoading} className="w-full px-4 py-3 bg-purple-950/50 border-2 border-purple-500 rounded text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-300 focus:bg-purple-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
            </>
          )}

          {error && <div className="bg-red-900/30 border border-red-500 rounded p-3"><p className="text-red-300 text-sm" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>{error}</p></div>}

          <button type="submit" disabled={isLoading} className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg border-2 border-purple-400 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
            {isLoading ? (mode === 'login' ? 'LOGGING IN...' : 'CREATING...') : (mode === 'login' ? 'PLAY NOW' : 'CREATE ACCOUNT')}
          </button>

          {mode === 'login' ? (
            <>
              <button type="button" onClick={() => setMode('create')} disabled={isLoading} className="w-full py-2 bg-green-900/50 hover:bg-green-800 text-green-300 hover:text-green-100 rounded-lg border border-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}>NEW ACCOUNT</button>

              <button type="button" onClick={() => { onGuestLogin?.(); onClose(); }} disabled={isLoading} className="w-full py-2 bg-purple-900/50 hover:bg-purple-800 text-purple-300 hover:text-purple-100 rounded-lg border border-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}>CONTINUE AS GUEST</button>
            </>
          ) : (
            <button type="button" onClick={() => { setMode('login'); setEmail(''); setPassword(''); setConfirmPassword(''); setError(''); }} disabled={isLoading} className="w-full py-2 bg-purple-900/50 hover:bg-purple-800 text-purple-300 hover:text-purple-100 rounded-lg border border-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}>BACK TO LOGIN</button>
          )}
        </form>

        <div className="mt-6 p-4 bg-purple-900/30 rounded border border-purple-700">
          <p className="text-purple-300 text-center" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}>Create a profile to:</p>
          <ul className="text-purple-300 mt-2 space-y-1" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}><li>? Save your progress</li><li>? Appear on leaderboard</li><li>? Unlock achievements</li></ul>
        </div>
      </div>
    </div>
  );
};
