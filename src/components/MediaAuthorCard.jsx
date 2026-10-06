import { useState } from "react";
import { PLATFORMS } from "../data/mediaAuthors";

export default function MediaAuthorCard({ author }) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <section className="card author-card" style={{ "--author-color": author.color }}>
      <div className="author-card-banner" />

      <div className="author-card-head">
        {avatarFailed ? (
          <div className="author-avatar author-avatar-fallback">{author.name.charAt(0)}</div>
        ) : (
          <img
            className="author-avatar"
            src={author.avatar}
            alt={author.name}
            onError={() => setAvatarFailed(true)}
          />
        )}
        <div className="author-info">
          <div className="author-tag">[En-Y]</div>
          <h2 className="author-name">{author.name}</h2>
        </div>
      </div>

      <div className="author-links">
        {author.links.map(link => {
          const p = PLATFORMS[link.platform];
          if (!p) return null;
          const Icon = p.icon;
          const iconNode = p.iconSrc
            ? (
              <img
                src={p.iconSrc}
                alt=""
                className={p.fullBleed ? "author-link-img-full" : "author-link-img-pad"}
              />
            )
            : <Icon size={18} />;
          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="author-link-btn"
            >
              <span
                className="author-link-icon"
                style={{ background: p.background, color: p.glyphColor || "#fff" }}
              >
                {iconNode}
              </span>
              <span className="author-link-label">{p.label}</span>
              <span className="author-link-arrow">↗</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
