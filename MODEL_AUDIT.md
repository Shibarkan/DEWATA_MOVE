# Audit Model DewataMove 2041

## Cakupan dan status bukti

Audit ini memeriksa source code dan data yang tersedia di workspace. Berkas TOR/proposal, proposal pembanding, matriks atau traffic count asli, data GTFS/GIS, dan peta tata ruang tergeoreferensi tidak ditemukan sebagai berkas terpisah. Beberapa angka ditanam langsung sebagai konstanta JavaScript, sehingga keberadaan nilainya di aplikasi tidak membuktikan kelengkapan metadata sumbernya.

Label yang dipakai:

- **SOURCE DATA**: nilai yang dimasukkan dari bahan studi atau layanan eksternal; tetap perlu verifikasi berkas asli, definisi, tahun, wilayah, dan satuan.
- **CALCULATED**: hasil operasi/perhitungan kode yang dapat ditelusuri.
- **CALIBRATED**: parameter/hasil yang diuji terhadap observasi independen. Tidak ditemukan kalibrasi model jaringan atau perilaku.
- **ASSUMPTION**: nilai atau mekanisme yang dipilih tanpa estimasi lokal.
- **SENSITIVITY PARAMETER**: asumsi eksplisit yang dapat diubah untuk menguji rentang; bukan prediksi.
- **DATA REQUIRED**: masukan yang belum ada dan diperlukan untuk estimasi yang sah.
- **MODEL LIMITATION**: batas cakupan atau inferensi model yang harus tampak di hasil.

## 1. Ringkasan audit kritis

| Komponen | Status | Temuan dan klaim yang diperbolehkan |
|---|---|---|
| MAT 13 zona 2026 | SOURCE DATA | Nilai tersimpan di `src/data/mobility.js`, berlabel smp/jam dan studi kasus ITEC-U. Berkas sumber asli tidak tersedia untuk memeriksa periode, faktor konversi, definisi zona, atau apakah angka merupakan hitungan, estimasi, atau proyeksi. MAT menggambarkan distribusi OD; bukan model kausal bangkitan/tarikan. |
| Total, intrazona, marginal zona, OD terbesar | CALCULATED | Penjumlahan/urutan elemen matriks di JavaScript. Validasi bentuk dan nilai nonnegatif tersedia. Pemeriksaan ini bukan validasi eksternal atau kalibrasi. |
| MAT horizon 2041 | CALCULATED + ASSUMPTION | Semua sel dikalikan `(1+g)^15`; nilai awal pertumbuhan 1,5% per tahun dan satu tingkat berlaku untuk semua OD. Bukan proyeksi terkalibrasi; tidak menggunakan demografi, tata guna lahan, pendapatan, atau tren historis lokal. |
| Respons kebijakan | ASSUMPTION + SENSITIVITY PARAMETER | Sebelum revisi, kenaikan parkir, headway, feeder, dan prioritas bus langsung mengurangi seluruh/kelompok MAT melalui koefisien internal. Tidak ada estimasi pilihan moda. Revisi tahap ini menonaktifkan hubungan otomatis parkir/layanan dengan MAT. Pengurangan MAT jam puncak/WFH/park-and-ride/sepeda yang diinput langsung adalah sensitivitas, bukan hasil perilaku; pengurangan puncak tidak dipindahkan ke periode lain. |
| Pembagian moda | SOURCE DATA | `dataExplorer.js` berisi nilai berlabel Bali 2024. Boleh disebut referensi Provinsi Bali, tidak boleh disebut pangsa moda Kota Denpasar 2026 atau dipakai sebagai probabilitas pilihan moda lokal. |
| Volume jalan | SOURCE DATA | Lima nilai pada `dataExplorer.js` ditampilkan sebagai contoh Jalan Waturenggong 2022. Unit/definisi hitungan, durasi survei dan representativitas perlu dicek pada berkas asal; tidak mewakili seluruh kota dan tidak tersambung ke assignment. |
| TMD penumpang/load factor | SOURCE DATA | Angka enam koridor berlabel Juni 2026 berada di `dataExplorer.js`, tetapi berkas asal, definisi penumpang, arah/perjalanan, kapasitas, serta cara menghitung load factor tidak disertakan. Bukan demand matrix untuk model pilihan moda. |
| Koridor TMD pada peta | SOURCE DATA + MODEL LIMITATION | Waypoint ditanam di `src/data/tmdNetwork.js`, sebagian rute melintasi Badung, Tabanan, Ubud, bandara, dan Nusa Dua. Geometri jalan dirutekan lewat OSRM/OSM. Ini bukan GTFS/GIS resmi atau pengukuran panjang operasional; tidak ada hitungan service-km/BTS. |
| Jaringan jalan peta beranda | SOURCE DATA + ASSUMPTION | `denpasarNetworkBrowser.js` mengambil geometri OSRM/OSM pada koridor sampel. `estimatedPressure()` membobot kedekatan ruas terhadap 16 OD besar; angka arus yang dihasilkan bukan traffic count dan bukan assignment. After visual memakai faktor 0,88 tetap. |
| Jaringan studio | CALCULATED + MODEL LIMITATION | `trafficAssignment.js` melakukan shortest-distance all-or-nothing pada graf koridor OSRM sampel. Impedansi adalah panjang, bukan waktu atau generalized cost. OD yang gagal snap/terputus dihitung unassigned. Tidak ada kapasitas, BPR, iterasi capacity restraint, atau user equilibrium. |
| Kendaraan bergerak | ASSUMPTION + MODEL LIMITATION | `simulationEngine.js` membangkitkan agen sintetis, tipe kendaraan, kecepatan dan jumlah berdasarkan kelas jalan/tekanan visual; `vehicleDynamics.js` menggunakan bentuk IDM untuk gerak animasi. Bukan posisi GPS, arus aktual, kalibrasi mikrosimulasi, atau kondisi kemacetan faktual. |
| Modul metodologi | MODEL LIMITATION | BPR, V/C, generalized cost, dan kebutuhan armada dijelaskan sebagai kerangka, tetapi tidak seluruhnya dipakai oleh mesin utama. `Transit.jsx` menghitung `ceil(cycleTime/headway)` dari nilai demonstrasi, bukan operasi enam koridor aktual. |
| Parkir, pilihan moda, BTS | DATA REQUIRED | Tarif aktual, waktu perjalanan, VOT, preferensi/koefisien, tarif progresif, panjang dan jadwal layanan, Rp/km, serta okupansi tidak tersedia/terhubung. Tidak boleh disajikan sebagai hasil numerik lokal. |

