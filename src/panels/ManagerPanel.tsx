import { useEffect, useState } from 'react';
import {
  Activity, Bell, CalendarDays, ChevronRight, Download, FileText,
  LayoutDashboard, Plus, Settings, ShieldCheck, Sparkles,
  SunMedium, Users, Utensils, X, Send, Check, Search, Baby, Heart, ImagePlus,
} from 'lucide-react';
import { Shell, NavItem } from '@/components/Shell';
import { PageHeading, Panel, StatCard, Modal } from '@/components/Shared';
import {
  fetchClasses, fetchAllStudents, fetchAnnouncements, fetchActivities,
  fetchTeachers, fetchParents, fetchCalendarEvents, getPublicUrl,
  fetchSchoolSettings, updateSchoolSettings,
  todayStr, getInitials, avatarColor,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Page = 'overview' | 'students' | 'teachers' | 'parents' | 'classes' | 'announcements' | 'gallery' | 'menu' | 'calendar' | 'reports' | 'settings';

const navItems: NavItem[] = [
  { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
  { id: 'students', label: 'Öğrenciler', icon: Users },
  { id: 'teachers', label: 'Öğretmenler', icon: ShieldCheck },
  { id: 'parents', label: 'Veliler', icon: Heart },
  { id: 'classes', label: 'Sınıflar', icon: Baby },
  { id: 'announcements', label: 'Duyurular', icon: Bell },
  { id: 'gallery', label: 'Galeri', icon: ImagePlus },
  { id: 'menu', label: 'Yemek Menüsü', icon: Utensils },
  { id: 'calendar', label: 'Takvim', icon: CalendarDays },
  { id: 'reports', label: 'Raporlar', icon: FileText },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

export function ManagerPanel() {
  const [page, setPage] = useState<Page>('overview');
  return (
    <Shell navItems={navItems} activePage={page} onPageChange={(p) => setPage(p as Page)}>
      {page === 'overview' && <Overview onNavigate={setPage} />}
      {page === 'students' && <StudentsManager />}
      {page === 'teachers' && <TeachersManager />}
      {page === 'parents' && <ParentsManager />}
      {page === 'classes' && <ClassesManager />}
      {page === 'announcements' && <AnnouncementsManager />}
      {page === 'gallery' && <GalleryManager />}
      {page === 'menu' && <MenuManager />}
      {page === 'calendar' && <CalendarManager />}
      {page === 'reports' && <ReportsPage />}
      {page === 'settings' && <SettingsPage />}
    </Shell>
  );
}

function Overview({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [pendingParents, setPendingParents] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchAllStudents().then((s) => setStudentCount(s.length));
    fetchClasses().then((c) => setClassCount(c.length));
    fetchTeachers().then((t) => setTeacherCount(t.length));
    fetchParents().then((p) => setPendingParents(p.filter((x: any) => x.approval_status === 'pending').length));
    fetchAnnouncements().then(setAnnouncements);
    fetchActivities().then(setActivities);
  }, []);

  return (
    <>
      <PageHeading
        eyebrow="YÖNETİCİ PANELİ"
        title="Günaydın"
        subtitle="OGEM Anaokulu genel durum özeti."
        action={<button className="primary-button" onClick={() => onNavigate('announcements')}><Plus size={18} /> Duyuru yayınla</button>}
      />
      <div className="stats-grid">
        <StatCard icon={<Users />} label="Toplam öğrenci" value={String(studentCount)} change="Aktif kayıtlı" tone="sky" />
        <StatCard icon={<Baby />} label="Sınıf sayısı" value={String(classCount)} change="Aktif sınıflar" tone="mint" />
        <StatCard icon={<ShieldCheck />} label="Öğretmen" value={String(teacherCount)} change="Görevli" tone="orange" />
        <StatCard icon={<Heart />} label="Onay bekleyen veli" value={String(pendingParents)} change="İncelemeniz gerekli" tone="yellow" />
      </div>
      <div className="dashboard-grid">
        <Panel title="Son etkinlikler" action="Tümü" onAction={() => onNavigate('reports')}>
          {activities.length === 0 && <p className="empty-text">Henüz etkinlik yok.</p>}
          {activities.slice(0, 3).map((a) => (
            <div key={a.id} className="small-activity">
              <div className="small-activity-icon small-activity-sky"><Activity size={18} /></div>
              <div><b>{a.title}</b><span>{new Date(a.activity_date).toLocaleDateString('tr-TR')}</span></div>
              <ChevronRight size={16} />
            </div>
          ))}
        </Panel>
        <Panel title="Son duyurular" action="Tümü" onAction={() => onNavigate('announcements')}>
          {announcements.length === 0 && <p className="empty-text">Henüz duyuru yok.</p>}
          {announcements.slice(0, 3).map((a) => (
            <div key={a.id} className="announcement-row">
              <div className="announcement-icon announcement-icon-coral"><Bell size={17} /></div>
              <div><b>{a.title}</b><span>{new Date(a.published_at).toLocaleDateString('tr-TR')}</span></div>
              {a.is_pinned && <span className="pinned-label">SABİT</span>}
            </div>
          ))}
        </Panel>
      </div>
      <div className="bottom-grid">
        <Panel title="Hızlı işlemler">
          <div className="quick-actions">
            <button onClick={() => onNavigate('students')}><Users size={19} /><span>Öğrenci ekle</span></button>
            <button onClick={() => onNavigate('teachers')}><ShieldCheck size={19} /><span>Öğretmen ekle</span></button>
            <button onClick={() => onNavigate('menu')}><Utensils size={19} /><span>Menü oluştur</span></button>
            <button onClick={() => onNavigate('calendar')}><CalendarDays size={19} /><span>Takvim olayı</span></button>
            <button onClick={() => onNavigate('announcements')}><Bell size={19} /><span>Duyuru</span></button>
            <button onClick={() => onNavigate('reports')}><FileText size={19} /><span>Rapor indir</span></button>
          </div>
        </Panel>
        <Panel title="Karşılama">
          <div className="welcome-banner mini">
            <div className="banner-content">
              <span className="banner-kicker">OGEM ANAOKULU</span>
              <h2>“Her çocuk, kendi hikâyesinin kahramanıdır.”</h2>
              <p>Yönetim panelinden okulunuzun tüm işleyişini takip edebilirsiniz.</p>
            </div>
            <div className="banner-icon"><Sparkles size={30} /></div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function StudentsManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    fetchAllStudents().then(setStudents);
    fetchClasses().then(setClasses);
  }, []);

  const filtered = students.filter((s) => s.full_name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));

  async function addStudent(name: string, classId: string, birthDate: string, allergy: string, notes: string) {
    if (!supabase) return;
    const { data } = await supabase.from('students').insert({
      full_name: name, class_id: classId || null, birth_date: birthDate || null,
      allergy_info: allergy || null, special_notes: notes || null, is_active: true,
    }).select().maybeSingle();
    if (data) setStudents([...students, data]);
    setShowAdd(false);
  }

  async function deleteStudent(id: string) {
    if (!supabase) return;
    await supabase.from('students').delete().eq('id', id);
    setStudents(students.filter((s) => s.id !== id));
  }

  async function toggleActive(id: string, current: boolean) {
    if (!supabase) return;
    await supabase.from('students').update({ is_active: !current }).eq('id', id);
    setStudents(students.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
  }

  return (
    <>
      <PageHeading
        eyebrow="ÖĞRENCİ YÖNETİMİ"
        title="Öğrenciler"
        subtitle="Öğrencileri ekleyin, düzenleyin ve sınıf ataması yapın."
        action={<button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={18} /> Öğrenci ekle</button>}
      />
      <section className="panel full-panel">
        <div className="list-toolbar">
          <div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Öğrenci ara…" /></div>
        </div>
        <div className="student-table">
          <div className="table-head"><span>ÖĞRENCİ</span><span>SINIF</span><span>DURUM</span><span /></div>
          {filtered.map((s) => {
            const cls = classes.find((c) => c.id === s.class_id);
            return (
              <div className="table-row" key={s.id}>
                <div className="student-name">
                  <div className={`avatar avatar-${avatarColor(s.full_name)}`}>{getInitials(s.full_name)}</div>
                  <div><b>{s.full_name}</b><span>{s.birth_date ? new Date(s.birth_date).toLocaleDateString('tr-TR') : 'Doğum tarihi yok'}</span></div>
                </div>
                <span className="class-pill">{cls?.name ?? '-'}</span>
                <span className={`status-pill ${s.is_active ? 'status-present' : 'status-absent'}`}>{s.is_active ? 'Aktif' : 'Pasif'}</span>
                <div className="row-actions">
                  <button className="icon-button" onClick={() => setEditing(s)}><Settings size={16} /></button>
                  <button className="icon-button" onClick={() => toggleActive(s.id, s.is_active)}><SunMedium size={16} /></button>
                  <button className="icon-button" onClick={() => deleteStudent(s.id)}><X size={16} /></button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="empty-text">Öğrenci bulunamadı.</p>}
        </div>
      </section>
      {showAdd && <AddStudentModal classes={classes} onClose={() => setShowAdd(false)} onAdd={addStudent} />}
      {editing && <EditStudentModal student={editing} classes={classes} onClose={() => setEditing(null)} onSave={(name, classId, allergy, notes) => {
        supabase?.from('students').update({ full_name: name, class_id: classId || null, allergy_info: allergy, special_notes: notes }).eq('id', editing.id);
        setStudents(students.map((s) => (s.id === editing.id ? { ...s, full_name: name, class_id: classId, allergy_info: allergy, special_notes: notes } : s)));
        setEditing(null);
      }} />}
    </>
  );
}

function AddStudentModal({ classes, onClose, onAdd }: { classes: any[]; onClose: () => void; onAdd: (name: string, classId: string, birthDate: string, allergy: string, notes: string) => void }) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [allergy, setAllergy] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <Modal title="Yeni Öğrenci Ekle" onClose={onClose}>
      <div className="modal-form">
        <label>Ad Soyad<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Öğrenci adı" /></label>
        <label>Sınıf<select value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Sınıf seçin</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Doğum Tarihi<input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></label>
        <label>Alerji Bilgisi<input value={allergy} onChange={(e) => setAllergy(e.target.value)} placeholder="Varsa alerji bilgisi" /></label>
        <label>Özel Notlar<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Özel notlar" /></label>
        <button className="primary-button" onClick={() => onAdd(name, classId, birthDate, allergy, notes)}><Plus size={18} /> Ekle</button>
      </div>
    </Modal>
  );
}

function EditStudentModal({ student, classes, onClose, onSave }: { student: any; classes: any[]; onClose: () => void; onSave: (name: string, classId: string, allergy: string, notes: string) => void }) {
  const [name, setName] = useState(student.full_name);
  const [classId, setClassId] = useState(student.class_id ?? '');
  const [allergy, setAllergy] = useState(student.allergy_info ?? '');
  const [notes, setNotes] = useState(student.special_notes ?? '');
  return (
    <Modal title="Öğrenci Düzenle" onClose={onClose}>
      <div className="modal-form">
        <label>Ad Soyad<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Sınıf<select value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Sınıf seçin</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Alerji Bilgisi<input value={allergy} onChange={(e) => setAllergy(e.target.value)} /></label>
        <label>Özel Notlar<textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <button className="primary-button" onClick={() => onSave(name, classId, allergy, notes)}><Check size={18} /> Kaydet</button>
      </div>
    </Modal>
  );
}

function TeachersManager() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachers().then(setTeachers);
    fetchClasses().then(setClasses);
  }, []);

  async function createTeacher() {
    setError('');
    if (!supabase) return;
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) return;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-teacher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, fullName, phone, tempPassword, classId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Öğretmen oluşturulamadı');
      return;
    }
    fetchTeachers().then(setTeachers);
    setShowAdd(false);
    setEmail(''); setFullName(''); setPhone(''); setTempPassword(''); setClassId('');
  }

  async function deleteTeacher(id: string) {
    if (!supabase) return;
    await supabase.from('teachers').delete().eq('profile_id', id);
    await supabase.from('profiles').delete().eq('id', id);
    setTeachers(teachers.filter((t) => t.profile_id !== id));
  }

  return (
    <>
      <PageHeading
        eyebrow="ÖĞRETMEN YÖNETİMİ"
        title="Öğretmenler"
        subtitle="Öğretmen oluşturun, sınıf atayın ve geçici şifre verin."
        action={<button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={18} /> Öğretmen ekle</button>}
      />
      <section className="panel full-panel">
        <div className="student-table">
          <div className="table-head"><span>ÖĞRETMEN</span><span>SINIF</span><span /></div>
          {teachers.map((t) => {
            const cls = classes.find((c) => c.teacher_id === t.profile_id);
            return (
              <div className="table-row" key={t.profile_id}>
                <div className="student-name">
                  <div className={`avatar avatar-${avatarColor(t.profiles?.full_name ?? '')}`}>{getInitials(t.profiles?.full_name ?? '')}</div>
                  <div><b>{t.profiles?.full_name}</b><span>{t.profiles?.phone || 'Telefon yok'}</span></div>
                </div>
                <span className="class-pill">{cls?.name ?? 'Atanmamış'}</span>
                <div className="row-actions">
                  <button className="icon-button" onClick={() => deleteTeacher(t.profile_id)}><X size={16} /></button>
                </div>
              </div>
            );
          })}
          {teachers.length === 0 && <p className="empty-text">Henüz öğretmen yok.</p>}
        </div>
      </section>
      {showAdd && (
        <Modal title="Yeni Öğretmen Oluştur" onClose={() => setShowAdd(false)}>
          <div className="modal-form">
            <label>Ad Soyad<input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Öğretmen adı" /></label>
            <label>E-posta<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" /></label>
            <label>Telefon<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX" /></label>
            <label>Geçici Şifre<input value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} placeholder="Geçici şifre" /></label>
            <label>Sınıf Ata<select value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Sınıf seçin</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            {error && <div className="auth-message">{error}</div>}
            <button className="primary-button" onClick={createTeacher}><Plus size={18} /> Öğretmeni Oluştur</button>
            <p className="modal-hint">Öğretmen ilk girişte şifresini değiştirmek zorunda kalacak.</p>
          </div>
        </Modal>
      )}
    </>
  );
}

