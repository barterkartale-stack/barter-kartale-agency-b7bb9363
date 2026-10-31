import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Hand,
  Info,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import "./marketplace-demo.css";

type Guide = "retearn" | "barterkartale";

const demoOrderReference = "DEMO-4827";
const stepLabels: Record<Guide, string[]> = {
  retearn: [
    "Sample campaign",
    "Product preview",
    "Order practice",
    "Delivery status",
    "Return policy",
    "Sandbox complete",
  ],
  barterkartale: [
    "Sample campaign",
    "Product preview",
    "Order practice",
    "Delivery status",
    "Resale example",
  ],
};

const narration: Record<Guide, string[]> = {
  retearn: [
    "Review a fictional campaign card and its illustrative amounts.",
    "Explore the sample product page and scroll to the demo action.",
    "Enter the example order reference. Do not use a real order number.",
    "This is a simulated delivery update. No rating or proof upload is needed.",
    "Review the example return policy. Real eligibility depends on the retailer’s current terms.",
    "The practice flow is complete. No order, refund, or payment took place.",
  ],
  barterkartale: [
    "Review a fictional campaign card and its illustrative amounts.",
    "Explore the sample product page and scroll to the demo action.",
    "Enter the example order reference. Do not use a real order number.",
    "This is a simulated delivery update. No rating or proof upload is needed.",
    "Review an illustrative resale spread. It is not a guaranteed profit or a completed sale.",
  ],
};

