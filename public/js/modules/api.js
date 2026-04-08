/**
 * API Module - Centralized fetch calls with error handling
 * @module api
 */

/**
 * Base API configuration
 */
const API_BASE = '/api';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {Object} data - Additional error data
   */
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic fetch wrapper with error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 * @throws {ApiError} On API error
 */
export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        data.message || data.error || 'An error occurred',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error', 0);
  }
}

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Object>} Response data
 */
export const get = (endpoint) => fetchApi(endpoint, { method: 'GET' });

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @returns {Promise<Object>} Response data
 */
export const post = (endpoint, body) => 
  fetchApi(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  });

/**
 * PUT request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @returns {Promise<Object>} Response data
 */
export const put = (endpoint, body) => 
  fetchApi(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(body) 
  });

/**
 * DELETE request helper
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Object>} Response data
 */
export const del = (endpoint) => fetchApi(endpoint, { method: 'DELETE' });

/**
 * Subscribe to newsletter
 * @param {string} email - Email address
 * @param {string} [source='website'] - Subscription source
 * @returns {Promise<Object>} Subscription result
 */
export const subscribe = (email, source = 'website') => 
  post('/subscribe', { email, source });

/**
 * Submit contact form
 * @param {Object} data - Contact form data
 * @returns {Promise<Object>} Submission result
 */
export const submitContact = (data) => post('/contact', data);

/**
 * Fetch news articles
 * @returns {Promise<Array>} Array of news articles
 */
export const getNews = () => get('/news');

/**
 * Fetch single news article
 * @param {string} id - News ID
 * @returns {Promise<Object>} News article
 */
export const getNewsById = (id) => get(`/news/${id}`);

/**
 * Fetch technical reports
 * @returns {Promise<Array>} Array of technical reports
 */
export const getTechnicalReports = () => get('/technical-reports');

/**
 * Fetch upcoming events
 * @returns {Promise<Array>} Array of upcoming events
 */
export const getUpcomingEvents = () => get('/upcoming-events');
