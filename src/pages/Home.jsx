import VkWidget from "../components/VkWidget";

export default function Home() {
  return (
    <main className="container">
      <h1>[Название клана]</h1>
      <section className="card">
        <h2>О клане</h2>
        <p>Мы — сообщество игроков в Arma Reforger, DayZ и Squad. Играем по пятницам, субботам и воскресеньям.</p>
      </section>
      <section className="card">
        <h2>Новости клана</h2>
        <VkWidget groupId={ВАШ_GROUP_ID} />
      </section>
    </main>
  );
}
