// V8 — competition safety, results, audit log, exports and autosave

function resultsRows(){
  return STATE.athletes.filter(a=>!a.absent).map((a,i)=>({
    no:i+1,name:a.name||'',club:a.club||'',round1:a.rounds?.[0]?.total??'',round2:a.rounds?.[1]?.total??'',final:a.finalScore??'',rank:(computeRanking().find(x=>x.id===a.id)?.position??'')
  })).sort((a,b)=>{const ra=Number(a.rank)||999, rb=Number(b.rank)||999; return ra-rb || (Number(b.final)||0)-(Number(a.final)||0);});
}
function showResults(){
  if(!((STATE.phase==="FINAL"||STATE.phase==="DIRECT FINAL") && allAthletesFinalized() && !hasTie())) return false;
  // Results is an operator-only view. Do NOT broadcast or change publicMode,
  // otherwise the Public Display would leave the podium/ranking it is showing.
  STATE.state=STATES.RESULTS;
  computeRanking();
  render();
}
function competitionLogHTML(){
 const rows=(STATE.history||[]).slice().reverse().slice(0,80);
 return `<div class="competitionLog"><div class="phaseTag">COMPETITION LOG</div>${rows.length?rows.map(x=>`<div class="logRow"><time>${new Date(x.at).toLocaleTimeString('fr-FR')}</time><b>${esc(x.type||'EVENT')}</b><span>${esc(x.name||x.message||'')}</span></div>`).join(''):`<p class="muted">No events recorded.</p>`}</div>`;
}
function renderResultsView(el){
 const rows=resultsRows();
 const ranking=computeRanking();
 el.innerHTML=`<div class="card resultsCard"><div class="phaseTag">${esc(STATE.phase)} · RESULTS</div><div class="resultsHead"><div><h1>Competition Results</h1><p class="muted">${esc(publicCompetitionDescriptor())} · MAT ${esc(STATE.matNumber||1)}</p></div><div class="resultsActions"><button class="btn primary" onclick="exportResultsExcel()">EXPORT EXCEL</button><button class="btn" onclick="exportResultsCSV()">EXPORT CSV</button><button class="btn" onclick="printOfficialResults()">PRINT / PDF</button></div></div><div class="resultsTableWrap"><table class="resultsTable"><thead><tr><th>#</th><th>ATHLETE</th><th>CLUB</th><th>ROUND 1</th><th>ROUND 2</th><th>FINAL</th><th>RANK</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.no}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.club)}</td><td>${r.round1!==''?fmt3(r.round1):'—'}</td><td>${r.round2!==''?fmt3(r.round2):'—'}</td><td>${r.final!==''?`<strong>${fmt3(r.final)}</strong>`:'—'}</td><td>${r.rank?`#${r.rank}`:'—'}</td></tr>`).join('')}</tbody></table></div>${competitionLogHTML()}</div>`;
}

