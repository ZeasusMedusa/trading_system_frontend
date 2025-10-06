import { useState, useEffect } from 'react';

/**
 * Custom hook for typewriter animation effect
 * @param text - Text to animate
 * @param speed - Animation speed in milliseconds (default: 100ms)
 * @param restartDelay - Delay before restarting animation in milliseconds (default: 45000ms)
 * @returns Object containing displayedText and showCursor state
 */
export function useTypewriterAnimation(
  text: string,
  speed: number = 100,
  restartDelay: number = 45000
) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        // Restart after delay
        setTimeout(() => {
          currentIndex = 0;
          setDisplayedText('');
          const restartInterval = setInterval(() => {
            if (currentIndex <= text.length) {
              setDisplayedText(text.slice(0, currentIndex));
              currentIndex++;
            } else {
              clearInterval(restartInterval);
            }
          }, speed);
        }, restartDelay);
      }
    }, speed);

    return () => clearInterval(typeInterval);
  }, [text, speed, restartDelay]);

  // Cursor blinking
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, []);

  return { displayedText, showCursor };
}
