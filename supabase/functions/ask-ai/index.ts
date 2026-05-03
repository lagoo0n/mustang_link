import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question } = await req.json()

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Initialize Supabase with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch recent posts with author usernames
    const { data: posts, error } = await supabase
      .from('posts')
      .select('content, category, created_at, profiles(username)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // 3. Format posts into readable context string
    const context = (posts ?? [])
      .map((p: { category: string; profiles: { username?: string } | null; content: string }, i: number) =>
        `[${i + 1}] Category: ${p.category} | @${p.profiles?.username ?? 'unknown'}: ${p.content}`
      )
      .join('\n')

    const contextBlock = context.length > 0
      ? context
      : 'No campus posts available right now.'

    // 4. Call Groq (free tier — llama-3.1-8b-instant)
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are the MustangLink AI Assistant. You help students with ride sharing, finding lost items, social connections, and campus opportunities. Be concise, friendly, and helpful. Here are the most recent campus posts:\n\n${contextBlock}`,
          },
          {
            role: 'user',
            content: question,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    const groqData = await groqRes.json()

    if (!groqRes.ok) {
      throw new Error(groqData.error?.message ?? `Groq error ${groqRes.status}`)
    }

    const answer = groqData.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response."

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
