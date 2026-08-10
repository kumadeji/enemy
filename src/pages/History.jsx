import DiscordWidget from "../components/DiscordWidget";

export default function Media() {
  return (
    <main className="container">
      <h1>История сообщества</h1>
      <div className="card"><p className="text-justify">Пока что информации здесь нет. Вы можете найти её в чате <b>#о-нас</b> в Discord.</p><DiscordWidget /></div>
    </main>
  );
}
