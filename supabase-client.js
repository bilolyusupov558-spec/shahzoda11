// ============================================================
// supabase-client.js - Supabase ulanish va API moduli
// Shahzoda Restarani
// ============================================================

(function () {
  let client = null;
  let isConfigured = false;

  // Supabase mijozini ishga tushirish
  function initSupabase() {
    const url = window.ENV?.SUPABASE_URL;
    const key = window.ENV?.SUPABASE_ANON_KEY;

    if (
      url &&
      key &&
      !url.includes("SIZNING_LOYIHA_ID") &&
      !key.includes("SIZNING_ANON_KEY") &&
      typeof window.supabase !== "undefined"
    ) {
      try {
        client = window.supabase.createClient(url, key);
        isConfigured = true;
        console.log("✅ Supabase muvaffaqiyatli ulandi!");
      } catch (err) {
        console.warn("⚠️ Supabase ulanishida xatolik:", err);
        isConfigured = false;
      }
    } else {
      console.log("ℹ️ Supabase kalitlari kiritilmagan. Lokal (localStorage) rejimida ishlanmoqda.");
      isConfigured = false;
    }
  }

  // --- TAOMLAR (DISHES) ---
  async function dbGetDishes() {
    if (!isConfigured || !client) return null;
    try {
      const { data, error } = await client
        .from('dishes')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Supabase dishes yuklash xatosi:", e);
      return null;
    }
  }

  async function dbUpsertDish(dish) {
    if (!isConfigured || !client) return false;
    try {
      const payload = {
        id: dish.id,
        name: dish.name,
        price: dish.price,
        stock: dish.stock,
        category: dish.category,
        img: dish.img,
        desc: dish.desc || ''
      };
      const { error } = await client.from('dishes').upsert(payload);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase dish saqlash xatosi:", e);
      return false;
    }
  }

  async function dbUpdateDishStock(id, newStock) {
    if (!isConfigured || !client) return false;
    try {
      const { error } = await client
        .from('dishes')
        .update({ stock: newStock })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase stock o'zgartirish xatosi:", e);
      return false;
    }
  }

  async function dbDeleteDish(id) {
    if (!isConfigured || !client) return false;
    try {
      const { error } = await client.from('dishes').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase dish o'chirish xatosi:", e);
      return false;
    }
  }

  // --- BUYURTMALAR (ORDERS) ---
  async function dbGetOrders() {
    if (!isConfigured || !client) return null;
    try {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;

      // field nomlarini moslashtirish (promo_code -> promoCode, change_notice -> changeNotice)
      return data.map(item => ({
        ...item,
        promoCode: item.promo_code || item.promoCode,
        changeNotice: item.change_notice || item.changeNotice
      }));
    } catch (e) {
      console.error("Supabase orders yuklash xatosi:", e);
      return null;
    }
  }

  async function dbInsertOrder(order) {
    if (!isConfigured || !client) return false;
    try {
      const payload = {
        id: order.id,
        date: order.date || new Date().toISOString(),
        customer: order.customer,
        address: order.address,
        items: order.items,
        subtotal: order.subtotal,
        delivery: order.delivery,
        discount: order.discount,
        promo_code: order.promoCode || null,
        total: order.total,
        change_notice: order.changeNotice,
        status: order.status || 'Kutilmoqda'
      };
      const { error } = await client.from('orders').insert([payload]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase order qo'shish xatosi:", e);
      return false;
    }
  }

  async function dbUpdateOrderStatus(orderId, newStatus) {
    if (!isConfigured || !client) return false;
    try {
      const { error } = await client
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase order status yangilash xatosi:", e);
      return false;
    }
  }

  // --- XARAJATLAR (EXPENSES) ---
  async function dbGetExpenses() {
    if (!isConfigured || !client) return null;
    try {
      const { data, error } = await client
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Supabase expenses yuklash xatosi:", e);
      return null;
    }
  }

  async function dbInsertExpense(exp) {
    if (!isConfigured || !client) return false;
    try {
      const payload = {
        id: exp.id,
        date: exp.date || new Date().toISOString(),
        desc: exp.desc,
        amount: exp.amount,
        category: exp.category
      };
      const { error } = await client.from('expenses').insert([payload]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase expense qo'shish xatosi:", e);
      return false;
    }
  }

  async function dbDeleteExpense(id) {
    if (!isConfigured || !client) return false;
    try {
      const { error } = await client.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase expense o'chirish xatosi:", e);
      return false;
    }
  }

  // --- PROMOKOD TELEFONLARI (USED_PROMO_PHONES) ---
  async function dbGetUsedPromoPhones() {
    if (!isConfigured || !client) return null;
    try {
      const { data, error } = await client
        .from('used_promo_phones')
        .select('phone');
      if (error) throw error;
      return data.map(d => d.phone);
    } catch (e) {
      console.error("Supabase used_promo_phones yuklash xatosi:", e);
      return null;
    }
  }

  async function dbInsertUsedPromoPhone(phone) {
    if (!isConfigured || !client) return false;
    try {
      const { error } = await client
        .from('used_promo_phones')
        .insert([{ phone }]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Supabase used_promo_phone qo'shish xatosi:", e);
      return false;
    }
  }

  // --- REALTIME OBUNA BO'LISH ---
  function dbSubscribeRealtime(callback) {
    if (!isConfigured || !client) return null;
    try {
      const channel = client
        .channel('shahzoda_db_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            console.log('🔄 Supabase Realtime yangilanishi:', payload);
            if (typeof callback === 'function') {
              callback(payload);
            }
          }
        )
        .subscribe();
      return channel;
    } catch (e) {
      console.warn("Realtime obuna bo'lishda xatolik:", e);
      return null;
    }
  }

  // Eksport qilish
  window.DB = {
    init: initSupabase,
    isConfigured: () => isConfigured,
    getClient: () => client,

    // Dishes
    getDishes: dbGetDishes,
    upsertDish: dbUpsertDish,
    updateDishStock: dbUpdateDishStock,
    deleteDish: dbDeleteDish,

    // Orders
    getOrders: dbGetOrders,
    insertOrder: dbInsertOrder,
    updateOrderStatus: dbUpdateOrderStatus,

    // Expenses
    getExpenses: dbGetExpenses,
    insertExpense: dbInsertExpense,
    deleteExpense: dbDeleteExpense,

    // Used Promos
    getUsedPhones: dbGetUsedPromoPhones,
    insertUsedPhone: dbInsertUsedPromoPhone,

    // Realtime
    subscribe: dbSubscribeRealtime
  };
})();
