/**
 * Admin Sidebar Component
 * Shared across all admin pages for consistent navigation
 * Include this script in any admin page to add the sidebar
 */
(function() {
  const currentPage = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
  
  const sidebarHTML = `
    <aside class="admin-sidebar" id="adminSidebar">
      <div class="admin-sidebar__logo">
        <img src="../image/logo.webp" alt="Loyalist Logo" />
      </div>
      <nav class="admin-sidebar__nav">
        <a href="admin-dashboard.html" class="${currentPage === 'admin-dashboard.html' ? 'active' : ''}">
          <span>📊</span> Dashboard
        </a>
        <a href="manage-users.html" class="${currentPage === 'manage-users.html' ? 'active' : ''}">
          <span>👥</span> Manage Users
        </a>
        <a href="manage-admins.html" class="${currentPage === 'manage-admins.html' ? 'active' : ''}">
          <span>🔐</span> Manage Admins
        </a>
        <a href="messages.html" class="${currentPage === 'messages.html' ? 'active' : ''}">
          <span>💬</span> Messages
        </a>
        <a href="subscribed-users.html" class="${currentPage === 'subscribed-users.html' ? 'active' : ''}">
          <span>📧</span> Subscribers
        </a>
        <hr class="admin-sidebar__divider" />
        <a href="admin-news.html" class="${currentPage === 'admin-news.html' ? 'active' : ''}">
          <span>📰</span> News Manager
        </a>
        <a href="pdf-manager.html" class="${currentPage === 'pdf-manager.html' ? 'active' : ''}">
          <span>📄</span> PDF Manager
        </a>
        <a href="manage-events.html" class="${currentPage === 'manage-events.html' ? 'active' : ''}">
          <span>📅</span> Manage Events
        </a>
        <hr class="admin-sidebar__divider" />
        <a href="post-financial-statements.html" class="${currentPage === 'post-financial-statements.html' ? 'active' : ''}">
          <span>💰</span> Financial Statements
        </a>
        <a href="annual-meeting-documents.html" class="${currentPage === 'annual-meeting-documents.html' ? 'active' : ''}">
          <span>📋</span> Annual Meeting Docs
        </a>
        <a href="post-corporate.html" class="${currentPage === 'post-corporate.html' ? 'active' : ''}">
          <span>🏢</span> Corporate Structure
        </a>
        <a href="corporate-presentation-manager.html" class="${currentPage === 'corporate-presentation-manager.html' ? 'active' : ''}">
          <span>📽️</span> Corporate Presentations
        </a>
        <a href="technical-report-manager.html" class="${currentPage === 'technical-report-manager.html' ? 'active' : ''}">
          <span>📑</span> Technical Reports
        </a>
        <hr class="admin-sidebar__divider" />
        <a href="../index.html" class="admin-sidebar__back">
          <span>🏠</span> Back to Website
        </a>
      </nav>
    </aside>
  `;

  const sidebarStyles = `
    <style id="admin-sidebar-styles">
      .admin-sidebar {
        width: 260px;
        background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
        position: fixed;
        height: 100vh;
        left: 0;
        top: 0;
        z-index: 1000;
        overflow-y: auto;
        transition: transform 0.3s ease;
        box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
      }

      .admin-sidebar.hidden {
        transform: translateX(-100%);
      }

      .admin-sidebar__logo {
        padding: 20px;
        text-align: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .admin-sidebar__logo img {
        max-width: 150px;
        height: auto;
      }

      .admin-sidebar__nav {
        padding: 15px 10px;
      }

      .admin-sidebar__nav a {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        color: #a0aec0;
        text-decoration: none;
        border-radius: 8px;
        margin-bottom: 4px;
        font-size: 14px;
        transition: all 0.2s ease;
      }

      .admin-sidebar__nav a:hover {
        background: rgba(212, 178, 72, 0.1);
        color: #D4B248;
      }

      .admin-sidebar__nav a.active {
        background: rgba(212, 178, 72, 0.2);
        color: #D4B248;
        font-weight: 600;
      }

      .admin-sidebar__nav a span {
        font-size: 16px;
      }

      .admin-sidebar__divider {
        border: none;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        margin: 15px 10px;
      }

      .admin-sidebar__back {
        color: #ef4444 !important;
      }

      .admin-sidebar__back:hover {
        background: rgba(239, 68, 68, 0.1) !important;
        color: #ef4444 !important;
      }

      /* Mobile toggle button */
      .admin-sidebar-toggle {
        display: none;
        position: fixed;
        top: 15px;
        left: 15px;
        z-index: 1001;
        background: #1a1a2e;
        color: #D4B248;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        font-size: 20px;
        cursor: pointer;
      }

      /* Adjust main content */
      .admin-main-content {
        margin-left: 260px;
        padding: 20px;
        min-height: 100vh;
        transition: margin-left 0.3s ease;
      }

      @media (max-width: 768px) {
        .admin-sidebar {
          transform: translateX(-100%);
        }

        .admin-sidebar.active {
          transform: translateX(0);
        }

        .admin-sidebar-toggle {
          display: block;
        }

        .admin-main-content {
          margin-left: 0;
          padding-top: 60px;
        }
      }

      /* Scrollbar styling */
      .admin-sidebar::-webkit-scrollbar {
        width: 6px;
      }

      .admin-sidebar::-webkit-scrollbar-track {
        background: transparent;
      }

      .admin-sidebar::-webkit-scrollbar-thumb {
        background: rgba(212, 178, 72, 0.3);
        border-radius: 3px;
      }

      .admin-sidebar::-webkit-scrollbar-thumb:hover {
        background: rgba(212, 178, 72, 0.5);
      }
    </style>
  `;

  document.addEventListener('DOMContentLoaded', function() {
    // Add styles
    document.head.insertAdjacentHTML('beforeend', sidebarStyles);
    
    // Add sidebar
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    
    // Add toggle button for mobile
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'admin-sidebar-toggle';
    toggleBtn.innerHTML = '☰';
    toggleBtn.onclick = function() {
      document.getElementById('adminSidebar').classList.toggle('active');
    };
    document.body.insertAdjacentElement('afterbegin', toggleBtn);

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', function(e) {
      const sidebar = document.getElementById('adminSidebar');
      const toggle = document.querySelector('.admin-sidebar-toggle');
      if (window.innerWidth <= 768 && 
          !sidebar.contains(e.target) && 
          !toggle.contains(e.target) &&
          sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
    });
  });

  // Global toggle function
  window.toggleAdminSidebar = function() {
    document.getElementById('adminSidebar').classList.toggle('active');
  };
})();
