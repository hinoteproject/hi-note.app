/**
 * RAG — Retrieval-Augmented Generation for Hi-Note Order Parser
 *
 * Thay vì gửi TOÀN BỘ menu cho AI (gây nhầm fuzzy match),
 * chúng ta chỉ lấy những sản phẩm có liên quan đến câu nói,
 * rồi gửi danh sách thu hẹp đó cho AI → chính xác hơn nhiều.
 *
 * Pipeline:
 *  1. Tokenize câu nói → danh sách từ khóa
 *  2. Với mỗi sản phẩm, tính relevance score theo nhiều tiêu chí
 *  3. Chỉ lấy top-K sản phẩm có score > 0
 *  4. Trả về danh sách thu hẹp để gửi AI
 */

import { Product } from '../types';

// ── Tiếng Việt stopwords ──────────────────────────────────────────────────────
const STOPWORDS = new Set([
    'và', 'với', 'của', 'cho', 'từ', 'về', 'bằng', 'trong', 'trên', 'dưới',
    'ở', 'tại', 'là', 'có', 'được', 'không', 'một', 'hai', 'ba', 'bốn', 'năm',
    'tô', 'ly', 'cái', 'phần', 'suất', 'bịch', 'lon', 'chai', 'thêm', 'ơi',
    'nghìn', 'ngàn', 'bàn', 'số', 'anh', 'chị', 'em', 'tôi', 'xin', 'ạ',
    'cho', 'thêm', 'nữa', 'lấy', 'đặt', 'order',
]);

// ── Normalize tiếng Việt ──────────────────────────────────────────────────────
function normalizeVi(text: string): string {
    return text.toLowerCase().trim();
}

// ── Xóa dấu tiếng Việt để so sánh phonetic ───────────────────────────────────
function removeDiacritics(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')   // xóa combining diacritical marks
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd');
}

// ── Tách từ khóa từ câu nói ───────────────────────────────────────────────────
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[,\.!?;:\/\\()\[\]{}""'']/g, ' ')
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length >= 2 && !STOPWORDS.has(w));
}

// ── Xóa số & đơn vị tiền để extract tên sản phẩm ─────────────────────────────
function extractProductNamePortion(text: string): string {
    return text
        .replace(/\d+\s*k\b/gi, '')      // "35k", "10k"
        .replace(/\d+\s*(nghìn|ngàn|đồng|đ)\b/gi, '')
        .replace(/\b\d+\b/g, '')         // số rời
        .replace(/\s+/g, ' ')
        .trim();
}

// ── Tính Levenshtein distance ─────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
        Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[a.length][b.length];
}

// ── Similarity 0–1 ────────────────────────────────────────────────────────────
function similarity(a: string, b: string): number {
    if (a === b) return 1;
    const dist = levenshtein(a, b);
    return 1 - dist / Math.max(a.length, b.length);
}

// ────────────────────────────────────────────────────────────────────────────
interface Candidate {
    product: Product;
    score: number;
    reason: string;
}

/**
 * RAG Retrieval: trả về danh sách sản phẩm liên quan đến câu nói.
 *
 * @param voiceText   Câu nói / text đã transcribe
 * @param products    Toàn bộ danh sách sản phẩm
 * @param topK        Số sản phẩm tối đa trả về (default 8)
 * @param threshold   Điểm tối thiểu để được chọn (default 1.0)
 */
