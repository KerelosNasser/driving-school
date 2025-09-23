// scripts/geocode-and-generate-updates.js
// Small helper to geocode the service area names using OpenStreetMap Nominatim and output SQL UPDATE statements
// Usage: node scripts/geocode-and-generate-updates.js

const fetch = require('node-fetch');
const fs = require('fs');

const places = [
  'Albany Creek QLD 4035', 'Arana Hills QLD 4054', 'Aspley QLD 4034', 'Bald Hills QLD 4036', 'Boondall QLD 4034',
  'Bracken Ridge QLD 4017', 'Bray Park QLD 4500', 'Brendale QLD 4500', 'Bridgeman Downs QLD 4035', 'Brighton QLD 4017',
  'Bunya QLD 4055', 'Burpengary QLD 4505', 'Burpengary East QLD 4505', 'Caboolture South QLD 4510', 'Carseldine QLD 4034',
  'Cashmere QLD 4500', 'Chermside QLD 4032', 'Chermside West QLD 4032', 'Clontarf QLD 4019', 'Dakabin QLD 4503',
  'Deagon QLD 4017', 'Deception Bay QLD 4508', 'Eatons Hill QLD 4037', 'Everton Hills QLD 4053', 'Everton Park QLD 4053',
  'Ferny Grove QLD 4055', 'Ferny Hills QLD 4055', 'Fitzgibbon QLD 4018', 'Geebung QLD 4034', 'Griffin QLD 4503',
  'Joyner QLD 4500', 'Kallangur QLD 4503', 'Kedron QLD 4031', 'Keperra QLD 4054', 'Kippa Ring QLD 4021', 'Kurwongbah QLD 4503',
  'Lawnton QLD 4501', 'Mango Hill QLD 4509', 'Margate QLD 4019', 'Mcdowall QLD 4053', 'Mitchelton QLD 4053',
  'Morayfield QLD 4506', 'Murrumba Downs QLD 4503', 'Narangba QLD 4504', 'Newport QLD 4020', 'North Lakes QLD 4509',
  'Petrie QLD 4502', 'Redcliffe QLD 4020', 'Rothwell QLD 4022', 'Sandgate QLD 4017', 'Scarborough QLD 4020', 'Shorncliffe QLD 4017',
  'Stafford Heights QLD 4053', 'Strathpine QLD 4500', 'Taigum QLD 4018', 'Upper Caboolture QLD 4510', 'Upper Kedron QLD 4055',
  'Warner QLD 4500', 'Wavell Heights QLD 4012', 'Whiteside QLD 4503', 'Woody Point QLD 4019', 'Zillmere QLD 4034'
];

async function geocode(place) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&countrycodes=au&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'driving-school/1.0 (you@example.com)' } });
  const json = await res.json();
  if (json && json[0]) {
    return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
  }
  return null;
}

(async () => {
  const updates = [];
  for (let i = 0; i < places.length; i++) {
    const name = places[i];
    try {
      const coords = await geocode(name);
      if (coords) {
        const sql = `-- ${name}\nUPDATE page_content SET content_json = (SELECT jsonb_agg(CASE WHEN (item->>'name') = '${name.split(' QLD')[0]}' THEN item || jsonb_build_object('lat', ${coords.lat}, 'lng', ${coords.lng}) ELSE item END) FROM jsonb_array_elements(content_json) item) WHERE page_name = 'home' AND content_key = 'service_areas';\n`;
        updates.push(sql);
        console.log(`Geocoded ${name}: ${coords.lat}, ${coords.lng}`);
      } else {
        console.warn(`No results for ${name}`);
      }
    } catch (err) {
      console.error(`Failed to geocode ${name}:`, err.message || err);
    }
    // Nominatim usage policy: be kind and don't hammer the service
    await new Promise(r => setTimeout(r, 1200));
  }

  fs.writeFileSync('sql/geocode-updates.sql', updates.join('\n'));
  console.log('Wrote sql/geocode-updates.sql with update statements.');
})();
