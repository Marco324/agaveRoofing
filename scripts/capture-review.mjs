import {chromium} from '@playwright/test';
import fs from 'node:fs';
const output='docs/diseno/capturas';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://localhost:3010/?api=http://localhost:4010/api');
  await page.getByLabel('Correo',{exact:true}).fill('marco.admin@agaveroofing.com');
  await page.getByLabel('Contraseña',{exact:true}).fill('Agave2026');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.locator('.appointment-row').first().waitFor();
  await page.screenshot({path:`${output}/panel-agenda.png`,fullPage:true});
  for(const [tab,container] of [['Notificaciones','#tablaNotificacionesBody tr'],['Reprogramaciones','#contenedorBandejaReprog > div'],['Monitor','#viewMonitor'],['Tablero','#contenedorGraficaEstados > div'],['Catalogos','#tablaClientesCatBody tr']]){
    await page.locator('#tabBtn'+tab).click();
    await page.locator(container).first().waitFor();
    await page.screenshot({path:`${output}/panel-${tab.toLowerCase()}.png`,fullPage:true});
  }
  await page.locator('#tabBtnAgenda').click();await page.locator('#btnNuevaInspeccion').click();
  await page.screenshot({path:`${output}/panel-formulario.png`});
  console.log(JSON.stringify({capturas:output,errors}));
} finally { await browser.close(); }