function ParentsManager() {
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchParents().then(setParents);
    fetchAllStudents().then(setStudents);
  }, []);

  async function createParent() {
    setError('');
    setCreating(true);
    if (!supabase) return;
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) { setCreating(false); return; }
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, fullName, phone, tempPassword, studentId }),
    });
    setCreating(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Veli oluşturulamadı');
      return;
    }
    fetchParents().then(setParents);
    setShowAdd(false);
    setEmail(''); setFullName(''); setPhone(''); setTempPassword(''); setStudentId('');
  }

  async function approve(id: string) {
    if (!supabase) return;
    await supabase.from('parents').update({ approval_status: 'approved' }).eq('profile_id', id);
    setParents(parents.map((p) => (p.profile_id === id ? { ...p, approval_status: 'approved' } : p)));
  }
  async function reject(id: string) {
    if (!supabase) return;
    await supabase.from('parents').update({ approval_status: 'rejected' }).eq('profile_id', id);
    setParents(parents.map((p) => (p.profile_id === id ? { ...p, approval_status: 'rejected' } : p)));
  }
  async function linkStudent(profileId: string, studentId: string) {
    if (!supabase) return;
    await supabase.from('parents').update({ student_id: studentId }).eq('profile_id', profileId);
    setParents(parents.map((p) => (p.profile_id === profileId ? { ...p, student_id: studentId } : p)));
  }

  return (
    <>
      <PageHeading
        eyebrow="VELİ YÖNETİMİ"
        title="Veliler"
        subtitle="Veli oluşturun, onaylayın ve öğrencilerle eşleştirin."
        action={<button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={18} /> Veli ekle</button>}
      />
      <section className="panel full-panel">
        <div className="student-table">
          <div className="table-head"><span>VELİ</span><span>DURUM</span><span>ÖĞRENCİ</span><span /></div>
          {parents.map((p) => (
            <div className="table-row" key={p.profile_id}>
              <div className="student-name">
                <div className={`avatar avatar-${avatarColor(p.profiles?.full_name ?? '')}`}>{getInitials(p.profiles?.full_name ?? '')}</div>
                <div><b>{p.profiles?.full_name}</b><span>{p.profiles?.email || ''}</span></div>
              </div>
              <span className={`status-pill ${p.approval_status === 'approved' ? 'status-present' : p.approval_status === 'rejected' ? 'status-absent' : 'status-late'}`}>
                {p.approval_status === 'approved' ? 'Onaylı' : p.approval_status === 'rejected' ? 'Reddedildi' : 'Onay bekliyor'}
              </span>
              <select
                className="link-select"
                value={p.student_id ?? ''}
                onChange={(e) => linkStudent(p.profile_id, e.target.value)}
              >
                <option value="">Öğrenci seçin</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
              <div className="row-actions">
                {p.approval_status === 'pending' && (
                  <>
                    <button className="icon-button" onClick={() => approve(p.profile_id)}><Check size={16} /></button>
                    <button className="icon-button" onClick={() => reject(p.profile_id)}><X size={16} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
          {parents.length === 0 && <p className="empty-text">Kayıtlı veli yok.</p>}
        </div>
      </section>
      {showAdd && (
        <Modal title="Yeni Veli Oluştur" onClose={() => setShowAdd(false)}>
          <div className="modal-form">
            <label>Ad Soyad<input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Veli adı soyadı" /></label>
            <label>E-posta<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" /></label>
            <label>Telefon<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX" /></label>
            <label>Geçici Şifre<input value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} placeholder="Geçici şifre" /></label>
            <label>Öğrenci Ata<select value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">Öğrenci seçin</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label>
            {error && <div className="auth-message">{error}</div>}
            <button className="primary-button" onClick={createParent} disabled={creating}><Plus size={18} /> {creating ? 'Oluşturuluyor…' : 'Veliyi Oluştur'}</button>
            <p className="modal-hint">Veliye e-posta ve şifreyi verin. İlk girişte şifresini değiştirmek zorunda kalacak.</p>
          </div>
        </Modal>
      )}
    </>
  );
}

function ClassesManager() {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [teacherId, setTeacherId] = useState('');

  useEffect(() => {
    fetchClasses().then(setClasses);
    fetchTeachers().then(setTeachers);
  }, []);

  async function addClass() {
    if (!supabase || !name) return;
    const { data } = await supabase.from('classes').insert({ name, age_group: ageGroup || name, teacher_id: teacherId || null }).select().maybeSingle();
    if (data) setClasses([...classes, data]);
    setName(''); setAgeGroup(''); setTeacherId('');
  }
  async function deleteClass(id: string) {
    if (!supabase) return;
    await supabase.from('classes').delete().eq('id', id);
    setClasses(classes.filter((c) => c.id !== id));
  }
  async function assignTeacher(classId: string, tId: string) {
    if (!supabase) return;
    await supabase.from('classes').update({ teacher_id: tId || null }).eq('id', classId);
    setClasses(classes.map((c) => (c.id === classId ? { ...c, teacher_id: tId } : c)));
  }

  return (
    <>
      <PageHeading eyebrow="SINIF YÖNETİMİ" title="Sınıflar" subtitle="Sınıf oluşturun ve öğretmen atayın." />
      <section className="panel">
        <div className="modal-form inline-form">
          <label>Sınıf Adı<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. 4 Yaş A" /></label>
          <label>Yaş Grubu<input value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="4 Yaş" /></label>
          <label>Öğretmen<select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}><option value="">Atama yapma</option>{teachers.map((t) => <option key={t.profile_id} value={t.profile_id}>{t.profiles?.full_name}</option>)}</select></label>
          <button className="primary-button" onClick={addClass}><Plus size={18} /> Ekle</button>
        </div>
      </section>
      <section className="panel">
        <div className="class-list">
          {classes.map((c) => {
            return (
              <div className="class-row" key={c.id}>
                <div className={`class-avatar class-avatar-${avatarColor(c.name)}`}>{c.name.slice(0, 2)}</div>
                <div><b>{c.name}</b><span>{c.age_group}</span></div>
                <select className="link-select" value={c.teacher_id ?? ''} onChange={(e) => assignTeacher(c.id, e.target.value)}>
                  <option value="">Öğretmen ata</option>
                  {teachers.map((t) => <option key={t.profile_id} value={t.profile_id}>{t.profiles?.full_name}</option>)}
                </select>
                <button className="icon-button" onClick={() => deleteClass(c.id)}><X size={16} /></button>
              </div>
            );
          })}
          {classes.length === 0 && <p className="empty-text">Henüz sınıf yok.</p>}
        </div>
      </section>
    </>
  );
}

function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);

  useEffect(() => { fetchAnnouncements().then(setAnnouncements); }, []);

  async function publish() {
    if (!supabase || !title || !body) return;
    const { data } = await supabase.from('announcements').insert({ title, body, is_pinned: pinned }).select().maybeSingle();
    if (data) setAnnouncements([data, ...announcements]);
    setTitle(''); setBody(''); setPinned(false);
  }
  async function deleteAnn(id: string) {
    if (!supabase) return;
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(announcements.filter((a) => a.id !== id));
  }

  return (
    <>
      <PageHeading eyebrow="DUYURULAR" title="Duyuru Yönetimi" subtitle="Okul duyurularını yayınlayın ve yönetin." />
      <section className="panel">
        <div className="modal-form">
          <label>Duyuru Başlığı<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Duyuru başlığı" /></label>
          <label>İçerik<textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Duyuru içeriği" /></label>
          <label className="checkbox-label"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Önemli duyuru (sabitlensin)</label>
          <button className="primary-button" onClick={publish}><Send size={18} /> Yayınla</button>
        </div>
      </section>
      <section className="panel">
        {announcements.map((a) => (
          <div className="announcement-row" key={a.id}>
            <div className={`announcement-icon ${a.is_pinned ? 'announcement-icon-coral' : 'announcement-icon-mint'}`}><Bell size={17} /></div>
            <div><b>{a.title}</b><span>{a.body}</span></div>
            {a.is_pinned && <span className="pinned-label">SABİT</span>}
            <button className="icon-button" onClick={() => deleteAnn(a.id)}><X size={16} /></button>
          </div>
        ))}
        {announcements.length === 0 && <p className="empty-text">Henüz duyuru yok.</p>}
      </section>
    </>
  );
}

