// API Route: track-event (Vercel)
// Guarda eventos de analytics en Airtable

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_ANALYTICS_TABLE = process.env.AIRTABLE_ANALYTICS_TABLE || 'Analytics';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE) {
    return res.status(200).json({ success: true, stored: 'local-only' });
  }

  try {
    const payload = {
      fields: {
        'Visitor ID': body.visitorId || '',
        'Session ID': body.sessionId || '',
        'Event Type': body.eventType || '',
        'Event Data': JSON.stringify(body.eventData || {}),
        'Page': body.page || '',
        'Page Title': body.pageTitle || '',
        'Referrer': body.referrer || '',
        'Landing Page': body.landingPage || '',
        'Traffic Source': body.trafficSource || '',
        'Traffic Medium': body.trafficMedium || '',
        'Campaign': body.trafficCampaign || '',
        'Device Type': body.deviceType || '',
        'Screen Width': body.screenWidth || 0,
        'Timestamp': body.timestamp || new Date().toISOString(),
        'Session Duration': body.sessionDuration || 0,
        'Pageviews': body.pageviewsInSession || 1
      }
    };

    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_ANALYTICS_TABLE)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Track event error:', err);
    return res.status(200).json({ success: true, note: 'fallback' });
  }
}
