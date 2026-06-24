import styles from "./WhoIsItFor.module.css";

const audiences = [
  "Audience point one",
  "Audience point two",
  "Audience point three",
  "Audience point four",
];

export default function WhoIsItFor() {
  return (
    <section
      id="who-is-it-for"
      className="w-full flex items-center justify-center px-6 py-20"
    >
      <div className="max-w-5xl w-full flex flex-col gap-12">
        <div className="flex flex-col items-center text-center gap-3">
          <h2 className={styles.heading}>Who Is It For?</h2>
          <p className={styles.subheading}>
            Audience qualification — helps visitor self-identify as a candidate.
          </p>
        </div>

        <ul className={styles.list}>
          {audiences.map((a) => (
            <li key={a} className={styles.listItem}>
              <span className={styles.check}>✓</span>
              {a}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
