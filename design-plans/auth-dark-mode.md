# Implementation Plan: Auth Screen Dark Mode & Design Token Alignment

This plan outlines the steps required to align the Auth Screen with the dark mode variables and theme tokens defined in `src/index.css`, replacing hardcoded slate colors and ensuring full dark theme accessibility.

## 1. Affected Files
- [AuthScreen.tsx](file:///c:/Users/Rahul/OneDrive/Desktop/SQL%20visulizer/src/components/AuthScreen.tsx)

## 2. Proposed Changes
Modify the hardcoded utility styles in `AuthScreen.tsx` to utilize local theme tokens and dynamic text/background colors.

### 2.1. Update Supabase Configuration Required Screen (Lines 53-77)
Replace hardcoded grays/slates with tokens:
```diff
-      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-800">
+      <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-6 text-text-primary">
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
-          className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center"
+          className="max-w-md w-full bg-bg-primary rounded-3xl border border-border-secondary p-8 shadow-xl text-center"
         >
           <div className="w-16 h-16 bg-system-red/10 text-system-red rounded-full flex items-center justify-center mx-auto mb-6">
             <AlertCircle size={32} />
           </div>
-          <h2 className="text-xl font-bold tracking-tight mb-2 text-slate-900">Configuration Required</h2>
-          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
+          <h2 className="text-xl font-bold tracking-tight mb-2 text-text-primary">Configuration Required</h2>
+          <p className="text-text-secondary text-sm mb-6 leading-relaxed">
             Please configure your Supabase credentials in the <code className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold font-mono text-slate-700">.env</code> file in the project root:
+            Please configure your Supabase credentials in the <code className="px-1.5 py-0.5 rounded bg-bg-secondary font-semibold font-mono text-text-secondary">.env</code> file in the project root:
           </p>
-          <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-600 space-y-1 select-all mb-6">
+          <div className="text-left bg-bg-secondary p-4 rounded-xl border border-border-secondary font-mono text-xs text-text-secondary space-y-1 select-all mb-6">
             <p>VITE_SUPABASE_URL=https://your-project.supabase.co</p>
             <p>VITE_SUPABASE_ANON_KEY=your-anon-key</p>
           </div>
-          <p className="text-xs text-slate-400">
+          <p className="text-xs text-text-tertiary">
             After configuring the file, restart the development server to apply changes.
           </p>
```

### 2.2. Update Auth Container and Card Layout (Lines 80-115)
Migrate the card outer wraps to use theme tokens:
```diff
-    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-100/60 p-4 md:p-8 select-none transition-colors duration-300">
+    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-bg-secondary/60 p-4 md:p-8 select-none transition-colors duration-300">
       {/* Decorative background glows */}
       <div className="absolute top-10 left-10 w-72 h-72 bg-system-blue/10 rounded-full blur-3xl -z-10 pointer-events-none" />
       <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
 
       {/* Main card container */}
       <motion.div 
         layout
         initial={{ opacity: 0, scale: 0.98, y: 10 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
-        className="max-w-3xl w-full bg-white rounded-[24px] border border-slate-200/80 shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px]"
+        className="max-w-3xl w-full bg-bg-primary rounded-[24px] border border-border-secondary shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px]"
       >
         {/* Left Column - 3D AI Generated Graphic */}
-        <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-center p-10 bg-gradient-to-br from-system-blue/10 via-purple-500/5 to-transparent border-r border-slate-200/80 overflow-hidden select-none">
+        <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-center p-10 bg-gradient-to-br from-system-blue/10 via-purple-500/5 to-transparent border-r border-border-secondary overflow-hidden select-none">
           {/* Ambient glowing circles */}
           <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-system-blue/15 rounded-full blur-3xl animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl" />
 
           {/* Floating AI generated database shield image */}
           <motion.div
             animate={{ y: [0, -10, 0] }}
             transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
             className="w-full max-w-[240px] flex items-center justify-center relative z-10"
           >
             <img 
               src={dbShieldImage} 
               alt="Database Security Graphic" 
               className="w-full h-auto object-contain drop-shadow-2xl"
               draggable="false"
             />
           </motion.div>
         </div>
 
         {/* Right Column - Authentication Form */}
-        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white">
+        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-bg-primary">
```

### 2.3. Update Input Fields, Labels, Checkboxes, and Switch Links (Lines 117-254)
Ensure standard inputs and textual headers use dynamic colors:
```diff
           {/* Titles */}
-          <h1 className="text-xl font-bold tracking-tight text-slate-900">
+          <h1 className="text-xl font-bold tracking-tight text-text-primary">
             {isSignUp ? 'Create account' : 'Welcome back'}
           </h1>
-          <p className="text-slate-505 text-xs mt-1">
+          <p className="text-text-secondary text-xs mt-1">
             {isSignUp ? 'Create a personal admin account' : 'Sign in to manage your databases'}
           </p>
 
           {/* Form */}
           <form onSubmit={handleSubmit} className="space-y-4 mt-6">
             <div>
-              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email address</label>
+              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Email address</label>
               <div className="relative">
-                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
+                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={15} />
                 <input
                   type="email"
                   required
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="name@domain.com"
-                  className="w-full pl-10 pr-4 py-2 bg-[#f9fafb] border border-slate-300 focus:border-system-blue focus:ring-1 focus:ring-system-blue rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
+                  className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border-secondary focus:border-system-blue focus:ring-1 focus:ring-system-blue rounded-xl text-xs font-medium text-text-primary placeholder-text-tertiary focus:outline-none transition-all"
                 />
               </div>
             </div>
 
             <div>
-              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
+              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Password</label>
               <div className="relative">
-                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
+                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={15} />
                 <input
                   type={showPassword ? 'text' : 'password'}
                   required
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="••••••••••••"
-                  className="w-full pl-10 pr-10 py-2 bg-[#f9fafb] border border-slate-300 focus:border-system-blue focus:ring-1 focus:ring-system-blue rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-mono"
+                  className="w-full pl-10 pr-10 py-2 bg-bg-secondary border border-border-secondary focus:border-system-blue focus:ring-1 focus:ring-system-blue rounded-xl text-xs font-medium text-text-primary placeholder-text-tertiary focus:outline-none transition-all font-mono"
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
-                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
+                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary cursor-pointer"
                   title={showPassword ? 'Hide password' : 'Show password'}
                 >
                   {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                 </button>
               </div>
             </div>
 
             {/* Checkbox and Forgot Password */}
             {!isSignUp && (
               <div className="flex items-center justify-between text-[11px] font-medium mt-1">
-                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer select-none">
+                <label className="flex items-center gap-1.5 text-text-secondary cursor-pointer select-none">
                   <input
                     type="checkbox"
                     checked={rememberMe}
                     onChange={(e) => setRememberMe(e.target.checked)}
-                    className="rounded border-slate-300 text-system-blue focus:ring-system-blue w-3.5 h-3.5"
+                    className="rounded border-border-secondary text-system-blue focus:ring-system-blue w-3.5 h-3.5"
                   />
                   <span>Remember me</span>
                 </label>
                 <button
                   type="button"
                   onClick={handleForgotPassword}
                   className="text-system-blue hover:underline cursor-pointer bg-transparent border-none p-0"
                 >
                   Forgot password?
                 </button>
               </div>
             )}
 
             {/* Status Messages */}
             <AnimatePresence mode="wait">
               {error && (
                 <motion.div
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
-                  className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-system-red text-[11px] rounded-xl font-medium"
+                  className="flex items-start gap-2 p-3 bg-system-red/10 border border-system-red/20 text-system-red text-[11px] rounded-xl font-medium"
                 >
                   <AlertCircle size={14} className="shrink-0 mt-0.5" />
                   <span>{error}</span>
                 </motion.div>
               )}
 
               {message && (
                 <motion.div
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
-                  className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 text-system-green text-[11px] rounded-xl font-medium"
+                  className="flex items-start gap-2 p-3 bg-system-green/10 border border-system-green/20 text-system-green text-[11px] rounded-xl font-medium"
                 >
                   <CheckCircle size={14} className="shrink-0 mt-0.5" />
                   <span>{message}</span>
                 </motion.div>
               )}
             </AnimatePresence>
...
       {/* Under-card switch navigation link */}
       <div className="mt-5 text-center">
         <button
           type="button"
           onClick={() => {
             setIsSignUp(!isSignUp);
             setError(null);
             setMessage(null);
           }}
-          className="text-xs text-slate-600 hover:text-slate-800 font-medium inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 transition-colors"
+          className="text-xs text-text-secondary hover:text-text-primary font-medium inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 transition-colors"
         >
```

## 3. Verification Plan
1. **Light Mode Verification**:
   - Navigate to the login/signup screen.
   - Verify layout card backgrounds remain readable, input forms are outlined with the correct border colors, and graphics render correctly.
2. **Dark Mode Verification**:
   - Apply the `.dark` class to `html`.
   - Verify the login card background updates to `--bg-primary` (#0c0d0f) and the body background updates to `--bg-secondary` (#16171b).
   - Ensure labels and placeholder texts transition to high-contrast gray/white tokens instead of dark slate.