**CALIBRATED:** belum ada parameter perilaku, waktu tempuh, kapasitas ruas, atau distribusi arus yang terkalibrasi dalam kode yang diaudit. Tidak ada hasil simulasi yang patut disebut prediksi tervalidasi. Klaim “mengurangi kemacetan”, “perpindahan moda sebesar x%”, “kecepatan aktual”, “V/C terukur”, atau “kebutuhan biaya BTS” tidak didukung keluaran model saat ini.

## 2. Interpretasi masukan dosen

| Masukan | Terjemahan model | Status saat ini |
|---|---|---|
| Constraints waktu, biaya, spasial | Setiap atribut memiliki satuan dan sumber; atribut dapat masuk lebih dari satu dimensi, tetapi jangan dicampur tanpa konversi. | Sebagian hanya uraian metodologi; belum tersedia sebagai variabel operasional. |
| Parkir biasa vs progresif | Tarif biasa adalah biaya moneter. Tarif progresif adalah fungsi durasi parkir dan biaya kumulatif. | Tidak ada jadwal tarif/durasi; slider persentase tidak cukup menjadi model parkir. |
| Tarif transit vs perluasan layanan | Tarif adalah biaya pengguna; perluasan membutuhkan panjang rute, service-km, armada, headway dan biaya kontrak. | Peta rute ada; data operasional dan keuangan belum ada. |
| Tidak ada perpindahan otomatis | Pilihan moda harus berasal dari perbandingan utilitas/GC dan karakteristik orang, dengan koefisien hasil survei atau sensitivitas yang ditandai. | Respons otomatis headway/feeder/parkir telah diputus pada revisi kode ini. |
| Kewajaran angka | Uji satuan/tahun/wilayah, batas, konservasi total, cakupan dan respons model sebelum menampilkan hasil. | Validasi MAT dasar ada; rangkaian uji kewajaran dan pembanding observasi belum tersedia. |
| Bangkitan/tarikan beragam faktor | Estimasikan produksi/atraksi dengan sosioekonomi dan penggunaan lahan; gunakan MAT untuk distribusi OD, bukan sebagai sebab tunggal. | MAT hanya dipakai untuk proyeksi skalar dan pemetaan. |
| Metode assignment berbeda | Pisahkan shortest path, AON, capacity restraint dan user equilibrium secara eksplisit. | Implementasi sekarang hanya shortest-distance AON pada koridor sampel. |
| Parkir progresif dan BTS | Hitung fungsi tarif dan biaya layanan dari input operasional terpisah; jangan substitusi tarif penumpang dengan biaya kontrak. | Belum ada kalkulator parkir bertingkat atau biaya BTS. |

## 3. Klasifikasi variabel constraints

Rentang realistis lokal belum bisa diberi angka tanpa definisi layanan, survei, atau standar rujukan yang sesuai. “DATA REQUIRED” di kolom rentang berarti jangan mengisi batas numerik rekaan. Formula di bawah adalah spesifikasi, bukan klaim sudah diimplementasikan.

