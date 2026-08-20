import React, { useState } from 'react';
import { Calendar, Mail, Users } from 'lucide-react';

const WatchParty = ({ movieTitle, watchUrl }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState("Hey neighbors! Let's get together for a block watch party.");

  const handleGenerateInvite = () => {
    const subject = encodeURIComponent(`You're invited to a Block Party Watch: ${movieTitle}`);
    const body = encodeURIComponent(
      `${message}\n\n` +
      `We'll be watching: ${movieTitle}\n` +
      `Date & Time: ${date} at ${time}\n\n` +
      `Watch Link: ${window.location.origin}${watchUrl}\n\n` +
      `See you there!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="watch-party-container glass" style={{ 
      padding: '2rem', 
      borderRadius: '24px', 
      background: 'rgba(15, 20, 25, 0.4)', 
      backdropFilter: 'blur(15px)', 
      border: '1px solid rgba(255,255,255,0.1)' 
    }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent)', marginTop: 0 }}>
        <Users size={24} /> Neighborhood Watch Hub
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Event Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Event Time</label>
          <input 
            type="time" 
            value={time} 
            onChange={(e) => setTime(e.target.value)} 
            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} 
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Custom Message</label>
          <textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            rows="3" 
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', resize: 'none', outline: 'none' }}
          ></textarea>
        </div>

        <button 
          onClick={handleGenerateInvite} 
          className="btn btn-primary" 
          style={{ marginTop: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
        >
          <Mail size={18} /> Generate Email Invite
        </button>
      </div>
    </div>
  );
};

export default WatchParty;
