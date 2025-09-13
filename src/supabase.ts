import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://idycycarpdtexqnrxhyg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkeWN5Y2FycGR0ZXhxbnJ4aHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDE0NTMsImV4cCI6MjA3MzM3NzQ1M30.c07BZQCe4FUgT-WIjyJy0vn3-y1l9ZZP-58pBc3raLQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
