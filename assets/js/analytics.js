((window, document) => {
  var ga4MeasurementId = "G-L7HMG2HS79";
  var clarityProjectId = "y3hx00mjoc";
  var consentStorageKey = "rf_analytics_consent";
  var analyticsConfigured = false;
  var analyticsScheduled = false;
  var thirdPartyScriptsLoaded = false;
  var consentState = readStoredConsent();

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      // biome-ignore lint/complexity/noArguments: o carregador oficial do GA reproduz a fila com o objeto Arguments.
      window.dataLayer.push(arguments);
    };

  window.clarity =
    window.clarity ||
    function () {
      window.clarity.q = window.clarity.q || [];
      // biome-ignore lint/complexity/noArguments: o Clarity espera reproduzir exatamente os argumentos enfileirados.
      window.clarity.q.push(arguments);
    };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });

  function readStoredConsent() {
    try {
      const storedConsent = window.localStorage.getItem(consentStorageKey);
      return storedConsent === "accepted" || storedConsent === "rejected" ? storedConsent : null;
    } catch (_error) {
      return null;
    }
  }

  function persistConsent(value) {
    try {
      window.localStorage.setItem(consentStorageKey, value);
    } catch (_error) {
      // O consentimento continua válido durante a visita mesmo quando o navegador bloqueia o armazenamento.
    }
  }

  function configureGoogleAnalytics() {
    if (analyticsConfigured) return;
    analyticsConfigured = true;
    window.gtag("js", new Date());
    window.gtag("config", ga4MeasurementId);
  }

  function loadThirdPartyAnalytics() {
    analyticsScheduled = false;
    if (thirdPartyScriptsLoaded || consentState !== "accepted") return;
    thirdPartyScriptsLoaded = true;

    var ga4Script = document.createElement("script");
    ga4Script.async = true;
    ga4Script.fetchPriority = "low";
    ga4Script.dataset.rfAnalytics = "ga4";
    ga4Script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4MeasurementId)}`;
    document.head.appendChild(ga4Script);

    var clarityScript = document.createElement("script");
    clarityScript.async = true;
    clarityScript.fetchPriority = "low";
    clarityScript.dataset.rfAnalytics = "clarity";
    clarityScript.src = `https://www.clarity.ms/tag/${clarityProjectId}`;
    document.head.appendChild(clarityScript);
  }

  function scheduleThirdPartyAnalytics() {
    if (analyticsScheduled || consentState !== "accepted") return;
    analyticsScheduled = true;

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(loadThirdPartyAnalytics, { timeout: 1500 });
    } else {
      window.setTimeout(loadThirdPartyAnalytics, 350);
    }
  }

  function clearGoogleAnalyticsCookies() {
    document.cookie.split(";").forEach((cookie) => {
      var cookieName = cookie.split("=")[0].trim();

      if (!cookieName.startsWith("_ga") && cookieName !== "_gid") return;

      document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${window.location.hostname}; SameSite=Lax`;
      document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=.${window.location.hostname}; SameSite=Lax`;
    });
  }

  function applyConsent(value) {
    consentState = value;
    persistConsent(value);

    var analyticsStorage = value === "accepted" ? "granted" : "denied";
    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: analyticsStorage,
    });
    window.clarity("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: analyticsStorage,
    });

    if (value === "accepted") {
      configureGoogleAnalytics();
      scheduleThirdPartyAnalytics();
      return;
    }

    window.clarity("consent", false);
    clearGoogleAnalyticsCookies();
  }

  function createConsentBanner() {
    var banner = document.querySelector("[data-consent-banner]");
    if (banner) return banner;

    banner = document.createElement("section");
    banner.className = "consent-banner";
    banner.dataset.consentBanner = "";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "false");
    banner.setAttribute("aria-labelledby", "consent-title");
    banner.hidden = true;
    banner.innerHTML = `
      <div class="consent-banner__copy">
        <strong id="consent-title">Sua privacidade</strong>
        <p>Usamos Google Analytics e Microsoft Clarity para entender a navegação e melhorar o site. As medições só são ativadas com sua autorização. <a href="politica-de-privacidade.html">Saiba mais</a>.</p>
      </div>
      <div class="consent-banner__actions">
        <button type="button" class="consent-banner__button consent-banner__button--secondary" data-consent-choice="rejected">Recusar</button>
        <button type="button" class="consent-banner__button consent-banner__button--primary" data-consent-choice="accepted">Aceitar medição</button>
      </div>
    `;
    document.body.appendChild(banner);
    return banner;
  }

  function setBannerVisibility(visible) {
    var banner = createConsentBanner();
    banner.hidden = !visible;

    if (visible) {
      banner.querySelector("[data-consent-choice]")?.focus({ preventScroll: true });
    }
  }

  function initializeConsentInterface() {
    var banner = createConsentBanner();

    banner.addEventListener("click", (event) => {
      var choiceButton = event.target.closest("[data-consent-choice]");
      if (!choiceButton) return;

      applyConsent(choiceButton.dataset.consentChoice);
      setBannerVisibility(false);
    });

    document.addEventListener("click", (event) => {
      var settingsButton = event.target.closest("[data-consent-settings]");
      if (!settingsButton) return;

      event.preventDefault();
      setBannerVisibility(true);
    });

    if (consentState === null) {
      setBannerVisibility(true);
    }
  }

  if (consentState !== null) {
    applyConsent(consentState);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeConsentInterface, { once: true });
  } else {
    initializeConsentInterface();
  }

  function getActionLabel(element) {
    return (element.getAttribute("aria-label") || element.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100);
  }

  function getPageSection(element) {
    var container = element.closest("header, main > section, footer, [role='dialog']");

    if (!container) {
      return "page";
    }

    return container.id || container.classList[0] || container.tagName.toLowerCase();
  }

  function normalizeText(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function trackEvent(eventName, parameters) {
    if (consentState !== "accepted") return;
    window.gtag("event", eventName, parameters);
  }

  document.addEventListener("click", (event) => {
    if (event.rfQuoteOpened) return;
    var eventTarget = event.target;
    var clickable = eventTarget.closest ? eventTarget.closest("a, button") : null;

    if (!clickable) {
      return;
    }

    var href = clickable.getAttribute("href") || "";
    var actionLabel = getActionLabel(clickable);
    var normalizedLabel = normalizeText(actionLabel);
    var normalizedHref = normalizeText(href);
    var eventParameters = {
      cta_text: actionLabel || "sem texto",
      page_section: getPageSection(clickable),
    };
    var isWhatsApp = normalizedHref.includes("wa.me/") || normalizedHref.includes("api.whatsapp.com/");
    var isPackageAction = normalizedLabel.includes("pacote") || normalizedHref.includes("pacote");
    var isQuoteAction =
      normalizedLabel.includes("solicitar orcamento") ||
      normalizedLabel.includes("consultar data") ||
      normalizedLabel.includes("consultar minha data") ||
      normalizedLabel.includes("consultar disponibilidade") ||
      normalizedLabel.includes("consultar condicoes") ||
      normalizedLabel.includes("consultar valor") ||
      normalizedLabel.includes("falar com a equipe");

    if (isWhatsApp) {
      trackEvent("whatsapp_click", eventParameters);
    }

    if (normalizedHref.startsWith("tel:")) {
      trackEvent("phone_click", eventParameters);
    }

    if (isPackageAction) {
      trackEvent("package_inquiry_click", eventParameters);
    }

    if (normalizedLabel.includes("ver pacote")) {
      trackEvent("view_packages_click", eventParameters);
    }

    if (isQuoteAction) {
      trackEvent("quote_request_click", eventParameters);
    }

    if (normalizedHref.includes("instagram.com/")) {
      trackEvent("social_link_click", {
        ...eventParameters,
        social_network: "instagram",
      });
    } else if (normalizedHref.includes("facebook.com/")) {
      trackEvent("social_link_click", {
        ...eventParameters,
        social_network: "facebook",
      });
    }
  });

  document.addEventListener("submit", (event) => {
    var form = event.target;

    if (!(form instanceof window.HTMLFormElement) || form.id === "quote-form") {
      return;
    }

    trackEvent("contact_form_submit", {
      form_id: form.id || "formulario-sem-id",
      form_name: form.getAttribute("name") || "formulario-sem-nome",
      page_section: getPageSection(form),
    });
  });

  document.addEventListener("rf:quote", (event) => {
    const names = {
      open: "quote_form_open",
      start: "quote_form_start",
      close: "quote_form_close",
      continue: "whatsapp_click",
    };
    const eventName = names[event.detail?.stage];
    if (eventName) trackEvent(eventName, { page_section: "quote-dialog", contact_method: "whatsapp" });
  });
})(window, document);
