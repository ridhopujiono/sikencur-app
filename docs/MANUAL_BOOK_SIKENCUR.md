# MANUAL BOOK

## Aplikasi SiKencur

Versi dokumen: 1.0  
Versi aplikasi: 1.0  
Tanggal: ____________________  
Disusun oleh: ____________________

---

## Catatan Penggunaan Dokumen

Dokumen ini disusun sebagai panduan penggunaan aplikasi SiKencur untuk pengguna akhir. Isi dokumen dapat langsung Anda salin ke Microsoft Word jika dibutuhkan dalam format `.docx` atau PDF.

Setiap bagian yang memerlukan gambar sudah diberi penanda lokasi screenshot. Anda hanya perlu menambahkan gambar sesuai penanda tersebut.

Format penanda screenshot yang digunakan:

> Tempatkan Screenshot di sini: [Nama tampilan / aktivitas yang perlu ditampilkan]

---

## Daftar Isi

1. Pendahuluan
2. Gambaran Umum Aplikasi
3. Navigasi Utama Aplikasi
4. Panduan Login
5. Panduan Registrasi
6. Panduan Beranda
7. Panduan Transaksi
8. Panduan Tambah dan Edit Transaksi Manual
9. Panduan Scan Struk dan OCR
10. Panduan Profil DSS
11. Panduan Akun dan Pengaturan
12. Panduan Notifikasi
13. Keluar dari Aplikasi
14. Tips Penggunaan
15. Troubleshooting
16. Catatan Tambahan

---

## 1. Pendahuluan

SiKencur adalah aplikasi pencatatan dan pemantauan keuangan yang membantu pengguna:

- mencatat transaksi manual,
- memindai struk belanja secara otomatis,
- melihat ringkasan pengeluaran,
- memantau budget bulanan,
- menerima pengaturan notifikasi,
- melihat analisis profil keuangan berbasis DSS.

Manual book ini bertujuan membantu pengguna memahami alur penggunaan aplikasi dari awal hingga akhir.

> Tempatkan Screenshot di sini: Tampilan splash / tampilan awal aplikasi jika tersedia

---

## 2. Gambaran Umum Aplikasi

Secara umum, aplikasi SiKencur memiliki dua alur besar:

- Alur autentikasi, yaitu proses masuk atau daftar akun.
- Alur aplikasi utama, yaitu penggunaan fitur setelah pengguna berhasil login.

Setelah berhasil login, pengguna akan masuk ke area utama aplikasi yang terdiri dari menu:

- Beranda
- Transaksi
- Scan
- DSS
- Akun

> Tempatkan Screenshot di sini: Tampilan utama aplikasi setelah login yang menunjukkan menu navigasi bawah

---

## 3. Navigasi Utama Aplikasi

Navigasi utama aplikasi berada di bagian bawah layar. Fungsi setiap menu adalah sebagai berikut:

### 3.1 Beranda

Menu ini digunakan untuk melihat ringkasan kondisi keuangan pengguna, seperti total pengeluaran, sisa budget, jumlah scan struk, grafik 7 hari terakhir, kategori pengeluaran terbesar, dan ringkasan profil DSS.

### 3.2 Transaksi

Menu ini digunakan untuk melihat daftar transaksi, memfilter transaksi, melihat detail transaksi, serta menambah transaksi baru.

### 3.3 Scan

Menu ini digunakan untuk memindai struk menggunakan kamera, auto scan dokumen, galeri, atau file PDF.

### 3.4 DSS

Menu ini digunakan untuk melihat profil keuangan pengguna berdasarkan analisis sistem DSS.

### 3.5 Akun

Menu ini digunakan untuk mengatur budget bulanan, preferensi notifikasi, privasi, dan keluar dari aplikasi.

> Tempatkan Screenshot di sini: Navigasi bawah dengan penjelasan ikon menu

---

## 4. Panduan Login

Halaman login digunakan untuk masuk ke aplikasi menggunakan email dan password.

### Langkah-langkah login