| Nama variabel | Dimensi constraint | Definisi | Satuan | Peran dalam model | Sumber data | Status data | Rentang realistis | Hubungan variabel | Formula | Kalibrasi | Modul aplikasi |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Waktu dalam kendaraan | Waktu, spasial | Lama perjalanan di ruas/rute | menit/trip | GC, assignment | GPS/survei waktu/GTFS | DATA REQUIRED | DATA REQUIRED per OD/periode | Jarak, kecepatan, V/C | `T=ΣL_a/v_a` | Ya, observasi waktu | `trafficAssignment.js`, `policyEngine.js` |
| Waktu tunggu | Waktu | Waktu sebelum naik/transfer | menit | GC transit | Jadwal dan headway aktual | DATA REQUIRED | Berdasar jadwal/distribusi kedatangan | Headway, reliabilitas | Acak kedatangan: `E[W]≈H/2` hanya bila asumsi kedatangan acak dan layanan teratur | Ya | `Transit.jsx`, pilihan moda |
| Akses jalan kaki halte | Spasial + waktu | Rute jalan kaki dari asal/tujuan ke halte | m, menit | aksesibilitas/GC | GIS pejalan kaki, survei | DATA REQUIRED | Ambang sesuai kebijakan dan kelompok pengguna | Lokasi halte, jaringan, mobilitas | `Twalk=dwalk/vwalk` | Validasi lokal | TMD, pilihan moda |
| Transfer | Waktu + biaya + penalti | Waktu, biaya dan ketidaknyamanan transfer | menit, Rp/trip, penalti | GC transit | GTFS, tarif, survei | DATA REQUIRED | DATA REQUIRED | Jumlah transfer, feeder, jadwal | `GC += Ctransfer + VOT*Ttransfer + Ptransfer` | RP/SP | Pilihan moda |
| Headway/frekuensi | Waktu + kapasitas | Jarak waktu antar keberangkatan | menit, bus/jam | tunggu, kapasitas, armada | GTFS/operator | DATA REQUIRED; slider hanya skenario | DATA REQUIRED per koridor/jam | Cycle time, armada, load factor | `f=60/H`; `N=ceil(Tcycle/H)` | Jadwal aktual | `Transit.jsx`, TMD |
| Jam puncak/keberangkatan | Waktu | Periode dan distribusi waktu mulai perjalanan | interval waktu | time-sliced OD | Survei OD/count berwaktu | DATA REQUIRED | Kalender survei setempat | tujuan, jadwal kerja/sekolah | `T_od,p = T_od * share_od,p` | Survei | model demand |
| Durasi parkir | Waktu | Lama kendaraan menempati petak | menit/jam | biaya progresif dan okupansi | transaksi/survei parkir | DATA REQUIRED | Distribusi observasi | Tujuan, tarif, ketersediaan | `P=P(d)` | Survei | modul parkir |
| Cycle time | Waktu | Waktu satu siklus layanan termasuk putar/buffer | menit/siklus | kebutuhan armada | GPS/jadwal operator | DATA REQUIRED; Transit demo saja | DATA REQUIRED | Panjang rute, waktu berhenti, headway | `N=ceil(Tcycle/H)` | Operasional | `Transit.jsx` |
| Reliabilitas | Waktu + penalti | Variasi waktu/waktu persentil perjalanan | menit, rasio | penalti kualitas layanan | AVL/GPS historis | DATA REQUIRED | Distribusi empiris | kemacetan, jadwal | `P=VOT*reliabilityBuffer` atau koefisien hasil estimasi | Ya | pilihan moda |
| Tarif penumpang | Biaya | Tarif dasar dan transfer yang dibayar | Rp/trip | GC pengguna | Tarif resmi/operator | DATA REQUIRED | Tarif berlaku | Transfer, jenis pengguna | `Cfare=Σfare_leg` | Verifikasi kebijakan | pilihan moda/TMD |
| Bahan bakar | Biaya | BBM per perjalanan | Rp/trip | GC privat | Harga, konsumsi kendaraan, jarak | DATA REQUIRED | Kendaraan/kondisi | Jarak, efisiensi, harga | `Cfuel=d*consumption*price` | Verifikasi dan survei | pilihan moda |
| Parkir biasa | Biaya | Tarif untuk durasi/lokasi tertentu | Rp/trip | GC privat | Perda/observasi tarif | DATA REQUIRED | Tarif resmi menurut lokasi | Durasi, tujuan | `P(t)=tarif berlaku` | Verifikasi | modul parkir/GC |
| Parkir progresif | Waktu + biaya | Akumulasi tarif menurut blok durasi | Rp/trip | disinsentif/GC | Perda dan transaksi | DATA REQUIRED | Jadwal resmi | Durasi dan lokasi | `P(t)=Σ_k r_k·durasi_k` dengan batas tiap blok sesuai aturan | Verifikasi + respons | modul parkir/GC |
| Biaya transfer | Biaya | Biaya tambahan perpindahan layanan | Rp/trip | GC transit | Tarif resmi | DATA REQUIRED | DATA REQUIRED | Jumlah transfer/integrasi tarif | `ΣCtransfer` | Verifikasi | pilihan moda |
| VOT | Biaya/waktu | Nilai ekonomi waktu kelompok pengguna | Rp/jam | konversi waktu ke uang | Survei pendapatan/RP-SP/literatur lokal | DATA REQUIRED | Estimasi per segmen, bukan angka tunggal rekaan | Pendapatan, tujuan, waktu | `GC=C+VOT*T+P` | Estimasi | pilihan moda |
| Biaya operasi kendaraan | Biaya + jarak | Biaya variabel/tetap perjalanan | Rp/km atau Rp/trip | GC privat dan operator | Harga/biaya kendaraan | DATA REQUIRED | Jenis kendaraan | Jarak, okupansi, BBM | `Cveh=d*c_km` | Verifikasi | pilihan moda/BTS |
| Generalized cost | Waktu + biaya + kualitas | Biaya moneter ekuivalen seluruh komponen | Rp/trip | pembanding alternatif moda | Gabungan data di atas | DATA REQUIRED | Dihasilkan dari input tervalidasi | waktu, VOT, tarif, akses, reliabilitas | `GC_m=C_m+VOT_i*T_m+P_m` | Koefisien/perilaku perlu estimasi | model pilihan moda |
| Insentif/disinsentif | Biaya | Subsidi, biaya akses, atau kebijakan harga | Rp/trip | kebijakan | Regulasi/skenario | DATA REQUIRED atau skenario | Tegaskan dasar kebijakan | GC dan kelompok sasaran | Tambah/kurangi `C_m` | Uji respons | TDM |
| Jarak perjalanan | Spasial | Jarak jaringan OD, bukan garis lurus | km/trip | rute, biaya, akses | GIS jaringan terverifikasi | DATA REQUIRED untuk OD aktual; centroid tersedia | DATA REQUIRED | Zona, rute, waktu | `d=ΣL_a` | Validasi jaringan | assignment |
| Panjang rute | Spasial | Jarak rute transit/feeder per arah | km/arah | service-km dan operasi | GTFS/GIS/operator | DATA REQUIRED; waypoint peta bukan panjang resmi | DATA REQUIRED | Perjalanan, frekuensi | `Lroute=ΣL_segmen` | Validasi lapangan/GIS | `tmdNetwork.js`, transit |
| Catchment/cakupan halte | Spasial + waktu | Area/penduduk dapat mengakses halte dengan ambang tertentu | m, km², orang | aksesibilitas | GIS jalan kaki, populasi | DATA REQUIRED | Definisikan ambang berjalan; jangan gunakan buffer lurus sebagai akses aktual | halte, hambatan, jaringan | Analisis jaringan/service area | Validasi GIS | TMD |
| Kerapatan jaringan jalan | Spasial | Panjang jalan per luas/penduduk | km/km² atau km/1.000 orang | aksesibilitas dan produksi perjalanan | GIS jalan dan batas zona | DATA REQUIRED | DATA REQUIRED | luas, penduduk, kelas jalan | `ΣLroad/area` | Pemeriksaan GIS | produksi/atraksi |
| Tata guna lahan/pusat aktivitas | Spasial | Luas/intensitas guna lahan, pekerjaan, fasilitas | ha, pekerjaan, m², indeks | produksi/atraksi dan tujuan | RTRW/RDTR/GIS/fasilitas | DATA REQUIRED; gambar nongeoreferensi bukan layer ukur | DATA REQUIRED | populasi, tujuan | variabel zonal; fungsi perlu estimasi | Ya | demand model |
| Kapasitas ruang jalan | Spasial + kapasitas | Kemampuan ruas/simpang per periode | smp/jam/lajur | V/C dan tundaan | survei geometri, PKJI, simpang | DATA REQUIRED | Berdasar tipe dan kondisi lokal | lajur, lebar, hambatan, sinyal | `V/C`; PKJI/BPR sesuai cakupan | Kalibrasi/verifikasi | assignment |
| Internal-eksternal | Spasial + distribusi | Perjalanan internal kota, lintas batas, dan eksternal | trip/periode | batas MAT dan jaringan | Survei cordon/OD | DATA REQUIRED | DATA REQUIRED | batas wilayah, tujuan eksternal | OD eksternal eksplisit | Validasi | demand/assignment |
| First-mile/last-mile | Spasial + waktu + biaya | Akses sebelum/sesudah transit | m, menit, Rp | aksesibilitas/GC | GIS dan survei | DATA REQUIRED | Segmentasi pengguna | feeder, halte, walkability | biaya/waktu akses ditambahkan ke GC | RP/SP | transit |
| Service-km | Spasial + frekuensi + waktu | Produksi layanan kendaraan | bus-km/hari atau periode | biaya dan output BTS | Rute, jadwal/operator | DATA REQUIRED | DATA REQUIRED | panjang, trip, hari operasi | `km/arah × keberangkatan tiap arah × hari operasi` | Audit jadwal | BTS |
| Biaya kontrak BTS | Biaya | Pembayaran operator per kendaraan-km | Rp/km, Rp/periode | anggaran layanan | kontrak/standar biaya resmi | DATA REQUIRED | DATA REQUIRED; jangan pakai tarif penumpang | service-km | `Biaya=service-km×Rp/km` | Verifikasi kontrak | BTS |

