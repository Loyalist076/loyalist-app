/**
 * State Module - Centralized state management
 * Do not store data in DOM - use this module instead
 * @module state
 */

/**
 * Application state object
 * @type {Object}
 */
const state = {
  user: null,
  isAuthenticated: false,
  news: [],
  technicalReports: [],
  upcomingEvents: [],
  ui: {
    isMenuOpen: false,
    isModalOpen: false,
    activeModal: null,
    isLoading: false,
  },
};

/**
 * State change listeners
 * @type {Map<string, Set<Function>>}
 */
const listeners = new Map();

/**
 * Get current state or a specific path
 * @param {string} [path] - Dot-notation path (e.g., 'user.name')
 * @returns {*} State value
 */
export function getState(path) {
  if (!path) return { ...state };
  
  return path.split('.').reduce((obj, key) => {
    return obj && obj[key] !== undefined ? obj[key] : undefined;
  }, state);
}

/**
 * Set state value at path
 * @param {string} path - Dot-notation path
 * @param {*} value - Value to set
 */
export function setState(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  let current = state;
  for (const key of keys) {
    if (current[key] === undefined) {
      current[key] = {};
    }
    current = current[key];
  }
  
  const oldValue = current[lastKey];
  current[lastKey] = value;
  
  // Notify listeners
  notifyListeners(path, value, oldValue);
}

/**
 * Subscribe to state changes
 * @param {string} path - State path to watch
 * @param {Function} callback - Callback function (newValue, oldValue)
 * @returns {Function} Unsubscribe function
 */
export function subscribe(path, callback) {
  if (!listeners.has(path)) {
    listeners.set(path, new Set());
  }
  
  listeners.get(path).add(callback);
  
  // Return unsubscribe function
  return () => {
    listeners.get(path).delete(callback);
  };
}

/**
 * Notify listeners of state change
 * @param {string} path - Changed path
 * @param {*} newValue - New value
 * @param {*} oldValue - Old value
 */
function notifyListeners(path, newValue, oldValue) {
  // Notify exact path listeners
  if (listeners.has(path)) {
    listeners.get(path).forEach(callback => {
      callback(newValue, oldValue);
    });
  }
  
  // Notify parent path listeners
  const parts = path.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const parentPath = parts.slice(0, i).join('.');
    if (listeners.has(parentPath)) {
      listeners.get(parentPath).forEach(callback => {
        callback(getState(parentPath), undefined);
      });
    }
  }
}

/**
 * Reset state to initial values
 */
export function resetState() {
  state.user = null;
  state.isAuthenticated = false;
  state.news = [];
  state.technicalReports = [];
  state.upcomingEvents = [];
  state.ui = {
    isMenuOpen: false,
    isModalOpen: false,
    activeModal: null,
    isLoading: false,
  };
}

/**
 * Initialize state from localStorage
 */
export function initState() {
  const token = localStorage.getItem('token');
  if (token) {
    setState('isAuthenticated', true);
    // Could decode JWT here to get user info
  }
}

// Export state for debugging (remove in production)
if (typeof window !== 'undefined') {
  window.__APP_STATE__ = state;
}
