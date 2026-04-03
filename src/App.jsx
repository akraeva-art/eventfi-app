import { useState } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

const QUIZ_QUESTIONS = [
  {
    id: "q1",
    text: "What does OMNISTON help users do?",
    options: [
      "a) Swap tokens across blockchains",
      "b) Build Telegram bots",
      "c) Make TON memes",
    ],
    correct: "a) Swap tokens across blockchains",
  },
  {
    id: "q2",
    text: "What is one of OMNISTON's main user goals?",
    options: [
      "a) Mining Bitcoin",
      "b) Selling NFTs",
      "c) Simplifying UX and removing unnecessary steps",
    ],
    correct: "c) Simplifying UX and removing unnecessary steps",
  },
];
const EVENT_QR_TOKENS = {
  "eventfi-demo-2026": "ston-qr-access",
};

export default function App() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const walletConnected = Boolean(wallet);
  const [checkedIn, setCheckedIn] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({
    q1: "",
    q2: "",
  });
  const [stonBalance, setStonBalance] = useState(0);
  const searchParams = new URLSearchParams(window.location.search);
  const eventId = searchParams.get("event");
  const eventToken = searchParams.get("token");
  const hasEventAccess =
    Boolean(eventId) && EVENT_QR_TOKENS[eventId] === eventToken;

  const canCheckIn = walletConnected && hasEventAccess && !checkedIn;
  const hasAllQuizAnswers = QUIZ_QUESTIONS.every(
    (question) => quizAnswers[question.id] !== ""
  );
  const canSubmitQuiz = checkedIn && !quizDone && hasAllQuizAnswers;

  const handleConnectWallet = () => {
    tonConnectUI.openModal();
  };

  const handleDisconnectWallet = async () => {
    await tonConnectUI.disconnect();
    setCheckedIn(false);
    setQuizDone(false);
    setQuizCorrect(false);
    setQuizAnswers({ q1: "", q2: "" });
    setStonBalance(0);
  };

  const handleCheckIn = () => {
    if (!canCheckIn) return;
    setCheckedIn(true);
    setStonBalance((current) => current + 10);
  };

  const handleQuizSubmit = (event) => {
    event.preventDefault();
    if (!canSubmitQuiz) return;

    const isCorrect = QUIZ_QUESTIONS.every(
      (question) => quizAnswers[question.id] === question.correct
    );
    setQuizDone(true);
    setQuizCorrect(isCorrect);
    if (isCorrect) {
      setStonBalance((current) => current + 10);
    }
  };

  const handleQuizAnswerChange = (questionId, value) => {
    setQuizAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const walletLabel = wallet?.account?.address
    ? `${wallet.account.address.slice(0, 4)}...${wallet.account.address.slice(-4)}`
    : "Wallet Connected";

  let flowStep = 4;
  if (!walletConnected) flowStep = 1;
  else if (!checkedIn) flowStep = 2;
  else if (!quizDone) flowStep = 3;

  return (
    <main className="page">
      <section className="card">
        <p className="kicker">Event Demo</p>
        <h1>EventFi</h1>
        <p className="subtitle">Turn event attendees into DeFi users</p>

        <div className="balance-box">
          <span>STON Balance</span>
          <strong>{stonBalance} STON</strong>
        </div>

        <div className="step-chip">Step {flowStep} of 4</div>

        <div className="block">
          <h2>1. Connect Wallet</h2>
          <div className="wallet-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConnectWallet}
              disabled={walletConnected}
            >
              {walletConnected ? walletLabel : "Connect Wallet"}
            </button>
            {walletConnected && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDisconnectWallet}
              >
                Disconnect wallet
              </button>
            )}
          </div>
          {!walletConnected && (
            <p className="helper">
              No wallet yet?{" "}
              <a
                className="helper-link"
                href="https://tonkeeper.com"
                target="_blank"
                rel="noreferrer"
              >
                Install Tonkeeper
              </a>
            </p>
          )}
          {walletConnected && (
            <p className="helper">
              Wallet sessions are restored automatically until you disconnect.
            </p>
          )}
        </div>

        <div className="block">
          <h2>2. Event Check-In</h2>
          <button
            type="button"
            className="btn"
            onClick={handleCheckIn}
            disabled={!canCheckIn}
          >
            {checkedIn ? "Badge unlocked (+10 STON)" : "I’m at the event"}
          </button>
          {walletConnected && !hasEventAccess && (
            <p className="warning">
              Open EventFi from the official event QR to unlock check-in.
            </p>
          )}
          {checkedIn && <p className="success">Badge unlocked</p>}
        </div>

        <div className="block">
          <h2>3. Mini Quiz</h2>
          <form onSubmit={handleQuizSubmit}>
            {QUIZ_QUESTIONS.map((question, index) => (
              <div key={question.id} className="quiz-item">
                <p className="question">
                  {index + 1}. {question.text}
                </p>
                <div className="quiz-list">
                  {question.options.map((option) => (
                    <label key={option} className="radio-item">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={quizAnswers[question.id] === option}
                        disabled={!checkedIn || quizDone}
                        onChange={(event) =>
                          handleQuizAnswerChange(question.id, event.target.value)
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button type="submit" className="btn" disabled={!canSubmitQuiz}>
              Submit answers
            </button>
          </form>
          {quizDone && quizCorrect && (
            <p className="success">Correct answers (+10 STON)</p>
          )}
          {quizDone && !quizCorrect && (
            <p className="error">Not quite. Reward was not added.</p>
          )}
        </div>

        <div className="block final-block">
          <h2>4. Final</h2>
          <p className="earned">You earned {stonBalance} STON</p>
          {quizDone ? (
            <a
              className="btn btn-primary btn-link"
              href="https://app.ston.fi"
              target="_blank"
              rel="noreferrer"
            >
              Use in STON.fi
            </a>
          ) : (
            <button type="button" className="btn btn-primary" disabled>
              Use in STON.fi
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
