/* Dashboard template: reads the reporting workbook in the background so the page never freezes.
   Every tab and column it reads is listed in docs/WORKBOOK.md and on the Sources tab of dashboard-template.xlsx. */
var LIB=new URLSearchParams(self.location.search).get('lib')||'lib/xlsx.full.min.js';
var TARGET=(new URLSearchParams(self.location.search).get('cur')||'USD').toUpperCase();   /* the dashboard's currency (config.js: currency) */
importScripts(LIB);


/* workbook -> compact daily data for the dashboard */


const PART_SHEETS = {
  core: ["Meta Organic","Instagram","YouTube Daily","YouTube","GA4","GA4 Channels","Meta",
         "Play Subscriptions","App Store Subscriptions","App Store Subscription Events",
         "Play Earnings","Play Traffic Source","App Store Installs","Instagram Posts","Instagram Stories","Instagram Account Activity","App Store Deletions","Facebook Posts","Facebook Stories","Facebook Page Activity","YouTube Shorts","YouTube Reach","YouTube Video Daily","Instagram Follower History","Instagram Follower Snapshots","Dashboard Status","YouTube Videos","AdSense","AdMob","X","TikTok"],
  installs: ["Play Installs"],
  store: ["App Store Sales","Play_Quality_History"]
};
/* US dollars per unit, used to turn Apple proceeds paid in other currencies into the dashboard's currency. The Gulf currencies and
   HKD and DKK are pegged; the rest are APPROXIMATE, so update the ones you are paid in. Apple revenue in a currency missing here
   is counted in out.fxMissing and flagged on the Data coverage page, never silently dropped. */
const FX = {USD:1,EUR:1.1765,GBP:1.3533,CHF:1.2772,AUD:0.71518,NZD:0.59,CAD:0.73,ZAR:0.06073,CLP:0.00105,MYR:0.235,
  QAR:1/3.64,AED:1/3.6725,SAR:1/3.75,KWD:3.26,BHD:1/0.376,OMR:1/0.3845,JOD:1/0.709,EGP:0.0205,NGN:0.00065,KES:0.00774,
  INR:0.0114,PKR:0.00355,SEK:0.105,NOK:0.099,DKK:1.1765/7.46,PLN:0.275,TRY:0.024,BRL:0.18,MXN:0.054,JPY:0.0068,CNY:0.139,
  HKD:1/7.8,SGD:0.78,IDR:0.000061,PHP:0.0175,THB:0.0305,KRW:0.00072};
const TO = FX[TARGET] || null;   /* no rate for the dashboard's currency: only proceeds already in it are counted */

/* ================= names: the platforms' own names, any capitalisation or style =================
   A column is found by its name written any way (Profile Visits, profileVisits, profile_visits),
   or by any of the names the platforms themselves use for the same figure. Units are converted
   where a platform reports in milliseconds or seconds. So no fixed naming template is needed. */
const norm=k=>String(k==null?"":k).replace(/([a-z0-9])([A-Z])/g,"$1_$2").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
const A=(n,f)=>({n:norm(n),f:f||1});
const ALIAS={
  views:[A("plays"),A("play_count"),A("video_plays"),A("reel_plays"),A("ig_reels_video_views"),A("media_views"),A("view_count"),A("views_count"),A("total_plays")],
  reach:[A("unique_views"),A("accounts_reached"),A("unique_viewers")],
  likes:[A("like_count"),A("likes_count"),A("total_likes")],
  comments:[A("comment_count"),A("comments_count"),A("total_comments")],
  saves:[A("saved"),A("save_count"),A("saves_count")],
  shares:[A("share_count"),A("shares_count"),A("total_shares")],
  profile_visits:[A("profile_views"),A("profile_links_taps"),A("profile_activity_visits"),A("profile_visit")],
  external_link_taps:[A("website_clicks"),A("link_in_bio_taps"),A("bio_link_clicks"),A("external_link_clicks"),A("link_taps")],
  accounts_engaged:[A("engaged_accounts"),A("accounts_engaged_count")],
  followers_total:[A("followers_count"),A("total_followers"),A("follower_total"),A("followers_total"),A("total"),A("followers"),A("number_of_followers"),A("no_of_followers")],
  followers_gained:[A("follows"),A("new_followers"),A("gained"),A("followers_gained"),A("followers_gain"),A("follows_count"),A("follower_gains"),A("new_follows"),A("followed")],
  followers_lost:[A("unfollows"),A("unfollowed"),A("unfollowers"),A("lost"),A("followers_lost"),A("unfollows_count"),A("lost_followers")],
  net_followers:[A("net"),A("net_change"),A("net_followers"),A("net_follows"),A("net_follower_change")],
  follows:[A("follows_count"),A("new_follows")],
  watch_time_minutes:[A("reel_total_watch_time_ms",1/60000),A("video_total_watch_time_ms",1/60000),A("total_watch_time_ms",1/60000),A("watch_time"),A("total_watch_time"),A("estimated_minutes_watched"),A("minutes_watched"),A("watch_time_mins"),
    A("total_time_watched",1/60),A("watch_time_seconds",1/60),A("watch_time_hours",60),A("ig_reels_video_view_total_time",1/60000),A("post_video_view_time",1/60000),A("video_view_time_ms",1/60000)],
  avg_watch_time_seconds:[A("reel_avg_watch_time_ms",1/1000),A("video_avg_watch_time_ms",1/1000),A("avg_watch_time"),A("average_watch_time"),A("average_time_watched"),A("avg_time_watched"),A("ig_reels_avg_watch_time",1/1000),A("post_video_avg_time_watched",1/1000),A("avg_watch_time_ms",1/1000)],
  completion_rate:[A("full_video_watched_rate"),A("finish_rate"),A("completion"),A("video_completion_rate")],
  replies:[A("story_replies"),A("reply_count")], taps_forward:[A("navigation_taps_forward"),A("tap_forward")], taps_back:[A("navigation_taps_back"),A("tap_back")],
  exits:[A("navigation_exits"),A("story_exits"),A("tap_exit")],
  link_clicks:[A("link_click"),A("post_clicks_link"),A("page_link_clicks"),A("link_clicks_count")],
  reactions:[A("reactions_count"),A("post_reactions"),A("reactions_total"),A("post_reactions_like_total"),A("page_actions_post_reactions_total"),A("total_reactions")],
  video_views:[A("page_video_views"),A("post_video_views"),A("total_video_views")],
  video_views_3s:[A("page_video_views_3s"),A("three_second_views"),A("video_views_3_second"),A("views_3s"),A("3s_views"),A("three_second_video_views")],
  video_watch_time_minutes:[A("video_watch_time"),A("page_video_view_time",1/60000),A("video_view_time_seconds",1/60),A("total_video_view_time",1/60000)],
  avg_view_duration_seconds:[A("average_view_duration_seconds"),A("average_view_duration"),A("avg_view_duration")],
  avg_view_percentage:[A("average_view_percentage")], average_view_percentage:[A("avg_view_percentage")],
  engaged_views:[A("engaged_view_count")],
  impressions:[A("video_thumbnail_impressions"),A("thumbnail_impressions")],
  impressions_ctr:[A("video_thumbnail_impressions_ctr"),A("thumbnail_impressions_ctr"),A("video_thumbnail_impressions_click_rate"),A("thumbnail_ctr"),A("thumbnail_click_through_rate"),A("click_through_rate"),A("ctr")],
  subscribers_gained:[A("subs_gained"),A("new_subscribers")],
  deletions:[A("uninstalls"),A("deletes"),A("app_deletions"),A("delete_count"),A("uninstall_count")],
  stayed_to_watch:[A("stayed"),A("stayed_to_watch_rate")],
  type:[A("media_type"),A("media_product_type"),A("post_type"),A("format"),A("content_type")],
  caption:[A("text"),A("message"),A("description")], message:[A("text"),A("caption")], title:[A("video_title"),A("name")],
  url:[A("permalink"),A("permalink_url"),A("post_url"),A("video_url"),A("link")],
  post_id:[A("media_id"),A("ig_media_id"),A("fb_post_id"),A("story_id")], video_id:[A("youtube_video_id"),A("yt_video_id")],
  published_at:[A("timestamp"),A("created_time"),A("created_at"),A("publish_time"),A("publish_date"),A("published")]
};
/* names that mean something only on particular tabs */
const ALIAS_TAB={
  "Instagram":{views:[A("impressions")]}, "Instagram Posts":{views:[A("impressions")]},
  "Facebook Posts":{views:[A("post_impressions"),A("post_media_view"),A("impressions")],reach:[A("post_impressions_unique"),A("post_total_media_view_unique")],reactions:[A("likes"),A("like_count")],link_clicks:[A("clicks"),A("post_clicks")]}
};
/* other names for the tabs themselves */
const TAB_ALIAS={
  "Meta Organic":["facebook","facebook_organic","fb_organic","facebook_page","meta_page"],
  "Instagram":["instagram_organic","ig","ig_organic","instagram_daily","ig_daily"],
  "YouTube Daily":["youtube_organic","yt_daily","youtube_daily_stats"],
  "TikTok":["tiktok_organic","tik_tok"], "X":["twitter","x_organic","x_twitter"],
  "App Store Deletions":["app_store_deletions","app_store_uninstalls","apple_uninstalls","apple_deletions","ios_uninstalls","ios_deletions","app_store_deletion"],
  "Instagram Stories":["instagram_stories","ig_stories","instagram_story","stories"],
  "Instagram Account Activity":["instagram_account_activity","ig_account_activity","instagram_account","ig_account_insights","instagram_account_insights"],
  "Instagram Posts":["instagram_posts","ig_posts","instagram_media","ig_media","instagram_content","ig_content","instagram_post_level"],
  "Facebook Page Activity":["facebook_page_activity","fb_page_activity","facebook_page_insights","fb_page_insights","facebook_daily"],
  "Facebook Stories":["facebook_stories","fb_stories","facebook_story"],
  "Instagram Follower History":["instagram_follower_history","ig_follower_history","instagram_followers_history","instagram_follows_unfollows"],
  "Instagram Follower Snapshots":["instagram_follower_snapshots","ig_follower_snapshots","instagram_followers_snapshots","instagram_follower_snapshot"],
  "Facebook Media Daily":["facebook_media_daily","fb_media_daily","facebook_posts_daily"],
  "Instagram Media Daily":["instagram_media_daily","ig_media_daily","instagram_posts_daily"],
  "Facebook Posts":["facebook_media","fb_media","facebook_posts","fb_posts","facebook_content","fb_content","meta_posts","facebook_post_level","facebook_videos"],
  "YouTube Reach":["youtube_reach","yt_reach","youtube_impressions","youtube_thumbnail_impressions"],
  "YouTube Video Daily":["youtube_video_daily","yt_video_daily","youtube_videos_daily"],
  "YouTube Shorts":["youtube_shorts","yt_shorts","youtube_short"],
  "YouTube Videos":["youtube_media","yt_media","youtube_video_analytics","youtube_video_performance","youtube_video_insights","youtube_video_metrics","youtube_videos","yt_videos","youtube_content","youtube_video_stats","yt_video_stats","youtube_video_level"]
};
const ALIAS_REV=(()=>{ const m={}; for(const c in ALIAS) ALIAS[c].forEach(a=>{ (m[a.n]=m[a.n]||new Set()).add(c); });
  for(const t in ALIAS_TAB) for(const c in ALIAS_TAB[t]) ALIAS_TAB[t][c].forEach(a=>{ (m[a.n]=m[a.n]||new Set()).add(c); }); return m; })();
