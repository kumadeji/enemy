import { useState } from "react";

export default function YouTubeEmbed({ videoId, title = "Видео", thumbnail }) {
  const [loaded, setLoaded] = useState(false);

  // Если своя картинка не передана — используем официальное превью
  // самого YouTube (формат 1280×720, всегда 16:9)
  const thumbnailUrl = thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div className="yt-embed-wrapper">
      {loaded ? (
        <iframe
          className="yt-embed-iframe"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="yt-embed-overlay"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
          onClick={() => setLoaded(true)}
          aria-label={`Загрузить видео: ${title}`}
        >
          <span className="yt-embed-gradient" />
          <span className="yt-embed-play-icon">
            <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="yt-embed-text">Кликните, чтобы загрузить плеер</span>
        </button>
      )}
    </div>
  );
}
