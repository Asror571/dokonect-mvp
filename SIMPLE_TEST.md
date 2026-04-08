# 🎯 SIMPLE TEST - Admin Login

## Endi test qiling:

### 1. Browser ni to'liq yoping va qayta oching

### 2. Console ni oching (F12)

### 3. Login page ga o'ting
```
http://localhost:3001/login
```

### 4. Admin account bilan login qiling
- "Admin" test account tugmasini bosing (pastda)
- Yoki qo'lda:
  - Phone: `+998900000000`
  - Password: `123456`

### 5. "Tizimga kirish" tugmasini bosing

### 6. Console da ko'rasiz:
```
🔐 Attempting login...
✅ Login response
👤 User: {name: 'Global Admin', role: 'ADMIN'}
🔑 Token: saved
💾 Auth state updated
🔄 setAuth called
✅ setAuth completed
🚀 Redirecting to: ADMIN
🎯 Navigating to: /admin/dashboard
```

### 7. Sahifa darhol `/admin/dashboard` ga o'tadi

### 8. Console da ko'rasiz:
```
🏢 AdminLayout check: {
  hasToken: true,
  hasUser: true,
  userRole: 'ADMIN',
  currentPath: '/admin/dashboard'
}
✅ AdminLayout: Access granted
```

### 9. Dashboard ochiladi! ✅

---

## Agar console da "Not admin" deb chiqsa:

```
❌ AdminLayout: Not admin, redirecting to /login
```

**Sabab:** User role noto'g'ri saqlangan

**Yechim:** Console da tekshiring:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('User role:', user.role);
```

Agar role `ADMIN` emas bo'lsa, qo'lda to'g'rilang:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
user.role = 'ADMIN';
localStorage.setItem('user', JSON.stringify(user));
window.location.reload();
```

---

## Agar hech narsa ko'rinmasa:

Console da:
```javascript
// Check localStorage
console.log('Token:', localStorage.getItem('accessToken'));
console.log('User:', JSON.parse(localStorage.getItem('user')));

// If exists, navigate manually
if (localStorage.getItem('accessToken')) {
  window.location.replace('/admin/dashboard');
}
```

---

## Agar "AdminLayout check" ko'rinmasa:

**Sabab:** AdminLayout render bo'lmayapti

**Yechim:** To'g'ridan-to'g'ri URL ga o'ting:
```
http://localhost:3001/admin/dashboard
```

Agar bu ishlasa, routing muammosi.

---

**ENDI QAYTA TEST QILING!** 🚀

Console loglarni screenshot qiling va yuboring agar ishlamasa.
