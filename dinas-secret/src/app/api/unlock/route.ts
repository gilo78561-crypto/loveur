import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin } from '@/lib/supabase-admin';
import { verifyCode, signToken } from '@/lib/security';
const schema=z.object({slug:z.string().min(6).max(40),code:z.string().min(3).max(16)});
const MAX=5, LOCK_MIN=15;
export async function POST(req:Request){
  const p=schema.safeParse(await req.json().catch(()=>null));
  if(!p.success)return NextResponse.json({error:'Code invalide.'},{status:400});
  const db=admin();
  const {data:exp}=await db.from('experiences').select('id,status,expires_at').eq('slug',p.data.slug).maybeSingle();
  const ok=exp&&exp.status==='active'&&(!exp.expires_at||new Date(exp.expires_at)>new Date());
  if(!ok)return NextResponse.json({error:"Cette surprise n'est pas disponible."},{status:404});
  const {data:sc}=await db.from('secret_codes').select('*').eq('experience_id',exp.id).single();
  if(sc.locked_until&&new Date(sc.locked_until)>new Date())
    return NextResponse.json({error:'Trop d’essais. Réessayez dans quelques minutes.'},{status:429});
  if(!verifyCode(p.data.code,sc.code_hash)){
    const n=sc.failed_attempts+1;
    await db.from('secret_codes').update({failed_attempts:n%MAX,
      locked_until:n>=MAX?new Date(Date.now()+LOCK_MIN*60e3).toISOString():null}).eq('experience_id',exp.id);
    return NextResponse.json({error:"Ce code n'est pas le bon… demandez-le à votre personne préférée ❤️"},{status:401});
  }
  await db.from('secret_codes').update({failed_attempts:0,locked_until:null}).eq('experience_id',exp.id);
  await db.from('experience_visits').insert({experience_id:exp.id,kind:'unlock'});
  const res=NextResponse.json({ok:true});
  res.cookies.set(`ds_${p.data.slug}`,signToken(p.data.slug),{httpOnly:true,secure:true,sameSite:'strict',maxAge:21600,path:'/'});
  return res;
}
