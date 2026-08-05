(function () {
  "use strict";

  var overlay = document.getElementById("rf-overlay");
  if (!overlay) return;

  var closeButton = document.getElementById("rf-close");
  var actionButton = overlay.querySelector(".rf-btn");
  var scrollKeys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Escape"];
  var active = false;

  var flakes = "❄❅❆";
  for (var index = 0; index < 28; index += 1) {
    var flake = document.createElement("span");
    flake.className = "rf-flake";
    flake.setAttribute("aria-hidden", "true");
    flake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
    flake.style.left = Math.random() * 100 + "%";
    flake.style.fontSize = 10 + Math.random() * 16 + "px";
    flake.style.animationDuration = 6 + Math.random() * 8 + "s";
    flake.style.animationDelay = Math.random() * 8 + "s";
    flake.style.opacity = 0.3 + Math.random() * 0.6;
    overlay.appendChild(flake);
  }

  function isPopupControl(target) {
    return target instanceof Element && Boolean(target.closest(".rf-content, #rf-close"));
  }

  function closeFromPointerOutside(event) {
    if (!isPopupControl(event.target)) closeOverlay();
  }

  function closeFromKeyboard(event) {
    if (scrollKeys.indexOf(event.key) !== -1) closeOverlay();
  }

  function bindDismissEvents() {
    window.addEventListener("wheel", closeOverlay, { passive: true });
    window.addEventListener("scroll", closeOverlay, { passive: true });
    window.addEventListener("touchmove", closeOverlay, { passive: true });
    window.addEventListener("touchstart", closeFromPointerOutside, { passive: true });
    window.addEventListener("pointerdown", closeFromPointerOutside, { passive: true });
    window.addEventListener("keydown", closeFromKeyboard);
  }

  function unbindDismissEvents() {
    window.removeEventListener("wheel", closeOverlay);
    window.removeEventListener("scroll", closeOverlay);
    window.removeEventListener("touchmove", closeOverlay);
    window.removeEventListener("touchstart", closeFromPointerOutside);
    window.removeEventListener("pointerdown", closeFromPointerOutside);
    window.removeEventListener("keydown", closeFromKeyboard);
  }

  function showOverlay() {
    if (active) return;
    active = true;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    bindDismissEvents();
  }

  function closeOverlay() {
    if (!active) return;
    active = false;
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    unbindDismissEvents();
  }

  closeButton.addEventListener("click", closeOverlay);
  actionButton.addEventListener("click", closeOverlay);

  function scheduleShow() {
    window.setTimeout(showOverlay, 300);
  }

  if (document.readyState === "complete") {
    scheduleShow();
  } else {
    window.addEventListener("load", scheduleShow, { once: true });
  }
})();
