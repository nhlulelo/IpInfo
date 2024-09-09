import { useState, useCallback } from 'react';

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const useIpCache = () => {
  const [cache, setCache] = useState({});

  const getCachedIp = useCallback((ip) => {
    const cachedData = cache[ip];
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }
    return null;
  }, [cache]);

  const setCachedIp = useCallback((ip, data) => {
    setCache(prevCache => ({
      ...prevCache,
      [ip]: { data, timestamp: Date.now() }
    }));
  }, []);

  return { getCachedIp, setCachedIp };
};