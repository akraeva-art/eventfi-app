import { useState } from "react";

const QUIZ_OPTIONS = [
  "A centralized exchange for Bitcoin only",
  "A DeFi protocol on TON for swaps and liquidity",
  "An NFT gallery for event badges",
];

const CORRECT_ANSWER = QUIZ_OPTIONS[1];

export default function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [stonBalance, setStonBalance] = useState(0);

  const canCheckIn = walletConnected && !checkedIn;
  const canSubmitQuiz = checkedIn && !quizDone && selectedAnswer !== "";

  const handleConnectWallet = () => {
    setWalletConnected(true);
  };

  const handleCheckIn = () => {
    if (!canCheckIn) return;
    setCheckedIn(true);
    setStonBalance((current) => current + 10);
  };

  const handleQuizSubmit = (event) => {
    event.preventDefault();
    if (!canSubmitQuiz) return;

    const isCorrect = selectedAnswer === CORRECT_ANSWER;
    setQuizDone(true);
    setQuizCorrect(isCorrect);
    if (isCorrect) {
      setStonBalance((current) => current + 10);
    }
  };

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
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConnectWallet}
            disabled={walletConnected}
          >
            {walletConnected ? "Wallet Connected" : "Connect Wallet"}
          </button>
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
          {checkedIn && <p className="success">Badge unlocked</p>}
        </div>

        <div className="block">
          <h2>3. Mini Quiz</h2>
          <p className="question">What is STON.fi?</p>
          <form onSubmit={handleQuizSubmit}>
            <div className="quiz-list">
              {QUIZ_OPTIONS.map((option) => (
                <label key={option} className="radio-item">
                  <input
                    type="radio"
                    name="quiz"
                    value={option}
                    checked={selectedAnswer === option}
                    disabled={!checkedIn || quizDone}
                    onChange={(event) => setSelectedAnswer(event.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <button type="submit" className="btn" disabled={!canSubmitQuiz}>
              Submit answer
            </button>
          </form>
          {quizDone && quizCorrect && (
            <p className="success">Correct answer (+10 STON)</p>
          )}
          {quizDone && !quizCorrect && (
            <p className="error">Not quite. Reward was not added.</p>
          )}
        </div>

        <div className="block final-block">
          <h2>4. Final</h2>
          <p className="earned">You earned {stonBalance} STON</p>
          <button type="button" className="btn btn-primary" disabled={!quizDone}>
            Use in STON.fi
          </button>
        </div>
      </section>
    </main>
  );
}
