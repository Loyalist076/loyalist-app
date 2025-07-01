<<<<<<< HEAD
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
// pop up welcome message

 document.addEventListener("DOMContentLoaded", () => {
  // Close popup
  function closePopup() {
    const popup = document.getElementById('welcomePopup');
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
      setTimeout(closePopup, 2000); // Close popup after 2s

    } catch (error) {
      console.error(error);
      statusBox.innerText = "❌ Network or server error.";
      statusBox.style.color = "red";
    }
  }

  // Expose functions to HTML buttons
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


// for news 

    async function loadNews() {
      try {
        const response = await fetch('/api/news');
        const newsList = await response.json();

        const latestNewsContainer = document.getElementById('latestNewsContainer');
        latestNewsContainer.innerHTML = '';

        newsList.forEach(news => {
          const card = document.createElement('div');
          card.className = 'news-card';
          card.innerHTML = `
            <h3><a href="/news-detail.html?id=${news.id}">${news.title}</a></h3>
            <p>${new Date(news.date).toLocaleDateString()}</p>
          `;
          latestNewsContainer.appendChild(card);
        });
      } catch (err) {
        console.error('Error fetching news:', err);
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
=======
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

    async function loadNews() {
      try {
        const response = await fetch('/api/news');
        const newsList = await response.json();

        const latestNewsContainer = document.getElementById('latestNewsContainer');
        latestNewsContainer.innerHTML = '';

        newsList.forEach(news => {
          const card = document.createElement('div');
          card.className = 'news-card';
          card.innerHTML = `
            <h3><a href="/news-detail.html?id=${news.id}">${news.title}</a></h3>
            <p>${new Date(news.date).toLocaleDateString()}</p>
          `;
          latestNewsContainer.appendChild(card);
        });
      } catch (err) {
        console.error('Error fetching news:', err);
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
>>>>>>> 9e0808d5ab29d3f3927d381c9b10252dd6cf5e30
