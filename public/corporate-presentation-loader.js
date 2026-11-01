/**
 * Corporate Presentation Dynamic Link Loader
 * This script fetches the corporate presentation PDF URL from the backend API
 * and updates all links with class 'corporate-presentation-link' or id 'corporatePresentationLink'
 */

async function loadCorporatePresentationLinks() {
  try {
    const response = await fetch('/api/corporate-presentation/check');
    const data = await response.json();

    // Update all links with the corporate presentation class or ID
    const links = document.querySelectorAll('.corporate-presentation-link, #corporatePresentationLink');

    links.forEach(link => {
      if (data.exists) {
        link.href = data.path;
        link.style.opacity = '1';
        link.style.pointerEvents = 'auto';
        link.removeAttribute('title');
      } else {
        // If PDF doesn't exist, disable the link
        link.href = '#';
        link.style.opacity = '0.5';
        link.style.pointerEvents = 'none';
        link.title = 'Corporate presentation not available';
      }
    });
  } catch (error) {
    console.error('Error loading corporate presentation links:', error);
    // Keep default links if API fails
  }
}

function resolveContactUrl() {
  const navLink = document.querySelector('a[href$="contact.html"], a[href$="contact"]');
  if (navLink) {
    return navLink.getAttribute('href');
  }

  const isInPagesDir = window.location.pathname.includes('/page/');
  return isInPagesDir ? 'contact.html' : 'page/contact.html';
}

function initGetInTouchRedirect() {
  const triggerButtons = document.querySelectorAll('#getInTouchBtn, .get-in-touch-btn');

  if (!triggerButtons.length) {
    return;
  }

  const contactUrl = resolveContactUrl();

  triggerButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
      event?.preventDefault();
      window.location.href = contactUrl;
    });
  });
}

// Footer newsletter form, for pages that don't define their own subscribe handler
async function handleSubscribe(event) {
  event.preventDefault();

  const emailInput = event.target.querySelector('input[type="email"]');
  const messageDiv = document.getElementById('subscribe-message');
  const email = emailInput.value.trim();

  const showMessage = (text, color) => {
    messageDiv.style.display = 'block';
    messageDiv.style.color = color;
    messageDiv.textContent = text;
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailPattern.test(email)) {
    showMessage('Please enter a valid email address.', 'red');
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
      showMessage(data.message || 'Subscribed successfully!', 'green');
      emailInput.value = '';
    } else {
      const errorMsg = data?.error || data?.message;
      if (errorMsg?.includes('looks fake or invalid')) {
        showMessage('Email saved, but not accepted by Mailchimp. Try a real email.', 'orange');
      } else {
        showMessage(errorMsg || 'Something went wrong.', 'red');
      }
    }
  } catch (err) {
    console.error('❌ Subscription error:', err);
    showMessage('Server error. Please try again later.', 'red');
  }
}

function initializeGlobalEnhancements() {
  loadCorporatePresentationLinks();
  initGetInTouchRedirect();
}

// Load enhancements when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGlobalEnhancements);
} else {
  initializeGlobalEnhancements();
}
