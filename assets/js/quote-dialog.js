const whatsappBase = "https://wa.me/5514998134747";

export function buildQuoteUrl({ name, guests, date, eventType, context }) {
  const message = [
    `Olá! Sou ${name.trim()} e vim pelo site do Recanto Florença.`,
    `Gostaria de consultar disponibilidade para ${eventType}.`,
    `Data: ${date || "a definir"}.`,
    `Convidados: aproximadamente ${guests}.`,
    context ? `Interesse: ${context}.` : "",
    "Podem me informar as condições e o orçamento?",
  ]
    .filter(Boolean)
    .join("\n");
  return `${whatsappBase}?text=${encodeURIComponent(message)}`;
}

export function initializeQuoteDialog() {
  const dialog = document.querySelector("#quote-dialog");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const form = dialog.querySelector("form");
  const date = form.elements.eventDate;
  const unknownDate = form.elements.unknownDate;
  let trigger;
  let context = "";
  let started = false;
  let submitted = false;
  const signal = (stage) => document.dispatchEvent(new CustomEvent("rf:quote", { detail: { stage } }));
  const syncDate = () => {
    date.disabled = unknownDate.checked;
    date.required = !unknownDate.checked;
  };
  const today = new Date();
  date.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  unknownDate.addEventListener("change", syncDate);
  document.addEventListener(
    "click",
    (event) => {
      const link =
        event.target instanceof Element
          ? event.target.closest('a[href^="https://wa.me/5514998134747"]')
          : null;
      if (
        !link ||
        link.hasAttribute("data-quote-direct") ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      event.preventDefault();
      event.rfQuoteOpened = true;
      trigger = link;
      context = link.closest("#rf-overlay") ? "pacote de 4 diárias para o Natal" : "";
      const eventContext = link.dataset.whatsappContext;
      if (eventContext) {
        const option = Array.from(form.elements.eventType.options).find(
          (item) => item.value === eventContext,
        );
        form.elements.eventType.value = option ? eventContext : "outro evento";
      }
      started = false;
      submitted = false;
      syncDate();
      dialog.showModal();
      document.body.classList.add("quote-open");
      signal("open");
    },
    true,
  );
  dialog.querySelector("[data-quote-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("quote-open");
    if (!submitted) signal("close");
    trigger?.focus({ preventScroll: true });
  });
  form.addEventListener("input", () => {
    if (started) return;
    started = true;
    signal("start");
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity() || submitted) return;
    if (!form.elements.guestName.value.trim()) {
      form.elements.guestName.setCustomValidity("Informe seu nome.");
      form.elements.guestName.reportValidity();
      return;
    }
    submitted = true;
    const url = buildQuoteUrl({
      name: form.elements.guestName.value,
      guests: form.elements.guests.value,
      date: unknownDate.checked ? "" : date.value.split("-").reverse().join("/"),
      eventType: form.elements.eventType.value,
      context,
    });
    signal("continue");
    // Keep personal data out of analytics, storage and this site's URL.
    window.location.assign(url);
    submitted = false;
  });
  form.elements.guestName.addEventListener("input", () => form.elements.guestName.setCustomValidity(""));
}
