import { supabase } from './supabase';

export async function fetchClasses() {
  if (!supabase) return [];
  const { data } = await supabase.from('classes').select('*').order('name');
  return data ?? [];
}

export async function fetchStudents(classId?: string) {
  if (!supabase) return [];
  let q = supabase.from('students').select('*').eq('is_active', true).order('full_name');
  if (classId) q = q.eq('class_id', classId);
  const { data } = await q;
  return data ?? [];
}

export async function fetchAllStudents() {
  if (!supabase) return [];
  const { data } = await supabase.from('students').select('*').order('full_name');
  return data ?? [];
}

export async function fetchDailyReport(studentId: string, date: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('student_id', studentId)
    .eq('report_date', date)
    .maybeSingle();
  return data;
}

export async function upsertDailyReport(report: Record<string, unknown>) {
  if (!supabase) return null;
  const { data } = await supabase.from('daily_reports').upsert(report).select().maybeSingle();
  return data;
}

export async function fetchAttendance(studentId: string, date: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .eq('attendance_date', date)
    .maybeSingle();
  return data;
}

export async function upsertAttendance(record: Record<string, unknown>) {
  if (!supabase) return null;
  const { data } = await supabase.from('attendance').upsert(record, { onConflict: 'student_id,attendance_date' }).select().maybeSingle();
  return data;
}

export async function fetchActivities(classId?: string) {
  if (!supabase) return [];
  let q = supabase.from('activities').select('*, photos(*)').order('activity_date', { ascending: false }).limit(30);
  if (classId) q = q.eq('class_id', classId);
  const { data } = await q;
  return data ?? [];
}

export async function fetchAnnouncements() {
  if (!supabase) return [];
  const { data } = await supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('published_at', { ascending: false }).limit(50);
  return data ?? [];
}

export async function fetchMessages(otherUserId: string) {
  if (!supabase) return [];
  const { data: session } = await supabase.auth.getSession();
  const myId = session.session?.user?.id;
  if (!myId) return [];
  const { data } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${myId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${myId})`)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function fetchNotifications() {
  if (!supabase) return [];
  const { data: session } = await supabase.auth.getSession();
  const myId = session.session?.user?.id;
  if (!myId) return [];
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', myId)
    .order('created_at', { ascending: false })
    .limit(30);
  return data ?? [];
}

export async function fetchCalendarEvents() {
  if (!supabase) return [];
  const { data } = await supabase.from('calendar_events').select('*').order('event_date').limit(50);
  return data ?? [];
}

export async function fetchWeeklyMenu(weekStart: string) {
  if (!supabase) return null;
  const { data } = await supabase.from('weekly_menus').select('*').eq('week_start', weekStart).maybeSingle();
  return data;
}

export async function fetchHealthInfo(studentId: string) {
  if (!supabase) return null;
  const { data } = await supabase.from('health_info').select('*').eq('student_id', studentId).maybeSingle();
  return data;
}

export async function fetchMedicationLog(studentId: string, date: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('student_id', studentId)
    .eq('tracking_date', date)
    .maybeSingle();
  return data;
}

export async function upsertMedicationLog(log: Record<string, unknown>) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('medication_logs')
    .upsert(log, { onConflict: 'student_id,tracking_date' })
    .select()
    .maybeSingle();
  return data;
}

export async function fetchSchoolSettings() {
  if (!supabase) return null;
  const { data } = await supabase.from('school_settings').select('*').eq('id', 1).maybeSingle();
  return data;
}

export async function updateSchoolSettings(settings: Record<string, unknown>) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('school_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .maybeSingle();
  return data;
}

export async function fetchParents() {
  if (!supabase) return [];
  const { data } = await supabase.from('parents').select('*, profiles(*)').order('created_at', { ascending: false });
  return data ?? [];
}

export async function fetchTeachers() {
  if (!supabase) return [];
  const { data } = await supabase.from('teachers').select('*, profiles(*)').order('created_at');
  return data ?? [];
}

export async function fetchProfilesByRole(role: string) {
  if (!supabase) return [];
  const { data } = await supabase.from('profiles').select('*').eq('role', role).order('full_name');
  return data ?? [];
}

export async function sendMessage(recipientId: string, body: string, studentId?: string) {
  if (!supabase) return null;
  const { data: session } = await supabase.auth.getSession();
  const myId = session.session?.user?.id;
  if (!myId) return null;
  const { data } = await supabase.from('messages').insert({
    sender_id: myId,
    recipient_id: recipientId,
    body,
    student_id: studentId || null,
  }).select().maybeSingle();
  return data;
}

export async function markMessageRead(messageId: string) {
  if (!supabase) return;
  await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', messageId);
}

export async function markNotificationRead(id: string) {
  if (!supabase) return;
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
}

export async function uploadFile(bucket: string, path: string, file: File) {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) return null;
  return data;
}

export function getPublicUrl(bucket: string, path: string): string {
  if (!supabase) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function avatarColor(name: string): string {
  const colors = ['coral', 'sky', 'mint', 'yellow', 'lavender'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function calcSleepDuration(start: string, end: string): string {
  if (!start || !end) return '-';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} dk`;
  return `${h} sa ${m} dk`;
}

export const mealOptions = ['Tam Yedi', 'Yarısını Yedi', 'Az Yedi', 'Yemedi'];
export const moodOptions = [
  { value: 'Cok Mutlu', emoji: '😊', label: 'Çok Mutlu' },
  { value: 'Mutlu', emoji: '🙂', label: 'Mutlu' },
  { value: 'Sakin', emoji: '😌', label: 'Sakin' },
  { value: 'Uzgun', emoji: '😔', label: 'Üzgün' },
  { value: 'Yorgun', emoji: '😴', label: 'Yorgun' },
];
export const waterOptions = ['Cok Iyi', 'Orta', 'Az'];
export const toiletOptions = ['Tuvalete Gitti', 'Yardımla Gitti', 'Alt Değişimi Yapıldı', 'Sorun Yaşandı'];
export const attendanceOptions = [
  { value: 'present', label: 'Geldi' },
  { value: 'late', label: 'Geç Geldi' },
  { value: 'absent', label: 'Gelmedi' },
  { value: 'leave', label: 'İzinli' },
];