export function MarketplaceDemo() {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [step, setStep] = useState(0);
  const [orderReference, setOrderReference] = useState(demoOrderReference);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [cue, setCue] = useState<"idle" | "invalid" | null>(null);
  const [warning, setWarning] = useState("");
  const [needsSwipe, setNeedsSwipe] = useState(false);
  const phoneScrollRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setCue("idle");
      setWarning("Need a hint? Scroll to the next highlighted demo action.");
    }, 4000);
  }, []);

  const markActivity = useCallback(() => {
    if (warningTimerRef.current !== null) window.clearTimeout(warningTimerRef.current);
    setCue(null);
    setWarning("");
    resetIdleTimer();
  }, [resetIdleTimer]);

  const showInvalidClick = useCallback(() => {
    if (warningTimerRef.current !== null) window.clearTimeout(warningTimerRef.current);
    setWrongClicks((count) => count + 1);
    setCue("invalid");
    setWarning("That area is not an action in this practice screen.");
    resetIdleTimer();
    warningTimerRef.current = window.setTimeout(() => {
      setCue(null);
      setWarning("");
    }, 2200);
  }, [resetIdleTimer]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current !== null) window.clearTimeout(warningTimerRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    if (
      !voiceEnabled ||
      !guide ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    )
      return;
    window.speechSynthesis.cancel();
    const line = narration[guide][Math.min(step, narration[guide].length - 1)];
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [guide, step, voiceEnabled]);

  const updateSwipeCue = useCallback(() => {
    const viewport = phoneScrollRef.current;
    const target = viewport?.querySelector<HTMLElement>("[data-demo-action]");
    if (!viewport || !target) {
      setNeedsSwipe(false);
      return;
    }
    const viewportRect = viewport.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setNeedsSwipe(
      targetRect.bottom > viewportRect.bottom - 16 || targetRect.top < viewportRect.top + 16,
    );
  }, []);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (phoneScrollRef.current) phoneScrollRef.current.scrollTop = 0;
      updateSwipeCue();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [guide, step, updateSwipeCue]);

  useEffect(() => {
    const handleResize = () => updateSwipeCue();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateSwipeCue]);

  const chooseGuide = (nextGuide: Guide) => {
    markActivity();
    setGuide(nextGuide);
    setStep(0);
    setOrderReference(demoOrderReference);
  };

  const advance = () => {
    if (!guide) return;
    markActivity();
    setStep((current) => Math.min(current + 1, stepLabels[guide].length - 1));
  };

  const resetDemo = () => {
    markActivity();
    setGuide(null);
    setStep(0);
    setOrderReference(demoOrderReference);
    setWrongClicks(0);
  };

  const scrollToAction = () => {
    const viewport = phoneScrollRef.current;
    const target = viewport?.querySelector<HTMLElement>("[data-demo-action]");
    if (!viewport || !target) return;
    const viewportRect = viewport.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const delta =
      targetRect.bottom > viewportRect.bottom
        ? targetRect.bottom - viewportRect.bottom + 22
        : targetRect.top - viewportRect.top - 18;
    viewport.scrollBy({ top: delta, behavior: "smooth" });
    markActivity();
  };

  const handlePhonePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, input, label, a, [role="button"]')) resetIdleTimer();
    else showInvalidClick();
  };

  const handleOrderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orderReference.trim()) return;
    advance();
  };

  const stepCount = guide ? stepLabels[guide].length : 0;
  const currentStepLabel = guide ? stepLabels[guide][step] : "Choose a sample guide";
  const phoneStepLabel = guide ? `STEP ${step + 1} OF ${stepCount}` : "CHOOSE A GUIDE";

  return (
    <section className="market-demo section-wrap" aria-labelledby="market-demo-title">
      <div className="market-demo__intro">
        <div className="eyebrow">
          <span className="eyebrow-line" /> INTERACTIVE SANDBOX
        </div>
        <h1 id="market-demo-title">
          Practice the process.
          <br />
          <em>Keep it transparent.</em>
        </h1>
        <p>
          A fictional, guided marketplace flow for exploring campaign steps. No retailer checkout,
          real orders, uploads, ratings, refunds, or payouts are involved.
        </p>
        <div className="market-demo__intro-actions">
          <button
            className="market-demo__utility"
            type="button"
            aria-pressed={voiceEnabled}
            onClick={() => {
              markActivity();
              setVoiceEnabled((enabled) => !enabled);
            }}
          >
            {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            {voiceEnabled ? "Voice guidance on" : "Voice guidance off"}
          </button>
          {guide && (
            <button className="market-demo__utility" type="button" onClick={resetDemo}>
              <RotateCcw size={14} /> Start over
            </button>
          )}
        </div>
      </div>

      <div className="market-demo__stage">
        <aside className="market-demo__side market-demo__side--steps" aria-label="Demo step list">
          <div className="market-demo__side-kicker">YOUR WALKTHROUGH</div>
          <h2>
            {guide
              ? guide === "retearn"
                ? "Ret-Earn sample"
                : "BarterKartale sample"
              : "Choose a guide"}
          </h2>
          <ol className="market-demo__step-list">
            {(guide
              ? stepLabels[guide]
              : [
                  "Choose a guide",
                  "Preview a sample item",
                  "Practice with demo details",
                  "Review a transparent outcome",
                ]
            ).map((label, index) => (
              <li
                key={label}
                className={
                  guide && index === step
                    ? "is-current"
                    : guide && index < step
                      ? "is-complete"
                      : ""
                }
                aria-current={guide && index === step ? "step" : undefined}
              >
                <span>
                  {guide && index < step ? <Check size={13} /> : String(index + 1).padStart(2, "0")}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
          <div className="market-demo__side-foot">
            <ShieldCheck size={16} />
            <span>
              Sandbox only
              <br />
              Nothing is sent or purchased.
            </span>
          </div>
        </aside>

        <div className="market-demo__phone-column">
          <div className="market-demo__device" aria-label="Interactive marketplace demo phone">
            <div className="market-demo__bezel">
              <div className="market-demo__notch" aria-hidden="true" />
              <div className="market-demo__statusbar">
                <span>9:41</span>
                <span className="market-demo__status-icons">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="market-demo__appbar">
                {guide ? (
                  <button type="button" onClick={resetDemo} aria-label="Back to guide selection">
                    <ArrowLeft size={16} />
                  </button>
                ) : (
                  <span className="market-demo__appbar-mark">
                    <Sparkles size={15} />
                  </span>
                )}
                <div>
                  <strong>BarterKartale</strong>
                  <small>Practice marketplace</small>
                </div>
                <span className="market-demo__sandbox-chip">DEMO</span>
              </div>
              <div
                ref={phoneScrollRef}
                className="market-demo__phone-scroll"
                tabIndex={0}
                aria-label="Scrollable demo phone content"
                onPointerDownCapture={handlePhonePointer}
                onClickCapture={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest('button, input, label, a, [role="button"]')) resetIdleTimer();
                }}
                onScroll={() => {
                  markActivity();
                  updateSwipeCue();
                }}
                onKeyDown={markActivity}
              >
                <div className="market-demo__screen-content">
                  <div className="market-demo__step-caption">
                    <span>{phoneStepLabel}</span>
                    <span className="market-demo__live-dot" />
                  </div>
                  {warning && (
                    <div className="market-demo__warning" role="status">
                      <Info size={14} />
                      {warning}
                    </div>
                  )}
                  {!guide && <GuideChooser onChoose={chooseGuide} />}
                  {guide && step === 0 && <CampaignPreview guide={guide} onContinue={advance} />}
                  {guide && step === 1 && <ProductPreview onContinue={advance} />}
                  {guide && step === 2 && (
                    <OrderPractice
                      reference={orderReference}
                      setReference={setOrderReference}
                      onSubmit={handleOrderSubmit}
                    />
                  )}
                  {guide && step === 3 && <DeliveryPractice onContinue={advance} />}
                  {guide === "retearn" && step === 4 && (
                    <ReturnPolicyPractice onContinue={advance} />
                  )}
                  {guide === "retearn" && step === 5 && <SandboxComplete onReset={resetDemo} />}
                  {guide === "barterkartale" && step === 4 && <ResaleOutcome onReset={resetDemo} />}
                  <div className="market-demo__phone-disclaimer">
                    <ShieldCheck size={13} />
                    <span>Fictional practice screen. No real transaction or verification.</span>
                  </div>
                </div>
                {needsSwipe && (
                  <div
                    className="market-demo__pointer market-demo__pointer--swipe"
                    aria-hidden="true"
                  >
                    <Hand size={30} />
                    <ArrowDown size={16} />
                  </div>
                )}
                {cue && !needsSwipe && (
                  <div
                    className={`market-demo__pointer market-demo__pointer--${cue}`}
                    aria-hidden="true"
                  >
                    <Hand size={30} />
                  </div>
                )}
              </div>
              <div className="market-demo__home-indicator" aria-hidden="true" />
            </div>
          </div>
          {needsSwipe && (
            <button className="market-demo__scroll-button" type="button" onClick={scrollToAction}>
              Scroll to the highlighted action <ArrowDown size={15} />
            </button>
          )}
        </div>

        <aside className="market-demo__side market-demo__side--notes" aria-label="Sandbox guidance">
          <div className="market-demo__note-card">
            <div className="market-demo__note-icon">
              <ShieldCheck size={18} />
            </div>
            <strong>Practice, not a live retailer</strong>
            <p>
              This walkthrough uses fictional details. Never enter a real order number or share
              account credentials, screenshots, or recordings here.
            </p>
          </div>
          <div className="market-demo__activity-card" aria-live="polite">
            <span>
              <Clock3 size={14} /> Activity guide
            </span>
            <strong>
              {cue === "invalid"
                ? "Try a highlighted button"
                : cue === "idle"
                  ? "A hint is ready"
                  : "Ready when you are"}
            </strong>
            <small>
              {wrongClicks} off-target {wrongClicks === 1 ? "tap" : "taps"} in this session
            </small>
          </div>
          {needsSwipe && (
            <button className="market-demo__side-scroll" type="button" onClick={scrollToAction}>
              Show next action <ArrowDown size={14} />
            </button>
          )}
          {guide && (
            <p className="market-demo__current-step">
              <span>Now viewing</span>
              {currentStepLabel}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function GuideChooser({ onChoose }: { onChoose: (guide: Guide) => void }) {
  return (
    <div className="market-demo__chooser">
      <div className="market-demo__welcome-icon">
        <Sparkles size={22} />
      </div>
      <p className="market-demo__eyebrow">A FICTIONAL PRACTICE FLOW</p>
      <h2>Choose your guide</h2>
      <p className="market-demo__copy">
        Explore two sample campaign formats in a no-purchase sandbox.
      </p>
      <button className="market-demo__guide-card" type="button" onClick={() => onChoose("retearn")}>
        <span className="market-demo__guide-number">OPTION A</span>
        <strong>Ret-Earn</strong>
        <span>Sample return-policy walkthrough</span>
        <ArrowRight size={17} />
      </button>
      <button
        className="market-demo__guide-card"
        type="button"
        onClick={() => onChoose("barterkartale")}
      >
        <span className="market-demo__guide-number">OPTION B</span>
        <strong>BarterKartale</strong>
        <span>Illustrative discount &amp; reselling</span>
        <ArrowRight size={17} />
      </button>
      <p className="market-demo__fine-print">
        For product education only. Not affiliated with any retailer.
      </p>
    </div>
  );
}

function CampaignPreview({ guide, onContinue }: { guide: Guide; onContinue: () => void }) {
  return (
    <div className="market-demo__panel">
      <span className="market-demo__eyebrow">SAMPLE GROUP POST</span>
      <h2>{guide === "retearn" ? "Ret-Earn sample brief" : "BarterKartale sample brief"}</h2>
      <p className="market-demo__copy">Fictional Studio Wireless Earbuds campaign.</p>
      <div className="market-demo__economics">
        <div>
          <span>{guide === "retearn" ? "Sample product price" : "Example total price"}</span>
          <strong>₹2,499</strong>
        </div>
        <div>
          <span>{guide === "retearn" ? "Illustrative cash reward" : "Example discount"}</span>
          <strong>{guide === "retearn" ? "₹450" : "₹349"}</strong>
        </div>
        {guide === "barterkartale" && (
          <div>
            <span>Example effective price</span>
            <strong>₹2,150</strong>
          </div>
        )}
      </div>
      <p className="market-demo__micro-note">
        All figures are fictional examples, not an offer or promise of earnings.
      </p>
      <button className="market-demo__primary" type="button" data-demo-action onClick={onContinue}>
        Open sample product <ArrowRight size={15} />
      </button>
    </div>
  );
}

function ProductPreview({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="market-demo__product-page">
      <div className="market-demo__store-banner">
        <span className="market-demo__store-mark">
          <Sparkles size={13} />
        </span>
        <span>DEMO MARKET</span>
        <span>Sample catalog</span>
      </div>
      <div
        className="market-demo__product-art"
        role="img"
        aria-label="Illustration of fictional wireless earbuds"
      >
        <span className="market-demo__bud market-demo__bud--left">
          <i />
        </span>
        <span className="market-demo__bud market-demo__bud--right">
          <i />
        </span>
        <span className="market-demo__art-orbit" />
      </div>
      <span className="market-demo__eyebrow">FICTIONAL PRODUCT</span>
      <h2>Studio Wireless Earbuds</h2>
      <p className="market-demo__copy">
        A made-up product preview created for this interactive practice flow.
      </p>
      <div className="market-demo__product-price">
        <span>Example price</span>
        <strong>₹2,499</strong>
      </div>
      <ul className="market-demo__product-details">
        <li>
          <Check size={14} /> Sample catalog listing
        </li>
        <li>
          <Check size={14} /> No retailer or checkout connection
        </li>
        <li>
          <Check size={14} /> No payment details requested
        </li>
      </ul>
      <div className="market-demo__product-spacer" aria-hidden="true" />
      <button className="market-demo__primary" type="button" data-demo-action onClick={onContinue}>
        Continue sample flow <ArrowRight size={15} />
      </button>
      <p className="market-demo__micro-note">
        This button advances the demo only. It will not buy or reserve an item.
      </p>
    </div>
  );
}

function OrderPractice({
  reference,
  setReference,
  onSubmit,
}: {
  reference: string;
  setReference: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="market-demo__panel">
      <div className="market-demo__panel-icon">
        <PackageCheck size={20} />
      </div>
      <span className="market-demo__eyebrow">SAMPLE ORDER DETAILS</span>
      <h2>Practice the order form</h2>
      <p className="market-demo__copy">
        Use the prefilled fictional reference below. This sandbox does not need screenshots or
        personal details.
      </p>
      <form className="market-demo__form" onSubmit={onSubmit}>
        <label htmlFor="demo-order-reference">Example order reference</label>
        <input
          id="demo-order-reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          autoComplete="off"
          maxLength={24}
        />
        <span className="market-demo__form-hint">
          DEMO-4827 is fictional. Do not enter a real retailer order ID.
        </span>
        <button
          className="market-demo__primary"
          type="submit"
          data-demo-action
          disabled={!reference.trim()}
        >
          Submit practice form <ArrowRight size={15} />
        </button>
      </form>
      <div className="market-demo__privacy-note">
        <ShieldCheck size={14} />
        <span>The example value stays in this page and is never submitted to a service.</span>
      </div>
    </div>
  );
}

function DeliveryPractice({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="market-demo__panel">
      <div className="market-demo__delivery-icon">
        <PackageCheck size={23} />
      </div>
      <span className="market-demo__eyebrow">SIMULATED DELIVERY STATUS</span>
      <h2>Sample item delivered</h2>
      <p className="market-demo__copy">
        This timeline is part of the demo. No delivery was arranged and no rating is required.
      </p>
      <div className="market-demo__timeline">
        <span className="is-done">
          <Check size={12} />
        </span>
        <div>
          <strong>Practice form received</strong>
          <small>Just now · local demo</small>
        </div>
      </div>
      <div className="market-demo__timeline">
        <span className="is-done">
          <Check size={12} />
        </span>
        <div>
          <strong>Delivery status simulated</strong>
          <small>No shipping data accessed</small>
        </div>
      </div>
      <div className="market-demo__feedback-note">
        <Info size={15} />
        <span>No public review, star rating, screenshot, or screen recording is requested.</span>
      </div>
      <button className="market-demo__primary" type="button" data-demo-action onClick={onContinue}>
        Continue walkthrough <ArrowRight size={15} />
      </button>
    </div>
  );
}

function ReturnPolicyPractice({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="market-demo__panel">
      <div className="market-demo__panel-icon">
        <RotateCcw size={20} />
      </div>
      <span className="market-demo__eyebrow">EXAMPLE RETURN-POLICY WALKTHROUGH</span>
      <h2>Check the policy first</h2>
      <p className="market-demo__copy">
        A real return depends on the retailer’s current policy, item condition, and order details.
        This example does not initiate a return.
      </p>
      <div className="market-demo__policy-card">
        <strong>In this fictional example</strong>
        <span>
          Review the retailer’s return window, eligibility, and refund method before making a
          purchase.
        </span>
      </div>
      <div className="market-demo__privacy-note">
        <ShieldCheck size={14} />
        <span>No refund request, recording, or payout is created in this practice screen.</span>
      </div>
      <button className="market-demo__primary" type="button" data-demo-action onClick={onContinue}>
        Finish sandbox <Check size={15} />
      </button>
    </div>
  );
}

function SandboxComplete({ onReset }: { onReset: () => void }) {
  return (
    <div className="market-demo__complete">
      <div className="market-demo__complete-icon">
        <BadgeCheck size={27} />
      </div>
      <span className="market-demo__eyebrow">PRACTICE COMPLETE</span>
      <h2>You finished the sample flow.</h2>
      <p>No order was placed, no return or refund was processed, and no money was transferred.</p>
      <div className="market-demo__complete-receipt">
        <span>Sandbox status</span>
        <strong>Completed · no transaction</strong>
      </div>
      <button className="market-demo__secondary" type="button" data-demo-action onClick={onReset}>
        <RotateCcw size={14} /> Choose another guide
      </button>
    </div>
  );
}

function ResaleOutcome({ onReset }: { onReset: () => void }) {
  return (
    <div className="market-demo__complete">
      <div className="market-demo__complete-icon">
        <Sparkles size={25} />
      </div>
      <span className="market-demo__eyebrow">ILLUSTRATIVE RESALE SPREAD</span>
      <h2>Example net difference</h2>
      <strong className="market-demo__profit">₹249</strong>
      <div className="market-demo__economics market-demo__economics--compact">
        <div>
          <span>Sample effective price</span>
          <strong>₹2,150</strong>
        </div>
        <div>
          <span>Hypothetical resale price</span>
          <strong>₹2,399</strong>
        </div>
      </div>
      <p>
        This is arithmetic for a fictional example, not a guaranteed profit or completed sale.
        Actual resale value can differ.
      </p>
      <button className="market-demo__secondary" type="button" data-demo-action onClick={onReset}>
        <RotateCcw size={14} /> Try another guide
      </button>
    </div>
  );
}
