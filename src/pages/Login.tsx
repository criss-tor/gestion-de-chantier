import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeContext } from '@/contexts/EmployeeContext';

export default function Login() {
  const { employees, setCurrentEmployee } = useEmployeeContext();
  const [prenom, setPrenom] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = employees.find(
      (emp) => emp.prenom.toLowerCase() === prenom.trim().toLowerCase() && emp.pin === pin
    );
    if (user) {
      setCurrentEmployee(user.id);
      if (user.role === 'admin') {
        navigate('/');
      } else {
        navigate('/heures');
      }
    } else {
      setError('Identifiants incorrects');
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
          />
        </div>
        {error && <div style={{ color: '#e11d48', marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 600, fontSize: 17, cursor: 'pointer' }}>
          Se connecter
        </button>
      </form>
    </div>
  );
}
