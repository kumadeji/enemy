import { useEffect, useRef, useState } from "react";

const MAX_RETRIES = 3;
const CHECK_DELAY_MS = 3000;  // сколько ждём после рендера, прежде чем проверить результат
const RETRY_DELAY_MS = 1200;

export default function VkWidget({ groupId }) {
  const wrapperRef = useRef(null);
  const attemptRef = useRef(0);
  const checkTimerRef = useRef(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let resizeTimer;
    let cancelled = false;

    function clearWidgetContainer() {
      const container = document.getElementById("vk_groups");
      if (container) container.innerHTML = "";
    }

    // Настоящий виджет сообщества всегда содержит номер группы в адресе
    // своего iframe. Если его там нет — VK вместо виджета отдал
    // страницу-заглушку (обычно это просто главная vk.com/vk.ru).
    function isWidgetRenderedCorrectly() {
      const container = document.getElementById("vk_groups");
      if (!container) return false;
      const iframe = container.querySelector("iframe");
      return !!(iframe && iframe.src && iframe.src.includes(String(groupId)));
    }

    function scheduleHealthCheck() {
      clearTimeout(checkTimerRef.current);
      checkTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        if (isWidgetRenderedCorrectly()) {
          attemptRef.current = 0;
          setBroken(false);
          return;
        }
        if (attemptRef.current < MAX_RETRIES) {
          attemptRef.current += 1;
          setTimeout(() => { if (!cancelled) forceReload(); }, RETRY_DELAY_MS);
        } else {
          setBroken(true);
        }
      }, CHECK_DELAY_MS);
    }

    function renderWidget() {
      if (!window.VK || !window.VK.Widgets || !wrapperRef.current) return;
      const width = Math.floor(wrapperRef.current.getBoundingClientRect().width);
      if (!width) return;

      clearWidgetContainer();
      setBroken(false);

      window.VK.Widgets.Group("vk_groups", {
        mode: 4,
        no_cover: 1,
        wide: 1,
        width: width,
        height: 800,
        color1: "2a2d31",
        color2: "ffffff",
        color3: "d69e2e"
      }, groupId);

      scheduleHealthCheck();
    }

    // Полная перезагрузка скрипта VK "с нуля", без переиспользования
    // старого (возможно, повреждённого) состояния window.VK — именно
    // застрявшее старое состояние чаще всего и приводит к тому, что
    // виджет откатывается на обычную страницу vk.com вместо ленты группы.
    function forceReload() {
      const existing = document.getElementById("vk-openapi-script");
      if (existing) existing.remove();
      try { delete window.VK; } catch { window.VK = undefined; }

      const script = document.createElement("script");
      script.id = "vk-openapi-script";
      script.src = `https://vk.ru/js/api/openapi.js?168&_retry=${Date.now()}`;
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }

    function loadScriptThenRender() {
      if (window.VK && window.VK.Widgets) {
        renderWidget();
        return;
      }
      const existing = document.getElementById("vk-openapi-script");
      if (existing) {
        existing.addEventListener("load", renderWidget);
        return;
      }
      const script = document.createElement("script");
      script.id = "vk-openapi-script";
      script.src = "https://vk.ru/js/api/openapi.js?168";
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }

    loadScriptThenRender();

    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderWidget, 300);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
      clearTimeout(checkTimerRef.current);
    };
  }, [groupId]);

  return (
    <div ref={wrapperRef}>
      <div id="vk_groups"></div>
      {broken && (
        <p className="field-hint">
          Не удалось загрузить виджет новостей ВКонтакте (иногда это происходит
          по вине самого ВКонтакте). Загляните в группу напрямую:{" "}
          <a href={`https://vk.com/club${groupId}`} target="_blank" rel="noreferrer">
            vk.com/club{groupId}
          </a>
        </p>
      )}
    </div>
  );
}
