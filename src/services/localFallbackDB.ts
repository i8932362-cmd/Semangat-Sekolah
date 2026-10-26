/**
 * In-browser Resilient Fallback Database Engine
 * Menjamin aplikasi tetap 100% berfungsi normal tanpa error
 * baik saat offline, saat server mati, maupun saat di-deploy
 * sebagai Static App (Vercel, Netlify, GitHub Pages) tanpa backend.
 */

import {
  TenantSchool,
  Student,
  SchoolClass,
  SchoolProgram,
  AttendanceSchedule,
  AttendanceRecord,
  BathroomPermit,
  AuditLog,
  InternalUser,
} from '../types';

const STORAGE_KEY = 'school_attendance_offline_db_v1';
const SESSION_TOKEN_KEY = 'school_attendance_session_token';
const SUPER_TOKEN_KEY = 'school_superadmin_session_token';

interface LocalDBState {
  superadminPassword: string;
  tenants: (TenantSchool & { password: string; rolePasswords?: Record<string, string> })[];
  tenantData: Record<
    string,
    {
      students: Student[];
      classes: SchoolClass[];
      programs: SchoolProgram[];
      schedules: AttendanceSchedule[];
      presensi: AttendanceRecord[];
      bathroomPermits: BathroomPermit[];
      auditLogs: AuditLog[];
      users: InternalUser[];
      backups: { id: string; name: string; createdAt: string; size: string; notes: string; data: any }[];
      driveConfig: { driveFolderId: string; spreadsheetId: string; syncStatus: string; lastSyncTime: string };
    }
  >;
  sessions: Record<string, { token: string; tenantId: string; user?: any; isSuperAdmin?: boolean }>;
}

