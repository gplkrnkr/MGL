// Scripts for the public home page (home.html), served at / by nginx.
  // Nav scroll effect
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
 
  // Persona tabs
  function switchPersona(id, btn) {
    document.querySelectorAll('.persona-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.persona-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('persona-' + id).classList.add('active');
  }
 
  // Intersection observer for fade-up animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
 
  document.querySelectorAll('.trust-card, .step-card, .impact-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
 
  // Animate stats on scroll
  const statNums = document.querySelectorAll('.stat-num');
  const statsBar = document.querySelector('.stats-bar');
  let statsAnimated = false;
  const statsObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !statsAnimated) {
      statsAnimated = true;
      statsBar.style.opacity = '0';
      statsBar.style.animation = 'fadeUp 0.6s ease forwards';
    }
  }, { threshold: 0.3 });
  statsObserver.observe(statsBar);

  // Wired here rather than with onclick attributes, which the site's Content-Security-Policy blocks.
  document.querySelectorAll('.persona-tab[data-persona]').forEach(btn => {
    btn.addEventListener('click', () => switchPersona(btn.dataset.persona, btn));
  });
  document.querySelectorAll('[data-href]').forEach(el => {
    el.addEventListener('click', () => { window.location.href = el.dataset.href; });
  });
