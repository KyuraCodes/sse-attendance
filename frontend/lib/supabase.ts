import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://giwgjtbxrhbyamxnqpfx.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpd2dqdGJ4cmhieWFteG5xcGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMTE0OTAsImV4cCI6MjA5ODg4NzQ5MH0.nELEP7nqcWN_MjDCbo1mI-i51b_ELY5nhUr3ySx5XLc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: ws as any,
  },
});

export default supabase;
