import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Pause, Play, X } from 'lucide-react';
import type { AudioTimeline, AudioTimelineSegment } from '@/types/exam';
import { shortSectionLabel } from '@/utils/formatListeningTranscript';
import ListeningTranscript from '@/components/ListeningTranscript';

function parseTimeline(raw?: string | AudioTimeline | null): AudioTimeline | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw) as AudioTimeline;
  } catch {
    return null;
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function activeQuestionIndex(segments: AudioTimelineSegment[], currentMs: number): number {
  const questions = segments.filter((s) => s.type === 'question');
  let active = -1;
  for (let i = 0; i < questions.length; i++) {
    if (questions[i].startMs <= currentMs) active = i;
    else break;
  }
  return active;
}

interface TimelineRegion {
  segment: AudioTimelineSegment;
  startPct: number;
  widthPct: number;
}

function buildRegions(segments: AudioTimelineSegment[], totalSec: number): TimelineRegion[] {
  if (!totalSec || !segments.length) return [];
  const sorted = [...segments].sort((a, b) => a.startMs - b.startMs);
  return sorted.map((seg, i) => {
    const start = seg.startMs / 1000;
    const end = i < sorted.length - 1 ? sorted[i + 1].startMs / 1000 : totalSec;
    const width = Math.max(0, end - start);
    return {
      segment: seg,
      startPct: (start / totalSec) * 100,
      widthPct: (width / totalSec) * 100,
    };
  });
}

interface ListeningPlayerBarProps {
  audioUrl?: string;
  audioTimeline?: string | AudioTimeline | null;
  transcript?: string;
}

export default function ListeningPlayerBar({
  audioUrl,
  audioTimeline: rawTimeline,
  transcript,
}: ListeningPlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);

  const timeline = useMemo(() => parseTimeline(rawTimeline), [rawTimeline]);
  const segments = timeline?.segments ?? [];
  const sectionSegments = useMemo(() => segments.filter((s) => s.type === 'section'), [segments]);
  const questionSegments = useMemo(() => segments.filter((s) => s.type === 'question'), [segments]);

  const totalDurationSec = useMemo(() => {
    if (duration > 0) return duration;
    if (timeline?.durationMs) return timeline.durationMs / 1000;
    return 0;
  }, [duration, timeline]);

  const regions = useMemo(
    () => buildRegions(segments, totalDurationSec),
    [segments, totalDurationSec],
  );

  const activeQ = activeQuestionIndex(segments, currentTime * 1000);
  const activeQuestionNum = questionSegments[activeQ]?.label ?? null;
  const progressPct = totalDurationSec > 0 ? (currentTime / totalDurationSec) * 100 : 0;

  const questionStartMs = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of questionSegments) map.set(q.label, q.startMs);
    return map;
  }, [questionSegments]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(seconds, totalDurationSec || seconds));
    setCurrentTime(audio.currentTime);
    audio.play().catch(() => {});
    setIsPlaying(true);
  }, [totalDurationSec]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const seekFromClientX = useCallback(
    (clientX: number, rect: DOMRect) => {
      if (!totalDurationSec) return;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      seekTo(ratio * totalDurationSec);
    },
    [seekTo, totalDurationSec],
  );

  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      seekFromClientX(e.clientX, e.currentTarget.getBoundingClientRect());
    },
    [seekFromClientX],
  );

  const handleBarMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setHoverPct(ratio * 100);
    },
    [],
  );

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  const hasTimeline = questionSegments.length > 0;
  const barBottom = showTranscript ? (hasTimeline ? 112 : 72) : 0;

  if (!audioUrl) {
    return (
      <div className="listening-player-bar listening-player-bar--empty">
        <p>听力音频暂未上传</p>
      </div>
    );
  }

  return (
    <>
      <div className={`listening-player-bar${hasTimeline ? ' listening-player-bar--timeline' : ''}`}>
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration);
          }}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <div className="listening-player-inner">
          <div className="listening-player-controls">
            <button
              type="button"
              onClick={togglePlay}
              className="listening-play-btn"
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? <Pause size={18} strokeWidth={2} /> : <Play size={18} strokeWidth={2} className="ml-0.5" />}
            </button>

            <div className="listening-time">
              <span className="listening-time-current">{formatTime(currentTime)}</span>
              <span className="listening-time-sep">/</span>
              <span className="listening-time-total">{formatTime(totalDurationSec)}</span>
            </div>

            <div
              className="listening-track-wrap"
              onClick={handleBarClick}
              onMouseMove={handleBarMove}
              onMouseLeave={() => setHoverPct(null)}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={totalDurationSec}
              aria-valuenow={currentTime}
            >
              {hasTimeline && (
                <div className="listening-track-sections" aria-hidden>
                  {regions
                    .filter((r) => r.segment.type === 'section')
                    .map((r) => (
                      <div
                        key={`sec-${r.segment.label}-${r.segment.startMs}`}
                        className="listening-track-section"
                        style={{ left: `${r.startPct}%`, width: `${r.widthPct}%` }}
                        title={r.segment.label}
                      />
                    ))}
                </div>
              )}

              <div className="listening-track">
                <div className="listening-track-fill" style={{ width: `${progressPct}%` }} />
                {hoverPct != null && hoverPct > progressPct && (
                  <div className="listening-track-hover" style={{ left: `${progressPct}%`, width: `${hoverPct - progressPct}%` }} />
                )}
                {hasTimeline &&
                  regions
                    .filter((r) => r.segment.type === 'question')
                    .map((r) => (
                      <button
                        key={`tick-${r.segment.label}-${r.segment.startMs}`}
                        type="button"
                        className={`listening-track-tick${r.segment.label === activeQuestionNum ? ' is-active' : ''}`}
                        style={{ left: `${r.startPct}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          seekTo(r.segment.startMs / 1000);
                        }}
                        title={`第 ${r.segment.label} 题`}
                        aria-label={`第 ${r.segment.label} 题`}
                      />
                    ))}
                <div className="listening-track-thumb" style={{ left: `${progressPct}%` }} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              className={`listening-transcript-toggle${showTranscript ? ' is-open' : ''}`}
            >
              <FileText size={14} strokeWidth={2} />
              <span>原文</span>
            </button>
          </div>

          {hasTimeline && (
            <div className="listening-player-questions">
              {sectionSegments.length > 0 && (
                <div className="listening-section-chips" aria-hidden>
                  {sectionSegments.map((seg) => (
                    <button
                      key={`chip-${seg.label}-${seg.startMs}`}
                      type="button"
                      className="listening-section-chip"
                      onClick={() => seekTo(seg.startMs / 1000)}
                      title={seg.label}
                    >
                      {shortSectionLabel(seg.label)}
                    </button>
                  ))}
                </div>
              )}
              <div className="listening-question-pills">
                {questionSegments.map((seg, idx) => {
                  const isActive = idx === activeQ;
                  return (
                    <button
                      key={`q-${seg.label}-${seg.startMs}`}
                      type="button"
                      className={`listening-question-pill${isActive ? ' is-active' : ''}`}
                      onClick={() => seekTo(seg.startMs / 1000)}
                      title={`第 ${seg.label} 题 · ${formatTime(seg.startMs / 1000)}`}
                    >
                      {seg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="listening-transcript-panel"
            style={{ bottom: barBottom }}
          >
            <div className="listening-transcript-panel-header">
              <span>听力原文</span>
              <button type="button" onClick={() => setShowTranscript(false)} aria-label="关闭">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <div className="listening-transcript-panel-body">
              <ListeningTranscript
                transcript={transcript}
                activeQuestionNum={activeQuestionNum}
                questionStartMs={questionStartMs}
                onQuestionClick={(ms) => seekTo(ms / 1000)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Reserve space below PDF when timeline + question row visible */
export const LISTENING_PLAYER_HEIGHT = 112;
