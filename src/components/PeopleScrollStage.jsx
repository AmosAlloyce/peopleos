import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Compass, Film, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import './PeopleScrollStage.css';

const blobCache = new Map();

function loadVideoBlob(src) {
  if (blobCache.has(src)) return blobCache.get(src);
  const promise = fetch(src)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    })
    .then((blob) => URL.createObjectURL(blob))
    .catch(() => src);
  blobCache.set(src, promise);
  return promise;
}

export function ScrollFilmStage({
  id,
  eyebrow,
  title,
  subtitle,
  src,
  poster,
  durationHint = 10,
  anchorTop = false,
  compact = false,
  beats = [],
  badgeText = 'Scroll-driven stage',
  metricLabel,
  metricValue,
  actionLabel,
  onAction,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [activeBeat, setActiveBeat] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [manualLockUntil, setManualLockUntil] = useState(0);
  const stateRef = useRef({
    target: 0,
    current: 0,
    ready: false,
    painted: false,
    raf: 0,
    manualUntil: 0,
  });

  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cancelled = false;

    if (!reducedMotion.matches) {
      loadVideoBlob(src).then((blobUrl) => {
        if (cancelled || !videoRef.current) return;
        const v = videoRef.current;
        const onLoaded = () => {
          stateRef.current.ready = true;
          try {
            v.currentTime = Math.max(0.01, stateRef.current.current * (v.duration || durationHint));
          } catch {}
        };
        const onSeeked = () => {
          if (!stateRef.current.painted) {
            stateRef.current.painted = true;
            el.classList.add('is-video-ready');
          }
        };
        v.addEventListener('loadedmetadata', onLoaded, { once: true });
        v.addEventListener('seeked', onSeeked, { once: true });
        v.muted = true;
        v.playsInline = true;
        v.preload = 'auto';
        v.src = blobUrl;
      });
    }

    const computeScrollTarget = () => {
      if (Date.now() < stateRef.current.manualUntil) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      let raw = 0;

      if (anchorTop) {
        // For stages near the top of a workspace view, start at 0 when scrollY is 0
        // and scrub across the first ~460px of vertical scroll.
        const travel = Math.max(340, Math.min(540, rect.height * 1.15));
        raw = window.scrollY / travel;
      } else {
        // For mid/lower panels, scrub from when the panel enters the lower viewport
        // until it reaches the upper viewport.
        const start = vh * 0.86;
        const end = vh * 0.12;
        raw = (start - rect.top) / Math.max(120, start - end);
      }

      const clamped = Math.max(0, Math.min(1, raw));
      stateRef.current.target = clamped;
      if (reducedMotion.matches) {
        stateRef.current.current = clamped;
        el.style.setProperty('--scroll-p', clamped.toFixed(4));
        const idx = beats.length
          ? Math.min(beats.length - 1, Math.floor(clamped * beats.length))
          : 0;
        setActiveBeat(idx);
        setDisplayProgress(Math.round(clamped * 100));
      } else {
        startLoop();
      }
    };

    const tick = () => {
      stateRef.current.raf = 0;
      const st = stateRef.current;
      const diff = st.target - st.current;
      if (Math.abs(diff) > 0.0008) {
        st.current += diff * 0.18;
      } else {
        st.current = st.target;
      }

      const p = Math.max(0, Math.min(1, st.current));
      el.style.setProperty('--scroll-p', p.toFixed(4));

      if (st.ready && video && !video.seeking && video.duration) {
        const targetTime = Math.max(0.01, Math.min(video.duration - 0.02, p * video.duration));
        if (Math.abs(video.currentTime - targetTime) > 0.018) {
          try {
            video.currentTime = targetTime;
          } catch {}
        }
      }

      const beatIdx = beats.length
        ? Math.min(beats.length - 1, Math.floor(p * beats.length))
        : 0;
      setActiveBeat((prev) => (prev !== beatIdx ? beatIdx : prev));
      const pct = Math.round(p * 100);
      setDisplayProgress((prev) => (prev !== pct ? pct : prev));

      if (Math.abs(st.target - st.current) > 0.001) {
        st.raf = requestAnimationFrame(tick);
      }
    };

    const startLoop = () => {
      if (!stateRef.current.raf && !reducedMotion.matches) {
        stateRef.current.raf = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      // Scrolling after a short grace window releases any manual beat selection
      if (Date.now() > stateRef.current.manualUntil) {
        computeScrollTarget();
      }
    };

    computeScrollTarget();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', computeScrollTarget);

    return () => {
      cancelled = true;
      if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', computeScrollTarget);
    };
  }, [src, anchorTop, beats.length, durationHint]);

  function scrubTo(progress, lockMs = 1800) {
    const clamped = Math.max(0, Math.min(1, progress));
    stateRef.current.manualUntil = Date.now() + lockMs;
    setManualLockUntil(stateRef.current.manualUntil);
    stateRef.current.target = clamped;

    const el = containerRef.current;
    const video = videoRef.current;
    if (el) el.style.setProperty('--scroll-p', clamped.toFixed(4));

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      stateRef.current.current = clamped;
      if (video && stateRef.current.ready && video.duration) {
        try {
          video.currentTime = clamped * video.duration;
        } catch {}
      }
      const idx = beats.length
        ? Math.min(beats.length - 1, Math.floor(clamped * beats.length))
        : 0;
      setActiveBeat(idx);
      setDisplayProgress(Math.round(clamped * 100));
    } else if (!stateRef.current.raf) {
      const step = () => {
        const st = stateRef.current;
        const diff = st.target - st.current;
        st.current = Math.abs(diff) > 0.001 ? st.current + diff * 0.22 : st.target;
        const p = Math.max(0, Math.min(1, st.current));
        if (el) el.style.setProperty('--scroll-p', p.toFixed(4));
        if (st.ready && video && !video.seeking && video.duration) {
          const t = Math.max(0.01, Math.min(video.duration - 0.02, p * video.duration));
          if (Math.abs(video.currentTime - t) > 0.015) {
            try {
              video.currentTime = t;
            } catch {}
          }
        }
        const idx = beats.length
          ? Math.min(beats.length - 1, Math.floor(p * beats.length))
          : 0;
        setActiveBeat(idx);
        setDisplayProgress(Math.round(p * 100));
        if (Math.abs(st.target - st.current) > 0.001) {
          st.raf = requestAnimationFrame(step);
        } else {
          st.raf = 0;
        }
      };
      stateRef.current.raf = requestAnimationFrame(step);
    }
  }

  const currentBeat = beats[activeBeat] || beats[0];
  const currentSeconds = ((displayProgress / 100) * durationHint).toFixed(1);

  return (
    <section
      ref={containerRef}
      id={id}
      className={`scroll-film-stage ${compact ? 'is-compact' : ''}`}
      aria-label={title}
      data-sc-act="flow"
    >
      <div className="scroll-film-header">
        <div className="scroll-film-titles">
          {eyebrow && <span className="scroll-film-eyebrow">{eyebrow}</span>}
          <div className="scroll-film-title-row">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <div className="scroll-film-meta">
          {metricValue !== undefined && (
            <div className="scroll-film-metric">
              <span>{metricLabel}</span>
              <strong>{metricValue}</strong>
            </div>
          )}
          <span className="scroll-film-badge">
            <Film size={13} aria-hidden="true" />
            {badgeText} · {displayProgress}%
          </span>
        </div>
      </div>

      <div className="scroll-film-body">
        <div className="scroll-film-viewport">
          <img
            className="scroll-film-poster"
            src={poster}
            alt=""
            loading="lazy"
            width="1280"
            height="720"
          />
          <video
            ref={videoRef}
            className="scroll-film-video"
            poster={poster}
            muted
            playsInline
            preload="none"
            aria-hidden="true"
          />
          <div className="scroll-film-overlay">
            <div className="scroll-film-hud-top">
              <span className="scroll-film-pill">
                <i className="scroll-film-dot" />
                {currentBeat ? `${currentBeat.code} · ${currentBeat.label}` : eyebrow}
              </span>
              <span className="scroll-film-timecode">
                {currentSeconds}s / {durationHint.toFixed(1)}s
              </span>
            </div>
            {currentBeat && (
              <div className="scroll-film-caption-card">
                <div>
                  <strong>{currentBeat.title}</strong>
                  <p>{currentBeat.detail}</p>
                </div>
                {actionLabel && onAction && (
                  <button type="button" className="scroll-film-cta" onClick={onAction}>
                    {actionLabel}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="scroll-film-progress-track" aria-hidden="true">
            <div className="scroll-film-progress-bar" />
          </div>
        </div>

        {beats.length > 0 && (
          <div className="scroll-film-beats" role="group" aria-label={`${title} scroll stages`}>
            {beats.map((beat, index) => {
              const isCurrent = index === activeBeat;
              const isPassed = index < activeBeat;
              const targetP = beats.length > 1 ? (index + 0.35) / beats.length : 0;
              return (
                <button
                  key={beat.code || index}
                  type="button"
                  className={`scroll-film-beat ${isCurrent ? 'is-active' : ''} ${isPassed ? 'is-passed' : ''}`}
                  aria-pressed={isCurrent}
                  onClick={() => scrubTo(targetP, 2600)}
                >
                  <div className="scroll-film-beat-top">
                    <span className="scroll-film-beat-code">
                      {isPassed ? <Check size={12} /> : beat.code}
                    </span>
                    <span className="scroll-film-beat-label">{beat.label}</span>
                  </div>
                  <strong>{beat.title}</strong>
                  <p>{beat.detail}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
