# SOP Operasional: Croissant Production Planner
## Coffee Town Bakery

Dokumen ini berisi panduan standar operasional untuk menggunakan aplikasi **Croissant Production Planner**. Tujuannya adalah untuk memastikan presisi berat, efisensi bahan, dan minimalisasi waste (limbah adonan) demi tercapainya kualitas produk yang konsisten.

---

### 1. Persiapan & Input Pesanan (WhatsApp Parser)
Langkah pertama dalam produksi adalah mengumpulkan data pesanan dari outlet.

*   **Salin Teks WhatsApp:** Salin seluruh pesan pesanan dari grup WhatsApp produksi.
*   **Tempel ke Parser:** Buka tab **Production Calculator** dan tempel teks ke kolom "Paste WhatsApp Order".
*   **Eksekusi:** Klik tombol **"Parse & Fill"**. Sistem akan otomatis menjumlahkan produk yang sama dari berbagai outlet.
*   **Verifikasi:** Cek bagian "Recap per Outlet" dan "Product Input Summary" untuk memastikan tidak ada produk yang terlewat. Jika pesanan manual, masukkan langsung pada kolom menu yang tersedia.

---

### 2. Perencanaan Dimensi & Berat (Production Planner)
Setelah pesanan masuk, tentukan strategi lembaran adonan (sheet) yang akan diproduksi.

*   **Pemilihan Produk:** Pada tabel Planner, pilih produk yang akan dikerjakan (pilih maksimal 3 jenis produk jika ingin digabung).
*   **Input Quantity:** Pastikan angka quantity sesuai dengan total pesanan (Baked + Frozen).
*   **Pengaturan Lamination Weight (Target 1 Laminasi):**
    *   Jika target produksi adalah **1 laminasi**, maka atur input hingga berat adonan mendekati **2300 gram**.
    *   **PENTING:** Untuk 1 laminasi, hitung satu sisi saja. Sisi lainnya akan dihitung otomatis oleh sistem.

---

### 3. Optimasi Dimensi "Auto-Dimension Magic"
Gunakan fitur cerdas aplikasi untuk menentukan dimensi lembaran adonan yang paling efisien.

*   **Input Dimensi Dasar:** Masukkan satu dimensi yang sudah pasti (misal: Lebar Sheet sesuai mesin/sheeter, contoh: 166 cm).
*   **Eksekusi Auto:** Klik tombol **"Auto"** pada dimensi yang kosong (misal: Length).
*   **Target Efisiensi:** Pastikan nilai **"Sheets Needed"** mendekati angka **1.000**. Angka ini menunjukkan bahwa produk akan pas mengisi satu lembar adonan secara optimal.

---

### 4. Kontrol Kualitas & Konsistensi (Avg Density)
Fitur ini memastikan data yang dimasukkan konsisten dengan realita fisik adonan di lapangan.

*   **Density Baseline:** Standar massa jenis adonan croissant Coffee Town adalah **1.27 g/cm³**.
*   **Indikator Peringatan (Alert):** Jika kotak **Avg Density** berubah menjadi **MERAH** atau muncul ikon ⚠️, artinya data berat/dimensi produk di sistem menyimpang lebih dari 10% dari standar.
*   **Grammage Check:** Perhatikan kolom **Grammage (g/cm²)**. Pastikan nilainya masuk akal (sekitar 0.3 - 0.4 untuk ketebalan standar).
*   **Density Lock (🔒):** Gunakan tombol gembok untuk melihat/mengunci nilai standar manual sebagai pembanding visual.

---

### 5. Penggabungan Layout (Guillotine Merged Layout)
Untuk efisiensi maksimal, gabungkan beberapa produk dalam satu sheet jika memungkinkan.

