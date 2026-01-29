# 🚨 CORS Issue - القصص لا تظهر محلياً

## المشكلة

عند تشغيل التطبيق محلياً (`npm run dev`) والاتصال بقاعدة البيانات على الويب، القصص لا تظهر بسبب **CORS Policy**.

السيرفر في `production mode` ويسمح فقط بـ:
- `https://kids.genarabi.com` ✅
- `http://localhost:5173` ❌ (ممنوع!)

---

## ✅ الحل 1: تعديل CORS على السيرفر (الأفضل)

### الخطوات:

1. **افتح ملف** `server/server.js` **على السيرفر** (cPanel File Manager)

2. **ابحث عن السطر 89-96:**
```javascript
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGIN || 'https://kids.genarabi.com'
        : '*',
    credentials: true,
}));
```

3. **استبدله بهذا:**
```javascript
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [
            process.env.ALLOWED_ORIGIN || 'https://kids.genarabi.com',
            'http://localhost:5173',
            'http://localhost:3000'
          ]
        : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
```

4. **أعد تشغيل السيرفر:**
```bash
# في cPanel Terminal أو SSH
cd server
pm2 restart jeen-arabi-api
# أو
npm run start
```

5. **جرب مرة ثانية:**
```bash
# في مجلد jeen-arabi المحلي
npm run dev
```

الآن القصص ستظهر! ✨

---

## 🔄 الحل 2: استخدام Proxy محلي (بديل)

إذا لا تستطيع تعديل السيرفر، استخدم proxy:

### الخطوات:

1. **أنشئ ملف** `vite.config.ts` **في المجلد الرئيسي:**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://kids.genarabi.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
```

2. **احذف** `VITE_API_BASE_URL` **من** `.env.local`

3. **أعد تشغيل:**
```bash
npm run dev
```

الآن سيعمل الـ API من خلال proxy محلي بدون CORS! ✨

---

## 🎯 أيهما أفضل؟

| الحل | الميزات | العيوب |
|------|---------|--------|
| **الحل 1** | الأفضل، دائم، يسمح بتطوير حقيقي | يتطلب وصول للسيرفر |
| **الحل 2** | سريع، لا يتطلب تعديل السيرفر | مؤقت فقط للتطوير |

---

## 🔍 كيف تتأكد من المشكلة؟

1. افتح `http://localhost:5173` في المتصفح
2. اضغط **F12** لفتح Developer Tools
3. اذهب لتاب **Console**
4. ستشوف خطأ مثل:

```
Access to XMLHttpRequest at 'https://kids.genarabi.com/api/stories' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

هذا يؤكد أن المشكلة CORS! ✅

---

## ✅ التحقق بعد الحل

بعد تطبيق أي حل، جرب:

1. `npm run dev`
2. افتح `http://localhost:5173`
3. ستشوف:
   - ✅ القصص تظهر في الصفحة الرئيسية
   - ✅ "أشهر القصص" يظهر
   - ✅ الآراء تظهر
   - ✅ Library ممتلئة بالقصص

---

**اختر الحل المناسب لك وطبقه!** 🚀
