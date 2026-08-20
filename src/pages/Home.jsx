import VkWidget from "../components/VkWidget";
import DiscordWidget from "../components/DiscordWidget";

export default function Home() {
  return (
    <main className="container">
      <h1>Мультиигровое сообщество ENEMY</h1>

      <section className="card">
        <h2>О сообществе</h2>
        <p className="text-justify">
          <b>Добро пожаловать, бойцы!</b>
		  <br/><br/>
		  Это наш сайт. Пока что сайт обслуживает только закрытое направление сообщества — клан по игре <b>Arma Reforger</b>.
		  <br/>
		  Игры в <b>Arma Reforger</b> с одной жизнью проходят по пятницам, субботам и воскресеньям.
		  <br/><br/>
		  <b>Подавайте заявку и вступайте в наш клан! Мы ждём вас!</b>
		  <br/>
        </p>
      </section>
	  
	  <section className="card">
        <h2>Общение</h2>
		<p className="hint">Регистрация в сообществе происходит на этом сайте, но мы общаемся в Discord!</p>
		<DiscordWidget />
	  </section>

      <section className="card">
        <h2>Новости</h2>
        <p className="hint">Подписывайтесь на нас во ВКонтакте и следите за новостями сообщества!</p>
        <VkWidget groupId={92251650} />
      </section>
    </main>
  );
}