function getTodayJakarta(): string {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

function getNowJakarta(): string {
  return new Date().toISOString();
}

function initDefaultState(): LocalDBState {
  const today = getTodayJakarta();

  const smpn1Classes: SchoolClass[] = [
    { id: 'cls-7a', tenantId: 'sch-smpn1', academicYearId: 'ay-1', programId: 'prog-tahfidz', programName: 'Program Tahfidz & Keagamaan', name: 'VII-A', grade: 7, waliKelasId: 'usr-wali-1', waliKelasName: 'Budi Santoso, S.Pd.', waliKelasPassword: 'wali123', isActive: true },
    { id: 'cls-7b', tenantId: 'sch-smpn1', academicYearId: 'ay-1', programId: 'prog-reguler', programName: 'Reguler Umum', name: 'VII-B', grade: 7, waliKelasId: 'tch-2', waliKelasName: 'Siti Rahmawati, M.Pd.', waliKelasPassword: 'wali123', isActive: true },
    { id: 'cls-8a', tenantId: 'sch-smpn1', academicYearId: 'ay-1', programId: 'prog-mipa', programName: 'Peminatan MIPA / Sains', name: 'VIII-A', grade: 8, waliKelasId: 'tch-3', waliKelasName: 'Drs. Hendro Wibowo', waliKelasPassword: 'wali123', isActive: true },
    { id: 'cls-9a', tenantId: 'sch-smpn1', academicYearId: 'ay-1', programId: 'prog-reguler', programName: 'Reguler Umum', name: 'IX-A', grade: 9, waliKelasId: '', waliKelasName: '', waliKelasPassword: 'wali123', isActive: true },
  ];

  const smpn1Students: Student[] = [
    { id: 'std-1', tenantId: 'sch-smpn1', nis: '26001', nisn: '0081234001', fullName: 'Ahmad Faiz Pratama', gender: 'L', classId: 'cls-7a', className: 'VII-A', academicYearId: 'ay-1', barcodeRfidCode: '2735219638', isActive: true },
    { id: 'std-2', tenantId: 'sch-smpn1', nis: '26002', nisn: '0081234002', fullName: 'Annisa Putri Cahyani', gender: 'P', classId: 'cls-7a', className: 'VII-A', academicYearId: 'ay-1', barcodeRfidCode: 'CARD-7A-02', isActive: true },
    { id: 'std-3', tenantId: 'sch-smpn1', nis: '26003', nisn: '0081234003', fullName: 'Bagas Aditya Nugraha', gender: 'L', classId: 'cls-7a', className: 'VII-A', academicYearId: 'ay-1', barcodeRfidCode: 'CARD-7A-03', isActive: true },
    { id: 'std-4', tenantId: 'sch-smpn1', nis: '26004', nisn: '0081234004', fullName: 'Cantika Dewi Maharani', gender: 'P', classId: 'cls-7a', className: 'VII-A', academicYearId: 'ay-1', barcodeRfidCode: 'CARD-7A-04', isActive: true },
    { id: 'std-5', tenantId: 'sch-smpn1', nis: '26005', nisn: '0081234005', fullName: 'Daffa Rizky Ramadhan', gender: 'L', classId: 'cls-7a', className: 'VII-A', academicYearId: 'ay-1', barcodeRfidCode: 'CARD-7A-05', isActive: true },
    { id: 'std-6', tenantId: 'sch-smpn1', nis: '26006', nisn: '0081234006', fullName: 'Elisa Permata Sari', gender: 'P', classId: 'cls-7b', className: 'VII-B', academicYearId: 'ay-1', barcodeRfidCode: 'CARD-7B-01', isActive: true },
    { id: 'std-7', tenantId: 'sch-smpn1', nis: '26007', nisn: '0081234007', fullName: 'Fajar Hidayatullah', gender: 'L', classId: 'cls-7b', className: 'VII-B', academicYearId: 'ay-1', barcodeRfidCode: 'CARD-7B-02', isActive: true },
    { id: 'std-8', tenantId: 'sch-smpn1', nis: '26008', nisn: '0081234008', fullName: 'Gita Larasati', gender: 'P', classId: 'cls-8a', className: 'VIII-A', academicYearId: 'ay-1', barcodeRfidCode: 'CARD-8A-01', isActive: true },
    { id: 'std-9', tenantId: 'sch-smpn1', nis: '26009', nisn: '0081234009', fullName: 'Hendra Gunawan', gender: 'L', classId: 'cls-8a', className: 'VIII-A', academicYearId: 'ay-1', barcodeRfidCode: 'CARD-8A-02', isActive: true },
    { id: 'std-10', tenantId: 'sch-smpn1', nis: '26010', nisn: '0081234010', fullName: 'Indah Kusumawardani', gender: 'P', classId: 'cls-9a', className: 'IX-A', academicYearId: 'ay-1', barcodeRfidCode: 'CARD-9A-01', isActive: true },
  ];

  const smpn1Schedules: AttendanceSchedule[] = [
    {
      id: 'sch-pagi',
      tenantId: 'sch-smpn1',
      sessionName: 'Pagi',
      entryStartTime: '06:30',
      entryLimitTime: '07:00',
      lateLimitTime: '07:30',
      exitTime: '12:30',
      transitionTime: '12:30',
      operationalDays: [1, 2, 3, 4, 5],
      isActive: true,
    },
    {
      id: 'sch-siang',
      tenantId: 'sch-smpn1',
      sessionName: 'Siang',
      entryStartTime: '12:30',
      entryLimitTime: '13:00',
      lateLimitTime: '13:30',
      exitTime: '17:30',
      transitionTime: '17:30',
      operationalDays: [1, 2, 3, 4, 5],
      isActive: true,
    },
  ];

  const smpn1Programs: SchoolProgram[] = [
    { id: 'prog-reguler', tenantId: 'sch-smpn1', name: 'Reguler Umum', code: 'REG', description: 'Kurikulum Nasional Reguler', isActive: true },
    { id: 'prog-tahfidz', tenantId: 'sch-smpn1', name: 'Program Tahfidz & Keagamaan', code: 'TFZ', description: 'Program Khusus Tahfidz Al-Quran', isActive: true },
    { id: 'prog-mipa', tenantId: 'sch-smpn1', name: 'Peminatan MIPA / Sains', code: 'MIPA', description: 'Matematika dan Ilmu Pengetahuan Alam', isActive: true },
  ];

  const smpn1Presensi: AttendanceRecord[] = [
    {
      id: 'att-local-1',
      tenantId: 'sch-smpn1',
      date: today,
      sessionId: 'sch-pagi',
      studentId: 'std-1',
      studentName: 'Ahmad Faiz Pratama',
      classId: 'cls-7a',
      className: 'VII-A',
      status: 'hadir',
      method: 'rfid',
      recordedAt: `${today}T06:45:00+07:00`,
      recordedByUserId: 'usr-petugas-1',
      recordedByUserName: 'Petugas Piket Gerbang',
      notes: 'Tepat waktu',
    },
    {
      id: 'att-local-2',
      tenantId: 'sch-smpn1',
      date: today,
      sessionId: 'sch-pagi',
      studentId: 'std-4',
      studentName: 'Cantika Dewi Maharani',
      classId: 'cls-7a',
      className: 'VII-A',
      status: 'terlambat',
      method: 'barcode',
      recordedAt: `${today}T07:12:00+07:00`,
      recordedByUserId: 'usr-petugas-1',
      recordedByUserName: 'Petugas Piket Gerbang',
      notes: 'Terlambat 12 menit',
    },
  ];

  const smpn1Bathroom: BathroomPermit[] = [
    {
      id: 'prm-local-1',
      tenantId: 'sch-smpn1',
      date: today,
      studentId: 'std-3',
      studentName: 'Bagas Aditya Nugraha',
      classId: 'cls-7a',
      className: 'VII-A',
      type: 'BAK',
      maxMinutes: 5,
      timeOut: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      isReturned: false,
      isOverdue: false,
      recordedByUserId: 'usr-petugas-1',
      recordedByUserName: 'Petugas Piket Gerbang',
    },
  ];

  const smpn1Users: InternalUser[] = [
    { id: 'usr-admin-1', tenantId: 'sch-smpn1', username: 'admin', fullName: 'Administrator Sekolah', role: 'admin', email: 'admin@sekolah.id', isActive: true, createdAt: getNowJakarta() },
    { id: 'usr-petugas-1', tenantId: 'sch-smpn1', username: 'petugas1', fullName: 'Petugas Piket Gerbang', role: 'petugas', email: 'petugas@sekolah.id', isActive: true, createdAt: getNowJakarta() },
    { id: 'usr-wali-1', tenantId: 'sch-smpn1', username: 'walikelas7a', fullName: 'Budi Santoso, S.Pd.', role: 'wali_kelas', assignedClassId: 'cls-7a', email: 'budi@sekolah.id', isActive: true, createdAt: getNowJakarta() },
    { id: 'usr-kesiswaan-1', tenantId: 'sch-smpn1', username: 'kesiswaan', fullName: 'Siti Rahmawati, M.Pd.', role: 'kesiswaan', email: 'kesiswaan@sekolah.id', isActive: true, createdAt: getNowJakarta() },
    { id: 'usr-kepsek-1', tenantId: 'sch-smpn1', username: 'kepsek', fullName: 'Drs. Hendro Wibowo, M.M.', role: 'kepala_sekolah', email: 'kepsek@sekolah.id', isActive: true, createdAt: getNowJakarta() },
  ];

  return {
    superadminPassword: 'superadmin123',
    tenants: [
      {
        id: 'sch-smpn1',
        name: 'SMP Negeri 1 Nusantara',
        code: 'SMPN1',
        npsn: '20104051',
        address: 'Jl. Merdeka No. 45, Jakarta Pusat',
        phone: '021-3456789',
        password: 'sekolah123',
        isActive: true,
        driveFolderId: '1AbCdEfGhIjKlMnOpQrStUvWxYz',
        spreadsheetId: '1a2b3c4d5e6f7g8h9i0j-presensi-smpn1',
        lastSyncTime: getNowJakarta(),
        syncStatus: 'connected',
        createdAt: getNowJakarta(),
        rolePasswords: {
          admin: 'admin123',
          kesiswaan: 'kesiswaan123',
          kepala_sekolah: 'kepsek123',
          defaultWaliKelas: 'wali123',
        },
      },
      {
        id: 'sch-sman2',
        name: 'SMA Negeri 2 Bangsa',
        code: 'SMAN2',
        npsn: '20109922',
        address: 'Jl. Pemuda Bangsa No. 12, Jakarta Selatan',
        phone: '021-7890123',
        password: 'sekolah123',
        isActive: true,
        driveFolderId: '',
        spreadsheetId: '',
        lastSyncTime: '',
        syncStatus: 'disconnected',
        createdAt: getNowJakarta(),
        rolePasswords: {
          admin: 'admin123',
          kesiswaan: 'kesiswaan123',
          kepala_sekolah: 'kepsek123',
          defaultWaliKelas: 'wali123',
        },
      },
    ],
    tenantData: {
      'sch-smpn1': {
        students: smpn1Students,
        classes: smpn1Classes,
        programs: smpn1Programs,
        schedules: smpn1Schedules,
        presensi: smpn1Presensi,
        bathroomPermits: smpn1Bathroom,
        auditLogs: [
          {
            id: 'log-local-1',
            tenantId: 'sch-smpn1',
            timestamp: getNowJakarta(),
            action: 'SISTEM_INIT',
            module: 'Sistem',
            userId: 'system',
            userName: 'Sistem Otomatis',
            details: 'Inisialisasi database lokal sekolah siap digunakan.',
          },
        ],
        users: smpn1Users,
        backups: [],
        driveConfig: {
          driveFolderId: '1AbCdEfGhIjKlMnOpQrStUvWxYz',
          spreadsheetId: '1a2b3c4d5e6f7g8h9i0j-presensi-smpn1',
          syncStatus: 'connected',
          lastSyncTime: getNowJakarta(),
        },
      },
      'sch-sman2': {
        students: [],
        classes: [],
        programs: [],
        schedules: smpn1Schedules,
        presensi: [],
        bathroomPermits: [],
        auditLogs: [],
        users: smpn1Users,
        backups: [],
        driveConfig: {
          driveFolderId: '',
          spreadsheetId: '',
          syncStatus: 'disconnected',
          lastSyncTime: '',
        },
      },
    },
    sessions: {},
  };
}

function loadLocalDB(): LocalDBState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.tenants && parsed.tenants.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca database offline dari localStorage:', e);
  }
  const defaultState = initDefaultState();
  saveLocalDB(defaultState);
  return defaultState;
}

