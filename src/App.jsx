import { useEffect, useRef, useState } from "react";
import omnistonWidgetLoader from "@ston-fi/omniston-widget-loader";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

const QUIZ_QUESTIONS = [
  {
    id: "q1",
    textBeforeLink: "What is ",
    linkText: "STON.fi",
    linkUrl: "https://ston.fi",
    textAfterLink: "?",
    options: [
      "A centralized exchange for Bitcoin only",
      "A DeFi protocol on TON for swaps and liquidity",
      "An NFT gallery for event badges",
    ],
    correct: "A DeFi protocol on TON for swaps and liquidity",
  },
  {
    id: "q2",
    textBeforeLink: "What does ",
    linkText: "OMNISTON",
    linkUrl: "https://ston.fi/omniston",
    textAfterLink: " help users do?",
    options: [
      "a) Swap tokens across blockchains",
      "b) Build Telegram bots",
      "c) Make TON memes",
    ],
    correct: "a) Swap tokens across blockchains",
  },
  {
    id: "q3",
    textBeforeLink: "What is one of ",
    linkText: "OMNISTON",
    linkUrl: "https://ston.fi/omniston",
    textAfterLink: "'s main user goals?",
    options: [
      "a) Mining Bitcoin",
      "b) Selling NFTs",
      "c) Simplifying UX and removing unnecessary steps",
    ],
    correct: "c) Simplifying UX and removing unnecessary steps",
  },
];
const MAX_QUIZ_ATTEMPTS = 3;
const EVENT_QR_TOKENS = {
  "eventfi-demo-2026": "ston-qr-access",
};

