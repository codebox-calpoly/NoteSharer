import Link from "next/link";
import "./profile.css";

export default function ProfilePage() {
  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <div className="profile-kicker">Account</div>
          <h1 className="profile-title">Your profile</h1>
          <p className="profile-subtitle">
            Keep your details up to date and manage your activity.
          </p>
        </div>
        <div className="profile-avatar" aria-hidden="true">
          U
        </div>
      </header>

      <section className="profile-card">
        <div className="profile-row">
          <div>
            <div className="profile-label">Display name</div>
            <div className="profile-value">Username</div>
          </div>
          <button type="button" className="profile-action">
            Edit
          </button>
        </div>
        <div className="profile-divider" />
        <div className="profile-row">
          <div>
            <div className="profile-label">Email</div>
            <div className="profile-value">you@example.com</div>
          </div>
          <button type="button" className="profile-action">
            Update
          </button>
        </div>
      </section>

      <section className="profile-card profile-card-muted">
        <h2 className="profile-section-title">Quick actions</h2>
        <div className="profile-chip-row">
          <Link href="/upload" className="profile-chip">
            Upload notes
          </Link>
          <Link href="/dashboard" className="profile-chip">
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
