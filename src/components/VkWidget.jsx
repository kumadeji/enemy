import { useEffect, useRef } from "react";

export default function VkWidget({ groupId }) {
  const containerRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    function initWidget() {
      if (initialized.current) return;
      if (window.VK && window.VK.Widgets) {
        window.VK.Widgets.Group("vk_groups", {
          mode: 4,
          no_cover: 1,
          wide: 1,
          height: 800,
          color1: "2a2d31",
          color2: "ffffff",
          color3: "d69e2e"
        }, groupId);
        initialized.current = true;
      }
    }

    // Если скрипт уже когда-то был загружен (например, при возврате на страницу) —
    // просто инициализируем виджет повторно, не подгружая script заново.
    if (window.VK && window.VK.Widgets) {
      initWidget();
      return;
    }

    const existingScript = document.getElementById("vk-openapi-script");
    if (existingScript) {
      existingScript.addEventListener("load", initWidget);
      return () => existingScript.removeEventListener("load", initWidget);
    }

    const script = document.createElement("script");
    script.id = "vk-openapi-script";
    script.src = "https://vk.ru/js/api/openapi.js?168";
    script.async = true;
    script.onload = initWidget;
    document.head.appendChild(script);
  }, [groupId]);

  return <div id="vk_groups" ref={containerRef}></div>;
}