## 4. Kerangka bangkitan dan tarikan

MAT adalah distribusi perjalanan antar zona, bukan penjelasan sebab terbentuknya perjalanan. Kerangka awal yang harus diestimasi per periode dan segmen dapat ditulis:

`P_i = f(populasi_i, rumah_tangga_i, pendapatan_i, kepemilikan_kendaraan_i, pekerjaan_i, tujuan_perjalanan, sosial_ekonomi_i)`

`A_j = g(pekerjaan_j, pendidikan_j, perdagangan_j, pariwisata_j, fasilitas_j, intensitas_lahan_j, aksesibilitas_j)`

Distribusi OD kemudian menggunakan model distribusi/tujuan yang sesuai dan dikalibrasi pada MAT observasi. Kerapatan jalan menjadi atribut aksesibilitas, bukan pengganti variabel sosioekonomi. Perjalanan internal-eksternal perlu dimodelkan terpisah. Data populasi, rumah tangga, pendapatan per kapita, kepemilikan kendaraan, pekerjaan, fasilitas, intensitas guna lahan, dan survei OD berperiode belum terhubung. Tanpa data tersebut, jangan menghitung produksi/atraksi baru dari MAT saja.

## 5. Kerangka pemilihan moda

Untuk orang/segmen `i` dan moda `m`:

