(function () {
  "use strict";

  var whatsappMessage = "Olá! Vim pelo site do Recanto Florença e gostaria de consultar uma data. Meu evento será no dia [DATA], para aproximadamente [NÚMERO] pessoas. O tipo de evento será [TIPO DE EVENTO].";
  var whatsappUrl = "https://wa.me/5514998134747?text=" + encodeURIComponent(whatsappMessage);
  document.querySelectorAll("[data-whatsapp]").forEach(function (link) {
    link.href = whatsappUrl;
  });

  var header = document.querySelector(".site-header");
  function updateHeader() {
    header.classList.toggle("site-header--scrolled", window.scrollY > 36);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  var menuToggle = document.querySelector(".menu-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");
  function setMenu(open) {
    menuToggle.classList.toggle("is-open", open);
    mobileMenu.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
  }
  menuToggle.addEventListener("click", function () {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });
  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });

  var revealObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach(function (element) {
    revealObserver.observe(element);
  });

  var experienceSteps = Array.from(document.querySelectorAll("[data-experience-step]"));
  var experienceImages = Array.from(document.querySelectorAll("[data-experience-image]"));
  var experienceAlts = [
    "Área interna ampla do Recanto Florença com balcão, mesas de apoio e acesso envidraçado",
    "Balcão com banquetas e área de preparo com churrasqueira no Recanto Florença",
    "Piscina do Recanto Florença ao lado do deck, cercada por palmeiras e área externa",
    "Corredor coberto com fechamento de vidro que conecta os ambientes do Recanto Florença"
  ];
  var experienceCounter = document.querySelector(".experience__counter span");
  function setExperience(index) {
    experienceSteps.forEach(function (step, position) {
      step.classList.toggle("is-active", position === index);
    });
    experienceImages.forEach(function (image, position) {
      image.classList.toggle("is-active", position === index);
      image.alt = position === index ? experienceAlts[position] : "";
    });
    experienceCounter.textContent = String(index + 1).padStart(2, "0");
  }
  var experienceObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        setExperience(Number(entry.target.getAttribute("data-experience-step")));
      }
    });
  }, { threshold: 0.55, rootMargin: "-15% 0px -20% 0px" });
  experienceSteps.forEach(function (step) { experienceObserver.observe(step); });

  var faqItems = Array.from(document.querySelectorAll(".faq-item"));
  faqItems.forEach(function (item) {
    var button = item.querySelector("button");
    var answer = item.querySelector(".faq-item__answer");
    button.addEventListener("click", function () {
      var shouldOpen = button.getAttribute("aria-expanded") !== "true";
      faqItems.forEach(function (otherItem) {
        var otherButton = otherItem.querySelector("button");
        var otherAnswer = otherItem.querySelector(".faq-item__answer");
        otherItem.classList.remove("is-open");
        otherButton.setAttribute("aria-expanded", "false");
        otherAnswer.hidden = true;
      });
      if (shouldOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        answer.hidden = false;
      }
    });
  });

  var gallery = [
    { id: "entrada-principal", alt: "Entrada principal do Recanto Florença emoldurada por palmeiras", caption: "Entrada principal", category: "Fachada" },
    { id: "salao-amplo-01", alt: "Salão amplo do Recanto Florença com balcão ao fundo e luz natural", caption: "Salão e área de convivência", category: "Salão" },
    { id: "salao-amplo-02", alt: "Área interna ampla do Recanto Florença com balcão e acesso envidraçado", caption: "Amplitude para celebrar", category: "Salão" },
    { id: "balcao-area-preparo", alt: "Balcão com banquetas e área de preparo com churrasqueira", caption: "Balcão e área de preparo", category: "Cozinha" },
    { id: "salao-blindex-circulacao", alt: "Corredor coberto com fechamento de vidro que conecta os ambientes", caption: "Conexão entre os ambientes", category: "Estrutura" },
    { id: "piscina-deck", alt: "Piscina do Recanto Florença ao lado do deck e cercada por palmeiras", caption: "Piscina e deck", category: "Lazer" },
    { id: "area-externa-deck", alt: "Área externa pavimentada com deck e acesso aos ambientes de apoio", caption: "Área externa", category: "Lazer" },
    { id: "jardim-interno", alt: "Jardim interno arborizado com palmeiras e caminho de circulação", caption: "Jardim interno", category: "Natureza" },
    { id: "passagem-ajardinada", alt: "Passagem lateral ajardinada ao lado do salão envidraçado", caption: "Passagem ajardinada", category: "Natureza" },
    { id: "fachada-acesso-externo", alt: "Vista externa do Recanto Florença com portão, calçada e palmeiras", caption: "Acesso externo", category: "Localização" },
    { id: "acesso-lateral-palmeiras", alt: "Acesso lateral com calçada e palmeiras ao longo do muro", caption: "Fácil acesso em Marília", category: "Localização" }
  ];
  var lightbox = document.querySelector(".lightbox");
  var lightboxImage = lightbox.querySelector("figure img");
  var lightboxCategory = lightbox.querySelector("figcaption span");
  var lightboxCaption = lightbox.querySelector("figcaption strong");
  var lightboxCounter = lightbox.querySelector("figcaption small");
  var lightboxClose = lightbox.querySelector(".lightbox__close");
  var selectedIndex = 0;
  var lastFocusedElement = null;

  function renderLightbox() {
    var item = gallery[selectedIndex];
    lightboxImage.src = "assets/images/recanto/" + item.id + "-1200.webp";
    lightboxImage.srcset = [
      "assets/images/recanto/" + item.id + "-768.webp 768w",
      "assets/images/recanto/" + item.id + "-1200.webp 1200w",
      "assets/images/recanto/" + item.id + "-1600.webp 1600w"
    ].join(", ");
    lightboxImage.sizes = "90vw";
    lightboxImage.alt = item.alt;
    lightboxCategory.textContent = item.category;
    lightboxCaption.textContent = item.caption;
    lightboxCounter.textContent = String(selectedIndex + 1).padStart(2, "0") + " / " + String(gallery.length).padStart(2, "0");
    lightbox.setAttribute("aria-label", "Galeria de fotos, imagem " + (selectedIndex + 1) + " de " + gallery.length);
  }
  function openLightbox(index, trigger) {
    selectedIndex = index;
    lastFocusedElement = trigger;
    renderLightbox();
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (lastFocusedElement) lastFocusedElement.focus();
  }
  function moveLightbox(direction) {
    selectedIndex = (selectedIndex + direction + gallery.length) % gallery.length;
    renderLightbox();
  }

  document.querySelectorAll("[data-gallery-index]").forEach(function (button) {
    button.addEventListener("click", function () {
      openLightbox(Number(button.getAttribute("data-gallery-index")), button);
    });
  });
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox__nav--prev").addEventListener("click", function () { moveLightbox(-1); });
  lightbox.querySelector(".lightbox__nav--next").addEventListener("click", function () { moveLightbox(1); });
  lightbox.addEventListener("mousedown", function (event) {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (!lightbox.hidden) closeLightbox();
      else setMenu(false);
    }
    if (!lightbox.hidden && event.key === "ArrowRight") moveLightbox(1);
    if (!lightbox.hidden && event.key === "ArrowLeft") moveLightbox(-1);
  });
})();
