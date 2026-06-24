import styles from "./Services.module.css";

const services = [
  { title: "Service One", desc: "Brief description." },
  { title: "Service Two", desc: "Brief description." },
  { title: "Service Three", desc: "Brief description." },
  { title: "Service Four", desc: "Brief description." },
];

export default function Services() {
  return (
    <section
      id="services"
      className="w-full flex items-center justify-center px-6 py-20"
    >
      <div className="max-w-6xl w-full flex flex-col gap-12">
        <div className="flex flex-col items-center text-center gap-3">
          <h2 className={styles.heading}>Services</h2>
          <p className={styles.subheading}>4 service sections.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <div key={s.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{s.title}</h3>
              <p className={styles.cardDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
