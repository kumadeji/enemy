import DiscordWidget from "../components/DiscordWidget";

export default function Media() {
  return (
    <main className="container">
      <h1>Контакты сообщества</h1>
      <div className="card"><p className="text-justify">Пока что информации здесь нет. Но вы можете обратиться к любому, у кого есть роль 'Комбат ArmA' или 'Зам. комбата ArmA' в Discord.</p><DiscordWidget /></div>
    </main>
  );
}
