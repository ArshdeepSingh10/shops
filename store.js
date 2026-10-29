const $=s=>document.querySelector(s),K=Object.keys(window.SHOPS),pb=new URLSearchParams(location.search).get('b'),B=window.SHOPS[pb]?pb:(K.length===1?K[0]:null);
if(!B)location.replace('index.html');            // several shops and none chosen: show the chooser
if(K.length<2)$('.bk').hidden=true;               // only one shop: no "back to all shops" arrow
const S=SHOPS[B]||{},P=CATALOG[B]||[],L={color:'Color',size:'Size',flavor:'Flavor',weight:'Weight',shape:'Shape',type:'Type',design:'Design',msg:'Cake message',when:'Required date'};
document.body.dataset.b=B;document.title=S.name;$('#sn').textContent=S.name;$('#tg').textContent=S.tagline;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money=n=>'₹'+Number(n).toLocaleString('en-IN');
const fmt=v=>new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}),loc=ms=>{const d=new Date(ms);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16);};
let cart=[],CAT='',cur,O,qty=1,F={name:'',mode:(S.modes||['Delivery'])[0],addr:'',note:'',ref:false};
try{cart=JSON.parse(localStorage.getItem('cart_'+B)||'[]');}catch(e){}
function save(){try{localStorage.setItem('cart_'+B,JSON.stringify(cart));}catch(e){}$('#cc').textContent=cart.reduce((a,l)=>a+l.qty,0);}
const media=p=>p.images&&p.images[0]?`<img loading="lazy" src="${esc(p.images[0])}" alt="${esc(p.name)}">`:`<span class="em">${p.emoji||'🛍️'}</span>`;
const from=p=>p.cake?Math.min(...Object.values(p.weights)):p.price,unit=(p,o)=>p.cake?(p.weights[o.weight]||0)+(o.type==='Eggless'?(p.egglessExtra||0):0):p.price;
function pills(){$('#pl').innerHTML=['All',...new Set(P.map(p=>p.category))].map(c=>`<button class="pl${(c==='All'?'':c)===CAT?' on':''}" data-c="${c==='All'?'':esc(c)}">${esc(c)}</button>`).join('');}
function render(){const q=$('#q').value.toLowerCase().trim(),l=P.filter(p=>(!CAT||p.category===CAT)&&(!q||(p.name+' '+p.category+' '+(p.fabric||'')).toLowerCase().includes(q)));
  $('#g').innerHTML=l.length?l.map(p=>`<div class="card${p.stock<=0?' oos':''}" data-id="${p.id}" tabindex="0" role="button"><div class="tile" style="background:${p.tint||'#fde'}">${p.stock<=0?'<span class="bd">Out of stock</span>':''}${media(p)}</div><div class="tx"><small>${esc(p.category)}</small><b class="nm">${esc(p.name)}</b><span class="price">${p.cake?'From ':''}${money(from(p))}</span></div></div>`).join(''):'<div class="msg">No products found.</div>';}
