/* GSAP Initialization */
gsap.registerPlugin(ScrollTrigger);

/* Nav scroll (GSAP) */
ScrollTrigger.create({
  start: 40,
  toggleClass: { targets: '#main-nav', className: 'scrolled' }
});

/* Hero Entrance Timeline */
document.addEventListener('DOMContentLoaded', () => {
  const tl = gsap.timeline();
  tl
    .from('.hero-eyebrow',   { y: 24, autoAlpha: 0, duration: 0.7, ease: 'power3.out' })
    .from('.hero-headline',  { y: 32, autoAlpha: 0, duration: 0.9, ease: 'power3.out' }, '-=0.5')
    .from('.hero-sub',       { y: 20, autoAlpha: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
    .from('.hero-actions',   { y: 16, autoAlpha: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
    .from('.phone-frame',    { y: 48, autoAlpha: 0, duration: 1.1, ease: 'power2.out' }, '-=0.8')
    .from('.ticker-wrap',    { autoAlpha: 0, duration: 0.5 }, '-=0.3');
});

/* Feature Scroll Pinning (Screen Switching) */
const panels = document.querySelectorAll('.feature-panel');
const scenes = document.querySelectorAll('.phone-scene');

if (panels.length > 0 && scenes.length > 0) {
  // Hide all scenes initially except the first one
  gsap.set(scenes, { autoAlpha: 0 });
  gsap.set(scenes[0], { autoAlpha: 1 });

  function switchScene(index) {
    scenes.forEach((scene, i) => {
      gsap.to(scene, { autoAlpha: i === index ? 1 : 0, duration: 0.4, ease: 'power2.out' });
    });
  }

  panels.forEach((panel, i) => {
    ScrollTrigger.create({
      trigger: panel,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => switchScene(i),
      onEnterBack: () => switchScene(i)
    });
  });
}

/* Ticker */
const foods = ['Egusi soup','Jollof rice','Pounded yam','Suya','Moi moi','Banga soup','Ofada rice','Efo riro','Akara','Ogi / Pap','Ogbono soup','Abacha','Boli','Eba','Amala','Tuwo shinkafa','Zobo','Kunu','Chin chin','Kilishi'];
const ticker = document.getElementById('ticker');
if (ticker) {
  const items = [...foods, ...foods].map(f => `<span class="ticker-item">${f}</span>`).join('');
  ticker.innerHTML = items + items;
}

/* Food cloud */
const allFoods = ['Egusi soup','Jollof rice','Pounded yam','Suya','Moi moi','Banga soup','Ofada rice','Efo riro','Akara','Ogi','Ogbono','Abacha','Boli','Eba','Amala','Tuwo','Zobo','Kunu','Catfish pepper soup','Oha soup','Edikaikong','Afang soup','Buka stew','Fried plantain','Beans porridge','Yam porridge','Agidi','Ogi baba','Kilishi','Smoked titus','Nkwobi','Ofe onugbu','White soup','Okra soup','Groundnut soup','Vegetable soup','Ugu soup','Millet pap','Semo','Starch'];
const cloud = document.getElementById('food-cloud');
if (cloud) {
  allFoods.forEach((f, i) => {
    const el = document.createElement('span');
    el.className = 'food-tag';
    el.textContent = f;
    el.style.animationDelay = `${i * 0.08}s`;
    cloud.appendChild(el);
  });

  /* Light up food tags randomly */
  const tags = cloud.querySelectorAll('.food-tag');
  setInterval(() => {
    tags.forEach(t => t.classList.remove('lit'));
    const picks = Array.from(tags).sort(() => Math.random() - .5).slice(0, 5);
    picks.forEach(p => p.classList.add('lit'));
  }, 1800);
}

/* Scroll reveal (Using IntersectionObserver as fallback for simpler blocks) */
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });
reveals.forEach(r => observer.observe(r));

/* Count-up numbers with ScrollTrigger */
function countUpAll() {
  const targets = document.querySelectorAll('[data-target]');
  targets.forEach(t => {
    const val = parseInt(t.dataset.target);
    const suffix = t.dataset.suffix || '';
    let obj = { val: 0 };
    gsap.to(obj, {
      val: val,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        t.textContent = Math.ceil(obj.val).toLocaleString() + suffix;
      }
    });
  });
}

const statsEl = document.getElementById('stats');
if (statsEl) {
  ScrollTrigger.create({
    trigger: statsEl,
    start: 'top 75%',
    once: true,
    onEnter: () => countUpAll()
  });
}

/* Waitlist */
function handleWaitlist() {
  const input = document.getElementById('email-input');
  if (!input.value || !input.value.includes('@')) {
    input.style.borderColor = 'rgba(232,101,26,0.7)';
    input.placeholder = 'Enter a valid email';
    setTimeout(() => { input.style.borderColor = ''; input.placeholder = 'Enter your email'; }, 2000);
    return;
  }
  const btn = document.querySelector('.waitlist-btn');
  btn.textContent = 'You\'re on the list!';
  btn.style.background = '#3B6D11';
  input.value = '';
  input.placeholder = 'Welcome aboard.';
}
