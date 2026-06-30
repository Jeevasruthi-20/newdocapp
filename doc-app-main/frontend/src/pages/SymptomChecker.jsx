import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SymptomChecker.css";

// ── Symptom → Specialist knowledge base ──────────────────────────────────────
const SYMPTOM_MAP = [
  {
    keywords: ["chest pain","chest tightness","heart","palpitation","shortness of breath","breathless","heartbeat","irregular heartbeat","chest pressure","arrhythmia","high blood pressure","hypertension","dizzy spells","fainting","angina","heart attack","swollen ankles","blue lips","tachycardia"],
    specialty: "Cardiologist",
    icon: "❤️",
    reason: "Your symptoms may be related to your heart or cardiovascular system.",
    urgency: "high",
    tip: "If you have sudden severe chest pain, call emergency services immediately.",
  },
  {
    keywords: ["headache","migraine","dizziness","seizure","numbness","tingling","memory","confusion","fainting","tremor","balance","stroke","brain fog","vertigo","concussion","paralysis","muscle weakness","slurred speech","neuralgia","nerve pain","epilepsy"],
    specialty: "Neurologist",
    icon: "🧠",
    reason: "Your symptoms suggest a possible neurological concern.",
    urgency: "medium",
    tip: "Keep track of when headaches occur and their intensity.",
  },
  {
    keywords: ["skin","rash","acne","itch","itching","hives","eczema","psoriasis","mole","hair loss","nail","blister","wound","burn","dandruff","rosacea","wart","melanoma","sunburn","scar","pigmentation","dry skin"],
    specialty: "Dermatologist",
    icon: "🩺",
    reason: "Your symptoms appear to be skin or dermatology related.",
    urgency: "low",
    tip: "Avoid scratching rashes to prevent infection.",
  },
  {
    keywords: ["fever","cold","flu","cough","fatigue","tired","weakness","infection","sore throat","runny nose","body ache","loss of appetite","general","chills","sweats","viral","bacterial","malaise","mild pain","checkup","stuffy nose","sneezing","phlegm","head cold"],
    specialty: "General Physician",
    icon: "🏥",
    reason: "Your symptoms suggest a general illness that a GP can evaluate.",
    urgency: "low",
    tip: "Rest well and stay hydrated while waiting for your appointment.",
  },
  {
    keywords: ["child","baby","infant","toddler","kids","vaccination","growth","pediatric","school","newborn","teething","croup","chickenpox","measles","diaper rash","childhood","bedwetting","milestones","colic"],
    specialty: "Pediatrician",
    icon: "👶",
    reason: "For children's health concerns, a pediatrician is the right choice.",
    urgency: "medium",
    tip: "Keep a record of your child's symptoms and temperature.",
  },
  {
    keywords: ["bone","joint","knee","back pain","spine","fracture","arthritis","muscle","shoulder","hip","ankle","wrist","sport","injury","swelling","stiffness","sprain","strain","ligament","tendon","sciatica","osteoporosis","neck pain","posture"],
    specialty: "Orthopedic Surgeon",
    icon: "🦴",
    reason: "Your symptoms point to a musculoskeletal or bone/joint issue.",
    urgency: "medium",
    tip: "Avoid putting weight on painful joints until examined.",
  },
  {
    keywords: ["eye","vision","blur","blind","glasses","contact lens","red eye","eye pain","floaters","light sensitivity","eye discharge","cataract","glaucoma","dry eye","stye","squint","double vision","conjunctivitis","pink eye"],
    specialty: "Ophthalmologist",
    icon: "👁️",
    reason: "Your symptoms relate to your eyes or vision.",
    urgency: "medium",
    tip: "Avoid rubbing your eyes and reduce screen time.",
  },
  {
    keywords: ["ear","hearing","tinnitus","ear pain","ear infection","deaf","balance","nose","sinus","throat","tonsil","snoring","voice","hoarse","nosebleed","loss of smell","swallowing","tonsillitis","vertigo","earwax"],
    specialty: "ENT Specialist",
    icon: "👂",
    reason: "Your symptoms relate to ear, nose, or throat concerns.",
    urgency: "low",
    tip: "Use a humidifier to ease sinus and throat symptoms.",
  },
  {
    keywords: ["stomach","nausea","vomiting","diarrhea","constipation","bloating","gas","acid","heartburn","liver","digestive","bowel","colon","ulcer","abdomen","indigestion","reflux","gerd","food poisoning","gallbladder","jaundice","ibs","stomach ache"],
    specialty: "Gastroenterologist",
    icon: "🫁",
    reason: "Your symptoms suggest a digestive or gastrointestinal issue.",
    urgency: "medium",
    tip: "Stick to bland foods like rice and toast until you see a doctor.",
  },
  {
    keywords: ["diabetes","thyroid","weight gain","weight loss","hormones","metabolism","adrenal","insulin","blood sugar","cholesterol","fatigue","excessive thirst","frequent urination","goiter","pcos","hot flashes","hormonal imbalance"],
    specialty: "Endocrinologist",
    icon: "⚗️",
    reason: "Your symptoms may be linked to hormonal or metabolic conditions.",
    urgency: "medium",
    tip: "Monitor your blood sugar levels and maintain a balanced diet.",
  },
  {
    keywords: ["anxiety","depression","stress","mental health","mood","panic","fear","sleep","insomnia","sad","hopeless","suicidal","trauma","ptsd","ocd","bipolar","adhd","eating disorder","schizophrenia","hallucination","grief"],
    specialty: "Psychiatrist",
    icon: "🧘",
    reason: "Your symptoms relate to mental health and emotional wellbeing.",
    urgency: "medium",
    tip: "You're not alone. Speaking with a professional is a brave first step.",
  },
  {
    keywords: ["urine","kidney","bladder","uti","urinary","prostate","urination","blood in urine","frequent urination","burning urination","kidney stone","incontinence","pelvic pain","erectile","testicular"],
    specialty: "Urologist",
    icon: "🫀",
    reason: "Your symptoms suggest a urinary tract or kidney concern.",
    urgency: "medium",
    tip: "Drink plenty of water and avoid holding urine for too long.",
  },
  {
    keywords: ["period","periods","flow","menstruation","menstrual","pregnancy","pregnant","cramps","vaginal","pcos","bleeding","uterus","ovary","menopause","contraception","fertility","fibroid","endometriosis","discharge","pelvic pain","maternity","periods flow is high","heavy flow","heavy period","irregular periods"],
    specialty: "Gynecologist",
    icon: "🚺",
    reason: "Your symptoms relate to women's reproductive health.",
    urgency: "medium",
    tip: "Keep track of your cycle and any irregularities to share with your doctor.",
  },
  {
    keywords: ["lung","asthma","breathing","coughing blood","pneumonia","bronchitis","copd","tuberculosis","wheezing","apnea","chest cold","respiratory","oxygen","inhaler"],
    specialty: "Pulmonologist",
    icon: "🫁",
    reason: "Your symptoms suggest a respiratory or lung issue.",
    urgency: "medium",
    tip: "If you are struggling to breathe, seek emergency care immediately.",
  }
];

