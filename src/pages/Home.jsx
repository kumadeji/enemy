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
		  Это наш сайт. Пока что сайт обслуживает только закрытое направление сообщества — клан по игре <b>Arma Reforger</b>. Игры в <b>Arma Reforger</b> с одной жизнью проходят по пятницам, субботам и воскресеньям.
		  <br/><br/>
		  <b>Подавайте заявку и вступайте в наш клан! Мы ждём вас!</b>
		  <br/>
        </p>
      </section>
	  
	  <section className="card">
        <h2>Видео</h2>
		<p className="hint">Трейлер нашего клана в Arma Reforger:</p>
		<iframe width="560" height="315" src="https://www.youtube.com/embed/L372YQEQsWU?si=FqY47fCF6WQxpDaV" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
		<br/>
		<p className="hint">Как вступить в клан и начать играть с нами:</p>
		<iframe width="560" height="315" src="https://www.youtube.com/embed/bUZEPOiWbsE?si=g-4h_rtEM816YtFz" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
		<br/>
		<p className="hint">Ещё больше видео от наших соклановцев — в секции <Link to="/media">«Видео»</Link>!</p>
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
