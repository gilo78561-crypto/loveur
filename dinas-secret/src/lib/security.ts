import { createHash, randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto';
export const hashCode=(code:string)=>{const s=randomBytes(16);return `${s.toString('hex')}:${scryptSync(code.trim().toUpperCase(),s,32).toString('hex')}`};
export const verifyCode=(code:string,stored:string)=>{const[s,h]=stored.split(':');
  const c=scryptSync(code.trim().toUpperCase(),Buffer.from(s,'hex'),32);return timingSafeEqual(c,Buffer.from(h,'hex'))};
// Jeton de session signé pour une expérience déverrouillée (cookie httpOnly)
export const signToken=(slug:string)=>{const p=`${slug}.${Date.now()+6*3600e3}`;
  return `${p}.${createHmac('sha256',process.env.SESSION_SECRET!).update(p).digest('hex')}`};
export const checkToken=(t:string,slug:string)=>{const[s,e,sig]=t.split('.');if(s!==slug||+e<Date.now())return false;
  const x=createHmac('sha256',process.env.SESSION_SECRET!).update(`${s}.${e}`).digest('hex');
  return x.length===sig?.length&&timingSafeEqual(Buffer.from(x),Buffer.from(sig))};
export const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
