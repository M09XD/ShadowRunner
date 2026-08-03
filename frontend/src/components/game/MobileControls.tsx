import React, { useCallback, useRef, useEffect } from 'react';

interface MobileControlsProps {
  onMove: (direction: 'left' | 'right' | 'none') => void;
  onJump: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onJump }) => {
  const leftPressed = useRef(false);
  const rightPressed = useRef(false);

  const handleLeftStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    leftPressed.current = true;
    onMove('left');
  }, [onMove]);

  const handleLeftEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    leftPressed.current = false;
    if (rightPressed.current) {
      onMove('right');
    } else {
      onMove('none');
    }
  }, [onMove]);

  const handleRightStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    rightPressed.current = true;
    onMove('right');
  }, [onMove]);

  const handleRightEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    rightPressed.current = false;
    if (leftPressed.current) {
      onMove('left');
    } else {
      onMove('none');
    }
  }, [onMove]);

  const handleJump = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onJump();
  }, [onJump]);

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-between px-4 md:hidden pointer-events-none">
      {/* Left/Right controls */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          onTouchStart={handleLeftStart}
          onTouchEnd={handleLeftEnd}
          onMouseDown={handleLeftStart}
          onMouseUp={handleLeftEnd}
          onMouseLeave={handleLeftEnd}
          className="w-16 h-16 bg-purple-800/80 rounded-full border-2 border-purple-500 flex items-center justify-center active:bg-purple-600"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onTouchStart={handleRightStart}
          onTouchEnd={handleRightEnd}
          onMouseDown={handleRightStart}
          onMouseUp={handleRightEnd}
          onMouseLeave={handleRightEnd}
          className="w-16 h-16 bg-purple-800/80 rounded-full border-2 border-purple-500 flex items-center justify-center active:bg-purple-600"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Jump button */}
      <button
        onTouchStart={handleJump}
        onMouseDown={handleJump}
        className="w-20 h-20 bg-green-600/80 rounded-full border-2 border-green-400 flex items-center justify-center active:bg-green-500 pointer-events-auto"
      >
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
};
