// Netlify Function: track-event
// Guarda eventos de analytics en Airtable

const headers = { 
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_ANALYTICS_TABLE = process.env.AIRTABLE_ANALYTICS_TABLE || 'Analytics';

  // Si no hay Airtable configurado, solo retornamos OK (los datos se guardan localmente)
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE) {
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ success: true, stored: 'local-only' }) 
    };
  }

  try {
    // Mapear payload a campos de Airtable
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

    const resp = await fetch(
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

    if (!resp.ok) {
      const err = await resp.json();
      console.error('Airtable error:', err);
      // No fallamos, solo logueamos
    }

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ success: true }) 
    };

  } catch (err) {
    console.error('Track event error:', err);
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ success: true, note: 'fallback' }) 
    };
  }
};