/* tab names are compared with spaces, capitals and punctuation ignored ("YouTube Video Stats" = "youtube_video_stats") */
const compact=x=>String(x==null?"":x).toLowerCase().replace(/[^a-z0-9]/g,"");
function canonTab(name){ const n=compact(name); for(const t in TAB_ALIAS){ if(compact(t)===n||TAB_ALIAS[t].some(a=>compact(a)===n)) return t; } return name; }
function findSheet(wb,name){ const n=compact(name); return wb.SheetNames.find(s=>!isIgnoredTab(s)&&compact(s)===n)||wb.SheetNames.find(s=>!isIgnoredTab(s)&&canonTab(s)===name)||null; }
/* rows carry their keys in normal form, and which tab they came from */
function normRows(rs,tab){ return rs.map(r=>{ const o={}; for(const k in r){ const nk=norm(k); if(!(nk in o)||o[nk]===null||o[nk]==="") o[nk]=r[k]; } Object.defineProperty(o,"__t",{value:tab,enumerable:false}); return o; }); }
const col=(r,n)=>{ const k=norm(n); if(k in r&&r[k]!==null&&r[k]!=="") return r[k];
  const tabs=r.__t&&ALIAS_TAB[r.__t]&&ALIAS_TAB[r.__t][k]?ALIAS_TAB[r.__t][k]:[]; const list=[...tabs,...(ALIAS[k]||[])];
  for(const a of list){ if(a.n in r&&r[a.n]!==null&&r[a.n]!==""){ const v=r[a.n]; if(a.f===1) return v; const x=typeof v==="number"?v:parseFloat(String(v).replace(/,/g,"")); return isNaN(x)?v:x*a.f; } }
  return k in r?r[k]:null; };
const num=v=>{ if(v===null||v===undefined||v==="") return null; const n=typeof v==="number"?v:parseFloat(String(v).replace(/,/g,"")); return isNaN(n)?null:n; };
const r2=v=>v===null?null:Math.round(v*100)/100;
function iso(v){
  /* the Excel library creates dates at local midnight; read them in local time so the day never shifts
     (east of UTC, reading in UTC would turn 12 Sep into 11 Sep), and round to the nearest day first:
     some time zones had a few odd minutes of offset in 1899, which the library carries over */
  if(v instanceof Date){ const t=new Date(v.getTime()+12*3600e3); return [t.getFullYear(),String(t.getMonth()+1).padStart(2,"0"),String(t.getDate()).padStart(2,"0")].join("-"); }
  if(typeof v==="number"){ const d=XLSX.SSF.parse_date_code(v); return d?[d.y,String(d.m).padStart(2,"0"),String(d.d).padStart(2,"0")].join("-"):null; }
  const m=String(v||"").match(/^(\d{4})-(\d{2})-(\d{2})/); return m?m[0]:null;
}
/* rows the pipeline marked as failed (api_status error) carry no figures and never count */
const failed=r=>/^(error|failed|fail|failure)$/i.test(String(col(r,"api_status")||"").trim());
function rows(wb,name){
  const key=findSheet(wb,name); if(!key||!wb.Sheets[key]) return [];
  let rs=normRows(XLSX.utils.sheet_to_json(wb.Sheets[key],{defval:null}),name).filter(r=>!failed(r));
  rs.forEach(r=>{ r.__d=iso(col(r,"date")); });
  rs=rs.filter(r=>r.__d);
  /* Remove rows that were loaded more than once. Only exact copies are removed:
     rows that share a record_key but differ in any other column (a different
     app version, a different price point) are separate real rows and are kept. */
  const seen=new Set(), out=[];
  rs.forEach(r=>{ const k=Object.keys(r).filter(c=>c!=="loaded_at"&&c!=="__d").sort().map(c=>c+"="+(r[c] instanceof Date?r[c].toISOString():String(r[c]))).join("|");
    if(!seen.has(k)){ seen.add(k); out.push(r); } });
  return out;
}
/* one row per day; latest copy wins */
function perDay(rs,map){
  const by={}; rs.forEach(r=>{ const o=by[r.__d]||(by[r.__d]={d:r.__d}); for(const k in map){ const v=num(col(r,map[k])); if(v!==null) o[k]=r2(v); } });
  return Object.values(by).sort((a,b)=>a.d<b.d?-1:1);
}
/* content sheets: one row per post or video. Totals grow over time, so the most
   recently loaded row for each id wins. Text fields are kept short. */
/* the platforms' own post-type labels, in plain words the dashboard sorts by */
function isoDur(v){ if(v===null||v===undefined||v==="") return null; if(typeof v==="number") return v; const m=String(v).match(/^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i); if(m) return (+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0); const n=parseFloat(v); return isNaN(n)?null:n; }
function postType(v){ const x=String(v||"").trim().toLowerCase().replace(/[^a-z_ ]/g,""); if(!x) return v;
  if(/shared_story|share/.test(x)) return "link"; if(/added_video|video/.test(x)&&!/reel/.test(x)) return "video";
  if(/reel|clip/.test(x)) return "reel"; if(/story|stories/.test(x)) return "story"; if(/carousel|album/.test(x)) return "carousel";
  if(/short/.test(x)) return "short"; if(/live/.test(x)) return "live"; if(/video/.test(x)) return "video";
  if(/photo|image|picture|feed/.test(x)) return "photo"; if(/link|shared_story|share/.test(x)) return "link"; if(/status|text/.test(x)) return "status"; return String(v).trim(); }
function content(wb,name,idKey,nums,texts,forceType){
  const key=findSheet(wb,name); if(!key||!wb.Sheets[key]) return [];
  let rs=normRows(XLSX.utils.sheet_to_json(wb.Sheets[key],{defval:null}),name).filter(r=>!failed(r));
  rs.sort((a,b)=>String(col(a,"loaded_at")||"")<String(col(b,"loaded_at")||"")?-1:1);
  const by=new Map();
  rs.forEach(r=>{ const id=col(r,idKey); const d=iso(col(r,"published_at")||col(r,"published_date")||col(r,"published")||col(r,"date")); if(id===null||id===undefined||!d) return;
    const o={id:String(id),d}; for(const k in nums){ const raw=col(r,nums[k]); const v=k==="dur"?isoDur(raw):num(raw); if(v!==null) o[k]=r2(v); }
    if(forceType) o.ty=forceType;
    if(!forceType&&String(r.is_video||"")==="1"&&(!o.ty||o.ty==="photo")) o.ty="video";
    if(!forceType&&r.is_short!==undefined&&r.is_short!==null&&r.is_short!==""){ o.ty=/^(1|true|yes)$/i.test(String(r.is_short))?"short":(o.ty&&o.ty!=="short"?o.ty:"video"); }
    if(o.r===0&&o.v>0) delete o.r;   /* a viewed post with reach 0: the platform did not report reach */
    { const mpt=r.media_product_type, mt=r.media_type;   /* Instagram: REELS / STORY / FEED, and IMAGE / VIDEO / CAROUSEL_ALBUM */
      if(!forceType&&mpt) o.ty=/reel/i.test(mpt)?"reel":/stor/i.test(mpt)?"story":postType(mt||mpt); }
    if(r.navigation_json&&(o.tf===undefined||o.tb===undefined||o.ex===undefined)){ try{ const nj=typeof r.navigation_json==="string"?JSON.parse(r.navigation_json):r.navigation_json;
      const g=kk=>{ for(const k2 in nj) if(norm(k2)===kk) return num(nj[k2]); return null; };
      const tf=g("tap_forward"), tb=g("tap_back"), ex=g("tap_exit")??g("exit")??g("exits"); if(tf!==null&&o.tf===undefined) o.tf=tf; if(tb!==null&&o.tb===undefined) o.tb=tb; if(ex!==null&&o.ex===undefined) o.ex=ex; }catch(e){} }
    for(const k in texts){ if(k==="ty"&&o.ty) continue; let v=col(r,texts[k]); if(k==="ty"&&v!==null&&v!==undefined) v=postType(v); if(v!==null&&v!==undefined&&String(v).trim()) o[k]=String(v).trim().slice(0,k==="t"?140:300); }
    by.set(o.id,o); });
  return [...by.values()].sort((a,b)=>a.d<b.d?-1:1);
}
/* sum several rows per day */
function sumDay(rs,map,extra){
  const by={}; rs.forEach(r=>{ const o=by[r.__d]||(by[r.__d]={d:r.__d}); for(const k in map){ const v=num(col(r,map[k])); if(v!==null) o[k]=(o[k]||0)+v; } if(extra) extra(o,r); });
  return Object.values(by).sort((a,b)=>a.d<b.d?-1:1).map(o=>{ for(const k in o) if(typeof o[k]==="number") o[k]=r2(o[k]); return o; });
}
const lastISO=rs=>rs.reduce((m,r)=>r.__d>m?r.__d:m,"");
const addD=(d,n)=>new Date(Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10))+n*864e5).toISOString().slice(0,10);
function countryTotals(rs,cKey,vKey,filter){
  const end=lastISO(rs), s28=addD(end,-27), s90=addD(end,-89), m={};
  rs.forEach(r=>{ if(filter&&!filter(r)) return; const c=String(col(r,cKey)||"").trim()||"Unknown"; const v=num(col(r,vKey))||0;
    const o=m[c]||(m[c]={c,life:0,d90:0,d28:0}); o.life+=v; if(r.__d>=s90) o.d90+=v; if(r.__d>=s28) o.d28+=v; });
  return {end, list:Object.values(m).sort((a,b)=>b.life-a.life).slice(0,20)};
}