`GC_im = C_im + VOT_i × T_im + P_im`

`T_im = Tjalan + Ttunggu + Ttransfer + Tdalam_kendaraan`

`P_im` memuat penalti ketidakandalan, ketidaknyamanan, transfer, keselamatan/keamanan, dan kesulitan akses. Jangan memasukkan penalti sebagai rupiah tanpa VOT/koefisien yang konsisten.

Kerangka probabilistik dapat memakai `U_im = ASC_m + βGC·GC_im + βX·X_i,m` dan `Pr(m|i)=exp(U_im)/Σ_k exp(U_ik)`. Koefisien harus diestimasi dari revealed/stated preference atau literatur yang sesuai dan diuji lokal; tanpa itu hasil hanya rentang sensitivitas dengan label **ASSUMPTION / SENSITIVITY PARAMETER**, bukan prediksi. Segmentasikan setidaknya kepemilikan kendaraan, pendapatan, tujuan, usia/mobilitas, jarak, feeder, headway, tarif, tunggu, transfer, reliabilitas, keamanan/kenyamanan, dan kebiasaan.

Data MAT sekarang bersatuan smp/jam, bukan orang. Untuk mengubah probabilitas pilihan orang menjadi arus kendaraan, diperlukan jumlah perjalanan orang, okupansi kendaraan, faktor konversi smp per kendaraan, dan kapasitas angkutan umum. Sampai tersedia, model tidak boleh menyatakan angka perpindahan penumpang/moda.

## 6. Perbandingan metode pembebanan jaringan

| Metode | Mekanisme | Keluaran yang layak dibandingkan | Data/keterbatasan |
|---|---|---|---|
| Shortest path | Mencari lintasan impedansi minimum (jarak, waktu atau GC yang dipilih). Bukan metode pembebanan dengan sendirinya. | Rute/impedansi untuk OD | Perlu graf terarah dan bobot konsisten. |
| All-or-nothing | Seluruh demand OD dibebankan ke shortest path pada biaya yang diberikan; biaya tidak berubah mengikuti arus. | Arus ruas, rute, OD terassign | Baseline saat ini memakai jarak pada graf OSRM sampel; tidak merepresentasikan kapasitas atau pilihan rute terdistribusi. |
| Capacity restraint | Memperbarui waktu ruas menurut volume/kapasitas secara iteratif, membebankan ulang sampai kriteria berhenti. | Arus, waktu, V/C, perubahan rute, iterasi | Memerlukan kapasitas, `t0`, volume dasar, fungsi tundaan, parameter, skema iterasi dan ambang konvergensi. BPR: `t_a=t0_a[1+α(v_a/c_a)^β]`; α/β berlabel asumsi sampai kalibrasi. |
| User equilibrium | Memenuhi Wardrop: rute yang dipakai untuk OD memiliki biaya minimum sama dan tak ada pengguna yang untung dengan pindah rute. | Arus, biaya/rute, gap konvergensi, sensitivitas kapasitas | Perlu waktu/biaya link-flow yang konsisten dan algoritma konvergensi (misalnya Frank-Wolfe); belum tersedia. |

Baseline aplikasi harus disebut **shortest-distance all-or-nothing pada jaringan koridor sampel**. Jangan menyebutnya rute tercepat (impedansinya jarak), capacity restraint, equilibrium, atau kondisi kemacetan. Perbandingan kelak wajib melaporkan arus tiap ruas, waktu, V/C, rute, unassigned demand, cakupan jaringan, konvergensi, sensitivitas kapasitas dan kebutuhan data.

## 7. Model parkir progresif

Definisikan tarif resmi per lokasi dan blok durasi. Contoh bentuk umum (nilai blok/tarif tetap DATA REQUIRED):

`P(t,l)=Σ_k r_(l,k) × durasi_tertagih_k(t)`

atau jadwal tarif kumulatif bertingkat sesuai Perda/operator. Implementasi perlu tarif dasar, awal/akhir setiap blok, lama parkir, aturan maksimum, lokasi, kelompok terdampak, ketersediaan alternatif dan perubahan GC. Persentase kenaikan tarif saja bukan fungsi progresif dan tidak menghasilkan respons moda tanpa model perilaku.

## 8. Model BTS dan Rp/km

Pisahkan tarif pengguna, panjang, jadwal dan biaya operator. Jika panjang rute satu arah `L`, ada `D` keberangkatan per arah per hari selama `N` hari operasi:

`Service-km = L × (D_pergi + D_pulang) × N`

Jika jumlah perjalanan sudah mencakup dua arah, jangan dikalikan dua lagi. Tambahkan deadhead/layover hanya jika definisi kontrak mengharuskannya. `Biaya BTS = service-km × tarif kontrak Rp/km`. Kebutuhan minimum armada awal `ceil(cycle time/headway)` perlu armada cadangan, variasi cycle time, dan jadwal aktual sebelum dijadikan kebutuhan pengadaan. Tarif yang dibayar penumpang tidak boleh digunakan sebagai biaya kontrak operator.

