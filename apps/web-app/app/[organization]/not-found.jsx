import Link from "next/link";

export default function OrganizationNotFound() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1.5rem",
        textAlign: "center",
        gap: "1rem",
      }}
    >
      <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", margin: 0 }}>
        Organization not found
      </h1>
      <p
        style={{
          maxWidth: "32rem",
          color: "#555",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        We couldn&apos;t find the organization you&apos;re looking for. It may
        have moved, or the link might have a typo.
      </p>
      <Link
        href="/"
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "9999px",
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Go to homepage
      </Link>
    </main>
  );
}
