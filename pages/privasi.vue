<script setup lang="ts">
useSeoMeta({ title: 'Kebijakan privasi — WLane' })
</script>

<template>
  <LegalPage title="Kebijakan privasi" updated="19 November 2026">
    <h2>Data yang kami simpan</h2>
    <ul>
      <li><strong>Akun:</strong> alamat email yang Anda pakai untuk mendaftar. Password disimpan Supabase dalam bentuk hash, tidak pernah dalam bentuk aslinya.</li>
      <li><strong>Demo:</strong> judul, urutan langkah, posisi hotspot, teks tooltip, dan screenshot yang Anda unggah.</li>
    </ul>
    <p>Kami tidak memasang pelacak iklan dan tidak menjual data Anda.</p>

    <h2>Siapa yang bisa melihat</h2>
    <ul>
      <li>Demo yang <strong>diterbitkan</strong> bisa dilihat siapa saja yang memiliki link-nya, termasuk lewat iframe di website lain.</li>
      <li>Demo <strong>draft</strong> hanya bisa diedit oleh Anda. Screenshot disimpan dengan nama file acak yang tidak bisa ditebak, tetapi siapa pun yang mendapatkan URL lengkap gambar dapat membukanya.</li>
    </ul>

    <h2>Tanggung jawab atas isi screenshot</h2>
    <p>
      Anda bertanggung jawab atas isi screenshot yang Anda unggah. Jangan mengunggah data pribadi orang lain
      (nama, nomor telepon, alamat, data keuangan, dan sejenisnya) tanpa izin mereka. Samarkan data tersebut
      sebelum mengunggah.
    </p>

    <h2>Penyimpanan dan layanan pihak ketiga</h2>
    <p>Data disimpan di Supabase (database, login, dan penyimpanan file). Login memakai email dan password.</p>

    <h2>Menghapus data</h2>
    <ul>
      <li>Hapus satu demo dari halaman <NuxtLink to="/dashboard">Demo saya</NuxtLink>. Semua screenshot demo itu ikut terhapus.</li>
      <li>Hapus akun beserta semua data dari halaman <NuxtLink to="/akun">Akun</NuxtLink>, tombol "Hapus akun dan semua data".</li>
    </ul>
    <p>Admin dapat menghapus konten yang melanggar <NuxtLink to="/syarat">syarat penggunaan</NuxtLink>.</p>
  </LegalPage>
</template>
