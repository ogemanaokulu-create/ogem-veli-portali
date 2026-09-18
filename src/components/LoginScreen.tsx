import { FormEvent, useState } from 'react';
import { Baby, ChevronRight, ShieldCheck, Sparkles, SunMedium } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (mode === 'signup') {
      const { error } = await signUp(email, password, fullName, phone);
      if (error) setError(error);
      else {
        setSuccess('Hesabınız oluşturuldu. Yönetici onayından sonra giriş yapabilirsiniz.');
        setMode('login');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark brand-mark-large"><img src="/Yeni_Proje.png" alt="OGEM" className="brand-logo-large" /></div>
          <div>
            <strong>OGEM</strong>
            <span>Anaokulu</span>
          </div>
        </div>
        <div className="login-intro">
          <span className="eyebrow"><ShieldCheck size={14} /> Güvenli okul iletişimi</span>
          <h1>OGEM ANAOKULU</h1>
          <p className="login-subtitle">Veli Bilgilendirme ve Öğrenci Takip Sistemi</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <>
              <label>Ad Soyad
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adınız ve soyadınız" />
              </label>
              <label>Telefon
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX" />
              </label>
            </>
          )}
          <label>E-posta
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" />
          </label>
          <label>Şifre
            <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {error && <div className="auth-message">{error}</div>}
          {success && <div className="auth-message success">{success}</div>}
          <button className="primary-button auth-submit" disabled={loading}>
            {loading ? 'Kontrol ediliyor…' : mode === 'login' ? 'Giriş Yap' : 'Veli Hesabı Oluştur'}
            <ChevronRight size={18} />
          </button>
        </form>
        {mode === 'login' && (
          <button className="forgot-password" type="button">Şifremi unuttum</button>
        )}
        <div className="auth-switch">
          {mode === 'login' ? (
            <>Hesabınız yok mu? <button onClick={() => setMode('signup')}>Veli kaydı oluşturun</button></>
          ) : (
            <>Zaten hesabınız var mı? <button onClick={() => setMode('login')}>Giriş yapın</button></>
          )}
        </div>
        <div className="login-footer">
          <span className="lock-icon"><ShieldCheck size={15} /></span>
          <span>Bilgileriniz OGEM güvenlik standartlarıyla korunur.</span>
        </div>
      </div>
      <div className="login-visual">
        <div className="visual-copy">
          <span className="eyebrow eyebrow-light"><Sparkles size={14} /> Minik adımlar, büyük hikâyeler</span>
          <h2>Çocuğunuzun gününden<br /><em>size kalan güzel anlar.</em></h2>
          <p>Yemek, uyku, etkinlik ve gelişim notlarını tek bir yerde takip edin.</p>
        </div>
        <div className="visual-stat">
          <div className="stat-icon"><SunMedium size={20} /></div>
          <div>
            <b>Bugün çok güzel geçti</b>
            <span>4 Yaş A sınıfı • 09:42</span>
          </div>
        </div>
      </div>
    </div>
  );
}
