import VkWidget from "../components/VkWidget";

export default function Home() {
  return (
    <main className="container">
      <h1>Игровое сообщество ENEMY</h1>

      <section className="card">
        <h2>О клане</h2>
        <p className="text-justify">
          В настоящий момент сайт обслуживает закрытое направление сообщества ENEMY —
          клан по игре <b>Arma Reforger</b>. Вступление в клан происходит по заявке
          с последующим рассмотрением администрацией. Играем по средам, пятницам, субботам
          и воскресеньям. Ценим дисциплину, тактику и командную работу.
        </p>
      </section>

      <section className="card vk-widget-card">
        <h2>Новости клана</h2>
        <p className="hint">Подписывайтесь на наше сообщество ВКонтакте!</p>
        <VkWidget groupId={92251650} />
      </section>
    </main>
  );
}
