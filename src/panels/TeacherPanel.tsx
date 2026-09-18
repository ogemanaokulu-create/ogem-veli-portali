import { useEffect, useState } from 'react';
import {
  Activity, CalendarDays, Check, ClipboardCheck, Clock3,
  FileText, ImagePlus, LayoutDashboard, MessageCircle, Moon, Pill,
  Plus, Search, Send, Utensils, Users, Droplet, Smile, X,
} from 'lucide-react';
import { Shell, NavItem } from '@/components/Shell';
import { PageHeading, Panel, Modal } from '@/components/Shared';
import {
  fetchClasses, fetchStudents, fetchDailyReport, upsertDailyReport,
  fetchAttendance, upsertAttendance, fetchActivities, fetchProfilesByRole,
  fetchMedicationLog, upsertMedicationLog, sendMessage, getPublicUrl, todayStr, getInitials, avatarColor, calcSleepDuration,
  mealOptions, moodOptions, waterOptions, toiletOptions, attendanceOptions,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Page = 'overview' | 'daily' | 'activities' | 'messages' | 'calendar';

const navItems: NavItem[] = [
  { id: 'overview', label: 'Ana Sayfa', icon: LayoutDashboard },
  { id: 'daily', label: 'Günlük Takip', icon: ClipboardCheck },
  { id: 'activities', label: 'Etkinlikler', icon: Activity },
  { id: 'messages', label: 'Mesajlar', icon: MessageCircle },
  { id: 'calendar', label: 'Takvim', icon: CalendarDays },
];

export function TeacherPanel() {
  const [page, setPage] = useState<Page>('overview');
  return (
    <Shell navItems={navItems} activePage={page} onPageChange={(p) => setPage(p as Page)}>
      {page === 'overview' && <TeacherOverview onNavigate={setPage} />}
      {page === 'daily' && <DailyTracking />}
      {page === 'activities' && <ActivityShare />}
      {page === 'messages' && <TeacherMessages />}
      {page === 'calendar' && <TeacherCalendar />}
    </Shell>
  );
}

function TeacherOverview({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { session } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [myClass, setMyClass] = useState<any>(null);
  const [todayReport, setTodayReports] = useState<any[]>([]);

  useEffect(() => {
    fetchClasses().then(async (classes) => {
      const cls = classes.find((c) => c.teacher_id === session?.user.id);
      setMyClass(cls);
      if (cls) {
        const s = await fetchStudents(cls.id);
        setStudents(s);
        const reports = await Promise.all(s.map((st: any) => fetchDailyReport(st.id, todayStr())));
        setTodayReports(reports.filter(Boolean));
      }
    });
  }, [session]);

  return (
    <>
      <PageHeading
        eyebrow="ÖĞRETMEN PANELİ"
        title={`Günaydın, ${session?.profile.full_name?.split(' ')[0] ?? ''}`}
        subtitle={myClass ? `${myClass.name} sınıfı • Bugün ${todayStr()}` : 'Sınıfınız hazır.'}
        action={<button className="primary-button" onClick={() => onNavigate('daily')}><ClipboardCheck size={18} /> Günlük takip</button>}
      />
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-sky"><Users size={18} /></div>
          <div><span>Sınıf mevcudu</span><strong>{String(students.length)}</strong><small className="text-green">{myClass?.name ?? '-'}</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-mint"><Check size={18} /></div>
          <div><span>Bugün kayıt</span><strong>{String(todayReport.length)}</strong><small className="text-green">Tamamlanan</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-orange"><ClipboardCheck size={18} /></div>
          <div><span>Bekleyen</span><strong>{String(students.length - todayReport.length)}</strong><small className="text-orange">Kayıt girilmemiş</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-yellow"><Activity size={18} /></div>
          <div><span>Bu hafta etkinlik</span><strong>4</strong><small className="text-yellow">Paylaşılan</small></div>
        </div>
      </div>
      <Panel title="Bugünkü öğrenciler" action="Günlük takip" onAction={() => onNavigate('daily')}>
        <div className="daily-student-grid">
          {students.map((s) => {
            const report = todayReport.find((r: any) => r.student_id === s.id);
            return (
              <div key={s.id} className="daily-student-card">
                <div className={`avatar avatar-${avatarColor(s.full_name)}`}>{getInitials(s.full_name)}</div>
                <b>{s.full_name}</b>
                <span className={`status-pill ${report ? 'status-present' : 'status-late'}`}>{report ? 'Kayıt tamam' : 'Bekliyor'}</span>
              </div>
            );
          })}
          {students.length === 0 && <p className="empty-text">Sınıfınızda öğrenci yok.</p>}
        </div>
      </Panel>
    </>
  );
}

function DailyTracking() {
  const { session } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [myClass, setMyClass] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [medication, setMedication] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchClasses().then(async (classes) => {
      const cls = classes.find((c) => c.teacher_id === session?.user.id);
      setMyClass(cls);
      if (cls) {
        const s = await fetchStudents(cls.id);
        setStudents(s);
        if (s.length > 0) setSelectedId(s[0].id);
      }
    });
  }, [session]);

  useEffect(() => {
    if (!selectedId) return;
    fetchDailyReport(selectedId, todayStr()).then(setReport);
    fetchAttendance(selectedId, todayStr()).then(setAttendance);
    fetchMedicationLog(selectedId, todayStr()).then(setMedication);
    setSaved(false);
  }, [selectedId]);

  const child = students.find((s) => s.id === selectedId);
  const filtered = students.filter((s) => s.full_name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));

  async function saveReport(data: any) {
    const existing = await upsertDailyReport({
      ...data,
      student_id: selectedId,
      report_date: todayStr(),
      created_by: session?.user.id,
    });
    setReport(existing);
    setSaved(true);
  }

  async function saveAttendance(status: string) {
    const rec = await upsertAttendance({
      student_id: selectedId,
      class_id: myClass?.id,
      attendance_date: todayStr(),
      status,
      recorded_by: session?.user.id,
    });
    setAttendance(rec);
  }

  async function saveMedication(data: Record<string, unknown>) {
    const rec = await upsertMedicationLog({
      ...data,
      student_id: selectedId,
      tracking_date: todayStr(),
      recorded_by: session?.user.id,
    });
    setMedication(rec);
  }

  return (
    <>
      <PageHeading eyebrow="GÜNLÜK TAKİP" title="Bugünün Kayıtları" subtitle={myClass ? `${myClass.name} • ${todayStr()}` : 'Sınıf seçili değil'} />
      <div className="daily-layout">
        <section className="panel daily-student-list">
          <div className="panel-header"><h2>{myClass?.name ?? 'Sınıf'}</h2></div>
          <div className="daily-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Öğrenci ara" /></div>
          {filtered.map((s) => (
            <button key={s.id} className={`daily-student ${selectedId === s.id ? 'selected' : ''}`} onClick={() => setSelectedId(s.id)}>
              <div className={`avatar avatar-${avatarColor(s.full_name)}`}>{getInitials(s.full_name)}</div>
              <div><b>{s.full_name}</b><span>{attendance && s.id === selectedId ? attendance.status : 'Kayıt bekliyor'}</span></div>
            </button>
          ))}
          {filtered.length === 0 && <p className="empty-text">Öğrenci bulunamadı.</p>}
        </section>
        <section className="panel daily-form">
          {child ? (
            <>
              <div className="daily-form-heading">
                <div className={`avatar avatar-${avatarColor(child.full_name)} avatar-large`}>{getInitials(child.full_name)}</div>
                <div><span className="eyebrow">{myClass?.name} • BUGÜN</span><h2>{child.full_name}</h2><p>Günlük bilgi kartı</p></div>
              </div>
              <DailyForm report={report} attendance={attendance} medication={medication} onSaveReport={saveReport} onSaveAttendance={saveAttendance} onSaveMedication={saveMedication} saved={saved} />
            </>
          ) : (
            <p className="empty-text">Öğrenci seçin.</p>
          )}
        </section>
      </div>
    </>
  );
}

