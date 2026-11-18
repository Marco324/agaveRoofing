import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

const temp=mkdtempSync(path.join(tmpdir(),'agave-tests-'));
const available=['agenda','e08_e09','e10_e11','citas_pasadas','fcm','fecha_referencia','auth'];
const suites=process.argv.length>2?process.argv.slice(2):available;
if(suites.some(suite=>!available.includes(suite)))throw new Error('Suite desconocida');
let failed=false;
try {
  for(const suite of suites) {
    const result=spawnSync(process.execPath,['--experimental-strip-types','--experimental-sqlite',`api/test/${suite}.test.ts`],{
      env:{...process.env,FECHA_HOY:'2026-10-15',AGAVE_DB_PATH:path.join(temp,'prueba.db')},encoding:'utf8',maxBuffer:8*1024*1024,
    });
    console.log(`${result.status===0?'OK':'ERROR'} ${suite}`);
    if(result.status!==0) {console.error(result.stdout,result.stderr);failed=true;break;}
  }
} finally {
  const resolved=path.resolve(temp);
  if(resolved.startsWith(path.resolve(tmpdir())+path.sep) && path.basename(resolved).startsWith('agave-tests-'))rmSync(resolved,{recursive:true,force:true});
}
process.exitCode=failed?1:0;
