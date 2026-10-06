// Описание платформ: подпись, фон и значок иконки-монограммы на кнопке
export const PLATFORMS = {
  vkvideo:   { label: "VK Видео",  glyph: "VK▶", background: "#0077ff" },
  twitch:    { label: "Twitch",    glyph: "TW",  background: "#9146ff" },
  kick:      { label: "Kick",      glyph: "K",   background: "#53fc18", glyphColor: "#0b0e0f" },
  rutube:    { label: "Rutube",    glyph: "RT",  background: "#1d2a4d" },
  vk:        { label: "ВКонтакте", glyph: "VK",  background: "#0077ff" },
  youtube:   { label: "YouTube",   glyph: "YT",  background: "#ff0000" },
  instagram: { label: "Instagram*", glyph: "IG", background: "linear-gradient(135deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)" },
  tiktok:    { label: "TikTok",    glyph: "TT",  background: "#111111" }
};

export const MEDIA_AUTHORS = [
  {
    id: "burbon",
    name: "BURBON",
    avatar: "/avatars/burbon.jpg",
    color: "#e0824f",
    links: [
      { platform: "vkvideo",   url: "https://live.vkvideo.ru/serega_burbon" },
      { platform: "twitch",    url: "https://twitch.tv/serega_burbon" },
      { platform: "kick",      url: "https://kick.com/serega-burbon" },
      { platform: "rutube",    url: "https://rutube.ru/channel/67951596/" },
      { platform: "vk",        url: "https://vk.ru/serega_burbon_enemy" },
      { platform: "youtube",   url: "https://www.youtube.com/@serega_burbon_enemy" },
      { platform: "instagram", url: "https://instagram.com/serega_burbon_enemy" },
      { platform: "tiktok",    url: "https://tiktok.com/@serega_burbon_enemy" }
    ]
  },
  {
    id: "maker",
    name: "MAKER",
    avatar: "/avatars/maker.jpg",
    color: "#4bb8c4",
    links: [
      { platform: "youtube", url: "https://youtube.com/@Vlad_Maker/" },
      { platform: "tiktok",  url: "https://tiktok.com/@vlad_maker_armareforger" }
    ]
  },
  {
    id: "boba",
    name: "Boba",
    avatar: "/avatars/boba.jpg",
    color: "#a68bc4",
    links: [
      { platform: "twitch",    url: "https://twitch.tv/potatolyosha" },
      { platform: "youtube",   url: "https://youtube.com/@potatolyosha" },
      { platform: "instagram", url: "https://instagram.com/potatolyosha" },
      { platform: "tiktok",    url: "https://tiktok.com/@potatolyosha" }
    ]
  }
];
