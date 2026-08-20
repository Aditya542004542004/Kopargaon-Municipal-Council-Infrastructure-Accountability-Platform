import { pool } from '../lib/db.js';

function ruleBasedSummary(posts, flags) {
  if (posts.length === 0 && flags.length === 0) {
    return {
      mostDiscussedConcern: null,
      affectedCount: 0,
      suggestedAction: 'No discussion or flags yet — nothing to summarize.',
      source: 'rule-based',
    };
  }

  const byCategory = {};
  for (const p of posts) {
    (byCategory[p.category] ||= []).push(p);
  }
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)[0];

  let mostDiscussedConcern;
  let suggestedAction;

  if (flags.length > 0) {
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

async function tryGeminiSummary(posts, flags) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const transcript = [
    ...posts.map((p) => `[${p.category}] ${p.author_name || p.user_name || 'Citizen'}: ${p.content}`),
    ...flags.map((f) => `[flag on "${f.milestone_title || 'milestone'}"]: ${f.text}`),
  ].join('\n');

  if (!transcript.trim()) return null;

  const models = ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Discussion AI] Requesting Gemini via ${model} (attempt ${attempt})...`);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Here is a project discussion + citizen flag transcript for a Kopargaon infrastructure project:\n\n${transcript}\n\nRespond ONLY with JSON, no markdown, in this exact shape: {"mostDiscussedConcern": "...", "affectedCount": <number>, "suggestedAction": "..."}. Keep each field under 25 words.`,
                    },
                  ],
                },
              ],
            }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (res.status === 503 || res.status === 429) {
          console.warn(`[Discussion AI] ${model} status ${res.status}, retrying/switching model...`);
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[Discussion AI] ${model} HTTP Error ${res.status}`, errText);
          break;
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) break;

        const cleaned = text.trim().replace(/^```json\s*|```$/g, '');
        const parsed = JSON.parse(cleaned);
        console.log(`[Discussion AI] ✅ Successfully generated fresh AI summary via ${model}!`);
        return { ...parsed, source: 'gemini' };

      } catch (err) {
        console.error(`[Discussion AI] Attempt ${attempt} failed on ${model}:`, err.message);
      }
    }
  }

  return null;
}

export async function summarizeDiscussion(posts = [], flags = [], projectId = 'default') {
  const latestPostTs = posts.reduce((max, p) => Math.max(max, new Date(p.created_at || 0).getTime()), 0);
  const latestFlagTs = flags.reduce((max, f) => Math.max(max, new Date(f.flagged_at || f.created_at || 0).getTime()), 0);
  const currentFingerprint = `posts:${posts.length}_flags:${flags.length}_lp:${latestPostTs}_lf:${latestFlagTs}`;

  // 1. Fetch latest stored summary from Database for this project
  let dbStoredSummary = null;
  let dbFingerprint = null;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM project_ai_summaries WHERE project_id = ?`,
      [projectId]
    );
    if (rows.length > 0) {
      const row = rows[0];
      dbFingerprint = row.fingerprint;
      dbStoredSummary = {
        mostDiscussedConcern: row.most_discussed_concern,
        affectedCount: row.affected_count,
        suggestedAction: row.suggested_action,
        source: row.source || 'gemini',
      };
    }
  } catch (err) {
    console.warn('[Discussion AI] DB Lookup Notice (Run SQL table creation if missing):', err.message);
  }

  // 2. IF CONTENT HAS NOT CHANGED: Serve stored Gemini summary from Database instantly (0ms)
  if (dbStoredSummary && dbFingerprint === currentFingerprint && dbStoredSummary.source === 'gemini') {
    console.log(`[Discussion AI] Content unchanged for ${projectId}. Serving stored Gemini summary from Database (0ms).`);
    return dbStoredSummary;
  }

  console.log(`[Discussion AI] Content changed for ${projectId}. Requesting fresh Gemini API summary...`);

  // 3. TRY FRESH GEMINI API CALL
  const freshGemini = await tryGeminiSummary(posts, flags);

  if (freshGemini) {
    // Save fresh Gemini summary into MySQL Database
    try {
      await pool.query(
        `INSERT INTO project_ai_summaries (project_id, most_discussed_concern, affected_count, suggested_action, source, fingerprint)
         VALUES (?, ?, ?, ?, 'gemini', ?)
         ON DUPLICATE KEY UPDATE 
           most_discussed_concern = VALUES(most_discussed_concern),
           affected_count = VALUES(affected_count),
           suggested_action = VALUES(suggested_action),
           source = VALUES(source),
           fingerprint = VALUES(fingerprint)`,
        [
          projectId,
          freshGemini.mostDiscussedConcern,
          freshGemini.affectedCount,
          freshGemini.suggestedAction,
          currentFingerprint
        ]
      );
      console.log(`[Discussion AI] ✅ Saved fresh Gemini summary to MySQL Database for project ${projectId}.`);
    } catch (dbErr) {
      console.error('[Discussion AI] Failed to save Gemini summary to DB:', dbErr.message);
    }

    return freshGemini;
  }

  // 4. IF GEMINI API FAILS / TIMEOUTS / 429: SERVE LATEST STORED GEMINI SUMMARY FROM DB!
  if (dbStoredSummary && dbStoredSummary.source === 'gemini') {
    console.warn(`[Discussion AI] Gemini API call unanswered. Serving latest stored Gemini summary from Database!`);
    return dbStoredSummary;
  }

  // 5. RULE-BASED ONLY WHEN NO PREVIOUS GEMINI SUMMARY IS PRESENT IN DB & API FAILED
  console.log(`[Discussion AI] No previous Gemini summary in DB & API call failed. Serving rule-based summary.`);
  return ruleBasedSummary(posts, flags);
}