function toggleMenu() {
  document.getElementById('navbar').classList.toggle('active');
}

// Handle mobile dropdowns
function toggleDropdown(e) {
  if (window.innerWidth <= 768) {
    e.currentTarget.classList.toggle('active');
  }
}
function toggleDropdown(e) {
  if (window.innerWidth <= 1024) {
    e.stopPropagation(); // Prevent click from bubbling
    const current = e.currentTarget;

    // Toggle only the clicked dropdown
    current.classList.toggle('active');

    // Close other open dropdowns
    document.querySelectorAll('.has-dropdown').forEach(item => {
      if (item !== current) {
        item.classList.remove('active');
      }
    });
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
  document.addEventListener("DOMContentLoaded", () => {
    const popup = document.getElementById('welcomePopup');

    // Show popup only if not already shown
    const hasSeenPopup = localStorage.getItem('loyalist_popup_shown');
    if (!hasSeenPopup && popup) {
      popup.style.display = 'flex';
      localStorage.setItem('loyalist_popup_shown', 'true');
    } else if (popup) {
      popup.style.display = 'none';
    }

    // Close popup
    function closePopup() {
      if (popup) popup.style.display = 'none';
    }

    // Subscribe function
    async function subscribe() {
      const emailInput = document.getElementById('subscriberEmail');
      const popupContent = document.querySelector('.popup-content');

      // Create or reuse a status message element inside the popup
      let statusBox = document.getElementById('subscribeStatus');
      if (!statusBox) {
        statusBox = document.createElement('div');
        statusBox.id = 'subscribeStatus';
        statusBox.style.marginTop = '10px';
        statusBox.style.fontWeight = 'bold';
        popupContent.appendChild(statusBox);
      }

      const email = emailInput.value.trim();
      statusBox.style.display = 'block';

      if (email === '') {
        statusBox.innerText = "⚠️ Please enter your email address.";
        statusBox.style.color = "red";
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
          statusBox.innerText = data.message || '❌ Subscription failed.';
          statusBox.style.color = 'red';
          return;
        }

        statusBox.innerText = "✅ Thank you for subscribing!";
        statusBox.style.color = "green";
        emailInput.value = '';
        setTimeout(closePopup, 2000);

      } catch (error) {
        console.error(error);
        statusBox.innerText = "❌ Network or server error.";
        statusBox.style.color = "red";
      }
    }

    // Expose functions to window for button handlers
    window.closePopup = closePopup;
    window.subscribe = subscribe;
  });


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


  // Handle "Get In Touch" popup contact form submission
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
      const res = await fetch('/api/messages/contact/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Check if the response is HTML (in case of server misrouting)
      const contentType = res.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        throw new Error('Server returned unexpected content (HTML instead of JSON)');
      }

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Message sent successfully!');
        form.reset();
        if (typeof modal !== 'undefined') modal.style.display = 'none'; // Close modal if exists
      } else {
        alert(data.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      alert('Something went wrong. Please try again later.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });

  // Script for Upcoming Events section
fetch('/api/upcoming-events')
  .then(res => res.json())
  .then(events => {
    const container = document.getElementById('upcomingEvents');
    container.innerHTML = '<h2>UPCOMING EVENTS</h2>'; // Preserve the main heading

    // Optional: limit to next 2 events
    const upcoming = events.slice(0, 2);

    upcoming.forEach(event => {
      const div = document.createElement('div');
      div.className = 'news-card1';
      div.innerHTML = `
        <h3 class="event-title">${event.title}</h3>
        <span class="date">${new Date(event.date).toDateString()}</span>
        <p>“${event.description}”</p>
      `;
      container.appendChild(div);
    });
  })
  .catch(err => console.error('Error fetching upcoming events:', err));


// for news 

   async function loadNews() {
  try {
    const response = await fetch('/api/news');
    const newsList = await response.json();

    const sortedNews = newsList.sort((a, b) => new Date(b.date) - new Date(a.date));
    const newsCarousel = document.getElementById('latestNewsCarousel');
    newsCarousel.innerHTML = '';

    sortedNews.forEach(news => {
      const card = document.createElement('div');
      card.className = 'news-card';
      card.innerHTML = `
        <h3><a href="/news-detail.html?id=${news.id}">${news.title}</a></h3>
        <p>${new Date(news.date).toLocaleDateString()}</p>
      `;
      newsCarousel.appendChild(card);
    });

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentIndex = 0;

    function updateCarousel() {
      const cardWidth = newsCarousel.querySelector('.news-card').offsetWidth + 24;
      newsCarousel.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }

    prevBtn.addEventListener('click', () => {
      currentIndex = Math.max(currentIndex - 1, 0);
      updateCarousel();
    });

    nextBtn.addEventListener('click', () => {
      const totalCards = newsCarousel.children.length;
      const visibleCards = getVisibleCards();
      const maxIndex = totalCards - visibleCards;
      currentIndex = Math.min(currentIndex + 1, maxIndex);
      updateCarousel();
    });

    function getVisibleCards() {
      if (window.innerWidth >= 1025) return 4; // desktop
      if (window.innerWidth >= 769) return 2;  // tablet
      return 1;                                // mobile
    }

    window.addEventListener('resize', updateCarousel);
  } catch (err) {
    console.error('Error fetching news:', err);
    document.getElementById('latestNewsCarousel').innerHTML = '<p style="color:red;">Failed to load news.</p>';
  }
}

window.addEventListener('DOMContentLoaded', loadNews);


     
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