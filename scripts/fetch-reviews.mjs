import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const PLACE_DETAILS_ENDPOINT = "https://places.googleapis.com/v1/places";
export const PLACE_DETAILS_FIELD_MASK = "displayName,rating,userRatingCount,reviews";
export const REVIEW_ORDER = "most-relevant";
export const REVIEW_PAGE_SIZE = 5;
export const MINIMUM_DISPLAY_RATING = 4;
export const CACHE_MAX_AGE_DAYS = 29;

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutputPath = path.join(projectRoot, "data", "reviews.json");
const STAR_RATINGS = ["ONE", "TWO", "THREE", "FOUR", "FIVE"];

function optionalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalUrl(value) {
  const candidate = optionalText(value);
  if (!candidate) return "";

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function requireText(value, message) {
  const text = optionalText(value);
  if (!text) throw new Error(message);
  return text;
}

function addDays(isoDate, days) {
  const result = new Date(isoDate);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString();
}

async function responseError(response, label) {
  const responseText = await response.text();
  return new Error(`${label} respondeu ${response.status}: ${responseText.slice(0, 500)}`);
}

function toStarRating(value) {
  const rating = Math.min(5, Math.max(1, Math.round(Number(value) || 1)));
  return STAR_RATINGS[rating - 1];
}

function normalizeReview(review) {
  const attribution = review?.authorAttribution || {};
  const publishTime = optionalText(review?.publishTime);

  return {
    reviewId: optionalText(review?.name),
    reviewer: {
      displayName: optionalText(attribution?.displayName) || "Usuário do Google",
      profilePhotoUrl: optionalUrl(attribution?.photoUri),
      profileUri: optionalUrl(attribution?.uri),
    },
    starRating: toStarRating(review?.rating),
    comment: optionalText(review?.text?.text) || optionalText(review?.originalText?.text),
    createTime: publishTime,
    updateTime: publishTime,
    googleMapsUri: optionalUrl(review?.googleMapsUri),
  };
}

export function buildGoogleMapsUrl(placeId, displayName = "Recanto Florença") {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", displayName);
  url.searchParams.set("query_place_id", placeId);
  return url.href;
}

export async function fetchPlaceDetails({ apiKey, placeId, fetchImpl = fetch }) {
  const url = new URL(`${PLACE_DETAILS_ENDPOINT}/${encodeURIComponent(placeId)}`);
  url.searchParams.set("languageCode", "pt-BR");
  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
    },
  });

  if (!response.ok) throw await responseError(response, "Places API (New)");
  return response.json();
}

export function createTransientReviewCache({ payload, placeId, fetchedAt = new Date().toISOString() }) {
  const title = optionalText(payload?.displayName?.text) || "Recanto Florença";
  const averageRating = Number(payload?.rating);
  const totalReviewCount = Number(payload?.userRatingCount);
  const reviews = Array.isArray(payload?.reviews)
    ? payload.reviews
        .filter((review) => Number(review?.rating) >= MINIMUM_DISPLAY_RATING)
        .slice(0, REVIEW_PAGE_SIZE)
        .map(normalizeReview)
    : [];

  return {
    schemaVersion: 2,
    source: "google-places-api-new",
    isDemo: false,
    fetchedAt,
    expiresAt: addDays(fetchedAt, CACHE_MAX_AGE_DAYS),
    order: REVIEW_ORDER,
    minimumDisplayedRating: MINIMUM_DISPLAY_RATING,
    location: {
      title,
      placeId,
      mapsUri: buildGoogleMapsUrl(placeId, title),
    },
    averageRating: Number.isFinite(averageRating) ? averageRating : 0,
    totalReviewCount: Number.isFinite(totalReviewCount) ? totalReviewCount : 0,
    reviews,
  };
}

export async function writeReviewsFile(reviewsData, outputPath = defaultOutputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(reviewsData, null, 2)}\n`, "utf8");
  await rename(temporaryPath, outputPath);
}

export async function main() {
  const apiKey = requireText(
    process.env.GOOGLE_PLACES_API_KEY,
    "Defina GOOGLE_PLACES_API_KEY antes de executar o script.",
  );
  const placeId = requireText(
    process.env.GOOGLE_PLACE_ID,
    "Defina GOOGLE_PLACE_ID antes de executar o script.",
  );
  const outputPath = process.env.GOOGLE_REVIEWS_OUTPUT
    ? path.resolve(process.env.GOOGLE_REVIEWS_OUTPUT)
    : defaultOutputPath;

  const payload = await fetchPlaceDetails({ apiKey, placeId });
  const cache = createTransientReviewCache({ payload, placeId });
  await writeReviewsFile(cache, outputPath);
  console.log(`Cache temporário atualizado: ${cache.reviews.length} avaliação(ões) em ${outputPath}`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
