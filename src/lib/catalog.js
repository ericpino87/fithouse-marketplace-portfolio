'use strict';
const allowedCategories = Object.freeze(['Fuerza','Accesorios','Cardio','Equipamiento']);
const icons = Object.freeze({Fuerza:'🏋️', Accesorios:'🎯', Cardio:'⚡', Equipamiento:'💪'});
function peso(amount) {
  const value = Number(amount);
  return new Intl.NumberFormat('es-AR', {style:'currency',currency:'ARS', maximumFractionDigits:0}).format(Number.isFinite(value) ? value : 0);
}
function searchProducts(products, query = '', category = '') {
  const q = String(query).trim().toLocaleLowerCase('es');
  return products.filter(p => (!category || p.category === category) && (!q || [p.name,p.description,p.category].some(s => String(s||'').toLocaleLowerCase('es').includes(q))));
}
function normalizeQuantity(quantity) {
  const value = Number(quantity);
  if (!Number.isInteger(value) || value < 1 || value > 10) return null;
  return value;
}
function cartLines(cart, products) {
  return Object.entries(cart || {}).map(([id, qty]) => {
    const product = products.find(p => p.id === Number(id));
    const quantity = normalizeQuantity(qty);
    return product && quantity ? {...product, quantity, subtotal: product.price * quantity} : null;
  }).filter(Boolean);
}
function cartTotal(lines) {return lines.reduce((sum, item) => sum + item.subtotal, 0);}
function validateProduct(body) {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const category = String(body.category || '');
  const price = Number(body.price);
  if (name.length < 3 || name.length > 100) return {error:'El nombre debe tener entre 3 y 100 caracteres.'};
  if (description.length < 10 || description.length > 600) return {error:'La descripción debe tener entre 10 y 600 caracteres.'};
  if (!allowedCategories.includes(category)) return {error:'Categoría inválida.'};
  if (!Number.isFinite(price) || price < 1 || price > 100000000) return {error:'Precio inválido.'};
  return {product:{name, description, category, price:Math.round(price),stock:10,emoji:icons[category]}};
}
module.exports={allowedCategories,icons,peso,searchProducts,normalizeQuantity,cartLines,cartTotal,validateProduct};
