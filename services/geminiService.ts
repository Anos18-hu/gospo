import { GoogleGenAI, Type } from "@google/genai";
import { BehaviorLog, BehaviorType, AnalysisResult } from '../types';

export const analyzeStudentBehavior = async (studentName: string, logs: BehaviorLog[], customContext?: string): Promise<AnalysisResult | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing!");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Sort logs by date descending for context
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentLogs = sortedLogs.slice(0, 20); // Analyze last 20 logs to save context

    const promptData = recentLogs.map(log => ({
      type: log.type,
      description: log.description,
      date: new Date(log.date).toLocaleDateString('ar-EG-u-nu-latn'),
      severity: log.severity || 'N/A'
    }));

    let prompt = `
      بصفتك خبيرًا تربويًا ونفسيًا مدرسيًا، قم بتحليل سجل سلوك الطالب "${studentName}".
      
      البيانات:
      ${JSON.stringify(promptData)}
    `;

    if (customContext && customContext.trim()) {
      prompt += `
      
      سياق إضافي أو أسئلة محددة من المعلم:
      "${customContext}"
      يرجى أخذ هذا السياق في الاعتبار بشكل خاص أثناء التحليل والإجابة على أي تساؤلات مضمنة فيه.
      `;
    }

    prompt += `
      المطلوب:
      1. ملخص موجز للنمط السلوكي للطالب.
      2. تحديد المحفزات المحتملة (Triggers) إذا وجدت (بناءً على التكرار أو التوقيت).
      3. اقتراح 3 استراتيجيات تربوية عملية للمعلم للتعامل مع هذا الطالب وتعديل سلوكه.

      يجب أن تكون الاستجابة بصيغة JSON فقط.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "ملخص السلوك" },
            triggers: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "قائمة المحفزات المحتملة"
            },
            strategies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "استراتيجيات مقترحة"
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    return null;

  } catch (error) {
    console.error("Error analyzing behavior:", error);
    return null;
  }
};

export const generateInterventionPlan = async (studentName: string, negativeBehavior: string): Promise<string> => {
    if (!process.env.API_KEY) {
      return "تعذر الاتصال بخدمة الذكاء الاصطناعي.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
        قم بإنشاء خطة تعديل سلوك موجزة للطالب "${studentName}" للتعامل مع السلوك السلبي التالي: "${negativeBehavior}".
        يجب أن تتضمن الخطة:
        1. الهدف السلوكي.
        2. إجراءات التعزيز (المكافآت).
        3. إجراءات التعامل مع السلوك عند حدوثه.
        
        اكتب الرد بتنسيق Markdown باللغة العربية.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "لم يتم إنشاء خطة.";
    } catch (error) {
        console.error("Error generating plan:", error);
        return "حدث خطأ أثناء إنشاء الخطة.";
    }
}