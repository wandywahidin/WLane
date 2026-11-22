<script setup lang="ts">
useSeoMeta({
  title: 'WLane — petunjuk penggunaan website yang bisa diklik',
  description: 'Ubah screenshot website Anda menjadi panduan interaktif langkah demi langkah. Bagikan sebagai link atau tanam lewat iframe.',
  ogTitle: 'WLane',
  ogDescription: 'Ubah screenshot menjadi panduan interaktif langkah demi langkah.',
})

const sampleSlug = ref<string | null>(null)
const origin = ref('')

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

const features = [
  { icon: 'code', title: 'Tanpa ubah kode', text: 'Cukup screenshot. Website Anda tidak perlu dipasangi script apa pun.' },
  { icon: 'device', title: 'Rapi di HP', text: 'Gambar menyesuaikan layar dan tooltip pindah ke bawah di layar kecil.' },
  { icon: 'share', title: 'Link atau iframe', text: 'Bagikan link ke WhatsApp, atau tanam di halaman bantuan website Anda.' },
] as const

const steps = [
  { n: 1, title: 'Unggah screenshot', text: 'Satu screenshot untuk setiap langkah di website Anda.' },
  { n: 2, title: 'Tandai & jelaskan', text: 'Klik di gambar untuk menaruh hotspot, lalu tulis tooltip singkat.' },
  { n: 3, title: 'Terbitkan', text: 'Dapatkan link publik dan kode iframe yang siap dipakai.' },
]
</script>

