// Netlify Function (Node.js) - ejemplo para crear transacción en Wompi
// Requiere: configurar la variable de entorno WOMPI_PRIVATE_KEY en Netlify
// POST body: { amount_in_cents, currency (optional), buyer_email, buyer_name, reference (optional) }

// fetch nativo de Node 18 — no se requiere node-fetch

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const privateKey = process.env.WOMPI_PRIVATE_KEY; // pega tu private key en Netlify env
  if (!privateKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'WOMPI_PRIVATE_KEY not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const amount_in_cents = body.amount_in_cents || body.amount_cents || 0;
  const currency = body.currency || 'COP';
  const buyer_email = body.buyer_email || body.email || 'no-reply@example.com';
  const buyer_name = body.buyer_name || body.buyer || 'Cliente';
  const reference = body.reference || `order-${Date.now()}`;

  const payload = {
    amount_in_cents: amount_in_cents,
    currency: currency,
    customer_email: buyer_email,
    reference: reference,
    // payment_method_types: ['CARD'] // opcional
    // redirect_url: 'https://tusitio.com/confirmacion' // opcional
  };

  try {
    const resp = await fetch('https://sandbox.wompi.co/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${privateKey}`
      },
      body: JSON.stringify(payload)
    });
    const json = await resp.json();
    // devolver estructura que el front espera
    return {
      statusCode: 200,
      body: JSON.stringify(json)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
};
