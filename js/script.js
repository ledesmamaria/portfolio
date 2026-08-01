(function () {
  "use strict";

  /* La página debe arrancar siempre desde el Hero, aunque la URL lleve
     un #ancla (enlace compartido) o el navegador intente restaurar el
     scroll de una recarga anterior. */
  window.scrollTo(0, 0);

  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motionEnabled = !prefersReducedMotion && !isTouch;

  /* ============================================
     1. TEMA CLARO/OSCURO con transición circular
     ============================================ */

  const themeToggle = document.querySelector('.theme-toggle');
  const themeWipe = document.querySelector('.theme-wipe');

  function temaGuardado() {
    const guardado = localStorage.getItem('tema');
    if (guardado) return guardado;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }

  function aplicarTema(tema) {
    body.setAttribute('data-tema', tema);
    localStorage.setItem('tema', tema);
    themeToggle.setAttribute('aria-pressed', tema === 'oscuro');
    themeToggle.setAttribute('aria-label', tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }

  aplicarTema(temaGuardado());

  themeToggle.addEventListener('click', (e) => {
    const actual = body.getAttribute('data-tema');
    const nuevo = actual === 'oscuro' ? 'claro' : 'oscuro';

    if (motionEnabled) {
      const rect = themeToggle.getBoundingClientRect();
      const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
      themeWipe.style.setProperty('--x', x + '%');
      themeWipe.style.setProperty('--y', y + '%');
      themeWipe.classList.add('is-active');
      setTimeout(() => {
        aplicarTema(nuevo);
        setTimeout(() => themeWipe.classList.remove('is-active'), 400);
      }, 50);
    } else {
      aplicarTema(nuevo);
    }
  });

  /* ============================================
     2. CURSOR PERSONALIZADO: etiqueta contextual
     ============================================ */

  if (!motionEnabled) {
    body.classList.add('no-custom-cursor');
  } else {
    const tag = document.querySelector('.cursor-tag');
    let mouseX = 0, mouseY = 0;
    let tagX = 0, tagY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateTag() {
      tagX += (mouseX - tagX) * 0.2;
      tagY += (mouseY - tagY) * 0.2;
      tag.style.left = tagX + 'px';
      tag.style.top = tagY + 'px';
      requestAnimationFrame(animateTag);
    }
    animateTag();

    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        tag.textContent = el.getAttribute('data-cursor');
        tag.classList.add('is-visible');
      });
      el.addEventListener('mouseleave', () => {
        tag.classList.remove('is-visible');
      });
    });
  }

  /* ============================================
     3. BARRA DE PROGRESO DE SCROLL
     ============================================ */

  const progressFill = document.querySelector('.progress-bar__fill');

  function actualizarProgreso() {
    const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
    const avance = alturaTotal > 0 ? (window.scrollY / alturaTotal) * 100 : 0;
    progressFill.style.width = avance + '%';
  }
  window.addEventListener('scroll', actualizarProgreso, { passive: true });
  actualizarProgreso();

  /* ============================================
     4. BLOBS: reaccionan al ratón y al scroll
     ============================================ */

  if (motionEnabled) {
    const blobs = document.querySelectorAll('.blob');
    const hero = document.querySelector('.hero');

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;

      blobs.forEach((blob, i) => {
        const fuerza = 26 + i * 6;
        blob.style.transform = `translate(${relX * fuerza}px, ${relY * fuerza}px)`;
      });
    });

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      blobs.forEach((blob, i) => {
        const velocidad = 0.06 + i * 0.02;
        blob.style.marginTop = (scrollY * velocidad) + 'px';
      });
    }, { passive: true });
  }

  /* ============================================
     5. REVEAL ON SCROLL
     ============================================ */

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ============================================
     6. PROJECT CARDS: gif en hover
     ============================================ */

  document.querySelectorAll('.project-card__media').forEach((media) => {
    const gif = media.getAttribute('data-gif');
    if (gif) {
      // Las URLs relativas dentro de una custom property se resuelven contra
      // la hoja de estilos que la consume (css/style.css), no contra el HTML.
      // Por eso se resuelve a una URL absoluta antes de asignarla.
      const gifUrl = new URL(gif, document.baseURI).href;
      media.style.setProperty('--gif-url', `url('${gifUrl}')`);
    }
  });

  /* ============================================
     7. TILT 3D EN TARJETAS DE PROYECTO
     ============================================ */

  if (motionEnabled) {
    document.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${relX * 6}deg) rotateX(${relY * -6}deg) scale(1.01)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateY(0) rotateX(0) scale(1)';
      });
    });
  }

  /* ============================================
     8. BOTONES MAGNÉTICOS
     ============================================ */

  if (motionEnabled) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${relX * 0.25}px, ${relY * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

})();