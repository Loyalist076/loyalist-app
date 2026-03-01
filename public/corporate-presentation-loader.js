/**
 * Corporate Presentation Dynamic Link Loader
 * This script fetches the corporate presentation PDF URL from the backend API
 * and updates all links with class 'corporate-presentation-link' or id 'corporatePresentationLink'
 */

async function loadCorporatePresentationLinks() {
  try {
    const response = await fetch('/api/corporate-presentation/check');
    if (!response.ok) {
      return;
    }
    const data = await response.json();

    // Update all links with the corporate presentation class or ID.
    // By default, keep authored href values so navigation to presentations page stays intact.
    // Use `data-use-latest-presentation="true"` for links that should point directly to the latest PDF.
    const links = document.querySelectorAll('.corporate-presentation-link, #corporatePresentationLink');

    links.forEach(link => {
      if (!link.dataset.defaultHref) {
        link.dataset.defaultHref = link.getAttribute('href') || '';
      }

      const defaultHref = link.dataset.defaultHref;
      const useLatestPresentation = link.dataset.useLatestPresentation === 'true';

      if (data.exists && useLatestPresentation && data.path) {
        link.href = data.path;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else {
        link.href = defaultHref;
        link.removeAttribute('target');
        link.removeAttribute('rel');
      }

      link.style.opacity = '';
      link.style.pointerEvents = '';
      link.removeAttribute('title');
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
