export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function wrapIndex(index, length) {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError("length must be a positive integer");
  }

  return ((index % length) + length) % length;
}

export function waitForTransition(element, fallbackMs) {
  if (!element || typeof element.addEventListener !== "function") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    var finished = false;
    var timeoutId = window.setTimeout(finish, fallbackMs);

    function finish(event) {
      if (event && event.target !== element) return;
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      element.removeEventListener("transitionend", finish);
      resolve();
    }

    element.addEventListener("transitionend", finish);
  });
}
