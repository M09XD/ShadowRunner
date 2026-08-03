import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-950 via-black to-purple-950 flex flex-col items-center justify-center">
      {/* Animated shadow figure */}
      <div className="relative mb-8">
        <div className="w-20 h-28 relative">
          {/* Shadow body */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-20 bg-black rounded-lg animate-pulse" />
          
          {/* Shadow head */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-black rounded-full">
            {/* Glowing eyes */}
            <div className="absolute top-4 left-2 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <div className="absolute top-4 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.1s' }} />
          </div>
        </div>
        
        {/* Shadow underneath */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-red-900/30 rounded-full blur-md animate-pulse" />
      </div>

      {/* Loading text */}
      <div className="text-center">
        <h2
          className="text-2xl text-purple-400 mb-4"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {message}
        </h2>
        
        {/* Loading bar */}
        <div className="w-64 h-4 bg-purple-900 rounded-full overflow-hidden border-2 border-purple-700">
          <div className="h-full bg-gradient-to-r from-purple-600 to-red-500 animate-loading-bar" />
        </div>
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-500/50 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 100%; margin-left: 0; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
