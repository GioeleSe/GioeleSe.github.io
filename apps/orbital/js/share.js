// Quick Share & QR Code Helper for ORBITAL Concept Validation
(function() {
  function getShareUrl() {
    return window.location.href;
  }

  function getShareTitle() {
    return "ORBITAL | Ergonomic Vertical Mouse with Circular OLED - Concept Validation Study";
  }

  function getShareText() {
    return "Help validate this open hardware concept: an ergonomic vertical mouse with a circular touch OLED display. Share your feedback in the 2-min survey:";
  }

  function renderQR(targetEl) {
    if (!targetEl) return;
    targetEl.innerHTML = '';

    const url = getShareUrl();

    // If QRCode.js is loaded from CDN
    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(targetEl, {
          text: url,
          width: 140,
          height: 140,
          colorDark: "#181614",
          colorLight: "#faedcd",
          correctLevel: QRCode.CorrectLevel.M
        });
        return;
      } catch (e) {
        console.warn('QRCode initialization fallback:', e);
      }
    }

    // Fallback: render an img with API or clean badge
    const img = document.createElement('img');
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&color=18-16-14&bgcolor=fa-ed-cd&data=' + encodeURIComponent(url);
    img.alt = 'Scan QR Code';
    img.className = 'w-[140px] h-[140px] rounded-xl shadow-md mx-auto';
    img.onerror = function() {
      targetEl.innerHTML = '<div class="p-3 bg-surface border border-borderClr rounded-xl text-center text-xs text-textMuted">QR available online.<br><span class="text-accent text-[11px] break-all font-mono">' + url + '</span></div>';
    };
    targetEl.appendChild(img);
  }

  function setupShareButtons() {
    const url = getShareUrl();
    const title = getShareTitle();
    const text = getShareText();

    // WhatsApp
    const waBtns = document.querySelectorAll('[data-share="whatsapp"]');
    waBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text + ' ' + url);
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      });
    });

    // Telegram
    const tgBtns = document.querySelectorAll('[data-share="telegram"]');
    tgBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tgUrl = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title);
        window.open(tgUrl, '_blank', 'noopener,noreferrer');
      });
    });

    // X / Twitter
    const xBtns = document.querySelectorAll('[data-share="twitter"]');
    xBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tweetUrl = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title);
        window.open(tweetUrl, '_blank', 'noopener,noreferrer');
      });
    });

    // LinkedIn
    const liBtns = document.querySelectorAll('[data-share="linkedin"]');
    liBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const liUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
        window.open(liUrl, '_blank', 'noopener,noreferrer');
      });
    });

    // Copy Link Buttons
    const copyBtns = document.querySelectorAll('[data-share="copy"]');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(url);
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<span class="text-accent flex items-center justify-center gap-1.5 font-medium">✓ Link Copied!</span>';
          setTimeout(() => {
            btn.innerHTML = originalHTML;
          }, 2500);
        } catch (err) {
          window.prompt('Copy this study link:', url);
        }
      });
    });

    // Native Web Share API
    const nativeBtns = document.querySelectorAll('[data-share="native"]');
    nativeBtns.forEach(btn => {
      if (navigator.share) {
        btn.classList.remove('hidden');
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await navigator.share({
              title: title,
              text: text,
              url: url
            });
          } catch (err) {
            // User cancelled share
          }
        });
      } else {
        btn.classList.add('hidden');
      }
    });

    // Populate URL text placeholders
    document.querySelectorAll('[data-share-url]').forEach(el => {
      el.textContent = url;
    });
  }

  function init() {
    const qrContainers = document.querySelectorAll('[data-qr-target]');
    qrContainers.forEach(container => renderQR(container));
    setupShareButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ORBITAL_SHARE = {
    renderQR: renderQR,
    getShareUrl: getShareUrl
  };
})();
