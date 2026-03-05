import * as FileSystem from 'expo-file-system';
import { GEMINI_API_KEY } from '../config/keys';
import { Product } from '../types';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface ImageOcrResult {
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  table: string | null;
  note: string | null;
}

/**
 * Sử dụng Google Gemini Vision API (MIỄN PHÍ) để đọc hóa đơn từ ảnh
 */
export async function extractOrderFromImage(
  imageUri: string,
  existingProducts: Product[]
): Promise<ImageOcrResult> {
  console.log('📸 Extracting order from image with Gemini Vision...');

  try {
    // Convert image to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64' as any,
    });

    // Prepare product list for context
    const productList = existingProducts.map(p => ({
      name: p.name,
      price: p.price,
    }));

    const prompt = `Bạn là AI OCR chuyên đọc hóa đơn bán hàng Việt Nam.

NHIỆM VỤ:
- Đọc ảnh hóa đơn/tin nhắn chốt đơn
- Trích xuất: tên món, số lượng, giá
- Tìm số bàn nếu có

DANH SÁCH SẢN PHẨM CÓ SẴN (tham khảo):
${JSON.stringify(productList, null, 2)}

QUY TẮC:
- Ưu tiên giá từ ảnh, không tự động thay đổi
- Nếu không thấy giá, để price = 0
- Số lượng mặc định = 1 nếu không rõ
- Tìm "bàn", "table", "phòng" để lấy số bàn

TRẢ VỀ JSON THUẦN (không markdown):
{
  "items": [{"name": "Tên món", "quantity": 1, "price": 35000}],
  "table": "2",
  "note": null
}`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini Vision API Error:', error);
      throw new Error('Không thể đọc ảnh. Vui lòng thử lại.');
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Không nhận được kết quả từ AI');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let jsonStr = jsonMatch[0]
          .replace(/,\s*]/g, ']')
          .replace(/,\s*}/g, '}');

        const result = JSON.parse(jsonStr) as ImageOcrResult;
        console.log('✅ Gemini Vision parsed:', result);
        return result;
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        throw new Error('Không thể phân tích kết quả');
      }
    }

    throw new Error('Không tìm thấy thông tin đơn hàng trong ảnh');
  } catch (error: any) {
    console.error('Image OCR Error:', error);
    throw error;
  }
}
