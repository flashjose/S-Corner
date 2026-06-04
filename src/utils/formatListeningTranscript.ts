interface TranscriptQuestion {
  num: string;
  text: string;
}

interface TranscriptDialogueLine {
  speaker: string;
  text: string;
}

interface TranscriptSection {
  title: string;
  passage?: string;
  dialogues?: TranscriptDialogueLine[];
  questions: TranscriptQuestion[];
}

interface FormattedListeningTranscript {
  docTitle?: string;
  sections: TranscriptSection[];
}

const SECTION_HEAD = /^(NEWS|CONVERSATION|PASSAGE)\s*(\d+)\s*/i;
const QUESTION_SPLIT = /(?=Q\s*(\d+)\.)/gi;

function stripBoilerplate(raw: string): { title?: string; body: string } {
  let text = raw.trim();
  text = text.replace(/\s*版权所有[\s\S]*$/i, '').trim();

  let title: string | undefined;
  const header = text.match(/^听力原文_[^\n]+/);
  if (header) {
    title = header[0].replace(/^听力原文_/, '').trim();
    text = text.slice(header[0].length).trim();
  }

  text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return { title, body: text };
}

function parseDialogue(passage: string): TranscriptDialogueLine[] | undefined {
  const lines = passage.split('\n').map((l) => l.trim()).filter(Boolean);
  const dialogues: TranscriptDialogueLine[] = [];
  for (const line of lines) {
    const m = line.match(/^([A-Z]):\s*(.+)$/);
    if (m) dialogues.push({ speaker: m[1], text: m[2] });
    else if (dialogues.length) dialogues[dialogues.length - 1].text += ` ${line}`;
  }
  return dialogues.length >= 2 ? dialogues : undefined;
}

function splitQuestions(block: string): { passage?: string; questions: TranscriptQuestion[] } {
  const parts = block.split(QUESTION_SPLIT).map((p) => p.trim()).filter(Boolean);
  const questions: TranscriptQuestion[] = [];
  let passageParts: string[] = [];

  for (const part of parts) {
    const qm = part.match(/^Q\s*(\d+)\.\s*([\s\S]*)$/i);
    if (qm) {
      questions.push({ num: qm[1], text: qm[2].trim() });
    } else {
      passageParts.push(part);
    }
  }

  const passage = passageParts.join('\n\n').trim() || undefined;
  return { passage, questions };
}

export function formatListeningTranscript(raw?: string | null): FormattedListeningTranscript | null {
  if (!raw?.trim()) return null;

  const { title, body } = stripBoilerplate(raw);
  if (!body) return title ? { docTitle: title, sections: [] } : null;

  const chunks = body.split(/(?=(?:NEWS|CONVERSATION|PASSAGE)\s*\d+)/i).map((c) => c.trim()).filter(Boolean);
  const sections: TranscriptSection[] = [];

  for (const chunk of chunks) {
    const head = chunk.match(SECTION_HEAD);
    if (!head) continue;

    const sectionTitle = `${head[1].toUpperCase()} ${head[2]}`;
    const rest = chunk.slice(head[0].length).trim();
    const { passage, questions } = splitQuestions(rest);
    const dialogues = passage ? parseDialogue(passage) : undefined;

    sections.push({
      title: sectionTitle,
      passage: dialogues ? undefined : passage,
      dialogues,
      questions,
    });
  }

  if (!sections.length && body) {
    const { passage, questions } = splitQuestions(body);
    sections.push({ title: '听力原文', passage, questions });
  }

  return { docTitle: title, sections };
}

/** Short label for timeline section chips */
export function shortSectionLabel(label: string): string {
  const m = label.match(/^(NEWS|CONVERSATION|PASSAGE)\s*(\d+)/i);
  if (!m) return label;
  const abbr = m[1] === 'CONVERSATION' ? 'C' : m[1] === 'PASSAGE' ? 'P' : 'N';
  return `${abbr}${m[2]}`;
}
