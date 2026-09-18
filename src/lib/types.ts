export type Role = 'manager' | 'teacher' | 'parent';

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  must_change_password: boolean;
  created_at: string;
};

export type SchoolClass = {
  id: string;
  name: string;
  age_group: string;
  teacher_id: string | null;
  created_at: string;
};

export type Student = {
  id: string;
  class_id: string | null;
  full_name: string;
  birth_date: string | null;
  photo_url: string | null;
  allergy_info: string | null;
  special_notes: string | null;
  is_active: boolean;
  created_at: string;
};

export type DailyReport = {
  id: string;
  student_id: string;
  report_date: string;
  breakfast: string | null;
  lunch: string | null;
  snack: string | null;
  meal_note: string | null;
  slept: boolean | null;
  sleep_start: string | null;
  sleep_end: string | null;
  toilet_status: string | null;
  toilet_note: string | null;
  daily_note: string | null;
  mood: string | null;
  water_status: string | null;
  attendance_status: string | null;
  created_by: string;
  created_at: string;
};

export type Attendance = {
  id: string;
  student_id: string;
  class_id: string | null;
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  note: string | null;
  recorded_by: string;
  created_at: string;
};

export type Activity = {
  id: string;
  class_id: string | null;
  title: string;
  description: string | null;
  activity_date: string;
  created_by: string;
  created_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  published_at: string;
  created_by: string;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  student_id: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  profile_id: string;
  title: string;
  body: string;
  type: string;
  read_at: string | null;
  created_at: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  event_type: string;
  created_at: string;
};

export type WeeklyMenu = {
  id: string;
  week_start: string;
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
};

export type HealthInfo = {
  id: string;
  student_id: string;
  allergies: string | null;
  medications: string | null;
  blood_type: string | null;
  doctor_note: string | null;
  emergency_contact: string | null;
  updated_at: string;
};

export type ParentRecord = {
  profile_id: string;
  student_id: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  relation: string | null;
  phone: string | null;
  tc_identity_last4: string | null;
  created_at: string;
};

export type TeacherRecord = {
  profile_id: string;
  employee_code: string | null;
  created_at: string;
};

export type Photo = {
  id: string;
  activity_id: string | null;
  storage_path: string;
  captured_at: string;
};
