const REVIEW_PREVIEW_LIMIT = 150;
const MINIMUM_DISPLAY_RATING = 4;
const GOOGLE_STAR_RATINGS = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

function safeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const parsed = new URL(value, window.location.href);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function getInitials(name) {
  return (
    String(name || "G")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "G"
  );
}

function truncateAtWord(text, limit = REVIEW_PREVIEW_LIMIT) {
  const normalized = String(text || "").trim();
  if (normalized.length <= limit) return { preview: normalized, truncated: false };

  const candidate = normalized.slice(0, limit + 1);
  const breakAt = candidate.lastIndexOf(" ");
  const preview = normalized.slice(0, breakAt > limit * 0.65 ? breakAt : limit).trimEnd();
  return { preview: `${preview}…`, truncated: true };
}

function formatRelativeDate(value) {
  const publishedAt = new Date(value);
  if (Number.isNaN(publishedAt.getTime())) return "Data não informada";

  const elapsedDays = Math.max(0, Math.floor((Date.now() - publishedAt.getTime()) / 86_400_000));
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (elapsedDays < 1) return formatter.format(0, "day");
  if (elapsedDays < 30) return formatter.format(-elapsedDays, "day");

  const elapsedMonths = Math.max(1, Math.floor(elapsedDays / 30));
  if (elapsedMonths < 12) return formatter.format(-elapsedMonths, "month");
  return formatter.format(-Math.max(1, Math.floor(elapsedMonths / 12)), "year");
}

function normalizeBusinessProfileReview(review) {
  const reviewer = review?.reviewer || {};
  return {
    id: review?.reviewId || "",
    rating: GOOGLE_STAR_RATINGS[review?.starRating] || Number(review?.starRating) || 1,
    text: String(review?.comment || "").trim(),
    relativePublishTimeDescription: formatRelativeDate(review?.updateTime || review?.createTime),
    googleMapsUri: "",
    author: {
      displayName: reviewer.displayName || "Usuário do Google",
      uri: "",
      photoUri: reviewer.profilePhotoUrl || "",
    },
  };
}

function isExpired(value) {
  const expiresAt = new Date(value);
  return Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now();
}

function createExternalLink(label, href, className) {
  const link = document.createElement("a");
  link.className = className;
  link.textContent = label;
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function createAvatar(author) {
  const avatar = document.createElement("span");
  avatar.className = "review-card__avatar";

  const initials = document.createElement("span");
  initials.className = "review-card__initials";
  initials.textContent = getInitials(author.displayName);
  initials.setAttribute("aria-hidden", "true");
  avatar.append(initials);

  const photoUri = safeUrl(author.photoUri);
  if (photoUri) {
    const image = document.createElement("img");
    image.src = photoUri;
    image.alt = "";
    image.width = 52;
    image.height = 52;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => image.remove(), { once: true });
    avatar.append(image);
  }

  return avatar;
}

function createAuthor(author) {
  const authorName = String(author.displayName || "Usuário do Google");
  const authorUri = safeUrl(author.uri);
  const wrapper = authorUri
    ? createExternalLink("", authorUri, "review-card__author")
    : document.createElement("div");
  if (!authorUri) wrapper.className = "review-card__author";

  wrapper.append(createAvatar({ ...author, displayName: authorName }));
  const name = document.createElement("strong");
  name.textContent = authorName;
  wrapper.append(name);
  return wrapper;
}

function createStars(rating) {
  const roundedRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 1)));
  const stars = document.createElement("span");
  stars.className = "review-card__stars";
  stars.textContent = `${"★".repeat(roundedRating)}${"☆".repeat(5 - roundedRating)}`;
  stars.setAttribute("aria-label", `${roundedRating} de 5 estrelas`);
  return stars;
}

function createReviewCard(review, index, fallbackGoogleMapsUrl) {
  const card = document.createElement("article");
  card.className = "review-card";

  const header = document.createElement("header");
  header.className = "review-card__header";
  header.append(createAuthor(review.author || {}));
  header.append(createStars(review.rating));
  card.append(header);

  const reviewTextId = `google-review-text-${index + 1}`;
  const text = String(review.text || "").trim();
  const { preview, truncated } = truncateAtWord(text);
  const paragraph = document.createElement("p");
  paragraph.id = reviewTextId;
  paragraph.className = "review-card__text";
  paragraph.textContent = preview;
  card.append(paragraph);

  if (truncated) {
    const moreButton = document.createElement("button");
    moreButton.className = "review-card__more";
    moreButton.type = "button";
    moreButton.textContent = "Ler mais";
    moreButton.setAttribute("aria-controls", reviewTextId);
    moreButton.setAttribute("aria-expanded", "false");
    moreButton.addEventListener("click", () => {
      const expanded = moreButton.getAttribute("aria-expanded") === "true";
      paragraph.textContent = expanded ? preview : text;
      moreButton.textContent = expanded ? "Ler mais" : "Mostrar menos";
      moreButton.setAttribute("aria-expanded", String(!expanded));
    });
    card.append(moreButton);
  }

  const footer = document.createElement("footer");
  footer.className = "review-card__footer";
  const date = document.createElement("span");
  date.textContent = review.relativePublishTimeDescription || "Data não informada";
  footer.append(date);

  const reviewUrl = safeUrl(review.googleMapsUri) || fallbackGoogleMapsUrl;
  if (reviewUrl) footer.append(createExternalLink("Ver no Google Maps", reviewUrl, "review-card__source"));
  card.append(footer);

  return card;
}

function formatAverage(rating, count) {
  const safeRating = Number(rating);
  const safeCount = Number(count);
  if (!Number.isFinite(safeRating) || !Number.isFinite(safeCount)) return "";

  const ratingText = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(safeRating);
  const countText = new Intl.NumberFormat("pt-BR").format(safeCount);
  return `${ratingText} ★ — baseado em ${countText} avaliações`;
}

async function loadReviews() {
  const section = document.querySelector("[data-reviews-section]");
  if (!section) return;

  try {
    const response = await fetch("data/reviews.json", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;

    const data = await response.json();
    if (isExpired(data?.expiresAt)) return;
    const reviews = Array.isArray(data?.reviews)
      ? data.reviews
          .map(normalizeBusinessProfileReview)
          .filter((review) => review.text && review.rating >= MINIMUM_DISPLAY_RATING)
          .slice(0, 5)
      : [];
    const summary = formatAverage(data?.averageRating, data?.totalReviewCount);
    if (!reviews.length || !summary) return;

    const googleMapsUrl = safeUrl(data?.location?.mapsUri);
    const list = section.querySelector("[data-reviews-list]");
    list.replaceChildren(...reviews.map((review, index) => createReviewCard(review, index, googleMapsUrl)));
    section.querySelector("[data-reviews-summary]").textContent = summary;

    const allReviewsLink = section.querySelector("[data-all-reviews]");
    if (googleMapsUrl) allReviewsLink.href = googleMapsUrl;
    else allReviewsLink.hidden = true;

    section.querySelector("[data-reviews-demo]").hidden = data.isDemo !== true;
    section.hidden = false;
    document.querySelectorAll("[data-reviews-nav]").forEach((link) => {
      link.hidden = false;
    });
  } catch {
    section.hidden = true;
  }
}

loadReviews();
