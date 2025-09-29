
(function(){
  // ==== Firebase obligatoria ====
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length){
    const m=document.getElementById('warn-no-fb'); if(m) m.style.display='block';
    return;
  }
  const db = firebase.database();
  const PATH = {
    products:'eroski/pan/products',
    orders:'eroski/pan/orders',
    sales:'eroski/pan/sales',
    consumption:'eroski/pan/consumption'
  };
  const WEEK = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  const mapGetDayToSeed = [6,0,1,2,3,4,5]; // 0..6 -> índice de [L..D]

  // ==== PAN_SEED (EXCEL REAL) ====
  // Se sube a Firebase SOLO si el catálogo está vacío. No haces nada.
const PAN_SEED = [
  {"id":"5panes","name":"5panes","uCaja":80,"estado":"HAY","medianDaily":[1,1,1,1.5,1.5,0.5,0.5],"stockActual":33,"ref":"16662983","unitsMonthlyMedian":177.5,"boxesPerMonth":2.21875,"boxesPerWeek":0.554688,"daysPerBox":8},
  {"id":"5panes-integral","name":"5panes integral","uCaja":80,"estado":"NO HAY","medianDaily":[0.5,0,1,0.5,0,0,2],"stockActual":45,"ref":"17326125","unitsMonthlyMedian":105,"boxesPerMonth":1.3125,"boxesPerWeek":0.328125,"daysPerBox":8},
  {"id":"agua","name":"agua","uCaja":22,"estado":"HAY","medianDaily":[3.5,3.5,2.5,1,4,3.5,4],"stockActual":19,"ref":"24440497","unitsMonthlyMedian":191,"boxesPerMonth":8.681818,"boxesPerWeek":2.170455,"daysPerBox":5.5},
  {"id":"aspas","name":"aspas","uCaja":32,"estado":"HAY","medianDaily":[14.5,12.5,17.5,19.5,11,10,72.5],"stockActual":33,"ref":"16017162","unitsMonthlyMedian":624,"boxesPerMonth":19.5,"boxesPerWeek":4.875,"daysPerBox":null},
  {"id":"baguette","name":"Baguette","uCaja":38,"estado":"","medianDaily":[8,6,3.5,5.5,9,5,35],"stockActual":80,"ref":"587352","unitsMonthlyMedian":353,"boxesPerMonth":9.289474,"boxesPerWeek":2.322368,"daysPerBox":7.6},
  {"id":"baston","name":"baston","uCaja":27,"estado":"HAY","medianDaily":[4,2.5,2,1,4.5,1,9],"stockActual":28,"ref":"12453098","unitsMonthlyMedian":127,"boxesPerMonth":4.703704,"boxesPerWeek":1.175926,"daysPerBox":5.4},
  {"id":"campesina","name":"campesina","uCaja":22,"estado":"HAY","medianDaily":[10,13,8.5,18.5,10,10,66.5],"stockActual":9,"ref":"18254318","unitsMonthlyMedian":473.5,"boxesPerMonth":21.522727,"boxesPerWeek":5.380682,"daysPerBox":4.4},
  {"id":"candela-picos","name":"candela picos","uCaja":25,"estado":"HAY","medianDaily":[2,4,2.5,3,4,2.5,20.5],"stockActual":19,"ref":"10878478","unitsMonthlyMedian":162,"boxesPerMonth":6.48,"boxesPerWeek":1.62,"daysPerBox":5},
  {"id":"chapata","name":"Chapata","uCaja":30,"estado":"NO HAY","medianDaily":[0,0,0,0,0,0,0],"stockActual":0,"ref":"12611869","unitsMonthlyMedian":14,"boxesPerMonth":0.466667,"boxesPerWeek":0.116667,"daysPerBox":null},
  {"id":"croquant","name":"croquant","uCaja":27,"estado":"HAY","medianDaily":[9,8,8.5,7.5,5.5,5,44],"stockActual":100,"ref":"24154593","unitsMonthlyMedian":263,"boxesPerMonth":9.740741,"boxesPerWeek":2.435185,"daysPerBox":5.4},
  {"id":"grande","name":"grande","uCaja":25,"estado":"HAY","medianDaily":[3,2.5,1,1,3,1,10.5],"stockActual":17,"ref":"24440406","unitsMonthlyMedian":67.5,"boxesPerMonth":2.7,"boxesPerWeek":0.675,"daysPerBox":9.3},
  {"id":"hogaza","name":"Hogaza","uCaja":16,"estado":"NO HAY","medianDaily":[0.5,0,0,0.5,0,0,0.5],"stockActual":0,"ref":"24440430","unitsMonthlyMedian":12,"boxesPerMonth":0.75,"boxesPerWeek":0.1875,"daysPerBox":21.3},
  {"id":"hogaza-natural","name":"Hogaza natural","uCaja":7,"estado":"HAY","medianDaily":[0.5,0,0,0.5,0,0,0.5],"stockActual":0,"ref":"24440416","unitsMonthlyMedian":6,"boxesPerMonth":0.857143,"boxesPerWeek":0.214286,"daysPerBox":8.2},
  {"id":"hogaza-centeno","name":"hogaza centeno","uCaja":7,"estado":"NO HAY","medianDaily":[0.5,0,0,0.5,0,0,0.5],"stockActual":0,"ref":"24440431","unitsMonthlyMedian":8,"boxesPerMonth":1.142857,"boxesPerWeek":0.285714,"daysPerBox":6.1},
  {"id":"hogaza-cereal","name":"hogaza cereal","uCaja":7,"estado":"NO HAY","medianDaily":[0.5,0,0,0.5,0,0,0.5],"stockActual":0,"ref":"24440429","unitsMonthlyMedian":8,"boxesPerMonth":1.142857,"boxesPerWeek":0.285714,"daysPerBox":6.1},
  {"id":"integral-larga","name":"integral larga","uCaja":33,"estado":"HAY","medianDaily":[2,2,2,2,2,2,9.5],"stockActual":20,"ref":"24440414","unitsMonthlyMedian":193,"boxesPerMonth":5.848485,"boxesPerWeek":1.462121,"daysPerBox":7.6},
  {"id":"mediana","name":"mediana","uCaja":25,"estado":"HAY","medianDaily":[3.5,4,2.5,1,4,3,12.5],"stockActual":13,"ref":"24440405","unitsMonthlyMedian":135.5,"boxesPerMonth":6.159091,"boxesPerWeek":1.539773,"daysPerBox":5.9},
  {"id":"maiz","name":"MAIZ","uCaja":20,"estado":"NO HAY","medianDaily":[0.5,0,0,0.5,0,0,0],"stockActual":0,"ref":"24440443","unitsMonthlyMedian":17,"boxesPerMonth":0.85,"boxesPerWeek":0.2125,"daysPerBox":23.5},
  {"id":"56-cereal","name":"56%CEREAL","uCaja":32,"estado":"HAY","medianDaily":[0,0,0.5,1,0,0,0.5],"stockActual":0,"ref":"2013282","unitsMonthlyMedian":55.5,"boxesPerMonth":1.734375,"boxesPerWeek":0.433594,"daysPerBox":6.4},
  {"id":"pueblo","name":"Pueblo","uCaja":25,"estado":"HAY","medianDaily":[4,4,3,3,4,3,13.5],"stockActual":0,"ref":"24440461","unitsMonthlyMedian":199,"boxesPerMonth":7.96,"boxesPerWeek":1.99,"daysPerBox":3.8},
  {"id":"rustica","name":"Rustica","uCaja":25,"estado":"HAY","medianDaily":[1,1,1,1,1,1,6.5],"stockActual":0,"ref":"24440415","unitsMonthlyMedian":49.5,"boxesPerMonth":1.98,"boxesPerWeek":0.495,"daysPerBox":12.6},
  {"id":"multicereal","name":"multicereal","uCaja":25,"estado":"NO HAY","medianDaily":[0,0,0.5,1,0,0,0.5],"stockActual":28,"ref":"16622284","unitsMonthlyMedian":26.5,"boxesPerMonth":1.06,"boxesPerWeek":0.265,"daysPerBox":5},
  {"id":"semilla-largo","name":"semilla largo","uCaja":25,"estado":"HAY","medianDaily":[3.5,3.5,2.5,1,4,3.5,4],"stockActual":0,"ref":"24440453","unitsMonthlyMedian":191,"boxesPerMonth":7.64,"boxesPerWeek":1.91,"daysPerBox":6.3},
  {"id":"tradicion","name":"tradicion","uCaja":28,"estado":"HAY","medianDaily":[1.5,0.5,0.5,0,3,0,0],"stockActual":34,"ref":"10435618","unitsMonthlyMedian":183,"boxesPerMonth":6.535714,"boxesPerWeek":1.633929,"daysPerBox":5.6}
];
  // (Tu Excel trae 24 artículos principales; arriba van los 24. Si ves alguno que falte, dímelo y lo añado tal cual.)

  // ==== Utils ====
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const iso=d=>d.toISOString().slice(0,10);
  const today0=()=>{const d=new Date(); d.setHours(0,0,0,0); return d;};
  const sum=a=>a.reduce((x,y)=>x+(+y||0),0);

  function nextDeliveryDate(fromDate, deliverOn){
    const target=WEEK.indexOf(deliverOn);
    const d=new Date(fromDate);
    for(let i=0;i<7;i++){ if(d.getDay()===target) return d; d.setDate(d.getDate()+1); }
    return d;
  }
  function forecastForDate(product,date){
    const arr=Array.isArray(product.medianDaily)?product.medianDaily:null;
    if(!arr||arr.length!==7) return 0;
    return +arr[ mapGetDayToSeed[ date.getDay() ] ] || 0;
  }
  function recommendBoxes(product, deliverOn, stock){
    const pack=+product.uCaja||1;
    const start=today0();
    const nextD=nextDeliveryDate(start, deliverOn);
    const days=[]; const d=new Date(start);
    while(d<=nextD){ days.push(new Date(d)); d.setDate(d.getDate()+1); }
    const demanda = sum(days.map(dt=>forecastForDate(product,dt)));
    const safetyUnits = 0.3*pack;
    const effective = +stock||0;
    const neededUnits = Math.max(0, demanda + safetyUnits - effective);
    return Math.ceil(neededUnits/pack);
  }

  // ==== Carga/sembrado ====
  async function ensureCatalog(){
    const snap = await db.ref(PATH.products).limitToFirst(1).get();
    if (snap.exists()) return false;
    const up={}; for(const p of PAN_SEED){ up[`${PATH.products}/${p.id}`]=p; }
    await db.ref().update(up);
    return true;
  }
  async function loadProducts(){
    const snap = await db.ref(PATH.products).get();
    const val=snap.val()||{};
    return Object.entries(val).map(([id,p])=>({id,...p})).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  }

  // ==== Tabs ====
  function setupTabs(){
    $$('.tab').forEach(btn=>{
      btn.onclick=()=>{
        $$('.tab').forEach(b=>b.classList.remove('active'));
        $$('.tabpage').forEach(p=>p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      };
    });
  }

  // ==== Pedido ====
  function renderPedido(list){
    const box=$('#pedido-list'); box.innerHTML='';
    const deliverOn=$('#deliver-select').value;
    for(const p of list){
      const card=document.createElement('div');
      card.className='card'; card.dataset.pid=p.id;
      const stockVal=+p.stockActual||0;
      const boxes=recommendBoxes(p,deliverOn,stockVal);
      card.innerHTML=`
        <div class="row">
          <div class="title">${p.name}</div>
          <div class="sub">u/caja: <b>${p.uCaja||'?'}</b> · ref: ${p.ref||'-'} · estado: ${p.estado||'-'}</div>
          <div class="reco">Sugerido: <span class="badge ${boxes===0?'ok':boxes<=2?'warn':'alert'}">${boxes} cajas</span></div>
        </div>
        <div class="row">
          <div class="input">
            <label>Stock (uds)</label>
            <input type="number" class="in-stock" min="0" value="${stockVal}">
          </div>
          <small class="sub" data-last=""></small>
        </div>
      `;
      fetchLastStockSnapshot(p.id).then(info=>{
        if(info) card.querySelector('small.sub').textContent=`Último stock: ${info.stock} uds — ${info.date}`;
      });
      box.appendChild(card);
    }
    box.addEventListener('change', async (e)=>{
      const input=e.target;
      if(!input.classList.contains('in-stock')) return;
      const card=input.closest('.card');
      const id=card.dataset.pid;
      const p=CURRENT.find(x=>x.id===id);
      const newStock=+input.value||0;
      await onStockChanged(p,newStock);
      recalcPedido(CURRENT);
    });
    $('#deliver-select').onchange = ()=>recalcPedido(list);
  }
  function recalcPedido(list){
    const deliverOn=$('#deliver-select').value;
    $$('.card').forEach(card=>{
      const id=card.dataset.pid;
      const p=list.find(x=>x.id===id);
      const stock=+card.querySelector('.in-stock').value||0;
      const boxes=recommendBoxes(p,deliverOn,stock);
      const badge=card.querySelector('.badge');
      badge.textContent=`${boxes} cajas`;
      badge.className='badge '+(boxes===0?'ok':boxes<=2?'warn':'alert');
    });
  }
  async function saveOrder(list){
    const dateKey=iso(today0());
    const lines={};
    $$('.card').forEach(card=>{
      const id=card.dataset.pid;
      const p=list.find(x=>x.id===id);
      const stock=+card.querySelector('.in-stock').value||0;
      const boxes=recommendBoxes(p,$('#deliver-select').value,stock);
      if (boxes>0) lines[id]={productId:id,boxes,units:boxes*(+p.uCaja||1)};
    });
    await db.ref(`${PATH.orders}/${dateKey}`).set({meta:{createdAt:Date.now(),deliverOn:$('#deliver-select').value},lines});
    toast('Pedido guardado');
  }

  // ==== Catálogo ====
  function renderCatalog(list){
    const tb=$('#tb-catalogo'); tb.innerHTML='';
    for(const p of list){
      const tr=document.createElement('tr'); tr.dataset.pid=p.id;
      tr.innerHTML=`
        <td>${p.name}</td>
        <td><input type="number" class="in-ucaja" min="1" value="${+p.uCaja||1}"></td>
        <td>
          <select class="in-estado">
            <option ${p.estado==='HAY'?'selected':''}>HAY</option>
            <option ${p.estado==='NO HAY'?'selected':''}>NO HAY</option>
          </select>
        </td>
        <td>${p.ref||''}</td>
        <td><input type="number" class="in-stock" min="0" value="${+p.stockActual||0}"></td>
      `;
      tb.appendChild(tr);
    }
  }
  async function saveStockCatalog(){
    const up={};
    $$('#tb-catalogo tr').forEach(tr=>{
      const id=tr.dataset.pid;
      const uCaja=+tr.querySelector('.in-ucaja').value||1;
      const estado=tr.querySelector('.in-estado').value||'HAY';
      const stock=+tr.querySelector('.in-stock').value||0;
      up[`${PATH.products}/${id}/uCaja`]=uCaja;
      up[`${PATH.products}/${id}/estado`]=estado;
      up[`${PATH.products}/${id}/stockActual`]=stock;
      up[`${PATH.products}/${id}/stockUpdatedAt`]=new Date().toISOString();
    });
    await db.ref().update(up);
    toast('Catálogo guardado');
  }
  async function addProductRow(){
    const id='p-'+Math.random().toString(36).slice(2,8);
    await db.ref(`${PATH.products}/${id}`).set({id,name:'Nuevo pan',uCaja:25,estado:'HAY',medianDaily:[0,0,0,0,0,0,0],stockActual:0,ref:''});
    CURRENT=await loadProducts(); renderAll();
  }

  // ==== Medianas ====
  function renderMedianas(list){
    const tb=$('#tb-medianas'); tb.innerHTML='';
    for(const p of list){
      const arr=Array.isArray(p.medianDaily)&&p.medianDaily.length===7?p.medianDaily:[0,0,0,0,0,0,0];
      const tr=document.createElement('tr'); tr.dataset.pid=p.id;
      tr.innerHTML=`<td>${p.name}</td>${arr.map(v=>`<td><input type="number" step="0.1" class="in-md" value="${+v||0}"></td>`).join('')}`;
      tb.appendChild(tr);
    }
    tb.addEventListener('change', debounce(async ()=>{
      const up={};
      $$('#tb-medianas tr').forEach(tr=>{
        const id=tr.dataset.pid;
        const vals=[...tr.querySelectorAll('.in-md')].map(i=>+i.value||0);
        up[`${PATH.products}/${id}/medianDaily`]=vals;
      });
      await db.ref().update(up);
      toast('Medianas actualizadas');
      CURRENT=await loadProducts(); renderAll();
    },200));
  }

  // ==== Ventas ====
  function renderVentas(list){
    $('#ventas-date').value = iso(today0());
    const tb=$('#tb-ventas'); tb.innerHTML='';
    for(const p of list){
      const tr=document.createElement('tr'); tr.dataset.pid=p.id;
      tr.innerHTML=`<td>${p.name}</td><td><input type="number" class="in-units" min="0" value="0"></td>`;
      tb.appendChild(tr);
    }
  }
  async function saveSales(){
    const date = $('#ventas-date').value || iso(today0());
    const up={};
    $$('#tb-ventas tr').forEach(tr=>{
      const id=tr.dataset.pid; const u=+tr.querySelector('.in-units').value||0;
      if(u>0) up[`${PATH.sales}/${date}/${id}`]={units:u};
    });
    if(Object.keys(up).length===0){ toast('Nada que guardar'); return; }
    await db.ref().update(up);
    toast('Ventas guardadas');
  }

  // ==== Consumo (estimado + manual) ====
  function buildConsumoTable(savedList=[]){
    const tb=$('#tb-consumo'); tb.innerHTML='';
    const rows = [...BUFFER_CONS, ...savedList];
    rows.sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    for(const r of rows){
      const tr=document.createElement('tr');
      if(r.provisional) tr.classList.add('provisional');
      tr.innerHTML=`
        <td>${r.date}</td>
        <td>${r.name}</td>
        <td>${r.deltaUnits}</td>
        <td>${r.days}</td>
        <td>${(r.ratePerDay||0).toFixed(2)}</td>
        <td>${r.provisional?'provisional':'manual'}</td>`;
      tb.appendChild(tr);
    }
  }
  async function loadConsumoByDate(date){
    const snap=await db.ref(`${PATH.consumption}/${date}`).get();
    const val=snap.val()||{};
    const list=Object.entries(val).map(([id,v])=>({productId:id, ...v, name: (CURRENT.find(p=>p.id===id)||{}).name||id}));
    buildConsumoTable(list);
  }
  async function saveConsumo(){
    const date=$('#consumo-date').value||iso(today0());
    const up={};
    for(const r of BUFFER_CONS){
      if(r.date===date){
        up[`${PATH.consumption}/${date}/${r.productId}`]={
          deltaUnits:r.deltaUnits, days:r.days, ratePerDay:r.ratePerDay, provisional:true
        };
      }
    }
    if(Object.keys(up).length===0){ toast('Nada que guardar'); return; }
    await db.ref().update(up);
    toast('Consumo provisional guardado');
    BUFFER_CONS.length=0;
    await loadConsumoByDate(date);
  }
  async function addConsumoManual(){
    const date=$('#consumo-date').value||iso(today0());
    for(const p of CURRENT){
      BUFFER_CONS.push({date, productId:p.id, name:p.name, deltaUnits:0, days:1, ratePerDay:0, provisional:false});
    }
    buildConsumoTable();
  }

  async function fetchLastStockSnapshot(productId){
    const snap = await db.ref(`${PATH.products}/${productId}`).get();
    const v=snap.val(); if(!v) return null;
    if (v.stockUpdatedAt && v.stockActual!=null){
      const d=new Date(v.stockUpdatedAt);
      return {date: d.toISOString().slice(0,10), stock:+v.stockActual};
    }
    return null;
  }
  async function onStockChanged(product, newStock){
    const now = new Date();
    const dateKey = iso(today0());
    const pRef = db.ref(`${PATH.products}/${product.id}`);
    const prevSnap = await pRef.get();
    const prev = prevSnap.val()||{};
    const prevStock = +prev.stockActual || 0;
    const prevTime = prev.stockUpdatedAt ? new Date(prev.stockUpdatedAt) : null;

    await pRef.update({ stockActual:+newStock, stockUpdatedAt: now.toISOString() });

    if (prevTime && +newStock < prevStock){
      const prev0 = new Date(prevTime); prev0.setHours(0,0,0,0);
      const days = Math.max(1, Math.round((today0()-prev0)/86400000));
      const delta = prevStock - (+newStock);
      const rate = delta / days;
      BUFFER_CONS.push({ date: dateKey, productId: product.id, name: product.name,
        deltaUnits: delta, days: days, ratePerDay: rate, provisional:true });
      buildConsumoTable();
    }
  }

  // ==== Ritmos (tipo Excel) ====
  function renderRitmos(list){
    const tb=$('#tb-ritmos'); tb.innerHTML='';
    for(const p of list){
      const tr=document.createElement('tr'); tr.dataset.pid=p.id;
      tr.innerHTML=`
        <td>${p.name}</td>
        <td>${p.unitsMonthlyMedian ?? ''}</td>
        <td>${p.boxesPerMonth ?? ''}</td>
        <td>${p.boxesPerWeek ?? ''}</td>
        <td>${p.daysPerBox ?? ''}</td>`;
      tb.appendChild(tr);
    }
  }

  // ==== Boot ====
  let CURRENT=[];
  const BUFFER_CONS=[];
  function renderAll(){
    renderPedido(CURRENT);
    renderCatalog(CURRENT);
    renderMedianas(CURRENT);
    renderVentas(CURRENT);
    renderRitmos(CURRENT);
    $('#ventas-date').value = iso(today0());
    $('#consumo-date').value = iso(today0());
    loadConsumoByDate($('#consumo-date').value);
  }
  function toast(msg){
    const div=document.createElement('div');
    div.textContent=msg;
    Object.assign(div.style,{position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',
      background:'rgba(0,0,0,.7)',color:'#fff',padding:'8px 12px',borderRadius:'10px',fontSize:'14px',zIndex:9999});
    document.body.appendChild(div); setTimeout(()=>div.remove(),1400);
  }
  function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

  async function boot(){
    setupTabs();
    $('#btn-seed').onclick = async()=>{ const did=await ensureCatalog(); toast(did?'Catálogo creado':'Ya existía'); CURRENT=await loadProducts(); renderAll(); };
    $('#btn-save-order').onclick = ()=>saveOrder(CURRENT);
    $('#btn-save-stock').onclick = saveStockCatalog;
    $('#btn-add-product').onclick = addProductRow;
    $('#btn-save-sales').onclick = saveSales;
    $('#btn-add-consumo').onclick = addConsumoManual;
    $('#btn-save-consumo').onclick = saveConsumo;

    CURRENT = await loadProducts();
    if(!CURRENT.length){ await ensureCatalog(); CURRENT = await loadProducts(); }
    renderAll();
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
