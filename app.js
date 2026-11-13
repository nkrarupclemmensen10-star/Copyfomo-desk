(function(){
"use strict";
var TZ="Europe/Copenhagen", D="—";
var OWNER="nkrarupclemmensen10-star";
var REPO="Copyfomo-desk";
var DATA_REF="data";
var DATA_PATH="data.json";
var POLL_MS=60000;
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function num(x){return typeof x==="number"&&isFinite(x)}
function usd(x,d){if(!num(x))return D;d=d==null?2:d;var s=Math.abs(x).toLocaleString("da-DK",{minimumFractionDigits:d,maximumFractionDigits:d});return(x<0?"−$":"$")+s}
function sgn(x,d){if(!num(x))return D;return(x>0?"+":x<0?"−":"")+"$"+Math.abs(x).toLocaleString("da-DK",{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d})}
function pct(x,d){if(!num(x))return D;return(x>0?"+":x<0?"−":"")+Math.abs(x).toLocaleString("da-DK",{minimumFractionDigits:d==null?1:d,maximumFractionDigits:d==null?1:d})+" %"}
function cls(x){return!num(x)||x===0?"":(x>0?"g":"r")}
function price(x){if(!num(x))return D;if(x>=1000)return"$"+Math.round(x).toLocaleString("da-DK");if(x>=1)return"$"+x.toLocaleString("da-DK",{maximumFractionDigits:2});
  var s=x.toPrecision(3);return"$"+Number(s).toLocaleString("da-DK",{maximumSignificantDigits:3,maximumFractionDigits:12})}
function hm(ts){return ts?new Intl.DateTimeFormat("da-DK",{timeZone:TZ,hour:"2-digit",minute:"2-digit"}).format(new Date(ts*1000)).replace(".",":"):D}
function day(ts,o){return ts?new Intl.DateTimeFormat("da-DK",Object.assign({timeZone:TZ,day:"numeric",month:"short"},o||{})).format(new Date(ts*1000)):D}
function hue(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%360}
function av(h){h=h||"?";return'<div class="av" style="background:hsl('+hue(h)+',55%,55%)">'+esc(h.replace(/^0x/i,"").charAt(0).toUpperCase())+"</div>"}
function countUp(el,to,fmt,ms){if(!num(to)){el.textContent=D;return}var t0=null;ms=ms||1300;
  function f(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);el.textContent=fmt(to*e);if(k<1)requestAnimationFrame(f)}requestAnimationFrame(f)}

function b64utf8(s){
  s=(s||"").replace(/\s/g,"");
  var bin=atob(s);
  if(typeof TextDecoder==="function"){
    var bytes=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }
  return decodeURIComponent(escape(bin));
}
function fetchContents(){
  var url="https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+DATA_PATH+"?ref="+encodeURIComponent(DATA_REF);
  return fetch(url,{cache:"no-store",headers:{"Accept":"application/vnd.github+json"}}).then(function(r){
    if(!r.ok) throw new Error("contents "+r.status);
    return r.json();
  }).then(function(j){
    if(!j||j.encoding!=="base64"||!j.content) throw new Error("no content");
    return JSON.parse(b64utf8(j.content));
  });
}
function fetchRaw(){
  var url="https://raw.githubusercontent.com/"+OWNER+"/"+REPO+"/"+DATA_REF+"/"+DATA_PATH+"?t="+Date.now();
  return fetch(url,{cache:"no-store"}).then(function(r){
    if(!r.ok) throw new Error("raw "+r.status);
    return r.json();
  });
}
function fetchLocal(){
  return fetch("data.json?t="+Date.now(),{cache:"no-store"}).then(function(r){
    if(!r.ok) throw new Error("local "+r.status);
    return r.json();
  });
}
function loadData(){
  return fetchContents().catch(function(){return fetchRaw()}).catch(function(){return fetchLocal()});
}

var firstPaint=true, lastShown=null, lastFetch=0, inflight=false;

function paintEquity(eq){
  var ei=$("eqInt"),ed=$("eqDec");
  if(!num(eq)){ei.textContent=D;ed.textContent="";return}
  if(firstPaint){
    countUp(ei,eq,function(v){var s=v.toFixed(2).split(".");ed.textContent=","+s[1];return"$"+Number(s[0]).toLocaleString("da-DK")});
  }else{
    var s=eq.toFixed(2).split(".");
    ed.textContent=","+s[1];
    ei.textContent="$"+Number(s[0]).toLocaleString("da-DK");
  }
}

function render(d){
  var h=d.hero||{};
  $("upd").textContent="Opdateret "+hm(d.generated_at);
  $("updSub").textContent=(d.update_every_min?"opdateres ca. hver "+d.update_every_min+". min":"opdateres periodisk")+" · ikke live";
  var tk=(d.ticker||[]).map(function(t){return'<span><b>'+esc(t.handle)+'</b><span class="'+cls(t.pnl)+'">'+sgn(t.pnl)+"</span></span>"}).join("");
  $("ticker").innerHTML=tk+tk;
  $("heroLine").textContent="kopierer "+(num(h.following)?h.following:D)+" top-FOMO-tradere · startet "+day(d.started_at,{year:"numeric"});
  paintEquity(h.equity);
  var b=$("delta");b.textContent=pct(h.pnl_pct,2);b.className="badge "+cls(h.pnl_pct);
  $("subLine").innerHTML="startkapital "+usd(h.start,0)+" · "+(num(h.copies)?h.copies.toLocaleString("da-DK"):D)+" kopier · <span class='mult'>"+(num(h.multiplier)?h.multiplier.toFixed(2).replace(".",",")+"x":D)+"</span>";
  var st=[["Samlet P&L",sgn(h.pnl),cls(h.pnl)],["Realiseret",sgn(h.realized),cls(h.realized)],["Urealiseret",sgn(h.unrealized),cls(h.unrealized)],
    ["Åbne positioner",num(h.open_n)?h.open_n:D,""],["Fulgt",num(h.following)?h.following:D,""],["Fyret",num(h.fired)?h.fired:D,""]];
  $("stats").innerHTML=st.map(function(s){return'<div class="stat"><div class="k">'+s[0]+'</div><div class="v '+s[2]+'">'+s[1]+"</div></div>"}).join("");
  chart(d.series||[],h.start||2000);
  winners(d.winners||[]);
  traders(d.traders||[]);
  log(d.log||[]);
  $("foot").textContent="Kun tal fra vores egen desk · data "+day(d.generated_at)+" kl. "+hm(d.generated_at)+" (dansk tid)";
  lastShown=d.generated_at;
  firstPaint=false;
}

function chart(s,base){
  var svg=$("chart"),W=svg.clientWidth||340,H=svg.clientHeight||200,P={l:4,r:4,t:12,b:18};
  if(s.length<2){$("chartNote").textContent="Ikke nok datapunkter endnu";svg.innerHTML="";return}
  var t0=s[0][0],t1=s[s.length-1][0],vs=s.map(function(p){return p[1]}).concat([base]);
  var lo=Math.min.apply(0,vs),hi=Math.max.apply(0,vs),pad=(hi-lo)*.12||10;lo-=pad;hi+=pad;
  function X(t){return P.l+(t-t0)/(t1-t0||1)*(W-P.l-P.r)}function Y(v){return P.t+(hi-v)/(hi-lo)*(H-P.t-P.b)}
  var GAP=6*3600,segs=[[]];s.forEach(function(p,i){if(i&&p[0]-s[i-1][0]>GAP)segs.push([]);segs[segs.length-1].push(p)});
  var line="",area="",gaps="";segs.forEach(function(g,j){
    var d=g.map(function(p,i){return(i?"L":"M")+X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1)}).join("");line+=d;
    area+=d+"L"+X(g[g.length-1][0]).toFixed(1)+","+(H-P.b)+"L"+X(g[0][0]).toFixed(1)+","+(H-P.b)+"Z";
    if(j){var a=segs[j-1][segs[j-1].length-1],b=g[0];gaps+='<line x1="'+X(a[0])+'" y1="'+Y(a[1])+'" x2="'+X(b[0])+'" y2="'+Y(b[1])+'" stroke="#ccc" stroke-dasharray="2 4" class="fadein"/>'}});
  var by=Y(base).toFixed(1),last=s[s.length-1],col=last[1]>=base?"#10B981":"#EF4444";
  var ticks="";for(var i=0;i<=3;i++){var tt=t0+(t1-t0)*i/3;ticks+='<text x="'+X(tt)+'" y="'+(H-3)+'" font-size="10" fill="#aaa" text-anchor="'+(i==0?"start":i==3?"end":"middle")+'">'+day(tt)+"</text>"}
  svg.setAttribute("viewBox","0 0 "+W+" "+H);
  svg.innerHTML='<defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+col+'" stop-opacity=".28"/><stop offset="1" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs>'+
   '<line x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+by+'" y2="'+by+'" stroke="#c4c4c4" stroke-dasharray="4 4"/>'+
   '<text x="'+(W-P.r)+'" y="'+(by-4)+'" font-size="10" fill="#aaa" text-anchor="end">$2.000</text>'+
   '<path class="fadein" d="'+area+'" fill="url(#gf)"/>'+
   gaps+'<path id="ln" d="'+line+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'+
   '<circle class="fadein" cx="'+X(last[0])+'" cy="'+Y(last[1])+'" r="3.5" fill="'+col+'"/>'+ticks+
   '<line id="cur" y1="'+P.t+'" y2="'+(H-P.b)+'" stroke="#ddd" opacity="0"/>';
  var ln=$("ln"),L=ln.getTotalLength();ln.style.setProperty("--len",L);ln.classList.add("draw");
  var tip=$("tip"),cur=$("cur");
  function mv(e){var r=svg.getBoundingClientRect(),cx=((e.touches?e.touches[0].clientX:e.clientX)-r.left)*W/r.width;
    var tt=t0+(cx-P.l)/(W-P.l-P.r)*(t1-t0),best=s[0];for(var i=0;i<s.length;i++)if(Math.abs(s[i][0]-tt)<Math.abs(best[0]-tt))best=s[i];
    var x=X(best[0]);cur.setAttribute("x1",x);cur.setAttribute("x2",x);cur.setAttribute("opacity",1);
    tip.style.left=(x/W*100)+"%";tip.style.opacity=1;tip.textContent=usd(best[1])+" · "+day(best[0])+" "+hm(best[0])}
  svg.onmousemove=mv;svg.ontouchmove=mv;
  svg.onmouseleave=function(){tip.style.opacity=0;cur.setAttribute("opacity",0)};
  $("chartNote").textContent="Punkter fra deskens egne målinger ("+s.length+") · prikket = desken var slukket, ingen målinger";
}

