"use client";

import { useState } from "react";
import { toastError, toastSuccess } from "@/lib/ui/notify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./Contact.module.css";

const TOPICS = [
  { value: "", label: "Choose a topic" },
  { value: "general", label: "General inquiry" },
  { value: "medical", label: "Medical or treatment question" },
  { value: "billing", label: "Billing & insurance" },
  { value: "partnership", label: "Partnership or press" },
  { value: "feedback", label: "Feedback" },
];

const CONTACT_FAQS = [
  {
    question: "How quickly will I hear back?",
    answer:
      "Our care team responds to general messages within one business day. Members can also reach us 24/7 inside their account for urgent treatment questions.",
  },
  {
    question: "What if my question is medical or urgent?",
    answer:
      "Please do not use this form for medical emergencies — call 911 or go to your nearest ER. For non-urgent medical questions, members can message their physician directly from the portal.",
  },
  {
    question: "Can I get personalized treatment advice here?",
    answer:
      "No. This page is for general inquiries only. Personalized GLP-1 evaluations and prescriptions require a consult with a licensed Ongo physician.",
  },
];

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Please enter your name.";
  if (!form.email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "That doesn't look like a valid email.";
  }
  if (!form.topic) errors.topic = "Please pick a topic.";
  if (!form.message.trim() || form.message.trim().length < 10) {
    errors.message = "Message should be at least 10 characters.";
  }
  return errors;
}

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [openFaq, setOpenFaq] = useState(0);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus("success");
      toastSuccess("Message sent", "Our care team will reply within one business day.");
      setForm({ name: "", email: "", topic: "", message: "" });
    } catch (err) {
      console.error("Contact form failed", err);
      setStatus("error");
      toastError("Could not send your message", "Please try again in a moment.");
    }
  };

  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* ============================================
            HERO
            ============================================ */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>GET IN TOUCH</p>
            <h1 className={styles.heading}>
              We&apos;d love to{" "}
              <span className={styles.headingAccent}>hear from you</span>
            </h1>
            <p className={styles.subcopy}>
              Questions about the program, your treatment, or just want to say
              hi? Our care team usually replies within one business day.
            </p>
          </div>
        </section>

        {/* ============================================
            FORM + INFO PANEL
            ============================================ */}
        <section className={styles.formSection}>
          <div className={styles.formContainer}>
            {/* LEFT — form card */}
            <form
              className={styles.formCard}
              onSubmit={handleSubmit}
              noValidate
            >
              <header className={styles.formHeader}>
                <h2 className={styles.formTitle}>Send us a message</h2>
                <p className={styles.formIntro}>
                  Fill in the fields below and we&apos;ll route your question to
                  the right team.
                </p>
              </header>

              {status === "success" && (
                <div className={styles.alertSuccess} role="status">
                  <span aria-hidden="true">✓</span>
                  <span>
                    Thanks — your message is in. We&apos;ll be in touch shortly.
                  </span>
                </div>
              )}
              {status === "error" && Object.keys(errors).length === 0 && (
                <div className={styles.alertError} role="alert">
                  <span aria-hidden="true">!</span>
                  <span>
                    Something went wrong sending your message. Please try again
                    or email us directly.
                  </span>
                </div>
              )}

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor="contact-name" className={styles.label}>
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={`${styles.input} ${
                      errors.name ? styles.inputError : ""
                    }`}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "err-name" : undefined}
                  />
                  {errors.name && (
                    <span id="err-name" className={styles.fieldError}>
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="contact-email" className={styles.label}>
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={`${styles.input} ${
                      errors.email ? styles.inputError : ""
                    }`}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "err-email" : undefined}
                  />
                  {errors.email && (
                    <span id="err-email" className={styles.fieldError}>
                      {errors.email}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-topic" className={styles.label}>
                  Topic
                </label>
                <select
                  id="contact-topic"
                  value={form.topic}
                  onChange={(e) => updateField("topic", e.target.value)}
                  className={`${styles.input} ${styles.select} ${
                    errors.topic ? styles.inputError : ""
                  }`}
                  aria-invalid={!!errors.topic}
                  aria-describedby={errors.topic ? "err-topic" : undefined}
                >
                  {TOPICS.map((t) => (
                    <option key={t.value} value={t.value} disabled={!t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {errors.topic && (
                  <span id="err-topic" className={styles.fieldError}>
                    {errors.topic}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-message" className={styles.label}>
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Tell us a bit about what you're looking for..."
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  className={`${styles.input} ${styles.textarea} ${
                    errors.message ? styles.inputError : ""
                  }`}
                  aria-invalid={!!errors.message}
                  aria-describedby={
                    errors.message ? "err-message" : undefined
                  }
                />
                {errors.message && (
                  <span id="err-message" className={styles.fieldError}>
                    {errors.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className={styles.submit}
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Sending…" : "Send message →"}
              </button>

              <p className={styles.formFinePrint}>
                By submitting, you agree to be contacted by Ongo Weight Loss.
                We&apos;ll never share your details.
              </p>
            </form>

            {/* RIGHT — info panel */}
            <aside className={styles.infoPanel} aria-label="Contact information">
              <div className={styles.infoCard}>
                <span className={styles.infoBadge}>
                  <span className={styles.infoDot} aria-hidden="true" />
                  Care Team Online
                </span>

                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Email us</span>
                  <a
                    href="mailto:info@ongoweightloss.com"
                    className={styles.infoLink}
                  >
                    info@ongoweightloss.com
                  </a>
                </div>

                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Call us</span>
                  <a href="tel:+18886555267" className={styles.infoLink}>
                    +1 (888) 655-5267
                  </a>
                </div>

                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Support hours</span>
                  <p className={styles.infoText}>
                    Mon–Fri · 8am – 8pm ET
                    <br />
                    Members get 24/7 messaging in the portal.
                  </p>
                </div>

                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Based in</span>
                  <p className={styles.infoText}>
                    New York, NY
                    <br />
                    Serving patients across the U.S.
                  </p>
                </div>

                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Follow us</span>
                  <div className={styles.socialRow}>
                    <a
                      className={`${styles.socialBtn} ${styles.socialInstagram}`}
                      href="https://www.instagram.com/ongoweightloss/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.212 8.8 2.2 12 2.2zm0 3.063A4.935 4.935 0 1 1 12 16.935 4.935 4.935 0 0 1 12 7.065zm0 8.135A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4zm6.27-8.34a1.152 1.152 0 1 1-2.304 0 1.152 1.152 0 0 1 2.304 0z" />
                      </svg>
                    </a>
                    <a
                      className={`${styles.socialBtn} ${styles.socialYoutube}`}
                      href="https://www.youtube.com/@ongoweightlossusa"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                    <a
                      className={`${styles.socialBtn} ${styles.socialYelp}`}
                      href="https://www.yelp.com/biz/ongo-weight-loss-new-york/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Yelp"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M20.16 12.594l-1.89-.612c-1.518-.486-2.484.18-2.484.18-.378.234-.36.72-.36.72l.018 4.86s.054.504.378.702c.378.234.846 0 .846 0l3.708-2.916s.36-.27.378-.738c.018-.396-.252-.81-.594-.972zM14.166 9.81c.486.612 1.404.072 1.404.072L19.692 7.5s.414-.27.45-.738c.054-.378-.234-.864-.234-.864-.234-.396-2.808-3.078-3.69-3.762-.378-.288-.792-.198-.792-.198-.486.072-.738.504-.738.504l-2.07 3.564c-.918 1.512-.612 2.376-.612 2.376.144.504.522.81 1.236 1.224.36.198.738.108.738.108zM10.602 11.43c.27-.486.252-1.026.252-1.026.072-1.566-.252-4.842-.504-6.696-.144-.99-.45-1.314-.846-1.476-.594-.234-1.314-.018-1.314-.018-2.124.45-4.554 1.404-6.012 2.358-.504.342-.738.81-.738.81-.27.594.072 1.116.072 1.116l5.526 8.046s.486.738 1.062.738c.45 0 .846-.36 1.296-.756l1.206-3.096zM10.692 14.058l-3.69 2.034s-.414.252-.504.738c-.108.504.198.99.198.99 1.494 2.358 4.05 4.014 4.05 4.014.504.288.972.198.972.198.504-.072.81-.45.81-.45l.27-.252v-6.444s-.018-.378-.36-.612c-.45-.288-.99-.27-.99-.27-.252.018-.756.054-.756.054zM18.864 18.738c-.378-.972-3.708-4.392-3.708-4.392s-.378-.378-.72-.252c-.27.09-.45.252-.594.612-.18.45-.072 4.842-.054 4.95.018.108.054.54.342.756.36.27.954.144.954.144l3.276-.918s.504-.198.612-.522c.108-.36-.108-.378-.108-.378z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className={styles.mapCard} aria-hidden="true">
                <span className={styles.mapPin}>📍</span>
                <span className={styles.mapText}>Map placeholder</span>
              </div>
            </aside>
          </div>
        </section>

        {/* ============================================
            CONTACT FAQ SNIPPET
            ============================================ */}
        <section className={styles.faqSection}>
          <div className={styles.faqContainer}>
            <header className={styles.faqHeader}>
              <p className={styles.eyebrow}>QUICK ANSWERS</p>
              <h2 className={styles.faqHeading}>
                Before you{" "}
                <span className={styles.headingAccent}>reach out</span>
              </h2>
            </header>

            <div className={styles.accordion}>
              {CONTACT_FAQS.map((faq, i) => {
                const isOpen = i === openFaq;
                return (
                  <article
                    key={i}
                    className={`${styles.faqItem} ${
                      isOpen ? styles.faqItemOpen : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.faqTrigger}
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`contact-faq-${i}`}
                    >
                      <span className={styles.faqQuestion}>{faq.question}</span>
                      <span className={styles.faqIcon} aria-hidden="true">
                        <span className={styles.faqIconBar} />
                        <span
                          className={`${styles.faqIconBar} ${styles.faqIconBarVertical}`}
                        />
                      </span>
                    </button>
                    <div
                      id={`contact-faq-${i}`}
                      className={styles.faqPanel}
                      role="region"
                    >
                      <p className={styles.faqAnswer}>{faq.answer}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
