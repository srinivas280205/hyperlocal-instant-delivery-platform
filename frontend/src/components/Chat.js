import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Chat({ orderId, socket, otherName }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!orderId) return;
    api.get(`/orders/${orderId}/messages`).then(res => setMessages(res.data.messages)).catch(() => {});
  }, [orderId]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      if (!open && msg.sender._id !== user._id) setUnread(u => u + 1);
    });
    socket.on('user_typing', ({ name, role }) => {
      if (role !== user.role) { setTyping(true); setTimeout(() => setTyping(false), 2000); }
    });
    socket.on('user_stop_typing', () => setTyping(false));
    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket, open, user]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      socket?.emit('mark_read', { orderId });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, messages, orderId, socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket?.emit('send_message', { orderId, text });
    setText('');
    socket?.emit('stop_typing', { orderId });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socket?.emit('typing', { orderId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit('stop_typing', { orderId }), 1500);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button className="chat-fab" onClick={() => setOpen(true)}>
        💬
        {unread > 0 && <span className="chat-badge">{unread}</span>}
      </button>

      {/* Chat Modal */}
      {open && (
        <div className="chat-overlay" onClick={() => setOpen(false)}>
          <div className="chat-modal" onClick={e => e.stopPropagation()}>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">{otherName?.charAt(0) || '?'}</div>
                <div>
                  <strong>{otherName || 'Support'}</strong>
                  <span className="chat-online">● Online</span>
                </div>
              </div>
              <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty">
                  <p>💬 No messages yet</p>
                  <small>Say hi to {otherName}!</small>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg._id} className={`chat-bubble ${msg.sender._id === user._id ? 'mine' : 'theirs'}`}>
                  <p>{msg.text}</p>
                  <span className="chat-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {typing && (
                <div className="chat-bubble theirs typing-bubble">
                  <span className="typing-dots"><span/><span/><span/></span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input-row" onSubmit={sendMessage}>
              <input
                className="chat-input"
                placeholder="Type a message..."
                value={text}
                onChange={handleTyping}
                autoFocus
              />
              <button type="submit" className="chat-send" disabled={!text.trim()}>➤</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
