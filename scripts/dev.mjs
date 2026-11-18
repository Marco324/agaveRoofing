import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const preview=process.argv.includes('--preview');
if(preview) {
  process.env.FECHA_HOY ||= '2026-11-12';
  process.env.AGAVE_DB_PATH ||= path.join(root,'data','vista-previa.db');
}
const apiPort=Number(process.env.PORT || (preview?4010:4000));
const webPort=Number(process.env.WEB_PORT || (preview?3010:3001));
if(preview && !fs.existsSync(process.env.AGAVE_DB_PATH)) {
  const {runSeed}=await import('../api/src/seed.ts');
  runSeed({conCitas:true});
}
const {startServer,server:apiServer}=await import('../api/src/server.ts');
await startServer(apiPort);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.wasm':'application/wasm','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf'};
const servers=[];
function serve(directory,port,panel=false) {
  const base=path.join(root,directory);
  const server=http.createServer((req,res)=>{
    let pathname;
    try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch {res.writeHead(400);return res.end();}
    if(panel && pathname.startsWith('/api/')) {
      const upstream=http.request({hostname:'127.0.0.1',port:apiPort,path:req.url,method:req.method,headers:req.headers},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
      upstream.on('error',()=>{res.writeHead(502);res.end('API no disponible');});req.pipe(upstream);return;
    }
    if(pathname.endsWith('/'))pathname+='index.html';
    const shared=panel && pathname.startsWith('/shared/ui/');
    const target=path.resolve(shared?root:base,'.'+pathname);
    const allowedRoot=shared?path.join(root,'shared','ui'):base;
    if(!target.startsWith(allowedRoot+path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {res.writeHead(404);return res.end('Archivo no encontrado');}
    res.writeHead(200,{'Content-Type':mime[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-cache'});
    fs.createReadStream(target).pipe(res);
  });
  server.listen(port,'127.0.0.1');servers.push(server);
}
serve('panel',webPort,true);
console.log(`Panel: http://localhost:${webPort}/?api=http://localhost:${apiPort}/api`);
if(preview) {
  for(const [app,port] of [['app-cliente',3011],['app-inspector',3012]]) {
    if(fs.existsSync(path.join(root,app,'build/web/index.html'))) {
      serve(`${app}/build/web`,port);console.log(`${app}: http://localhost:${port}`);
    } else console.log(`${app}: compila Flutter web para activar su vista previa.`);
  }
}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{servers.forEach(server=>server.close());apiServer.close();process.exit(0);});