$('#pl').onclick=e=>{const b=e.target.closest('button');if(b){CAT=b.dataset.c;pills();render();}};$('#q').oninput=render;
$('#g').onclick=e=>{const c=e.target.closest('.card');if(c)openP(c.dataset.id);};$('#g').onkeydown=e=>{if(e.key==='Enter'){const c=e.target.closest('.card');if(c)openP(c.dataset.id);}};
const chips=(k,a,v)=>`<div class="chs">${a.map(x=>`<button type="button" class="ch${x===v?' on':''}" data-k="${k}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`,og=(k,t,a)=>a&&a.length?`<div class="og"><label>${t}</label>${chips(k,a,O[k])}</div>`:'';
function price(){const p=cur,u=unit(p,O);$('#pc').innerHTML=`${money(u)}${p.estimate?' <small>estimate, confirmed on WhatsApp</small>':''}`;}
function openP(id){cur=P.find(x=>x.id===id);const p=cur;qty=1;O={};
  if(p.cake){O.flavor=p.flavors[0];O.weight=Object.keys(p.weights)[0];if(p.shapes)O.shape=p.shapes[0];if(p.types)O.type=p.types[0];if(p.designs)O.design=p.designs[0];}else{O.color=p.colors[0];O.size=p.sizes[0];}
  const d=$('#pd'),min=p.cake?loc(Date.now()+p.lead*36e5):'';
  d.innerHTML=`<button class="x" data-x aria-label="Close">×</button><div class="pm"><div class="tile big" style="background:${p.tint||'#fde'}">${media(p)}</div><div class="pi"><small>${esc(p.category)}</small><h2>${esc(p.name)}</h2><div class="price" id="pc"></div><p class="mu">${esc(p.desc||'')}${p.fabric?` Fabric: ${esc(p.fabric)}.`:''}</p>
  ${p.cake?og('flavor','Flavor',p.flavors)+og('weight','Weight / size',Object.keys(p.weights))+og('shape','Shape',p.shapes)+og('type','Eggless or regular',p.types)+og('design','Design',p.designs)+`<div class="og"><label>Message on cake (optional)</label><input id="cm" maxlength="40" placeholder="e.g. Happy Birthday Riya"></div><div class="og"><label>Required date &amp; time</label><input id="when" type="datetime-local" min="${min}"><small>Please order at least ${p.lead} hours ahead.</small></div>`:og('color','Color',p.colors)+og('size','Size',p.sizes)}
  <div class="og"><label>Quantity</label><div class="st"><button data-q="-1">−</button><b id="qv">1</b><button data-q="1">+</button></div></div><div class="er" id="me"></div>
  ${p.stock>0?'<button class="bt" id="add">Add to cart</button>':'<button class="bt" disabled>Out of stock</button>'}</div></div>`;price();d.showModal();}
$('#pd').onclick=e=>{const d=e.currentTarget,t=e.target;if(t===d||t.dataset.x!==undefined)return d.close();
  const c=t.closest('[data-k]');if(c){O[c.dataset.k]=c.dataset.v;c.parentNode.querySelectorAll('.ch').forEach(x=>x.classList.toggle('on',x===c));price();}
  const q=t.closest('[data-q]');if(q){const mx=cur.cake?10:cur.stock;qty=Math.min(mx,Math.max(1,qty+ +q.dataset.q));$('#qv').textContent=qty;}
  if(t.id==='add')addCart();};
function addCart(){const p=cur,o={...O},er=m=>$('#me').textContent=m;
  if(p.cake){const w=$('#when').value;if(!w)return er('Please choose the date and time you need the cake.');if(new Date(w).getTime()<Date.now()+p.lead*36e5)return er(`Please choose a time at least ${p.lead} hours from now.`);o.when=w;const m=$('#cm').value.trim();if(m)o.msg=m;}
  const key=JSON.stringify([p.id,o]),ex=cart.find(l=>l.key===key);if(ex)ex.qty=Math.min(p.cake?10:p.stock,ex.qty+qty);
  else cart.push({key,id:p.id,name:p.name,o,qty,unit:unit(p,o),est:!!p.estimate,img:p.images&&p.images[0]||'',emoji:p.emoji,tint:p.tint});
  save();$('#pd').close();toast('Added to cart');}
