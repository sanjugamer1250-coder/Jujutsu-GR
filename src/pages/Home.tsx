*** Begin Patch
*** Update File: src/pages/Home.tsx
@@
-  const top = owned.slice(0, 3);
+  const top = owned.slice(0, 3);
@@
-          <div className="mt-3 font-display font-bold text-white text-sm">Jujutsu Clash</div>
-            <div className="text-white text-glow">Arena</div>
+          <h1 className="font-display font-black text-3xl sm:text-5xl leading-tight">
+            <span className="shimmer-text">Jujutsu Clash</span><br />
+            <span className="text-white text-glow">Arena</span>
+          </h1>
@@
-          <div className="flex flex-wrap gap-3 mt-5">
+          <div className="flex flex-wrap gap-3 mt-5">
             <Link href="/characters" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-semibold text-sm shadow-curse-glow hover:shadow-curse-glow-lg tr[...]
               <Zap className="w-4 h-4" /> Start Summoning
             </Link>
@@
-      {top.length > 0 && (
+      {top.length > 0 && (
         <section>
@@
-           <div className="grid grid-cols-3 gap-3">
-             {top.map((c) => {
-               const meta = RARITY_META[c.rarity];
-               return (
-                 <div key={c.id} className={`rounded-2xl overflow-hidden glass border border-curse-500/20 ${meta.glow}`}>
-                   <div className="aspect-square bg-ink-800 relative">
-                     <img src={c.image} alt={c.name} className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
-                     <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold font-mono ${meta.color}`}>{meta.label}</div>
-                   </div>
-                   <div className="p-2">
-                     <div className="text-xs font-semibold text-white truncate">{c.name}</div>
-                     <div className="text-[10px] text-zinc-500 truncate">{c.title}</div>
-                   </div>
-                 </div>
-               );
-             })}
-           </div>
+           <div className="grid grid-cols-3 gap-3">
+             {top.map((c) => {
+               const meta = RARITY_META[c.rarity];
+               return (
+                 <div key={c.id} className={`rounded-2xl overflow-hidden glass border border-curse-500/20 ${meta.glow}`}>
+                   <div className="aspect-square bg-ink-800 relative flex items-center justify-center">
+                     {/* Use Character component for consistent aura + animation */}
+                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
+                       {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
+                       <img src={c.image} alt={c.name} className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
+                     </div>
+                     <div className="absolute inset-0 bg-brush-pattern opacity-30 pointer-events-none" />
+                     <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold font-mono ${meta.color}`}>{meta.label}</div>
+                   </div>
+                   <div className="p-2">
+                     <div className="text-xs font-semibold text-white truncate">{c.name}</div>
+                     <div className="text-[10px] text-zinc-500 truncate">{c.title}</div>
+                   </div>
+                 </div>
+               );
+             })}
+           </div>
         </section>
       )}
*** End Patch