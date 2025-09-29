(function(){
  // ==== Firebase (ya la inicializas en el HTML) ====
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length){
    const m=document.getElementById('warn-no-fb'); if(m) m.style.display='block'; return;
  }
  const db = firebase.database();
  const PATH = {
    products:'eroski/pan/products',
    plan8:'eroski/pan/plan8',   // <- NUEVO: claves MS1/JS1/SS1... MS8/JS8/SS8
    orders:'eroski/pan/orders',
    sales:'eroski/pan/sales',
    consumption:'eroski/pan/consumption'
  };

  // ==== NO TOCAR: SEED ORIGINAL (copiada literal de tu archivo actual) ====
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
  {"id":"grande","name":"grande","uCaja":25,"estado":"HAY","medianDaily":[3,2.5,1,1,3,1,10.5],"stockActual":17,"ref":"1106434","unitsMonthlyMedian":67.5,"boxesPerMonth":2.7,"boxesPerWeek":0.675,"daysPerBox":9.3},
  {"id":"hogaza","name":"Hogaza","uCaja":16,"estado":"NO HAY","medianDaily":[0.5,0,0,0.5,0,0,0.5],"stockActual":0,"ref":"13458666","unitsMonthlyMedian":12,"boxesPerMonth":0.75,"boxesPerWeek":0.1875,"daysPerBox":21.3},
  {"id":"hogaza-natural","name":"Hogaza natural","uCaja":7,"estado":"HAY","medianDaily":[0.5,0,0,0.5,0,0,0.5],"stockActual":0,"ref":"","unitsMonthlyMedian":6,"boxesPerMonth":0.857143,"boxesPerWeek":0.214286,"daysPerBox":8.2},
  {"id":"hogaza-centeno","name":"hogaza centeno","uCaja":7,"estado":"NO HAY","medianDaily":[0.5,0,0,0.5,0,0,0.5],"stockActual":0,"ref":"15605363","unitsMonthlyMedian":8,"boxesPerMonth":1.142857,"boxesPerWeek":0.285714,"daysPerBox":6.1},
  {"id":"hogaza-cereal","name":"hogaza cereal","uCaja":7,"estado":"NO HAY","medianDaily":[0.5,0,0,0.5,0,0,0.5],"stockActual":0,"ref":"17088923","unitsMonthlyMedian":8,"boxesPerMonth":1.142857,"boxesPerWeek":0.285714,"daysPerBox":6.1},
  {"id":"integral-larga","name":"integral larga","uCaja":36,"estado":"HAY","medianDaily":[2,2,2,2,2,2,9.5],"stockActual":20,"ref":"23467301","unitsMonthlyMedian":193,"boxesPerMonth":5.848485,"boxesPerWeek":1.462121,"daysPerBox":7.6},
  {"id":"mediana","name":"mediana","uCaja":30,"estado":"HAY","medianDaily":[3.5,4,2.5,1,4,3,12.5],"stockActual":13,"ref":"991989","unitsMonthlyMedian":135.5,"boxesPerMonth":6.159091,"boxesPerWeek":1.539773,"daysPerBox":5.9},
  {"id":"maiz","name":"MAIZ","uCaja":20,"estado":"NO HAY","medianDaily":[0.5,0,0,0.5,0,0,0],"stockActual":0,"ref":"25635566","unitsMonthlyMedian":17,"boxesPerMonth":0.85,"boxesPerWeek":0.2125,"daysPerBox":23.5},
  {"id":"56-cereal","name":"56%CEREAL","uCaja":32,"estado":"HAY","medianDaily":[0,0,0.5,1,0,0,0.5],"stockActual":0,"ref":"2013282","unitsMonthlyMedian":55.5,"boxesPerMonth":1.734375,"boxesPerWeek":0.433594,"daysPerBox":6.4},
  {"id":"pueblo","name":"Pueblo","uCaja":11,"estado":"HAY","medianDaily":[4,4,3,3,4,3,13.5],"stockActual":0,"ref":"14707244","unitsMonthlyMedian":199,"boxesPerMonth":7.96,"boxesPerWeek":1.99,"daysPerBox":3.8},
  {"id":"rustica","name":"Rustica","uCaja":21,"estado":"HAY","medianDaily":[1,1,1,1,1,1,6.5],"stockActual":0,"ref":"","unitsMonthlyMedian":49.5,"boxesPerMonth":1.98,"boxesPerWeek":0.495,"daysPerBox":12.6},
  {"id":"multicereal","name":"multicereal","uCaja":25,"estado":"NO HAY","medianDaily":[0,0,0.5,1,0,0,0.5],"stockActual":28,"ref":"16622284","unitsMonthlyMedian":26.5,"boxesPerMonth":1.06,"boxesPerWeek":0.265,"daysPerBox":5},
  {"id":"semilla-largo","name":"semilla largo","uCaja":25,"estado":"HAY","medianDaily":[3.5,3.5,2.5,1,4,3.5,4],"stockActual":0,"ref":"","unitsMonthlyMedian":191,"boxesPerMonth":7.64,"boxesPerWeek":1.91,"daysPerBox":6.3},
  {"id":"tradicion","name":"tradicion","uCaja":28,"estado":"HAY","medianDaily":[1.5,0.5,0.5,0,3,0,0],"stockActual":34,"ref":"10435618","unitsMonthlyMedian":183,"boxesPerMonth":6.535714,"boxesPerWeek":1.633929,"daysPerBox":5.6}
  ];

  // ==== Utils ====
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const iso=d=>d.toISOString().slice(0,10);
  const today0=()=>{const d=new Date(); d.setHours(0,0,0,0); return d;};
  const sum=a=>a.reduce((x,y)=>x+(+y||0),0);

  const DAY_LETTER = { martes:'M', jueves:'J', sabado:'S' };
  function codeFor(day, week){ return `${DAY_LETTER[day]}S${week}`; } // ej: MS1, JS3, SS8
  function nextDateFor(dayName, from=today0()){
    const target = {domingo:0,lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6}[dayName];
    const d=new Date(from); for(let i=0;i<7;i++){ if(d.getDay()===target) return d; d.setDate(d.getDate()+1); }
    return d;
  }
  function dailyRate(p){ const md=Array.isArray(p.medianDaily)&&p.medianDaily.length===7?p.medianDaily:null; return md? sum(md)/7 : 0; }

  // ==== Estado ====
  let CURRENT=[];            // productos
  let PLAN8={};              // {productId: { MS1: n, JS1: n, ... }}
  const BUFFER_CONS=[];

  // ==== Carga / seed catálogo (solo si vacío) ====
  async function ensureCatalog(){
    const snap = await db.ref(PATH.products).limitToFirst(1).get();
    if (snap.exists()) return;
    const up={}; for(const p of PAN_SEED){ up[`${PATH.products}/${p.id}`]={stockActual:0,ref:'',...p}; }
    await db.ref().update(up);
  }
  async function loadProducts(){
    const snap = await db.ref(PATH.products).get();
    const val=snap.val()||{};
    return Object.entries(val).map(([id,p])=>({id,...p})).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  }
  async function loadPlan8(){
    const snap = await db.ref(PATH.plan8).get();
    PLAN8 = snap.val()||{};
  }
  function getPlanCode(pid, code){ return (((PLAN8||{})[pid]||{})[code]) || 0; }
  async function setPlanCode(pid, code, val){
    val=Math.max(0,Math.round(+val||0));
    PLAN8[pid]=PLAN8[pid]||{};
    PLAN8[pid][code]=val;
    await db.ref(`${PATH.plan8}/${pid}/${code}`).set(val);
  }

  // ==== UI Pedido ====
  function renderPedido(list){
    const view = $('#view-select').value;       // 'semana' | 'dia'
    const week = +$('#week-select').value;      // 1..8
    const daySel = $('#day-select').value;      // martes/jueves/sabado
    $('#chip-dia').style.display = (view==='dia')?'':'none';

    const grid = $('#pedido-grid');
    if(view==='semana'){
      grid.innerHTML = `
        <thead><tr>
          <th>Producto</th><th>Ref</th>
          <th>M (cjs)</th><th>J (cjs)</th><th>S (cjs)</th>
        </tr></thead><tbody></tbody>`;
      const tb = grid.querySelector('tbody');
      for(const p of list){
        const cM = codeFor('martes',week), cJ = codeFor('jueves',week), cS = codeFor('sabado',week);
        const vM = getPlanCode(p.id, cM), vJ = getPlanCode(p.id, cJ), vS = getPlanCode(p.id, cS);
        const tr=document.createElement('tr'); tr.dataset.pid=p.id;
        tr.innerHTML = `
          <td>${p.name}</td><td>${p.ref||''}</td>
          <td><input type="number" min="0" class="in-cajas" data-code="${cM}" value="${vM}"></td>
          <td><input type="number" min="0" class="in-cajas" data-code="${cJ}" value="${vJ}"></td>
          <td><input type="number" min="0" class="in-cajas" data-code="${cS}" value="${vS}"></td>`;
        tb.appendChild(tr);
      }
    } else {
      // Por día: mostrar Sobrará ≈
      grid.innerHTML = `
        <thead><tr>
          <th>Producto</th><th>Ref</th><th>Cajas</th><th>Sobrará ≈</th>
        </tr></thead><tbody></tbody>`;
      const tb = grid.querySelector('tbody');
      const dateNext = nextDateFor(daySel, today0());
      const daysDiff = Math.max(0, Math.round((dateNext - today0())/86400000));
      for(const p of list){
        const code = codeFor(daySel,week);
        const boxes = getPlanCode(p.id, code);
        const inbound = (+p.uCaja||1) * boxes;
        const willLeft = Math.max(0, Math.round((+p.stockActual||0) - dailyRate(p)*daysDiff + inbound));
        const tr=document.createElement('tr'); tr.dataset.pid=p.id;
        tr.innerHTML = `
          <td>${p.name}</td><td>${p.ref||''}</td>
          <td><input type="number" min="0" class="in-cajas" data-code="${code}" value="${boxes}"></td>
          <td><span class="badge thin">${willLeft} uds</span></td>`;
        tb.appendChild(tr);
      }
    }

    // Guardado inmediato sin “volver a 0”
    grid.addEventListener('input', onChangeBoxes, { once:true });
  }

  async function onChangeBoxes(e){
    const inp = e.target;
    if(!inp.classList.contains('in-cajas')) return;
    const tr = inp.closest('tr');
    const pid = tr.dataset.pid;
    const code = inp.dataset.code;
    const val = Math.max(0,Math.round(+inp.value||0));
    inp.value = val;               // fija lo que ves
    await setPlanCode(pid, code, val); // guarda y actualiza cache
    // recalc solo si vista "dia" (muestra Sobrará)
    if($('#view-select').value==='dia'){
      const p = CURRENT.find(x=>x.id===pid);
      const daySel = $('#day-select').value;
      const week = +$('#week-select').value;
      const dateNext = nextDateFor(daySel, today0());
      const daysDiff = Math.max(0, Math.round((dateNext - today0())/86400000));
      const inbound = (+p.uCaja||1) * val;
      const willLeft = Math.max(0, Math.round((+p.stockActual||0) - dailyRate(p)*daysDiff + inbound));
      tr.querySelector('td:last-child .badge').textContent = `${willLeft} uds`;
    }
    // volver a enganchar para siguientes inputs
    $('#pedido-grid').addEventListener('input', onChangeBoxes, { once:true });
  }

  // ==== Guardar pedido del próximo camión (usa “Entrega” arriba) ====
  async function saveOrder(list){
    const dayUI = $('#view-select').value==='dia' ? $('#day-select').value : $('#deliver-select').value;
    const week = +$('#week-select').value;
    const dateKey = iso(nextDateFor(dayUI, today0()));
    const lines={};
    for(const p of list){
      const code = codeFor(dayUI, week);
      const boxes = getPlanCode(p.id, code);
      if(boxes>0) lines[p.id]={productId:p.id,boxes,units:boxes*(+p.uCaja||1)};
    }
    await db.ref(`${PATH.orders}/${dateKey}`).set({meta:{createdAt:Date.now(),deliverOn:dayUI,week},lines});
    toast(`Pedido ${dateKey} guardado`);
  }

  // ==== Otras pestañas (sin botones “Editar”) ====
  function renderCatalog(list){
    const tb=$('#tb-catalogo'); if(!tb) return; tb.innerHTML='';
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
        <td><input type="number" class="in-stock" min="0" value="${+p.stockActual||0}"></td>`;
      tb.appendChild(tr);
    }
  }
  async function saveStockCatalog(){
    const up={};
    $$('#tb-catalogo tr').forEach(tr=>{
      const id=tr.dataset.pid;
      up[`${PATH.products}/${id}/uCaja`]=+tr.querySelector('.in-ucaja').value||1;
      up[`${PATH.products}/${id}/estado`]=tr.querySelector('.in-estado').value||'HAY';
      const stock=+tr.querySelector('.in-stock').value||0;
      up[`${PATH.products}/${id}/stockActual`]=stock;
      up[`${PATH.products}/${id}/stockUpdatedAt`]=new Date().toISOString();
    });
    await db.ref().update(up);
    toast('Catálogo guardado');
    CURRENT=await loadProducts(); renderAll();
  }
  function renderMedianas(list){
    const tb=$('#tb-medianas'); if(!tb) return; tb.innerHTML='';
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

  // ==== Consumo (igual que antes; lo dejo por si lo usas) ====
  function buildConsumoTable(savedList=[]){
    const tb=$('#tb-consumo'); if(!tb) return; tb.innerHTML='';
    const rows = [...BUFFER_CONS, ...savedList];
    rows.sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    for(const r of rows){
      const tr=document.createElement('tr');
      if(r.provisional) tr.classList.add('provisional');
      tr.innerHTML=`<td>${r.date}</td><td>${r.name}</td><td>${r.deltaUnits}</td><td>${r.days}</td><td>${(r.ratePerDay||0).toFixed(2)}</td><td>${r.provisional?'provisional':'manual'}</td>`;
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
        up[`${PATH.consumption}/${date}/${r.productId}`]={ deltaUnits:r.deltaUnits, days:r.days, ratePerDay:r.ratePerDay, provisional:true };
      }
    }
    if(Object.keys(up).length===0){ toast('Nada que guardar'); return; }
    await db.ref().update(up);
    toast('Consumo provisional guardado');
    BUFFER_CONS.length=0; await loadConsumoByDate(date);
  }

  // ==== Helpers ====
  function toast(msg){
    const div=document.createElement('div');
    Object.assign(div.style,{position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',
      background:'rgba(0,0,0,.7)',color:'#fff',padding:'8px 12px',borderRadius:'10px',fontSize:'14px',zIndex:9999});
    div.textContent=msg; document.body.appendChild(div); setTimeout(()=>div.remove(),1400);
  }
  function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

// ==== Navegación de pestañas ====
function setupTabs(){
  // Enlaza clics en pestañas (delegación segura)
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.tabs .tab');
    if(!btn) return;
    document.querySelectorAll('.tabs .tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tabpage').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    const pg = document.getElementById(id);
    if(pg) pg.classList.add('active');
  });
}

// ==== Render ventas (mínimo, por si faltaba) ====
function renderVentas(list){
  const tb = document.getElementById('tb-ventas');
  if(!tb) return;
  tb.innerHTML = '';
  for(const p of list){
    const tr = document.createElement('tr'); tr.dataset.pid = p.id;
    tr.innerHTML = `<td>${p.name}</td><td><input type="number" class="in-units" min="0" value="0"></td>`;
    tb.appendChild(tr);
  }
  const d = document.getElementById('ventas-date'); if(d) d.value = iso(today0());
}

// ==== Utilidades UI ====
function toast(msg){
  const div=document.createElement('div');
  Object.assign(div.style,{position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',
    background:'rgba(0,0,0,.7)',color:'#fff',padding:'8px 12px',borderRadius:'10px',fontSize:'14px',zIndex:9999});
  div.textContent=msg; document.body.appendChild(div); setTimeout(()=>div.remove(),1400);
}
function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

// ==== Render global (no falla si faltan tablas) ====
function renderAll(){
  if (typeof renderPedido === 'function') renderPedido(CURRENT);
  if (typeof renderCatalog === 'function') renderCatalog(CURRENT);
  if (typeof renderMedianas === 'function') renderMedianas(CURRENT);
  if (typeof renderVentas === 'function') renderVentas(CURRENT);
  const vd = document.getElementById('ventas-date'); if(vd) vd.value = iso(today0());
  const cd = document.getElementById('consumo-date'); if(cd){ cd.value = iso(today0()); loadConsumoByDate(cd.value); }
}

// ==== Boot ====
async function boot(){
  setupTabs();

  // Botones del header (si existen)
  const btnSeed = document.getElementById('btn-seed');
  if(btnSeed) btnSeed.onclick = async()=>{
    await ensureCatalog();
    CURRENT = await loadProducts();
    await loadPlan8?.();      // si usas plan8
    renderAll();
    toast('Catálogo listo');
  };

  const btnSaveOrder = document.getElementById('btn-save-order');
  if(btnSaveOrder) btnSaveOrder.onclick = ()=>saveOrder(CURRENT);

  // Selectores de la vista pedido
  const viewSel = document.getElementById('view-select');
  if(viewSel) viewSel.onchange = ()=> renderPedido(CURRENT);
  const weekSel = document.getElementById('week-select');
  if(weekSel) weekSel.onchange = ()=> renderPedido(CURRENT);
  const daySel = document.getElementById('day-select');
  if(daySel) daySel.onchange = ()=> renderPedido(CURRENT);
  const deliver = document.getElementById('deliver-select');
  if(deliver) deliver.onchange = ()=> renderPedido(CURRENT);

  await ensureCatalog();
  CURRENT = await loadProducts();
  await loadPlan8?.();        // si usas plan8 (MS1/JS1/SS1…)

  renderAll();

  // Consumo (si usas esa pestaña)
  const btnSaveCons = document.getElementById('btn-save-consumo');
  if(btnSaveCons) btnSaveCons.onclick = saveConsumo;
}
document.addEventListener('DOMContentLoaded', boot);

})();