function analyzeSymptoms(text) {
  const lower = text.toLowerCase();
  const scores = SYMPTOM_MAP.map((entry) => {
    const matchCount = entry.keywords.filter((kw) => lower.includes(kw)).length;
    return { ...entry, matchCount };
  });
  const best = scores.sort((a, b) => b.matchCount - a.matchCount)[0];
  return best.matchCount > 0 ? best : null;
}

const SUGGESTIONS = [
  "I have a headache and dizziness",
  "My child has fever and cough",
  "I feel chest pain and shortness of breath",
  "I have a rash on my arm",
  "My knee is swollen and painful",
  "I feel anxious and can't sleep",
  "I have stomach pain and nausea",
  "My eye is red and blurry",
];

const TypingDots = () => (
  <div className="typing-dots">
    <span /><span /><span />
  </div>
);

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "bot",
      text: "👋 Hi! I'm your AI health assistant. Describe your symptoms and I'll recommend the right specialist for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [result, setResult] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    setResult(null);

    setMessages((prev) => [...prev, { id: Date.now(), from: "user", text: userText }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const found = analyzeSymptoms(userText);

      if (!found) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            from: "bot",
            text: "I'm sorry, I couldn't identify a specialist based on what you described. Could you give me more detail about your symptoms?",
          },
        ]);
      } else {
        setResult(found);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            from: "bot",
            text: `Based on your symptoms, I recommend seeing a **${found.specialty}**. ${found.reason}`,
            result: found,
          },
        ]);
      }
    }, 1400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="symptom-page">
      {/* Hero */}
      <div className="symptom-hero">
        <div className="symptom-hero-inner">
          <div className="hero-badge">🤖 AI-Powered</div>
          <h1>Symptom Checker</h1>
          <p>Describe how you feel and get an instant recommendation for the right specialist — no guessing required.</p>
        </div>
        <div className="floating-orb orb1" />
        <div className="floating-orb orb2" />
      </div>

      <div className="symptom-layout">
        {/* Left: Chat */}
        <div className="chat-panel">
          <div className="chat-header">
            <div className="bot-avatar">🤖</div>
            <div>
              <h3>MedBot</h3>
              <span className="online-dot" /> <small>Online — Ready to help</small>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-wrap ${msg.from}`}>
                {msg.from === "bot" && <div className="bot-icon">🤖</div>}
                <div className={`chat-bubble ${msg.from}`}>
                  {msg.text.split("**").map((part, i) =>
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  )}
                  {msg.result && (
                    <div className="inline-result">
                      <span className="result-icon">{msg.result.icon}</span>
                      <div>
                        <strong>{msg.result.specialty}</strong>
                        <br />
                        <small>{msg.result.tip}</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble-wrap bot">
                <div className="bot-icon">🤖</div>
                <div className="chat-bubble bot">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          <div className="suggestions-bar">
            {SUGGESTIONS.slice(0, 4).map((s) => (
              <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>

          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              rows={2}
              placeholder="e.g. I have a headache and feel dizzy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || isTyping}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right: Result card + Info */}
        <div className="result-panel">
          {result ? (
            <div className="result-card animated-in">
              <div className={`urgency-banner urgency-${result.urgency}`}>
                {result.urgency === "high" ? "⚠️ Seek care soon" : result.urgency === "medium" ? "📋 Schedule soon" : "✅ Non-urgent"}
              </div>
              <div className="result-specialty-icon">{result.icon}</div>
              <h2>{result.specialty}</h2>
              <p className="result-reason">{result.reason}</p>
              <div className="result-tip">
                <span>💡</span>
                <p>{result.tip}</p>
              </div>
              <button
                className="book-now-btn"
                onClick={() => navigate("/doctors")}
              >
                Book an Appointment →
              </button>
              <button className="try-again-btn" onClick={() => { setResult(null); inputRef.current?.focus(); }}>
                Check Different Symptoms
              </button>
            </div>
          ) : (
            <div className="info-panel">
              <h3>How it works</h3>
              <div className="how-steps">
                <div className="how-step">
                  <div className="step-num">1</div>
                  <div>
                    <strong>Describe Symptoms</strong>
                    <p>Type how you feel in plain language — no medical terms needed.</p>
                  </div>
                </div>
                <div className="how-step">
                  <div className="step-num">2</div>
                  <div>
                    <strong>AI Analysis</strong>
                    <p>Our engine matches your symptoms to the right medical specialty.</p>
                  </div>
                </div>
                <div className="how-step">
                  <div className="step-num">3</div>
                  <div>
                    <strong>Book Instantly</strong>
                    <p>One click to book with the recommended specialist.</p>
                  </div>
                </div>
              </div>

              <div className="specialty-grid">
                <h4>Specialists Available</h4>
                <div className="spec-chips">
                  {SYMPTOM_MAP.map((s) => (
                    <span key={s.specialty} className="spec-chip">
                      {s.icon} {s.specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="disclaimer">
                ⚕️ <strong>Disclaimer:</strong> This tool provides general guidance only. Always consult a qualified doctor for medical advice.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