/* per-country figures by day, packed small: {c:[countries], d:[dates], r:[dateIdx,countryIdx,value,...]} */
function ctyDaily(rs,cKey,vKey,filter){
  const m=new Map();
  rs.forEach(r=>{ if(filter&&!filter(r)) return; const v=num(col(r,vKey))||0; if(!v) return;
    const c=String(col(r,cKey)||"").trim()||"Unknown"; const k=r.__d+"|"+c; m.set(k,(m.get(k)||0)+v); });
  const cs=[...new Set([...m.keys()].map(k=>k.split("|")[1]))].sort(), ds=[...new Set([...m.keys()].map(k=>k.split("|")[0]))].sort();
  const ci=new Map(cs.map((c,i)=>[c,i])), di=new Map(ds.map((d,i)=>[d,i])), r=[];
  [...m.entries()].sort().forEach(([k,v])=>{ const [d,c]=k.split("|"); r.push(di.get(d),ci.get(c),Math.round(v)); });
  return {c:cs,d:ds,r};
}

/* AdSense: website ad earnings, one row per day */
/* Ad tabs: each row is one day (AdSense) or one day, country and app (AdMob). If the pipeline
   loads the same row again with a revised figure, only the latest version counts. */
function latestRows(rs,keyOf){
  rs=rs.slice().sort((a,b)=>String(col(a,"loaded_at")||"")<String(col(b,"loaded_at")||"")?-1:1);
  const m=new Map(); rs.forEach(r=>m.set(keyOf(r),r)); return [...m.values()];
}
/* raw totals exactly as the sheet holds them, so they can be checked against Google's own column sums */
function rawAudit(wb,name,cols){
  const key=wb.SheetNames.find(s=>s.toLowerCase().trim()===name.toLowerCase()); if(!key||!wb.Sheets[key]) return null;
  const rs=XLSX.utils.sheet_to_json(wb.Sheets[key],{defval:null}); const sums={};
  cols.forEach(c=>{ sums[c]=rs.reduce((t,r)=>t+(num(col(r,c))||0),0); });
  return {rows:rs.length,sums};
}
function adsense(wb){
  const kept=latestRows(rows(wb,"AdSense"),r=>String(col(r,"record_key")||r.__d));
  const by={}; kept.forEach(r=>{ const e=num(col(r,"estimated_earnings")); if(e===null) return; by[r.__d]=(by[r.__d]||0)+e; });
  return Object.keys(by).sort().map(d=>({d,e:Math.round(by[d]*1e6)/1e6}));
}
/* AdMob: app ad figures, one row per day per country per app.
   Kept as daily totals, plus a packed list for countries and apps:
   r = [dateIdx, countryIdx, appIdx, earnings in millionths of a dollar, impressions, requests, clicks] */
function admob(wb){
  const rs=latestRows(rows(wb,"AdMob"),r=>String(col(r,"record_key")||(r.__d+"|"+col(r,"country")+"|"+col(r,"app")))); const day={}, C=new Map(), A=new Map(), D=new Map(), pack=[];
  const idx=(m,k)=>{ if(!m.has(k)) m.set(k,m.size); return m.get(k); };
  rs.forEach(r=>{ const e=num(col(r,"estimated_earnings"))||0, im=num(col(r,"impressions"))||0, rq=num(col(r,"ad_requests"))||0, cl=num(col(r,"clicks"))||0;
    const o=day[r.__d]||(day[r.__d]={d:r.__d,e:0,im:0,rq:0,cl:0}); o.e+=e; o.im+=im; o.rq+=rq; o.cl+=cl;
    pack.push(idx(D,r.__d),idx(C,String(col(r,"country")||"Unknown").trim()),idx(A,String(col(r,"app")||"Unknown").trim()),Math.round(e*1e6),im,rq,cl); });
  const daily=Object.values(day).sort((a,b)=>a.d<b.d?-1:1).map(o=>({d:o.d,e:Math.round(o.e*1e6)/1e6,im:o.im,rq:o.rq,cl:o.cl}));
  return {daily,detail:{d:[...D.keys()],c:[...C.keys()],a:[...A.keys()],r:pack}};
}

/* X: one account row per day (followers and totals) and one row per post with lifetime figures.
   Posts can appear twice (recent pull and lifetime pull); the most recently loaded version wins. */
function xData(wb){
  const rs=rows(wb,"X"), acct={}, posts=[];
  rs.forEach(r=>{ const g=String(col(r,"grain")||"").toLowerCase();
    if(g==="account"){ const o={d:r.__d,f:num(col(r,"follower_count")),fo:num(col(r,"following_count")),pc:num(col(r,"post_count")),lc:num(col(r,"listed_count"))};
      const prev=acct[r.__d]; if(!prev||String(col(r,"loaded_at")||"")>=prev._l){ o._l=String(col(r,"loaded_at")||""); acct[r.__d]=o; } }
    else if(g==="post"||g==="post_lifetime") posts.push(r); });
  const kept=latestRows(posts,r=>String(col(r,"dimension_id")));
  const P=kept.map(r=>{ const pub=iso(col(r,"published_at"))||r.__d; return {id:String(col(r,"dimension_id")),d:pub,t:String(col(r,"dimension_name")||"").trim().slice(0,140),
    im:num(col(r,"impressions"))||0,l:num(col(r,"likes"))||0,rp:num(col(r,"reposts"))||0,q:num(col(r,"quotes"))||0,rep:num(col(r,"replies"))||0,b:num(col(r,"bookmarks"))||0,e:num(col(r,"engagements"))||0}; })
    .sort((a,b)=>a.d<b.d?-1:1);
  return {acct:Object.values(acct).sort((a,b)=>a.d<b.d?-1:1).map(o=>{ delete o._l; return o; }),posts:P};
}
/* TikTok: one account row per day (followers, total likes, plays) and one row per recent video. */
function tiktokData(wb){
  const rs=rows(wb,"TikTok"), acct={}, vids=[];
  rs.forEach(r=>{ const g=String(col(r,"grain")||"").toLowerCase();
    if(g==="account") acct[r.__d]={d:r.__d,f:num(col(r,"follower_count")),fo:num(col(r,"following_count")),h:num(col(r,"heart_count")),v:num(col(r,"play_count"))};
    else if(g==="video") vids.push(r); });
  const kept=latestRows(vids,r=>String(col(r,"dimension_id")));
  const first=(r,names)=>{ for(const n of names){ const v=num(col(r,n)); if(v!==null) return {n,v}; } return null; };
  const V=kept.map(r=>{ const wt=first(r,["watch_time_minutes","total_time_watched"]), aw=first(r,["avg_watch_time_seconds","average_time_watched"]), cr=first(r,["completion_rate","full_video_watched_rate"]);
    /* TikTok video ids carry the time the video was posted in their first 32 bits */
    const idStr=String(col(r,"dimension_id")||""); let dId=null; try{ if(/^\d{15,20}$/.test(idStr)){ const ts=Number(BigInt(idStr)>>32n); if(ts>1.4e9&&ts<2.2e9) dId=new Date(ts*1000).toISOString().slice(0,10); } }catch(e){}
    return {id:idStr,d:iso(col(r,"published_at"))||dId||null,seen:r.__d,t:String(col(r,"dimension_name")||"").trim().slice(0,140),v:num(col(r,"play_count"))||num(col(r,"video_views"))||0,
      wt:wt?(wt.n==="total_time_watched"?wt.v/60:wt.v):null,   /* minutes; TikTok's own total_time_watched is in seconds */
      aw:aw?aw.v:null, cr:cr?(cr.v<=1?cr.v*100:cr.v):null,    /* completion as a percentage */
      l:num(col(r,"likes")), cm:num(col(r,"comments")), sh:num(col(r,"shares"))}; })
    .sort((a,b)=>b.v-a.v);
  return {acct:Object.values(acct).sort((a,b)=>a.d<b.d?-1:1),videos:V};
}

/* ================= anything new in the sheet =================
   BASELINE is every tab and column that existed when this version was built. Anything not in it
   is new: a new tab is summarised in full, a new column in an existing tab is summarised by itself. */
