import DiscordWidget from "../components/DiscordWidget";
import MediaAuthorCard from "../components/MediaAuthorCard";
import { MEDIA_AUTHORS } from "../data/mediaAuthors";

export default function Media() {
  return (
    <main className="container">
      <h1>Видеоконтент в сообществе</h1>
      <p className="page-lead">
        Наши бойцы снимают видео и ведут трансляции по играм сообщества. Подписывайтесь на авторов!
      </p>

      {MEDIA_AUTHORS.map(author => (
        <MediaAuthorCard key={author.id} author={author} />
      ))}

      <p className="field-hint">
        * Instagram принадлежит компании Meta, которая признана экстремистской организацией
        и запрещена на территории РФ.
      </p>

      <div className="card">
        <h2>Больше контента</h2>
        <p className="hint">Весь контент от бойцов также собирается в чате <b>#ваш-контент</b> в Discord.</p>
        <DiscordWidget />
      </div>
    </main>
  );
}
