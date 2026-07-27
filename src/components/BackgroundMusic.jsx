import { useEffect, useRef, useState } from "react";

const VOLUME = 0.02; // 5%, как и требовалось
const STORAGE_KEY = "enemy_music_muted";

export default function BackgroundMusic() {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(() => {
    // Запоминаем выбор пользователя между визитами на сайт
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = VOLUME;

    if (muted) return; // пользователь ранее сам отключил музыку — не навязываем её

    // Пытаемся включить сразу при загрузке страницы
    const tryPlay = () => audio.play().catch(() => {
      /* Браузер заблокировал автовоспроизведение со звуком —
         это ожидаемо, дождёмся первого взаимодействия пользователя ниже */
    });
    tryPlay();

    // Если авто-старт не удался — запускаем при первом клике/тапе/нажатии клавиши
    // где угодно на странице (разрешённый браузерами способ включить звук)
    function handleFirstInteraction() {
      if (!muted) tryPlay();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    }
    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [muted]);

  function toggleMuted() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(STORAGE_KEY, String(next));

    const audio = audioRef.current;
    if (!audio) return;
    if (next) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  return (
    <>
      <audio ref={audioRef} src="/audio/theme.mp3" loop preload="auto" />
      <button
        className="music-toggle-btn"
        onClick={toggleMuted}
        title={muted ? "Включить музыку" : "Выключить музыку"}
        aria-label={muted ? "Включить музыку" : "Выключить музыку"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </>
  );
}
