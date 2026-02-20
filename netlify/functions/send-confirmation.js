// Netlify Function: send-confirmation
// Env vars expected (Netlify Site):
// SENDGRID_API_KEY - API key for SendGrid
// FROM_EMAIL - sender email (e.g., reservas@tuagencia.co)
// ADMIN_EMAIL - email to notify the admin/owner (optional)

const headers = { 'Content-Type': 'application/json' };

exports.handler = async function(event, context){
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try{ body = JSON.parse(event.body); }catch(e){
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  if(!SENDGRID_API_KEY || !FROM_EMAIL){
    return { statusCode: 500, body: JSON.stringify({ error: 'SendGrid not configured. Set SENDGRID_API_KEY and FROM_EMAIL.' }) };
  }

  // Accept either direct reservation payload or wrapped in { reservation, record }
  const reservation = body.reservation || body;
  const record = body.record || null;

  const customerEmail = reservation.email;
  const customerName = reservation.name || '';
  const plan = reservation.plan || '';
  const start = reservation.start || '';
  const end = reservation.end || '';
  const guests = reservation.guests || '';
  const comments = reservation.comments || '';

  // Prepare messages
  const customerMsg = {
    personalizations: [ { to: [ { email: customerEmail } ] , subject: `Confirmación de reserva - ${plan || 'ViveWayra'}` } ],
    from: { email: FROM_EMAIL },
    content: [ { type: 'text/plain', value: `Hola ${customerName},\n\nGracias por reservar ${plan}.\n\nDetalles:\n- Fecha inicio: ${start}\n- Fecha fin: ${end}\n- Personas: ${guests}\n\nComentarios: ${comments || 'Ninguno'}\n\nNos pondremos en contacto pronto para confirmar y coordinar el pago.\n\nSaludos,\nViveWayra` } ]
  };

  const adminTo = ADMIN_EMAIL || FROM_EMAIL;
  const adminMsg = {
    personalizations: [ { to: [ { email: adminTo } ], subject: `Nueva reserva recibida - ${plan}` } ],
    from: { email: FROM_EMAIL },
    content: [ { type: 'text/plain', value: `Nueva reserva:\n\nPlan: ${plan}\nNombre: ${customerName}\nEmail: ${customerEmail}\nTeléfono: ${reservation.phone || ''}\nFecha inicio: ${start}\nFecha fin: ${end}\nPersonas: ${guests}\nComentarios: ${comments}\nAirtable record: ${record && record.id ? record.id : 'N/A'}` } ]
  };

  try{
    // Send to customer (if provided)
    if(customerEmail){
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: Object.assign({ 'Authorization': `Bearer ${SENDGRID_API_KEY}` }, headers),
        body: JSON.stringify(customerMsg)
      });
    }

    // Send to admin
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: Object.assign({ 'Authorization': `Bearer ${SENDGRID_API_KEY}` }, headers),
      body: JSON.stringify(adminMsg)
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }catch(err){
    console.error('SendGrid error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send emails', details: String(err) }) };
  }
};