export function retrieveRelevantProducts(
    voiceText: string,
    products: Product[],
    topK: number = 8,
    threshold: number = 1.0,
): Product[] {
    if (!products.length) return [];

    // Pre-process query
    const queryNorm = normalizeVi(voiceText);
    const queryNoDiac = removeDiacritics(voiceText);
    const queryTokens = tokenize(voiceText);
    const queryProductPart = extractProductNamePortion(voiceText);
    const queryProductNoDiac = removeDiacritics(queryProductPart);

    const candidates: Candidate[] = [];

    for (const product of products) {
        const nameNorm = normalizeVi(product.name);
        const nameNoDiac = removeDiacritics(product.name);
        const nameTokens = tokenize(product.name);

        let score = 0;
        let reason = '';

        // ── Tier 1: Exact name match trong query (score 10) ──────────────────────
        if (queryNorm.includes(nameNorm)) {
            score = 10;
            reason = 'exact_name';
        }

        // ── Tier 1b: Exact match bỏ dấu (score 9) ────────────────────────────────
        if (score < 9 && nameNoDiac.length >= 3 && queryNoDiac.includes(nameNoDiac)) {
            score = 9;
            reason = 'exact_nodiac';
        }

        // ── Tier 2: Tất cả token của tên xuất hiện trong query (score 8) ──────────
        if (score < 8 && nameTokens.length > 0) {
            const allMatch = nameTokens.every(t => queryNorm.includes(t));
            if (allMatch) {
                score = 8;
                reason = 'all_tokens';
            }
        }

        // ── Tier 2b: Tất cả token bỏ dấu của tên xuất hiện (score 7) ─────────────
        if (score < 7 && nameTokens.length > 0) {
            const nameTokensNoDiac = nameTokens.map(t => removeDiacritics(t));
            const allMatchNoDiac = nameTokensNoDiac.every(t => queryNoDiac.includes(t));
            if (allMatchNoDiac) {
                score = 7;
                reason = 'all_tokens_nodiac';
            }
        }

        // ── Tier 3: Alias matching ────────────────────────────────────────────────
        for (const alias of (product.aliases || [])) {
            const aliasNorm = normalizeVi(alias);
            const aliasNoDiac = removeDiacritics(alias);
            const aliasTokens = tokenize(alias);

            if (queryNorm.includes(aliasNorm)) {
                score = Math.max(score, 9);
                reason = 'exact_alias';
                break;
            }
            if (aliasNoDiac.length >= 3 && queryNoDiac.includes(aliasNoDiac)) {
                score = Math.max(score, 8);
                reason = 'alias_nodiac';
                break;
            }
            if (aliasTokens.length > 0 && aliasTokens.every(t => queryNorm.includes(t))) {
                score = Math.max(score, 6);
                reason = 'alias_all_tokens';
                break;
            }
        }

        // ── Tier 4: Partial token match ───────────────────────────────────────────
        if (score < 4 && nameTokens.length > 0) {
            const matched = nameTokens.filter(t => queryNorm.includes(t));
            if (matched.length > 0) {
                const partScore = 4 * (matched.length / nameTokens.length);
                if (partScore > score) {
                    score = partScore;
                    reason = `partial_${matched.length}/${nameTokens.length}`;
                }
            }
        }

        // ── Tier 5: Query tokens trong tên sản phẩm ──────────────────────────────
        if (score < 3 && queryTokens.length > 0) {
            const qtInName = queryTokens.filter(t => nameNorm.includes(t));
            if (qtInName.length > 0) {
                const s = Math.min(3, 1.5 * qtInName.length);
                if (s > score) {
                    score = s;
                    reason = `qtoken_in_name_${qtInName.length}`;
                }
            }
        }

        // ── Tier 6: Phonetic similarity (Levenshtein) - chỉ khi tên ngắn ─────────
        if (score < 3 && nameNoDiac.length >= 3 && queryProductNoDiac.length >= 3) {
            // So sánh similarity giữa phần tên trong query và tên sản phẩm
            const sim = similarity(queryProductNoDiac, nameNoDiac);
            if (sim >= 0.7) {
                const s = sim * 2.5; // max 2.5
                if (s > score) {
                    score = s;
                    reason = `phonetic_sim_${sim.toFixed(2)}`;
                }
            }
        }

        if (score >= threshold) {
            candidates.push({ product, score, reason });
        }
    }

    // Sắp xếp theo score giảm dần
    candidates.sort((a, b) => b.score - a.score);

    console.log(
        '[RAG] Query:', voiceText.substring(0, 50),
        '| Retrieved:', candidates.slice(0, topK).map(c => `${c.product.name}(${c.score.toFixed(1)})`).join(', ')
    );

    return candidates.slice(0, topK).map(c => c.product);
}

/**
 * Trả về toàn bộ nếu không retrieve được gì có ý nghĩa.
 * Dùng khi query quá ngắn hoặc không có từ khóa rõ ràng.
 */
export function shouldUseFullList(voiceText: string): boolean {
    const tokens = tokenize(voiceText);
    return tokens.length === 0;
}
