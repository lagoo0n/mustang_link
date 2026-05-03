import { supabase } from './supabase'

export interface PostSource {
  id: string;
  category: string;
  username: string;
  content: string;
}

/**
 * Calls the Supabase Edge Function which fetches posts from the DB
 * and sends them to Groq (free Llama model) to answer the question.
 */
export async function askAI(question: string): Promise<string> {
  const { answer } = await askAIWithContext(question)
  return answer
}

export async function askAIWithContext(
  question: string
): Promise<{ answer: string; sources: PostSource[] }> {
  // Fetch sources for UI display
  let sources: PostSource[] = []
  try {
    const { data } = await supabase
      .from('posts')
      .select('id, content, category, profiles(username)')
      .order('created_at', { ascending: false })
      .limit(20)

    sources = (data ?? []).map((p) => ({
      id: p.id,
      category: p.category,
      username: (p.profiles as { username?: string } | null)?.username ?? 'unknown',
      content: p.content,
    }))
  } catch (err) {
    console.error('Failed to fetch sources:', err)
  }

  // Call the edge function
  try {
    const { data, error } = await supabase.functions.invoke('ask-ai', {
      body: { question },
    })

    if (error) throw error

    return { answer: data.answer ?? "Sorry, I couldn't generate a response.", sources }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('Edge function error:', msg)
    return { answer: `Error: ${msg}`, sources }
  }
}

export type Category = 'rideshare' | 'lost' | 'social' | 'opportunity'
const VALID_CATEGORIES: Category[] = ['rideshare', 'lost', 'social', 'opportunity']

export async function suggestCategory(content: string): Promise<Category | null> {
  if (content.trim().length < 5) return null
  try {
    const { data, error } = await supabase.functions.invoke('ask-ai', {
      body: {
        question: `Given this campus post, return ONLY one word from this list: rideshare, lost, social, opportunity.\n\nPost: "${content}"\n\nCategory:`,
      },
    })
    if (error) throw error
    const raw = (data.answer ?? '').trim().toLowerCase().split(/\s/)[0] as Category
    return VALID_CATEGORIES.includes(raw) ? raw : null
  } catch {
    return null
  }
}