function DailyForm({ report, attendance, medication, onSaveReport, onSaveAttendance, onSaveMedication, saved }: { report: any; attendance: any; medication: any; onSaveReport: (d: any) => void; onSaveAttendance: (s: string) => void; onSaveMedication: (d: Record<string, unknown>) => void; saved: boolean }) {
  const [breakfast, setBreakfast] = useState(report?.breakfast ?? '');
  const [lunch, setLunch] = useState(report?.lunch ?? '');
  const [snack, setSnack] = useState(report?.snack ?? '');
  const [mealNote, setMealNote] = useState(report?.meal_note ?? '');
  const [slept, setSlept] = useState(report?.slept ?? false);
  const [sleepStart, setSleepStart] = useState(report?.sleep_start ?? '');
  const [sleepEnd, setSleepEnd] = useState(report?.sleep_end ?? '');
  const [toiletStatus, setToiletStatus] = useState(report?.toilet_status ?? '');
  const [toiletNote, setToiletNote] = useState(report?.toilet_note ?? '');
  const [waterStatus, setWaterStatus] = useState(report?.water_status ?? '');
  const [mood, setMood] = useState(report?.mood ?? '');
  const [dailyNote, setDailyNote] = useState(report?.daily_note ?? '');
  const [attStatus, setAttStatus] = useState(attendance?.status ?? 'present');

  useEffect(() => {
    setBreakfast(report?.breakfast ?? '');
    setLunch(report?.lunch ?? '');
    setSnack(report?.snack ?? '');
    setMealNote(report?.meal_note ?? '');
    setSlept(report?.slept ?? false);
    setSleepStart(report?.sleep_start ?? '');
    setSleepEnd(report?.sleep_end ?? '');
    setToiletStatus(report?.toilet_status ?? '');
    setToiletNote(report?.toilet_note ?? '');
    setWaterStatus(report?.water_status ?? '');
    setMood(report?.mood ?? '');
    setDailyNote(report?.daily_note ?? '');
    setAttStatus(attendance?.status ?? 'present');
  }, [report, attendance]);

  function save() {
    onSaveAttendance(attStatus);
    onSaveReport({
      breakfast, lunch, snack, meal_note: mealNote,
      slept, sleep_start: sleepStart || null, sleep_end: sleepEnd || null,
      toilet_status: toiletStatus || null, toilet_note: toiletNote || null,
      water_status: waterStatus || null, mood: mood || null,
      daily_note: dailyNote || null, attendance_status: attStatus,
    });
  }

  return (
    <>
      <MedicationTracking log={medication} onSave={onSaveMedication} />
      <div className="form-section">
        <div className="form-section-title"><Users size={18} /><div><b>Yoklama</b><span>Geliş durumunu işaretleyin</span></div></div>
        <div className="choice-row">
          {attendanceOptions.map((o) => (
            <button key={o.value} className={`choice-button ${attStatus === o.value ? 'choice-selected' : ''}`} onClick={() => setAttStatus(o.value)}>{o.label}</button>
          ))}
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title"><Utensils size={18} /><div><b>Yemek Takibi</b><span>Üç öğünü ayrı ayrı girin</span></div></div>
        <div className="meal-grid">
          {[
            { label: 'Kahvaltı', val: breakfast, set: setBreakfast },
            { label: 'Öğle Yemeği', val: lunch, set: setLunch },
            { label: 'İkindi', val: snack, set: setSnack },
          ].map((m) => (
            <div className="meal-card meal-mint" key={m.label}>
              <div className="meal-card-top"><span>{m.label}</span></div>
              <select className="meal-select" value={m.val} onChange={(e) => m.set(e.target.value)}>
                <option value="">Seçin</option>
                {mealOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <input className="wide-input" value={mealNote} onChange={(e) => setMealNote(e.target.value)} placeholder="Yemek notu ekleyin…" />
      </div>
      <div className="form-section">
        <div className="form-section-title"><Moon size={18} /><div><b>Uyku Takibi</b><span>Uyku saatlerini kaydedin</span></div></div>
        <div className="sleep-row">
          <button className={`choice-button ${slept ? 'choice-selected' : ''}`} onClick={() => setSlept(true)}><Check size={16} /> Uyudu</button>
          <button className={`choice-button ${!slept ? 'choice-selected' : ''}`} onClick={() => setSlept(false)}>Uyumadı</button>
          <label>Başlangıç<input type="time" value={sleepStart} onChange={(e) => setSleepStart(e.target.value)} /></label>
          <label>Bitiş<input type="time" value={sleepEnd} onChange={(e) => setSleepEnd(e.target.value)} /></label>
          {slept && sleepStart && sleepEnd && <div className="sleep-duration"><Clock3 size={16} /><span>{calcSleepDuration(sleepStart, sleepEnd)}</span></div>}
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title"><FileText size={18} /><div><b>Tuvalet Takibi</b><span>Durumu işaretleyin</span></div></div>
        <div className="choice-row">
          {toiletOptions.map((o) => (
            <button key={o} className={`choice-button ${toiletStatus === o ? 'choice-selected' : ''}`} onClick={() => setToiletStatus(o)}>{o}</button>
          ))}
        </div>
        <input className="wide-input" value={toiletNote} onChange={(e) => setToiletNote(e.target.value)} placeholder="Tuvalet notu (opsiyonel)…" />
      </div>
      <div className="form-section">
        <div className="form-section-title"><Droplet size={18} /><div><b>Su İçme</b><span>Su içme durumunu işaretleyin</span></div></div>
        <div className="choice-row">
          {waterOptions.map((o) => (
            <button key={o} className={`choice-button ${waterStatus === o ? 'choice-selected' : ''}`} onClick={() => setWaterStatus(o)}>{o === 'Cok Iyi' ? 'Çok İyi' : o}</button>
          ))}
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title"><Smile size={18} /><div><b>Ruh Hali</b><span>Bugünkü ruh halini seçin</span></div></div>
        <div className="mood-row">
          {moodOptions.map((o) => (
            <button key={o.value} className={`mood-button ${mood === o.value ? 'mood-selected' : ''}`} onClick={() => setMood(o.value)}>
              <span className="mood-emoji">{o.emoji}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title"><FileText size={18} /><div><b>Günün Notu</b><span>Aileyle paylaşılacak kısa not</span></div></div>
        <textarea className="wide-input note-input" value={dailyNote} onChange={(e) => setDailyNote(e.target.value)} placeholder="Bugün hakkında kısa not…" />
      </div>
      <div className="form-footer">
        <span>{saved ? 'Kayıt başarıyla güncellendi.' : 'Hazır olduğunuzda kaydedin.'}</span>
        <button className="primary-button" onClick={save}><Check size={18} /> Kaydet</button>
      </div>
    </>
  );
}

function ActivityShare() {
  const { session } = useAuth();
  const [myClass, setMyClass] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchClasses().then(async (classes) => {
      const cls = classes.find((c) => c.teacher_id === session?.user.id);
      setMyClass(cls);
      if (cls) fetchActivities(cls.id).then(setActivities);
    });
  }, [session]);

  async function share() {
    if (!supabase || !title || !myClass) return;
    setSharing(true);
    const { data: activity } = await supabase.from('activities').insert({
      class_id: myClass.id, title, description: desc, activity_date: todayStr(),
      created_by: session?.user.id,
    }).select().maybeSingle();
    if (activity && files.length > 0) {
      for (const file of files) {
        const path = `${myClass.id}/${activity.id}/${Date.now()}-${file.name}`;
        const uploaded = await supabase.storage.from('school-media').upload(path, file, { upsert: true });
        if (!uploaded.error) {
          await supabase.from('photos').insert({ activity_id: activity.id, storage_path: path });
        }
      }
    }
    fetchActivities(myClass.id).then(setActivities);
    setTitle(''); setDesc(''); setFiles([]);
    setSharing(false);
  }

  return (
    <>
      <PageHeading eyebrow="ETKİNLİK PAYLAŞIMI" title="Etkinlikler" subtitle="Sınıfınızın güzel anlarını ailelerle paylaşın." />
      <section className="panel">
        <div className="modal-form">
          <label>Etkinlik Başlığı<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Sonbahar Yaprak Baskısı" /></label>
          <label>Açıklama<textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Etkinliği kısaca anlatın…" /></label>
          <label>Fotoğraf Ekle<input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></label>
          <button className="primary-button" onClick={share} disabled={sharing || !title}><ImagePlus size={18} /> {sharing ? 'Paylaşılıyor…' : 'Paylaş'}</button>
        </div>
      </section>
      <div className="activity-grid">
        {activities.map((a) => (
          <article className="activity-tile" key={a.id}>
            <div className="tile-image" style={a.photos?.[0] ? { backgroundImage: `url(${getPublicUrl('school-media', a.photos[0].storage_path)})` } : undefined}>
              {!a.photos?.[0] && <div className="tile-image-placeholder image-leaves" />}
              {a.photos?.length > 0 && <span><ImagePlus size={14} /> {a.photos.length} fotoğraf</span>}
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
        {activities.length === 0 && <p className="empty-text">Henüz etkinlik paylaşılmadı.</p>}
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

function MedicationTracking({ log, onSave }: { log: any; onSave: (data: Record<string, unknown>) => void }) {
  const [hasMedication, setHasMedication] = useState(log?.has_medication ?? false);
  const [name, setName] = useState(log?.medication_name ?? '');
  const [dose, setDose] = useState(log?.dose ?? '');
  const [plannedTime, setPlannedTime] = useState(log?.planned_time?.slice(0, 5) ?? '');
  const [status, setStatus] = useState(log?.status ?? 'pending');
  const [administeredAt, setAdministeredAt] = useState(log?.administered_at?.slice(0, 5) ?? '');
  const [note, setNote] = useState(log?.note ?? '');

  useEffect(() => {
    setHasMedication(log?.has_medication ?? false);
    setName(log?.medication_name ?? '');
    setDose(log?.dose ?? '');
    setPlannedTime(log?.planned_time?.slice(0, 5) ?? '');
    setStatus(log?.status ?? 'pending');
    setAdministeredAt(log?.administered_at?.slice(0, 5) ?? '');
    setNote(log?.note ?? '');
  }, [log]);

  function save(nextStatus = status, nextHasMedication = hasMedication) {
    onSave({
      has_medication: nextHasMedication,
      medication_name: name || null,
      dose: dose || null,
      planned_time: plannedTime || null,
      status: nextStatus,
      administered_at: nextStatus === 'given' ? (administeredAt || null) : null,
      note: note || null,
      updated_at: new Date().toISOString(),
    });
  }

  return (
    <div className="health-tracking-card">
      <div className="health-card-heading">
        <div className="health-card-icon"><Pill size={18} /></div>
        <div><b>İlaç Takibi & Sağlık</b><span>Öğrencinin günlük ilaç ve sağlık takibi</span></div>
        {hasMedication && <span className={`health-status ${status === 'given' ? 'health-status-given' : 'health-status-pending'}`}>{status === 'given' ? 'Verildi' : 'Bekliyor'}</span>}
      </div>
      <div className="health-choice-row">
        <button className={`health-choice health-choice-red ${hasMedication ? 'selected' : ''}`} onClick={() => { setHasMedication(true); save(status, true); }}><Pill size={15} /> İlaç Kullanımı Var</button>
        <button className={`health-choice ${!hasMedication ? 'selected' : ''}`} onClick={() => { setHasMedication(false); save('pending', false); }}><Check size={15} /> İlaç Yok / Bildirilmedi</button>
      </div>
      {hasMedication && (
        <>
          <label className="health-field">İlaç Adı<input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => save()} placeholder="Örn: Calpol Şurup, Zaditen Damla" /></label>
          <div className="health-field-grid">
            <label className="health-field">Doz / Miktar<input value={dose} onChange={(e) => setDose(e.target.value)} onBlur={() => save()} placeholder="Örn: 1 ölçek (5 ml)" /></label>
            <label className="health-field">Planlanan Saat<input type="time" value={plannedTime} onChange={(e) => { setPlannedTime(e.target.value); save(); }} /></label>
          </div>
          <div className="health-field-label">Uygulama Durumu:</div>
          <div className="health-choice-row">
            <button className={`health-choice health-choice-green ${status === 'given' ? 'selected' : ''}`} onClick={() => { setStatus('given'); setAdministeredAt(administeredAt || new Date().toTimeString().slice(0, 5)); save('given'); }}><Check size={15} /> Verildi</button>
            <button className={`health-choice ${status !== 'given' ? 'selected' : ''}`} onClick={() => { setStatus('pending'); save('pending'); }}><Clock3 size={15} /> Verilmedi / Bekliyor</button>
          </div>
          {status === 'given' && <label className="health-field health-field-success">Veriliş Saati<input type="time" value={administeredAt} onChange={(e) => { setAdministeredAt(e.target.value); save('given'); }} /></label>}
          <label className="health-field">Öğretmen Açıklaması & Ateş Takibi<input value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => save()} placeholder="Örn: Tok karnına verildi. Ateşi 36.6°C." /></label>
        </>
      )}
    </div>
  );
}

function TeacherMessages() {
  const { session } = useAuth();
  const [parents, setParents] = useState<any[]>([]);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [pEmail, setPEmail] = useState('');
  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pPass, setPPass] = useState('');
  const [pError, setPError] = useState('');
  const [pCreating, setPCreating] = useState(false);

  useEffect(() => {
    fetchProfilesByRole('parent').then(setParents);
  }, []);

  async function createParent() {
    setPError('');
    setPCreating(true);
    if (!supabase) return;
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { setPCreating(false); return; }
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: pEmail, fullName: pName, phone: pPhone, tempPassword: pPass }),
    });
    setPCreating(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setPError(d.error || 'Veli oluşturulamadı');
      return;
    }
    fetchProfilesByRole('parent').then(setParents);
    setShowAdd(false);
    setPEmail(''); setPName(''); setPPhone(''); setPPass('');
  }

  useEffect(() => {
    if (!selectedParent || !supabase) return;
    const sb = supabase;
    const load = async () => {
      const { data: session } = await sb.auth.getSession();
      const myId = session.session?.user?.id;
      if (!myId) return;
      const { data } = await sb
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${myId},recipient_id.eq.${selectedParent}),and(sender_id.eq.${selectedParent},recipient_id.eq.${myId})`)
        .order('created_at', { ascending: true });
      setMessages(data ?? []);
    };
    load();
  }, [selectedParent]);

  async function send() {
    if (!text || !selectedParent) return;
    await sendMessage(selectedParent, text);
    setText('');
    if (supabase) {
      const sb = supabase;
      const { data: session } = await sb.auth.getSession();
      const myId = session.session?.user?.id;
      if (myId) {
        const { data } = await sb
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${myId},recipient_id.eq.${selectedParent}),and(sender_id.eq.${selectedParent},recipient_id.eq.${myId})`)
          .order('created_at', { ascending: true });
        setMessages(data ?? []);
      }
    }
  }

  return (
    <>
      <PageHeading eyebrow="MESAJLAR" title="Veli Mesajları" subtitle="Sınıfınızın velileriyle iletişim kurun." action={<button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={18} /> Veli ekle</button>} />
      <div className="messages-layout">
        <section className="panel conversation-list">
          <div className="message-tabs"><button className="active">Veliler</button></div>
          {parents.map((p) => (
            <div key={p.id} className={`conversation ${selectedParent === p.id ? 'selected' : ''}`} onClick={() => setSelectedParent(p.id)}>
              <div className={`avatar avatar-${avatarColor(p.full_name)}`}>{getInitials(p.full_name)}</div>
              <div><b>{p.full_name}</b><span>{p.email}</span></div>
            </div>
          ))}
          {parents.length === 0 && <p className="empty-text">Kayıtlı veli yok.</p>}
        </section>
        <section className="panel conversation-detail">
          {selectedParent ? (
            <>
              <div className="conversation-detail-header">
                <div className={`avatar avatar-${avatarColor(parents.find((p) => p.id === selectedParent)?.full_name ?? '')}`}>
                  {getInitials(parents.find((p) => p.id === selectedParent)?.full_name ?? '')}
                </div>
                <div><b>{parents.find((p) => p.id === selectedParent)?.full_name}</b><span>Veli</span></div>
              </div>
              <div className="chat-area">
                {messages.map((m) => {
                  const isMe = m.sender_id === session?.user.id;
                  return (
                    <div key={m.id} className={`message-bubble ${isMe ? 'outgoing' : 'incoming'}`}>
                      <p>{m.body}</p>
                      <span>{new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })}
                {messages.length === 0 && <p className="empty-text">Mesaj yok. İlk mesajı gönderin.</p>}
              </div>
              <div className="message-compose">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mesajınızı yazın…" onKeyDown={(e) => e.key === 'Enter' && send()} />
                <button onClick={send} aria-label="Gönder"><Send size={18} /></button>
              </div>
            </>
          ) : (
            <p className="empty-text">Mesajlaşmak için veli seçin.</p>
          )}
        </section>
      </div>
      {showAdd && (
        <Modal title="Yeni Veli Oluştur" onClose={() => setShowAdd(false)}>
          <div className="modal-form">
            <label>Ad Soyad<input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Veli adı soyadı" /></label>
            <label>E-posta<input type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} placeholder="ornek@email.com" /></label>
            <label>Telefon<input value={pPhone} onChange={(e) => setPPhone(e.target.value)} placeholder="05XX XXX XX XX" /></label>
            <label>Geçici Şifre<input value={pPass} onChange={(e) => setPPass(e.target.value)} placeholder="Geçici şifre" /></label>
            {pError && <div className="auth-message">{pError}</div>}
            <button className="primary-button" onClick={createParent} disabled={pCreating}><Plus size={18} /> {pCreating ? 'Oluşturuluyor…' : 'Veliyi Oluştur'}</button>
            <p className="modal-hint">Veliye e-posta ve şifreyi verin. İlk girişte şifresini değiştirmek zorunda kalacak.</p>
          </div>
        </Modal>
      )}
    </>
  );
}

function TeacherCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    if (!supabase) return;
    supabase.from('calendar_events').select('*').order('event_date').then(({ data }) => setEvents(data ?? []));
  }, []);
  const typeLabels: Record<string, string> = { event: 'Etkinlik', holiday: 'Tatil', meeting: 'Toplantı', trip: 'Gezi', birthday: 'Doğum Günü' };
  return (
    <>
      <PageHeading eyebrow="TAKVİM" title="Okul Takvimi" subtitle="Yaklaşan etkinlikler ve özel günler." />
      <section className="panel">
        {events.map((e) => (
          <div className="calendar-row" key={e.id}>
            <div className="calendar-date"><b>{new Date(e.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</b></div>
            <div><b>{e.title}</b><span>{typeLabels[e.event_type] || e.event_type}</span></div>
          </div>
        ))}
        {events.length === 0 && <p className="empty-text">Henüz takvim olayı yok.</p>}
      </section>
    </>
  );
}
