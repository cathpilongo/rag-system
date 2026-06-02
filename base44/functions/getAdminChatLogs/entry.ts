import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    let allLogs = [];
    let skip = 0;
    const batchSize = 200;
    
    while (true) {
      const batch = await base44.asServiceRole.entities.ChatLog.list('-created_date', batchSize, skip);
      if (!batch || batch.length === 0) break;
      allLogs = allLogs.concat(batch);
      if (batch.length < batchSize) break;
      skip += batchSize;
    }

    return Response.json({ logs: allLogs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});