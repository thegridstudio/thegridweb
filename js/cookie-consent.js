(function () {
  'use strict';

  var STORAGE_KEY = 'tgrid_consent';
  var CONSENT_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

  // -------------------------------------------------------------------------
  // Storage helpers
  // -------------------------------------------------------------------------

  function readStoredConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data.timestamp !== 'number') return null;
      if (Date.now() - data.timestamp > CONSENT_DURATION_MS) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(analytics) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        timestamp: Date.now(),
        analytics: analytics
      }));
    } catch (e) {}
  }

  // -------------------------------------------------------------------------
  // GA Consent Mode v2 update
  // -------------------------------------------------------------------------

  function applyConsent(prefs) {
    if (typeof gtag !== 'function') return;
    gtag('consent', 'update', {
      'analytics_storage': prefs.analytics ? 'granted' : 'denied',
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied'
    });
  }

  // -------------------------------------------------------------------------
  // Banner DOM
  // -------------------------------------------------------------------------

  var banner = null;
  var layer1 = null;
  var layer2 = null;
  var analyticsToggle = null;

  function buildBanner() {
    banner = document.createElement('div');
    banner.className = 'tgrid-consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie consent');

    banner.innerHTML = [
      '<div class="tgrid-consent-inner">',

        // Layer 1
        '<div class="tgrid-consent-layer tgrid-consent-layer-1" id="tgrid-layer-1">',
          '<div class="tgrid-consent-layer-1__text">',
            'We use cookies to analyse traffic and improve your experience. ',
            'See our <a href="cookie-policy.html">Cookie Policy</a> for details.',
          '</div>',
          '<div class="tgrid-consent-layer-1__actions">',
            '<button class="tgrid-consent-btn tgrid-consent-btn--accept" id="tgrid-accept-all">Accept all</button>',
            '<button class="tgrid-consent-btn tgrid-consent-btn--reject" id="tgrid-reject-all">Reject all</button>',
            '<button class="tgrid-consent-btn--text" id="tgrid-open-settings">Cookie settings</button>',
          '</div>',
        '</div>',

        // Layer 2
        '<div class="tgrid-consent-layer tgrid-consent-layer-2" id="tgrid-layer-2">',
          '<h3 class="tgrid-consent-layer-2__title">Cookie preferences</h3>',
          '<div class="tgrid-consent-categories">',

            '<div class="tgrid-consent-category">',
              '<div class="tgrid-consent-category__info">',
                '<span class="tgrid-consent-category__name">Necessary</span>',
                '<span class="tgrid-consent-category__desc">Required for the site to function. Cannot be disabled.</span>',
              '</div>',
              '<div class="tgrid-consent-toggle">',
                '<input type="checkbox" class="tgrid-consent-toggle-input" id="tgrid-toggle-necessary" disabled checked>',
                '<label class="tgrid-consent-toggle-label" for="tgrid-toggle-necessary">Necessary cookies</label>',
              '</div>',
            '</div>',

            '<div class="tgrid-consent-category">',
              '<div class="tgrid-consent-category__info">',
                '<span class="tgrid-consent-category__name">Analytics</span>',
                '<span class="tgrid-consent-category__desc">',
                  'Google Analytics 4 — helps us understand how visitors use the site. ',
                  'No personal data is stored. Rejecting keeps aggregate cookieless measurement active.',
                '</span>',
              '</div>',
              '<div class="tgrid-consent-toggle">',
                '<input type="checkbox" class="tgrid-consent-toggle-input" id="tgrid-toggle-analytics">',
                '<label class="tgrid-consent-toggle-label" for="tgrid-toggle-analytics">Analytics cookies</label>',
              '</div>',
            '</div>',

          '</div>',
          '<div class="tgrid-consent-layer-2__actions">',
            '<button class="tgrid-consent-btn tgrid-consent-btn--accept" id="tgrid-save-prefs">Save preferences</button>',
            '<button class="tgrid-consent-btn tgrid-consent-btn--reject" id="tgrid-reject-all-2">Reject all</button>',
            '<button class="tgrid-consent-btn--back" id="tgrid-back">&#8592; Back</button>',
          '</div>',
        '</div>',

      '</div>'
    ].join('');

    document.body.appendChild(banner);

    layer1 = document.getElementById('tgrid-layer-1');
    layer2 = document.getElementById('tgrid-layer-2');
    analyticsToggle = document.getElementById('tgrid-toggle-analytics');

    document.getElementById('tgrid-accept-all').addEventListener('click', onAcceptAll);
    document.getElementById('tgrid-reject-all').addEventListener('click', onRejectAll);
    document.getElementById('tgrid-open-settings').addEventListener('click', onOpenSettings);
    document.getElementById('tgrid-save-prefs').addEventListener('click', onSavePrefs);
    document.getElementById('tgrid-reject-all-2').addEventListener('click', onRejectAll);
    document.getElementById('tgrid-back').addEventListener('click', onBack);
  }

  // -------------------------------------------------------------------------
  // Layer switching
  // -------------------------------------------------------------------------

  function showLayer(num) {
    layer1.classList.toggle('tgrid-consent-layer--active', num === 1);
    layer2.classList.toggle('tgrid-consent-layer--active', num === 2);
  }

  // -------------------------------------------------------------------------
  // Show / hide banner
  // -------------------------------------------------------------------------

  function showBanner(startOnLayer) {
    if (!banner) buildBanner();
    showLayer(startOnLayer || 1);
    // Sync analytics toggle to current stored pref
    var stored = readStoredConsent();
    if (analyticsToggle) {
      analyticsToggle.checked = stored ? !!stored.analytics : false;
    }
    // Trigger slide-up on next frame
    requestAnimationFrame(function () {
      banner.classList.add('tgrid-consent-banner--visible');
    });
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove('tgrid-consent-banner--visible');
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  function onAcceptAll() {
    writeConsent(true);
    applyConsent({ analytics: true });
    hideBanner();
  }

  function onRejectAll() {
    writeConsent(false);
    applyConsent({ analytics: false });
    hideBanner();
  }

  function onOpenSettings() {
    showLayer(2);
  }

  function onSavePrefs() {
    var analytics = analyticsToggle ? analyticsToggle.checked : false;
    writeConsent(analytics);
    applyConsent({ analytics: analytics });
    hideBanner();
  }

  function onBack() {
    showLayer(1);
  }

  // -------------------------------------------------------------------------
  // Public API — used by the footer "Cookie settings" button
  // -------------------------------------------------------------------------

  window.openCookieSettings = function () {
    showBanner(2);
  };

  // -------------------------------------------------------------------------
  // Bootstrap on DOMContentLoaded
  // -------------------------------------------------------------------------

  function init() {
    var stored = readStoredConsent();
    if (stored) {
      applyConsent(stored);
    } else {
      showBanner(1);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
