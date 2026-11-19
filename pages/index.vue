<script setup lang="ts">
useSeoMeta({
  title: 'Panduan Interaktif — petunjuk penggunaan website yang bisa diklik',
  description: 'Ubah screenshot website Anda menjadi panduan interaktif langkah demi langkah. Bagikan sebagai link atau tanam lewat iframe.',
  ogTitle: 'Panduan Interaktif',
  ogDescription: 'Ubah screenshot menjadi panduan interaktif langkah demi langkah.',
})

const supabase = useSupabaseClient()
const sampleSlug = ref<string | null>(null)
const origin = ref('')
const signingIn = ref(false)

// Halaman ini di-prerender; demo contoh dibaca di browser supaya bisa diganti tanpa deploy.
onMounted(async () => {
  origin.value = window.location.origin
  try {
    const res = await $fetch<{ slug: string | null }>('/api/sample-demo')
    sampleSlug.value = res.slug
  } catch {
    sampleSlug.value = null
  }
})

const sampleEmbed = computed(() => (sampleSlug.value ? embedCode(origin.value, sampleSlug.value) : ''))

async function start() {
  signingIn.value = true
  try {
    await signInWithGoogle(supabase, window.location.origin)
  } catch {
    signingIn.value = false
    await navigateTo('/login?error=start')
  }
}
</script>

<template>
  <div>
    <header class="hero container">
      <h1>Petunjuk website yang bisa diklik, bukan dibaca</h1>
      <p class="lead">
        Unggah screenshot website Anda, tandai bagian yang harus diklik, tulis penjelasan singkat.
        Pengguna Anda mengikuti langkahnya seperti memakai website aslinya, di desktop maupun HP.
      </p>
      <button type="button" class="primary big" :disabled="signingIn" @click="start">Mulai dengan Google</button>
      <p class="muted">Gratis. Tidak perlu mengubah kode website Anda.</p>
    </header>

    <section v-if="sampleSlug" class="sample container">
      <h2>Coba sekarang</h2>
      <p class="muted">Demo ini menunjukkan cara membuat demo di aplikasi ini. Klik titik biru untuk lanjut.</p>
      <!-- eslint-disable-next-line vue/no-v-html -- kode iframe yang sama dengan yang diberikan ke pengguna -->
      <div class="frame" v-html="sampleEmbed" />
      <a :href="`/d/${sampleSlug}`" target="_blank" rel="noopener">Buka layar penuh</a>
    </section>

    <section class="how container">
      <h2>Cara kerjanya</h2>
      <ol>
        <li><strong>Unggah screenshot</strong> setiap langkah di website Anda.</li>
        <li><strong>Klik di gambar</strong> untuk menaruh hotspot, lalu tulis tooltip.</li>
        <li><strong>Terbitkan</strong>, lalu bagikan link atau tanam kode iframe di halaman bantuan Anda.</li>
      </ol>
    </section>

    <footer class="foot container">
      <NuxtLink to="/privasi">Kebijakan privasi</NuxtLink>
      <NuxtLink to="/syarat">Syarat penggunaan</NuxtLink>
      <NuxtLink to="/dashboard">Demo saya</NuxtLink>
    </footer>
  </div>
</template>

<style scoped>
.hero { text-align: center; padding-top: 12vh; padding-bottom: 32px; }
.hero h1 { font-size: clamp(1.8rem, 5vw, 2.8rem); line-height: 1.15; margin: 0 0 16px; }
.lead { font-size: 1.1rem; color: var(--muted); max-width: 640px; margin: 0 auto 24px; }
.big { font-size: 1.05rem; padding: 12px 22px; }
.muted { color: var(--muted); }
.sample { text-align: center; }
.frame { margin: 12px 0; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.how ol { display: grid; gap: 8px; padding-left: 20px; }
.foot { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; border-top: 1px solid var(--border); margin-top: 32px; font-size: 0.9rem; }
</style>
