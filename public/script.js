function toggleMenu() {
  document.getElementById('navbar').classList.toggle('active');
}

// Handle mobile dropdowns
function toggleDropdown(e) {
  if (window.innerWidth <= 768) {
    e.currentTarget.classList.toggle('active');
  }
}

// Modal handling
function openModal(type) {
  document.getElementById("modal").style.display = "block";
  document.getElementById("login-form").style.display = type === "login" ? "block" : "none";
  document.getElementById("contact-form").style.display = type === "contact" ? "block" : "none";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}
// pop up welcome message

  function closePopup() {
    document.getElementById('welcomePopup').style.display = 'none';
  }

  async function subscribe() {
    const email = document.getElementById('subscriberEmail').value.trim();
    if (email === '') {
      alert("Please enter your email address.");
      return;
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Something went wrong.');
        return;
      }

      alert("Thank you for subscribing!");
      closePopup();
    } catch (error) {
      alert("Error subscribing.");
      console.error(error);
    }
  }



// for login register and logout functionality 
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const user = localStorage.getItem('user');

  if (user) {
    // User is logged in
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    // User is not logged in
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('user');
    alert('Logged out successfully!');
    window.location.href = 'index.html';
  });
});



  const modal = document.getElementById('contactModal');
  const openBtn = document.getElementById('getInTouchBtn');
  const closeBtn = document.getElementById('closeModalBtn');

  // Open modal
  openBtn.onclick = () => {
    modal.style.display = 'block';
  };

  // Close modal
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };

  // Close if click outside modal content
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };

  // Submit form without reloading page
  document.getElementById('popupContactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim()
    };

    try {
      const res = await fetch('/api/contact/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Message sent!');
        form.reset();
        modal.style.display = 'none';
      } else {
        alert(data.message || 'Submission failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Try again later.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });


// for news 

 let slideIndex = 0;
    const visibleCards = 3;
    let olderNews = [];

    function getImageUrl(url) {
      if (!url || typeof url !== 'string' || url.trim() === '' || !url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        return 'https://via.placeholder.com/550x220?text=No+Image';
      }
      return url;
    }

    function openModal(title, image, content) {
      document.getElementById('modalTitle').innerText = title;
      document.getElementById('modalImage').src = image;
      document.getElementById('modalContent').innerHTML = content || '<p>No additional content available.</p>';
      document.getElementById('newsModal').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('newsModal').style.display = 'none';
    }

    document.getElementById('newsModal').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    function renderOlderNews() {
      const container = document.getElementById('olderNewsContainer');
      const start = slideIndex * visibleCards;
      const visibleItems = olderNews.slice(start, start + visibleCards);

      container.innerHTML = visibleItems.map((news) => `
        <div class="news-card">
          <img src="${getImageUrl(news.imageUrl)}" alt="News Image" />
          <div class="news-content">
            <div class="news-title">${news.title || 'Untitled News'}</div>
            <div class="news-description">${(news.description || news.content || 'No content available.').replace(/<[^>]+>/g, '').substring(0, 100)}...</div>
            <span class="read-more" onclick='openModal(${JSON.stringify(news.title)}, "${getImageUrl(news.imageUrl)}", ${JSON.stringify(news.content || '')})'>Read More ▶</span>
          </div>
        </div>
      `).join('');
    }

    async function loadNews() {
      try {
        const res = await fetch('/api/news');
        const newsList = await res.json();

        const latestNews = newsList.slice(0, 2);
        olderNews = newsList.slice(2);

        const latestContainer = document.getElementById('latestNewsContainer');
        latestContainer.innerHTML = latestNews.map((news) => `
          <div class="latest-card">
            <img src="${getImageUrl(news.imageUrl)}" alt="News Image" />
            <div class="latest-content">
              <div class="news-title">${news.title || 'Untitled News'}</div>
              <div class="news-description">${(news.description || news.content || 'No content available.').replace(/<[^>]+>/g, '').substring(0, 100)}...</div>
              <span class="read-more" onclick='openModal(${JSON.stringify(news.title)}, "${getImageUrl(news.imageUrl)}", ${JSON.stringify(news.content || '')})'>Read More ▶</span>
            </div>
          </div>
        `).join('');

        renderOlderNews();
      } catch (err) {
        console.error('Failed to load news:', err);
      }
    }

    document.getElementById('prevBtn').addEventListener('click', () => {
      if (slideIndex > 0) {
        slideIndex--;
        renderOlderNews();
      }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
      if ((slideIndex + 1) * visibleCards < olderNews.length) {
        slideIndex++;
        renderOlderNews();
      }
    });

    // ✅ Ensure DOM is ready before manipulating elements
    window.onload = () => {
      loadNews();
    };

     
  document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  const formData = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    subject: form.subject.value.trim(),
    message: form.message.value.trim()
  };

  try {
    const res = await fetch('/api/contact/page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message || 'Message sent successfully!');
      form.reset();
    } else {
      alert(data.message || 'Something went wrong. Please try again.');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to send message. Try again later.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  }
});


// for subscribe form 

  async function handleSubscribe(event) {
    event.preventDefault();

    const emailInput = document.getElementById('homepageSubscriberEmail');
    const messageDiv = document.getElementById('subscribe-message');
    const email = emailInput.value.trim();

    // Simple email regex
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailPattern.test(email)) {
      messageDiv.style.display = 'block';
      messageDiv.style.color = 'red';
      messageDiv.textContent = 'Please enter a valid email address.';
      return;
    }

    try {
      const res = await fetch('/api/subscribe/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      messageDiv.style.display = 'block';
      if (res.ok) {
        messageDiv.style.color = 'green';
        messageDiv.textContent = data.message || 'Subscribed successfully!';
        emailInput.value = '';

        setTimeout(() => {
          messageDiv.style.display = 'none';
        }, 4000);
      } else {
        messageDiv.style.color = 'red';
        messageDiv.textContent = data.message || 'Something went wrong.';
        setTimeout(() => {
          messageDiv.style.display = 'none';
        }, 5000);
      }
    } catch (err) {
      console.error('❌ Subscription error:', err);
      messageDiv.style.display = 'block';
      messageDiv.style.color = 'red';
      messageDiv.textContent = 'Server error. Please try again later.';
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 5000);
    }
  }
