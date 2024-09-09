import React, { useState, useEffect, lazy, Suspense } from 'react';
import axios from 'axios';
import './FindThem.css';
import { FaSearch, FaGlobe, FaMoon, FaSun, FaHistory, FaShare } from 'react-icons/fa';
import LoadingBar from './LoadingBar';
import ErrorBoundary from './ErrorBoundary';
import InfoItem from './InfoItem';
import { useIpCache } from './IpCache';
import { useRateLimiter } from './RateLimiter';

const MapComponent = lazy(() => import('./MapComponent'));

const isValidIpAddress = (ip) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  });
};

const fallbackShare = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    alert('IP information copied to clipboard!');
  }).catch(error => {
    console.error('Error copying to clipboard:', error);
    alert('Failed to copy IP information. Please try again.');
  });
};

export default function FindThem() {
  const [ipAddress, setIpAddress] = useState('');
  const [error, setError] = useState(null);
  const [ipInfo, setIpInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const { getCachedIp, setCachedIp } = useIpCache();
  const checkRateLimit = useRateLimiter();
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  const fetchIpInfo = async (ip) => {
    if (!ip) return;
    if (!checkRateLimit()) {
      setError('Rate limit exceeded. Please try again later.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const cachedData = getCachedIp(ip);
    if (cachedData) {
      setIpInfo(cachedData);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`https://freeipapi.com/api/json/${ip}`, { timeout: 5000 });
      setIpInfo(response.data);
      setCachedIp(ip, response.data);
      updateRecentSearches(ip);
      updateHistory(ip);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      console.error('Error fetching IP info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRecentSearches = (ip) => {
    setRecentSearches(prevSearches => {
      const newSearches = [ip, ...prevSearches.filter(search => search !== ip)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
      return newSearches;
    });
  };

  const updateHistory = (ip) => {
    setHistory(prevHistory => [
      { ip, timestamp: new Date().toISOString() },
      ...prevHistory
    ]);
  };

  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(savedSearches);
  }, []);

  useEffect(() => {
    if (ipAddress) {
      const debounceTimer = setTimeout(() => {
        fetchIpInfo(ipAddress);
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [ipAddress]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ipAddress) {
      setError('Please enter an IP address');
    } else if (!isValidIpAddress(ipAddress)) {
      setError('Please enter a valid IP address');
    } else {
      fetchIpInfo(ipAddress);
    }
  };

  const handleChange = (e) => {
    setIpAddress(e.target.value);
    setError(null);
  };

  const getUserLocation = () => {
    setIsLoading(true);
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        setIpAddress(data.ip);
        fetchIpInfo(data.ip);
      })
      .catch(error => {
        setError('Failed to get user location');
        console.error('Error:', error);
      })
      .finally(() => setIsLoading(false));
  };

  const shareIpInfo = () => {
    if (!ipInfo) return;

    const shareText = `IP Information for ${ipInfo.ipAddress}:
Country: ${ipInfo.countryName}
City: ${ipInfo.cityName}
Coordinates: ${ipInfo.latitude}, ${ipInfo.longitude}`;

    if (navigator.share) {
      navigator.share({
        title: 'IP Information',
        text: shareText,
        url: window.location.href,
      }).catch(error => {
        console.error('Error sharing:', error);
        fallbackShare(shareText);
      });
    } else {
      fallbackShare(shareText);
    }
  };

  const paginatedHistory = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
      <h1 className="title"><FaGlobe className="globe-icon" /> CheckMyIP Binbin</h1>
      <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? <FaSun /> : <FaMoon />}
      </button>
      <form className="form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            type="text"
            value={ipAddress}
            onChange={handleChange}
            placeholder="Enter IP address"
            className="input"
          />
          <button type="submit" className="button" disabled={isLoading}>
            <FaSearch />
          </button>
        </div>
      </form>
      <div className="button-group">
        <button className="button" onClick={getUserLocation}>
          <FaGlobe /> Get My IP
        </button>
        <button className="button" onClick={() => setShowRecentSearches(!showRecentSearches)}>
          <FaHistory /> Recent Searches
        </button>
        <button className="button" onClick={shareIpInfo}>
          <FaShare /> Share IP Info
        </button>
      </div>
      {showRecentSearches && (
        <div className="recent-searches">
          {recentSearches.map((search, index) => (
            <button key={index} onClick={() => setIpAddress(search)}>{search}</button>
          ))}
        </div>
      )}
      <div className="history">
        <h3>Search History</h3>
        {paginatedHistory.map((item, index) => (
          <div key={index} className="history-item">
            <span>{item.ip}</span>
            <span>{new Date(item.timestamp).toLocaleString()}</span>
          </div>
        ))}
        <div className="pagination">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>Previous</button>
          <span>Page {currentPage}</span>
          <button onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
        </div>
      </div>
      {isLoading && <LoadingBar />}
      {error && <div className="error">Error: {error}</div>}
      <ErrorBoundary>
        {ipInfo && (
          <div className="info">
            <h2 className="info-title">IP Information</h2>
            <div className="info-grid">
              <InfoItem label="IP Version" value={ipInfo.ipVersion} />
              <InfoItem label="IP Address" value={ipInfo.ipAddress} copyable copyToClipboard={copyToClipboard} />
              <InfoItem label="Country" value={`${ipInfo.countryName} (${ipInfo.countryCode})`} />
              <InfoItem label="Region" value={ipInfo.regionName} />
              <InfoItem label="City" value={ipInfo.cityName} />
              <InfoItem label="ZIP Code" value={ipInfo.zipCode} />
              <InfoItem label="Continent" value={`${ipInfo.continent} (${ipInfo.continentCode})`} />
              <InfoItem label="Time Zone" value={ipInfo.timeZone} />
              <InfoItem label="Latitude" value={ipInfo.latitude} />
              <InfoItem label="Longitude" value={ipInfo.longitude} />
              <InfoItem label="Is Proxy" value={ipInfo.isProxy ? 'Yes' : 'No'} />
            </div>
            <Suspense fallback={<div>Loading map...</div>}>
              <MapComponent center={[ipInfo.latitude, ipInfo.longitude]} />
            </Suspense>
          </div>
        )}
      </ErrorBoundary>
      <footer className="footer">
        This app was programmed by Nhlulelo Binbin. Last updated in 2024.
      </footer>
    </div>
  );
}