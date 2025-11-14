# ⚡ QUICK FIX - Do This Now!

## 🎯 Your connection issues are caused by Brave Browser blocking Supabase

---

## ✅ 3-Step Fix (Takes 30 seconds)

### Step 1: Disable Brave Shields
1. Look at your address bar
2. Click the **lion icon** (Brave Shield)
3. Toggle **"Shields"** to **OFF**

### Step 2: Restart Dev Server
```bash
# In your terminal, press Ctrl+C
# Then run:
npm run dev
```

### Step 3: Hard Refresh Browser
Press `Ctrl + F5`

---

## ✅ Done!

Your app should now work perfectly. Check the console (F12) - you should see:
- ✅ `Realtime connection opened`
- ✅ No more CSP errors
- ✅ API requests working

---

## 🔍 Still See Errors?

Clear your browser cache:
1. Press `Ctrl + Shift + Delete`
2. Check "Cached images and files"
3. Click "Clear data"
4. Refresh again (`Ctrl + F5`)

---

## 💡 Why This Works

Brave blocks external connections by default. Disabling shields for `localhost:3000` allows:
- Supabase database connections
- Real-time WebSocket updates
- All API requests

---

**That's it! Your app should work now.** 🚀

For more details, see `BRAVE_BROWSER_FIX.md`
