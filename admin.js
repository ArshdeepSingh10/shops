const $=s=>document.querySelector(s),K=Object.keys(window.SHOPS||{}),B=new URLSearchParams(location.search).get('b')||(K.length===1?K[0]:null),S=(window.SHOPS||{})[B];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!S){$('#pick').hidden=false;$('#pl').innerHTML=Object.entries(SHOPS).map(([k,s])=>`<a class="btn" style="background:var(--ink);color:#fff;text-decoration:none" href="admin.html?b=${k}">${s.emoji} ${esc(s.name)}</a>`).join('');throw 0;}
$('#login').hidden=false;$('#lt').textContent=S.name+' – Admin';document.title=S.name+' – Admin';
const API=S.api,TK='tok_'+B;
let cats=[],catF='',prods=[],FL=[],kind='',imgs=[],fresh=[],editId=null,saved=false,uploading=0;
const money=n=>'₹'+Number(n).toLocaleString('en-IN');
const norm=s=>String(s??'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ');
const match=(p,q)=>{const h=norm([p.name,p.category].join(' ')),t=norm(q).split(' ').filter(Boolean);return t.every(w=>h.includes(w));};
let tt;function toast(m,bad){const t=$('#toast');try{t.hidePopover();}catch(e){}(document.querySelector('dialog[open]')||document.body).append(t);
  t.innerHTML='<span></span><button aria-label="Close">×</button>';t.firstChild.textContent=m;t.className=bad?'bad':'';t.querySelector('button').onclick=()=>t.hidePopover();
  t.showPopover();clearTimeout(tt);tt=setTimeout(()=>{try{t.hidePopover();}catch(e){}},bad?10000:3500);}
let nb=0;
async function api(action,data={}){
  nb++;$('#tl').hidden=false;
  try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action,token:sessionStorage[TK],...data})});
    const j=await r.json();if(j.auth===false){sessionStorage.removeItem(TK);location.reload();}if(!j.ok)throw new Error(j.error);return j.data;}
  finally{if(--nb===0)$('#tl').hidden=true;}
}
async function go(btn,fn){btn.classList.add('ld');btn.disabled=true;try{await fn();}catch(e){toast(e.message,1);}btn.classList.remove('ld');btn.disabled=false;}
$('#lb').onclick=e=>go(e.target,async()=>{$('#le').textContent='';
  try{if(!/^https?:/.test(API||''))throw new Error('Web App URL for this shop is missing in config.js');
    const d=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'login',password:$('#pw').value})}).then(r=>r.json());
    if(!d.ok)throw new Error(d.error);sessionStorage[TK]=d.token;start();}catch(x){$('#le').textContent=x.message;}});
$('#pw').onkeydown=e=>{if(e.key==='Enter')$('#lb').click();};
$('#lo').onclick=()=>{sessionStorage.removeItem(TK);location.reload();};
function start(){$('#login').hidden=true;$('#app').hidden=false;$('#sn').textContent=S.name+' – Admin';$('#st').innerHTML='<div class="sk" style="height:76px"></div>'.repeat(4);$('#tb').innerHTML='<tbody>'+'<tr><td colspan="7"><div class="sk" style="height:48px"></div></td></tr>'.repeat(5)+'</tbody>';refresh().catch(e=>toast(e.message,1));}
function renderAll(){
  const cm={};prods.forEach(p=>{const k=p.category||'Uncategorized';cm[k]=(cm[k]||0)+1;});cats=Object.entries(cm).sort((x,y)=>y[1]-x[1]);
  const cake=kind==='cakes';
  $('#st').innerHTML=`<div><b>${prods.length}</b>Products</div><div><b>${cake?prods.filter(p=>p.status!=='Active').length:prods.filter(p=>p.stock>0&&p.stock<5).length}</b>${cake?'Hidden':'Low stock'}</div><div><b>${prods.filter(p=>p.stock<=0).length}</b>${cake?'Sold out':'Out of stock'}</div><button class="cc" id="cats"><b>${cats.length}</b>Categories · View all</button>`;
  $('#cats').onclick=openCats;if(catF&&!cm[catF])catF='';setCat(catF);}
