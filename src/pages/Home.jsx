import VkWidget from "../components/VkWidget";

export default function Home() {
  return (
    <main className="container">
      <h1>Мультиигровое сообщество ENEMY</h1>

      <section className="card">
        <h2>О сообществе</h2>
        <p className="text-justify">
          <b>Добро пожаловать, бойцы!</b>
		  <br/><br/>
		  Это наш сайт. Пока что он ещё пустоватый и сыроватый, но со временем он будет наполняться!
		  <br/>
		  Пока что сайт обслуживает только закрытое направление сообщества - клан по игре <b>Arma Reforger</b>.
		  <br/>
		  Игры в <b>Arma Reforger</b> с одной жизнью проходят по пятницам, субботам и воскресеньям.
		  <br/><br/>
		  <b>Подавайте заявку и вступайте в наш клан! Мы ждём вас!</b>
        </p>
      </section>

      <section className="card">
        <h2>Новости сообщества</h2>
        <p className="hint">Подписывайтесь на нас во ВКонтакте!</p>
        <VkWidget groupId={92251650} />
      </section>
    </main>
  );
}
