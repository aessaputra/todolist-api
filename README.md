# ToDoList API (Express.js + MongoDB Atlas + JWT)

REST API sederhana untuk mengelola _to-do_ per pengguna dengan autentikasi JWT.
Teknologi: **Node.js, Express.js, Mongoose, JWT, bcryptjs, dotenv, CORS**.

---

## Fitur

- Register & login (JWT).
- CRUD Task milik user login.
- Filtering: `?done=true|false&tag=work,urgent`
- Pagination: `?page=1&limit=10`
- Sorting: `?sort=dueDate` atau `?sort=-dueDate` (bisa multi: `?sort=-dueDate,createdAt`)
- Struktur modular (models, controllers, routes, middleware).
- Error handler terpusat.

---

## Prasyarat

- Node.js ≥ 18
- Akun **MongoDB Atlas** (atau MongoDB lokal)
- Git (opsional)

---

## Instalasi

```bash
git clone
cd todolist-api
npm install
```

### Environment

Buat file **`.env`**:

```env
PORT=5000
# Ganti USER, PASS (URL-encode jika ada karakter spesial), CLUSTER, dan DB name
MONGO_URI=mongodb+srv://USER:PASS@CLUSTER.mongodb.net/todolist_db?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=changeme
JWT_EXPIRES_IN=7d
```

> **Tip Atlas:** pastikan **Database User** sudah dibuat dan **IP Address** kamu sudah di-whitelist. Jika password punya karakter `@:/#?&`, encode dengan `encodeURIComponent`.

---

## Menjalankan

Tambahkan script (sudah disarankan):

```json
// package.json
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js"
}
```

Jalankan:

```bash
npm run dev
# atau
npm start
```

Cek kesehatan:

```
GET http://localhost:5000/api/health
```

---

## Struktur Proyek

```
todolist-api/
├── src/
│   ├── models/            # Mongoose models (User, Task)
│   ├── controllers/       # Logika bisnis (auth, task)
│   ├── routes/            # Definisi rute Express
│   ├── middleware/        # JWT middleware
│   └── server.js          # Entry server
├── .env
├── package.json
└── README.md
```

---

## Spesifikasi API

### Auth

#### Register

```
POST /api/auth/register
Content-Type: application/json
```

Body:

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secret123"
}
```

Res (201):

```json
{
  "message": "Registrasi berhasil",
  "token": "<JWT>",
  "user": {
    "id": "...",
    "username": "alice",
    "email": "alice@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Login (email atau username)

```
POST /api/auth/login
Content-Type: application/json
```

Body (pilih salah satu):

```json
{ "email": "alice@example.com", "password": "secret123" }
```

```json
{ "username": "alice", "password": "secret123" }
```

Res (200) berisi `token`.

> Gunakan `Authorization: Bearer <token>` untuk endpoint di bawah.

---

### Tasks (Semua perlu JWT)

#### Buat Task

```
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "title": "Belanja bahan baku",
  "dueDate": "2025-09-01",
  "tags": ["work", "urgent"],
  "done": false
}
```

Res (201):

```json
{
  "message": "Task dibuat",
  "data": {
    "id": "...",
    "title": "...",
    "done": false,
    "dueDate": "2025-09-01T00:00:00.000Z",
    "tags": ["work", "urgent"],
    "userId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### List Tasks (Filter + Pagination + Sorting)

```
GET /api/tasks?done=false&tag=work,urgent&page=1&limit=10&sort=-dueDate
Authorization: Bearer <token>
```

Res (200):

```json
{
  "data": [
    /* array tasks */
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 3,
    "totalPages": 1,
    "sort": "-dueDate",
    "filter": { "done": false, "tag": "work,urgent" }
  }
}
```

> `tag` mendukung banyak nilai, pisahkan dengan koma.

#### Detail Task

```
GET /api/tasks/:id
Authorization: Bearer <token>
```

#### Update Task

```
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json
```

Body (contoh):

```json
{ "done": true }
```

#### Hapus Task

```
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

---

## Contoh cURL

```bash
# Register
curl -s -X POST "<<base>>/api/auth/register" \
 -H "Content-Type: application/json" \
 -d '{"username":"alice","email":"alice@example.com","password":"secret123"}' | jq .

# Login → simpan token ke shell var
TOKEN=$(curl -s -X POST "<<base>>/api/auth/login" \
 -H "Content-Type: application/json" \
 -d '{"email":"alice@example.com","password":"secret123"}' | jq -r .token)

# Create Task
curl -s -X POST "<<base>>/api/tasks" \
 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
 -d '{"title":"Belanja bahan baku","dueDate":"2025-09-01","tags":["work","urgent"]}' | jq .

# List
curl -s "<<base>>/api/tasks?done=false&tag=work,urgent&page=1&limit=5&sort=-dueDate" \
 -H "Authorization: Bearer $TOKEN" | jq .

# Ambil ID pertama untuk contoh
TASK_ID=$(curl -s "<<base>>/api/tasks" -H "Authorization: Bearer $TOKEN" | jq -r .data[0].id)

# Update
curl -s -X PUT "<<base>>/api/tasks/$TASK_ID" \
 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
 -d '{"done":true}' | jq .

# Delete
curl -s -X DELETE "<<base>>/api/tasks/$TASK_ID" \
 -H "Authorization: Bearer $TOKEN" | jq .
```

Ganti `<<base>>` dengan `http://localhost:5000`.

---

## Pengujian dengan Hoppscotch / Postman

### Hoppscotch (direkomendasikan)

- **Environment Variables**:

  - `base_url` = `http://localhost:5000`
  - `token` = _(kosong, akan diisi otomatis)_
  - `task_id` = _(kosong, akan diisi otomatis)_

- **Auto set token (Login → Post-request Script)**:

```js
pw.test('Login OK & simpan token', () => {
  pw.expect(pw.response.status).toBe(200);
  let data = pw.response.body;
  try {
    if (typeof data === 'string') data = JSON.parse(data);
  } catch (e) {}
  const token = data?.token;
  if (token) pw.env.set('token', token);
});
```

- **Auto set task_id (Create Task → Post-request Script)**:

```js
pw.test('Simpan task_id dari Create', () => {
  let data = pw.response.body;
  try {
    if (typeof data === 'string') data = JSON.parse(data);
  } catch (e) {}
  const id = data?.data?.id || data?.data?._id;
  if (id) pw.env.set('task_id', id);
});
```

- **Authorization**: pilih **Bearer**, isi `<<token>>`.
- **Path**: gunakan `<<base_url>>/api/tasks/<<task_id>>`.

### Postman

Import koleksi yang sudah disediakan sebelumnya (Auth & Tasks). Variabel `token` dan `task_id` otomatis diset oleh _tests_.

---

## Kode Status & Error Umum

- `400` — body/param tidak valid (mis. `title` kosong, ID tidak valid).
- `401` — token salah/kadaluarsa/tidak ada.
- `404` — resource tidak ditemukan (task bukan milik user).
- `409` — register duplikat (username/email sudah ada).
- `500` — error server/DB.

---

## Catatan Keamanan

- Simpan **JWT_SECRET** kuat dan rahasiakan.
- Jangan gunakan `0.0.0.0/0` di Atlas untuk produksi.
- Terapkan **rate limiting** (mis. `express-rate-limit`) dan **helmet** untuk hardening jika akan dipublikasikan.

---

## Lisensi

MIT
