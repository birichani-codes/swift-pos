import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const app=express();
app.use(express.json({limit:'1mb'}));
app.use(cors({origin:process.env.CORS_ORIGIN?process.env.CORS_ORIGIN.split(',').map(x=>x.trim()):true}));
const dir=path.dirname(fileURLToPath(import.meta.url));
const file=path.join(dir,'data','demo.json');
const seed={products:[
{id:'p1',sku:'SKU-001',barcode:'6161100123456',name:'Fresh Milk 500ml',category:'Dairy',price:75,cost:54,stock:64,reorder:15,unit:'pcs',icon:'🥛'},
{id:'p2',sku:'SKU-002',barcode:'6161100123457',name:'White Bread 400g',category:'Bakery',price:70,cost:48,stock:32,reorder:12,unit:'pcs',icon:'🍞'},
{id:'p3',sku:'SKU-003',barcode:'6161100123458',name:'Rice Premium 2kg',category:'Groceries',price:420,cost:340,stock:85,reorder:20,unit:'bags',icon:'🍚'},
{id:'p4',sku:'SKU-004',barcode:'6161100123459',name:'Sugar 1kg',category:'Groceries',price:180,cost:145,stock:56,reorder:15,unit:'bags',icon:'🛍️'},
{id:'p5',sku:'SKU-005',barcode:'6161100123460',name:'Cooking Oil 1L',category:'Groceries',price:325,cost:270,stock:11,reorder:15,unit:'bottles',icon:'🫗'},
{id:'p6',sku:'SKU-006',barcode:'6161100123461',name:'Mineral Water 500ml',category:'Beverages',price:50,cost:28,stock:120,reorder:24,unit:'bottles',icon:'💧'},
{id:'p7',sku:'SKU-007',barcode:'6161100123462',name:'Black Tea 250g',category:'Beverages',price:210,cost:160,stock:8,reorder:12,unit:'packs',icon:'🍵'},
{id:'p8',sku:'SKU-008',barcode:'6161100123463',name:'Laundry Soap 800g',category:'Household',price:155,cost:112,stock:43,reorder:15,unit:'bars',icon:'🧼'}
],sales:[],movements:[],settings:{store:'Swift POS Demo Store',branch:'Main Branch',currency:'KES',receiptFooter:'Thank you for shopping with us!'}};
function read(){if(!fs.existsSync(file)){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(seed,null,2));}return JSON.parse(fs.readFileSync(file,'utf8'));}
function write(data){fs.writeFileSync(file,JSON.stringify(data,null,2));}
const bad=(res,msg,code=400)=>res.status(code).json({error:msg});
const validMoney=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
app.get('/',(_req,res)=>res.json({name:'Swift POS API',mode:'DEMO',status:'online'}));
app.get('/api/health',(_req,res)=>res.json({ok:true,mode:'DEMO',payments:'simulated',storage:'local-json'}));
app.get('/api/state',(_req,res)=>res.json({...read(),mode:'DEMO'}));
app.post('/api/products',(req,res)=>{const {name,sku,barcode,category,price,cost,stock,reorder,unit}=req.body;const d=read();if(!String(name||'').trim())return bad(res,'Product name is required');if(!String(sku||'').trim())return bad(res,'SKU is required');if(d.products.some(p=>p.sku.toLowerCase()===String(sku).trim().toLowerCase()))return bad(res,'SKU already exists');if(!validMoney(price)||!validMoney(cost)||!validMoney(stock)||!validMoney(reorder))return bad(res,'Enter valid nonnegative whole numbers');const p={id:crypto.randomUUID(),name:String(name).trim().slice(0,100),sku:String(sku).trim().slice(0,40),barcode:String(barcode||'').trim().slice(0,60),category:String(category||'Other').slice(0,60),price,cost,stock,reorder,unit:String(unit||'pcs').slice(0,20),icon:'📦'};d.products.push(p);if(stock)d.movements.unshift({id:crypto.randomUUID(),productId:p.id,product:p.name,quantity:stock,type:'opening',note:'Opening stock',date:new Date().toISOString()});write(d);res.status(201).json(p);});
app.post('/api/stock/adjust',(req,res)=>{const {productId,quantity,note}=req.body;const d=read();const p=d.products.find(x=>x.id===productId);if(!p)return bad(res,'Product not found',404);if(!Number.isSafeInteger(quantity)||quantity===0||Math.abs(quantity)>1000000)return bad(res,'Quantity must be a nonzero whole number');if(p.stock+quantity<0)return bad(res,'Insufficient stock');p.stock+=quantity;d.movements.unshift({id:crypto.randomUUID(),productId:p.id,product:p.name,quantity,type:'adjustment',note:String(note||'Manual adjustment').slice(0,150),date:new Date().toISOString()});write(d);res.json(p);});
app.post('/api/sales',(req,res)=>{const {items,paymentMethod='cash',amountTendered}=req.body;if(!Array.isArray(items)||!items.length||items.length>100)return bad(res,'A sale must contain products');if(!['cash','mpesa','card'].includes(paymentMethod))return bad(res,'Invalid payment method');const d=read();const consolidated=new Map();for(const item of items){if(!Number.isSafeInteger(item.qty)||item.qty<1||item.qty>10000)return bad(res,'Invalid quantity');consolidated.set(item.productId,(consolidated.get(item.productId)||0)+item.qty);}const saleItems=[];for(const [id,qty] of consolidated){const p=d.products.find(x=>x.id===id);if(!p)return bad(res,'Unknown product');if(p.stock<qty)return bad(res,`Insufficient stock: ${p.name}`);saleItems.push({productId:id,name:p.name,sku:p.sku,qty,price:p.price,cost:p.cost,lineTotal:qty*p.price});}const total=saleItems.reduce((s,x)=>s+x.lineTotal,0);if(paymentMethod==='cash'&&(!validMoney(amountTendered)||amountTendered<total))return bad(res,'Cash tendered must cover the total');const sale={id:crypto.randomUUID(),receiptNumber:`SP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,date:new Date().toISOString(),items:saleItems,total,paymentMethod,paymentStatus:'DEMO_SIMULATED',amountTendered:paymentMethod==='cash'?amountTendered:total,change:paymentMethod==='cash'?amountTendered-total:0,branch:d.settings.branch};for(const x of saleItems){d.products.find(p=>p.id===x.productId).stock-=x.qty;d.movements.unshift({id:crypto.randomUUID(),productId:x.productId,product:x.name,quantity:-x.qty,type:'sale',note:sale.receiptNumber,date:sale.date});}d.sales.unshift(sale);write(d);res.status(201).json(sale);});
app.post('/api/reset',(_req,res)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(seed,null,2));res.json({ok:true});});
app.listen(process.env.PORT||4000,'0.0.0.0',()=>console.log(`Swift POS DEMO API running on port ${process.env.PORT||4000}`));
