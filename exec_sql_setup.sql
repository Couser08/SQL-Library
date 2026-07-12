-- Run this SQL command in your Supabase SQL Editor to enable arbitrary SQL execution from the application.
-- This function executes statements (DDL & DML) and returns results in a consistent JSON format.

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
    -- Strip leading whitespace, newlines, tabs, and comments
    query_clean := regexp_replace(query_text, '^(\\s|--.*?\\n|/\\*.*?\\*/)+', '', 'g');
    -- Extract query type
    query_type := upper(substring(query_clean from '^[A-Z]+'));
    
    IF query_type IN ('SELECT', 'WITH', 'SHOW', 'EXPLAIN') THEN
        -- Strip trailing spaces, newlines, tabs, and semicolons
        query_clean := regexp_replace(query_clean, '(\\s|;)+$', '', 'g');
        
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
