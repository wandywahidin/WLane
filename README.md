# WLane

WLane adalah pembuat panduan interaktif berbasis screenshot, versi sederhana ala Storylane. Pembuat demo mendaftar dengan email dan password, mengunggah screenshot, menaruh hotspot dan tooltip, lalu menerbitkannya. Penonton membuka demo lewat link publik atau iframe, tanpa login.

**Stack:** Nuxt 3 (Vue 3, TypeScript) dan Supabase (Auth email + password, Postgres dengan RLS, Storage). Tidak ada server sendiri selain fungsi Nitro milik Nuxt.

## Menjalankan secara lokal

Butuh Node 22 dan Docker.

```bash
npm install
npx supabase start          # Supabase lokal; catat API URL dan anon key
cp .env.example .env        # isi SUPABASE_URL dan SUPABASE_KEY dari keluaran di atas
npm run dev                 # http://localhost:3000
```

Buka `/daftar` untuk membuat akun (password minimal 8 karakter). Di Supabase lokal konfirmasi email dimatikan, jadi akun langsung bisa dipakai.

### Tes

| Perintah | Isi |
| --- | --- |
| `npm run test:unit` | Vitest: utilitas, composable, dan komponen player (tanpa jaringan) |
| `npm run test:db` | pgTAP: skema, RLS, batas pemakaian, terbit, storage, hapus akun |
| `npm run test:integration` | Alur lengkap terhadap Supabase lokal (butuh `supabase start`) |

`npx supabase db reset` menerapkan ulang semua migrasi di `supabase/migrations/`.

## Deploy

### 1. Project Supabase cloud

1. Buat project baru di [supabase.com](https://supabase.com) (paket Free).
2. Hubungkan dan dorong migrasi:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
3. **Authentication → Sign In / Providers → Email:** aktifkan Email, **matikan "Confirm email"**, dan isi "Minimum password length" dengan 8. Layanan email bawaan Supabase hanya mengirim ke anggota tim project, jadi tanpa SMTP sendiri konfirmasi email tidak akan sampai ke pengguna.
4. **Authentication → URL Configuration:**
   - Site URL: `https://<domain-anda>`
   - Redirect URLs: `https://<domain-anda>/**`

### 2. Hosting (Vercel, Netlify, atau Cloudflare Pages)

Semuanya mendukung Nuxt (Nitro) di paket gratis, dan preset terdeteksi otomatis. Contohnya di Vercel: impor repo, biarkan build command `npm run build`, lalu isi environment variable:

| Variabel | Nilai |
| --- | --- |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_KEY` | anon / publishable key project |

Mode render diatur di `nuxt.config.ts` (`routeRules`): `/`, `/privasi`, dan `/syarat` di-prerender; `/dashboard`, `/editor`, dan `/akun` berjalan sebagai SPA; `/d/<slug>` dirender di server untuk meta Open Graph.

### 3. Keepalive

Project Supabase gratis di-pause setelah 7 hari tidak aktif. `.github/workflows/keepalive.yml` mengirim satu query ringan setiap hari pukul 01.00 UTC.

1. Di repo GitHub, buka **Settings → Secrets and variables → Actions** dan isi `SUPABASE_URL` serta `SUPABASE_ANON_KEY`.
2. Buka **Actions → keepalive → Run workflow** untuk mencoba. Job harus hijau dengan respons `null`.

### 4. Demo contoh di landing page

Terbitkan demo milik Anda, misalnya panduan cara membuat demo di aplikasi ini. Salin slug-nya (8 karakter terakhir link `/d/<slug>`), lalu jalankan di SQL Editor Supabase:

```sql
update public.app_config set value = to_jsonb('<slug>'::text) where key = 'sample_demo_slug';
```

Tidak perlu deploy ulang. Untuk menyembunyikan bagian ini, isi `value = 'null'`.

## Batas pemakaian

Batas disimpan di tabel `app_config` dan ditegakkan oleh trigger database:

| key | default | pesan |
| --- | --- | --- |
| `max_demos_per_user` | 5 | "Batas 5 demo tercapai" |
| `max_steps_per_demo` | 20 | "Batas 20 langkah tercapai" |
| `max_users` | 20 | "Kuota pengguna sedang penuh" di halaman login |

Ubah lewat SQL Editor, misalnya `update public.app_config set value = '10' where key = 'max_users';`.

## Moderasi

Untuk menghapus konten bermasalah, hapus barisnya di tabel `demos` lewat dashboard Supabase. Langkahnya ikut terhapus lewat cascade. Hapus juga folder `<user_id>/<demo_id>/` di bucket `step-images` (**Storage**).

## Memantau kuota dan pindah ke Cloudflare R2

Pantau **Project → Usage** di dashboard Supabase. Batas pertama yang akan tercapai adalah egress (5 GB per bulan), karena setiap penonton mengunduh screenshot.

Kalau egress mendekati **4 GB per bulan**, pindahkan gambar ke Cloudflare R2 (egress gratis, storage 10 GB):

1. Buat bucket R2 dengan akses baca publik (custom domain atau `r2.dev`).
2. Ganti isi **`utils/image-store.ts` saja**. Hanya file ini yang menyentuh Storage, dan fungsinya: `imagePath`, `uploadImage`, `deleteImages`, `listDemoImages`, `publicImageUrl`. Unggah dan hapus ke R2 membutuhkan URL bertanda tangan dari server, misalnya route Nitro baru di `server/api/` yang memeriksa sesi Supabase pengguna.
3. Salin file lama dari bucket `step-images` ke R2 dengan path yang sama, supaya `image_path` di database tetap berlaku.

Editor, player, dan database tidak perlu diubah.
