import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pcwjdtckpepmyruwmpfe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjd2pkdGNrcGVwbXlydXdtcGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODEwMTAsImV4cCI6MjA5Njc1NzAxMH0.3zmY5wd0i43HBFdAuD2Q4mPufasKEF_ckrpMaQuVpmE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)