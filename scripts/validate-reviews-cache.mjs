import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CACHE_MAX_AGE_DAYS, MINIMUM_DISPLAY_RATING, REVIEW_PAGE_SIZE } from "./fetch-reviews.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultCachePath = path.join(projectRoot, "data", "reviews.json");
const validStarRatings = new Set(["ONE", "TWO", "THREE", "FOUR", "FIVE"]);
const starRatingValues = new Map([
  ["ONE", 1],
  ["TWO", 2],
  ["THREE", 3],
  ["FOUR", 4],
  ["FIVE", 5],
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateReviewCache(data, now = new Date()) {
  assert(data?.source === "google-places-api-new", "O cache não veio da Places API (New).");
  assert(data?.isDemo === false, "O cache de publicação não pode conter dados de demonstração.");
  assert(
    data?.minimumDisplayedRating === MINIMUM_DISPLAY_RATING,
    `O cache deve exibir somente avaliações a partir de ${MINIMUM_DISPLAY_RATING} estrelas.`,
  );

  const fetchedAt = new Date(data?.fetchedAt);
  const expiresAt = new Date(data?.expiresAt);
  assert(!Number.isNaN(fetchedAt.getTime()), "fetchedAt inválido.");
  assert(!Number.isNaN(expiresAt.getTime()), "expiresAt inválido.");
  assert(expiresAt.getTime() > now.getTime(), "O cache de avaliações já expirou.");
  assert(
    expiresAt.getTime() - fetchedAt.getTime() <= CACHE_MAX_AGE_DAYS * 86_400_000,
    `O cache não pode durar mais de ${CACHE_MAX_AGE_DAYS} dias.`,
  );

  assert(data?.location?.placeId, "O cache não informa o Place ID.");
  assert(data?.location?.mapsUri, "O cache não informa o link do Google Maps.");
  assert(Number.isFinite(data?.averageRating), "A nota média é inválida.");
  assert(Number.isInteger(data?.totalReviewCount), "A contagem de avaliações é inválida.");
  assert(Array.isArray(data?.reviews), "A lista de avaliações é inválida.");
  assert(data.reviews.length > 0, "A API não retornou avaliações publicáveis.");
  assert(data.reviews.length <= REVIEW_PAGE_SIZE, `O cache excede ${REVIEW_PAGE_SIZE} avaliações.`);

  for (const review of data.reviews) {
    assert(typeof review?.reviewId === "string" && review.reviewId, "Uma avaliação não tem reviewId.");
    assert(validStarRatings.has(review?.starRating), "Uma avaliação tem nota inválida.");
    assert(
      starRatingValues.get(review.starRating) >= MINIMUM_DISPLAY_RATING,
      `Uma avaliação tem menos de ${MINIMUM_DISPLAY_RATING} estrelas.`,
    );
    assert(typeof review?.comment === "string", "Uma avaliação tem comentário inválido.");
  }

  return true;
}

export async function main() {
  const cachePath = process.env.GOOGLE_REVIEWS_OUTPUT
    ? path.resolve(process.env.GOOGLE_REVIEWS_OUTPUT)
    : defaultCachePath;
  const data = JSON.parse(await readFile(cachePath, "utf8"));
  validateReviewCache(data);
  console.log(`Cache temporário válido: ${data.reviews.length} avaliação(ões).`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
