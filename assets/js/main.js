import { prefersReducedMotion, waitForTransition, wrapIndex } from "./motion-utils.js";

(() => {
  var whatsappMessage =
    "Olá! Vim pelo site do Recanto Florença e gostaria de consultar uma data. Meu evento será no dia [DATA], para aproximadamente [NÚMERO] pessoas. O tipo de evento será [TIPO DE EVENTO].";
  var whatsappUrl = `https://wa.me/5514998134747?text=${encodeURIComponent(whatsappMessage)}`;
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    link.href = whatsappUrl;
  });

  var header = document.querySelector(".site-header");
  function updateHeader() {
    header.classList.toggle("site-header--scrolled", window.scrollY > 36);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  var floatingWhatsapp = document.querySelector(".floating-whatsapp");
  var gallerySection = document.querySelector("#galeria");
  if (floatingWhatsapp && gallerySection && "IntersectionObserver" in window) {
    const galleryVisibilityObserver = new IntersectionObserver(
      (entries) => {
        var shouldSuppress = entries.some((entry) => entry.isIntersecting);
        floatingWhatsapp.classList.toggle("is-suppressed", shouldSuppress);
        if (shouldSuppress) {
          floatingWhatsapp.setAttribute("aria-hidden", "true");
          floatingWhatsapp.setAttribute("tabindex", "-1");
        } else {
          floatingWhatsapp.removeAttribute("aria-hidden");
          floatingWhatsapp.removeAttribute("tabindex");
        }
      },
      { threshold: 0.01 },
    );
    galleryVisibilityObserver.observe(gallerySection);
  }

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
  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });
  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setMenu(false);
    });
  });

  var motionPreviewEnabled =
    ["127.0.0.1", "localhost"].includes(window.location.hostname) &&
    new URLSearchParams(window.location.search).get("preview") === "gallery";
  document.documentElement.classList.toggle("motion-preview", motionPreviewEnabled);

  var reducedMotion = prefersReducedMotion() && !motionPreviewEnabled;
  var revealElements = document.querySelectorAll(".reveal[data-motion='reveal']");
  var revealObserver;
  if ("IntersectionObserver" in window && !reducedMotion) {
    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }

  var galleryCards = Array.from(document.querySelectorAll('[data-motion="gallery-card"]'));
  var galleryDeck = document.querySelector("[data-gallery-deck]");
  var galleryDeckSteps = document.querySelector("[data-gallery-deck-steps]");
  var galleryDeckCurrent = document.querySelector("[data-gallery-deck-current]");
  var galleryDeckMedia = window.matchMedia("(max-width: 960px)");
  var galleryStepObserver;
  var galleryViewportState = { inView: false, index: 0 };

  function setGalleryDeckCard(activeIndex) {
    galleryCards.forEach((card, index) => {
      var depth = activeIndex - index;
      var isVisible = depth >= 0;
      var isActive = depth === 0;
      var visibleDepth = Math.min(Math.max(depth, 0), 5);
      var direction = index % 2 === 0 ? -1 : 1;

      card.classList.toggle("is-gallery-visible", isVisible);
      card.classList.toggle("is-gallery-active", isActive);
      card.style.setProperty("--gallery-card-order", String(index + 1));
      card.style.setProperty("--gallery-stack-x", `${direction * visibleDepth * 7}px`);
      card.style.setProperty("--gallery-stack-y", `${visibleDepth * -11}px`);
      card.style.setProperty("--gallery-stack-rotate", `${direction * Math.min(visibleDepth, 3) * 1.05}deg`);
      card.style.setProperty("--gallery-stack-scale", String(1 - visibleDepth * 0.024));
      card.style.setProperty(
        "--gallery-stack-opacity",
        String(depth > 5 ? 0 : Math.max(0.34, 1 - visibleDepth * 0.11)),
      );

      var button = card.querySelector("button");
      card.setAttribute("aria-hidden", isActive ? "false" : "true");
      if (button) button.setAttribute("tabindex", isActive ? "0" : "-1");
    });
    if (galleryDeckCurrent) {
      galleryDeckCurrent.textContent = String(activeIndex + 1).padStart(2, "0");
    }
  }

  function syncGalleryDeckWithViewport() {
    if (!galleryDeckSteps) return;
    var steps = Array.from(galleryDeckSteps.children);
    if (steps.length === 0) return;
    var viewportAnchor = window.innerHeight * 0.52;
    var closestIndex = steps.reduce((bestIndex, step, index) => {
      var rect = step.getBoundingClientRect();
      var distance = Math.abs(rect.top + rect.height / 2 - viewportAnchor);
      var bestRect = steps[bestIndex].getBoundingClientRect();
      var bestDistance = Math.abs(bestRect.top + bestRect.height / 2 - viewportAnchor);
      return distance < bestDistance ? index : bestIndex;
    }, 0);
    setGalleryDeckCard(closestIndex);
  }

  function disableGalleryDeck() {
    if (galleryStepObserver) {
      galleryStepObserver.disconnect();
      galleryStepObserver = undefined;
    }
    if (galleryDeck) galleryDeck.classList.remove("gallery-deck--ready");
    if (galleryDeckSteps) galleryDeckSteps.replaceChildren();

    galleryCards.forEach((card) => {
      card.classList.add("is-gallery-visible");
      card.classList.add("is-gallery-active");
      card.removeAttribute("aria-hidden");
      var button = card.querySelector("button");
      if (button) button.removeAttribute("tabindex");
    });
  }

  function enableGalleryDeck() {
    if (!galleryDeck || !galleryDeckSteps || galleryCards.length === 0) return;
    galleryDeckSteps.replaceChildren();
    galleryCards.forEach((card, index) => {
      card.style.setProperty("--gallery-enter-x", index % 2 === 0 ? "-42vw" : "42vw");
      card.style.setProperty("--gallery-enter-rotate", index % 2 === 0 ? "-5deg" : "5deg");
      var step = document.createElement("span");
      step.className = "gallery-deck__step";
      step.dataset.galleryDeckStep = String(index);
      galleryDeckSteps.appendChild(step);
    });
    galleryDeck.classList.add("gallery-deck--ready");
    setGalleryDeckCard(0);

    galleryStepObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) syncGalleryDeckWithViewport();
      },
      { threshold: [0, 0.2, 0.5], rootMargin: "-18% 0px -18% 0px" },
    );
    Array.from(galleryDeckSteps.children).forEach((step) => {
      galleryStepObserver.observe(step);
    });
    window.requestAnimationFrame(syncGalleryDeckWithViewport);
  }

  function syncGalleryDeckMode() {
    var canUseDeck = galleryDeckMedia.matches && "IntersectionObserver" in window && !reducedMotion;
    if (canUseDeck) enableGalleryDeck();
    else disableGalleryDeck();
  }

  function rememberGalleryViewportState() {
    if (!galleryDeck || galleryCards.length === 0) return;
    var gallerySection = galleryDeck.closest("#galeria");
    if (!gallerySection) return;
    var sectionRect = gallerySection.getBoundingClientRect();
    galleryViewportState.inView = sectionRect.bottom > 0 && sectionRect.top < window.innerHeight;
    if (!galleryViewportState.inView) return;

    var activeCard = galleryCards.findIndex((card) => card.classList.contains("is-gallery-active"));
    if (galleryDeck.classList.contains("gallery-deck--ready") && activeCard >= 0) {
      galleryViewportState.index = activeCard;
      return;
    }

    var viewportAnchor = window.innerHeight * 0.52;
    galleryViewportState.index = galleryCards.reduce((bestIndex, card, index) => {
      var rect = card.getBoundingClientRect();
      var distance = Math.abs(rect.top + rect.height / 2 - viewportAnchor);
      var bestRect = galleryCards[bestIndex].getBoundingClientRect();
      var bestDistance = Math.abs(bestRect.top + bestRect.height / 2 - viewportAnchor);
      return distance < bestDistance ? index : bestIndex;
    }, 0);
  }

  function handleGalleryDeckMediaChange() {
    var shouldRestoreFocus = galleryViewportState.inView;
    var focusedIndex = galleryViewportState.index;
    syncGalleryDeckMode();
    if (!shouldRestoreFocus) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        var target = galleryDeckMedia.matches
          ? galleryDeckSteps?.children[focusedIndex]
          : galleryCards[focusedIndex];
        if (!target) return;
        var targetRect = target.getBoundingClientRect();
        var targetAnchor = window.innerHeight * (galleryDeckMedia.matches ? 0.52 : 0.5);
        window.scrollTo({
          top: window.scrollY + targetRect.top + targetRect.height / 2 - targetAnchor,
          behavior: "instant",
        });
        if (galleryDeckMedia.matches) setGalleryDeckCard(focusedIndex);
        rememberGalleryViewportState();
      });
    });
  }

  syncGalleryDeckMode();
  window.requestAnimationFrame(rememberGalleryViewportState);
  window.addEventListener("scroll", rememberGalleryViewportState, { passive: true });
  galleryDeckMedia.addEventListener("change", handleGalleryDeckMediaChange);

  document.querySelectorAll("img[loading='lazy']").forEach((image) => {
    if (image.matches("[data-experience-image], .events__background img, .final-cta__image img")) return;
    if (image.complete) return;
    image.classList.add("is-media-loading");
    image.addEventListener(
      "load",
      () => {
        image.classList.remove("is-media-loading");
        image.classList.add("is-media-loaded");
        window.setTimeout(() => {
          image.classList.remove("is-media-loaded");
        }, 280);
      },
      { once: true },
    );
  });

  var experienceSteps = Array.from(document.querySelectorAll("[data-experience-step]"));
  var experienceImages = Array.from(document.querySelectorAll("[data-experience-image]"));
  var experienceSection = document.querySelector(".experience");
  var experienceLive = document.querySelector("[data-experience-live]");
  var experienceLivePanels = [];
  var mobileExperienceMedia = window.matchMedia("(max-width: 960px)");
  var experienceObserver;
  var experienceAlts = [
    "Área interna ampla do Recanto Florença com balcão, mesas de apoio e acesso envidraçado",
    "Balcão com banquetas e área de preparo com churrasqueira no Recanto Florença",
    "Piscina do Recanto Florença ao lado do deck, cercada por palmeiras e área externa",
    "Corredor coberto com fechamento de vidro que conecta os ambientes do Recanto Florença",
    "Dormitório climatizado do Recanto Florença com beliches de madeira e colchões azuis",
  ];
  var experienceCounter = document.querySelector(".experience__counter span");
  if (experienceSection && experienceLive && experienceSteps.length > 0) {
    experienceSteps.forEach((step, index) => {
      var panel = document.createElement("div");
      panel.className = `experience__mobile-panel${index === 0 ? " is-active" : ""}`;
      panel.dataset.experiencePanel = String(index);
      panel.setAttribute("aria-hidden", index === 0 ? "false" : "true");

      Array.from(step.children).forEach((child) => {
        if (!child.classList.contains("experience-step__mobile-image")) {
          panel.appendChild(child.cloneNode(true));
        }
      });

      panel.querySelectorAll("a").forEach((link) => {
        link.setAttribute("tabindex", "-1");
      });
      experienceLive.appendChild(panel);
      experienceLivePanels.push(panel);
    });
    experienceSection.classList.add("experience--synced-mobile");
  }

  function syncExperienceAccessibility() {
    var isMobile = mobileExperienceMedia.matches;
    experienceSteps.forEach((step) => {
      if (isMobile) step.setAttribute("aria-hidden", "true");
      else step.removeAttribute("aria-hidden");
      step.querySelectorAll("a").forEach((link) => {
        if (isMobile) link.setAttribute("tabindex", "-1");
        else link.removeAttribute("tabindex");
      });
    });
    if (experienceLive) experienceLive.setAttribute("aria-hidden", isMobile ? "false" : "true");
  }

  function setExperience(index) {
    experienceSteps.forEach((step, position) => {
      step.classList.toggle("is-active", position === index);
      if (position === index) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
    experienceImages.forEach((image, position) => {
      image.classList.toggle("is-active", position === index);
      image.alt = position === index ? experienceAlts[position] : "";
    });
    experienceLivePanels.forEach((panel, position) => {
      var isActive = position === index;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
      panel.querySelectorAll("a").forEach((link) => {
        link.setAttribute("tabindex", isActive && mobileExperienceMedia.matches ? "0" : "-1");
      });
    });
    if (experienceCounter) experienceCounter.textContent = String(index + 1).padStart(2, "0");
  }
  function syncExperienceWithViewport() {
    if (experienceSteps.length === 0) return;
    var viewportAnchor = window.innerHeight * 0.46;
    var closestIndex = experienceSteps.reduce((bestIndex, step, index) => {
      var rect = step.getBoundingClientRect();
      var distance = Math.abs(rect.top + rect.height / 2 - viewportAnchor);
      var bestRect = experienceSteps[bestIndex].getBoundingClientRect();
      var bestDistance = Math.abs(bestRect.top + bestRect.height / 2 - viewportAnchor);
      return distance < bestDistance ? index : bestIndex;
    }, 0);
    setExperience(closestIndex);
  }
  if ("IntersectionObserver" in window) {
    experienceObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) syncExperienceWithViewport();
      },
      { threshold: [0, 0.2, 0.4], rootMargin: "-20% 0px -20% 0px" },
    );
    experienceSteps.forEach((step) => {
      experienceObserver.observe(step);
    });
    syncExperienceAccessibility();
    mobileExperienceMedia.addEventListener("change", syncExperienceAccessibility);
    window.requestAnimationFrame(syncExperienceWithViewport);
  }

  var faqItems = Array.from(document.querySelectorAll(".faq-item"));
  var faqTransitionId = 0;

  function captureFaqPositions() {
    var positions = new Map();
    faqItems.forEach((item) => {
      positions.set(item, item.getBoundingClientRect().top);
    });
    return positions;
  }

  function animateFaqLayout(previousPositions) {
    if (reducedMotion) return;
    faqItems.forEach((item) => {
      var delta = previousPositions.get(item) - item.getBoundingClientRect().top;
      if (Math.abs(delta) < 1) return;
      item.getAnimations().forEach((animation) => {
        if (animation.id === "faq-layout") animation.cancel();
      });
      var animation = item.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
        { duration: 180, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
      );
      animation.id = "faq-layout";
    });
  }

  async function setFaq(targetItem, shouldOpen) {
    var transitionId = ++faqTransitionId;
    var openItem = faqItems.find((item) => item.classList.contains("is-open"));

    if (!reducedMotion && openItem) {
      openItem.querySelector(".faq-item__answer").classList.remove("is-visible");
      await waitForTransition(openItem.querySelector(".faq-item__answer"), 130);
      if (transitionId !== faqTransitionId) return;
    }

    var previousPositions = captureFaqPositions();
    faqItems.forEach((item) => {
      var button = item.querySelector("button");
      var answer = item.querySelector(".faq-item__answer");
      item.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      answer.classList.remove("is-visible");
      answer.hidden = true;
    });

    if (shouldOpen) {
      const targetButton = targetItem.querySelector("button");
      const targetAnswer = targetItem.querySelector(".faq-item__answer");
      targetItem.classList.add("is-open");
      targetButton.setAttribute("aria-expanded", "true");
      targetAnswer.hidden = false;
      window.requestAnimationFrame(() => {
        targetAnswer.classList.add("is-visible");
      });
    }

    animateFaqLayout(previousPositions);
  }

  faqItems.forEach((item) => {
    var button = item.querySelector("button");
    button.addEventListener("click", () => {
      setFaq(item, button.getAttribute("aria-expanded") !== "true");
    });
  });

  var gallery = [
    {
      id: "entrada-principal",
      alt: "Entrada principal do Recanto Florença emoldurada por palmeiras",
      caption: "Entrada principal",
      category: "Fachada",
    },
    {
      id: "salao-amplo-01",
      alt: "Salão amplo do Recanto Florença com balcão ao fundo e luz natural",
      caption: "Salão e área de convivência",
      category: "Salão",
    },
    {
      id: "salao-amplo-02",
      alt: "Área interna ampla do Recanto Florença com balcão e acesso envidraçado",
      caption: "Amplitude para celebrar",
      category: "Salão",
    },
    {
      id: "balcao-area-preparo",
      alt: "Balcão com banquetas e área de preparo com churrasqueira",
      caption: "Balcão e área de preparo",
      category: "Cozinha",
    },
    {
      id: "salao-blindex-circulacao",
      alt: "Corredor coberto com fechamento de vidro que conecta os ambientes",
      caption: "Conexão entre os ambientes",
      category: "Estrutura",
    },
    {
      id: "quarto-beliches-01",
      alt: "Primeiro dormitório do Recanto Florença com beliches de madeira e colchões azuis",
      caption: "Primeiro dormitório",
      category: "Acomodações",
      widths: [480, 768, 960],
    },
    {
      id: "quarto-beliches-02",
      alt: "Segundo dormitório do Recanto Florença com beliches de madeira e ar-condicionado",
      caption: "Segundo dormitório",
      category: "Acomodações",
      widths: [480, 768, 960],
    },
    {
      id: "piscina-deck",
      alt: "Piscina do Recanto Florença ao lado do deck e cercada por palmeiras",
      caption: "Piscina e deck",
      category: "Lazer",
    },
    {
      id: "area-externa-deck",
      alt: "Área externa pavimentada com deck e acesso aos ambientes de apoio",
      caption: "Área externa",
      category: "Lazer",
    },
    {
      id: "jardim-interno",
      alt: "Jardim interno arborizado com palmeiras e caminho de circulação",
      caption: "Jardim interno",
      category: "Natureza",
    },
    {
      id: "passagem-ajardinada",
      alt: "Passagem lateral ajardinada ao lado do salão envidraçado",
      caption: "Passagem ajardinada",
      category: "Natureza",
    },
    {
      id: "fachada-acesso-externo",
      alt: "Vista externa do Recanto Florença com portão, calçada e palmeiras",
      caption: "Acesso externo",
      category: "Localização",
    },
    {
      id: "acesso-lateral-palmeiras",
      alt: "Acesso lateral com calçada e palmeiras ao longo do muro",
      caption: "Fácil acesso em Marília",
      category: "Localização",
    },
  ];
  var lightbox = document.querySelector(".lightbox");
  var lightboxImage = lightbox.querySelector("figure img");
  var lightboxCategory = lightbox.querySelector("figcaption span");
  var lightboxCaption = lightbox.querySelector("figcaption strong");
  var lightboxCounter = lightbox.querySelector("figcaption small");
  var lightboxClose = lightbox.querySelector(".lightbox__close");
  var selectedIndex = 0;
  var lastFocusedElement = null;
  var lightboxTransitionId = 0;

  function renderLightbox() {
    var item = gallery[selectedIndex];
    var widths = item.widths || [768, 1200, 1600];
    var largestWidth = widths[widths.length - 1];
    lightboxImage.src = `assets/images/recanto/${item.id}-${largestWidth}.webp`;
    lightboxImage.srcset = widths
      .map((width) => `assets/images/recanto/${item.id}-${width}.webp ${width}w`)
      .join(", ");
    lightboxImage.sizes = "90vw";
    lightboxImage.alt = item.alt;
    lightboxCategory.textContent = item.category;
    lightboxCaption.textContent = item.caption;
    lightboxCounter.textContent = `${String(selectedIndex + 1).padStart(2, "0")} / ${String(gallery.length).padStart(2, "0")}`;
    lightbox.setAttribute("aria-label", `Galeria de fotos, imagem ${selectedIndex + 1} de ${gallery.length}`);
  }
  function openLightbox(index, trigger) {
    lightboxTransitionId += 1;
    selectedIndex = index;
    lastFocusedElement = trigger;
    renderLightbox();
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    window.requestAnimationFrame(() => {
      lightbox.classList.add("is-visible");
      lightboxClose.focus();
    });
  }
  async function closeLightbox() {
    if (lightbox.hidden || !lightbox.classList.contains("is-visible")) return;
    var transitionId = ++lightboxTransitionId;
    lightbox.classList.remove("is-visible");
    await waitForTransition(lightbox, 190);
    if (transitionId !== lightboxTransitionId) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (lastFocusedElement) lastFocusedElement.focus();
  }
  function moveLightbox(direction) {
    selectedIndex = wrapIndex(selectedIndex + direction, gallery.length);
    renderLightbox();
  }

  document.querySelectorAll("[data-gallery-index]").forEach((button) => {
    button.addEventListener("click", () => {
      openLightbox(Number(button.getAttribute("data-gallery-index")), button);
    });
  });
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox__nav--prev").addEventListener("click", () => {
    moveLightbox(-1);
  });
  lightbox.querySelector(".lightbox__nav--next").addEventListener("click", () => {
    moveLightbox(1);
  });
  lightbox.addEventListener("mousedown", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!lightbox.hidden) closeLightbox();
      else setMenu(false);
    }
    if (!lightbox.hidden && event.key === "ArrowRight") moveLightbox(1);
    if (!lightbox.hidden && event.key === "ArrowLeft") moveLightbox(-1);
  });
})();