<template>
  <div class="overflow-x-hidden">
    <!-- navigasi -->
    <header class="absolute inset-x-0 top-0 z-20">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <AppLogo />
        <div class="flex items-center gap-2">
          <NuxtLink to="/login" class="btn-ghost">Masuk</NuxtLink>
          <NuxtLink to="/daftar" class="btn-primary">Daftar</NuxtLink>
        </div>
      </div>
    </header>

    <!-- hero -->
    <section class="relative isolate pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div class="absolute inset-0 -z-10 bg-[radial-gradient(70rem_45rem_at_50%_-20%,var(--color-brand-100),transparent)]" />
      <div class="absolute inset-x-0 top-0 -z-10 h-full bg-[linear-gradient(to_right,#e2e8f033_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f033_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <div class="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100">
          <span class="size-1.5 rounded-full bg-brand-500" />
          Petunjuk penggunaan yang bisa diklik
        </p>
        <h1 class="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-6xl">
          Pengguna paham alurnya, <span class="text-brand-600">tanpa bertanya.</span>
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg text-pretty text-slate-600">
          Ubah screenshot website Anda menjadi panduan interaktif. Pengguna mengklik langkah demi langkah
          seperti memakai website aslinya, di desktop maupun HP.
        </p>
        <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <NuxtLink to="/daftar" class="btn-primary btn-lg w-full shadow-lg shadow-brand-600/25 sm:w-auto">
            Mulai gratis
            <UiIcon name="arrow-left" :size="18" class="rotate-180" />
          </NuxtLink>
          <a v-if="sampleSlug" href="#contoh" class="btn-secondary btn-lg w-full sm:w-auto">
            <UiIcon name="play" :size="18" /> Lihat contoh
          </a>
        </div>
        <p class="mt-4 text-sm text-slate-500">Gratis · Tanpa kartu kredit · Tanpa ubah kode website</p>

        <!-- ilustrasi -->
        <div class="relative mx-auto mt-16 max-w-4xl">
          <div class="absolute -inset-x-8 -inset-y-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-200/50 via-white to-sky-100/60 blur-2xl" />
          <div class="overflow-hidden rounded-2xl bg-white text-left shadow-2xl ring-1 shadow-slate-900/10 ring-slate-900/10">
            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <span class="size-3 rounded-full bg-red-400" /><span class="size-3 rounded-full bg-amber-400" /><span class="size-3 rounded-full bg-emerald-400" />
              <span class="ml-3 hidden h-6 flex-1 rounded-md bg-white text-xs leading-6 text-slate-400 ring-1 ring-slate-200 sm:block">&nbsp;&nbsp;tokoanda.id/transaksi</span>
            </div>
            <div class="grid grid-cols-[9rem_1fr] sm:grid-cols-[12rem_1fr]">
              <div class="space-y-2 border-r border-slate-100 p-4">
                <div class="h-3 w-20 rounded bg-slate-200" />
                <div class="mt-4 h-8 rounded-lg bg-slate-100" />
                <div class="relative h-8 rounded-lg bg-brand-50 ring-1 ring-brand-200">
                  <span class="absolute top-1/2 left-3 h-2 w-16 -translate-y-1/2 rounded bg-brand-300" />
                </div>
                <div class="h-8 rounded-lg bg-slate-100" />
                <div class="h-8 rounded-lg bg-slate-100" />
              </div>
              <div class="relative p-5 pb-24 sm:p-8 sm:pb-24">
                <div class="h-4 w-40 rounded bg-slate-200" />
                <div class="mt-6 grid grid-cols-3 gap-3">
                  <div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-slate-100" />
                </div>
                <div class="mt-4 h-28 rounded-xl bg-slate-50 ring-1 ring-slate-100" />
                <!-- hotspot + tooltip contoh -->
                <span class="absolute top-[9.5rem] right-[18%] size-7 sm:top-[11.5rem]">
                  <span class="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500" />
                  <span class="absolute inset-0 rounded-full border-[3px] border-white bg-brand-600 shadow-lg" />
                </span>
                <div class="absolute top-[11.75rem] right-[6%] w-48 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs leading-relaxed font-medium text-white shadow-xl sm:top-[13.75rem] sm:w-56 sm:text-sm">
                  Klik <strong>Tambah transaksi</strong> untuk mencatat penjualan baru.
                  <div class="mt-2 flex items-center justify-between text-[11px] text-slate-400"><span>Langkah 2 dari 5</span><span>Lanjut →</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- fitur -->
    <section class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div class="grid gap-6 sm:grid-cols-3">
        <div v-for="f in features" :key="f.title" class="card p-6">
          <div class="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <UiIcon :name="f.icon" :size="22" />
          </div>
          <h3 class="mt-4 font-bold">{{ f.title }}</h3>
          <p class="mt-1.5 text-sm leading-relaxed text-slate-600">{{ f.text }}</p>
        </div>
      </div>
    </section>

    <!-- demo contoh -->
    <section v-if="sampleSlug" id="contoh" class="scroll-mt-8 bg-slate-900 py-20 text-white">
      <div class="mx-auto max-w-5xl px-4 sm:px-6">
        <div class="text-center">
          <h2 class="text-3xl font-extrabold tracking-tight">Coba sekarang</h2>
          <p class="mt-3 text-slate-400">Demo ini menunjukkan cara membuat demo di aplikasi ini. Klik titik biru untuk lanjut.</p>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -- kode iframe yang sama dengan yang diberikan ke pengguna -->
        <div class="mt-10 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/10" v-html="sampleEmbed" />
        <div class="mt-4 text-center">
          <a :href="`/d/${sampleSlug}`" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 hover:text-brand-200">
            Buka layar penuh <UiIcon name="external" :size="16" />
          </a>
        </div>
      </div>
    </section>

    <!-- cara kerja -->
    <section class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 class="text-center text-3xl font-extrabold tracking-tight">Tiga langkah, beberapa menit</h2>
      <ol class="mt-12 grid gap-8 sm:grid-cols-3">
        <li v-for="s in steps" :key="s.n" class="relative">
          <span class="grid size-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-lg shadow-brand-600/30">{{ s.n }}</span>
          <h3 class="mt-4 font-bold">{{ s.title }}</h3>
          <p class="mt-1.5 text-sm leading-relaxed text-slate-600">{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <!-- ajakan -->
    <section class="px-4 pb-20 sm:px-6">
      <div class="mx-auto max-w-4xl rounded-3xl bg-brand-600 px-6 py-14 text-center text-white shadow-xl shadow-brand-600/25">
        <h2 class="text-2xl font-extrabold tracking-tight sm:text-3xl">Buat panduan pertama Anda hari ini</h2>
        <p class="mx-auto mt-3 max-w-xl text-brand-100">Gantikan PDF dan teks panjang dengan panduan yang bisa diklik.</p>
        <NuxtLink to="/daftar" class="btn btn-lg mt-8 bg-white text-brand-700 shadow-sm hover:bg-brand-50">
          Daftar gratis
        </NuxtLink>
      </div>
    </section>

    <footer class="border-t border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
        <AppLogo />
        <nav class="flex gap-6">
          <NuxtLink to="/privasi" class="hover:text-slate-900">Kebijakan privasi</NuxtLink>
          <NuxtLink to="/syarat" class="hover:text-slate-900">Syarat penggunaan</NuxtLink>
          <NuxtLink to="/dashboard" class="hover:text-slate-900">Demo saya</NuxtLink>
        </nav>
      </div>
    </footer>
  </div>
</template>
