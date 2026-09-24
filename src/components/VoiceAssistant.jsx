import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  AudioLines,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { Modal, Badge, Busy } from './UI.jsx';
import { api } from '../lib/api.js';
const prompts = {
  concierge: ['What is the leave policy?', 'How do I request HR support?'],
  analyst: ['Give me a data quality briefing', 'What needs my attention?'],
  onboarding: ['Walk me through onboarding', 'What should a new joiner prepare?'],
};
export default function VoiceAssistant({ onClose, initialPersona = 'concierge' }) {
  const [persona, setPersona] = useState(initialPersona),
    [language, setLanguage] = useState('en'),
    [message, setMessage] = useState(''),
    [messages, setMessages] = useState([]),
    [busy, setBusy] = useState(false),
    [listening, setListening] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [error, setError] = useState('');
  const recognition = useRef(null),
    bottom = useRef(null),
    mounted = useRef(true);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      recognition.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);
  function speak(text) {
    if (!window.speechSynthesis) {
      setError(
        'Your browser does not offer speech playback. The full answer is available in the transcript.',
      );
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'fr' ? 'fr-FR' : 'en-GB';
    utterance.rate = 0.98;
    utterance.onend = () => mounted.current && setSpeaking(false);
    utterance.onerror = () => mounted.current && setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }
  function listen() {
    setError('');
    if (listening) {
      recognition.current?.stop();
      return;
    }
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. You can type your question below.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = language === 'fr' ? 'fr-FR' : 'en-GB';
    rec.interimResults = true;
    rec.onresult = (e) => {
      if (mounted.current)
        setMessage(
          Array.from(e.results)
            .map((r) => r[0].transcript)
            .join(' '),
        );
    };
    rec.onend = () => mounted.current && setListening(false);
    rec.onerror = (e) => {
      if (mounted.current) {
        setListening(false);
        setError(
          e.error === 'not-allowed'
            ? 'Microphone access was declined. You can still type your question.'
            : 'Voice input stopped. Please try again or type your question.',
        );
      }
    };
    recognition.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError('The microphone could not start. Please use text input.');
    }
  }
  async function send(text = message) {
    if (!text.trim() || busy) return;
    recognition.current?.stop();
    setError('');
    setMessage('');
    setMessages((items) => [...items, { role: 'user', text: text.trim() }]);
    setBusy(true);
    try {
      const data = await api('/chat', { message: text.trim(), persona, language });
      if (mounted.current)
        setMessages((items) => [...items, { role: 'assistant', text: data.reply, ...data }]);
    } catch (e) {
      if (mounted.current) setError(e.message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <Modal title="Your people copilot" onClose={onClose} drawer>
      <div className="voice-intro">
        <div className={`voice-orb ${listening ? 'listening' : ''}`}>
          <AudioLines size={35} />
        </div>
        <Badge tone="purple">Voice + text</Badge>
        <h3>
          A little less admin.
          <br />A little more human.
        </h3>
        <p>Ask a question, get a briefing, or find your next step.</p>
      </div>
      <div className="voice-selects">
        <label>
          Specialist
          <select
            aria-label="Specialist"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
          >
            <option value="concierge">People concierge</option>
            <option value="analyst">Data quality analyst</option>
            <option value="onboarding">Onboarding companion</option>
          </select>
        </label>
        <label>
          Language
          <select
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </label>
      </div>
      <div className="voice-disclosure">
        Synthetic data and example policies. Voice input uses your browser’s speech service; review
        the transcript before sending.
      </div>
      <div className="chat-messages" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-suggestions">
            <span>TRY ASKING</span>
            {prompts[persona].map((p) => (
              <button key={p} onClick={() => send(p)}>
                {p}
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role}`}>
              <div className="chat-role">
                {m.role === 'user' ? (
                  'You'
                ) : (
                  <>
                    <Sparkles size={13} />
                    {m.agent || 'PeopleOS copilot'}
                    <Badge>{m.mode === 'live' ? 'Live AI' : 'Demo answer'}</Badge>
                  </>
                )}
              </div>
              <p>{m.text}</p>
              {m.sources?.length > 0 && (
                <details>
                  <summary>
                    {m.sources.length} reference{m.sources.length !== 1 ? 's' : ''}
                  </summary>
                  {m.sources.map((s, n) => (
                    <p key={n}>
                      <strong>{s.title}</strong>
                      <br />
                      {s.detail}
                    </p>
                  ))}
                </details>
              )}
              {m.role === 'assistant' && (
                <button className="listen-button" onClick={() => speak(m.text)}>
                  {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}{' '}
                  {speaking ? 'Stop playback' : 'Read aloud'}
                </button>
              )}
            </div>
          ))
        )}
        {busy && <Busy>Consulting your specialist…</Busy>}
        <div ref={bottom} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label className="sr-only" htmlFor="copilot-message">
          Your question
        </label>
        <textarea
          id="copilot-message"
          rows="2"
          maxLength={1500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={listening ? 'Listening… review before sending' : 'Ask your people copilot…'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div>
          <button
            type="button"
            className={`mic-button ${listening ? 'active' : ''}`}
            onClick={listen}
          >
            {listening ? <MicOff size={17} /> : <Mic size={17} />}{' '}
            {listening ? 'Stop listening' : 'Use microphone'}
          </button>
          <button
            className="send-button"
            disabled={!message.trim() || busy}
            aria-label="Send question"
          >
            <Send size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
