// AI Discussion Analysis, layered:
// 1. Rule-based summary always runs first — free, instant, offline, never fails.
// 2. If ANTHROPIC_API_KEY is set, we attempt a real Claude call to produce a
//    sharper summary. If that call fails for any reason (no network, bad key,
//    rate limit), we silently keep the rule-based result instead of erroring —
//    a live demo should never break because of an external API hiccup.

function ruleBasedSummary(posts, flags) {
  if (posts.length === 0 && flags.length === 0) {
    return {
      mostDiscussedConcern: null,
      affectedCount: 0,
      suggestedAction: 'No discussion or flags yet — nothing to summarize.',
      source: 'rule-based',
    };
  }

  // Group discussion posts by category, find the largest group.
  const byCategory = {};
  for (const p of posts) {
    (byCategory[p.category] ||= []).push(p);
  }
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)[0];

  // Flags are the strongest signal of a real concern — prioritize them if present.
  let mostDiscussedConcern;
  let suggestedAction;

  if (flags.length > 0) {
    // Group flags by milestone, find the most-flagged one.
    const byMilestone = {};
    for (const f of flags) {
      (byMilestone[f.milestone_title] ||= []).push(f.text);
    }
    const [milestoneTitle, texts] = Object.entries(byMilestone).sort((a, b) => b[1].length - a[1].length)[0];
    mostDiscussedConcern = `${milestoneTitle} — "${texts[0]}"`;
    suggestedAction =
      texts.length > 1
        ? `Multiple residents have flagged this milestone — schedule a follow-up site inspection.`
        : `Schedule a technical inspection to verify the flagged concern.`;
  } else if (topCategory) {
    mostDiscussedConcern = `Most activity is in the "${topCategory[0]}" category (${topCategory[1].length} post${topCategory[1].length > 1 ? 's' : ''})`;
    suggestedAction = 'Authority or Engineer should review this thread and post an update.';
  }

  return {
    mostDiscussedConcern,
    affectedCount: flags.length,
    suggestedAction,
    source: 'rule-based',
  };
}

async function tryClaudeSummary(posts, flags) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const transcript = [
    ...posts.map((p) => `[${p.category}] ${p.author_name}: ${p.content}`),
    ...flags.map((f) => `[flag on "${f.milestone_title}"]: ${f.text}`),
  ].join('\n');

  if (!transcript.trim()) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Here is a project discussion + citizen flag transcript for a Kopargaon infrastructure project:\n\n${transcript}\n\nRespond ONLY with JSON, no markdown, in this exact shape: {"mostDiscussedConcern": "...", "affectedCount": <number>, "suggestedAction": "..."}. Keep each field under 25 words.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000), // don't hang a live demo waiting on a slow response
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.find((b) => b.type === 'text')?.text;
    if (!text) return null;

    const parsed = JSON.parse(text.trim());
    return { ...parsed, source: 'claude' };
  } catch {
    return null; // any failure — network, timeout, bad JSON — falls back silently
  }
}

export async function summarizeDiscussion(posts, flags) {
  const fallback = ruleBasedSummary(posts, flags);
  const claudeResult = await tryClaudeSummary(posts, flags);
  return claudeResult || fallback;
}
