import {test,expect} from '@playwright/test';
async function entrar(page){
  await page.goto('/?api=http://localhost:3110/api');
  await page.getByLabel('Correo',{exact:true}).fill('marco.admin@agaveroofing.com');
  await page.getByLabel('Contraseña',{exact:true}).fill('Agave2026');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page.locator('.appointment-row').first()).toBeVisible();
}
test('agenda conectada, avisos desplegables y modal operable con teclado',async({page})=>{
  await entrar(page);
  await expect(page.locator('#apiStatusText')).toHaveText('API conectada');
  await expect(page.locator('#listaRequierenAtencion')).not.toBeVisible();
  await page.locator('#bannerRequierenAtencion summary').click();
  await expect(page.locator('#listaRequierenAtencion')).toBeVisible();
  await page.locator('#bannerRequierenAtencion summary').click();
  await page.locator('.appointment-row').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#modalDetalleCita')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modalDetalleCita')).not.toBeVisible();
  await expect(page.locator('.appointment-row').first()).toBeFocused();
});
test('programar una visita mantiene el formulario conectado con la agenda',async({page})=>{
  await entrar(page);
  await page.locator('#btnNuevaInspeccion').click();
  await page.locator('#inputCliente').selectOption('1');
  await page.locator('#inputDomicilio').selectOption('1');
  await page.locator('#inputInspector').selectOption('1');
  await page.locator('#inputFecha').fill('2026-11-12');
  await page.locator('#inputVentanaInicio').fill('17:00');
  await page.locator('#inputVentanaFin').fill('18:00');
  await page.locator('#inputMotivo').fill('Revisión visual de integración');
  await page.locator('#formNuevaInspeccion button[type="submit"]').click();
  await expect(page.locator('#modalNuevaInspeccion')).not.toBeVisible();
  await expect(page.locator('.appointment-time').filter({hasText:'17:00'})).toBeVisible();
});
test('las seis secciones reciben datos y no producen errores de JavaScript',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await entrar(page);
  for(const [tab,view]of [['Notificaciones','viewNotificaciones'],['Reprogramaciones','viewReprogramaciones'],['Monitor','viewMonitor'],['Tablero','viewTablero'],['Catalogos','viewCatalogos'],['Agenda','viewAgenda']]){
    await page.locator('#tabBtn'+tab).click();
    await expect(page.locator('#'+view)).toBeVisible();
    await expect(page.locator('#tabBtn'+tab)).toHaveAttribute('aria-selected','true');
  }
  await page.locator('#tabBtnTablero').click();
  await expect(page.locator('#contenedorGraficaEstados > div').first()).toBeVisible();
  await page.locator('#tabBtnNotificaciones').click();
  await expect(page.locator('#tablaNotificacionesBody tr').first()).toBeVisible();
  await page.locator('#tabBtnCatalogos').click();
  await expect(page.locator('#tablaClientesCatBody tr').first()).toBeVisible();
  expect(errors).toEqual([]);
});
for(const width of [320,390,768])test(`agenda y navegación sin desbordes a ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});await entrar(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#btnNuevaInspeccion').click();
  await expect(page.locator('#inputCliente')).toBeVisible();
  const box=await page.locator('#modalNuevaInspeccion > div').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);
});
test('notificaciones, indicadores y catálogos siguen accesibles en móvil',async({page})=>{
  await page.setViewportSize({width:390,height:1000});await entrar(page);
  for(const tab of ['Notificaciones','Reprogramaciones','Monitor','Tablero','Catalogos']){
    await page.locator('#tabBtn'+tab).click();
    await expect(page.locator('#tabBtn'+tab)).toHaveAttribute('aria-selected','true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await expect(page.locator('#catCliNombre')).toBeVisible();
});
