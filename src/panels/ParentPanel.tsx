import { useEffect, useState } from 'react';
import {
  Bell, CalendarDays, ChevronRight, Home, ImagePlus,
  MessageCircle, Moon, Send, Utensils, Users,
  Droplet, Smile, ClipboardCheck, Heart, FileText, X,
} from 'lucide-react';
import { Shell, NavItem } from '@/components/Shell';
import { PageHeading, Panel, Modal } from '@/components/Shared';
import {
  fetchDailyReport, fetchAnnouncements, fetchActivities, fetchWeeklyMenu,
  fetchCalendarEvents, fetchHealthInfo, getPublicUrl, todayStr, calcSleepDuration,
  getInitials, avatarColor, moodOptions,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Page = 'home' | 'daily' | 'gallery' | 'menu' | 'calendar' | 'messages' | 'profile';

const navItems: NavItem[] = [
  { id: 'home', label: 'Ana Sayfa', icon: Home },
  { id: 'daily', label: 'Günlük Takip', icon: ClipboardCheck },
  { id: 'gallery', label: 'Galeri', icon: ImagePlus },
  { id: 'menu', label: 'Yemek Menüsü', icon: Utensils },
  { id: 'calendar', label: 'Takvim', icon: CalendarDays },
  { id: 'messages', label: 'Mesajlar', icon: MessageCircle },
  { id: 'profile', label: 'Profil', icon: Users },
];

const bottomNav: NavItem[] = [
  { id: 'home', label: 'Ana Sayfa', icon: Home },
  { id: 'daily', label: 'Takip', icon: ClipboardCheck },
  { id: 'gallery', label: 'Galeri', icon: ImagePlus },
  { id: 'messages', label: 'Mesaj', icon: MessageCircle },
  { id: 'profile', label: 'Profil', icon: Users },
];

export function ParentPanel() {
  const [page, setPage] = useState<Page>('home');
  return (
    <Shell navItems={navItems} activePage={page} onPageChange={(p) => setPage(p as Page)} bottomNav={bottomNav}>
      {page === 'home' && <ParentHome onNavigate={setPage} />}
      {page === 'daily' && <ParentDaily />}
      {page === 'gallery' && <ParentGallery />}
      {page === 'menu' && <ParentMenu />}
      {page === 'calendar' && <ParentCalendar />}
      {page === 'messages' && <ParentMessages />}
      {page === 'profile' && <ParentProfile />}
    </Shell>
  );
}

function useMyStudent() {
  const { session } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase || !session) return;
    const sb = supabase;
    sb.from('parents').select('student_id').eq('profile_id', session.user.id).eq('approval_status', 'approved').maybeSingle().then(({ data }) => {
      if (data?.student_id) {
        sb.from('students').select('*, classes(*)').eq('id', data.student_id).maybeSingle().then(({ data: s }) => {
          setStudent(s);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [session]);
  return { student, loading };
}

function ParentHome({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { student, loading } = useMyStudent();
  const [report, setReport] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (student) {
      fetchDailyReport(student.id, todayStr()).then(setReport);
      fetchAnnouncements().then(setAnnouncements);
      fetchActivities(student.class_id).then(setActivities);
    }
  }, [student]);

  if (loading) return <div className="loading-state"><div className="spinner" /><span>Yükleniyor…</span></div>;
  if (!student) return <PageHeading eyebrow="VELİ PANELİ" title="Hoş geldiniz" subtitle="Çocuğunuz henüz sistemle eşleştirilmemiş. Lütfen okul yönetimiyle iletişime geçin." />;

  const mood = moodOptions.find((m) => m.value === report?.mood);

  return (
    <>
      <PageHeading eyebrow="VELİ PANELİ" title={`Merhaba, ${student.full_name.split(' ')[0]}`} subtitle={`${student.classes?.name ?? ''} • ${todayStr()}`} />
      <div className="parent-cards">
        <div className="parent-card parent-card-mint">
          <div className="parent-card-icon"><Utensils size={22} /></div>
          <b>Yemek Durumu</b>
          {report ? (
            <div className="meal-summary">
              <span>Kahvaltı: <b>{report.breakfast || '-'}</b></span>
              <span>Öğle: <b>{report.lunch || '-'}</b></span>
              <span>İkindi: <b>{report.snack || '-'}</b></span>
            </div>
          ) : <p className="muted">Bugün kayıt girilmedi</p>}
        </div>
        <div className="parent-card parent-card-sky">
          <div className="parent-card-icon"><Moon size={22} /></div>
          <b>Uyku Durumu</b>
          {report?.slept ? (
            <div className="meal-summary">
              <span>Başlangıç: <b>{report.sleep_start || '-'}</b></span>
              <span>Bitiş: <b>{report.sleep_end || '-'}</b></span>
              <span>Süre: <b>{calcSleepDuration(report.sleep_start, report.sleep_end)}</b></span>
            </div>
          ) : <p className="muted">{report ? 'Uyumadı' : 'Bugün kayıt girilmedi'}</p>}
        </div>
        <div className="parent-card parent-card-yellow">
          <div className="parent-card-icon"><Smile size={22} /></div>
          <b>Ruh Hali</b>
          {mood ? <span className="mood-display">{mood.emoji} {mood.label}</span> : <p className="muted">Belirtilmedi</p>}
        </div>
        <div className="parent-card parent-card-coral">
          <div className="parent-card-icon"><Droplet size={22} /></div>
          <b>Su İçme</b>
          {report?.water_status ? <span>{report.water_status === 'Cok Iyi' ? 'Çok İyi' : report.water_status}</span> : <p className="muted">Belirtilmedi</p>}
        </div>
      </div>
      {report?.daily_note && (
        <Panel title="Günün Notu">
          <p className="daily-note-display">{report.daily_note}</p>
        </Panel>
      )}
      <Panel title="Son Duyurular" action="Tümü" onAction={() => onNavigate('calendar')}>
        {announcements.slice(0, 3).map((a) => (
          <div className="announcement-row" key={a.id}>
            <div className={`announcement-icon ${a.is_pinned ? 'announcement-icon-coral' : 'announcement-icon-mint'}`}><Bell size={17} /></div>
            <div><b>{a.title}</b><span>{a.body}</span></div>
            {a.is_pinned && <span className="pinned-label">SABİT</span>}
          </div>
        ))}
        {announcements.length === 0 && <p className="empty-text">Duyuru yok.</p>}
      </Panel>
      <Panel title="Son Etkinlikler" action="Galeri" onAction={() => onNavigate('gallery')}>
        {activities.slice(0, 3).map((a) => (
          <div className="small-activity" key={a.id}>
            <div className="small-activity-icon small-activity-sky"><ImagePlus size={18} /></div>
            <div><b>{a.title}</b><span>{new Date(a.activity_date).toLocaleDateString('tr-TR')}</span></div>
            <ChevronRight size={16} />
          </div>
        ))}
        {activities.length === 0 && <p className="empty-text">Etkinlik yok.</p>}
      </Panel>
    </>
  );
}

function ParentDaily() {
  const { student, loading } = useMyStudent();
  const [report, setReport] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());

  useEffect(() => {
    if (student) fetchDailyReport(student.id, selectedDate).then(setReport);
  }, [student, selectedDate]);

  if (loading) return <div className="loading-state"><div className="spinner" /><span>Yükleniyor…</span></div>;
  if (!student) return <PageHeading eyebrow="VELİ PANELİ" title="Günlük Takip" subtitle="Çocuğunuz eşleştirilmemiş." />;

  const mood = moodOptions.find((m) => m.value === report?.mood);

  return (
    <>
      <PageHeading eyebrow="GÜNLÜK TAKİP" title={student.full_name} subtitle="Günlük kayıtları takvimden görüntüleyin." />
      <section className="panel">
        <label className="date-label">Tarih<input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></label>
      </section>
      {report ? (
        <>
          <div className="parent-cards">
            <div className="parent-card parent-card-mint">
              <div className="parent-card-icon"><Utensils size={22} /></div>
              <b>Yemek</b>
              <div className="meal-summary">
                <span>Kahvaltı: <b>{report.breakfast || '-'}</b></span>
                <span>Öğle: <b>{report.lunch || '-'}</b></span>
                <span>İkindi: <b>{report.snack || '-'}</b></span>
              </div>
              {report.meal_note && <p className="muted">{report.meal_note}</p>}
            </div>
            <div className="parent-card parent-card-sky">
              <div className="parent-card-icon"><Moon size={22} /></div>
              <b>Uyku</b>
              {report.slept ? (
                <div className="meal-summary">
                  <span>Başlangıç: <b>{report.sleep_start || '-'}</b></span>
                  <span>Bitiş: <b>{report.sleep_end || '-'}</b></span>
                  <span>Süre: <b>{calcSleepDuration(report.sleep_start, report.sleep_end)}</b></span>
                </div>
              ) : <p className="muted">Uyumadı</p>}
            </div>
            <div className="parent-card parent-card-yellow">
              <div className="parent-card-icon"><Smile size={22} /></div>
              <b>Ruh Hali</b>
              {mood ? <span className="mood-display">{mood.emoji} {mood.label}</span> : <p className="muted">Belirtilmedi</p>}
            </div>
            <div className="parent-card parent-card-coral">
              <div className="parent-card-icon"><Droplet size={22} /></div>
              <b>Su İçme</b>
              {report.water_status ? <span>{report.water_status === 'Cok Iyi' ? 'Çok İyi' : report.water_status}</span> : <p className="muted">Belirtilmedi</p>}
            </div>
          </div>
          {report.toilet_status && (
            <Panel title="Tuvalet Durumu">
              <p><b>{report.toilet_status}</b></p>
              {report.toilet_note && <p className="muted">{report.toilet_note}</p>}
            </Panel>
          )}
          {report.daily_note && (
            <Panel title="Günün Notu">
              <p className="daily-note-display">{report.daily_note}</p>
            </Panel>
          )}
        </>
      ) : (
        <section className="panel"><p className="empty-text">Bu tarih için kayıt bulunamadı.</p></section>
      )}
    </>
  );
}

function ParentGallery() {
  const { session } = useAuth();
  const { student, loading } = useMyStudent();
  const [activities, setActivities] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (student) fetchActivities(student.class_id).then(setActivities);
  }, [student]);

  async function share() {
    if (!supabase || !title || !student?.class_id) return;
    setSharing(true);
    const { data: activity } = await supabase.from('activities').insert({
      class_id: student.class_id, title, description: desc, activity_date: todayStr(),
      created_by: session?.user.id,
    }).select().maybeSingle();
    if (activity && files.length > 0) {
      for (const file of files) {
        const path = `${student.class_id}/${activity.id}/${Date.now()}-${file.name}`;
        const uploaded = await supabase.storage.from('school-media').upload(path, file, { upsert: true });
        if (!uploaded.error) {
          await supabase.from('photos').insert({ activity_id: activity.id, storage_path: path });
        }
      }
    }
    fetchActivities(student.class_id).then(setActivities);
    setTitle(''); setDesc(''); setFiles([]);
    setSharing(false);
  }

  if (loading) return <div className="loading-state"><div className="spinner" /><span>Yükleniyor…</span></div>;
  if (!student) return <PageHeading eyebrow="GALERİ" title="Fotoğraf Galerisi" subtitle="Çocuğunuz eşleştirilmemiş." />;

  return (
    <>
      <PageHeading eyebrow="GALERİ" title="Etkinlik Galerisi" subtitle="Çocuğunuzun sınıfından fotoğrafları görün ve paylaşın." />
      <section className="panel">
        <div className="gallery-share-form">
          <div className="gallery-form-row">
            <label>Etkinlik Başlığı<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Boyama Etkinliği" /></label>
            <label>Açıklama<input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Kısa açıklama (opsiyonel)" /></label>
          </div>
          <div className="gallery-form-row">
            <label className="file-upload-label">Fotoğraf Ekle<input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></label>
            <button className="primary-button" onClick={share} disabled={sharing || !title}><ImagePlus size={18} /> {sharing ? 'Paylaşılıyor…' : 'Paylaş'}</button>
          </div>
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
        {activities.length === 0 && <p className="empty-text">Henüz fotoğraf yok. İlk etkinliği paylaşın!</p>}
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

const parentMealSlots = ['breakfast', 'lunch', 'snack'] as const;
const parentMealLabels: Record<string, string> = { breakfast: 'Sabah Kahvaltısı', lunch: 'Öğle Yemeği', snack: 'İkindi Kahvaltısı' };

function ParentMenu() {
  const [weekStart, setWeekStart] = useState(todayStr());
  const [menu, setMenu] = useState<any>(null);
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayLabels = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

  useEffect(() => {
    fetchWeeklyMenu(weekStart).then(setMenu);
  }, [weekStart]);

  return (
    <>
      <PageHeading eyebrow="YEMEK MENÜSÜ" title="Haftalık Menü" subtitle="Okulun günlük yemek listesi." />
      <section className="panel">
        <label className="date-label">Hafta<input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} /></label>
        <div className="menu-days-3meal">
          {days.map((d, i) => (
            <div className="menu-day-3meal" key={d}>
              <b className="menu-day-title">{dayLabels[i]}</b>
              {parentMealSlots.map((m) => (
                <div className="menu-meal-display" key={`${d}_${m}`}>
                  <span className="menu-meal-name">{parentMealLabels[m]}</span>
                  <p>{menu?.[`${d}_${m}`] || 'Menü girilmemiş'}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ParentCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  useEffect(() => {
    fetchCalendarEvents().then(setEvents);
    fetchAnnouncements().then(setAnnouncements);
  }, []);
  const typeLabels: Record<string, string> = { event: 'Etkinlik', holiday: 'Tatil', meeting: 'Toplantı', trip: 'Gezi', birthday: 'Doğum Günü' };

  return (
    <>
      <PageHeading eyebrow="TAKVİM" title="Okul Takvimi ve Duyurular" subtitle="Yaklaşan etkinlikler ve duyurular." />
      <Panel title="Duyurular">
        {announcements.map((a) => (
          <div className="announcement-row" key={a.id}>
            <div className={`announcement-icon ${a.is_pinned ? 'announcement-icon-coral' : 'announcement-icon-mint'}`}><Bell size={17} /></div>
            <div><b>{a.title}</b><span>{a.body}</span></div>
            {a.is_pinned && <span className="pinned-label">SABİT</span>}
          </div>
        ))}
        {announcements.length === 0 && <p className="empty-text">Duyuru yok.</p>}
      </Panel>
      <Panel title="Takvim Olayları">
        {events.map((e) => (
          <div className="calendar-row" key={e.id}>
            <div className="calendar-date"><b>{new Date(e.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</b></div>
            <div><b>{e.title}</b><span>{typeLabels[e.event_type] || e.event_type}</span></div>
          </div>
        ))}
        {events.length === 0 && <p className="empty-text">Takvim olayı yok.</p>}
      </Panel>
    </>
  );
}

function ParentMessages() {
  const { session } = useAuth();
  const { student } = useMyStudent();
  const [teacher, setTeacher] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!student?.class_id || !supabase) return;
    const sb = supabase;
    sb.from('classes').select('teacher_id').eq('id', student.class_id).maybeSingle().then(({ data: cls }) => {
      if (cls?.teacher_id) {
        sb.from('profiles').select('*').eq('id', cls.teacher_id).maybeSingle().then(({ data: t }) => setTeacher(t));
      }
    });
  }, [student]);

  useEffect(() => {
    if (!teacher || !supabase || !session) return;
    const sb = supabase;
    const load = async () => {
      const { data } = await sb
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session.user.id},recipient_id.eq.${teacher.id}),and(sender_id.eq.${teacher.id},recipient_id.eq.${session.user.id}))`)
        .order('created_at', { ascending: true });
      setMessages(data ?? []);
    };
    load();
  }, [teacher, session]);

  async function send() {
    if (!text || !teacher || !supabase || !session) return;
    const sb = supabase;
    await sb.from('messages').insert({ sender_id: session.user.id, recipient_id: teacher.id, body: text });
    setText('');
    const { data } = await sb
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${session.user.id},recipient_id.eq.${teacher.id}),and(sender_id.eq.${teacher.id},recipient_id.eq.${session.user.id}))`)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
  }

  return (
    <>
      <PageHeading eyebrow="MESAJLAR" title="Öğretmeninizle Mesajlaşma" subtitle="WhatsApp benzeri güvenli iletişim." />
      <div className="messages-layout">
        <section className="panel conversation-list">
          {teacher ? (
            <div className="conversation selected">
              <div className={`avatar avatar-${avatarColor(teacher.full_name)}`}>{getInitials(teacher.full_name)}</div>
              <div><b>{teacher.full_name}</b><span>Öğretmen</span></div>
            </div>
          ) : (
            <p className="empty-text">Öğretmen atanmamış.</p>
          )}
        </section>
        <section className="panel conversation-detail">
          {teacher ? (
            <>
              <div className="conversation-detail-header">
                <div className={`avatar avatar-${avatarColor(teacher.full_name)}`}>{getInitials(teacher.full_name)}</div>
                <div><b>{teacher.full_name}</b><span>Öğretmen</span></div>
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
            <p className="empty-text">Öğretmen atanmamış.</p>
          )}
        </section>
      </div>
    </>
  );
}

function ParentProfile() {
  const { student } = useMyStudent();
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    if (student) fetchHealthInfo(student.id).then(setHealth);
  }, [student]);

  if (!student) return <PageHeading eyebrow="PROFİL" title="Çocuk Profili" subtitle="Çocuğunuz eşleştirilmemiş." />;

  const age = student.birth_date ? Math.floor((Date.now() - new Date(student.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

  return (
    <>
      <PageHeading eyebrow="PROFİL" title={student.full_name} subtitle="Öğrenci profil bilgileri." />
      <section className="panel">
        <div className="profile-header">
          <div className={`avatar avatar-large avatar-${avatarColor(student.full_name)}`}>{getInitials(student.full_name)}</div>
          <div>
            <h2>{student.full_name}</h2>
            <span>{student.classes?.name ?? '-'}</span>
            {age !== null && <p>{age} yaşında</p>}
          </div>
        </div>
        <div className="profile-info">
          <div className="profile-row"><FileText size={17} /><span>Doğum Tarihi</span><b>{student.birth_date ? new Date(student.birth_date).toLocaleDateString('tr-TR') : '-'}</b></div>
          <div className="profile-row"><Users size={17} /><span>Sınıf</span><b>{student.classes?.name ?? '-'}</b></div>
          {student.allergy_info && <div className="profile-row"><Heart size={17} /><span>Alerji</span><b>{student.allergy_info}</b></div>}
          {student.special_notes && <div className="profile-row"><FileText size={17} /><span>Özel Notlar</span><b>{student.special_notes}</b></div>}
        </div>
      </section>
      {health && (
        <Panel title="Sağlık Bilgileri">
          <div className="profile-info">
            {health.allergies && <div className="profile-row"><Heart size={17} /><span>Alerjiler</span><b>{health.allergies}</b></div>}
            {health.medications && <div className="profile-row"><FileText size={17} /><span>İlaçlar</span><b>{health.medications}</b></div>}
            {health.blood_type && <div className="profile-row"><Droplet size={17} /><span>Kan Grubu</span><b>{health.blood_type}</b></div>}
            {health.doctor_note && <div className="profile-row"><FileText size={17} /><span>Doktor Notu</span><b>{health.doctor_note}</b></div>}
            {health.emergency_contact && <div className="profile-row"><Bell size={17} /><span>Acil İletişim</span><b>{health.emergency_contact}</b></div>}
          </div>
        </Panel>
      )}
    </>
  );
}
