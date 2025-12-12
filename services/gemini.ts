import { GoogleGenAI } from "@google/genai";
import { StoreData } from "../types";

// NOTE: API Key must be in process.env.API_KEY
// In a real deployed app, handle this securely.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const askStoreAssistant = async (question: string, data: StoreData): Promise<string> => {
  try {
    // We summarize data to save tokens and context window, though Flash handles large context well.
    const summary = {
      totalProducts: data.products.length,
      lowStockProducts: data.products.filter(p => p.stock <= p.minStock).map(p => p.name),
      totalCustomers: data.partners.filter(p => p.type === 'CUSTOMER').length,
      totalDebtFromCustomers: data.partners
        .filter(p => p.type === 'CUSTOMER')
        .reduce((sum, p) => sum + Math.max(0, p.balance), 0),
      recentTransactions: data.transactions.slice(0, 50), // Last 50 transactions
    };

    const systemPrompt = `
      Sen "ZiyoBook" kitob do'konining aqlli yordamchisisan.
      Quyidagi do'kon ma'lumotlari asosida foydalanuvchi savoliga o'zbek tilida javob ber.
      
      Ma'lumotlar:
      ${JSON.stringify(summary, null, 2)}
      
      Vazifalar:
      1. Savdo tahlili.
      2. Kam qolgan kitoblar bo'yicha maslahat.
      3. Qarzlar bo'yicha eslatma.
      
      Javobing qisqa, aniq va do'stona bo'lsin.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: question }] }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response
      }
    });

    return response.text || "Uzr, ma'lumotlarni tahlil qila olmadim.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Tizimda xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.";
  }
};