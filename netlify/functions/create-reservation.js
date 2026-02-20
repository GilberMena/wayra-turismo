// Netlify Function: create-reservation
// Backend para almacenar reservas en Airtable (opcional).
// Requiere configurar variables de entorno en Netlify:
// AIRTABLE_API_KEY, AIRTABLE_BASE, AIRTABLE_TABLE

const headers = {
  'Content-Type': 'application/json'
};

exports.handler = async function(event, context) {
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try{ body = JSON.parse(event.body); }catch(e){
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'Reservas';

  if(AIRTABLE_API_KEY && AIRTABLE_BASE){
    // Map payload to Airtable fields
    const payload = { fields: {
      'Plan': body.plan || '',
      'Precio': body.price || '',
      'Nombre': body.name || '',
      'Telefono': body.phone || '',
      'Email': body.email || '',
      'Fecha Inicio': body.start || '',
      'Fecha Fin': body.end || '',
      'Personas': body.guests || '',
      'Comentarios': body.comments || ''
    }};

    try{
      const resp = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`, {
        method: 'POST',
        headers: Object.assign({'Authorization': `Bearer ${AIRTABLE_API_KEY}`}, headers),
        body: JSON.stringify(payload)
      });
      const json = await resp.json();
      if(!resp.ok){
        return { statusCode: 500, body: JSON.stringify({ error: 'Airtable error', details: json }) };
      }
      // Try to trigger a confirmation email via a separate serverless function if available.
      // If SITE_URL is set in environment variables, call the send-confirmation function via HTTP.
      // Otherwise, if SENDGRID_API_KEY is present, attempt to send email directly here as a fallback.
      (async function triggerEmail(){
        try{
          const siteUrl = process.env.SITE_URL || '';
          const payload = {
            record: json,
            reservation: body
          };

          if(siteUrl && siteUrl.startsWith('http')){
            // Call the send-confirmation function exposed by Netlify
            await fetch(`${siteUrl.replace(/\/$/, '')}/.netlify/functions/send-confirmation`, {
              method: 'POST',
              headers: Object.assign({}, headers),
              body: JSON.stringify(payload)
            });
            return;
          }

          // Fallback: send directly using SendGrid if configured.
          const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
          const FROM_EMAIL = process.env.FROM_EMAIL;
          const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
          if(SENDGRID_API_KEY && FROM_EMAIL){
            const sendPayloadCustomer = {
              personalizations: [{ to: [{ email: body.email }], subject: `Confirmación de reserva - ${body.plan || 'ViveWayra'}` }],
              from: { email: FROM_EMAIL },
              content: [{ type: 'text/plain', value: `Hola ${body.name || ''},\n\nGracias por reservar ${body.plan || ''}.\nFecha inicio: ${body.start || ''}\nFecha fin: ${body.end || ''}\nPersonas: ${body.guests || ''}\n\nNos pondremos en contacto pronto para confirmar detalles.\n\n-- ViveWayra` }]
            };

            const sendPayloadAdmin = {
              personalizations: [{ to: [{ email: ADMIN_EMAIL || FROM_EMAIL }], subject: `Nueva reserva: ${body.plan || ''}` }],
              from: { email: FROM_EMAIL },
              content: [{ type: 'text/plain', value: `Nueva reserva recibida:\n\nNombre: ${body.name}\nEmail: ${body.email}\nTel: ${body.phone}\nPlan: ${body.plan}\nInicio: ${body.start}\nFin: ${body.end}\nPersonas: ${body.guests}\nComentarios: ${body.comments}\nAirtable Record ID: ${json && json.id ? json.id : 'N/A'}` }]
            };

            await fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: Object.assign({ 'Authorization': `Bearer ${SENDGRID_API_KEY}` }, { 'Content-Type': 'application/json' }),
              body: JSON.stringify(sendPayloadCustomer)
            });

            await fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: Object.assign({ 'Authorization': `Bearer ${SENDGRID_API_KEY}` }, { 'Content-Type': 'application/json' }),
              body: JSON.stringify(sendPayloadAdmin)
            });
          }
        }catch(e){
          // Non-blocking: log error to function's console
          console.error('Error triggering confirmation email:', e);
        }
      })();

      return { statusCode: 200, body: JSON.stringify({ success:true, record: json }) };
    }catch(err){
      return { statusCode: 500, body: JSON.stringify({ error: 'Request failed', details: String(err) }) };
    }
  }

  // If no backend configured, return informative error
  return { statusCode: 500, body: JSON.stringify({ error: 'No backend configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE as environment variables.' }) };
};
