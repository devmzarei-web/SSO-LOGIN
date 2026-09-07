// Default Fallback Data
const DEFAULT_AORC_CONFIG = {
  autoSlideDelay: 5000,
  apiUrl: "",
  newsLimit: 4,
  cacheMinutes: 15,
  transformApiData: function (rawItem, index) {
    if (!rawItem) return null;
    return {
      id: rawItem.id || rawItem.contentItemId || index + 1,
      tag: rawItem.category || rawItem.tag || rawItem.department || "اخبار شرکت",
      title: rawItem.title || rawItem.displayText || "",
      desc: rawItem.excerpt || rawItem.summary || rawItem.description || (rawItem.body ? rawItem.body.substring(0, 160) + "..." : ""),
      image: rawItem.imageUrl || rawItem.image || rawItem.mediaUrl || "assets/img/2.jpg",
      link: rawItem.url || rawItem.link || (rawItem.slug ? "https://abadan-ref.ir/" + rawItem.slug : "#")
    };
  }
};

const DEFAULT_AORC_NEWS = [
  {
    id: 1,
    tag: "طرح‌های توسعه و تولید",
    title: "بررسی روند تولید و طرح‌های توسعه‌ای پالایش نفت آبادان",
    desc: "معاون وزیر نفت و مدیرعامل شرکت ملی پالایش و پخش فرآورده‌های نفتی ایران در سفر به آبادان، ضمن برگزاری نشست با مدیران و بازدید از بخش‌های مختلف شرکت پالایش نفت آبادان، بر نقش راهبردی این پالایشگاه در تأمین پایدار سوخت کشور و تسریع در اجرای طرح‌های توسعه‌ای تأکید کرد.",
    image: "assets/img/2.jpg",
    link: "https://abadan-ref.ir"
  },
  {
    id: 2,
    tag: "خدمات رفاهی و اجتماعی",
    title: "داور پالایشگاه آبادان در جمع داوران کشتی امیدهای جهان",
    desc: "«میلاد قلاوند» داور درجه یک بین‌المللی و از کارکنان شرکت پالایش نفت آبادان، با موافقت فدراسیون کشتی جمهوری اسلامی ایران برای قضاوت در رقابت‌های کشتی قهرمانی امیدهای جهان ۲۰۲۶ انتخاب شد.",
    image: "assets/img/1.jpg",
    link: "https://abadan-ref.ir"
  },
  {
    id: 3,
    tag: "روابط عمومی",
    title: "تشریح ظرفیت‌ها و اقدامات پالایشگاه آبادان در برنامه زنده «مثلث»",
    desc: "به گزارش روابط عمومی شرکت پالایش نفت آبادان، فردین راشدی در برنامه زنده مثلث صدا و سیمای مرکز آبادان با اشاره به ظرفیت‌ها و اقدامات انجام‌شده در پالایشگاه آبادان، اظهار کرد: این مجموعه در کنار پیشبرد طرح‌های توسعه‌ای و افزایش ظرفیت تولید، در حوزه‌های مختلف نقش‌آفرینی کرده است.",
    image: "assets/img/3.jpg",
    link: "https://abadan-ref.ir"
  },
  {
    id: 4,
    tag: "مسئولیت‌های اجتماعی",
    title: "توسعه زیرساخت‌ها و خدمات‌رسانی پالایشگاه آبادان در منطقه",
    desc: "پالایشگاه نفت آبادان همگام با استمرار تولید پایدار فرآورده‌های نفتی، پروژه‌های عام‌المنفعه و مسئولیت‌های اجتماعی در منطقه آزاد اروند را با شتاب پیگیری می‌کند.",
    image: "assets/img/1.jpg",
    link: "https://abadan-ref.ir"
  }
];

