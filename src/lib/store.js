'use strict';
const fs = require('node:fs');
const path = require('node:path');
const BASE = path.resolve(__dirname, '../../data');
function ensureData() {
  fs.mkdirSync(BASE,{recursive:true});
  const p=path.join(BASE,'products.json'), u=path.join(BASE,'users.json');
  if (!fs.existsSync(p)) fs.copyFileSync(path.join(BASE,'products.sample.json'),p);
  if (!fs.existsSync(u)) fs.writeFileSync(u,'[]\n','utf8');
}
function read(name){ ensureData(); return JSON.parse(fs.readFileSync(path.join(BASE,name+'.json'),'utf8'));}
function write(name,data){
  if(!['products','users'].includes(name))throw Error('Unknown collection');
  ensureData();
  const tmp=path.join(BASE,name+'.json.tmp');
  fs.writeFileSync(tmp,JSON.stringify(data,null,2)+'\n','utf8');
  fs.renameSync(tmp,path.join(BASE,name+'.json'));
}
module.exports={ensureData,read,write};
