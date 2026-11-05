import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Gamepad2, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CharacterIllustration } from "../../components/character/Character";

const FEATURES = [
  {
    icon: Gamepad2,
    title: "Learn by Playing",
    text: "Turn coding concepts into exciting missions and interactive challenges.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Skills",
    text: "Build your problem-solving skills one achievement at a time.",
  },
  {
    icon: Bot,
    title: "Learn with AI",
    text: "Get helpful hints and encouraging explanations when you need a little guidance.",
  },
];

const STEPS = [
  {
    title: "Choose your character.",
    text: "Pick the coder you want to be on your adventure.",
  },
  {
    title: "Complete coding missions.",
    text: "Follow the path, solve puzzles, and guide your character.",
  },
  {
    title: "Unlock achievements and grow your skills.",
    text: "Every solved mission makes you a little bit stronger.",
  },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="cb-page">
      <header className="cb-landing-header">
        <div className="cb-container cb-landing-header-inner">
          <Link to="/" className="cb-brand-mark" aria-label="CodeBloom home">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M7 8L3 12L7 16" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 8L17 12L13 16" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <nav className="cb-landing-nav" aria-label="Landing">
            <Link to="/#features">Features</Link>
            <Link to="/#how">How it works</Link>
            <Link to="/login">Sign In</Link>
          </nav>
          <div className="cb-flex">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/register")}>Get Started</Button>
          </div>
        </div>
      </header>

      <section className="cb-landing-hero">
        <div className="cb-container cb-landing-hero-inner">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              Big ideas start with little lines of code.
            </motion.h1>
            <motion.p
              className="cb-hero-lead"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
            >
              Explore exciting coding missions, solve puzzles, and grow your skills one discovery at a time.
            </motion.p>
            <motion.div
              className="cb-hero-actions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: "easeOut" }}
            >
              <Button size="lg" onClick={() => navigate("/register")}>
                Start Your Adventure
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/app/missions")}>
                Explore Missions
              </Button>
            </motion.div>
          </div>
          <div className="cb-hero-art" aria-hidden>
            <CharacterIllustration character="girl" className="" style={{ maxHeight: 380 }} />
            <span className="cb-hero-chip cb-hero-chip-1">&lt;/&gt; move forward</span>
            <span className="cb-hero-chip cb-hero-chip-2">Grow</span>
          </div>
        </div>
      </section>

      <section id="features" className="cb-landing-section">
        <div className="cb-container">
          <div className="cb-landing-section-head">
            <h2>Everything you need to fall in love with coding</h2>
            <p>Playful missions, friendly feedback, and a coach who believes in you.</p>
          </div>
          <div className="cb-feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="cb-feature-card">
                <span className="cb-feature-icon">
                  <f.icon size={26} aria-hidden />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="cb-landing-section" style={{ paddingTop: 0 }}>
        <div className="cb-container">
          <div className="cb-landing-section-head">
            <h2>How it works</h2>
            <p>Three simple steps to your first program.</p>
          </div>
          <div className="cb-steps">
            {STEPS.map((s, i) => (
              <article key={s.title} className="cb-step">
                <span className="cb-step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cb-landing-cta">
        <div className="cb-container">
          <h2>Your coding adventure starts here.</h2>
          <p>Join CodeBloom today and help Bloom grow the garden.</p>
          <Button size="lg" onClick={() => navigate("/register")}>
            Join CodeBloom
          </Button>
        </div>
      </section>

      <footer className="cb-landing-footer">
        <div className="cb-container cb-landing-footer-inner">
          <div>
            <strong>CodeBloom</strong>
            <p className="cb-body-text" style={{ marginBottom: 0 }}>
              An Uncommon Dot Org learning experience. Learn. Create. Grow.
            </p>
          </div>
          <nav className="cb-footer-links" aria-label="Footer">
            <a href="#">Privacy</a>
            <a href="#">Help</a>
            <Link to="/login">Sign In</Link>
          </nav>
          <small className="cb-muted">© {new Date().getFullYear()} Uncommon Dot Org. All rights reserved.</small>
        </div>
      </footer>
    </div>
  );
}
