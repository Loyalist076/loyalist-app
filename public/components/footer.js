/**
 * Footer Component - Reusable across all pages
 * Eliminates footer HTML duplication (DRY principle)
 */
(function() {
  const isSubPage = window.location.pathname.includes('/page/');
  const basePath = isSubPage ? '../' : '';
  const pagePath = isSubPage ? '' : 'page/';

  const footerHTML = `
    <footer class="site-footer">
      <div class="footer-container">
        <div class="contact-column">
          <h4>Contact Information</h4>
          <p><strong>Email:</strong><br/> <a href="mailto:efarr@loyalistexploration.com">efarr@loyalistexploration.com</a></p>
          <p><strong>Phone:</strong><br/> <a href="tel:+16472961270">+1 647‑296‑1270</a></p>
          <p><strong>Address:</strong><br>110 Yonge Street,
            Suite 1601
            <br/> Toronto, Ontario M5C1T4</p>
        </div>
        <div class="quick-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="${basePath}${pagePath}company.html">About Us</a></li>
            <li><a href="${basePath}${pagePath}projects.html">Projects</a></li>
            <li><a href="${basePath}${pagePath}corporate-structure.html">Investors</a></li>
            <li><a href="${basePath}${pagePath}press-release.html">Press Release</a></li>
            <li><a href="${basePath}${pagePath}contact.html">Contact</a></li>
            <li><a href="${basePath}${pagePath}disclaimers.html">Disclaimer</a></li>
          </ul>
        </div>
        <div class="social-column">
          <h4>Follow Us</h4>
          <div class="social-icons">
            <a href="https://www.linkedin.com/company/loyalist-exploration-limited/" target="_blank" rel="noopener"><i class="fab fa-linkedin-in"></i></a>
            <a href="https://x.com/LoyalistExp" target="_blank" rel="noopener"><i class="fa-brands fa-x-twitter"></i></a>
            <a href="https://www.facebook.com/people/Loyalist-Exploration/61575711082978/" target="_blank" rel="noopener"><i class="fab fa-facebook-f"></i></a>
            <a href="https://www.youtube.com/@LoyalistExploration" target="_blank" rel="noopener"><i class="fa-brands fa-youtube"></i></a>
            <a href="https://www.instagram.com/loyalistexploration/" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i></a>
          </div>
          <div class="subscribe-box">
            <h4>Subscribe to Our Newsletter</h4>
            <form class="subscribe-form" onsubmit="handleFooterSubscribe(event)">
              <input
                type="email"
                placeholder="Enter your email"
                id="footerSubscriberEmail"
                required
              /><br /><br />
              <button type="submit">Subscribe</button>
            </form>
            <div
              id="footer-subscribe-message"
              class="subscribe-message"
              style="display: none;"
            ></div>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Loyalist Exploration Limited. All rights reserved.</p>
      </div>
    </footer>
  `;

  document.addEventListener('DOMContentLoaded', function() {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
      footerContainer.innerHTML = footerHTML;
    }
  });
})();
