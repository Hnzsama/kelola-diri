# Entity Relationship Diagram (ERD) - Kelola Diri

Dokumen ini mendefinisikan hubungan antarentitas (Entity Relationship) pada sistem **Kelola Diri** menggunakan diagram ERD Mermaid.

---

## 1. Diagram ERD (Mermaid Diagram)

```mermaid
erDiagram
    User {
        string id PK
        string name
        string email
        datetime createdAt
    }

    Course {
        string id PK
        string userId FK
        string name
        string code
        string lecturer
        string day
        string startTime
        string endTime
        string room
        int credits
    }

    Assignment {
        string id PK
        string courseId FK
        string title
        string description
        datetime dueDate
        string status
        string priority
    }

    Exam {
        string id PK
        string courseId FK
        string title
        datetime date
        string room
        string type
    }

    Organization {
        string id PK
        string name
        string description
    }

    OrganizationMember {
        string id PK
        string userId FK
        string organizationId FK
        string role
        datetime joinedAt
    }

    OrganizationEvent {
        string id PK
        string organizationId FK
        string title
        string description
        datetime date
        string location
    }

    OrganizationTask {
        string id PK
        string eventId FK
        string assignedToUserId FK
        string title
        string description
        datetime dueDate
        string status
    }

    Client {
        string id PK
        string userId FK
        string name
        string company
        string email
        string phone
    }

    Project {
        string id PK
        string clientId FK
        string name
        string description
        datetime startDate
        datetime endDate
        string status
        decimal value
    }

    ProjectTask {
        string id PK
        string projectId FK
        string title
        string description
        datetime dueDate
        string status
    }

    Category {
        string id PK
        string userId FK
        string name
        string type
    }

    Transaction {
        string id PK
        string userId FK
        string categoryId FK
        string projectId FK
        string eventId FK
        decimal amount
        string type
        string description
        datetime date
    }

    Habit {
        string id PK
        string userId FK
        string name
        string description
        string frequency
        datetime createdAt
    }

    HabitLog {
        string id PK
        string habitId FK
        datetime date
        boolean completed
    }

    Goal {
        string id PK
        string userId FK
        string title
        string description
        datetime targetDate
        string status
    }

    GoalProgress {
        string id PK
        string goalId FK
        string title
        decimal targetValue
        decimal currentValue
        datetime date
    }

    Note {
        string id PK
        string userId FK
        string title
        string content
        string courseId FK
        string projectId FK
        string eventId FK
        datetime updatedAt
    }

    User ||--o{ Course : "has"
    User ||--o{ OrganizationMember : "joined"
    User ||--o{ Client : "has"
    User ||--o{ Transaction : "makes"
    User ||--o{ Habit : "tracks"
    User ||--o{ Goal : "sets"
    User ||--o{ Note : "writes"
    User ||--o{ OrganizationTask : "assigned_to"

    Course ||--o{ Assignment : "contains"
    Course ||--o{ Exam : "contains"
    
    Organization ||--o{ OrganizationMember : "has"
    Organization ||--o{ OrganizationEvent : "organizes"
    
    OrganizationEvent ||--o{ OrganizationTask : "has"
    OrganizationEvent ||--o{ Transaction : "incurs"

    Client ||--o{ Project : "orders"
    Project ||--o{ ProjectTask : "has"
    Project ||--o{ Transaction : "generates_income"

    Transaction ||--|| Category : "categorized_by"

    Habit ||--o{ HabitLog : "logs"

    Goal ||--o{ GoalProgress : "has"

    Note ||--o{ Course : "annotates_course"
    Note ||--o{ Project : "annotates_project"
    Note ||--o{ OrganizationEvent : "annotates_event"
```

---

## 2. Aturan Relasi Bisnis

1. **User (Pengguna)**:
   - Menjadi pemilik utama data akademik (`Course`), klien freelance (`Client`), keuangan (`Transaction`), catatan (`Note`), target (`Goal`), dan kebiasaan (`Habit`).
   - Dapat terdaftar di banyak organisasi melalui entitas perantara `OrganizationMember` (Relasi Many-to-Many).
   - Dapat ditunjuk untuk mengerjakan tugas kepanitiaan (`OrganizationTask`) dalam domain organisasi.

2. **Modul Akademik**:
   - Satu `Course` dapat memiliki nol atau banyak `Assignment` dan `Exam`. Penghapusan `Course` akan menghapus seluruh `Assignment` dan `Exam` terkait secara kaskade (*cascade deletion*).

3. **Modul Organisasi**:
   - Entitas `OrganizationMember` menghubungkan `User` ke `Organization` dengan tambahan informasi peran/jabatan (misal: "Staf", "Ketua").
   - Organisasi menyelenggarakan banyak `OrganizationEvent` (Proker). Setiap `OrganizationEvent` dapat memiliki sub-tugas `OrganizationTask` yang didelegasikan ke pengguna tertentu.

4. **Modul Karier & Freelance**:
   - `Client` terhubung ke satu `User`. `Client` dapat memberikan banyak `Project`.
   - Setiap `Project` dibagi menjadi beberapa `ProjectTask`.

5. **Modul Keuangan**:
   - Setiap `Transaction` dikaitkan dengan satu `Category` milik pengguna.
   - Transaksi dapat bersifat independen, atau ditautkan opsional ke `Project` (merekam pemasukan proyek) atau `OrganizationEvent` (merekam iuran/pengeluaran proker).

6. **Modul Habit & Goal**:
   - `HabitLog` merekam sejarah check-in harian untuk kebiasaan (`Habit`).
   - `GoalProgress` merekam milestone kuantitatif (misalnya: menaikkan target dari 0% ke 100%) untuk memantau pencapaian `Goal` utama.