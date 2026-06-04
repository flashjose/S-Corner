import { useMemo } from 'react';
import { formatListeningTranscript } from '@/utils/formatListeningTranscript';

interface ListeningTranscriptProps {
  transcript?: string | null;
  activeQuestionNum?: string | null;
  onQuestionClick?: (startMs: number, num: string) => void;
  questionStartMs?: Map<string, number>;
}

export default function ListeningTranscript({
  transcript,
  activeQuestionNum,
  onQuestionClick,
  questionStartMs,
}: ListeningTranscriptProps) {
  const formatted = useMemo(() => formatListeningTranscript(transcript), [transcript]);

  if (!formatted?.sections.length) {
    return (
      <p className="listening-transcript-empty text-[12px]" style={{ color: 'var(--text-muted)' }}>
        {transcript?.trim() ? transcript : '听力原文暂未上传'}
      </p>
    );
  }

  return (
    <article className="listening-transcript">
      {formatted.docTitle && (
        <header className="listening-transcript-doc-title">{formatted.docTitle}</header>
      )}

      {formatted.sections.map((section) => (
        <section key={section.title} className="listening-transcript-section">
          <h3 className="listening-transcript-section-title">{section.title}</h3>

          {section.dialogues && (
            <div className="listening-transcript-dialogue">
              {section.dialogues.map((line, i) => (
                <p key={i} className="listening-transcript-line">
                  <span className="listening-transcript-speaker">{line.speaker}</span>
                  <span>{line.text}</span>
                </p>
              ))}
            </div>
          )}

          {section.passage && !section.dialogues && (
            <p className="listening-transcript-passage">{section.passage}</p>
          )}

          {section.questions.length > 0 && (
            <ol className="listening-transcript-questions" start={Number(section.questions[0]?.num) || 1}>
              {section.questions.map((q) => {
                const isActive = activeQuestionNum === q.num;
                const startMs = questionStartMs?.get(q.num);
                const clickable = onQuestionClick && startMs != null;

                return (
                  <li
                    key={`${section.title}-q${q.num}`}
                    className={`listening-transcript-question${isActive ? ' is-active' : ''}${clickable ? ' is-clickable' : ''}`}
                  >
                    <button
                      type="button"
                      className="listening-transcript-question-btn"
                      disabled={!clickable}
                      onClick={() => clickable && onQuestionClick(startMs, q.num)}
                      title={clickable ? `跳转到第 ${q.num} 题` : undefined}
                    >
                      <span className="listening-transcript-qnum">{q.num}</span>
                      <span className="listening-transcript-qtext">{q.text}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      ))}
    </article>
  );
}
