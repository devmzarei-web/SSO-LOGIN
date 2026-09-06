// Default Fallback Data
const DEFAULT_AORC_CONFIG = {
  autoSlideDelay: 5000
};

const DEFAULT_AORC_NEWS = [
  {
    id: 1,
    tag: "طرح‌های توسعه و تولید",
    title: "بررسی روند تولید و طرح‌های توسعه‌ای پالایش نفت آبادان",
    desc: "معاون وزیر نفت و مدیرعامل شرکت ملی پالایش و پخش فرآورده‌های نفتی ایران در سفر به آبادان، ضمن برگزاری نشست با مدیران و بازدید از بخش‌های مختلف شرکت پالایش نفت آبادان، بر نقش راهبردی این پالایشگاه در تأمین پایدار سوخت کشور و تسریع در اجرای طرح‌های توسعه‌ای تأکید کرد.",
    image: "assets/img/2.jpg",
    link: "#"
  },
  {
    id: 2,
    tag: "خدمات رفاهی و اجتماعی",
    title: "داور پالایشگاه آبادان در جمع داوران کشتی امیدهای جهان",
    desc: "«میلاد قلاوند» داور درجه یک بین‌المللی و از کارکنان شرکت پالایش نفت آبادان، با موافقت فدراسیون کشتی جمهوری اسلامی ایران برای قضاوت در رقابت‌های کشتی قهرمانی امیدهای جهان ۲۰۲۶ انتخاب شد.",
    image: "assets/img/1.jpg",
    link: "#"
  },
  {
    id: 3,
    tag: "روابط عمومی",
    title: "تشریح ظرفیت‌ها و اقدامات پالایشگاه آبادان در برنامه زنده «مثلث»",
    desc: "به گزارش روابط عمومی شرکت پالایش نفت آبادان، فردین راشدی در برنامه زنده مثلث صدا و سیمای مرکز آبادان با اشاره به ظرفیت‌ها و اقدامات انجام‌شده در پالایشگاه آبادان، اظهار کرد: این مجموعه در کنار پیشبرد طرح‌های توسعه‌ای و افزایش ظرفیت تولید، در حوزه‌های مختلف از جمله تأمین سوخت، اشتغال نیروهای بومی، مسئولیت‌های اجتماعی و تأمین برق نیز نقش‌آفرینی کرده است.",
    image: "assets/img/3.jpg",
    link: "#"
  }
];

// Data Resolvers
function getResolvedNewsItems() {
  try {
    const local = localStorage.getItem('aorc_news_items');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[AORC Identity] localStorage read error:', e);
  }

  if (window.AORC_NEWS_ITEMS && Array.isArray(window.AORC_NEWS_ITEMS) && window.AORC_NEWS_ITEMS.length > 0) {
    return window.AORC_NEWS_ITEMS;
  }

  return DEFAULT_AORC_NEWS;
}

function getResolvedConfig() {
  try {
    const local = localStorage.getItem('aorc_slider_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed.autoSlideDelay === 'number') {
        return parsed;
      }
    }
  } catch (e) {}

  if (window.AORC_CONFIG && typeof window.AORC_CONFIG.autoSlideDelay === 'number') {
    return window.AORC_CONFIG;
  }

  return DEFAULT_AORC_CONFIG;
}

