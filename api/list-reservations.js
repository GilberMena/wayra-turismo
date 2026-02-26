module.exports = async function handler(req, res) {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
    const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'Reservas';

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE) {
        return res.status(500).json({ error: 'Airtable not configured.' });
    }

    try {
        const resp = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?sort%5B0%5D%5Bfield%5D=created_at&sort%5B0%5D%5Bdirection%5D=desc`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
        });
        const json = await resp.json();
        return res.status(200).json(json);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch reservations' });
    }
}
