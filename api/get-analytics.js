// API Route: get-analytics (Vercel)
// Obtiene estadísticas de analytics desde Airtable

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_ANALYTICS_TABLE = process.env.AIRTABLE_ANALYTICS_TABLE || 'Analytics';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE) {
    return res.status(200).json({ success: true, analytics: getEmptyAnalytics(), source: 'no-backend' });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filterDate = thirtyDaysAgo.toISOString().split('T')[0];

    let allRecords = [];
    let offset = null;

    do {
      const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_ANALYTICS_TABLE)}`);
      url.searchParams.set('filterByFormula', `IS_AFTER({Timestamp}, '${filterDate}')`);
      url.searchParams.set('pageSize', '100');
      if (offset) url.searchParams.set('offset', offset);

      const resp = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
      });

      if (!resp.ok) break;

      const json = await resp.json();
      allRecords = allRecords.concat(json.records || []);
      offset = json.offset;
    } while (offset);

    const analytics = calculateAnalytics(allRecords);
    return res.status(200).json({ success: true, analytics });

  } catch (err) {
    return res.status(500).json({ error: 'Request failed', details: String(err) });
  }
}

function getEmptyAnalytics() {
  return {
    summary: { uniqueVisitors: 0, totalSessions: 0, totalPageviews: 0, avgSessionDuration: 0, bounceRate: 0 },
    funnel: { visits: 0, planViews: 0, reserveClicks: 0, formSubmits: 0, whatsappClicks: 0 },
    trafficSources: [],
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    topPages: [],
    dailyVisits: [],
    conversionRate: 0
  };
}

function calculateAnalytics(records) {
  const analytics = {
    summary: { uniqueVisitors: 0, totalSessions: 0, totalPageviews: 0, avgSessionDuration: 0, bounceRate: 0 },
    funnel: { visits: 0, planViews: 0, reserveClicks: 0, formSubmits: 0, whatsappClicks: 0 },
    trafficSources: {},
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    topPages: {},
    dailyVisits: {},
    hourlyActivity: Array(24).fill(0),
    conversionRate: 0
  };

  const visitors = new Set();
  const sessions = new Set();
  const bounceSessions = new Map();
  let totalDuration = 0;
  let durationCount = 0;

  records.forEach(rec => {
    const f = rec.fields || {};
    const eventType = f['Event Type'] || '';
    const visitorId = f['Visitor ID'] || '';
    const sessionId = f['Session ID'] || '';
    const page = f['Page'] || '';
    const source = f['Traffic Source'] || 'direct';
    const device = f['Device Type'] || 'desktop';
    const timestamp = f['Timestamp'] ? new Date(f['Timestamp']) : null;
    const duration = parseInt(f['Session Duration'] || '0', 10);

    if (visitorId) visitors.add(visitorId);
    if (sessionId) sessions.add(sessionId);

    if (sessionId && eventType === 'pageview') {
      bounceSessions.set(sessionId, (bounceSessions.get(sessionId) || 0) + 1);
    }

    if (duration > 0 && duration < 3600000) {
      totalDuration += duration;
      durationCount++;
    }

    switch (eventType) {
      case 'pageview': analytics.funnel.visits++; break;
      case 'plan_view': analytics.funnel.planViews++; break;
      case 'reserve_click': analytics.funnel.reserveClicks++; break;
      case 'form_submit': analytics.funnel.formSubmits++; break;
      case 'whatsapp_click': analytics.funnel.whatsappClicks++; break;
    }

    if (eventType === 'pageview') {
      if (!analytics.trafficSources[source]) {
        analytics.trafficSources[source] = { visits: 0, sessions: new Set() };
      }
      analytics.trafficSources[source].visits++;
      if (sessionId) analytics.trafficSources[source].sessions.add(sessionId);
    }

    if (eventType === 'pageview' && device) {
      const deviceKey = device.toLowerCase();
      if (analytics.deviceBreakdown[deviceKey] !== undefined) {
        analytics.deviceBreakdown[deviceKey]++;
      }
    }

    if (eventType === 'pageview' && page) {
      analytics.topPages[page] = (analytics.topPages[page] || 0) + 1;
    }

    if (timestamp && eventType === 'pageview') {
      const dateKey = timestamp.toISOString().split('T')[0];
      if (!analytics.dailyVisits[dateKey]) {
        analytics.dailyVisits[dateKey] = { pageviews: 0, visitors: new Set() };
      }
      analytics.dailyVisits[dateKey].pageviews++;
      if (visitorId) analytics.dailyVisits[dateKey].visitors.add(visitorId);
      analytics.hourlyActivity[timestamp.getHours()]++;
    }
  });

  analytics.summary.uniqueVisitors = visitors.size;
  analytics.summary.totalSessions = sessions.size;
  analytics.summary.totalPageviews = analytics.funnel.visits;
  analytics.summary.avgSessionDuration = durationCount > 0 ? Math.round(totalDuration / durationCount / 1000) : 0;

  let bounces = 0;
  bounceSessions.forEach(count => { if (count === 1) bounces++; });
  analytics.summary.bounceRate = sessions.size > 0 ? Math.round((bounces / sessions.size) * 100) : 0;

  const conversions = analytics.funnel.formSubmits + analytics.funnel.whatsappClicks;
  analytics.conversionRate = visitors.size > 0 ? Math.round((conversions / visitors.size) * 1000) / 10 : 0;

  analytics.trafficSources = Object.entries(analytics.trafficSources)
    .map(([source, data]) => ({ source, visits: data.visits, sessions: data.sessions.size }))
    .sort((a, b) => b.visits - a.visits).slice(0, 10);

  analytics.topPages = Object.entries(analytics.topPages)
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views).slice(0, 10);

  const dailyData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayData = analytics.dailyVisits[key] || { pageviews: 0, visitors: new Set() };
    dailyData.push({
      date: key,
      label: d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
      pageviews: dayData.pageviews,
      visitors: dayData.visitors.size || 0
    });
  }
  analytics.dailyVisits = dailyData;

  return analytics;
}