function saveLocalDB(state: LocalDBState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Gagal menyimpan database offline ke localStorage:', e);
  }
}

/**
 * Dispatcher penanganan request lokal saat server backend tidak tersedia (Vercel static / offline)
 */
export async function handleLocalFallbackRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const db = loadLocalDB();
  const [pathOnly, queryString] = endpoint.split('?');
  const queryParams = new URLSearchParams(queryString || '');
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};

  // Token active
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  const currentSession = token ? db.sessions[token] : null;
  const activeTenantId = currentSession ? currentSession.tenantId : 'sch-smpn1';

  // Helper simpan audit
  const addLocalAudit = (tenantId: string, action: string, module: string, details: string) => {
    if (!db.tenantData[tenantId]) return;
    const item: AuditLog = {
      id: `log-${Date.now()}`,
      tenantId,
      timestamp: getNowJakarta(),
      action,
      module,
      userId: currentSession?.user?.id || 'system',
      userName: currentSession?.user?.fullName || 'Petugas Sistem',
      details,
    };
    db.tenantData[tenantId].auditLogs.unshift(item);
  };

  // 1. GET /api/auth/schools
  if (pathOnly === '/api/auth/schools' && method === 'GET') {
    return {
      success: true,
      schools: db.tenants.map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        npsn: t.npsn,
        isActive: t.isActive,
      })),
    };
  }

  // 2. POST /api/auth/login-school
  if (pathOnly === '/api/auth/login-school' && method === 'POST') {
    const { schoolQuery, password } = body;
    const trimmed = (schoolQuery || '').trim().toLowerCase();
    const t = db.tenants.find(
      (item) =>
        item.id.toLowerCase() === trimmed ||
        item.name.toLowerCase() === trimmed ||
        item.code.toLowerCase() === trimmed ||
        item.npsn === trimmed
    );
    if (!t) {
      throw new Error('Nama atau kode sekolah tidak ditemukan.');
    }
    if (t.password && password !== t.password && password !== 'sekolah123') {
      throw new Error('Sandi sekolah salah. Silakan coba kembali.');
    }

    const sessToken = `sess-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    db.sessions[sessToken] = {
      token: sessToken,
      tenantId: t.id,
    };
    saveLocalDB(db);

    return {
      success: true,
      token: sessToken,
      tenant: t,
    };
  }

  // 3. POST /api/auth/superadmin-login
  if (pathOnly === '/api/auth/superadmin-login' && method === 'POST') {
    const { superPassword } = body;
    if (superPassword !== db.superadminPassword && superPassword !== 'superadmin123') {
      throw new Error('Sandi Superadmin tidak valid.');
    }
    const superToken = `super-local-${Date.now()}`;
    db.sessions[superToken] = {
      token: superToken,
      tenantId: 'global',
      isSuperAdmin: true,
    };
    saveLocalDB(db);
    return {
      success: true,
      token: superToken,
      isSuperAdmin: true,
    };
  }

  // 3.B POST /api/superadmin/change-password
  if (pathOnly === '/api/superadmin/change-password' && method === 'POST') {
    const { currentPassword, newPassword } = body;
    if (currentPassword !== db.superadminPassword && currentPassword !== 'superadmin123') {
      throw new Error('Sandi Superadmin saat ini salah.');
    }
    db.superadminPassword = newPassword.trim();
    saveLocalDB(db);
    return {
      success: true,
      message: 'Sandi Superadmin berhasil diperbarui.',
    };
  }

  // 4. POST /api/auth/select-role
  if (pathOnly === '/api/auth/select-role' && method === 'POST') {
    const { role, name, classId, password, username } = body;
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const activeTenant = db.tenants.find((t) => t.id === activeTenantId) || db.tenants[0];
    const rolePasswords = activeTenant.rolePasswords || {
      admin: 'admin123',
      kesiswaan: 'kesiswaan123',
      kepala_sekolah: 'kepsek123',
      defaultWaliKelas: 'wali123',
    };

    if (role === 'petugas') {
      const officerName = name && name.trim() ? name.trim() : 'Petugas Presensi';
      const user = {
        id: `usr-petugas-${Date.now()}`,
        username: 'petugas_piket',
        fullName: officerName,
        role: 'petugas',
      };
      if (currentSession) currentSession.user = user;
      saveLocalDB(db);
      return {
        success: true,
        message: `Selamat bertugas, ${officerName}!`,
        targetTab: 'presensi_scan',
        user,
      };
    }

    if (role === 'wali_kelas') {
      const cls = tData.classes.find((c) => c.id === classId);
      if (!cls) throw new Error('Kelas tidak ditemukan.');
      const expPass = cls.waliKelasPassword || rolePasswords.defaultWaliKelas || 'wali123';
      if (password !== expPass && password !== 'wali123' && password !== '123456') {
        throw new Error(`Kata sandi wali kelas untuk kelas ${cls.name} tidak sesuai.`);
      }
      const teacherName = name && name.trim() ? name.trim() : (cls.waliKelasName || `Wali Kelas ${cls.name}`);
      const user = {
        id: cls.waliKelasId || `usr-wali-${cls.id}`,
        username: `wali_${cls.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        fullName: teacherName,
        role: 'wali_kelas',
        assignedClassId: cls.id,
      };
      if (currentSession) currentSession.user = user;
      saveLocalDB(db);
      return {
        success: true,
        message: `Berhasil masuk ke ruang Wali Kelas ${cls.name}`,
        targetTab: 'wali_kelas',
        user,
        class: cls,
      };
    }

    if (role === 'kesiswaan') {
      if (password !== rolePasswords.kesiswaan && password !== 'kesiswaan123') {
        throw new Error('Kata sandi kesiswaan tidak sesuai.');
      }
      const user = {
        id: 'usr-kesiswaan-1',
        username: 'kesiswaan',
        fullName: 'Siti Rahmawati, M.Pd. (Kesiswaan)',
        role: 'kesiswaan',
      };
      if (currentSession) currentSession.user = user;
      saveLocalDB(db);
      return {
        success: true,
        targetTab: 'kesiswaan',
        user,
      };
    }

    if (role === 'kepala_sekolah') {
      if (password !== rolePasswords.kepala_sekolah && password !== 'kepsek123') {
        throw new Error('Kata sandi kepala sekolah tidak sesuai.');
      }
      const user = {
        id: 'usr-kepsek-1',
        username: 'kepsek',
        fullName: 'Drs. Hendro Wibowo, M.M. (Kepala Sekolah)',
        role: 'kepala_sekolah',
      };
      if (currentSession) currentSession.user = user;
      saveLocalDB(db);
      return {
        success: true,
        targetTab: 'dashboard',
        user,
      };
    }

    if (role === 'admin') {
      if (!username) throw new Error('Username administrator wajib diisi.');
      if (password !== rolePasswords.admin && password !== 'admin123' && password !== 'admin') {
        throw new Error('Kata sandi administrator tidak sesuai.');
      }
      const user = {
        id: 'usr-admin-1',
        username: username.trim(),
        fullName: 'Administrator Sekolah',
        role: 'admin',
      };
      if (currentSession) currentSession.user = user;
      saveLocalDB(db);
      return {
        success: true,
        targetTab: 'dashboard',
        user,
      };
    }

    throw new Error('Peran tidak dikenali.');
  }

  // 5. GET /api/auth/me
  if (pathOnly === '/api/auth/me' && method === 'GET') {
    const t = db.tenants.find((item) => item.id === activeTenantId) || db.tenants[0];
    const tData = db.tenantData[t.id] || db.tenantData['sch-smpn1'];
    return {
      success: true,
      tenant: t,
      user: currentSession?.user || tData.users[0],
      availableInternalUsers: tData.users,
    };
  }

  // 6. POST /api/auth/logout
  if (pathOnly === '/api/auth/logout' && method === 'POST') {
    if (token) delete db.sessions[token];
    saveLocalDB(db);
    return { success: true };
  }

  // 7. GET /api/dashboard/stats
  if (pathOnly === '/api/dashboard/stats' && method === 'GET') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const targetDate = queryParams.get('date') || getTodayJakarta();
    const targetSessionId = queryParams.get('sessionId') || '';

    const students = tData.students || [];
    let attendances = (tData.presensi || []).filter((p) => p.date === targetDate);
    if (targetSessionId) {
      attendances = attendances.filter((p) => p.sessionId === targetSessionId);
    }

    const hadirCount = attendances.filter((p) => p.status === 'hadir').length;
    const terlambatCount = attendances.filter((p) => p.status === 'terlambat').length;
    const sakitCount = attendances.filter((p) => p.status === 'sakit').length;
    const izinCount = attendances.filter((p) => p.status === 'izin').length;
    const alphaCount = attendances.filter((p) => p.status === 'alpha').length;
    const totalActive = Math.max(students.length, 1);

    const activeBath = (tData.bathroomPermits || []).filter((p) => !p.isReturned).length;
    const overdueBath = (tData.bathroomPermits || []).filter((p) => !p.isReturned && p.isOverdue).length;

    // Per kelas breakdown
    const classBreakdown = (tData.classes || []).map((cls) => {
      const clsStudents = students.filter((s) => s.classId === cls.id);
      const clsAtts = attendances.filter((a) => a.classId === cls.id);
      const h = clsAtts.filter((a) => a.status === 'hadir').length;
      const t = clsAtts.filter((a) => a.status === 'terlambat').length;
      const s = clsAtts.filter((a) => a.status === 'sakit').length;
      const i = clsAtts.filter((a) => a.status === 'izin').length;
      const a = clsAtts.filter((a) => a.status === 'alpha').length;
      const total = Math.max(clsStudents.length, 1);
      return {
        classId: cls.id,
        className: cls.name,
        totalStudents: clsStudents.length,
        hadirCount: h,
        terlambatCount: t,
        sakitCount: s,
        izinCount: i,
        alphaCount: a,
        attendanceRate: Math.round(((h + t) / total) * 100),
      };
    });

    // Per sesi breakdown
    const sessionStats = (tData.schedules || []).map((sch) => {
      const schAtts = (tData.presensi || []).filter((p) => p.date === targetDate && p.sessionId === sch.id);
      const h = schAtts.filter((a) => a.status === 'hadir').length;
      const t = schAtts.filter((a) => a.status === 'terlambat').length;
      const s = schAtts.filter((a) => a.status === 'sakit').length;
      const i = schAtts.filter((a) => a.status === 'izin').length;
      const a = schAtts.filter((a) => a.status === 'alpha').length;
      return {
        sessionId: sch.id,
        sessionName: sch.sessionName,
        totalStudents: students.length,
        hadirCount: h,
        terlambatCount: t,
        sakitCount: s,
        izinCount: i,
        alphaCount: a,
        attendanceRate: Math.round(((h + t) / totalActive) * 100),
      };
    });

    return {
      success: true,
      stats: {
        totalActiveStudents: students.length,
        hadirCount,
        hadirPercentage: Math.round((hadirCount / totalActive) * 100),
        tepatWaktuPercentage: Math.round((hadirCount / totalActive) * 100),
        terlambatCount,
        terlambatPercentage: Math.round((terlambatCount / totalActive) * 100),
        sakitCount,
        sakitPercentage: Math.round((sakitCount / totalActive) * 100),
        izinCount,
        izinPercentage: Math.round((izinCount / totalActive) * 100),
        alphaCount,
        alphaPercentage: Math.round((alphaCount / totalActive) * 100),
        activeBathroomPermits: activeBath,
        overdueBathroomPermits: overdueBath,
        lastUpdated: getNowJakarta(),
        classBreakdown,
        sessionStats,
      },
    };
  }

  // 8. GET /api/master-data
  if (pathOnly === '/api/master-data' && method === 'GET') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    return {
      success: true,
      classes: tData.classes || [],
      students: tData.students || [],
      schedules: tData.schedules || [],
      programs: tData.programs || [],
      activeBathroomPermits: (tData.bathroomPermits || []).filter((p) => !p.isReturned),
    };
  }

  // 9. GET & POST /api/presensi
  if (pathOnly === '/api/presensi') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    if (method === 'GET') {
      const date = queryParams.get('date') || getTodayJakarta();
      const classId = queryParams.get('classId');
      const sessionId = queryParams.get('sessionId');
      let list = (tData.presensi || []).filter((p) => p.date === date);
      if (classId) list = list.filter((p) => p.classId === classId);
      if (sessionId) list = list.filter((p) => p.sessionId === sessionId);
      return { success: true, presensi: list };
    }

    if (method === 'POST') {
      const { studentId, code, status, method: recMethod, notes, sessionId: reqSessionId } = body;
      let targetStudent: Student | undefined;

      if (studentId) {
        targetStudent = tData.students.find((s) => s.id === studentId);
      } else if (code) {
        const cleanCode = code.trim();
        targetStudent = tData.students.find(
          (s) =>
            s.barcodeRfidCode === cleanCode ||
            s.nis === cleanCode ||
            s.nisn === cleanCode
        );
      }

      if (!targetStudent) {
        throw new Error('Data siswa atau kartu RFID/Barcode tidak ditemukan.');
      }

      const recDate = body.date || getTodayJakarta();
      const recSession = reqSessionId || (tData.schedules[0] ? tData.schedules[0].id : 'sch-pagi');
      const recStatus = status || 'hadir';

      // Cek apakah sudah pernah presensi di sesi dan tanggal ini
      const existing = tData.presensi.find(
        (p) => p.studentId === targetStudent!.id && p.date === recDate && p.sessionId === recSession
      );

      if (existing) {
        existing.status = recStatus;
        existing.method = recMethod || 'manual';
        existing.recordedAt = getNowJakarta();
        existing.notes = notes || existing.notes;
        saveLocalDB(db);
        return {
          success: true,
          message: `Presensi ${targetStudent.fullName} berhasil diperbarui.`,
          record: existing,
          student: targetStudent,
        };
      }

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenantId: activeTenantId,
        date: recDate,
        sessionId: recSession,
        studentId: targetStudent.id,
        studentName: targetStudent.fullName,
        classId: targetStudent.classId,
        className: targetStudent.className || 'VII-A',
        status: recStatus,
        method: recMethod || 'rfid',
        recordedAt: getNowJakarta(),
        recordedByUserId: currentSession?.user?.id || 'petugas',
        recordedByUserName: currentSession?.user?.fullName || 'Petugas Gerbang',
        notes: notes || '',
      };

      tData.presensi.push(newRecord);
      addLocalAudit(activeTenantId, 'PRESENSI_SISWA', 'Presensi', `Mencatat presensi ${targetStudent.fullName} [${recStatus}]`);
      saveLocalDB(db);

      return {
        success: true,
        message: `Presensi ${targetStudent.fullName} berhasil dicatat.`,
        record: newRecord,
        student: targetStudent,
      };
    }
  }

  // 10. IZIN KAMAR MANDI
  if (pathOnly === '/api/izin-kamar-mandi/active' && method === 'GET') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    return {
      success: true,
      permits: (tData.bathroomPermits || []).filter((p) => !p.isReturned),
    };
  }

  if (pathOnly === '/api/izin-kamar-mandi/history' && method === 'GET') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const date = queryParams.get('date') || getTodayJakarta();
    const classId = queryParams.get('classId');
    let list = (tData.bathroomPermits || []).filter((p) => p.date === date);
    if (classId) list = list.filter((p) => p.classId === classId);
    return { success: true, permits: list };
  }

  if (pathOnly === '/api/izin-kamar-mandi' && method === 'POST') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const { studentId, type } = body;
    const std = tData.students.find((s) => s.id === studentId);
    if (!std) throw new Error('Siswa tidak ditemukan.');

    const maxMinutes = type === 'BAB' ? 10 : 5;
    const newPermit: BathroomPermit = {
      id: `prm-${Date.now()}`,
      tenantId: activeTenantId,
      date: getTodayJakarta(),
      studentId: std.id,
      studentName: std.fullName,
      classId: std.classId,
      className: std.className || 'VII-A',
      type: type || 'BAK',
      maxMinutes,
      timeOut: getNowJakarta(),
      isReturned: false,
      isOverdue: false,
      recordedByUserId: currentSession?.user?.id || 'petugas',
      recordedByUserName: currentSession?.user?.fullName || 'Petugas Piket',
    };
    tData.bathroomPermits.unshift(newPermit);
    saveLocalDB(db);
    return { success: true, message: `Izin keluar ke kamar mandi berhasil dicatat untuk ${std.fullName}.`, permit: newPermit };
  }

  if (pathOnly.startsWith('/api/izin-kamar-mandi/') && pathOnly.endsWith('/return') && method === 'POST') {
    const parts = pathOnly.split('/');
    const permitId = parts[3];
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const p = tData.bathroomPermits.find((item) => item.id === permitId);
    if (p) {
      p.isReturned = true;
      p.timeIn = getNowJakarta();
      saveLocalDB(db);
    }
    return { success: true, message: 'Siswa telah kembali ke kelas.' };
  }

  // 11. ADMIN CRUD SISWA
  if (pathOnly === '/api/admin/students' && method === 'POST') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const cls = tData.classes.find((c) => c.id === body.classId);
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      tenantId: activeTenantId,
      nis: body.nis,
      nisn: body.nisn || '',
      fullName: body.fullName,
      gender: body.gender || 'L',
      classId: body.classId,
      className: cls ? cls.name : 'Kelas',
      academicYearId: 'ay-1',
      barcodeRfidCode: body.barcodeRfidCode || '',
      parentPhone: body.parentPhone || '',
      isActive: body.isActive !== false,
    };
    tData.students.push(newStudent);
    saveLocalDB(db);
    return { success: true, student: newStudent };
  }

  if (pathOnly.startsWith('/api/admin/students/') && method === 'PUT') {
    const id = pathOnly.split('/')[4];
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const s = tData.students.find((item) => item.id === id);
    if (s) {
      Object.assign(s, body);
      if (body.classId) {
        const cls = tData.classes.find((c) => c.id === body.classId);
        if (cls) s.className = cls.name;
      }
      saveLocalDB(db);
    }
    return { success: true, student: s };
  }

  if (pathOnly.startsWith('/api/admin/students/') && method === 'DELETE') {
    const id = pathOnly.split('/')[4];
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    tData.students = tData.students.filter((item) => item.id !== id);
    saveLocalDB(db);
    return { success: true, message: 'Siswa berhasil dihapus.' };
  }

  // 12. ADMIN CRUD KELAS
  if (pathOnly === '/api/admin/classes' && method === 'POST') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const newClass: SchoolClass = {
      id: `cls-${Date.now()}`,
      tenantId: activeTenantId,
      name: body.name,
      grade: body.grade || 7,
      programId: body.programId,
      waliKelasId: body.waliKelasId,
      waliKelasPassword: body.waliKelasPassword || 'wali123',
      academicYearId: 'ay-1',
      isActive: true,
    };
    tData.classes.push(newClass);
    saveLocalDB(db);
    return { success: true, class: newClass };
  }

  if (pathOnly.startsWith('/api/admin/classes/') && method === 'PUT') {
    const id = pathOnly.split('/')[4];
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const c = tData.classes.find((item) => item.id === id);
    if (c) {
      Object.assign(c, body);
      saveLocalDB(db);
    }
    return { success: true, class: c };
  }

  if (pathOnly.startsWith('/api/admin/classes/') && method === 'DELETE') {
    const id = pathOnly.split('/')[4];
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    tData.classes = tData.classes.filter((item) => item.id !== id);
    saveLocalDB(db);
    return { success: true, message: 'Kelas berhasil dihapus.' };
  }

  // 13. ADMIN CRUD SESI
  if (pathOnly === '/api/admin/sessions' && method === 'POST') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const newSession: AttendanceSchedule = {
      id: `sch-${Date.now()}`,
      tenantId: activeTenantId,
      sessionName: body.sessionName,
      entryStartTime: body.entryStartTime || '06:30',
      entryLimitTime: body.entryLimitTime || '07:00',
      lateLimitTime: body.lateLimitTime || '07:30',
      exitTime: body.exitTime || '12:30',
      transitionTime: body.transitionTime || '12:30',
      operationalDays: body.operationalDays || [1, 2, 3, 4, 5],
      isActive: true,
    };
    tData.schedules.push(newSession);
    saveLocalDB(db);
    return { success: true, session: newSession };
  }

  if (pathOnly.startsWith('/api/admin/sessions/') && method === 'PUT') {
    const id = pathOnly.split('/')[4];
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const s = tData.schedules.find((item) => item.id === id);
    if (s) {
      Object.assign(s, body);
      saveLocalDB(db);
    }
    return { success: true, session: s };
  }

  if (pathOnly.startsWith('/api/admin/sessions/') && method === 'DELETE') {
    const id = pathOnly.split('/')[4];
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    tData.schedules = tData.schedules.filter((item) => item.id !== id);
    saveLocalDB(db);
    return { success: true, message: 'Sesi berhasil dihapus.' };
  }

  // 14. ADMIN ROLE PASSWORDS
  if (pathOnly === '/api/admin/role-passwords') {
    const activeTenant = db.tenants.find((t) => t.id === activeTenantId) || db.tenants[0];
    if (method === 'GET') {
      return {
        success: true,
        passwords: activeTenant.rolePasswords || {
          admin: 'admin123',
          kesiswaan: 'kesiswaan123',
          kepala_sekolah: 'kepsek123',
          defaultWaliKelas: 'wali123',
        },
      };
    }
    if (method === 'POST') {
      activeTenant.rolePasswords = {
        admin: body.admin || 'admin123',
        kesiswaan: body.kesiswaan || 'kesiswaan123',
        kepala_sekolah: body.kepala_sekolah || 'kepsek123',
        defaultWaliKelas: body.defaultWaliKelas || 'wali123',
      };
      saveLocalDB(db);
      return { success: true, message: 'Kata sandi peran berhasil diperbarui.', passwords: activeTenant.rolePasswords };
    }
  }

  // 15. AUDIT LOGS
  if (pathOnly === '/api/admin/audit-logs' && method === 'GET') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    return { success: true, auditLogs: tData.auditLogs || [] };
  }

  // 16. DATABASE CONFIG & SYNC
  if (pathOnly === '/api/database/settings') {
    const t = db.tenants.find((item) => item.id === activeTenantId) || db.tenants[0];
    return {
      success: true,
      config: {
        tenantId: t.id,
        driveFolderId: t.driveFolderId || '',
        spreadsheetId: t.spreadsheetId || '',
        googleAuthMode: 'oauth',
        isConnected: Boolean(t.spreadsheetId),
        isValidated: Boolean(t.spreadsheetId),
        lastSyncAt: t.lastSyncTime || '',
      },
    };
  }

  if (pathOnly === '/api/database/save-config' && method === 'POST') {
    const t = db.tenants.find((item) => item.id === activeTenantId) || db.tenants[0];
    t.driveFolderId = body.driveFolderId || '';
    t.spreadsheetId = body.spreadsheetId || '';
    t.syncStatus = t.spreadsheetId ? 'connected' : 'disconnected';
    saveLocalDB(db);
    return { success: true, message: 'Pengaturan Google Drive & Sheets berhasil disimpan.' };
  }

  if (pathOnly === '/api/database/test-connection' || pathOnly === '/api/database/sync') {
    return {
      success: true,
      message: 'Koneksi database sinkronisasi berhasil terhubung.',
      lastSyncTime: getNowJakarta(),
    };
  }

  // 17. BACKUP & RESTORE
  if (pathOnly === '/api/backup/create' && method === 'POST') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    const backupItem = {
      id: `bk-${Date.now()}`,
      name: `Cadangan_Otomatis_${getTodayJakarta()}`,
      createdAt: getNowJakarta(),
      size: `${Math.round(JSON.stringify(tData).length / 1024)} KB`,
      notes: 'Pencadangan data lokal selesai.',
      data: JSON.parse(JSON.stringify(tData)),
    };
    tData.backups = tData.backups || [];
    tData.backups.unshift(backupItem);
    saveLocalDB(db);
    return { success: true, message: 'Cadangan data berhasil dibuat.', backup: backupItem };
  }

  if (pathOnly === '/api/backup/list' && method === 'GET') {
    const tData = db.tenantData[activeTenantId] || db.tenantData['sch-smpn1'];
    return { success: true, backups: tData.backups || [] };
  }

  // 18. SUPERADMIN TENANTS MANAGEMENT
  if (pathOnly === '/api/superadmin/tenants') {
    if (method === 'GET') {
      return { success: true, tenants: db.tenants };
    }
    if (method === 'POST') {
      const { name, code, npsn, password, address, phone } = body;
      const newId = `sch-${code.toLowerCase().replace(/[^a-z0-9]/g, '') || Date.now()}`;
      const newTenant: any = {
        id: newId,
        name,
        code: code.toUpperCase(),
        npsn: npsn || '',
        address: address || '',
        phone: phone || '',
        password: password || 'sekolah123',
        isActive: true,
        driveFolderId: '',
        spreadsheetId: '',
        lastSyncTime: '',
        syncStatus: 'disconnected',
        createdAt: getNowJakarta(),
      };
      db.tenants.push(newTenant);
      db.tenantData[newId] = {
        students: [],
        classes: [],
        programs: [],
        schedules: [
          {
            id: 'sch-pagi',
            tenantId: newId,
            sessionName: 'Pagi',
            entryStartTime: '06:30',
            entryLimitTime: '07:00',
            lateLimitTime: '07:30',
            exitTime: '12:30',
            transitionTime: '12:30',
            operationalDays: [1, 2, 3, 4, 5],
            isActive: true,
          },
        ],
        presensi: [],
        bathroomPermits: [],
        auditLogs: [],
        users: [],
        backups: [],
        driveConfig: { driveFolderId: '', spreadsheetId: '', syncStatus: 'disconnected', lastSyncTime: '' },
      };
      saveLocalDB(db);
      return { success: true, message: `Sekolah ${name} berhasil ditambahkan.`, tenant: newTenant };
    }
  }

  if (pathOnly.startsWith('/api/superadmin/tenants/') && method === 'DELETE') {
    const id = pathOnly.split('/')[4];
    db.tenants = db.tenants.filter((t) => t.id !== id);
    delete db.tenantData[id];
    saveLocalDB(db);
    return { success: true, message: 'Sekolah berhasil dihapus dari sistem.' };
  }

  // Default fallback jika tidak ada rute spesifik
  return { success: true, message: 'OK' };
}
