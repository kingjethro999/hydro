import { getOpenRouterApiKey } from './secure';

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface AICalorieResponse {
  calories: number;
  success: boolean;
  error?: string;
}

class AIService {
  /**
   * Get calories for a custom food item using AI
   */
  async getCalories(foodDescription: string): Promise<AICalorieResponse> {
    try {
      console.log('Getting AI calories for:', foodDescription);

      // Get decrypted API key
      const apiKey = getOpenRouterApiKey();

      const prompt = `I ate ${foodDescription}. Return only the calories as a whole number, either 10, 144, no 12.5 - round it up and return a single number. Strictly return only the number of calories.`;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-chat-v3.1:free",
          "messages": [
            {
              "role": "user",
              "content": prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Extract number from response
      const caloriesMatch = aiResponse.match(/\d+/);
      if (!caloriesMatch) {
        throw new Error('Could not extract calories from AI response');
      }

      const calories = parseInt(caloriesMatch[0], 10);

      console.log('AI calories response:', calories);

      return {
        calories,
        success: true
      };

    } catch (error) {
      console.error('AI service error:', error);
      return {
        calories: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const aiService = new AIService();
