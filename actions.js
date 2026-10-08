/* Dashboard template: the Action plan engine.
   ATR_ACTIONS.build(D,{end}) works out what to change next from the same live figures as every other page.
   Each rule diagnoses one part of the business (why a number moved, not only that it moved), puts a size on
   what fixing it is worth, and ranks it. Nothing is stored: the list is rebuilt whenever the sheet changes,
   so an action disappears by itself once the numbers say it is fixed. */
(typeof window!=='undefined'?window:globalThis).ATR_ACTIONS=(function(){
'use strict';
/* the words and handles from config.js, so the advice speaks your language */
const CFG=(typeof window!=='undefined'&&window.DASH)||{}, WD_=Object.assign({niche:'your niche',moments:'big moments',partners:'creators and brands in your niche',appFeatures:'alerts, updates and exclusive content'},CFG.words||{});
const HD=CFG.handles||{}, BRAND=CFG.name||'Your Brand', TOPICS=CFG.topics||{};

/* ================= helpers (the same conventions as the rest of the dashboard) ================= */
const has=v=>typeof v==='number'&&isFinite(v);
const toT=d=>Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10));
const addD=(d,n)=>new Date(toT(d)+n*864e5).toISOString().slice(0,10);
const ddiff=(a,b)=>Math.round((toT(b)-toT(a))/864e5);
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONF=['January','February','March','April','May','June','July','August','September','October','November','December'];
const dS=d=>d?`${+d.slice(8,10)} ${MON[+d.slice(5,7)-1]}`:'-';
const dL=d=>d?`${dS(d)} ${d.slice(0,4)}`:'-';
const monthOf=d=>`${MONF[+d.slice(5,7)-1]} ${d.slice(0,4)}`;
const full=v=>has(v)?Math.round(v).toLocaleString('en-GB'):'-';
function abbr(v){ if(!has(v)) return '-'; const a=Math.abs(v),t=(x,d)=>(+x.toFixed(d)).toString();
  if(a>=1e9) return t(v/1e9,2)+'bn'; if(a>=1e6) return t(v/1e6,a>=1e7?1:2)+'m'; if(a>=1e4) return t(v/1e3,a>=1e5?0:1)+'k'; return full(v); }
const pct=(v,d=0)=>has(v)?(+v.toFixed(d)).toString()+'%':'-';
const CURSYM_=(typeof window!=='undefined'&&window.DASH_CUR&&window.DASH_CUR.sym)||'$'; const usd=v=>has(v)?CURSYM_+(Math.abs(v)>=1e4?abbr(v):v.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})):'-';
const times=x=>(x>=10?Math.round(x):+x.toFixed(1))+'x';
const one=v=>(+v.toFixed(1)).toString();
const inR=(rs,a,b)=>(rs||[]).filter(r=>r&&r.d>=a&&r.d<=b);
const total=(rs,k)=>{ let t=0,n=0; for(const r of rs){ if(has(r[k])){ t+=r[k]; n++; } } return n?t:null; };
const median=a=>{ const s=a.filter(has).sort((x,y)=>x-y); if(!s.length) return null; const m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2; };
const quant=(a,q)=>{ const s=a.filter(has).sort((x,y)=>x-y); return s.length?s[Math.min(s.length-1,Math.floor(q*s.length))]:null; };
const chg=(c,p)=>has(c)&&has(p)&&p!==0?(c-p)/Math.abs(p)*100:null;
const lastOn=(rs,k,day)=>{ for(let i=(rs||[]).length-1;i>=0;i--){ const r=rs[i]; if(r&&r.d&&r.d<=day&&has(r[k])) return r; } return null; };
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const join=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
const clip=(s,n)=>{ s=String(s||'').replace(/\s+/g,' ').trim(); return s.length>n?s.slice(0,n-1).replace(/[\s,.;:!?-]+\S*$/,'')+'…':s; };
const sumQ=(ev,f)=>ev.filter(f).reduce((t,x)=>t+(has(x.q)?x.q:0),0);
/* daily average over the days that have the figure: a source that reports a few days late is not penalised */
function avg(rs,k,a,b){ const x=inR(rs,a,b).filter(r=>has(r[k])); if(!x.length) return {a:null,n:0,s:null,last:null};
  const s=x.reduce((t,r)=>t+r[k],0); return {a:s/x.length,n:x.length,s,last:x[x.length-1].d}; }
function cmp(C,rs,k){ const c=avg(rs,k,C.cs,C.end), p=avg(rs,k,C.ps,C.pe), ok=c.n>=C.L/2&&p.n>=C.L/2;
  return {cur:c.a,prev:p.a,d:ok?chg(c.a,p.a):null,nc:c.n,np:p.n,sc:c.s,sp:p.s,last:c.last}; }

/* ================= normal swings: is a change real? =================
   Every comparison is the last 28 days against the 28 before. To tell a real change from a normal swing, the same comparison
   is made at weekly steps over the past six months; the typical size of those past changes is the yardstick. A change counts
   only when it is bigger than that ("likely"), or one and a half times bigger ("clear"). */
function sumWin(rs,f,a,b){ let s=0,n=0; for(const r of rs||[]){ if(!r||r.d<a||r.d>b) continue; const v=f(r); if(has(v)){ s+=v; n++; } } return {s,n}; }
const meanGet=(rs,f)=>(a,b)=>{ const w=sumWin(rs,f,a,b); return w.n?{a:w.s/w.n,n:w.n}:null; };
function swing(C,get,min){ const L=C.L, at=e=>{ const c=get(addD(e,-(L-1)),e), p=get(addD(e,-(2*L-1)),addD(e,-L)); return c&&p&&c.n>=L/2&&p.n>=L/2&&has(c.a)&&has(p.a)&&p.a>0?{c:c.a,p:p.a,d:(c.a/p.a-1)*100}:null; };
  const now=at(C.end); if(!now) return null; const hist=[]; for(let i=1;i<=26;i++){ const x=at(addD(C.end,-7*i)); if(x) hist.push(Math.abs(x.d)); }
  const T=hist.length>=6?median(hist):null, thr=Math.max(min||8,has(T)?T:15), a=Math.abs(now.d);
  return {cur:now.c,prev:now.p,d:now.d,T,thr,lvl:a>=1.5*thr?'clear':a>=thr?'likely':'normal',dir:a>=thr?Math.sign(now.d):0}; }
const swingTxt=(w,what)=>!w||!has(w.T)||w.T<5?'':w.lvl==='normal'?` That is within ${what}’s normal month-to-month swings (typically ±${pct(w.T)}).`:` That is beyond ${what}’s normal month-to-month swings (typically ±${pct(w.T)}).`;
/* the newest day can still be filling in (Google Analytics in particular): if it is today or yesterday and well below normal, leave it out of day-level reads */
function lastIdx(rs,f,end){ for(let i=(rs||[]).length-1;i>=0;i--){ const r=rs[i]; if(r&&r.d<=end&&has(f(r))) return i; } return -1; }
function provisional(rs,f,C){ const i=lastIdx(rs,f,C.end); if(i<0||!C.today) return false; const r=rs[i]; if(ddiff(r.d,C.today)>1) return false;
  const prev=[]; for(let j=i-1;j>=0&&prev.length<14;j--){ const v=f(rs[j]); if(has(v)) prev.push(v); } const m=median(prev); return has(m)&&m>0&&f(r)<0.6*m; }
function momentum(rs,f,C){ const i=lastIdx(rs,f,C.end); if(i<0) return null; let e=rs[i].d; if(provisional(rs,f,C)) e=addD(e,-1);
  const g=meanGet(rs,f), c=g(addD(e,-6),e), p=g(addD(e,-13),addD(e,-7)); return c&&p&&c.n>=4&&p.n>=4&&p.a>0?{d:(c.a/p.a-1)*100,e}:null; }
/* Instagram followers on a day: the latest known total, plus each day's net change since */
function igTotal(D,day){ let k=null; const see=(d,t)=>{ if(d&&d<=day&&has(t)&&(!k||d>=k.d)) k={d,t}; };
  (D.ig||[]).forEach(r=>see(r.d,r.ft)); (D.igFH||[]).forEach(r=>see(r.d,r.t)); (D.igFS||[]).forEach(r=>see(r.d,r.t)); if(!k) return null;
  let t=k.t, last=k.d; (D.igFH||[]).forEach(r=>{ if(r.d>k.d&&r.d<=day){ const n=has(r.n)?r.n:(has(r.g)||has(r.l)?(r.g||0)-(r.l||0):null); if(has(n)){ t+=n; last=r.d; } } });
  return {total:t,day:last}; }
/* installs on both stores, each averaged over its own days so a late Google Play report doesn't look like a drop */
const instGet=D=>(a,b)=>{ const p=meanGet(D.play,r=>r.i)(a,b), q=meanGet(D.apple,r=>has(r.dl)?r.dl+(r.rd||0):null)(a,b); if(!q) return null; return {a:q.a+(p?p.a:0),n:Math.min(q.n,p?p.n:q.n)}; };

/* ================= where each action belongs ================= */
const AREAS={
  content:{n:'Content',c:'var(--brand)',g:'social',page:'social'},
  facebook:{n:'Facebook',c:'var(--fb)',g:'social',page:'facebook'},
  instagram:{n:'Instagram',c:'var(--ig)',g:'social',page:'instagram'},
  youtube:{n:'YouTube',c:'var(--yt)',g:'social',page:'youtube'},
  tiktok:{n:'TikTok',c:'var(--tt)',g:'social',page:'tiktok'},
  x:{n:'X',c:'var(--x)',g:'social',page:'x'},
  website:{n:'Website',c:'var(--web)',g:'website',page:'website'},
  app:{n:'App growth',c:'var(--play)',g:'app',page:'installs'},
  stability:{n:'App stability',c:'var(--bad)',g:'app',page:'stability'},
  subs:{n:'Subscriptions',c:'var(--gold)',g:'revenue',page:'subs'},
  adrev:{n:'Ad revenue',c:'var(--ads)',g:'revenue',page:'adrev'},
  paid:{n:'Paid ads',c:'var(--ads)',g:'revenue',page:'ads'},
  data:{n:'Data',c:'var(--ink-3)',g:'data',page:'updates'}
};
const GROUPS=[['all','All'],['social','Social'],['website','Website'],['app','App'],['revenue','Revenue'],['data','Data']];
const PAGE_NAME={social:'Social overview',facebook:'Facebook',instagram:'Instagram',youtube:'YouTube',tiktok:'TikTok',x:'X',website:'Website',installs:'App installs',stability:'App stability',subs:'Subscribers and revenue',adrev:'Ad revenue',ads:'Paid ads',updates:'Updates',data:'Data coverage'};

/* ================= posts on every platform, read the same way ================= */
const PL={
  facebook:{n:'Facebook',rows:D=>D.fbPosts||[],v:p=>p.v,feed:p=>!/story/i.test(p.ty||''),u:p=>p.u},
  instagram:{n:'Instagram',rows:D=>D.igPosts||[],v:p=>p.v,feed:p=>!/story/i.test(p.ty||''),u:p=>p.u},
  youtube:{n:'YouTube',rows:D=>D.ytVideos||[],v:p=>p.v,feed:()=>true,u:p=>p.u||(p.id?'https://www.youtube.com/watch?v='+p.id:'')},
  tiktok:{n:'TikTok',rows:D=>D.ttVideos||[],v:p=>p.v,feed:()=>true,u:p=>p.u||(p.id&&HD.tiktok?'https://www.tiktok.com/@'+String(HD.tiktok).replace(/^@/,'')+'/video/'+p.id:'')},
  x:{n:'X',rows:D=>D.xPosts||[],v:p=>p.im,feed:()=>true,u:p=>p.u||(p.id?'https://x.com/'+String(HD.x||'i').replace(/^@/,'')+'/status/'+p.id:'')}
};
const feedIn=(k,D,a,b)=>inR(PL[k].rows(D),a,b).filter(p=>PL[k].feed(p)&&has(PL[k].v(p)));
const TYPE={photo:['single photos','single photo'],carousel:['carousels','carousel'],reel:['Reels','Reel'],video:['videos','video'],link:['link posts','link post'],status:['text posts','text post'],post:['posts','post']};
const tyName=(t,one)=>(TYPE[t]||[t+'s',t])[one?1:0];
/* a YouTube Short: watched for a minute or less on average and mostly to the end (or tagged #shorts) */
const isShort=v=>/#shorts?\b/i.test(v.t||'')||(has(v.ad)&&v.ad<=60&&(!has(v.ap)||v.ap>=45));
/* captions that point people at the app */
const PROMO=/\b(app|apps|download|downloads|subscribe|subscription|subscriptions|premium|app ?store|google play|play store|free trial|link in bio|linkinbio)\b/i;

/* ================= words in captions: topics, and the same post on two platforms ================= */
const rxEsc=x=>String(x).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), squash=x=>String(x).toLowerCase().replace(/[^a-z0-9à-ÿ]+/g,'');
/* names of two or more words are kept together (config.js topics.phrases: { 'new york': 'New York' }) */
const PHRASES=Object.keys(TOPICS.phrases||{}).filter(k=>/\s/.test(k.trim())).map(k=>[new RegExp('\\b'+rxEsc(k.trim().toLowerCase()).replace(/\s+/g,'\\s+')+'\\b','g'),squash(k)]);
/* other spellings and hashtags for the same thing (topics.same: { 'nyc': 'new york' }) */
const SYN=Object.fromEntries(Object.entries(TOPICS.same||{}).map(([k,v])=>[squash(k),squash(v)]));
/* short names that are still names (three letters or fewer), and names with digits */
const SHORT=new Set(Object.keys(TOPICS.phrases||{}).map(squash).filter(w=>w.length<4)), DIGIT_OK=new Set(Object.keys(TOPICS.phrases||{}).map(squash).filter(w=>/\d/.test(w)));
const keep=w=>!((w.length<4&&!SHORT.has(w))||/^\d+$/.test(w)||(/\d/.test(w)&&!DIGIT_OK.has(w))||STOP.has(w));
const LABEL=Object.fromEntries(Object.entries(TOPICS.phrases||{}).map(([k,v])=>[squash(k),String(v||k)]));
const STOP=new Set(('about above after again against also although always among another anyone anything around away back because become been before being '+
  'below best better between both bring came cannot come comes coming could days does doing done down during each either else even ever every first from '+
  'further gets getting give given giving goes going gone good great have having here heres hers herself himself into itself just keep know last least less '+
  'like little look looking looks made make makes making many more most much must need never news next nothing once only other others ours over part really '+
  'right said same says should show since some something still such sure take taken than that thats their theirs them then there these they thing things '+
  'think this those though three through time times today together tonight told took toward under until upon very want wants watch week weekend what whats '+
  'when where which while whole will with within without would year years your yours youre http https www com amp just theyre were well dont didnt cant '+
  'wont isnt arent doesnt hasnt havent ever another link bio full story '+
  'follow comment comments share drop below thoughts reckon four five seven eight nine eleven twelve fifteen twenty thirty fifty hundred thousand million '+
  'minute minutes hours world ahead officially official announced confirmed breaking huge massive incredible unreal insane fans another '+
  'monday tuesday wednesday thursday friday saturday sunday january february march april june july august september october november december '+
  'south north east west new episode part video photo post reel reels story shorts').split(/\s+/).concat((TOPICS.ignore||[]).map(w=>String(w).toLowerCase())));