// Core Controller
function initAorcIdentity() {
  const NewsSlider = {
    currentIndex: 0,
    items: [],
    timer: null,
    delay: 5000,
    track: null,
    bulletsContainer: null,
    isHovered: false,

    init: function () {
      this.track = document.getElementById('aorcSliderTrack');
      this.bulletsContainer = document.getElementById('aorcSliderBullets');

      if (!this.track) return;

      this.reload();
      this.bindTouchSwipe();
      this.bindKeyboard();
      this.bindLiveSync();
    },

    reload: function () {
      const config = getResolvedConfig();
      this.delay = config.autoSlideDelay || 5000;
      this.items = getResolvedNewsItems();
      this.currentIndex = 0;
      this.render();
      this.startAuto();
    },

    bindLiveSync: function () {
      window.addEventListener('storage', (e) => {
        if (e.key === 'aorc_news_items' || e.key === 'aorc_slider_config') {
          this.reload();
        }
      });

      if (window.BroadcastChannel) {
        try {
          const channel = new BroadcastChannel('aorc_news_channel');
          channel.onmessage = (e) => {
            if (e.data && e.data.type === 'NEWS_UPDATED') {
              this.reload();
            }
          };
        } catch (e) {}
      }
    },

    render: function () {
      if (!this.track) return;
      if (!this.items || this.items.length === 0) {
        this.items = DEFAULT_AORC_NEWS;
      }

      this.track.innerHTML = this.items.map((item, idx) => `
        <article class="aorc-slide ${idx === this.currentIndex ? 'active' : ''}" data-index="${idx}">
          <div class="aorc-slide-card">
            <div class="aorc-slide-visual-box">
              <img src="${item.image || 'assets/img/2.jpg'}" alt="${item.title || ''}" class="aorc-slide-img" onerror="this.onerror=null; this.src='assets/img/2.jpg';">
            </div>
            <div class="aorc-slide-caption-card">
              <span class="aorc-slide-tag">${item.tag || 'اطلاعیه'}</span>
              <h2 class="aorc-slide-title">${item.title || ''}</h2>
              <p class="aorc-slide-desc">${item.desc || ''}</p>
            </div>
          </div>
        </article>
      `).join('');

      if (this.bulletsContainer) {
        this.bulletsContainer.innerHTML = this.items.map((_, idx) => `
          <span class="aorc-bullet ${idx === this.currentIndex ? 'active' : ''}" data-slide="${idx}"></span>
        `).join('');
      }
    },

    goTo: function (index) {
      if (!this.items || this.items.length === 0) return;
      this.currentIndex = (index + this.items.length) % this.items.length;

      const slides = this.track ? this.track.querySelectorAll('.aorc-slide') : [];
      slides.forEach((slide, i) => {
        if (i === this.currentIndex) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      const bullets = this.bulletsContainer ? this.bulletsContainer.querySelectorAll('.aorc-bullet') : [];
      bullets.forEach((bullet, i) => {
        if (i === this.currentIndex) {
          bullet.classList.add('active');
        } else {
          bullet.classList.remove('active');
        }
      });

      this.resetAuto();
    },

    next: function () {
      this.goTo(this.currentIndex + 1);
    },

    prev: function () {
      this.goTo(this.currentIndex - 1);
    },

    startAuto: function () {
      this.stopAuto();
      if (this.isHovered || !this.items || this.items.length <= 1) return;
      this.timer = setInterval(() => {
        this.next();
      }, this.delay);
    },

    stopAuto: function () {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    resetAuto: function () {
      this.stopAuto();
      this.startAuto();
    },

    bindTouchSwipe: function () {
      const track = this.track;
      if (!track) return;
      let startX = 0;
      let startY = 0;

      track.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        }
      }, { passive: true });

      track.addEventListener('touchend', (e) => {
        if (!startX || !e.changedTouches || e.changedTouches.length === 0) return;
        const diffX = e.changedTouches[0].clientX - startX;
        const diffY = e.changedTouches[0].clientY - startY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
          if (diffX > 0) {
            this.prev();
          } else {
            this.next();
          }
        }
        startX = 0;
        startY = 0;
      }, { passive: true });
    },

    bindKeyboard: function () {
      document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        if (e.key === 'ArrowLeft') {
          this.next();
        } else if (e.key === 'ArrowRight') {
          this.prev();
        }
      });
    }
  };

  NewsSlider.init();

  // Event Listeners
  document.addEventListener('click', function (e) {
    if (e.target.closest('#aorcNextSlideBtn')) {
      e.preventDefault();
      NewsSlider.next();
    } else if (e.target.closest('#aorcPrevSlideBtn')) {
      e.preventDefault();
      NewsSlider.prev();
    } else if (e.target.closest('.aorc-bullet')) {
      const bullet = e.target.closest('.aorc-bullet');
      if (bullet && bullet.dataset.slide !== undefined) {
        e.preventDefault();
        NewsSlider.goTo(parseInt(bullet.dataset.slide, 10));
      }
    }
  });

  const showcasePane = document.querySelector('.aorc-showcase-pane');
  if (showcasePane) {
    showcasePane.addEventListener('mouseenter', function () {
      NewsSlider.isHovered = true;
      NewsSlider.stopAuto();
    });
    showcasePane.addEventListener('mouseleave', function () {
      NewsSlider.isHovered = false;
      NewsSlider.startAuto();
    });
  }

  const pwdInput = document.getElementById('passwordInput');
  const pwdToggle = document.getElementById('passwordToggleBtn');
  const eyeOpen = document.getElementById('iconEyeOpen');
  const eyeClosed = document.getElementById('iconEyeClosed');

  if (pwdToggle && pwdInput) {
    pwdToggle.addEventListener('click', function (e) {
      e.preventDefault();
      const isPassword = pwdInput.getAttribute('type') === 'password';
      pwdInput.setAttribute('type', isPassword ? 'text' : 'password');
      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPassword ? 'none' : 'block';
        eyeClosed.style.display = isPassword ? 'block' : 'none';
      }
    });
  }

  const capsAlert = document.getElementById('capsLockAlert');
  if (capsAlert && pwdInput) {
    const checkCapsLock = (e) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        capsAlert.style.display = 'flex';
      } else {
        capsAlert.style.display = 'none';
      }
    };
    pwdInput.addEventListener('keyup', checkCapsLock);
    pwdInput.addEventListener('keydown', checkCapsLock);
    pwdInput.addEventListener('blur', () => {
      capsAlert.style.display = 'none';
    });
  }

  const loginForm = document.getElementById('aorcLoginForm');
  const submitBtn = document.getElementById('aorcSubmitBtn');
  if (loginForm && submitBtn) {
    loginForm.addEventListener('submit', function () {
      submitBtn.classList.add('loading');
      const btnText = submitBtn.querySelector('.aorc-btn-text');
      if (btnText) {
        btnText.textContent = 'در حال اعتبارسنجی...';
      }
    });
  }

  const logoutForm = document.getElementById('aorcLogoutForm');
  const logoutBtn = document.getElementById('aorcLogoutConfirmBtn');
  if (logoutForm && logoutBtn) {
    logoutForm.addEventListener('submit', function () {
      logoutBtn.classList.add('loading');
      const btnText = logoutBtn.querySelector('.aorc-btn-text');
      if (btnText) {
        btnText.textContent = 'در حال خروج...';
      }
    });
  }
}

// Initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAorcIdentity);
} else {
  initAorcIdentity();
}
