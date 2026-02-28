// API Route: get-stats (Vercel/Node.js)
// Calcula estadísticas desde las reservas almacenadas en Airtable

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'Reservas';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE) {
    return res.status(500).json({ error: 'No backend configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE.' });
  }

  try {
    const resp = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?view=Grid%20view`,
      { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const json = await resp.json();
    if (!resp.ok) {
      return res.status(500).json({ error: 'Airtable error', details: json });
    }

    const records = json.records || [];
    const stats = calculateStats(records);

    return res.status(200).json({ success: true, stats });

  } catch (err) {
    return res.status(500).json({ error: 'Request failed', details: String(err) });
  }
}

function calculateStats(records) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
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

  records.forEach(rec => {
    const fields = rec.fields || {};
    const guests = parseInt(fields['Personas'] || '0', 10) || 0;
    const plan = fields['Plan'] || 'Sin especificar';
    const createdAt = new Date(rec.createdTime || fields['created_at'] || '');
    const startDate = fields['Fecha Inicio'] ? new Date(fields['Fecha Inicio']) : null;
    
    stats.totalGuests += guests;

    if (!stats.planBreakdown[plan]) {
      stats.planBreakdown[plan] = { count: 0, guests: 0 };
    }
    stats.planBreakdown[plan].count++;
    stats.planBreakdown[plan].guests += guests;

    const dateForMonth = startDate || createdAt;
    if (dateForMonth && !isNaN(dateForMonth.getTime())) {
      const monthKey = `${dateForMonth.getFullYear()}-${String(dateForMonth.getMonth() + 1).padStart(2, '0')}`;
      if (!stats.monthlyData[monthKey]) {
        stats.monthlyData[monthKey] = { reservations: 0, guests: 0 };
      }
      stats.monthlyData[monthKey].reservations++;
      stats.monthlyData[monthKey].guests += guests;

      if (dateForMonth.getMonth() === thisMonth && dateForMonth.getFullYear() === thisYear) {
        stats.thisMonthReservations++;
        stats.thisMonthGuests += guests;
      }
    }

    stats.recentReservations.push({
      plan,
      guests,
      name: fields['Nombre'] || 'N/A',
      date: createdAt.toISOString(),
      startDate: fields['Fecha Inicio'] || '',
      endDate: fields['Fecha Fin'] || ''
    });
  });

  if (stats.totalReservations > 0) {
    stats.averageGuestsPerReservation = Math.round((stats.totalGuests / stats.totalReservations) * 10) / 10;
  }

  stats.recentReservations.sort((a, b) => new Date(b.date) - new Date(a.date));
  stats.recentReservations = stats.recentReservations.slice(0, 5);

  stats.topPlans = Object.entries(stats.planBreakdown)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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