async function refresh(){const d=await api('stats');kind=d.type;FL=d.fields;prods=d.products.slice().reverse();renderAll();}
const priceOf=p=>kind==='cakes'?(Object.values(p.weights||{}).length?'From '+money(Math.min(...Object.values(p.weights))):'-'):money(p.price);
function draw(){const l=prods.filter(p=>(!catF||(p.category||'Uncategorized')===catF)&&match(p,$('#aq').value)),cake=kind==='cakes';
  $('#tb').innerHTML=l.length?`<thead><tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>${cake?'Available':'Stock'}</th><th>Status</th><th></th></tr></thead><tbody>`+l.map(p=>
  `<tr><td class="im">${p.images[0]?`<img src="${esc(p.images[0].replace('/upload/','/upload/f_auto,q_auto,w_100/'))}" alt="">`:''}</td><td class="pn"><b>${esc(p.name)}</b></td><td data-l="Category">${esc(p.category)}</td><td data-l="Price">${esc(priceOf(p))}</td><td data-l="${cake?'Available':'Stock'}"><span class="pill ${p.stock<=0?'r':(!cake&&p.stock<5)?'y':'g'}">${cake?(p.stock>0?'Yes':'Sold out'):p.stock}</span></td>
  <td data-l="Status"><button class="pill ${p.status==='Active'?'g':''}" data-t="${esc(p.id)}" title="Click to change">${esc(p.status)}</button></td><td class="ac"><button class="btn alt" data-e="${esc(p.id)}">Edit</button> <button class="btn red" data-d="${esc(p.id)}">Delete</button></td></tr>`).join('')+'</tbody>':'<tbody><tr><td class="msg">No products yet. Click “Add product” to create one.</td></tr></tbody>';}
$('#aq').oninput=draw;
$('#tb').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.t||b.dataset.e||b.dataset.d,p=prods.find(x=>x.id===id);
  if(b.dataset.t)go(b,async()=>{const r=await api('toggleStatus',{id});p.status=r.status;renderAll();toast('Status changed');});
  if(b.dataset.e)openForm(p);
  if(b.dataset.d)ask('Delete this product?',`“${p.name}” and all its images will be removed permanently.`,'Delete product').then(ok=>ok&&go(b,async()=>{const tr=b.closest('tr');tr.classList.add('busy');try{await api('deleteProduct',{id});prods=prods.filter(x=>x.id!==id);renderAll();toast('Product deleted');}finally{tr.classList.remove('busy');}}));};
function ask(title,msg,okLabel){return new Promise(res=>{const d=$('#cf');let r=false;d.innerHTML=`<div class="dp cfm"><h3>${esc(title)}</h3><p>${esc(msg)}</p><div class="ft"><button class="btn alt" id="cn">Cancel</button><button class="btn red" id="ck">${esc(okLabel)}</button></div></div>`;d.onclose=()=>res(r);$('#ck').onclick=()=>{r=true;d.close();};$('#cn').onclick=()=>d.close();d.showModal();$('#cn').focus();});}
$('#addb').onclick=()=>openForm(null);
const DEF={stock:'1',lead:'24'};
function field(f,p){const [k,label,ty]=f,v=p?(p.raw[k]??''):(kind==='cakes'&&DEF[k]!==undefined?DEF[k]:(k==='stock'?'':'')),id='f_'+k;
  if(ty==='long')return `<label class="w">${esc(label)}<textarea id="${id}" rows="3">${esc(v)}</textarea></label>`;
  if(ty==='yesno')return `<label>${esc(label)}<select id="${id}"><option>No</option><option ${v==='Yes'?'selected':''}>Yes</option></select></label>`;
  if(ty==='number')return `<label>${esc(label)}<input id="${id}" type="number" min="0" value="${esc(v)}"></label>`;
  return `<label class="${ty==='text'?'':'w'}">${esc(label)}<input id="${id}" type="text" value="${esc(v)}"></label>`;}
