import { Product, AIParseResult } from '../types';
import { GROQ_API_KEY } from '../config/keys';
import { retrieveRelevantProducts, shouldUseFullList } from './rag';

// Groq API key
const GROQ_KEY = GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ParseOptions {
  useMenuMatching?: boolean; // Bật/tắt tính năng khớp menu
}

export async function parseVoiceToOrder(
  voiceText: string,
  existingProducts: Product[],
  options: ParseOptions = { useMenuMatching: true }
): Promise<AIParseResult> {
  console.log('🤖 Parsing with Groq AI + RAG:', voiceText);

  // ── RAG: Chỉ lấy sản phẩm liên quan thay vì gửi toàn bộ menu ──────────
  let relevantProducts: Product[] = [];
  if (options.useMenuMatching && existingProducts.length > 0) {
    if (shouldUseFullList(voiceText)) {
      // Query quá ngắn/không rõ → gửi toàn bộ (tối đa 15 sp)
      relevantProducts = existingProducts.slice(0, 15);
    } else {
      // RAG retrieval — chỉ lấy sản phẩm thực sự liên quan
      relevantProducts = retrieveRelevantProducts(voiceText, existingProducts, 8);
    }
  }

  const productList = relevantProducts.map(p => ({
    id: p.id,
    name: p.name,
    aliases: p.aliases,
    price: p.price,
  }));

  const menuSection = options.useMenuMatching && productList.length > 0
    ? `
DANH SÁCH SẢN PHẨM ĐÃ CÓ (chỉ tham khảo khi tên 100% khớp):
${JSON.stringify(productList, null, 2)}

QUY TẮC KHỚP SẢN PHẨM — RẤT QUAN TRỌNG:
- CHỈ khớp khi tên HOÀN TOÀN GIỐNG NHAU (exact match, không phân biệt hoa thường)
- VÍ DỤ ĐÚNG: "bánh poca" → khớp với "Bánh poca" ✓
- VÍ DỤ SAI: "bánh poca" → KHÔNG khớp với "Bò cụng" ✗ (tên khác nhau hoàn toàn)
- VÍ DỤ SAI: "bánh" → KHÔNG khớp với "Bò cụng" hay bất kỳ sp nào có "bò" ✗
- NẾU không tìm thấy tên khớp 100%: matchedProductId = null (tạo sp mới)
- TUYỆT ĐỐI KHÔNG đoán hay gợi ý sp gần giống — thà tạo sp mới còn hơn nhận nhầm
- NẾU voice text có giá: LUÔN dùng giá từ voice, không dùng giá menu
`
    : '';

  const systemPrompt = `Bạn là AI parser đơn hàng cho app bán hàng Việt Nam. Từ câu nói/văn bản của người bán, trích xuất thông tin đơn hàng.
${menuSection}
YÊU CẦU:
- Trích xuất danh sách sản phẩm (tên, số lượng, giá nếu có)
- Tìm số bàn nếu có (VD: "bàn 3", "bàn số 5", "bài 2" = bàn 2)
- LUÔN ưu tiên giá từ câu nói gốc, KHÔNG tự động thay đổi giá
- Nếu không có giá trong câu nói, để price = null
- QUAN TRỌNG: Nếu tên sản phẩm không khớp 100% với menu → matchedProductId = null, tạo sp mới

LƯU Ý TIẾNG VIỆT:
- "tô", "ly", "cái", "phần", "suất", "bịch", "lon", "chai" là đơn vị đếm (bỏ qua, không tính vào tên)
- "1 phở bò 35k" = quantity: 1, name: "Phở bò", price: 35000
- "2 bịch bánh poca 10k" = quantity: 2, name: "Bánh poca", price: 10000
- "nghìn", "ngàn", "k" = 1000 (VD: "35k" = 35000)
- "bài" có thể là "bàn" do nhận dạng giọng nói

TRẢ VỀ JSON THUẦN (không markdown):
{
  "items": [{"name": "Tên SP", "quantity": 1, "matchedProductId": null, "price": 35000}],
  "table": "2",
  "note": null,
  "newProducts": ["Tên SP mới"]
}`;

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: voiceText }
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API Error:', error);
      throw new Error('API request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        // Clean up common JSON issues from LLM
        let jsonStr = jsonMatch[0]
          .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
          .replace(/,\s*}/g, '}'); // Remove trailing commas in objects

        const result = JSON.parse(jsonStr) as AIParseResult;
        console.log('✅ Groq parsed:', result);
        return result;
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        throw parseErr;
      }
    }

    throw new Error('Invalid JSON');
  } catch (error) {
    console.error('AI Parse Error:', error);
    // Fallback: dùng RAG-filtered products cho simpleParser cũng
    return simpleParser(voiceText, relevantProducts.length > 0 ? relevantProducts : existingProducts);
  }
}

// Fallback parser
function simpleParser(text: string, products: Product[]): AIParseResult {
  const result: AIParseResult = {
    items: [],
    table: null,
    note: null,
    newProducts: [],
  };

  // Tìm số bàn (bàn/bài + số)
  const tableMatch = text.match(/(?:bàn|bài)\s*(?:số\s*)?(\d+)/i);
  if (tableMatch) {
    result.table = tableMatch[1];
  }

  // Pattern: (Quantity?) + Tên sản phẩm + giá (VD: "Phở bò 35k", "1 cà phê 20k")
  // Regex: 
  // (?:(\d+)\s+)? -> Group 1 (Optional): Quantity (digits followed by space)
  // ([a-zA-ZÀ-ỹ0-9\s]+?) -> Group 2: Name (allow digits inside name too, but non-greedy)
  // \s*(\d+)\s*(?:k|nghìn|ngàn) -> Group 3: Price
  const itemRegex = /(?:(\d+)\s+)?([a-zA-ZÀ-ỹ0-9\s]+?)\s*(\d+)\s*(?:k|nghìn|ngàn)/gi;
  let match;

  while ((match = itemRegex.exec(text)) !== null) {
    const quantity = match[1] ? parseInt(match[1]) : 1;
    const name = match[2].trim();
    let price = parseInt(match[3]) * 1000;

    if (name.length > 0) {
      const matchedProduct = products.find(p =>
        p.name.toLowerCase() === name.toLowerCase() ||
        p.aliases.some(a => a.toLowerCase() === name.toLowerCase())
      );

      result.items.push({
        name: matchedProduct?.name || name,
        quantity: quantity,
        matchedProductId: matchedProduct?.id || null,
        price: matchedProduct?.price || price,
      });

      if (!matchedProduct) {
        result.newProducts.push(name);
      }
    }
  }

  console.log('📝 Simple parser result:', result);
  return result;
}
