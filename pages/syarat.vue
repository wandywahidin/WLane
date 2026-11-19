<script setup lang="ts">
useSeoMeta({ title: 'Syarat penggunaan — Panduan Interaktif' })
</script>

<template>
  <article class="container legal">
    <NuxtLink to="/">← Beranda</NuxtLink>
    <h1>Syarat penggunaan</h1>
    <p class="muted">Terakhir diperbarui: 19 November 2026</p>

    <h2>Layanan</h2>
    <p>
      Panduan Interaktif membantu Anda membuat petunjuk penggunaan website dari screenshot. Layanan ini
      diberikan apa adanya, gratis, dan dengan batas pemakaian (misalnya jumlah demo per akun, langkah per
      demo, dan jumlah akun). Batas dapat berubah sewaktu-waktu.
    </p>

    <h2>Isi yang Anda unggah</h2>
    <ul>
      <li>Anda bertanggung jawab penuh atas isi screenshot dan teks yang Anda unggah.</li>
      <li>Dilarang mengunggah data pribadi orang lain tanpa izin.</li>
      <li>Dilarang mengunggah konten yang melanggar hukum, hak cipta, atau menyesatkan.</li>
    </ul>

    <h2>Penghapusan konten</h2>
    <p>Admin boleh menghapus konten atau akun yang melanggar syarat ini tanpa pemberitahuan terlebih dahulu.</p>

    <h2>Menghapus akun</h2>
    <p>
      Anda dapat menghapus akun dan semua data kapan saja dari halaman <NuxtLink to="/akun">Akun</NuxtLink>.
      Link dan iframe yang sudah dibagikan akan berhenti berfungsi.
    </p>

    <h2>Privasi</h2>
    <p>Lihat <NuxtLink to="/privasi">kebijakan privasi</NuxtLink>.</p>
  </article>
</template>

<style scoped>
.legal { max-width: 720px; }
.legal h2 { font-size: 1.15rem; margin-top: 28px; }
.muted { color: var(--muted); }
</style>
