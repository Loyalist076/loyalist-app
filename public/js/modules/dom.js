/**
 * DOM Module - Reusable UI manipulation functions
 * Uses textContent instead of innerHTML for XSS prevention
 * @module dom
 */

/**
 * Safely set text content (XSS-safe)
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} text - Text to set
 */
export function setText(element, text) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) {
    el.textContent = text;
  }
}

/**
 * Create element with attributes and text
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes to set
 * @param {string} [text] - Text content
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, text = '') {
  const el = document.createElement(tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        el.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });
  
  if (text) {
    el.textContent = text;
  }
  
  return el;
}

/**
 * Show element
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} [display='block'] - Display value
 */
export function show(element, display = 'block') {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) {
    el.style.display = display;
  }
}

/**
 * Hide element
 * @param {HTMLElement|string} element - Element or selector
 */
export function hide(element) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) {
    el.style.display = 'none';
  }
}

/**
 * Toggle element visibility
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} [display='block'] - Display value when shown
 */
export function toggle(element, display = 'block') {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) {
    el.style.display = el.style.display === 'none' ? display : 'none';
  }
}

/**
 * Add class to element
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} className - Class to add
 */
export function addClass(element, className) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) {
    el.classList.add(className);
  }
}

/**
 * Remove class from element
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} className - Class to remove
 */
export function removeClass(element, className) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) {
    el.classList.remove(className);
  }
}

/**
 * Toggle class on element
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} className - Class to toggle
 */
export function toggleClass(element, className) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) {
    el.classList.toggle(className);
  }
}

/**
 * Query selector shorthand
 * @param {string} selector - CSS selector
 * @param {HTMLElement} [parent=document] - Parent element
 * @returns {HTMLElement|null} Found element
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query selector all shorthand
 * @param {string} selector - CSS selector
 * @param {HTMLElement} [parent=document] - Parent element
 * @returns {NodeList} Found elements
 */
export function $$(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * Add event listener with delegation
 * @param {HTMLElement|string} parent - Parent element or selector
 * @param {string} eventType - Event type
 * @param {string} childSelector - Child selector to delegate to
 * @param {Function} handler - Event handler
 */
export function delegate(parent, eventType, childSelector, handler) {
  const el = typeof parent === 'string' ? document.querySelector(parent) : parent;
  if (!el) return;

  el.addEventListener(eventType, (event) => {
    const target = event.target.closest(childSelector);
    if (target && el.contains(target)) {
      handler.call(target, event, target);
    }
  });
}

/**
 * Show loading state on button
 * @param {HTMLButtonElement} button - Button element
 * @param {string} [loadingText='Loading...'] - Loading text
 * @returns {Function} Function to restore button
 */
export function showButtonLoading(button, loadingText = 'Loading...') {
  const originalText = button.textContent;
  const originalDisabled = button.disabled;
  
  button.textContent = loadingText;
  button.disabled = true;
  
  return () => {
    button.textContent = originalText;
    button.disabled = originalDisabled;
  };
}

/**
 * Show toast notification
 * @param {string} message - Message to show
 * @param {string} [type='info'] - Toast type (success, error, warning, info)
 * @param {number} [duration=3000] - Duration in ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = createElement('div', {
    className: `toast toast--${type}`,
  }, message);
  
  // Add styles if not already present
  if (!document.getElementById('toast-styles')) {
    const styles = createElement('style', { id: 'toast-styles' });
    styles.textContent = `
      .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
      }
      .toast--success { background: #28A745; }
      .toast--error { background: #DC3545; }
      .toast--warning { background: #FFC107; color: #333; }
      .toast--info { background: #17A2B8; }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Sanitize HTML string (for when innerHTML is absolutely necessary)
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}
