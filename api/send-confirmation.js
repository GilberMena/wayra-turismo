export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body;
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!SENDGRID_API_KEY || !FROM_EMAIL) {
        return res.status(500).json({ error: 'SendGrid not configured.' });
    }

    const reservation = body.reservation || body;
    const plan = reservation.plan || '';

    const customerMsg = {
        personalizations: [{ to: [{ email: reservation.email }], subject: `Confirmación de reserva - ${plan || 'ViveWayra'}` }],
        from: { email: FROM_EMAIL },
        content: [{ type: 'text/plain', value: `Hola ${reservation.name},\n\nGracias por reservar ${plan}.\n\nFecha inicio: ${reservation.start}\nFecha fin: ${reservation.end}\nPersonas: ${reservation.guests}\n\nNos pondremos en contacto pronto.\n\nViveWayra` }]
    };

    const adminMsg = {
        personalizations: [{ to: [{ email: ADMIN_EMAIL || FROM_EMAIL }], subject: `Nueva reserva: ${plan}` }],
        from: { email: FROM_EMAIL },
        content: [{ type: 'text/plain', value: `Nueva reserva recibida:\n\nPlan: ${plan}\nNombre: ${reservation.name}\nEmail: ${reservation.email}\nTel: ${reservation.phone}` }]
    };

    try {
        await Promise.all([
            fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(customerMsg)
            }),
            fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(adminMsg)
            })
        ]);
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to send emails', details: String(err) });
    }
}
