import logo from "./Logo.jpg";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <img src={logo} alt="ENEMY" className="loading-logo" />
        <div className="loading-border"></div>
      </div>
    </div>
  );
}
