import { useState } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

const QUIZ_OPTIONS = [
  "A centralized exchange for Bitcoin only",
  "A DeFi protocol on TON for swaps and liquidity",
  "An NFT gallery for event badges",
];

const CORRECT_ANSWER = QUIZ_OPTIONS[1];

export default function App() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const walletConnected = Boolean(wallet);
  const [checkedIn, setCheckedIn] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [stonBalance, setStonBalance] = useState(0);

  const canCheckIn = walletConnected && !checkedIn;
  const canSubmitQuiz = checkedIn && !quizDone && selectedAnswer !== "";

  const handleConnectWallet = () => {
    tonConnectUI.openModal();
  };

  const handleDisconnectWallet = async () => {
    await tonConnectUI.disconnect();
    setCheckedIn(false);
    setQuizDone(false);
    setQuizCorrect(false);
    setSelectedAnswer("");
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

    const isCorrect = selectedAnswer === CORRECT_ANSWER;
    setQuizDone(true);
    setQuizCorrect(isCorrect);
    if (isCorrect) {
      setStonBalance((current) => current + 10);
    }
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
            <>
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
              <p className="helper helper-warning">
                If Tonkeeper shows WATCH ONLY, switch to a regular wallet account
                to connect.
              </p>
            </>
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
