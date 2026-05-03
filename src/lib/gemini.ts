import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY as string,
  dangerouslyAllowBrowser: true,
});

export async function askAI(prompt: string) {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are the MustangLink AI Assistant. You help students with ride sharing, finding lost items, social connections, and campus opportunities. Be concise, friendly, and helpful.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    return response.choices[0]?.message?.content ?? "No response";
  } catch (error: any) {
    console.error("Groq Error:", error);
    return `Error: ${error?.message ?? "Unknown error"}`;
  }
}
