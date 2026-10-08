/* Dashboard template: every page, the action plan and the live connection. Brand and data settings are in config.js. */
const D = window.ATR_BUILTIN;
/* post links are stored short in data.js; expand them */
(function(){ const full=u=>typeof u==='string'?(u.startsWith('~ig/')?'https://www.instagram.com/'+u.slice(4):u.startsWith('~fb/')?'https://www.facebook.com/'+u.slice(4):u):u; ['igPosts','fbPosts','ytVideos'].forEach(k=>(D[k]||[]).forEach(p=>{ if(p.u) p.u=full(p.u); })); })();
const BR=window.DASH||{}, BRAND=BR.name||'Your Brand', TAGLINE=BR.tagline||'Analytics dashboard', SITE=BR.website||'your website', HANDLE=BR.handles||{};
const LOGO_NOW=()=>(window.DASH_BRAND&&DASH_BRAND.logo())||'logo.svg';
/* money is shown in the currency set in config.js (or the Personalize panel) */
const CURI=window.DASH_CUR||{code:'USD',sym:'$',icon:'$',name:'US dollars'}, CUR=CURI.code, CURSYM=CURI.sym, CURNAME=CURI.name;
const ttUrl=id=>HANDLE.tiktok&&id?`https://www.tiktok.com/@${String(HANDLE.tiktok).replace(/^@/,'')}/video/${id}`:'';
const xUrl=id=>id?`https://x.com/${String(HANDLE.x||'i').replace(/^@/,'')}/status/${id}`:'';
/* the brand on the page itself */
(function(){ const set=(id,f)=>{ const el=document.getElementById(id); if(el) f(el); };
  set('brandlogo',el=>{ el.src=LOGO_NOW(); el.alt=BRAND; }); set('brandname',el=>{ el.textContent=BRAND; }); set('brandtag',el=>{ el.textContent=TAGLINE; });
  set('printlogo',el=>{ el.src=LOGO_NOW(); el.alt=''; }); set('printname',el=>{ el.textContent=BRAND; }); set('favicon',el=>{ el.href=LOGO_NOW(); }); document.title=`${BRAND} | ${TAGLINE}`; })();

/* ================= utilities ================= */
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], WD=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], WDF=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const toT=d=>Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10));
const addD=(d,n)=>new Date(toT(d)+n*864e5).toISOString().slice(0,10);
const dayIdx=d=>(new Date(toT(d)).getUTCDay()+6)%7;
const dS=d=>d?`${+d.slice(8,10)} ${MON[+d.slice(5,7)-1]}`:'-';
const dL=d=>d?`${dS(d)} ${d.slice(0,4)}`:'-';
const has=v=>typeof v==='number'&&isFinite(v);
const full=v=>has(v)?Math.round(v).toLocaleString('en-GB'):'-';
function abbr(v){ if(!has(v)) return '-'; const a=Math.abs(v),t=(x,d)=>(+x.toFixed(d)).toString();
  if(a>=1e9) return t(v/1e9,2)+'bn'; if(a>=1e6) return t(v/1e6,a>=1e7?1:2)+'m'; if(a>=1e4) return t(v/1e3,a>=1e5?0:1)+'k'; return full(v); }
const pct=(v,d=1)=>has(v)?(+v.toFixed(d)).toString()+'%':'-';
const sgn=v=>has(v)?(v>0?'+':'')+full(v):'-';
const usd=v=>has(v)?CURSYM+(Math.abs(v)>=1e4?abbr(v):v.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})):'-';
const inR=(rs,a,b)=>(rs||[]).filter(r=>r.d>=a&&r.d<=b);
const sum=(rs,k)=>{let t=0,n=0;for(const r of rs){if(has(r[k])){t+=r[k];n++;}}return n?t:null;};
const chg=(c,p)=>(has(c)&&has(p)&&p!==0)?(c-p)/Math.abs(p)*100:null;
const lastD=rs=>rs&&rs.length?rs[rs.length-1].d:null;
const days=(a,b)=>{const o=[];for(let d=a;d<=b;d=addD(d,1))o.push(d);return o;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const lastVal=(rs,k,a,b)=>{ const x=inR(rs,a,b).filter(r=>has(r[k])); return x.length?x[x.length-1][k]:null; };

/* ================= periods ================= */
/* ================= date range ================= */
/* One range drives the whole dashboard. W = selected dates plus the
   period of equal length immediately before, used for every comparison. */
let N=28, W=null;
const R={preset:'all',from:null,to:null};   /* every visit opens on All time */
const dayDiff=(a,b)=>Math.round((toT(b)-toT(a))/864e5);
function dataBounds(){
  /* end: the latest day of the main social, website and app data, used for "Last 28 days" and similar.
     endAll: the latest day of any data at all (ads can run ahead), used for "All time" and the date picker. */
  const all=[D.fb,D.yt,D.ig,D.web,D.play,D.apple,D.adsense,D.admob,D.xPosts,D.ttAcct,D.pSubs,D.aSubs,D.earn,D.traffic,D.qual,D.ads].map(r=>r&&r.length?lastD(r):null).filter(Boolean).sort();
  const ends=[D.fb,D.yt,D.ig,D.web,D.play,D.apple].map(lastD).filter(Boolean).sort();
  const starts=[D.fb,D.yt,D.ig,D.web,D.play,D.apple,D.ads,D.traffic,D.qual,D.pSubs,D.aSubs].map(r=>r&&r.length?r[0].d:null).filter(Boolean).sort();
  const exLast=((D.extra&&D.extra.tabs)||[]).map(t=>t.last).filter(Boolean);
  /* a workbook with only some tabs filled (or none yet) still gets sensible dates */
  const endAll=[ends[ends.length-1],all[all.length-1],...exLast].filter(Boolean).sort().pop()||new Date().toISOString().slice(0,10);
  const end=ends[ends.length-1]||endAll, first=[...starts,...all].filter(Boolean).sort()[0];
  return {start:first&&first<=endAll?first:addD(endAll,-27),end,endAll};
}
const PRESETS=[['7','Last 7 days'],['28','Last 28 days'],['90','Last 90 days'],['month','This month'],['lastmonth','Last month'],['year','This year'],['all','All time']];
function presetDates(p){
  const B=dataBounds(), e=B.end;
  if(p==='7'||p==='28'||p==='90') return {from:addD(e,-(+p-1)),to:e};
  if(p==='month') return {from:e.slice(0,8)+'01',to:e};
  if(p==='lastmonth'){ const f=e.slice(0,8)+'01', lastEnd=addD(f,-1); return {from:lastEnd.slice(0,8)+'01',to:lastEnd}; }
  if(p==='year') return {from:e.slice(0,4)+'-01-01',to:e};
  return {from:B.start,to:B.endAll};
}
function clampISO(d,B){ return d<B.start?B.start:d>B.endAll?B.endAll:d; }
function applyRange(){
  const B=dataBounds();
  let {from,to}=R.preset==='custom'&&R.from&&R.to?{from:R.from,to:R.to}:presetDates(R.preset);
  from=clampISO(from,B); to=clampISO(to,B); if(from>to){ const t=from; from=to; to=t; }
  const L=dayDiff(from,to)+1;
  W={cs:from,end:to,L,ps:addD(from,-L),pe:addD(from,-1)}; N=L;
}
const rangeName=()=>R.preset==='custom'?'Custom dates':(PRESETS.find(p=>p[0]===R.preset)||[])[1]||'';
const IDX=new WeakMap();
function byDate(rs){ let m=IDX.get(rs); if(!m){ m=new Map(); (rs||[]).forEach(r=>m.set(r.d,r)); IDX.set(rs,m); } return m; }
/* (kept for reference) each source used to be measured over its own latest N days, so a source that
   reports a few days late is never penalised for the missing tail */
function win(rs){ if(!rs||!rs.length||!W) return null; return W; }
/* a source with no rows still gives a full, empty result, so every page can draw without it */
const EMPTY_M=()=>({w:W,cur:null,prev:null,d:null,cd:0,pd:0,asOf:null,none:true,series:W?days(W.cs,W.end).map(()=>null):[]});
function st(rs,k){
  const w=win(rs); if(!w) return EMPTY_M();
  const c=inR(rs,w.cs,w.end), p=inR(rs,w.ps,w.pe);
  const cv=sum(c,k), pv=sum(p,k), cd=c.filter(r=>has(r[k])).length, pd=p.filter(r=>has(r[k])).length;
  const d=(pd>=N/2&&cd)?chg(cv/cd,pv/pd):null;
  const bd=byDate(rs); return {w,cur:cv,prev:pv,d,cd,pd,series:days(w.cs,w.end).map(x=>{const r=bd.get(x);return r&&has(r[k])?r[k]:null;})};
}
function level(rs,k){ /* for stock values: latest vs the value at the end of the previous period */
  const w=win(rs); if(!w) return EMPTY_M();
  /* a running total (followers, subscribers, devices) is the latest known figure up to the end of the dates,
     even if that source stopped reporting a little earlier; asOf says which day it is from */
  const upto=end=>{ for(let i=rs.length-1;i>=0;i--){ const r=rs[i]; if(r.d<=end&&has(r[k])) return r; } return null; };
  const cr=upto(w.end), pr=upto(w.pe); const cv=cr?cr[k]:null, pv=pr&&(!cr||pr.d<cr.d)?pr[k]:null;
  const bd=byDate(rs); return {w,cur:cv,prev:pv,asOf:cr?cr.d:null,d:chg(cv,pv),series:days(w.cs,w.end).map(x=>{const r=bd.get(x);return r&&has(r[k])?r[k]:null;})};
}

/* ================= visual helpers ================= */
function spark(vals,color,kind){
  if(!Array.isArray(vals)) return '<svg viewBox="0 0 120 30"></svg>';
  const v=vals.map(x=>has(x)?x:null), nn=v.filter(has); if(nn.length<2) return '<svg viewBox="0 0 120 30"></svg>';
  const mx=Math.max(...nn), mn=kind==='level'?Math.min(...nn):0, rg=(mx-mn)||1, n=v.length;
  const X=i=>i/(n-1)*120, Y=x=>27-(x-mn)/rg*24;
  let d='',a='',open=false,first=null;
  v.forEach((x,i)=>{ if(has(x)){ d+=(open?'L':'M')+X(i).toFixed(1)+','+Y(x).toFixed(1); if(!open) first=i; open=true; } else open=false; });
  const pts=v.map((x,i)=>has(x)?[X(i),Y(x)]:null).filter(Boolean);
  a='M'+pts[0][0]+',30L'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')+'L'+pts[pts.length-1][0]+',30Z';
  return `<svg viewBox="0 0 120 30" preserveAspectRatio="none"><path d="${a}" fill="${color}" fill-opacity=".2"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}
function pill(d,opt={}){
  if(!has(d)) return opt.none?`<span class="pill flat">${opt.none}</span>`:'';   /* nothing to compare with: show nothing */
  const tip=opt.tip?` data-tip="${esc(opt.tip)}" tabindex="0"`:'';
  const inv=opt.invert; const good=inv?d<0:d>0; const flat=Math.abs(d)<1;
  const cls=flat?'flat':good?'up':'down'; const arrow=d>0?'▲':d<0?'▼':'';
  return `<span class="pill ${cls}"${tip}>${arrow} ${(+Math.abs(d).toFixed(opt.pp?2:1))}${opt.pp?' pts':'%'} <small>vs prior ${N}d</small></span>`;
}
const TIPS={
  'Engagement rate':'Engagements divided by views. Facebook counts reactions, comments, shares and clicks; YouTube counts likes, comments and shares.',
  'Visit rate':'Facebook page visits divided by views.',
  'Reach, summed daily':'Accounts reached each day, added together. Someone reached on two days counts twice.',
  'Instagram reach':'Accounts reached each day, added together. Someone reached on two days counts twice.',
  'Daily viewers, summed':'Unique viewers each day, added together. Returning viewers count once per day.',
  'Follows per 10,000 reached':'New Instagram follows for every 10,000 accounts reached.',
  'Engaged sessions':'Share of website visits that lasted over 10 seconds, viewed two or more pages, or converted.',
  'Cost per 1,000 impressions':'Ad spend divided by impressions, times 1,000 (CPM).',
  'Click-through rate':'Clicks divided by impressions (CTR).',
  'Cost per click':'Ad spend divided by clicks (CPC).',
  'Cost per app install':'Ad spend divided by app installs Meta attributes to the ads.',
  'Active Android devices':'Android devices that currently have the app installed, as reported by Google Play.',
  'Play uninstalls':'Times the app was removed from an Android device.',
  'Trial to paid':'Apple free trials that became paid subscriptions.',
  'Apple proceeds':'What Apple pays out after its commission, converted to '+CURNAME+'.',
  'Google Play revenue':'Worked out from Google\u2019s fee lines in the earnings export: each sale is the fee divided by 15%, and you keep the other 85% (or the net payout, when the tab holds the whole earnings report).',
  'Paying subscribers':'Active subscriptions on Google Play plus Apple\u2019s standard-price subscriptions. Apple free trials are shown separately, not counted.',
  'Average view duration':'Average time watched per view, weighted by each day\u2019s views.',
  'Watch time':'Total hours of video watched.'
};
function kc(o){
  const tip=o.tip||TIPS[o.l];
  return `<div class="kc" style="--c:${o.c||'var(--brand)'}"><div class="l">${o.l}${tip?` <span class="info" tabindex="0" data-tip="${esc(tip)}">i</span>`:''}</div><div class="v${o.na?' na':''}">${o.v}</div>${o.p===undefined?'':o.p}${o.n?`<div class="n">${o.n}</div>`:''}${o.s?`<div class="sp">${o.s}</div>`:''}</div>`;
}
const cmpTip=(x,fmt)=>x&&has(x.cur)&&has(x.prev)?`${(fmt||full)(x.cur)} in ${x.cd||N} days now, against ${(fmt||full)(x.prev)} in ${x.pd||N} days before. Compared as daily averages.`:'';
const niceCeil=v=>{ if(v<=0) return 1; const p=Math.pow(10,Math.floor(Math.log10(v))), f=v/p; return (f<=1?1:f<=1.5?1.5:f<=2?2:f<=2.5?2.5:f<=3?3:f<=4?4:f<=5?5:f<=6?6:f<=8?8:10)*p; };

/* multi-series chart: area / line / bar, hover tooltip across series */
let CID=0; const CH={};
function chart(o){
  const narrow=window.innerWidth<640;
  const half=o.h&&!o.wide; const W0=narrow?420:(half?560:960), H0=o.h?(half?Math.round(o.h*.82):o.h):(narrow?240:280), L=(narrow||half)?50:58, R=18, T=16, B=30;
  const dates=o.dates, n=dates.length, S=o.series.filter(s=>s.vals.some(has));
  if(!n||!S.length) return `<div class="ch"><p class="note" style="padding:40px 0;text-align:center">No data in this period.</p></div>`;
  let all=[]; if(o.stack){ for(let i=0;i<n;i++){ all.push(S.reduce((t,s)=>t+(has(s.vals[i])?s.vals[i]:0),0)); } } else S.forEach(s=>all=all.concat(s.vals.filter(has)));
  let lo=0, hi=niceCeil(Math.max(...all.filter(has),0)*1.08/4)*4||1;
  if(o.level){ const mn=Math.min(...all.filter(has)), mx=Math.max(...all.filter(has)); const step=niceCeil(((mx-mn)||mx*.02||1)*1.3/4); lo=Math.max(0,Math.floor(mn/step)*step-step); hi=lo+step*4; if(hi<mx) hi+=step; }
  const X=i=>L+(W0-L-R)*(n===1?.5:i/(n-1)), Y=v=>T+(H0-T-B)*(1-(v-lo)/(hi-lo));
  const fmt=o.fmt||abbr;
  let g='';
  for(let k=0;k<=4;k++){ const v=lo+(hi-lo)*k/4, y=Y(v); g+=`<line x1="${L}" x2="${W0-R}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1" ${k?'stroke-dasharray="2 4"':''}/><text class="ax" x="${L-9}" y="${y+4}" text-anchor="end">${fmt(v)}</text>`; }
  if(n===1){ g+=`<text class="ax" x="${X(0)}" y="${H0-9}" text-anchor="middle">${dL(dates[0])}</text>`; }
  else if(n>60){ const starts=[]; dates.forEach((d,i)=>{ if(d.slice(8,10)==='01') starts.push(i); });
    const maxL=(narrow||half)?5:10, step=Math.max(1,Math.ceil(starts.length/maxL)), multi=dates[0].slice(0,4)!==dates[n-1].slice(0,4);
    starts.filter((_,j)=>j%step===0).forEach((i,j)=>{ const d=dates[i], m=+d.slice(5,7)-1; const lab=MON[m]+(multi&&(m===0||j===0)?` ${d.slice(2,4)}`:'');
      if(X(i)>L+12&&X(i)<W0-R-12) g+=`<text class="ax" x="${X(i)}" y="${H0-9}" text-anchor="middle">${lab}</text>`; }); }
  else { const ticks=[...new Set((narrow||half)?[0,Math.floor((n-1)/2),n-1]:[0,Math.floor((n-1)/4),Math.floor((n-1)/2),Math.floor(3*(n-1)/4),n-1])];
    ticks.forEach((i,j)=>g+=`<text class="ax" x="${X(i)}" y="${H0-9}" text-anchor="${j===0?'start':j===ticks.length-1?'end':'middle'}">${dS(dates[i])}</text>`); }
  let body='';
  const segs=vals=>{ const out=[]; let cur=[]; vals.forEach((v,i)=>{ if(has(v)) cur.push([X(i),Y(v)]); else if(cur.length){out.push(cur);cur=[];} }); if(cur.length) out.push(cur); return out; };
  const path=sg=>sg.map(s=>'M'+s.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')).join('');
  const id='c'+(++CID);
  if(o.type==='bar'){
    const bw=Math.max(1.5,(W0-L-R)/n*.72); const base=new Array(n).fill(0);
    S.forEach(s=>{ s.vals.forEach((v,i)=>{ if(!has(v)||v<=0) return; const y0=o.stack?base[i]:0; const x=X(i)-bw/2;
      body+=`<rect x="${x.toFixed(1)}" y="${Y(y0+v).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(.5,Y(y0)-Y(y0+v)).toFixed(1)}" fill="${s.color}" rx="${Math.min(3,bw/3).toFixed(1)}" opacity="${s.op||.92}"/>`; if(o.stack) base[i]+=v; }); });
  } else {
    S.forEach((s,si)=>{
      const sg=segs(s.vals);
      if(s.area!==false&&(o.area||s.area)){ body+=`<defs><linearGradient id="${id}g${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".42"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>`;
        body+=sg.map(x=>`<path d="M${x[0][0].toFixed(1)},${Y(lo)}L${x.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}L${x[x.length-1][0].toFixed(1)},${Y(lo)}Z" fill="url(#${id}g${si})"/>`).join(''); }
      const rawOfMa=o.ma&&si===0;
      body+=`<path d="${path(sg)}" fill="none" stroke="${s.color}" stroke-width="${rawOfMa?1.3:(s.w||2.2)}" stroke-linejoin="round" stroke-linecap="round" ${s.dash?'stroke-dasharray="5 4"':''} opacity="${rawOfMa?.5:(s.op||1)}" />`;
      if(o.ma&&si===0){ const m=s.vals.map((_,i)=>{ const w=s.vals.slice(Math.max(0,i-6),i+1).filter(has); return has(s.vals[i])&&w.length>=4?w.reduce((a,b)=>a+b,0)/w.length:null; });
        body+=`<path d="${path(segs(m))}" fill="none" stroke="${s.color}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>`; }
    });
  }
  let pk='';
  if(o.peak!==false&&o.type!=='bar'){ const v=S[0].vals; let pi=-1; v.forEach((x,i)=>{ if(has(x)&&(pi<0||x>v[pi])) pi=i; });
    if(pi>=0){ const px=X(pi),py=Y(v[pi]),rt=px>W0*.7; pk=`<circle cx="${px}" cy="${py}" r="5" fill="${S[0].color}" style="stroke:var(--card)" stroke-width="2.5"/><text class="ax" x="${px+(rt?-9:9)}" y="${Math.max(py-8,T+10)}" text-anchor="${rt?'end':'start'}" style="font-weight:600;fill:var(--ink-2)">Peak ${fmt(v[pi])}, ${dS(dates[pi])}</text>`; } }
  CH[id]={dates,S,X,Y,W0,H0,L,R,T,B,fmt,stack:o.stack};
  const legend=S.length>1||o.legend?`<div class="lg">${S.map(s=>`<span><i style="background:${s.color};opacity:${s.op||1}"></i>${s.name}</span>`).join('')}</div>`:'';
  return `<div class="ch" id="${id}">${legend}<svg viewBox="0 0 ${W0} ${H0}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(o.aria||'chart')}">${g}${body}${pk}
    <line class="xh" y1="${T}" y2="${H0-B}" style="stroke:var(--line-3)" stroke-width="1" stroke-dasharray="3 3" visibility="hidden"/><g class="hd"></g>
    <rect x="${L}" y="${T}" width="${W0-L-R}" height="${H0-T-B}" fill="transparent" class="hit"/></svg><div class="tip"></div></div>`;
}
function bindCharts(){
  Object.keys(CH).forEach(id=>{ const el=document.getElementById(id); if(!el) return; const c=CH[id], svg=el.querySelector('svg'), tip=el.querySelector('.tip'), xh=svg.querySelector('.xh');
    const mv=e=>{ const p=e.touches?e.touches[0]:e, r=svg.getBoundingClientRect(); if(!r.width) return; const sx=(p.clientX-r.left)/r.width*c.W0, n=c.dates.length;
      let i=Math.round((sx-c.L)/(c.W0-c.L-c.R)*(n-1)); i=Math.max(0,Math.min(n-1,i)); const x=c.X(i);
      xh.setAttribute('x1',x); xh.setAttribute('x2',x); xh.setAttribute('visibility','visible');
      const hd=svg.querySelector('.hd'); if(hd) hd.innerHTML=c.S.map(s=>has(s.vals[i])?`<circle cx="${x}" cy="${c.Y(s.vals[i])}" r="5" fill="${s.color}" style="stroke:var(--card)" stroke-width="2.5"/>`:'').join('');
      const wd=WD[dayIdx(c.dates[i])];
      tip.innerHTML=`<div class="td">${wd} ${dL(c.dates[i])}</div>`+c.S.map(s=>`<div><i style="background:${s.color}"></i>${s.name}: <b>${has(s.vals[i])?c.fmt(s.vals[i]):'no data'}</b></div>`).join('');
      const er=el.getBoundingClientRect(), sc=r.width/c.W0; const tops=c.S.map(s=>has(s.vals[i])?c.Y(s.vals[i]):c.H0).filter(has);
      tip.style.left=Math.min(Math.max(r.left-er.left+x*sc,90),er.width-90)+'px'; tip.style.top=(r.top-er.top+Math.min(...tops)*sc)+'px'; tip.style.opacity=1; };
    const lv=()=>{ tip.style.opacity=0; xh.setAttribute('visibility','hidden'); const hd=svg.querySelector('.hd'); if(hd) hd.innerHTML=''; };
    svg.addEventListener('mousemove',mv); svg.addEventListener('mouseleave',lv);
    svg.addEventListener('touchstart',mv,{passive:true}); svg.addEventListener('touchmove',mv,{passive:true}); svg.addEventListener('touchend',lv); });
}
function donut(parts){
  const tot=parts.reduce((t,p)=>t+(has(p.v)?p.v:0),0); if(!tot) return '<p class="note">No data.</p>';
  let a=-Math.PI/2, arcs=''; const R=62, r=40, cx=75, cy=75;
  parts.forEach(p=>{ if(!has(p.v)||p.v<=0) return; const f=p.v/tot, b=a+f*Math.PI*2-(f<1?.02:0); const lg=b-a>Math.PI?1:0;
    const P=(ang,rad)=>[cx+Math.cos(ang)*rad,cy+Math.sin(ang)*rad];
    const [x1,y1]=P(a,R),[x2,y2]=P(b,R),[x3,y3]=P(b,r),[x4,y4]=P(a,r);
    arcs+=f>=.9999?`<circle cx="${cx}" cy="${cy}" r="${(R+r)/2}" fill="none" stroke="${p.c}" stroke-width="${R-r}"/>`
      :`<path d="M${x1},${y1}A${R},${R} 0 ${lg} 1 ${x2},${y2}L${x3},${y3}A${r},${r} 0 ${lg} 0 ${x4},${y4}Z" fill="${p.c}"/>`; a+=f*Math.PI*2; });
  return `<div class="dn"><svg viewBox="0 0 150 150">${arcs}<text x="75" y="72" text-anchor="middle" style="font-size:17px;font-weight:700;fill:var(--ink)">${abbr(tot)}</text><text x="75" y="89" text-anchor="middle" class="ax">total</text></svg>
    <div class="dl">${parts.map(p=>`<div><i style="background:${p.c}"></i><span>${p.l}<small>${p.s||''}</small></span><b>${has(p.v)&&tot?pct(p.v/tot*100,1):'-'}</b></div>`).join('')}</div></div>`;
}
function hbars(rows,fmt,color){ const mx=Math.max(...rows.map(r=>r.v).filter(has),0);
  return `<div class="hb">${rows.map(r=>`<div class="hr"><span>${r.l}</span><div class="ht"><i style="width:${has(r.v)&&mx?Math.max(1,r.v/mx*100):0}%;background:${r.c||color}"></i></div><b>${has(r.v)?fmt(r.v):'-'}${r.x?` <small>${r.x}</small>`:''}</b></div>`).join('')}</div>`; }
function weekday(rs,k,color){ const w=win(rs); if(!w) return {html:'<p class="note">No data.</p>'}; const s=Array(7).fill(0),n=Array(7).fill(0);
  /* judged over the 12 weeks up to the end of the chosen dates (or as many as the data has), so one big day can't decide it */
  const first=rs[0].d; let st=new Date(Date.parse(w.end)-83*864e5).toISOString().slice(0,10); if(st<first) st=first; const weeks=Math.max(1,Math.round(days(st,w.end).length/7));
  inR(rs,st,w.end).forEach(r=>{ if(has(r[k])){ s[dayIdx(r.d)]+=r[k]; n[dayIdx(r.d)]++; } });
  const av=s.map((v,i)=>n[i]?v/n[i]:null), mx=Math.max(...av.filter(has),0), best=av.indexOf(mx), mean=av.filter(has).reduce((a,b)=>a+b,0)/(av.filter(has).length||1), enough=n.every(x=>x>=3);
  return {best:enough?best:-1,bestV:mx,mean,weeks,html:`<div class="wk">${av.map((v,i)=>`<div style="height:${mx&&has(v)?Math.max(4,v/mx*100):3}%;background:${color};opacity:${i===best&&enough?1:.35}" title="${WD[i]} ${full(v)}"></div>`).join('')}</div><div class="wkl">${WD.map(d=>`<span>${d}</span>`).join('')}</div>
    <p class="note">${enough&&mx?`${WDF[best]} is strongest over the last ${weeks} weeks, averaging ${full(mx)}, ${pct((mx/mean-1)*100,0)} above the weekly mean.`:'Not enough weeks of data yet to compare weekdays reliably.'}</p>`}; }
const status=(d,opt={})=>{ if(!has(d)) return 'none'; const inv=opt.invert?-1:1; const v=d*inv; return v>=2?'good':v<=-5?'bad':'watch'; };
const chipTxt={good:'ON TRACK',watch:'WATCH',bad:'ACTION',none:'NO COMPARISON'};
const gapNote=(rs,w,label)=>{ return ''; /* coverage notes are kept off the pages; the Data page has the details */ if(!w||!rs||!rs.length) return '';
  const first=rs[0].d, last=lastD(rs), a=w.cs>first?w.cs:first, b=w.end<last?w.end:last; const bits=[];
  if(a<=b){ const bd=byDate(rs); const miss=days(a,b).filter(d=>!bd.has(d));
    if(miss.length) bits.push(`${miss.length} day${miss.length>1?'s':''} missing (${miss.length>6?`including ${miss.slice(0,3).map(dS).join(', ')} and ${dS(miss[miss.length-1])}`:miss.map(dS).join(', ')})`); }
  if(first>w.cs) bits.push(`data starts ${dL(first)}`);
  /* data ending early is covered by the page's own "data stops on" warning */
  if(!bits.length) return '';
  return `<div class="co watch"><h4>${label}: not every day in this range has data</h4><p>${bits.join('; ').replace(/^./,c=>c.toUpperCase())}. Totals cover only the days with data; changes use daily averages so they stay fair.</p></div>`; };
const ph=(t,d,range)=>`<div class="ph"><div><h2>${t}</h2><p>${d}</p></div>${range?`<span class="range">${range}</span>`:''}</div>`;
const rng=w=>w?`${dS(w.cs)} to ${dL(w.end)}`:'';


/* ================= funnels ================= */
const hexA=(h,a)=>{ const n=parseInt(h.replace('#',''),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; };
const fmtR=v=>!has(v)?'-':v===0?'0%':v>=10?v.toFixed(1)+'%':v>=1?v.toFixed(1)+'%':v>=0.1?v.toFixed(2)+'%':v.toFixed(3)+'%';
/* stages: {l, v, f(format), n(note), r:'auto'|{v,lab}|{na}, miss, of(label for the ratio)} */
function drawFunnel(o){
  const col=o.color, st=o.stages, uid='f'+(++CID);
  st.forEach(x=>{ x.empty=!x.miss&&!has(x.v); });
  const real=st.filter(x=>!x.miss&&!x.empty&&x.v>0), top=Math.max(...real.map(x=>x.v),1);
  const scale=v=>36+64*Math.pow(Math.log10(v+1)/Math.log10(top+1),1.7);
  /* top edge of each stage; never wider than the stage above, so the outline is always a funnel */
  const tw=[]; st.forEach((x,i)=>{ let w=i===0?100:((x.miss||x.empty)?tw[i-1]*.84:scale(x.v)); if(i>0) w=Math.min(w,tw[i-1]-4); tw.push(Math.max(w,30)); });
  const bw=st.map((_,i)=>i<st.length-1?tw[i+1]:Math.max(24,tw[i]*.82));   /* bottom edge meets the next stage */
  let html='';
  st.forEach((x,i)=>{
    const a=Math.max(.5,.96-i*(.46/Math.max(1,st.length-1))), t=tw[i], b2=bw[i], ghost=x.miss||x.empty;
    let r='<div></div>';
    if(i>0){
      if(x.miss) r='<div></div>';
      else if(x.empty) r=`<div class="fs-r na"><small>no data</small></div>`;
      else if(x.r&&x.r.na) r=`<div class="fs-r na"><small>${esc(x.r.na)}</small></div>`;
      else if(x.r&&has(x.r.v)) r=`<div class="fs-r"><b>${x.r.txt||fmtR(x.r.v)}</b><small>${esc(x.r.lab)}</small></div>`;
      else { /* divide by the stage the label names; otherwise by the nearest stage above */
        const ok=y=>!y.miss&&!y.empty&&y.v>0, before=st.slice(0,i);
        const p=(x.of&&before.find(y=>ok(y)&&y.l.toLowerCase()===x.of.toLowerCase()))||[...before].reverse().find(ok);
        r=p?`<div class="fs-r"><b>${fmtR(x.v/p.v*100)}</b><small>of ${esc(p.l.toLowerCase())}</small></div>`:`<div class="fs-r na"><small>no data</small></div>`; }
    }
    const pts=`${50-t/2},0 ${50+t/2},0 ${50+b2/2},100 ${50-b2/2},100`;
    const shape=ghost
      ?`<polygon points="${pts}" style="fill:var(--ghost-fill);stroke:var(--ghost-line)" stroke-width="1.2" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`
      :`<defs><linearGradient id="${uid}g${i}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${col}" stop-opacity="${a}"/><stop offset=".5" stop-color="${col}" stop-opacity="${a*.9}"/><stop offset="1" stop-color="${col}" stop-opacity="${a*.72}"/></linearGradient></defs>
        <polygon points="${pts}" style="fill:var(--funnel-base)"/><polygon points="${pts}" fill="url(#${uid}g${i})"/><line x1="${50-t/2}" y1="0" x2="${50+t/2}" y2="0" style="stroke:var(--ghost-line)" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
    const val=x.miss?'not in the sheet':x.empty?'none recorded in this period':(x.f||full)(x.v);
    html+=`<div class="fs${ghost?' miss':''}">${r}<div class="fs-lane"><svg class="fs-shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${shape}</svg>
      <div class="fs-txt"><small>${x.l}</small><b>${val}</b></div></div><div class="fs-n">${ghost?'':(x.n||'')}</div></div>`;
  });
  const notes=st.filter(x=>!x.miss&&!x.empty&&x.n).map(x=>`<li><b>${x.l}</b> ${x.n}</li>`).join('');
  return `<div class="fnl${o.wide?' wide':''}"${o.snap?' data-snap="1"':''}><div class="fnl-h"><h4><i style="background:${col}"></i>${o.title}</h4><span>${o.sub||''}</span></div><div class="fs-wrap">${html}</div>${notes?`<ul class="fs-notes">${notes}</ul>`:''}${o.foot?`<p class="fnl-f">${o.foot}</p>`:''}</div>`;
}


/* ================= new data sections: helpers ================= */
/* A titled placeholder that says exactly which columns the sheet needs */
/* Sections with no data are left out entirely; they appear on their own once the data arrives. */
function waiting(){ return ''; }
const anyIn=(rs,k)=>inR(rs,W.cs,W.end).some(r=>has(r[k]));
/* placeholder if the sheet has never had these columns; a short note if it has them but not for these dates */
function need(){ return ''; }
const postsIn=rs=>(rs||[]).filter(p=>p.d>=W.cs&&p.d<=W.end);
const wAvg=(rs,k,wk)=>{ let a=0,b=0; rs.forEach(r=>{ if(has(r[k])&&has(r[wk])&&r[wk]>0){ a+=r[k]*r[wk]; b+=r[wk]; } }); return b?a/b:null; };
const secs=v=>!has(v)?'-':v>=60?`${Math.floor(v/60)}m ${String(Math.round(v%60)).padStart(2,'0')}s`:`${Math.round(v)}s`;
function postRows(list,cols){
  return list.map(p=>`<tr><td class="ptitle">${p.u?`<a href="${esc(p.u)}" target="_blank" rel="noopener">${esc(p.t||p.id)}</a>`:esc(p.t||p.id)}<small>${dL(p.d)}${p.ty?` <span class="tchip">${esc(p.ty)}</span>`:''}</small></td>${cols.map(c=>`<td>${has(p[c.k])||c.f?(c.f?c.f(p):full(p[c.k])):'-'}</td>`).join('')}</tr>`).join('');
}
function bestWorstPosts(list,key,cols,label){
  const ok=list.filter(p=>has(p[key])).sort((a,b)=>b[key]-a[key]); if(!ok.length) return '';
  cols=cols.filter(c=>ok.some(p=>has(c.f?null:p[c.k])||(c.f&&has(p[c.k]))));   /* hide columns with no figures */
  const head=`<thead><tr><th>${label}</th>${cols.map(c=>`<th>${c.h}</th>`).join('')}</tr></thead>`;
  const top=ok.slice(0,5), bot=ok.length>5?ok.slice(-5).reverse():[];
  return `<div class="tw" style="margin-bottom:14px"><table>${head.replace(label,'Best performing')}<tbody>${postRows(top,cols)}</tbody></table></div>`+
    (bot.length?`<div class="tw"><table>${head.replace(label,'Lowest performing')}<tbody>${postRows(bot,cols)}</tbody></table></div>`:'');
}
function byFormat(list,key){
  const g={}; list.forEach(p=>{ const t=p.ty||'Other'; const o=g[t]||(g[t]={n:0,s:0}); o.n++; if(has(p[key])) o.s+=p[key]; });
  const rows=Object.keys(g).sort((a,b)=>g[b].s-g[a].s);
  if(rows.length<2) return '';   /* one format only: nothing to compare */
  return `<div class="tw"><table style="min-width:0"><thead><tr><th>Format</th><th>Published</th><th>Total views</th><th>Average views</th></tr></thead><tbody>${rows.map(t=>`<tr><td><span class="tchip">${esc(t)}</span></td><td>${g[t].n}</td><td><b>${full(g[t].s)}</b></td><td>${full(g[t].s/g[t].n)}</td></tr>`).join('')}</tbody></table></div>`;
}


/* ================= TikTok and X: manual snapshots =================
   Collected by hand from each platform's own analytics. Not in the sheet,
   so these are fixed figures for the dates shown and do not follow the date range. */
/* the old manual snapshots were retired; their figures are no longer kept in the code */
const SNAP={};
const snapRange=k=>`${dS(SNAP[k].from)} to ${dL(SNAP[k].to)}`;
function snapCard(c,color){
  const tags=(c.tags||[]).map(t=>`<span class="src ${t[0]}">${t[1]}</span>`).join(' ');
  const good=c.inv?c.d<0:c.d>0;
  const p=has(c.d)?`<span class="pill ${good?'up':'down'}">${c.d>0?'▲':'▼'} ${Math.abs(c.d)}% <small>vs previous 28 days</small></span>`:'';
  return `<div class="kc" style="--c:${color}"><div class="l">${c.l}</div><div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">${tags}</div><div class="v${c.txt?' txt':''}">${c.v}</div>${p}${c.n?`<div class="n">${c.n}</div>`:''}</div>`;
}
function snapSection(k,name,color){
  const S=SNAP[k];
  return `<div data-snap="1"><h3 class="st">Manual snapshot <small>${snapRange(k)}</small></h3>
    <div class="snapnote"><div><b>Fixed figures from ${S.src}, ${snapRange(k)}</b><p>The sheet only carries ${name} reach and daily follows, so these fuller figures were collected by hand for these dates. They do not change with the date picker or update live, and they are kept out of the network totals. The live figures on this page follow your dates. Tags show how exact each figure is.</p></div></div>
    <div class="kg">${S.cards.map(c=>snapCard(c,color)).join('')}</div></div>`;
}
function snapPage(k,name,color){
  const S=SNAP[k];
  return `<div data-snap="1">${ph(name,`Every metric ${name} makes available, collected from ${S.src}.`,snapRange(k))}
    <div class="snapnote"><div><b>Manual snapshot, ${snapRange(k)}</b><p>${name} is not in the sheet yet, so these are fixed figures collected by hand for these dates. They do not change with the date picker or update live, and they are kept out of the network totals so those stay accurate. Tags show how exact each figure is.</p></div></div>
    <div class="kg">${S.cards.map(c=>snapCard(c,color)).join('')}</div></div>`;
}


/* ================= content snapshots (Facebook, Instagram) =================
   Transcribed from the original report. Captions were truncated at source. */
const SNAPC={facebook:{},instagram:{}};   /* retired: the old content snapshot figures are no longer kept in the code */;

const FMT_COL={photo:'#5B8DEF',photos:'#5B8DEF',reel:'#D66BA0',reels:'#D66BA0',link:'#3FB5A8',links:'#3FB5A8',story:'#9D86E9',stories:'#9D86E9',
  'multi media':'#D9A857','multi-photo':'#D9A857',carousel:'#D9A857',video:'#E5654F',videos:'#E5654F',others:'#8A8A90'};
const fchip=t=>{ const c=FMT_COL[String(t).toLowerCase()]||'#8A8A90'; return `<span class="fchip" style="color:${c};background:${hexA(c,.15)}">${esc(t)}</span>`; };
const rankB=i=>`<span class="rank${i<3?' r'+(i+1):''}">${i+1}</span>`;
const cell=v=>v===null||v===undefined?'<td class="na">-</td>':`<td>${full(v)}</td>`;
function contentTable(title,sub,rows,cols,trunc,color,weak){
  const col=color||'#5B8DEF', mx=Math.max(...rows.map(r=>r[2]||0),1);
  const rates=rows.map(r=>r[2]?r[3]/r[2]*100:null), avg=rows.reduce((t,r)=>t+(r[3]||0),0)/Math.max(1,rows.reduce((t,r)=>t+(r[2]||0),0))*100;
  return `<div class="card"><h4>${title}</h4><p class="cs">${sub}</p><div class="tw" style="box-shadow:none"><table class="ctab" style="min-width:0"><thead><tr><th style="width:34px;text-align:left">#</th><th>Content</th><th>Format</th><th>Views</th><th>Rate</th>${cols.slice(1).map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>
    ${rows.map((r,i)=>`<tr${!weak&&i===0?' class="top1"':''}><td>${rankB(i)}</td><td class="ptitle">${esc(r[0])}${trunc&&!/^\(/.test(r[0])?'\u2026':''}</td><td>${fchip(r[1])}</td>
      <td class="dbar"><span>${full(r[2])}</span><i style="width:${Math.max(4,r[2]/mx*100)}%;background:linear-gradient(90deg,${hexA(weak?'#E07A68':col,.45)},${weak?'#E07A68':col})"></i></td>
      <td>${has(rates[i])?`<span class="rchip ${rates[i]>=avg?'hi':'lo'}">${rates[i].toFixed(2)}%</span>`:'-'}</td>${r.slice(3,2+cols.length).map(cell).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="note" style="margin-top:8px">Rate is interactions divided by views. Green is at or above this table's average of ${avg.toFixed(2)}%.</p></div>`;
}
function fbContentSnap(){
  const S=SNAPC.facebook, rng2=`${dS(S.from)} to ${dL(S.to)}`;
  const valid=S.formats.filter(f=>f[2]/f[1]*100<=100), best=valid.reduce((a,f)=>f[2]/f[1]>a[2]/a[1]?f:a,valid[0]), mxR=best[2]/best[1]*100, mxV=Math.max(...S.formats.map(f=>f[1]));
  const fmtRow=f=>{ const rate=f[2]/f[1]*100, c=FMT_COL[f[0].toLowerCase()]||'#8A8A90';
    return `<tr><td>${fchip(f[0])}${f===best?'<span class="bestchip">Best rate</span>':''}</td>
      <td class="dbar"><span>${full(f[1])}</span><i style="width:${Math.max(2,f[1]/mxV*100)}%;background:linear-gradient(90deg,${hexA(c,.45)},${c})"></i></td><td>${full(f[2])}</td>
      <td>${rate>100?`<span class="chip need">${full(rate)}%, not a rate</span>`:`<div class="ratebar"><em style="width:${Math.max(3,rate/mxR*140)}px;background:linear-gradient(90deg,${c},${hexA(c,.5)})"></em><b>${rate.toFixed(2)}%</b></div>`}</td></tr>`; };
  return `<div data-snap="1"><h3 class="st">Content snapshot <small>${rng2}</small></h3>
    <div class="snapnote"><div><b>Fixed figures from Facebook's own reporting, ${rng2}</b><p>Post-level data is not in the sheet yet, so this content breakdown was collected by hand for these dates. It does not change with the date picker or update live. Post text was cut short in the original export.</p></div></div>
    <div style="display:flex;flex-direction:column;gap:16px">${contentTable('Top by exposure','From the complete 219-post export.',S.top,['Views','Interactions','Shares','Follows','Clicks'],true,'#5B8DEF')}
      ${contentTable('Weakest by exposure','Lowest non-zero views, useful for spotting formats that never land.',S.weak,['Views','Interactions','Shares','Follows','Clicks'],true,'#5B8DEF',true)}</div>
    <h3 class="st">Rate per view, by format <small><span class="src ex">Exact platform totals</span></small></h3>
    <div class="tw"><table style="min-width:0"><thead><tr><th>Format</th><th>Views</th><th>Interactions</th><th>Interaction rate by views</th></tr></thead><tbody>${S.formats.map(fmtRow).join('')}</tbody></table></div>
    <div class="co bad"><h4>Do not work out per-post averages from the table above</h4><p>Meta's content module says it is based on up to 200 pieces of content, and its non-story counts add up to exactly 200 (173 photos, 23 reels and 4 links): a capped sample presented as a total. The complete 219-post export for the same dates shows 189 photo posts and 26 video posts, so the per-post figures below come from the export instead. The two sources also disagree on views in both directions, so they are never mixed in one calculation.</p>
      <p style="margin-top:8px">The "Others" row shows 3,189 interactions against 64 views. That is not a 4,983% engagement rate; it shows Meta's view and interaction buckets do not line up, leaving 1.7% of all interactions unattributed to any format.</p></div>
    <h3 class="st">Per post, from the complete export <small><span class="src ex">219 posts</span></small></h3>
    <div class="tw"><table style="min-width:0"><thead><tr><th>Format</th><th>Posts</th><th>Views per post</th><th>Interactions per post</th><th>Rate per view</th></tr></thead><tbody>
      ${(()=>{ const mv=Math.max(...S.perPost.map(p=>p[2])), br=S.perPost.reduce((a,p)=>parseFloat(p[4])>parseFloat(a[4])?p:a,S.perPost[0]);
        return S.perPost.map(p=>{ const c=FMT_COL[p[0].toLowerCase()]||'#8A8A90';
          return `<tr><td>${fchip(p[0])}${p===br?'<span class="bestchip">Best rate</span>':''}</td><td>${p[1]}</td>
            <td class="dbar"><span>${full(p[2])}</span><i style="width:${Math.max(2,p[2]/mv*100)}%;background:linear-gradient(90deg,${hexA(c,.45)},${c})"></i></td><td>${full(p[3])}</td>
            <td><div class="ratebar"><em style="width:${Math.max(3,parseFloat(p[4])/parseFloat(br[4])*140)}px;background:linear-gradient(90deg,${c},${hexA(c,.5)})"></em><b>${p[4]}</b></div></td></tr>`; }).join(''); })()}</tbody></table></div></div>`;
}
function igContentSnap(){
  const S=SNAPC.instagram, rng2=`${dS(S.from)} to ${dL(S.to)}`, rs=`${dS(S.sampleFrom)} to ${dL(S.sampleTo)}`;
  const tot=S.mediaTypes.reduce((t,m)=>t+m[1],0), shown=S.mediaTypes[0][1]+S.mediaTypes[1][1];
  return `<div data-snap="1"><h3 class="st">Content snapshot <small>${rng2}</small></h3>
    <div class="snapnote"><div><b>Fixed figures collected by hand</b><p>Post-level data is not in the sheet yet. The top and weakest posts and the format comparison come from a hand-collected sample of 73 posts covering ${rs} only, not all 413 items in the period. The media-type chart covers the full period, ${rng2}. None of this changes with the date picker or updates live.</p></div></div>
    <div style="display:flex;flex-direction:column;gap:16px">${contentTable('Top by exposure',`From the sample of 73 posts, ${rs}.`,S.top,['Views','Interactions','Shares','Follows'],false,'#D66BA0')}
      ${contentTable('Weakest by exposure','Lowest non-zero views, useful for spotting formats that never land.',S.weak,['Views','Interactions','Shares','Follows'],false,'#D66BA0',true)}</div>
    <h3 class="st">Formats compared <small><span class="src ro">Sample, ${rs}</span></small></h3>
    <div class="co watch"><h4>Partial coverage</h4><p>These figures come from 73 sampled posts covering ${rs} only, not the full 413 items. Use them to compare formats against each other, not as totals for the period.</p></div>
    <div class="tw"><table><thead><tr><th>Format</th><th>Sampled posts</th><th>Views</th><th>Views per post</th><th>Interactions</th><th>Rate by views</th><th>Shares</th><th>Saves</th><th>Follows</th></tr></thead><tbody>
      ${(()=>{ const rt=r=>r[3]/r[2]*100, br=S.sample.reduce((a,r)=>rt(r)>rt(a)?r:a,S.sample[0]), mvp=Math.max(...S.sample.map(r=>r[2]/r[1]));
        return S.sample.map(r=>{ const c=FMT_COL[r[0].toLowerCase()]||'#8A8A90';
          return `<tr><td>${fchip(r[0])}${r===br?'<span class="bestchip">Best rate</span>':''}</td><td>${r[1]}</td><td>${full(r[2])}</td>
            <td class="dbar"><span>${full(r[2]/r[1])}</span><i style="width:${Math.max(2,r[2]/r[1]/mvp*100)}%;background:linear-gradient(90deg,${hexA(c,.45)},${c})"></i></td><td>${full(r[3])}</td>
            <td><div class="ratebar"><em style="width:${Math.max(3,rt(r)/rt(br)*110)}px;background:linear-gradient(90deg,${c},${hexA(c,.5)})"></em><b>${rt(r).toFixed(2)}%</b></div></td>
            <td>${full(r[4])}</td><td>${full(r[5])}</td><td>${full(r[6])}</td></tr>`; }).join(''); })()}</tbody></table></div>
    <h3 class="st">Post interactions by media type <small><span class="src ex">Full period, from Meta's own chart</span></small></h3>
    <div class="card"><div class="hb thick">${hbars(S.mediaTypes.map((m,i)=>({l:m[0].replace(' (carousels and other)',''),v:m[1],c:['#5B8DEF','#D66BA0','#8A8A90'][i]})),full)}</div>
      <p class="note">Photos ${full(S.mediaTypes[0][1])} and reels ${full(S.mediaTypes[1][1])} make ${full(shown)} of ${full(tot)} post interactions (${(shown/tot*100).toFixed(1)}%). The remaining ${full(S.mediaTypes[2][1])} sit in media types Meta does not display, carousels and other.</p></div></div>`;
}


/* ================= countries: flags and names ================= */
const REGION=(()=>{ try{ return new Intl.DisplayNames(['en'],{type:'region'}); }catch(e){ return null; } })();
const ctyName=c=>{ if(!/^[A-Z]{2}$/.test(c)) return c; try{ const n=REGION&&REGION.of(c); return n&&n!==c?n.replace(' SAR China','').replace('Türkiye','Turkey'):c; }catch(e){ return c; } };
const flagEmoji=c=>/^[A-Z]{2}$/.test(c)?String.fromCodePoint(...[...c].map(x=>127397+x.charCodeAt(0))):'🌐';
/* flag pictures come from flagcdn.com; if they cannot load, the flag emoji is shown instead */
const flagBox=c=>/^[A-Z]{2}$/.test(c)?`<div class="flag"><img src="https://flagcdn.com/w80/${c.toLowerCase()}.png" srcset="https://flagcdn.com/w160/${c.toLowerCase()}.png 2x" alt="Flag of ${esc(ctyName(c))}" loading="lazy" onerror="this.parentNode.textContent='${flagEmoji(c)}'"></div>`:`<div class="flag">🌐</div>`;
function ctyRanked(o){ if(!o||!o.r) return {list:[],total:0}; const t={}; let total=0;
  for(let i=0;i<o.r.length;i+=3){ const d=o.d[o.r[i]]; if(d>=W.cs&&d<=W.end){ const c=o.c[o.r[i+1]]; t[c]=(t[c]||0)+o.r[i+2]; total+=o.r[i+2]; } }
  return {list:Object.keys(t).map(c=>({c,v:t[c]})).sort((a,b)=>b.v-a.v),total}; }

/* every country for the chosen dates, both stores side by side, in a table you can sort */

/* the pipeline's API health log (Dashboard Status tab), as a sortable table with a clear status for each call */
function apiHealth(){ const A=D.apiStatus; if(!A||!A.rows.length) return {html:'',bad:[],total:0,col:-1};
  const hdr=A.hdr, low=hdr.map(h=>h.toLowerCase()), st=low.findIndex(h=>/^(status|result|state|success|ok|api_status|call_status|health)$/.test(h))>=0?low.findIndex(h=>/^(status|result|state|success|ok|api_status|call_status|health)$/.test(h)):low.findIndex(h=>/status|result|success|health/.test(h));
  const verdict=v=>{ const x=String(v).trim().toLowerCase(); if(/^(ok|success|succeeded|successful|true|pass|passed|healthy|green|200|done|complete|completed|✅)$/.test(x)) return 'ok'; if(/error|fail|false|red|down|exception|timeout|denied|invalid|4\d\d|5\d\d|❌/.test(x)) return 'bad'; return x?'warn':''; };
  const name=r=>r[0]||'';
  const bad=st>=0?A.rows.filter(r=>verdict(r[st])==='bad').map(name):[], warn=st>=0?A.rows.filter(r=>verdict(r[st])==='warn').map(name):[];
  const nice=h=>h.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());
  const cell=(v,i)=>{ if(i!==st) return `<td style="text-align:left">${esc(v)}</td>`; const k=verdict(v); return `<td style="text-align:left" data-sort="${k==='bad'?0:k==='warn'?1:2}${esc(v)}"><span class="hl ${k||'warn'}">${esc(v||'-')}</span></td>`; };
  const html=`<h3 class="st">API health <small>From the pipeline\u2019s Dashboard Status tab: whether each API call succeeded</small></h3>
    <div class="kg">${kc({l:'API calls checked',v:full(A.rows.length),p:'',c:'var(--brand)'})}${st>=0?kc({l:'Succeeded',v:full(A.rows.length-bad.length-warn.length),p:'',c:'var(--good)'})+kc({l:'Failed',v:full(bad.length),p:'',c:'var(--bad)',n:bad.length?esc(bad.slice(0,4).join(', '))+(bad.length>4?` and ${bad.length-4} more`:''):'None.'})+(warn.length?kc({l:'Other status',v:full(warn.length),p:'',c:'var(--gold)',n:esc(warn.slice(0,4).join(', '))}):''):''}</div>
    <div class="card" style="margin-top:16px"><h4>Every API call</h4><p class="cs">As the pipeline recorded it. Click a column heading to sort.</p><div class="tw ctyt" style="box-shadow:none"><table style="min-width:0"><thead><tr>${hdr.map(h=>`<th style="text-align:left">${esc(nice(h))}</th>`).join('')}</tr></thead><tbody>
      ${A.rows.map(r=>`<tr>${r.map(cell).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  return {html,bad,warn,total:A.rows.length,col:st}; }

/* ---------- follower growth: the total at the end of the chosen dates against 1, 2, 3, 6 and 12 months earlier ---------- */
const GROWTH_STEPS=[[1,'1 month'],[2,'2 months'],[3,'3 months'],[6,'6 months'],[12,'1 year']];
/* the latest total on or before a day, if it is no more than a week older */
function valueOn(rows,k,d,tol=7){ for(let i=rows.length-1;i>=0;i--){ const r=rows[i]; if(r.d<=d&&has(r[k])) return dayDiff(r.d,d)<=tol?{d:r.d,v:r[k]}:null; } return null; }
function monthsBack(d,m){ const t=new Date(d+'T00:00:00Z'), day=t.getUTCDate(); t.setUTCDate(1); t.setUTCMonth(t.getUTCMonth()-m);
  const last=new Date(Date.UTC(t.getUTCFullYear(),t.getUTCMonth()+1,0)).getUTCDate(); t.setUTCDate(Math.min(day,last)); return t.toISOString().slice(0,10); }
function growth(rows,k,end){ rows=(rows||[]).filter(r=>has(r[k])); if(!rows.length||!end) return null; const now=valueOn(rows,k,end); if(!now) return null;
  return {now,steps:GROWTH_STEPS.map(([m,l])=>{ const then=valueOn(rows,k,monthsBack(now.d,m)); return {m,l,then,ch:then?now.v-then.v:null,pc:then&&then.v?(now.v-then.v)/then.v*100:null}; })}; }
function growthCard(rows,k,title,unit){ const g=growth(rows,k,W&&W.end); if(!g||!g.steps.some(x=>x.then)) return '';
  return `<div class="card" style="margin-top:16px"><h4>${title}</h4><p class="cs">${full(g.now.v)} ${unit} on ${dS(g.now.d)}, against the same day in earlier months. Click a column heading to sort.</p>
    <div class="tw" style="box-shadow:none"><table style="min-width:0"><thead><tr><th style="text-align:left">Compared with</th><th>${unit[0].toUpperCase()+unit.slice(1)} then</th><th>Change</th><th>Growth</th></tr></thead><tbody>
    ${g.steps.filter(x=>x.then).map(x=>`<tr><td style="text-align:left" data-sort="${x.m}">${x.l} earlier, ${dS(x.then.d)}</td><td>${full(x.then.v)}</td><td><b>${sgn(x.ch)}</b></td><td><span class="pill ${x.ch>=0?'up':'down'}">${x.pc>=0?'+':''}${x.pc.toFixed(1)}%</span></td></tr>`).join('')}</tbody></table></div></div>`; }
/* a running total from known totals and each day's net change (used for YouTube subscribers: daily gained and lost, plus snapshots) */
function fillSeries(known,net){ const ks=Object.keys(known), ns=Object.keys(net); if(!ks.length) return [];
  const all=[...ks,...ns].sort(), ds=days(all[0],all[all.length-1]), tot=ds.map(d=>has(known[d])?known[d]:null);
  for(let i=1;i<ds.length;i++) if(tot[i]===null&&tot[i-1]!==null&&has(net[ds[i]])) tot[i]=tot[i-1]+net[ds[i]];
  for(let i=ds.length-2;i>=0;i--) if(tot[i]===null&&tot[i+1]!==null&&has(net[ds[i+1]])) tot[i]=tot[i+1]-net[ds[i+1]];
  return ds.map((d,i)=>({d,ft:tot[i]})); }
function ctyTable(){ const a=ctyRanked(D.appleCty), g=ctyRanked(D.playCty), m={};
  a.list.forEach(x=>{ (m[x.c]=m[x.c]||{a:0,g:0}).a=x.v; }); g.list.forEach(x=>{ (m[x.c]=m[x.c]||{a:0,g:0}).g=x.v; });
  const rows=Object.entries(m).map(([c,o])=>({c,a:o.a,g:o.g,t:o.a+o.g})).filter(r=>r.t>0).sort((x,y)=>y.t-x.t), tot=rows.reduce((s,r)=>s+r.t,0);
  if(!rows.length) return '';
  return `<div class="card" style="margin-top:16px"><h4>Installs by country</h4><p class="cs">All ${rows.length} countries for these dates. Click a column heading to sort.</p>
    <div class="tw ctyt" style="box-shadow:none"><table style="min-width:0"><thead><tr><th style="text-align:left">Country</th><th>App Store downloads</th><th>Google Play installs</th><th>Total</th><th>Share</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td style="text-align:left" data-sort="${esc(ctyName(r.c))}">${flagEmoji(r.c)} ${esc(ctyName(r.c))}</td><td>${full(r.a)}</td><td>${full(r.g)}</td><td><b>${full(r.t)}</b></td><td>${tot?pct(r.t/tot*100,1):'-'}</td></tr>`).join('')}</tbody></table></div></div>`; }
function ctyTiles(o,label,sub,color){
  const {list,total}=ctyRanked(o); if(!list.length) return '';
  const top=list.slice(0,10), mx=top[0].v;
  return `<div class="cty-h"><h4>${label}</h4><small>${sub}: ${full(total)} from ${list.length} countries</small></div>
    <div class="cty-grid">${top.map((x,i)=>`<div class="cty" title="${esc(ctyName(x.c))}: ${full(x.v)}">${rankB(i)}${flagBox(x.c)}<span class="cn">${esc(ctyName(x.c))}</span>
      <div class="cv">${full(x.v)}</div><div class="cs2">${pct(x.v/total*100,1)} of the total</div><div class="cbar"><i style="width:${Math.max(3,x.v/mx*100)}%;background:linear-gradient(90deg,${hexA(color,.55)},${color})"></i></div></div>`).join('')}</div>`;
}



/* ---------- connection panel: what the dashboard is reading, in plain words ---------- */
function connectionPanel(){
  /* the live settings are created after the first draw, so read them carefully */
  let dataUrl='', liveV=null; try{ dataUrl=DATA_URL; liveV=LIVE.v; }catch(e){}
  const mode=dataUrl?'Cloudflare Worker':FILE_URL?'File link':LOCAL.kind==='sample'?'Sample workbook':LOCAL.kind==='file'?`File on this computer${LOCAL.handle?' (re-read when it changes)':''}`:'None yet';
  const lastOf=(rs,k)=>{ for(let i=(rs||[]).length-1;i>=0;i--) if(has(rs[i][k])) return rs[i]; return null; };
  const probes=[...(((D.extra&&D.extra.tabs)||[]).map(t=>{ const c=t.numeric.find(x=>/^(views|impressions|plays|play_count|reach)$/i.test(x))||t.earnCol||t.numeric[0]; return c?[t.name+' (new)',t.name,c,t.dates.map((d,i)=>({d,v:t.daily[c][i]})).filter(r=>r.v!==null),'v',t.earnCol===c?(v=>usd(v)):undefined]:null; }).filter(Boolean)),['X followers','X','follower_count',D.xAcct||[],'f'],['TikTok followers','TikTok','follower_count',D.ttAcct||[],'f'],['AdSense earnings','AdSense','estimated_earnings',D.adsense||[],'e',v=>usd(v)],['AdMob earnings','AdMob','estimated_earnings',D.admob||[],'e',v=>usd(v)],['Website visits','GA4','sessions',D.web,'s'],['Facebook views','Meta Organic','page_media_view',D.fb,'v'],['YouTube views','YouTube Daily','views',D.yt,'v'],
    ['Instagram reach','Instagram','reach',D.ig,'r'],['Google Play installs','Play Installs','daily_device_installs',D.play,'i'],['Apple downloads','App Store Sales','units',D.apple,'dl']];
  const tm=t=>t?new Date(t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'-';
  const state=SRC.live?`<span class="chip" style="color:var(--good);border-color:rgba(108,194,135,.4)">Reading the Excel</span>`:`<span class="chip need">Showing built-in figures</span>`;
  return `<div class="card" style="margin-bottom:18px"><h4>Live connection</h4><p class="cs">What this dashboard is reading right now.</p>
    <div class="tw" style="box-shadow:none"><table style="min-width:0"><tbody>
      <tr><td>Status</td><td>${state}</td></tr>
      <tr><td>Data link</td><td>${mode}${dataUrl?` <span class="note" style="margin:0">${esc(dataUrl)}</span>`:FILE_URL?` <span class="note" style="margin:0">${esc(FILE_URL)}</span>`:LOCAL.name&&LOCAL.kind==='file'?` <span class="note" style="margin:0">${esc(LOCAL.name)}</span>`:''}</td></tr>
      <tr><td>Last read the Excel</td><td>${tm(SRC.readAt)}</td></tr>
      <tr><td>Last checked for changes</td><td>${tm(SRC.checkedAt)}</td></tr>
      <tr><td>Excel file received</td><td>${SRC.bytes?`${(SRC.bytes/1048576).toFixed(2)} MB in ${SRC.dlSecs.toFixed(1)}s, read in ${has(SRC.readSecs)?SRC.readSecs.toFixed(1)+'s':'-'}`:'-'}</td></tr>
      <tr><td>Excel version</td><td>${liveV?esc(String(liveV).slice(0,12)):'-'}</td></tr>
      ${SRC.hold?`<tr><td>Waiting</td><td style="color:var(--watch);white-space:normal">${esc(SRC.hold)}</td></tr>`:''}
      ${SRC.lastError?`<tr><td>Last problem</td><td style="color:var(--bad);white-space:normal">${esc(SRC.lastError)} (${tm(SRC.errorAt)})</td></tr>`:''}
    </tbody></table></div>
    <h4 style="margin-top:16px">Latest day in each sheet, as read</h4><p class="cs">Change one of these in the Excel, press Read the Excel now, and it changes here.</p>
    <div class="tw" style="box-shadow:none"><table style="min-width:0"><thead><tr><th>Figure</th><th>Sheet and column</th><th>Day</th><th>Value</th></tr></thead><tbody>
      ${probes.map(([l,sh,c,rs,k,f])=>{ const r=lastOf(rs,k); return `<tr><td>${l}</td><td>${sh}, ${c}</td><td>${r?dL(r.d):'-'}</td><td><b>${r?(f||full)(r[k]):'-'}</b></td></tr>`; }).join('')}
    </tbody></table></div>
    ${(()=>{ const A=D.adAudit; if(!A||(!A.adsense&&!A.admob)) return '';
      const money=v=>CURSYM+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:6});
      const cnt=v=>Number(v||0).toLocaleString('en-US');
      const rowsLine=(a,kept,name)=>a?(a.rows===kept?`Every row in the ${name} tab is counted once, so your sheet's column totals should match exactly.`:`${cnt(a.rows-kept)} ${a.rows-kept===1?'row':'rows'} in the ${name} tab ${a.rows-kept===1?'is a repeat':'are repeats'} of a row already there. The dashboard counts only the latest version of each, so the sheet's own total will be higher than the dashboard's by those repeats.`):'';
      const line=(tab,letter,colName,sheet,dash,f)=>`<tr><td>${tab}</td><td><b>${letter}</b> ${colName}</td><td>${f(sheet)}</td><td><b>${f(dash)}</b></td><td>${Math.abs((sheet||0)-(dash||0))<1e-6?'<span style="color:var(--good)">matches</span>':'<span style="color:var(--watch)">repeats removed</span>'}</td></tr>`;
      const rowsA=[]; const s1=A.adsense, s2=A.admob, ADM=D.admob||[];
      if(s1) rowsA.push(line('AdSense','G','estimated_earnings',s1.sums.estimated_earnings,sum(D.adsense||[],'e'),money));
      if(s2){ rowsA.push(line('AdMob','K','estimated_earnings',s2.sums.estimated_earnings,sum(ADM,'e'),money));
        rowsA.push(line('AdMob','L','impressions',s2.sums.impressions,sum(ADM,'im'),cnt));
        rowsA.push(line('AdMob','I','ad_requests',s2.sums.ad_requests,sum(ADM,'rq'),cnt));
        rowsA.push(line('AdMob','J','clicks',s2.sums.clicks,sum(ADM,'cl'),cnt)); }
      return `<h4 style="margin-top:16px">Check the ad figures against the sheet</h4>
        <p class="cs">In the Google Sheet, open the tab and click the column letter. Google shows the <b>Sum</b> at the bottom right. It should equal "Sheet total" here. These are all-time totals.</p>
        <div class="tw" style="box-shadow:none"><table style="min-width:0"><thead><tr><th>Tab</th><th>Column</th><th>Sheet total</th><th>Dashboard uses</th><th></th></tr></thead><tbody>${rowsA.join('')}</tbody></table></div>
        <p class="note">${[rowsLine(s1,A.adsenseKept,'AdSense'),rowsLine(s2,A.admobKept,'AdMob')].filter(Boolean).join(' ')}</p>`; })()}
    <div class="actions"><button type="button" class="btn" id="readnow">Read the Excel now</button></div></div>`;
}

/* ================= pages ================= */
const NAV=[
  ['Summary',[['summary','Executive summary','var(--gold)'],['actions','Action plan','var(--bad)'],['funnels','Funnels','var(--gold)']]],
  ['Audience',[['social','Social overview','var(--brand)'],['facebook','Facebook','var(--fb)'],['instagram','Instagram','var(--ig)'],['youtube','YouTube','var(--yt)'],['tiktok','TikTok','var(--tt)'],['x','X','var(--x)']]],
  ['Acquisition',[['website','Website','var(--web)'],['ads','Paid ads','var(--ads)'],['installs','App installs','var(--play)']]],
  ['Revenue',[['subs','Subscribers and revenue','var(--gold)'],['adrev','Ad revenue','var(--gold)']]],
  ['Health',[['stability','App stability','var(--bad)'],['data','Data coverage','var(--ink-3)'],['updates','Updates','var(--ink-3)'],['connect','Connect data','var(--ink-3)']]]
];
const exSlug=n=>'ex-'+String(n).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
/* a new social platform found in the sheet gets its own page under Audience */
/* pages for platforms with no data in the workbook are left out (config.js: pages.hideEmpty), and so is any page in pages.hide */
const PG=BR.pages||{}, HIDE=new Set((PG.hide||[]).map(String)), LOCK=new Set(['summary','actions','connect']), ALWAYS=new Set(['summary','actions','data','updates','connect']);
const nz=v=>Array.isArray(v)?v.length>0:!!v&&typeof v==='object'&&Object.values(v).some(nz);
const PAGE_DATA={funnels:['web','play','apple','aInst','pSubs','aSubs','traffic'],social:['fb','ig','yt','xAcct','ttAcct','igPosts','fbPosts','ytVideos','ttVideos','xPosts'],facebook:['fb','fbPosts'],
  instagram:['ig','igPosts','igAcct','igFH','igFS'],youtube:['yt','ytVideos','ytReach','ytSnap'],tiktok:['ttAcct','ttVideos'],x:['xAcct','xPosts'],website:['web','webCh'],ads:['ads'],
  installs:['play','apple','aInst','appleDel','playCty','traffic'],subs:['pSubs','aSubs','aEv','earn','apple'],adrev:['adsense','admob'],stability:['qual']};
function pageHasData(id){ const ks=PAGE_DATA[id]; return !ks||ks.some(k=>nz(D[k])); }
const showPage=id=>LOCK.has(id)||(!HIDE.has(id)&&(ALWAYS.has(id)||PG.hideEmpty===false||pageHasData(id)));
function navGroups(){ const ex=((D.extra&&D.extra.tabs)||[]).filter(t=>t.kind==='social');
  return NAV.map(([g,items])=>[g,(g==='Audience'?[...items,...ex.map(t=>[exSlug(t.name),t.name,'#8A8A90'])]:items).filter(it=>showPage(it[0]))]).filter(([,items])=>items.length); }
let PAGES=NAV.flatMap(g=>g[1]);
/* declared up front: the first drawing of the page uses them */
/* an Instagram post's interactions: Instagram's own total when the sheet has it, otherwise likes, comments, saves and shares */
const igI=p=>typeof p.ti==='number'?p.ti:(p.l||0)+(p.cm||0)+(p.sv||0)+(p.sh||0);
const VISIT={diff:null,since:null}, AUD={render:[],result:null,at:null};
/* Instagram's live follower count, remembered on this device */
const IGL={ get(){ try{ return JSON.parse(localStorage.getItem('dash-ig')||'null'); }catch(e){ return null; } }, set(v){ try{ localStorage.setItem('dash-ig',JSON.stringify(v)); }catch(e){} } };

/* ================= password protection (only in the password-protected build) =================
   Nothing is drawn until this browser has signed in. The password is checked by the Worker, never here;
   the browser only keeps the sign-in token the Worker issues, and the last figures it read. */
const LOCKED=!!window.ATR_LOCKED;
const AUTH={ get(){ try{ const a=JSON.parse(localStorage.getItem('dash-auth')||'null'); return a&&a.token&&a.expires>Date.now()?a:null; }catch(e){ return null; } },
  token(){ const a=AUTH.get(); return a?a.token:null; }, set(a){ try{ localStorage.setItem('dash-auth',JSON.stringify(a)); }catch(e){} }, clear(){ try{ localStorage.removeItem('dash-auth'); }catch(e){} } };
const CACHE={db:null};
function idb(){ return new Promise((res,rej)=>{ if(CACHE.db) return res(CACHE.db); if(!window.indexedDB) return rej(new Error('no storage')); const r=indexedDB.open('dash-dashboard',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('kv'); r.onsuccess=()=>{ CACHE.db=r.result; res(r.result); }; r.onerror=()=>rej(r.error); }); }
async function cachePut(){ if(DATA_CFG.cache===false) return; try{ const db=await idb(); await new Promise((res,rej)=>{ const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').put({t:Date.now(),v:LIVE.v,d:D,src:srcKey(),name:LOCAL.name||'',kind:LOCAL.kind||null,cur:CUR},'last'); tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); }catch(e){} }
async function cacheGet(){ try{ const db=await idb(); return await new Promise(res=>{ const g=db.transaction('kv','readonly').objectStore('kv').get('last'); g.onsuccess=()=>res(g.result||null); g.onerror=()=>res(null); }); }catch(e){ return null; } }
async function cacheDel(){ try{ const db=await idb(); await new Promise(res=>{ const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').delete('last'); tx.oncomplete=res; tx.onerror=res; }); }catch(e){} }
const LOGO_SRC=()=>LOGO_NOW();

/* ---------- the connection light on the password screen ----------
   green: connected (and the Google Sheet answers); amber: checking, or connected but something needs setting up;
   red: the data link cannot be reached from this site. Each state says exactly why. */
const CONN={state:'checking',text:'Checking the connection to the data link\u2026'};
function paintConn(){ const el=document.getElementById('gateconn'); if(!el) return;
  el.className='gate-conn '+CONN.state;
  el.innerHTML=`<i aria-hidden="true"></i><span>${esc(CONN.text)}</span>${CONN.state!=='checking'?'<button type="button" class="gate-retry" onclick="probeLink()">Check again</button>':''}`; }
async function probeLink(){
  CONN.state='checking'; CONN.text='Checking the connection to the data link\u2026'; paintConn();
  const set=(st,tx)=>{ CONN.state=st; CONN.text=tx; paintConn(); return CONN; };
  if(!DATA_URL) return set('red','No Worker is set up (config.js has no data.workerUrl).');
  let r=null;
  try{ const c=new AbortController(), t=setTimeout(()=>c.abort(),12000); r=await fetch(DATA_URL+'/status',{cache:'no-store',signal:c.signal}); clearTimeout(t); }catch(e){ r=null; }
  if(!r){ let alive=false; try{ await fetch(DATA_URL+'/status',{mode:'no-cors',cache:'no-store'}); alive=true; }catch(e){}
    return set('red',alive?`The data link is online but won't talk to this site (${location.origin}). Check that the Worker runs cloudflare-worker.js and that its DASHBOARD_SITES setting includes this address.`
      :'The data link cannot be reached. It may be offline, or blocked by an ad blocker, antivirus or network filter.'); }
  let j=null; try{ j=await r.json(); }catch(e){}
  if(r.status===403) return set('red',`The data link refused this site (${location.origin}). Add this address to the Worker's DASHBOARD_SITES setting.`);
  if(!j||!j.passwordLink) return set('amber','Connected, but the Worker is running different code. Paste cloudflare-worker.js into the Worker and press Deploy.');
  if(!j.passwordSet) return set('amber','Connected, but no password is set up. Add the DASHBOARD_PASSWORD secret in the Worker settings, or set data.password to false in config.js.');
  if(j.sheet&&j.sheet.ok===false) return set('amber',`Connected, but the Google Sheet did not answer (${String(j.sheet.note||'no reason given').replace(/\.$/,'')}). You can still sign in.`);
  return set('green',j.sheet&&j.sheet.ok?'Connected to the data link and the Google Sheet.':'Connected to the data link.');
}
function showGate(kind,msg){ const g=document.getElementById('gate'); if(!g) return; document.body.classList.add('gated');
  g.innerHTML=kind==='lock'?`<form class="gate-card" id="gateform" autocomplete="on">
      <img class="gate-logo" src="${LOGO_SRC()}" alt=""><h1>${esc(BRAND)}</h1><p>${esc(TAGLINE)}. Enter the password to open it.</p>
      <div class="gate-conn checking" id="gateconn" role="status" aria-live="polite"></div>
      <label class="gate-l" for="gatepw">Password</label>
      <input id="gatepw" name="password" type="password" autocomplete="current-password" required autofocus>
      <div class="gate-err" id="gateerr" role="alert">${msg?esc(msg):''}</div>
      <button type="submit" class="gate-b" id="gatebtn">Open dashboard</button>
      <p class="gate-s">This browser stays signed in for 30 days. Use Lock in the top bar to sign out.</p></form>`
    :kind==='welcome'?welcomeCard(msg)
    :`<div class="gate-card"><img class="gate-logo" src="${LOGO_SRC()}" alt=""><h1>Opening the dashboard</h1><p>${msg?esc(msg):'Reading the latest figures from the reporting sheet. The first time on this device takes about 20 seconds.'}</p><div class="gate-bar"><i></i></div></div>`;
  g.hidden=false; const pw=document.getElementById('gatepw'); if(pw){ setTimeout(()=>pw.focus(),30); paintConn(); setTimeout(probeLink,0); } }   /* checked once the whole script has loaded */
function welcomeCard(msg){ const can=DATA_CFG.allowOpenFile!==false, smp=DATA_CFG.sample;
  return `<div class="gate-card wel"><img class="gate-logo" src="${LOGO_NOW()}" alt=""><h1>${esc(BRAND)}</h1>
    <p>Connect your data to see the dashboard and its action plan. Everything comes from one Excel workbook with a tab for each platform.</p>
    <div class="wel-b">${can?'<button type="button" class="gate-b" data-conn="open">Open an Excel file</button>':''}${smp?'<button type="button" class="gate-b alt" data-conn="sample">Try the sample data</button>':''}</div>
    ${can?'<p class="gate-s">Or drop an .xlsx file anywhere on this page. It is read in your browser and never uploaded.</p>':''}
    <div class="gate-err" role="alert">${msg?esc(msg):''}</div>
    <details class="wel-more"><summary>Other ways to connect</summary><p>To keep it live without opening a file, set <code>workerUrl</code> (a private Google Sheet through a Cloudflare Worker) or <code>fileUrl</code> (a link to an .xlsx file) in config.js. README.md walks through each.</p>
      <p><a href="dashboard-template.xlsx" download>Download the blank template</a>: every tab, every column, and the API that fills it.</p></details>
    ${BR.allowPersonalize===false?'':`<button type="button" class="wel-pz" data-pz="open"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 2.4l3 3-6.9 6.9-3.6.6.6-3.6z"/><path d="M9.1 3.9l3 3"/></svg>Make it yours: add your logo, colours and name</button>`}</div>`; }
function hideGate(){ const g=document.getElementById('gate'); if(g){ g.hidden=true; g.innerHTML=''; } document.body.classList.remove('gated'); }
document.addEventListener('submit',async e=>{ if(!e.target||e.target.id!=='gateform') return; e.preventDefault();
  const pw=document.getElementById('gatepw').value, btn=document.getElementById('gatebtn'), err=document.getElementById('gateerr');
  btn.disabled=true; btn.textContent='Checking\u2026'; err.textContent='';
  try{ const r=await fetch(DATA_URL+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw}),cache:'no-store'});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||!j.token){ err.textContent=j.error||'That password isn\u2019t right.'; btn.disabled=false; btn.textContent='Open dashboard'; document.getElementById('gatepw').select(); return; }
    AUTH.set({token:j.token,expires:j.expires}); showGate('loading'); LIVE.first=true; checkLive(true); }
  catch(x){ btn.disabled=false; btn.textContent='Open dashboard'; const c=await probeLink(); err.textContent=c.state==='green'?'The sign-in did not get through. Try again.':'Could not sign in: see the light above for the reason.'; } });
async function lockNow(){ AUTH.clear(); await cacheDel(); try{ localStorage.removeItem('dash-ig'); }catch(e){} try{ sessionStorage.clear(); }catch(e){} location.reload(); }
async function startApp(){
  if(LOCKED&&!AUTH.token()){ let m=''; try{ m=sessionStorage.getItem('dash-gate-msg')||''; sessionStorage.removeItem('dash-gate-msg'); }catch(x){} showGate('lock',m); return; }
  if(!DATA_URL&&!FILE_URL){ try{ const h=await kvGet('handle'); if(h&&h.getFile){ LOCAL.handle=h; LOCAL.name=h.name; LOCAL.kind='file'; } }catch(e){} }
  const c=await cacheGet();
  if(c&&c.d&&(c.src||'')===srcKey()){ Object.keys(c.d).forEach(k=>{ D[k]=c.d[k]; }); LIVE.v=c.v||null; SRC.at=c.t; if(c.name&&!LOCAL.name) LOCAL.name=c.name; if(c.kind&&!LOCAL.kind) LOCAL.kind=c.kind;
    SRC.note=`${c.src==='local'?(LOCAL.name?`${LOCAL.name}, saved`:'Saved'):'Saved'} on this device ${new Date(c.t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}`;
    hideGate(); render(); show(PAGE,{keepScroll:true}); paintFresh(); LIVE.first=false; if(LOCAL.handle) checkLiveLocal(false);
    /* the currency changed since this copy was saved: read the workbook again so Apple proceeds are converted to it */
    else if((c.cur||'USD')!==CUR){ LIVE.v=null; if(DATA_URL||FILE_URL) setTimeout(()=>checkLive(false),50); else if(c.kind==='sample') setTimeout(openSample,50); } }
  else if(DATA_URL||FILE_URL) showGate('loading');
  else showGate('welcome',LOCAL.handle?`Open ${LOCAL.name} again to carry on where you left off.`:'');
}

/* every tab by a plain name, and the tabs whose freshness stands for each area */
const TAB_NAME={'Meta Organic':'Facebook','Facebook Page Activity':'Facebook','Facebook Posts':'Facebook posts','Facebook Stories':'Facebook stories',
  'Instagram':'Instagram','Instagram Posts':'Instagram posts','Instagram Account Activity':'Instagram account figures','Instagram Stories':'Instagram stories',
  'YouTube Daily':'YouTube','YouTube':'YouTube channel totals','YouTube Videos':'YouTube videos','YouTube Video Daily':'YouTube daily video figures','YouTube Reach':'YouTube thumbnail impressions','YouTube Shorts':'YouTube Shorts',
  'GA4':'Website','GA4 Channels':'Website traffic sources','Play Installs':'Google Play installs','Play Subscriptions':'Google Play subscriptions','Play Earnings':'Google Play revenue',
  'Play Traffic Source':'Google Play store listing','Play_Quality_History':'App stability','App Store Sales':'App Store downloads and revenue','App Store Installs':'App Store installs',
  'App Store Subscriptions':'App Store subscriptions','App Store Subscription Events':'App Store subscription events','App Store Deletions':'Apple uninstalls','Meta':'Meta ads','AdMob':'AdMob','AdSense':'AdSense','X':'X','TikTok':'TikTok'};
const tabName=t=>TAB_NAME[t.canon||t.name]||TAB_NAME[t.name]||t.name;
const AREA_CORE=[['Facebook',['Meta Organic','Facebook Page Activity']],['Instagram',['Instagram']],['YouTube',['YouTube Daily']],['the website',['GA4']],['Google Play',['Play Installs']],['the App Store',['App Store Sales']],['X',['X']],['TikTok',['TikTok']],['ad revenue',['AdMob','AdSense']]];
const join2g=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
function staleAreas(TS){ const newest=TS.reduce((a,t)=>t.last&&(!a||t.last>a)?t.last:a,null); if(!newest) return [];
  return AREA_CORE.map(([area,tabs])=>{ const last=TS.filter(t=>tabs.includes(t.canon||t.name)&&t.last).reduce((a,t)=>!a||t.last>a?t.last:a,null); return last&&(Date.parse(newest)-Date.parse(last))>3*864e5?{area,last}:null; }).filter(Boolean); }

/* ================= themes: the gallery, fonts on demand, and the switch ================= */
const THEMES=[
 {id:'midnight',name:'Midnight',d:'The original: calm, dark and focused.',fonts:null,
  pv:{bg:'#0A0A0B',rail:'#070707',card:'#121213',line:'rgba(255,255,255,.1)',ink:'#F2F0EC',ink3:'#8F8C86',acc:'#D9A857',font:'Geist, sans-serif',num:'Geist, sans-serif',head:'Geist, sans-serif'}},
 {id:'broadcast',name:'Broadcast',d:'TV sports graphics: deep navy glass, sharp corners and tall scoreboard figures.',fonts:'Saira:wght@400;500;600&family=Teko:wght@500;600',
  pv:{bg:'radial-gradient(160px 90px at 95% -20%,rgba(53,224,255,.35),transparent 65%),radial-gradient(160px 110px at -10% 120%,rgba(130,80,255,.4),transparent 65%),repeating-linear-gradient(135deg,rgba(255,255,255,.04) 0 1px,transparent 1px 6px),linear-gradient(160deg,#0B1B4E,#020613)',
      rail:'rgba(3,8,24,.8)',card:'rgba(11,23,52,.7)',line:'rgba(120,170,255,.25)',ink:'#F1F6FF',ink3:'#93A6CC',acc:'#35E0FF',font:'Saira, sans-serif',num:'Teko, sans-serif',head:'Teko, sans-serif',numW:500,numSize:22,cut:true}},
 {id:'programme',name:'Programme',d:'A printed programme: white paper, navy ink, red stripes and bold condensed type.',fonts:'Archivo:wdth,wght@62..125,400..900',light:true,
  pv:{bg:'radial-gradient(rgba(14,25,56,.12) .8px,transparent 1px) 0 0/7px 7px,#F2F3F6',rail:'#0E1938',card:'#FFFFFF',line:'rgba(14,25,56,.18)',ink:'#0E1938',ink3:'#56608A',acc:'#D7263D',font:'Archivo, sans-serif',num:'Archivo, sans-serif',head:'Archivo, sans-serif',numW:800,stretch:'78%',shadow:'3px 3px 0 rgba(14,25,56,.08)',stripe:true}},
 {id:'daylight',name:'Daylight',d:'Bright and calm, for daytime screens, projectors and printing.',fonts:'Instrument+Sans:wght@400;500;600;700',light:true,
  pv:{bg:'radial-gradient(160px 80px at 100% -10%,rgba(168,116,27,.1),transparent 60%),#EDF0F4',rail:'#FFFFFF',card:'#FFFFFF',line:'rgba(20,28,45,.1)',ink:'#141821',ink3:'#657085',acc:'#A8741B',font:"'Instrument Sans', sans-serif",num:"'Instrument Sans', sans-serif",head:"'Instrument Sans', sans-serif",shadow:'0 6px 14px -8px rgba(20,28,45,.25)'}}];
const THEME_IDS=THEMES.map(t=>t.id);
function themeChoice(){ try{ return localStorage.getItem('dash-theme')||BR.theme||'midnight'; }catch(e){ return BR.theme||'midnight'; } }
const mq=q=>{ try{ return window.matchMedia?window.matchMedia(q):null; }catch(e){ return null; } };
function resolveTheme(id){ if(id==='auto'){ const m=mq('(prefers-color-scheme: light)'); return m&&m.matches?'daylight':'midnight'; } return THEME_IDS.includes(id)?id:'midnight'; }
function themeIsLight(){ const t=THEMES.find(x=>x.id===document.documentElement.getAttribute('data-theme')); return !!(t&&t.light); }
/* platform colours that are too pale on white paper get a deeper shade on light themes */
const PALE=[['#B9B9C0','#474C5B'],['#5CC8D6','#0C97AC'],['#A7B0BC','#687384'],['#8A8A90','#646A76']];
const THEME_SWAP={broadcast:[['#D9A857','#1F9BD8']],programme:[['#D9A857','#D7263D'],...PALE],daylight:[['#D9A857','#B07D22'],...PALE]};
const rgbOf=h=>{ const n=parseInt(h.slice(1),16); return [n>>16&255,n>>8&255,n&255].join(','); };
function themeSwap(html){ const list=THEME_SWAP[document.documentElement.getAttribute('data-theme')]; if(!list) return html;
  let out=String(html); list.forEach(([a,b])=>{ out=out.replace(new RegExp(a,'gi'),b).split('rgba('+rgbOf(a)+',').join('rgba('+rgbOf(b)+','); }); return out; }
function ensureFonts(t){ return new Promise(res=>{ if(!t||!t.fonts) return res(); if(document.getElementById('font-'+t.id)) return res();
  const l=document.createElement('link'); l.rel='stylesheet'; l.id='font-'+t.id; l.href='https://fonts.googleapis.com/css2?family='+t.fonts+'&display=swap';
  l.onload=()=>{ (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>res()); }; l.onerror=()=>res(); document.head.appendChild(l); setTimeout(res,1500); }); }
function themePreview(t){ const p=t.pv, bars=[62,78,54,92,70,48,84], cols=['#5B8DEF','#D66BA0','#E5654F','#5CC8D6','#B9B9C0','#5B8DEF','#D66BA0'];
  const numStyle=`font-family:${p.num};font-weight:${p.numW||700};${p.stretch?`font-stretch:${p.stretch};`:''}${p.numSize?`font-size:${p.numSize}px;`:''}${p.gilt?'background:linear-gradient(180deg,#FCEBB6,#E4C26C 45%,#A87B2B);-webkit-background-clip:text;background-clip:text;color:transparent;':`color:${p.ink};`}`;
  const tile=(l,v)=>`<span class="thk" style="background:${p.card};border-color:${p.line};${p.shadow?`box-shadow:${p.shadow};`:''}${p.cut?'clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,0 100%);':''}"><small style="color:${p.ink3};font-family:${p.font}">${l}</small><b style="${numStyle}">${v}</b></span>`;
  return `<span class="thv" style="background:${p.bg}">
    <span class="thr" style="background:${p.rail};border-right:1px solid ${p.line}">${['#5B8DEF','#D66BA0','#E5654F','#5CC8D6'].map((c,i)=>`<i style="background:${i===0?p.acc:'rgba(128,128,128,.35)'};width:${[80,64,72,58][i]}%"></i>`).join('')}</span>
    <span class="thm">
      <span class="thh" style="font-family:${p.head};font-weight:${p.numW||700};${p.stretch?`font-stretch:${p.stretch};`:''}color:${p.gilt?'#E4C26C':p.ink}">Social overview</span>
      <span class="thks">${tile('Social views','22.6m')}${tile('Revenue',CURSYM+'178')}</span>
      <span class="thb" style="background:${p.card};border-color:${p.line}">${bars.map((h,i)=>`<i style="height:${h}%;background:${cols[i]}"></i>`).join('')}</span>
    </span>${p.stripe?`<span style="position:absolute;right:-14px;top:0;bottom:0;width:70px;background:linear-gradient(112deg,transparent 0 40%,#D7263D 40% 50%,transparent 50% 55%,#0E1938 55% 62%,transparent 62%);opacity:.9"></span>`:''}
    <span class="thcheck">\u2713</span></span>`; }
function paintThemePicker(){ const pop=document.getElementById('themepop'); if(!pop) return; const choice=themeChoice();
  pop.innerHTML=`<div class="thp-h"><b>Theme</b></div>
    <div class="thg">${THEMES.map(t=>`<button type="button" class="thc" data-theme-id="${t.id}" aria-pressed="${choice===t.id}">${themePreview(t)}<span class="thn"><b>${t.name}</b></span></button>`).join('')}</div>
    <div class="thp-f"><label><input type="checkbox" id="themeauto" ${choice==='auto'?'checked':''}> Match my device</label></div>`; }
async function applyTheme(id,x,y){
  const real=resolveTheme(id), t=THEMES.find(v=>v.id===real);
  await ensureFonts(t);
  const go=()=>{ document.documentElement.setAttribute('data-theme',real); try{ localStorage.setItem('dash-theme',id); }catch(e){} redraw(); paintThemePicker(); };
  const rm=mq('(prefers-reduced-motion: reduce)'), still=!!(rm&&rm.matches);
  if(!document.startViewTransition||still||real===document.documentElement.getAttribute('data-theme')){ go(); return; }
  const cx=x??innerWidth-120, cy=y??40, r=Math.hypot(Math.max(cx,innerWidth-cx),Math.max(cy,innerHeight-cy));
  const vt=document.startViewTransition(go);
  try{ await vt.ready; document.documentElement.animate({clipPath:[`circle(0px at ${cx}px ${cy}px)`,`circle(${r}px at ${cx}px ${cy}px)`]},{duration:760,easing:'cubic-bezier(.22,.8,.2,1)',pseudoElement:'::view-transition-new(root)'}); }catch(e){}
}
function openThemes(open){ const pop=document.getElementById('themepop'), b=document.getElementById('themebtn'); if(!pop||!b) return;
  const show=open===undefined?pop.hidden:open; if(show){ paintThemePicker(); THEMES.forEach(t=>ensureFonts(t)); pop.hidden=false; b.setAttribute('aria-expanded','true'); const cur=pop.querySelector('.thc[aria-pressed="true"]')||pop.querySelector('.thc'); if(cur) cur.focus(); }
  else { pop.hidden=true; b.setAttribute('aria-expanded','false'); } }
document.addEventListener('click',e=>{ const b=e.target.closest('#themebtn'); if(b){ e.preventDefault(); openThemes(); return; }
  const c=e.target.closest('.thc[data-theme-id]'); if(c){ const auto=document.getElementById('themeauto'); if(auto) auto.checked=false; applyTheme(c.dataset.themeId,e.clientX,e.clientY); return; }
  const pop=document.getElementById('themepop'); if(pop&&!pop.hidden&&!e.target.closest('#themepop')) openThemes(false); });
document.addEventListener('change',e=>{ if(e.target&&e.target.id==='themeauto'){ const r=e.target.getBoundingClientRect(); applyTheme(e.target.checked?'auto':resolveTheme('auto'),r.left+8,r.top+8); } });
document.addEventListener('keydown',e=>{ const pop=document.getElementById('themepop');
  if(e.key==='Escape'&&pop&&!pop.hidden){ openThemes(false); document.getElementById('themebtn').focus(); return; }
  if((e.key==='t'||e.key==='T')&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!/input|textarea|select/i.test((e.target&&e.target.tagName)||'')){ e.preventDefault(); openThemes(); }
  if(pop&&!pop.hidden&&/Arrow(Left|Right|Up|Down)/.test(e.key)){ const all=[...pop.querySelectorAll('.thc')], i=all.indexOf(document.activeElement); if(i<0) return; e.preventDefault();
    const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-2,ArrowDown:2}[e.key]; const n=all[Math.max(0,Math.min(all.length-1,i+step))]; if(n) n.focus(); } });
{ const m=mq('(prefers-color-scheme: light)'); if(m&&m.addEventListener) m.addEventListener('change',()=>{ if(themeChoice()==='auto') applyTheme('auto'); }); }

let PAGE=(location.hash||'').slice(1); if(!PAGES.some(p=>p[0]===PAGE)) PAGE='summary';

function render(){
  PAGES=navGroups().flatMap(g=>g[1]); { const h=(location.hash||'').slice(1); if(!PAGES.some(p=>p[0]===PAGE)||(PAGE==='summary'&&h.startsWith('ex-')&&PAGES.some(p=>p[0]===h))) PAGE=PAGES.some(p=>p[0]===h)?h:'summary'; }
  applyRange(); CID=0; for(const k in CH) delete CH[k];
  try{ ACT=actionsData(); }catch(e){ ACT=null; console.warn('Dashboard action plan:',e); }   /* worked out first: the summary links to it */
  const P={};
  const hasPrev=W&&W.ps>=dataBounds().start;
  const noPrev='<p class="note" style="padding:36px 0;text-align:center">There is no earlier period of the same length in the data to compare against.</p>';
  /* ---------- shared stats ---------- */
  const fbV=st(D.fb,'v'), fbE=st(D.fb,'e'), fbPV=st(D.fb,'pv'), fbNF=st(D.fb,'nf'), fbF=level(D.fb,'f'), fbU=st(D.fb,'u');
  /* Instagram's follower total: the sheet's when it has one; otherwise Instagram's live count (through the Worker);
     otherwise the latest total set in config.js. A single total is used only when the dates on screen end within two weeks of it. */
  /* Instagram followers for every day. Known totals come first: Instagram's own daily count (Instagram Follower Snapshots),
     then the daily total in Instagram Follower History. Any day without a known total is worked out from the nearest known
     day and each day's followers gained and lost. Where a snapshot and the history both give a total, the audit compares them. */
  const YTFOL=(()=>{ const S=(D.ytSnap||[]).filter(r=>has(r.subs)), Y=(D.yt||[]).filter(r=>has(r.sg)||has(r.sl)); if(!S.length||!Y.length) return null;
    const net={}, known={}; Y.forEach(r=>net[r.d]=(r.sg||0)-(r.sl||0)); S.forEach(r=>known[r.d]=r.subs); return {rows:fillSeries(known,net)}; })();
  const IGFOL=(()=>{ const H=D.igFH||[], SN=D.igFS||[]; if(!H.length&&!SN.length) return null;
    const net={}, byD={}; H.forEach(r=>{ byD[r.d]=r; net[r.d]=has(r.n)?r.n:((has(r.g)||has(r.l))?(r.g||0)-(r.l||0):null); });
    const known={}, src={}; H.forEach(r=>{ if(has(r.t)){ known[r.d]=r.t; src[r.d]='history'; } }); SN.forEach(x=>{ known[x.d]=x.t; src[x.d]='snapshot'; });
    const M=(window.ATR_MANUAL&&window.ATR_MANUAL.instagramFollowers)||null;
    if(!Object.keys(known).length&&M&&has(M.value)&&M.asOf){ known[M.asOf]=M.value; src[M.asOf]='config'; }
    if(!Object.keys(known).length) return null;
    const allD=[...H.map(r=>r.d),...Object.keys(known)].sort(), ds=days(allD[0],allD[allD.length-1]), tot=new Array(ds.length).fill(null);
    ds.forEach((d,i)=>{ if(has(known[d])) tot[i]=known[d]; });
    for(let i=1;i<ds.length;i++) if(tot[i]===null&&tot[i-1]!==null&&has(net[ds[i]])) tot[i]=tot[i-1]+net[ds[i]];      /* forward from the last known day */
    for(let i=ds.length-2;i>=0;i--) if(tot[i]===null&&tot[i+1]!==null&&has(net[ds[i+1]])) tot[i]=tot[i+1]-net[ds[i+1]]; /* back from the next known day */
    const rows=ds.map((d,i)=>({d,ft:tot[i],g:byD[d]&&has(byD[d].g)?byD[d].g:null,l:byD[d]&&has(byD[d].l)?byD[d].l:null,nt:has(net[d])?net[d]:null}));
    const checks=SN.filter(x=>byD[x.d]&&has(byD[x.d].t)).map(x=>({d:x.d,known:x.t,worked:byD[x.d].t,diff:byD[x.d].t-x.t}));
    /* the history's own totals should move by each day's net change */
    let jumps=0; for(let i=1;i<H.length;i++){ const p=H[i-1],c=H[i]; if(has(p.t)&&has(c.t)&&has(net[c.d])&&dayDiff(p.d,c.d)===1&&c.t-p.t!==net[c.d]) jumps++; }
    return {rows,checks,jumps,snapshots:SN.length,historyDays:H.length}; })();
  let igF=level(D.ig,'ft');
  if(!has(igF.cur)&&IGFOL){ igF=level(IGFOL.rows,'ft'); igF.fromHistory=true; const ld=W?[...IGFOL.rows].reverse().find(r=>r.d<=W.end&&has(r.ft)):null; igF.fromSnap=!!(ld&&(D.igFS||[]).some(x=>x.d===ld.d)); igF.day=ld?ld.d:null; }   /* from the follower history and Instagram's daily count */
  if(!has(igF.cur)){ const L=IGL.get(), M=(window.ATR_MANUAL&&window.ATR_MANUAL.instagramFollowers)||null;
    const src=L&&has(L.v)?{v:L.v,asOf:String(L.at).slice(0,10),live:true}:(M&&has(M.value)&&M.asOf?{v:M.value,asOf:M.asOf,live:false}:null);
    if(src&&W&&Date.parse(W.end)>=Date.parse(src.asOf)-14*864e5) igF={cur:src.v,prev:null,d:null,series:null,asOf:src.asOf,live:src.live}; }   /* shown with its date for any dates ending on or after two weeks before it */
  const igR=st(D.ig,'r'), igNF=IGFOL?st(IGFOL.rows,'g'):st(D.ig,'nf'), igLost=IGFOL?st(IGFOL.rows,'l'):null, igNet=IGFOL?st(IGFOL.rows,'nt'):null;
  const ytV=st(D.yt,'v'), ytM=st(D.yt,'m'), ytL=st(D.yt,'l'), ytC=st(D.yt,'c'), ytS=st(D.yt,'s'), ytSG=st(D.yt,'sg'), ytSL=st(D.yt,'sl');
  const web=['s','u','n','pv','es','cv','rev'].reduce((o,k)=>(o[k]=st(D.web,k),o),{});
  const pl=['i','ui','uu','ue','up'].reduce((o,k)=>(o[k]=st(D.play,k),o),{}); const plAct=level(D.play,'act');
  const ap=['dl','rd','up','sub','rev'].reduce((o,k)=>(o[k]=st(D.apple,k),o),{});
  const pS=level(D.pSubs,'a'), pSn=st(D.pSubs,'n'), pSc=st(D.pSubs,'c'), aS=level(D.aSubs,'s'), aT=level(D.aSubs,'t');
  const fbER=has(fbE.cur)&&fbV.cur?fbE.cur/fbV.cur*100:null, fbERp=has(fbE.prev)&&fbV.prev?fbE.prev/fbV.prev*100:null;
  const fbERd=(has(fbER)&&has(fbERp)&&fbV.pd>=N/2)?fbER-fbERp:null;
  const ytNet=has(ytSG.cur)?(ytSG.cur||0)-(ytSL.cur||0):null;
  const fbNet=(()=>{ const w=fbF.w; if(!w) return null; const bef=D.fb.filter(r=>r.d<w.cs&&has(r.f)); const fi=D.fb.find(r=>r.d>=w.cs&&r.d<=w.end&&has(r.f)); const base=bef.length?bef[bef.length-1].f:(fi?fi.f:null); return has(fbF.cur)&&has(base)?fbF.cur-base:null; })();   /* with no count before these dates, net since the first count in them */
  const lastSnap=D.ytSnap[D.ytSnap.length-1]||{};
  /* Instagram views count once the sheet has them (the Instagram tab's views column) */
  const igVw=st(D.ig,'v'); const igDaily=has(igVw.cur)&&igVw.cd>0;
  const igPV=(a,b)=>(D.igPosts||[]).filter(p=>p.d>=a&&p.d<=b&&!/story/i.test(p.ty||'')).reduce((t,p)=>t+(p.v||0),0);
  const igPostsV=W?igPV(W.cs,W.end):0, igPostsVPrev=W?igPV(W.ps,W.pe):0;
  const igHasViews=igDaily||igPostsV>0, igViewsCur=igDaily?igVw.cur:igPostsV, igViewsD=igDaily?igVw.d:(igPostsVPrev?chg(igPostsV,igPostsVPrev):null);
  const views=(fbV.cur||0)+(ytV.cur||0)+(igHasViews?igViewsCur:0);
  const viewsD=(()=>{ const a=fbV.d; if(!has(a)) return null; const per=(x,k,n)=>x[n]?x[k]/x[n]:0;
    const cw=per(fbV,'cur','cd')+per(ytV,'cur','cd')+(igDaily?per(igVw,'cur','cd'):igPostsV/N), pw=per(fbV,'prev','pd')+per(ytV,'prev','pd')+(igDaily?(igVw.pd?per(igVw,'prev','pd'):0):igPostsVPrev/N);
    return chg(cw,pw); })();
  const followers=(fbF.cur||0)+(lastSnap.subs||0);
  /* paying subscribers: Google Play's active subscriptions plus Apple's standard-price ones. Apple free trials are not paying and are shown separately. */
  const activeSubs=(pS.cur||0)+(aS.cur||0), trialSubs=aT.cur||0;
  const subsPrev=(has(pS.prev)&&has(aS.prev))?(pS.prev+aS.prev):null;
  const installs=(pl.i.cur||0)+(ap.dl.cur||0)+(ap.rd.cur||0);
  const instD=(()=>{ if(!has(pl.i.d)||!has(ap.dl.d)) return pl.i.d; const c=pl.i.cur/pl.i.cd+(ap.dl.cur+ap.rd.cur)/ap.dl.cd, p=pl.i.prev/pl.i.pd+(ap.dl.prev+ap.rd.prev)/ap.dl.pd; return chg(c,p); })();
  const lifeInst=sum(D.play,'i'), lifeUnin=sum(D.play,'ue'), uninRate=lifeInst?lifeUnin/lifeInst*100:null;
  /* Google Play revenue after Google's fee. The sheet has only Google's fee rows, at 15% of each sale (service_fee_pct), so a sale is fee / 0.15 and you keep 85% of it (reader.js stores the net payout the same way when the tab has the whole report). */
  const playRev=(()=>{ const w=win(D.earn); if(!w) return null; const f=sum(inR(D.earn,w.cs,w.end),'fee'); return has(f)?-f/0.15*0.85:null; })();
  const lifeApple=sum(D.apple,'rev'), lifePlay=-sum(D.earn,'fee')/0.15*0.85;   /* both after the stores' fees */
  const q=(()=>{ const w=win(D.qual); if(!w) return {}; const rs=inR(D.qual,w.cs,w.end); let cw=0,aw=0,dw=0,uw=0,ua=0;
    rs.forEach(r=>{ const u=has(r.dau)?r.dau:0; if(has(r.cr)){cw+=r.cr*u;} if(has(r.anr)){aw+=r.anr*u;} if(has(r.ucr)){uw+=r.ucr*u;} if(has(r.uanr)){ua+=r.uanr*u;} dw+=u; });
    return {w,cr:dw?cw/dw*100:null,anr:dw?aw/dw*100:null,ucr:dw?uw/dw*100:null,uanr:dw?ua/dw*100:null,dau:rs.length?dw/rs.length:null}; })();
  /* Google's bad-behaviour limits (1.09% crashes, 0.47% ANRs) apply to the user-perceived rates, so every comparison uses those */
  const q28=(()=>{ const rs=D.qual||[]; if(!rs.length) return {}; const e=rs[rs.length-1].d, st=new Date(Date.parse(e)-27*864e5).toISOString().slice(0,10); let dw=0,uw=0,ua=0,cw=0,aw=0;
    inR(rs,st,e).forEach(r=>{ const u=has(r.dau)?r.dau:0; if(has(r.ucr)) uw+=r.ucr*u; if(has(r.uanr)) ua+=r.uanr*u; if(has(r.cr)) cw+=r.cr*u; if(has(r.anr)) aw+=r.anr*u; dw+=u; });
    return {ucr:dw?uw/dw*100:null,uanr:dw?ua/dw*100:null,cr:dw?cw/dw*100:null,anr:dw?aw/dw*100:null,start:st,end:e}; })();
  const qc=has(q28.ucr)?q28.ucr:q28.cr, qa=has(q28.uanr)?q28.uanr:q28.anr;   /* Google judges the last 28 days, so every comparison with its limits uses those */
  const adsLife={sp:sum(D.ads,'sp'),im:sum(D.ads,'im'),cl:sum(D.ads,'cl'),rc:sum(D.ads,'rc'),lc:sum(D.ads,'lc'),lp:sum(D.ads,'lp'),ai:sum(D.ads,'ai')};
  const adsLast=[...D.ads].reverse().find(r=>(r.sp||0)>0);
  const trW=win(D.traffic); const trCur=trW?inR(D.traffic,trW.cs,trW.end):[];
  const storeVis=trCur.reduce((t,r)=>t+r.vis,0), storeAcq=trCur.reduce((t,r)=>t+r.acq,0);
  const newSubs=(pSn.cur||0)+(()=>{ const w=win(D.aEv); return w?D.aEv.filter(e=>e.d>=w.cs&&e.d<=w.end&&(e.e==='Subscribe'||e.e.startsWith('Paid Subscription from'))).reduce((t,e)=>t+e.q,0):0; })();
  /* ---------- anything new in the sheet: figures that feed the totals ---------- */
  const EX=(D.extra&&D.extra.tabs)||[], EXC=(D.extra&&D.extra.newCols)||[];
  const exSum=(t,c)=>{ if(!W||!t.daily[c]) return null; let s2=0,n=0; t.dates.forEach((d,i)=>{ if(d>=W.cs&&d<=W.end){ const v=t.daily[c][i]; if(v!==null){ s2+=v; n++; } } }); return n?((t.avg||[]).includes(c)?s2/n:s2):null; };
  const exLevel=(t,c)=>{ let v=null,dd=null; if(!t.daily[c]) return {v,d:dd}; t.dates.forEach((d,i)=>{ const x=t.daily[c][i]; if(x!==null&&(!W||d<=W.end)){ v=x; dd=d; } });
    if(v===null){ for(let i=t.dates.length-1;i>=0;i--){ if(t.daily[c][i]!==null){ v=t.daily[c][i]; dd=t.dates[i]; break; } } } return {v,d:dd}; };
  const exMain=t=>t.numeric.find(c=>/^(views|impressions|plays|play_count|video_views|reach)$/i.test(c)&&!t.level.includes(c))||t.earnCol||t.numeric.find(c=>!t.level.includes(c)&&!(t.avg||[]).includes(c))||t.numeric[0];
  const exViewCol=t=>t.numeric.find(c=>/views|impressions|plays|play_count/i.test(c)&&!t.level.includes(c));
  const exSocial=EX.filter(t=>t.social);
  const exFollowers=exSocial.map(t=>{ const fc=t.numeric.find(c=>/follower_count|followers/i.test(c)); return fc?{name:t.name,...exLevel(t,fc)}:null; }).filter(x=>x&&has(x.v));
  const exViews=exSocial.map(t=>{ const c=exViewCol(t); return c?{name:t.name,col:c,v:exSum(t,c)}:null; }).filter(x=>x&&has(x.v));
  const exRev=EX.filter(t=>t.earnCol).map(t=>({name:t.name,v:exSum(t,t.earnCol)||0}));
  const KIND_NAME={platform:'added to its platform\u2019s page',social:'added under Audience',earnings:'added to revenue',website:'on the Website page',app:'on the App installs page',subs:'on the Subscribers page',other:'on Data coverage'};
  const exViewsTot=exViews.reduce((a,x)=>a+x.v,0), exRevTot=exRev.reduce((a,x)=>a+x.v,0), exFolTot=exFollowers.reduce((a,x)=>a+x.v,0);
  /* ---------- ads: AdSense (website) and AdMob (app) ---------- */
  const ADS=D.adsense||[], ADM=D.admob||[];
  const asd=st(ADS,'e'), amE=st(ADM,'e'), amIm=st(ADM,'im'), amRq=st(ADM,'rq'), amCl=st(ADM,'cl');
  const hasAds=ADS.length>0||ADM.length>0;
  const adsRev=(asd.cur||0)+(amE.cur||0), adsPrev=(asd.prev||0)+(amE.prev||0);
  const lifeAds=sum(ADS,'e')+sum(ADM,'e');
  const revWin=(ap.rev.cur||0)+(playRev||0)+adsRev+exRevTot;
  /* X and TikTok, live from the sheet */
  const XP=D.xPosts||[], XA=D.xAcct||[], TA=D.ttAcct||[], TV=D.ttVideos||[];
  const xIn=W?XP.filter(p=>p.d>=W.cs&&p.d<=W.end):[], xPrev=W?XP.filter(p=>p.d>=W.ps&&p.d<=W.pe):[];
  const xTot=(a,k)=>a.reduce((t,p)=>t+(p[k]||0),0);
  const xIm=xTot(xIn,'im'), xE=xTot(xIn,'e'), xImP=xTot(xPrev,'im');
  /* followers are only recorded from the day collection began; if these dates end earlier, show the latest count with its date */
  const latestLevel=(rs,k)=>{ const l=level(rs,k); if(has(l.cur)||!rs.length) return l; const r=rs[rs.length-1]; return {cur:r[k],asOf:r.d,prev:null,d:null}; };
  const xF=latestLevel(XA,'f'), tF=latestLevel(TA,'f');
  const xByDay=(()=>{ const m={}; xIn.forEach(p=>{ m[p.d]=(m[p.d]||0)+p.im; }); return W?days(W.cs,W.end).map(d=>has(m[d])?m[d]:null):[]; })();

  /* ---------- every platform, one set of figures used everywhere (summary, scorecard, social overview, funnels) ---------- */
  const inW=p=>W&&p.d>=W.cs&&p.d<=W.end, inP=p=>W&&p.d>=W.ps&&p.d<=W.pe;
  const igIn=(D.igPosts||[]).filter(p=>inW(p)&&!/story/i.test(p.ty||'')), igInPrev=(D.igPosts||[]).filter(p=>inP(p)&&!/story/i.test(p.ty||''));
  const iSum=(a,k)=>a.reduce((t,p)=>t+(p[k]||0),0), igIntOf=a=>a.reduce((t,p)=>t+igI(p),0);
  const igIntCur=igIntOf(igIn), igIntPrev=igIntOf(igInPrev), ytIntAll=(ytL.cur||0)+(ytC.cur||0)+(ytS.cur||0);
  const levelChange=(rs,k)=>{ const r=W?rs.filter(x=>x.d>=W.cs&&x.d<=W.end&&has(x[k])):[]; if(!r.length) return null; const bef=rs.filter(x=>x.d<W.cs&&has(x[k])); const base=bef.length?bef[bef.length-1][k]:(r.length>1?r[0][k]:null); return has(base)?r[r.length-1][k]-base:null; };
  const ttNet=levelChange(TA,'f'), xNet=levelChange(XA,'f');
  /* ---------- followers on the last day of the chosen dates ----------
     One count per platform, used by the Social overview, its totals and the scorecard, so they always agree.
     When the dates run up to the newest data, it is each platform's latest count (Instagram's live count when that is newer).
     When they end earlier, it is the count on that last day, or the latest one recorded before it; Instagram and YouTube days
     without a count of their own are worked out from each day's gains and losses. A platform not counted yet by then is left out. */
  const folNow=!!W&&W.end>=dataBounds().end;
  const lastOf=(rs,k,end)=>{ rs=rs||[]; for(let i=rs.length-1;i>=0;i--){ const r=rs[i]; if((!end||r.d<=end)&&has(r[k])) return {v:r[k],d:r.d}; } return null; };
  const firstD=(rs,k)=>{ const r=(rs||[]).find(x=>has(x[k])); return r?r.d:null; };
  const fAt=(rs,k)=>lastOf(rs,k,folNow||!W?null:W.end);
  const exFolRows=t=>{ const c=t.numeric.find(x=>/follower_count|followers/i.test(x)); return c&&t.daily[c]?t.dates.map((d,i)=>({d,v:t.daily[c][i]})):[]; };
  const IGM=(window.ATR_MANUAL&&window.ATR_MANUAL.instagramFollowers)||null;
  const FOL=(()=>{ const o={facebook:fAt(D.fb,'f'),tiktok:fAt(TA,'f'),x:fAt(XA,'f')};
    /* Instagram: the sheet's total, the follower history, the live count, or (with nothing else) the total set in config.js */
    const c=[fAt(D.ig,'ft')];
    if(IGFOL){ const b=fAt(IGFOL.rows,'ft'); if(b){ b.est=!(D.igFS||[]).some(x=>x.d===b.d)&&!(D.igFH||[]).some(x=>x.d===b.d&&has(x.t)); c.push(b); } }
    const L=IGL.get(); if(L&&has(L.v)){ const ld=String(L.at).slice(0,10); if(folNow||(W&&ld<=W.end)) c.push({v:L.v,d:ld,live:true,at:L.at}); }
    const ci=c.filter(Boolean); if(!ci.length&&IGM&&has(IGM.value)&&(folNow||(W&&IGM.asOf&&IGM.asOf<=W.end))) ci.push({v:IGM.value,d:IGM.asOf||''});
    ci.sort((a,b)=>String(a.d)===String(b.d)?(a.live?1:0)-(b.live?1:0):String(a.d)<String(b.d)?-1:1); o.instagram=ci.pop()||null;
    /* YouTube: its own subscriber count; on past days without one, worked out from the daily gains and losses */
    const s=fAt(D.ytSnap,'subs'), y=!folNow&&YTFOL?fAt(YTFOL.rows,'ft'):null; o.youtube=y&&(!s||y.d>s.d)?{...y,est:true}:s;
    exSocial.forEach(t=>{ o[exSlug(t.name)]=fAt(exFolRows(t),'v'); });
    return o; })();
  const folV=id=>FOL[id]&&has(FOL[id].v)?FOL[id].v:null;
  /* the first day each platform has a count, for one that wasn't counted yet on the chosen dates */
  const folFirst=id=>{ const m=a=>a.filter(Boolean).sort()[0]||null;
    if(id==='facebook') return firstD(D.fb,'f'); if(id==='tiktok') return firstD(TA,'f'); if(id==='x') return firstD(XA,'f');
    if(id==='instagram'){ const L=IGL.get(); return m([firstD(D.ig,'ft'),IGFOL&&firstD(IGFOL.rows,'ft'),IGM&&has(IGM.value)&&IGM.asOf,L&&has(L.v)&&String(L.at).slice(0,10)]); }
    if(id==='youtube') return m([firstD(D.ytSnap,'subs'),YTFOL&&firstD(YTFOL.rows,'ft')]);
    const t=exSocial.find(t=>exSlug(t.name)===id); return t?firstD(exFolRows(t),'v'):null; };
  const perDay=(sum,n)=>n?sum/n:0;
  const ttIn=TV.filter(v=>v.d&&inW(v)), ttPrevList=TV.filter(v=>v.d&&inP(v));
  const ttV=ttIn.reduce((t,v)=>t+(v.v||0),0), ttVPrev=ttPrevList.reduce((t,v)=>t+(v.v||0),0);
  const ttByDay=W?days(W.cs,W.end).map(d=>{ const x=ttIn.filter(v=>v.d===d); return x.length?x.reduce((t,v)=>t+v.v,0):null; }):[];
  const igPrevViews=igDaily?(igVw.prev||0):igPostsVPrev;
  /* social views: Facebook, YouTube, Instagram and X (X's impressions are what X itself shows as views), plus any new platform */
  const allViews=(views||0)+(xIm||0)+ttV+exViewsTot;
  const allViewsD=(()=>{ if(!has(fbV.d)) return null;
    const cur=perDay(fbV.cur,fbV.cd)+perDay(ytV.cur,ytV.cd)+(igHasViews?(igDaily?perDay(igVw.cur,igVw.cd):igPostsV/N):0)+(xIm||0)/N+ttV/N;
    const prv=perDay(fbV.prev,fbV.pd)+perDay(ytV.prev,ytV.pd)+(igHasViews?(igDaily?perDay(igVw.prev,igVw.pd):igPostsVPrev/N):0)+(xPrev.length?xImP/N:0)+(ttPrevList.length?ttVPrev/N:0);
    return chg(cur,prv); })();
  const allInt=(fbE.cur||0)+ytIntAll+igIntCur+(xE||0);
  const allIntD=(()=>{ const p=(fbE.prev||0)+((ytL.prev||0)+(ytC.prev||0)+(ytS.prev||0))+igIntPrev+(xPrev.length?xTot(xPrev,'e'):0); return p?chg(allInt,p):null; })();
  const viewSplit=[['Facebook',fbV.cur,'#5B8DEF'],['YouTube',ytV.cur,'#E5654F'],['Instagram',igHasViews?igViewsCur:null,'#D66BA0'],['X',xIm||null,'#B9B9C0'],['TikTok',ttV||null,'#5CC8D6'],...exViews.map(x=>[x.name,x.v,'#8A8A90'])].filter(x=>has(x[1])&&x[1]>0);
  const fbShare=allViews?fbV.cur/allViews*100:null;



  /* ---------- ad revenue page ---------- */
  { const usd2=v=>has(v)?CURSYM+Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'-';
    const L=W?days(W.cs,W.end):[];
    const subsRev=(ap.rev.cur||0)+(playRev||0)+exRevTot, allRev=subsRev+adsRev;
    const ecpm=amIm.cur?amE.cur/amIm.cur*1000:null, showRate=amRq.cur?amIm.cur/amRq.cur*100:null, ctr=amIm.cur?(amCl.cur||0)/amIm.cur*100:null;
    const earnBd=byDate(D.earn||[]), playDay=L.map(d=>{ const r=earnBd.get(d); return r&&has(r.fee)?-r.fee/0.15*0.85:null; });
    /* countries and apps from the packed AdMob detail */
    const det=D.admobDetail||{d:[],c:[],a:[],r:[]}; const byC={}, byA={};
    for(let i=0;i<det.r.length;i+=7){ const d=det.d[det.r[i]]; if(!W||d<W.cs||d>W.end) continue;
      const c=det.c[det.r[i+1]], a=det.a[det.r[i+2]], e=det.r[i+3]/1e6, im=det.r[i+4], rq=det.r[i+5], cl=det.r[i+6];
      const oc=byC[c]||(byC[c]={e:0,im:0,rq:0,cl:0}); oc.e+=e; oc.im+=im; oc.rq+=rq; oc.cl+=cl;
      const oa=byA[a]||(byA[a]={e:0,im:0,rq:0,cl:0}); oa.e+=e; oa.im+=im; oa.rq+=rq; oa.cl+=cl; }
    const topC=Object.keys(byC).sort((x,y)=>byC[y].e-byC[x].e).slice(0,10);
    const apps=Object.keys(byA).sort((x,y)=>byA[y].e-byA[x].e);
    const appName=a=>{ const m=String(a).match(/~(\d+)$/); return m?`App ending ${m[1].slice(-4)}`:esc(a); };
    P.adrev=hasAds?`${ph('Ad revenue','Earnings from ads on the website (AdSense) and in the app (AdMob), next to subscription revenue.',rng(W))}
      <div class="kg">
        ${kc({l:'Ad earnings',v:usd2(adsRev),p:pill(chg(adsRev,adsPrev)),c:'var(--gold)',n:`${usd2(lifeAds)} since ads began.`})}
        ${kc({l:'AdSense, website',v:usd2(asd.cur),p:pill(asd.d,{tip:cmpTip(asd,usd2)}),c:'var(--web)',s:asd.series?spark(asd.series,'#3FB5A8'):''})}
        ${kc({l:'AdMob, app',v:usd2(amE.cur),p:pill(amE.d,{tip:cmpTip(amE,usd2)}),c:'var(--gold)',s:amE.series?spark(amE.series,'#D9A857'):''})}
        ${kc({l:'Ads share of all revenue',v:allRev?pct(adsRev/allRev*100,1):'-',p:'',c:'var(--gold)',n:`All revenue in these dates: ${usd2(allRev)}.`})}
        ${kc({l:'AdMob impressions',v:full(amIm.cur),p:pill(amIm.d,{tip:cmpTip(amIm)}),c:'var(--play)',n:`From ${full(amRq.cur)} ad requests.`})}
        ${kc({l:'Earnings per 1,000 impressions',v:has(ecpm)?CURSYM+ecpm.toFixed(2):'-',p:'',c:'var(--play)',tip:'AdMob earnings divided by impressions, times 1,000 (eCPM).'})}
        ${kc({l:'Requests that showed an ad',v:pct(showRate,1),p:'',c:'var(--play)',tip:'AdMob impressions divided by ad requests.'})}
        ${kc({l:'Ad click-through rate',v:pct(ctr,2),p:'',c:'var(--play)',n:`${full(amCl.cur)} clicks.`})}
      </div>
      <div class="card" style="margin-top:16px"><h4>Ad earnings per day</h4><p class="cs">Website and app ads, in ${CURNAME}.</p>
        ${chart({dates:L,series:[{name:'AdSense, website',vals:asd.series||L.map(()=>null),color:'#3FB5A8'},{name:'AdMob, app',vals:amE.series||L.map(()=>null),color:'#D9A857'}],type:'bar',stack:true,peak:false,fmt:v=>CURSYM+(v<10?v.toFixed(2):abbr(v)),aria:'Ad earnings per day'})}</div>
      <div class="card" style="margin-top:16px"><h4>All revenue per day</h4><p class="cs">Subscriptions and ads together, so you can see how much ads add.</p>
        ${chart({dates:L,series:[{name:'Apple proceeds',vals:ap.rev.series||L.map(()=>null),color:'#A7B0BC'},{name:'Google Play',vals:playDay,color:'#8FCB9F'},{name:'AdSense',vals:asd.series||L.map(()=>null),color:'#3FB5A8'},{name:'AdMob',vals:amE.series||L.map(()=>null),color:'#D9A857'}],type:'bar',stack:true,peak:false,fmt:v=>CURSYM+(v<10?v.toFixed(2):abbr(v)),aria:'All revenue per day'})}</div>
      ${topC.length?`<h3 class="st">Where app ad earnings come from <small>AdMob, top ${topC.length} countries</small></h3>
      <div class="tw"><table style="min-width:0"><thead><tr><th style="text-align:left">Country</th><th>Earnings</th><th>Impressions</th><th>Ad requests</th><th>Per 1,000 impressions</th></tr></thead><tbody>
        ${topC.map((c,i)=>{ const o=byC[c]; return `<tr${i===0?' class="top1"':''}><td style="text-align:left"><span style="display:inline-flex;align-items:center;gap:10px">${rankB(i)}<span style="width:26px;height:18px;border-radius:3px;overflow:hidden;display:inline-grid;place-items:center;font-size:15px;background:var(--sunk)">${/^[A-Z]{2}$/.test(c)?`<img src="https://flagcdn.com/w40/${c.toLowerCase()}.png" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.textContent='${flagEmoji(c)}'">`:''}</span>${esc(ctyName(c))}</span></td><td><b>${usd2(o.e)}</b></td><td>${full(o.im)}</td><td>${full(o.rq)}</td><td>${o.im?CURSYM+(o.e/o.im*1000).toFixed(2):'-'}</td></tr>`; }).join('')}
      </tbody></table></div>`:''}
      ${apps.length?`<h3 class="st">App ad earnings by app <small>AdMob</small></h3>
      <div class="tw"><table style="min-width:0"><thead><tr><th style="text-align:left">App</th><th>Earnings</th><th>Impressions</th><th>Ad requests</th><th>Per 1,000 impressions</th></tr></thead><tbody>
        ${apps.map(a=>{ const o=byA[a]; return `<tr><td style="text-align:left"><b>${appName(a)}</b><small style="display:block;color:var(--ink-3)">${esc(a)}</small></td><td><b>${usd2(o.e)}</b></td><td>${full(o.im)}</td><td>${full(o.rq)}</td><td>${o.im?CURSYM+(o.e/o.im*1000).toFixed(2):'-'}</td></tr>`; }).join('')}
      </tbody></table></div>
      <p class="note">AdMob identifies apps by their ID; these are your two apps, most likely iPhone and Android. Earnings are Google's estimates before any final adjustments. AdSense reports earnings only, so impressions, clicks and countries are for app ads.</p>`:''}`
    :`${ph('Ad revenue','Earnings from ads on the website (AdSense) and in the app (AdMob).','')}
      <div class="empty"><h4>Ad data appears here once the live sheet is read</h4><p>The AdSense and AdMob tabs are in the reporting sheet. When the dashboard is live, this page fills in by itself.</p></div>`;
  }



  /* ---------- new data goes where it belongs ---------- */
  const TAB_PAGE={'Meta Organic':'facebook','Facebook Posts':'facebook','Facebook Page Activity':'facebook','Facebook Stories':'facebook','Instagram':'instagram','Instagram Posts':'instagram','Instagram Stories':'instagram','YouTube Video Daily':'youtube','YouTube Reach':'youtube','App Store Deletions':'installs','Instagram Account Activity':'instagram','YouTube Daily':'youtube','YouTube':'youtube','YouTube Videos':'youtube','YouTube Shorts':'youtube',
    'GA4':'website','GA4 Channels':'website','Meta':'ads','Play Installs':'installs','App Store Sales':'installs','App Store Installs':'installs','Play Traffic Source':'installs',
    'Play Subscriptions':'subs','App Store Subscriptions':'subs','App Store Subscription Events':'subs','Play Earnings':'subs','Play_Quality_History':'stability','AdSense':'adrev','AdMob':'adrev','X':'x','TikTok':'tiktok'};
  const routeOf=t=>t.kind==='platform'&&t.platform?t.platform:t.kind==='social'?exSlug(t.name):t.kind==='earnings'?'adrev':t.kind==='website'?'website':t.kind==='app'?'installs':t.kind==='subs'?'subs':'data';
  const PAGE_COLOR={facebook:'#5B8DEF',instagram:'#D66BA0',youtube:'#E5654F',tiktok:'#5CC8D6',x:'#B9B9C0',website:'#3FB5A8',installs:'#5BBF7A',subs:'#D9A857',adrev:'#D9A857',ads:'#9D86E9',stability:'#E07A68'};
  const exBlock=(t,title,sub,tags,col)=>{ const CC=col||'#8A8A90'; const money=v=>has(v)?CURSYM+Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'-';
    const L=W?days(W.cs,W.end):[]; const m=exMain(t);
    const cards=t.numeric.slice(0,8).map(c=>{ const lv=t.level.includes(c); const x=lv?exLevel(t,c):{v:exSum(t,c)};
      const av=(t.avg||[]).includes(c); return kc({l:c.replace(/_/g,' ').replace(/^./,m=>m.toUpperCase()),v:c===t.earnCol?money(x.v):av?(/rate|percent|ctr|completion/i.test(c)&&x.v!==null&&x.v<=1?pct(x.v*100,1):(has(x.v)?Number(x.v).toLocaleString('en-US',{maximumFractionDigits:2}):'-')):full(x.v),p:'',c:CC,n:lv?(x.d?`Latest, on ${dS(x.d)}.`:''):av?'Average in these dates.':'Total in these dates.'}); }).join('');
    const series=m&&t.daily[m]?L.map(d=>{ const i=t.dates.indexOf(d); return i<0?null:t.daily[m][i]; }):[];
    return `<div class="card" style="margin-top:16px"><h4>${esc(title)} ${(tags||[]).map(x=>`<span class="src ex">${x}</span>`).join(' ')}</h4><p class="cs">${sub}</p>
      ${cards?`<div class="kg" style="margin-bottom:14px">${cards}</div>`:''}
      ${series.some(has)?chart({dates:L,series:[{name:m.replace(/_/g,' '),vals:series,color:CC}],type:t.level.includes(m)?undefined:'bar',area:t.level.includes(m),peak:false,h:220,aria:title}):'<p class="note">No days in these dates.</p>'}
      ${t.latest&&t.latest.length?`<div class="tw" style="box-shadow:none;margin-top:12px"><table style="min-width:0"><thead><tr>${t.show.map(c=>`<th style="text-align:left">${esc(c.replace(/_/g,' '))}</th>`).join('')}</tr></thead><tbody>${t.latest.map(r=>`<tr>${r.map(v=>`<td style="text-align:left;white-space:normal">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="note">The latest 10 rows.</p>`:''}</div>`; };
  const exFunnel=t=>{ const vc=exViewCol(t); const ints=t.numeric.filter(c=>/^(likes|comments|shares|replies|reposts|saves|quotes|reactions)$/i.test(c)); if(!vc&&!ints.length) return '';
    const iv=ints.reduce((a,c)=>a+(exSum(t,c)||0),0), f=exFollowers.find(x=>x.name===t.name), st=[];
    if(vc) st.push({l:vc.replace(/_/g,' '),v:exSum(t,vc),f:abbr,n:`From the ${t.name} tab.`});
    if(ints.length) st.push({l:'Interactions',v:iv,of:vc?vc.replace(/_/g,' '):undefined,n:ints.join(', ').replace(/_/g,' ')+'.'});
    return drawFunnel({title:t.name,color:'#8A8A90',sub:rng(W),stages:st,foot:(f?`${full(f.v)} followers${f.d?' on '+dL(f.d):''}. `:'')+'Added automatically from the sheet.'}); };
  const ALSO={}; const addAlso=(pg,html)=>{ (ALSO[pg]=ALSO[pg]||[]).push(html); };
  EXC.forEach(c=>{ const pg=TAB_PAGE[c.tab]||'data'; addAlso(pg,exBlock(c,c.cols.map(x=>x.replace(/_/g,' ')).join(', ').replace(/^./,m=>m.toUpperCase()),`New in the ${esc(c.tab)} tab, added automatically.`,[],PAGE_COLOR[pg])); });
  EX.filter(t=>t.kind!=='social').forEach(t=>addAlso(routeOf(t),exBlock(t,t.name,`New tab in the sheet: ${full(t.rows)} rows${t.first?`, ${dL(t.first)} to ${dL(t.last)}`:''}.`,t.kind==='earnings'?['Added to revenue']:[])));
  exSocial.forEach(t=>{ P[exSlug(t.name)]=`${ph(t.name,`From the ${esc(t.name)} tab in the reporting sheet, added automatically. Its followers and views are in the social totals.`,rng(W))}${exBlock(t,'Figures',`${full(t.rows)} rows${t.first?`, ${dL(t.first)} to ${dL(t.last)}`:''}. Columns: ${esc([...t.numeric,...t.text].join(', '))}.`,[])}`; });

  /* ---------- the Updates page ---------- */
  { const TS=((D.extra&&D.extra.tabStats)||[]).slice().sort((a,b)=>(a.loadedAt||'')<(b.loadedAt||'')?1:-1);
    const tm=x=>{ if(!x) return '-'; const d=new Date(String(x).length<=16?x+':00Z':x); return isNaN(d)?esc(x):d.toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); };
    const pageLink=(n,cn)=>{ const t=EX.find(x=>x.name===n); const id=t?routeOf(t):(TAB_PAGE[cn||n]||TAB_PAGE[n]||'data'); const pg=PAGES.find(p=>p[0]===id); return pg?`<a href="#${id}" data-go="${id}">${pg[1]}</a>`:'-'; };
    const newest=TS.reduce((a,t)=>t.loadedAt&&(!a||t.loadedAt>a)?t.loadedAt:a,null);
    const stale=t=>t.loadedAt&&newest&&(Date.parse(newest+':00Z')-Date.parse(t.loadedAt+':00Z'))>2*864e5;
    let log=[]; try{ log=JSON.parse(localStorage.getItem('dash-log')||'[]'); }catch(e){}
    P.updates=`${ph('Updates','Every update to the reporting sheet, with the date and time it arrived.','')}
      <div class="card"><h4>Audit</h4><p class="cs">The dashboard checks itself after every update: that totals agree everywhere they appear and add up, and that the sheet has no failed, duplicate, impossible or out-of-date rows.</p><div id="auditbox"></div></div>
      <div class="card" style="margin-top:16px"><h4>Latest update to each tab</h4><p class="cs">From the load time your pipeline stamps on every row, so everyone sees the same thing. Times are in your time zone. "Failed rows" are rows your pipeline marked as an error; they carry no figures and are left out.</p>
        ${TS.length?`<div class="tw" style="box-shadow:none"><table style="min-width:0"><thead><tr><th style="text-align:left">Tab</th><th>Last updated</th><th>Newest day of data</th><th>Rows</th><th>Shows on</th></tr></thead><tbody>
          ${TS.map(t=>`<tr><td style="text-align:left"><b>${esc(t.name)}</b>${EX.some(x=>x.name===t.name)?' <span class="src ex">new</span>':''}${stale(t)?' <span class="chip need">not updated recently</span>':''}${t.errors?` <span class="chip need">${full(t.errors)} failed rows</span>`:''}</td><td>${tm(t.loadedAt)}</td><td>${t.last?dL(t.last):'-'}</td><td>${full(t.rows)}</td><td>${pageLink(t.name,t.canon)}</td></tr>`).join('')}
        </tbody></table></div>`:'<p class="note">Appears once the dashboard has read the sheet.</p>'}</div>
      <div class="card" style="margin-top:16px"><h4>Changes seen</h4><p class="cs">Every time the dashboard notices the sheet has changed, it notes what changed and when. This list is kept in this browser, from the first time it opened the dashboard.</p>
        ${log.length?`<div class="tw" style="box-shadow:none"><table style="min-width:0"><thead><tr><th style="text-align:left;width:190px">When</th><th style="text-align:left">What changed</th></tr></thead><tbody>
          ${log.slice(0,150).map(e=>`<tr><td style="text-align:left;white-space:nowrap;vertical-align:top">${new Date(e.t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td><td style="text-align:left;white-space:normal">${e.details&&e.details.length?`<details class="chg"><summary>${esc(e.m)}</summary><ul>${e.details.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:esc(e.m)}</td></tr>`).join('')}
        </tbody></table></div>`:'<p class="note">Nothing yet. Entries appear here whenever the sheet changes while the dashboard is open, or the next time it is opened.</p>'}</div>`;
  }

  /* ---------- executive summary ---------- */
  const prevP=N===1?'the day before':N===7?'the week before':N===28?'the four weeks before':N===90?'the three months before':`the ${N} days before`;
  const stale=(x,label)=>x&&x.asOf&&x.asOf<W.cs?` ${label} figure from ${dS(x.asOf)}.`:'';
  const join2=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
  /* followers for the scorecard: every platform, same rules as the Social overview (which is checked against this in the audit) */
  const SCF=(()=>{ const f=[folV('facebook'),folV('instagram'),folV('youtube'),(TA.length||TV.length)?folV('tiktok'):null,(XP.length||XA.length)?folV('x'):null,...exSocial.map(t=>folV(exSlug(t.name)))].filter(has);
    const nf=[fbNet,igNet?igNet.cur:igNF.cur,ytNet,(TA.length||TV.length)?ttNet:null,(XP.length||XA.length)?xNet:null].filter(has);
    return {tot:f.reduce((t,v)=>t+v,0),nf:nf.reduce((t,v)=>t+v,0),nfN:nf.length}; })();
  /* what this workbook actually has, so the summary only shows what it can back with figures */
  const HAS={social:[D.fb,D.ig,D.yt,D.ttAcct,D.ttVideos,D.xAcct,D.xPosts,D.igPosts,D.fbPosts,D.ytVideos].some(nz)||exSocial.length>0,fb:nz(D.fb),web:nz(D.web),
    app:[D.play,D.apple,D.aInst].some(nz),subs:[D.pSubs,D.aSubs].some(nz),qual:nz(D.qual),play:nz(D.play),rev:[D.apple,D.earn,D.adsense,D.admob].some(nz),fol:SCF.nfN>0||SCF.tot>0};
  const SHOW={'Social reach':HAS.social,'Engagement':HAS.fb,'Follower growth':HAS.fol,'Website traffic':HAS.web,'App installs':HAS.app,'App retention':HAS.play,'Paying subscribers':HAS.subs,'App stability':HAS.qual};

  const score=[
    {t:'Social reach',v:abbr(allViews),w:`Views on ${viewSplit.map(x=>x[0]).join(', ').replace(/, ([^,]*)$/,' and $1')}.${HAS.fb&&viewSplit.length>1?` ${pct(fbShare,0)} came from Facebook.`:''}`,d:allViewsD,s:spark(fbV.series,'#5B8DEF'),c:'#5B8DEF'},
    {t:'Engagement',v:pct(fbER,2),w:'Facebook engagements per view: reactions, comments, shares and clicks.',d:fbERd,pp:true,s:spark(fbV.series.map((v,i)=>{const e=fbE.series[i];return has(v)&&v&&has(e)?e/v:null;}),'#E0B35A'),c:'#E0B35A'},
    {t:'Follower growth',v:sgn(SCF.nf),w:`New followers across ${SCF.nfN} platform${SCF.nfN===1?'':'s'}, net of unfollows where the platform reports them.${SCF.tot?` ${full(SCF.tot)} followers in total${folNow?'':' on '+dS(W.end)}.`:''}`,d:null,s:spark(fbF.series,'#5B8DEF','level'),c:'#5B8DEF',st:SCF.nf>0?'good':'bad'},
    {t:'Website traffic',v:abbr(web.s.cur),w:`Visits to the website, from ${full(web.u.cur)} people.`,d:web.s.d,s:spark(web.s.series,'#3FB5A8'),c:'#3FB5A8'},
    {t:'App installs',v:abbr(installs),w:`${full(pl.i.cur)} on Android, ${full((ap.dl.cur||0)+(ap.rd.cur||0))} on iPhone.`,d:instD,s:spark(pl.i.series,'#5BBF7A'),c:'#5BBF7A'},
    {t:'App retention',v:full(plAct.cur),w:`Android phones that still have the app. ${pct(uninRate,0)} of installs were later removed.`,d:plAct.d,s:spark(plAct.series,'#5BBF7A','level'),c:'#5BBF7A',st:has(uninRate)&&uninRate>60?'bad':undefined},
    {t:'Paying subscribers',v:full(activeSubs),w:`${full(pS.cur)} on Android, ${full(aS.cur)} on iPhone${trialSubs?`, plus ${full(trialSubs)} on a free trial`:''}.${stale(pS,'Android')}`,d:chg(activeSubs,subsPrev),s:spark(D.aSubs.slice(-N).map(r=>(r.s||0)),'#D9A857','level'),c:'#D9A857'},
    {t:'App stability',v:pct(qc,2),w:has(qc)?`User-perceived crash rate over the last 28 days, the window Google judges; its limit is 1.09%. The app freezes for ${pct(qa,2)} of daily users; the limit there is 0.47%.`:`No stability data for these dates. The latest is from ${dS(lastD(D.qual))}.`,d:null,s:spark(inR(D.qual,q.w?q.w.cs:'',q.w?q.w.end:'').map(r=>r.cr),'#E07A68'),c:'#E07A68',st:!has(qc)?'none':(qc>1.09)||(has(qa)&&qa>0.47)?'bad':'good'}
  ];
  /* free trials: Apple's subscription events say when a trial starts and when it becomes a paid subscription;
     Google Play only says which new subscriptions started on a free-trial offer */
  const TRIAL=(()=>{ const ev=D.aEv||[], sumE=(rs,e)=>rs.filter(x=>x.e===e).reduce((t,x)=>t+(x.q||0),0);
    const part=rs=>({start:sumE(rs,'Start Introductory Offer'),paid:sumE(rs,'Paid Subscription from Introductory Offer'),failed:sumE(rs,'Billing Retry from Introductory Offer')});
    const inW=W?ev.filter(x=>x.d>=W.cs&&x.d<=W.end):[], pInW=W?(D.pSubs||[]).filter(r=>r.d>=W.cs&&r.d<=W.end):[];
    return {all:part(ev),win:part(inW),playAll:(D.pSubs||[]).reduce((t,r)=>t+(r.tn||0),0),playWin:pInW.reduce((t,r)=>t+(r.tn||0),0),hasPlay:(D.pSubs||[]).some(r=>has(r.tn))}; })();
  const findings=[];
  findings.push(has(fbShare)&&fbShare>85?{g:'social',k:'watch',i:'!',a:'Repost the best Facebook videos to Instagram, YouTube Shorts and TikTok, and check each platform\u2019s views every week.',h:`Almost all our views come from Facebook`,p:`Facebook brought ${pct(fbShare,0)} of the views we can measure. YouTube added ${abbr(ytV.cur)}. ${igHasViews?'':'Instagram views aren\'t in the sheet yet, and '}TikTok and X are measured differently, so they have their own pages.`}:null);
  findings.push(has(uninRate)?{g:'installs',k:uninRate>60?'bad':'watch',i:'↓',a:'Review what new users see in their first minutes and at the paywall, and ask people who uninstall why, with a one-question survey.',h:`Most Android users don't keep the app`,p:`${full(lifeInst)} installs so far, but ${full(lifeUnin)} uninstalls. Only ${full(plAct.cur)} phones still have it. Keeping users matters more than finding new ones.`}:null);
  findings.push(HAS.subs&&{g:'subs',k:'good',i:CURI.icon,a:TRIAL.all.start?`Turn more free trials into subscribers: ${full(TRIAL.all.paid)} of ${full(TRIAL.all.start)} Apple trials became paying (${pct(TRIAL.all.paid/TRIAL.all.start*100,0)}). Remind people before their trial ends and show what paying unlocks.`:'Promote the free trial in the app and on social, then track how many trials become paying.',h:`${full(activeSubs)} people pay for the app`,p:`${full(pS.cur)} on Android and ${full(aS.cur)} on iPhone${trialSubs?`, plus ${full(trialSubs)} on a free trial`:''}. Subscriptions have brought in about ${CURSYM}${full(Math.round(lifeApple+lifePlay))} after the stores\u2019 fees (${CURSYM}${full(Math.round(lifeApple))} from Apple, ${CURSYM}${full(Math.round(lifePlay))} from Google Play)${lifeAds?`, and ads another ${CURSYM}${full(Math.round(lifeAds))}`:''}.`});
  findings.push(has(qa)?{g:'stability',k:qa>0.47||qc>1.09?'bad':'good',i:qa>0.47?'!':'✓',a:qa>0.47?'Ask the app developers to fix the most common freezes, listed in Google Play Console under Android vitals, then ANRs.':'Keep checking the weekly crash and freeze rates after each app update.',h:qa>0.47?`The app freezes too often`:`The app is stable`,p:qa>0.47?`Over the last 28 days it froze for ${pct(qa,2)} of daily users. Google's limit is 0.47%, and going over it can push the app down in the Play Store.`:`Crashes and freezes are both inside Google's limits.`}:null);
  /* new tabs and columns are listed on the Updates page, not among the business insights */
  const F=findings.filter(Boolean);
  const funnel=[
    {l:'Social views',s:'All platforms',v:allViews,c:'#5B8DEF',on:HAS.social},
    {l:'Website visits',s:SITE,v:web.s.cur,c:'#3FB5A8',on:HAS.web},
    {l:'App installs',s:'Google Play and App Store',v:installs,c:'#5BBF7A',on:HAS.app},
    {l:'New subscriptions',s:'Google Play and App Store',v:newSubs,c:'#D9A857',on:HAS.subs},
    {l:'Revenue',s:'Subscriptions and ads',v:revWin,c:'#D9A857',money:true,on:HAS.rev}].filter(f=>f.on);
  const fmax=Math.max(...funnel.map(f=>f.v||0));
  const flog=v=>has(v)&&v>0&&fmax>0?Math.max(3,Math.log10(v+1)/Math.log10(fmax+1)*100):0;
  const priOld=[
    has(uninRate)&&[`Keep more Android users`,`For every 100 Android installs there are ${Math.round(uninRate)} uninstalls. Look at the first few minutes in the app and the paywall.`],
    has(qa)&&qa>0.47?[`Stop the app freezing`,`Over the last 28 days it froze for ${pct(qa,2)} of daily users. Getting under Google's 0.47% limit protects our Play Store ranking.`]:null,
    ...(has(fbShare)&&fbShare>50?[[`Rely less on Facebook`,`${pct(fbShare,0)} of our views come from it. ${(()=>{ const nxt=viewSplit.filter(x=>x[0]!=='Facebook').sort((a,b)=>b[1]-a[1])[0]; return nxt?`${nxt[0]} is next with ${pct(nxt[1]/allViews*100,0)}; growing it spreads the risk.`:''; })()}`]]:[]),
    ...(()=>{ const TS=(D.extra&&D.extra.tabStats)||[]; const st2=staleAreas(TS), err=TS.filter(t=>t.errors);
      const txt=[st2.length?`${join2(st2.map(x=>`${x.area} (last day ${dS(x.last)})`))} ${st2.length>1?'have':'has'} stopped updating, so ${st2.length>1?'their':'its'} figures are behind.`:'',
        err.length?`Some rows failed to load: ${join2(err.map(t=>`${tabName(t)} (${full(t.errors)})`))}.`:''].filter(Boolean).join(' ');
      return txt?[[`Fix the reporting pipeline`,txt+' The Updates page has the details.']]:[]; })()].filter(Boolean);
  /* the short list on the summary is the top of the Action plan, so the two pages never disagree */
  const firstSentence=t=>{ const k=String(t).indexOf('. ',30); return k>0?String(t).slice(0,k+1):String(t); };
  const pri=ACT&&ACT.actions.length?ACT.actions.slice(0,5).map(a=>[a.title,firstSentence(a.why)]):priOld;
  const hParts=[HAS.social?`${abbr(allViews)} views on social${has(allViewsD)?`, ${allViewsD<0?'down':'up'} ${pct(Math.abs(allViewsD),0)} on ${prevP}`:''}`:'',!HAS.social&&HAS.web?`${abbr(web.s.cur)} website visits`:'',
    HAS.subs?`${full(activeSubs)} people pay for the app`:HAS.app?`${abbr(installs)} app installs`:''].filter(Boolean);
  const headline=hParts.length?hParts.join('. ')+'.':'Your figures at a glance.';
  SUMMARY_TEXT=[`${BRAND}, ${rng(fbV.w)}`,'',headline,'','What stands out:',...F.map(f=>`- ${f.h}. ${f.p}${f.a?` What to do: ${f.a}`:''}`),'','What we should do next:',...pri.map((p,i)=>`${i+1}. ${p[0]}. ${p[1]}`)].join('\n');
  P.summary=`
    ${VISIT.defNote&&!sessionStorage.getItem('dash-visit-seen')?`<div class="co"><h4>The dashboard was updated</h4><p>${esc(VISIT.defNote)}</p></div>`:''}
    ${VISIT.diff&&!sessionStorage.getItem('dash-visit-seen')?`<div class="visit"><div><b>Since your last visit</b> <span>all-time totals, compared with ${new Date(VISIT.since).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div>
      <ul>${VISIT.diff.slice(0,6).map(x=>`<li>${esc(x.short)}</li>`).join('')}${VISIT.diff.length>6?`<li>+${VISIT.diff.length-6} more</li>`:''}</ul><a href="#updates" data-go="updates">All changes</a><button type="button" class="visit-x" aria-label="Dismiss" onclick="sessionStorage.setItem('dash-visit-seen','1');this.closest('.visit').remove()">\u2715</button></div>`:''}
    <div class="hero"><img class="hero-mark" src="${LOGO_NOW()}" alt=""><div class="k"><span>${esc(BRAND)}, ${rng(fbV.w)}</span><button type="button" class="btn hero-copy" id="copysum"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="8.5" height="8.5" rx="1.8"/><path d="M10.5 5V3.8A1.3 1.3 0 0 0 9.2 2.5H3.8A1.3 1.3 0 0 0 2.5 3.8v5.4A1.3 1.3 0 0 0 3.8 10.5H5"/></svg>Copy summary</button></div>
      <h2>${headline}</h2>
      <div class="hero-nums">
        ${HAS.social?`<div class="hn"><div class="l">Social views</div><div class="v">${abbr(allViews)}</div><div class="s">${has(allViewsD)?`<span style="color:${allViewsD>0?'var(--good)':'var(--bad)'}">${allViewsD>0?'▲':'▼'} ${pct(Math.abs(allViewsD),1)}</span> vs ${prevP}`:''}</div></div>`:''}
        ${HAS.web?`<div class="hn"><div class="l">Website visits</div><div class="v">${abbr(web.s.cur)}</div><div class="s">${has(web.s.d)?`<span style="color:${web.s.d>0?'var(--good)':'var(--bad)'}">${web.s.d>0?'▲':'▼'} ${pct(Math.abs(web.s.d),1)}</span> vs ${prevP}`:''}</div></div>`:''}
        ${HAS.app?`<div class="hn"><div class="l">App installs</div><div class="v">${abbr(installs)}</div><div class="s">${has(instD)?`<span style="color:${instD>0?'var(--good)':'var(--bad)'}">${instD>0?'▲':'▼'} ${pct(Math.abs(instD),1)}</span> vs ${prevP}`:''}</div></div>`:''}
        ${HAS.subs?`<div class="hn"><div class="l">Paying subscribers</div><div class="v">${full(activeSubs)}</div><div class="s">Android and iPhone</div></div>`:''}
      </div></div>
    <h3 class="st">Scorecard <small>${!has(allViewsD)?'All-time totals. Pick a shorter period to compare it with the one before.':`Each area against the ${N} days before, using daily averages`}</small></h3>
    <div class="sc">${score.filter(s=>SHOW[s.t]!==false).map(s=>{ const stt=s.st||status(s.d); const GO={'Social reach':'social','Engagement':'facebook','Follower growth':'social','Website traffic':'website','App installs':'installs','App retention':'installs','Paying subscribers':'subs','App stability':'stability'}; return `<div class="sci" data-go="${GO[s.t]||'summary'}" tabindex="0" role="link" aria-label="${s.t}, open detail"><div class="t">${s.t}${stt==='none'?'':`<span class="st-chip ${stt}">${chipTxt[stt]}</span>`}</div><div class="v">${s.v}</div>${s.d===null&&!s.pp?'':pill(s.d,{pp:s.pp})}<div class="w">${s.w}</div>${s.s}</div>`; }).join('')}</div>
    ${F.length?'<h3 class="st">What stands out</h3>':''}
    <div class="fi">${F.map(f=>`<div class="fc ${f.k}" data-go="${f.g}" tabindex="0" role="link"><div class="ic">${f.i}</div><div><h4>${f.h}</h4><p>${f.p}</p>${f.a?`<div class="cta"><b>What to do</b>${f.a}</div>`:''}<div class="go cta-b">${({social:'Open Social overview',installs:'Open App installs',subs:'Open Subscriptions',stability:'Open App stability'})[f.g]||'See the detail'} \u2192</div></div></div>`).join('')}</div>
    <div class="g2" style="margin-top:16px">
      ${funnel.length>1?`<div class="card"><h4>From attention to revenue</h4><p class="cs">The bars use a log scale so small numbers still show.</p>
        <div class="fun">${funnel.map(f=>`<div class="fr"><div class="fl">${f.l}<small>${f.s}</small></div><div class="fb"><i style="width:${flog(f.v)}%;background:${f.c}"></i></div><div class="fv">${f.money?usd(f.v):abbr(f.v)}</div></div>`).join('')}</div>
        <p class="note">Each step is a total for these dates. They aren't linked by tracking, so there are no conversion rates here; the Funnels page has each platform's full funnel.</p></div>`:''}
      <div class="card"><h4>What we should do next</h4><p class="cs">The next 30 days, most important first.</p>${pri.length?`<ol class="pr">${pri.map(p=>`<li><div><b>${p[0]}</b><span>${p[1]}</span></div></li>`).join('')}</ol>`:'<p class="cs">Nothing urgent right now. The action plan adds tasks as soon as the numbers call for them.</p>'}<a class="ap-more" href="#actions" data-go="actions">See the full action plan${ACT&&ACT.actions.length?` (${ACT.actions.length} ${ACT.actions.length===1?'task':'tasks'})`:''} \u2192</a></div>
    </div>`;

  /* ---------- social overview ---------- */
  /* ---------- Social overview: every platform on the same terms ---------- */
  const PLAT=[
    {id:'facebook',n:'Facebook',c:'#5B8DEF',v:fbV.cur,vd:fbV.d,e:fbE.cur,f:folV('facebook'),nf:fbNet,posts:(D.fbPosts||[]).filter(inW).length||null,series:fbV.series,sl:'Views per day',kind:'area'},
    {id:'instagram',n:'Instagram',c:'#D66BA0',v:igHasViews?igViewsCur:null,vd:igHasViews?igViewsD:null,e:igIn.length?igIntCur:null,f:folV('instagram'),nf:igNet?igNet.cur:igNF.cur,posts:igIn.length||null,
      series:igDaily?igVw.series:(W?days(W.cs,W.end).map(d=>{ const x=igIn.filter(p=>p.d===d); return x.length?iSum(x,'v'):null; }):[]),sl:igDaily?'Views per day':'Views, by the day posts went out',kind:igDaily?'area':'bar'},
    {id:'youtube',n:'YouTube',c:'#E5654F',v:ytV.cur,vd:ytV.d,e:ytIntAll,f:folV('youtube'),nf:ytNet,posts:(D.ytVideos||[]).filter(inW).length||null,series:ytV.series,sl:'Views per day',kind:'area'},
    ...(TA.length||TV.length?[{id:'tiktok',n:'TikTok',c:'#5CC8D6',v:ttV||null,vd:ttPrevList.length?chg(ttV,ttVPrev):null,e:null,f:folV('tiktok'),nf:ttNet,posts:ttIn.length||null,series:ttByDay,sl:'Plays, by the day videos went out',kind:'bar'}]:[]),
    ...(XP.length||XA.length?[{id:'x',n:'X',c:'#B9B9C0',v:xIm||null,vd:xPrev.length?chg(xIm,xImP):null,e:xE||null,f:folV('x'),nf:xNet,posts:xIn.length||null,series:xByDay,sl:'Impressions, by the day posts went out',kind:'bar'}]:[]),
    ...exSocial.map(t=>{ const vc=exViewCol(t), m=exMain(t);
      return {id:exSlug(t.name),n:t.name,c:'#8A8A90',v:vc?exSum(t,vc):null,vd:null,e:null,f:folV(exSlug(t.name)),nf:null,posts:null,series:W&&t.daily[m]?days(W.cs,W.end).map(d=>{ const i=t.dates.indexOf(d); return i<0?null:t.daily[m][i]; }):null,sl:(m||'').replace(/_/g,' '),kind:'bar'}; })];
  PLAT.forEach(p=>{ p.er=has(p.e)&&p.v?p.e/p.v*100:null; });
  const join=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
  const folTot=PLAT.reduce((t,p)=>t+(p.f||0),0), nfList=PLAT.filter(p=>has(p.nf)), nfTot=nfList.reduce((t,p)=>t+p.nf,0);
  const vList=PLAT.filter(p=>has(p.v)&&p.v>0), iList=PLAT.filter(p=>has(p.e)&&p.e>0);
  const kfmt=v=>v>=1e6?(v/1e6).toFixed(v>=1e7?1:2).replace(/\.?0+$/,'')+'m':v>=1e3?(v/1e3).toFixed(v>=1e4?0:1).replace(/\.0$/,'')+'k':full(v);
  const barsOf=(list,k,total)=>hbars(list.map(p=>({l:p.n,v:p[k],c:p.c})),v=>`${kfmt(v)} \u00B7 ${total?pct(v/total*100,v/total<0.01?1:0):''}`);
  /* posts from every platform, on the same terms: views, interactions, link */
  const ALLPOSTS=[
    ...igIn.map(p=>({pl:'Instagram',c:'#D66BA0',d:p.d,t:p.t,u:p.u,v:p.v,e:igI(p),ty:p.ty})),
    ...xIn.map(p=>({pl:'X',c:'#B9B9C0',d:p.d,t:p.t,u:xUrl(p.id),v:p.im,e:p.e,ty:'post'})),
    ...(D.fbPosts||[]).filter(inW).map(p=>({pl:'Facebook',c:'#5B8DEF',d:p.d,t:p.t,u:p.u,v:p.v,e:(p.re||0)+(p.cm||0)+(p.sh||0)+(p.sv||0),ty:p.ty})),
    ...ttIn.map(v=>({pl:'TikTok',c:'#5CC8D6',d:v.d,t:v.t,u:ttUrl(v.id),v:v.v,e:null,ty:'video'})),
    ...(D.ytVideos||[]).filter(inW).map(p=>({pl:'YouTube',c:'#E5654F',d:p.d,t:p.t,u:p.u,v:p.v,e:(p.l||0)+(p.cm||0)+(p.sh||0),ty:p.ty}))
  ].filter(p=>has(p.v)&&p.v>0);
  const topPosts=[...ALLPOSTS].sort((a,b)=>b.v-a.v).slice(0,8);
  const minV=ALLPOSTS.length?[...ALLPOSTS].sort((a,b)=>a.v-b.v)[Math.floor(ALLPOSTS.length*0.5)].v:0;
  const topRate=ALLPOSTS.filter(p=>p.v>=minV&&p.e).sort((a,b)=>b.e/b.v-a.e/a.v).slice(0,6);
  /* followers on the last day of the chosen dates (right now, when the dates run up to the newest data), with the net change in them */
  const NOW=PLAT.map(p=>{ const x=has(p.f)?FOL[p.id]:null, rs=p.id==='tiktok'?TA:p.id==='x'?XA:p.id==='facebook'?D.fb:[];
    const fr=rs.find(r=>has(r.f)), since=fr&&W&&fr.d>W.cs?fr.d:null;
    if(x) return {...p,x,since};
    const first=folNow?null:folFirst(p.id); return first?{...p,x:null,first}:null; }).filter(Boolean);
  const NOWC=NOW.filter(p=>p.x), nowNet=NOWC.filter(p=>has(p.nf)), nowNetTot=nowNet.reduce((t,p)=>t+p.nf,0);
  const hhmm=t=>{ const x=new Date(t); return isNaN(x)?'':x.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); };
  const folWhen=p=>{ const x=p.x; if(!x) return `No count until ${dL(p.first)}`; if(x.live) return 'Live from Instagram'+(hhmm(x.at)?', checked '+hhmm(x.at):''); if(!x.d) return '';
    return folNow?'Latest count, '+dS(x.d):(x.est?'Worked out for ':'Count on ')+dS(x.d); };
  const ytNow=NOWC.find(p=>p.id==='youtube'), folNotes=['Net is followers gained minus followers lost in the chosen dates.'];
  if(NOWC.some(p=>p.id==='instagram')&&!IGFOL) folNotes.push('Instagram shows followers gained, because the sheet has no unfollow figures for it.');
  if(NOWC.some(p=>p.x.est)) folNotes.push(`${join(NOWC.filter(p=>p.x.est).map(p=>p.n))} had no count of ${NOWC.filter(p=>p.x.est).length>1?'their':'its'} own on that day, so it is worked out from each day\u2019s gains and losses.`);
  if(ytNow&&!ytNow.x.est) folNotes.push('YouTube only shares its subscriber total rounded to three figures, so that one count is as exact as YouTube allows.');
  if(NOW.some(p=>!p.x)) folNotes.push(`${join(NOW.filter(p=>!p.x).map(p=>p.n))} ${NOW.filter(p=>!p.x).length>1?'were':'was'} not counted yet, so ${NOW.filter(p=>!p.x).length>1?'they are':'it is'} left out of the total.`);
  const folCard=NOW.length?`<h3 class="st">${folNow?'Followers right now <small>The latest count on each platform. Choose dates that end earlier to see the count on that day</small>':`Followers on ${dL(W.end)} <small>The count on each platform on the last day of the chosen dates</small>`}</h3>
    <div class="card folc">
      <div class="folt"><small>All platforms</small><b>${NOWC.length?full(NOWC.reduce((t,p)=>t+p.x.v,0)):'-'}</b>
        ${nowNet.length?`<span class="${nowNetTot>=0?'up':'down'}">${sgn(nowNetTot)} net in these dates</span>`:''}<small>${NOWC.length?`Across ${NOWC.length} platform${NOWC.length===1?'':'s'}`:'No counts yet on that day'}</small></div>
      <div class="folg">${NOW.map(p=>`<a class="foli" href="#${p.id}" data-go="${p.id}" style="--pc:${p.c}">
        <div class="pch"><span class="pdot"></span>${esc(p.n)}${p.x&&p.x.live?'<span class="live">LIVE</span>':''}</div>
        <b>${p.x?full(p.x.v):'-'}</b>
        <span class="${p.x&&has(p.nf)?(p.nf>=0?'up':'down'):'flat'}">${p.x&&has(p.nf)?sgn(p.nf)+(p.id==='instagram'&&!IGFOL?' gained':' net')+(p.since?' since '+dS(p.since):''):'No net figure for these dates'}</span>
        <small>${folWhen(p)}</small></a>`).join('')}</div>
      <p class="note folnote">${folNotes.join(' ')}</p>
    </div>`:'';
  const share=vList.map(p=>({...p,sh:allViews?p.v/allViews*100:0}));
  P.social=`${ph('Social overview','How every platform is doing and what is working.',rng(W))}
    <div class="kg">
      ${kc({l:'Views, all platforms',v:abbr(allViews),p:pill(allViewsD),c:'var(--brand)',n:'TikTok plays count as views.'})}
      ${kc({l:'Interactions',v:abbr(allInt),p:pill(allIntD),c:'var(--brand)',n:`${pct(allViews?allInt/allViews*100:null,2)} of views.`})}
      ${kc({l:folNow?'Followers':'Followers on '+dS(W.end),v:full(folTot),p:'',c:'var(--brand)',n:`Across ${PLAT.filter(p=>has(p.f)).length} platforms.${folNow?(PLAT.some(p=>p.id==='instagram'&&!has(p.f))?' Instagram\u2019s total isn\u2019t in the sheet.':''):(NOW.some(p=>!p.x)?` ${join(NOW.filter(p=>!p.x).map(p=>p.n))} not counted yet then.`:'')}`})}
      ${kc({l:'New followers',v:nfList.length?sgn(nfTot):'-',p:'',c:'var(--brand)',n:`In these dates, across ${nfList.length} platforms. Net of unfollows where the platform reports them.`})}
    </div>
    ${share.length?`<div class="card" style="margin-top:16px"><h4>Where views come from</h4>
      <div class="sharebar">${share.map(p=>`<i style="width:${Math.max(p.sh,0.6)}%;background:${p.c}" title="${p.n} ${pct(p.sh,1)}"></i>`).join('')}</div>
      <div class="sharelegend">${share.map(p=>`<span><i style="background:${p.c}"></i>${p.n} <b>${pct(p.sh,p.sh<1?1:0)}</b> <small>${kfmt(p.v)}</small></span>`).join('')}</div></div>`:''}

    ${folCard}
    <h3 class="st">Each platform <small>Click a card for its full page</small></h3>
    <div class="pgrid">${PLAT.map(p=>{ const sp=p.series&&p.series.some(has)?spark(p.series,p.c,p.sl==='Followers'?'level':undefined):'';
      const stat=(l,v)=>`<div><small>${l}</small><b>${v}</b></div>`;
      return `<a class="pcard" href="#${p.id}" data-go="${p.id}" style="--pc:${p.c}">
        <div class="pch"><span class="pdot"></span>${p.n}<span class="pgo">Open \u2192</span></div>
        <div class="pmain">${has(p.v)?`<b>${kfmt(p.v)}</b><span>${p.id==='x'?'impressions':p.id==='tiktok'?'plays':'views'}</span>`:has(p.f)?`<b>${full(p.f)}</b><span>followers</span>`:'<b>-</b>'}
          ${has(p.vd)?`<em class="${p.vd>=0?'up':'down'}">${p.vd>=0?'\u25B2':'\u25BC'} ${Math.abs(p.vd).toFixed(1)}%</em>`:''}</div>
        <div class="pspark">${sp}</div>
        <div class="pstats">${(()=>{ const mine=ALLPOSTS.filter(q=>q.pl===p.n), vid=p.id==='youtube'||p.id==='tiktok';
          let e=p.e, er=p.er;
          if(p.id==='tiktok'){ const wE=ttIn.filter(v=>has(v.l)||has(v.cm)||has(v.sh)); if(wE.length){ e=wE.reduce((t,v)=>t+(v.l||0)+(v.cm||0)+(v.sh||0),0); const pv=wE.reduce((t,v)=>t+(v.v||0),0); er=pv?e/pv*100:null; } }
          const n=has(p.posts)?p.posts:(mine.length||null), avg=mine.length?mine.reduce((t,q)=>t+q.v,0)/mine.length:null;
          const what=p.id==='x'?'impressions':p.id==='tiktok'?'plays':'views';
          const tl=TA[TA.length-1]||{}; return (p.id==='tiktok'&&!has(e)?stat('Likes, all time',has(tl.h)?kfmt(tl.h):'-')+stat('Plays, all time',has(tl.v)?kfmt(tl.v):'-'):stat('Interactions',has(e)?kfmt(e):'-')+stat('Engagement rate',has(er)?pct(er,2):'-'))+stat(vid?'Videos posted':'Posts published',has(n)?full(n):'-')+stat(`Avg ${what} per ${vid?'video':'post'}`,has(avg)?kfmt(avg):'-'); })()}</div>
      </a>`; }).join('')}</div>

    ${(()=>{ /* the most viewed post or video on each platform, published in these dates */
      const best=['Instagram','Facebook','YouTube','X','TikTok'].map(pl=>{ const list=ALLPOSTS.filter(p=>p.pl===pl); if(!list.length) return null;
        const top=[...list].sort((x,y)=>y.v-x.v)[0]; return {...top,count:list.length}; }).filter(Boolean);
      const tt=!ttIn.length&&!TV.some(v=>v.d)&&TV.length?[...TV].sort((x,y)=>y.v-x.v)[0]:null;
      /* no post-level data yet: the platform's biggest day, clearly labelled as a day */
      const bestDay=(pl,c,id,rs,eOf)=>{ if(best.some(b=>b.pl===pl)) return null; const r=W?inR(rs,W.cs,W.end).filter(x=>has(x.v)):[]; if(!r.length) return null;
        const d=[...r].sort((x,y)=>y.v-x.v)[0]; return {pl,c,id,d:d.d,v:d.v,e:eOf(d),days:r.length}; };
      const days2=[bestDay('Facebook','#5B8DEF','facebook',D.fb,r=>r.e),bestDay('YouTube','#E5654F','youtube',D.yt,r=>(r.l||0)+(r.c||0)+(r.s||0))].filter(Boolean);
      const dayCard=b=>`<a class="bcard" href="#${b.id}" data-go="${b.id}" style="--pc:${b.c}">
        <div class="bch"><span class="pdot"></span>Best on ${b.pl}<span class="fchip" style="color:${b.c};background:${hexA(b.c,.15)}">Biggest day</span></div>
        <p class="bct">${WDF[dayIdx(b.d)]} ${dL(b.d)} was ${b.pl}'s biggest day in these dates. ${b.pl} post-level data isn't in the sheet yet, so this shows its biggest day instead.</p>
        <div class="bcm"><b>${kfmt(b.v)}</b><span>views that day</span></div>
        ${has(b.e)?`<div class="bcs"><div><small>Interactions</small><b>${kfmt(b.e)}</b></div><div><small>Engagement rate</small><b>${b.v?pct(b.e/b.v*100,2):'-'}</b></div></div>`:''}
        <div class="bcf"><em>best of ${b.days} days</em><span>Open ${b.pl} \u2192</span></div></a>`;
      if(!best.length&&!tt&&!days2.length) return '';
      const card=(p,label,sub)=>`<a class="bcard" ${p.u?`href="${esc(p.u)}" target="_blank" rel="noopener"`:''} style="--pc:${p.c}">
        <div class="bch"><span class="pdot"></span>${label}${p.ty?`<span class="fchip" style="color:${p.c};background:${hexA(p.c,.15)}">${esc(p.ty)}</span>`:''}</div>
        <p class="bct">${esc(p.t||'(no caption)')}</p>
        <div class="bcm"><b>${kfmt(p.v)}</b><span>${p.pl==='X'?'impressions':p.pl==='TikTok'?'plays':'views'}</span></div>
        ${has(p.e)?`<div class="bcs"><div><small>Interactions</small><b>${kfmt(p.e)}</b></div><div><small>Engagement rate</small><b>${p.v?pct(p.e/p.v*100,2):'-'}</b></div></div>`:''}
        <div class="bcf"><em>${[p.d?dL(p.d):'',sub?sub[1]:''].filter(Boolean).join(', ')}</em>${p.u?'<span>Open post \u2192</span>':''}</div></a>`;
      return `<h3 class="st">Best on each platform <small>Most viewed post in these dates</small></h3>
      <div class="bgrid">${[...best.map(p=>({o:['Instagram','Facebook','YouTube','X','TikTok'].indexOf(p.pl),h:card(p,`Best on ${p.pl}`,['',`best of ${full(p.count)} posts`])})),...days2.map(b=>({o:['Instagram','Facebook','YouTube','X'].indexOf(b.pl),h:dayCard(b)}))].sort((a,b)=>a.o-b.o).map(x=>x.h).join('')}${tt?card({pl:'TikTok',c:'#5CC8D6',t:tt.t,u:ttUrl(tt.id),v:tt.v,e:null,d:tt.d,ty:null},'Best on TikTok',['',`best of the latest ${TV.length} videos`]):''}</div>`; })()}

    `;

  /* ---------- platform pages ---------- */
  const prevS=(rs,k,w)=>{ const bd=byDate(rs); return days(w.ps,w.pe).map(x=>{const r=bd.get(x);return r&&has(r[k])?r[k]:null;}); };
  const bw=(rs,k,w,cols,color,unit)=>{ const list=inR(rs,w.cs,w.end).filter(r=>has(r[k])).sort((a,b)=>b[k]-a[k]); if(!list.length) return '';
    const mx=list[0][k]||1;
    const t=(l,h,strong)=>`<div class="card lb"><div class="lb-h"><span class="lb-ic ${strong?'up':'fall'}">${strong?'▲':'▼'}</span><h4>${h}</h4><small>by ${unit}</small></div>
      ${l.map((r,i)=>`<div class="lb-r">${strong?rankB(i):`<span class="rank">${i+1}</span>`}<div><div class="lb-top"><b>${WD[dayIdx(r.d)]} ${dS(r.d)}</b><span class="lb-v">${cols[0].f(r)}</span></div>
        <div class="lb-bar"><i style="width:${Math.max(2,r[k]/mx*100)}%;background:${strong?`linear-gradient(90deg,${color},${hexA(color,.55)})`:`linear-gradient(90deg,${hexA(color,.5)},${hexA(color,.25)})`}"></i></div>
        <div class="lb-meta">${cols.slice(1).map(c=>`<span class="mchip"><b>${c.f(r)}</b> ${c.h.toLowerCase()}</span>`).join('')}</div></div></div>`).join('')}</div>`;
    return `<div class="g2">${t(list.slice(0,5),'Strongest days',true)}${t(list.slice(-5).reverse(),'Weakest days',false)}</div>`; };
  const fbGap=fbV.w&&D.fb&&D.fb.length?days([fbV.w.cs,D.fb[0].d].sort()[1],[fbV.w.end,lastD(D.fb)].sort()[0]).filter(d=>!byDate(D.fb).has(d)):[];
  /* follower growth for every platform, side by side */
  { const FG=[['Facebook',D.fb,'f','#5B8DEF'],['Instagram',IGFOL?IGFOL.rows:[],'ft','#D66BA0'],['YouTube',YTFOL?YTFOL.rows:[],'ft','#E5654F'],['X',D.xAcct||[],'f','#B9B9C0'],['TikTok',D.ttAcct||[],'f','#69C9D0']]
      .map(([n,rows,k,c])=>({n,c,g:growth(rows,k,W&&W.end)})).filter(x=>x.g&&x.g.steps.some(y=>y.then));
    if(FG.length) P.social+=`<h3 class="st">Follower growth <small>Followers at the end of these dates, against earlier months</small></h3>
      <div class="card"><div class="tw" style="box-shadow:none"><table style="min-width:0"><thead><tr><th style="text-align:left">Platform</th><th>Followers</th>${GROWTH_STEPS.map(([m,l])=>`<th>vs ${l} ago</th>`).join('')}</tr></thead><tbody>
      ${FG.map(x=>`<tr><td style="text-align:left" data-sort="${x.n}"><span class="pdot" style="background:${x.c}"></span> ${x.n}</td><td data-sort="${x.g.now.v}"><b>${full(x.g.now.v)}</b><small class="dim"> ${dS(x.g.now.d)}</small></td>${x.g.steps.map(y=>y.then?`<td data-sort="${y.pc}">${sgn(y.ch)} <span class="pill ${y.ch>=0?'up':'down'}">${y.pc>=0?'+':''}${y.pc.toFixed(1)}%</span></td>`:'<td data-sort="">-</td>').join('')}</tr>`).join('')}</tbody></table></div>
      <p class="note" style="margin:10px 0 0">Each column compares the total with the same day that many months earlier. A dash means there is no follower history that far back yet.</p></div>`; }
  P.facebook=`${ph('Facebook','Views, engagement, page visits and follower growth.',rng(fbV.w))}
    <div class="kg">
      ${kc({l:'Views',v:abbr(fbV.cur),p:pill(fbV.d,{tip:cmpTip(fbV,abbr)}),c:'var(--fb)',s:spark(fbV.series,'#5B8DEF')})}
      ${kc({l:'Engagements',v:abbr(fbE.cur),p:pill(fbE.d,{tip:cmpTip(fbE,abbr)}),c:'var(--fb)',s:spark(fbE.series,'#5B8DEF')})}
      ${kc({l:'Engagement rate',v:pct(fbER,2),p:pill(fbERd,{pp:true}),c:'var(--fb)',n:'Engagements per view.'})}
      ${kc({l:'Followers',v:full(fbF.cur),p:'',c:'var(--fb)',n:`${sgn(fbNet)} in the period.`,s:spark(fbF.series,'#5B8DEF','level')})}
      ${kc({l:'Page visits',v:full(fbPV.cur),p:pill(fbPV.d,{tip:cmpTip(fbPV)}),c:'var(--fb)',s:spark(fbPV.series,'#5B8DEF')})}
      ${kc({l:'New follows',v:full(fbNF.cur),p:pill(fbNF.d,{tip:cmpTip(fbNF)}),c:'var(--fb)',s:spark(fbNF.series,'#5B8DEF')})}
      ${kc({l:'Daily viewers, summed',v:abbr(fbU.cur),p:pill(fbU.d),c:'var(--fb)',n:'Not unique people across days.'})}
      ${kc({l:'Visit rate',v:fbV.cur?pct(fbPV.cur/fbV.cur*100,2):'-',p:'',c:'var(--fb)',n:'Page visits per view.'})}
    </div>
    ${growthCard(D.fb,'f','Follower growth','followers')}
    ${''}
    <div class="card" style="margin-top:16px"><h4>Views per day</h4><p class="cs">Thin line is the daily figure, thick line the 7-day average.</p>
      ${chart({dates:days(fbV.w.cs,fbV.w.end),series:[{name:'Views',vals:fbV.series,color:'#5B8DEF'}],area:true,ma:true,aria:'Facebook views'})}</div>
    <div class="g2" style="margin-top:16px">
      <div class="card"><h4>This period against the last</h4><p class="cs">Views, day by day. Dashed line is the previous ${N} days.</p>
        ${hasPrev?chart({dates:days(fbV.w.cs,fbV.w.end),series:[{name:'This period',vals:fbV.series,color:'#5B8DEF'},{name:'Previous period',vals:prevS(D.fb,'v',fbV.w),color:'#5B8DEF',dash:true,op:.45,w:1.6}],h:260,peak:false,aria:'Facebook comparison'}):noPrev}</div>
      <div class="card"><h4>Engagements per day</h4><p class="cs">Reactions, comments, shares and clicks.</p>
        ${chart({dates:days(fbE.w.cs,fbE.w.end),series:[{name:'Engagements',vals:fbE.series,color:'#5B8DEF'}],area:true,h:260,aria:'Facebook engagements'})}</div>
    </div>
    <div style="margin-top:16px">
      <div class="card"><h4>Follower total</h4><p class="cs">${full(fbF.cur)} followers on ${dS(fbF.w.end)}.</p>${chart({dates:days(fbF.w.cs,fbF.w.end),series:[{name:'Followers',vals:fbF.series,color:'#5B8DEF'}],level:true,peak:false,h:200,aria:'Facebook followers'})}</div>
    </div>
    <h3 class="st">Strongest and weakest days</h3>
    ${bw(D.fb,'v',fbV.w,[{h:'Views',f:r=>abbr(r.v)},{h:'Engagements',f:r=>abbr(r.e)},{h:'Rate',f:r=>has(r.e)&&r.v?pct(r.e/r.v*100,2):'-'}],'#5B8DEF','views')}`;


  /* ---------- Facebook: new data points ---------- */
  { const re=st(D.fb,'re'), cm=st(D.fb,'cm'), sh=st(D.fb,'sh'), sv=st(D.fb,'sv'), vv=st(D.fb,'vv'), v3=st(D.fb,'v3'), vt=st(D.fb,'vt'), lc=st(D.fb,'lc');
    const dts=days(W.cs,W.end); let x='';
    x+=`<h3 class="st">Reactions, comments, shares and saves <small>Each counted on its own</small></h3>`;
    x+=(anyIn(D.fb,'re')||anyIn(D.fb,'cm')||anyIn(D.fb,'sh')||anyIn(D.fb,'sv'))?`<div class="kg">
        ${kc({l:'Reactions',v:full(re.cur),p:pill(re.d,{tip:cmpTip(re)}),c:'var(--fb)',n:'Likes and every other reaction.'})}
        ${kc({l:'Comments',v:full(cm.cur),p:pill(cm.d,{tip:cmpTip(cm)}),c:'var(--fb)'})}
        ${kc({l:'Shares',v:full(sh.cur),p:pill(sh.d,{tip:cmpTip(sh)}),c:'var(--fb)'})}
        ${kc({l:'Saves',v:full(sv.cur),p:pill(sv.d,{tip:cmpTip(sv)}),c:'var(--fb)'})}</div>
      <div class="card" style="margin-top:16px"><h4>Per day</h4>${chart({dates:dts,series:[{name:'Reactions',vals:re.series,color:'#5B8DEF'},{name:'Comments',vals:cm.series,color:'#9DB9F5'},{name:'Shares',vals:sh.series,color:'#3E68C4'},{name:'Saves',vals:sv.series,color:'#2A4C99'}],type:'bar',stack:true,peak:false,aria:'Facebook engagement split'})}</div>`
      :need(D.fb,['re','cm','sh','sv'],'Reactions, comments, shares and saves','Meta Organic',['reactions','comments','shares','saves'],'Today the sheet only has one combined engagement figure. Add these columns and this section fills in by itself.');
    x+=`<h3 class="st">Video</h3>`;
    x+=anyIn(D.fb,'vv')?`<div class="kg">
        ${kc({l:'Video views',v:abbr(vv.cur),p:pill(vv.d,{tip:cmpTip(vv,abbr)}),c:'var(--fb)',s:spark(vv.series,'#5B8DEF')})}
        ${kc({l:'3-second views',v:abbr(v3.cur),p:pill(v3.d,{tip:cmpTip(v3,abbr)}),c:'var(--fb)',n:'Watched for at least three seconds.'})}
        ${kc({l:'Watch time',v:has(vt.cur)?full(vt.cur/60)+' h':'-',p:pill(vt.d,{tip:cmpTip(vt)}),c:'var(--fb)',tip:'Total hours of Facebook video watched.'})}
        ${kc({l:'Average watch per view',v:vv.cur&&has(vt.cur)?secs(vt.cur*60/vv.cur):'-',p:'',c:'var(--fb)',n:'Watch time divided by video views.'})}</div>
      <div class="card" style="margin-top:16px"><h4>Video views per day</h4>${chart({dates:dts,series:[{name:'Video views',vals:vv.series,color:'#5B8DEF'},{name:'3-second views',vals:v3.series,color:'#9DB9F5',w:1.8}],area:true,aria:'Facebook video'})}</div>`
      :need(D.fb,['vv','v3','vt'],'Video views, 3-second views and watch time','Meta Organic',['video_views','video_views_3s','video_watch_time_minutes']);
    x+=`<h3 class="st">Link clicks</h3>`;
    x+=anyIn(D.fb,'lc')?`<div class="kg">${kc({l:'Link clicks',v:full(lc.cur),p:pill(lc.d,{tip:cmpTip(lc)}),c:'var(--fb)',s:spark(lc.series,'#5B8DEF')})}
        ${kc({l:'Link clicks per 1,000 views',v:fbV.cur&&has(lc.cur)?(lc.cur/fbV.cur*1000).toFixed(2):'-',p:'',c:'var(--fb)',n:'How often a view leads off Facebook.'})}</div>`
      :need(D.fb,['lc'],'Link clicks','Meta Organic',['link_clicks']);
    const fp=postsIn(D.fbPosts);
    x+=`<h3 class="st">Posts <small>Published in these dates, with lifetime totals</small></h3>`;
    x+=D.fbPosts.length?(fp.length?`${byFormat(fp,'v')}<div style="margin-top:14px">${bestWorstPosts(fp,'v',[{h:'Views',k:'v'},{h:'Reactions',k:'re'},{h:'Comments',k:'cm'},{h:'Shares',k:'sh'},{h:'Saves',k:'sv'},{h:'Link clicks',k:'lc'},{h:'Video views',k:'vv'},{h:'Avg watch',k:'aw',f:p=>secs(p.aw)}],'Post')}</div>`:'')
      :waiting('Post-level and video-level metrics','Facebook Posts',['post_id','published','type','message','url','views','reactions','comments','shares','saves','link_clicks','video_views','video_views_3s','watch_time_minutes','avg_watch_time_seconds'],'Not live yet; the content snapshot above covers 10 Aug to 6 Sep. Add one row per post and the best and weakest content is ranked for any dates.');
    x=x.replace(/<h3 class="st">(?:(?!<\/h3>)[\s\S])*<\/h3>(?=\s*(?:<h3|$))/g,'');
    P.facebook+=x; }

  const igP=(D.igPosts||[]).filter(p=>W&&p.d>=W.cs&&p.d<=W.end&&!/story/i.test(p.ty||'')), igPp=(D.igPosts||[]).filter(p=>W&&p.d>=W.ps&&p.d<=W.pe&&!/story/i.test(p.ty||''));
  const igSum=(a,k)=>a.reduce((t,p)=>t+(p[k]||0),0), igInt=a=>a.reduce((t,p)=>t+igI(p),0);
  P.instagram=`${ph('Instagram','Reach, follows, posts and reels, live from the reporting sheet.',rng(igR.w))}
    <h3 class="st" style="margin-top:0">Account <small>Every Instagram figure for these dates</small></h3>
    <div class="kg">
      ${igP.length?kc({l:'Views',v:abbr(igSum(igP,'v')),p:igPp.length?pill(chg(igSum(igP,'v'),igSum(igPp,'v'))):'',c:'var(--ig)',n:`From the ${full(igP.length)} posts and reels published in these dates.`}):''}
      ${igP.length?kc({l:'Interactions',v:abbr(igInt(igP)),p:igPp.length?pill(chg(igInt(igP),igInt(igPp))):'',c:'var(--ig)',n:`${pct(igSum(igP,'v')?igInt(igP)/igSum(igP,'v')*100:null,2)} of views. Instagram\u2019s own total: likes, comments, saves, shares and more.`}):''}
      ${kc({l:'Reach, summed daily',v:abbr(igR.cur),p:pill(igR.d,{tip:cmpTip(igR,abbr)}),c:'var(--ig)',s:spark(igR.series,'#D66BA0')})}
      ${kc({l:'Average daily reach',v:igR.cd?full(igR.cur/igR.cd):'-',p:'',c:'var(--ig)',n:`${igR.cd} of ${N} days reported.`})}
      ${has(igF.cur)?kc({l:`Followers on ${dS(igF.day||igF.asOf||(igF.w&&igF.w.end)||W.end)}`,v:full(igF.cur),p:has(igF.prev)?`<span class="pill ${igF.cur-igF.prev>=0?'up':'down'}">${sgn(igF.cur-igF.prev)} in these dates</span>`:'',c:'var(--ig)',n:igF.fromHistory?`${igF.fromSnap?'Instagram\u2019s own count.':'From the daily follower history.'}`:igF.asOf?(igF.live?'Account total, live from Instagram.':`Account total, ${dS(igF.asOf)}.`):has(igF.prev)?`${sgn(igF.cur-igF.prev)} in the period.`:'Account total.',s:igF.series?spark(igF.series,'#D66BA0','level'):''}):''}
      ${kc({l:'New follows',v:full(igNF.cur),p:pill(igNF.d,{tip:cmpTip(igNF)}),c:'var(--ig)',s:spark(igNF.series,'#D66BA0')})}
      ${igLost&&has(igLost.cur)?kc({l:'Followers lost',v:full(igLost.cur),p:pill(igLost.d,{invert:true,tip:cmpTip(igLost)}),c:'var(--ig)',n:'People who unfollowed.'}):''}
      ${igNet&&has(igNet.cur)?kc({l:'Net new followers',v:sgn(igNet.cur),p:'',c:'var(--ig)',n:'New follows minus unfollows.'}):''}
      ${kc({l:'Follows per 10,000 reached',v:igR.cur?(igNF.cur/igR.cur*1e4).toFixed(1):'-',p:'',c:'var(--ig)',n:'How well reach turns into followers.'})}
      <!--IGMORE-->
    </div>
    ${''}
    <h3 class="st">Live, day by day <small>Follows your dates</small></h3>
    <div class="card"><h4>Reach per day</h4><p class="cs">Thin line daily, thick line 7-day average.</p>${chart({dates:days(igR.w.cs,igR.w.end),series:[{name:'Reach',vals:igR.series,color:'#D66BA0'}],area:true,ma:true,aria:'Instagram reach'})}</div>
    <div class="g2" style="margin-top:16px">
      <div class="card"><h4>${igLost?'Followers gained and lost per day':'New follows per day'}</h4>${chart({dates:days(igNF.w.cs,igNF.w.end),series:[{name:'Gained',vals:igNF.series,color:'#D66BA0'},...(igLost?[{name:'Lost',vals:igLost.series,color:'#8A8A90'}]:[])],type:'bar',h:220,aria:'Instagram followers gained and lost'})}</div>
      ${IGFOL&&igF.series?`<div class="card"><h4>Followers over time</h4><p class="cs">Worked out from each day\u2019s gains and losses.</p>${chart({dates:days(igF.w.cs,igF.w.end),series:[{name:'Followers',vals:igF.series,color:'#D66BA0'}],level:true,peak:false,h:220,aria:'Instagram followers over time'})}</div>`:''}
    </div>
    <h3 class="st">Strongest and weakest days</h3>${bw(D.ig,'r',igR.w,[{h:'Reach',f:r=>abbr(r.r)},{h:'New follows',f:r=>full(r.nf)}],'#D66BA0','reach')}`;


  /* ---------- Instagram: every figure joins the Account section; charts and tables stay below ---------- */
  { const v=st(D.ig,'v'), l=st(D.ig,'l'), cm=st(D.ig,'cm'), sv=st(D.ig,'sv'), sh=st(D.ig,'sh'), pv=st(D.ig,'pv'), lt=st(D.ig,'lt'), ae=st(D.ig,'ae');
    const dts=days(W.cs,W.end); let more='', x='';
    const real=val=>has(val)&&val!==0;   /* a card appears only when it has a real figure */
    const K=o=>kc({p:'',c:'var(--ig)',...o});
    /* engagement from the daily Instagram tab, if it ever carries these columns */
    if(real(l.cur)) more+=K({l:'Likes',v:full(l.cur),p:pill(l.d,{tip:cmpTip(l)})});
    if(real(cm.cur)) more+=K({l:'Comments',v:full(cm.cur),p:pill(cm.d,{tip:cmpTip(cm)})});
    if(real(sv.cur)||real(sh.cur)) more+=K({l:'Saves and shares',v:`${full(sv.cur)} / ${full(sh.cur)}`,n:'Saves, then shares.'});
    /* profile activity: daily figures when the Instagram tab has them, otherwise Instagram's monthly account totals */
    const IA=W?acctTotals(W.cs,W.end):null, dailyP=anyIn(D.ig,'pv')||anyIn(D.ig,'lt')||anyIn(D.ig,'ae');
    if(dailyP){ if(real(pv.cur)) more+=K({l:'Profile visits',v:full(pv.cur),p:pill(pv.d,{tip:cmpTip(pv)}),n:'Times the profile was viewed.'});
      if(real(lt.cur)) more+=K({l:'Link taps',v:full(lt.cur),p:pill(lt.d,{tip:cmpTip(lt)}),n:'Taps on the link in the bio.'});
      if(real(ae.cur)) more+=K({l:'Accounts engaged',v:full(ae.cur),p:pill(ae.d,{tip:cmpTip(ae)}),n:'Summed daily.'}); }
    else if(IA){ if(real(IA.pv)) more+=K({l:'Profile visits',v:full(Math.round(IA.pv)),n:IA.est?'Times the profile was viewed. Months partly outside these dates are counted by their share of days.':'Times the profile was viewed.'});
      if(real(IA.lc)) more+=K({l:'Link taps',v:full(Math.round(IA.lc)),n:'Taps on the link in the bio.'});
      if(real(IA.ae)) more+=K({l:'Accounts engaged',v:full(Math.round(IA.ae))}); }
    /* reels, reposts and stories: those published in these dates */
    const ip=postsIn(D.igPosts), reels=ip.filter(p=>/reel/i.test(p.ty||'')), feed=ip.filter(p=>!/story/i.test(p.ty||'')), stories=ip.filter(p=>/story/i.test(p.ty||''));
    const tot=(a,k)=>a.reduce((t,p)=>t+(has(p[k])?p[k]:0),0);
    if(reels.length){ more+=K({l:'Reels published',v:full(reels.length)});
      if(real(tot(reels,'v'))) more+=K({l:'Reel plays',v:abbr(tot(reels,'v')),n:`${full(tot(reels,'v')/reels.length)} per reel.`});
      if(real(tot(reels,'wt'))) more+=K({l:'Reel watch time',v:full(tot(reels,'wt')/60)+' h',tip:'Total hours of reels watched, for reels published in these dates.'});
      const aw=wAvg(reels,'aw','v'); if(real(aw)) more+=K({l:'Average reel watch time',v:secs(aw),n:'Weighted by plays.'});
      const sk=reels.filter(p=>has(p.skr)); if(sk.length){ const skr=wAvg(sk,'skr','v'); if(has(skr)) more+=K({l:'Reels skip rate',v:pct(skr,1),n:`Share of plays scrolled past in the first 3 seconds, weighted by plays (${full(sk.length)} reels).`}); } }
    { const rp=ip.filter(p=>has(p.rpo)); if(rp.length&&real(tot(rp,'rpo'))) more+=K({l:'Reposts',v:full(tot(rp,'rpo')),n:`Of the ${full(rp.length)} posts and reels with repost figures.`}); }
    if(stories.length){ more+=K({l:'Stories posted',v:full(stories.length)});
      if(real(tot(stories,'v'))) more+=K({l:'Story views',v:abbr(tot(stories,'v')),n:`${full(tot(stories,'v')/stories.length)} per story.`});
      if(real(tot(stories,'rp'))) more+=K({l:'Story replies',v:full(tot(stories,'rp'))});
      if(real(tot(stories,'lc'))) more+=K({l:'Link sticker taps',v:full(tot(stories,'lc'))});
      if(real(tot(stories,'ex'))&&tot(stories,'v')) more+=K({l:'Story exit rate',v:pct(tot(stories,'ex')/tot(stories,'v')*100,1),n:'Exits divided by views.'}); }
    P.instagram=P.instagram.replace('<!--IGMORE-->\n    </div>',more+'\n    </div>'+(IGFOL?growthCard(IGFOL.rows,'ft','Follower growth','followers'):''));
    /* below the figures: the detail */
    if(anyIn(D.ig,'v')) x+=`<div class="card" style="margin-top:16px"><h4>Views per day</h4>${chart({dates:dts,series:[{name:'Views',vals:v.series,color:'#D66BA0'},{name:'Reach',vals:igR.series,color:'#E9A6C8',w:1.6}],area:true,aria:'Instagram views'})}</div>`;
    if(!dailyP&&IA&&real(IA.pv)){ const per=(D.igAcct||[]).filter(r=>r.to>=W.cs&&r.from<=W.end), mx=Math.max(...per.map(r=>r.pv||0),1);
      x+=`<h3 class="st">Profile visits by month</h3>
      <div class="card"><p class="cs">As Instagram reports them.</p>${(()=>{ const hasC=k=>per.some(r=>has(r[k])); const extra=[['lc','Link taps'],['ti','Interactions'],['fo','Follows']].filter(([k])=>hasC(k));
          return `<div class="tw" style="box-shadow:none"><table style="min-width:0"><thead><tr><th style="text-align:left">Period</th><th>Profile visits</th>${extra.map(([,h])=>`<th>${h}</th>`).join('')}</tr></thead><tbody>
        ${per.map(r=>`<tr><td style="text-align:left">${dS(r.from)} to ${dS(r.to)}</td><td class="dbar"><span>${full(r.pv)}</span><i style="width:${Math.max(4,(r.pv||0)/mx*100)}%;background:linear-gradient(90deg,${hexA('#D66BA0',.45)},#D66BA0)"></i></td>${extra.map(([k])=>`<td>${full(r[k])}</td>`).join('')}</tr>`).join('')}`; })()}
        </tbody></table></div></div>`; }
    if(feed.length) x+=`<h3 class="st">Posts and reels</h3>${byFormat(feed,'v')}<div style="margin-top:14px">${bestWorstPosts(feed,'v',[{h:'Views',k:'v'},{h:'Reach',k:'r'},{h:'Likes',k:'l'},{h:'Comments',k:'cm'},{h:'Saves',k:'sv'},{h:'Shares',k:'sh'},{h:'Profile visits',k:'pv'},{h:'Follows',k:'fo'}],'Post')}</div>`;
    P.instagram+=x; }
  const ytA=(()=>{ const rs=inR(D.yt,ytV.w.cs,ytV.w.end); let a=0,b=0; rs.forEach(r=>{ if(has(r.a)&&has(r.v)){a+=r.a*r.v;b+=r.v;} }); return b?a/b:null; })();
  const ytE=(ytL.cur||0)+(ytC.cur||0)+(ytS.cur||0);
  const snapRows=D.ytSnap.map((s,i)=>{ const p=i?D.ytSnap[i-1]:null; return `<tr><td>${dL(s.d)}</td><td><b>${full(s.subs)}</b></td><td>${p?`<span class="pc ${s.subs>=p.subs?'up':'down'}">${sgn(s.subs-p.subs)}</span>`:'-'}</td><td>${full(s.views)}</td><td>${p?sgn(s.views-p.views):'-'}</td><td>${full(s.vids)}</td></tr>`; }).join('');
  P.youtube=`${ph('YouTube','Views, watch time and subscriber growth for the channel.',rng(ytV.w))}
    <div class="kg">
      ${kc({l:'Views',v:abbr(ytV.cur),p:pill(ytV.d,{tip:cmpTip(ytV,abbr)}),c:'var(--yt)',s:spark(ytV.series,'#E5654F')})}
      ${kc({l:'Watch time',v:has(ytM.cur)?full(ytM.cur/60)+' h':'-',p:pill(ytM.d),c:'var(--yt)',s:spark(ytM.series,'#E5654F')})}
      ${kc({l:'Subscribers',v:full(lastSnap.subs),p:'',c:'var(--yt)',n:`Channel total, ${dS(lastSnap.d)}. ${sgn(ytNet)} net in the period.`})}
      ${kc({l:'Engagement rate',v:ytV.cur?pct(ytE/ytV.cur*100,2):'-',p:'',c:'var(--yt)',n:'Likes, comments and shares per view.'})}
      ${kc({l:'Likes',v:full(ytL.cur),p:pill(ytL.d,{tip:cmpTip(ytL)}),c:'var(--yt)'})}
      ${kc({l:'Shares',v:full(ytS.cur),p:pill(ytS.d,{tip:cmpTip(ytS)}),c:'var(--yt)'})}
      ${kc({l:'Subscribers gained and lost',v:`${full(ytSG.cur)} / ${full(ytSL.cur)}`,p:pill(ytSG.d,{tip:cmpTip(ytSG)}),c:'var(--yt)',n:`${ytSG.cur?(ytSL.cur/ytSG.cur*100).toFixed(0):'-'} lost for every 100 gained.`})}
      ${kc({l:'Average view duration',v:has(ytA)?(ytA>=60?Math.floor(ytA/60)+'m '+String(Math.round(ytA%60)).padStart(2,'0')+'s':Math.round(ytA)+'s'):'-',p:'',c:'var(--yt)',n:'Weighted by daily views.'})}
    </div>
    ${YTFOL?growthCard(YTFOL.rows,'ft','Subscriber growth','subscribers'):''}
    ${gapNote(D.yt,ytV.w,'YouTube')}
    <div class="card" style="margin-top:16px"><h4>Views per day</h4><p class="cs">Thin line daily, thick line 7-day average.</p>${chart({dates:days(ytV.w.cs,ytV.w.end),series:[{name:'Views',vals:ytV.series,color:'#E5654F'}],area:true,ma:true,aria:'YouTube views'})}</div>
    <div class="g2" style="margin-top:16px">
      <div class="card"><h4>Subscribers gained and lost per day</h4>${chart({dates:days(ytSG.w.cs,ytSG.w.end),series:[{name:'Gained',vals:ytSG.series,color:'#E5654F'},{name:'Lost',vals:ytSL.series,color:'#8E3A2C'}],type:'bar',h:240,aria:'YouTube subscribers'})}</div>
      <div class="card"><h4>This period against the last</h4><p class="cs">Views, dashed line is the previous ${N} days.</p>${hasPrev?chart({dates:days(ytV.w.cs,ytV.w.end),series:[{name:'This period',vals:ytV.series,color:'#E5654F'},{name:'Previous period',vals:prevS(D.yt,'v',ytV.w),color:'#E5654F',dash:true,op:.45,w:1.6}],h:240,peak:false,aria:'YouTube comparison'}):noPrev}</div>
    </div>
    <h3 class="st">Channel totals <small>As YouTube reports them</small></h3>
    <div class="tw"><table><thead><tr><th>Date</th><th>Subscribers</th><th>Change</th><th>Total views</th><th>Change</th><th>Videos</th></tr></thead><tbody>${snapRows}</tbody></table></div>`;


  /* ---------- YouTube: new data points ---------- */
  { const useReach=!anyIn(D.yt,'im')&&anyIn(D.ytReach||[],'im'); const ev=st(D.yt,'ev'), im=st(useReach?D.ytReach:D.yt,'im'); const rs=inR(D.yt,W.cs,W.end);
    const ctr=useReach?wAvg(inR(D.ytReach,W.cs,W.end),'ctr','im'):wAvg(rs,'ctr','im'), apv=wAvg(rs,'ap','v'), stw=wAvg(rs,'stw','v'); const dts=days(W.cs,W.end); let x='';
    x+=`<h3 class="st">Discovery and attention</h3>`;
    x+=(anyIn(D.yt,'im')||useReach||anyIn(D.yt,'ev')||anyIn(D.yt,'ap')||anyIn(D.yt,'stw'))?`<div class="kg">
        ${kc({l:'Thumbnail impressions',v:abbr(im.cur),p:pill(im.d,{tip:cmpTip(im,abbr)}),c:'var(--yt)',s:spark(im.series,'#E5654F')})}
        ${kc({l:'Impressions click-through',v:pct(ctr,2),p:'',c:'var(--yt)',n:'Share of impressions that became a view.'})}
        ${kc({l:'Engaged views',v:abbr(ev.cur),p:pill(ev.d,{tip:cmpTip(ev,abbr)}),c:'var(--yt)'})}
        ${kc({l:'Average % viewed',v:pct(apv,1),p:'',c:'var(--yt)',n:'Weighted by views.'})}
        ${has(stw)?kc({l:'Stayed to watch',v:pct(stw,1),p:'',c:'var(--yt)',n:'Share of viewers who kept watching a Short instead of swiping away. Weighted by views.'}):''}</div>
      <div class="card" style="margin-top:16px"><h4>Impressions and engaged views per day</h4>${chart({dates:dts,series:[{name:'Impressions',vals:im.series,color:'#E5654F'},{name:'Engaged views',vals:ev.series,color:'#F2A493',w:1.8}],area:true,aria:'YouTube discovery'})}</div>`
      :need(D.yt,['im','ev','ap','stw'],'Thumbnail impressions, engaged views, average % viewed and stayed to watch','YouTube Daily',['impressions','impressions_ctr','engaged_views','average_view_percentage','stayed_to_watch']);
    const vp=postsIn(D.ytVideos);
    x+=`<h3 class="st">Videos <small>Published in these dates, with ${D.ytVideosAsOf?'totals up to '+dL(D.ytVideosAsOf):'lifetime totals'}</small></h3>`;
    x+=D.ytVideos.length?(vp.length?`${byFormat(vp,'v')}<div style="margin-top:14px">${bestWorstPosts(vp,'v',[{h:'Views',k:'v'},{h:'Watch time',k:'wt',f:p=>has(p.wt)?full(p.wt/60)+' h':'-'},{h:'Avg view',k:'ad',f:p=>secs(p.ad)},{h:'Avg % viewed',k:'ap',f:p=>pct(p.ap,1)},{h:'Engaged views',k:'ev'},{h:'Engaged rate',k:'er',f:p=>pct(p.er,1)},{h:'Impressions',k:'im'},{h:'CTR',k:'ctr',f:p=>pct(p.ctr,1)},{h:'Stayed',k:'stw',f:p=>pct(p.stw,0)},{h:'Subscribers',k:'sg',f:p=>has(p.sg)?`+${full(p.sg)}${has(p.sl)?' / \u2212'+full(p.sl):''}`:'-'}],'Video')}</div>`:'')
      :waiting('Video-level views, watch time and best versus weakest videos','YouTube Videos',['video_id','published','type','title','url','views','watch_time_minutes','avg_view_duration_seconds','avg_view_percentage','engaged_views','impressions','impressions_ctr','stayed_to_watch'],'One row per video, so every video can be ranked.');
    x=x.replace(/<h3 class="st">(?:(?!<\/h3>)[\s\S])*<\/h3>(?=\s*(?:<h3|$))/g,'');
    P.youtube+=x; }
  const emptyP=(n,c,b,w)=>`${ph(n,'Not connected to the reporting sheet.')}
    <div class="empty"><h4>No ${n} data yet</h4><p>Once ${n} reaches the sheet this page will show ${w}.</p><div class="blk"><b>What is blocking it</b><p>${b}</p></div></div>`;

  /* ---------- X and TikTok pages: live from the sheet, earlier manual snapshots kept below ---------- */
  const snapBlock=(k,name,color)=>{ const S=SNAP[k]; return `<div data-snap="1"><h3 class="st">Earlier manual snapshot <small>${snapRange(k)}</small></h3>
    <div class="snapnote"><div><b>Collected by hand, ${snapRange(k)}</b><p>These came from ${S.src} before ${name} was in the reporting sheet. They're fixed and kept for comparison; the live figures above update by themselves.</p></div></div>
    <div class="kg">${S.cards.map(c=>snapCard(c,color)).join('')}</div></div>`; };
  if(XP.length||XA.length){
    const la=XA[XA.length-1]||{}; const tot=k=>xTot(xIn,k);
    const med=(()=>{ const v=xIn.map(p=>p.im).sort((a,b)=>a-b); if(!v.length) return null; const m=Math.floor(v.length/2); return v.length%2?v[m]:(v[m-1]+v[m])/2; })();
    const posts=xIn.map(p=>({...p,v:p.im,u:xUrl(p.id),ty:'Post',er:p.im?p.e/p.im*100:null}));
    P.x=`${ph('X',`Posts, impressions and engagement${HANDLE.x?' from @'+esc(String(HANDLE.x).replace(/^@/,'')):''}, live from the workbook.`,rng(W))}
      <div class="kg">
        ${kc({l:'Followers',v:full(xF.cur),p:'',c:'var(--x)',n:xF.asOf?`On ${dL(xF.asOf)}. ${full(la.pc)} posts all time.`:''})}
        ${kc({l:'Posts published',v:full(xIn.length),p:xPrev.length?pill(chg(xIn.length,xPrev.length)):'',c:'var(--x)',n:'In these dates.'})}
        ${kc({l:'Impressions',v:abbr(xIm),p:xPrev.length?pill(chg(xIm,xImP)):'',c:'var(--x)',s:xByDay.some(has)?spark(xByDay,'#B9B9C0'):''})}
        ${kc({l:'Engagements',v:full(xE),p:'',c:'var(--x)',n:`${full(tot('rep'))} replies and ${full(tot('b'))} bookmarks.`})}
        ${kc({l:'Engagement rate',v:xIm?pct(xE/xIm*100,2):'-',p:'',c:'var(--x)',tip:'Engagements divided by impressions, for posts published in these dates.'})}
        ${kc({l:'Median impressions per post',v:full(med),p:'',c:'var(--x)',n:xIn.length?`The average is ${full(xIm/xIn.length)}, pulled up by a few big posts.`:''})}
        ${kc({l:'Likes',v:full(tot('l')),p:'',c:'var(--x)'})}
        ${kc({l:'Reposts and quotes',v:full(tot('rp')+tot('q')),p:'',c:'var(--x)',n:`${full(tot('rp'))} reposts, ${full(tot('q'))} quotes.`})}
      </div>
      ${xIn.length?`<div class="card" style="margin-top:16px"><h4>Impressions by the day a post went out</h4><p class="cs">Each post's lifetime impressions, counted on the day it was published.</p>${chart({dates:days(W.cs,W.end),series:[{name:'Impressions',vals:xByDay,color:'#B9B9C0'}],type:'bar',peak:true,aria:'X impressions by day posted'})}</div>
      <h3 class="st">Posts <small>Published in these dates, with lifetime figures</small></h3>
      ${bestWorstPosts(posts,'v',[{h:'Impressions',k:'v'},{h:'Likes',k:'l'},{h:'Reposts',k:'rp'},{h:'Replies',k:'rep'},{h:'Bookmarks',k:'b'},{h:'Engagements',k:'e'},{h:'Rate',k:'er',f:p=>pct(p.er,2)}],'Post')}`:'<p class="note">No X posts were published in these dates.</p>'}
      <p class="note">The sheet has X posts from ${dL(XP[0]&&XP[0].d)}. X doesn't report daily account impressions here, so figures are per post.</p>
`;
  } else P.x=`${ph('X','Posts, impressions and engagement.','')}<div class="empty"><h4>X data appears here once the reporting sheet is read</h4><p>It comes from the X tab in your workbook (see Connect data).</p></div>`;
  if(TA.length||TV.length){
    const a=TA[TA.length-1]||{};
    const mx=Math.max(...TV.map(v=>v.v),1);
    P.tiktok=`${ph('TikTok',`${HANDLE.tiktok?'@'+esc(String(HANDLE.tiktok).replace(/^@/,''))+', l':'L'}ive from the workbook.`,a.d?'As of '+dL(a.d):'')}
      <div class="kg">
        ${kc({l:'Followers',v:full(a.f),p:'',c:'var(--tt)',n:a.d?`On ${dL(a.d)}.`:''})}
        ${kc({l:'Likes, all time',v:full(a.h),p:'',c:'var(--tt)',n:'Across every video.'})}
        ${kc({l:'Plays on the latest videos',v:full(a.v),p:'',c:'var(--tt)',n:`Across the ${TV.length} most recent videos.`})}
        ${kc({l:'Average plays per video',v:TV.length?full(a.v/TV.length):'-',p:'',c:'var(--tt)',n:TV.length?`Median ${full([...TV].sort((x,y)=>x.v-y.v)[Math.floor(TV.length/2)].v)}.`:''})}
      </div>
      ${TA.length>1?`<div class="card" style="margin-top:16px"><h4>Followers over time</h4>${chart({dates:days(TA[0].d,TA[TA.length-1].d),series:[{name:'Followers',vals:days(TA[0].d,TA[TA.length-1].d).map(d=>{ const r=TA.find(x=>x.d===d); return r?r.f:null; }),color:'#5CC8D6'}],area:true,aria:'TikTok followers'})}</div>`:''}
      ${(()=>{ const W2=TV.filter(v=>has(v.wt)||has(v.aw)||has(v.cr)); if(!W2.length) return '';
        const wsum=W2.reduce((a,v)=>a+(v.wt||0),0), wav=(k)=>{ const x=W2.filter(v=>has(v[k])&&v.v); const pw=x.reduce((a,v)=>a+v.v,0); return pw?x.reduce((a,v)=>a+v[k]*v.v,0)/pw:null; };
        const aw=wav('aw'), cr=wav('cr');
        return `<h3 class="st">Watch time <small>Latest videos</small></h3><div class="kg">
          ${kc({l:'Watch time',v:wsum?(wsum/60>=10?full(wsum/60)+' hrs':(wsum/60).toFixed(1)+' hrs'):'-',p:'',c:'var(--tt)',n:`Across ${W2.length} videos.`})}
          ${kc({l:'Average watch time',v:has(aw)?aw.toFixed(1)+'s':'-',p:'',c:'var(--tt)',n:'Per play, weighted by plays.'})}
          ${kc({l:'Completion rate',v:has(cr)?pct(cr,1):'-',p:'',c:'var(--tt)',n:'Share of plays watched to the end, weighted by plays.'})}
          ${kc({l:'Watch time per play',v:wsum&&W2.reduce((a,v)=>a+v.v,0)?(wsum*60/W2.reduce((a,v)=>a+v.v,0)).toFixed(1)+'s':'-',p:'',c:'var(--tt)'})}</div>`; })()}
      <h3 class="st">Latest videos <small>Plays so far</small></h3>
      <div class="tw"><table class="ctab" style="min-width:0"><thead><tr><th style="width:34px;text-align:left">#</th><th>Video</th><th>Plays</th>${TV.some(v=>has(v.aw))?'<th>Avg watch</th>':''}${TV.some(v=>has(v.cr))?'<th>Completion</th>':''}${TV.some(v=>has(v.wt))?'<th>Watch time</th>':''}</tr></thead><tbody>
        ${TV.map((v,i)=>`<tr${i===0?' class="top1"':''}><td>${rankB(i)}</td><td class="ptitle">${ttUrl(v.id)?`<a href="${esc(ttUrl(v.id))}" target="_blank" rel="noopener">${esc(v.t)}</a>`:esc(v.t)}</td><td class="dbar"><span>${full(v.v)}</span><i style="width:${Math.max(4,v.v/mx*100)}%;background:linear-gradient(90deg,${hexA('#5CC8D6',.45)},#5CC8D6)"></i></td>${TV.some(x=>has(x.aw))?`<td>${has(v.aw)?v.aw.toFixed(1)+'s':'-'}</td>`:''}${TV.some(x=>has(x.cr))?`<td>${has(v.cr)?pct(v.cr,1):'-'}</td>`:''}${TV.some(x=>has(x.wt))?`<td>${has(v.wt)?full(v.wt)+' min':'-'}</td>`:''}</tr>`).join('')}
      </tbody></table></div>
      <p class="note">The sheet started collecting TikTok on ${dL(TA[0]&&TA[0].d)}, so there's no daily history yet. Follower growth and trends build up as it collects each day. These figures don't change with the date picker.</p>
`;
  } else P.tiktok=`${ph('TikTok','Followers, plays and videos.','')}<div class="empty"><h4>TikTok data appears here once the reporting sheet is read</h4><p>It comes from the TikTok tab in your workbook (see Connect data).</p></div>`;


  /* ---------- website ---------- */
  const chW=win(D.webCh); const chAgg={}, chPrev={};
  if(chW){ D.webCh.forEach(r=>{ if(r.d>=chW.cs&&r.d<=chW.end) chAgg[r.c]=(chAgg[r.c]||0)+r.s; else if(r.d>=chW.ps&&r.d<=chW.pe) chPrev[r.c]=(chPrev[r.c]||0)+r.s; }); }
  const chList=Object.keys(chAgg).sort((a,b)=>chAgg[b]-chAgg[a]); const chTot=chList.reduce((t,c)=>t+chAgg[c],0);
  const chCol=['#3FB5A8','#5B8DEF','#D9A857','#D66BA0','#9D86E9','#5BBF7A','#E5654F','#A7B0BC','#6B6B70'];
  const avgDur=(()=>{ const rs=inR(D.web,web.s.w.cs,web.s.w.end); let a=0,b=0; rs.forEach(r=>{ if(has(r.dur)&&has(r.s)){a+=r.dur*r.s;b+=r.s;} }); return b?a/b:null; })();
  P.website=`${ph('Website',`Traffic to ${esc(SITE)} from Google Analytics.`,rng(web.s.w))}
    <div class="kg">
      ${kc({l:'Sessions',v:full(web.s.cur),p:pill(web.s.d,{tip:cmpTip(web.s)}),c:'var(--web)',s:spark(web.s.series,'#3FB5A8')})}
      ${kc({l:'Users',v:full(web.u.cur),p:pill(web.u.d,{tip:cmpTip(web.u)}),c:'var(--web)',s:spark(web.u.series,'#3FB5A8')})}
      ${kc({l:'New users',v:full(web.n.cur),p:pill(web.n.d,{tip:cmpTip(web.n)}),c:'var(--web)',n:`${web.u.cur?pct(web.n.cur/web.u.cur*100,0):'-'} of users are new.`})}
      ${kc({l:'Engaged sessions',v:web.s.cur?pct(web.es.cur/web.s.cur*100,1):'-',p:'',c:'var(--web)',n:`${full(web.es.cur)} sessions with real engagement.`})}
      ${kc({l:'Page views',v:full(web.pv.cur),p:pill(web.pv.d,{tip:cmpTip(web.pv)}),c:'var(--web)',n:`${web.s.cur?(web.pv.cur/web.s.cur).toFixed(2):'-'} pages per session.`})}
      ${kc({l:'Average session',v:has(avgDur)?Math.floor(avgDur/60)+'m '+String(Math.round(avgDur%60)).padStart(2,'0')+'s':'-',p:'',c:'var(--web)',n:'Weighted by sessions.'})}
      ${kc({l:'Conversions',v:full(web.cv.cur),p:pill(web.cv.d),c:'var(--web)'})}
      ${kc({l:'Revenue',v:usd(web.rev.cur),p:'',c:'var(--web)',n:'Recorded in Google Analytics.'})}
    </div>
    ${gapNote(D.web,web.s.w,'Website')}
    <div class="card" style="margin-top:16px"><h4>Sessions and users per day</h4>${chart({dates:days(web.s.w.cs,web.s.w.end),series:[{name:'Sessions',vals:web.s.series,color:'#3FB5A8'},{name:'Users',vals:web.u.series,color:'#5B8DEF',op:.8,w:1.8}],area:true,aria:'Website traffic'})}</div>
    <div class="g2" style="margin-top:16px">
      <div class="card"><h4>Where visitors come from</h4><p class="cs">Share of ${full(chTot)} sessions by channel. Google Analytics reports channels separately, so this can differ slightly from the session total.</p>
        ${(()=>{ const top=chList.slice(0,6).map((c,i)=>({l:c,v:chAgg[c],c:chCol[i],s:full(chAgg[c])+' sessions'})), rest=chList.slice(6), rv=rest.reduce((t,c)=>t+chAgg[c],0);
          /* every channel counts toward the total, so the shares match the table; the smallest are grouped as Other */
          return donut(rv>0?[...top,{l:`Other (${rest.length} channel${rest.length>1?'s':''})`,v:rv,c:'#6B6B70',s:full(rv)+' sessions'}]:top); })()}</div>
      ${(()=>{ const cmp=chList.some(c=>has(chg(chAgg[c],chPrev[c])));   /* no earlier data (e.g. all time): no change column */
        return `<div class="card"><h4>${cmp?'Channel change':'Sessions by channel'}</h4><p class="cs">${cmp?`Sessions against the previous ${N} days.`:'There is no earlier period in the sheet to compare these dates with.'}</p>
        <div class="tw" style="box-shadow:none"><table style="min-width:0"><thead><tr><th>Channel</th><th>Sessions</th><th>Share</th>${cmp?'<th>Change</th>':''}</tr></thead><tbody>
        ${chList.map(c=>{ const d=chg(chAgg[c],chPrev[c]); return `<tr><td>${esc(c)}</td><td><b>${full(chAgg[c])}</b></td><td>${pct(chAgg[c]/chTot*100,1)}</td>${cmp?`<td>${has(d)?`<span class="pc ${d>=0?'up':'down'}">${d>0?'+':''}${d.toFixed(0)}%</span>`:'-'}</td>`:''}</tr>`; }).join('')}`; })()}
        </tbody></table></div></div>
    </div>`;

  /* ---------- paid ads ---------- */
  const adIn=inR(D.ads,W.cs,W.end);
  const adsR={sp:sum(adIn,'sp'),im:sum(adIn,'im'),cl:sum(adIn,'cl'),rc:sum(adIn,'rc'),lc:sum(adIn,'lc'),lp:sum(adIn,'lp'),ai:sum(adIn,'ai')};
  const adsActiveAll=D.ads.filter(r=>(r.sp||0)>0||(r.im||0)>0);
  const adsActiveIn=adIn.filter(r=>(r.sp||0)>0||(r.im||0)>0);
  const camp=adsActiveAll.length?{from:adsActiveAll[0].d,to:adsActiveAll[adsActiveAll.length-1].d}:null;
  const ctr=adsR.im?adsR.cl/adsR.im*100:null, cpm=adsR.im?adsR.sp/adsR.im*1000:null, cpc=adsR.cl?adsR.sp/adsR.cl:null, cpi=adsR.ai?adsR.sp/adsR.ai:null;
  const adDates=days(W.cs,W.end), adBd=byDate(D.ads);
  const adSer=k=>adDates.map(d=>{ const r=adBd.get(d); return r&&has(r[k])?r[k]:null; });
  P.ads=adsActiveIn.length?`${ph('Paid ads','Meta advertising across Facebook and Instagram in the selected dates.',rng(W))}
    ${adsLast&&adsLast.d<W.end?`<div class="co watch"><h4>Last paid spend was ${dL(adsLast.d)}</h4><p>Nothing was spent after that date, so the later part of this range shows no ad activity.</p></div>`:''}
    <div class="kg">
      ${kc({l:'Total spend',v:usd(adsR.sp),p:'',c:'var(--ads)',n:`${adsActiveIn.length} day${adsActiveIn.length>1?'s':''} with activity in this period.`})}
      ${kc({l:'Impressions',v:abbr(adsR.im),p:'',c:'var(--ads)',n:`${abbr(adsR.rc)} people reached (summed daily).`})}
      ${kc({l:'Clicks',v:full(adsR.cl),p:'',c:'var(--ads)',n:`${full(adsR.lc)} link clicks.`})}
      ${kc({l:'App installs from ads',v:full(adsR.ai),p:'',c:'var(--ads)',n:`${full(adsR.lp)} landing page views.`})}
      ${kc({l:'Cost per 1,000 impressions',v:usd(cpm),p:'',c:'var(--ads)'})}
      ${kc({l:'Click-through rate',v:pct(ctr,2),p:'',c:'var(--ads)',n:'Clicks per impression.'})}
      ${kc({l:'Cost per click',v:usd(cpc),p:'',c:'var(--ads)'})}
      ${kc({l:'Cost per app install',v:usd(cpi),p:'',c:'var(--ads)',n:'Spend divided by attributed installs.'})}
    </div>
    <div class="card" style="margin-top:16px"><h4>Daily spend</h4>${chart({dates:adDates,series:[{name:'Spend',vals:adSer('sp'),color:'#9D86E9'}],type:'bar',fmt:v=>CURSYM+abbr(v),peak:false,aria:'Ad spend'})}</div>
    <div class="g2" style="margin-top:16px">
      <div class="card"><h4>Impressions per day</h4>${chart({dates:adDates,series:[{name:'Impressions',vals:adSer('im'),color:'#9D86E9'}],type:'bar',h:230,peak:false,aria:'Ad impressions'})}</div>
      <div class="card"><h4>App installs from ads per day</h4>${chart({dates:adDates,series:[{name:'Installs',vals:adSer('ai'),color:'#5BBF7A'}],type:'bar',h:230,peak:false,aria:'Ad installs'})}</div>
    </div>`
  :`${ph('Paid ads','Meta advertising across Facebook and Instagram in the selected dates.',rng(W))}
    <div class="empty"><h4>No paid ads ran between ${dS(W.cs)} and ${dL(W.end)}</h4>
      <p>${camp?`Meta campaigns ran from ${dL(camp.from)} to ${dL(camp.to)}, spending ${usd(sum(D.ads,'sp'))} in total.`:'There is no Meta ad data in the sheet.'}</p>
      ${camp?`<button type="button" class="btn" data-range="${camp.from}|${camp.to}">Show the campaign dates</button>`:''}</div>`;


  /* ---------- funnels ---------- */
  const apSubp=st(D.apple,'subp');
  const actDay=(inR(D.play,W.cs,W.end).filter(r=>has(r.act)).slice(-1)[0]||{}).d;
  const dlR=(ap.dl.cur||0)+(ap.rd.cur||0);
  const lifeToEnd=sum(D.play.filter(r=>r.d<=W.end),'i');
  const earnIn=inR(D.earn,W.cs,W.end); const playTx=sum(earnIn,'tx');
  const ytInt=(ytL.cur||0)+(ytC.cur||0)+(ytS.cur||0);
  const reached=(has(fbU.cur)||has(igR.cur))?(fbU.cur||0)+(igR.cur||0):null;
  const revenueR=(ap.rev.cur||0)+(playRev||0)+adsRev+exRevTot;
  const rangeTxt=rng(W);
  const fB=[
    drawFunnel({title:'The whole business',color:'#D9A857',wide:true,sub:rangeTxt,stages:[
      {l:'Social views',v:allViews,f:abbr,n:`Facebook ${abbr(fbV.cur)}, YouTube ${abbr(ytV.cur)}${igHasViews?`, Instagram ${abbr(igViewsCur)}${igDaily?'':' (posts published in these dates)'}`:''}${xIm?`, X ${abbr(xIm)}`:''}${ttV?`, TikTok ${abbr(ttV)}`:''}${exViews.map(x=>`, ${x.name} ${abbr(x.v)}`).join('')}. `},
      {l:'People reached',v:reached,f:abbr,r:{na:'different basis'},n:'Facebook daily viewers plus Instagram reach, added up by day, so returning people count again.'},
      {l:'Website visits',v:web.s.cur,r:{na:'not tracked from social'},n:`${full(web.u.cur)} people visited ${esc(SITE)}. Nothing links a social view to a visit.`},
      {l:'App installs',v:installs,r:{na:'not tracked from the web'},n:`Google Play ${full(pl.i.cur)}, Apple ${full(dlR)}. Includes people coming from search and the stores.`},
      {l:'New subscriptions',v:newSubs,of:'installs',n:`Google Play ${full(pSn.cur||0)} and Apple ${full(newSubs-(pSn.cur||0))}. Apple counts new subscriptions and free trials that turned paid.`},
      {l:'Revenue',v:revenueR,f:usd,r:{na:'total for these dates'},n:hasAds?`Apple ${usd(ap.rev.cur)}, Google Play ${usd(playRev)}, AdMob app ads ${usd(amE.cur||0)} and AdSense website ads ${usd(asd.cur||0)}${exRev.map(x=>`, plus ${x.name} ${usd(x.v)}`).join('')}.`:`Apple proceeds ${usd(ap.rev.cur)} and Google Play ${usd(playRev)}, after store fees.`}]}),
    drawFunnel({title:'Facebook',color:'#5B8DEF',sub:rangeTxt,stages:[
      {l:'Views',v:fbV.cur,f:abbr,n:'Times our content was shown.'},
      {l:'Daily viewers',v:fbU.cur,f:abbr,of:'views',n:'Unique each day, added up across days.'},
      {l:'Engagements',v:fbE.cur,f:abbr,of:'views',n:'Reactions, comments, shares and clicks.'},
      {l:'Page visits',v:fbPV.cur,of:'engagements',n:'Times the Page itself was opened.'},
      {l:'New follows',v:fbNF.cur,of:'page visits',n:`${full(fbF.cur)} followers at ${dS(W.end)}.`}],
      foot:has(fbV.d)?`Views ${fbV.d>=0?'up':'down'} <b>${pct(Math.abs(fbV.d),1)}</b> and engagements ${has(fbE.d)&&fbE.d>=0?'up':'down'} <b>${pct(Math.abs(fbE.d||0),1)}</b> per day on the ${N} days before.`:''}),
    drawFunnel({title:'YouTube',color:'#E5654F',sub:rangeTxt,stages:[
      {l:'Views',v:ytV.cur,f:abbr,n:`${full(ytM.cur/60)} hours watched.`},
      {l:'Interactions',v:ytInt,of:'views',n:`${full(ytL.cur)} likes, ${full(ytC.cur)} comments, ${full(ytS.cur)} shares.`},
      {l:'Subscribers gained',v:ytSG.cur,of:'interactions',n:'New subscribers before any leave.'},
      {l:'Net subscribers',v:ytNet,r:has(ytSG.cur)&&ytSG.cur?{v:ytNet/ytSG.cur*100,lab:'kept'}:undefined,n:`${full(ytSL.cur)} unsubscribed in these dates.`}],
      foot:has(ytV.d)?`Views ${ytV.d>=0?'up':'down'} <b>${pct(Math.abs(ytV.d),1)}</b> per day, watch time ${has(ytM.d)&&ytM.d>=0?'up':'down'} <b>${pct(Math.abs(ytM.d||0),1)}</b>.`:''}),
    (()=>{ const iv=st(D.ig,'v'), il=st(D.ig,'l'), icm=st(D.ig,'cm'), isv=st(D.ig,'sv'), ish=st(D.ig,'sh'), ipv=st(D.ig,'pv');
      const inter=[il,icm,isv,ish].some(x=>has(x.cur))?(il.cur||0)+(icm.cur||0)+(isv.cur||0)+(ish.cur||0):null;
      const vIG=has(iv.cur)?iv.cur:(igPostsV||null), iIG=has(inter)?inter:(igIn.length?igIntCur:null), fromPosts=!has(iv.cur)&&has(vIG);
      const acctFailed=((D.extra&&D.extra.tabStats)||[]).some(t=>/account activity/i.test(t.name)&&t.errors);
      const IA2=W?acctTotals(W.cs,W.end):null, pvF=has(ipv.cur)?ipv.cur:(IA2&&has(IA2.pv)?Math.round(IA2.pv):null), pvEst=!has(ipv.cur)&&IA2&&IA2.est;
      const hasV=has(vIG), hasI=has(iIG), hasP=has(pvF);
      return drawFunnel({title:'Instagram',color:'#D66BA0',sub:rangeTxt,stages:[
        hasV?{l:'Views',v:vIG,f:abbr,n:fromPosts?`Views of the ${full(igIn.length)} posts and reels published in these dates.`:'Times posts, reels and stories were seen.'}:{l:'Views',miss:true},
        {l:'Accounts reached',v:igR.cur,f:abbr,r:hasV?undefined:{na:'first measured stage'},of:'views',n:'Summed daily, so returning accounts count again.'},
        hasI?{l:'Interactions',v:iIG,of:'accounts reached',n:'Instagram\u2019s own total: likes, comments, saves, shares and more.'}:{l:'Interactions',miss:true},
        hasP?{l:'Profile visits',v:pvF,of:hasI?'interactions':'accounts reached',n:pvEst?'Times the profile was viewed, from Instagram\u2019s monthly totals; months partly outside these dates are counted by their share of days.':has(ipv.cur)?'Times the profile was viewed.':'Times the profile was viewed, from Instagram\u2019s monthly totals.'}:{l:'Profile visits',miss:true},
        {l:'New follows',v:igNF.cur,of:hasP?'profile visits':'accounts reached',n:`${igR.cur?(igNF.cur/igR.cur*1e4).toFixed(1):'-'} for every 10,000 accounts reached.`}],
        foot:hasV&&hasI&&hasP?'Every stage comes from the sheet.':!hasP&&acctFailed?'Profile visits come from the Instagram Account Activity tab, where the pipeline\u2019s requests are failing. That stage fills in once they work.':'Dashed stages fill in as soon as that data reaches the sheet.'}); })(),
    drawFunnel({title:'Website',color:'#3FB5A8',sub:rangeTxt,stages:[
      {l:'Page views',v:web.pv.cur,n:`${web.s.cur?(web.pv.cur/web.s.cur).toFixed(2):'-'} pages per visit.`},
      {l:'Visits',v:web.s.cur,of:'page views',n:`${full(web.u.cur)} people, ${full(web.n.cur)} of them new.`},
      {l:'Engaged visits',v:web.es.cur,of:'visits',n:'Stayed over 10 seconds, viewed two pages or converted.'},
      {l:'Conversions',v:web.cv.cur,of:'visits',n:web.cv.cur?'Key events completed on the site.':'None recorded. Check that key events are set up in Google Analytics.'}],
      foot:has(web.s.d)?`Visits ${web.s.d>=0?'up':'down'} <b>${pct(Math.abs(web.s.d),1)}</b> per day on the ${N} days before.`:''}),
    drawFunnel({title:'Google Play, getting users',color:'#5BBF7A',sub:rangeTxt,stages:[
      {l:'Store listing visitors',v:storeVis,n:'People who opened the app page on Google Play.'},
      {l:'Installs from the listing',v:storeAcq,of:'visitors',n:'Visitors who pressed install.'},
      {l:'New subscriptions',v:pSn.cur,of:'installs',n:`${full(pSc.cur)} Android subscription${pSc.cur===1?' was':'s were'} cancelled in the same period.`},
      {l:'Revenue',v:playRev,f:usd,r:{na:'total for these dates'},n:`After Google\u2019s 15% fee, from ${full(playTx)} billed transaction${playTx===1?'':'s'}.`}],
      foot:storeVis?`The listing turns <b>${pct(storeAcq/storeVis*100,1)}</b> of visitors into installs.`:''}),
    drawFunnel({title:'Google Play, keeping users',color:'#5BBF7A',sub:`All time to ${dL(W.end)}`,stages:[
      {l:'Installs, all time',v:lifeToEnd,n:`Since ${dL(D.play[0]&&D.play[0].d)}.`},
      {l:'Still installed',v:plAct.cur,of:'installs',n:actDay?`Devices with the app on ${dL(actDay)}.`:'No Google Play data in this period.'},
      {l:'Paying on Android',v:pS.cur,of:'devices still installed',n:`Active Google Play subscriptions on ${dS(lastD((D.pSubs||[]).filter(r=>W&&r.d<=W.end))||W.end)}, the latest day in the sheet.`}],
      foot:`Retention is where Android loses people: only <b>${pct(plAct.cur/lifeToEnd*100,1)}</b> of all installs are still on a device.`}),
    drawFunnel({title:'Apple App Store',color:'#A7B0BC',sub:rangeTxt,stages:[
      {l:'Downloads',v:dlR,n:`${full(ap.dl.cur)} first-time and ${full(ap.rd.cur)} re-downloads. Updates are left out.`},
      {l:'Subscription units',v:ap.sub.cur,of:'downloads',n:'Subscriptions started or renewed.'},
      {l:'Paid units',v:apSubp.cur,of:'subscription units',n:`${full((ap.sub.cur||0)-(apSubp.cur||0))} were free trials or offer codes.`},
      {l:'Paying subscribers',v:aS.cur,r:{na:`on ${dS(lastD((D.aSubs||[]).filter(r=>W&&r.d<=W.end))||W.end)}`},n:`${full(aT.cur)} more on a free trial. A count on the last day, not a share of the stage above.`}],
      foot:has(ap.rev.cur)?`Apple paid out <b>${usd(ap.rev.cur)}</b> in this period after its commission.`:''}),
    adIn.length&&adsActiveIn.length?drawFunnel({title:'Meta ads',color:'#9D86E9',sub:rangeTxt,stages:[
      {l:'Impressions',v:adsR.im,f:abbr,n:`${usd(adsR.sp)} spent, ${usd(cpm)} per 1,000.`},
      {l:'Reach',v:adsR.rc,f:abbr,of:'impressions',n:'Accounts served, summed by day.'},
      {l:'Clicks',v:adsR.cl,of:'impressions',n:`${usd(cpc)} per click.`},
      {l:'Link clicks',v:adsR.lc,of:'clicks',n:'Clicks that left Facebook or Instagram.'},
      {l:'Landing page views',v:adsR.lp,of:'link clicks',n:'The page actually loaded.'},
      {l:'App installs',v:adsR.ai,of:'landing page views',n:has(cpi)?`${usd(cpi)} per install.`:'No installs were attributed to ads in these dates.'}],
      foot:'The only place in the sheet where one person can be followed from an impression to an install.'})
     :`<div class="fnl"><div class="fnl-h"><h4><i style="background:#9D86E9"></i>Meta ads</h4><span>${rangeTxt}</span></div><div class="empty" style="padding:20px"><h4>No paid ads ran in this period</h4><p>${camp?`Campaigns ran from ${dL(camp.from)} to ${dL(camp.to)}.`:'No Meta ad data in the sheet.'}</p>${camp?`<button type="button" class="btn" data-range="${camp.from}|${camp.to}">Show the campaign dates</button>`:''}</div></div>`,
    (XP.length?drawFunnel({title:'X',color:'#B9B9C0',sub:rangeTxt,stages:[
      {l:'Impressions',v:xIm,f:abbr,n:`Across ${full(xIn.length)} posts published in these dates.`},
      {l:'Engagements',v:xE,of:'impressions',n:'Every interaction with a post: likes, reposts, replies, clicks and more.'},
      {l:'Likes',v:xTot(xIn,'l'),of:'engagements',n:'The lightest-touch interaction.'},
      {l:'Reposts and quotes',v:xTot(xIn,'rp')+xTot(xIn,'q'),of:'engagements',n:'Shared on to their own followers.'},
      {l:'Replies',v:xTot(xIn,'rep'),of:'engagements',n:'Joined the conversation.'}],
      foot:`${full(xF.cur)} followers${xF.asOf?' on '+dL(xF.asOf):''}. X doesn't report profile visits or link clicks in the sheet.`}):''),
    (TA.length?drawFunnel({title:'TikTok',color:'#5CC8D6',sub:TA.length?'As of '+dL(TA[TA.length-1].d):'',stages:[
      {l:'Plays',v:ttIn.length?ttV:(TA[TA.length-1]||{}).v,f:abbr,n:ttIn.length?`From the ${ttIn.length} videos posted in these dates.`:`Across the ${TV.length} most recent videos.`},
      {l:'Likes, all time',v:(TA[TA.length-1]||{}).h,f:abbr,r:{na:'all-time total'},n:'Every like across every video, so not a share of the plays above.'},
      {l:'Followers',v:(TA[TA.length-1]||{}).f,of:'likes, all time',n:'One follower for every '+(TA[TA.length-1]&&TA[TA.length-1].f?full(TA[TA.length-1].h/TA[TA.length-1].f):'-')+' likes.'}],
      foot:'TikTok collection started on '+dL(TA[0]&&TA[0].d)+'. As daily data builds up, this funnel will show views, likes and follows for the dates you pick.'}):''),
    ...exSocial.map(t=>exFunnel(t))

  ];
  P.funnels=`${ph('Funnels','How attention turns into visits, installs, subscribers and revenue, channel by channel.',rangeTxt)}
    <div class="fnl-key"><span>Left: the share that made it from the stage above</span><span><i style="background:rgba(217,168,87,.75)"></i>Bar width shows size, on a log scale</span><span><i style="border:1.5px dashed var(--line-3)"></i>Not in the sheet yet</span></div>
    <div class="fnl-g">${fB.join('')}</div>`;

  /* ---------- app installs ---------- */
  const plW=pl.i.w, apW=ap.dl.w;
  const srcAgg={}; trCur.forEach(r=>{ const o=srcAgg[r.s]||(srcAgg[r.s]={v:0,a:0}); o.v+=r.vis; o.a+=r.acq; });
  const srcList=Object.keys(srcAgg).sort((a,b)=>srcAgg[b].a-srcAgg[a].a);
  const ctyTop=o=>{ if(!o||!o.r) return []; const t={}; for(let i=0;i<o.r.length;i+=3){ const d=o.d[o.r[i]]; if(d>=W.cs&&d<=W.end){ const c=o.c[o.r[i+1]]; t[c]=(t[c]||0)+o.r[i+2]; } } return Object.keys(t).map(c=>({l:c,v:t[c]})).sort((a,b)=>b.v-a.v).slice(0,10); };
  const ctyP=ctyTop(D.playCty);
  const ctyA=ctyTop(D.appleCty);
  P.installs=`${ph('App installs','Downloads, retention and where new users come from, across Google Play and the App Store.',`Play to ${dL(plW&&plW.end)}, Apple to ${dL(apW&&apW.end)}`)}
    <div class="kg">
      ${kc({l:'Play installs',v:full(pl.i.cur),p:pill(pl.i.d,{tip:cmpTip(pl.i)}),c:'var(--play)',n:`${pl.i.cd} of ${N} days reported.`,s:spark(pl.i.series,'#5BBF7A')})}
      ${kc({l:'Apple downloads',v:full((ap.dl.cur||0)+(ap.rd.cur||0)),p:pill(ap.dl.d,{tip:cmpTip(ap.dl)}),c:'var(--apple)',n:`${full(ap.dl.cur)} first-time, ${full(ap.rd.cur)} re-downloads.`,s:spark(ap.dl.series,'#A7B0BC')})}
      ${kc({l:'Active Android devices',v:full(plAct.cur),p:pill(plAct.d),c:'var(--play)',s:spark(plAct.series,'#5BBF7A','level')})}
      ${kc({l:'Play uninstalls',v:full(pl.ue.cur),p:pill(pl.ue.d,{invert:true}),c:'var(--bad)',n:`${pl.i.cur?pct(pl.ue.cur/pl.i.cur*100,0):'-'} of installs in the period.`})}
      ${(()=>{ const M=(window.ATR_MANUAL&&window.ATR_MANUAL.appleInstallReport)||null;
        /* Apple's full installation and deletion report (config.js). The sheet only holds a partial snapshot while Apple catches up,
           so these totals are shown as given, whenever the dates on screen include the whole report period (e.g. All time). */
        if(!M||!W||W.cs>M.from||W.end<M.to) return '';
        return kc({l:'Apple uninstalls',v:full(M.deletions),p:'',c:'var(--bad)',n:`Since ${dL(M.from)}. Apple counts people who share analytics with developers.`})
          +kc({l:'Apple installation events',v:full(M.installs),p:'',c:'var(--apple)',n:`Since ${dL(M.from)}. Every install Apple records, including updates, re-downloads and restores.`}); })()}
    </div>
    ${gapNote(D.play,plW,'Google Play installs')}
    
    ${false?`<div class="card" style="margin-bottom:16px"><h4>Downloads and uninstalls per day, App Store</h4><p class="cs">Uninstalls are only counted for iPhone users who share analytics with developers.</p>
      ${chart({dates:days(W.cs,W.end),series:[{name:'Downloads',vals:days(W.cs,W.end).map(d=>{ const r=(D.apple||[]).find(x=>x.d===d); return r?(r.dl||0)+(r.rd||0):null; }),color:'#A7B0BC'},{name:'Uninstalls',vals:days(W.cs,W.end).map(d=>{ const r=D.appleDel.find(x=>x.d===d); return r?r.n:null; }),color:'#E07A68'}],type:'bar',h:220,aria:'App Store downloads and uninstalls'})}</div>`:''}
    <div class="card"><h4>Installs and uninstalls per day, Google Play</h4>${chart({dates:days(plW.cs,plW.end),series:[{name:'Installs',vals:pl.i.series,color:'#5BBF7A'},{name:'Uninstalls',vals:pl.ue.series,color:'#E07A68',op:.85,w:1.8}],area:true,aria:'Play installs'})}</div>
    <div class="g2" style="margin-top:16px">
      <div class="card"><h4>Active Android devices</h4><p class="cs">Devices with the app installed, daily.</p>${chart({dates:days(plAct.w.cs,plAct.w.end),series:[{name:'Active devices',vals:plAct.series,color:'#5BBF7A'}],level:true,peak:false,h:240,aria:'Active devices'})}</div>
      <div class="card"><h4>Apple downloads per day</h4>${chart({dates:days(apW.cs,apW.end),series:[{name:'First-time',vals:ap.dl.series,color:'#A7B0BC'},{name:'Re-downloads',vals:ap.rd.series,color:'#5E6570'}],type:'bar',stack:true,h:240,aria:'Apple downloads'})}</div>
    </div>
    <div style="margin-top:16px">
      <div class="card"><h4>Play Store listing: how people find the app</h4><p class="cs">${full(storeVis)} listing visitors, ${full(storeAcq)} installs, ${storeVis?pct(storeAcq/storeVis*100,1):'-'} conversion.</p>
        <div class="tw" style="box-shadow:none"><table style="min-width:0"><thead><tr><th>Source</th><th>Visitors</th><th>Installs</th><th>Conversion</th></tr></thead><tbody>
        ${srcList.map(s=>`<tr><td>${esc(s)}</td><td>${full(srcAgg[s].v)}</td><td><b>${full(srcAgg[s].a)}</b></td><td>${srcAgg[s].v?pct(srcAgg[s].a/srcAgg[s].v*100,1):'-'}</td></tr>`).join('')}</tbody></table></div></div>
    </div>
    <h3 class="st">Where installs come from <small>Top 10 countries for these dates</small></h3>
    ${ctyTiles(D.playCty,'Android','Google Play installs','#5BBF7A')}
    ${ctyTiles(D.appleCty,'iPhone','Apple downloads','#A7B0BC')}
    ${ctyTable()}`;

  /* ---------- subscribers and revenue ---------- */
  const evW=win(D.aEv); const evAgg={}; if(evW) D.aEv.forEach(e=>{ if(e.d>=evW.cs&&e.d<=evW.end) evAgg[e.e]=(evAgg[e.e]||0)+e.q; });
  const evLife={}; D.aEv.forEach(e=>evLife[e.e]=(evLife[e.e]||0)+e.q);
  const trials=evLife['Start Introductory Offer']||0, conv=evLife['Paid Subscription from Introductory Offer']||0;
  const subDates=days(W.cs,W.end);
  const serOf=(rs,f)=>{ const bd=byDate(rs); return subDates.map(d=>{ const r=bd.get(d); return r?f(r):null; }); };
  /* the Free trials section: Apple trials started and became paying, the all-time conversion rate, Google Play trial starts */
  const trialSection=(()=>{ const T=TRIAL, K=o=>kc({p:'',c:'var(--gold)',...o}); let c='';
    if(T.win.start) c+=K({l:'Apple free trials started',v:full(T.win.start),n:'In these dates.'});
    if(T.win.paid) c+=K({l:'Apple trials that became paying',v:full(T.win.paid),n:'In these dates.'});
    if(T.all.start) c+=K({l:'Trial to paid, Apple',v:pct(T.all.paid/T.all.start*100,0),n:`${full(T.all.paid)} of ${full(T.all.start)} trials became paying, all time.${T.all.failed?` ${full(T.all.failed)} ended with a failed payment.`:''}`});
    if(has(aT.cur)&&aT.cur>0) c+=K({l:'On a free trial now, Apple',v:full(aT.cur),n:`On ${dS(lastD((D.aSubs||[]).filter(r=>W&&r.d<=W.end))||W.end)}.`});
    if(T.playWin) c+=K({l:'Google Play free trials started',v:full(T.playWin),n:'In these dates. Google Play doesn\u2019t report which trials became paying.'});
    if(!c) return '';
    const months={}; (D.aEv||[]).forEach(x=>{ const m=x.d.slice(0,7), o=months[m]||(months[m]={s:0,p:0,g:0}); if(x.e==='Start Introductory Offer') o.s+=x.q||0; if(x.e==='Paid Subscription from Introductory Offer') o.p+=x.q||0; });
    (D.pSubs||[]).forEach(r=>{ if(r.tn){ const m=r.d.slice(0,7), o=months[m]||(months[m]={s:0,p:0,g:0}); o.g+=r.tn; } });
    const ms=Object.keys(months).filter(m=>months[m].s||months[m].p||months[m].g).sort().reverse();
    const mName=m=>`${MON[+m.slice(5,7)-1]} ${m.slice(0,4)}`;
    return `<h3 class="st">Free trials <small>How many trials start, and how many become paying</small></h3><div class="kg">${c}</div>
      ${ms.length?`<div class="card" style="margin-top:16px"><h4>Free trials by month</h4><p class="cs">All months with trial activity. Click a column heading to sort.</p><div class="tw" style="box-shadow:none"><table style="min-width:0"><thead><tr><th style="text-align:left">Month</th><th>Apple trials started</th><th>Apple trials that became paying</th>${T.hasPlay?'<th>Google Play trials started</th>':''}</tr></thead><tbody>
        ${ms.map(m=>`<tr><td style="text-align:left" data-sort="${m}">${mName(m)}</td><td>${full(months[m].s)}</td><td>${full(months[m].p)}</td>${T.hasPlay?`<td>${full(months[m].g)}</td>`:''}</tr>`).join('')}</tbody></table></div></div>`:''}`; })();
  P.subs=`${ph('Subscribers and revenue','Paying subscribers on both stores, what they are worth, and how many leave.','Latest data per store')}
    <div class="kg">
      ${kc({l:'Paying subscribers',v:full(activeSubs),p:pill(chg(activeSubs,subsPrev)),c:'var(--gold)',n:`Play and Apple combined, latest.${trialSubs?` Plus ${full(trialSubs)} on a free trial, not counted here.`:''}`})}
      ${kc({l:'Google Play subscribers',v:full(pS.cur),p:pill(pS.d),c:'var(--play)',n:`On ${dS(lastD((D.pSubs||[]).filter(r=>W&&r.d<=W.end))||W.end)}. ${full(pSn.cur)} new, ${full(pSc.cur)} cancelled in the period.`})}
      ${kc({l:'Apple paying subscribers',v:full(aS.cur),p:pill(aS.d),c:'var(--apple)',n:`On ${dS(lastD((D.aSubs||[]).filter(r=>W&&r.d<=W.end))||W.end)}. Plus ${full(aT.cur)} on a free trial.`})}

      ${kc({l:'Apple proceeds',v:usd(ap.rev.cur),p:pill(ap.rev.d,{tip:cmpTip(ap.rev,usd)}),c:'var(--gold)',n:`${usd(lifeApple)} all time, after Apple's fee.`})}
      ${kc({l:'Google Play revenue',v:usd(playRev),p:'',c:'var(--gold)',n:`After Google\u2019s 15% fee. ${usd(lifePlay)} all time.`})}
      ${kc({l:'Apple cancellations',v:full(evAgg['Cancel']||0),p:'',c:'var(--bad)',n:`In this period. ${full(evLife['Cancel'])} all time.`})}
      ${kc({l:'Refunds',v:full(evAgg['Refund']||0),p:'',c:'var(--bad)',n:`Apple, in this period. ${full(evLife['Refund']||0)} all time.`})}
    </div>
    ${trialSection}
    <div class="card" style="margin-top:16px"><h4>Active subscribers over time</h4><p class="cs">Both stores. Gaps are days a store did not report.</p>
      ${chart({dates:subDates,series:[{name:'Apple, paying',vals:serOf(D.aSubs,r=>r.s),color:'#A7B0BC'},{name:'Apple, trial',vals:serOf(D.aSubs,r=>r.t),color:'#5E6570'},{name:'Google Play',vals:serOf(D.pSubs,r=>r.a),color:'#5BBF7A'}],peak:false,aria:'Subscribers'})}</div>
    <div class="g2" style="margin-top:16px">
      <div class="card"><h4>Apple subscription events</h4><p class="cs">What subscribers did in this period.</p>
        ${Object.keys(evAgg).length?'':'<p class="note">No Apple subscription events in this period.</p>'}${hbars(Object.keys(evAgg).sort((a,b)=>evAgg[b]-evAgg[a]).map(e=>({l:e.replace('Paid Subscription from Introductory Offer','Trial converted').replace('Start Introductory Offer','Trial started').replace('Billing Retry from Paid Subscription','Billing retry').replace('Renewal from Billing Retry','Recovered after retry').replace('Billing Retry from Introductory Offer','Trial billing retry'),v:evAgg[e],c:e==='Cancel'||e==='Refund'?'#E07A68':'#D9A857'})),full)}</div>
      <div class="card"><h4>Revenue per day</h4><p class="cs">Apple proceeds in ${CURNAME}.</p>${chart({dates:days(ap.rev.w.cs,ap.rev.w.end),series:[{name:'Apple proceeds',vals:ap.rev.series,color:'#D9A857'}],type:'bar',h:250,fmt:v=>CURSYM+abbr(v),peak:false,aria:'Revenue'})}</div>
    </div>
    <p class="note">Google Play revenue is estimated from the fee lines in the earnings export, as the gross amount is not supplied. Apple proceeds are converted to ${CURNAME} at fixed rates.</p>`;

  /* ---------- stability ---------- */
  const gauge=(v,lim,max,lab)=>`<div class="gauge"><div class="gt"><span class="gth" style="left:${lim/max*100}%"></span>${has(v)?`<span class="gm" style="left:calc(${Math.min(v/max,1)*100}% - 1.5px)"></span>`:''}</div><div class="gl"><span>0%</span><span>${lab} limit ${lim}%</span><span>${max}%</span></div></div>`;
  const qd=q.w?days(q.w.cs,q.w.end):[]; const qbd=byDate(D.qual); const qs=k=>qd.map(d=>{ const r=qbd.get(d); return r&&has(r[k])?r[k]*100:null; });
  P.stability=`${ph('App stability','How often the Android app crashes or freezes, against the limits Google enforces.',rng(q.w))}
    <div class="g2">
      <div class="card"><h4>Crash rate</h4><p class="cs">Share of daily users who noticed a crash, over the last 28 days of data: the measure and window Google judges.</p><div style="font-size:32px;font-weight:700;letter-spacing:-.035em">${pct(qc,2)}</div>${gauge(qc,1.09,3,'Google')}
        <p class="note">${has(qc)&&qc<=1.09?'Within the limit.':'Above the limit.'} All crashes, including background ones: ${pct(q28.cr,2)}.</p></div>
      <div class="card"><h4>Freezes (ANR rate)</h4><p class="cs">Share of daily users who saw the app stop responding, over the last 28 days of data: the measure and window Google judges.</p><div style="font-size:32px;font-weight:700;letter-spacing:-.035em;color:${has(qa)&&qa>0.47?'var(--bad)':'inherit'}">${pct(qa,2)}</div>${gauge(qa,0.47,2,'Google')}
        <p class="note">${has(qa)&&qa>0.47?'Above the limit. Google can reduce store visibility for apps in breach.':'Within the limit.'} All freezes, including ones users may not notice: ${pct(q28.anr,2)}.</p></div>
    </div>
    <div class="card" style="margin-top:16px"><h4>Crash and ANR rate per day</h4><p class="cs">Averages are weighted by daily users, as Google does. Daily users averaged ${full(q.dau)}.</p>
      ${chart({dates:qd,series:[{name:'Crash rate',vals:qs('cr'),color:'#E07A68'},{name:'ANR rate',vals:qs('anr'),color:'#E0B35A'}],fmt:v=>(+v.toFixed(2))+'%',peak:false,aria:'Stability'})}</div>`;

  /* ---------- data coverage ---------- */
  const today=[lastD(D.fb),lastD(D.web),lastD(D.play)].filter(Boolean).sort().pop();
  const srcs=[['Facebook','Meta Organic',D.fb],['Instagram','Instagram',D.ig],['YouTube','YouTube Daily',D.yt],['Website','GA4',D.web],['Website channels','GA4 Channels',D.webCh],['Paid ads','Meta',D.ads],
    ['Play installs','Play Installs',D.play],['Apple downloads','App Store Sales',D.apple],['Play subscribers','Play Subscriptions',D.pSubs],['Apple subscribers','App Store Subscriptions',D.aSubs],
    ['Apple events','App Store Subscription Events',D.aEv],['Play revenue','Play Earnings',D.earn],['Website ads','AdSense',D.adsense||[]],['X posts','X',D.xPosts||[]],...(((D.extra&&D.extra.tabs)||[]).map(t=>[t.name+' (new)',t.name,t.dates.map(d=>({d}))])),['TikTok account','TikTok',D.ttAcct||[]],['App ads','AdMob',D.admob||[]],['Store traffic','Play Traffic Source',D.traffic],['App stability','Play_Quality_History',D.qual],
    ['Instagram posts','Instagram Posts',D.igPosts||[]],['Facebook posts','Facebook Posts',D.fbPosts||[]],['YouTube videos','YouTube Videos',D.ytVideos||[]]];
  /* ---------- connect data: every source, the tab it is read from, the API that fills it, and whether the workbook has it ---------- */
  { const SRCS=window.DASH_SOURCES||[], TS=(D.extra&&D.extra.tabStats)||[];
    const stat=t=>TS.find(x=>(x.canon||x.name)===t)||TS.find(x=>x.name===t);
    const have=SRCS.filter(s=>{ const x=stat(s.tab); return x&&x.rows>0; }).length, self=!DATA_URL&&!FILE_URL;
    const now=DATA_URL?`Connected through your Worker (${esc(DATA_URL)}), which reads the workbook every minute.`:FILE_URL?`Reading the file at ${esc(FILE_URL)} every minute.`
      :LOCAL.kind==='sample'?'Showing the sample workbook. Open your own file to see your figures.':LOCAL.kind==='file'?`Showing ${esc(LOCAL.name||'a file')} from this computer${LOCAL.handle?'. Saved changes show up within a minute':''}.`:'Not connected yet.';
    const btn=(k,l)=>`<button type="button" class="btn" data-conn="${k}">${l}</button>`;
    const btns=`${self&&DATA_CFG.allowOpenFile!==false?btn('open','Open an Excel file'):''}${self&&DATA_CFG.sample?btn('sample','Try the sample data'):''}<a class="btn" href="dashboard-template.xlsx" download>Download the blank template</a>${self&&LOCAL.kind?btn('close','Close this file'):''}`;
    const AREAS=['Facebook','Instagram','YouTube','TikTok','X','Website','Paid ads','App (Android)','App (iPhone)','App stability','Revenue','Ad revenue','Data'];
    P.connect=`${ph('Connect data','Every source the dashboard reads, the tab it reads it from, and the API that fills it.','')}
      <div class="card cn-now"><div><h4>Right now</h4><p>${now}</p><p class="cs">${have} of ${SRCS.length} tabs have data. You only need the tabs for the platforms you use.</p></div><div class="cn-b">${btns}</div></div>
      <div class="cn-how">
        <div class="card"><h4>1. One workbook</h4><p>Every figure comes from one Excel workbook or Google Sheet, with one tab per source and the column names below. The blank template has them all, with a note on every header.</p></div>
        <div class="card"><h4>2. Fill it from the APIs</h4><p>Each tab is filled from one API: by hand, from CSV exports, with a tool such as Make, Zapier or Supermetrics, or with your own script. Fill the ones you use.</p></div>
        <div class="card"><h4>3. Connect it</h4><p>Open the file here, set <code>fileUrl</code> to a link to it, or set <code>workerUrl</code> to keep a private Google Sheet live, all in config.js. README.md has the steps.</p></div>
      </div>
      ${AREAS.map(area=>{ const list=SRCS.filter(s=>s.area===area); if(!list.length) return '';
        return `<h3 class="st">${area}</h3><div class="cn-list">${list.map(s=>{ const x=stat(s.tab), ok=!!(x&&x.rows>0);
          return `<div class="card cn-i${ok?' ok':''}"><div class="cn-h"><b>${esc(s.tab)}</b>${ok?`<span class="chip ok">${full(x.rows)} rows${x.last?`, to ${dS(x.last)}`:''}</span>`:`<span class="chip">${s.core?'Not in the workbook yet':'Optional'}</span>`}</div>
            <p>${esc(s.what)}</p>
            <dl><dt>API</dt><dd>${esc(s.api)}<small>${esc(s.endpoint)}</small></dd><dt>One row per</dt><dd>${esc(s.grain.replace(/^One row per /,''))}</dd>
              <dt>Needs</dt><dd>${s.req.map(c=>`<code>${esc(c)}</code>`).join('')}</dd>${s.opt.length?`<dt>Adds</dt><dd>${s.opt.map(c=>`<code>${esc(c)}</code>`).join('')}</dd>`:''}</dl></div>`; }).join('')}</div>`; }).join('')}
      <p class="note">Column names can be written any way: Profile Visits, profile_visits and profileVisits all work, and many of the platforms' own names are recognised too. Any extra tab or column is picked up automatically and shown under New in the sheet.</p>`; }
  const API=apiHealth();
  P.data=`${ph('Data coverage','Where every number comes from and how current it is.','')}
    ${API.html}
    ${connectionPanel()}
    <div class="tw"><table><thead><tr><th>Area</th><th>Sheet tab</th><th>Days of data</th><th>From</th><th>To</th><th>Behind latest</th></tr></thead><tbody>
      ${srcs.map(s=>{ if(!s[2]||!s[2].length) return `<tr><td><b>${s[0]}</b></td><td>${s[1]}</td><td colspan="4"><span class="chip need">not in the sheet yet</span></td></tr>`; const l=lastD(s[2]); const lag=l&&today?Math.round((toT(today)-toT(l))/864e5):null; const dd=new Set((s[2]||[]).map(r=>r.d)).size;
        return `<tr><td><b>${s[0]}</b></td><td>${s[1]}</td><td>${full(dd)}</td><td>${dL(s[2][0]&&s[2][0].d)}</td><td>${dL(l)}</td><td>${has(lag)?(lag<=3?`<span class="pc up">${lag} days</span>`:`<span class="pc down">${lag} days</span>`):'-'}</td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="g2" style="margin-top:16px">
      <div class="card"><h4>How the numbers are made</h4><ul style="margin:0;padding-left:18px;color:var(--ink-2)">
        <li>Every figure uses the dates chosen at the top. Each change compares with the same number of days immediately before.</li>
        <li>Changes compare daily averages, so missing days do not distort growth.</li>
        <li>Where a day was loaded twice, the most recent copy is used.</li>
        <li>Summed daily viewers and reach count returning people more than once.</li></ul></div>
      <div class="card"><h4>What is missing</h4><ul style="margin:0;padding-left:18px;color:var(--ink-2)">
        <li></li>
        <li>Instagram has reach and follows only; no views, likes or follower total.</li>
        <li>No post-level data, so individual content cannot be ranked.</li>
        <li>No audience location, age or gender for any platform.</li></ul></div>
    </div>`;

  /* ---------- mount ---------- */
  /* any heading left with nothing under it is dropped, on every page */
  /* (data-coverage notes are kept off the pages; the Data and Updates pages hold the details) */
  if(false)
  /* when a platform's data stops before the end of the chosen dates, say so plainly under the page title */
  { const STALE={facebook:[D.fb,'Facebook','Meta Organic'],instagram:[D.ig,'Instagram','Instagram'],youtube:[D.yt,'YouTube',(D.ytFilled||[]).length?'YouTube Video Daily':'YouTube Daily'],website:[D.web,'Website','GA4'],installs:[D.play,'Google Play','Play Installs'],subs:[D.aSubs,'App Store subscriptions','App Store Subscriptions']};
    for(const k in STALE){ const [rs,label,tab]=STALE[k]; const l=rs&&rs.length?lastD(rs):null; if(!W||!l||l>=W.end||l<W.cs||!P[k]) continue;
      const nd=days(l,W.end).slice(1), note=`<div class="co watch"><h4>${label} data stops on ${dL(l)}</h4><p>The ${tab} tab in the sheet has nothing newer, so ${nd.length===1?dS(nd[0])+' is':`${dS(nd[0])} to ${dS(W.end)} (${nd.length} days) are`} missing here and the totals for these dates are lower than they should be. This fills in by itself once the pipeline adds those days.</p></div>`;
      const a=P[k].indexOf('<div class="ph">'); if(a<0) continue; const b1=P[k].indexOf('</div>',a); const b2=P[k].indexOf('</div>',b1+6); if(b2<0) continue;
      P[k]=P[k].slice(0,b2+6)+note+P[k].slice(b2+6); } }
  /* audit: figures that must add up */
  AUD.render=[];
  if(API.total&&API.col>=0) AUD.render.push({g:'Sheet',n:'Every API call succeeded',ok:API.bad.length?'warn':'pass',d:API.bad.length?`Failed in the pipeline\u2019s Dashboard Status tab: ${API.bad.join(', ')}.`:`All ${full(API.total)} API calls in the Dashboard Status tab succeeded.`});
  { const parts=(fbV.cur||0)+(ytV.cur||0)+(igHasViews?igViewsCur:0)+(xIm||0)+ttV+exViewsTot;
    AUD.render.push({g:'Consistency',n:'Social views add up across platforms',ok:Math.abs(parts-allViews)<0.5?'pass':'fail',d:`${full(allViews)} = Facebook ${full(fbV.cur||0)} + YouTube ${full(ytV.cur||0)} + Instagram ${full(igHasViews?igViewsCur:0)} + X ${full(xIm||0)} + TikTok ${full(ttV)}${exViewsTot?' + new platforms '+full(exViewsTot):''}`});
    AUD.render.push({g:'Consistency',n:'Followers read the same everywhere',ok:Math.abs(SCF.tot-folTot)<0.5&&Math.abs(SCF.nf-nfTot)<0.5?'pass':'fail',d:`scorecard ${full(SCF.tot)} (${sgn(SCF.nf)}), Social overview ${full(folTot)} (${sgn(nfTot)})`});
    if(IGFOL&&IGFOL.checks.length){ const bad=IGFOL.checks.filter(c=>Math.abs(c.diff)>Math.max(5,c.known*0.001));
      AUD.render.push({g:'Consistency',n:'Instagram follower history agrees with Instagram\u2019s daily count',ok:bad.length?'warn':'pass',d:(bad.length?bad:IGFOL.checks).slice(-6).map(c=>`${dS(c.d)}: Instagram ${full(c.known)}, history ${full(c.worked)}`).join('; ')}); }
    { const S=(D.ytSnap||[]).filter(r=>has(r.subs)), net={}; (D.yt||[]).forEach(r=>{ if(has(r.sg)||has(r.sl)) net[r.d]=(r.sg||0)-(r.sl||0); });
      const pairs=[]; for(let i=1;i<S.length;i++){ const a=S[i-1], b=S[i], ds=days(a.d,b.d).slice(1); if(ds.length&&ds.every(d=>has(net[d]))) pairs.push({a,b,pub:b.subs-a.subs,daily:ds.reduce((t,d)=>t+net[d],0)}); }
      /* YouTube rounds its public count to the nearest 10, so small differences are expected */
      if(pairs.length){ const off=pairs.filter(p=>Math.abs(p.pub-p.daily)>15); AUD.render.push({g:'Consistency',n:'YouTube subscriber counts agree with daily gains and losses',ok:off.length?'warn':'pass',d:(off.length?off:pairs.slice(-3)).map(p=>`${dS(p.a.d)} to ${dS(p.b.d)}: count ${sgn(p.pub)}, daily ${sgn(p.daily)}`).join('; ')}); } }
    if(IGFOL&&IGFOL.historyDays>1) AUD.render.push({g:'Consistency',n:'Instagram follower totals move by each day\u2019s gains and losses',ok:IGFOL.jumps?'warn':'pass',d:IGFOL.jumps?`${full(IGFOL.jumps)} days where the total changes by a different amount than gained minus lost.`:`All ${full(IGFOL.historyDays)} days add up.`});
    const fp=PLAT.reduce((t,p)=>t+(p.f||0),0); AUD.render.push({g:'Consistency',n:'Followers add up across platforms',ok:Math.abs(fp-folTot)<0.5?'pass':'fail',d:`${full(folTot)} followers across ${PLAT.filter(p=>has(p.f)).length} platforms`});
    const rp=(ap.rev.cur||0)+(playRev||0)+adsRev+exRevTot; AUD.render.push({g:'Consistency',n:'Revenue adds up',ok:Math.abs(rp-revenueR)<0.005?'pass':'fail',d:`${usd(revenueR)} = Apple ${usd(ap.rev.cur||0)} + Google Play ${usd(playRev||0)} + ads ${usd(adsRev)}${exRevTot?' + other '+usd(exRevTot):''}`});
    const ip=(fbE.cur||0)+ytIntAll+igIntCur+(xE||0); AUD.render.push({g:'Consistency',n:'Interactions add up across platforms',ok:Math.abs(ip-allInt)<0.5?'pass':'fail',d:`${full(allInt)} interactions`}); }
  try{ P.actions=actionsPage(); }catch(e){ console.warn('Dashboard action plan:',e); P.actions=`${ph('Action plan','What to change next, worked out from the live sheet.','')}<div class="empty"><h4>The action plan could not be worked out</h4><p>${esc(e&&e.message||e)}</p></div>`; }
  /* a workbook with no figures yet: say so, instead of an empty summary and "nothing to do" */
  if(!Object.values(PAGE_DATA).flat().some(k=>nz(D[k]))&&!((D.extra&&D.extra.tabs)||[]).length){
    const card=`<div class="empty"><h4>Your workbook has no figures yet</h4><p>Fill at least one tab with one row per day, for example <b>YouTube Daily</b> or <b>GA4</b>, keeping the column names in the first row. Then open the file again; in Chrome and Edge it updates by itself when you save it. Connect data lists every tab and the API that fills it.</p>`+
      `<div class="cn-b"><button type="button" class="btn" data-go="connect">See which tabs to fill</button>${DATA_CFG.sample?'<button type="button" class="btn" data-conn="sample">Try the sample data</button>':''}</div></div>`;
    P.summary=`${ph('Executive summary','Your headline numbers appear here once the workbook has figures.','')}${card}`;
    P.actions=`${ph('Action plan','What to do first, worked out from your figures once there are some.','')}${card}`; }
  if(THEME_SWAP[document.documentElement.getAttribute('data-theme')]) for(const k in P) P[k]=themeSwap(P[k]);
  for(const k in ALSO) if(P[k]!==undefined) P[k]+=`<h3 class="st">Also in the sheet <small>Added automatically</small></h3>${ALSO[k].join('')}`;
  for(const k in P) P[k]=String(P[k]).replace(/<h3 class="st">(?:(?!<\/h3>)[\s\S])*<\/h3>(?=\s*(?:<div data-snap="1">\s*)?(?:<h3|$))/g,'');
  document.getElementById('content').innerHTML=PAGES.map(([id],i)=>{ const pv=PAGES[i-1], nx=PAGES[i+1];
    const nav=`<div class="pgnav">${pv?`<a href="#${pv[0]}" data-go="${pv[0]}"><small>Previous</small>${pv[1]}</a>`:''}${nx?`<a class="nx" href="#${nx[0]}" data-go="${nx[0]}"><small>Next</small>${nx[1]}</a>`:''}</div>`;
    return `<section class="pg" id="p-${id}"${id===PAGE?'':' hidden'}>${P[id]||''}${nav}</section>`; }).join('');
  document.getElementById('nav').innerHTML=navGroups().map(([g,items])=>`<div class="ng">${g}</div>`+items.map(([id,t,c])=>`<a href="#${id}" data-page="${id}"${id===PAGE?' aria-current="true"':''}><i style="background:${c}"></i>${t}${id==='actions'&&ACT&&ACT.actions.some(a=>a.pri===1)?`<em class="nav-n" title="Actions to do first">${ACT.actions.filter(a=>a.pri===1).length}</em>`:''}</a>`).join('')).join('');
  document.getElementById('ttl').textContent=(PAGES.find(p=>p[0]===PAGE)||[])[1]||'';
  paintRange();
  document.getElementById('railfoot').innerHTML=`<span class="dot" style="background:${SRC.live?'#6CC287':'#77756F'}"></span><b>${(()=>{ try{ return DATA_URL?'Live through your Worker':FILE_URL?'Live from the file link':LOCAL.handle?'Watching your file':LOCAL.kind==='sample'?'Sample workbook':LOCAL.kind==='file'?'Opened on this device':'Not connected'; }catch(e){ return 'Your workbook'; } })()}</b><br>${esc(SRC.note||'')}<a id="auditchip" class="auditchip" href="#updates" data-go="updates"></a>`;
  runAudit();
  document.querySelectorAll('.nav i,.lg i,.dl i,.hr .ht i,.fr .fb i,.pn i,.dot').forEach(e=>{ if(e.style.background) e.style.color=e.style.background; });
  bindCharts();
}
/* ================= Action plan: what to change next =================
   The rules are in actions.js. They read the same figures as every other page, for the 28 days up to the end of the
   chosen dates, and again for the 28 days before, so each action can say whether it is new and which ones were resolved.
   Every redraw (new figures from the sheet, or new dates) works the list out again, so it is always as live as the sheet. */
let ACT=null, ACT_FILTER='all', ACT_MEMO={end:null,src:[],res:null};
const ACT_SRC=()=>[D.fb,D.fbPosts,D.igPosts,D.ig,D.igFH,D.igAcct,D.yt,D.ytVideos,D.ytReach,D.web,D.webCh,D.play,D.apple,D.appleDel,D.aInst,D.aSubs,D.pSubs,D.aEv,D.earn,D.admob,D.ads,D.qual,D.xPosts,D.ttVideos,D.ttAcct,D.extra];
function actionsData(){
  if(!window.ATR_ACTIONS||!W) return null;
  const B=dataBounds(); if(!B.end) return null;
  const end=W.end<B.end?W.end:B.end, src=ACT_SRC();   /* the latest day the main sources all cover */
  if(ACT_MEMO.res&&ACT_MEMO.end===end&&ACT_MEMO.src.every((x,i)=>x===src[i])) return ACT_MEMO.res;
  const today=new Date().toISOString().slice(0,10);
  const res=ATR_ACTIONS.build(D,{end,today}); ATR_ACTIONS.compare(res,ATR_ACTIONS.build(D,{end:addD(end,-28)}));
  ACT_MEMO={end,src,res}; return res;
}
const AP_ICON={copy:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="8.5" height="8.5" rx="1.8"/><path d="M10.5 5V3.8A1.3 1.3 0 0 0 9.2 2.5H3.8A1.3 1.3 0 0 0 2.5 3.8v5.4A1.3 1.3 0 0 0 3.8 10.5H5"/></svg>'};
function actionsPage(){
  const A=ACT=actionsData();
  if(!A||!A.end) return `${ph('Action plan','Everything that needs doing, worked out from the live sheet.','')}<div class="empty"><h4>No action plan yet</h4><p>It appears as soon as the sheet has a few weeks of figures.</p></div>`;
  const acts=A.actions, cnt=p=>acts.filter(a=>a.pri===p).length;
  const vis=a=>ACT_FILTER==='all'||ACT_FILTER==='p'+a.pri||ACT_FILTER===a.group;
  const go=(page,name)=>page&&PAGES.some(p=>p[0]===page)?`<a class="ac-go" href="#${page}" data-go="${page}">Open ${esc(name||'the detail')} →</a>`:'';
  let n=0;
  const card=a=>{ n++; return `<article class="ac p${a.pri}" id="ac-${esc(a.id)}" data-pri="${a.pri}" data-grp="${a.group}"${vis(a)?'':' hidden'}>
      <div class="ac-n" aria-hidden="true">${n}</div>
      <div class="ac-b">
        <div class="ac-top"><span class="ac-area" style="--c:${a.color}"><i></i>${esc(a.areaName)}</span>${a.state==='new'?'<span class="ac-tag new">New</span>':''}</div>
        <h4>${esc(a.title)}</h4>
        <p class="ac-why">${esc(a.short||a.why)}</p>
        ${a.steps.length?`<div class="ac-h">What to do</div><ul class="ac-do">${a.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
        ${a.links&&a.links.length?`<ul class="ac-links">${a.links.map(l=>`<li>${l.u?`<a href="${esc(l.u)}" target="_blank" rel="noopener">${esc(l.t)}</a>`:esc(l.t)}${l.meta?`<small>${esc(l.meta)}</small>`:''}</li>`).join('')}</ul>`:''}
        ${a.worth||a.target?`<div class="ac-res">${a.worth?`<div class="ac-worth"><small>Impact</small>${esc(a.worth)}</div>`:''}${a.target?`<div class="ac-target"><small>Done when</small>${esc(a.target)}</div>`:''}</div>`:''}
        ${a.more||a.page?`<div class="ac-foot">${a.more?`<details class="ac-more"><summary>Why, in detail</summary><p>${esc(a.more)}</p></details>`:'<span></span>'}${go(a.page,a.pageName)}</div>`:''}
      </div>
    </article>`; };
  const sec=(p,h,sub)=>{ const list=acts.filter(a=>a.pri===p); if(!list.length) return '';
    return `<section class="ap-sec" data-sec="${p}"${list.some(vis)?'':' hidden'}><h3 class="st">${h} <small>${sub}</small></h3><div class="ap-grid">${list.map(card).join('')}</div></section>`; };
  const groups=ATR_ACTIONS.GROUPS.filter(([g])=>g!=='all'&&acts.some(a=>a.group===g));
  const fb=(k,l,c)=>`<button type="button" data-apf="${k}" aria-pressed="${ACT_FILTER===k}">${l} <b>${c}</b></button>`;
  const headline=acts.length?`${acts.length} thing${acts.length===1?'':'s'} to do${cnt(1)?`, <em>${cnt(1)} this week</em>`:''}.`:'Nothing needs doing right now.';
  const how=[['App stability','freezes over 0.47% or crashes over 1.09% of daily users in the last 28 days (Google’s own limits), and whether Google Play store visits have fallen while the share of visitors who install held.'],
    ['App growth','installs down 10% or more, split into store visits and the share who install; Android uninstalls of 60 or more for every 100 installs over 90 days, against iPhone, and how often each platform’s new users pay; iPhone deletions for every 100 installs rising beyond their normal swings.'],
    ['App promotion','how many Facebook and Instagram posts mention the app; once there are app posts, installs on the day after each one against other days.'],
    ['Subscriptions','the best week for trials and offer codes in the last 90 days (at least 2.5 times a normal week) and what it did to paying subscribers; cancellations by paying subscribers once trials and offer codes ending are taken out; fewer than 4 in 10 trials becoming paying.'],
    ['Paid ads','installs costing more than three times what a new install earned over the last 90 days.'],
    ['Ad revenue','under 80% of in-app ad requests filled, or the rate per 1,000 impressions down 15%.'],
    ['Website','15% or more of visits with no source; sending social traffic there only when the website earns 15% or more of revenue; paid visits (such as Cross-network) with no ad spend in the sheet to judge them by.'],
    ['Facebook','views down 10%, split into how much we posted, the typical post and the big hits; which names in captions carry the views (share of posts against share of views); bare link posts.'],
    ['Instagram','formats judged on reach, follows per person reached, saves and shares, not views alone; new followers per 1,000 accounts reached; bio link taps.'],
    ['YouTube','the share of views and new subscribers that come from Shorts, and days since the last Short.'],
    ['Reach and followers','Facebook, Instagram and YouTube reach against new followers: which of the two moved decides whether the fix is reach or a reason to follow; for followers, whether people still visit the profile but don’t follow from it.'],
    ['Big days','a day in the last week at least twice a normal day on Facebook, Instagram or YouTube, with the biggest post that day, and whether installs or ad earnings jumped too.'],
    ['Reposting','this period’s top videos with no matching post on TikTok or YouTube within 10 days.'],
    ['TikTok and X','no TikTok video for 7 days or fewer than 3 a week; X taking 15% of our posts for 3% of our views or less.'],
    ['Milestones','a round number of followers or subscribers due within 3 weeks at the last 4 weeks’ pace.'],
    ['Data','a source more than 3 to 5 days behind, rows that failed to load, figures the sheet is missing.']];
  return `${ph('Action plan','Everything that needs doing, in the order to do it, worked out from the live figures.',`${dS(A.cs)} to ${dL(A.end)}`)}
    <div class="ap" data-f="${ACT_FILTER}">
    <div class="ap-hero">
      <div><div class="ap-k">From the 28 days to ${dL(A.end)}, against the 28 days before</div>
        <h2>${headline}</h2>
        <p>Numbered in the order to do them. The list updates by itself whenever the sheet changes, and a task drops off once the numbers say it is done.${SRC.live?' '+esc(SRC.note)+'.':''}</p></div>
      ${acts.length?`<button type="button" class="btn" id="copyact" title="Copy the whole list as text, ready to paste into WhatsApp, Slack or an email">${AP_ICON.copy}Copy the list</button>`:''}
    </div>
    ${acts.length>6?`<div class="ap-filters" role="toolbar" aria-label="Show actions">${fb('all','All',acts.length)}${[[1,'This week'],[2,'This month'],[3,'When there’s time']].filter(([p])=>cnt(p)).map(([p,l])=>fb('p'+p,l,cnt(p))).join('')}<span class="sep" aria-hidden="true"></span>${groups.map(([g,l])=>fb(g,l,acts.filter(a=>a.group===g).length)).join('')}</div>`:''}
    ${sec(1,'Do first','This week: the biggest problems in the numbers, or the ones Google penalises')}
    ${sec(2,'Next','This month: clear gains for modest effort')}
    ${sec(3,'When there’s time','Smaller gains and housekeeping')}
    <details class="card ap-how"><summary>How the action plan decides</summary>
      <p>Every task is worked out again whenever the sheet changes, from the 28 days up to the end of the chosen dates against the 28 days before; topics, formats, YouTube and the Android comparisons use the last 90 days so one big day can’t decide them. A rise or fall only counts when it is bigger than that number’s normal month-to-month swings (the same comparison made at weekly steps over the past six months), so a quiet month doesn’t raise false alarms. Reach and new followers are read together, so the advice fits the situation: fewer views but more followers means reach is the problem; more reach but fewer followers means people see the posts but find no reason to follow. Each task also checks the last 7 days: if things are still getting worse it moves up, and if they are already recovering it moves down.</p>
      <p>Tasks are ranked by how much of the business they touch: 70 and over is Do first, 45 to 69 is Next, below that is When there’s time. Each one says why the number moved, what to do, and what fixing it is worth in our own numbers; where that needs an assumption, such as 1 install per 10,000 views, it says so. A task marked New was not on the list for the 28 days before.</p>
      <ul>${how.map(([h,t])=>`<li><b>${h}:</b> ${t}</li>`).join('')}</ul>
      ${A.errors&&A.errors.length?`<p class="note">Some checks could not run: ${esc(A.errors.join('; '))}</p>`:''}
    </details>
    </div>`;
}
function applyActFilter(){
  document.querySelectorAll('[data-apf]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.apf===ACT_FILTER)));
  const vis=el=>ACT_FILTER==='all'||ACT_FILTER==='p'+el.dataset.pri||ACT_FILTER===el.dataset.grp;
  document.querySelectorAll('.ap .ac').forEach(el=>{ el.hidden=!vis(el); });
  document.querySelectorAll('.ap-sec[data-sec]').forEach(s=>{ s.hidden=!s.querySelector('.ac:not([hidden])'); });
}
function copyActions(){ const txt=ACT&&window.ATR_ACTIONS?ATR_ACTIONS.text(ACT):''; if(!txt) return;
  const done=()=>toast('Action list copied. Paste it anywhere.');
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done,()=>fallbackCopy(txt,done)); else fallbackCopy(txt,done); }
function fallbackCopy(txt,done){ const t=document.createElement('textarea'); t.value=txt; t.setAttribute('readonly',''); t.style.position='fixed'; t.style.opacity='0'; document.body.appendChild(t); t.select();
  try{ document.execCommand('copy'); done(); }catch(e){ toast('Could not copy here. Select the text and copy it by hand.'); } t.remove(); }

/* ================= experience ================= */
let SUMMARY_TEXT='';
const store={ get(k){ try{ return localStorage.getItem('dash:'+k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem('dash:'+k,v); }catch(e){} } };
const REDUCE=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toast.h); toast.h=setTimeout(()=>t.classList.remove('on'),2200); }

/* numbers count up from zero when a page opens, keeping their own format */
function countUp(root){
  if(REDUCE||!root) return;
  root.querySelectorAll('.kc .v,.sci .v,.hn .v').forEach(el=>{
    const txt=el.textContent.trim(); const m=txt.match(/^([^\d+\-]*)([+\-]?)([\d,]*\.?\d+)(\D*)$/); if(!m) return;
    const [,pre,sign,numS,suf]=m; const target=parseFloat(numS.replace(/,/g,'')); if(!isFinite(target)||target===0) return;
    const dec=(numS.split('.')[1]||'').length, comma=numS.includes(','), t0=performance.now(), dur=750;
    const fmt=v=>{ let x=v.toFixed(dec); if(comma){ const [i,f]=x.split('.'); x=i.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(f?'.'+f:''); } return pre+sign+x+suf; };
    const step=now=>{ const k=Math.max(0,Math.min(1,(now-t0)/dur)), e=1-Math.pow(1-k,3); el.textContent=fmt(target*e); if(k<1) requestAnimationFrame(step); else el.textContent=txt; };
    requestAnimationFrame(step);
  });
}
function show(id,opt={}){ if(!PAGES.some(p=>p[0]===id)) return; PAGE=id;
  document.querySelectorAll('.pg').forEach(s=>s.hidden=s.id!=='p-'+id);
  document.querySelectorAll('#nav a').forEach(a=>a.setAttribute('aria-current',a.dataset.page===id?'true':'false'));
  const name=(PAGES.find(p=>p[0]===id)||[])[1]||'';
  document.getElementById('ttl').textContent=name; document.title=`${name} | ${BRAND}`;
  store.set('page',id); try{ history.replaceState(null,'','#'+id); }catch(e){}
  if(!opt.keepScroll) window.scrollTo(0,0);
  countUp(document.getElementById('p-'+id));
}
function go(id){ show(id); }
/* ---------- date range control ---------- */
const $=id=>document.getElementById(id);
function paintRange(){
  if(!W) return; const B=dataBounds();
  $('rname').textContent=rangeName();
  $('rdates').textContent=`${dS(W.cs)}${W.cs.slice(0,4)!==W.end.slice(0,4)?' '+W.cs.slice(0,4):''} to ${dL(W.end)}`;
  $('per').textContent=W.ps<B.start?`${N} day${N>1?'s':''}, no earlier period to compare`:`${N} day${N>1?'s':''}, compared with ${dS(W.ps)} to ${dL(W.pe)}`;
  $('rprev').disabled=W.cs<=B.start; $('rnext').disabled=W.end>=B.endAll;
}
function saveRange(){
  store.set('range',JSON.stringify(R));
  try{ const q=R.preset==='custom'?`?from=${R.from}&to=${R.to}`:(R.preset==='28'?'':`?range=${R.preset}`); history.replaceState(null,'',location.pathname+q+location.hash); }catch(e){}
}
function setRange(preset,from,to,msg){
  R.preset=preset; if(preset==='custom'){ R.from=from; R.to=to; } else { R.from=null; R.to=null; }
  saveRange(); closePop(); const y=window.scrollY; render(); show(PAGE,{keepScroll:true}); window.scrollTo(0,y);
  if(msg) toast(msg);
}
function shiftRange(dir){
  const B=dataBounds(), L=W.L; let f=addD(W.cs,dir*L), t=addD(W.end,dir*L);
  if(t>B.endAll){ t=B.endAll; f=addD(t,-(L-1)); } if(f<B.start){ f=B.start; t=addD(f,L-1); if(t>B.endAll) t=B.endAll; }
  if(f===W.cs&&t===W.end) return;
  setRange('custom',f,t,`Showing ${dS(f)} to ${dL(t)}`);
}
function openPop(){
  const B=dataBounds(), pop=$('rpop');
  $('rpresets').innerHTML=PRESETS.map(([k,l])=>{ const d=presetDates(k); const f=d.from<B.start?B.start:d.from;
    return `<button type="button" data-preset="${k}" aria-pressed="${R.preset===k}">${l}<small>${f.slice(0,7)===d.to.slice(0,7)?`${+f.slice(8,10)}\u2013${dS(d.to)}`:`${dS(f)}${f.slice(0,4)!==d.to.slice(0,4)?' '+f.slice(2,4):''} \u2013 ${dS(d.to)}`}</small></button>`; }).join('');
  const f=$('rfrom'), t=$('rto'); [f,t].forEach(i=>{ i.min=B.start; i.max=B.endAll; }); f.value=W.cs; t.value=W.end;
  $('rerr').textContent=''; $('rnote').textContent=`The sheet covers ${dL(B.start)} to ${dL(B.endAll)}. Every figure compares with the same number of days just before your range.`;
  pop.hidden=false; $('rbtn').setAttribute('aria-expanded','true');
  const cur=pop.querySelector('[aria-pressed="true"]')||pop.querySelector('button'); if(cur) cur.focus();
}
function closePop(){ const p=$('rpop'); if(p&&!p.hidden){ p.hidden=true; $('rbtn').setAttribute('aria-expanded','false'); } }
function applyCustom(){
  const B=dataBounds(), f=$('rfrom').value, t=$('rto').value, err=$('rerr'), ok=/^\d{4}-\d{2}-\d{2}$/;
  if(!f||!t){ err.textContent='Choose both a start and an end date.'; return; }
  if(!ok.test(f)||!ok.test(t)){ err.textContent='Those dates are not valid.'; return; }
  if(f>t){ err.textContent='The start date is after the end date.'; return; }
  if(t<B.start||f>B.endAll){ err.textContent=`Choose dates between ${dL(B.start)} and ${dL(B.endAll)}.`; return; }
  const ff=f<B.start?B.start:f, tt=t>B.endAll?B.endAll:t;
  setRange('custom',ff,tt,(ff!==f||tt!==t)?`Adjusted to the data available: ${dS(ff)} to ${dL(tt)}`:`Showing ${dS(ff)} to ${dL(tt)}`);
}

document.addEventListener('click',e=>{
  const a=e.target.closest('#nav a'); if(a){ e.preventDefault(); show(a.dataset.page); return; }
  const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); show(g.dataset.go); return; }
  const pr=e.target.closest('[data-preset]'); if(pr){ setRange(pr.dataset.preset,null,null,`Showing ${(PRESETS.find(p=>p[0]===pr.dataset.preset)||[])[1]}`); return; }
  const dr=e.target.closest('[data-range]'); if(dr){ const [f,t]=dr.dataset.range.split('|'); setRange('custom',f,t,`Showing ${dS(f)} to ${dL(t)}`); return; }
  if(e.target.closest('#rbtn')){ $('rpop').hidden?openPop():closePop(); return; }
  if(e.target.closest('#rprev')){ shiftRange(-1); return; }
  if(e.target.closest('#rnext')){ shiftRange(1); return; }
  if(e.target.closest('#rapply')){ applyCustom(); return; }
  if(!e.target.closest('#rpop')) closePop();
  if(e.target.closest('#copysum')){ copySummary(); return; }
  if(e.target.closest('#copyact')){ copyActions(); return; }
  const apf=e.target.closest('[data-apf]'); if(apf){ ACT_FILTER=apf.dataset.apf; applyActFilter(); return; }
  if(e.target.closest('#refresh')||e.target.closest('#readnow')){ loadLive(true); return; }
  if(e.target.closest('#keys')&&!e.target.closest('#keys>div')) document.getElementById('keys').classList.remove('on');
});
document.addEventListener('keydown',e=>{
  if(e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]')) return;
  if(e.metaKey||e.ctrlKey||e.altKey) return;
  const keys=document.getElementById('keys');
  if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.go){ show(e.target.dataset.go); return; }
  if(e.key==='Escape'){ keys.classList.remove('on'); closePop(); return; }
  if(e.target.closest&&e.target.closest('#rpop')){ if(e.key==='Enter'&&e.target.tagName==='INPUT') applyCustom(); return; }
  if(e.key==='?'){ keys.classList.toggle('on'); return; }
  const i=PAGES.findIndex(p=>p[0]===PAGE);
  if(e.key==='ArrowRight'&&PAGES[i+1]){ show(PAGES[i+1][0]); }
  else if(e.key==='ArrowLeft'&&PAGES[i-1]){ show(PAGES[i-1][0]); }
  else if(e.key==='t'||e.key==='T'){ const cyc=['7','28','90']; const nx=cyc[(cyc.indexOf(R.preset)+1)%3]||'28'; setRange(nx,null,null,`Showing the last ${nx} days`); }
  else if(e.key==='['){ shiftRange(-1); } else if(e.key===']'){ shiftRange(1); }
  else if(e.key==='d'||e.key==='D'){ e.preventDefault(); openPop(); }
  else if(e.key==='p'||e.key==='P'){ window.print(); }
});
window.addEventListener('hashchange',()=>{ const id=(location.hash||'').slice(1); if(id&&id!==PAGE) show(id); });
let NARROW=window.innerWidth<640; window.addEventListener('resize',()=>{ const n=window.innerWidth<640; if(n!==NARROW){ NARROW=n; render(); } });

async function copySummary(){
  const txt=SUMMARY_TEXT;
  try{ await navigator.clipboard.writeText(txt); toast('Summary copied. Paste it into an email or message.'); }
  catch(e){ const ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); toast('Summary copied. Paste it into an email or message.'); }catch(err){ toast('Copy is not available in this browser.'); } ta.remove(); }
}

/* freshness line in the top bar */
function ago(t){ const m=Math.round((Date.now()-t)/60000); if(m<1) return 'just now'; if(m<60) return `${m} minute${m>1?'s':''} ago`; const h=Math.round(m/60); if(h<24) return `${h} hour${h>1?'s':''} ago`; const d=Math.round(h/24); return `${d} day${d>1?'s':''} ago`; }
function paintFresh(){ const f=document.getElementById('fresh'); if(!f) return;
  f.className='fresh'+(SRC.busy?' busy':SRC.live?' live':'');
  const down=SRC.live&&SRC.errorAt&&(!SRC.checkedAt||SRC.errorAt>SRC.checkedAt);
  if(down) f.className='fresh warn';
  const once=!DATA_URL&&!FILE_URL&&!LOCAL.handle;   /* a file opened once, or the sample: nothing to keep in sync */
  f.querySelector('span').textContent=SRC.busy?'Reading the workbook':down?'Can\u2019t reach the workbook, retrying':once?(SRC.note||'No data yet'):SRC.live?(SRC.checkedAt&&!document.hidden&&Date.now()-SRC.checkedAt>3*60*1000?'Sync delayed, retrying':`Live, synced ${ago(SRC.checkedAt||SRC.at)}`):(SRC.note||'Not connected');
  f.title=down?`${SRC.lastError}. Showing the figures from the last successful check, ${ago(SRC.checkedAt||SRC.at)}. Retrying every minute.`:once?'Opened on this device. Open the file again, or connect a Worker or file link in config.js, to keep it current.':SRC.live?`Checks the workbook every minute while this page is open. It last changed ${ago(SRC.at)}.`:'Not connected yet.'; }
/* watchdog: if a check hasn't completed for 3 minutes while the page is open, try again straight away */
setInterval(()=>{ if(SRC.live&&!document.hidden&&!LIVE.busy&&SRC.checkedAt&&Date.now()-SRC.checkedAt>3*60*1000) checkLive(false); paintFresh(); },30000);
setInterval(paintFresh,20000);

const SRC={live:false,busy:false,at:null,to:dS([lastD(D.fb),lastD(D.web),lastD(D.play)].filter(Boolean).sort().pop()),note:''};

/* start where the reader left off */
(()=>{ const q=new URLSearchParams(location.search), ok=/^\d{4}-\d{2}-\d{2}$/;
  if(ok.test(q.get('from')||'')&&ok.test(q.get('to')||'')){ R.preset='custom'; R.from=q.get('from'); R.to=q.get('to'); }
  else if(q.get('range')&&PRESETS.some(p=>p[0]===q.get('range'))){ R.preset=q.get('range'); }
  /* otherwise every visit opens on All time; the last dates someone picked are not carried over */
  if(!(location.hash||'').slice(1)){ const p=store.get('page'); if(p&&PAGES.some(x=>x[0]===p)) PAGE=p; } })();
if(LOCKED){ const lb=document.getElementById('lockbtn'); if(lb) lb.hidden=false; }
setTimeout(startApp,0);

/* ================= live updates =================
   Every minute (while the page is visible) ask the server one tiny question:
   "which version of the sheet is current?". Only when the answer changes are
   the new figures fetched, and the page is updated in place: same page, same
   dates, same scroll position, no reload. */

/* ================= live via a Cloudflare Worker =================
   When config.js gives a data link, the dashboard fetches the Excel through it and
   reads it here, in a background thread, so the page never freezes. */
const DATA_CFG=(window.DASH&&window.DASH.data)||{};
const DATA_URL=String(DATA_CFG.workerUrl||window.ATR_DATA_URL||'').trim().replace(/\/+$/,'');
const FILE_URL=String(DATA_CFG.fileUrl||'').trim();
/* the Excel library ships with the template (xlsx.full.min.js), so nothing depends on an outside server; a full web address works too */
const XLSX_URL=new URL(DATA_CFG.excelLibrary||window.ATR_XLSX_URL||'xlsx.full.min.js',location.href).href;
/* the sheet reader is in reader.js */
let READER=null;
function reader(){ if(READER) return READER;
  READER=new Worker('reader.js?lib='+encodeURIComponent(XLSX_URL)+'&cur='+encodeURIComponent(CUR)); return READER; }
function parseBook(buf){ return new Promise((res,rej)=>{ const w=reader();
  /* reading has a time limit too; if it stalls, start a fresh reader next time and say why */
  const t=setTimeout(()=>{ try{ w.terminate(); }catch(e){} READER=null; rej(new Error('Reading the Excel took longer than 2 minutes')); },window.ATR_PARSE_TIMEOUT||120000);
  w.onmessage=e=>{ clearTimeout(t); e.data.ok?res(e.data.out):rej(new Error('The Excel could not be read: '+e.data.error)); };
  w.onerror=e=>{ clearTimeout(t); READER=null; rej(new Error(e.message||'The Excel reader could not start')); };
  w.postMessage(buf,[buf]); }); }
async function fingerprint(buf){ try{ const h=await crypto.subtle.digest('SHA-1',buf); return [...new Uint8Array(h)].slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join(''); }catch(e){ return String(buf.byteLength); } }
/* every request has a time limit, so a slow answer can never leave the page stuck */
async function fetchT(url,ms,asBuffer){ const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms);
  try{ const tok=LOCKED&&DATA_URL&&String(url).startsWith(DATA_URL)?AUTH.token():null;
    const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:tok?{Authorization:'Bearer '+tok}:{}}); if(!r.ok){ let msg='The data link returned '+r.status; try{ msg=(await r.json()).error||msg; }catch(e){} const er=new Error(msg); er.status=r.status; throw er; }
    return asBuffer?await r.arrayBuffer():await r.json(); }
  catch(e){ if(e.name==='AbortError') throw new Error('The data link took too long to answer'); throw e; }
  finally{ clearTimeout(t); } }
/* datasets that should never shrink suddenly; a big drop usually means a tab is being rewritten */
const GUARD=['fb','yt','ig','web','play','apple','igPosts','fbPosts','xPosts','ttVideos','admob','adsense','pSubs','aSubs','earn','qual','ytVideos'];
function soon(ms){ clearTimeout(LIVE.soonT); LIVE.soonT=setTimeout(()=>checkLive(false),ms); }
async function checkWorker(manual){
  let meta=null, metaErr=null; try{ meta=await fetchT(DATA_URL+'/meta',15000); if(meta&&meta.error) metaErr=meta.error; }catch(e){ metaErr=e.message; }
  const quick=meta&&meta.v;
  if(quick&&quick===LIVE.v&&!manual) return {state:'same'};
  /* without the API key the file itself is the only way to know; fetch it at most every 5 minutes */
  if(!quick&&!manual&&LIVE.v&&Date.now()-(LIVE.lastBook||0)<5*60*1000) return metaErr?{state:'unknown',why:metaErr}:{state:'same'};
  const t0=Date.now(); const buf=await fetchT(DATA_URL+'/book'+(quick?'?v='+encodeURIComponent(meta.v):'?t='+Date.now()),window.ATR_BOOK_TIMEOUT||120000,true); LIVE.lastBook=Date.now(); SRC.bytes=buf.byteLength; SRC.dlSecs=(Date.now()-t0)/1000;
  const v=quick||await fingerprint(buf);
  if(v===LIVE.v&&!manual) return {state:'same'};
  const t1=Date.now(); const out=await parseBook(buf); SRC.readSecs=(Date.now()-t1)/1000;
  /* 1. the sheet must not have changed while it was being downloaded; if it did, the pipeline was still writing */
  if(quick){ let m2=null; try{ m2=await fetchT(DATA_URL+'/meta',15000); }catch(e){}
    if(m2&&m2.v&&m2.v!==quick){ SRC.hold='The sheet changed while it was being read, so that read was set aside. Reading again shortly.'; return {state:'moving'}; } }
  /* 2. a tab that suddenly lost most of its rows is probably being rewritten: keep the last good data unless it stays that way */
  const drops=GUARD.filter(k=>Array.isArray(D[k])&&D[k].length>=20&&Array.isArray(out[k])&&out[k].length<D[k].length*0.5).map(k=>`${k} ${D[k].length}\u2192${out[k].length}`);
  /* and each tab on its own: a dataset built from two tabs barely shrinks when one of them is emptied mid-rewrite */
  { const oldT={}; ((D.extra&&D.extra.tabStats)||[]).forEach(t=>{ oldT[t.name]=t.rows||0; }); const newT=(out.extra&&out.extra.tabStats)||[];
    newT.forEach(t=>{ const o=oldT[t.name]||0; if(o>=20&&(t.rows||0)<o*0.5) drops.push(`${t.name} tab ${full(o)}\u2192${full(t.rows||0)} rows`); });
    Object.keys(oldT).forEach(n=>{ if(oldT[n]>=20&&!newT.some(t=>t.name===n)) drops.push(`${n} tab missing`); }); }
  if(drops.length&&!LIVE.first){ const sig=drops.join(',');
    LIVE.suspect=LIVE.suspect&&LIVE.suspect.sig===sig?{sig,n:LIVE.suspect.n+1}:{sig,n:1};
    if(LIVE.suspect.n<3){ SRC.hold=`Part of the sheet looks half-written (${drops.join(', ')}). Keeping the last good figures and checking again shortly.`; return {state:'hold'}; } }
  LIVE.suspect=null; SRC.hold=null;
  LIVE.before=LIVE.first?null:metricSnap();
  Object.keys(out).forEach(k=>{ D[k]=out[k]; });
  LIVE.v=v; return {state:'new',modified:(meta&&meta.modified)||null};
}

const LIVE={v:null,busy:false,first:true,every:60*1000,timer:null,lastBook:0};
function popOpen(){ const p=document.getElementById('rpop'); return p&&!p.hidden; }
document.addEventListener('DOMContentLoaded',()=>setTimeout(reapplySorts,0));
function redraw(){
  const y=window.scrollY; render(); reapplySorts(); document.querySelectorAll('.pg').forEach(x=>x.hidden=x.id!=='p-'+PAGE); window.scrollTo(0,y);
}
async function checkLive(manual){
  if(LIVE.busy){ if(manual) toast('Still reading the sheet. The figures update as soon as it finishes.'); return; }
  if(DATA_URL){ return checkLiveWorker(manual); }
  if(FILE_URL){ return checkLiveFile(manual); }
  if(LOCAL.handle){ return checkLiveLocal(manual); }
  if(manual&&LOCAL.kind) toast(LOCAL.kind==='sample'?'This is the sample workbook. Open your own file on the Connect data page.':'Open the file again to read the latest version (in Chrome and Edge the page re-reads it by itself).');
  return;
}




/* Instagram account totals arrive per period (usually a month). For the chosen dates, periods inside count fully;
   a period only partly inside counts by its share of days, and the page says so. */

function acctTotals(a,b){ const rs=D.igAcct||[]; let est=false, any=false; const o={v:0,pv:0,lc:0,ti:0,fo:0,ae:0}, seen={};
  rs.forEach(r=>{ const f=r.from||r.to, t=r.to||r.from; if(!f||!t||t<a||f>b) return; const all=days(f,t).length||1, ov=days(f>a?f:a,t<b?t:b).length, sh=ov/all; if(sh<1) est=true; any=true;
    for(const k in o){ if(typeof r[k]==='number'){ o[k]+=r[k]*sh; seen[k]=1; } } });
  if(!any) return null; for(const k in o) if(!seen[k]) o[k]=null; return {...o,est}; }
/* ================= what changed: a fixed yardstick, independent of the dates on screen ================= */
function metricSnap(){
  const S=(a,k)=>(a||[]).reduce((t,r)=>t+(typeof r[k]==='number'?r[k]:0),0);
  const lastOf=(a,k)=>{ for(let i=(a||[]).length-1;i>=0;i--){ if(typeof a[i][k]==='number') return a[i][k]; } return null; };
  const lastDay=a=>a&&a.length?a[a.length-1].d:null;
  const igp=(D.igPosts||[]).filter(p=>!/story/i.test(p.ty||'')), ttd=(D.ttVideos||[]).filter(v=>v.d);
  const m={'Social views':[S(D.fb,'v')+S(igp,'v')+S(D.yt,'v')+S(D.xPosts,'im')+S(ttd,'v'),'n'],
    'Facebook views':[S(D.fb,'v'),'n'],'Instagram views':[S(igp,'v'),'n'],'YouTube views':[S(D.yt,'v'),'n'],'X impressions':[S(D.xPosts,'im'),'n'],'TikTok plays':[S(ttd,'v'),'n'],
    'Facebook interactions':[S(D.fb,'e'),'n'],'Instagram interactions':[igp.reduce((t,p)=>t+igI(p),0),'n'],'YouTube interactions':[S(D.yt,'l')+S(D.yt,'c')+S(D.yt,'s'),'n'],'X engagements':[S(D.xPosts,'e'),'n'],
    'Facebook followers':[lastOf(D.fb,'f'),'n'],'YouTube subscribers':[lastOf(D.ytSnap,'subs'),'n'],'TikTok followers':[lastOf(D.ttAcct,'f'),'n'],'X followers':[lastOf(D.xAcct,'f'),'n'],
    'Website visits':[S(D.web,'s'),'n'],'Google Play installs':[S(D.play,'i'),'n'],'Apple downloads':[S(D.apple,'dl'),'n'],
    'Paying subscribers':[(lastOf(D.pSubs,'a')||0)+(lastOf(D.aSubs,'s')||0),'n'],'Apple free trials':[lastOf(D.aSubs,'t')||0,'n'],
    'Instagram profile visits':[S(D.ig,'pv')+S(D.igAcct,'pv'),'n'],
    'Apple revenue':[S(D.apple,'rev'),'$'],'Google Play revenue':[-S(D.earn,'fee')/0.15*0.85,'$'],'AdSense earnings':[S(D.adsense,'e'),'$'],'AdMob earnings':[S(D.admob,'e'),'$']};
  const latest={Facebook:lastDay(D.fb),Instagram:lastDay(D.ig),YouTube:lastDay(D.yt),Website:lastDay(D.web),'Google Play':lastDay(D.play),Apple:lastDay(D.apple),AdMob:lastDay(D.admob),AdSense:lastDay(D.adsense),X:lastDay(D.xPosts),TikTok:lastDay(D.ttAcct)};
  const posts=[...igp.map(p=>['Instagram',p.id,p.t,p.v,p.ty]),...(D.fbPosts||[]).map(p=>['Facebook',p.id,p.t,p.v,p.ty]),...(D.xPosts||[]).map(p=>['X',p.id,p.t,p.im,'post']),...ttd.map(v=>['TikTok',v.id,v.t,v.v,'video']),...(D.ytVideos||[]).map(p=>['YouTube',p.id,p.t,p.v,p.ty])];
  return {t:Date.now(),m,latest,ids:posts.map(p=>p[0]+':'+p[1]),posts};
}
function fmtM(v,f,signed){ if(v==null) return '-'; const sg=signed&&v>0?'+':''; return f==='$'?sg+(v<0?'-':'')+CURSYM+Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):sg+Math.round(v).toLocaleString('en-US'); }
function diffSnap(a,b){ const out=[]; if(!a||!b) return out;
  for(const k in b.m){ const x=a.m[k]?a.m[k][0]:null, y=b.m[k][0], f=b.m[k][1]; if(y==null||x==null) continue; const d=y-x; if(Math.abs(d)<(f==='$'?0.005:0.5)) continue;
    const lvl=/followers|subscribers/i.test(k); out.push({k,d,f,short:`${k} ${fmtM(d,f,true)}`,txt:`${k}${lvl?'':', all time'}: ${fmtM(x,f)} \u2192 ${fmtM(y,f)} (${fmtM(d,f,true)})`}); }
  for(const p in b.latest){ if(b.latest[p]&&a.latest[p]&&b.latest[p]>a.latest[p]) out.push({k:p+' latest',short:`${p} up to ${dS(b.latest[p])}`,txt:`${p} now has data up to ${dL(b.latest[p])} (was ${dL(a.latest[p])}).`}); }
  const old=new Set(a.ids||[]); const np=(b.posts||[]).filter(p=>!old.has(p[0]+':'+p[1])).sort((x,y)=>(y[3]||0)-(x[3]||0));
  if(np.length&&a.ids&&a.ids.length){ const by={}; np.forEach(p=>by[p[0]]=(by[p[0]]||0)+1);
    const unit=pl=>/YouTube|TikTok/.test(pl)?'video':'post';
    out.unshift({k:'new posts',short:Object.entries(by).map(([pl,n])=>`${n} new ${pl} ${unit(pl)}${n>1?'s':''}`).join(', '),txt:`New posts: ${Object.entries(by).map(([pl,n])=>`${n} on ${pl}`).join(', ')}.`,
      list:np.slice(0,6).map(p=>`${p[0]}${p[4]?' '+p[4]:''}: \u201C${String(p[2]||'(no caption)').slice(0,80)}\u201D, ${fmtM(p[3],'n')} ${p[0]==='X'?'impressions':p[0]==='TikTok'?'plays':'views'} so far`)}); }
  const sv=out.findIndex(o=>o.k==='Social views'); if(sv>0) out.unshift(out.splice(sv,1)[0]);
  return out; }
/* cards whose figure changed glow for a moment */
function cardMap(){ const m=new Map(); document.querySelectorAll('.pg').forEach(pg=>{ const id=pg.id;
  const add=(sel,kf,vf)=>pg.querySelectorAll(sel).forEach(e=>{ const k=kf(e), v=vf(e); if(k&&v!=null) m.set(id+'|'+sel+'|'+k,[e,v]); });
  add('.kc',e=>(e.querySelector('.l')||{}).textContent,e=>(e.querySelector('.v')||{}).textContent);
  add('.sci',e=>(e.querySelector('.t')||{}).textContent,e=>(e.querySelector('.v')||{}).textContent);
  add('.hn',e=>(e.querySelector('.l')||{}).textContent,e=>(e.querySelector('.v')||{}).textContent);
  add('.pcard',e=>(e.querySelector('.pch')||{}).textContent,e=>(e.querySelector('.pmain')||{}).textContent);
  add('.bcard',e=>(e.querySelector('.bch')||{}).textContent,e=>((e.querySelector('.bcm')||{}).textContent||'')+((e.querySelector('.bct')||{}).textContent||''));
  pg.querySelectorAll('.fnl').forEach(f=>{ const h=(f.querySelector('h4')||{}).textContent; f.querySelectorAll('.fs').forEach(st=>{ const l=(st.querySelector('.fs-txt small')||{}).textContent, b=st.querySelector('.fs-txt b'); if(l&&b) m.set(id+'|fs|'+h+'|'+l,[st,b.textContent]); }); }); });
  return m; }
function markChanged(before){ let n=0; const after=cardMap();
  after.forEach(([el,v],k)=>{ const b=before.get(k); if(b&&b[1]!==v){ n++; el.classList.add('upd'); if(!el.querySelector('.updchip')){ const c=document.createElement('span'); c.className='updchip'; c.textContent='updated'; el.appendChild(c); }
    setTimeout(()=>{ el.classList.remove('upd'); const c=el.querySelector('.updchip'); if(c) c.remove(); },12000); } });
  return n; }
/* since your last visit */
/* the version of the definitions behind the figures. Bump it whenever a figure starts being measured differently,
   so a browser never reports a change of definition as a change in the data. 2: Google Play after Google's fee; paying subscribers exclude free trials. */
const SNAP_VER=2;
const DEF_NOTES={2:'Google Play revenue is now shown after Google\u2019s 15% fee (like Apple\u2019s), and paying subscribers no longer include people on a free trial. Figures for the same dates may read lower than before; nothing changed in the sheet.'};
function saveVisit(){ try{ if(!SRC.live) return; const s=metricSnap(); localStorage.setItem('dash-visit',JSON.stringify({ver:SNAP_VER,t:s.t,m:s.m,latest:s.latest,ids:s.ids})); }catch(e){} }
function loadVisit(){ try{ const v=JSON.parse(localStorage.getItem('dash-visit')||'null'); if(!v) return;
  if((v.ver||1)!==SNAP_VER){ VISIT.defNote=DEF_NOTES[SNAP_VER]||'Some figures are now measured differently.'; return; }   /* measured under older definitions: not comparable */
  const d=diffSnap(v,metricSnap()); if(d.length){ VISIT.diff=d; VISIT.since=v.t; } }catch(e){} }
document.addEventListener('visibilitychange',()=>{ if(document.hidden) saveVisit(); });
window.addEventListener('pagehide',saveVisit);
setInterval(()=>{ if(!document.hidden) saveVisit(); },10*60*1000);
/* ================= self-audit: the dashboard checks itself after every update ================= */
function runAudit(){
  const out=[...AUD.render];
  const pick=(els,re)=>els.find(h=>re.test(h.textContent));
  const sv=[['summary banner',pick([...document.querySelectorAll('#p-summary .hn')],/Social views/)],['scorecard',pick([...document.querySelectorAll('#p-summary .sci')],/Social reach/)],
    ['Social overview',[...document.querySelectorAll('#p-social .kc')][0]],['whole-business funnel',document.querySelector('#p-funnels .fnl .fs .fs-txt b')]]
    .map(([n,e])=>[n,e?((e.querySelector&&e.querySelector('.v'))?e.querySelector('.v').textContent:e.textContent).trim():null]).filter(x=>x[1]);
  out.push({g:'Consistency',n:'Social views read the same everywhere',ok:new Set(sv.map(x=>x[1])).size===1?'pass':'fail',d:sv.map(x=>`${x[0]} ${x[1]}`).join(', ')});
  const TS=(D.extra&&D.extra.tabStats)||[]; const newest=TS.reduce((a,t)=>t.last&&(!a||t.last>a)?t.last:a,null);
  const failed=TS.filter(t=>t.errors), dup=TS.filter(t=>t.dups), neg=TS.filter(t=>t.neg), fut=TS.filter(t=>t.future), empty=TS.filter(t=>t.rows===0);
  /* a tab replaced by a fresher tab carrying the same figures is not stale (Meta Organic is continued by Facebook Page Activity) */
  const SUPERSEDED={'Meta Organic':'Facebook Page Activity'}, byName=Object.fromEntries(TS.map(t=>[t.name,t]));
  const LABEL={'Meta':'Meta ads','GA4':'GA4 (website)','GA4 Channels':'GA4 Channels (website)','YouTube':'YouTube channel totals'};
  /* post and video tabs are dated by when things were published, so a quiet week is not staleness; they are left out here */
  const POSTTABS=['Instagram Posts','Facebook Posts','YouTube Videos','YouTube Shorts','Instagram Stories','Facebook Stories'];
  const stale=TS.filter(t=>t.last&&newest&&(Date.parse(newest)-Date.parse(t.last))>3*864e5&&t.rows>0&&!POSTTABS.includes(t.canon||t.name)&&!(SUPERSEDED[t.name]&&byName[SUPERSEDED[t.name]]&&byName[SUPERSEDED[t.name]].last>t.last));
  out.push({g:'Sheet',n:'No failed rows',ok:failed.length?'warn':'pass',d:failed.length?failed.map(t=>`${tabName(t)}: ${full(t.errors)} rows failed and are left out`).join('; '):'Every row came through.'});
  out.push({g:'Sheet',n:'Duplicate rows counted once',ok:'pass',d:dup.length?dup.map(t=>`${tabName(t)}: ${full(t.dups)}`).join('; ')+' duplicate rows, each counted once.':'No duplicate rows.'});
  out.push({g:'Sheet',n:'No impossible negative figures',ok:neg.length?'fail':'pass',d:neg.length?neg.map(t=>`${t.name}: ${t.neg}`).join('; '):'None found.'});
  out.push({g:'Sheet',n:'No dates in the future',ok:fut.length?'warn':'pass',d:fut.length?fut.map(t=>`${t.name}: ${t.future} rows`).join('; '):'None found.'});
  out.push({g:'Sheet',n:'Every tab is up to date',ok:stale.length?'warn':'pass',d:stale.length?stale.sort((a,b)=>a.last<b.last?-1:1).map(t=>`${tabName(t)} (to ${dS(t.last)})`).join(', '):`All tabs reach ${newest?dL(newest):'-'}.`});
  { const fm=D.fxMissing||{}, ks=Object.keys(fm); out.push({g:'Sheet',n:'All Apple revenue converted to '+CUR,ok:ks.length?'warn':'pass',d:ks.length?`No exchange rate for ${ks.map(k=>`${k} (${full(Math.round(fm[k]*100)/100)})`).join(', ')}, so that revenue is not in the totals yet.`:'Every currency Apple paid in has an exchange rate.'}); }
  if(empty.length) out.push({g:'Sheet',n:'Set up but still empty',ok:'warn',d:`${join2g(empty.map(tabName))}. These fill in by themselves once the pipeline sends rows.`});
  if(W){ const gaps=[['Facebook',D.fb],['YouTube',D.yt],['Instagram',D.ig],['Website',D.web],['Google Play installs',D.play],['App Store downloads',D.apple],['Google Play subscriptions',D.pSubs],['App Store subscriptions',D.aSubs],['AdMob',D.admob],['AdSense',D.adsense]].map(([n,rs])=>{ const have=new Set((rs||[]).map(r=>r.d)); const first=rs&&rs.length?rs[0].d:null, last=rs&&rs.length?rs[rs.length-1].d:null;
      if(!first) return null; const a=[W.cs,first].sort()[1], b=[W.end,last].sort()[0]; if(a>b) return null; const miss=days(a,b).filter(d=>!have.has(d)); return miss.length?`${n}: ${miss.length} day${miss.length>1?'s':''} (${miss.slice(0,3).map(dS).join(', ')}${miss.length>3?'\u2026':''})`:null; }).filter(Boolean);
    /* the missing-days check is kept off the audit */ }
  const syncAge=SRC.checkedAt?(Date.now()-SRC.checkedAt)/1000:null;
  out.push({g:'Live sync',n:'Reading the live sheet',ok:SRC.live?'pass':'warn',d:SRC.live?`Last checked ${ago(SRC.checkedAt||SRC.at)}; the sheet last changed ${ago(SRC.at)}.`:'Showing the built-in figures; not connected to the live sheet.'});
  if(SRC.live) out.push({g:'Live sync',n:'Checking on schedule',ok:syncAge!==null&&syncAge<180?'pass':'warn',d:syncAge!==null?`Checked ${Math.round(syncAge)} seconds ago; checks run every minute.`:'Not checked yet.'});
  if(SRC.hold) out.push({g:'Live sync',n:'Waiting for the sheet',ok:'warn',d:SRC.hold});
  AUD.result=out; AUD.at=Date.now(); paintAudit(); return out; }
function paintAudit(){ const r=AUD.result||[]; const f=r.filter(x=>x.ok==='fail').length, w=r.filter(x=>x.ok==='warn').length, p=r.filter(x=>x.ok==='pass').length;
  const box=document.getElementById('auditbox');
  if(box) box.innerHTML=`<div class="audsum ${f?'bad':w?'warn':'good'}"><b>${f?`${f} problem${f>1?'s':''}`:w?`${w} warning${w>1?'s':''}`:'All checks passed'}</b> <span>${p} passed, ${w} warning${w===1?'':'s'}, ${f} problem${f===1?'':'s'}. Last run ${AUD.at?new Date(AUD.at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'-'}.</span></div>
    <div class="tw" style="box-shadow:none"><table style="min-width:0"><tbody>${r.map(x=>`<tr><td style="width:26px;text-align:center"><span class="audic ${x.ok}">${x.ok==='pass'?'\u2713':x.ok==='warn'?'!':'\u2715'}</span></td><td style="text-align:left;width:34%"><small style="display:block;color:var(--ink-3)">${x.g}</small><b>${esc(x.n)}</b></td><td style="text-align:left;white-space:normal;color:var(--ink-2)">${esc(x.d||'')}</td></tr>`).join('')}</tbody></table></div>`;
  const chip=document.getElementById('auditchip');
  if(chip){ chip.className='auditchip '+(f?'bad':w?'warn':'good'); chip.textContent=f?`Audit: ${f} problem${f>1?'s':''}`:w?`Audit: ${w} warning${w>1?'s':''}`:'Audit: all clear'; } }

/* ---------- change log: what changed in the sheet, and when (kept in this browser) ---------- */
function sheetSig(){ const X=D.extra||{}; return {tabs:Object.fromEntries((X.tabStats||[]).map(t=>[t.name,{rows:t.rows,last:t.last,loadedAt:t.loadedAt,sig:t.sig}])),
  newTabs:(X.tabs||[]).map(t=>t.name+'|'+t.kind), newCols:(X.newCols||[]).map(c=>c.tab+': '+c.cols.join(', '))}; }
function noteChanges(diff){ try{
  const now=sheetSig(); if(!Object.keys(now.tabs).length) return;
  const prev=JSON.parse(localStorage.getItem('dash-sig')||'null'); const log=JSON.parse(localStorage.getItem('dash-log')||'[]'); const ev=[], t=Date.now();
  const where={social:'its own page under Audience, plus the social totals',earnings:'the Ad revenue page and revenue totals',website:'the Website page',app:'the App installs page',subs:'the Subscribers page',other:'Data coverage'};
  if(!prev) ev.push({t,m:`Started following the sheet on this device: ${Object.keys(now.tabs).length} tabs.`});
  else{
    now.newTabs.filter(x=>!prev.newTabs.includes(x)).forEach(x=>{ const [n,k]=x.split('|'); ev.push({t,m:`New tab: ${n}. Added to ${where[k]||'the dashboard'}.`}); });
    now.newCols.filter(c=>!prev.newCols.includes(c)).forEach(c=>ev.push({t,m:`New column${c.includes(',')?'s':''} in ${c}. Added to that tab's page.`}));
    for(const [n,a] of Object.entries(now.tabs)){ const b=prev.tabs[n]; if(!b) continue; const d=[];
      if(a.rows!==b.rows){ const k=a.rows-b.rows; d.push(`${k>0?'+':''}${k.toLocaleString('en-US')} ${Math.abs(k)===1?'row':'rows'}`); }
      if(a.last&&a.last!==b.last) d.push(`now up to ${dL(a.last)}`);
      if(a.rows===b.rows&&a.sig!==undefined&&b.sig!==undefined&&a.sig!==b.sig) d.push('figures changed');
      if(!d.length&&a.loadedAt&&a.loadedAt!==b.loadedAt) d.push('re-loaded, same days');
      if(d.length) ev.push({t,m:`${n}: ${d.join(', ')}.`}); }
    if(!ev.length) ev.push({t,m:'Figures changed in the sheet, with no new rows or days.'});
  }
  if(prev&&ev.length){ const det=[...(diff||[]).map(x=>x.txt),...((diff||[]).find(x=>x.list)||{list:[]}).list.map(l=>'\u2022 '+l),...ev.map(e=>e.m)];
    const head=(diff||[]).length?(diff||[]).slice(0,3).map(x=>x.short).join(', ')+((diff||[]).length>3?` and ${(diff||[]).length-3} more changes`:''):ev.length===1?ev[0].m:`${ev.length} tabs changed`;
    ev.splice(0,ev.length,{t:Date.now(),m:head,details:det}); }
  localStorage.setItem('dash-sig',JSON.stringify(now)); localStorage.setItem('dash-log',JSON.stringify([...ev,...log].slice(0,300)));
}catch(e){} }
function showNew(res,manual,note){ const cardsBefore=LIVE.first?null:cardMap(); const wasFirst=LIVE.first; SRC.live=true; SRC.at=Date.parse(res.modified||'')||Date.now();
  const diff=wasFirst?[]:diffSnap(LIVE.before,metricSnap()); const oldW=W?{cs:W.cs,end:W.end}:null; if(wasFirst) loadVisit(); LIVE.lastDiff=diff;
  SRC.note=note||`Sheet read ${new Date().toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}`;
  hideGate(); redraw(); if(wasFirst) show(PAGE,{keepScroll:true});
  if(!wasFirst&&oldW&&W&&(oldW.cs!==W.cs||oldW.end!==W.end)) diff.push({k:'dates',short:`dates on screen now ${dS(W.cs)} to ${dS(W.end)}`,txt:`The dates on screen moved to ${dS(W.cs)} to ${dL(W.end)}, because newer data arrived. Every figure for these dates was recalculated.`});
  noteChanges(diff); if(!wasFirst) redraw(); if(cardsBefore) markChanged(cardsBefore);
  cachePut();
  if(!wasFirst){ toast(diff.length?`Updated. All-time totals: ${diff.slice(0,3).map(x=>x.short).join(', ')}${diff.length>3?` and ${diff.length-3} more changes`:''}. Details on the Updates page.`:'The workbook was re-saved; no figures changed.',9000); }
  else if(manual) toast('Up to date with the workbook.'); }
async function checkLiveWorker(manual){
  if(LOCKED&&!AUTH.token()) return;
  if(!manual&&(document.hidden||popOpen())) return;
  LIVE.busy=true; document.getElementById('refresh').hidden=false;
  if(manual||LIVE.first){ SRC.busy=true; paintFresh(); }
  try{
    const res=await checkWorker(manual);
    if(res.state==='unknown'){ SRC.lastError=res.why||'Google did not answer'; SRC.errorAt=Date.now(); }   /* nothing was checked: not a sync */
    else { SRC.checkedAt=Date.now(); SRC.lastError=null; } if(res.state==='new') SRC.readAt=Date.now();
    if(res.state==='moving') soon(20000); else if(res.state==='hold') soon(45000); else if(res.state==='new') soon(20000);   /* pipelines write in bursts */
    if((res.state==='moving'||res.state==='hold')&&manual) toast(SRC.hold);
    if(res.state==='new'){ showNew(res,manual); if(LIVE.first) fetchIG(); }
    else if(manual) toast('Already up to date with the sheet.');
  }catch(e){ console.warn('Dashboard live data:',e);
    if(LOCKED&&e.status===401){ AUTH.clear(); await cacheDel(); LIVE.busy=false; SRC.busy=false; try{ sessionStorage.setItem('dash-gate-msg','Please sign in again.'); }catch(x){} location.reload(); return; }
    if(LOCKED&&!document.querySelector('.pg')){ LIVE.busy=false; SRC.busy=false; showGate('loading',`Could not read the sheet yet (${e.message}). Trying again shortly.`); setTimeout(()=>checkLive(true),20000); return; }
    SRC.lastError=e.message; SRC.errorAt=Date.now(); if(manual||LIVE.first) toast(`Could not read the sheet (${e.message}). Showing the last data.`); }
  LIVE.first=false; LIVE.busy=false; SRC.busy=false; paintFresh();
}


/* ================= the other ways in: a link to an .xlsx file, a file from this computer, the sample =================
   Each one reads the workbook with the same reader and the same safety checks as the Worker. */
const LOCAL={handle:null,name:'',kind:null,lastMod:0};          /* kind: 'file' (opened here), 'sample' */
const srcKey=()=>DATA_URL?'worker:'+DATA_URL:FILE_URL?'file:'+FILE_URL:'local';
async function kvGet(k){ try{ const db=await idb(); return await new Promise(res=>{ const g=db.transaction('kv','readonly').objectStore('kv').get(k); g.onsuccess=()=>res(g.result||null); g.onerror=()=>res(null); }); }catch(e){ return null; } }
async function kvPut(k,v){ try{ const db=await idb(); await new Promise((res,rej)=>{ const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').put(v,k); tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); }catch(e){} }
async function kvDel(k){ try{ const db=await idb(); await new Promise(res=>{ const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete=res; tx.onerror=res; }); }catch(e){} }
/* a workbook in: the same checks as the live link (a tab that suddenly lost most of its rows is held back while it is rewritten) */
async function applyBook(buf,opt){ opt=opt||{}; const v=await fingerprint(buf);
  if(v===LIVE.v&&!opt.manual) return {state:'same'};
  const t1=Date.now(); const out=await parseBook(buf); SRC.readSecs=(Date.now()-t1)/1000; SRC.readAt=Date.now();
  if(opt.guard&&!LIVE.first){ const drops=GUARD.filter(k=>Array.isArray(D[k])&&D[k].length>=20&&Array.isArray(out[k])&&out[k].length<D[k].length*0.5).map(k=>`${k} ${D[k].length}\u2192${out[k].length}`);
    if(drops.length){ const sig=drops.join(','); LIVE.suspect=LIVE.suspect&&LIVE.suspect.sig===sig?{sig,n:LIVE.suspect.n+1}:{sig,n:1};
      if(LIVE.suspect.n<3){ SRC.hold=`Part of the workbook looks half-written (${drops.join(', ')}). Keeping the last good figures and checking again shortly.`; return {state:'hold'}; } } }
  LIVE.suspect=null; SRC.hold=null; LIVE.before=LIVE.first?null:metricSnap();
  Object.keys(out).forEach(k=>{ D[k]=out[k]; }); LIVE.v=v; return {state:'new',modified:opt.modified||null}; }
const stamp=t=>new Date(t||Date.now()).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
/* B. a link to an .xlsx file, read again every minute */
async function checkLiveFile(manual){
  if(!manual&&(document.hidden||popOpen())) return;
  LIVE.busy=true; document.getElementById('refresh').hidden=false; if(manual||LIVE.first){ SRC.busy=true; paintFresh(); }
  try{ const u=new URL(FILE_URL,location.href); u.searchParams.set('t',Date.now()); const c=new AbortController(), tm=setTimeout(()=>c.abort(),window.ATR_BOOK_TIMEOUT||120000);
    let r; try{ r=await fetch(u.toString(),{cache:'no-store',signal:c.signal}); }finally{ clearTimeout(tm); }
    if(!r.ok) throw new Error(`the file link answered ${r.status}`);
    if(/text\/html/i.test(r.headers.get('content-type')||'')) throw new Error('the link opens a web page, not the .xlsx file itself');
    const buf=await r.arrayBuffer(); SRC.bytes=buf.byteLength; SRC.dlSecs=0;
    const res=await applyBook(buf,{manual,guard:true,modified:r.headers.get('last-modified')}); SRC.checkedAt=Date.now(); SRC.lastError=null;
    if(res.state==='new') showNew(res,manual,`File read ${stamp()}`); else if(res.state==='hold'){ soon(45000); if(manual) toast(SRC.hold); } else if(manual) toast('Already up to date with the file.'); }
  catch(e){ const m=e.name==='AbortError'?'the file took too long to arrive':e.message; SRC.lastError=`Could not read ${FILE_URL}: ${m}`; SRC.errorAt=Date.now();
    if(!document.querySelector('.pg')) showGate('welcome',SRC.lastError+'. Check fileUrl in config.js.'); else if(manual||LIVE.first) toast(SRC.lastError); }
  LIVE.first=false; LIVE.busy=false; SRC.busy=false; paintFresh(); }
/* C. a file opened from this computer. Chrome and Edge keep a link to it, so a saved change shows up within a minute */
async function checkLiveLocal(manual){
  if(!LOCAL.handle||(!manual&&document.hidden)) return;
  try{ let perm=await LOCAL.handle.queryPermission({mode:'read'}); if(perm!=='granted'&&manual) perm=await LOCAL.handle.requestPermission({mode:'read'});
    if(perm!=='granted'){ SRC.note=`${LOCAL.name}: press Refresh to read it again`; document.getElementById('refresh').hidden=false; paintFresh(); return; }
    const f=await LOCAL.handle.getFile(); if(f.lastModified===LOCAL.lastMod&&!manual) return;
    LIVE.busy=true; if(manual||LIVE.first){ SRC.busy=true; paintFresh(); }
    const buf=await f.arrayBuffer(); LOCAL.lastMod=f.lastModified; SRC.bytes=buf.byteLength;
    const res=await applyBook(buf,{manual,guard:true,modified:new Date(f.lastModified).toISOString()}); SRC.checkedAt=Date.now(); SRC.lastError=null;
    if(res.state==='new') showNew(res,manual,`${f.name}, saved ${stamp(f.lastModified)}`); else if(manual) toast('Already up to date with the file.'); }
  catch(e){ SRC.lastError=`Could not read ${LOCAL.name}: ${e.message}`; SRC.errorAt=Date.now(); if(!document.querySelector('.pg')) showGate('welcome',SRC.lastError); else if(manual) toast(SRC.lastError); }
  LIVE.first=false; LIVE.busy=false; SRC.busy=false; paintFresh(); }
async function openFile(){
  if(window.showOpenFilePicker){ try{ const [h]=await window.showOpenFilePicker({types:[{description:'Excel workbook',accept:{'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx']}}]});
      LOCAL.handle=h; LOCAL.name=h.name; LOCAL.kind='file'; LOCAL.lastMod=0; await kvPut('handle',h); LIVE.first=true; LIVE.v=null; showGate('loading',`Reading ${h.name}\u2026`); await checkLiveLocal(true); return; }
    catch(e){ if(e&&e.name==='AbortError') return; } }
  const inp=document.getElementById('fileinp'); if(inp){ inp.value=''; inp.click(); } }
async function loadFileObject(f){ if(!f) return; if(!/\.xlsx$/i.test(f.name)){ toast('That is not an .xlsx file. Save it as an Excel workbook (.xlsx) first.'); return; }
  LOCAL.handle=null; LOCAL.name=f.name; LOCAL.kind='file'; await kvDel('handle'); LIVE.first=true; LIVE.v=null; showGate('loading',`Reading ${f.name}\u2026`);
  try{ const res=await applyBook(await f.arrayBuffer(),{manual:true}); showNew(res,true,`${f.name}, opened ${stamp()}`); LIVE.first=false; paintFresh(); }
  catch(e){ showGate('welcome',`${f.name} could not be read: ${e.message}`); } }
async function openSample(){ const u=DATA_CFG.sample||'sample-data.xlsx'; showGate('loading','Reading the sample workbook\u2026');
  try{ const r=await fetch(u,{cache:'no-store'}); if(!r.ok) throw new Error(`${u} answered ${r.status}`);
    LOCAL.handle=null; LOCAL.name='Sample data'; LOCAL.kind='sample'; await kvDel('handle'); LIVE.first=true; LIVE.v=null;
    const res=await applyBook(await r.arrayBuffer(),{manual:true}); showNew(res,true,'Sample data'); LIVE.first=false; paintFresh(); }
  catch(e){ showGate('welcome',`The sample could not be opened: ${e.message}`); } }
async function closeData(){ await cacheDel(); await kvDel('handle'); try{ localStorage.removeItem('dash-visit'); localStorage.removeItem('dash-sig'); localStorage.removeItem('dash-log'); }catch(e){} location.reload(); }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-conn]'); if(!b) return; e.preventDefault(); const k=b.dataset.conn;
  if(k==='open') openFile(); else if(k==='sample') openSample(); else if(k==='close') closeData(); else if(k==='reread') checkLive(true); });
document.addEventListener('change',e=>{ if(e.target&&e.target.id==='fileinp'&&e.target.files&&e.target.files[0]) loadFileObject(e.target.files[0]); });
/* drop an .xlsx anywhere on the page */
if(DATA_CFG.allowOpenFile!==false&&!DATA_URL&&!FILE_URL){
  document.addEventListener('dragover',e=>{ if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){ e.preventDefault(); document.body.classList.add('dropping'); } });
  document.addEventListener('dragleave',e=>{ if(!e.relatedTarget) document.body.classList.remove('dropping'); });
  document.addEventListener('drop',e=>{ if(!e.dataTransfer||!e.dataTransfer.files.length) return; e.preventDefault(); document.body.classList.remove('dropping'); loadFileObject(e.dataTransfer.files[0]); }); }

/* Instagram's live follower count, asked of the Worker (which asks Instagram's API) */
async function fetchIG(){ if(!DATA_URL||(LOCKED&&!AUTH.token())) return;
  try{ const j=await fetchT(DATA_URL+'/instagram',15000); if(j&&typeof j.followers==='number'){ const old=IGL.get(); IGL.set({v:j.followers,at:j.at||new Date().toISOString()}); if(!old||old.v!==j.followers) redraw(); } }catch(e){} }

/* ---------- sort any table: click a column heading; click again to reverse. The choice is kept when figures refresh. ---------- */
const SORTS={};
function sortVal(td){ const raw=(td.getAttribute('data-sort')??td.textContent).replace(/\u2212/g,'-').trim();
  if(!raw||raw==='-'||raw==='\u2013') return {n:null,s:''};
  if(/^\d{4}-\d{2}(-\d{2})?$/.test(raw)) return {n:Date.parse(raw.length===7?raw+'-01':raw),s:raw};
  const dm=raw.match(/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})/); if(dm) return {n:Date.parse(`${dm[3]}-${String(MON.indexOf(dm[2])+1).padStart(2,'0')}-${dm[1].padStart(2,'0')}`),s:raw};
  const my=raw.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})$/); if(my) return {n:Date.parse(`${my[2]}-${String(MON.indexOf(my[1])+1).padStart(2,'0')}-01`),s:raw};
  const du=raw.match(/^(?:(\d+)h )?(?:(\d+)m ?)?(?:(\d+)s)?$/); if(du&&(du[1]||du[2]||du[3])&&/[hms]$/.test(raw)&&!/^\d[\d,.]* h$/.test(raw)) return {n:(+du[1]||0)*3600+(+du[2]||0)*60+(+du[3]||0),s:raw};
  const m=raw.match(/^[+]?\$?(-?[\d,]*\.?\d+)\s*(k|m|bn|b)?\b/i); if(m){ const mul={k:1e3,m:1e6,b:1e9,bn:1e9}[(m[2]||'').toLowerCase()]||1; return {n:parseFloat(m[1].replace(/,/g,''))*mul,s:raw}; }
  return {n:null,s:raw.toLowerCase()}; }
function sortTable(table,col,dir){ const tb=table.tBodies[0]; if(!tb) return; const rows=[...tb.rows];
  rows.sort((a,b)=>{ const x=sortVal(a.cells[col]||a), y=sortVal(b.cells[col]||b);
    if(x.n!==null&&y.n!==null) return (x.n-y.n)*dir; if(x.n!==null) return -1; if(y.n!==null) return 1;
    if(!x.s&&y.s) return 1; if(x.s&&!y.s) return -1; return x.s.localeCompare(y.s)*dir; });
  rows.forEach(r=>tb.appendChild(r));
  [...table.tHead.rows[0].cells].forEach((th,i)=>th.setAttribute('aria-sort',i===col?(dir>0?'ascending':'descending'):'none')); }
function tableKey(table){ const pg=table.closest('.pg'), all=pg?[...pg.querySelectorAll('table')]:[]; return (pg?pg.id:'')+'|'+all.indexOf(table)+'|'+[...table.tHead.rows[0].cells].map(c=>c.textContent.trim()).join('/'); }
document.addEventListener('click',e=>{ const th=e.target.closest('thead th'); if(!th) return; const table=th.closest('table'); if(!table||!table.tBodies[0]||table.tBodies[0].rows.length<2) return;
  const col=[...th.parentNode.cells].indexOf(th), key=tableKey(table), prev=SORTS[key];
  /* numbers start from the largest; words start from A */
  const firstNum=[...table.tBodies[0].rows].some(r=>sortVal(r.cells[col]||r).n!==null);
  const dir=prev&&prev.col===col?-prev.dir:(firstNum?-1:1); SORTS[key]={col,dir}; sortTable(table,col,dir); });
function reapplySorts(){ document.querySelectorAll('.pg table').forEach(t=>{ if(!t.tHead||!t.tHead.rows[0]) return;
    /* every heading of a table with more than one row shows it can be sorted */
    if(t.tBodies[0]&&t.tBodies[0].rows.length>1) [...t.tHead.rows[0].cells].forEach(th=>{ th.classList.add('sortable'); if(!th.title) th.title='Click to sort'; if(!th.hasAttribute('aria-sort')) th.setAttribute('aria-sort','none'); });
    const s=SORTS[tableKey(t)]; if(s) sortTable(t,s.col,s.dir); }); }
/* every redraw of the pages (new data or new dates) keeps the sorting people chose */
const _renderPages=render; render=function(){ _renderPages.apply(this,arguments); try{ reapplySorts(); }catch(e){} };
function loadLive(manual){ return checkLive(!!manual); }

setInterval(()=>checkLive(false),LIVE.every);
setInterval(fetchIG,10*60*1000);
/* a newly deployed dashboard replaces this one by itself: the page's own file is checked every few minutes */
const CODE={sig:null};
async function checkCode(){
  if(!/^https?:/.test(location.protocol)||popOpen()) return;
  try{ const u=location.pathname+(location.search||''); let r=await fetch(u,{method:'HEAD',cache:'no-store'});
    let sig=r.ok?(r.headers.get('etag')||r.headers.get('last-modified')||''):'';
    if(!sig){ r=await fetch(u,{cache:'no-store'}); if(!r.ok) return; const t=await r.text(); let h=2166136261; for(let i=0;i<t.length;i+=7){ h^=t.charCodeAt(i); h=Math.imul(h,16777619); } sig=t.length+':'+(h>>>0); }
    if(!CODE.sig){ CODE.sig=sig; return; }
    if(sig!==CODE.sig){ toast('A new version of the dashboard is available. Loading it now.'); setTimeout(()=>location.reload(),1500); }
  }catch(e){} }
setInterval(checkCode,window.ATR_CODE_CHECK_MS||5*60*1000); checkCode();
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) checkCode(); });
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) checkLive(false); });
window.addEventListener('online',()=>checkLive(false));
checkLive(false);
