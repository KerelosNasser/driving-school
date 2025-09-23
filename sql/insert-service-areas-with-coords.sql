-- sql/insert-service-areas-with-coords.sql
-- Upsert service_areas content with approximate lat/lng coordinates for each suburb.
-- IMPORTANT: Coordinates are approximate centroids. Please verify and (optionally) re-geocode for higher accuracy.

BEGIN;

INSERT INTO page_content (page_name, content_key, content_type, content_json, updated_at, updated_by)
VALUES (
  'home',
  'service_areas',
  'json',
  (
    '[
      {"id":1,"name":"Albany Creek","postcode":"4035","lat":-27.3920,"lng":153.0160,"popular":false},
      {"id":2,"name":"Arana Hills","postcode":"4054","lat":-27.3905,"lng":152.9825,"popular":false},
      {"id":3,"name":"Aspley","postcode":"4034","lat":-27.3850,"lng":153.0175,"popular":false},
      {"id":4,"name":"Bald Hills","postcode":"4036","lat":-27.3350,"lng":153.0310,"popular":false},
      {"id":5,"name":"Boondall","postcode":"4034","lat":-27.3895,"lng":153.0620,"popular":false},
      {"id":6,"name":"Bracken Ridge","postcode":"4017","lat":-27.3075,"lng":153.0370,"popular":false},
      {"id":7,"name":"Bray Park","postcode":"4500","lat":-27.3080,"lng":152.9980,"popular":false},
      {"id":8,"name":"Brendale","postcode":"4500","lat":-27.3510,"lng":152.9850,"popular":false},
      {"id":9,"name":"Bridgeman Downs","postcode":"4035","lat":-27.3960,"lng":153.0390,"popular":false},
      {"id":10,"name":"Brighton","postcode":"4017","lat":-27.2390,"lng":153.1230,"popular":false},
      {"id":11,"name":"Bunya","postcode":"4055","lat":-27.3745,"lng":152.9900,"popular":false},
      {"id":12,"name":"Burpengary","postcode":"4505","lat":-27.1730,"lng":152.9920,"popular":false},
      {"id":13,"name":"Burpengary East","postcode":"4505","lat":-27.1600,"lng":153.0100,"popular":false},
      {"id":14,"name":"Caboolture South","postcode":"4510","lat":-27.0830,"lng":152.9460,"popular":false},
      {"id":15,"name":"Carseldine","postcode":"4034","lat":-27.3475,"lng":153.0150,"popular":false},
      {"id":16,"name":"Cashmere","postcode":"4500","lat":-27.3810,"lng":152.8890,"popular":false},
      {"id":17,"name":"Chermside","postcode":"4032","lat":-27.4147,"lng":153.0239,"popular":true},
      {"id":18,"name":"Chermside West","postcode":"4032","lat":-27.4200,"lng":153.0030,"popular":false},
      {"id":19,"name":"Clontarf","postcode":"4019","lat":-27.2395,"lng":153.1185,"popular":false},
      {"id":20,"name":"Dakabin","postcode":"4503","lat":-27.2710,"lng":152.9870,"popular":false},
      {"id":21,"name":"Deagon","postcode":"4017","lat":-27.3235,"lng":153.1145,"popular":false},
      {"id":22,"name":"Deception Bay","postcode":"4508","lat":-27.1210,"lng":153.1030,"popular":false},
      {"id":23,"name":"Eatons Hill","postcode":"4037","lat":-27.3755,"lng":152.9750,"popular":false},
      {"id":24,"name":"Everton Hills","postcode":"4053","lat":-27.3935,"lng":152.9790,"popular":false},
      {"id":25,"name":"Everton Park","postcode":"4053","lat":-27.4170,"lng":152.9960,"popular":false},
      {"id":26,"name":"Ferny Grove","postcode":"4055","lat":-27.4360,"lng":152.9600,"popular":false},
      {"id":27,"name":"Ferny Hills","postcode":"4055","lat":-27.4100,"lng":152.9650,"popular":false},
      {"id":28,"name":"Fitzgibbon","postcode":"4018","lat":-27.3630,"lng":153.0400,"popular":false},
      {"id":29,"name":"Geebung","postcode":"4034","lat":-27.3800,"lng":153.0300,"popular":false},
      {"id":30,"name":"Griffin","postcode":"4503","lat":-27.2550,"lng":153.0120,"popular":false},
      {"id":31,"name":"Joyner","postcode":"4500","lat":-27.2190,"lng":152.9590,"popular":false},
      {"id":32,"name":"Kallangur","postcode":"4503","lat":-27.2730,"lng":152.9990,"popular":false},
      {"id":33,"name":"Kedron","postcode":"4031","lat":-27.4215,"lng":153.0370,"popular":false},
      {"id":34,"name":"Keperra","postcode":"4054","lat":-27.4430,"lng":152.9650,"popular":false},
      {"id":35,"name":"Kippa Ring","postcode":"4021","lat":-27.2265,"lng":153.1090,"popular":false},
      {"id":36,"name":"Kurwongbah","postcode":"4503","lat":-27.2850,"lng":152.9570,"popular":false},
      {"id":37,"name":"Lawnton","postcode":"4501","lat":-27.3240,"lng":152.9950,"popular":false},
      {"id":38,"name":"Mango Hill","postcode":"4509","lat":-27.2530,"lng":153.0200,"popular":false},
      {"id":39,"name":"Margate","postcode":"4019","lat":-27.2050,"lng":153.1410,"popular":false},
      {"id":40,"name":"Mcdowall","postcode":"4053","lat":-27.4035,"lng":152.9930,"popular":false},
      {"id":41,"name":"Mitchelton","postcode":"4053","lat":-27.4380,"lng":152.9850,"popular":false},
      {"id":42,"name":"Morayfield","postcode":"4506","lat":-27.0710,"lng":152.9510,"popular":false},
      {"id":43,"name":"Murrumba Downs","postcode":"4503","lat":-27.2250,"lng":153.0200,"popular":false},
      {"id":44,"name":"Narangba","postcode":"4504","lat":-27.1710,"lng":152.9850,"popular":false},
      {"id":45,"name":"Newport","postcode":"4020","lat":-27.2260,"lng":153.1280,"popular":false},
      {"id":46,"name":"North Lakes","postcode":"4509","lat":-27.2330,"lng":153.0360,"popular":true},
      {"id":47,"name":"Petrie","postcode":"4502","lat":-27.2980,"lng":152.9900,"popular":false},
      {"id":48,"name":"Redcliffe","postcode":"4020","lat":-27.2315,"lng":153.1220,"popular":true},
      {"id":49,"name":"Rothwell","postcode":"4022","lat":-27.2275,"lng":153.1185,"popular":false},
      {"id":50,"name":"Sandgate","postcode":"4017","lat":-27.3070,"lng":153.1170,"popular":false},
      {"id":51,"name":"Scarborough","postcode":"4020","lat":-27.2485,"lng":153.1290,"popular":false},
      {"id":52,"name":"Shorncliffe","postcode":"4017","lat":-27.2790,"lng":153.1260,"popular":false},
      {"id":53,"name":"Stafford Heights","postcode":"4053","lat":-27.4150,"lng":153.0000,"popular":false},
      {"id":54,"name":"Strathpine","postcode":"4500","lat":-27.3075,"lng":152.9930,"popular":false},
      {"id":55,"name":"Taigum","postcode":"4018","lat":-27.3805,"lng":153.0260,"popular":false},
      {"id":56,"name":"Upper Caboolture","postcode":"4510","lat":-27.0010,"lng":152.9560,"popular":false},
      {"id":57,"name":"Upper Kedron","postcode":"4055","lat":-27.4440,"lng":152.9200,"popular":false},
      {"id":58,"name":"Warner","postcode":"4500","lat":-27.3550,"lng":153.0000,"popular":false},
      {"id":59,"name":"Wavell Heights","postcode":"4012","lat":-27.4185,"lng":153.0125,"popular":false},
      {"id":60,"name":"Whiteside","postcode":"4503","lat":-27.1900,"lng":152.9800,"popular":false},
      {"id":61,"name":"Woody Point","postcode":"4019","lat":-27.2340,"lng":153.1210,"popular":false},
      {"id":62,"name":"Zillmere","postcode":"4034","lat":-27.4010,"lng":153.0120,"popular":false}
    ]'::jsonb
  ),
  now(),
  'migration-script'
)
ON CONFLICT (page_name, content_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    content_type = EXCLUDED.content_type,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;

COMMIT;

-- NOTE:
-- 1) These coordinates are approximate. Run the included script `scripts/geocode-and-generate-updates.js` to auto-geocode and produce precise UPDATE statements for this same `page_content` row.
-- 2) To apply updates after re-geocoding, run the generated SQL against your Supabase database (psql or Supabase SQL editor).
