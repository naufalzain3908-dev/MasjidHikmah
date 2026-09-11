const { createClient } = supabase;
const db = createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_PUBLISHABLE_KEY);
const $ = (s) => document.querySelector(s);
const rupiah = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

let prayerTimes = {};
let nextPrayerDate = null;

document.addEventListener("DOMContentLoaded", async () => {
  $("#year").textContent = new Date().getFullYear();
  await Promise.all([loadMosque(), loadPrayers(), loadPrograms(), loadCash(), loadAnnouncements()]);
  setInterval(updateCountdown, 1000);
  $("#refreshPrograms").onclick = loadPrograms;
});

async function loadMosque(){
  const {data,error}=await db.from("mosque_profile").select("*").limit(1).maybeSingle();
  const p=data||{};
  const name=p.name||APP_CONFIG.mosque.name;
  $("#mosqueName").textContent=name; $("#footerName").textContent=name; $("#aboutTitle").textContent=name;
  $("#heroText").textContent=p.description||"Satu tempat untuk melihat jadwal shalat, kegiatan, transparansi kas, dan informasi masjid.";
  $("#aboutAddress").textContent=p.address||"-"; $("#aboutContact").textContent=p.contact||"-"; $("#aboutEmail").textContent=p.email||"-";
}

async function loadPrayers(){
  const c=APP_CONFIG.mosque;
  const d=new Date(), date=d.toLocaleDateString("en-CA",{timeZone:c.timezone});
  try{
    const url=`https://api.aladhan.com/v1/timings/${date}?latitude=${c.latitude}&longitude=${c.longitude}&method=${c.calculationMethod}`;
    const res=await fetch(url); const json=await res.json(); prayerTimes=json.data.timings;
    const names={Fajr:"Subuh",Sunrise:"Terbit",Dhuhr:"Dzuhur",Asr:"Ashar",Maghrib:"Maghrib",Isha:"Isya"};
    $("#locationLabel").textContent=`${c.city}, ${c.country}`;
    $("#todayDate").textContent=json.data.date.gregorian.weekday.en+", "+json.data.date.readable+" • "+json.data.date.hijri.date+" H";
    $("#prayerGrid").innerHTML=Object.entries(names).map(([key,label])=>`<div class="prayer-card ${["Fajr","Dhuhr","Asr","Maghrib","Isha"].includes(key)?"":"sunrise"}"><span>${label}</span><strong>${(prayerTimes[key]||"--").split(" ")[0]}</strong></div>`).join("");
    determineNextPrayer();
  }catch(e){ $("#prayerGrid").innerHTML='<div class="empty">Jadwal shalat belum dapat dimuat. Periksa koneksi internet dan konfigurasi koordinat.</div>'; }
}
function determineNextPrayer(){
  const order=[["Fajr","Subuh"],["Dhuhr","Dzuhur"],["Asr","Ashar"],["Maghrib","Maghrib"],["Isha","Isya"]];
  const now=new Date(new Date().toLocaleString("en-US",{timeZone:APP_CONFIG.mosque.timezone}));
  for(const [key,label] of order){ const [h,m]=String(prayerTimes[key]).split(":").map(Number); const t=new Date(now); t.setHours(h,m,0,0); if(t>now){ nextPrayerDate=t; $("#nextPrayerName").textContent=label; $("#nextPrayerTime").textContent=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0"); return; }}
  $("#nextPrayerName").textContent="Subuh"; $("#nextPrayerTime").textContent=(prayerTimes.Fajr||"--").split(" ")[0];
}
function updateCountdown(){
  if(!nextPrayerDate)return;
  let diff=nextPrayerDate-new Date(); if(diff<0){loadPrayers();return;}
  const h=Math.floor(diff/36e5),m=Math.floor(diff%36e5/6e4),s=Math.floor(diff%6e4/1e3);
  $("#countdown").textContent=[h,m,s].map(x=>String(x).padStart(2,"0")).join(":");
}

async function loadPrograms(){
  const {data,error}=await db.from("programs").select("*").eq("is_published",true).order("event_date",{ascending:true}).order("created_at",{ascending:false});
  if(error){$("#programGrid").innerHTML='<div class="empty">Program belum tersedia.</div>';return}
  $("#programGrid").innerHTML=(data||[]).map(p=>`<article class="program-card" data-program='${JSON.stringify(p).replace(/'/g,"&#39;")}'><div class="program-date">${formatDate(p.event_date)}</div><span class="tag">${esc(p.category||"Kegiatan")}</span><h3>${esc(p.title)}</h3><p>${esc((p.short_description||p.description||"").slice(0,130))}</p><button class="text-btn">Lihat detail →</button></article>`).join("")||'<div class="empty">Belum ada program yang dipublikasikan.</div>';
  document.querySelectorAll(".program-card").forEach(card=>card.onclick=()=>openProgram(JSON.parse(card.dataset.program.replace(/&#39;/g,"'"))));
}
function openProgram(p){
  $("#modalCategory").textContent=p.category||"PROGRAM"; $("#modalTitle").textContent=p.title;
  $("#modalMeta").textContent=[formatDate(p.event_date),p.event_time,p.location].filter(Boolean).join(" • ");
  $("#modalDescription").textContent=p.description||p.short_description||"";
  $("#modalExtra").innerHTML=p.contact?`<div class="info-card"><div><span>Kontak</span><strong>${esc(p.contact)}</strong></div></div>`:"";
  $("#modal").classList.remove("hidden");
}
async function loadCash(){
  const {data,error}=await db.from("cash_transactions").select("*").eq("is_published",true).order("transaction_date",{ascending:false}).limit(100);
  const rows=data||[]; const income=rows.filter(x=>x.type==="income").reduce((a,x)=>a+Number(x.amount),0); const expense=rows.filter(x=>x.type==="expense").reduce((a,x)=>a+Number(x.amount),0);
  $("#incomeTotal").textContent=rupiah(income); $("#expenseTotal").textContent=rupiah(expense); $("#balanceTotal").textContent=rupiah(income-expense);
  $("#cashTable").innerHTML=rows.map(x=>`<tr><td>${formatDate(x.transaction_date)}</td><td><span class="cash-type ${x.type}">${x.type==="income"?"Pemasukan":"Pengeluaran"}</span></td><td>${esc(x.description)}</td><td class="${x.type}">${x.type==="income"?"+":"-"} ${rupiah(x.amount)}</td></tr>`).join("")||'<tr><td colspan="4">Belum ada transaksi yang dipublikasikan.</td></tr>';
  $("#cashPeriod").textContent=rows.length?`Menampilkan ${rows.length} transaksi terbaru`:"";
}
async function loadAnnouncements(){
  const {data}=await db.from("announcements").select("*").eq("is_published",true).order("published_at",{ascending:false}).limit(6);
  $("#announcementList").innerHTML=(data||[]).map(x=>`<article class="announcement"><span>${formatDate(x.published_at)}</span><h3>${esc(x.title)}</h3><p>${esc(x.content)}</p></article>`).join("")||'<div class="empty">Belum ada pengumuman.</div>';
}
function formatDate(v){if(!v)return"-";return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric"}).format(new Date(v));}
document.addEventListener("click",e=>{if(e.target.matches("[data-close]"))$("#modal").classList.add("hidden")});