function winners(w){
  if(!w.length){$("winners").innerHTML='<div class="muted small">'+D+"</div>";return}
  $("winners").innerHTML=w.map(function(x){
    var tag=x.link?"a":"div",href=x.link?' href="'+esc(x.link)+'" target="_blank" rel="noopener"':"";
    return"<"+tag+' class="win"'+href+"><div style=\"min-width:0\"><div class=\"t\">"+esc(x.symbol||D)+(x.name&&x.name!==x.symbol?'<span class="nm">'+esc(x.name)+"</span>":"")+
     '</div><div class="s">kopieret fra '+esc((x.traders||[]).join(", ")||D)+" · "+price(x.entry)+" → "+price(x.mark)+"</div>"+
     (x.contract?'<div class="addr">'+esc(x.contract.slice(0,6)+"…"+x.contract.slice(-6))+"</div>":"")+
     '</div><div class="rt"><div class="p '+cls(x.pnl)+'">'+sgn(x.pnl)+'</div><div class="xs '+cls(x.pnl_pct)+'">'+pct(x.pnl_pct,0)+'</div><div class="xs muted">ind '+usd(x.cost)+"</div>"+
     (x.link?'<div class="link">FOMO ↗</div>':"")+"</div></"+tag+">"}).join("");
}

var TR=[],flt="FOLLOWING",shown=15,trBound=false;
function traders(t){TR=t;
  if(!trBound){
    trBound=true;
    $("seg").addEventListener("click",function(e){var f=e.target.getAttribute("data-f");if(!f)return;flt=f;shown=15;
      [].forEach.call(this.children,function(b){b.classList.toggle("on",b===e.target)});drawT()});
    $("more").addEventListener("click",function(){shown+=25;drawT()});
  }
  drawT()}