## 9. Pemeriksaan kewajaran
Pemeriksaan numerik yang tersedia menghasilkan total MAT 2026 **1.316.578 smp/jam**, intrazonal **173.476 smp/jam**, dan OD terbesar Z11→Z03 **192.833 smp/jam**. Dengan pertumbuhan default 1,5% majemuk selama 15 tahun, total 2041 menjadi sekitar **1.646.028 smp/jam** (naik sekitar 25,0%). Bentuk matriks valid, tetapi skala total untuk satu jam pada wilayah kota patut diverifikasi terhadap sumber asli: DATA REQUIRED untuk memastikan unit/periode, cakupan eksternal, faktor ekspansi, dan kemungkinan penggandaan. Angka ini belum boleh dinyatakan wajar hanya karena penjumlahan cocok.

Rentang slider bukan rentang empiris yang tervalidasi: pertumbuhan 0–5%/tahun, parkir 0–100%, headway 5–30 menit, indeks feeder 0–100, pergeseran puncak 0–30%, WFH 0–20%, park-and-ride/sepeda 0–25%. Angka batas tersebut adalah **SENSITIVITY PARAMETER** internal, bukan rentang perilaku realistis lokal. Kecepatan animasi 8–50 km/jam per kelas jalan, jumlah agen visual maksimum 1.800, faktor kepadatan, serta faktor After 0,88 juga parameter visual, bukan hasil kalibrasi.

Sebelum angka ditampilkan sebagai hasil: (1) validasi dimensi MAT 13×13, nonnegatif, unit dan periode; (2) rekonsiliasi total sebelum/sesudah dan bedakan perjalanan total harian dari demand jam puncak; (3) jangan menyamakan smp dengan orang/kendaraan; (4) cocokkan tahun/wilayah sumber; (5) cek arah ruas, konektivitas, snap zone, OD unassigned, serta cakupan graf; (6) cek kapasitas, kecepatan bebas, waktu tempuh dan V/C dengan satuan/periode sepadan; (7) cek konservasi total orang ketika moda berpindah dan batas perpindahan tidak melebihi demand/kapasitas layanan; (8) cek load factor, kapasitas armada, headway, cycle time dan kebutuhan armada; (9) cek panjang, perjalanan layanan, service-km dan biaya BTS; (10) uji biaya parkir/GC dan respons sensitivitas dengan rentang yang bersumber; (11) bandingkan arus ruas dengan traffic count independen; (12) lakukan uji ekstrem dan laporkan kegagalan/konvergensi.

Saat ini hanya cek bentuk/nonnegatif matriks dan aritmetika sederhana yang tersedia. Kecepatan kendaraan di peta tidak berasal dari pengukuran. Warna peta boleh disebut **tekanan arus relatif/ilustrasi skenario**, tidak boleh disebut macet, kecepatan aktual, atau V/C terukur. Mode share Bali 2024 bukan mode share Denpasar; MAT smp/jam bukan orang atau kendaraan tanpa faktor konversi.

## 10. Data-gap matrix

| Data diperlukan | Penggunaan | Cara memperoleh | Prioritas/status |
|---|---|---|---|
| TOR/proposal dan file sumber MAT 2026; zona, periode, faktor smp | Verifikasi baseline dan wilayah | Minta berkas asli, metadata, proses pembentukan MAT | P0 · DATA REQUIRED |
| MAT/person-trip OD dan time slice | Bangkitan, distribusi, pilihan moda | Survei rumah tangga/RP-SP, cordon/traffic count, ekspansi berbobot | P0 |
| Penduduk, rumah tangga, pendapatan, kendaraan, pekerjaan per zona | Produksi/atraksi dan segmentasi | BPS, administrasi, survei rumah tangga; tahun dan batas zona harus sama | P0 |
| Guna lahan, sekolah, kerja, perdagangan/jasa, wisata, fasilitas | Daya tarik dan aksesibilitas | RDTR/RTRW GIS, POI tervalidasi, data fasilitas/pekerjaan | P0 |
| Jaringan jalan lengkap, arah, simpang, lajur, kelas, kondisi | Routing dan kapasitas | GIS otoritatif + survei lapangan/PKJI | P0 |
| Traffic count per ruas/simpang, kelas kendaraan, jam dan faktor smp | Kalibrasi dan validasi assignment | Traffic counting berulang pada periode representatif | P0 |
| Kecepatan/waktu tempuh dan variasi waktu | Impedansi dan reliabilitas | GPS/probe atau floating-car survey per waktu | P1 |
| TMD GTFS/GIS, halte, jadwal aktual, fare, kapasitas, AVL | Waktu akses, transfer, kapasitas, armada | Operator/Dishub, survei halte dan validasi rute | P0 |
| Penumpang TMD per perjalanan/segmen, arah, jam; definisi LF | Validasi transit dan demand | Data tiket/boarding dan kapasitas efektif | P0 |
| Tarif parkir progresif, okupansi, durasi, lokasi | Fungsi biaya parkir dan respons | Perda/operator, transaksi, survei parkir | P1 |
| Biaya kontrak operator dan Rp/km | Anggaran BTS | Dokumen kontrak/pengadaan dan definisi kilometer terbayar | P1 |
| RP/SP, VOT, preferensi, keamanan, kenyamanan, kebiasaan | Koefisien pilihan moda | Survei terstruktur, estimasi dan validasi model | P1 |
| Struktur tarif transfer, feeder, park-and-ride, jaringan sepeda/pejalan kaki | Multimodal GC dan akses | Operator, GIS jaringan, survei fasilitas | P1 |
| Populasi dan batas spasial catchment | Cakupan layanan | GIS network service-area dengan akses jalan kaki | P1 |

