import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning mock description.");
    return "توضیحات محصول به صورت خودکار ایجاد شد. لطفا کلید API را تنظیم کنید.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a compelling and professional product description in Persian (Farsi) for a product named "${productName}" in the category "${category}". Keep it under 100 words. Highlight key features likely associated with this type of product.`,
    });
    
    return response.text || "خطا در تولید متن.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "خطا در ارتباط با هوش مصنوعی.";
  }
};

export const suggestReply = async (userMessage: string): Promise<string> => {
    if (!process.env.API_KEY) return "پاسخ پیشنهادی در دسترس نیست.";
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a support agent for an online store. A customer sent this message: "${userMessage}". Draft a polite, professional, and helpful reply in Persian.`,
        });
        return response.text || "";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "خطا در تولید پاسخ.";
    }
}