const BASELINE={"Meta": ["date", "brand_id", "brand_name", "source_id", "channel", "grain", "dimension_id", "dimension_name", "spend", "impressions", "clicks", "reach", "cpm", "cpc", "ctr", "frequency", "loaded_at", "inline_link_clicks", "inline_link_click_ctr", "cost_per_inline_link_click", "unique_clicks", "unique_ctr", "cost_per_unique_click", "outbound_clicks", "objective", "video_p25", "video_p50", "video_p75", "video_p100", "video_avg_time_watched", "act_link_click", "act_post_reaction", "act_landing_page_view", "act_omni_landing_page_view", "act_onsite_conversion.post_unlike", "act_post_engagement", "act_like", "act_post_interaction_gross", "act_comment", "act_page_engagement", "act_post_interaction_net", "act_post_uncomment", "act_post", "act_onsite_conversion.post_unsave", "act_onsite_conversion.post_save", "act_onsite_conversion.post_net_comment", "act_onsite_conversion.post_net_save", "act_onsite_conversion.post_net_like", "act_video_view", "cpa_video_view", "cpa_link_click", "cpa_like", "cpa_post_interaction_gross", "cpa_post_engagement", "cpa_page_engagement", "cpa_omni_landing_page_view", "cpa_landing_page_view", "act_omni_activate_app", "act_omni_custom", "act_app_site_visit", "act_omni_app_install", "act_app_custom_event.other", "act_mobile_app_install", "act_app_store_visit", "act_app_custom_event.fb_mobile_activate_app", "cpa_omni_custom", "cpa_omni_activate_app", "cpa_omni_app_install", "act_onsite_conversion.messaging_block"], "App Store Installs": ["record_key", "brand_id", "brand_name", "source_id", "channel", "date", "app_name", "app_apple_id", "event", "download_type", "app_version", "device", "platform_version", "source_type", "source_info", "campaign", "page_type", "page_title", "app_download_date", "territory", "counts", "unique_devices", "loaded_at"], "Meta Organic": ["date", "brand_id", "brand_name", "source_id", "channel", "grain", "dimension_id", "dimension_name", "loaded_at", "page_media_view", "page_total_media_view_unique", "page_post_engagements", "page_follows", "page_daily_follows", "page_daily_follows_unique", "page_views_total"], "Instagram": ["date", "brand_id", "brand_name", "source_id", "channel", "grain", "dimension_id", "dimension_name", "loaded_at", "reach", "follower_count"], "YouTube Daily": ["brand_id", "brand_name", "source_id", "channel", "grain", "dimension_id", "dimension_name", "loaded_at", "date", "views", "estimatedMinutesWatched", "averageViewDuration", "subscribersGained", "subscribersLost", "likes", "comments", "shares"], "GA4": ["date", "brand_id", "brand_name", "source_id", "channel", "grain", "dimension_id", "dimension_name", "sessions", "total_users", "new_users", "bounce_rate", "avg_session_duration", "page_views", "engagement_rate", "loaded_at", "active_users", "engaged_sessions", "page_views_per_session", "sessions_per_user", "event_count", "event_count_per_user", "user_engagement_duration", "total_revenue", "purchase_revenue", "transactions", "ecommerce_purchases", "conversions", "page_views_per_user"], "YouTube": ["date", "brand_id", "brand_name", "source_id", "channel", "grain", "dimension_id", "dimension_name", "subscribers", "total_views", "total_videos", "hidden_subscriber_count", "loaded_at"], "Play Earnings": ["record_key", "brand_id", "brand_name", "source_id", "channel", "date", "transaction_id", "transaction_date", "transaction_time", "tax_type", "transaction_type", "refund_type", "product_title", "package_id", "product_type", "sku_id", "hardware", "buyer_country", "buyer_state", "buyer_postal_code", "buyer_currency", "amount_buyer_currency", "currency_conversion_rate", "merchant_currency", "amount_merchant_currency", "base_plan_id", "offer_id", "group_id", "first_usd_1m_eligible", "service_fee_pct", "fee_description", "promotion_id", "sales_channel", "loaded_at"], "Play Installs": ["record_key", "brand_id", "brand_name", "source_id", "channel", "date", "package_name", "country", "daily_device_installs", "daily_device_uninstalls", "daily_device_upgrades", "total_user_installs", "daily_user_installs", "daily_user_uninstalls", "active_device_installs", "install_events", "update_events", "uninstall_events", "loaded_at"], "App Store Sales": ["record_key", "brand_id", "brand_name", "source_id", "channel", "date", "provider", "provider_country", "sku", "developer", "title", "version", "product_type_identifier", "units", "developer_proceeds", "begin_date", "end_date", "customer_currency", "country_code", "currency_of_proceeds", "apple_identifier", "customer_price", "promo_code", "parent_identifier", "subscription", "period", "category", "cmb", "device", "supported_platforms", "proceeds_reason", "preserved_pricing", "client", "order_type", "loaded_at"], "Play_Quality_History": ["record_key", "dataset", "date", "dimension", "metric", "value", "status", "details_json", "updated_at"], "Play Traffic Source": ["record_key", "brand_id", "brand_name", "source_id", "channel", "date", "package_name", "traffic_source", "search_term", "utm_source", "utm_campaign", "store_listing_acquisitions", "store_listing_visitors", "store_listing_conversion_rate", "loaded_at"], "GA4 Channels": ["record_key", "date", "brand_id", "brand_name", "source_id", "channel", "channel_group", "source_medium", "campaign", "sessions", "total_users", "new_users", "engagement_rate", "conversions", "loaded_at"], "Play Subscriptions": ["record_key", "date", "brand_id", "brand_name", "source_id", "channel", "package_name", "product_id", "base_plan_id", "offer_id", "is_free_trial_offer", "country", "new_subscriptions", "cancelled_subscriptions", "active_subscriptions", "loaded_at"], "App Store Subscription Events": ["record_key", "date", "brand_id", "brand_name", "source_id", "channel", "event", "is_free_trial_event", "is_conversion_event", "app_name", "subscription_name", "subscription_apple_id", "subscription_group_id", "standard_subscription_duration", "subscription_offer_type", "client", "device", "state", "country", "previous_subscription_name", "days_before_canceling", "cancellation_reason", "days_canceled", "quantity", "original_start_date", "consecutive_paid_periods", "loaded_at", "app_apple_id", "subscription_offer_name", "promotional_offer_id", "subscription_offer_duration", "marketing_opt_in", "marketing_opt_in_duration", "preserved_pricing", "proceeds_reason", "previous_subscription_apple_id", "paid_service_days_recovered", "contingent_app_name"], "App Store Subscriptions": ["record_key", "date", "brand_id", "brand_name", "source_id", "channel", "app_name", "subscription_name", "subscription_apple_id", "subscription_group_id", "standard_subscription_duration", "customer_price", "customer_currency", "client", "device", "state", "country", "active_standard_price_subscriptions", "active_free_trial_introductory_offer_subscriptions", "active_pay_up_front_introductory_offer_subscriptions", "active_pay_as_you_go_introductory_offer_subscriptions", "subscribers", "billing_retry", "grace_period", "loaded_at", "app_apple_id", "subscription_offer_name", "promotional_offer_id", "developer_proceeds", "proceeds_currency", "preserved_pricing", "proceeds_reason", "free_trial_promotional_offer_subscriptions", "pay_up_front_promotional_offer_subscriptions", "pay_as_you_go_promotional_offer_subscriptions", "free_trial_offer_code_subscriptions", "pay_up_front_offer_code_subscriptions", "pay_as_you_go_offer_code_subscriptions", "free_trial_win_back_offers", "pay_up_front_win_back_offers", "pay_as_you_go_win_back_offers", "contingent_app_name"], "AdMob": ["record_key", "brand_id", "brand_name", "source_id", "channel", "date", "country", "app", "ad_requests", "clicks", "estimated_earnings", "impressions", "impression_ctr", "match_rate", "loaded_at"], "AdSense": ["record_key", "brand_id", "brand_name", "source_id", "channel", "date", "estimated_earnings", "loaded_at"], "X": ["date", "brand_id", "brand_name", "source_id", "channel", "grain", "dimension_id", "dimension_name", "loaded_at", "published_at", "follower_count", "following_count", "post_count", "listed_count", "impressions", "likes", "reposts", "quotes", "replies", "bookmarks", "engagements", "engagement_rate"], "TikTok": ["date", "brand_id", "brand_name", "source_id", "channel", "grain", "dimension_id", "dimension_name", "loaded_at", "published_at", "follower_count", "following_count", "heart_count", "play_count"], "Play_API_Data": []};
const EXCLUDE_TABS=["Play_API_Data"];
/* the template's own guide tabs are never data */
const GUIDE_TAB=/^(start here|sources|columns|read ?me|guide|instructions|how to use|legend|notes)$/i;
/* technical logs and backup copies the pipeline keeps are never read or shown */
/* the pipeline's own health log: read for the API health table, not listed as a data tab */
const isStatusTab=n=>/^dashboard status$/i.test(String(n).trim());
const isIgnoredTab=n=>{ n=String(n);
  if(EXCLUDE_TABS.includes(n)||GUIDE_TAB.test(n.trim())||/\b(backup|archive)\b/i.test(n)||/^copy of /i.test(n)) return true;
  /* a copy or variant of a known tab ("App Store Installs Standard Sep": Excel cuts tab names at 31 characters, so "Backup" can be lost) */
  if(typeof TAB_ALIAS==="undefined"||typeof PART_SHEETS==="undefined") return false;
  /* every tab the dashboard knows: tabs it reads, tabs with other names, and tabs whose columns are registered */
  const known=[...new Set([...Object.keys(TAB_ALIAS),...Object.values(PART_SHEETS).flat(),...(typeof PLANNED!=="undefined"?Object.keys(PLANNED):[]),...(typeof BASELINE!=="undefined"?Object.keys(BASELINE):[])])], low=n.toLowerCase();
  if(known.some(t=>t.toLowerCase()===low)||known.some(t=>(TAB_ALIAS[t]||[]).some(a=>compact(a)===compact(n)))) return false;
  return known.some(t=>low.startsWith(t.toLowerCase()+" ")); };
/* tabs and columns the dashboard already has designed sections for, even before they exist in the sheet
   (from the data template). They go to those sections only, never to the automatic "new" handling. */
