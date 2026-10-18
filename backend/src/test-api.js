const assert = require('assert');
const { initDatabase } = require('./db/pool');
const { app } = require('./index');

async function runTests() {
  await initDatabase();
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api`;

  console.log(`[TEST] Menjalankan pengujian integrasi API pada ${baseUrl}...`);

  try {
    // 1. Healthcheck & pastikan 20 data contoh ada
    const healthRes = await fetch(`${baseUrl}/health`);
    const health = await healthRes.json();
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(health.success, true);
    assert.ok(health.totalIncidents >= 20, `Jumlah data contoh harus >= 20, ditemukan: ${health.totalIncidents}`);
    console.log(`✓ [1/6] Healthcheck & 20 data contoh terverifikasi (${health.totalIncidents} data).`);

    // 2. Uji Autentikasi Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin123!' }),
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginData.data.token, 'Token JWT harus dikembalikan');
    const token = loginData.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    console.log('✓ [2/6] Autentikasi JWT berhasil.');

    // 3. Uji Daftar & Detail Satu Data
    const listRes = await fetch(`${baseUrl}/incidents?limit=25`, { headers: authHeaders });
    const listData = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.ok(listData.data.length >= 20);

    const firstId = listData.data[0].id;
    const detailRes = await fetch(`${baseUrl}/incidents/${firstId}`, { headers: authHeaders });
    const detailData = await detailRes.json();
    assert.strictEqual(detailRes.status, 200);
    assert.strictEqual(detailData.data.id, firstId);
    console.log(`✓ [3/6] Daftar (${listData.data.length} item) & Detail satu data (#${firstId}) berhasil.`);

    // 4. Uji Validasi Backend (Isian wajib, kode unik, tanggal valid, angka >= 0, pilihan kategori/status)
    const invalidRes = await fetch(`${baseUrl}/incidents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        kode_gangguan: 'INC-2026-001', // Duplikat!
        judul: '', // Wajib!
        deskripsi: 'Pendek', // Kurang dari 10 karakter
        kategori: 'KategoriSalah', // Di luar pilihan
        status: 'StatusSalah', // Di luar pilihan
        prioritas: 'PrioritasSalah',
        tanggal_kejadian: '2026-02-30', // Tanggal tidak valid
        durasi_downtime: -10, // Negatif!
        jumlah_pengguna_terdampak: -5, // Negatif!
        biaya_pemulihan: -100, // Negatif!
        sistem_terdampak: '', // Wajib!
        pelapor: '', // Wajib!
      }),
    });
    const invalidData = await invalidRes.json();
    assert.strictEqual(invalidRes.status, 400);
    assert.ok(invalidData.errors.kode_gangguan, 'Harus menolak kode duplikat');
    assert.ok(invalidData.errors.judul, 'Harus menolak judul kosong');
    assert.ok(invalidData.errors.kategori, 'Harus menolak kategori di luar pilihan');
    assert.ok(invalidData.errors.status, 'Harus menolak status di luar pilihan');
    assert.ok(invalidData.errors.tanggal_kejadian, 'Harus menolak tanggal tidak valid');
    assert.ok(invalidData.errors.durasi_downtime, 'Harus menolak durasi negatif');
    assert.ok(invalidData.errors.jumlah_pengguna_terdampak, 'Harus menolak jumlah pengguna negatif');
    assert.ok(invalidData.errors.biaya_pemulihan, 'Harus menolak biaya negatif');
    console.log('✓ [4/6] Validasi backend (wajib, kode unik, tanggal, angka >= 0, kategori & status) terverifikasi.');

    // 5. Uji Tambah (POST) & Ubah (PUT) pada data yang benar
    const testCode = `INC-TEST-${Date.now()}`;
    const createRes = await fetch(`${baseUrl}/incidents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        kode_gangguan: testCode,
        judul: 'Pengujian Otomatis Penambahan Catatan Gangguan TI',
        deskripsi: 'Deskripsi lengkap pengujian penambahan catatan gangguan pada database PostgreSQL.',
        kategori: 'Aplikasi',
        status: 'Terbuka',
        prioritas: 'Tinggi',
        tanggal_kejadian: '2026-10-18',
        durasi_downtime: 0,
        jumlah_pengguna_terdampak: 50,
        biaya_pemulihan: 0,
        sistem_terdampak: 'Layanan Uji Integrasi',
        pelapor: 'Automated Tester',
        penanggung_jawab: 'Tim QA',
      }),
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    const createdId = createData.data.id;

    const updateRes = await fetch(`${baseUrl}/incidents/${createdId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        kode_gangguan: testCode,
        judul: 'Pengujian Otomatis Penambahan Catatan Gangguan TI (Diperbarui)',
        deskripsi: 'Deskripsi lengkap pengujian setelah diperbarui melalui endpoint PUT.',
        kategori: 'Aplikasi',
        status: 'Selesai',
        prioritas: 'Sedang',
        tanggal_kejadian: '2026-10-18',
        durasi_downtime: 35,
        jumlah_pengguna_terdampak: 50,
        biaya_pemulihan: 1500000,
        sistem_terdampak: 'Layanan Uji Integrasi',
        pelapor: 'Automated Tester',
        penanggung_jawab: 'Tim QA',
      }),
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateData.data.id, createdId);
    assert.strictEqual(updateData.data.status, 'Selesai');
    assert.strictEqual(updateData.data.durasi_downtime, 35);
    console.log(`✓ [5/6] Tambah & Ubah data (#${createdId}) bekerja pada data yang benar.`);

    // 6. Uji Hapus (DELETE) pada data yang benar
    const deleteRes = await fetch(`${baseUrl}/incidents/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.strictEqual(deleteRes.status, 200);

    const checkDeleted = await fetch(`${baseUrl}/incidents/${createdId}`, {
      headers: authHeaders,
    });
    assert.strictEqual(checkDeleted.status, 404);
    console.log(`✓ [6/6] Hapus data (#${createdId}) berhasil dan terverifikasi terhapus.`);

    console.log('\n[SUKSES] Seluruh pengujian API dan validasi backend lulus 100%!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('[TEST GAGAL]', err);
  process.exit(1);
});

