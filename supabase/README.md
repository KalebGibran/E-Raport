# Supabase Setup (E-Raport)

## 1) Apply schema migration
Run SQL file ini di Supabase SQL Editor:

- `supabase/migrations/202603090001_init_eraport.sql`

## 2) Optional sample seed
Untuk data awal testing, jalankan:

- `supabase/seed/seed_eraport_sample.sql`

## 3) Apply RLS policy per role
Jalankan SQL ini untuk keamanan akses data:

- `supabase/migrations/202603090002_rls_policies.sql`

## 4) Aktivasi periode + auto rollover
Saat ganti periode, panggil function ini:

```sql
select * from public.activate_period_and_rollover('<ACADEMIC_PERIOD_ID>');
```

Function akan:
- menutup periode aktif lama,
- mengaktifkan periode target,
- memindahkan enrollment siswa ke periode target,
- semester 2: kelas tetap,
- semester 1: naik ke `next_classroom_id` jika tersedia.

## 5) Catatan penting
- Isi `classrooms.next_classroom_id` agar auto naik kelas berjalan benar.
- `scores` mendukung tipe nilai `daily`, `uts`, `uas`.
- Approval rapor ada di tabel `report_cards`.
