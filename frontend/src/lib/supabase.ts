import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://zlfwubihffjlnsqmowle.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjlkMDZkYTU5LWZmMzEtNDEzMy04NzIwLWM0OTZkMDk3OTA4MiJ9.eyJwcm9qZWN0SWQiOiJ6bGZ3dWJpaGZmamxuc3Ftb3dsZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY4OTU0ODA5LCJleHAiOjIwODQzMTQ4MDksImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.7lDRGztggDFI00iJ6OT1TUVA12fX1shp-YChY2wV7Ec';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };