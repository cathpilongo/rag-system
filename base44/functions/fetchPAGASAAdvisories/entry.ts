import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PAGASA_URLS = [
  { url: 'https://www.pagasa.dost.gov.ph/weather/weather-advisory', type: 'advisory', hazard: 'All_Hazards' },
  { url: 'https://www.pagasa.dost.gov.ph/weather', type: 'daily_weather', hazard: 'All_Hazards' },
  { url: 'https://www.pagasa.dost.gov.ph/flood', type: 'flood', hazard: 'Flood' },
  { url: 'https://www.pagasa.dost.gov.ph/landslide', type: 'landslide', hazard: 'Landslide' },
];

async function fetchPageText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DRRMBot/1.0)' }
  });
  if (!res.ok) return null;
  const html = await res.text();
  // Strip HTML tags, collapse whitespace
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateChunkId(source, index) {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `PAGASA_AUTO_${source.toUpperCase()}_${date}_${index}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both scheduled (no user) and manual admin trigger
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch (_) {
      // Called from scheduler — no user context, treat as authorized
      isAdmin = true;
    }

    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const results = { fetched: 0, created: 0, skipped: 0, errors: [] };

    // Get existing auto-generated chunk IDs to avoid duplicates
    const existing = await base44.asServiceRole.entities.DRRMChunk.list('-created_date', 500);
    const existingAutoIds = new Set(
      existing
        .filter(c => c.chunk_id && c.chunk_id.startsWith('PAGASA_AUTO_'))
        .map(c => c.chunk_id)
    );

    // Today's date prefix for dedup
    const todayPrefix = `PAGASA_AUTO_`;

    for (const source of PAGASA_URLS) {
      try {
        const rawText = await fetchPageText(source.url);
        if (!rawText || rawText.length < 100) {
          results.errors.push(`No content from: ${source.url}`);
          continue;
        }

        results.fetched++;

        // Use LLM to extract and localize the advisory
        const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a DRRM (Disaster Risk Reduction and Management) content specialist for the Philippines. 

Extract disaster-relevant advisories from this PAGASA webpage content and create structured knowledge chunks for a Cebuano-English chatbot.

WEBPAGE CONTENT:
${rawText.substring(0, 4000)}

INSTRUCTIONS:
1. Extract ONLY actionable, disaster-relevant information (warnings, advisories, conditions).
2. If the page says "no advisory" or has no relevant content, return empty array.
3. For each chunk, create a localized Cebuano-English version that is simple and understandable to ordinary residents.
4. Keep localized_text concise (2-4 sentences max).
5. Determine the correct hazard type: Flood, Typhoon, Storm_Surge, Earthquake, Landslide, All_Hazards.
6. Determine phase: Before, During, After, or All_Phases.

Return a JSON array of chunks (max 3 per page):`,
          response_json_schema: {
            type: 'object',
            properties: {
              chunks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    original_text: { type: 'string' },
                    localized_text: { type: 'string' },
                    hazard_type: { type: 'string' },
                    phase: { type: 'string' },
                    format_type: { type: 'string' },
                    priority: { type: 'string' }
                  }
                }
              }
            }
          }
        });

        const chunks = llmResult?.chunks || [];
        if (chunks.length === 0) {
          results.skipped++;
          continue;
        }

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkId = generateChunkId(source.type, i + 1);

          // Check if similar chunk from today already exists
          const alreadyExists = [...existingAutoIds].some(id =>
            id.startsWith(`PAGASA_AUTO_${source.type.toUpperCase()}`) &&
            id.includes(new Date().toISOString().split('T')[0].replace(/-/g, ''))
          );

          if (alreadyExists) {
            results.skipped++;
            continue;
          }

          await base44.asServiceRole.entities.DRRMChunk.create({
            chunk_id: chunkId,
            source_type: 'PAGASA',
            agency_office: 'PAGASA - Philippine Atmospheric, Geophysical and Astronomical Services Administration',
            doc_title: `Auto-fetched PAGASA Advisory - ${new Date().toLocaleDateString('en-PH')}`,
            doc_year: new Date().getFullYear().toString(),
            hazard_type: chunk.hazard_type || source.hazard,
            phase: chunk.phase || 'All_Phases',
            original_text: chunk.original_text || '',
            localized_text: chunk.localized_text || '',
            format_type: chunk.format_type || 'warning',
            priority: chunk.priority || 'High',
            validation_status: 'Pending',
            source_url: source.url,
            date_accessed: new Date().toISOString().split('T')[0],
            notes: 'Auto-fetched by scheduled PAGASA scraper. Needs human review before approval.'
          });

          results.created++;
          existingAutoIds.add(chunkId);
        }

      } catch (err) {
        results.errors.push(`Error on ${source.url}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      message: `PAGASA fetch complete. Created: ${results.created}, Skipped: ${results.skipped}, Fetched pages: ${results.fetched}`,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});