## 11. Rekomendasi revisi aplikasi

Urutan disarankan agar output lama tidak disalahartikan dan fitur peta tetap bekerja:

1. **Tahap validitas (sekarang):** benahi label metadata; nyatakan data/asumsi/batasan; hilangkan respons otomatis headway, akses feeder, tarif parkir, dan prioritas bus terhadap MAT; pertahankan output sensitivitas yang diinput langsung dengan label jelas.
2. **Tahap data & constraints:** tambah skema parameter bertipe (nilai, unit, tahun, wilayah, sumber, status, rentang, kalibrasi) dan validasi input; jangan aktifkan formula ketika DATA REQUIRED.
3. **Tahap demand:** hubungkan data sosioekonomi/guna lahan, time-sliced MAT dan internal-eksternal; estimasi produksi/atraksi dan distribusi OD secara terpisah.
4. **Tahap perilaku:** implementasikan generalized cost dan pilihan moda berbasis segmen setelah data RP/SP, VOT, tarif, waktu, akses, kapasitas serta koefisien tersedia. Sampai itu, tampilkan rentang sensitivitas terpisah dan jangan mengubah MAT secara otomatis.
5. **Tahap assignment:** pertahankan AON sekarang sebagai baseline bernama tepat; capacity restraint/BPR dan equilibrium menjadi metode baru terpisah setelah jaringan, kapasitas, kecepatan dan count tersedia.
6. **Tahap operasi transit/parkir:** tambahkan jadwal tarif progresif; kalkulator service-km, fleet, kapasitas dan biaya kontrak BTS memakai input sumber, terpisah dari tarif penumpang.
7. **Tahap peta/kontrol:** tampilkan status input, metode assignment, coverage/unassigned, tahun, satuan dan banner keterbatasan. Jangan tampilkan agen sintetis sebagai kendaraan aktual.
8. **Pengujian:** unit test formula/proyeksi/validasi/matriks, property test konservasi demand, uji batas dan satuan, test assignment unassigned/cakupan, BPR monotonik terhadap V/C, uji fleet/service-km/BTS/parkir, serta regresi label UI.

## 12. Daftar perubahan kode per file

| File | Perubahan yang diperlukan | Dampak terhadap keluaran lama |
|---|---|---|
| `src/data/mobility.js` | Pindahkan metadata sumber MAT, mode share Bali, satuan, tahun/wilayah, dan faktor konversi ke skema data; hindari angka tanpa provenance. | Ringkasan MAT tetap, klaim mode share lokal dihindari. |
| `src/data/policyEngine.js` | Pisahkan pertumbuhan, perubahan jam puncak eksplisit, perubahan moda dan pengurangan/redistribusi perjalanan; tambah generalized cost/model pilihan moda dengan koefisien DATA REQUIRED sampai tersedia. | Tahap validitas saat ini tidak lagi memberi efek otomatis dari parkir/headway/feeder/prioritas; hasil lama turun/berubah dan tidak comparable langsung. |
| `src/data/modelEngine.js` | Hapus/arsipkan mesin V1 yang tumpang tindih setelah pemanggil dipastikan; konsolidasikan sumber MAT/proyeksi dan definisi AON. | Menghindari dua mesin dengan asumsi berbeda. |
| `src/data/trafficAssignment.js` | Pertahankan AON bernama eksplisit; tambahkan mode capacity restraint/equilibrium sebagai implementasi terpisah, bukan label pada AON. | Arus ruas bisa berubah setelah data jaringan/impedansi lengkap. |
| `src/data/denpasarNetworkBrowser.js` | Hapus `estimatedPressure` sebagai arus observasi; metadata jelas sebagai visual sintetis atau ganti dengan count terukur. Jangan gunakan faktor After tetap 0,88 sebagai dampak TDM. | Visual sebelum/sesudah lama tidak lagi terlihat sebagai hasil volume aktual. |
| `src/data/denpasarNetworkModeling.js` | Simpan atribut kapasitas, free-flow time, tipe ruas, arah, sumber dan tahun setelah tersedia; hindari mask geometri sebagai pengganti jaringan tervalidasi. | Assignment lebih luas hanya setelah sumber jaringan lolos validasi. |
| `src/data/tmdNetwork.js` | Kaitkan rute/halte ke GTFS/GIS resmi; hitung panjang per arah, perjalanan, frekuensi dan waktu siklus dari sumber, bukan waypoint saja. | Peta rute dapat dipertahankan; angka operasi baru menunggu data. |
| `src/data/transportEconomics.js` (baru) | Fungsi murni generalized cost, tarif progresif, service-km, biaya BTS dan fleet; tolak input wajib yang kosong/tidak valid. | Tidak ada nilai hasil sampai parameter aktual dimasukkan. |
| `src/components/modeling/studio/Controls.jsx` | Tampilkan status, satuan, sumber dan alasan dari skema referensi yang benar; rentang sensitivitas bukan hasil survei. | Penjelasan slider sekarang muncul sesuai metadata. |
| `src/components/modeling/studio/ProcessStage.jsx` | Labelkan atribut TDM yang belum mengubah demand; tampilkan dampak langsung dari sensibilitas secara terpisah. | Pengguna tidak lagi mengira tambahan/headway adalah modal shift terhitung. |
| `src/components/modeling/studio/ComparisonSummary.jsx`, `ComparisonResults.jsx` | Ganti klaim “dampak TDM” dengan “perubahan skenario/sensitivitas”; tampilkan total demand, peak demand, dan status metode secara terpisah. | Angka lama tidak lagi layak dibandingkan sebagai efektivitas kebijakan. |
| `src/components/modeling/studio/MethodLimits.jsx`, `Explanation.jsx` | Samakan istilah assignment dan caveat dengan metode yang benar-benar dijalankan. | Tidak mengklaim congestion/equilibrium. |
| `src/pages/Methodology.jsx` | Bedakan rumus konseptual dari implementasi aktif; tautkan status data/calibration. | Pembaca proposal mengetahui bagian yang belum dihitung. |
| `src/pages/DataExplorer.jsx` | Tampilkan wilayah/tahun/unit sumber untuk semua grafik; tandai data emisi, BBM, count dan load factor yang unit/provenance-nya belum pasti. | Angka historis tetap sebagai referensi, bukan input model tanpa validasi. |
| `src/pages/Transit.jsx` | Ganti draft layanan dengan input bertanda sumber; tambah panjang, perjalanan, hari, kapasitas dan tarif kontrak BTS bila data ada. | Hasil demo armada tidak disamakan dengan kebutuhan TMD aktual. |
| `src/components/home/SimulationDataPanel.jsx`, `useSimulationMap.js`, `simulationEngine.js` | Pertahankan visual sebagai ilustrasi; beri label tekanan relatif; pisahkan animasi sintetis dari assignment. | Peta tetap berfungsi tetapi tidak mengklaim kendaraan/kecepatan aktual. |