function openForm(p){
  editId=p?p.id:null;saved=false;fresh=[];imgs=p?p.images.map((u,i)=>({url:u,pid:p.publicIds[i]})):[];
  $('#fm').innerHTML=`<div class="dp"><h3>${p?'Edit':'Add'} product</h3><div class="fg">${FL.map(f=>field(f,p)).join('')}
  <label>Status<select id="f_status"><option>Active</option><option ${p&&p.status==='Hidden'?'selected':''}>Hidden</option></select></label></div>
  <h4>Images</h4><div id="dz">Drag images here or click to choose (max 5 MB each)<input id="fi" type="file" accept="image/*" multiple hidden></div><div id="th"></div>
  <div class="ft"><button class="btn alt" id="cx">Cancel</button><button class="btn" id="sv">Save product</button></div></div>`;
  drawImgs();
  const dz=$('#dz');dz.onclick=()=>$('#fi').click();$('#fi').onchange=e=>addFiles(e.target.files);
  dz.ondragover=e=>{e.preventDefault();dz.classList.add('on');};dz.ondragleave=()=>dz.classList.remove('on');
  dz.ondrop=e=>{e.preventDefault();dz.classList.remove('on');addFiles(e.dataTransfer.files);};
  $('#cx').onclick=()=>$('#fm').close();$('#sv').onclick=e=>go(e.target,save);$('#fm').showModal();
}
$('#fm').addEventListener('close',()=>{if(!saved)fresh.forEach(pid=>api('deleteImage',{publicId:pid}).catch(()=>{}));fresh=[];});
function drawImgs(){$('#th').innerHTML=imgs.map((m,i)=>`<span class="th"><img src="${esc(m.url.replace('/upload/','/upload/f_auto,q_auto,w_160/'))}"><button data-i="${i}">×</button></span>`).join('');
  $('#th').querySelectorAll('button').forEach(b=>b.onclick=()=>go(b,async()=>{const m=imgs[b.dataset.i];
    await api('deleteImage',{id:editId||'',publicId:m.pid});fresh=fresh.filter(x=>x!==m.pid);imgs.splice(b.dataset.i,1);drawImgs();toast('Image deleted');await refresh().catch(()=>{});}));}
function up(file,bar){return new Promise((res,rej)=>{
  if(!file.type.startsWith('image/')||file.size>5*1024*1024)return rej(new Error(file.name+': images up to 5 MB only'));
  const x=new XMLHttpRequest(),f=new FormData();x.open('POST',`https://api.cloudinary.com/v1_1/${CLOUD.NAME}/image/upload`);
  x.upload.onprogress=e=>bar.style.width=(e.loaded/e.total*100)+'%';
  x.onload=()=>{let j={};try{j=JSON.parse(x.responseText);}catch(e){}x.status===200?res(j):rej(new Error((j.error&&j.error.message)||'Upload failed'));};
  x.onerror=()=>rej(new Error('Network error'));f.append('file',file);f.append('upload_preset',CLOUD.PRESET);x.send(f);});}
async function addFiles(fl){for(const file of fl){
  const s=document.createElement('span');s.className='th';s.innerHTML=`<img src="${URL.createObjectURL(file)}" style="opacity:.5"><i style="width:0"></i>`;$('#th').append(s);uploading++;
  try{const j=await up(file,s.querySelector('i'));imgs.push({url:j.secure_url,pid:j.public_id});fresh.push(j.public_id);}catch(e){toast(e.message,1);}
  uploading--;drawImgs();}}
async function save(){
  if(uploading)throw new Error('Wait for uploads to finish');
  const v={};FL.forEach(f=>v[f[0]]=$('#f_'+f[0]).value);
  if(!v.name.trim())throw new Error('Name is required');
  const p={id:editId,v,status:$('#f_status').value,images:imgs.map(m=>m.url),publicIds:imgs.map(m=>m.pid)};
  const d=await api(editId?'updateProduct':'addProduct',{product:p});saved=true;$('#fm').close();
  if(d.product){const i=prods.findIndex(x=>x.id===d.product.id);if(i>=0)prods[i]=d.product;else prods.unshift(d.product);renderAll();}else await refresh();
  toast(editId?'Product updated':'Product added');
}
if(sessionStorage[TK])start();
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));
function setCat(c){catF=c;const f=$('#af');f.hidden=!c;f.innerHTML=c?`${esc(c)} <button aria-label="Clear category filter">×</button>`:'';if(c)f.querySelector('button').onclick=()=>setCat('');draw();}
function openCats(){const d=$('#cd');
  d.innerHTML=`<div class="dp"><h3>Categories (${cats.length})</h3><input id="cq" class="s" type="search" placeholder="Search categories" style="width:100%"><div id="cl" class="cl"></div></div>`;
  const paint=()=>{const q=$('#cq').value.toLowerCase();$('#cl').innerHTML='<button class="cr" data-c=""><span>All products</span></button>'+(cats.filter(c=>c[0].toLowerCase().includes(q)).map(c=>`<button class="cr" data-c="${esc(c[0])}"><span>${esc(c[0])}</span><span class="pill">${c[1]}</span></button>`).join('')||'<p class="mu">No category found.</p>');};
  paint();$('#cq').oninput=paint;$('#cl').onclick=e=>{const b=e.target.closest('button');if(b){setCat(b.dataset.c);d.close();}};d.showModal();}