function exportResultsExcel(){
 const rows=resultsRows();
 const html=`<html><head><meta charset="utf-8"></head><body><h2>FTT Poomsae Championship</h2><p>${esc(publicCompetitionDescriptor())} · ${esc(STATE.phase)} · MAT ${esc(STATE.matNumber||1)}</p><table border="1"><tr><th>No</th><th>Athlete</th><th>Club</th><th>Round 1</th><th>Round 2</th><th>Final Score</th><th>Rank</th></tr>${rows.map(r=>`<tr><td>${r.no}</td><td>${esc(r.name)}</td><td>${esc(r.club)}</td><td>${r.round1===''?'':fmt3(r.round1)}</td><td>${r.round2===''?'':fmt3(r.round2)}</td><td>${r.final===''?'':fmt3(r.final)}</td><td>${r.rank||''}</td></tr>`).join('')}</table></body></html>`;
 const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`FTT_Poomsae_Results_${(STATE.category||'Category').replace(/\s+/g,'_')}.xls`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function exportResultsCSV(){
 const rows=resultsRows();const head=['No','Athlete','Club','Round 1','Round 2','Final Score','Rank'];
 const escCsv=v=>`"${String(v??'').replace(/"/g,'""')}"`;
 const csv='\\ufeff'+[head,...rows.map(r=>[r.no,r.name,r.club,r.round1===''?'':fmt3(r.round1),r.round2===''?'':fmt3(r.round2),r.final===''?'':fmt3(r.final),r.rank])].map(r=>r.map(escCsv).join(';')).join('\\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`FTT_Poomsae_Results_${(STATE.category||'Category').replace(/\\s+/g,'_')}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function printOfficialResults(){
 const rows=resultsRows().filter(r=>Number(r.rank)>=1&&Number(r.rank)<=4).slice(0,4);const w=window.open('','WT_RESULTS_PRINT','width=1200,height=800');if(!w)return;
 const competition=String(STATE.competitionName||'POOMSAE CHAMPIONSHIP');
 const mat=String(STATE.matNumber||1);
 const category=String(STATE.category||'—');
 const classCode=String(STATE.classCode||'—');
 const sexe=String(STATE.gender||(STATE.participation==='DUO'?'Mixed':'—'));
 w.document.write(`<html><head><title>${esc(competition)} — Official Results</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#111}h1{margin:0 0 8px;font-size:27px}h2{margin:0 0 14px;font-size:18px;color:#444}.meta{display:flex;flex-wrap:wrap;gap:18px;margin:4px 0 8px;font-size:16px;font-weight:700}.meta span{padding:5px 10px;border:1px solid #ccc;border-radius:5px;background:#f7f7f7}.submeta{color:#555;font-size:14px;margin-top:7px}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{border:1px solid #bbb;padding:10px;text-align:center}th{background:#eee}td:nth-child(2),td:nth-child(3){text-align:left}.signature{width:360px;margin:65px 0 0 auto;text-align:center}.signature-line{border-top:1px solid #777;margin-bottom:12px}.signature-name{font-weight:700;font-size:24px;margin-bottom:15px}.signature-role{font-weight:700;font-size:16px;line-height:1.9;direction:rtl;white-space:nowrap}@media print{body{padding:18mm}.signature{break-inside:avoid;page-break-inside:avoid;margin-top:55px}}</style></head><body><h1>${esc(competition)}</h1><h2>POOMSAE — OFFICIAL RESULTS</h2><div class="meta"><span>CATÉGORIE : ${esc(category)}</span><span>CLASSE : ${esc(classCode)}</span><span>SEXE : ${esc(sexe)}</span></div><div class="submeta">${esc(STATE.phase)} · MAT ${esc(mat)}</div><table><thead><tr><th>RANK</th><th>ATHLETE</th><th>CLUB</th><th>ROUND 1</th><th>ROUND 2</th><th>FINAL</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${r.rank||'—'}</strong></td><td>${esc(r.name)}</td><td>${esc(r.club)}</td><td>${r.round1===''?'—':fmt3(r.round1)}</td><td>${r.round2===''?'—':fmt3(r.round2)}</td><td>${r.final===''?'—':fmt3(r.final)}</td></tr>`).join('')}</tbody></table><div class="signature"><div class="signature-line"></div><div class="signature-name">Mme Reem Bousselmi</div><div class="signature-role">رئيسة لجنة التحكيم الوطنية للبومزا والفريستايل</div></div><script>window.onload=()=>window.print()</script></body></html>`);w.document.close();
}

function deleteAthleteSafe(i){
 const a=STATE.athletes[i];if(!a)return;
 if(STATE.competitionStarted && i===STATE.currentIndex && (STATE.state===STATES.ROUND_RUNNING||STATE.state===STATES.CALCULATING||STATE.state===STATES.TIME_FINISHED))return;
 removeAthlete(i);
}
function addAthleteAfterSetupSafe(){return addAthleteAfterSetup()}
setInterval(()=>{try{if(STATE?.setupComplete){saveState()}}catch(e){}},2000);
