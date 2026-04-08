// Header Component - Reusable across all pages
(function() {
  // Determine if we're in a subdirectory (page/) or root
  const isSubPage = window.location.pathname.includes('/page/');
  const basePath = isSubPage ? '../' : '';
  const pagePath = isSubPage ? '' : 'page/';

  const headerHTML = `
    <header class="header">
      <div class="align-logo">
        <div class="logo">
          <a href="${basePath}index.html">
            <img src="${basePath}image/logo.webp" alt="Logo" />
          </a>
        </div>
        <div class="menu-toggle" onclick="toggleMenu()">&#9776;</div>
      </div>

      <nav class="navbar" id="navbar">
        <ul>
          <li class="has-dropdown" onclick="toggleDropdown(event)">
            <a href="#">About Us</a>
            <ul class="dropdown">
              <li><a href="${basePath}${pagePath}company.html">Company Profile</a></li>
              <li><a href="${basePath}${pagePath}our-team.html">Our Team</a></li>
            </ul>
          </li>

          <li class="has-dropdown" onclick="toggleDropdown(event)">
            <a href="#">Projects</a>
            <ul class="dropdown">
              <li><a href="${basePath}${pagePath}tully-project.html">Tully Project</a></li>
              <li><a href="${basePath}${pagePath}desantis-project.html">Desantis Project</a></li>
              <li><a href="${basePath}${pagePath}loveland-project.html">Loveland Project</a></li>
              <li><a href="${basePath}${pagePath}gold-rush.html">Gold Rush Project</a></li>
            </ul>
          </li>

          <li class="has-dropdown" onclick="toggleDropdown(event)">
            <a href="#">Investors</a>
            <ul class="dropdown">
              <li><a href="${basePath}${pagePath}corporate-structure.html">Corporate Structure</a></li>
              <li><a href="${basePath}${pagePath}financial-statements.html">Financial Statements & MD&A</a></li>
              <li><a href="${basePath}${pagePath}annual-meeting-documents.html">Annual Meeting</a></li>
              <li><a href="${basePath}${pagePath}presentations.html" id="corporatePresentationLink">Corporate Presentations</a></li>
              <li><a href="${basePath}${pagePath}technical-reports.html">Technical Reports</a></li>
            </ul>
          </li>

          <li class="has-dropdown" onclick="toggleDropdown(event)">
            <a href="${basePath}${pagePath}press-release.html">Press Release</a>
          </li>
        </ul>
        <div class="header-buttons">
          <button id="getInTouchBtn">Get in Touch</button>
        </div>
      </nav>
    </header>

    <div id="contactModal" class="modal">
      <div class="modal-content">
        <span class="close-btn" id="closeModalBtn">&times;</span>
        <form id="popupContactForm">
          <img src="${basePath}image/logo.webp" alt="Loyalist Logo" class="popup-logo2" />
          <input type="text" name="name" placeholder="Your Name" required /><br><br>
          <input type="email" name="email" placeholder="Your Email" required /><br><br>
          <input type="text" name="subject" placeholder="Subject" required /><br><br>
          <textarea name="message" placeholder="Message" required></textarea><br><br>
          <button type="submit">Send Message</button>
        </form>
      </div>
    </div>
  `;

  // Insert header at the beginning of body
  document.addEventListener('DOMContentLoaded', function() {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      headerContainer.innerHTML = headerHTML;
    } else {
      // Fallback: insert at beginning of body
      document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }

    // Initialize contact modal functionality
    initContactModal();
  });

  function initContactModal() {
    const getInTouchBtn = document.getElementById('getInTouchBtn');
    const contactModal = document.getElementById('contactModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const popupContactForm = document.getElementById('popupContactForm');

    if (getInTouchBtn && contactModal) {
      getInTouchBtn.addEventListener('click', function() {
        contactModal.style.display = 'block';
      });
    }

    if (closeModalBtn && contactModal) {
      closeModalBtn.addEventListener('click', function() {
        contactModal.style.display = 'none';
      });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
      if (event.target === contactModal) {
        contactModal.style.display = 'none';
      }
    });

    // Handle contact form submission
    if (popupContactForm) {
      popupContactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(popupContactForm);
        const data = {
          name: formData.get('name'),
          email: formData.get('email'),
          subject: formData.get('subject'),
          message: formData.get('message')
        };

        try {
          const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            alert('Message sent successfully!');
            popupContactForm.reset();
            contactModal.style.display = 'none';
          } else {
            alert('Failed to send message. Please try again.');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
        }
      });
    }
  }

  // Menu toggle function (make global)
  window.toggleMenu = function() {
    document.getElementById('navbar').classList.toggle('active');
  };

  // Dropdown toggle function (make global)
  window.toggleDropdown = function(e) {
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
  };
})();
