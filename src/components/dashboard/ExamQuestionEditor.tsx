import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Save, FileText, Upload, Clipboard, Code } from 'lucide-react';
import { Question } from '../../data/mockData';

interface Props {
  examTitle: string;
  questionsCount: number;
  onCancel: () => void;
  onPublish: (questions: Question[]) => void;
}

interface QuestionData {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | '';
  explanation: string;
}

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
};

export const ExamQuestionEditor: React.FC<Props> = ({ examTitle, questionsCount, onCancel, onPublish }) => {
  // Initialize state with the required number of blank questions
  const [questions, setQuestions] = useState<QuestionData[]>(
    Array.from({ length: questionsCount }, () => ({
      text: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: '',
      explanation: ''
    }))
  );

  const [importTab, setImportTab] = useState<'file' | 'paste' | 'json'>('file');
  const [pasteText, setPasteText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [importLog, setImportLog] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const updateQuestion = (index: number, field: keyof QuestionData, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if any correct answers are missing
    const missingAnswer = questions.findIndex(q => !q.correctAnswer);
    if (missingAnswer !== -1) {
      setErrorMessage(`Please select a correct answer for Question ${missingAnswer + 1}.`);
      return;
    }

    const finalQuestions: Question[] = questions.map((q, idx) => ({
      id: `q-${Date.now()}-${idx}`,
      q: q.text,
      opts: [q.optionA, q.optionB, q.optionC, q.optionD],
      ans: ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer || 'A'),
      exp: q.explanation || ''
    }));

    onPublish(finalQuestions);
  };

  // Helper to restrict questions count to the original slots count
  const limitAndFillQuestions = (parsed: QuestionData[]): QuestionData[] => {
    let finalQuestions: QuestionData[] = [];
    if (parsed.length >= questionsCount) {
      finalQuestions = parsed.slice(0, questionsCount);
    } else {
      finalQuestions = [
        ...parsed,
        ...Array.from({ length: questionsCount - parsed.length }, () => ({
          text: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: '' as const,
          explanation: ''
        }))
      ];
    }
    return finalQuestions;
  };

  // MCQ parser engine
  const parseMCQText = (raw: string): QuestionData[] => {
    // Strip any HTML/XML tags that might interfere (e.g. from docx XML runs)
    const cleanedRaw = raw.replace(/<[^>]*>/g, '');
    let text = cleanedRaw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blockRe = /(?:^|\n)(?:Q\.?\s*)?(\d+)[.)]\s+/gm;
    const blocks: { num: number; body: string }[] = [];
    let match: RegExpExecArray | null;
    const matches: { idx: number; num: number; full: string }[] = [];

    while ((match = blockRe.exec(text)) !== null) {
      matches.push({ idx: match.index, num: parseInt(match[1]), full: match[0] });
    }

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].idx + matches[i].full.length;
      const end = i + 1 < matches.length ? matches[i+1].idx : text.length;
      blocks.push({ num: matches[i].num, body: text.slice(start, end).trim() });
    }

    if (!blocks.length) return [];

    const results: QuestionData[] = [];
    blocks.forEach(block => {
      const lines = block.body.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;

      const optRe = /^(?:[A-Da-d][.)]\s*|[A-Da-d]\)\s*|\([A-Da-d]\)\s*)/;
      const ansRe = /^(?:ans(?:wer)?|correct(?:\s+ans(?:wer)?)?)\s*[:.)\s]\s*([A-Da-d])/i;
      const expRe = /^(?:exp(?:lanation)?|hint|reason)\s*[:.]\s*(.*)/i;

      let qLines: string[] = [];
      let optLines: string[] = [];
      let ansLine = '';
      let expLine = '';
      let phase: 'q' | 'opts' | 'done' = 'q';

      lines.forEach(line => {
        if (ansRe.test(line)) {
          ansLine = line;
          phase = 'done';
          return;
        }
        if (expRe.test(line)) {
          expLine = line;
          return;
        }
        if (optRe.test(line)) {
          phase = 'opts';
          optLines.push(line);
          return;
        }
        if (phase === 'q') qLines.push(line);
        else if (phase === 'opts') optLines.push(line);
      });

      const qText = qLines.join(' ').trim();
      if (!qText) return;

      let opts: string[] = [];
      if (optLines.length === 1) {
        const parts = optLines[0].split(/\s+(?=[A-Da-d][.)]\s)/);
        opts = parts.map(p => p.replace(/^[A-Da-d][.)]\s*/, '').trim()).filter(Boolean);
      } else {
        const combined = optLines.join(' ');
        const parts = combined.split(/(?=[A-Da-d][.)]\s)/);
        opts = parts.map(p => p.replace(/^[A-Da-d][.)]\s*/, '').trim()).filter(Boolean);
      }
      opts = opts.slice(0, 4);
      if (opts.length < 2) return;

      const ansMatch = ansLine.match(ansRe);
      let correctAnswer: 'A' | 'B' | 'C' | 'D' | '' = '';
      if (ansMatch) {
        const upper = ansMatch[1].toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(upper)) {
          correctAnswer = upper as any;
        }
      }

      let explanation = '';
      const expMatch = expLine.match(expRe);
      if (expMatch) explanation = expMatch[1].trim();

      results.push({
        text: qText,
        optionA: opts[0] || '',
        optionB: opts[1] || '',
        optionC: opts[2] || '',
        optionD: opts[3] || '',
        correctAnswer,
        explanation
      });
    });

    return results;
  };

  const handleTxt = (file: File): Promise<string> => {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target?.result as string);
      r.onerror = rej;
      r.readAsText(file);
    });
  };

  const handleDOCX = async (file: File): Promise<string> => {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
    const ab = await file.arrayBuffer();
    const result = await (window as any).mammoth.extractRawText({ arrayBuffer: ab });
    return result.value;
  };

  const handlePDF = async (file: File): Promise<string> => {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    const pdfjsLib = (window as any).pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((s: any) => s.str).join(' ') + '\n';
    }
    return text;
  };

  const processFile = async (file: File) => {
    const name = file.name.toLowerCase();
    setIsReadingFile(true);
    setErrorMessage('');
    setImportLog(`Reading file: ${file.name}...`);
    try {
      let text = '';
      if (name.endsWith('.txt')) {
        text = await handleTxt(file);
      } else if (name.endsWith('.docx')) {
        text = await handleDOCX(file);
      } else if (name.endsWith('.pdf')) {
        text = await handlePDF(file);
      } else {
        throw new Error('Unsupported file extension. Please select a .txt, .docx, or .pdf file.');
      }

      const parsed = parseMCQText(text);
      if (parsed.length === 0) {
        throw new Error('No questions could be detected. Please check the document format.');
      }

      setQuestions(limitAndFillQuestions(parsed));
      if (parsed.length > questionsCount) {
        setImportLog(`Extracted first ${questionsCount} questions from ${file.name} (ignored ${parsed.length - questionsCount} extra questions).`);
      } else {
        setImportLog(`Successfully extracted and populated ${parsed.length} questions from ${file.name}!`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error parsing file.');
      setImportLog('');
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImportPaste = () => {
    setErrorMessage('');
    if (!pasteText.trim()) {
      setErrorMessage('Please paste some text containing MCQ questions first.');
      return;
    }
    const parsed = parseMCQText(pasteText);
    if (parsed.length === 0) {
      setErrorMessage('No questions could be detected. Ensure they match the required format (e.g. 1. Question...)');
      return;
    }
    setQuestions(limitAndFillQuestions(parsed));
    if (parsed.length > questionsCount) {
      setImportLog(`Extracted first ${questionsCount} questions from pasted text (ignored ${parsed.length - questionsCount} extra questions).`);
    } else {
      setImportLog(`Successfully extracted and populated ${parsed.length} questions from pasted text!`);
    }
  };

  const handleImportJSON = () => {
    setErrorMessage('');
    if (!jsonText.trim()) {
      setErrorMessage('Please paste your JSON array first.');
      return;
    }
    try {
      const arr = JSON.parse(jsonText);
      if (!Array.isArray(arr)) {
        throw new Error('JSON data must be a valid array of questions.');
      }
      
      const mapped: QuestionData[] = arr.map((item: any, idx: number) => {
        const text = item.q || item.question;
        const opts = item.opts || item.options;
        const ans = item.ans !== undefined ? item.ans : item.answer;
        const explanation = item.exp || item.explanation || '';
        
        if (!text || !Array.isArray(opts) || opts.length < 2) {
          throw new Error(`Item at index ${idx} is missing a question text or options array.`);
        }
        
        const optionA = opts[0] || '';
        const optionB = opts[1] || '';
        const optionC = opts[2] || '';
        const optionD = opts[3] || '';
        
        let correctAnswer: 'A' | 'B' | 'C' | 'D' | '' = '';
        if (typeof ans === 'number' && ans >= 0 && ans < 4) {
          correctAnswer = ['A', 'B', 'C', 'D'][ans] as any;
        } else if (typeof ans === 'string' && ['A', 'B', 'C', 'D'].includes(ans.toUpperCase())) {
          correctAnswer = ans.toUpperCase() as any;
        }
        
        return { text, optionA, optionB, optionC, optionD, correctAnswer, explanation };
      });

      setQuestions(limitAndFillQuestions(mapped));
      if (mapped.length > questionsCount) {
        setImportLog(`Imported first ${questionsCount} questions from JSON (ignored ${mapped.length - questionsCount} extra questions).`);
      } else {
        setImportLog(`Successfully imported ${mapped.length} questions from JSON!`);
      }
    } catch (err: any) {
      setErrorMessage(`Invalid JSON: ${err.message}`);
    }
  };

  return (
    <div className="editor-layout animate-fade-in">
      <header className="editor-header">
        <div className="editor-header-content">
          <button className="back-btn" onClick={onCancel} type="button">
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
          <div className="editor-title-group">
            <h1 className="editor-title">Editing: {examTitle}</h1>
            <span className="editor-badge">{questions.length} Questions</span>
          </div>
        </div>
      </header>

      <main className="editor-main" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* Import Panel */}
        <section className="import-section" style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem',
          border: '1px solid var(--border-light)'
        }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-navy-primary)' }}>
            ⚡ Auto-Extract Questions from File or Text
          </h2>
          
          <div className="import-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            <button 
              type="button"
              className={`tab-btn ${importTab === 'file' ? 'active' : ''}`}
              onClick={() => setImportTab('file')}
              style={{
                background: importTab === 'file' ? 'var(--color-navy-primary)' : 'none',
                color: importTab === 'file' ? 'white' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Upload size={16} /> File Upload
            </button>
            <button 
              type="button"
              className={`tab-btn ${importTab === 'paste' ? 'active' : ''}`}
              onClick={() => setImportTab('paste')}
              style={{
                background: importTab === 'paste' ? 'var(--color-navy-primary)' : 'none',
                color: importTab === 'paste' ? 'white' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Clipboard size={16} /> Paste Text
            </button>
            <button 
              type="button"
              className={`tab-btn ${importTab === 'json' ? 'active' : ''}`}
              onClick={() => setImportTab('json')}
              style={{
                background: importTab === 'json' ? 'var(--color-navy-primary)' : 'none',
                color: importTab === 'json' ? 'white' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Code size={16} /> JSON Array
            </button>
          </div>

          <div className="import-content">
            {importTab === 'file' && (
              <div 
                className="file-dropzone" 
                style={{
                  border: '2px dashed var(--color-navy-light)',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#f8fafc',
                  transition: 'all 0.2s'
                }}
                onClick={() => document.getElementById('import-file-input')?.click()}
              >
                <input 
                  type="file" 
                  id="import-file-input" 
                  accept=".txt,.docx,.pdf" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
                <FileText size={40} style={{ color: 'var(--color-navy-primary)', marginBottom: '0.75rem' }} />
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {isReadingFile ? 'Processing...' : 'Click to browse or drop file here'}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Accepts .txt, .pdf, or .docx. Questions are auto-detected.
                </p>
              </div>
            )}

            {importTab === 'paste' && (
              <div>
                <textarea
                  className="input-field"
                  placeholder="Paste question text here... e.g.&#10;1. Which particles are in the atom nucleus?&#10;A) Electrons and protons&#10;B) Protons and neutrons&#10;C) Electrons and neutrons&#10;D) Only protons&#10;Answer: B&#10;Explanation: Neutrons and protons reside in the center."
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={6}
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '1rem', width: '100%', resize: 'vertical' }}
                />
                <button type="button" className="btn-primary" onClick={handleImportPaste}>
                  Extract Questions
                </button>
              </div>
            )}

            {importTab === 'json' && (
              <div>
                <textarea
                  className="input-field"
                  placeholder='[{"q": "Example question?", "opts": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"], "ans": 1, "exp": "Explanation"}]'
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={6}
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '1rem', width: '100%', resize: 'vertical' }}
                />
                <button type="button" className="btn-primary" onClick={handleImportJSON}>
                  Import JSON Array
                </button>
              </div>
            )}

            {importLog && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                borderRadius: '6px',
                fontSize: '0.9rem',
                border: '1px solid #bbf7d0',
                fontWeight: '500'
              }}>
                {importLog}
              </div>
            )}

            {errorMessage && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                borderRadius: '6px',
                fontSize: '0.9rem',
                border: '1px solid #fca5a5',
                fontWeight: '500'
              }}>
                ⚠️ {errorMessage}
              </div>
            )}
          </div>
        </section>

        {/* Editing Workspace */}
        <form onSubmit={handlePublish} className="editor-form">
          <div className="questions-list">
            {questions.map((q, index) => (
              <div key={index} className="question-card animate-slide-bottom" style={{ animationDelay: `${(index % 5) * 0.05}s`, marginBottom: '2rem' }}>
                <div className="question-header">
                  <span className="question-number">Question {index + 1}</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      const updated = questions.filter((_, i) => i !== index);
                      setQuestions(updated);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Delete Question
                  </button>
                </div>
                
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Question Text</label>
                  <textarea 
                    className="input-field textarea-field" 
                    placeholder="Enter your question here..."
                    value={q.text}
                    onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div className="options-grid">
                  <div className="option-input-group">
                    <label className="form-label">Option A</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Answer A"
                      value={q.optionA}
                      onChange={(e) => updateQuestion(index, 'optionA', e.target.value)}
                      required
                    />
                  </div>
                  <div className="option-input-group">
                    <label className="form-label">Option B</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Answer B"
                      value={q.optionB}
                      onChange={(e) => updateQuestion(index, 'optionB', e.target.value)}
                      required
                    />
                  </div>
                  <div className="option-input-group">
                    <label className="form-label">Option C</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Answer C"
                      value={q.optionC}
                      onChange={(e) => updateQuestion(index, 'optionC', e.target.value)}
                      required
                    />
                  </div>
                  <div className="option-input-group">
                    <label className="form-label">Option D</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Answer D"
                      value={q.optionD}
                      onChange={(e) => updateQuestion(index, 'optionD', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="correct-answer-selector" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.75rem' }}>Select Correct Answer</label>
                  <div className="answer-radio-group">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <label 
                        key={opt} 
                        className={`answer-radio-label ${q.correctAnswer === opt ? 'selected' : ''}`}
                      >
                        <input 
                          type="radio" 
                          name={`correct-${index}`} 
                          value={opt}
                          checked={q.correctAnswer === opt}
                          onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value as any)}
                          required
                          className="hidden-radio"
                        />
                        <div className="radio-circle">
                          {q.correctAnswer === opt && <CheckCircle size={16} />}
                        </div>
                        Option {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Explanation (Optional)</label>
                  <textarea 
                    className="input-field" 
                    placeholder="Enter answer explanation..."
                    value={q.explanation}
                    onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                setQuestions(prev => [...prev, {
                  text: '',
                  optionA: '',
                  optionB: '',
                  optionC: '',
                  optionD: '',
                  correctAnswer: '',
                  explanation: ''
                }]);
              }}
              style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              ＋ Add Blank Question Card
            </button>
            
            <button 
              type="submit" 
              className="submit-btn publish-exam-btn"
              style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={20} />
              Publish Final Exam
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
