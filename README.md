# SnapConnect

A lightweight Snapchat-style app built with React Native + Expo and Supabase.

## ✨ Features
- Capture photos / videos with AR filters
- Send snaps to friends & post 24-hour Stories
- Real-time chat (Supabase Realtime)
- Secure Auth (Supabase Email / OAuth)

## ⚡ Quick Start
```bash
# 1. Clone & install
git clone https://github.com/your-org/snapconnect.git
cd SnapConnect
npm install

# 2. Configure env
cp .env.example .env   # then add your keys

# 3. Run the dev server (clears Metro cache)
npx expo start --clear
```
On the Expo CLI screen:
- press `i` for iOS Simulator
- press `a` for Android emulator
- or scan the QR code with Expo Go.

## 🔑 Environment Variables (./.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_public_anon_key
```

Supabase tables & storage policies are in `src/services/supabase/schema.sql` – run them once in the SQL editor after creating your project. 