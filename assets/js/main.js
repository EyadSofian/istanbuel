/* =============================================================================
   البكري أوفرسيز — برنامج إسطنبول السياحي
   كل المحتوى مصدره assets/js/content.js — الملف ده بيبني الصفحة بس.
   ============================================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------- helpers */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /** 35000 → "35,000" */
  const money = (v) => Number(v).toLocaleString('en-US');

  /** يمنع أي HTML غير مقصود لو اتغيّر المحتوى */
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  const icon = (id, cls) =>
    `<svg class="ico ${cls || ''}" aria-hidden="true"><use href="#i-${id}"></use></svg>`;

  const dot = () =>
    '<svg class="ico" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4"/></svg>';

  const waLink = (extra) => {
    const msg = trip.whatsappMessage + (extra ? ' — ' + extra : '');
    return 'https://wa.me/' + trip.whatsappNumber + '?text=' + encodeURIComponent(msg);
  };

  /** يتأكد إن الصورة موجودة فعلاً قبل ما يعرضها */
  const probeImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth > 0);
      img.onerror = () => resolve(false);
      img.src = src;
    });

  /* ------------------------------------------------- روابط واتساب والبيانات */
  function bindData() {
    $$('[data-wa]').forEach((a) => {
      a.href = waLink();
      a.target = '_blank';
      a.rel = 'noopener';
    });

    const values = {
      startingPrice: money(trip.startingPrice),
      discountPercent: String(trip.discountPercent),
      duration: trip.duration,
      dateRange: trip.dateRange,
      hotel: trip.hotel,
      phone: content.brand.phoneDisplay
    };
    $$('[data-bind]').forEach((el) => {
      const key = el.getAttribute('data-bind');
      if (key in values) el.textContent = values[key];
    });

    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------ شريط الثقة */
  function renderTrust() {
    const host = $('#trustList');
    if (!host) return;
    host.innerHTML = content.trust
      .map(
        (t) => `<li>
          <span class="trust__ico">${icon(t.icon)}</span>
          <span>${esc(t.text)}</span>
        </li>`
      )
      .join('');
  }

  /* --------------------------------------------------------------- الأسعار */
  function renderPrices() {
    const host = $('#priceCards');
    if (!host) return;

    host.innerHTML = content.roomTypes
      .map((room) => {
        const p = trip.prices[room.key];
        const save = p.before - p.after;
        return `<article class="price ${room.highlight ? 'price--top' : ''} reveal">
          ${room.highlight ? `<span class="price__flag">${esc(room.highlightLabel)}</span>` : ''}
          <div class="price__head">
            <div>
              <h3 class="price__title">${esc(room.title)}</h3>
              <p class="price__note">${esc(room.note)}</p>
            </div>
            <span class="price__code ltr">${esc(room.code)}</span>
          </div>
          <div class="price__body">
            <p class="price__old">
              <s class="num">${money(p.before)}</s>
              <span>جنيه</span>
              <span class="price__off">خصم ${trip.discountPercent}%</span>
            </p>
            <p class="price__new">
              <span class="num">${money(p.after)}</span>
              <span class="price__cur">جنيه</span>
            </p>
            <p class="price__save">توفّر <span class="num">${money(save)}</span> جنيه</p>
          </div>
        </article>`;
      })
      .join('');
  }

  /* --------------------------------------------------------- أسعار الأطفال */
  function renderKids() {
    const host = $('#kidsCards');
    if (!host) return;

    host.innerHTML = Object.keys(trip.childrenPrices)
      .map((key) => {
        const k = trip.childrenPrices[key];
        return `<article class="kid reveal">
          <div>
            <p class="kid__age">${esc(k.label)}</p>
            <p class="kid__hint">السعر بعد خصم ${trip.discountPercent}%</p>
          </div>
          <div class="kid__prices">
            <span class="kid__old"><s class="num">${money(k.before)}</s> جنيه</span>
            <span><span class="kid__new num">${money(k.after)}</span><span class="kid__cur">جنيه</span></span>
          </div>
        </article>`;
      })
      .join('');
  }

  /* ---------------------------------------------------------- معرض الفندق */
  function renderHotelGallery() {
    const host = $('#hotelGallery');
    if (!host) return;

    host.innerHTML = content.hotelGallery
      .map(
        (g, i) => `<div class="shot shot--empty" data-slot="${i}">
          ${icon('image')}
          <span class="shot__label">${esc(g.label)}</span>
          <span class="shot__hint">مكان مخصص للصورة</span>
        </div>`
      )
      .join('');

    host.addEventListener('click', (e) => {
      const shot = e.target.closest('.shot--live');
      if (!shot) return;
      const shown = content.hotelGallery.filter((g) => $(`[data-slot] img[src="${g.src}"]`, host));
      const src = $('img', shot).getAttribute('src');
      openLightbox(shown, shown.findIndex((g) => g.src === src));
    });

    content.hotelGallery.forEach(async (g, i) => {
      if (!g.src) return;
      if (!(await probeImage(g.src))) return;
      const slot = $(`[data-slot="${i}"]`, host);
      if (!slot) return;
      slot.className = 'shot shot--live';
      slot.innerHTML =
        `<img src="${esc(g.src)}" alt="${esc(g.label)} — ${esc(trip.hotel)}" loading="lazy" decoding="async">` +
        `<span class="shot__cap">${esc(g.label)}</span>`;
    });
  }

  /** شريط صور اليوم — بدون أسماء معالم، الصور توضيحية لأجواء اليوم */
  function renderDayShots(d, dayIndex) {
    if (!d.images || !d.images.length) return '';
    const shots = d.images
      .map(
        (src, k) => `<button type="button" class="day__shot" data-day="${dayIndex}" data-i="${k}"
            aria-label="تكبير صورة من ${esc(d.title)}">
            <img src="${esc(src)}" alt="${esc(d.title)}" loading="lazy" decoding="async">
          </button>`
      )
      .join('');
    return `<div class="day__shots">${shots}</div>`;
  }

  /* --------------------------------------------------------------- البرنامج */
  function renderItinerary() {
    const host = $('#days');
    if (!host) return;

    host.innerHTML = content.itinerary
      .map((d, i) => {
        const items = d.items
          .map((it) => {
            let text = it.text;
            let chip = '';
            if (it.optional) {
              text = text.replace(/\.$/, '');
              chip = '<span class="chip chip--opt">اختياري – برسوم إضافية</span>';
            } else if (it.included) {
              text = text.replace(/\.$/, '');
              chip = '<span class="chip chip--inc">مشمولة في سعر البرنامج</span>';
            }
            return `<li>${dot()}<span>${esc(text)}${chip}</span></li>`;
          })
          .join('');

        return `<li class="day reveal">
          <span class="day__dot num">${i + 1}</span>
          <details ${i === 0 ? 'open' : ''}>
            <summary>
              <span>
                <span class="day__num">${esc(d.day)}</span>
                <span class="day__title">${esc(d.title)}</span>
              </span>
              ${icon('chevron', 'day__chev')}
            </summary>
            <div class="day__body">
              ${renderDayShots(d, i)}
              <ul>${items}</ul>
            </div>
          </details>
        </li>`;
      })
      .join('');

    host.addEventListener('click', (e) => {
      const shot = e.target.closest('.day__shot');
      if (!shot) return;
      const day = content.itinerary[+shot.dataset.day];
      if (!day || !day.images) return;
      openLightbox(
        day.images.map((src) => ({ src: src, label: day.day + ' — ' + day.title })),
        +shot.dataset.i
      );
    });

    // فتح / غلق كل الأيام
    const btn = $('#toggleDays');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const all = $$('#days details');
      const open = all.every((d) => d.open);
      all.forEach((d) => { d.open = !open; });
      btn.textContent = open ? 'افتح كل الأيام' : 'اقفل كل الأيام';
    });
  }

  /* ------------------------------------------------------ يشمل / لا يشمل */
  function renderIncludes() {
    const yes = $('#includesList');
    const no = $('#excludesList');
    if (yes) {
      yes.innerHTML = content.includes
        .map((t) => `<li>${icon('check')}<span>${esc(t)}</span></li>`)
        .join('');
    }
    if (no) {
      no.innerHTML = content.excludes
        .map((t) => `<li>${icon('minus')}<span>${esc(t)}</span></li>`)
        .join('');
    }
  }

  /* --------------------------------------------------------- آراء العملاء */
  function renderReviews() {
    const host = $('#reviewsGrid');
    const section = document.getElementById('reviews');
    if (!host) return;

    // مفيش آراء متكتوبة لسه؟ القسم كله ما بيظهرش بدل ما نحط كلام مش حقيقي
    const empty = !content.reviews || !content.reviews.length;
    if (section) section.hidden = empty;
    // مفيش داعي لرابط في القائمة لقسم مخفي
    $$('a[href="#reviews"]').forEach((a) => { a.hidden = empty; });
    if (empty) return;

    host.innerHTML = content.reviews
      .map(
        (r) => `<article class="review reveal">
          ${icon('quote', 'review__q')}
          <p class="review__text">${esc(r.text)}</p>
          <footer class="review__by">
            <span class="review__name">${esc(r.name)}</span>
            ${r.trip ? `<span class="review__trip">${esc(r.trip)}</span>` : ''}
          </footer>
        </article>`
      )
      .join('');
  }

  /* ------------------------------------------------ الأوراق والتصاريح */
  function renderPapers() {
    const host = $('#papersList');
    if (!host) return;

    host.innerHTML = content.papers
      .map((card, i) => {
        const blocks = card.blocks
          .map(
            (b) => `<div class="paper__block">
              <h4 class="paper__heading">${esc(b.heading)}</h4>
              <ul>${b.items.map((it) => `<li>${dot()}<span>${esc(it)}</span></li>`).join('')}</ul>
            </div>`
          )
          .join('');

        return `<details class="paper reveal" ${i === 0 ? 'open' : ''}>
          <summary>
            <span class="paper__ico">${icon('doc')}</span>
            <span class="paper__title">${esc(card.title)}</span>
            ${icon('chevron', 'paper__chev')}
          </summary>
          <div class="paper__body">
            ${card.subtitle ? `<p class="paper__lede">${esc(card.subtitle)}</p>` : ''}
            ${blocks}
          </div>
        </details>`;
      })
      .join('');
  }

  /* ------------------------------------------------------- الأسئلة الشائعة */
  function renderFaq() {
    const host = $('#faqList');
    if (!host) return;
    host.innerHTML = content.faq
      .map(
        (f) => `<details class="reveal">
          <summary>${esc(f.q)}${icon('chevron', 'faq__chev')}</summary>
          <div class="faq__a"><span>${esc(f.a)}</span></div>
        </details>`
      )
      .join('');
  }

  /** يوزّع الخلفيات بالتبادل على الأقسام الظاهرة بس */
  function restripeSections() {
    let i = 0;
    $$('main > section.section').forEach((sec) => {
      if (sec.hidden) return;
      sec.classList.toggle('section--alt', i % 2 === 1);
      i += 1;
    });
  }

  /* ------------------------------------------------------------- الناف بار */
  function initNav() {
    const nav = $('#nav');
    const burger = $('#burger');
    const menu = $('#mobileMenu');

    const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (burger && menu) {
      const setOpen = (open) => {
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
        menu.hidden = !open;
      };
      burger.addEventListener('click', () =>
        setOpen(burger.getAttribute('aria-expanded') !== 'true')
      );
      menu.addEventListener('click', (e) => {
        if (e.target.closest('a')) setOpen(false);
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
      });
    }

    // تمييز القسم الحالي في القائمة
    const links = $$('.nav__links a[href^="#"]');
    const map = new Map();
    links.forEach((a) => {
      const sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) map.set(sec, a);
    });
    if (!map.size || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const link = map.get(en.target);
          if (!link) return;
          if (en.isIntersecting) {
            links.forEach((l) => l.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    map.forEach((_, sec) => io.observe(sec));
  }

  /* -------------------------------------------------------- خلفية الهيرو */
  function initHeroMedia() {
    const media = $('#heroMedia');
    if (!media) return;

    const photo = $('.hero__photo', media);
    if (photo) {
      if (photo.complete && photo.naturalWidth > 0) media.classList.add('has-photo');
      photo.addEventListener('load', () => media.classList.add('has-photo'));
      photo.addEventListener('error', () => photo.remove());
    }

    // فيديو اختياري: assets/img/hero/istanbul.mp4
    const src = 'assets/img/hero/istanbul.mp4';
    const v = document.createElement('video');
    v.className = 'hero__video';
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true');
    v.preload = 'metadata';
    v.addEventListener('loadeddata', () => {
      media.appendChild(v);
      media.classList.add('has-video');
      v.play().catch(() => {});
    });
    v.addEventListener('error', () => { /* لا يوجد فيديو — الصورة كافية */ });
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) v.src = src;
  }

  /* ----------------------------------------------------------- البوب أب */
  function initPromo() {
    const modal = $('#promo');
    if (!modal) return;
    const KEY = 'istanbul_promo_seen';

    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) { seen = false; }
    if (seen) return;

    let lastFocus = null;

    const close = () => {
      modal.hidden = true;
      document.body.style.overflow = '';
      try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* الوضع الخاص */ }
      if (lastFocus) lastFocus.focus();
    };

    const open = () => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      const first = $('.btn', modal);
      if (first) first.focus({ preventScroll: true });
    };

    setTimeout(open, 2000);

    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-promo]')) close();
    });
    // الضغط على زر واتساب يقفل البوب أب كمان
    $$('[data-cta="popup"]', modal).forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  }

  /* --------------------------------------------------------- اللايت بوكس */
  let lbItems = [];
  let lbIndex = 0;

  /** يخفي أسهم التنقل لو فيه صورة واحدة بس */
  function syncLbNav() {
    $$('.lightbox__nav').forEach((n) => {
      n.hidden = lbItems.length < 2;
    });
  }

  function openLightbox(items, index) {
    const box = $('#lightbox');
    if (!box || !items || !items.length) return;
    lbItems = items;
    lbIndex = Math.min(Math.max(index || 0, 0), items.length - 1);
    syncLbNav();
    showLightbox(lbItems[lbIndex].src, lbItems[lbIndex].label);
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    const x = $('.lightbox__x', box);
    if (x) x.focus({ preventScroll: true });
  }

  function showLightbox(src, caption) {
    const img = $('#lightboxImg');
    const cap = $('#lightboxCap');
    if (img) { img.src = src; img.alt = caption || ''; }
    if (cap) cap.textContent = caption || '';
  }

  function initLightbox() {
    const box = $('#lightbox');
    if (!box) return;

    const close = () => {
      box.hidden = true;
      document.body.style.overflow = '';
    };
    const step = (dir) => {
      if (lbItems.length < 2) return;
      lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
      showLightbox(lbItems[lbIndex].src, lbItems[lbIndex].label);
    };

    box.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-lb]')) return close();
      if (e.target.closest('[data-lb-prev]')) return step(-1);
      if (e.target.closest('[data-lb-next]')) return step(1);
      if (e.target === box) close();
    });

    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      // في الـRTL السهم الشمال بيروح للعنصر اللي بعده
      if (e.key === 'ArrowLeft') step(1);
      if (e.key === 'ArrowRight') step(-1);
    });
  }

  /* ---------------------------------------------------- ظهور عند التمرير */
  function initReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((en, i) => {
          if (!en.isIntersecting) return;
          setTimeout(() => en.target.classList.add('is-in'), Math.min(i * 55, 220));
          obs.unobserve(en.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------ بيانات منظمة لمحركات البحث */
  function injectSchema() {
    const price = trip.startingPrice;
    const data = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TouristTrip',
          name: trip.name,
          description:
            trip.duration + ' ' + trip.dateRange + ' مع إقامة في ' + trip.hotel +
            ' وبرنامج سياحي منظم داخل إسطنبول.',
          touristType: 'Leisure',
          itinerary: {
            '@type': 'ItemList',
            numberOfItems: content.itinerary.length,
            itemListElement: content.itinerary.map((d, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: d.day + ' – ' + d.title
            }))
          },
          provider: { '@type': 'TravelAgency', name: content.brand.name },
          offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: 'EGP',
            availability: 'https://schema.org/InStock',
            url: waLink()
          }
        },
        {
          '@type': 'FAQPage',
          mainEntity: content.faq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a }
          }))
        }
      ]
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    renderTrust();
    renderPrices();
    renderKids();
    renderHotelGallery();
    renderItinerary();
    renderIncludes();
    renderReviews();
    renderPapers();
    renderFaq();

    restripeSections();  // بعد ما نعرف الأقسام المخفية
    bindData();          // بعد الرندر علشان يشمل العناصر الجديدة
    initNav();
    initHeroMedia();
    initLightbox();
    initReveal();
    initPromo();
    injectSchema();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
