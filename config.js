// config.js - Sayt sozlamalari va Supabase integratsiyasi
window.ENV = {
  // SUPABASE SOZLAMALARI:
  // Supabase Dashboard -> Project Settings -> API bo'limidan olingan ma'lumotlarni kiriting:
  SUPABASE_URL: "https://isikrnscqxzwortnhykz.supabase.co", // Loyihangiz Project URL manzili
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaWtybnNjcXh6d29ydG5oeWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NjI2NzgsImV4cCI6MjEwNjMzODY3OH0.lFQOxRgqPWiVboxuvhOmyTUUwHgKuEKrt_t0vxtsZ-0", // Loyihangiz anon/public API kaliti

  // Admin paroli
  ADMIN_PASSWORD: "bahrom12",

  // Restoran telefon raqami (Header va aloqa uchun)
  RESTAURANT_PHONE: "+998 90 123 45 67",

  // Dastavka narxi
  DELIVERY_COST: 10000,

  // Promokodlar va chegirma summalari (so'mda)
  PROMOS: {
    "BAHROM": 10000,
    "SHAHZODA": 12000,
    "FARANGIZ": 8000,
    "GULBAHOR": 9000
  }
};
