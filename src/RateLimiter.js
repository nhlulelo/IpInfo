import { useRef } from 'react';

const RATE_LIMIT = 5; // 5 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export const useRateLimiter = () => {
  const requestTimestamps = useRef([]);

  const checkRateLimit = () => {
    const now = Date.now();
    requestTimestamps.current = requestTimestamps.current.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    );
    
    if (requestTimestamps.current.length >= RATE_LIMIT) {
      return false;
    }
    
    requestTimestamps.current.push(now);
    return true;
  };

  return checkRateLimit;
};