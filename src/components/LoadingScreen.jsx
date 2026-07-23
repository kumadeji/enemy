import logo from "./Logo.jpg";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-ring"></div>
        <img src={logo} alt="ENEMY" className="loading-logo" />
        <p className="loading-text">ENEMY</p>
      </div>
    </div>
  );
}
