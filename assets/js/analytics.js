((window, document) => {
  var ga4MeasurementId = "G-L7HMG2HS79";
  var clarityProjectId = "y3hx00mjoc";

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };

  window.gtag("js", new Date());
  window.gtag("config", ga4MeasurementId);

  var ga4Script = document.createElement("script");
  ga4Script.async = true;
  ga4Script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4MeasurementId)}`;
  document.head.appendChild(ga4Script);

  window.clarity =
    window.clarity ||
    function () {
      window.clarity.q = window.clarity.q || [];
      window.clarity.q.push(arguments);
    };

  var clarityScript = document.createElement("script");
  clarityScript.async = true;
  clarityScript.src = `https://www.clarity.ms/tag/${clarityProjectId}`;
  var firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode.insertBefore(clarityScript, firstScript);

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
    window.gtag("event", eventName, parameters);
  }

  document.addEventListener("click", (event) => {
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

    if (!(form instanceof window.HTMLFormElement)) {
      return;
    }

    trackEvent("contact_form_submit", {
      form_id: form.id || "formulario-sem-id",
      form_name: form.getAttribute("name") || "formulario-sem-nome",
      page_section: getPageSection(form),
    });
  });
})(window, document);
