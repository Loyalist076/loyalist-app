/**
 * Shared JavaScript Utilities
 * DRY principle - common functions used across pages
 * Include this file in all pages to avoid code duplication
 */

/**
 * Toggle mobile navigation menu
 */
function toggleMenu() {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('active');
  }
}

/**
 * Toggle dropdown menus on mobile/tablet
 * @param {Event} e - Click event
 */
function toggleDropdown(e) {
  if (window.innerWidth <= 1024) {
    e.stopPropagation();
    const current = e.currentTarget;
    current.classList.toggle('active');

    document.querySelectorAll('.has-dropdown').forEach(item => {
      if (item !== current) {
        item.classList.remove('active');
      }
    });
  }
}

/**
 * Generic newsletter subscription handler
 * @param {Event} event - Form submit event
 * @param {string} emailInputId - ID of email input element
 * @param {string} messageId - ID of message display element
 */
async function handleSubscribe(event, emailInputId, messageId) {
  event.preventDefault();

  const emailInput = document.getElementById(emailInputId);
  const messageDiv = document.getElementById(messageId);
  const email = emailInput.value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailPattern.test(email)) {
    showMessage(messageDiv, 'Please enter a valid email address.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(messageDiv, data.message || 'Subscribed successfully!', 'success');
      emailInput.value = '';
    } else {
      const errorMsg = data?.error || data?.message;
      if (errorMsg?.includes('looks fake or invalid')) {
        showMessage(messageDiv, 'Email saved, but Mailchimp rejected it as invalid.', 'warning');
      } else {
        showMessage(messageDiv, errorMsg || 'Something went wrong.', 'error');
      }
    }

    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  } catch (err) {
    console.error('Subscription error:', err);
    showMessage(messageDiv, 'Server error. Please try again later.', 'error');
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}

/**
 * Show message in element with appropriate styling
 * @param {HTMLElement} element - Message container element
 * @param {string} message - Message text
 * @param {string} type - Message type (success, error, warning)
 */
function showMessage(element, message, type) {
  if (!element) return;
  
  element.style.display = 'block';
  element.textContent = message;
  
  switch (type) {
    case 'success':
      element.style.color = 'green';
      break;
    case 'error':
      element.style.color = 'red';
      break;
    case 'warning':
      element.style.color = 'orange';
      break;
    default:
      element.style.color = '#333';
  }
}

/**
 * Handle news subscription (wrapper for backward compatibility)
 * @param {Event} event - Form submit event
 */
async function handleNewsSubscribe(event) {
  await handleSubscribe(event, 'newsSubscriberEmail', 'news-subscribe-message');
}

/**
 * Handle company page subscription (wrapper for backward compatibility)
 * @param {Event} event - Form submit event
 */
async function handleCompanySubscribe(event) {
  await handleSubscribe(event, 'companySubscriberEmail', 'company-subscribe-message');
}

/**
 * Handle footer subscription (generic)
 * @param {Event} event - Form submit event
 */
async function handleFooterSubscribe(event) {
  await handleSubscribe(event, 'footerSubscriberEmail', 'footer-subscribe-message');
}

/**
 * Open modal by ID
 * @param {string} modalId - Modal element ID
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
  }
}

/**
 * Close modal by ID
 * @param {string} modalId - Modal element ID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Close popup (backward compatibility)
 */
function closePopup() {
  const popup = document.getElementById('welcomePopup');
  if (popup) {
    popup.style.display = 'none';
  }
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Debounce function for performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Make functions globally available
window.toggleMenu = toggleMenu;
window.toggleDropdown = toggleDropdown;
window.handleSubscribe = handleSubscribe;
window.handleNewsSubscribe = handleNewsSubscribe;
window.handleCompanySubscribe = handleCompanySubscribe;
window.handleFooterSubscribe = handleFooterSubscribe;
window.openModal = openModal;
window.closeModal = closeModal;
window.closePopup = closePopup;
window.formatDate = formatDate;
window.debounce = debounce;
window.throttle = throttle;
window.showMessage = showMessage;