function toks(s){ let t=String(s||'').toLowerCase().replace(/[‘’ʼ]/g,"'").replace(/https?:\/\/\S+/g,' ');
  for(const [re,to] of PHRASES) t=t.replace(re,to);
  const out=new Set();
  for(let w of t.split(/[^a-z0-9'à-ÿ]+/)){ w=w.replace(/'s$|'$/,'').replace(/'/g,''); const k=SYN[w]||w; if(!keep(k)) continue; out.add(k); }
  return out; }
/* how a word is written mid-sentence: capitalised (or as a #hashtag or @mention) means a name: a team, player or competition.
   The first word of a sentence says nothing either way, so it is skipped. */
function caseToks(s){ let t=String(s||'').replace(/[‘’ʼ]/g,"'").replace(/https?:\/\/\S+/g,' ');
  for(const [re,to] of PHRASES) t=t.replace(new RegExp(re.source,'gi'),m=>/[A-Z]/.test(m[0])?cap(to):to);
  const up=new Set(), low=new Set(), re=/([#@]?)([A-Za-z0-9'À-ÿ]+)/g; let m, prev=0;
  while((m=re.exec(t))){ const gap=t.slice(prev,m.index), start=prev===0||/[.!?:\n…—|]\s*$/.test(gap), w=m[2];
    const lw=w.toLowerCase().replace(/'s$|'$/,'').replace(/'/g,''), key=SYN[lw]||lw;
    prev=m.index+m[0].length;
    if(!keep(key)) continue;
    if(m[1]) up.add(key); else if(start||(w.length>5&&w===w.toUpperCase())) continue; else if(/[A-ZÀ-Þ]/.test(w[0])) up.add(key); else low.add(key); }
  return {up,low}; }
const TK=new WeakMap(), PK=new WeakMap();
const tk=p=>{ let x=TK.get(p); if(!x){ x=toks(p.t); TK.set(p,x); } return x; };
const pk=p=>{ let x=PK.get(p); if(!x){ x=caseToks(p.t); PK.set(p,x); } return x; };
const label=w=>LABEL[w]||cap(w);
function overlap(a,b){ let s=0; for(const w of a) if(b.has(w)) s++; return {s,j:s/((a.size+b.size-s)||1)}; }
const same=(a,b)=>{ const o=overlap(a,b); return o.s>=4||(o.s>=2&&o.j>=0.3); };
const share=(a,b)=>{ let s=0; for(const x of a) if(b.has(x)) s++; return s/Math.min(a.size,b.size||1); };
/* names (people, places, products, series) in a set of posts, with how their posts do against the rest */
function topicStats(posts){ const P=posts.map(p=>({v:p.v,k:tk(p),pk:pk(p),p})); const N=P.length; if(N<40) return null;
  const by=new Map(), up=new Map(), lo=new Map();
  P.forEach((p,i)=>{ p.k.forEach(w=>{ let a=by.get(w); if(!a) by.set(w,a=[]); a.push(i); }); p.pk.up.forEach(w=>up.set(w,(up.get(w)||0)+1)); p.pk.low.forEach(w=>lo.set(w,(lo.get(w)||0)+1)); });
  const minN=Math.max(6,Math.ceil(N*0.02)), maxN=Math.floor(N*0.5), res=[], names=new Set(), isName=w=>(up.get(w)||0)>=2&&(up.get(w)||0)>=0.7*((up.get(w)||0)+(lo.get(w)||0));
  for(const [w,idx] of by){ if(!isName(w)||idx.length<3) continue; names.add(w); if(idx.length<minN||idx.length>maxN) continue; const inS=new Set(idx);
    const mi=median(idx.map(i=>P[i].v)), mo=median(P.filter((x,i)=>!inS.has(i)).map(x=>x.v)); if(!mo) continue;
    res.push({w,n:idx.length,lift:mi/mo,idx:inS,top:idx.map(i=>P[i]).sort((a,b)=>b.v-a.v)[0]}); }
  return {N,res,names}; }
function pickTopics(list,good){ const out=[], sc=r=>Math.log(r.lift)*Math.sqrt(r.n);
  for(const r of list.sort((a,b)=>good?sc(b)-sc(a):sc(a)-sc(b))){ if(out.some(o=>share(r.idx,o.idx)>=0.6)) continue; out.push(r); if(out.length>=3) break; }
  return out; }
/* a name's share of posts and of views in a period */
function contrib(posts,w){ const N=posts.length, tv=posts.reduce((t,p)=>t+p.v,0), a=posts.filter(p=>tk(p).has(w));
  return {n:a.length,ps:N?a.length/N*100:0,vs:tv?a.reduce((t,p)=>t+p.v,0)/tv*100:0,med:median(a.map(p=>p.v))}; }

/* ================= the rules =================
   Each rule adds an action (something to change) or a win (something to keep doing).
   score: 70+ do first, 45-69 next, below 45 when there is time. worth: what fixing it is worth, from our own numbers. */
const RULES=[];
const rule=(name,f)=>{ const i=RULES.findIndex(r=>r.name===name); if(i>=0) RULES[i]={name,f}; else RULES.push({name,f}); };
function act(C,a){ const ar=AREAS[a.area]||AREAS.data;
  /* the latest week: still getting worse moves an action up, already recovering moves it down */
  if(a.mo){ try{ const m=momentum(a.mo.rs,a.mo.f,C); if(m&&Math.abs(m.d)>=15){ const worse=a.mo.down?m.d<0:m.d>0;
      a.why+=worse?` It is still getting worse: ${a.mo.what} in the last 7 days were ${m.d<0?'down':'up'} ${pct(Math.abs(m.d))} on the week before.`:` The last 7 days look better: ${a.mo.what} were ${m.d<0?'down':'up'} ${pct(Math.abs(m.d))} on the week before, so it may already be turning.`;
      a.score+=worse?6:-8; if(worse) a.wk=true; } }catch(e){} delete a.mo; }
  C.acts.push(Object.assign({page:ar.page,steps:[],links:[]},a,{score:Math.max(1,Math.min(99,Math.round(a.score)))})); }
function win(C,w){ const ar=AREAS[w.area]||AREAS.data; C.wins.push(Object.assign({page:ar.page,mag:0},w)); }

/* ---------- app stability: Google's own limits, and what crossing them costs ---------- */
rule('stability',C=>{ const rs=(C.D.qual||[]).filter(r=>r.d<=C.end); if(!rs.length) return;
  const e=rs[rs.length-1].d, st=addD(e,-27); let dw=0,ua=0,uc=0,a=0,c=0;
  inR(rs,st,e).forEach(r=>{ const u=has(r.dau)?r.dau:0; if(has(r.uanr)) ua+=r.uanr*u; if(has(r.ucr)) uc+=r.ucr*u; if(has(r.anr)) a+=r.anr*u; if(has(r.cr)) c+=r.cr*u; dw+=u; });
  if(!dw) return;
  const qa=(ua||!a?ua:a)/dw*100, qc=(uc||!c?uc:c)/dw*100; C.qa=qa; C.qc=qc;
  const S=C.store, vis=S.cur&&S.prev&&S.cur.days>=7&&S.prev.days>=14?chg(S.cur.vis,S.prev.vis):null, fell=has(vis)&&vis<=-15;
  const lost=fell&&has(S.cur.conv)?(S.prev.vis-S.cur.vis)*S.cur.conv/100*28:null;
  const visTxt=fell?` Store-page visits on Google Play have already fallen ${pct(-vis)} (from ${full(S.prev.vis)} to ${full(S.cur.vis)} a day) while the share of visitors who install held at about ${pct(S.cur.conv)}: the pattern you would expect if Google Play is showing the app less.`:'';
  if(qa>0.47) act(C,{id:'anr',area:'stability',score:86+Math.min(9,(qa/0.47-1)*6),title:'Fix the Android app freezes',
    why:`In the 28 days to ${dS(e)}, the app froze (stopped responding) for ${pct(qa,2)} of daily users. Google’s limit is 0.47%. Above it, Google Play warns people before they install and shows the app lower in search and recommendations.${visTxt}`,
    steps:['In Google Play Console, open Android vitals, then ANRs, and fix the three biggest clusters first.','Check whether the stack traces point to the ad or analytics SDKs (AdMob, Firebase): work they do on the main thread is a common cause.','Release the fix, then check this rate weekly until it is under 0.47%; Google judges the last 28 days.'],
    worth:lost?`About ${full(lost)} more Android installs a month if store visits recover to ${full(S.prev.vis)} a day`:'Keeps the app visible in Google Play search and recommendations',
    target:`Under 0.47% (now ${pct(qa,2)})`});
  if(qc>1.09) act(C,{id:'crash',area:'stability',score:86+Math.min(9,(qc/1.09-1)*6),title:'Fix the Android app crashes',
    why:`In the 28 days to ${dS(e)}, the app crashed for ${pct(qc,2)} of daily users. Google’s limit is 1.09%; above it, Google Play shows the app lower and can warn people before they install.${qa>0.47?'':visTxt}`,
    steps:['In Google Play Console, open Android vitals, then Crashes, and fix the biggest crash clusters first.','Check the rate weekly after each release.'],
    worth:lost&&!(qa>0.47)?`About ${full(lost)} more Android installs a month if store visits recover`:'Keeps the app visible in Google Play search and recommendations',
    target:`Under 1.09% (now ${pct(qc,2)})`});
  if(qa<=0.47&&qc<=1.09) win(C,{id:'stable',area:'stability',title:'The Android app is stable',why:`Freezes ${pct(qa,2)} and crashes ${pct(qc,2)} of daily users in the 28 days to ${dS(e)}, both inside Google’s limits.`,mag:4});
});

/* ---------- new installs: how many, and why they moved ---------- */
rule('installs',C=>{ const D=C.D, pi=cmp(C,D.play,'i'), dl=cmp(C,D.apple,'dl'), rd=cmp(C,D.apple,'rd');
  if(!has(pi.d)&&!has(dl.d)) return;
  const cur=(pi.cur||0)+(dl.cur||0)+(rd.cur||0), prev=(pi.prev||0)+(dl.prev||0)+(rd.prev||0), d=has(pi.d)&&has(dl.d)?chg(cur,prev):(has(pi.d)?pi.d:dl.d);
  if(!has(d)) return;
  const src={}; inR(D.aInst,C.cs,C.end).forEach(r=>{ if(/first.?time/i.test(r.t||'')) src[r.src]=(src[r.src]||0)+(r.n||0); });
  const ft=Object.values(src).reduce((t,x)=>t+x,0), search=Object.keys(src).filter(k=>/search/i.test(k)).reduce((t,k)=>t+src[k],0), sh=ft>=30?search/ft*100:null; C.searchShare=sh;
  const ic=(dl.cur||0)+(rd.cur||0), ip=(dl.prev||0)+(rd.prev||0), idc=has(dl.d)?chg(ic,ip):null;
  const split=`${full(pi.cur)} a day on Android${has(pi.d)?` (${pi.d>=0?'up':'down'} ${pct(Math.abs(pi.d))})`:''} and ${full(ic)} on iPhone${has(idc)?` (${idc>=0?'up':'down'} ${pct(Math.abs(idc))})`:''}`;
  if(d<=-10){ const S=C.store; let diag='', reach=false;
    if(has(pi.d)&&pi.d<=-10&&S.cur&&S.prev){ const vd=chg(S.cur.vis,S.prev.vis), cd=has(S.cur.conv)&&has(S.prev.conv)?S.cur.conv-S.prev.conv:null;
      if(has(vd)&&vd<=-10&&(!has(cd)||cd>-5)){ reach=true; diag=` On Android the problem is reach, not persuasion: Google Play store-page visits fell ${pct(-vd)} while ${pct(S.cur.conv)} of visitors still installed (${pct(S.prev.conv)} before).`; }
      else if(has(cd)&&cd<=-5) diag=` On Android, fewer store visitors are installing: ${pct(S.cur.conv)} against ${pct(S.prev.conv)} before, so the store listing itself needs work.`; }
    const sw=swing(C,instGet(D)), calm=sw&&sw.lvl==='normal';
    act(C,{id:'installs-down',area:'app',score:Math.min(calm?52:68,44+Math.abs(d)),title:'Get app installs growing again',
      why:`Installs averaged ${full(cur)} a day in the 28 days to ${dS(C.end)}, down ${pct(-d)} on the 28 days before: ${split}.${swingTxt(sw,'installs')}${diag}${pi.last&&pi.last<addD(C.end,-3)?` (Google Play figures run to ${dS(pi.last)}.)`:''}`,
      steps:[reach&&C.qa>0.47?'Fix the freezes first (see that action): it is the most likely reason Google Play is showing the app to fewer people.':'Refresh the Google Play listing: the first two screenshots should show the main reason to download, with a short line of text.',
        has(sh)&&sh>=50?`App Store search brings ${pct(sh)} of new iPhone users: put the names people search for in ${WD_.niche} in the App Store subtitle and keywords.`:'Ask happy users for a rating after a good moment in the app (a win, a big story): ratings lift both stores’ rankings.',
        'Point social audiences at the app every week (see the app promotion action).'],
      worth:`Back to ${full(prev)} installs a day is about ${full((prev-cur)*28)} more a month`,target:`Back to ${full(prev)} installs a day`,
      mo:{rs:D.apple,f:r=>has(r.dl)?r.dl+(r.rd||0):null,what:'iPhone installs',down:true}}); }
  else{ const sw=swing(C,instGet(D)); if(sw&&sw.dir>0) win(C,{id:'installs-up',area:'app',title:`App installs up ${pct(sw.d)}`,why:`${full(cur)} a day against ${full(prev)} in the 28 days before: ${split}.`,mag:sw.d}); }
});

/* ---------- Android users who leave, and who pay less ---------- */
rule('retention',C=>{ const D=C.D, a=C.c90, pl=inR(D.play,a,C.end); if(pl.length<30) return;
  const i=total(pl,'i'), u=has(total(pl,'ue'))?total(pl,'ue'):total(pl,'uu'); if(!has(i)||i<300||!has(u)) return;
  const r=u/i*100, last=pl[pl.length-1].d, perMonth=i/(ddiff(pl[0].d,last)+1)*28;
  const ad=total(inR(D.apple,a,C.end),'dl'), del=total(inR(D.appleDel,a,C.end),'n'), ios=has(ad)&&ad>100&&has(del)?del/ad*100:null;
  const ps=inR(D.pSubs,a,C.end), pn=total(ps,'n'), andPay=ps.length>=30&&has(pn)?pn/i*100:null;
  const iosPaid=sumQ(inR(D.aEv,a,C.end),x=>/^subscribe$|^paid subscription from introductory/i.test(x.e)), iosPay=has(ad)&&ad>100?iosPaid/ad*100:null;
  const payTxt=has(andPay)&&has(iosPay)&&iosPay>=andPay*1.3?` They are also less likely to pay: ${one(andPay)} new subscribers for every 100 Android installs, against ${one(iosPay)} for every 100 iPhone downloads.`:'';
  if(r>=60) act(C,{id:'android-uninstalls',area:'app',score:Math.min(84,55+(r-60)*0.8),title:'Find out why Android users leave',
    why:`Over the last 90 days, Google Play counted ${full(u)} uninstalls for ${full(i)} installs: ${Math.round(r)} for every 100.${has(ios)?` On iPhone it was ${Math.round(ios)} deletions for every 100 downloads.`:''}${payTxt}${last<addD(C.end,-3)?` (Google Play figures run to ${dS(last)}.)`:''}`,
    steps:['Install the app as a new user on a mid-range Android phone and note every point where you would give up: sign-in, permissions, speed, the first paywall.',
      C.qa>0.47?'Fix the freezes first (see that action): an app that stops responding is the most common reason people uninstall.':'Check Android vitals for slow start-up after each release.',
      'Ask the people who leave: turn on the uninstall survey in Play Console and add a one-question exit prompt in the app.'],
    worth:`Cutting it to 60 in 100 keeps about ${full((r-60)/100*perMonth)} more Android users every month`,
    target:'Under 60 uninstalls for every 100 installs'});
});

/* ---------- the app on social: promoted at all, and does it work ---------- */
rule('appPromo',C=>{ const D=C.D, a=C.c90, posts=[...feedIn('facebook',D,a,C.end),...feedIn('instagram',D,a,C.end)]; if(posts.length<100) return;
  const promo=posts.filter(p=>PROMO.test(p.t||'')), views=Object.values(C.views).reduce((t,x)=>t+x,0);
  if(promo.length>=6){ /* measure it: installs on the day after an app post against every other day */
    const ap=new Map((D.apple||[]).map(r=>[r.d,r])), pp=new Map((D.play||[]).map(r=>[r.d,r])), inst=d=>{ const x=ap.get(d), y=pp.get(d); return x&&y&&has(x.dl)&&has(y.i)?x.dl+y.i:null; };
    const nd=new Set(promo.map(p=>addD(p.d,1))), after=[], base=[]; for(let d=a;d<=C.end;d=addD(d,1)){ const v=inst(d); if(has(v)) (nd.has(d)?after:base).push(v); }
    const lift=after.length>=4&&base.length>=20?chg(median(after),median(base)):null; if(!has(lift)) return;
    if(lift>=15) win(C,{id:'app-posts',area:'app',title:`App posts lift installs by ${pct(lift)}`,why:`On the day after an app post, installs had a median of ${full(median(after))}, against ${full(median(base))} on other days (${full(promo.length)} app posts in 90 days).`,mag:lift/2});
    else if(lift<5) act(C,{id:'app-posts',area:'app',score:52,title:'Make the app posts work harder',
      why:`${full(promo.length)} posts mentioned the app in the last 90 days, but installs on the day after (median ${full(median(after))}) were no higher than on other days (${full(median(base))}).`,
      steps:[`Show the app doing one thing people want (${WD_.appFeatures}) in the first second of the post.`,'Put the download link in the first comment and the bio, and say so in the caption.'],target:'Installs up 15% on the day after an app post'});
    return; }
  if(views<3e6) return;
  const src={}; inR(D.aInst,C.cs,C.end).forEach(r=>{ if(/first.?time/i.test(r.t||'')) src[r.src]=(src[r.src]||0)+(r.n||0); });
  const ft=Object.values(src).reduce((t,x)=>t+x,0), search=Object.keys(src).filter(k=>/search/i.test(k)).reduce((t,k)=>t+src[k],0), ref=Object.keys(src).filter(k=>/referrer/i.test(k)).reduce((t,k)=>t+src[k],0);
  const extra=views/1e4;
  act(C,{id:'app-promo',area:'app',score:74,title:'Start promoting the app on social',
    why:`${promo.length?`Only ${full(promo.length)} of ${full(posts.length)}`:`None of the ${full(posts.length)}`} Facebook and Instagram posts in the last 90 days ${promo.length===1?'mentions':'mention'} the app, downloading or subscribing, yet our posts drew ${abbr(views)} views in the last 28 days.${ft>=30?` New iPhone users come almost entirely from App Store search (${pct(search/ft*100)}); links from other apps and websites bring ${pct(ref/ft*100)}.`:''} The audience is there; we are not sending it to the app.`,
    steps:[`Post about the app three times a week on Facebook and Instagram: show one feature in action (${WD_.appFeatures}), with the download link in the first comment and the bio.`,`Add a link sticker to Instagram stories around ${WD_.moments}, when interest peaks.`,'Keep the word “app” in those captions: this page then compares installs on the day after each app post with other days and reports whether it works.'],
    worth:`If 1 view in 10,000 became an install, that is about ${full(extra)} more installs a month${C.inst28>0?`, ${pct(extra/C.inst28*100)} more than today`:''}`,
    target:'3 app posts a week, with installs up on the day after each one'});
});

/* ---------- subscriptions: what worked, renewals, trials ---------- */
rule('subsPush',C=>{ const D=C.D, ev=inR(D.aEv,C.c90,C.end); if(ev.length<10) return;
  const isNew=x=>/^start introductory offer|^start offer code|^subscribe$|^reactivate/i.test(x.e);
  const wk=[]; for(let i=12;i>=0;i--){ const e=addD(C.end,-7*i), s=addD(e,-6), x=ev.filter(v=>v.d>=s&&v.d<=e);
    wk.push({s,e,n:sumQ(x,isNew),tr:sumQ(x,v=>/^start introductory/i.test(v.e)),oc:sumQ(x,v=>/^start offer code/i.test(v.e)),sub:sumQ(x,v=>/^subscribe$/i.test(v.e))}); }
  const best=wk.reduce((a,b)=>b.n>a.n?b:a), typ=median(wk.map(w=>w.n));
  if(best.n<8||best.n<2.5*Math.max(1,typ)||ddiff(best.e,C.end)<10) return;
  const before=lastOn(D.aSubs,'s',addD(best.s,-1)), after=(D.aSubs||[]).filter(r=>r.d>best.s&&r.d<=addD(best.e,28)&&has(r.s)).reduce((m,r)=>!m||r.s>m.s?r:m,null);
  const gain=before&&after?after.s-before.s:null; C.pushWeek=best.s;
  const dlW=total(inR(D.apple,best.s,best.e),'dl'), dlT=(avg(D.apple,'dl',C.c90,C.end).a||0)*7, upB=dlW?best.tr/dlW*100:null, upT=dlT?median(wk.map(w=>w.tr))/dlT*100:null;
  const parts=[best.tr?`${full(best.tr)} free trials`:'',best.oc?`${full(best.oc)} offer codes`:'',best.sub?`${full(best.sub)} direct subscriptions`:''].filter(Boolean);
  const worthShare=has(gain)&&gain>0&&has(C.arpu)&&C.rev.total>0?gain*C.arpu/C.rev.total:0;
  act(C,{id:'subs-push',area:'subs',score:has(gain)&&gain>0?52+Math.min(22,worthShare*80):46,title:`Repeat the subscription push from the week of ${dS(best.s)}`,
    why:`That week, ${join(parts)} started, against about ${full(typ)} a week normally.${has(gain)&&gain>0?` Paying iPhone subscribers went from ${full(before.s)} to ${full(after.s)} once they converted.`:''}${has(upB)&&has(upT)&&upB>=upT*1.5?` ${one(upB)} of every 100 new iPhone users started a trial that week, against ${one(upT)} in a normal week.`:''}`,
    steps:[`Repeat what drove that week (the offer codes and the trial push) around the next of your ${WD_.moments}, when interest is highest.`,'Show the free trial in the app’s first screens, not only behind the paywall: that week showed people take it when they see it.','Judge it here: trials that week, then paid conversions one to two weeks later.'],
    worth:has(gain)&&gain>0&&has(C.arpu)?`The last one added ${full(gain)} paying subscribers, about ${usd(gain*C.arpu)} every 4 weeks after Apple’s fee`:'More paying subscribers within two weeks',
    target:`One push like this around each of your ${WD_.moments}`});
});
rule('renewals',C=>{ const D=C.D, ev=inR(D.aEv,C.cs,C.end); if(!ev.length) return;
  const cancels=sumQ(ev,x=>x.e==='Cancel'), renews=sumQ(ev,x=>/^renew$|^renewal from billing/i.test(x.e)), fails=sumQ(ev,x=>/^billing retry from paid/i.test(x.e));
  /* trials and offer codes that end without paying also count as cancellations, so take them out first */
  const starts=sumQ(inR(D.aEv,addD(C.cs,-7),addD(C.end,-7)),x=>/^start introductory|^start offer code/i.test(x.e)), conv=sumQ(ev,x=>/^paid subscription from introductory/i.test(x.e));
  const trialEnds=Math.min(cancels,Math.max(0,starts-conv)), paidC=cancels-trialEnds, paying=avg(D.aSubs,'s',C.cs,C.end).a;
  if(!has(paying)||paying<20) return; const r=paidC/paying*100;
  if(r>=8) act(C,{id:'churn',area:'subs',score:Math.min(78,52+(r-8)*1.5),title:'Keep more paying subscribers',
    why:`About ${full(paidC)} paying iPhone subscribers turned off renewal in the 28 days to ${dS(C.end)} (${pct(r)} of the ${full(paying)} paying on an average day), against ${full(renews)} renewals.${trialEnds?` Another ${full(trialEnds)} cancellations were free trials or offer codes ending.`:''}${fails?` ${full(fails)} payments failed.`:''}`,
    steps:['Offer a yearly plan at a clear discount (for example two months free): yearly subscribers cancel far less often.','When someone cancels, ask why with one tap and offer a cheaper month or a pause.',`Remind subscribers what they get before each renewal: new features, exclusive content, extras for ${WD_.moments}.`],
    worth:has(C.arpu)?`Each subscriber kept is worth about ${usd(C.arpu)} every 4 weeks; halving cancellations keeps about ${usd(paidC/2*C.arpu)} a month, and it adds up every month`:'',
    target:'Under 8% of paying subscribers cancelling every 28 days'});
  else if(renews>=8) win(C,{id:'renewals',area:'subs',title:'Paying subscribers are renewing',why:`${full(renews)} renewals in the 28 days to ${dS(C.end)}.${cancels&&trialEnds>=cancels/2?` Most of the ${full(cancels)} cancellations were free trials or offer codes ending, not paying subscribers leaving.`:''}`,mag:6});
});
rule('trials',C=>{ const D=C.D, a=addD(C.end,-96), b=addD(C.end,-7), ev=D.aEv||[];
  const starts=sumQ(ev,x=>x.d>=a&&x.d<=b&&/^start introductory offer|^reactivate with introductory offer/i.test(x.e)), paid=sumQ(ev,x=>x.d>=addD(a,7)&&x.d<=C.end&&/^paid subscription from introductory offer/i.test(x.e));
  if(starts<10) return; const r=Math.min(100,paid/starts*100), mo=starts/90*28;
  if(r<40) act(C,{id:'trials',area:'subs',score:44+(40-r)/2,title:'Turn more free trials into paying subscribers',
    why:`${full(paid)} of ${full(starts)} iPhone free trials became paying in the last 90 days (${pct(r)}).`,
    steps:['Send a reminder the day before a trial ends that lists what subscribers get.','Show the main benefits again on day 2 and day 5 of the trial.','Make the price and trial length plain on the paywall: surprise charges lead to refunds and cancellations.'],
    worth:has(C.arpu)?`Each 10 points of conversion is about ${one(mo*0.1)} more paying subscribers a month (${usd(mo*0.1*C.arpu)} every 4 weeks, adding up)`:'',
    target:'Half of trials or more become paying'});
  else if(r>=55) win(C,{id:'trials-good',area:'subs',title:`${pct(r)} of free trials become paying`,why:`${full(paid)} of ${full(starts)} iPhone trials converted in the last 90 days.`,mag:r/6});
});
rule('subscribers',C=>{ const D=C.D, aN=lastOn(D.aSubs,'s',C.end), aP=lastOn(D.aSubs,'s',C.pe), pN=lastOn(D.pSubs,'a',C.end), pP=lastOn(D.pSubs,'a',C.pe);
  const rv=swing(C,meanGet(D.apple,r=>r.rev)); if(rv&&rv.dir>0&&rv.cur>=1) win(C,{id:'rev-up',area:'subs',title:`iPhone subscription revenue up ${pct(rv.d)}`,why:`${usd(rv.cur)} a day after Apple’s fee, against ${usd(rv.prev)} in the 28 days before.`,mag:rv.d/2});
  if(!aN&&!pN) return;
  const both=aN&&aP&&pN&&pP&&aP.d<aN.d&&pP.d<pN.d, now=(aN?aN.s:0)+(both?pN.a:0), then=both?aP.s+pP.a:(aP&&aN&&aP.d<aN.d?aP.s:null);
  const d=chg(now,then); if(!has(d)) return; C.subsD=d; const who=both?'on both stores':'on iPhone';
  if(d>=5) win(C,{id:'subs-up',area:'subs',title:`Paying subscribers up to ${full(now)}`,why:`${full(then)} paying ${who} on ${dS(C.pe)}, ${full(now)} on ${dS((aN||pN).d)}: up ${pct(d)}.`,mag:d/2+10});
  else if(d<=-5) act(C,{id:'subs-down',area:'subs',score:Math.min(80,58+Math.abs(d)),title:'Stop the fall in paying subscribers',
    why:`${full(then)} paying ${who} on ${dS(C.pe)}, ${full(now)} on ${dS((aN||pN).d)}: down ${pct(-d)}.`,
    steps:['Look at the cancellations and failed payments on the Subscribers page for the days the number dropped.',`Send subscribers a weekly “what you get” message: new features, exclusive content, extras for ${WD_.moments}.`],
    worth:has(C.arpu)?`Each subscriber is worth about ${usd(C.arpu)} every 4 weeks`:'',target:`Back above ${full(then)}`});
});

/* ---------- paid installs against what an install earns ---------- */
rule('paid',C=>{ const D=C.D, sp=(D.ads||[]).filter(r=>r.d<=C.end&&has(r.sp)&&r.sp>0); if(!sp.length) return;
  const inst=sp.filter(r=>has(r.ai)&&r.ai>0), ai=total(inst,'ai'); if(!has(ai)||ai<50) return;
  const cpi=total(inst,'sp')/ai, lastInst=inst[inst.length-1].d, running=sp[sp.length-1].d>=C.cs;
  const a=C.c90, rev=(total(inR(D.apple,a,C.end),'rev')||0)+(-(total(inR(D.earn,a,C.end),'fee')||0)/0.15*0.85)+(total(inR(D.admob,a,C.end),'e')||0);
  const ins=(total(inR(D.play,a,C.end),'i')||0)+(total(inR(D.apple,a,C.end),'dl')||0); if(ins<100) return;
  const rpi=rev/ins; if(!(cpi>3*rpi)) return;
  if(running) act(C,{id:'paid-payback',area:'paid',score:52,title:'Paid installs cost more than they earn',
    why:`Install ads have cost ${usd(cpi)} per install. Over the last 90 days the app earned about ${usd(rpi)} per new install from subscriptions and in-app ads.`,
    steps:['Switch the campaign goal from installs to trials or subscriptions and judge it on cost per subscriber.','Cut the audiences and placements with the highest cost per install first.'],target:`Cost per install under ${usd(rpi*3)}`});
  else act(C,{id:'paid-hold',area:'paid',score:30,title:'Fix retention before paying for installs again',
    why:`The last app-install campaign (${monthOf(lastInst)}) cost ${usd(cpi)} per install. Over the last 90 days the app earned about ${usd(rpi)} per new install from subscriptions and in-app ads, so bought installs would not pay back yet.`,
    steps:['Fix the Android freeze and uninstall actions first.','When you test ads again, optimise for trials or subscriptions rather than installs, and judge them on cost per subscriber.'],
    target:`Each install earning at least a third of what it costs (${usd(cpi/3)})`});
});

/* ---------- in-app ad revenue ---------- */
rule('admob',C=>{ const D=C.D, a=inR(D.admob,C.cs,C.end), p=inR(D.admob,C.ps,C.pe); if(a.length<C.L/2) return;
  const im=total(a,'im'), rq=total(a,'rq'), e=total(a,'e'), fill=has(rq)&&rq>0&&has(im)?im/rq*100:null, ecpm=has(im)&&im>0&&has(e)?e/im*1000:null;
  const pim=total(p,'im'), pe=total(p,'e'), pec=has(pim)&&pim>0&&has(pe)?pe/pim*1000:null, de=p.length>=C.L/2?chg(ecpm,pec):null;
  if(has(fill)&&fill<80&&rq>5000) act(C,{id:'admob-fill',area:'adrev',score:42,title:'Fill more of the app’s ad slots',
    why:`Only ${pct(fill)} of ad requests in the app were filled in the 28 days to ${dS(C.end)}: ${abbr(rq-im)} chances to earn went unused.`,
    steps:['Turn on AdMob mediation or bidding with more ad networks (for example Meta Audience Network and AppLovin).','Check the ad units that fill least in AdMob and fix or remove them.'],
    worth:has(ecpm)?`Filling 85% of requests is about ${usd((rq*0.85-im)/1000*ecpm)} more every 4 weeks`:'',target:'Over 85% of requests filled'});
  if(has(de)&&de<=-15) act(C,{id:'admob-ecpm',area:'adrev',score:40,title:'Find out why in-app ad rates fell',
    why:`The app earned ${usd(ecpm)} per 1,000 ad impressions, down ${pct(-de)} on the 28 days before (${usd(pec)}).`,
    steps:['In AdMob, compare rates by country and ad format: a shift in audience or format usually explains it.','Test rewarded or interstitial formats at natural breaks, where rates are higher than banners.'],
    worth:`Back to ${usd(pec)} is about ${usd(im/1000*(pec-ecpm))} more every 4 weeks`,target:`Back to ${usd(pec)} per 1,000 impressions`});
  const de2=swing(C,meanGet(D.admob,r=>r.e)); if(de2&&de2.dir>0&&de2.cur>=1) win(C,{id:'admob-up',area:'adrev',title:`In-app ad earnings up ${pct(de2.d)}`,why:`${usd(de2.cur)} a day against ${usd(de2.prev)} in the 28 days before.`,mag:de2.d/2});
});

/* ---------- website: measured properly, and worth chasing only as far as it earns ---------- */
rule('website',C=>{ const D=C.D, ch={}, chp={}; inR(D.webCh,C.cs,C.end).forEach(r=>{ ch[r.c]=(ch[r.c]||0)+(r.s||0); }); inR(D.webCh,C.ps,C.pe).forEach(r=>{ chp[r.c]=(chp[r.c]||0)+(r.s||0); });
  const tot=Object.values(ch).reduce((t,x)=>t+x,0), pick=(o,re)=>Object.keys(o).filter(k=>re.test(k)).reduce((t,k)=>t+o[k],0);
  const soc=pick(ch,/social/i), un=pick(ch,/unassigned/i), unp=pick(chp,/unassigned/i), socViews=Object.values(C.views).reduce((t,x)=>t+x,0);
  const rpm=tot?C.rev.adsense/tot*1000:null, webShare=C.rev.total?C.rev.adsense/C.rev.total*100:0;
  if(tot>=300&&un/tot*100>=15) act(C,{id:'web-utm',area:'website',score:36+(unp&&un/unp>=1.5?6:0),title:'Tag links so we know where website visitors come from',
    why:`${full(un)} website visits (${pct(un/tot*100)}) in the 28 days to ${dS(C.end)} arrived with no source (“Unassigned”)${unp?`, against ${full(unp)} the 28 days before`:''}. Untagged visits hide which posts and links actually work.`,
    steps:['Add UTM tags (utm_source, utm_medium, utm_campaign) to every link we share: social posts, bios, the app, newsletters and WhatsApp.','Check the Google Analytics tag fires on every page, including article pages.'],
    target:'Under 10% of visits unassigned'});
  /* the website earns from AdSense; send social traffic there only when that is a real share of revenue */
  if(tot>=300&&soc/tot*100<10&&socViews>=1e6&&webShare>=15) act(C,{id:'web-social',area:'website',score:44,title:'Send more of the social audience to the website',
    why:`Our posts drew ${abbr(socViews)} views in the 28 days to ${dS(C.end)}, but only ${full(soc)} website visits came from social (${pct(soc/tot*100)} of all visits). The website earns ${usd(rpm)} per 1,000 visits.`,
    steps:['On Facebook, post a photo or video with the story and put the article link in the first comment.','Use link stickers in Instagram stories and keep one tracked link in the bio.'],
    worth:has(rpm)?`10% of visits from social is about ${usd(Math.max(0,tot*0.1-soc)/1000*rpm)} more every 4 weeks`:'',target:'Social bringing 10% of website visits'});
  const paidCh=Object.keys(ch).filter(k=>/^(cross-network|paid|display)/i.test(k)), paidS=paidCh.reduce((t,k)=>t+ch[k],0), spend=total(inR(D.ads,C.cs,C.end),'sp')||0;
  if(paidS>=100&&spend<=0) act(C,{id:'web-paid',area:'data',score:34,title:'Add the cost of the paid website traffic to the sheet',
    why:`${full(paidS)} website visits in the 28 days to ${dS(C.end)} came from paid channels (${join(paidCh.map(k=>`${k} ${full(ch[k])}`))}), but the sheet has no ad spend for that period. ${paidCh.some(k=>/cross-network/i.test(k))?'\u201cCross-network\u201d is Google\u2019s Performance Max and Demand Gen campaigns. ':''}Without the cost, there is no way to tell whether those visits are worth paying for.`,
    steps:['Add Google Ads spend, clicks and conversions per day to the sheet (a Google Ads tab), like the Meta ads tab.','Then this page can work out the cost per visit and per install, and say whether to keep the campaigns.'],
    target:'Every paid channel has its cost in the sheet'});
  const s=swing(C,meanGet(D.web,r=>r.s));
  if(s&&s.dir>0) win(C,{id:'web-up',area:'website',title:`Website visits up ${pct(s.d)}`,why:`${full(s.cur)} a day against ${full(s.prev)} in the 28 days before, beyond the normal swing.${ch['Organic Search']?` Search brought ${full(ch['Organic Search'])} visits.`:''}`,mag:s.d/2});
  else if(s&&s.dir<0) act(C,{id:'web-down',area:'website',score:40,title:'Win back website visits',
    why:`Visits averaged ${full(s.cur)} a day, down ${pct(-s.d)} on the 28 days before.${swingTxt(s,'the website')}`,steps:['Check Search Console for pages that lost Google clicks and refresh them.','Share every new article in Instagram stories with a tracked link.'],target:`Back to ${full(s.prev)} visits a day`,
    mo:{rs:D.web,f:r=>r.s,what:'website visits',down:true}});
});

/* ---------- Facebook: why views moved, and what to post ---------- */
function mixShift(prev,cur,names){ const out=[], N0=prev.length, N1=cur.length; if(N0<30||N1<30) return out;
  const base=median([...prev,...cur].map(p=>p.v));
  for(const w of names){ const a=prev.filter(p=>tk(p).has(w)), b=cur.filter(p=>tk(p).has(w)); if(a.length+b.length<8) continue;
    const m=median([...a,...b].map(p=>p.v)); out.push({w,label:label(w),s0:a.length/N0*100,s1:b.length/N1*100,m0:median(a.map(p=>p.v)),m1:median(b.map(p=>p.v)),m,y:base?m/base:0,ids:new Set([...a,...b])}); }
  return out; }
const dedupe=list=>{ const out=[]; for(const x of list){ if(out.some(o=>share(x.ids,o.ids)>=0.6)) continue; out.push(x); } return out; };
rule('facebook',C=>{ const D=C.D, v=cmp(C,D.fb,'v'), pv=cmp(C,D.fb,'pv');
  const all=Object.values(C.views).reduce((t,x)=>t+x,0), shareV=all?C.views.facebook/all*100:0, top=C.topOf.facebook, names=C.topic&&C.topic.fb?[...C.topic.fb.names]:[];
  if(has(v.d)&&v.d<=-10&&shareV>=30){
    const P0=feedIn('facebook',D,C.ps,C.pe), P1=feedIn('facebook',D,C.cs,C.end), m0=median(P0.map(p=>p.v)), m1=median(P1.map(p=>p.v));
    const hit=Math.max(50000,quant(feedIn('facebook',D,C.c90,C.end).map(p=>p.v),0.95)||0), h0=P0.filter(p=>p.v>=hit).length, h1=P1.filter(p=>p.v>=hit).length;
    const vol=P0.length?chg(P1.length,P0.length):null, typ=chg(m1,m0);
    let diag='';
    if(has(vol)&&vol<=-15) diag=` We posted less: ${full(P1.length)} posts against ${full(P0.length)}.`;
    else if(has(typ)&&typ<=-20&&h1>=h0*0.7) diag=` The everyday post is the problem, not the big hits: the typical post got ${abbr(m1)} views, down ${pct(-typ)} (${abbr(m0)} before), while ${full(h1)} posts still passed ${abbr(hit)} (${full(h0)} before) and we posted about as much (${full(P1.length)} posts against ${full(P0.length)}).`;
    else if(h1<h0*0.7) diag=` Fewer big hits: ${full(h1)} posts passed ${abbr(hit)} views, against ${full(h0)} before; the typical post got ${abbr(m1)} views (${abbr(m0)} before).`;
    const sh=mixShift(P0,P1,names);
    const dropped=dedupe(sh.filter(x=>x.y>=1.4&&x.s0-x.s1>=8).sort((a,b)=>(b.s0-b.s1)-(a.s0-a.s1))).slice(0,2);
    const rose=dedupe(sh.filter(x=>x.y<=0.7&&x.s1-x.s0>=8).sort((a,b)=>(b.s1-b.s0)-(a.s1-a.s0))).slice(0,2);
    const dTxt=dropped.length?(dropped.length===1?`${dropped[0].label} posts fell from ${pct(dropped[0].s0)} to ${pct(dropped[0].s1)} of what we post`:`${dropped[0].label} posts fell from ${pct(dropped[0].s0)} to ${pct(dropped[0].s1)} of what we post and ${dropped[1].label} posts from ${pct(dropped[1].s0)} to ${pct(dropped[1].s1)}`):'';
    const rTxt=rose.length?`${rose.map((x,i)=>`${x.label} posts ${i?'':'rose '}from ${pct(x.s0)} to ${pct(x.s1)}`).join(' and ')}, and ${rose.length>1?'those get':'they get'} a median of ${join(rose.map(x=>abbr(x.m)))} views`:'';
    const mixTxt=dTxt||rTxt?` The topic mix changed: ${[dTxt,rTxt].filter(Boolean).join('; meanwhile ')}.`:'';
    /* the name that carries the page now: far more of the views than of the posts */
    const tv=P1.reduce((t,p)=>t+p.v,0), carry=names.map(w=>{ const a=P1.filter(p=>tk(p).has(w)); return {w,ps:a.length/P1.length*100,vs:tv?a.reduce((t,p)=>t+p.v,0)/tv*100:0}; }).filter(x=>x.ps>=5&&x.vs>=2*x.ps).sort((a,b)=>b.vs-a.vs)[0];
    const carryTxt=carry?` Right now, ${label(carry.w)} posts are ${pct(carry.ps)} of what we post but bring ${pct(carry.vs)} of the views.`:'';
    /* what is travelling now, one entry per story (names that always appear together count once) */
    const mc=median(P1.map(p=>p.v)), best=[]; names.map(w=>{ const a=P1.filter(p=>tk(p).has(w)); return {w,n:a.length,m:median(a.map(p=>p.v)),ids:new Set(a)}; })
      .filter(x=>x.n>=3&&x.m>=2.5*mc&&(!carry||x.w!==carry.w)&&!dropped.some(d=>d.w===x.w)).sort((a,b)=>b.m-a.m)
      .forEach(x=>{ if(best.length<3&&!best.some(b=>share(x.ids,b.ids)>=0.6)) best.push(x); });
    C.fbMixShown=!!(dropped.length||rose.length||carry);
    const sw=swing(C,meanGet(D.fb,r=>r.v)), calm=sw&&sw.lvl==='normal', fl=swing(C,meanGet(D.fb,r=>r.nf));
    const flTxt=fl&&fl.dir>0?` Even so, new followers rose ${pct(fl.d)} (${full(fl.cur)} a day against ${full(fl.prev)}): people who see the posts still follow, so it is reach that fell, not the content.`:fl&&fl.dir<0?` New followers fell too, down ${pct(-fl.d)} (${full(fl.cur)} a day against ${full(fl.prev)}).`:'';
    act(C,{id:'fb-views',area:'facebook',score:Math.min(calm?62:85,45+Math.min(30,Math.abs(v.d))+(shareV>=50?10:0)),title:C.fbMixShown?(calm?'Fix the Facebook topic mix before views slide further':'Win back Facebook views: fix the topic mix'):'Win back Facebook views',
      why:`Views averaged ${abbr(v.cur)} a day in the 28 days to ${dS(C.end)}, down ${pct(-v.d)} on the 28 days before${has(pv.d)&&pv.d<=-20?`, and Page visits fell ${pct(-pv.d)}`:''}.${swingTxt(sw,'Facebook')} Facebook brings ${pct(shareV)} of our views.${flTxt}${diag}${mixTxt}${carryTxt}`,
      steps:[carry?`Make ${label(carry.w)} stories the backbone between ${WD_.moments}: aim for about ${pct(Math.min(40,carry.ps+10))} of posts, up from ${pct(carry.ps)}.`:(best.length?`Lead with what is travelling now: ${join(best.map(b=>`${label(b.w)} (median ${abbr(b.m)})`))}.`:'Post more of the topics behind this month\u2019s top posts.'),
        carry&&best.length?`Lean on what is travelling right now: posts about ${join(best.map(b=>`${label(b.w)} (median ${abbr(b.m)})`))} did best this month.`:(top?`Follow up the period\u2019s top post (\u201c${clip(top.t,60)}\u201d, ${abbr(top.v)} views) with a sequel or a reaction within a day.`:'Follow up every big post within a day.'),
        rose.length?`Post fewer ${join(rose.map(x=>x.label))} stories, or tell them through the people your audience already follows: they get a median of ${join(rose.map(x=>abbr(x.m)))} views, against ${abbr(median([...P0,...P1].map(p=>p.v)))} for a typical post.`:`Follow up anything that passes ${abbr(hit)} views within a day: a sequel, a reaction, a vote.`],
      worth:`Back to ${abbr(v.prev)} views a day is about ${abbr((v.prev-v.cur)*C.L)} more views every 4 weeks`,
      target:`Back to ${abbr(v.prev)} views a day`,mo:{rs:D.fb,f:r=>r.v,what:'Facebook views',down:true}}); }
  else{ const sw=swing(C,meanGet(D.fb,r=>r.v)); if(sw&&sw.dir>0) win(C,{id:'fb-up',area:'facebook',title:`Facebook views up ${pct(sw.d)}`,why:`${abbr(sw.cur)} a day against ${abbr(sw.prev)} in the 28 days before, beyond the normal swing.`,mag:sw.d}); }
  { const sw=swing(C,meanGet(D.fb,r=>r.nf)); if(sw&&sw.dir>0&&sw.cur>0) win(C,{id:'fb-follows',area:'facebook',title:`Facebook new follows up ${pct(sw.d)}`,why:`${full(sw.cur)} a day against ${full(sw.prev)} in the 28 days before.`,mag:sw.d/3}); }
  /* bare link posts */
  const ps=feedIn('facebook',D,C.c90,C.end), ln=ps.filter(p=>p.ty==='link'), other=ps.filter(p=>p.ty!=='link');
  if(ln.length>=5&&other.length>=20){ const ml=median(ln.map(p=>p.v)), mo=median(other.map(p=>p.v)), lnM=inR(ln,C.cs,C.end).length;
    if(mo>0&&ml/mo<=0.3) act(C,{id:'fb-links',area:'facebook',score:36,title:'Stop posting bare links on Facebook',
      why:`In the last 90 days, ${full(ln.length)} link posts got a median of ${abbr(ml)} views, against ${abbr(mo)} for photos and videos: ${times(mo/ml)} fewer.`,
      steps:['Post a photo or video with the story in the caption and put the link in the first comment.','Use the story link sticker for articles instead.'],
      worth:lnM?`About ${abbr(lnM*(mo-ml))} more views every 4 weeks at the current ${full(lnM)} link posts`:'',target:'No bare link posts'}); }
});

/* ---------- topics on Facebook and Instagram: where the views come from ---------- */
rule('topics',C=>{ if(C.fbMixShown) return; const T=C.topic; if(!T||(!T.fb&&!T.ig)) return;
  const merge=good=>{ const m={}; [['Facebook',T.fb],['Instagram',T.ig]].forEach(([pl,s])=>{ if(!s) return; pickTopics(s.res.filter(r=>good?r.lift>=1.5:r.lift<=0.6&&r.n>=Math.max(10,s.N*0.03)),good).forEach(r=>{
      const o=m[r.w]=m[r.w]||{w:r.w,label:label(r.w),by:[],score:0}; o.by.push({pl,lift:r.lift,n:r.n,top:r.top}); o.score+=Math.abs(Math.log(r.lift))*Math.sqrt(r.n); }); });
    return Object.values(m).sort((a,b)=>b.score-a.score).slice(0,3).map(o=>Object.assign(o,{lift:Math.max(...o.by.map(b=>good?b.lift:1/b.lift))})); };
  const W=merge(true), L=merge(false); if(!W.length) return;
  const fb1=feedIn('facebook',C.D,C.cs,C.end), ig1=feedIn('instagram',C.D,C.cs,C.end);
  const say=o=>{ const f=contrib(fb1,o.w), g=contrib(ig1,o.w); return `${o.label}: ${pct(f.ps)} of our Facebook posts and ${pct(f.vs)} of the views${g.n>=3?` (Instagram ${pct(g.ps)} and ${pct(g.vs)})`:''}`; };
  const t0=W[0].by.map(b=>b.top).sort((a,b)=>b.v-a.v)[0];
  act(C,{id:'topics',area:'content',score:56+(W[0].lift>=2.5?6:0),title:`Lead with ${join(W.slice(0,2).map(o=>o.label))} stories`,
    why:`Posts that mention these get far more views than the rest (median ${W.map(o=>`${times(o.lift)} for ${o.label}`).join(', ')} over 90 days). Right now: ${W.slice(0,2).map(say).join('; ')}.${L.length?` At the other end, ${say(L[0])}.`:''}`,
    steps:[`Plan at least one ${W[0].label} story a day, and put it on every platform.`,t0?`Reuse the angle of the best one: “${clip(t0.p.t,70)}” (${abbr(t0.v)} views).`:'Reuse the angles of the best ones.',
      L.length?`Do less of ${join(L.slice(0,2).map(o=>o.label))}, or tell those stories through the people your audience already follows: they get ${times(L[0].lift)} fewer views than usual.`:'Check this list each week: it updates as the topics change.'],
    links:W.map(o=>o.by.map(b=>b.top).sort((a,b)=>b.v-a.v)[0]).filter(Boolean).slice(0,3).map(x=>({t:clip(x.p.t,80),u:x.p.u,meta:`${abbr(x.v)} views`})),
    target:'More posts in the top topics, fewer in the bottom ones'});
});

/* ---------- formats: judged on reach, follows, saves and shares, not views alone ---------- */
const TIP={carousel:'lead with the strongest image, 3 to 6 slides, and a follow prompt on the last slide',reel:'vertical, captioned, with the hook in the first second',
  video:'upload natively, captions on screen, hook in the first 3 seconds',photo:'one strong image with the news in the first line of the caption'};
function igFollowRate(C){ const D=C.D, g=avg(D.igFH,'g',C.cs,C.end), gp=avg(D.igFH,'g',C.ps,C.pe), r=avg(D.ig,'r',C.cs,C.end), rp=avg(D.ig,'r',C.ps,C.pe);
  if(g.n<C.L/2||gp.n<C.L/2||r.n<C.L/2||rp.n<C.L/2||!r.a||!rp.a) return null;
  const cur=g.a/r.a*1000, prev=gp.a/rp.a*1000; return {cur,prev,d:chg(cur,prev),reach:r.a*C.L}; }
rule('formats',C=>{ const D=C.D, fo=igFollowRate(C);
  { const rw=swing(C,meanGet(D.ig,x=>x.r)); if(rw&&rw.dir>0) win(C,{id:'ig-reach',area:'instagram',title:`Instagram reach up ${pct(rw.d)}`,why:`${abbr(rw.cur)} accounts a day against ${abbr(rw.prev)} in the 28 days before.`,mag:rw.d/2}); }
  /* Instagram */
  const ig=feedIn('instagram',D,C.c90,C.end), ig28=feedIn('instagram',D,C.cs,C.end);
  if(ig.length>=40){ const by={}; ig.forEach(p=>{ const t=p.ty||'post'; (by[t]=by[t]||[]).push(p); });
    const st=Object.keys(by).filter(t=>by[t].length>=8).map(t=>{ const a=by[t], wf=a.filter(p=>has(p.fo)&&has(p.r)&&p.r>0);
      return {t,n:a.length,r:median(a.map(p=>p.r)),v:median(a.map(p=>p.v)),fo:wf.length>=8?wf.reduce((x,p)=>x+p.fo,0)/wf.reduce((x,p)=>x+p.r,0)*1000:null,sv:median(a.map(p=>p.sv)),sh:median(a.map(p=>p.sh))}; });
    if(st.length>=2){ const k=st.every(x=>has(x.r))?'r':'v', most=st.reduce((a,b)=>b.n>a.n?b:a), best=st.reduce((a,b)=>b[k]>a[k]?b:a);
      const also=['fo','sv','sh'].filter(m=>has(best[m])&&has(most[m])&&best[m]>most[m]*1.1);
      const sh28=ig28.length>=10?ig28.filter(p=>(p.ty||'post')===best.t).length/ig28.length:best.n/ig.length, wk=ig28.length/C.L*7;
      if(best.t!==most.t&&best[k]>=1.15*most[k]&&also.length>=2&&sh28<0.4){ C.igFormat=true;
        const tgt=Math.min(0.5,sh28+0.15), move=Math.max(1,Math.round((tgt-sh28)*wk));
        const extra=also.map(m=>m==='fo'?`${one(best.fo/most.fo)}x the follows per person reached (${(+best.fo.toFixed(2))} against ${(+most.fo.toFixed(2))} per 1,000)`:m==='sv'?`more saves (${full(best.sv)} against ${full(most.sv)})`:`more shares (${full(best.sh)} against ${full(most.sh)})`);
        act(C,{id:'ig-format',area:'instagram',score:50+(fo&&fo.d<=-20?6:0),title:`Turn more single posts into ${tyName(best.t)} on Instagram`,
          why:`In the last 90 days, ${tyName(best.t)} reached a median of ${abbr(best[k])} ${k==='r'?'accounts':'views'}, ${pct((best[k]/most[k]-1)*100)} more than ${tyName(most.t)} (${abbr(most[k])}), and earned ${join(extra)}. Yet only ${pct(sh28*100)} of our recent posts were ${tyName(best.t)}.${fo&&fo.d<=-20?` That matters now: Instagram is turning reach into followers less well, ${one(fo.cur)} new followers per 1,000 accounts reached against ${one(fo.prev)} the 28 days before.`:''}`,
          steps:[`Turn about ${full(move)} of each week’s ${tyName(most.t)} into ${tyName(best.t)}: ${TIP[best.t]||'keep the hook up front'}.`,`Aim for ${pct(tgt*100)} ${tyName(best.t)} and compare reach and follows on the Instagram page in four weeks.`],
          worth:`Each one is about ${abbr(best[k]-most[k])} more ${k==='r'?'accounts reached':'views'}${has(best.fo)&&has(most.fo)?` and ${one(best.fo/most.fo)}x the follows`:''}; at ${full(move)} a week that is about ${abbr((best[k]-most[k])*move*4)} more every 4 weeks`,
          target:`${cap(tyName(best.t))} at ${pct(tgt*100)} of posts`}); } } }
  if(!C.igFormat&&fo&&fo.d<=-20) act(C,{id:'ig-follows',area:'instagram',score:Math.min(60,44+Math.abs(fo.d)/3),title:'Turn Instagram reach into followers',
    why:`Instagram turned reach into followers less well: ${one(fo.cur)} new followers per 1,000 accounts reached in the 28 days to ${dS(C.end)}, against ${one(fo.prev)} the 28 days before.`,
    steps:[`Add a follow prompt to the last slide of carousels and the end of Reels (“Follow for more ${WD_.niche}”).`,'Pin three posts that show what the account is about.',`Do collab posts with ${WD_.partners} to reach their followers.`],
    worth:`Back to ${one(fo.prev)} per 1,000 is about ${full((fo.prev-fo.cur)/1000*fo.reach)} more followers every 4 weeks`,target:`${one(fo.prev)} new followers per 1,000 reached`});
  /* Facebook, on views (it has no reach per post) */
  const fb=feedIn('facebook',D,C.c90,C.end); if(fb.length>=40){ const by={}; fb.forEach(p=>{ const t=p.ty||'post'; (by[t]=by[t]||[]).push(p.v); });
    const st=Object.keys(by).filter(t=>by[t].length>=8&&t!=='link'&&t!=='status').map(t=>({t,n:by[t].length,m:median(by[t])}));
    if(st.length>=2){ const most=st.reduce((a,b)=>b.n>a.n?b:a), best=st.reduce((a,b)=>b.m>a.m?b:a);
      if(best.t!==most.t&&best.m>=1.3*most.m&&best.n/fb.length<0.4) act(C,{id:'fb-format',area:'facebook',score:46,title:`Post more ${tyName(best.t)} on Facebook`,
        why:`In the last 90 days, ${tyName(best.t)} got a median of ${abbr(best.m)} views, ${pct((best.m/most.m-1)*100)} more than ${tyName(most.t)} (${abbr(most.m)}), yet they were only ${pct(best.n/fb.length*100)} of our posts.`,
        steps:[`Turn some of each week’s ${tyName(most.t)} into ${tyName(best.t)}: ${TIP[best.t]||'keep the hook up front'}.`],
        worth:`Each one is about ${abbr(best.m-most.m)} more views`,target:`${cap(tyName(best.t))} at ${pct(Math.min(50,best.n/fb.length*100+10))} of posts`}); } }
});

/* ---------- Instagram bio link ---------- */
rule('igLink',C=>{ const a=(C.D.igAcct||[]).filter(x=>x.to&&x.to<=C.end).sort((x,y)=>x.to<y.to?-1:1).pop();
  if(a&&has(a.pv)&&a.pv>=1000&&has(a.lc)&&a.lc/a.pv<0.005) act(C,{id:'ig-link',area:'instagram',score:46,title:'Fix the Instagram bio link, or how it is counted',
    why:`Instagram counted ${full(a.lc)} link tap${a.lc===1?'':'s'} from ${full(a.pv)} profile visits between ${dS(a.from)} and ${dS(a.to)}. Profile visitors are our warmest audience for the app.`,
    steps:['Check the bio has one clear link (the app download page) and that it works on a phone.','If the link is there and works, the sheet is probably not collecting link taps: ask whoever runs the pipeline to check, so we can see what the bio sends to the app.'],
    worth:`Even 2 taps per 100 visits would send about ${full(a.pv*0.02)} people a month towards the app`,target:'At least 1 link tap for every 100 profile visits'});
});

/* ---------- the same video on every platform ---------- */
rule('repost',C=>{ const D=C.D, rows={}, a0=addD(C.cs,-10), b0=addD(C.end,10); for(const k of ['facebook','instagram','tiktok','youtube']) rows[k]=PL[k].rows(D).filter(p=>p.d&&p.d>=a0&&p.d<=b0).map(p=>({p,d:p.d,k:tk(p)}));
  const active=k=>rows[k].some(r=>r.d>=a0&&r.d<=C.end);
  const cand=[...inR(D.fbPosts,C.cs,C.end).filter(p=>p.ty==='video'&&has(p.v)).map(p=>({p,pl:'facebook'})),...inR(D.igPosts,C.cs,C.end).filter(p=>p.ty==='reel'&&has(p.v)).map(p=>({p,pl:'instagram'}))]
    .sort((a,b)=>b.p.v-a.p.v).slice(0,8);
  const seen=[], out=[];
  for(const c of cand){ const k=tk(c.p); if(k.size<3) continue; if(seen.some(s=>same(s,k))) continue; seen.push(k);
    const miss=['facebook','instagram','tiktok','youtube'].filter(t=>t!==c.pl&&active(t)&&!rows[t].some(r=>Math.abs(ddiff(r.d,c.p.d))<=10&&same(r.k,k)));
    if(miss.some(m=>m==='tiktok'||m==='youtube')) out.push({c,miss}); if(out.length>=3) break; }
  if(!out.length) return;
  const best=k=>{ const x=feedIn(k,D,C.c90,C.end).map(p=>PL[k].v(p)); return x.length?Math.max(...x):null; }, bt=best('tiktok'), by=best('youtube');
  act(C,{id:'repost',area:'content',score:46,title:'Repost the best videos where they’re missing',
    why:`${out.length===1?'One of this period’s top videos':`${out.length} of this period’s top videos`} couldn’t be found on every platform.${bt||by?` The same kind of clip has done ${[bt?`${abbr(bt)} plays on TikTok`:'',by?`${abbr(by)} views on YouTube`:''].filter(Boolean).join(' and ')} for us in the last 90 days.`:''}`,
    steps:['Cut each to under 60 seconds, vertical, with captions on screen, and post it where it is missing within two days.','Make reposting the top two videos of each week a fixed job.'],
    links:out.map(o=>({t:clip(o.c.p.t,80),u:PL[o.c.pl].u(o.c.p),meta:`${abbr(o.c.p.v)} views on ${PL[o.c.pl].n} · not found on ${join(o.miss.map(m=>m==='youtube'?'YouTube':PL[m].n))}`})),
    target:'Every top video on every platform within two days'});
});

/* ---------- YouTube: where the channel's growth actually comes from ---------- */
rule('youtube',C=>{ const D=C.D, vids=(D.ytVideos||[]).filter(v=>v.d&&v.d<=C.end), m=cmp(C,D.yt,'m'), vv=cmp(C,D.yt,'v'), ctr=cmp(C,D.ytReach,'ctr');
  const v90=inR(vids,C.c90,C.end).filter(v=>has(v.v)), S=v90.filter(isShort), Lg=v90.filter(v=>!isShort(v)), sum=(a,k)=>a.reduce((t,x)=>t+(has(x[k])?x[k]:0),0);
  const fresh=!D.ytVideosAsOf||D.ytVideosAsOf>=addD(C.end,-3);
  if(fresh&&v90.length>=8&&S.length>=5){ const tv=sum(v90,'v'), ts=sum(v90,'sg'), sv=sum(S,'v'), ss=sum(S,'sg'), shV=tv?sv/tv*100:0, shS=ts?ss/ts*100:0;
    const lastS=S.reduce((a,v)=>v.d>a?v.d:a,''), gap=ddiff(lastS,C.end), wk=inR(S,C.cs,C.end).length/C.L*7, perV=sv/S.length, perS=ss/S.length;
    if(shV>=60&&(gap>=7||wk<2)) act(C,{id:'yt-shorts',area:'youtube',score:gap>=7?Math.min(68,50+gap):46,title:gap>=7?'Post YouTube Shorts again':'Post more YouTube Shorts',
      why:`Shorts brought ${pct(shV)} of our YouTube views and ${pct(shS)} of new subscribers in the last 90 days: ${full(S.length)} Shorts averaged ${abbr(perV)} views and ${one(perS)} subscribers each${Lg.length?`, while ${full(Lg.length)} longer videos averaged ${abbr(sum(Lg,'v')/Lg.length)} views`:''}. ${gap>=7?`The newest Short is from ${dS(lastS)}, ${gap} days ago.`:`We posted about ${one(wk)} a week in the last 28 days.`}${has(m.d)&&m.d>=10?` The channel is growing (watch time up ${pct(m.d)}), so a gap costs more now.`:''}`,
      steps:['Cut each week’s top Facebook or Instagram video into a vertical Short: under 60 seconds, captions on screen, the hook in the first second.','Post at least two Shorts a week; keep longer videos for flagship series.'],
      worth:`Two Shorts a week is about ${abbr(perV*8)} views and ${full(perS*8)} new subscribers every 4 weeks at our current average`,
      target:'At least 2 Shorts a week',mo:{rs:D.yt,f:r=>r.v,what:'YouTube views',down:true}}); }
  const wm=swing(C,meanGet(D.yt,r=>r.m)), wc=swing(C,meanGet(D.ytReach,r=>r.ctr)), ws=swing(C,meanGet(D.yt,r=>has(r.sg)?r.sg-(r.sl||0):null));
  if(wm&&wm.dir>0) win(C,{id:'yt-watch',area:'youtube',title:`YouTube watch time up ${pct(m.d)}`,why:`${abbr(m.cur)} minutes a day against ${abbr(m.prev)} in the 28 days before${has(vv.d)?`; views ${vv.d>=0?'up':'down'} ${pct(Math.abs(vv.d))}`:''}.`,mag:m.d/2});
  if(wc&&wc.dir>0) win(C,{id:'yt-ctr',area:'youtube',title:'More people click our YouTube videos',why:`${pct(ctr.cur,1)} of impressions became views, against ${pct(ctr.prev,1)} in the 28 days before.`,mag:ctr.d/3});
  if(ws&&ws.dir>0&&ws.cur>=1) win(C,{id:'yt-subs',area:'youtube',title:`YouTube net subscribers up ${pct(ws.d)}`,why:`${one(ws.cur)} a day against ${one(ws.prev)} in the 28 days before.`,mag:ws.d/3});
});

/* ---------- TikTok ---------- */
rule('tiktok',C=>{ const tv=(C.D.ttVideos||[]).filter(v=>v.d&&v.d<=C.end); if(!tv.length) return;
  const last=tv.reduce((a,v)=>v.d>a?v.d:a,''), gap=ddiff(last,C.end), wk=inR(tv,C.cs,C.end).length/C.L*7, med=median(tv.map(v=>v.v)), mx=Math.max(...tv.map(v=>v.v||0));
  if(gap>=7) act(C,{id:'tt-post',area:'tiktok',score:Math.min(62,44+gap),title:'Post on TikTok again',
    why:`The newest TikTok video is from ${dS(last)}, ${gap} days ago.${tv.length>=5?` TikTok is hit-driven for us: a typical video gets ${abbr(med)} plays, but our best reached ${abbr(mx)}, and only a steady rhythm gives the hits a chance.`:''}`,
    steps:['Repost the week’s best Facebook and Instagram clips, vertical and captioned.','Post at least three times a week.'],target:'3 or more videos a week'});
  else if(wk<3&&C.L>=28&&tv.length>=5) act(C,{id:'tt-rhythm',area:'tiktok',score:38,title:'Post on TikTok at least three times a week',
    why:`${full(inR(tv,C.cs,C.end).length)} TikTok videos in the 28 days to ${dS(C.end)}, about ${one(wk)} a week. A typical video gets ${abbr(med)} plays, but our best reached ${abbr(mx)}: more posts, more chances of a hit.`,
    steps:['Repost the week’s best Facebook and Instagram clips, vertical and captioned.'],target:'3 or more videos a week'});
  const f=(C.D.ttAcct||[]).filter(r=>has(r.f)&&r.d<=C.end); if(f.length>=7){ const a=f.find(r=>r.d>=C.cs)||f[0], b=f[f.length-1], g=b.f-a.f; if(g>0&&a.d<b.d&&g/a.f>=0.01) win(C,{id:'tt-growth',area:'tiktok',title:`TikTok gained ${full(g)} followers`,why:`${full(a.f)} on ${dS(a.d)}, ${full(b.f)} on ${dS(b.d)}.`,mag:Math.min(20,g/a.f*100*2)}); }
});

/* ---------- X: effort against return ---------- */
rule('x',C=>{ const posts=Object.values(C.posts).reduce((t,x)=>t+x,0), views=Object.values(C.views).reduce((t,x)=>t+x,0);
  if(!posts||!views||C.posts.x<20) return; const ps=C.posts.x/posts*100, vs=C.views.x/views*100;
  if(ps>=15&&vs<=3) act(C,{id:'x-effort',area:'x',score:26,title:'Spend less time on X, or automate it',
    why:`X took ${pct(ps)} of our posts in the 28 days to ${dS(C.end)} but brought ${pct(vs,1)} of our views (a median of ${abbr(median(inR(C.D.xPosts,C.cs,C.end).map(p=>p.im)))} impressions a post).`,
    steps:[`If X is posted by hand, automate it from Facebook or Instagram, or keep it for breaking news and ${WD_.moments}.`,'Put the time saved into Instagram carousels and YouTube Shorts.'],target:'Same X results for less time'});
});

/* ---------- the data behind it all ---------- */
const AREA_TABS=[['Facebook',['Meta Organic','Facebook Page Activity'],3],['Instagram',['Instagram'],3],['YouTube',['YouTube Daily'],4],['the website',['GA4'],3],
  ['Google Play installs',['Play Installs'],5],['Google Play subscriptions',['Play Subscriptions'],5],['the Google Play store listing',['Play Traffic Source'],5],
  ['the App Store',['App Store Sales'],4],['app stability',['Play_Quality_History'],5],['X',['X'],3],['TikTok',['TikTok'],3],['ad revenue',['AdMob','AdSense'],3]];
rule('data',C=>{ const TS=(C.D.extra&&C.D.extra.tabStats)||[]; if(!TS.length) return;
  const newest=TS.reduce((a,t)=>t.last&&t.last>a?t.last:a,''); if(!newest||C.end<addD(newest,-3)) return;   /* only for the latest dates */
  const stale=AREA_TABS.map(([area,tabs,tol])=>{ const last=TS.filter(t=>tabs.includes(t.canon||t.name)&&t.last).reduce((a,t)=>t.last>a?t.last:a,''); return last&&ddiff(last,newest)>tol?{area,last,lag:ddiff(last,newest)}:null; }).filter(Boolean);
  if(stale.length){ const gp=stale.every(s=>/google play/i.test(s.area));
    act(C,{id:'data-stale',area:'data',score:55,title:gp?'Get the Google Play reports updating again':'Fix the figures that stopped updating',
      why:`${cap(join(stale.map(s=>`${s.area} (last day ${dS(s.last)})`)))} ${stale.length>1?'have':'has'} stopped updating, so every decision on this page that uses ${stale.length>1?'them':'it'} is working from figures up to ${Math.max(...stale.map(s=>s.lag))} days old.`,
      steps:['Check the pipeline job for these reports, and that its Google Play Console access still works.','The Updates page lists every tab with its latest day.'],
      worth:gp?'Android installs, subscribers and store traffic you can act on this week, not last month':'Up-to-date figures for every action on this page',target:'Every source within 3 days of today'}); }
  const err=TS.filter(t=>t.errors>0);
  if(err.length) act(C,{id:'data-errors',area:'data',score:24,title:'Fix the rows that failed to load',
    why:`${join(err.map(t=>`${full(t.errors)} row${t.errors===1?'':'s'} in ${t.name}`))} failed to load, so ${err.reduce((x,t)=>x+t.errors,0)===1?'it is':'they are'} left out of every figure.`,steps:['Open the tab, find the rows marked as failed, and re-run that part of the pipeline.'],target:'No failed rows'});
  const tv=C.D.ttVideos||[]; if(tv.length>=5&&tv.every(v=>!has(v.l)&&!has(v.cm)&&!has(v.sh)))
    act(C,{id:'data-tiktok',area:'data',score:18,title:'Add TikTok likes, comments and shares to the sheet',
      why:'TikTok videos arrive with plays only, so the dashboard can’t tell which ones people engage with or compare them with other platforms.',
      steps:['Add likes, comments, shares and average watch time per video to the TikTok tab.'],target:'Engagement on every TikTok video'});
});


/* ---------- iPhone users deleting the app: only when the rate per install rises, not just the count ---------- */
rule('iosLeave',C=>{ const D=C.D; if((D.appleDel||[]).length<60) return;
  const inst=r=>has(r.dl)?r.dl+(r.rd||0):null, rate=(a,b)=>{ const d=meanGet(D.appleDel,r=>r.n)(a,b), i=meanGet(D.apple,inst)(a,b); return d&&i&&i.a>0?{a:d.a/i.a,n:Math.min(d.n,i.n)}:null; };
  const w=swing(C,rate,10); if(!w||w.dir<=0||w.cur<0.15) return;
  const del=swing(C,meanGet(D.appleDel,r=>r.n));
  /* one big download day in the period brings one-off users, who leave sooner */
  const rs=inR(D.apple,C.cs,C.end).filter(r=>has(inst(r))), base=median(inR(D.apple,C.ps,C.pe).map(inst)), pk=rs.reduce((m,r)=>!m||inst(r)>inst(m)?r:m,null), spike=pk&&has(base)&&base>0&&inst(pk)>=2*base?pk:null;
  act(C,{id:'ios-deletions',area:'app',score:Math.min(64,44+w.d/3),title:'Find out why more iPhone users are deleting the app',
    why:`For every 100 iPhone installs there were ${Math.round(w.cur*100)} deletions in the 28 days to ${dS(C.end)}, against ${Math.round(w.prev*100)} in the 28 days before${del?` (${one(del.cur)} deletions a day against ${one(del.prev)})`:''}. Deletions are rising faster than installs, beyond the normal month-to-month swings${has(w.T)&&w.T>=5?` (typically \u00b1${pct(w.T)})`:''}.${spike?` iPhone installs on ${dS(spike.d)} were ${times(inst(spike)/base)} a normal day: people who arrive in one burst often leave just as fast.`:''}`,
    steps:['In App Store Connect, open Analytics and compare deletions by app version: if the rise started with an update, find what changed in it.','Read the App Store reviews since the rise began for crashes, sign-in problems or paywall complaints.',
      spike?`Give the people who arrived around ${dS(spike.d)} a reason to stay in their first session: set what they care about, turn on alerts.`:'Give new users a reason to stay in their first session: set what they care about, turn on alerts.'],
    target:`Back to ${Math.round(w.prev*100)} deletions for every 100 installs`,mo:{rs:D.appleDel,f:r=>r.n,what:'iPhone deletions',down:false}}); });

/* ---------- a round number coming up: a ready-made reason to post, and to point people at the app ---------- */
rule('milestone',C=>{ const M=milestones(C); const m=M.list.find(x=>x.days<=21&&['facebook','instagram','youtube','tiktok'].includes(x.area)&&x.next%(x.next>=10000?10000:1000)===0); if(!m) return;
  act(C,{id:'milestone',area:m.area,score:m.days<=10?46:40,title:`Plan a post for ${m.name} reaching ${full(m.next)} ${m.unit}`,
    why:`${m.name} had ${full(m.total)} ${m.unit} on ${dS(m.day)}. At the pace of the last 4 weeks (+${one(m.per)} a day), it reaches ${full(m.next)} around ${dS(m.date)}. A thank-you post at a round number is an easy share and a natural moment to point people at the app.`,
    steps:['Have a short thank-you video or graphic ready for the day it happens.',C.pushWeek?`Attach an app offer to it, like the trials and offer codes that worked in the week of ${dS(C.pushWeek)}.`:'Attach an app offer to it: a free trial or an offer code for that week.','Pin it for a week and share it to the other platforms.'],
    target:`${full(m.next)} ${m.unit} around ${dS(m.date)}`}); });

/* ---------- each platform's audience: reach and new followers read together ----------
   Only changes bigger than the number's normal swings count. "Fewer views, more followers" means the posts still convert and
   reach is the problem; "more reach, fewer followers" means people see the posts but find no reason to follow. Facebook's views
   have their own action above, which already carries the followers side. */
function audRead(D,k){
  if(k==='facebook') return {n:'Facebook',rl:'views',rs:D.fb,rf:r=>r.v,fs:D.fb,ff:r=>r.nf,ps:D.fb,pf:r=>r.pv,pn:'Page'};
  if(k==='instagram'){ const gH=(D.igFH||[]).filter(r=>has(r.g)).length, gI=(D.ig||[]).filter(r=>has(r.nf)).length;
    return {n:'Instagram',rl:'accounts reached',rs:D.ig,rf:r=>r.r,fs:gH>=28||gI<28?D.igFH:D.ig,ff:gH>=28?(r=>r.g):gI>=28?(r=>r.nf):(r=>has(r.n)?r.n:(has(r.g)||has(r.l)?(r.g||0)-(r.l||0):null)),ps:D.ig,pf:r=>r.pv,pn:'profile'}; }
  if(k==='youtube') return {n:'YouTube',rl:'views',rs:D.yt,rf:r=>r.v,fs:D.yt,ff:r=>r.sg,sub:true};
  return null; }
/* Instagram formats by median reach over 90 days */
function igBestFormat(C){ const ig=feedIn('instagram',C.D,C.c90,C.end).filter(p=>has(p.r)); if(ig.length<40) return null; const by={}; ig.forEach(p=>{ const t=p.ty||'post'; (by[t]=by[t]||[]).push(p.r); });
  const st=Object.keys(by).filter(t=>by[t].length>=8).map(t=>({t,n:by[t].length,r:median(by[t])})); if(st.length<2) return null;
  const most=st.reduce((a,b)=>b.n>a.n?b:a), best=st.reduce((a,b)=>b.r>a.r?b:a); return best.t!==most.t&&best.r>=1.15*most.r?{best,most}:null; }
rule('audience',C=>{ const D=C.D;
  for(const k of ['facebook','instagram','youtube']){ const A=audRead(D,k); if(!A) continue;
    const R=swing(C,meanGet(A.rs,A.rf)), F=swing(C,meanGet(A.fs,A.ff)); if(!R||!F||!(R.cur>0)||!(R.prev>0)) continue;
    const n=A.n, fo=A.sub?'subscribers':'followers', what=k==='youtube'?'videos':'posts', one1=k==='youtube'?'video':'post';
    const nf=v=>v>=20?full(v):one(v), r1=F.cur/R.cur*1000, r0=F.prev/R.prev*1000, fTxt=`${nf(F.cur)} a day against ${nf(F.prev)}`;
    /* how much we posted, and how far the typical post travelled */
    const rows=k==='youtube'?(D.ytVideos||[]).filter(v=>v.d):feedIn(k,D,C.ps,C.end), n0=inR(rows,C.ps,C.pe).length, n1=inR(rows,C.cs,C.end).length, vol=n0>=6?chg(n1,n0):null;
    const rv=p=>k==='instagram'&&has(p.r)?p.r:PL[k].v(p), m0=k==='youtube'?null:median(inR(rows,C.ps,C.pe).map(rv)), m1=k==='youtube'?null:median(inR(rows,C.cs,C.end).map(rv)), typ=has(m0)&&has(m1)?chg(m1,m0):null;
    const unit=k==='instagram'?'accounts':'views';
    const diag=has(vol)&&vol<=-15?` We posted less: ${full(n1)} ${what} against ${full(n0)} the 28 days before.`:has(typ)&&typ<=-20?` We posted about as much (${full(n1)} ${what} against ${full(n0)}), but the typical ${one1} reached fewer people: ${abbr(m1)} ${unit} against ${abbr(m0)}.`:'';
    const top=C.topOf[k];
    if(R.dir<0){
      if(k==='facebook'&&C.acts.some(x=>x.id==='fb-views')) continue;
      if(k==='youtube'&&C.acts.some(x=>x.id==='yt-shorts')) continue;   /* Shorts bring most of the views: that action already covers it */
      const lost=(R.prev-R.cur)*C.L, steps=[];
      if(has(vol)&&vol<=-15) steps.push(`Get back to about ${full(n0)} ${what} every 4 weeks: posting less is the most likely reason for the drop.`);
      if(k==='instagram'){ if(C.igFormat) steps.push('Use more of the format that reaches the most people (see the Instagram format action).'); else { const bf=igBestFormat(C); if(bf) steps.push(`Lead with ${tyName(bf.best.t)}: over 90 days they reached a median of ${abbr(bf.best.r)} accounts, against ${abbr(bf.most.r)} for ${tyName(bf.most.t)}.`); } }
      if(k==='youtube'&&!C.acts.some(x=>x.id==='yt-shorts')) steps.push('Keep Shorts going at two or more a week: they bring most of the channel’s views.');
      if(top) steps.push(`Follow up this month’s top ${one1} (“${clip(top.t,60)}”, ${abbr(top.v)} views) with a sequel or a reaction within a day.`);
      if(F.dir>0) steps.push(`Keep doing whatever is winning ${fo}: ${one(r1)} new ${fo} per 1,000 ${A.rl} now, against ${one(r0)} before.`);
      if(steps.length<2) steps.push(`Repost this month’s best ${what} on the platforms where they are missing.`);
      act(C,{id:`${k}-reach`,area:k,score:Math.min(F.dir<0?72:64,48+Math.min(16,Math.abs(R.d)/2)+(F.dir<0?8:0)),
        title:F.dir>0?`Win back ${n} reach: the ${what} still win ${fo}`:F.dir<0?`Find out what changed on ${n}: reach and ${fo} are both down`:`Win back ${n} reach`,
        why:`${n} ${A.rl} averaged ${abbr(R.cur)} a day in the 28 days to ${dS(C.end)}, down ${pct(-R.d)} on the 28 days before.${swingTxt(R,n)}${F.dir>0?` Yet new ${fo} rose ${pct(F.d)} (${fTxt}): people who see the ${what} still ${A.sub?'subscribe':'follow'}, so it is reach that fell, not the content.`:F.dir<0?` New ${fo} fell too, down ${pct(-F.d)} (${fTxt}).`:''}${diag}`,
        steps,worth:`Back to ${abbr(R.prev)} a day is about ${abbr(lost)} more ${A.rl} every 4 weeks${F.cur>0?`, and about ${full(lost*F.cur/R.cur)} more ${fo} at today’s rate`:''}`,
        target:`Back to ${abbr(R.prev)} ${A.rl} a day`,mo:{rs:A.rs,f:A.rf,what:`${n} ${A.rl}`,down:true}}); continue; }
    if(F.dir<0){
      if(k==='instagram'&&(C.acts.some(x=>x.id==='ig-follows')||C.igFormat)) continue;   /* already covered by the Instagram follow-rate actions */
      const pv=A.ps?swing(C,meanGet(A.ps,A.pf)):null, pr1=pv&&pv.cur>0?F.cur/pv.cur*100:null, pr0=pv&&pv.prev>0?F.prev/pv.prev*100:null;
      const prof=pv&&pv.dir>=0&&has(pr1)&&has(pr0)&&pr1<pr0*0.85;   /* people still visit, but fewer follow from the page itself */
      const steps=A.sub?['Ask for the subscribe early in longer videos, and pin a comment pointing to the next one.','Add an end screen to every long video that points to a playlist.','Turn the best Shorts into a series, so viewers subscribe for the next part.']
        :prof?[`Rewrite the first line of the ${k==='facebook'?'Page intro':'bio'} to say what followers get, for example “Daily ${WD_.niche} you can use”.`,'Pin the three posts that best show what the account is about.','Check the name and picture read clearly on a phone.']
        :[`End videos and carousels with a follow prompt (“Follow for more ${WD_.niche}”).`,'Run recurring series people follow for, such as a weekly round-up.',`Do collab posts with ${WD_.partners} to reach their followers.`];
      act(C,{id:`${k}-follows`,area:k,score:Math.min(60,46+Math.abs(F.d)/3),title:R.dir>0?`Turn the extra ${n} reach into ${fo}`:`Give ${n} viewers a reason to ${A.sub?'subscribe':'follow'}`,
        why:`New ${fo} fell ${pct(-F.d)} (${fTxt}) while ${A.rl} ${R.dir>0?`rose ${pct(R.d)}`:'held'}: ${one(r1)} new ${fo} per 1,000 ${A.rl}, against ${one(r0)} the 28 days before.${swingTxt(F,`${n} ${fo}`)}${prof?` People still visit the ${A.pn} (${abbr(pv.cur)} a day) but fewer follow from it: ${one(pr1)} per 100 visits against ${one(pr0)}, so the ${A.pn} itself needs work.`:pv&&pv.dir<0?` Fewer people click through to the ${A.pn}: ${abbr(pv.cur)} visits a day against ${abbr(pv.prev)}, so the ${what} need to give a reason to follow.`:''}`,
        steps,worth:`Back to ${one(r0)} per 1,000 is about ${full(Math.max(0,(r0-r1)/1000*R.cur*C.L))} more ${fo} every 4 weeks`,target:`${one(r0)} new ${fo} per 1,000 ${A.rl}`,
        mo:{rs:A.fs,f:A.ff,what:`new ${n} ${fo}`,down:true}}); }
  } });

/* ---------- a sharp fall this week: the 4-week comparison only catches it later ---------- */
const WEEK_STEPS={facebook:['Check what changed this week: how much we posted, which topics, and whether Meta Business Suite shows a warning on any post.','Follow up or repost last month\u2019s best posts to get reach moving again.'],
  instagram:['Open Account Status in the Instagram app and check for any restriction or warning.','Check what changed this week: how many posts and Reels went out, and on which topics.'],
  youtube:['Check when the last Short went out: Shorts bring most of our YouTube views.','Post a Short today, cut from this week\u2019s best Facebook or Instagram clip.'],
  website:['Check the Google Analytics tag still fires on every page: a sudden drop is often tracking, not visitors.','Check Search Console for pages that lost Google clicks this week.'],
  app:['Check the App Store page: listing, screenshots and price unchanged, and the app still live in every country.','Check App Store Connect for a fall in search downloads, the main source of new iPhone users.']};
rule('weekDrop',C=>{ const D=C.D;
  for(const [area,lab,rs,f] of [['facebook','Facebook views',D.fb,r=>r.v],['instagram','Instagram reach',D.ig,r=>r.r],['youtube','YouTube views',D.yt,r=>r.v],['website','Website visits',D.web,r=>r.s],['app','iPhone installs',D.apple,r=>has(r.dl)?r.dl+(r.rd||0):null]]){
    if(C.acts.some(a=>a.area===area&&a.wk)) continue;
    const m=momentum(rs,f,C); if(!m||m.d>-30) continue;
    const c=meanGet(rs,f)(addD(m.e,-6),m.e), base=median(inR(rs,addD(m.e,-62),addD(m.e,-7)).map(f)); if(!c||!has(base)||base<=0||c.a>0.65*base) continue;
    act(C,{id:`${area}-week`,area,score:area==='facebook'||area==='app'?64:52,title:`Find out why ${area==='website'?'website visits':lab} fell sharply this week`,
      why:`${lab} averaged ${abbr(c.a)} a day in the 7 days to ${dS(m.e)}, down ${pct(-m.d)} on the week before and well under the usual ${abbr(base)} a day of the last two months. The 4-week figures only start to show a fall like this a week or two later.`,
      steps:WEEK_STEPS[area],target:`Back to about ${abbr(base)} a day`}); } });

/* ---------- a big day in the last week: follow it up while people still remember it ---------- */
rule('spike',C=>{ const D=C.D; let best=null;
  for(const [k,lab,verb,rs,f] of [['facebook','Facebook views','were',D.fb,r=>r.v],['instagram','Instagram reach','was',D.ig,r=>r.r],['youtube','YouTube views','were',D.yt,r=>r.v]]){
    const i=lastIdx(rs,f,C.end); if(i<0) continue; const skip=provisional(rs,f,C)?rs[i].d:null, by=new Map((rs||[]).map(r=>[r.d,r]));
    for(let j=0;j<7;j++){ const d=addD(C.end,-j), r=by.get(d); if(!r||d===skip||!has(f(r))) continue;
      const base=median(inR(rs,addD(d,-35),addD(d,-8)).map(f)); if(!has(base)||base<=0||f(r)<2*base) continue;
      const ps=PL[k].rows(D).filter(p=>p.d&&(p.d===d||p.d===addD(d,-1))&&PL[k].feed(p)&&has(PL[k].v(p))).sort((a,b)=>PL[k].v(b)-PL[k].v(a));
      if(ps[0]&&(!best||f(r)/base>best.ratio)) best={k,lab,verb,d,v:f(r),base,ratio:f(r)/base,p:ps[0]}; } }
  if(!best) return;
  const also=[['iPhone installs',D.apple,r=>has(r.dl)?r.dl+(r.rd||0):null],['Android installs',D.play,r=>r.i],['website visits',D.web,r=>r.s],['in-app ad earnings',D.admob,r=>r.e]].filter(([,rs,f])=>{
    const r=(rs||[]).find(x=>x.d===best.d), b=median(inR(rs,addD(best.d,-35),addD(best.d,-8)).map(f)); return r&&has(f(r))&&has(b)&&b>0&&f(r)/b>=1.8; }).map(x=>x[0]);
  const P=PL[best.k], post=best.p, u=P.u(post), inRepost=C.acts.some(a=>a.id==='repost'&&(a.links||[]).some(l=>l.u&&l.u===u)), age=ddiff(best.d,C.end);
  act(C,{id:'spike',area:best.k,score:age<=3?50:42,title:`Follow up ${dS(best.d)}’s big ${P.n} moment while it’s fresh`,
    why:`${best.lab} on ${dS(best.d)} ${best.verb} ${times(best.ratio)} a normal day (${abbr(best.v)} against a typical ${abbr(best.base)}). The biggest post that day: “${clip(post.t,90)}”, ${abbr(P.v(post))} views.${also.length?` The same day, ${join(also)} jumped too, so the moment reached well beyond ${P.n}.`:''}`,
    steps:['Post a follow-up in the next day or two: a part two, a reaction, or the next chapter of the same story.',inRepost?'Repost it where it is missing (see the repost action).':'Make sure it is on every platform: a vertical cut for TikTok and YouTube Shorts.','Mention the app in the follow-up: this audience has just shown up.'],
    links:[{t:clip(post.t,80),u,meta:`${abbr(P.v(post))} views · ${dS(post.d)}`}],
    target:'Another day above twice normal from the follow-up'}); });

/* ================= milestones: when each platform reaches its next round number ================= */
function milestones(C){ const D=C.D, out=[], from=C.end;
  const nice=v=>v<1000?100:v<5000?500:v<10000?1000:v<50000?5000:v<100000?10000:v<500000?50000:100000, nextOf=v=>(Math.floor(v/nice(v))+1)*nice(v);
  /* growth a day from the totals over the last 4 weeks, so unfollows count */
  const growth=(rs,k)=>{ const f=(rs||[]).filter(r=>r&&has(r[k])&&r.d<=from); if(f.length<2) return null; const b=f[f.length-1], a=f.find(r=>r.d>=addD(b.d,-28))||f[0], n=ddiff(a.d,b.d);
    return n>=7&&b.d>=addD(from,-10)?{total:b[k],day:b.d,per:(b[k]-a[k])/n}:{total:b[k],day:b.d,per:null}; };
  const ig=(()=>{ const b=igTotal(D,from); if(!b) return null; const a=igTotal(D,addD(b.day,-28)), n=a?ddiff(a.day,b.day):0; return {total:b.total,day:b.day,per:n>=7?(b.total-a.total)/n:null}; })();
  const list=[['facebook','Facebook','followers',growth(D.fb,'f')],['instagram','Instagram','followers',ig],['youtube','YouTube','subscribers',growth(D.ytSnap,'subs')],
    ['tiktok','TikTok','followers',growth(D.ttAcct,'f')],['x','X','followers',growth(D.xAcct,'f')]];
  const when=(day,days)=>{ const d=addD(day,days); return C.today&&d<C.today?C.today:d; };
  let all=0, allPer=0, n=0;
  for(const [area,name,unit,g] of list){ if(!g||!has(g.total)) continue; all+=g.total; n++; if(has(g.per)) allPer+=g.per; if(!has(g.per)||g.per<=0) continue;
    const next=nextOf(g.total), days=Math.ceil((next-g.total)/g.per); if(days>183) continue;
    out.push({area,name,unit,total:g.total,day:g.day,next,days,date:when(g.day,days),per:g.per}); }
  const allNext=n>1?nextOf(all):null, allDays=allNext&&allPer>0?Math.ceil((allNext-all)/allPer):null;
  return {list:out.sort((a,b)=>a.days-b.days),all:n>1?all:0,allPer,allNext,allDays:allDays&&allDays<=183?allDays:null,allDate:allDays&&allDays<=183?when(from,allDays):null}; }

/* ================= putting it together ================= */
const ORDER=['stability','installs','retention','iosLeave','appPromo','subsPush','renewals','trials','subscribers','paid','admob','website','facebook','topics','formats','igLink','repost','youtube','audience','weekDrop','spike','tiktok','x','milestone','data'];
function context(D,end,L){
  const C={D,end,L,cs:addD(end,-(L-1)),pe:addD(end,-L),ps:addD(end,-(2*L-1)),c90:addD(end,-89),acts:[],wins:[],errors:[]};
  C.views={facebook:total(inR(D.fb,C.cs,C.end),'v')||0,youtube:total(inR(D.yt,C.cs,C.end),'v')||0,instagram:0,x:0,tiktok:0};
  C.posts={facebook:0,instagram:0,youtube:0,x:0,tiktok:0}; C.topOf={};
  for(const k in PL){ const P=PL[k], ps=inR(P.rows(D),C.cs,C.end).filter(P.feed); C.posts[k]=ps.length;
    if(k==='instagram'||k==='x'||k==='tiktok') C.views[k]=ps.reduce((t,p)=>t+(has(P.v(p))?P.v(p):0),0);
    const t=ps.filter(p=>has(P.v(p))).sort((a,b)=>P.v(b)-P.v(a))[0]; if(t) C.topOf[k]={pl:k,n:P.n,t:t.t,u:P.u(t),v:P.v(t),d:t.d,ty:t.ty}; }
  /* installs and revenue for 4 weeks, from daily averages so a late source is not short-changed */
  C.inst28=((avg(D.play,'i',C.cs,C.end).a||0)+(avg(D.apple,'dl',C.cs,C.end).a||0))*L;
  const ar=total(inR(D.apple,C.cs,C.end),'rev')||0, pr=-(total(inR(D.earn,C.cs,C.end),'fee')||0)/0.15*0.85, am=total(inR(D.admob,C.cs,C.end),'e')||0, as=total(inR(D.adsense,C.cs,C.end),'e')||0;
  C.rev={apple:ar,play:pr,admob:am,adsense:as,total:ar+pr+am+as};
  const pay=avg(D.aSubs,'s',C.cs,C.end).a; C.arpu=pay>0&&ar>0?ar/pay:null;   /* per paying iPhone subscriber, per 4 weeks, after Apple's fee */
  /* Google Play store page: visitors and installs per day */
  const st=(a,b)=>{ const rs=inR(D.traffic,a,b); if(!rs.length) return null; const n=new Set(rs.map(r=>r.d)).size, v=total(rs,'vis')||0, q=total(rs,'acq')||0; return {days:n,vis:v/n,acq:q/n,conv:v?q/v*100:null}; };
  C.store={cur:st(C.cs,C.end),prev:st(C.ps,C.pe)};
  /* names in captions, over 90 days, for the topic and Facebook rules */
  C.topic={fb:topicStats(feedIn('facebook',D,C.c90,C.end)),ig:topicStats(feedIn('instagram',D,C.c90,C.end))};
  return C; }
function build(D,o){ o=o||{}; const L=o.L||28, today=o.today||null;
  let end=o.end; if(!end){ const ends=[D.fb,D.yt,D.ig,D.web,D.play,D.apple].map(r=>r&&r.length?r[r.length-1].d:null).filter(Boolean).sort(); end=ends[ends.length-1]; }
  if(!end) return {end:null,actions:[],wins:[],top:[],errors:['No data']};
  let C; try{ C=context(D,end,L); C.today=today; }catch(e){ return {end,actions:[],wins:[],top:[],errors:['context: '+(e&&e.message||e)]}; }
  for(const n of [...ORDER,...RULES.map(r=>r.name).filter(n=>!ORDER.includes(n))]){ const r=RULES.find(x=>x.name===n); if(!r) continue; try{ r.f(C); }catch(e){ C.errors.push(n+': '+(e&&e.message||e)); } }
  C.acts.sort((a,b)=>b.score-a.score).forEach(a=>{ const ss=String(a.why||'').replace(/([.!?])\s+(?=[A-Z0-9\u201c"(])/g,'$1\u0001').split('\u0001'); let k=1, sh=ss[0]||'';
    if(sh.length<150&&ss[1]&&(sh+' '+ss[1]).length<=300){ sh+=' '+ss[1]; k=2; } a.short=sh; a.more=ss.slice(k).join(' ');
    a.pri=a.score>=70?1:a.score>=45?2:3; const ar=AREAS[a.area]||AREAS.data; a.areaName=ar.n; a.color=ar.c; a.group=ar.g; a.pageName=PAGE_NAME[a.page]||''; });
  const wins=C.wins.sort((a,b)=>b.mag-a.mag).slice(0,8); wins.forEach(w=>{ const ar=AREAS[w.area]||AREAS.data; w.areaName=ar.n; w.color=ar.c; w.group=ar.g; w.pageName=PAGE_NAME[w.page]||''; });
  return {end,cs:C.cs,ps:C.ps,pe:C.pe,L,actions:C.acts,wins,top:['facebook','instagram','youtube','tiktok','x'].map(k=>C.topOf[k]).filter(Boolean),errors:C.errors};
}
/* new, ongoing and resolved: the same rules run on the period before */
function compare(cur,prev){ const was=new Set((prev&&prev.actions||[]).map(a=>a.id)), now=new Set(cur.actions.map(a=>a.id));
  cur.actions.forEach(a=>{ a.state=prev?(was.has(a.id)?'ongoing':'new'):null; });
  cur.resolved=prev?(prev.actions||[]).filter(a=>!now.has(a.id)):[]; return cur; }
function text(res){ if(!res||!res.end) return '';
  const n1=res.actions.filter(x=>x.pri===1).length;
  const L=[`${BRAND}: action plan`,`From the 28 days to ${dL(res.end)}. ${res.actions.length} thing${res.actions.length===1?'':'s'} to do${n1?`, ${n1} this week`:''}.`,''], P=[[1,'DO FIRST (THIS WEEK)'],[2,'NEXT (THIS MONTH)'],[3,'WHEN THERE IS TIME']]; let i=0;
  P.forEach(([p,h])=>{ const a=res.actions.filter(x=>x.pri===p); if(!a.length) return; L.push(h);
    a.forEach(x=>{ i++; L.push(`${i}. ${x.title} (${x.areaName})`,`   ${x.short||x.why}`); x.steps.forEach(s=>L.push(`   - ${s}`)); (x.links||[]).forEach(l=>L.push(`   > ${l.t}${l.meta?` (${l.meta})`:''}${l.u?` ${l.u}`:''}`));
      if(x.worth) L.push(`   Impact: ${x.worth}`); if(x.target) L.push(`   Done when: ${x.target}`); L.push(''); }); });
  return L.join('\n').trim(); }

return {build,compare,text,AREAS,GROUPS,rules:()=>RULES.map(r=>r.name),_rule:rule,version:'2026-10-08'};
})();