**Perubahan kode tahap audit ini:** `policyEngine.js` tidak lagi otomatis memetakan tarif parkir atau perbaikan layanan menjadi penurunan MAT; pengurangan MAT puncak dilabeli sensitivitas dan tidak diklaim berpindah ke luar puncak; slider referensi dibetulkan. Implementasi penuh pilihan moda, BPR/equilibrium, parkir progresif dan BTS ditahan sampai data gap terkait terisi. Ini mengubah hasil TDM yang sebelumnya turun otomatis (misalnya preset terintegrasi); hasil sebelum revisi tidak boleh dibandingkan langsung dengan tahap ini.

## 13. Batasan model

- Batas wilayah MAT, zona, dan jaringan sampel tidak seragam; sejumlah zona/koridor keluar dari Denpasar. Analisis kota harus memisahkan internal dan eksternal.
- MAT smp/jam belum dapat diubah menjadi orang, kendaraan, atau penumpang tanpa faktor konversi dan okupansi.
- MAT 2026 skalar tidak mengandung alasan kausal perjalanan, waktu keberangkatan, atau struktur sosial ekonomi.
- Pertumbuhan 2041 berlaku rata ke setiap OD dan bukan forecast terkalibrasi.
- Skema respons langsung yang masih tersedia hanya sensitivitas yang diinput pengguna, bukan hasil survei atau mode-choice model.
- OSRM/OSM memberi geometri/rute jalan pada sampel, bukan volume, kecepatan, kapasitas, atau jaringan lengkap tervalidasi.
- AON menggunakan impedansi jarak. Tidak ada capacity restraint, BPR aktif, user equilibrium, transit assignment atau multimodal assignment.
- Animasi kendaraan sintetis bukan kondisi lalu lintas aktual.
- Statistik Bali 2024, observasi Waturenggong 2022 dan TMD Juni 2026 berbeda wilayah/periode; tidak boleh disatukan tanpa harmonisasi.
- Dokumen proposal/TOR/peta dan data asli yang tidak ada di workspace belum bisa diaudit silang dengan source code.

## 14. Saran kalimat proposal

> DewataMove 2041 merupakan prototipe eksplorasi skenario transportasi yang menggunakan MAT 13 zona tahun 2026 (smp/jam) sebagai input distribusi OD. Proyeksi ke 2041 menggunakan pertumbuhan majemuk seragam sebagai parameter sensitivitas, bukan prakiraan terkalibrasi. Pembebanan yang saat ini tersedia adalah shortest-distance all-or-nothing pada jaringan koridor jalan sampel OSRM/OpenStreetMap; metode ini belum memperhitungkan kapasitas, tundaan, capacity restraint, user equilibrium, atau kondisi lalu lintas aktual. Perubahan tarif dan mutu layanan tidak ditafsirkan sebagai perpindahan moda terhitung karena data biaya/waktu perjalanan, karakteristik pengguna, preferensi perjalanan, kapasitas layanan, serta koefisien pilihan moda lokal belum tersedia. Pengurangan MAT jam puncak yang diuji sebagai sensitivitas tidak didistribusikan ke periode nonpuncak, sehingga bukan model pergeseran waktu perjalanan. Karena itu, angka skenario ditafsirkan sebagai hasil perhitungan eksploratif/sensitivitas, bukan prediksi dampak kebijakan. Estimasi bangkitan-tarikan, pilihan moda, kinerja ruas, parkir progresif, dan biaya BTS memerlukan pengumpulan serta kalibrasi data sosioekonomi, GIS/GTFS, survei OD/traffic count, waktu tempuh, tarif, okupansi, dan biaya operasional.