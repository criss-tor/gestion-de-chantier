import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeContext } from '@/contexts/EmployeeContext';

const LOGIN_ATTEMPTS_KEY = 'gc_loginAttempts';
const BLOCKED_UNTIL_KEY = 'gc_loginBlockedUntil';
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export default function Login() {
  const { employees, setCurrentEmployee } = useEmployeeContext();
  const [prenom, setPrenom] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(() => Number(window.localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0'));
  const [blockedUntil, setBlockedUntil] = useState(() => Number(window.localStorage.getItem(BLOCKED_UNTIL_KEY) || '0'));
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (blockedUntil && now >= blockedUntil) {
      setBlockedUntil(0);
      setAttempts(0);
      window.localStorage.removeItem(BLOCKED_UNTIL_KEY);
      window.localStorage.setItem(LOGIN_ATTEMPTS_KEY, '0');
      setError('Le blocage est levé, vous pouvez réessayer.');
    }
  }, [blockedUntil, now]);

  const remainingTime = blockedUntil > now ? blockedUntil - now : 0;
  const remainingSeconds = Math.ceil(remainingTime / 1000);
  const isBlocked = remainingTime > 0;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) {
      return;
    }

    const user = employees.find(
      (emp) => emp.prenom.toLowerCase() === prenom.trim().toLowerCase() && emp.pin === pin
    );

    if (user) {
      setCurrentEmployee(user.id);
      setAttempts(0);
      window.localStorage.setItem(LOGIN_ATTEMPTS_KEY, '0');
      setError('');
      if (user.role === 'admin') {
        navigate('/');
      } else {
        navigate('/heures');
      }
      return;
    }

    const nextAttempts = attempts + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      const blockTime = Date.now() + BLOCK_DURATION_MS;
      setBlockedUntil(blockTime);
      setAttempts(0);
      window.localStorage.setItem(BLOCKED_UNTIL_KEY, blockTime.toString());
      window.localStorage.setItem(LOGIN_ATTEMPTS_KEY, '0');
      setError(`Trop de tentatives. Réessaye dans ${Math.ceil(BLOCK_DURATION_MS / 60000)} minutes.`);
    } else {
      setAttempts(nextAttempts);
      window.localStorage.setItem(LOGIN_ATTEMPTS_KEY, nextAttempts.toString());
      setError(`Identifiants incorrects. Il vous reste ${MAX_ATTEMPTS - nextAttempts} tentative(s).`);
    }
  };

  return (
    <div style={{ maxWidth: 340, margin: '80px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #e0e3e8', padding: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Connexion</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Prénom"
            value={prenom}
            onChange={e => setPrenom(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 7, border: '1px solid #e0e3e8', fontSize: 16 }}
            autoFocus
            disabled={isBlocked}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Code PIN (4 chiffres)"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            style={{ width: '100%', padding: 10, borderRadius: 7, border: '1px solid #e0e3e8', fontSize: 16, letterSpacing: 4 }}
            maxLength={4}
            disabled={isBlocked}
          />
        </div>
        {error && <div style={{ color: '#e11d48', marginBottom: 12 }}>{error}</div>}
        {isBlocked && (
          <div style={{ color: '#7c3aed', marginBottom: 12 }}>
            Blocage actif pendant encore {remainingSeconds} seconde(s).
          </div>
        )}
        <button
          type="submit"
          style={{ width: '100%', background: isBlocked ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 600, fontSize: 17, cursor: isBlocked ? 'not-allowed' : 'pointer' }}
          disabled={isBlocked}
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}
