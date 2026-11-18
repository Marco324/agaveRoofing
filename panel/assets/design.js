// Presentation helpers. Domain state and permissions remain in the existing API.
function estadoLegible(state) {
  return ({ PROGRAMADA:'Programada', NOTIFICADA:'Aviso enviado', CONFIRMADA:'Confirmada', SIN_CONFIRMAR:'Sin confirmar', EN_CAMINO:'En camino', EN_SITIO:'En domicilio', COMPLETADA:'Completada', CANCELADA:'Cancelada', CLIENTE_AUSENTE:'Cliente ausente', REPROGRAMADA:'Reprogramada', REPROG_SOLICITADA:'Cambio solicitado', NO_REALIZADA:'No realizada', PENDIENTE_CIERRE:'Sin cerrar', SOLICITADA:'Pendiente', APROBADA:'Aprobada', RECHAZADA:'Rechazada', ENTREGADA:'Entregada', FALLIDA:'Fallida', PENDIENTE:'Pendiente', ENVIADA:'Enviada', EN_COLA:'En cola', REINTENTANDO:'Reintentando' })[state] || state;
}
function avisoLegible(tipo) {
  const labels={AVISO_DIA_PROGRAMADO:'Aviso de visita',RECORDATORIO_PREVIO:'Recordatorio',EN_CAMINO:'En camino',POR_LLEGAR:'Próxima llegada',RESULTADO:'Reporte disponible'};
  const text=String(tipo ?? '').replaceAll('_',' ').toLowerCase();
  return labels[tipo] || text.charAt(0).toUpperCase()+text.slice(1);
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('label:not([for])').forEach(label => {
    const control=label.parentElement.querySelector('input[id], select[id], textarea[id]');
    if(control) label.htmlFor=control.id;
  });
  const labels={btnPrevDay:'Día anterior',btnNextDay:'Día siguiente',inputKpiInicio:'Inicio del periodo',inputKpiFin:'Fin del periodo',catCliNombre:'Nombre del cliente',catCliTel:'Teléfono del cliente',catCliContrasena:'Contraseña inicial del cliente',catCliCanal:'Canal de avisos'};
  Object.entries(labels).forEach(([id,label])=>document.getElementById(id)?.setAttribute('aria-label',label));
  document.querySelectorAll('.date-options input,.date-options select').forEach(control=>control.addEventListener('change',()=>{control.closest('details').open=false;}));
  // Arrow keys move between the existing section tabs.
  const tabs=[...document.querySelectorAll('.workspace-nav [role="tab"]')];
  tabs.forEach((tab,index)=>tab.addEventListener('keydown',event=>{
    const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
    if(!delta)return;
    event.preventDefault();const next=tabs[(index+delta+tabs.length)%tabs.length];next.focus();next.click();
  }));
  // Keep keyboard focus in visible modals; existing handlers close and save them.
  let active=null,returnFocus=null;
  const controls=el=>[...el.querySelectorAll('button,input,select,textarea,a[href]')].filter(c=>!c.disabled && c.getClientRects().length);
  const sync=()=>{
    const next=[...document.querySelectorAll('[role="dialog"],[role="alertdialog"],.agave-sesion-caja,#modalNuevaInspeccion,#modalDetalleCita')].filter(el=>!el.classList.contains('hidden') && el.getClientRects().length).pop() || null;
    if(next===active)return;
    if(next){returnFocus=document.activeElement;next.setAttribute('role','dialog');next.setAttribute('aria-modal','true');next.setAttribute('aria-label',next.querySelector('h1,h2,h3')?.textContent.trim() || 'Detalle de inspección');controls(next)[0]?.focus();}
    else returnFocus?.focus();
    active=next;document.body.classList.toggle('dialog-open',Boolean(next));
  };
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Tab' || !active)return;
    const list=controls(active),first=list[0],last=list.at(-1);
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
    if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
  });
});
