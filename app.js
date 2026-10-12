'use strict';

// ============================================================
// PROGRESS TRACKER
// ============================================================

const TOTAL_MODULES = 5;
const STORAGE_KEY_MODULES = 'belajar-kiro-progress';
const STORAGE_KEY_QUIZ    = 'belajar-kiro-quiz';

/** Load completed module IDs from localStorage */
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MODULES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save completed module IDs to localStorage */
function saveProgress(completed) {
  try {
    localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify(completed));
  } catch { /* silently fail if storage unavailable */ }
}

/** Update the progress counter, bar and percentage display */
function updateProgressUI(completed) {
  const count  = completed.length;
  const pct    = Math.round((count / TOTAL_MODULES) * 100);

  const countEl = document.getElementById('progressCount');
  const fillEl  = document.getElementById('progressBarFill');
  const pctEl   = document.getElementById('progressPct');
  const wrapEl  = document.getElementById('progressBarWrap');

  if (countEl) countEl.textContent = `${count} / ${TOTAL_MODULES} topik dipelajari`;
  if (fillEl)  fillEl.style.width  = `${pct}%`;
  if (pctEl)   pctEl.textContent   = `${pct}%`;
  if (wrapEl)  wrapEl.setAttribute('aria-valuenow', count);
}

/** Mark a module as done */
function markDone(moduleId) {
  const completed = loadProgress();

  if (completed.includes(moduleId)) return; // already done

  completed.push(moduleId);
  saveProgress(completed);
  updateProgressUI(completed);
  applyDoneState(moduleId);
}

/** Apply visual "done" state to a single module */
function applyDoneState(moduleId) {
  const btn  = document.getElementById(`done-${moduleId}`);
  const card = document.getElementById(`module-${moduleId}`);

  if (btn) {
    btn.classList.add('done');
    btn.innerHTML = '<span class="done-icon" aria-hidden="true">✓</span> Sudah Paham';
    btn.setAttribute('aria-label', `Modul ${moduleId} sudah ditandai selesai`);
  }

  if (card) {
    card.classList.add('completed');
  }
}

/** Restore all done states on page load */
function restoreProgress() {
  const completed = loadProgress();
  completed.forEach(id => applyDoneState(id));
  updateProgressUI(completed);
}

// ============================================================
// QUIZ
// ============================================================

/**
 * Quiz data: question, options (A-D), correct answer key, explanation
 */
const QUIZ_DATA = [
  {
    id: 'q1',
    correct: 'B',
    explanation: 'Steering files adalah instruksi permanen yang disimpan di .kiro/steering/ dan selalu dibaca Kiro di setiap sesi — cocok untuk coding conventions dan aturan proyek.'
  },
  {
    id: 'q2',
    correct: 'C',
    explanation: 'Supervised mode meminta persetujuan untuk setiap aksi, sehingga developer baru bisa memahami cara kerja Kiro sebelum mempercayakan lebih banyak ke Autopilot.'
  },
  {
    id: 'q3',
    correct: 'B',
    explanation: 'Spec session membuat dokumen rencana (spec document) terlebih dahulu sebelum implementasi, sehingga cocok untuk fitur besar yang butuh perencanaan matang.'
  },
  {
    id: 'q4',
    correct: 'C',
    explanation: 'Simbol # digunakan untuk menambah konteks: #File, #Folder, #Terminal, #Selection — semakin relevan konteks, semakin akurat respons Kiro.'
  },
  {
    id: 'q5',
    correct: 'B',
    explanation: 'Hooks menjalankan aksi otomatis saat event tertentu terjadi, misalnya memformat kode secara otomatis setiap kali sebuah file disimpan.'
  }
];

/** Submit quiz: grade answers and show feedback */
function submitQuiz() {
  const form    = document.getElementById('quizForm');
  const resultEl = document.getElementById('quizResult');

  let score = 0;
  let allAnswered = true;

  QUIZ_DATA.forEach(q => {
    const selected = form.querySelector(`input[name="${q.id}"]:checked`);

    if (!selected) {
      allAnswered = false;
      return;
    }

    const card       = document.getElementById(`${q.id}-card`);
    const feedbackEl = document.getElementById(`${q.id}-feedback`);
    const isCorrect  = selected.value === q.correct;

    if (isCorrect) {
      score++;
      if (card) card.classList.add('answered-correct');
      if (feedbackEl) {
        feedbackEl.textContent = `✓ Benar! ${q.explanation}`;
        feedbackEl.className   = 'quiz-feedback show feedback-correct';
      }
    } else {
      if (card) card.classList.add('answered-wrong');
      // Show correct answer letter
      const correctLabel = getOptionLabel(q.id, q.correct);
      if (feedbackEl) {
        feedbackEl.textContent = `✗ Kurang tepat. Jawaban benar: ${q.correct}${correctLabel ? ' — ' + correctLabel : ''}. ${q.explanation}`;
        feedbackEl.className   = 'quiz-feedback show feedback-wrong';
      }
    }

    // Highlight option labels
    const options = form.querySelectorAll(`input[name="${q.id}"]`);
    options.forEach(opt => {
      const label = opt.closest('.quiz-option');
      if (opt.value === q.correct) label.classList.add('correct');
      else if (opt === selected && !isCorrect) label.classList.add('wrong');
      opt.disabled = true;
    });
  });

  if (!allAnswered) {
    alert('Harap jawab semua pertanyaan sebelum submit!');
    return;
  }

  // Disable submit button
  const submitBtn = document.getElementById('submitQuiz');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Quiz Selesai';
  }

  // Show result panel
  showResult(score);

  // Persist quiz result
  try {
    localStorage.setItem(STORAGE_KEY_QUIZ, JSON.stringify({ score, total: QUIZ_DATA.length }));
  } catch { /* ignore */ }

  // Smooth scroll to result
  setTimeout(() => {
    if (resultEl) resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);
}

