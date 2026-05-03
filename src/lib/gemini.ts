import { supabase } from './supabase';

export interface PostSource {
  id: string;
  category: string;
  username: string;
  content: string;
}

export async function askAI(question: string): Promise<string> {
  const { answer } = await askAIWithContext(question);
  return answer;
}

export async function askAIWithContext(
  question: string,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{ answer: string; sources: PostSource[] }> {
  let sources: PostSource[] = [];

  try {
    const { data } = await supabase
      .from('posts')
      .select('id, content, category, profiles(username)')
      .order('created_at', { ascending: false })
      .limit(20);

    sources = (data ?? []).map(p => ({
      id: p.id,
      category: p.category,
      username: (p.profiles as { username?: string } | null)?.username ?? 'unknown',
      content: p.content,
    }));
  } catch (err) {
    console.error('Failed to fetch sources:', err);
  }

  try {
    const { data, error } = await supabase.functions.invoke('ask-ai', {
      body: {
        question,
        history,
        systemPrompt: `You are MustangLink AI, a helpful assistant for Cal Poly SLO students.

ABOUT CAL POLY SLO:
- Located in San Luis Obispo, California
- Known for "Learn by Doing" philosophy
- Popular majors: Engineering, Architecture, Agriculture, Business, Computer Science
- Campus landmarks: Kennedy Library, Recreation Center (RecCen), Julian A. McPhee University Union (UU), Dexter Lawn, Engineering Plaza
- Housing: on-campus dorms (Sierra Madre, Yosemite, Cerro Vista, Poly Canyon Village), off-campus areas (SLO downtown, Foothill, Los Osos)
- Dining: 19 Metro, Vista Grande, Avenue Cafe, Poly Eats
- Transportation: SLO Transit, RTA buses, Amtrak, SLO Regional Airport nearby
- Popular spots: Downtown SLO, Farmers Market (Thursday nights), Bubblegum Alley, Mission Plaza, Avila Beach, Pismo Beach, Morro Bay
- Campus orgs: ASI (student government), clubs via OrgSync, Greek life, club sports
- Academic calendar: quarter system (Fall/Winter/Spring/Summer)
- Key offices: Registrar, Financial Aid, Career Services, Health Center (Campus Health & Wellbeing), Dean of Students

ABOUT MUSTANGLINK:
- A student community app for Cal Poly SLO
- Categories: Ride Share (carpools to/from SLO), Lost & Found (missing items on campus), Social (events and meetups), Opportunities (jobs and internships)
- Users can post, reply, and attach photos

CURRENT POSTS FROM THE COMMUNITY:
${sources.map(s => `[${s.category}] @${s.username}: ${s.content}`).join('\n')}

Be concise, friendly, and helpful. If asked about something not related to Cal Poly or the app, politely redirect.`,
      },
    });

    if (error) throw error;

    return { answer: data.answer ?? "Sorry, I couldn't generate a response.", sources };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('Edge function error:', msg);
    return { answer: `Error: ${msg}`, sources };
  }
}
