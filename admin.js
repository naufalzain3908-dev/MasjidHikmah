const { createClient } = supabase;
const db = createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_PUBLISHABLE_KEY);
const $=s=>document.querySelector(s); const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
let currentUser=null;

document.addEventListener("DOMContentLoaded",async()=>{
  $("#loginForm").onsubmit=login; $("#logoutBtn").onclick=logout;
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  $("#addProgram").onclick=()=>openForm("program");
  $("#addCash").onclick=()=>openForm("cash");
  $("#addAnnouncement").onclick=()=>openForm("announcement");
  $("#settingsForm").onsubmit=saveSettings;
  document.querySelectorAll("[data-admin-close]").forEach(x=>x.onclick=closeModal);
  const {data}=await db.auth.getSession(); currentUser=data.session?.user||null; renderAuth();
});
function renderAuth(){if(currentUser){$("#loginPanel").classList.add("hidden");$("#dashboard").classList.remove("hidden");loadAll();}else{$("#loginPanel").classList.remove("hidden");$("#dashboard").classList.add("hidden");}}
async function login(e){e.preventDefault();const {data,error}=await db.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});if(error){$("#loginError").textContent=error.message;return}currentUser=data.user;renderAuth();}
async function logout(){await db.auth.signOut();currentUser=null;renderAuth();}
function switchTab(name){document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===name));document.querySelectorAll(".tab-panel").forEach(x=>x.classList.toggle("hidden",x.id!==`tab-${name}`));}
async function loadAll(){await Promise.all([loadPrograms(),loadCash(),loadAnnouncements(),loadSettings()]);}
async function loadPrograms(){const {data}=await db.from("programs").select("*").order("event_date",{ascending:false});$("#adminPrograms").innerHTML=(data||[]).map(p=>`<div class="admin-row"><div><strong>${esc(p.title)}</strong><span>${esc(p.category||"")} • ${p.event_date||"-"} • ${p.is_published?"Publik":"Draft"}</span></div><div><button onclick='editEntity("program",${JSON.stringify(p)})'>Edit</button><button class="danger" onclick="deleteEntity('program','${p.id}')">Hapus</button></div></div>`).join("")||"<p class='muted'>Belum ada data.</p>";}
async function loadCash(){const {data}=await db.from("cash_transactions").select("*").order("transaction_date",{ascending:false});$("#adminCash").innerHTML=(data||[]).map(p=>`<div class="admin-row"><div><strong>${p.type==="income"?"Pemasukan":"Pengeluaran"} • ${rupiah(p.amount)}</strong><span>${p.transaction_date} • ${esc(p.description)} • ${p.is_published?"Publik":"Draft"}</span></div><div><button onclick='editEntity("cash",${JSON.stringify(p)})'>Edit</button><button class="danger" onclick="deleteEntity('cash','${p.id}')">Hapus</button></div></div>`).join("")||"<p class='muted'>Belum ada data.</p>";}
async function loadAnnouncements(){const {data}=await db.from("announcements").select("*").order("published_at",{ascending:false});$("#adminAnnouncements").innerHTML=(data||[]).map(p=>`<div class="admin-row"><div><strong>${esc(p.title)}</strong><span>${p.published_at||"-"} • ${p.is_published?"Publik":"Draft"}</span></div><div><button onclick='editEntity("announcement",${JSON.stringify(p)})'>Edit</button><button class="danger" onclick="deleteEntity('announcement','${p.id}')">Hapus</button></div></div>`).join("")||"<p class='muted'>Belum ada data.</p>";}
async function loadSettings(){const {data}=await db.from("mosque_profile").select("*").limit(1).maybeSingle();if(data){$("#sName").value=data.name||"";$("#sAddress").value=data.address||"";$("#sContact").value=data.contact||"";$("#sEmail").value=data.email||"";$("#sDescription").value=data.description||"";}}
async function saveSettings(e){e.preventDefault();const {data}=await db.from("mosque_profile").select("id").limit(1).maybeSingle();const payload={name:$("#sName").value,address:$("#sAddress").value,contact:$("#sContact").value,email:$("#sEmail").value,description:$("#sDescription").value,updated_at:new Date().toISOString()};let q=data?db.from("mosque_profile").update(payload).eq("id",data.id):db.from("mosque_profile").insert(payload);const {error}=await q;if(error)alert(error.message);else alert("Profil tersimpan.");}
function openForm(type,item={}){
  $("#formTitle").textContent=(item.id?"Edit ":"Tambah ")+({program:"Program",cash:"Transaksi Kas",announcement:"Pengumuman"}[type]);
  const checked=item.is_published!==false?"checked":"";
  let html="";
  if(type==="program")html=`<input name="title" placeholder="Judul program" value="${esc(item.title)}" required><input name="category" placeholder="Kategori" value="${esc(item.category)}"><input name="event_date" type="date" value="${item.event_date||""}"><input name="event_time" placeholder="Waktu, contoh 19.30–21.00" value="${esc(item.event_time)}"><input name="location" placeholder="Lokasi" value="${esc(item.location)}"><input name="contact" placeholder="Kontak" value="${esc(item.contact)}"><textarea name="short_description" placeholder="Ringkasan">${esc(item.short_description)}</textarea><textarea name="description" placeholder="Detail program">${esc(item.description)}</textarea><label><input name="is_published" type="checkbox" ${checked}> Tampilkan di website</label>`;
  if(type==="cash")html=`<select name="type"><option value="income" ${item.type==="income"?"selected":""}>Pemasukan</option><option value="expense" ${item.type==="expense"?"selected":""}>Pengeluaran</option></select><input name="transaction_date" type="date" value="${item.transaction_date||new Date().toISOString().slice(0,10)}" required><input name="amount" type="number" min="0" placeholder="Jumlah" value="${item.amount||""}" required><input name="description" placeholder="Keterangan" value="${esc(item.description)}" required><label><input name="is_published" type="checkbox" ${checked}> Tampilkan di website</label>`;
  if(type==="announcement")html=`<input name="title" placeholder="Judul" value="${esc(item.title)}" required><input name="published_at" type="date" value="${item.published_at?.slice(0,10)||new Date().toISOString().slice(0,10)}"><textarea name="content" placeholder="Isi pengumuman" required>${esc(item.content)}</textarea><label><input name="is_published" type="checkbox" ${checked}> Tampilkan di website</label>`;
  $("#entityForm").innerHTML=html+`<button class="btn primary" type="submit">Simpan</button>`;
  $("#entityForm").onsubmit=e=>saveEntity(e,type,item.id);$("#adminModal").classList.remove("hidden");
}
window.editEntity=(type,item)=>openForm(type,item);
async function saveEntity(e,type,id){e.preventDefault();const fd=new FormData(e.target), p=Object.fromEntries(fd.entries());p.is_published=fd.has("is_published");if(p.amount)p.amount=Number(p.amount);let table={program:"programs",cash:"cash_transactions",announcement:"announcements"}[type];if(type==="program"&&p.event_date==="")p.event_date=null;if(type==="announcement"&&p.published_at)p.published_at=new Date(p.published_at).toISOString();let q=id?db.from(table).update(p).eq("id",id):db.from(table).insert(p);const {error}=await q;if(error)alert(error.message);else{closeModal();loadAll();}}
window.deleteEntity=async(type,id)=>{if(!confirm("Hapus data ini?"))return;const table={program:"programs",cash:"cash_transactions",announcement:"announcements"}[type];const {error}=await db.from(table).delete().eq("id",id);if(error)alert(error.message);else loadAll();}
function closeModal(){$("#adminModal").classList.add("hidden");}
