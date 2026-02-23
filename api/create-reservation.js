export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
    const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'Reservas';

    if (AIRTABLE_API_KEY && AIRTABLE_BASE) {
        const payload = {
            fields: {
                'Plan': body.plan || '',
                'Precio': body.price || '',
                'Nombre': body.name || '',
                'Telefono': body.phone || '',
                'Email': body.email || '',
                'Fecha Inicio': body.start || '',
                'Fecha Fin': body.end || '',
                'Personas': body.guests || '',
                'Comentarios': body.comments || ''
            }
        };

        try {
            const resp = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                },
                body: JSON.stringify(payload)
            });
            const json = await resp.json();
            if (!resp.ok) {
                return res.status(500).json({ error: 'Airtable error', details: json });
            }

            // Trigger email (background-ish in Vercel)
            const siteUrl = process.env.SITE_URL || '';
            if (siteUrl) {
                fetch(`${siteUrl.replace(/\/$/, '')}/api/send-confirmation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ record: json, reservation: body })
                }).catch(e => console.error('Error triggering email:', e));
            }

            return res.status(200).json({ success: true, record: json });
        } catch (err) {
            return res.status(500).json({ error: 'Request failed', details: String(err) });
        }
    }

    return res.status(500).json({ error: 'No backend configured.' });
}
