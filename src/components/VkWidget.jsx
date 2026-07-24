import { useEffect, useRef } from "react";

export default function VkWidget({ groupId }) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    let resizeTimer;

    function renderWidget() {
      if (!window.VK || !window.VK.Widgets || !wrapperRef.current) return;
      const width = Math.floor(wrapperRef.current.getBoundingClientRect().width);
      if (!width) return;

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

    // Пересчитываем ширину при изменении размера окна (например, поворот экрана на телефоне)
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderWidget, 300);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [groupId]);

  return (
    <div ref={wrapperRef}>
      <div id="vk_groups"></div>
    </div>
  );
}
