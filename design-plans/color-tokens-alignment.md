# Implementation Plan: Color Tokens Alignment for Status and Errors

This plan outlines the changes required to align status indicators and error display messages with the system colors (`--system-green` and `--system-red`) defined in `src/index.css`, replacing hardcoded Tailwind utility colors (`emerald-500`, `rose-500`, `red-500`).

## 1. Affected Files
- [TableGrid.tsx](file:///c:/Users/Rahul/OneDrive/Desktop/SQL%20visulizer/src/components/TableGrid.tsx)
- [SQLEditor.tsx](file:///c:/Users/Rahul/OneDrive/Desktop/SQL%20visulizer/src/components/SQLEditor.tsx)

## 2. Proposed Changes

### 2.1. Update Boolean Status Pill Classes in TableGrid (Lines 483-492)
Replace emerald/rose utility colors with system-green/system-red tokens:
```diff
                              // Render truthy/falsy booleans as clean status dots
                              row[col.name] === true || row[col.name] === 'true' || row[col.name] === 1 || row[col.name] === '1' ? (
-                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans text-[10px] font-bold border border-emerald-500/15 shadow-2xs select-none">
-                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
+                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-system-green/10 text-system-green font-sans text-[10px] font-bold border border-system-green/15 shadow-2xs select-none">
+                                  <span className="w-1.5 h-1.5 rounded-full bg-system-green animate-pulse" />
                                   true
                                 </span>
                              ) : (
-                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-sans text-[10px] font-bold border border-rose-500/15 shadow-2xs select-none">
-                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
+                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-system-red/10 text-system-red font-sans text-[10px] font-bold border border-system-red/15 shadow-2xs select-none">
+                                  <span className="w-1.5 h-1.5 rounded-full bg-system-red" />
                                   false
                                 </span>
                              )
```

### 2.2. Update SQL Editor Error Alerts (Lines 276-278)
Replace hardcoded Tailwind `red-500` with the `--system-red` design token:
```diff
             ) : error ? (
-              <div className="m-4 p-3.5 bg-red-500/10 border border-red-500/20 text-system-red rounded-xl whitespace-pre-wrap">
+              <div className="m-4 p-3.5 bg-system-red/10 border border-system-red/20 text-system-red rounded-xl whitespace-pre-wrap">
                 {error}
               </div>
```

## 3. Verification Plan
1. **Status Dot Verification**:
   - Check the Table Viewer with a table containing boolean columns (like `is_active` or similar).
   - Ensure the boolean pills render using the correct green (`#34c759` with 10% opacity background) and red (`#ff3b30` with 10% opacity background) tokens.
2. **Error Notice Verification**:
   - Run an invalid query in the SQL Editor.
   - Verify that the error container's background matches `bg-system-red/10` and border matches `border-system-red/20`.