1. Buka aplikasi SiKencur.
2. Masukkan alamat email pada kolom `Email`.
3. Masukkan kata sandi pada kolom `Password`.
4. Tekan tombol `Masuk`.
5. Jika data benar, pengguna akan diarahkan ke halaman utama aplikasi.

### Validasi pada login

- Email wajib diisi.
- Format email harus valid.
- Password wajib diisi.
- Password minimal 8 karakter.

Jika terjadi kesalahan login, aplikasi akan menampilkan pesan kegagalan.

> Tempatkan Screenshot di sini: Halaman login

### Pengaturan server pada halaman login

Pada halaman login, pengguna dapat membuka pengaturan server dengan menekan informasi versi aplikasi.

Fungsi pengaturan ini adalah untuk:

- menggunakan server production, atau
- menggunakan base URL server custom.

Fitur ini berguna untuk kebutuhan pengujian atau koneksi ke server lain.

> Tempatkan Screenshot di sini: Popup pengaturan server pada halaman login

---

## 5. Panduan Registrasi

Halaman registrasi digunakan untuk membuat akun baru.

### Langkah-langkah registrasi

1. Pada halaman login, tekan tombol `Daftar`.
2. Isi `Nama lengkap`.
3. Isi `Email`.
4. Isi `Password`.
5. Isi `Konfirmasi kata sandi`.
6. Tekan tombol `Daftar`.
7. Jika pendaftaran berhasil, pengguna akan langsung masuk ke aplikasi.

### Validasi pada registrasi

- Nama lengkap wajib diisi dan minimal 2 karakter.
- Email wajib diisi dan harus valid.
- Password minimal 8 karakter serta mengandung huruf dan angka.
- Konfirmasi password harus sama dengan password.

> Tempatkan Screenshot di sini: Halaman registrasi

---

## 6. Panduan Beranda

Beranda merupakan pusat ringkasan informasi keuangan pengguna.

### Informasi yang ditampilkan di beranda

#### 6.1 Salam dan periode bulan

Di bagian atas, aplikasi menampilkan nama pengguna dan periode bulan aktif. Pengguna dapat:

- berpindah ke bulan sebelumnya,
- kembali ke bulan berikutnya,
- memuat ulang ringkasan data.

#### 6.2 Total pengeluaran

Bagian ini menampilkan total pengeluaran pada bulan aktif beserta perbandingan terhadap bulan sebelumnya.

#### 6.3 Sisa anggaran

Bagian ini menampilkan:

- sisa budget bulan berjalan,
- persentase penggunaan budget,
- target sisa budget,
- status apakah budget masih on track atau belum.

Jika budget belum diatur, aplikasi menyediakan tombol `Atur budget` yang akan mengarahkan pengguna ke halaman pengaturan.

#### 6.4 Jumlah struk dipindai

Bagian ini menunjukkan berapa banyak transaksi hasil scan yang tercatat pada bulan berjalan.

#### 6.5 Grafik pengeluaran 7 hari

Bagian ini menampilkan visualisasi pengeluaran selama 7 hari terakhir.

#### 6.6 Kategori pengeluaran terbesar

Bagian ini menampilkan beberapa kategori dengan kontribusi pengeluaran terbesar pada bulan aktif.

#### 6.7 Ringkasan profil DSS

Bagian ini menampilkan ringkasan singkat profil keuangan pengguna, termasuk label profil dan tingkat kepatuhan terhadap budget.

> Tempatkan Screenshot di sini: Halaman beranda penuh

> Tempatkan Screenshot di sini: Kartu sisa anggaran / budget

> Tempatkan Screenshot di sini: Kartu profil DSS pada beranda

---

## 7. Panduan Transaksi

Halaman transaksi digunakan untuk melihat seluruh transaksi yang telah tersimpan.

### Fitur pada halaman transaksi

#### 7.1 Filter bulan

Pengguna dapat berpindah bulan untuk melihat transaksi sesuai periode tertentu.

#### 7.2 Filter jenis transaksi

Tersedia filter:

- Semua
- Pengeluaran
- Pemasukan

#### 7.3 Filter kategori

Pengguna dapat memilih kategori tertentu untuk mempersempit daftar transaksi.

#### 7.4 Ringkasan total transaksi

