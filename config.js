/* ============================================================
   CONFIG.JS — SEMUA PENGATURAN WEBSITE ULANG TAHUN
   ✏️  Cukup edit file ini saja, tidak perlu buka file lain!
   📸  Foto & video → edit di media.json
============================================================ */

const CONFIG = {

  /* ── IDENTITAS ── */
  name: "CINDY FADHIA ALFAHWA",

  /* ── TANGGAL ULANG TAHUN ── */
  birthday: { month: 4, day: 11 },

  /* ── KUE ── */
  candleCount: 5,
  cakeBlownText: "Selamat ulang tahun… Semoga semua harapanmu jadi nyata 🎂",

  /* ── TYPEWRITER ── */
  typewriterText:
    "Di hari ulang tahunmu ini, aku hanya ingin kamu tahu\n" +
    "bahwa aku berharap kamu selalu bahagia.|" +
    " Kamu layak mendapat semua keindahan yang ada di dunia ini.",
  typewriterSpeed: 30,

  /* ── PESAN LANJUTAN ── */
  pesanLanjutan: [
    "Setiap langkah yang kamu ambil, aku harap selalu ada cahaya di jalanmu. Kamu adalah salah satu manusia terbaik yang pernah hadir dalam hidupku, dan aku bersyukur pernah mengenalmu.",
    "Semoga di usiamu yang baru ini, kamu menemukan versi terbaikmu — lebih kuat, lebih tenang, lebih bahagia dari sebelumnya.",
  ],
  pesanLanjutanSign: "— Dengan sepenuh hati ✦",

  /* ── HERO ── */
  heroDate: "11 April · Hari yang Paling Indah",
  heroSub:  "Ada hal-hal kecil yang ingin aku sampaikan\ndi hari yang sangat istimewa ini.",

  /* ── KENANGAN ── */
  kenangan: [
    { icon: "🌙", tag: "Awal Segalanya",    title: "Pertama Kali Kenal",               text: "Ada momen-momen yang terlihat biasa saat terjadi, namun baru kamu sadari kemudian — itu adalah titik awal dari sesuatu yang sangat berharga. Pertemuan kita adalah salah satunya." },
    { icon: "☕", tag: "Momen Kecil",        title: "Obrolan yang Tidak Ada Habisnya",  text: "Percakapan yang dimulai dari hal paling sepele, tapi tiba-tiba sudah dini hari. Kamu punya cara yang ajaib untuk membuat waktu terasa berlalu begitu cepat." },
    { icon: "✨", tag: "Kenangan Manis",     title: "Ketika Dunia Terasa Ringan",       text: "Bersamamu, hal-hal kecil terasa cukup. Diam pun terasa hangat. Kamu punya cara yang ajaib untuk membuat segalanya menjadi lebih baik hanya dengan kehadiranmu." },
    { icon: "🌸", tag: "Pelajaran Berharga", title: "Yang Kamu Ajarkan Padaku",         text: "Mengenalmu mengajarkanku tentang ketulusan, tentang keberanian mencintai, dan tentang cara menjadi manusia yang lebih baik. Terima kasih untuk itu semua." },
  ],

  /* ── PESAN TERAKHIR ── */
  closingMsg:  "Aku mungkin tidak lagi ada di ceritamu,\ntapi aku tetap berharap kamu selalu\nmenemukan kebahagiaan di setiap langkahmu.",
  closingSub:  "Selamat ulang tahun. Dunia jauh lebih indah\nkarena kamu ada di dalamnya. 🌙",
  closingFrom: "— Dari seseorang yang selalu mendoakanmu",

  /* ── SURAT ── */
  suratGreeting: "Untuk kamu,",
  suratIsi:
      "tadinya mau nanya sih mau balikan apa engga,\n" +
    "tapi ya... pasti engga kan? hehe \n" +
    "oh ya, MAAFF juga ya cuma bisa kasih ucapan lewat sini, yaa semoga lu suka sih haha. \n\n" +
    "sekali lagi Selamat Ulang Tahun Cindy Fadhia Alfahwa. pokoknya doa terbaik buat lu!.\n" +
    "dan untuk terakhir kalinya, I Love You 🤍",
  suratSign: "— selalu merindukanmu 🌙",
    /*"Aku nggak tau gimana cara ngomongnya langsung,\n" +
    "jadi aku tulis aja di sini —\n\n" +
    "makasih udah ada.\n" +
    "Makasih buat semua hal kecil yang\n" +
    "mungkin kamu ga sadar betapa\n" +
    "berartinya buat aku.\n\n" +
    "Di hari ini, aku cuma mau kamu tau:\n" +
    "kamu layak dapat semua kebaikan\n" +
    "yang ada di dunia ini. ✦",
  suratSign: "— selalu mendoakanmu 🌙",*/

  /* ── PILIHAN BALIKAN ── */
  suratChoiceQuestion: "fungsi yang gajadi dipake",
  suratChoiceYes:      "... ♡",
  suratChoiceNo:       "...",
  suratChoiceResult:   "... 🥹♡",

  /* ── WHATSAPP ── */
  waNumber: "6285778497535",
  waText:   "nt..",

  /* ── MUSIK ── */
  musicSrc: "assets/music/you.mp3",

  /* ──────────────────────────────────────────
     ⚙️  PENGATURAN
  ────────────────────────────────────────── */

  // demoMode: true = skip countdown, langsung kue
  demoMode: true,

  // demoAll: true = skip SEMUA (countdown + checkpoint + kue + loading)
  //          langsung masuk main site — untuk testing cepat
  // ✏️ Ganti ke false saat publish!
  demoAll: false,

  /* ── PRANK ── */
  prankMode: false,
  prankText: 'ZONK HAHA, penasaran amattt, tunggu april ya cantikkk 🌸',
  prankUnlockHour:   15,
  prankUnlockMinute: 30,

};
