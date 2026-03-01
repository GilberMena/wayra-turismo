/**
 * Script para crear la tabla "Analytics" en Airtable
 * 
 * USO:
 * 1. Instala dependencias: npm install node-fetch
 * 2. Ejecuta: node setup-airtable-analytics.js
 * 
 * Necesitas tener configuradas las variables de entorno:
 * - AIRTABLE_API_KEY: Tu API key de Airtable (o Personal Access Token)
 * - AIRTABLE_BASE: El ID de tu base (empieza con "app...")
 * 
 * O edita las variables directamente en este archivo.
 */

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN - Edita estos valores si no usas variables de entorno
// ═══════════════════════════════════════════════════════════
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'TU_API_KEY_AQUI';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE || 'TU_BASE_ID_AQUI';
const TABLE_NAME = 'Analytics';

// ═══════════════════════════════════════════════════════════

async function createAnalyticsTable() {
  console.log('🚀 Creando tabla Analytics en Airtable...\n');

  if (AIRTABLE_API_KEY === 'TU_API_KEY_AQUI' || AIRTABLE_BASE_ID === 'TU_BASE_ID_AQUI') {
    console.error('❌ Error: Debes configurar AIRTABLE_API_KEY y AIRTABLE_BASE');
    console.log('\nOpciones:');
    console.log('1. Edita este archivo y reemplaza TU_API_KEY_AQUI y TU_BASE_ID_AQUI');
    console.log('2. O usa variables de entorno:');
    console.log('   $env:AIRTABLE_API_KEY="tu_key"; $env:AIRTABLE_BASE="app..."; node setup-airtable-analytics.js');
    process.exit(1);
  }

  const tableSchema = {
    name: TABLE_NAME,
    fields: [
      { name: 'Visitor ID', type: 'singleLineText' },
      { name: 'Session ID', type: 'singleLineText' },
      { name: 'Event Type', type: 'singleLineText' },
      { name: 'Event Data', type: 'multilineText' },
      { name: 'Page', type: 'singleLineText' },
      { name: 'Page Title', type: 'singleLineText' },
      { name: 'Referrer', type: 'singleLineText' },
      { name: 'Landing Page', type: 'singleLineText' },
      { name: 'Traffic Source', type: 'singleLineText' },
      { name: 'Traffic Medium', type: 'singleLineText' },
      { name: 'Campaign', type: 'singleLineText' },
      { name: 'Device Type', type: 'singleLineText' },
      { name: 'Screen Width', type: 'number', options: { precision: 0 } },
      { 
        name: 'Timestamp', 
        type: 'dateTime',
        options: {
          timeZone: 'America/Bogota',
          dateFormat: { name: 'iso' },
          timeFormat: { name: '24hour' }
        }
      },
      { name: 'Session Duration', type: 'number', options: { precision: 0 } },
      { name: 'Pageviews', type: 'number', options: { precision: 0 } }
    ]
  };

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tableSchema)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      if (result.error?.type === 'DUPLICATE_TABLE_NAME') {
        console.log('⚠️  La tabla "Analytics" ya existe en tu base de Airtable.');
        console.log('   No es necesario crearla de nuevo.');
      } else {
        console.error('❌ Error de Airtable:', result.error?.message || JSON.stringify(result));
      }
      return;
    }

    console.log('✅ ¡Tabla "Analytics" creada exitosamente!\n');
    console.log('📋 Detalles:');
    console.log(`   - ID de tabla: ${result.id}`);
    console.log(`   - Nombre: ${result.name}`);
    console.log(`   - Campos creados: ${result.fields.length}`);
    console.log('\n🎯 Próximos pasos:');
    console.log('   1. Ve a Netlify/Vercel');
    console.log('   2. Agrega la variable de entorno:');
    console.log('      AIRTABLE_ANALYTICS_TABLE=Analytics');
    console.log('   3. Redespliega tu sitio');
    console.log('\n🎉 ¡Listo! Tu sistema de analytics está configurado.');

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

// Ejecutar
createAnalyticsTable();