Di bagian atas daftar, aplikasi menampilkan:

- jumlah transaksi,
- total nominal transaksi pada filter yang aktif.

#### 7.5 Daftar transaksi

Transaksi dikelompokkan berdasarkan tanggal. Setiap item transaksi menampilkan:

- nama merchant,
- waktu transaksi,
- jumlah item,
- metode input,
- total nominal,
- kategori utama.

#### 7.6 Detail transaksi

Saat salah satu transaksi ditekan, aplikasi menampilkan detail transaksi dalam popup, meliputi:

- total transaksi,
- metode input,
- jumlah item,
- PPN,
- service charge,
- deskripsi,
- daftar item transaksi.

#### 7.7 Muat lebih banyak

Jika transaksi masih banyak, pengguna dapat menekan tombol `Muat lebih banyak`.

> Tempatkan Screenshot di sini: Halaman daftar transaksi

> Tempatkan Screenshot di sini: Filter transaksi

> Tempatkan Screenshot di sini: Detail transaksi dalam popup / modal

---

## 8. Panduan Tambah dan Edit Transaksi Manual

Pengguna dapat menambahkan transaksi secara manual melalui tombol `+` pada halaman transaksi.

### 8.1 Menambah transaksi manual

Langkah-langkah:

1. Buka menu `Transaksi`.
2. Tekan tombol `+`.
3. Isi nama merchant.
4. Pilih tanggal transaksi.
5. Tambahkan item transaksi.
6. Isi nama item dan harga item.
7. Pilih kategori item.
8. Tambahkan PPN dan service charge jika ada.
9. Isi deskripsi jika diperlukan.
10. Tekan tombol `Simpan transaksi`.

### 8.2 Mengedit transaksi

Langkah-langkah:

1. Buka menu `Transaksi`.
2. Pilih salah satu transaksi.
3. Pada popup detail transaksi, tekan tombol `Edit transaksi`.
4. Ubah data yang diperlukan.
5. Tekan tombol `Update transaksi`.

### Validasi transaksi manual

- Nama merchant wajib diisi.
- Minimal harus ada satu item transaksi.
- Setiap item wajib memiliki nama dan harga lebih dari 0.
- Total transaksi harus lebih besar dari 0.

> Tempatkan Screenshot di sini: Form tambah transaksi manual

> Tempatkan Screenshot di sini: Form edit transaksi

> Tempatkan Screenshot di sini: Pemilihan kategori item transaksi

---

## 9. Panduan Scan Struk dan OCR

Fitur scan struk digunakan untuk membuat transaksi secara otomatis dari gambar struk.

### Metode input scan yang tersedia

- Auto scan dokumen
- Kamera manual
- Galeri
- File PDF

### 9.1 Melakukan scan struk

Langkah-langkah:

1. Buka menu `Scan`.
2. Pilih salah satu sumber scan:
   - auto scan,
   - kamera manual,
   - galeri,
   - PDF.
3. Ambil atau pilih gambar struk.
4. Aplikasi akan mengunggah file ke server.
5. Setelah upload berhasil, aplikasi akan membuka halaman hasil scan.

### 9.2 Proses OCR

Pada halaman hasil scan, aplikasi akan melakukan pengecekan status OCR secara otomatis sampai proses selesai.

Status yang mungkin muncul:

- sedang diproses,
- selesai,
- gagal.

### 9.3 Hasil OCR

Jika OCR berhasil, aplikasi akan menampilkan:

- nama toko,
- tanggal transaksi,
- total bayar,
- PPN,
- biaya layanan,
- durasi analisa,
- akurasi OCR,
- daftar item hasil pembacaan struk.

### 9.4 Edit hasil OCR

Sebelum disimpan, pengguna dapat memperbaiki data OCR, misalnya:

- nama merchant,
- tanggal,
- total,
- item,
- kategori item.

### 9.5 Simpan hasil OCR menjadi transaksi

Setelah data dirasa benar:

1. Tekan tombol simpan transaksi.
2. Aplikasi akan menyimpan hasil OCR sebagai transaksi dengan metode input `scan`.
3. Setelah berhasil, pengguna dapat membuka daftar transaksi.

