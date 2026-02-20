// Netlify Function: list-reservations
// Devuelve las reservas desde Airtable (requiere variables de entorno)

const headers = { 'Content-Type': 'application/json' };

exports.handler = async function(event, context){
  if(event.httpMethod !== 'GET'){
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'Reservas';

  if(AIRTABLE_API_KEY && AIRTABLE_BASE){
    try{
      const resp = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?view=Grid%20view`, {
        headers: Object.assign({'Authorization': `Bearer ${AIRTABLE_API_KEY}`}, headers)
      });
      const json = await resp.json();
      if(!resp.ok) return { statusCode: 500, body: JSON.stringify({ error: 'Airtable error', details: json }) };
      return { statusCode: 200, body: JSON.stringify({ success:true, records: json.records }) };
    }catch(err){
      return { statusCode: 500, body: JSON.stringify({ error: 'Request failed', details: String(err) }) };
    }
  }

  return { statusCode: 500, body: JSON.stringify({ error: 'No backend configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE as environment variables.' }) };
};