function GalleryManager() {
  const { session } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchClasses().then(setClasses);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchActivities(selectedClass).then(setActivities);
    } else {
      fetchActivities().then(setActivities);
    }
  }, [selectedClass]);

  async function share() {
    if (!supabase || !title || !selectedClass) return;
    setSharing(true);
    const { data: activity } = await supabase.from('activities').insert({
      class_id: selectedClass, title, description: desc, activity_date: todayStr(),
      created_by: session?.user.id,
    }).select().maybeSingle();
    if (activity && files.length > 0) {
      for (const file of files) {
        const path = `${selectedClass}/${activity.id}/${Date.now()}-${file.name}`;
        const uploaded = await supabase.storage.from('school-media').upload(path, file, { upsert: true });
        if (!uploaded.error) {
          await supabase.from('photos').insert({ activity_id: activity.id, storage_path: path });
        }
      }
    }
    if (selectedClass) fetchActivities(selectedClass).then(setActivities);
    else fetchActivities().then(setActivities);
    setTitle(''); setDesc(''); setFiles([]);
    setSharing(false);
  }

  async function deleteActivity(id: string) {
    if (!supabase) return;
    await supabase.from('activities').delete().eq('id', id);
    setActivities(activities.filter((a) => a.id !== id));
  }

  return (
    <>
      <PageHeading eyebrow="GALERİ YÖNETİMİ" title="Etkinlik Galerisi" subtitle="Tüm sınıfların etkinlik fotoğraflarını yönetin ve paylaşın." />
      <section className="panel">
        <div className="modal-form">
          <label>Sınıf<select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}><option value="">Tüm sınıflar</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Etkinlik Başlığı<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Etkinlik adı" /></label>
          <label>Açıklama<input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Kısa açıklama" /></label>
          <label>Fotoğraf Ekle<input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></label>
          <button className="primary-button" onClick={share} disabled={sharing || !title || !selectedClass}><ImagePlus size={18} /> {sharing ? 'Paylaşılıyor…' : 'Paylaş'}</button>
        </div>
      </section>
      <div className="activity-grid">
        {activities.map((a) => (
          <article className="activity-tile" key={a.id}>
            <div className="tile-image" style={a.photos?.[0] ? { backgroundImage: `url(${getPublicUrl('school-media', a.photos[0].storage_path)})` } : undefined}>
              {!a.photos?.[0] && <div className="tile-image-placeholder image-leaves" />}
              {a.photos?.length > 0 && <span><ImagePlus size={14} /> {a.photos.length} fotoğraf</span>}
              <button className="tile-delete-btn" onClick={() => deleteActivity(a.id)}><X size={14} /></button>
            </div>
            <div className="tile-copy">
              <span className="soft-tag">{new Date(a.activity_date).toLocaleDateString('tr-TR')}</span>
              <h3>{a.title}</h3>
              {a.description && <p>{a.description}</p>}
              {a.photos?.length > 0 && (
                <div className="tile-photo-thumbs">
                  {a.photos.slice(0, 4).map((p: any) => (
                    <button key={p.id} className="tile-thumb" onClick={() => setLightbox(getPublicUrl('school-media', p.storage_path))}>
                      <img src={getPublicUrl('school-media', p.storage_path)} alt="Fotoğraf" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
        {activities.length === 0 && <p className="empty-text">Henüz etkinlik yok.</p>}
      </div>
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}><X size={24} /></button>
          <img src={lightbox} alt="Fotoğraf" className="lightbox-image" />
        </div>
      )}
    </>
  );
}

const mealSlots = ['breakfast', 'lunch', 'snack'] as const;
const mealLabels: Record<string, string> = { breakfast: 'Sabah Kahvaltısı', lunch: 'Öğle Yemeği', snack: 'İkindi Kahvaltısı' };

function MenuManager() {
  const [weekStart, setWeekStart] = useState(todayStr());
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayLabels = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!supabase) return;
    supabase.from('weekly_menus').select('*').eq('week_start', weekStart).maybeSingle().then(({ data }) => {
      if (data) {
        const v: Record<string, string> = {};
        days.forEach((d) => mealSlots.forEach((m) => v[`${d}_${m}`] = data[`${d}_${m}`] || ''));
        setValues(v);
      } else {
        setValues({});
      }
    });
  }, [weekStart]);

  async function save() {
    if (!supabase) return;
    const payload = { week_start: weekStart, ...values };
    await supabase.from('weekly_menus').upsert(payload, { onConflict: 'week_start' });
  }

  return (
    <>
      <PageHeading eyebrow="YEMEK MENÜSÜ" title="Haftalık Menü" subtitle="Pazartesi–Cuma arası günlük 3 öğün menüsünü oluşturun." />
      <section className="panel">
        <label className="date-label">Hafta Başlangıcı<input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} /></label>
        <div className="menu-days-3meal">
          {days.map((d, i) => (
            <div className="menu-day-3meal" key={d}>
              <b className="menu-day-title">{dayLabels[i]}</b>
              {mealSlots.map((m) => (
                <label key={`${d}_${m}`} className="menu-meal-label">{mealLabels[m]}<textarea value={values[`${d}_${m}`] ?? ''} onChange={(e) => setValues({ ...values, [`${d}_${m}`]: e.target.value })} placeholder={`${mealLabels[m]} menüsü`} /></label>
              ))}
            </div>
          ))}
        </div>
        <button className="primary-button" onClick={save}><Check size={18} /> Menüyü Kaydet</button>
      </section>
    </>
  );
}

function CalendarManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState('event');

  useEffect(() => { fetchCalendarEvents().then(setEvents); }, []);

  async function add() {
    if (!supabase || !title) return;
    const { data } = await supabase.from('calendar_events').insert({ title, event_date: date, event_type: type }).select().maybeSingle();
    if (data) setEvents([...events, data].sort((a, b) => a.event_date.localeCompare(b.event_date)));
    setTitle('');
  }
  async function remove(id: string) {
    if (!supabase) return;
    await supabase.from('calendar_events').delete().eq('id', id);
    setEvents(events.filter((e) => e.id !== id));
  }

  const typeLabels: Record<string, string> = { event: 'Etkinlik', holiday: 'Tatil', meeting: 'Toplantı', trip: 'Gezi', birthday: 'Doğum Günü' };

  return (
    <>
      <PageHeading eyebrow="TAKVİM" title="Okul Takvimi" subtitle="Tatil, toplantı, gezi ve özel günleri ekleyin." />
      <section className="panel">
        <div className="modal-form inline-form">
          <label>Başlık<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Etkinlik adı" /></label>
          <label>Tarih<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label>Tür<select value={type} onChange={(e) => setType(e.target.value)}>{Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <button className="primary-button" onClick={add}><Plus size={18} /> Ekle</button>
        </div>
      </section>
      <section className="panel">
        {events.map((e) => (
          <div className="calendar-row" key={e.id}>
            <div className="calendar-date"><b>{new Date(e.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</b></div>
            <div><b>{e.title}</b><span>{typeLabels[e.event_type] || e.event_type}</span></div>
            <button className="icon-button" onClick={() => remove(e.id)}><X size={16} /></button>
          </div>
        ))}
        {events.length === 0 && <p className="empty-text">Henüz takvim olayı yok.</p>}
      </section>
    </>
  );
}

function ReportsPage() {
  return (
    <>
      <PageHeading eyebrow="YÖNETİM RAPORLARI" title="Raporlar" subtitle="Okulunuzun genel durumunu grafiklerle takip edin."
        action={<button className="outline-button"><Download size={17} /> PDF indir</button>} />
      <div className="report-stats">
        <div className="report-number"><span>Bu ay toplam katılım</span><b>%96.4</b><small>Geçen aya göre <strong>+3.2%</strong></small></div>
        <div className="report-number"><span>Paylaşılan etkinlik</span><b>28</b><small>Geçen aya göre <strong>+8</strong></small></div>
        <div className="report-number"><span>Veli memnuniyeti</span><b>4.9<span>/5</span></b><small>48 veli yanıtladı</small></div>
      </div>
      <div className="reports-grid">
        <Panel title="Haftalık katılım">
          <div className="bar-chart">
            <div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
            <div className="bars">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => (
                <div className="bar-column" key={day}>
                  <div className="bar-track"><i style={{ height: `${[94, 91, 97, 95, 98, 0, 0][i]}%` }} /></div>
                  <span>{day}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel title="Yemek durumu">
          <div className="donut-wrap">
            <div className="donut"><strong>89%</strong><span>tam yedi</span></div>
            <div className="donut-legend">
              <div><i className="dot dot-mint" /><span>Tam yedi</span><b>89%</b></div>
              <div><i className="dot dot-yellow" /><span>Yarısını yedi</span><b>8%</b></div>
              <div><i className="dot dot-coral" /><span>Az / yemedi</span><b>3%</b></div>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSchoolSettings().then((s) => {
      if (!s) return;
      setSettings(s);
      setName(s.school_name ?? '');
      setPhone(s.phone ?? '');
      setEmail(s.email ?? '');
      setAddress(s.address ?? '');
    });
  }, []);

  async function save() {
    setSaving(true);
    await updateSchoolSettings({
      school_name: name,
      phone,
      email,
      address,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <PageHeading eyebrow="AYARLAR" title="Sistem Ayarları" subtitle="Okul bilgileri ve sistem yapılandırması." />
      <section className="panel">
        <div className="modal-form">
          <label>Okul Adı<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Okul adı" /></label>
          <label>Telefon<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefon numarası" /></label>
          <label>E-posta<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta adresi" /></label>
          <label>Adres<textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Okul adresi" /></label>
          <button className="primary-button" onClick={save} disabled={saving}>
            {saving ? 'Kaydediliyor…' : (<><Check size={18} /> Kaydet</>)}
          </button>
          {saved && <p className="save-success-msg">Bilgiler kaydedildi.</p>}
        </div>
      </section>
    </>
  );
}