> Tempatkan Screenshot di sini: Halaman scan struk

> Tempatkan Screenshot di sini: Opsi sumber scan

> Tempatkan Screenshot di sini: Halaman hasil OCR saat status masih diproses

> Tempatkan Screenshot di sini: Halaman hasil OCR setelah selesai

> Tempatkan Screenshot di sini: Form edit hasil OCR

---

## 10. Panduan Profil DSS

Menu DSS digunakan untuk menampilkan profil keuangan pengguna berdasarkan hasil analisis.

### Informasi yang ditampilkan

Halaman DSS dapat menampilkan:

- label profil keuangan,
- confidence analisis,
- window analisis dalam bulan,
- waktu analisis terakhir,
- fitur utama analisis,
- alasan atau penjelasan terbentuknya profil.

### Kondisi yang mungkin muncul

#### 10.1 Profil belum tersedia

Jika profil belum tersedia, pengguna akan diminta menjalankan analisis.

#### 10.2 Profil perlu diperbarui

Jika data transaksi baru tersedia atau profil sudah lama, aplikasi akan memberi informasi bahwa analisis perlu dijalankan ulang.

#### 10.3 Menjalankan analisis DSS

Langkah-langkah:

1. Buka menu `DSS`.
2. Tekan tombol `Analyze Sekarang`.
3. Tunggu proses analisis selesai.
4. Data profil akan diperbarui secara otomatis.

> Tempatkan Screenshot di sini: Halaman DSS saat belum ada profil

> Tempatkan Screenshot di sini: Tombol Analyze Sekarang

> Tempatkan Screenshot di sini: Halaman DSS setelah analisis berhasil

---

## 11. Panduan Akun dan Pengaturan

Menu `Akun` atau `Akun & pengaturan` digunakan untuk mengelola data akun dan preferensi aplikasi.

> Tempatkan Screenshot di sini: Halaman akun dan pengaturan

### 11.1 Informasi profil pengguna

Di bagian atas halaman, aplikasi menampilkan:

- inisial pengguna,
- nama pengguna,
- email pengguna.

### 11.2 Budget bulanan

Fitur ini digunakan untuk menetapkan budget bulanan pengguna.

Langkah-langkah:

1. Buka menu `Akun`.
2. Pada bagian `Budget Bulanan`, isi `Limit budget`.
3. Isi `Target sisa` jika diperlukan.
4. Tekan tombol `Simpan budget`.

Validasi:

- Limit budget wajib angka yang valid.
- Target sisa tidak boleh melebihi limit budget.

> Tempatkan Screenshot di sini: Form budget bulanan

### 11.3 Preferensi notifikasi

Pengguna dapat mengatur preferensi notifikasi seperti:

- push notification,
- ringkasan mingguan,
- peringatan anggaran,
- tips DSS mingguan,
- jam tenang mulai,
- jam tenang selesai,
- timezone.

Langkah-langkah:

1. Buka menu `Akun`.
2. Ubah toggle atau nilai yang diinginkan.
3. Tekan tombol `Simpan notifikasi`.

> Tempatkan Screenshot di sini: Bagian preferensi notifikasi

> Tempatkan Screenshot di sini: Pengaturan jam tenang

### 11.4 Privasi dan data

Pada bagian ini tersedia beberapa menu:

- Persetujuan analisis DSS
- Unduh data saya
- Hapus akun

Catatan:

Pada versi kode saat ini, `Persetujuan analisis DSS` sudah berupa toggle di tampilan, sedangkan menu `Unduh data saya` dan `Hapus akun` masih berupa tampilan antarmuka dan belum terlihat memiliki proses lanjutan di aplikasi.

> Tempatkan Screenshot di sini: Bagian privasi dan data

---

## 12. Panduan Notifikasi

Aplikasi mendukung push notification. Notifikasi digunakan untuk membantu pengguna memperoleh informasi penting secara cepat.

Kemungkinan jenis notifikasi yang diatur di aplikasi:

- notifikasi umum,
- ringkasan mingguan,
- peringatan budget,
- tips DSS.

