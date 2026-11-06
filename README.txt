ARTEMIS AI — by MAMZz

Model: deepseek-v4.1-flash (dikunci)
Backend: Vercel Serverless Function /api/chat
Provider: TokenPortal

DEPLOY:
1. Upload seluruh isi folder ini ke root repository GitHub. Jangan upload file .env asli.
2. Import repository ke Vercel atau tunggu deployment otomatis.
3. Vercel Project > Settings > Environment Variables.
4. Tambahkan TOKENPORTAL_API_KEY dengan value API key TokenPortal. Pilih Production (dan Preview jika diperlukan).
5. Save, lalu Redeploy.

CATATAN KEAMANAN:
- API key tidak berada di frontend.
- Endpoint publik memakai pembatasan sederhana per-IP per-instance; ini bukan rate limit global. Untuk pemakaian publik besar, tambahkan shared rate limit dan bot protection.
- Jangan commit file .env atau membagikan API key.