*   **Merge Layout:** Klik tombol **"Merge Layout"** untuk melihat visualisasi susunan produk.
*   **Analisis Scrap:** Jika nilai **Scrap Layout %** lebih besar dari *expected scrap rate + process loss*, berarti masih ada ruang kosong yang bisa dijadikan produk tambahan.
*   **Tindakan:** Kurangi dimensi sheet sedikit demi sedikit lalu klik tombol **"Auto"** kembali hingga waste minimal.
*   **Strategi Potong:** Ikuti visualisasi layout yang ditampilkan (Algoritma Guillotine) untuk urutan pemotongan produk di meja produksi.

---

### 6. Perhitungan Berat Mixer (Final Prep)
Langkah terakhir sebelum mengaduk adonan di mixer.

*   **Mixer Weight (+Loss):** Lihat angka pada kolom **"Mixer Weight (+Loss)"** (biasanya berwarna kuning).
*   **Komponen:** Berat ini sudah mencakup:
    *   *Total Gross Weight* (Berat adonan produk).
    *   *Initial Trim %* (Pinggiran yang dibuang saat merapikan sheet).
    *   *Process Loss %* (Adonan yang tertinggal di mixer/alat).
*   **Instruksi:** Pastikan berat adonan yang dibuat di mixer sesuai dengan angka ini untuk menghindari kekurangan adonan saat proses laminasi.

---

### 7. Recipe & Hydration Scaler
Gunakan modul scaler untuk menyesuaikan resep berdasarkan **Mixer Weight**.

*   **Recipe Scaler:** Masukkan multiplier berdasarkan kebutuhan berat adonan.
*   **Hydration Scaler:** Jika tekstur adonan perlu disesuaikan (misal: cuaca panas/dingin), gunakan slider hidrasi untuk menyesuaikan jumlah cairan (Air/Es Batu) tanpa merubah rasio bahan kering lainnya.

---
### 8. Audit Kualitas (QC Auditor)
Gunakan tab **Auditor** untuk memverifikasi presisi di setiap batch produksi.

*   **Mixing & Bulk Audit (Tahap Mixing - STAGE 1):**
    *   Ukur suhu adonan segera setelah mixer berhenti. Target: **22°C - 24.5°C**.
    *   Ambil sampel adonan blok, potong persegi (misal 10x10x4 cm), timbang dan masukkan ke Auditor.
*   **Sheeter Audit (Tahap Sheeting - STAGE 2):**
    *   Ambil sisa adonan (*trim*) di tepian sheet, potong menjadi bentuk persegi (contoh: **10x10 cm**).
    *   Timbang dan masukkan ke Auditor (**Width: 10, Length: 10**). Hasil harus **PASSED (1.21 - 1.33 g/cm³)**.
*   **Baked Audit (Hasil Akhir - STAGE 3):**
    *   Ukur volume produk menggunakan metode *Seed Displacement* (perpindahan bijian).
    *   Input berat mentah, berat panggang, dan volume.
    *   Pastikan **Specific Volume** berada di antara **4.0 - 6.0 cm³/g**.

---

### 9. Referensi Teknis (Proofing & Baking)
Gunakan panduan ini sebagai garis besar untuk menjaga kualitas akhir produk:

*   **Proofing (Pengembangan):**
    *   **Suhu Ideal:** 26°C - 28°C. (Jangan melebihi 30°C karena lapisan mentega akan meleleh/bocor).
    *   **Kelembapan (Humidity):** 75% - 80%.
    *   **Waktu:** 2.5 - 3 jam (sampai produk membal dan bergetar saat loyang digoyang).
*   **Baking (Pemanggangan):**
    *   **Suhu:** 175°C - 185°C (Convection Oven).
    *   **Waktu:** 15 - 18 menit (hingga warna cokelat keemasan merata).
    *   **Glazing:** Gunakan egg wash (campuran telur & sedikit susu/krim) sesaat sebelum masuk oven untuk kilap maksimal.

---

> **CATATAN PENTING:**
> Selalu klik tombol **"CALCULATE"** atau **"Auto"** setiap kali ada perubahan variabel untuk memastikan angka yang ditampilkan adalah yang terbaru. Data formulasi lengkap dapat diakses melalui link **"About"** di bawah halaman utama.
