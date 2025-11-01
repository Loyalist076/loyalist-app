/**
 * Cache Utility for API Requests
 * Prevents 429 (Too Many Requests) errors by caching API responses in localStorage
 * with configurable expiration times
 */

const CacheUtils = {
  /**
   * Default cache duration in milliseconds
   * - Events: 5 minutes
   * - News: 10 minutes
   * - Financial data: 30 minutes
   * - Corporate structure: 1 hour
   * - Annual meeting docs: 1 hour
   */
  CACHE_DURATIONS: {
    'upcoming-events': 5 * 60 * 1000,        // 5 minutes
    'news': 10 * 60 * 1000,                  // 10 minutes
    'pdf': 30 * 60 * 1000,                   // 30 minutes
    'financials': 30 * 60 * 1000,            // 30 minutes
    'company-structure': 60 * 60 * 1000,     // 1 hour
    'annual-meeting-documents': 60 * 60 * 1000, // 1 hour
    'default': 15 * 60 * 1000                // 15 minutes default
  },

  /**
   * Generate a cache key for an API endpoint
   * @param {string} url - The API URL
   * @returns {string} Cache key
   */
  getCacheKey(url) {
    return `api_cache_${url}`;
  },

  /**
   * Get cached data if it exists and hasn't expired
   * @param {string} url - The API URL
   * @returns {Object|null} Cached data or null if expired/not found
   */
  getCache(url) {
    try {
      const cacheKey = this.getCacheKey(url);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const { data, timestamp, expiration } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache has expired
      if (now - timestamp > expiration) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`✅ Cache HIT for ${url} (age: ${Math.round((now - timestamp) / 1000)}s)`);
      return data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  },

  /**
   * Set cached data with expiration
   * @param {string} url - The API URL
   * @param {*} data - Data to cache
   * @param {number} customDuration - Optional custom cache duration in ms
   */
  setCache(url, data, customDuration = null) {
    try {
      const cacheKey = this.getCacheKey(url);

      // Determine cache duration based on endpoint
      let expiration = customDuration;
      if (!expiration) {
        const endpoint = url.split('/api/')[1]?.split('/')[0] || 'default';
        expiration = this.CACHE_DURATIONS[endpoint] || this.CACHE_DURATIONS.default;
      }

      const cacheData = {
        data,
        timestamp: Date.now(),
        expiration
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 Cached ${url} for ${expiration / 1000}s`);
    } catch (error) {
      console.error('Error setting cache:', error);
      // If localStorage is full, clear old cache entries
      if (error.name === 'QuotaExceededError') {
        this.clearOldCache();
        // Try again after clearing
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (retryError) {
          console.error('Failed to cache even after clearing:', retryError);
        }
      }
    }
  },

  /**
   * Clear cache for a specific URL
   * @param {string} url - The API URL
   */
  clearCache(url) {
    const cacheKey = this.getCacheKey(url);
    localStorage.removeItem(cacheKey);
    console.log(`🗑️ Cleared cache for ${url}`);
  },

  /**
   * Clear all API caches
   */
  clearAllCache() {
    const keys = Object.keys(localStorage);
    let cleared = 0;
    keys.forEach(key => {
      if (key.startsWith('api_cache_')) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    console.log(`🗑️ Cleared ${cleared} cache entries`);
  },

  /**
   * Clear expired cache entries (called automatically when storage is full)
   */
  clearOldCache() {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleared = 0;

    keys.forEach(key => {
      if (key.startsWith('api_cache_')) {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (now - cached.timestamp > cached.expiration) {
            localStorage.removeItem(key);
            cleared++;
          }
        } catch (error) {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
          cleared++;
        }
      }
    });

    console.log(`🧹 Cleared ${cleared} expired cache entries`);
  },

  /**
   * Enhanced fetch with automatic caching
   * @param {string} url - The API URL
   * @param {Object} options - Fetch options (only GET requests are cached)
   * @param {number} cacheDuration - Optional custom cache duration in ms
   * @returns {Promise} Fetch promise
   */
  async cachedFetch(url, options = {}, cacheDuration = null) {
    const method = options.method || 'GET';

    // Only cache GET requests
    if (method.toUpperCase() !== 'GET') {
      return fetch(url, options);
    }

    // Check cache first
    const cached = this.getCache(url);
    if (cached !== null) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => cached,
        clone: function() { return this; }
      });
    }

    // If not in cache, fetch from server
    try {
      console.log(`🌐 Fetching from server: ${url}`);
      const response = await fetch(url, options);

      // Only cache successful responses
      if (response.ok) {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        this.setCache(url, data, cacheDuration);
      }

      return response;
    } catch (error) {
      console.error(`❌ Fetch error for ${url}:`, error);
      throw error;
    }
  },

  /**
   * Prefetch and cache data for a URL
   * @param {string} url - The API URL
   * @param {number} cacheDuration - Optional custom cache duration
   */
  async prefetch(url, cacheDuration = null) {
    try {
      await this.cachedFetch(url, {}, cacheDuration);
      console.log(`⚡ Prefetched: ${url}`);
    } catch (error) {
      console.error(`Failed to prefetch ${url}:`, error);
    }
  },

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(k => k.startsWith('api_cache_'));
    const now = Date.now();

    const stats = {
      total: cacheKeys.length,
      valid: 0,
      expired: 0,
      totalSize: 0
    };

    cacheKeys.forEach(key => {
      const value = localStorage.getItem(key);
      stats.totalSize += value.length;

      try {
        const cached = JSON.parse(value);
        if (now - cached.timestamp > cached.expiration) {
          stats.expired++;
        } else {
          stats.valid++;
        }
      } catch (error) {
        stats.expired++;
      }
    });

    stats.totalSizeKB = Math.round(stats.totalSize / 1024);
    return stats;
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.CacheUtils = CacheUtils;
}

// Auto-clear expired cache on page load
document.addEventListener('DOMContentLoaded', () => {
  // Clear expired entries on load
  CacheUtils.clearOldCache();

  // Log cache stats in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const stats = CacheUtils.getCacheStats();
    console.log('📊 Cache Stats:', stats);
  }
});
