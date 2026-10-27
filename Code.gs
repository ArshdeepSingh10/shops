// ONE script, deployed SEPARATELY for each shop (own Google Sheet + own Apps Script + own Web App URL).
// In Script Properties set SHOP_TYPE to "boutique" or "cakes" for that copy.
const SH='Products';
// [key, sheet column header, form label, type]  types: text, long, number, list, map, yesno
const FIELDS={
 boutique:[
  ['name','Name','Name','text'],
  ['category','Category','Category','text'],
  ['price','Price','Price','number'],
  ['fabric','Fabric','Fabric','text'],
  ['colors','Colors','Colors (comma separated)','list'],
  ['sizes','Sizes','Sizes (comma separated)','list'],
  ['stock','Stock','Stock','number'],
  ['desc','Description','Description','long']],
 cakes:[
  ['name','Name','Name','text'],
  ['category','Category','Category','text'],
  ['weights','Weights & Prices','Weights & prices, e.g. 0.5 kg=600, 1 kg=1100','map'],
  ['flavors','Flavors','Flavors (comma separated)','list'],
  ['shapes','Shapes','Shapes (comma separated, optional)','list'],
  ['types','Types','Types, e.g. Regular, Eggless (optional)','list'],
  ['egglessExtra','Eggless Extra','Extra price for eggless','number'],
  ['designs','Designs','Designs (comma separated, optional)','list'],
  ['lead','Lead Hours','Hours of notice needed','number'],
  ['estimate','Estimate','Price is only an estimate','yesno'],
  ['stock','Available','Available (1 = yes, 0 = sold out)','number'],
  ['desc','Description','Description','long']]
};
function type(){const t=(PropertiesService.getScriptProperties().getProperty('SHOP_TYPE')||'').trim();return FIELDS[t]?t:'boutique';}
const fields=()=>FIELDS[type()];
const headers=()=>['ID'].concat(fields().map(f=>f[1]),['Image URLs','Image Public IDs','Status','Created At','Updated At']);
// 1-based column numbers
const colImg=()=>fields().length+2, colStatus=()=>fields().length+4, colUpd=()=>fields().length+6;

