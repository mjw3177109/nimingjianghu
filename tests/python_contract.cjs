'use strict';
const cp=require('node:child_process');
let found=false;
for(const command of (process.platform==='win32'?['python','python3']:['python3','python'])){
 const proc=cp.spawnSync(command,['-c','import ast, pathlib; ast.parse(pathlib.Path("main.py").read_text(encoding="utf-8")); print("PASS: main.py Python syntax")'],{encoding:'utf8',timeout:10000});
 if(proc.error?.code==='ENOENT')continue;
 found=true;
 if(proc.status!==0)throw new Error('Pygame Python syntax check failed:\n'+proc.stderr);
 process.stdout.write(proc.stdout);
 const unit=cp.spawnSync(command,['-m','unittest','discover','-s','tests','-p','test_*.py'],{encoding:'utf8',timeout:30000});
 if(unit.status!==0)throw new Error('P3A data unittest failed:\n'+unit.stdout+'\n'+unit.stderr);
 process.stdout.write(unit.stdout+unit.stderr);
 break;
}
if(!found)console.warn('Python not present in this Node builder; Windows data test will run in GitHub Actions / on local Python');