function toast(m){const t=$('#ts');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2200);}
function calc(){const sub=cart.reduce((a,l)=>a+l.unit*l.qty,0),dl=S.delivery,cfg=!!(dl&&dl.fee>0),fee=F.mode==='Delivery'&&cfg&&!(dl.freeAbove&&sub>=dl.freeAbove)?dl.fee:0;return{sub,fee,cfg,est:cart.some(l=>l.est),tot:sub+fee};}
const summ=l=>Object.entries(l.o).map(([k,v])=>k==='when'?fmt(v):k==='msg'?`“${v}”`:v).join(' · ');
function renderCart(){const c=calc(),d=$('#cd');
  d.innerHTML=`<button class="x" data-x aria-label="Close">×</button><div class="dp"><h2>Your cart</h2>${cart.length?cart.map((l,i)=>`<div class="ln"><div class="tile sm" style="background:${l.tint||'#fde'}">${l.img?`<img src="${esc(l.img)}" alt="">`:`<span class="em">${l.emoji||'🛍️'}</span>`}</div><div><b>${esc(l.name)}</b><small>${esc(summ(l))}</small><div class="st"><button data-a="-1" data-i="${i}">−</button><b>${l.qty}</b><button data-a="1" data-i="${i}">+</button><button class="rm" data-a="x" data-i="${i}">Remove</button></div></div><b>${money(l.unit*l.qty)}</b></div>`).join('')+`
  <div class="fm"><input id="fn" placeholder="Your name" value="${esc(F.name)}">${S.modes.length>1?`<div class="chs">${S.modes.map(m=>`<button type="button" class="ch${m===F.mode?' on':''}" data-m="${m}">${m}</button>`).join('')}</div>`:''}${F.mode==='Delivery'?`<input id="fa" placeholder="Delivery address" value="${esc(F.addr)}">`:''}<input id="fo" placeholder="Note (optional)" value="${esc(F.note)}">${B==='cakes'?`<label class="ck"><input type="checkbox" id="fr"${F.ref?' checked':''}> I will send a reference photo in the WhatsApp chat</label>`:''}</div>
  <div class="tt"><div><span>Subtotal</span><span>${money(c.sub)}</span></div>${c.cfg&&F.mode==='Delivery'?`<div><span>Delivery</span><span>${c.fee?money(c.fee):'Free'}</span></div>`:''}<div class="gt"><span>${c.est?'Estimated total':'Total'}</span><span>${money(c.tot)}</span></div>${c.est?'<small>Some prices are estimates and will be confirmed by the shop.</small>':''}</div><div class="er" id="er"></div>
  <button class="bt wa" id="send">Send Order to WhatsApp</button><small class="mu">WhatsApp opens with your order ready. Press Send there. Your order is confirmed only when the shop replies.</small>`:'<p class="msg">Your cart is empty.</p>'}</div>`;}
$('#cb').onclick=()=>{renderCart();$('#cd').showModal();};
$('#cd').onclick=e=>{const d=e.currentTarget,t=e.target;if(t===d||t.dataset.x!==undefined)return d.close();
  const a=t.closest('[data-a]');if(a){const l=cart[+a.dataset.i];if(a.dataset.a==='x')cart.splice(+a.dataset.i,1);else l.qty=Math.max(1,Math.min(l.est||l.o.weight?10:99,l.qty+ +a.dataset.a));save();renderCart();}
  const m=t.closest('[data-m]');if(m){F.mode=m.dataset.m;renderCart();}if(t.id==='send')order();};
$('#cd').oninput=e=>{const t=e.target;if(t.id==='fn')F.name=t.value;if(t.id==='fa')F.addr=t.value;if(t.id==='fo')F.note=t.value;if(t.id==='fr')F.ref=t.checked;};
function msg(){const c=calc(),L2=cart.map((l,i)=>{const r=[`${i+1}) ${l.name}`];Object.entries(l.o).forEach(([k,v])=>r.push(`   ${L[k]}: ${k==='when'?fmt(v):v}`));r.push(`   Quantity: ${l.qty}`,`   Price: ${money(l.unit*l.qty)}${l.est?' (estimate, to be confirmed)':''}`);if(/^https?:/.test(l.img))r.push(`   Photo: ${l.img}`);return r.join('\n');});
  return [S.intro,'',L2.join('\n\n'),'',`Subtotal: ${money(c.sub)}`,...(c.cfg&&F.mode==='Delivery'?[`Delivery: ${c.fee?money(c.fee):'Free'}`]:[]),`${c.est?'Estimated total':'Total'}: ${money(c.tot)}`,'',`Name: ${F.name.trim()}`,`Mode: ${F.mode}`,...(F.mode==='Delivery'?[`Address: ${F.addr.trim()}`]:[]),...(F.note.trim()?[`Note: ${F.note.trim()}`]:[]),...(F.ref?['I will send a reference photo in this chat.']:[]),'',S.outro].join('\n');}
function order(){const er=$('#er');er.textContent='';
  if(!/^\d{10,13}$/.test(S.whatsapp))return er.textContent="This shop's WhatsApp number isn't set up yet. Please contact the shop directly.";
  if(!F.name.trim())return er.textContent='Please enter your name.';if(F.mode==='Delivery'&&!F.addr.trim())return er.textContent='Please enter the delivery address.';
  const u='https://wa.me/'+S.whatsapp+'?text='+encodeURIComponent(msg());window.open(u,'_blank','noopener')||(location.href=u);}
pills();render();save();
