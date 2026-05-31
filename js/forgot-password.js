document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     THEME TOGGLE FUNCTIONALITY
  ========================== */

  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  const html = document.documentElement;
  const themeIcon = themeToggle.querySelector('i');
  if (!themeIcon) return;

  // Detect system theme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Use saved theme or system theme
  const savedTheme = localStorage.getItem('theme');
  const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  html.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  // Theme toggle click
  let rotateTimeout = null;
  themeToggle.addEventListener('click', () => {
    if (rotateTimeout) {
      clearTimeout(rotateTimeout);
      rotateTimeout = null;
      themeIcon.classList.remove('rotate-icon');
      html.classList.remove('theme-transition');
    }
    html.classList.add('theme-transition');

    const activeTheme = html.getAttribute('data-theme');
    const newTheme = activeTheme === 'light' ? 'dark' : 'light';

    html.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch (err) {
      console.warn('[themeToggle] Could not persist theme:', err);
    }
    updateThemeIcon(newTheme);

    themeIcon.classList.add('rotate-icon');

    rotateTimeout = setTimeout(() => {
      html.classList.remove('theme-transition');
      themeIcon.classList.remove('rotate-icon');
      rotateTimeout = null;
    }, 600);
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      html.setAttribute('data-theme', newTheme);
      updateThemeIcon(newTheme);
    }
  });
  function updateThemeIcon(theme) {
    if (!themeIcon) return;
    if (theme === 'dark') {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    } else {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
    themeToggle.setAttribute('aria-pressed', theme === 'dark');
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }

  /* =========================
     FORGOT PASSWORD HANDLER
  ========================== */

  function handleForgotPassword(event) {
    event.preventDefault();

    const emailInput = document.getElementById('resetEmail');
    const email = emailInput.value.trim();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert(t('forgotPassword.invalidEmail', 'Please enter a valid email address'));
      emailInput.focus();
      return;
    }

    // Show success message
    sendResetEmail(email).then(success => {
      if (success) {
        document.getElementById('emailForm').classList.remove('active');
        document.getElementById('successMessage').classList.add('active');
        document.getElementById('sentEmail').textContent = email;

        setupResendButton(email); // email passed directly, no localStorage
        }
    });
  }

  /* =========================
     RESEND EMAIL
  ========================== */

  async function sendResetEmail(email) {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Request failed');
      return true;
    } catch (err) {
      console.error('Failed to send reset email:', err);
      alert(t('forgotPassword.requestFailed', 'Something went wrong. Please try again.'));
      return false;
    }
  }
  
  function setupResendButton(email) {
  const btn = document.getElementById('resendBtn');
  if (!btn) return;

  const fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);

  fresh.addEventListener('click', async () => {
    fresh.disabled = true;

    const success = await sendResetEmail(email);
    if (success) {
      let seconds = 30;
      fresh.textContent = `Resend in ${seconds}s`;

      const interval = setInterval(() => {
        seconds--;
        fresh.textContent = `Resend in ${seconds}s`;

        if (seconds <= 0) {
          clearInterval(interval);
          fresh.disabled = false;
          fresh.textContent = 'Resend email';
        }
      }, 1000);
    } else {
      fresh.disabled = false;
    }
  });
}

  /* =========================
     SWITCH BACK TO FORM
  ========================== */

  function switchToEmailForm() {
    document.getElementById('successMessage').classList.remove('active');
    document.getElementById('emailForm').classList.add('active');
  }

  // Auto focus email input
  document.getElementById('resetEmail')?.focus();

  // Expose functions globally
  window.handleForgotPassword = handleForgotPassword;
  window.switchToEmailForm = switchToEmailForm;
});