function drawT(){
  var rows=TR.filter(function(r){return flt==="ALL"||r.status===flt});
  $("trCount").textContent=rows.length+" stk.";
  $("traders").innerHTML=rows.slice(0,shown).map(function(r){
    var f=r.status==="FOLLOWING",tag=f?'<span class="tag f">fulgt</span>':'<span class="tag" title="'+esc(r.reason||"")+'">fyret'+(r.reason?" · "+esc(fr(r.reason)):"")+"</span>";
    return'<div class="tr"><span class="who">'+av(r.handle)+'<span style="min-width:0;display:flex;flex-direction:column"><span class="h">'+esc(r.handle)+"</span>"+tag+"</span></span>"+
     "<span>"+(num(r.copies)?r.copies:D)+"</span><span class='muted'>"+usd(r.in)+"</span><span class='"+cls(r.pnl)+"'>"+usd(r.now)+"</span></div>"}).join("");
  $("more").style.display=rows.length>shown?"block":"none";
}
function fr(s){return s.replace(/copied PnL (-?[\d.]+)% .*/,function(_,p){return"kopi-P&L "+p.replace(".",",")+" %"}).replace(/(\d+) losing copies in a row.*/,"$1 tab i træk")}

function log(l){
  if(!l.length){$("log").innerHTML='<div class="muted small">'+D+"</div>";return}
  $("log").innerHTML=l.map(function(e){
    var lbl=e.side==="FIRE"?"FYRET":e.side;
    return'<div class="ev"><span class="tm">'+hm(e.ts)+"<br>"+day(e.ts)+'</span><span class="sd '+esc(e.side)+'">'+lbl+'</span><div class="mid"><div><b>'+esc(e.trader||D)+"</b>"+(e.token?' · <span class="mono">'+esc(e.token)+"</span>":"")+
      '</div><span class="tag">'+esc(e.side==="FIRE"?fr(e.tag.replace(/^fyret · /,"")):e.tag)+"</span></div>"+
      '<span class="amt">'+(e.side==="FIRE"?"":usd(e.usd))+(num(e.pnl)&&e.pnl!==0?'<div class="xs '+cls(e.pnl)+'">'+sgn(e.pnl)+"</div>":"")+"</span></div>"}).join("");
}

function tick(force){
  var now=Date.now();
  if(inflight) return;
  if(!force && lastFetch && now-lastFetch<POLL_MS-500) return;
  inflight=true;
  loadData().then(function(d){
    lastFetch=Date.now();
    if(!d||typeof d!=="object") throw new Error("bad data");
    if(lastShown===null || d.generated_at!==lastShown) render(d);
  }).catch(function(){
    lastFetch=Date.now();
    if(lastShown===null) $("heroLine").textContent="Kunne ikke hente data.json";
  }).then(function(){inflight=false});
}

tick(true);
setInterval(function(){tick(false)},POLL_MS);
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")tick(false)});
window.addEventListener("pageshow",function(){tick(false)});
})();