Pengguna juga dapat mengatur jam tenang agar notifikasi tidak mengganggu pada waktu tertentu.

> Tempatkan Screenshot di sini: Contoh tampilan notifikasi atau pengaturan notifikasi

---

## 13. Keluar dari Aplikasi

Untuk keluar dari aplikasi:

1. Buka menu `Akun`.
2. Gulir ke bagian bawah.
3. Tekan tombol `Keluar`.

Setelah logout:

- sesi login akan dihapus,
- pengguna akan kembali ke halaman login.

> Tempatkan Screenshot di sini: Tombol keluar / logout

---

## 14. Tips Penggunaan

- Pastikan email dan password yang digunakan sudah benar saat login.
- Gunakan pencahayaan yang baik saat memindai struk.
- Periksa kembali hasil OCR sebelum disimpan menjadi transaksi.
- Isi budget bulanan agar aplikasi dapat menampilkan sisa anggaran dan evaluasi target.
- Gunakan filter transaksi untuk mempermudah pencarian data.
- Jalankan analisis DSS secara berkala agar profil keuangan tetap relevan.

---

## 15. Troubleshooting

### 15.1 Tidak bisa login

Penyebab yang mungkin:

- email atau password salah,
- koneksi internet bermasalah,
- server tidak dapat diakses.

Solusi:

- periksa kembali email dan password,
- cek koneksi internet,
- periksa pengaturan server bila menggunakan server custom.

### 15.2 Scan gagal diproses

Penyebab yang mungkin:

- file tidak valid,
- kamera tidak mendapat izin,
- server OCR sedang bermasalah.

Solusi:

- berikan izin kamera,
- coba gunakan galeri atau PDF,
- ulangi proses scan.

### 15.3 Hasil OCR kurang akurat

Penyebab yang mungkin:

- gambar blur,
- pencahayaan kurang,
- struk terpotong,
- sudut pengambilan gambar miring.

Solusi:

- ambil ulang gambar,
- gunakan pencahayaan lebih terang,
- pastikan seluruh struk masuk ke dalam frame.

### 15.4 Data transaksi tidak muncul

Penyebab yang mungkin:

- filter bulan, kategori, atau jenis transaksi sedang aktif,
- transaksi belum berhasil disimpan,
- koneksi ke server terganggu.

Solusi:

- reset filter,
- refresh halaman transaksi,
- coba simpan ulang transaksi bila diperlukan.

### 15.5 Profil DSS belum muncul

Penyebab yang mungkin:

- profil belum pernah dianalisis,
- data transaksi belum mencukupi,
- analisis perlu dijalankan ulang.

Solusi:

- buka menu DSS,
- tekan `Analyze Sekarang`,
- tunggu sampai proses selesai.

---

## 16. Catatan Tambahan

Dokumen ini mengikuti implementasi aplikasi saat ini. Jika nanti ada perubahan alur, penambahan fitur, atau integrasi backend baru, manual book perlu diperbarui agar tetap sesuai dengan perilaku aplikasi.

Untuk keperluan dokumen resmi, Anda dapat menambahkan:

- logo instansi atau perusahaan,
- nomor dokumen,
- nama penyusun,
- tanggal revisi,
- halaman pengesahan,
- daftar gambar,
- lampiran screenshot.

---

## Lampiran Placeholder Screenshot

Daftar cepat lokasi screenshot yang perlu Anda siapkan:

1. Tampilan awal aplikasi
2. Halaman login
3. Popup pengaturan server
4. Halaman registrasi
5. Beranda
6. Kartu budget di beranda
7. Ringkasan DSS di beranda
8. Daftar transaksi
9. Filter transaksi
10. Detail transaksi
11. Form tambah transaksi
12. Form edit transaksi
13. Menu scan
14. Opsi sumber scan
15. Hasil OCR saat proses
16. Hasil OCR selesai
17. Edit hasil OCR
18. Halaman DSS sebelum analisis
19. Halaman DSS sesudah analisis
20. Halaman akun dan pengaturan
21. Form budget bulanan
22. Pengaturan notifikasi
23. Pengaturan jam tenang
24. Bagian privasi dan data
25. Tombol logout

