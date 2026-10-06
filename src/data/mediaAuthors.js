import { SiTwitch, SiKick, SiVk, SiYoutube, SiInstagram, SiTiktok } from "react-icons/si";

// Описание платформ: подпись, иконка и фон плашки под иконкой
export const PLATFORMS = {
  vkvideo:   { label: "VK Видео Live", iconSrc: "/platform-icons/vkvideo.svg", fullBleed: true, background: "transparent" },
  vk:        { label: "VK",            icon: SiVk,        background: "#0077ff" },
  twitch:    { label: "Twitch",        icon: SiTwitch,    background: "#9146ff" },
  kick:      { label: "Kick",          icon: SiKick,      background: "#53fc18", glyphColor: "#0b0e0f" },
  rutube:    { label: "Rutube",        iconSrc: "/platform-icons/rutube.svg", fullBleed: true, background: "transparent" },
  youtube:   { label: "YouTube",       icon: SiYoutube,   background: "#ff0000" },
  instagram: { label: "Instagram*",    icon: SiInstagram, background: "linear-gradient(135deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)" },
  tiktok:    { label: "TikTok",        icon: SiTiktok,    background: "#111111" }
};


export const MEDIA_AUTHORS = [
  {
    id: "burbon",
    name: "BURBON",
    avatar: "/avatars/burbon.jpg",
    color: "#ff7373",
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
    color: "#ffb146",
    links: [
      { platform: "youtube", url: "https://youtube.com/@Vlad_Maker/" },
      { platform: "tiktok",  url: "https://tiktok.com/@vlad_maker_armareforger" }
    ]
  },
  {
    id: "boba",
    name: "Boba",
    avatar: "/avatars/boba.jpg",
    color: "#81b543",
    links: [
      { platform: "twitch",    url: "https://twitch.tv/potatolyosha" },
      { platform: "youtube",   url: "https://youtube.com/@potatolyosha" },
      { platform: "instagram", url: "https://instagram.com/potatolyosha" },
      { platform: "tiktok",    url: "https://tiktok.com/@potatolyosha" }
    ]
  }
];
