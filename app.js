// Sozlamalarni config.js dan olamiz (agar topilmasa, zaxira qiymatlar)
const FIXED_ADMIN_PASS = window.ENV?.ADMIN_PASSWORD || "bahrom12";
let isAdminLoggedIn = false;

// Promokodlar va summalari
const FIXED_PROMOS = window.ENV?.PROMOS || {
  "BAHROM": 10000,
  "SHAHZODA": 12000,
  "FARANGIZ": 8000,
  "GULBAHOR": 9000
};

let appliedPromo = {
  code: null,
  discount: 0
};

// Standart sara menyu
const DEFAULT_DISHES = [
  { id: 'd1', name: "Shahzoda To'y Oshi", price: 38000, stock: 25, category: '2-taom', desc: "Maxsus qo'y go'shti, devzira guruch va sariq sabzi", img: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80" },
  { id: 'd2', name: "Yakkabog' Qozon Kabob", price: 48000, stock: 18, category: '2-taom', desc: "Qarsildoq go'sht, qovurilgan kartoshkalar bilan", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80" },
  { id: 'd3', name: "Shohona Qo'y Sho'rva", price: 32000, stock: 15, category: '1-taom', desc: "Tiniq sho'rva, darmonli sabzavotlar va mayin go'sht", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80" },
  { id: 'd4', name: "Qo'lda Cho'zilgan Lag'mon", price: 34000, stock: 20, category: '1-taom', desc: "Shirin qayla, qizil qalampir va sarxil ko'katlar", img: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80" },
  { id: 'd5', name: "Achichiq Salad", price: 12000, stock: 35, category: 'salat', desc: "Yangi pomidor, bodring, piyoz va rayhon", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80" },
  { id: 'd6', name: "Suzmali Shahzoda Salati", price: 14000, stock: 22, category: 'salat', desc: "Tog' rayhoni, sarimsoq va muzdek suzma", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" },
  { id: 'd7', name: "Tandir Non (Issiq)", price: 5000, stock: 50, category: 'ichimlik', desc: "Yakkabog' tandirida pishgan shirmoy non", img: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80" },
  { id: 'd8', name: "Ko'k Choy (Choynakda)", price: 4000, stock: 100, category: 'ichimlik', desc: "Tog' giyohlari bilan damlangan xushbo'y choy", img: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80" }
];

let syncChannel;
try {
  syncChannel = new BroadcastChannel('shahzoda_realtime_sync');
  syncChannel.onmessage = (event) => {
    if (event.data === 'sync_all') reloadAllState();
  };
} catch (e) {}

window.addEventListener('storage', () => {
  reloadAllState();
});

function broadcastChange() {
  try {
    if (syncChannel) syncChannel.postMessage('sync_all');
  } catch (e) {}
  reloadAllState();
}

let dishes = [];
let cart = [];
let orders = [];
let expenses = [];
let usedPromoPhones = [];
let currentCategory = 'all';

// Lucide ikonkalarini xatolarsiz xavfsiz chaqirish
function safeCreateIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

// QAT'IY TELEFON RAQAM FORMATLASH VA NAZORATI:
function handlePhoneInput(input) {
  if (!input) return;
  let digits = input.value.replace(/\D/g, '');

  if (digits.startsWith('998')) {
    digits = digits.substring(3);
  }

  digits = digits.substring(0, 9);

  const counterEl = document.getElementById('phoneDigitCounter');
  const errEl = document.getElementById('phoneErrorMsg');
  
  if (counterEl) {
    counterEl.innerText = `${digits.length} / 9 raqam`;
    if (digits.length === 9) {
      counterEl.className = 'text-emerald-400 font-mono text-[10px] font-bold';
      if (errEl) errEl.classList.add('hidden');
    } else {
      counterEl.className = 'text-gray-400 font-mono text-[10px]';
    }
  }

  let formatted = '+998';
  if (digits.length > 0) {
    formatted += ' (' + digits.substring(0, 2);
  }
  if (digits.length >= 2) {
    formatted += ') ';
  }
  if (digits.length > 2) {
    formatted += digits.substring(2, 5);
  }
  if (digits.length >= 5) {
    formatted += '-';
  }
  if (digits.length > 5) {
    formatted += digits.substring(5, 7);
  }
  if (digits.length >= 7) {
    formatted += '-';
  }
  if (digits.length > 7) {
    formatted += digits.substring(7, 9);
  }

  input.value = formatted;
}

function getRawPhoneDigits(phoneValue) {
  if (!phoneValue) return '';
  let digits = phoneValue.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.substring(3);
  }
  return digits;
}

window.addEventListener('DOMContentLoaded', async () => {
  // 1. Supabase mijozini ishga tushirish
  if (window.DB && typeof window.DB.init === 'function') {
    window.DB.init();
  }

  // 2. Keshdan tezkor ma'lumotlarni yuklab ekranga chiqarish
  initHeaderPhone();
  loadStorageData();
  updateSupabaseStatusUI();
  renderDishes();
  renderCart();
  updateStats();
  safeCreateIcons();

  // 3. Supabase bilan to'liq sinxronizatsiya
  await syncFromSupabase();

  // 4. Realtime o'zgarishlarga obuna bo'lish
  if (window.DB && typeof window.DB.subscribe === 'function') {
    window.DB.subscribe(() => {
      syncFromSupabase();
    });
  }
});

function initHeaderPhone() {
  const phone = window.ENV?.RESTAURANT_PHONE || "+998 90 123 45 67";
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const linkEl = document.getElementById('headerPhoneLink');
  const textEl = document.getElementById('headerPhoneText');
  if (linkEl) linkEl.href = `tel:${cleanPhone}`;
  if (textEl) textEl.innerText = phone;
}

function updateSupabaseStatusUI() {
  const badge = document.getElementById('supabaseStatusBadge');
  if (!badge) return;
  if (window.DB && window.DB.isConfigured()) {
    badge.className = 'text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1';
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Supabase: Ulangan`;
  } else {
    badge.className = 'text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30';
    badge.innerText = '🟠 Supabase: Lokal rejim';
  }
}

async function syncFromSupabase() {
  if (!window.DB || !window.DB.isConfigured()) return;

  try {
    // Taomlarni olish
    const dbDishes = await window.DB.getDishes();
    if (dbDishes) {
      if (dbDishes.length === 0 && dishes.length > 0) {
        for (const d of dishes) {
          await window.DB.upsertDish(d);
        }
      } else if (dbDishes.length > 0) {
        dishes = dbDishes;
        localStorage.setItem('sh_dishes', JSON.stringify(dishes));
      }
    }

    // Buyurtmalarni olish
    const dbOrders = await window.DB.getOrders();
    if (dbOrders) {
      orders = dbOrders;
      localStorage.setItem('sh_orders', JSON.stringify(orders));
    }

    // Xarajatlarni olish
    const dbExpenses = await window.DB.getExpenses();
    if (dbExpenses) {
      expenses = dbExpenses;
      localStorage.setItem('sh_expenses', JSON.stringify(expenses));
    }

    // Ishlatilgan promokod telefonlarini olish
    const dbPhones = await window.DB.getUsedPhones();
    if (dbPhones) {
      usedPromoPhones = dbPhones;
      localStorage.setItem('sh_used_phones', JSON.stringify(usedPromoPhones));
    }

    renderDishes();
    renderCart();
    if (isAdminLoggedIn) {
      renderAdminDishes();
      renderAdminOrders();
      renderExpenses();
      updateStats();
    }
    updateSupabaseStatusUI();
    safeCreateIcons();
  } catch (err) {
    console.error("Supabase sinxronlashda xatolik:", err);
  }
}

function loadStorageData() {
  try {
    const savedDishes = localStorage.getItem('sh_dishes');
    dishes = savedDishes ? JSON.parse(savedDishes) : [...DEFAULT_DISHES];
  } catch (e) { dishes = [...DEFAULT_DISHES]; }

  try {
    const savedCart = localStorage.getItem('sh_cart');
    cart = savedCart ? JSON.parse(savedCart) : [];
  } catch (e) { cart = []; }

  try {
    const savedOrders = localStorage.getItem('sh_orders');
    orders = savedOrders ? JSON.parse(savedOrders) : [];
  } catch (e) { orders = []; }

  try {
    const savedExp = localStorage.getItem('sh_expenses');
    expenses = savedExp ? JSON.parse(savedExp) : [];
  } catch (e) { expenses = []; }

  try {
    const savedPhones = localStorage.getItem('sh_used_phones');
    usedPromoPhones = savedPhones ? JSON.parse(savedPhones) : [];
  } catch (e) { usedPromoPhones = []; }
}

function reloadAllState() {
  loadStorageData();
  renderDishes();
  renderCart();
  if (isAdminLoggedIn) {
    renderAdminDishes();
    renderAdminOrders();
    renderExpenses();
    updateStats();
  }
  updateSupabaseStatusUI();
  safeCreateIcons();
}

function renderDishes() {
  const grid = document.getElementById('dishesGrid');
  if (!grid) return;

  const filtered = currentCategory === 'all' 
    ? dishes 
    : dishes.filter(d => d.category === currentCategory);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400 text-xs">Ushbu bo'limda taomlar mavjud emas.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(dish => {
    const inCartItem = cart.find(c => c.id === dish.id);
    const inCartCount = inCartItem ? inCartItem.qty : 0;
    const isOutOfStock = dish.stock <= 0;

    return `
      <div class="bg-brand-card rounded-2xl md:rounded-3xl border border-brand-border overflow-hidden flex flex-col justify-between hover:border-brand-gold/40 transition group">
        <div class="relative aspect-video w-full overflow-hidden bg-black/40">
          <img src="${dish.img || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'}" alt="${dish.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
          <div class="absolute top-2 right-2">
            ${isOutOfStock 
              ? `<span class="px-2 py-0.5 rounded-full bg-rose-500/90 text-white text-[10px] font-bold">Tugagan</span>`
              : `<span class="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-amber-300 text-[10px] font-semibold">${dish.stock} ta qoldi</span>`
            }
          </div>
        </div>

        <div class="p-3 md:p-4 flex-1 flex flex-col justify-between">
          <div>
            <h4 class="font-bold text-white text-xs md:text-sm line-clamp-1 mb-1">${dish.name}</h4>
            <p class="text-[11px] text-gray-400 line-clamp-2 leading-relaxed mb-3">${dish.desc || ''}</p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-brand-border/60">
            <span class="font-extrabold text-brand-gold text-xs md:text-sm">${dish.price.toLocaleString()} so'm</span>

            ${isOutOfStock 
              ? `<button disabled class="p-2 rounded-xl bg-gray-800 text-gray-500 text-xs cursor-not-allowed">Yo'q</button>`
              : inCartCount > 0 
                ? `
                  <div class="flex items-center gap-1.5 bg-black/80 border border-brand-gold/50 rounded-xl px-1.5 py-1">
                    <button onclick="changeQty('${dish.id}', -1)" class="w-5 h-5 flex items-center justify-center text-brand-gold hover:text-white font-bold text-sm">-</button>
                    <span class="text-xs font-bold text-white px-1">${inCartCount}</span>
                    <button onclick="changeQty('${dish.id}', 1)" class="w-5 h-5 flex items-center justify-center text-brand-gold hover:text-white font-bold text-sm">+</button>
                  </div>
                `
                : `
                  <button onclick="addToCart('${dish.id}')" class="px-2.5 py-1.5 rounded-xl gold-btn-gradient text-xs font-bold flex items-center gap-1">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                    <span>Qo'shish</span>
                  </button>
                `
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
  safeCreateIcons();
}

function setCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    if (btn.dataset.category === cat) {
      btn.className = 'cat-pill active px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap';
    } else {
      btn.className = 'cat-pill px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap bg-brand-card hover:bg-brand-cardHover border border-brand-border text-gray-300';
    }
  });
  renderDishes();
}

function addToCart(dishId) {
  const dish = dishes.find(d => d.id === dishId);
  if (!dish || dish.stock <= 0) return;

  const existing = cart.find(c => c.id === dishId);
  if (existing) {
    if (existing.qty < dish.stock) {
      existing.qty += 1;
    } else {
      alert(`Kechirasiz! Omborda boshqa porsiya qolmagan (Jami: ${dish.stock} ta).`);
      return;
    }
  } else {
    cart.push({ id: dish.id, name: dish.name, price: dish.price, qty: 1, img: dish.img });
  }
  saveCart();
}

function changeQty(dishId, delta) {
  const itemIndex = cart.findIndex(c => c.id === dishId);
  if (itemIndex === -1) return;

  const dish = dishes.find(d => d.id === dishId);
  const newQty = cart[itemIndex].qty + delta;

  if (newQty <= 0) {
    cart.splice(itemIndex, 1);
  } else {
    if (dish && newQty > dish.stock) {
      alert(`Kechirasiz! Omborda faqat ${dish.stock} ta mavjud.`);
      return;
    }
    cart[itemIndex].qty = newQty;
  }
  saveCart();
}

function saveCart() {
  localStorage.setItem('sh_cart', JSON.stringify(cart));
  renderCart();
  renderDishes();
}

function renderCart() {
  const list = document.getElementById('cartItemsList');
  const badge1 = document.getElementById('headerCartCount');
  const badge2 = document.getElementById('bottomCartBadge');
  const countBadge = document.getElementById('cartCountBadge');
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl = document.getElementById('cartTotal');

  const totalCount = cart.reduce((acc, c) => acc + c.qty, 0);
  const subtotal = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);
  const delivery = cart.length > 0 ? 10000 : 0;
  const total = subtotal > 0 ? subtotal + delivery : 0;

  if (badge1) badge1.innerText = totalCount;
  if (badge2) badge2.innerText = totalCount;
  if (countBadge) countBadge.innerText = `${totalCount} ta`;
  if (subtotalEl) subtotalEl.innerText = `${subtotal.toLocaleString()} so'm`;
  if (totalEl) totalEl.innerText = `${total.toLocaleString()} so'm`;

  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="py-12 text-center text-gray-500">
        <i data-lucide="shopping-bag" class="w-10 h-10 mx-auto mb-2 opacity-30"></i>
        <p class="text-xs">Savatchangiz bo'sh</p>
      </div>
    `;
    safeCreateIcons();
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="p-2.5 rounded-2xl bg-black/40 border border-brand-border flex items-center justify-between gap-3">
      <img src="${item.img || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=150&q=80'}" class="w-12 h-12 rounded-xl object-cover">
      <div class="flex-1 min-w-0">
        <h5 class="text-xs font-bold text-white truncate">${item.name}</h5>
        <p class="text-[11px] text-brand-gold font-semibold">${item.price.toLocaleString()} so'm</p>
      </div>
      <div class="flex items-center gap-1.5 bg-black border border-brand-border rounded-xl px-1.5 py-1">
        <button onclick="changeQty('${item.id}', -1)" class="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white font-bold text-xs">-</button>
        <span class="text-xs font-bold text-white px-1">${item.qty}</span>
        <button onclick="changeQty('${item.id}', 1)" class="w-5 h-5 flex items-center justify-center text-brand-gold hover:text-white font-bold text-xs">+</button>
      </div>
    </div>
  `).join('');
  safeCreateIcons();
}

function toggleCart(show) {
  const modal = document.getElementById('cartModal');
  if (modal) {
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
  }
}

// PROMOKOD QO'LLASH
function applyPromoCode() {
  const phoneInput = document.getElementById('custPhone');
  const promoInput = document.getElementById('promoCodeInput');
  const msgEl = document.getElementById('promoMessage');
  const errEl = document.getElementById('phoneErrorMsg');

  if (!phoneInput || !promoInput || !msgEl) return;

  const codeInput = promoInput.value.trim().toUpperCase();
  msgEl.classList.remove('hidden', 'text-emerald-400', 'text-rose-400');

  const rawDigits = getRawPhoneDigits(phoneInput.value);

  if (rawDigits.length !== 9) {
    msgEl.classList.add('text-rose-400');
    msgEl.innerText = "Iltimos, avval 9 xonali telefon raqamingizni to'liq kiriting!";
    if (errEl) errEl.classList.remove('hidden');
    phoneInput.focus();
    return;
  }
  if (errEl) errEl.classList.add('hidden');

  if (usedPromoPhones.includes(rawDigits)) {
    msgEl.classList.add('text-rose-400');
    msgEl.innerText = "Kechirasiz, ushbu telefon raqamidan promokod avval ishlatilgan!";
    appliedPromo = { code: null, discount: 0 };
    updateCheckoutTotals();
    return;
  }

  if (FIXED_PROMOS[codeInput]) {
    appliedPromo = {
      code: codeInput,
      discount: FIXED_PROMOS[codeInput]
    };
    msgEl.classList.add('text-emerald-400');
    msgEl.innerText = `Qabul qilindi! "${codeInput}" promokodi: -${appliedPromo.discount.toLocaleString()} so'm chegirma!`;
  } else {
    appliedPromo = { code: null, discount: 0 };
    msgEl.classList.add('text-rose-400');
    msgEl.innerText = "Bunday promokod mavjud emas!";
  }

  updateCheckoutTotals();
}

function updateCheckoutTotals() {
  const subtotal = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);
  const delivery = cart.length > 0 ? 10000 : 0;
  const discount = appliedPromo.discount || 0;
  const finalTotal = Math.max(0, subtotal + delivery - discount);

  const subtotalEl = document.getElementById('checkoutSubtotal');
  const discountRow = document.getElementById('checkoutDiscountRow');
  const discountVal = document.getElementById('checkoutDiscountVal');
  const finalEl = document.getElementById('checkoutFinalTotal');

  if (subtotalEl) subtotalEl.innerText = `${subtotal.toLocaleString()} so'm`;
  
  if (discount > 0) {
    if (discountRow) discountRow.classList.remove('hidden');
    if (discountVal) discountVal.innerText = `-${discount.toLocaleString()} so'm`;
  } else {
    if (discountRow) discountRow.classList.add('hidden');
  }

  if (finalEl) finalEl.innerText = `${finalTotal.toLocaleString()} so'm`;
}

function openCheckoutModal() {
  if (cart.length === 0) {
    alert("Savatchangiz bo'sh!");
    return;
  }
  toggleCart(false);

  appliedPromo = { code: null, discount: 0 };
  const promoInp = document.getElementById('promoCodeInput');
  const msgEl = document.getElementById('promoMessage');
  const errEl = document.getElementById('phoneErrorMsg');
  const phoneInp = document.getElementById('custPhone');
  const counterEl = document.getElementById('phoneDigitCounter');

  if (promoInp) promoInp.value = '';
  if (msgEl) msgEl.classList.add('hidden');
  if (errEl) errEl.classList.add('hidden');
  if (phoneInp) phoneInp.value = '';
  if (counterEl) {
    counterEl.innerText = '0 / 9 raqam';
    counterEl.className = 'text-gray-400 font-mono text-[10px]';
  }

  updateCheckoutTotals();
  const chModal = document.getElementById('checkoutModal');
  if (chModal) chModal.classList.remove('hidden');
  safeCreateIcons();
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.add('hidden');
}

function submitOrder(event) {
  event.preventDefault();

  const nameInput = document.getElementById('custName');
  const phoneInput = document.getElementById('custPhone');
  const addressInput = document.getElementById('custAddressText');
  const changeInput = document.getElementById('custChange');
  const errEl = document.getElementById('phoneErrorMsg');

  const name = nameInput ? nameInput.value.trim() : '';
  const phoneValue = phoneInput ? phoneInput.value.trim() : '';
  const addressText = addressInput ? addressInput.value.trim() : '';
  const change = changeInput ? changeInput.value.trim() : '';

  const rawDigits = getRawPhoneDigits(phoneValue);

  if (rawDigits.length !== 9) {
    if (errEl) errEl.classList.remove('hidden');
    if (phoneInput) phoneInput.focus();
    return;
  }
  if (errEl) errEl.classList.add('hidden');

  if (!name || !addressText) {
    alert("Iltimos, barcha majburiy maydonlarni to'ldiring!");
    return;
  }

  if (appliedPromo.code && appliedPromo.discount > 0) {
    if (usedPromoPhones.includes(rawDigits)) {
      alert("Kechirasiz! Ushbu raqam promokoddan avval foydalangan. Qayta ishlatib bo'lmaydi.");
      return;
    }
    usedPromoPhones.push(rawDigits);
    localStorage.setItem('sh_used_phones', JSON.stringify(usedPromoPhones));
  }

  cart.forEach(cartItem => {
    const dish = dishes.find(d => d.id === cartItem.id);
    if (dish) {
      dish.stock = Math.max(0, dish.stock - cartItem.qty);
    }
  });
  localStorage.setItem('sh_dishes', JSON.stringify(dishes));

  const subtotal = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);
  const delivery = 10000;
  const discount = appliedPromo.discount || 0;
  const total = Math.max(0, subtotal + delivery - discount);

  const orderId = 'SH-' + Math.floor(1000 + Math.random() * 9000);
  const newOrder = {
    id: orderId,
    date: new Date().toISOString(),
    customer: { name, phone: phoneValue, rawDigits },
    address: { fullText: addressText },
    items: [...cart],
    subtotal,
    delivery,
    discount,
    promoCode: appliedPromo.code || null,
    total,
    changeNotice: change || "Kerak emas / Aniqlanmagan",
    status: "Kutilmoqda"
  };

  orders.unshift(newOrder);
  localStorage.setItem('sh_orders', JSON.stringify(orders));

  // Supabase bulut bazasiga saqlash
  if (window.DB && window.DB.isConfigured()) {
    window.DB.insertOrder(newOrder);
    cart.forEach(cartItem => {
      const dish = dishes.find(d => d.id === cartItem.id);
      if (dish) {
        window.DB.updateDishStock(dish.id, dish.stock);
      }
    });
    if (appliedPromo.code && appliedPromo.discount > 0) {
      window.DB.insertUsedPhone(rawDigits);
    }
  }

  cart = [];
  appliedPromo = { code: null, discount: 0 };
  localStorage.removeItem('sh_cart');

  broadcastChange();

  closeCheckoutModal();
  
  const recId = document.getElementById('recId');
  const recName = document.getElementById('recName');
  const recPhone = document.getElementById('recPhone');
  const recAddress = document.getElementById('recAddress');
  const recDiscount = document.getElementById('recDiscount');
  const recTotal = document.getElementById('recTotal');
  const receiptModal = document.getElementById('receiptModal');

  if (recId) recId.innerText = orderId;
  if (recName) recName.innerText = name;
  if (recPhone) recPhone.innerText = phoneValue;
  if (recAddress) recAddress.innerText = addressText;
  if (recDiscount) recDiscount.innerText = discount > 0 ? `-${discount.toLocaleString()} so'm (${newOrder.promoCode})` : `0 so'm`;
  if (recTotal) recTotal.innerText = `${total.toLocaleString()} so'm`;
  if (receiptModal) receiptModal.classList.remove('hidden');
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.add('hidden');
  switchTab('client-view');
}

// ADMIN PAROLI VA BOSHQARUVI
function openAdminModal() {
  if (isAdminLoggedIn) {
    switchTab('admin-view');
  } else {
    const err = document.getElementById('adminLoginError');
    const input = document.getElementById('adminPasswordInput');
    const modal = document.getElementById('adminLoginModal');
    if (err) err.classList.add('hidden');
    if (input) input.value = '';
    if (modal) modal.classList.remove('hidden');
  }
}

function closeAdminLoginModal() {
  const modal = document.getElementById('adminLoginModal');
  if (modal) modal.classList.add('hidden');
}

function handleAdminLogin(e) {
  e.preventDefault();
  const input = document.getElementById('adminPasswordInput');
  const enteredPass = input ? input.value.trim() : '';
  const err = document.getElementById('adminLoginError');

  if (enteredPass === FIXED_ADMIN_PASS) {
    isAdminLoggedIn = true;
    closeAdminLoginModal();
    switchTab('admin-view');
  } else {
    if (err) err.classList.remove('hidden');
  }
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  switchTab('client-view');
}

function switchTab(viewId) {
  if (viewId === 'admin-view' && !isAdminLoggedIn) {
    openAdminModal();
    return;
  }
  const clientView = document.getElementById('client-view');
  const adminView = document.getElementById('admin-view');

  if (clientView) clientView.classList.toggle('hidden', viewId !== 'client-view');
  if (adminView) adminView.classList.toggle('hidden', viewId !== 'admin-view');

  if (viewId === 'admin-view') {
    renderAdminDishes();
    renderAdminOrders();
    renderExpenses();
    updateStats();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setAdminTab(tabName) {
  document.querySelectorAll('.adm-tab').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.className = 'adm-tab px-4 py-2 rounded-xl text-xs font-bold transition bg-brand-gold text-brand-dark';
    } else {
      btn.className = 'adm-tab px-4 py-2 rounded-xl text-xs font-bold transition bg-brand-card border border-brand-border text-gray-300';
    }
  });

  const fin = document.getElementById('adm-finance');
  const st = document.getElementById('adm-stock');
  const ord = document.getElementById('adm-orders');

  if (fin) fin.classList.toggle('hidden', tabName !== 'finance');
  if (st) st.classList.toggle('hidden', tabName !== 'stock');
  if (ord) ord.classList.toggle('hidden', tabName !== 'orders');
}

// ADMIN OMBOR & TAOMLAR
function renderAdminDishes() {
  const table = document.getElementById('adminDishesTable');
  if (!table) return;

  table.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-gray-300">
        <thead class="bg-black/50 text-gray-400 border-b border-brand-border">
          <tr>
            <th class="p-3">Taom</th>
            <th class="p-3">Kategoriya</th>
            <th class="p-3">Narxi</th>
            <th class="p-3">Porsiya (Ombor)</th>
            <th class="p-3 text-right">Amallar</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-border/60">
          ${dishes.map(d => `
            <tr class="hover:bg-white/5 transition">
              <td class="p-3 flex items-center gap-2">
                <img src="${d.img || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=100&q=80'}" class="w-8 h-8 rounded-lg object-cover">
                <span class="font-bold text-white">${d.name}</span>
              </td>
              <td class="p-3 text-gray-400 capitalize">${d.category}</td>
              <td class="p-3 font-semibold text-brand-gold">${d.price.toLocaleString()} so'm</td>
              <td class="p-3">
                <div class="flex items-center gap-1.5">
                  <button onclick="quickStockChange('${d.id}', -1)" class="w-6 h-6 rounded bg-black border border-brand-border flex items-center justify-center font-bold text-gray-300 hover:text-white">-</button>
                  <span class="font-bold text-white px-1.5">${d.stock}</span>
                  <button onclick="quickStockChange('${d.id}', 1)" class="w-6 h-6 rounded bg-black border border-brand-border flex items-center justify-center font-bold text-brand-gold hover:text-white">+</button>
                  <button onclick="quickStockChange('${d.id}', 5)" class="px-1.5 py-0.5 rounded bg-brand-gold/10 text-brand-gold text-[10px] font-bold">+5</button>
                </div>
              </td>
              <td class="p-3 text-right space-x-1">
                <button onclick="editDish('${d.id}')" class="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                <button onclick="deleteDish('${d.id}')" class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  safeCreateIcons();
}

function quickStockChange(dishId, delta) {
  const dish = dishes.find(d => d.id === dishId);
  if (dish) {
    dish.stock = Math.max(0, dish.stock + delta);
    localStorage.setItem('sh_dishes', JSON.stringify(dishes));
    if (window.DB && window.DB.isConfigured()) {
      window.DB.updateDishStock(dish.id, dish.stock);
    }
    broadcastChange();
  }
}

function openDishModal(dish = null) {
  const idEl = document.getElementById('dishEditId');
  const titleEl = document.getElementById('dishModalTitle');
  const nameEl = document.getElementById('dishNameInput');
  const priceEl = document.getElementById('dishPriceInput');
  const stockEl = document.getElementById('dishStockInput');
  const catEl = document.getElementById('dishCatInput');
  const imgEl = document.getElementById('dishImageInput');
  const descEl = document.getElementById('dishDescInput');
  const modal = document.getElementById('dishModal');

  if (idEl) idEl.value = dish ? dish.id : '';
  if (titleEl) titleEl.innerText = dish ? "Taomni Tahrirlash" : "Yangi Taom Qo'shish";
  if (nameEl) nameEl.value = dish ? dish.name : '';
  if (priceEl) priceEl.value = dish ? dish.price : '';
  if (stockEl) stockEl.value = dish ? dish.stock : '20';
  if (catEl) catEl.value = dish ? dish.category : '2-taom';
  if (imgEl) imgEl.value = dish ? (dish.img || '') : '';
  if (descEl) descEl.value = dish ? (dish.desc || '') : '';

  if (modal) modal.classList.remove('hidden');
}

function closeDishModal() {
  const modal = document.getElementById('dishModal');
  if (modal) modal.classList.add('hidden');
}

function editDish(id) {
  const dish = dishes.find(d => d.id === id);
  if (dish) openDishModal(dish);
}

function deleteDish(id) {
  if (confirm("Haqiqatan ham ushbu taomni menyudan o'chirmoqchimisiz?")) {
    dishes = dishes.filter(d => d.id !== id);
    localStorage.setItem('sh_dishes', JSON.stringify(dishes));
    if (window.DB && window.DB.isConfigured()) {
      window.DB.deleteDish(id);
    }
    broadcastChange();
  }
}

function saveDishForm(e) {
  e.preventDefault();
  const id = document.getElementById('dishEditId')?.value;
  const name = document.getElementById('dishNameInput')?.value.trim();
  const price = parseInt(document.getElementById('dishPriceInput')?.value) || 0;
  const stock = parseInt(document.getElementById('dishStockInput')?.value) || 0;
  const category = document.getElementById('dishCatInput')?.value || '2-taom';
  const img = document.getElementById('dishImageInput')?.value.trim() || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80';
  const desc = document.getElementById('dishDescInput')?.value.trim() || '';

  if (!name) return;

  let savedDish = null;
  if (id) {
    const index = dishes.findIndex(d => d.id === id);
    if (index !== -1) {
      dishes[index] = { ...dishes[index], name, price, stock, category, img, desc };
      savedDish = dishes[index];
    }
  } else {
    savedDish = {
      id: 'd_' + Date.now(),
      name, price, stock, category, img, desc
    };
    dishes.push(savedDish);
  }

  localStorage.setItem('sh_dishes', JSON.stringify(dishes));
  if (window.DB && window.DB.isConfigured() && savedDish) {
    window.DB.upsertDish(savedDish);
  }
  closeDishModal();
  broadcastChange();
}

// ADMIN BUYURTMALAR
function renderAdminOrders() {
  const list = document.getElementById('adminOrdersList');
  const countEl = document.getElementById('adminOrdersCount');
  if (countEl) countEl.innerText = `${orders.length} ta buyurtma`;
  if (!list) return;

  if (orders.length === 0) {
    list.innerHTML = `<div class="p-6 bg-brand-card rounded-2xl border border-brand-border text-center text-xs text-gray-500">Hozircha buyurtmalar yo'q</div>`;
    return;
  }

  list.innerHTML = orders.map(ord => `
    <div class="bg-brand-card p-4 rounded-2xl border border-brand-border space-y-3">
      <div class="flex items-center justify-between border-b border-brand-border pb-2">
        <div>
          <span class="font-bold text-white text-sm">${ord.id}</span>
          <span class="text-xs text-gray-400 ml-2">${new Date(ord.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          ${ord.promoCode ? `<span class="ml-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">Promokod: ${ord.promoCode} (-${ord.discount.toLocaleString()} so'm)</span>` : ''}
        </div>
        <select onchange="updateOrderStatus('${ord.id}', this.value)" class="px-2.5 py-1 rounded-xl bg-black border border-brand-border text-xs font-bold ${
          ord.status === 'Yetkazildi' ? 'text-emerald-400' : 'text-amber-400'
        } outline-none">
          <option value="Kutilmoqda" ${ord.status === 'Kutilmoqda' ? 'selected' : ''}>Kutilmoqda</option>
          <option value="Tayyorlanmoqda" ${ord.status === 'Tayyorlanmoqda' ? 'selected' : ''}>Tayyorlanmoqda</option>
          <option value="Kuryerda" ${ord.status === 'Kuryerda' ? 'selected' : ''}>Yo'lda (Kuryerda)</option>
          <option value="Yetkazildi" ${ord.status === 'Yetkazildi' ? 'selected' : ''}>Yetkazildi</option>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div>
          <p class="text-gray-400">Mijoz: <span class="text-white font-bold">${ord.customer.name}</span> (<a href="tel:${ord.customer.phone}" class="text-blue-400 underline font-mono font-semibold">${ord.customer.phone}</a>)</p>
          <p class="text-gray-400 mt-1">Aniq Manzil: <span class="text-amber-200 font-semibold">${ord.address.fullText}</span></p>
        </div>
        <div>
          <p class="text-gray-400">Qaytim so'rovi: <span class="text-white font-medium">${ord.changeNotice}</span></p>
          <p class="text-gray-400 mt-1">Jami Summa: <span class="text-brand-gold font-bold text-sm">${ord.total.toLocaleString()} so'm</span> (Naqd)</p>
        </div>
      </div>

      <div class="p-2.5 rounded-xl bg-black/40 border border-brand-border/60 text-[11px] text-gray-300">
        ${ord.items.map(i => `${i.name} (${i.qty}x)`).join(', ')}
      </div>
    </div>
  `).join('');
}

function updateOrderStatus(orderId, newStatus) {
  const ord = orders.find(o => o.id === orderId);
  if (ord) {
    ord.status = newStatus;
    localStorage.setItem('sh_orders', JSON.stringify(orders));
    if (window.DB && window.DB.isConfigured()) {
      window.DB.updateOrderStatus(orderId, newStatus);
    }
    broadcastChange();
  }
}

// MOLIYA & CHIQIMLAR
function addExpense(e) {
  e.preventDefault();
  const descInput = document.getElementById('expDesc');
  const amountInput = document.getElementById('expAmount');
  const categoryInput = document.getElementById('expCategory');

  const desc = descInput ? descInput.value.trim() : '';
  const amount = amountInput ? (parseInt(amountInput.value) || 0) : 0;
  const category = categoryInput ? categoryInput.value : 'Boshqa';

  if (!desc || amount <= 0) return;

  const newExp = {
    id: 'exp_' + Date.now(),
    date: new Date().toISOString(),
    desc,
    amount,
    category
  };

  expenses.unshift(newExp);
  localStorage.setItem('sh_expenses', JSON.stringify(expenses));
  if (window.DB && window.DB.isConfigured()) {
    window.DB.insertExpense(newExp);
  }

  if (descInput) descInput.value = '';
  if (amountInput) amountInput.value = '';

  broadcastChange();
}

function renderExpenses() {
  const list = document.getElementById('expenseList');
  if (!list) return;

  if (expenses.length === 0) {
    list.innerHTML = `<p class="text-gray-500 py-3 text-center">Xarajatlar kiritilmagan</p>`;
    return;
  }

  list.innerHTML = expenses.map(exp => `
    <div class="p-2 rounded-xl bg-black/40 border border-brand-border flex items-center justify-between">
      <div>
        <span class="text-white font-semibold">${exp.desc}</span>
        <span class="text-[10px] text-gray-400 ml-2">(${exp.category})</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-bold text-rose-400">-${exp.amount.toLocaleString()} so'm</span>
        <button onclick="deleteExpense('${exp.id}')" class="text-gray-500 hover:text-rose-400 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
      </div>
    </div>
  `).join('');
  safeCreateIcons();
}

function deleteExpense(expId) {
  expenses = expenses.filter(e => e.id !== expId);
  localStorage.setItem('sh_expenses', JSON.stringify(expenses));
  if (window.DB && window.DB.isConfigured()) {
    window.DB.deleteExpense(expId);
  }
  broadcastChange();
}

function updateStats() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const dailyRev = orders
    .filter(o => o.date && o.date.startsWith(todayStr))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const dailyExp = expenses
    .filter(e => e.date && e.date.startsWith(todayStr))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const monthlyRev = orders
    .filter(o => o.date && o.date.startsWith(currentMonthStr))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const monthlyExp = expenses
    .filter(e => e.date && e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const dRevEl = document.getElementById('statDailyRevenue');
  const dExpEl = document.getElementById('statDailyExpense');
  const dProfEl = document.getElementById('statDailyProfit');
  const mProfEl = document.getElementById('statMonthlyProfit');

  if (dRevEl) dRevEl.innerText = `${dailyRev.toLocaleString()} so'm`;
  if (dExpEl) dExpEl.innerText = `${dailyExp.toLocaleString()} so'm`;
  if (dProfEl) dProfEl.innerText = `${(dailyRev - dailyExp).toLocaleString()} so'm`;
  if (mProfEl) mProfEl.innerText = `${(monthlyRev - monthlyExp).toLocaleString()} so'm`;
}