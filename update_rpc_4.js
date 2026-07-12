import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwpizsdorjghzgdmqxzs.supabase.co';
const supabaseAnonKey = 'sb_publishable_RcLAfxPmm2lt32Q7dnNaJg_H2vo91DK';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const newFunctionSql = `
CREATE OR REPLACE FUNCTION exec_sql(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    query_clean text;
    query_type text;
    rows_affected integer;
BEGIN
    -- Strip leading whitespace and comments using [[:space:]] instead of \\s
    query_clean := regexp_replace(query_text, '^([[:space:]]|--.*?\\n|/\\*.*?\\*/)+', '', 'g');
    -- Extract query type
    query_type := upper(substring(query_clean from '^[A-Z]+'));
    
    IF query_type IN ('SELECT', 'WITH', 'SHOW', 'EXPLAIN') THEN
        -- Strip trailing spaces, newlines, tabs, and semicolons
        query_clean := regexp_replace(query_clean, '([[:space:]]|;)+$', '', 'g');
        
        EXECUTE 'SELECT json_agg(t) FROM (' || query_clean || ') t' INTO result;
        RETURN json_build_object('data', COALESCE(result, '[]'::json));
    ELSE
        EXECUTE query_text;
        GET DIAGNOSTICS rows_affected = row_count;
        RETURN json_build_object('success', true, 'rows_affected', rows_affected);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;
`;

async function update() {
  console.log("Updating exec_sql RPC function...");
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query_text: newFunctionSql });
    if (error) {
      console.error("Update failed:", error);
    } else {
      console.log("Update succeeded:", data);
      
      // Let's test it with a query that has a leading newline
      const testQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
        ORDER BY table_name;
      `;
      const testRes = await supabase.rpc('exec_sql', { query_text: testQuery });
      console.log("Test result data:", testRes.data);
    }
  } catch (err) {
    console.error("Catch Error:", err);
  }
}

update();
