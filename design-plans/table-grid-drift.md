# Implementation Plan: Table Grid Design System Drift

This plan details the steps to align the Table Grid viewer (`TableGrid.tsx`) with the central design tokens defined in `src/index.css`, replacing hardcoded light-mode colors and Tailwind grays (`#f8fafc`, `gray-50`, `gray-100`, `gray-200`) with dynamic token utilities.

## 1. Affected Files
- [TableGrid.tsx](file:///c:/Users/Rahul/OneDrive/Desktop/SQL%20visulizer/src/components/TableGrid.tsx)

## 2. Proposed Changes
Refactor hardcoded values to utilize local theme tokens (`bg-bg-primary`, `bg-bg-secondary`, `border-border-secondary`, `hover:bg-bg-secondary`).

### 2.1. Update Main Container Background (Line 209)
Replace ad-hoc `#f8fafc` with `bg-bg-secondary`:
```diff
-    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-bg-primary select-text p-6 space-y-6">
+    <div className="flex-1 flex flex-col min-w-0 bg-bg-secondary select-text p-6 space-y-6">
```

### 2.2. Update Top Header Card Styles (Line 211)
Replace hardcoded background and border grays with design variables:
```diff
-      <div className="flex items-center justify-between bg-white dark:bg-bg-secondary/15 backdrop-blur-md border border-gray-100 dark:border-border-secondary/60 rounded-2xl p-5 shadow-xs">
+      <div className="flex items-center justify-between bg-bg-primary border border-border-secondary rounded-2xl p-5 shadow-xs">
```

### 2.3. Update Main Grid Card Container (Line 237)
Replace ad-hoc card container styles with design tokens:
```diff
-      <div className="flex-1 overflow-auto relative rounded-2xl border border-gray-100 dark:border-border-secondary/60 bg-white dark:bg-bg-secondary/10 shadow-xs min-h-0 flex flex-col p-6 space-y-4">
+      <div className="flex-1 overflow-auto relative rounded-2xl border border-border-secondary bg-bg-primary shadow-xs min-h-0 flex flex-col p-6 space-y-4">
```

### 2.4. Update Filter, Search Inputs, and Selector dropdowns (Lines 246, 264, 267)
Align the form search/filtering inputs to theme styles:
```diff
             <select
               value={gridLimit}
               onChange={(e) => setGridLimit(Number(e.target.value))}
-              className="px-2 py-1 bg-white dark:bg-bg-primary border border-gray-200 dark:border-border-secondary rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-system-blue"
+              className="px-2 py-1 bg-bg-secondary border border-border-secondary rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-system-blue"
             >
...
               <input
                 type="text"
                 placeholder="Search..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
-                className="pl-9 pr-3 py-1.5 w-60 bg-white dark:bg-bg-primary border border-gray-200 dark:border-border-secondary rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-system-blue"
+                className="pl-9 pr-3 py-1.5 w-60 bg-bg-secondary border border-border-secondary rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-system-blue"
               />
             </div>
-            <button className="p-2 border border-gray-200 dark:border-border-secondary rounded-xl hover:bg-gray-50 dark:hover:bg-bg-secondary text-text-secondary transition-colors cursor-pointer bg-white dark:bg-bg-primary flex items-center justify-center border-solid">
+            <button className="p-2 border border-border-secondary rounded-xl hover:bg-bg-secondary text-text-secondary transition-colors cursor-pointer bg-bg-primary flex items-center justify-center border-solid">
```

### 2.5. Update Grid Table Wrapper, Headings, and Cell Columns (Lines 273, 275, 277, 289)
Correct borders and headers on the tabular rendering workspace:
```diff
-        <div className="flex-1 overflow-auto relative rounded-xl border border-gray-100 dark:border-border-secondary/60">
+        <div className="flex-1 overflow-auto relative rounded-xl border border-border-secondary">
           <table className="w-full text-left border-collapse min-w-max">
-            <thead className="sticky top-0 bg-gray-50 dark:bg-bg-secondary/40 z-20 border-b border-gray-100 dark:border-border-secondary">
+            <thead className="sticky top-0 bg-bg-secondary z-20 border-b border-border-secondary">
               <tr>
-                <th className="p-3 w-20 text-center text-[10px] font-bold text-text-secondary uppercase select-none border-r border-border-secondary/30 sticky left-0 z-20 bg-gray-50 dark:bg-bg-secondary">
+                <th className="p-3 w-20 text-center text-[10px] font-bold text-text-secondary uppercase select-none border-r border-border-secondary/30 sticky left-0 z-20 bg-bg-secondary">
                   <div className="flex items-center justify-center gap-1.5">
                     <span>#</span>
                     <ArrowUpDown size={11} className="text-text-tertiary shrink-0" />
                   </div>
                 </th>
                 {columns.map((col) => {
                   const isPk = primaryKeys.includes(col.name);
                   const isFk = activeSchema.foreignKeys.some(f => f.columnName === col.name);
                   const isSorted = gridSort?.column === col.name;
 
                   return (
-                    <th key={col.name} className="p-3 border-r border-gray-100 dark:border-border-secondary/30 text-[10px] font-bold text-text-secondary uppercase select-none min-w-[160px] bg-gray-50 dark:bg-bg-secondary/40">
+                    <th key={col.name} className="p-3 border-r border-border-secondary/30 text-[10px] font-bold text-text-secondary uppercase select-none min-w-[160px] bg-bg-secondary">
```

## 3. Verification Plan
1. **Light Mode Consistency**:
   - Ensure the main container background matches `--bg-secondary` (#f3f4f6) instead of `#f8fafc`.
   - Ensure card headers and borders use the standard gray tone of `--border-secondary` (#d1d5db) instead of ad-hoc border values.
2. **Dark Mode Alignment**:
   - Ensure components seamlessly adapt when toggled to dark, using `--bg-primary` (#0c0d0f) and `--bg-secondary` (#16171b) and `--border-secondary` (#374151).
