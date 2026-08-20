import { Link } from "react-router-dom";

export default function ArmaHQ() {
  return (
    <main className="container">
      <h1>Штаб Arma Reforger</h1>
      <p className="page-lead">Раздел для навигации по инструментам направления Arma Reforger. Пока доступен один инструмент — очередь на КО, но раздел будет наполняться.</p>
      <div className="card">
        <Link to="/hq/arma/stats" className="btn secondary">Клановая статистика</Link>
      </div>
      <div className="card">
        <Link to="/queue" className="btn hq-primary-btn">Очередь на командира отделения</Link>
      </div>
    </main>
  );
}
