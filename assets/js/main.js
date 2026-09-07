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

  var reducedMotion = prefersReducedMotion();
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
  var galleryCarousel = document.querySelector("[data-gallery-carousel]");
  var galleryTrack = document.querySelector("[data-gallery-track]");
  var galleryCurrent = document.querySelector("[data-gallery-current]");
  var galleryPrevious = document.querySelector("[data-gallery-previous]");
  var galleryNext = document.querySelector("[data-gallery-next]");
  var galleryIndex = 0;
  var galleryScrollFrame;
  var galleryHintTimer;
  var galleryHintObserver;
  var galleryInteracted = false;

  function getClosestGalleryIndex() {
    if (!galleryTrack || galleryCards.length === 0) return 0;
    return galleryCards.reduce((closestIndex, card, index) => {
      var distance = Math.abs(card.offsetLeft - galleryTrack.scrollLeft);
      var closestDistance = Math.abs(galleryCards[closestIndex].offsetLeft - galleryTrack.scrollLeft);
      return distance < closestDistance ? index : closestIndex;
    }, 0);
  }

  function updateGalleryControls(index = getClosestGalleryIndex()) {
    galleryIndex = Math.min(Math.max(index, 0), galleryCards.length - 1);
    if (galleryCurrent) galleryCurrent.textContent = String(galleryIndex + 1).padStart(2, "0");
    if (galleryPrevious) galleryPrevious.disabled = galleryIndex === 0;
    if (galleryNext) galleryNext.disabled = galleryIndex === galleryCards.length - 1;
  }

  function scrollGalleryTo(index) {
    if (!galleryTrack || !galleryCards[index]) return;
    galleryTrack.scrollTo({
      left: galleryCards[index].offsetLeft,
      behavior: reducedMotion ? "auto" : "smooth",
    });
    updateGalleryControls(index);
  }

  function cancelGalleryHint() {
    galleryInteracted = true;
    window.clearTimeout(galleryHintTimer);
    galleryCarousel?.classList.remove("is-hinting");
    galleryHintObserver?.disconnect();
  }

  if (galleryTrack && galleryCards.length > 0) {
    galleryTrack.addEventListener(
      "scroll",
      () => {
        window.cancelAnimationFrame(galleryScrollFrame);
        galleryScrollFrame = window.requestAnimationFrame(() => updateGalleryControls());
      },
      { passive: true },
    );
    galleryTrack.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      cancelGalleryHint();
      scrollGalleryTo(galleryIndex + (event.key === "ArrowRight" ? 1 : -1));
    });
    ["pointerdown", "touchstart", "wheel"].forEach((eventName) => {
      galleryTrack.addEventListener(eventName, cancelGalleryHint, { passive: true, once: true });
    });
    galleryPrevious?.addEventListener("click", () => {
      cancelGalleryHint();
      scrollGalleryTo(galleryIndex - 1);
    });
    galleryNext?.addEventListener("click", () => {
      cancelGalleryHint();
      scrollGalleryTo(galleryIndex + 1);
    });
    updateGalleryControls(0);

    if (!reducedMotion && "IntersectionObserver" in window && galleryCarousel) {
      galleryHintObserver = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting) || galleryInteracted) return;
          galleryHintObserver.disconnect();
          galleryHintTimer = window.setTimeout(() => {
            if (galleryInteracted || galleryTrack.scrollWidth <= galleryTrack.clientWidth) return;
            galleryCarousel.classList.add("is-hinting");
            galleryHintTimer = window.setTimeout(() => {
              galleryCarousel.classList.remove("is-hinting");
            }, 240);
          }, 220);
        },
        { threshold: 0.36 },
      );
      galleryHintObserver.observe(galleryCarousel);
    }
  }

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