/** Get the text label for a specific answer option */
function getOptionLabel(qId, value) {
  const form = document.getElementById('quizForm');
  const input = form ? form.querySelector(`input[name="${qId}"][value="${value}"]`) : null;
  if (!input) return '';
  const label = input.closest('.quiz-option');
  if (!label) return '';
  // Text nodes only (exclude the radio and opt-letter span)
  return Array.from(label.childNodes)
    .filter(n => n.nodeType === Node.TEXT_NODE)
    .map(n => n.textContent.trim())
    .join(' ') || '';
}

/** Display the score result card */
function showResult(score) {
  const resultEl   = document.getElementById('quizResult');
  const scoreNumEl = document.getElementById('resultScoreNum');
  const titleEl    = document.getElementById('resultTitle');
  const subEl      = document.getElementById('resultSub');
  const circleEl   = document.getElementById('resultCircle');

  if (!resultEl) return;

  if (scoreNumEl) scoreNumEl.textContent = score;

  const messages = [
    { title: 'Ayo belajar lagi!', sub: 'Baca ulang modul-modul di atas dan coba lagi.' },      // 0
    { title: 'Terus semangat!',   sub: 'Kamu sudah di jalur yang benar. Baca ulang modul yang belum jelas.' },  // 1
    { title: 'Lumayan bagus!',    sub: 'Tinggal sedikit lagi untuk penguasaan penuh.' },           // 2–3
    { title: 'Hampir sempurna!',  sub: 'Kamu sudah paham sebagian besar konsep Kiro. Mantap!' }, // 4
    { title: '🎉 Sempurna!',     sub: 'Kamu menguasai semua konsep dasar Kiro. Selamat!' }       // 5
  ];

  const msgIdx = score === 5 ? 4 : score === 4 ? 3 : score >= 2 ? 2 : score === 1 ? 1 : 0;
  if (titleEl) titleEl.textContent = messages[msgIdx].title;
  if (subEl)   subEl.textContent   = `${score} dari ${QUIZ_DATA.length} jawaban benar. ${messages[msgIdx].sub}`;

  // Color the circle based on score
  if (circleEl) {
    if (score === 5)      circleEl.style.background = 'linear-gradient(135deg, #059669, #34d399)';
    else if (score >= 3)  circleEl.style.background = 'linear-gradient(135deg, #7C3AED, #3B82F6)';
    else                  circleEl.style.background = 'linear-gradient(135deg, #b45309, #f59e0b)';
  }

  resultEl.hidden = false;
}

/** Reset quiz to initial state */
function resetQuiz() {
  const form     = document.getElementById('quizForm');
  const resultEl = document.getElementById('quizResult');
  const submitBtn = document.getElementById('submitQuiz');

  if (form) form.reset();

  // Clear option highlights and feedback
  QUIZ_DATA.forEach(q => {
    const card       = document.getElementById(`${q.id}-card`);
    const feedbackEl = document.getElementById(`${q.id}-feedback`);

    if (card) {
      card.classList.remove('answered-correct', 'answered-wrong');
    }
    if (feedbackEl) {
      feedbackEl.textContent = '';
      feedbackEl.className   = 'quiz-feedback';
    }

    if (form) {
      const options = form.querySelectorAll(`input[name="${q.id}"]`);
      options.forEach(opt => {
        opt.disabled = false;
        const label = opt.closest('.quiz-option');
        if (label) label.classList.remove('correct', 'wrong');
      });
    }
  });

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Quiz';
  }

  if (resultEl) resultEl.hidden = true;

  try { localStorage.removeItem(STORAGE_KEY_QUIZ); } catch { /* ignore */ }

  // Scroll back to quiz top
  const quizSection = document.getElementById('quiz');
  if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// KEYBOARD NAVIGATION — quiz options selectable via Enter/Space
// ============================================================
document.addEventListener('keydown', function (e) {
  const el = e.target;
  if (el.classList.contains('quiz-option') && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    const radio = el.querySelector('input[type="radio"]');
    if (radio && !radio.disabled) radio.checked = true;
  }
});

// Make quiz-option labels keyboard-focusable
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.quiz-option').forEach(label => {
    label.setAttribute('tabindex', '0');
    label.setAttribute('role', 'button');
  });
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', restoreProgress);
