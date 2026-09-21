import styles from "./SeoContent.module.scss";

const features = [
  {
    title: "Design every detail",
    description:
      "Choose a solid color or gradient, adjust module and finder-pattern rounding, and set the exact SVG size.",
  },
  {
    title: "Add a center image",
    description:
      "Place a logo or image in the center and use the built-in readability warning to keep the code scannable.",
  },
  {
    title: "Export a clean SVG",
    description:
      "Download a lightweight vector QR code that stays sharp on websites, labels, packaging, posters, and print.",
  },
] as const;

const questions = [
  {
    question: "Is SVG QR Builder free?",
    answer: "Yes. You can create and download SVG QR codes without an account or watermark.",
  },
  {
    question: "Do the generated QR codes expire?",
    answer:
      "No. The content is encoded directly in the downloaded QR code, so it does not depend on a redirect or subscription.",
  },
  {
    question: "Is my QR code content uploaded?",
    answer: "No. QR code generation and customization run locally in your browser.",
  },
  {
    question: "Why should I download a QR code as SVG?",
    answer:
      "SVG is a vector format, so the QR code stays sharp when scaled for screens, labels, posters, and print.",
  },
] as const;

export function SeoContent() {
  return (
    <section className={styles.section} lang="en" dir="ltr" aria-labelledby="about-svg-qr-builder">
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Free · private · no sign-up</p>
        <h2 id="about-svg-qr-builder">Create a custom QR code and download it as SVG</h2>
        <p>
          SVG QR Builder is a free online QR code generator for creating scalable, print-ready
          vector files. Enter a URL or text, customize the design, check the live preview, and
          download the finished QR code. Everything is generated locally in your browser.
        </p>
      </div>

      <div className={styles.features} aria-label="SVG QR Builder features">
        {features.map((feature) => (
          <article key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>

      <div className={styles.guide}>
        <h2>How to make an SVG QR code</h2>
        <ol>
          <li>Enter the URL, text, or other content you want the QR code to contain.</li>
          <li>Choose the color, gradient, size, rounding, and error-correction level.</li>
          <li>Optionally add a background, padding, or a center image.</li>
          <li>Test the preview with a phone, then select “Download SVG”.</li>
        </ol>
      </div>

      <div className={styles.faq}>
        <h2>Frequently asked questions</h2>
        {questions.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>

      <p className={styles.footer}>
        Open source on{" "}
        <a href="https://github.com/avin/svg-qr-builder" rel="noreferrer">
          GitHub
        </a>
        .
      </p>
    </section>
  );
}
