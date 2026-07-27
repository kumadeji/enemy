import { useEffect, useState } from "react";

const PAN_DURATION = 45000;   // сколько длится один плавный "пролёт" камеры, мс
const FADE_DURATION = 4000;   // сколько длится проявление/угасание, мс
const VISIBLE_OPACITY = 0.2;  // 20% видимости — как и требовалось

function randomPercent() {
  return Math.round(Math.random() * 100);
}

export default function BackgroundMap() {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [opacity, setOpacity] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);

  useEffect(() => {
    let fadeOutTimer;
    let nextCycleTimer;

    function startCycle() {
      // 1. Мгновенно телепортируемся в случайную стартовую точку, оставаясь невидимыми
      setTransitionEnabled(false);
      setOpacity(0);
      setPosition({ x: randomPercent(), y: randomPercent() });

      // 2. На следующем кадре включаем плавный переход:
      //    одновременно проявляемся и начинаем "лететь" к новой случайной точке
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
          setOpacity(VISIBLE_OPACITY);
          setPosition({ x: randomPercent(), y: randomPercent() });
        });
      });

      // 3. Незадолго до конца пролёта начинаем плавно угасать
      fadeOutTimer = setTimeout(() => {
        setOpacity(0);
      }, PAN_DURATION - FADE_DURATION);

      // 4. По завершении цикла — начинаем заново с новой случайной точки
      nextCycleTimer = setTimeout(startCycle, PAN_DURATION);
    }

    startCycle();

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(nextCycleTimer);
    };
  }, []);

  return (
    <div
      className="bg-map"
      style={{
        backgroundImage: "url(/backgrounds/topo-map.jpg)",
        backgroundPosition: `${position.x}% ${position.y}%`,
        opacity,
        transition: transitionEnabled
          ? `background-position ${PAN_DURATION}ms linear, opacity ${FADE_DURATION}ms ease-in-out`
          : "none"
      }}
    />
  );
}
