// Netlify Function: get-stats
// Calcula estadísticas desde las reservas almacenadas en Airtable

const headers = { 'Content-Type': 'application/json' };

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'Reservas';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'No backend configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE.' }) 
    };
  }

  try {
    // Fetch all records from Airtable
    const resp = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?view=Grid%20view`,
      { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, ...headers } }
    );

    const json = await resp.json();
    if (!resp.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Airtable error', details: json }) };
    }

    const records = json.records || [];
    
    // Calculate statistics
    const stats = calculateStats(records);

    return { 
      statusCode: 200, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, stats }) 
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Request failed', details: String(err) }) };
  }
};

function calculateStats(records) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  // Initialize stats object
  const stats = {
    totalReservations: records.length,
    totalGuests: 0,
    averageGuestsPerReservation: 0,
    planBreakdown: {},
    monthlyData: {},
    recentReservations: [],
    thisMonthReservations: 0,
    thisMonthGuests: 0,
    topPlans: [],
    guestsTrend: []
  };

  // Process each record
  records.forEach(rec => {
    const fields = rec.fields || {};
    const guests = parseInt(fields['Personas'] || '0', 10) || 0;
    const plan = fields['Plan'] || 'Sin especificar';
    const createdAt = new Date(rec.createdTime || fields['created_at'] || '');
    const startDate = fields['Fecha Inicio'] ? new Date(fields['Fecha Inicio']) : null;
    
    // Total guests
    stats.totalGuests += guests;

    // Plan breakdown
    if (!stats.planBreakdown[plan]) {
      stats.planBreakdown[plan] = { count: 0, guests: 0 };
    }
    stats.planBreakdown[plan].count++;
    stats.planBreakdown[plan].guests += guests;

    // Monthly data (by travel date if available, otherwise by creation date)
    const dateForMonth = startDate || createdAt;
    if (dateForMonth && !isNaN(dateForMonth.getTime())) {
      const monthKey = `${dateForMonth.getFullYear()}-${String(dateForMonth.getMonth() + 1).padStart(2, '0')}`;
      if (!stats.monthlyData[monthKey]) {
        stats.monthlyData[monthKey] = { reservations: 0, guests: 0 };
      }
      stats.monthlyData[monthKey].reservations++;
      stats.monthlyData[monthKey].guests += guests;

      // This month stats
      if (dateForMonth.getMonth() === thisMonth && dateForMonth.getFullYear() === thisYear) {
        stats.thisMonthReservations++;
        stats.thisMonthGuests += guests;
      }
    }

    // Recent reservations (last 5)
    stats.recentReservations.push({
      plan,
      guests,
      name: fields['Nombre'] || 'N/A',
      date: createdAt.toISOString(),
      startDate: fields['Fecha Inicio'] || '',
      endDate: fields['Fecha Fin'] || ''
    });
  });

  // Calculate averages
  if (stats.totalReservations > 0) {
    stats.averageGuestsPerReservation = Math.round((stats.totalGuests / stats.totalReservations) * 10) / 10;
  }

  // Sort and limit recent reservations
  stats.recentReservations.sort((a, b) => new Date(b.date) - new Date(a.date));
  stats.recentReservations = stats.recentReservations.slice(0, 5);

  // Top plans
  stats.topPlans = Object.entries(stats.planBreakdown)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Monthly trend (last 6 months)
  const trendMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(thisYear, thisMonth - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    trendMonths.push({
      month: key,
      label: monthNames[d.getMonth()],
      reservations: stats.monthlyData[key]?.reservations || 0,
      guests: stats.monthlyData[key]?.guests || 0
    });
  }
  stats.guestsTrend = trendMonths;

  return stats;
}
