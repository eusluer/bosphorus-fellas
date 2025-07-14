// Supabase Configuration
const SUPABASE_URL = 'https://uhvtwlhbhprivbzrdoen.supabase.co'; // Supabase Project URL'inizi buraya yazın
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodnR3bGhiaHByaXZienJkb2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNTg4NTcsImV4cCI6MjA2NzczNDg1N30.4ajXYURtArkmCkDLDvsYmR2hwOnQqKOtfIn7PXNAOwU'; // Supabase Anon Key'inizi buraya yazın

// Supabase Client'ı başlat
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table isimleri
const TABLES = {
    USERS: 'users',
    APPLICATIONS: 'applications', 
    EVENTS: 'events',
    EVENT_PARTICIPANTS: 'event_participants',
    TESTIMONIALS: 'testimonials'
};

// Export for other modules
window.supabaseClient = supabaseClient;
window.TABLES = TABLES; 