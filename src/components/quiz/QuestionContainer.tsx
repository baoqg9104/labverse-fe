import { useEffect, useRef, useState } from "react";
import type { Question, AnswerValue, SubmitAnswerFn } from "../../types/quiz";
import { QuestionCard } from "./QuestionCard";
import { TimerBar } from "./TimerBar";
import { ResultScreen } from "./ResultScreen";
import { useSound } from "./SoundEffect";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiAlertTriangle, FiXCircle } from "react-icons/fi";

export function QuestionContainer({
  questions,
  durationSec = 30,
  onSubmitAnswer,
}: {
  questions: Question[];
  durationSec?: number;
  onSubmitAnswer: SubmitAnswerFn;
}) {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(durationSec);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | undefined>(
    undefined
  );
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [notice, setNotice] = useState<{
    isCorrect: boolean;
    awardedXp: number;
  } | null>(null);

  // sounds (optional local files in public folder; user can replace later)
  const playCorrect = useSound("/sounds/correct.mp3", { volume: 0.6 });
  const playWrong = useSound("/sounds/wrong.mp3", { volume: 0.7 });
  const playTick = useSound("/sounds/tick.mp3", { volume: 0.4 });

  useEffect(() => {
    if (!started) return;
    const isFinished = idx >= questions.length;
    // Always clear any existing timer first
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // If finished, stop and keep remaining at 0
    if (isFinished) {
      setRemaining(0);
      return;
    }
    // Not finished: reset remaining and start the countdown
    setRemaining(durationSec);
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        if (next <= 5 && next > 0) {
          playTick();
        }
        if (next <= 0) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          // auto advance if unanswered
          setTimeout(() => setIdx((i) => i + 1), 400);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [started, idx, durationSec, playTick, questions.length]);

  const current = questions[idx];
  const finished = started && idx >= questions.length;

  const submit = async (value: AnswerValue) => {
    if (!current) return;
    setSubmitting(true);
    setFeedback(undefined);
    try {
      const res = await onSubmitAnswer(current, value);
      setAnswers((prev) => ({ ...prev, [current.id]: value }));
      setScore((s) => s + (res.awardedXp || 0));
      const ok = !!res.isCorrect;
      setFeedback(ok ? "correct" : "incorrect");
      if (ok) setCorrectCount((c) => c + 1);
      // show per-question point notification
      setNotice({ isCorrect: ok, awardedXp: res.awardedXp || 0 });
      // auto hide notice after 1.8s
      setTimeout(() => setNotice(null), 1800);
      if (ok) {
        playCorrect();
      } else {
        playWrong();
      }
      // advance after a short pause
      setTimeout(() => {
        setFeedback(undefined);
        setIdx((i) => i + 1);
      }, 800);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Quiz</h2>
            {/* <p className="text-white/80 text-xs sm:text-sm">
              One question at a time
            </p> */}
          </div>
          <div className="text-white text-sm font-semibold">
            {Math.min(idx, questions.length)}/{questions.length}
          </div>
        </div>
        <div className="mt-4">
          <TimerBar
            remaining={finished ? 0 : started ? remaining : durationSec}
            total={durationSec}
            state={finished ? "stopped" : started ? "running" : "paused"}
          />
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {!started ? (
          <div className="text-center space-y-4">
            <div className="text-lg font-semibold text-gray-800">
              Ready to start?
            </div>
            <div className="text-gray-600">
              There are {questions.length} questions. You have {durationSec}s
              for each.
            </div>
            <button
              onClick={() => setStarted(true)}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md cursor-pointer"
            >
              Start
            </button>
          </div>
        ) : finished ? (
          <ResultScreen
            total={questions.length}
            correct={correctCount}
            score={score}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={current?.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {current && (
                <QuestionCard
                  question={current}
                  value={answers[current.id]}
                  submitting={submitting}
                  disabled={remaining === 0}
                  onChange={(v) => {
                    // for choice types true/false/single submit immediately
                    if (current.type === 0) return submit(v);
                    if (current.type === 2) return submit(v);
                    setAnswers((prev) => ({ ...prev, [current.id]: v }));
                  }}
                  onSubmit={
                    current.type === 1 || current.type === 3
                      ? () => submit(answers[current.id])
                      : undefined
                  }
                  feedback={feedback}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* per-question XP notification (custom, not react-toast) */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={[
              "pointer-events-none absolute bottom-4 right-4 sm:bottom-6 sm:right-6",
              "rounded-xl ring-1 px-4 py-3 shadow-lg max-w-[85vw] sm:max-w-sm",
              notice.isCorrect && notice.awardedXp > 0
                ? "bg-green-50 ring-green-300 text-green-800"
                : notice.isCorrect && notice.awardedXp === 0
                ? "bg-amber-50 ring-amber-300 text-amber-800"
                : "bg-red-50 ring-red-300 text-red-800",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {notice.isCorrect && notice.awardedXp > 0 ? (
                  <FiCheckCircle className="size-5" />
                ) : notice.isCorrect && notice.awardedXp === 0 ? (
                  <FiAlertTriangle className="size-5" />
                ) : (
                  <FiXCircle className="size-5" />
                )}
              </div>
              <div className="text-sm font-medium leading-5">
                {notice.isCorrect && notice.awardedXp > 0 && (
                  <span>Chính xác! +{notice.awardedXp} XP</span>
                )}
                {notice.isCorrect && notice.awardedXp === 0 && (
                  <span>
                    Chính xác nhưng không được cộng điểm — bạn đã nhận XP cho
                    câu này trước đó.
                  </span>
                )}
                {!notice.isCorrect && <span>Sai rồi. +0 XP</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