export default function App() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const walletConnected = Boolean(wallet);
  const [checkedIn, setCheckedIn] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [showSwapWidget, setShowSwapWidget] = useState(false);
  const [swapWidgetLoading, setSwapWidgetLoading] = useState(false);
  const [swapWidgetError, setSwapWidgetError] = useState("");
  const [quizAnswers, setQuizAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
  });
  const [stonBalance, setStonBalance] = useState(0);
  const swapWidgetContainerRef = useRef(null);
  const swapWidgetRef = useRef(null);
  const finalBlockRef = useRef(null);
  const searchParams = new URLSearchParams(window.location.search);
  const eventId = searchParams.get("event");
  const eventToken = searchParams.get("token");
  const hasEventAccess =
    Boolean(eventId) && EVENT_QR_TOKENS[eventId] === eventToken;

  const canCheckIn = walletConnected && hasEventAccess && !checkedIn;
  const quizLocked = !quizPassed && quizAttempts >= MAX_QUIZ_ATTEMPTS;
  const quizResolved = quizPassed || quizLocked;
  const hasAllQuizAnswers = QUIZ_QUESTIONS.every(
    (question) => quizAnswers[question.id] !== ""
  );
  const canSubmitQuiz = checkedIn && !quizResolved && hasAllQuizAnswers;

  const scrollToFinalBlock = (behavior = "smooth") => {
    if (!finalBlockRef.current) return;
    finalBlockRef.current.scrollIntoView({ behavior, block: "start" });
  };

  const keepFinalBlockInView = () => {
    if (!finalBlockRef.current) return;
    const rect = finalBlockRef.current.getBoundingClientRect();
    const isAboveViewport = rect.top < 0;
    const isBelowViewport = rect.bottom > window.innerHeight;
    if (isAboveViewport || isBelowViewport) {
      scrollToFinalBlock("auto");
    }
  };

  const handleConnectWallet = () => {
    tonConnectUI.openModal();
  };

  const handleDisconnectWallet = async () => {
    await tonConnectUI.disconnect();
    setCheckedIn(false);
    setQuizPassed(false);
    setQuizAttempts(0);
    setQuizFeedback("");
    setShowSwapWidget(false);
    setSwapWidgetLoading(false);
    setSwapWidgetError("");
    setQuizAnswers({ q1: "", q2: "", q3: "" });
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
    const nextAttempts = quizAttempts + 1;
    setQuizAttempts(nextAttempts);

    if (isCorrect) {
      setQuizPassed(true);
      setQuizFeedback("Correct answers (+10 STON)");
      setStonBalance((current) => current + 10);
      return;
    }

    const attemptsLeft = MAX_QUIZ_ATTEMPTS - nextAttempts;
    if (attemptsLeft > 0) {
      const attemptWord = attemptsLeft === 1 ? "attempt" : "attempts";
      setQuizFeedback(`Not quite. Try again (${attemptsLeft} ${attemptWord} left).`);
    } else {
      setQuizFeedback("Not quite. No attempts left.");
    }
  };

  const handleQuizAnswerChange = (questionId, value) => {
    setQuizAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  useEffect(() => {
    if (!quizPassed || !showSwapWidget || !tonConnectUI) return undefined;

    let isMounted = true;
    setSwapWidgetLoading(true);
    setSwapWidgetError("");

    omnistonWidgetLoader
      .load()
      .then((OmnistonWidgetConstructor) => {
        if (!isMounted || !swapWidgetContainerRef.current) return;

        swapWidgetRef.current = new OmnistonWidgetConstructor({
          tonconnect: {
            type: "integrated",
            instance: tonConnectUI,
          },
          widget: {
            defaultBidAsset: "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO",
            defaultAskAsset: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
          },
        });

        swapWidgetRef.current.mount(swapWidgetContainerRef.current);
        setSwapWidgetLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setSwapWidgetLoading(false);
        setSwapWidgetError(
          "Could not load the in-page widget. Please open STON.fi in a new tab."
        );
      });

    return () => {
      isMounted = false;
      if (swapWidgetRef.current) {
        swapWidgetRef.current.unmount();
        swapWidgetRef.current = null;
      }
      if (swapWidgetContainerRef.current) {
        swapWidgetContainerRef.current.innerHTML = "";
      }
    };
  }, [quizPassed, showSwapWidget, tonConnectUI]);

  useEffect(() => {
    if (!quizPassed || !finalBlockRef.current) return;
    scrollToFinalBlock("smooth");
  }, [quizPassed]);

  useEffect(() => {
    if (!showSwapWidget) return;
    const timer = window.setTimeout(() => {
      keepFinalBlockInView();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [showSwapWidget]);

  const walletLabel = wallet?.account?.address
    ? `${wallet.account.address.slice(0, 4)}...${wallet.account.address.slice(-4)}`
    : "Wallet Connected";

  let flowStep = 4;
  if (!walletConnected) flowStep = 1;
  else if (!checkedIn) flowStep = 2;
  else if (!quizResolved) flowStep = 3;

  return (
    <main className="page">
      <section className="card">
        <h1 className="sr-only">EventFi</h1>
        <div className="brand">
          <img className="brand-logo" src="/eventfi-logo.png" alt="EventFi logo" />
        </div>

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

        <div className={`block quiz-block ${quizPassed ? "quiz-success" : ""}`}>
          <h2>3. Mini Quiz</h2>
          <p className="attempts">
            Attempts used: {quizAttempts}/{MAX_QUIZ_ATTEMPTS}
          </p>
          <form onSubmit={handleQuizSubmit}>
            {QUIZ_QUESTIONS.map((question, index) => (
              <div key={question.id} className="quiz-item">
                <p className="question">
                  {index + 1}. {question.textBeforeLink}
                  <a
                    className="question-link"
                    href={question.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {question.linkText}
                  </a>
                  {question.textAfterLink}
                </p>
                <div className="quiz-list">
                  {question.options.map((option) => (
                    <label key={option} className="radio-item">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={quizAnswers[question.id] === option}
                        disabled={!checkedIn || quizResolved}
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
          {quizPassed && <p className="success">{quizFeedback}</p>}
          {!quizPassed && quizFeedback && <p className="error">{quizFeedback}</p>}
        </div>

        <div ref={finalBlockRef} className="block final-block">
          <h2>4. Final</h2>
          <p className="earned">You earned {stonBalance} STON</p>
          {quizPassed && (
            <p className="final-note">
              Yes, you were absolutely right: OMNISTON is built for simplifying
              UX and removing unnecessary steps. See for yourself.
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!quizPassed}
            onClick={() =>
              setShowSwapWidget((current) => {
                const next = !current;
                if (!next) {
                  setSwapWidgetLoading(false);
                  setSwapWidgetError("");
                }
                if (next) {
                  window.setTimeout(() => {
                    keepFinalBlockInView();
                  }, 40);
                }
                return next;
              })
            }
          >
            {showSwapWidget ? "Hide swap" : "Try swap in STON.fi"}
          </button>
          {quizPassed && showSwapWidget && (
            <>
              <div
                className="swap-shell"
                onPointerDownCapture={keepFinalBlockInView}
                onTouchStartCapture={keepFinalBlockInView}
                onFocusCapture={keepFinalBlockInView}
              >
                <div className="swap-widget-frame">
                  <div ref={swapWidgetContainerRef} className="swap-widget-container" />
                  {swapWidgetLoading && (
                    <p className="swap-loading">Loading STON.fi swap widget...</p>
                  )}
                </div>
              </div>
              {swapWidgetError && <p className="error">{swapWidgetError}</p>}
              <p className="helper">
                Widget blocked?{" "}
                <a
                  className="helper-link"
                  href="https://app.ston.fi/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open STON.fi in a new tab
                </a>
              </p>
              <p className="final-subnote">
                Wallet session is reused from EventFi. Full automatic swap works
                after rewards are distributed on-chain.
              </p>
            </>
          )}
          {!quizPassed && (
            <p className="helper">
              Complete the quiz with correct answers to unlock swap mode.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
