-- sql/insert-service-areas.sql
-- Upsert a single page_content row for page_name='home' and content_key='service_areas'
-- The content_json column will contain an array of service area objects.
-- NOTE: lat/lng values are left as NULL placeholders because this environment can't call external geocoders.
-- Run the optional geocoding script below or replace lat/lng values with accurate coordinates before running.

BEGIN;

INSERT INTO page_content (page_name, content_key, content_type, content_json, updated_at, updated_by)
VALUES (
  'home',
  'service_areas',
  'json',
  (
    '[
      {"id": 1,  "name": "Albany Creek", "postcode": "4035", "lat": null, "lng": null, "popular": false},
      {"id": 2,  "name": "Arana Hills", "postcode": "4054", "lat": null, "lng": null, "popular": false},
      {"id": 3,  "name": "Aspley", "postcode": "4034", "lat": null, "lng": null, "popular": false},
      {"id": 4,  "name": "Bald Hills", "postcode": "4036", "lat": null, "lng": null, "popular": false},
      {"id": 5,  "name": "Boondall", "postcode": "4034", "lat": null, "lng": null, "popular": false},
      {"id": 6,  "name": "Bracken Ridge", "postcode": "4017", "lat": null, "lng": null, "popular": false},
      {"id": 7,  "name": "Bray Park", "postcode": "4500", "lat": null, "lng": null, "popular": false},
      {"id": 8,  "name": "Brendale", "postcode": "4500", "lat": null, "lng": null, "popular": false},
      {"id": 9,  "name": "Bridgeman Downs", "postcode": "4035", "lat": null, "lng": null, "popular": false},
      {"id": 10, "name": "Brighton", "postcode": "4017", "lat": null, "lng": null, "popular": false},
      {"id": 11, "name": "Bunya", "postcode": "4055", "lat": null, "lng": null, "popular": false},
      {"id": 12, "name": "Burpengary", "postcode": "4505", "lat": null, "lng": null, "popular": false},
      {"id": 13, "name": "Burpengary East", "postcode": "4505", "lat": null, "lng": null, "popular": false},
      {"id": 14, "name": "Caboolture South", "postcode": "4510", "lat": null, "lng": null, "popular": false},
      {"id": 15, "name": "Carseldine", "postcode": "4034", "lat": null, "lng": null, "popular": false},
      {"id": 16, "name": "Cashmere", "postcode": "4500", "lat": null, "lng": null, "popular": false},
      {"id": 17, "name": "Chermside", "postcode": "4032", "lat": null, "lng": null, "popular": true},
      {"id": 18, "name": "Chermside West", "postcode": "4032", "lat": null, "lng": null, "popular": false},
      {"id": 19, "name": "Clontarf", "postcode": "4019", "lat": null, "lng": null, "popular": false},
      {"id": 20, "name": "Dakabin", "postcode": "4503", "lat": null, "lng": null, "popular": false},
      {"id": 21, "name": "Deagon", "postcode": "4017", "lat": null, "lng": null, "popular": false},
      {"id": 22, "name": "Deception Bay", "postcode": "4508", "lat": null, "lng": null, "popular": false},
      {"id": 23, "name": "Eatons Hill", "postcode": "4037", "lat": null, "lng": null, "popular": false},
      {"id": 24, "name": "Everton Hills", "postcode": "4053", "lat": null, "lng": null, "popular": false},
      {"id": 25, "name": "Everton Park", "postcode": "4053", "lat": null, "lng": null, "popular": false},
      {"id": 26, "name": "Ferny Grove", "postcode": "4055", "lat": null, "lng": null, "popular": false},
      {"id": 27, "name": "Ferny Hills", "postcode": "4055", "lat": null, "lng": null, "popular": false},
      {"id": 28, "name": "Fitzgibbon", "postcode": "4018", "lat": null, "lng": null, "popular": false},
      {"id": 29, "name": "Geebung", "postcode": "4034", "lat": null, "lng": null, "popular": false},
      {"id": 30, "name": "Griffin", "postcode": "4503", "lat": null, "lng": null, "popular": false},
      {"id": 31, "name": "Joyner", "postcode": "4500", "lat": null, "lng": null, "popular": false},
      {"id": 32, "name": "Kallangur", "postcode": "4503", "lat": null, "lng": null, "popular": false},
      {"id": 33, "name": "Kedron", "postcode": "4031", "lat": null, "lng": null, "popular": false},
      {"id": 34, "name": "Keperra", "postcode": "4054", "lat": null, "lng": null, "popular": false},
      {"id": 35, "name": "Kippa Ring", "postcode": "4021", "lat": null, "lng": null, "popular": false},
      {"id": 36, "name": "Kurwongbah", "postcode": "4503", "lat": null, "lng": null, "popular": false},
      {"id": 37, "name": "Lawnton", "postcode": "4501", "lat": null, "lng": null, "popular": false},
      {"id": 38, "name": "Mango Hill", "postcode": "4509", "lat": null, "lng": null, "popular": false},
      {"id": 39, "name": "Margate", "postcode": "4019", "lat": null, "lng": null, "popular": false},
      {"id": 40, "name": "Mcdowall", "postcode": "4053", "lat": null, "lng": null, "popular": false},
      {"id": 41, "name": "Mitchelton", "postcode": "4053", "lat": null, "lng": null, "popular": false},
      {"id": 42, "name": "Morayfield", "postcode": "4506", "lat": null, "lng": null, "popular": false},
      {"id": 43, "name": "Murrumba Downs", "postcode": "4503", "lat": null, "lng": null, "popular": false},
      {"id": 44, "name": "Narangba", "postcode": "4504", "lat": null, "lng": null, "popular": false},
      {"id": 45, "name": "Newport", "postcode": "4020", "lat": null, "lng": null, "popular": false},
      {"id": 46, "name": "North Lakes", "postcode": "4509", "lat": null, "lng": null, "popular": true},
      {"id": 47, "name": "Petrie", "postcode": "4502", "lat": null, "lng": null, "popular": false},
      {"id": 48, "name": "Redcliffe", "postcode": "4020", "lat": null, "lng": null, "popular": true},
      {"id": 49, "name": "Rothwell", "postcode": "4022", "lat": null, "lng": null, "popular": false},
      {"id": 50, "name": "Sandgate", "postcode": "4017", "lat": null, "lng": null, "popular": false},
      {"id": 51, "name": "Scarborough", "postcode": "4020", "lat": null, "lng": null, "popular": false},
      {"id": 52, "name": "Shorncliffe", "postcode": "4017", "lat": null, "lng": null, "popular": false},
      {"id": 53, "name": "Stafford Heights", "postcode": "4053", "lat": null, "lng": null, "popular": false},
      {"id": 54, "name": "Strathpine", "postcode": "4500", "lat": null, "lng": null, "popular": false},
      {"id": 55, "name": "Taigum", "postcode": "4018", "lat": null, "lng": null, "popular": false},
      {"id": 56, "name": "Upper Caboolture", "postcode": "4510", "lat": null, "lng": null, "popular": false},
      {"id": 57, "name": "Upper Kedron", "postcode": "4055", "lat": null, "lng": null, "popular": false},
      {"id": 58, "name": "Warner", "postcode": "4500", "lat": null, "lng": null, "popular": false},
      {"id": 59, "name": "Wavell Heights", "postcode": "4012", "lat": null, "lng": null, "popular": false},
      {"id": 60, "name": "Whiteside", "postcode": "4503", "lat": null, "lng": null, "popular": false},
      {"id": 61, "name": "Woody Point", "postcode": "4019", "lat": null, "lng": null, "popular": false},
      {"id": 62, "name": "Zillmere", "postcode": "4034", "lat": null, "lng": null, "popular": false}
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

-- Optional: Example SQL to update a single area's coordinates once you have them:
-- UPDATE page_content
-- SET content_json = (
--   SELECT jsonb_agg(
--     CASE WHEN (item->>'name') = 'Albany Creek' THEN item || jsonb_build_object('lat', -27.3822, 'lng', 152.9944) ELSE item END
--   )
--   FROM jsonb_array_elements(content_json) item
-- )
-- WHERE page_name = 'home' AND content_key = 'service_areas';

-- Helpful note:
-- To geocode these place names and populate lat/lng you can use a small script that calls Nominatim/OpenStreetMap or Google Maps Geocoding API and issues UPDATE statements similar to the example above.