function sheet(){
  const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  const ss=id?SpreadsheetApp.openById(id.trim()):SpreadsheetApp.getActive();
  if(!ss) throw new Error('Script is not linked to a Google Sheet. Add SHEET_ID in Script Properties.');
  const s=ss.getSheetByName(SH)||ss.insertSheet(SH), H=headers();
  if(s.getRange(1,1).getValue()!=='ID'){
    if(s.getLastRow()>0) s.insertRowBefore(1);
    s.getRange(1,1,1,H.length).setValues([H]).setFontWeight('bold'); s.setFrozenRows(1);
  }
  return s;
}
const cache=()=>CacheService.getScriptCache();
const now=()=>new Date().toISOString();
const uid=()=>'P'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const out=o=>ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const u=x=>typeof x==='string'?x.replace(/^'(?=[=+\-@])/,''):x;
const split=s=>String(s==null?'':s).split(',').map(x=>x.trim()).filter(Boolean);
function t(v,max){v=String(v==null?'':v).replace(/[<>]/g,'').trim().slice(0,max||200);return /^[=+\-@]/.test(v)?"'"+v:v;}
function num(v){const n=Number(v);return isFinite(n)&&n>=0?n:0;}

function setup(){
  const s=sheet(); if(s.getLastRow()>1) return 'Sheet not empty, nothing changed.';
  const smp=type()==='cakes'
   ?[{name:'Chocolate Birthday Cake',category:'Birthday Cakes',weights:'0.5 kg=600, 1 kg=1100, 2 kg=2100',flavors:'Chocolate, Butterscotch, Vanilla',shapes:'Round, Heart',types:'Regular, Eggless',egglessExtra:0,designs:'Simple, Custom birthday design',lead:24,estimate:'No',stock:1,desc:'Soft sponge layered with chocolate cream.'}]
   :[{name:'Floral Cotton Kurti',category:'Kurtis',price:899,fabric:'Cotton',colors:'Pink, Blue, Yellow',sizes:'S, M, L, XL',stock:12,desc:'Soft, breathable cotton kurti.'}];
  smp.forEach(v=>s.appendRow(row({v,images:[],publicIds:[],status:'Active'},uid(),now())));
  return 'Setup done.';
}

function all(){
  const v=sheet().getDataRange().getValues(), h=v.shift()||[], r=[];
  v.forEach((x,i)=>{if(x[0]==='')return;const o={_row:i+2};h.forEach((k,j)=>o[k]=x[j]);r.push(o);}); return r;
}
function dec(f,v){
  v=u(v); const ty=f[3];
  if(ty==='number') return Number(v)||0;
  if(ty==='list') return split(v);
  if(ty==='map'){const o={};split(v).forEach(x=>{const i=x.lastIndexOf('=');if(i>0){const n=Number(x.slice(i+1));if(isFinite(n))o[x.slice(0,i).trim()]=n;}});return o;}
  if(ty==='yesno') return v==='Yes';
  return String(v==null?'':v);
}
function toObj(r,admin){
  const o={id:String(r.ID)}, raw={};
  fields().forEach(f=>{o[f[0]]=dec(f,r[f[1]]);const x=u(r[f[1]]);raw[f[0]]=x==null?'':String(x);});
  o.images=split(r['Image URLs']);
  if(type()==='cakes') o.cake=true;
  if(admin){o.raw=raw;o.publicIds=split(r['Image Public IDs']);o.status=r.Status;o.createdAt=r['Created At'];o.updatedAt=r['Updated At'];}
  return o;
}
function enc(f,v){
  const ty=f[3]; v=v==null?'':v;
  if(ty==='number') return num(v);
  if(ty==='yesno') return (v==='Yes'||v===true)?'Yes':'No';
  if(ty==='list') return split(v).map(x=>t(x,60)).filter(Boolean).join(', ');
  if(ty==='map') return split(v).map(x=>{const i=x.lastIndexOf('='),n=Number(x.slice(i+1));
    if(i<1||!isFinite(n)||n<0) throw new Error('Weights must look like: 1 kg=1100, 2 kg=2100');
    return t(x.slice(0,i),40)+'='+n;}).join(', ');
  return t(v,ty==='long'?2000:150);
}
function row(p,id,created){
  const v=p.v||{};
  if(!t(v.name,150)) throw new Error('Name is required');
  const F=fields(), cells=F.map(f=>enc(f,v[f[0]]));
  const wi=F.findIndex(f=>f[0]==='weights');
  if(wi>=0&&!cells[wi]) throw new Error('Add at least one weight and price');
  const urls=(p.images||[]).map(String).filter(x=>/^https:\/\/res\.cloudinary\.com\//.test(x));
  const ids=(p.publicIds||[]).map(x=>String(x).replace(/[^\w\-\/\.]/g,'')).filter(Boolean);
  if(urls.length!==ids.length) throw new Error('Image URLs and Public IDs do not match');
  return [id].concat(cells,[urls.join(','),ids.join(','),p.status==='Hidden'?'Hidden':'Active',created,now()]);
}
function findRow(id){const r=all().find(x=>String(x.ID)===String(id)); if(!r) throw new Error('Product not found'); return r;}
function asObj(a){const o={};headers().forEach((k,i)=>o[k]=a[i]);return o;}

function getPub(){
  const c=cache(),h=c.get('pub'); if(h) return JSON.parse(h);
  const d=all().filter(r=>String(r.Status).trim()==='Active').map(r=>toObj(r,false));
  try{c.put('pub',JSON.stringify(d),60);}catch(e){} return d;
}
function doGet(e){
  try{
    const a=(e.parameter&&e.parameter.action)||'products';
    if(a==='products') return out({ok:true,data:getPub()});
    throw new Error('Unknown action');
  }catch(err){return out({ok:false,error:String(err.message||err)});}
}

function login(pw){
  const c=cache();
  if(Number(c.get('fails')||0)>=5) return {ok:false,error:'Too many attempts. Try again in 10 minutes.'};
  if(pw && pw===PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD')){
    c.remove('fails'); const tk=Utilities.getUuid()+Utilities.getUuid(); c.put('t_'+tk,'1',21600); return {ok:true,token:tk};
  }
  c.put('fails',String(Number(c.get('fails')||0)+1),600); return {ok:false,error:'Wrong password'};
}
function doPost(e){
  try{
    const b=JSON.parse(e.postData.contents);
    if(b.action==='login') return out(login(b.password));
    if(!b.token||!cache().get('t_'+b.token)) return out({ok:false,auth:false,error:'Session expired, please log in again.'});
    if(b.action==='stats') return out({ok:true,data:{type:type(),fields:fields().map(f=>[f[0],f[2],f[3]]),products:all().map(r=>toObj(r,true))}});
    const A={addProduct,updateProduct,deleteProduct,deleteImage,toggleStatus};
    if(!A[b.action]) throw new Error('Unknown action');
    const lock=LockService.getScriptLock(); lock.waitLock(20000);
    try{const d=A[b.action](b); cache().remove('pub'); return out({ok:true,data:d});}finally{lock.releaseLock();}
  }catch(err){return out({ok:false,error:String(err.message||err)});}
}

function addProduct(b){const id=uid(), r=row(b.product,id,now()); sheet().appendRow(r); return {id,product:toObj(asObj(r),true)};}
function updateProduct(b){
  const old=findRow(b.product.id), r=row(b.product,String(old.ID),old['Created At']);
  sheet().getRange(old._row,1,1,r.length).setValues([r]); return {id:old.ID,product:toObj(asObj(r),true)};
}
function toggleStatus(b){
  const r=findRow(b.id), s=String(r.Status)==='Active'?'Hidden':'Active', sh=sheet();
  sh.getRange(r._row,colStatus()).setValue(s); sh.getRange(r._row,colUpd()).setValue(now()); return {status:s};
}

// ---- Cloudinary delete (needs CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in Script Properties)
function destroy(pid){
  const raw=PropertiesService.getScriptProperties().getProperties(), pr={}, ts=Math.floor(Date.now()/1000);
  Object.keys(raw).forEach(k=>pr[k]=String(raw[k]).trim());
  const cloud=pr.CLOUD_NAME, key=pr.CLOUDINARY_API_KEY, sec=pr.CLOUDINARY_API_SECRET;
  if(!cloud||!key||!sec) throw new Error('CLOUD_NAME, CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET is missing in Script Properties');
  const base='https://api.cloudinary.com/v1_1/'+cloud, hex=b=>b.map(x=>('0'+(x&255).toString(16)).slice(-2)).join('');
  let msg='';
  for(const a of [['SHA_1',''],['SHA_256','sha256']]){
    const sig=hex(Utilities.computeDigest(Utilities.DigestAlgorithm[a[0]],'public_id='+pid+'&timestamp='+ts+sec));
    const payload={public_id:pid,timestamp:ts,api_key:key,signature:sig}; if(a[1]) payload.signature_algorithm=a[1];
    const r=UrlFetchApp.fetch(base+'/image/destroy',{method:'post',muteHttpExceptions:true,payload:payload});
    let j={}; try{j=JSON.parse(r.getContentText());}catch(e){}
    if(r.getResponseCode()===200&&(j.result==='ok'||j.result==='not found')) return;
    msg=((j.error&&j.error.message)||r.getContentText()).slice(0,200);
    if(!/signature/i.test(msg)) throw new Error('Cloudinary delete failed for '+pid+': '+msg);
  }
  const r2=UrlFetchApp.fetch(base+'/resources/image/upload?public_ids[]='+encodeURIComponent(pid),{method:'delete',muteHttpExceptions:true,headers:{Authorization:'Basic '+Utilities.base64Encode(key+':'+sec)}});
  let j2={}; try{j2=JSON.parse(r2.getContentText());}catch(e){}
  const st=j2.deleted&&j2.deleted[pid];
  if(r2.getResponseCode()===200&&(st==='deleted'||st==='not_found')) return;
  throw new Error('Cloudinary delete failed for '+pid+'. Check CLOUD_NAME / API key / secret (run checkCloudinary).');
}
function deleteImage(b){
  const pid=String(b.publicId||'').replace(/[^\w\-\/\.]/g,''); if(!pid) throw new Error('publicId required');
  if(!b.id){destroy(pid);return {deleted:pid};}
  const r=findRow(b.id), urls=split(r['Image URLs']), ids=split(r['Image Public IDs']), i=ids.indexOf(pid);
  destroy(pid);
  if(i>=0){urls.splice(i,1);ids.splice(i,1);const sh=sheet();sh.getRange(r._row,colImg(),1,2).setValues([[urls.join(','),ids.join(',')]]);sh.getRange(r._row,colUpd()).setValue(now());}
  return {deleted:pid};
}
function deleteProduct(b){
  const r=findRow(b.id), urls=split(r['Image URLs']), ids=split(r['Image Public IDs']), sh=sheet();
  for(let i=ids.length-1;i>=0;i--){
    try{destroy(ids[i]);urls.splice(i,1);ids.splice(i,1);}
    catch(err){sh.getRange(r._row,colImg(),1,2).setValues([[urls.join(','),ids.join(',')]]); throw new Error('Product NOT deleted. '+err.message);}
  }
  sh.deleteRow(r._row); return {deleted:b.id};
}

// Run from the Apps Script editor to test Cloudinary credentials (View > Logs).
function checkCloudinary(){
  const p=PropertiesService.getScriptProperties(), g=k=>(p.getProperty(k)||'').trim();
  const n=g('CLOUD_NAME'), k=g('CLOUDINARY_API_KEY'), s=g('CLOUDINARY_API_SECRET');
  const r=UrlFetchApp.fetch('https://api.cloudinary.com/v1_1/'+n+'/ping',{muteHttpExceptions:true,headers:{Authorization:'Basic '+Utilities.base64Encode(k+':'+s)}});
  Logger.log('Cloudinary replied: '+r.getResponseCode()+' '+r.getContentText().slice(0,200));
  Logger.log(r.getResponseCode()===200?'RESULT: key and secret are CORRECT.':'RESULT: key / secret / cloud name do NOT match each other.');
}
