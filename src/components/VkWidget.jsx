import { useEffect } from "react";

export default function VkWidget({ groupId }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://vk.com/js/api/openapi.js?169";
    script.async = true;
    script.onload = () => {
      if (window.VK) {
        window.VK.Widgets.Group("vk_groups", { mode: 4, no_cover: 0 }, groupId);
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [groupId]);

  return <div id="vk_groups"></div>;
}