const PLANNED={"Meta Organic": ["reactions", "comments", "shares", "saves", "video_views", "video_views_3s", "video_watch_time_minutes", "link_clicks"], "Instagram": ["views", "accounts_engaged", "likes", "comments", "saves", "shares", "profile_visits", "external_link_taps", "followers_total"], "YouTube Daily": ["engaged_views", "impressions", "impressions_ctr", "average_view_percentage", "stayed_to_watch"], "TikTok": ["watch_time_minutes", "avg_watch_time_seconds", "completion_rate", "total_time_watched", "average_time_watched", "full_video_watched_rate", "likes", "comments", "shares", "reach"], "Instagram Posts": ["date", "brand_id", "brand_name", "source_id", "channel", "record_key", "post_id", "published_at", "type", "caption", "url", "views", "reach", "likes", "comments", "saves", "shares", "profile_visits", "follows", "watch_time_minutes", "avg_watch_time_seconds", "replies", "taps_forward", "taps_back", "exits", "link_clicks", "loaded_at"], "Facebook Posts": ["date", "brand_id", "brand_name", "source_id", "channel", "record_key", "post_id", "published_at", "type", "message", "url", "views", "reach", "reactions", "comments", "shares", "saves", "link_clicks", "video_views", "video_views_3s", "watch_time_minutes", "avg_watch_time_seconds", "loaded_at"], "YouTube Videos": ["date", "brand_id", "brand_name", "source_id", "channel", "record_key", "video_id", "published_at", "type", "title", "url", "views", "watch_time_minutes", "avg_view_duration_seconds", "avg_view_percentage", "engaged_views", "impressions", "impressions_ctr", "likes", "comments", "shares", "subscribers_gained", "stayed_to_watch", "loaded_at"]};
/* registered 24 Sep 2026: per-post snapshot history tabs, new video and profile columns */
PLANNED["Facebook Media Daily"]=["record_key", "post_id", "media_id", "published_at", "published_date", "post_type", "is_video", "message", "permalink", "thumbnail_url", "reactions_count", "comments_count", "shares_count", "views", "reach", "video_avg_watch_time_ms", "video_total_watch_time_ms", "snapshot_date", "api_status", "api_error", "loaded_at", "video_views_3s", "video_views_15s", "video_complete_views_30s", "video_views_autoplayed", "video_views_clicked_to_play", "video_views_sound_on", "video_views_organic", "video_views_paid", "video_length_ms", "video_retention_25_pct", "video_retention_50_pct", "video_retention_75_pct", "video_retention_100_pct", "video_retention_json"];
PLANNED["Instagram Media Daily"]=["record_key", "media_id", "published_at", "published_date", "media_type", "media_product_type", "caption", "permalink", "thumbnail_url", "like_count", "comments_count", "views", "impressions", "reach", "saved", "shares", "total_interactions", "reel_avg_watch_time_ms", "reel_total_watch_time_ms", "snapshot_date", "api_status", "api_error", "loaded_at", "profile_visits", "profile_activity", "profile_activity_json", "follows", "reposts", "reels_skip_rate"];
PLANNED["Facebook Posts"]=[...PLANNED["Facebook Posts"],...["record_key", "post_id", "media_id", "published_at", "published_date", "post_type", "is_video", "message", "permalink", "thumbnail_url", "reactions_count", "comments_count", "shares_count", "views", "reach", "video_avg_watch_time_ms", "video_total_watch_time_ms", "snapshot_date", "api_status", "api_error", "loaded_at", "video_views_3s", "video_views_15s", "video_complete_views_30s", "video_views_autoplayed", "video_views_clicked_to_play", "video_views_sound_on", "video_views_organic", "video_views_paid", "video_length_ms", "video_retention_25_pct", "video_retention_50_pct", "video_retention_75_pct", "video_retention_100_pct", "video_retention_json"]];
PLANNED["Instagram Posts"]=[...PLANNED["Instagram Posts"],...["record_key", "media_id", "published_at", "published_date", "media_type", "media_product_type", "caption", "permalink", "thumbnail_url", "like_count", "comments_count", "views", "impressions", "reach", "saved", "shares", "total_interactions", "reel_avg_watch_time_ms", "reel_total_watch_time_ms", "snapshot_date", "api_status", "api_error", "loaded_at", "profile_visits", "profile_activity", "profile_activity_json", "follows", "reposts", "reels_skip_rate"]];
PLANNED["Meta Organic"]=[...(PLANNED["Meta Organic"]||[]),...["date", "brand_id", "brand_name", "source_id", "channel", "grain", "dimension_id", "dimension_name", "loaded_at", "page_media_view", "page_total_media_view_unique", "page_post_engagements", "page_follows", "page_daily_follows", "page_daily_follows_unique", "page_views_total", "page_total_actions"]];
PLANNED["YouTube Videos"]=[...(PLANNED["YouTube Videos"]||[]),"record_key","published_date","permalink","thumbnail_url","is_short","duration_seconds","estimated_minutes_watched","average_view_duration","average_view_percentage","video_thumbnail_impressions","video_thumbnail_impressions_ctr","snapshot_date","api_status","api_error"];
PLANNED["YouTube Videos"]=[...PLANNED["YouTube Videos"],"description","published_date","thumbnail_url","duration","channel_id","channel_title","engaged_view_rate","average_view_duration_seconds","subscribers_lost","views_rank","watch_time_rank","performance_tier","snapshot_start_date","snapshot_end_date"];
PLANNED["YouTube Shorts"]=[...PLANNED["YouTube Videos"]];
PLANNED["YouTube Video Daily"]=["record_key","date","video_id","title","published_at","thumbnail_url","views","engaged_views","engaged_view_rate","estimated_minutes_watched","average_view_duration_seconds","average_view_percentage","likes","comments","shares","subscribers_gained","subscribers_lost","loaded_at"];
PLANNED["YouTube Reach"]=["record_key","date","channel_id","video_id","title","thumbnail_url","video_thumbnail_impressions","video_thumbnail_impressions_ctr","report_id","report_start_time","report_end_time","loaded_at"];
PLANNED["Instagram Follower History"]=["record_key", "date", "brand_id", "brand_name", "source_id", "channel", "loaded_at", "api_status", "api_error", "source", "method", "notes", "followers_gained", "followers_gain", "follows", "new_followers", "gained", "follows_count", "follower_gains", "new_follows", "followed", "followers_lost", "unfollows", "unfollowed", "unfollowers", "lost", "unfollows_count", "lost_followers", "net_followers", "net", "net_change", "net_follows", "net_follower_change", "followers", "followers_count", "followers_total", "follower_total", "total_followers", "total", "number_of_followers", "no_of_followers", "is_estimated", "calculated", "reverse_calculated"];
PLANNED["Instagram Follower Snapshots"]=["record_key", "date", "snapshot_date", "captured_at", "as_of", "brand_id", "brand_name", "source_id", "channel", "followers", "followers_count", "followers_total", "follower_total", "total_followers", "number_of_followers", "follows_count", "media_count", "username", "ig_user_id", "loaded_at", "api_status", "api_error"];
PLANNED["App Store Deletions"]=["record_key","date","brand_id","brand_name","source_id","channel","app_name","app_apple_id","deletions","uninstalls","counts","territory","device","loaded_at"];
PLANNED["App Store Installs"]=["event","counts","deletions","uninstalls"];
PLANNED["Facebook Page Activity"]=["date","brand_id","brand_name","source_id","channel","grain","dimension_id","dimension_name","page_media_view","page_total_media_view_unique","page_post_engagements","page_follows","page_daily_follows","page_daily_follows_unique","page_views_total","page_total_actions","loaded_at"];
PLANNED["Facebook Stories"]=["record_key","story_id","published_at","published_date","captured_at","media_type","message","permalink","thumbnail_url","reactions_count","comments_count","shares_count","views","reach","api_status","api_error","loaded_at"];
PLANNED["Facebook Posts"]=[...PLANNED["Facebook Posts"],"media_id","published_date","post_type","is_video","permalink","thumbnail_url","reactions_count","comments_count","shares_count","video_avg_watch_time_ms","video_total_watch_time_ms","snapshot_date","api_status","api_error"];
PLANNED["Instagram Stories"]=["record_key","story_id","published_at","published_date","captured_at","media_type","media_product_type","caption","permalink","thumbnail_url","views","reach","replies","shares","link_clicks","total_interactions","navigation_json","api_status","api_error","loaded_at"];
PLANNED["Instagram Account Activity"]=["record_key","date","range_start","range_end","brand_id","brand_name","source_id","channel","grain","dimension_id","dimension_name","views","profile_views","link_clicks","total_interactions","follows","api_status","api_error","loaded_at"];
PLANNED["Instagram Posts"]=[...PLANNED["Instagram Posts"],"media_id","published_date","media_type","media_product_type","permalink","thumbnail_url","like_count","comments_count","impressions","saved","total_interactions","reel_avg_watch_time_ms","reel_total_watch_time_ms","snapshot_date","api_status","api_error"];
/* every column in the template (docs/WORKBOOK.md and dashboard-template.xlsx) is a known column, never "new" */
const TEMPLATE_COLS={"Meta Organic":["date","page_media_view","page_post_engagements","page_follows","page_daily_follows","page_total_media_view_unique","page_views_total","video_views","reactions","comments","shares","link_clicks"],"Facebook Posts":["post_id","published_at","type","message","url","views","reach","reactions","comments","shares","link_clicks","video_views","watch_time_minutes","loaded_at"],"Facebook Stories":["story_id","published_at","message","url","views","reach","reactions"],"Instagram":["date","reach","follower_count","views","accounts_engaged","profile_visits","external_link_taps","followers_total","likes","comments","saves","shares"],"Instagram Posts":["post_id","published_at","type","caption","url","views","reach","likes","comments","saves","shares","profile_visits","follows","total_interactions","loaded_at"],"Instagram Stories":["story_id","published_at","views","reach","replies","taps_forward","taps_back","exits","link_clicks"],"Instagram Account Activity":["date","range_start","range_end","views","profile_visits","link_clicks","total_interactions","follows"],"Instagram Follower History":["date","followers_gained","followers_lost","net_followers","followers_total"],"Instagram Follower Snapshots":["date","followers_total"],"YouTube Daily":["date","views","estimatedMinutesWatched","averageViewDuration","subscribersGained","subscribersLost","likes","comments","shares"],"YouTube":["date","subscribers","total_views","total_videos"],"YouTube Videos":["video_id","published_at","title","type","duration","url","views","watch_time_minutes","avg_view_duration_seconds","avg_view_percentage","subscribers_gained","impressions","impressions_ctr","likes","comments","loaded_at"],"YouTube Video Daily":["date","video_id","views","watch_time_minutes","subscribers_gained","subscribers_lost"],"YouTube Reach":["date","video_id","impressions","impressions_ctr"],"TikTok":["date","grain","follower_count","following_count","heart_count","play_count","dimension_id","dimension_name","published_at","likes","comments","shares"],"X":["date","grain","follower_count","following_count","post_count","dimension_id","dimension_name","published_at","impressions","likes","reposts","replies","bookmarks","engagements"],"GA4":["date","sessions","total_users","new_users","page_views","engaged_sessions","avg_session_duration","bounce_rate","conversions","total_revenue"],"GA4 Channels":["date","channel_group","sessions","source_medium"],"Meta":["date","spend","impressions","clicks","reach","inline_link_clicks","act_landing_page_view","act_mobile_app_install","dimension_name"],"Play Installs":["date","daily_device_installs","daily_user_installs","daily_user_uninstalls","uninstall_events","update_events","active_device_installs","country"],"Play Subscriptions":["date","product_id","new_subscriptions","cancelled_subscriptions","active_subscriptions","is_free_trial_offer","country"],"Play Earnings":["date","transaction_id","transaction_type","amount_merchant_currency","merchant_currency","product_title"],"Play Traffic Source":["date","traffic_source","store_listing_visitors","store_listing_acquisitions"],"Play_Quality_History":["date","dataset","metric","dimension","value"],"App Store Sales":["date","product_type_identifier","units","developer_proceeds","currency_of_proceeds","country_code","title"],"App Store Subscriptions":["date","active_standard_price_subscriptions","active_free_trial_introductory_offer_subscriptions","subscription_name","country"],"App Store Subscription Events":["date","event","quantity"],"App Store Installs":["date","event","download_type","source_type","counts"],"App Store Deletions":["date","deletions"],"AdMob":["date","estimated_earnings","impressions","ad_requests","clicks","country","app"],"AdSense":["date","estimated_earnings"],"Dashboard Status":["source","status","last_success","message"]};
Object.keys(TEMPLATE_COLS).forEach(t=>{ PLANNED[t]=[...(PLANNED[t]||[]),...TEMPLATE_COLS[t]]; });
Object.keys(PLANNED).forEach(t=>{ BASELINE[t]=[...new Set([...(BASELINE[t]||[]),...PLANNED[t]])]; });     /* the pipeline's own technical log */
const ID_COL=/(^|_)(id|key|uuid)$|record_key|dimension_id|brand_id|transaction_id/i;
const LEVEL_COL=/follower|following|subscriber|post_count|listed_count|_total$|^total_/i;
const EARN_COL=/earning|revenue|proceeds|income|payout/i;
const AVG_COL=/(^|_)(avg|average|mean)(_|$)|rate$|_rate_|ratio|percent|percentage|ctr|completion|duration|per_/i;
function summarise(name,rs,cols){
  const dateCol=cols.find(c=>/^date$/i.test(c))||cols.find(c=>rs.slice(0,20).some(r=>iso(r[c])));
  /* a figure column holds real numbers ("2026-09-24T06:00" is a time, not 2026); times and load stamps never count */
  const strictNum=v=>typeof v==="number"||/^\s*-?[\d,]*\.?\d+\s*%?\s*$/.test(String(v));
  const numeric=cols.filter(c=>c!==dateCol&&!ID_COL.test(c)&&!/(^|_)(loaded|created|updated|captured)_at$|_at$|timestamp|(^|_)(date|time)$/i.test(c)&&(()=>{ let n=0,t=0; for(const r of rs.slice(0,400)){ const v=r[c]; if(v===null||v===undefined||v==="") continue; t++; if(!(v instanceof Date)&&strictNum(v)&&num(v)!==null) n++; } return t>0&&n/t>0.8; })());
  const text=cols.filter(c=>c!==dateCol&&!numeric.includes(c)&&!ID_COL.test(c)&&!/loaded_at|brand_name/i.test(c));
  const channel=rs.find(r=>r.channel)&&String(rs.find(r=>r.channel).channel);
  const grainAcct=rs.some(r=>String(r.grain||"").toLowerCase()==="account");
  const by={}, lvl={}, cnt={};
  const avgc=numeric.filter(c=>AVG_COL.test(c)&&!LEVEL_COL.test(c));
  rs.forEach(r=>{ const d=dateCol?iso(r[dateCol]):null; if(!d) return; const o=by[d]||(by[d]={});
    numeric.forEach(c=>{ const v=num(r[c]); if(v===null) return;
      if(LEVEL_COL.test(c)){ if(grainAcct&&String(r.grain||"").toLowerCase()!=="account") return; lvl[c+"|"+d]=v; o[c]=v; }
      else if(!(grainAcct&&String(r.grain||"").toLowerCase()==="account")){ o[c]=(o[c]||0)+v; if(avgc.includes(c)) cnt[c+"|"+d]=(cnt[c+"|"+d]||0)+1; } }); });
  /* an average or rate over several rows on one day is their mean, not their sum */
  Object.keys(by).forEach(d=>avgc.forEach(c=>{ const n=cnt[c+"|"+d]; if(n&&by[d][c]!==undefined) by[d][c]=by[d][c]/n; }));
  const dates=Object.keys(by).sort();
  const daily={}; numeric.forEach(c=>{ daily[c]=dates.map(d=>has2(by[d][c])?Math.round(by[d][c]*1e6)/1e6:null); });
  const show=[dateCol,...text.slice(0,3),...numeric.slice(0,5)].filter(Boolean);
  const latest=rs.slice().sort((a,b)=>String(dateCol?iso(a[dateCol]):"")<String(dateCol?iso(b[dateCol]):"")?1:-1).slice(0,10).map(r=>show.map(c=>{ const v=r[c]; return v===null||v===undefined?"":String(v).slice(0,90); }));
  const fcol=numeric.find(c=>/follower_count|followers/i.test(c)), ecol=numeric.find(c=>EARN_COL.test(c));
  let followers=null; if(fcol){ for(let i=dates.length-1;i>=0;i--){ const v=daily[fcol][i]; if(v!==null){ followers={v,d:dates[i]}; break; } } }
  const has1=re=>numeric.some(c=>re.test(c));
  const kind=(/_organic$|social/i.test(channel||"")||fcol||has1(/^(views|impressions|plays|play_count|likes|reposts|shares|comments)$/i))?"social"
    :ecol?"earnings":has1(/sessions|users|page_?views|visits/i)?"website":has1(/subscri|trial|renewal|churn/i)?"subs":has1(/install|download|uninstall|active_device/i)?"app":"other";
  const c2=String(name).toLowerCase().replace(/[^a-z0-9]+/g," ").trim(), pl=/^(facebook|fb|meta)\b/.test(c2)?"facebook":/^(instagram|ig)\b/.test(c2)?"instagram":/^(youtube|yt)\b/.test(c2)?"youtube":/^(tiktok|tik tok)\b/.test(c2)?"tiktok":/^(x|twitter)\b/.test(c2)?"x":null;
  return {name,kind:pl?"platform":kind,platform:pl,rows:rs.length,dateCol,first:dates[0]||null,last:dates[dates.length-1]||null,numeric,level:numeric.filter(c=>LEVEL_COL.test(c)),avg:avgc,text:text.slice(0,6),
    channel:channel||null,social:/_organic$|social/i.test(channel||"")||!!fcol,followers,earnCol:ecol||null,dates,daily,show,latest};
}
function has2(v){ return v!==null&&v!==undefined&&!(typeof v==="number"&&isNaN(v)); }
function tabStat(name,ws){
  const a=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true}); if(!a.length) return {name,rows:0,last:null,loadedAt:null,loads:[]};
  const h=a[0].map(x=>String(x||"").trim()); let di=h.findIndex(x=>/^date$/i.test(x)); if(di<0) di=h.findIndex(x=>/^(published_date|snapshot_date|published_at|created_time|timestamp)$/i.test(x)); const li=h.findIndex(x=>/^loaded_at$/i.test(x));
  let last=null, loaded=null, sig=0, errs=0, dups=0, revs=0, neg=0, future=0; const loads={}; const ai=h.findIndex(x=>/^api_?status$/i.test(x));
  /* integrity facts for the audit: exact duplicate rows, revised rows (same key, different figures), impossible negatives, future dates */
  const ki=h.findIndex(x=>/^record_key$/i.test(x)), seenRow=new Set(), seenKey=new Map();
  /* YouTube reports daily likes as NET likes (added minus removed), so a day can legitimately be negative there */
  const netLikes=/^youtube/i.test(canonTab(name));
  const countCols=h.map((x,j)=>/(^|_)(views?|impressions|reach|likes?|comments?|shares?|saves?|saved|sessions|users|installs|followers?|follower_count|plays?|play_count|clicks?|requests)(_|$)/i.test(x)&&!/rate|ctr|change|net|diff|lost/i.test(x)&&!(netLikes&&/^(dis)?likes$/i.test(x))?j:-1).filter(j=>j>=0);
  const tomorrow=new Date(Date.now()+2*864e5).toISOString().slice(0,10);
  for(let i=1;i<a.length;i++){ const r=a[i]; if(!r||!r.length) continue;
    if(ai>=0&&/^(error|failed|fail|failure)$/i.test(String(r[ai]||'').trim())) errs++;
    { const rk=r.map((x,j)=>j===li?'':String(x==null?'':x)).join('\u0001'); if(seenRow.has(rk)) dups++; else { seenRow.add(rk);
        if(ki>=0&&r[ki]!=null&&r[ki]!==''){ const k=String(r[ki]); if(seenKey.has(k)) revs++; else seenKey.set(k,1); } } }
    for(const j of countCols){ const v=r[j]; if(typeof v==='number'&&v<0) neg++; }
    { const dd=di>=0?iso(r[di]):null; if(dd&&dd>tomorrow) future++; }
    for(let j=0;j<r.length;j++){ if(j!==di&&j!==li&&typeof r[j]==='number'&&isFinite(r[j])) sig+=r[j]*((j%7)+1); }
    const d=di>=0?iso(r[di]):null; if(d&&(!last||d>last)) last=d;
    let l=li>=0?r[li]:null; if(l instanceof Date) l=l.toISOString(); l=l&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(l))?String(l).slice(0,16):null;
    if(l){ if(!loaded||l>loaded) loaded=l; const k=l.slice(0,13); const o=loads[k]||(loads[k]={at:l,rows:0,last:null}); o.rows++; if(l>o.at) o.at=l; if(d&&(!o.last||d>o.last)) o.last=d; } }
  const L=Object.values(loads).sort((x,y)=>x.at<y.at?1:-1).slice(0,8);
  return {name,canon:canonTab(name),rows:a.length-1,errors:errs,dups,revs,neg,future,last,loadedAt:loaded,loads:L,sig:Math.round(sig*1000)/1000};
}
function discover(wb){
  const tabs=[], newCols=[], tabStats=[];
  wb.SheetNames.forEach(name=>{ if(isIgnoredTab(name)||isStatusTab(name)||!wb.Sheets[name]) return; try{ tabStats.push(tabStat(name,wb.Sheets[name])); }catch(e){} });
  wb.SheetNames.forEach(name=>{ if(isIgnoredTab(name)||isStatusTab(name)) return; const ws=wb.Sheets[name]; if(!ws) return;
    const rs=XLSX.utils.sheet_to_json(ws,{defval:null}); const cols=rs.length?Object.keys(rs[0]):((XLSX.utils.sheet_to_json(ws,{header:1})[0])||[]);
    const allCols=[...new Set(rs.flatMap(r=>Object.keys(r)).concat(cols))].filter(c=>c&&!/^__EMPTY/.test(c));
    const canon=canonTab(name);
    if(!BASELINE[canon]){ if(rs.length) tabs.push(summarise(name,rs,allCols)); return; }
    const known=new Set(BASELINE[canon].map(norm));
    const fresh=allCols.filter(c=>{ const n=norm(c); if(known.has(n)) return false; const via=ALIAS_REV[n]; return !(via&&[...via].some(x=>known.has(x))); });
    if(fresh.length&&rs.length){ const dc=allCols.find(c=>/^date$/i.test(c)); const sm=summarise(name,rs,dc?[dc,...fresh]:fresh); if(sm.numeric.length||sm.text.length) newCols.push({...sm,tab:canon,cols:fresh}); } });
  return {tabs,newCols,tabStats};
}
function core(wb){
  const out={};
  out.fb=perDay([...rows(wb,"Meta Organic"),...rows(wb,"Facebook Page Activity")].sort((a,b)=>String(col(a,"loaded_at")||"")<String(col(b,"loaded_at")||"")?-1:1),{v:"page_media_view",u:"page_total_media_view_unique",e:"page_post_engagements",f:"page_follows",nf:"page_daily_follows",pv:"page_views_total",
    vv:"video_views",v3:"video_views_3s",vt:"video_watch_time_minutes",re:"reactions",cm:"comments",sh:"shares",sv:"saves",lc:"link_clicks"});
  out.ig=perDay(rows(wb,"Instagram"),{r:"reach",nf:"follower_count",v:"views",ae:"accounts_engaged",l:"likes",cm:"comments",sv:"saves",sh:"shares",
    pv:"profile_visits",lt:"external_link_taps",ft:"followers_total"});
  out.yt=perDay(rows(wb,"YouTube Daily"),{v:"views",m:"estimatedMinutesWatched",a:"averageViewDuration",l:"likes",c:"comments",s:"shares",sg:"subscribersGained",sl:"subscribersLost",
    ev:"engaged_views",im:"impressions",ctr:"impressions_ctr",ap:"average_view_percentage",stw:"stayed_to_watch"});
  /* days after the channel tab's last day, filled from the per-video daily figures (they cover videos published since the
     per-video tracking began, about 95% of channel views); each filled day is marked so the page can say so */
  { const lastCh=out.yt.length?out.yt[out.yt.length-1].d:null, add={};
    rows(wb,"YouTube Video Daily").forEach(r=>{ const d=r.__d; if(!d||(lastCh&&d<=lastCh)) return; const o=add[d]||(add[d]={d,v:0,m:0,l:0,c:0,s:0,sg:0,sl:0,src:"videos"});
      o.v+=num(col(r,"views"))||0; o.m+=num(col(r,"watch_time_minutes"))||0; o.l+=num(col(r,"likes"))||0; o.c+=num(col(r,"comments"))||0; o.s+=num(col(r,"shares"))||0;
      o.sg+=num(col(r,"subscribers_gained"))||0; o.sl+=num(col(r,"subscribers_lost"))||0; });
    const fill=Object.values(add).map(o=>({...o,m:r2(o.m),a:o.v?Math.round(o.m*60/o.v):null})).sort((a,b)=>a.d<b.d?-1:1);
    out.yt=out.yt.concat(fill); out.ytFilled=fill.map(o=>o.d); }
  out.ytSnap=perDay(rows(wb,"YouTube"),{subs:"subscribers",views:"total_views",vids:"total_videos"});
  /* the pipeline's API health log (Dashboard Status): every row as it is, for the API health table */
  { const key=wb.SheetNames.find(n=>isStatusTab(n)); out.apiStatus=null;
    if(key&&wb.Sheets[key]){ const a=XLSX.utils.sheet_to_json(wb.Sheets[key],{header:1,defval:"",raw:false}).filter(r=>r.some(v=>String(v).trim()!==""));
      if(a.length) out.apiStatus={hdr:a[0].map(h=>String(h).trim()),rows:a.slice(1,301).map(r=>a[0].map((h,i)=>String(r[i]==null?"":r[i]).trim()))}; } }
  /* Instagram followers: Meta gives daily followers gained and lost (Instagram Follower History) rather than a running total,
     plus the account total now and then (Instagram Follower Snapshots); the dashboard works out the total for every day from these */
  { const by={}; rows(wb,"Instagram Follower History").forEach(r=>{ const g=num(col(r,"followers_gained")), l=num(col(r,"followers_lost")), n=num(col(r,"net_followers")), t=num(col(r,"followers_total"));
      if(g===null&&l===null&&n===null&&t===null) return; const o=by[r.__d]||(by[r.__d]={d:r.__d});
      if(g!==null) o.g=g; if(l!==null) o.l=l; if(n!==null) o.n=n; if(t!==null) o.t=t; });
    out.igFH=Object.values(by).sort((a,b)=>a.d<b.d?-1:1);
    const key=findSheet(wb,"Instagram Follower Snapshots"), sn={};
    if(key&&wb.Sheets[key]) normRows(XLSX.utils.sheet_to_json(wb.Sheets[key],{defval:null}),"Instagram Follower Snapshots").filter(r=>!failed(r)).forEach(r=>{
      const d=iso(col(r,"date")||col(r,"snapshot_date")||col(r,"captured_at")||col(r,"as_of")||col(r,"loaded_at")), t=num(col(r,"followers_total")); if(d&&t!==null) sn[d]=t; });
    out.igFS=Object.keys(sn).sort().map(d=>({d,t:sn[d]})); }
  out.web=perDay(rows(wb,"GA4"),{s:"sessions",u:"total_users",n:"new_users",pv:"page_views",es:"engaged_sessions",cv:"conversions",rev:"total_revenue",dur:"avg_session_duration",br:"bounce_rate"});
  const ch={}; rows(wb,"GA4 Channels").forEach(r=>{ const c=String(col(r,"channel_group")||"").trim(); if(!c) return; const k=r.__d+"|"+c; ch[k]=(ch[k]||0)+(num(col(r,"sessions"))||0); });
  out.webCh=Object.keys(ch).sort().map(k=>{ const [d,c]=k.split("|"); return {d,c,s:ch[k]}; });
  out.ads=sumDay(rows(wb,"Meta"),{sp:"spend",im:"impressions",cl:"clicks",rc:"reach",lc:"inline_link_clicks",lp:"act_landing_page_view",ai:"act_mobile_app_install"});
  out.pSubs=sumDay(rows(wb,"Play Subscriptions"),{a:"active_subscriptions",n:"new_subscriptions",c:"cancelled_subscriptions"});
  { const tn={}; rows(wb,"Play Subscriptions").forEach(r=>{ if(/^(true|1|yes)$/i.test(String(col(r,"is_free_trial_offer")||"").trim())) tn[r.__d]=(tn[r.__d]||0)+(num(col(r,"new_subscriptions"))||0); });
    out.pSubs.forEach(o=>{ if(tn[o.d]!==undefined) o.tn=tn[o.d]; }); }   /* new subscriptions that started on a free trial */
  out.aSubs=sumDay(rows(wb,"App Store Subscriptions"),{s:"active_standard_price_subscriptions",t:"active_free_trial_introductory_offer_subscriptions"});
  out.aEv=rows(wb,"App Store Subscription Events").map(r=>({d:r.__d,e:String(col(r,"event")||"").trim(),q:num(col(r,"quantity"))||0})).filter(x=>x.e).sort((a,b)=>a.d<b.d?-1:1);
  const earnRows=rows(wb,"Play Earnings");
  /* The dashboard works out Google Play revenue from Google's 15% fee (revenue = fee / 0.15 x 0.85). If the tab holds the whole
     earnings report (charges, fees, taxes and refunds, told apart by transaction_type), the day's net payout is used instead,
     stored in the same fee field so every page reads it the same way. */
  const fullReport=earnRows.some(r=>{ const t=String(col(r,"transaction_type")||"").trim(); return t&&!/fee/i.test(t); });
  out.earn=sumDay(earnRows,{fee:"amount_merchant_currency"},(o,r)=>{ o.__t=o.__t||new Set(); o.__t.add(String(col(r,"transaction_id"))); })
    .map(o=>({d:o.d,fee:fullReport?Math.round(-o.fee*0.15/0.85*1e6)/1e6:o.fee,tx:o.__t?o.__t.size:0}));
  const tr={}; rows(wb,"Play Traffic Source").forEach(r=>{ const s=String(col(r,"traffic_source")||"").trim(); if(!s) return; const k=r.__d+"|"+s;
    const o=tr[k]||(tr[k]={d:r.__d,s,acq:0,vis:0}); o.acq+=num(col(r,"store_listing_acquisitions"))||0; o.vis+=num(col(r,"store_listing_visitors"))||0; });
  out.traffic=Object.values(tr).sort((a,b)=>a.d<b.d?-1:1);
  { const nm={v:"views",r:"reach",l:"likes",cm:"comments",sv:"saves",sh:"shares",pv:"profile_visits",fo:"follows",
    wt:"watch_time_minutes",aw:"avg_watch_time_seconds",rp:"replies",tf:"taps_forward",tb:"taps_back",ex:"exits",lc:"link_clicks",ti:"total_interactions",rpo:"reposts",skr:"reels_skip_rate"}, tx={ty:"type",t:"caption",u:"url"};
    const posts=content(wb,"Instagram Posts","post_id",nm,tx), ids=new Set(posts.map(p=>p.id));
    out.igPosts=posts.concat(content(wb,"Instagram Stories","story_id",nm,tx,"story").filter(p=>!ids.has(p.id))); }
  /* Instagram account activity: totals for a period (range_start to range_end); failed rows are skipped */
  out.igAcct=rows(wb,"Instagram Account Activity").map(r=>({from:iso(col(r,"range_start"))||r.__d,to:iso(col(r,"range_end"))||r.__d,v:num(col(r,"views")),pv:num(col(r,"profile_visits")),lc:num(col(r,"link_clicks"))??num(col(r,"external_link_taps")),ti:num(col(r,"total_interactions")),fo:num(col(r,"follows")),ae:num(col(r,"accounts_engaged"))}))
    .filter(o=>[o.v,o.pv,o.lc,o.ti,o.fo,o.ae].some(x=>x!==null));
  { const nm={v:"views",r:"reach",re:"reactions",cm:"comments",sh:"shares",sv:"saves",lc:"link_clicks",
    vv:"video_views",v3:"video_views_3s",wt:"watch_time_minutes",aw:"avg_watch_time_seconds"}, tx={ty:"type",t:"message",u:"url"};
    const posts=content(wb,"Facebook Posts","post_id",nm,tx), ids=new Set(posts.map(p=>p.id));
    out.fbPosts=posts.concat(content(wb,"Facebook Stories","story_id",nm,tx,"story").filter(p=>!ids.has(p.id))); }
  { const nm={v:"views",wt:"watch_time_minutes",ad:"avg_view_duration_seconds",ap:"avg_view_percentage",ev:"engaged_views",
    im:"impressions",ctr:"impressions_ctr",l:"likes",cm:"comments",sh:"shares",sg:"subscribers_gained",sl:"subscribers_lost",er:"engaged_view_rate",stw:"stayed_to_watch",dur:"duration"}, tx={ty:"type",t:"title",u:"url",tier:"performance_tier"};
    const vids=content(wb,"YouTube Videos","video_id",nm,tx), ids=new Set(vids.map(v=>v.id));
    out.ytVideos=vids.concat(content(wb,"YouTube Shorts","video_id",nm,tx,"short").filter(v=>!ids.has(v.id)));
    /* the period the video figures cover */
    { let asOf=null; const key=findSheet(wb,"YouTube Videos"); if(key&&wb.Sheets[key]) normRows(XLSX.utils.sheet_to_json(wb.Sheets[key],{defval:null}),"YouTube Videos").forEach(r=>{ const e=iso(col(r,"snapshot_end_date")); if(e&&(!asOf||e>asOf)) asOf=e; }); out.ytVideosAsOf=asOf; }
    /* thumbnail impressions and click-through, per video and per day, from YouTube Reach when it has rows */
    { const rr=rows(wb,"YouTube Reach"), byV={}, byD={};
      rr.forEach(r=>{ const im=num(col(r,"impressions")), ctr=num(col(r,"impressions_ctr")); if(im===null) return; const c=ctr===null?null:(ctr>1?ctr/100:ctr);
        const v=String(col(r,"video_id")||""), o=byV[v]||(byV[v]={im:0,cl:0,n:0}); o.im+=im; if(c!==null){ o.cl+=im*c; o.n++; }
        const d=r.__d, p=byD[d]||(byD[d]={d,im:0,cl:0,n:0}); p.im+=im; if(c!==null){ p.cl+=im*c; p.n++; } });
      out.ytVideos.forEach(v=>{ const x=byV[v.id]; if(!x) return; if(v.im===undefined) v.im=x.im; if(v.ctr===undefined&&x.n) v.ctr=Math.round(x.cl/x.im*10000)/100; });
      out.ytReach=Object.values(byD).sort((a,b)=>a.d<b.d?-1:1).map(p=>({d:p.d,im:p.im,ctr:p.n&&p.im?Math.round(p.cl/p.im*10000)/100:null})); }
    /* Shorts: when a duration is given, anything up to three minutes is a Short */
    out.ytVideos.forEach(v=>{ if(v.ty||v.dur===undefined) return; v.ty=v.dur<=180?"short":"video"; }); }
  { const x=xData(wb); out.xAcct=x.acct; out.xPosts=x.posts; }
  { const t=tiktokData(wb); out.ttAcct=t.acct; out.ttVideos=t.videos; }
  out.adsense=adsense(wb);
  { const am=admob(wb); out.admob=am.daily; out.admobDetail=am.detail; }
  out.adAudit={adsense:rawAudit(wb,"AdSense",["estimated_earnings"]),admob:rawAudit(wb,"AdMob",["estimated_earnings","impressions","ad_requests","clicks"]),
    adsenseKept:latestRows(rows(wb,"AdSense"),r=>String(col(r,"record_key")||r.__d)).length,
    admobKept:latestRows(rows(wb,"AdMob"),r=>String(col(r,"record_key")||(r.__d+"|"+col(r,"country")+"|"+col(r,"app")))).length};
  { const ai=rows(wb,"App Store Installs"); const isDel=r=>/delet|uninstall|remov/i.test(String(col(r,"event")||""));
    out.aInst=ai.filter(r=>!isDel(r)).map(r=>({d:r.__d,src:String(col(r,"source_type")||""),t:String(col(r,"download_type")||""),n:num(col(r,"counts"))||0}));
    /* Apple uninstalls: Delete events in Apple's installation and deletion report, a deletions column, or their own tab */
    const del={}; const add=(d,n)=>{ if(!d||n===null||n===undefined) return; del[d]=(del[d]||0)+n; };
    ai.forEach(r=>{ if(isDel(r)) add(r.__d,num(col(r,"counts"))??num(col(r,"deletions"))??0); else add(r.__d,num(col(r,"deletions"))); });
    rows(wb,"App Store Deletions").forEach(r=>add(r.__d,num(col(r,"deletions"))??num(col(r,"counts"))));
    out.appleDel=Object.keys(del).sort().map(d=>({d,n:del[d]})); }
  return out;
}
function installs(wb){
  const rs=rows(wb,"Play Installs");
  return {
    play:sumDay(rs,{i:"daily_device_installs",ui:"daily_user_installs",uu:"daily_user_uninstalls",ue:"uninstall_events",up:"update_events",act:"active_device_installs"}),
    playCty:ctyDaily(rs,"country","daily_device_installs")
  };
}
function store(wb){
  const rs=rows(wb,"App Store Sales");
  const by={}, fxMissing={};   /* Apple revenue in currencies without a rate: reported, never dropped silently */
  rs.forEach(r=>{ const t=String(col(r,"product_type_identifier")||"").trim(); const u=num(col(r,"units"))||0;
    const o=by[r.__d]||(by[r.__d]={d:r.__d,dl:0,rd:0,up:0,sub:0,subp:0,rev:0});
    if(t==="1") o.dl+=u; else if(t==="3") o.rd+=u; else if(t==="7") o.up+=u;
    else if(t==="IAY"){ o.sub+=u; if((num(col(r,"developer_proceeds"))||0)>0) o.subp+=u; const cur=String(col(r,"currency_of_proceeds")||"").trim(), pr=(num(col(r,"developer_proceeds"))||0)*u; if(cur===TARGET) o.rev+=pr; else if(FX[cur]!==undefined&&TO) o.rev+=pr*FX[cur]/TO; else if(pr) fxMissing[cur||"(blank)"]=(fxMissing[cur||"(blank)"]||0)+pr; } });
  const apple=Object.values(by).sort((a,b)=>a.d<b.d?-1:1).map(o=>({...o,rev:Math.round(o.rev*1e6)/1e6}));   /* full precision; rounded only when shown */
  const appleCty=ctyDaily(rs,"country_code","units",r=>["1","3"].includes(String(col(r,"product_type_identifier")||"").trim()));
  const q=rows(wb,"Play_Quality_History").filter(r=>String(col(r,"dimension")||"[]").trim()==="[]");
  const qd={}; const pick={crashRate:"cr",userPerceivedCrashRate:"ucr",anrRate:"anr",userPerceivedAnrRate:"uanr"};
  q.forEach(r=>{ const m=String(col(r,"metric")); const ds=String(col(r,"dataset")); const o=qd[r.__d]||(qd[r.__d]={d:r.__d});
    if(pick[m]) o[pick[m]]=num(col(r,"value"));
    if(m==="distinctUsers"&&ds==="crashRateMetricSet") o.dau=num(col(r,"value")); });
  const qual=Object.values(qd).sort((a,b)=>a.d<b.d?-1:1).filter(o=>o.cr!==undefined||o.anr!==undefined);
  return {fxMissing,apple,appleCty,qual};
}






onmessage=function(e){ try{ var bytes=new Uint8Array(e.data); var names=XLSX.read(bytes,{type:'array',bookSheets:true}).SheetNames.filter(function(n){ return !isIgnoredTab(n); });
  var wb=XLSX.read(bytes,{type:'array',sheets:names,dense:true,cellDates:true});
  var out=Object.assign({},core(wb),installs(wb),store(wb)); out.extra=discover(wb); postMessage({ok:true,out:out}); }catch(err){ postMessage({ok:false,error:String(err&&err.message||err)}); } };
