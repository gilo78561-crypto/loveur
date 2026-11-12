'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
export default function Entry(){
  const {slug}=useParams<{slug:string}>(); const r=useRouter();
  const [code,setCode]=useState(''); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setErr('');
    const res=await fetch('/api/unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,code})});
    if(res.ok)r.push(`/secret/${slug}/menu`); else setErr((await res.json()).error); setBusy(false);}
  return(<main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-[radial-gradient(ellipse_at_top,#4A080F,#160507_70%)]">
    <motion.h1 initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:1}} className="font-script text-6xl text-gold-light">Dina’s Secret</motion.h1>
    <p className="font-serif text-2xl mt-4 text-cream">Une surprise vous attend…</p>
    <p className="mt-3 max-w-sm text-sm text-cream/80">Mais avant de découvrir votre instant secret, il vous faudra le petit code que votre personne préférée vous a confié.</p>
    <form onSubmit={submit} className="mt-8 w-full max-w-sm rounded-2xl border border-gold/50 bg-black/30 p-6">
      <Lock className="mx-auto mb-3 text-gold" size={20}/>
      <input value={code} onChange={e=>setCode(e.target.value)} maxLength={16} inputMode="text" autoComplete="off" aria-label="Code secret"
        className="w-full rounded-full border border-gold/40 bg-transparent px-4 py-3 text-center tracking-[0.4em] text-cream outline-none focus:border-gold-light"/>
      {err&&<p role="alert" className="mt-3 text-sm text-gold-light">{err}</p>}
      <button disabled={busy||code.length<3} className="mt-4 w-full rounded-full bg-gold py-3 font-medium text-[#160507] disabled:opacity-50">{busy?'Vérification…':'Valider'}</button>
    </form></main>);}
