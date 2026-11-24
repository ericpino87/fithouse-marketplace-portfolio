'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {searchProducts,normalizeQuantity,cartLines,cartTotal,validateProduct,peso}=require('../src/lib/catalog');
const products=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/products.sample.json'),'utf8'));
test('synthetic catalog contains 8 distinct products',()=>{
  assert.equal(products.length,8);
  assert.equal(new Set(products.map(p=>p.id)).size,8);
  assert.ok(products.every(p=>p.price>0 && p.name && p.description));
});
test('search matches product name without case sensitivity',()=>{
  const matches=searchProducts(products,'MANCUERNAS');
  assert.equal(matches.length,1);assert.equal(matches[0].id,1);
});
test('search supports category filters',()=>{
  assert.deepEqual(searchProducts(products,'','Cardio').map(p=>p.id),[5]);
});
test('quantity rejects decimals, zeros and excessive values',()=>{
  for(const n of [-1,0,2.2,11,'invalid'])assert.equal(normalizeQuantity(n),null);
  assert.equal(normalizeQuantity('3'),3);
});
test('cart ignores invalid products and calculates totals',()=>{
  const lines=cartLines({'1':2,'5':1,'999':1,'2':-1},products);
  assert.equal(lines.length,2);
  assert.equal(cartTotal(lines),182800);
});
test('product validation rejects invalid category and values',()=>{
  assert.ok(validateProduct({name:'Bola',description:'Una descripción válida',category:'XSS',price:150}).error);
  assert.ok(validateProduct({name:'Bola',description:'Una descripción válida',category:'Fuerza',price:-1}).error);
  assert.ok(validateProduct({name:'AB',description:'Una descripción válida',category:'Fuerza',price:150}).error);
});
test('product validation normalizes prices and selects safe icon',()=>{
  const result=validateProduct({name:'Set de pesas',description:'Para entrenar con cargas ligeras',category:'Fuerza',price:'24520.5'});
  assert.equal(result.product.price,24521);assert.equal(result.product.emoji,'🏋️');
});
test('currency formatting is valid Argentine pesos',()=>{
  assert.match(peso(1000),/1.000/);
});
test('documentation and runnable entrypoint exist',()=>{
  for(const file of ['src/app.js','src/views/home.ejs','src/views/products.ejs','src/views/detail.ejs','src/views/cart.ejs','public/css/main.css','README.md'])assert.ok(fs.existsSync(path.join(__dirname,'..',file)),file);
});