// Data Resolvers
function getResolvedConfig() {
  try {
    const local = localStorage.getItem('aorc_slider_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed.autoSlideDelay === 'number') {
        return Object.assign({}, DEFAULT_AORC_CONFIG, window.AORC_CONFIG || {}, parsed);
      }
    }
  } catch (e) {}

  if (window.AORC_CONFIG) {
    return Object.assign({}, DEFAULT_AORC_CONFIG, window.AORC_CONFIG);
  }

  return DEFAULT_AORC_CONFIG;
}

function getLocalFallbackNews() {
  try {
    const local = localStorage.getItem('aorc_news_items');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  if (window.AORC_NEWS_ITEMS && Array.isArray(window.AORC_NEWS_ITEMS) && window.AORC_NEWS_ITEMS.length > 0) {
    return window.AORC_NEWS_ITEMS;
  }

  return DEFAULT_AORC_NEWS;
}

async function fetchLiveNewsFromApi(config) {
  const apiUrl = config.apiUrl ? config.apiUrl.trim() : "";
  if (!apiUrl) {
    return getLocalFallbackNews();
  }

  const cacheKey = 'aorc_api_news_cache';
  const cacheMinutes = config.cacheMinutes || 15;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if (parsedCache && parsedCache.timestamp && Array.isArray(parsedCache.data)) {
        if (Date.now() - parsedCache.timestamp < cacheMinutes * 60 * 1000) {
          return parsedCache.data;
        }
      }
    }
  } catch (e) {}

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    let rawList = [];

    if (Array.isArray(json)) {
      rawList = json;
    } else if (json && Array.isArray(json.data)) {
      rawList = json.data;
    } else if (json && Array.isArray(json.items)) {
      rawList = json.items;
    } else if (json && Array.isArray(json.contentItems)) {
      rawList = json.contentItems;
    }

    const transformer = typeof config.transformApiData === 'function'
      ? config.transformApiData
      : DEFAULT_AORC_CONFIG.transformApiData;

    const limit = config.newsLimit || 4;
    const mapped = rawList
      .map((item, idx) => transformer(item, idx))
      .filter(item => item && item.title)
      .slice(0, limit);

    if (mapped.length > 0) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: mapped
        }));
      } catch (e) {}
      return mapped;
    }
  } catch (err) {
    console.warn('[AORC News API] Fetch error or timeout, falling back to local news:', err);
  }

  return getLocalFallbackNews();
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
    showcasePane: null,
    isHovered: false,

    init: async function () {
      this.track = document.getElementById('aorcSliderTrack');
      this.bulletsContainer = document.getElementById('aorcSliderBullets');
      this.showcasePane = document.querySelector('.aorc-showcase-pane');

      if (!this.track) return;

      this.renderSkeleton();
      await this.reload();
      this.bindTouchSwipe();
      this.bindKeyboard();
      this.bindLiveSync();
    },

    renderSkeleton: function () {
      if (!this.track) return;
      this.track.innerHTML = `
        <div class="aorc-skeleton-slide">
          <div class="aorc-skeleton-visual"></div>
          <div class="aorc-skeleton-card">
            <div class="aorc-skeleton-line" style="width: 25%;"></div>
            <div class="aorc-skeleton-line" style="width: 85%;"></div>
            <div class="aorc-skeleton-line" style="width: 95%;"></div>
            <div class="aorc-skeleton-line" style="width: 70%;"></div>
          </div>
        </div>
      `;
    },

    reload: async function () {
      const config = getResolvedConfig();
      this.delay = config.autoSlideDelay || 5000;
      document.documentElement.style.setProperty('--aorc-slide-duration', `${this.delay}ms`);

      this.items = await fetchLiveNewsFromApi(config);
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
              ${item.link && item.link !== '#' ? `
                <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="aorc-slide-link">
                  <span>مشاهده خبر در تارنما</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(180deg);">
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                </a>
              ` : ''}
            </div>
          </div>
        </article>
      `).join('');

      if (this.bulletsContainer) {
        this.bulletsContainer.innerHTML = this.items.map((_, idx) => `
          <button type="button" class="aorc-bullet ${idx === this.currentIndex ? 'active' : ''}" data-slide="${idx}" aria-label="اسلاید ${idx + 1}">
            <span class="aorc-bullet-progress"></span>
          </button>
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
        const progress = bullet.querySelector('.aorc-bullet-progress');
        if (i === this.currentIndex) {
          bullet.classList.add('active');
          if (progress) {
            progress.style.animation = 'none';
            bullet.offsetHeight;
            progress.style.animation = '';
          }
        } else {
          bullet.classList.remove('active');
          if (progress) {
            progress.style.animation = 'none';
          }
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

  // Slide Event Listeners
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
      showcasePane.classList.add('is-paused');
      NewsSlider.stopAuto();
    });
    showcasePane.addEventListener('mouseleave', function () {
      NewsSlider.isHovered = false;
      showcasePane.classList.remove('is-paused');
      NewsSlider.startAuto();
    });
  }

  // Password Visibility Toggle
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

  // Caps Lock and Language Detection
  const capsAlert = document.getElementById('capsLockAlert');
  const langAlert = document.getElementById('keyboardLangAlert');
  const userInput = document.getElementById('userNameInput');
  const persianRegex = /[\u0600-\u06FF\uFB8A\u067E\u0686\u06AF]/;

  function monitorInputs(inputEl) {
    if (!inputEl) return;

    const checkState = (e) => {
      if (capsAlert && e.getModifierState && e.getModifierState('CapsLock')) {
        capsAlert.style.display = 'flex';
      } else if (capsAlert) {
        capsAlert.style.display = 'none';
      }

      if (langAlert) {
        const val = inputEl.value;
        if (persianRegex.test(val)) {
          langAlert.style.display = 'flex';
        } else {
          langAlert.style.display = 'none';
        }
      }
    };

    inputEl.addEventListener('keyup', checkState);
    inputEl.addEventListener('keydown', checkState);
    inputEl.addEventListener('input', checkState);
    inputEl.addEventListener('blur', () => {
      if (capsAlert) capsAlert.style.display = 'none';
    });
  }

  monitorInputs(pwdInput);
  monitorInputs(userInput);

  // Form Submissions
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

  // Theme Controller
  const themeToggleBtn = document.getElementById('aorcThemeToggle');
  function initTheme() {
    const savedTheme = localStorage.getItem('aorc_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.body.classList.add('aorc-dark');
      updateThemeToggleIcon(true);
    } else {
      document.body.classList.remove('aorc-dark');
      updateThemeToggleIcon(false);
    }
  }

  function updateThemeToggleIcon(isDark) {
    if (!themeToggleBtn) return;
    const sun = themeToggleBtn.querySelector('.icon-sun');
    const moon = themeToggleBtn.querySelector('.icon-moon');
    if (sun && moon) {
      sun.style.display = isDark ? 'block' : 'none';
      moon.style.display = isDark ? 'none' : 'block';
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const isDark = document.body.classList.toggle('aorc-dark');
      localStorage.setItem('aorc_theme', isDark ? 'dark' : 'light');
      updateThemeToggleIcon(isDark);
    });
  }
  initTheme();

  // IT Support Modal
  const supportModal = document.getElementById('aorcSupportModal');
  const supportLink = document.getElementById('forgotPasswordLink');
  const modalCloseBtn = document.getElementById('aorcModalCloseBtn');

  function openModal() {
    if (supportModal) {
      supportModal.classList.add('active');
    }
  }

  function closeModal() {
    if (supportModal) {
      supportModal.classList.remove('active');
    }
  }

  if (supportLink) {
    supportLink.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeModal();
    });
  }

  if (supportModal) {
    supportModal.addEventListener('click', function (e) {
      if (e.target === supportModal) {
        closeModal();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && supportModal.classList.contains('active')) {
        closeModal();
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
