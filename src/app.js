'use strict';
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const path = require('node:path');
const {ensureData, read, write} = require('./lib/store');
const {allowedCategories, peso, searchProducts, normalizeQuantity, cartLines, cartTotal, validateProduct} = require('./lib/catalog');

const app = express();
const ROOT = path.resolve(__dirname,'..');
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw Error('SESSION_SECRET must be at least 32 characters in production.');
}
const secret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
app.disable('x-powered-by');
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));
app.use(express.static(path.join(ROOT,'public')));
app.use(express.urlencoded({extended:false,limit:'16kb'}));
app.use(session({name:'fithouse.sid', secret, resave:false, saveUninitialized:false,
  cookie:{httpOnly:true,sameSite:'lax',secure:isProduction,maxAge:60*60*1000}}));
app.use((req,res,next)=>{
  if(!req.session.csrf)req.session.csrf=crypto.randomBytes(24).toString('hex');
  if(req.method==='POST' && req.body._csrf!==req.session.csrf) return res.status(403).send('Solicitud rechazada. Volvé atrás y actualizá la página.');
  res.locals.csrf=req.session.csrf;
  res.locals.user=req.session.user || null;
  res.locals.peso=peso;
  res.locals.cartCount=Object.values(req.session.cart||{}).reduce((a,n)=>a+Number(n||0),0);
  res.locals.path=req.path;
  next();
});
function render(res,view,more={}){return res.render(view,{...more});}
function onlySignedIn(req,res,next){if(!req.session.user)return res.redirect('/usuario/login');next();}

app.get('/',(req,res)=>render(res,'home',{featured:read('products').slice(0,4)}));
app.get('/productos',(req,res)=>{
  const q=String(req.query.q||'').slice(0,100),category=String(req.query.categoria||'');
  render(res,'products',{products:searchProducts(read('products'),q,category),q,category,categories:allowedCategories});
});
app.get('/productos/:id',(req,res)=>{
  const product=read('products').find(p=>p.id===Number(req.params.id));
  if(!product)return res.status(404).render('not-found');
  render(res,'detail',{product});
});
app.get('/carrito',(req,res)=>{
  const lines=cartLines(req.session.cart,read('products'));
  render(res,'cart',{lines,total:cartTotal(lines)});
});
app.post('/carrito/agregar',(req,res)=>{
  const id=Number(req.body.id),quantity=normalizeQuantity(req.body.quantity||1);
  const product=read('products').find(p=>p.id===id);
  if(!quantity || !product)return res.status(400).send('Producto o cantidad inválidos');
  const cart=req.session.cart||{};
  cart[id]=Math.min(10,product.stock,(cart[id]||0)+quantity);
  req.session.cart=cart;
  res.redirect('/carrito');
});
app.post('/carrito/quitar',(req,res)=>{
  const cart=req.session.cart||{};
  delete cart[String(req.body.id)];req.session.cart=cart;res.redirect('/carrito');
});
app.get('/usuario/register',(req,res)=>render(res,'register',{error:null}));
app.post('/usuario/register',(req,res)=>{
  const email=String(req.body.email||'').trim().toLowerCase();
  const name=String(req.body.name||'').trim();
  const password=String(req.body.password||'');
  const users=read('users');
  const error=(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>160||name.length<2||name.length>80||password.length<8||password.length>72||users.some(u=>u.email===email)) ? 'Revisá los datos, la contraseña (mínimo 8 caracteres) o si el correo ya está registrado.' : null;
  if(error)return res.status(400).render('register',{error});
  const user={id:crypto.randomUUID(),name,email,passwordHash:bcrypt.hashSync(password,10)};
  users.push(user);write('users',users);
  req.session.regenerate(err=>{
    if(err)return res.status(500).send('Error de sesión');
    req.session.user={id:user.id,name:user.name,email:user.email};
    res.redirect('/');
  });
});
app.get('/usuario/login',(req,res)=>render(res,'login',{error:null}));
app.post('/usuario/login',(req,res)=>{
  const email=String(req.body.email||'').trim().toLowerCase();
  const pass=String(req.body.password||'');
  const user=read('users').find(u=>u.email===email);
  if(!user || !bcrypt.compareSync(pass,user.passwordHash))return res.status(401).render('login',{error:'Correo o contraseña incorrectos.'});
  req.session.regenerate(err=>{
    if(err)return res.status(500).send('Error de sesión');
    req.session.user={id:user.id,name:user.name,email:user.email};
    res.redirect('/');
  });
});
app.post('/usuario/logout',(req,res)=>req.session.destroy(()=>res.redirect('/')));
app.get('/admin',onlySignedIn,(req,res)=>render(res,'admin',{error:null,products:read('products'),categories:allowedCategories}));
app.post('/admin/productos',onlySignedIn,(req,res)=>{
  const result=validateProduct(req.body);
  if(result.error)return res.status(400).render('admin',{error:result.error,products:read('products'),categories:allowedCategories});
  const products=read('products');
  products.push({id:Math.max(0,...products.map(p=>p.id))+1,...result.product});
  write('products',products);res.redirect('/admin');
});
app.post('/admin/productos/:id/delete',onlySignedIn,(req,res)=>{
  write('products',read('products').filter(p=>p.id!==Number(req.params.id)));
  res.redirect('/admin');
});
app.get('/nosotros',(req,res)=>render(res,'about'));
app.use((req,res)=>res.status(404).render('not-found'));
app.use((err,req,res,next)=>{console.error('Application error',err.message);res.status(500).send('Ocurrió un error inesperado.');});

ensureData();
const port=Number(process.env.PORT)||3500;
if(require.main===module){app.listen(port,()=>console.log('FitHouse demo → http://localhost:'+port));}
module.exports=app;
