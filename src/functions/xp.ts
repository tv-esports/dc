import crypto from 'crypto';
import { client } from '..';

const progressBarLength = 20;

export interface LevelRole {
  level: number;
  xpRequired: number;
  role: string;
}

export interface PrestigeLevelRole {
  prestige_level: number;
  xpRequired: number;
}

// Function to generate random XP
export function generateRandomXP(min: number, max: number): number {
  const range = max - min + 1;
  const randomBytes = crypto.randomBytes(4); // Using 4 bytes for randomness

  const randomNumber = randomBytes.readUInt32LE(0);
  const scaledNumber = (randomNumber % range) + min;

  return scaledNumber;
}

const randomGifsForLevelUp: string[] = [
  "https://media1.giphy.com/media/Jk4Sucdz1oGd2/200.webp?cid=790b7611hnl255ccm0xikwdg02nley7jrcj9a6kfgm5xrkla&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media1.giphy.com/media/Y9pvW54NNPRacOKg2D/200.webp?cid=790b7611hnl255ccm0xikwdg02nley7jrcj9a6kfgm5xrkla&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media2.giphy.com/media/PUBxelwT57jsQ/200.webp?cid=790b7611f8nogfkplwm0lhsw6hpwqabh830y4pjvjdfknx8v&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media1.giphy.com/media/1Zt3z4uEBPZQY/200.webp?cid=ecf05e47vxvhec5p8azrohepfpjdxbpebjggu3jmtc05h57v&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media0.giphy.com/media/455cAbMyB0cs3RyA3O/200.webp?cid=ecf05e47gbv5ekubu6ic7zrltjb7jj5zqx7ffn8xenkcpep4&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media4.giphy.com/media/sHytgXD2vlNVC/200.webp?cid=ecf05e47gbv5ekubu6ic7zrltjb7jj5zqx7ffn8xenkcpep4&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media0.giphy.com/media/xT0GqGUyFPeYYmYD5K/200.webp?cid=ecf05e47fspaze1qmkkmhw4ngybo221hfxtyofo1b0muan6k&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media1.giphy.com/media/HysKXGid5rAAbEemFL/200.webp?cid=790b7611cuc38puy653jnwzbwj23wxwwl8scia57o6naqh7q&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media3.giphy.com/media/rV3zQ64Fh0TpC/200.webp?cid=ecf05e47fgzq2p2793wkwkvdd6acm0wiwzhszakyv3k4hp3b&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media1.giphy.com/media/vFa3GwYAAAZyM/giphy.webp?cid=ecf05e47fgzq2p2793wkwkvdd6acm0wiwzhszakyv3k4hp3b&ep=v1_gifs_search&rid=giphy.webp&ct=g",
  "https://media4.giphy.com/media/87aJUHNmJ71Ix6pzRr/200.webp?cid=ecf05e47qmwwnwsix8z8cakaf4bb4lta8ulvo4qm0gs3eu6f&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media0.giphy.com/media/Ub4kWebdWWJP2/200.webp?cid=ecf05e479blhemqzyq2bzwpdarkry267lyicy1reauk5bgtl&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media3.giphy.com/media/uH7MRQvoBXWg0/200.webp?cid=ecf05e479ue100aip7w79lqmkwx0fde9xf7df38v065jr3z8&ep=v1_gifs_search&rid=200.webp&ct=g",
  "https://media4.giphy.com/media/3o6ZtmxW1RTRGn0qzK/200.webp?cid=ecf05e479ue100aip7w79lqmkwx0fde9xf7df38v065jr3z8&ep=v1_gifs_search&rid=200.webp&ct=g"
]

export function randomGif() {
  // use crypto to generate random gif
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32LE(0);
  const scaledNumber = (randomNumber % randomGifsForLevelUp.length);
  return randomGifsForLevelUp[scaledNumber];
}

export function progressBar(currentXP: number, xpRequired: number) {
  const progress = Math.floor((currentXP / xpRequired) * progressBarLength);
  const remaining = progressBarLength - progress;

  const validProgress = Math.min(Math.max(progress, 0), progressBarLength);
  const validRemaining = Math.min(Math.max(remaining, 0), progressBarLength);

  const progressBarString = generateEmojiProgressBar(validProgress, validRemaining);

  return `${progressBarString}`;
}

function generateEmojiProgressBar(progress: number, remaining: number) {
  const emojiMap = {
    fillStart: '<a:fillStart:1215366261572378636>',
    fillBar: '<a:fillBar:1215366260494311454>',
    fillEnd: '<a:fillEnd:1215366258988548248>',
    emptyBar: '<:emptyBar:1215366372012593162>',
    emptyStart: '<:emptyStart:1215378954983317524>',
    emptyEnd: '<:emptyEnd:1215378997626544128>',
  };

  const progressBarArray = [];

  // Calculate the progress within the full length of the bar
  const progressWithinBar = Math.min(progress, progressBarLength);

  // If progress exceeds the full length, add the start emoji
  if (progress > progressBarLength) {
    progressBarArray.push(emojiMap.fillStart);
  }

  for (let i = 0; i < progressWithinBar; i++) {
    progressBarArray.push(emojiMap.fillBar);
  }

  // If progress exceeds the full length, add the end emoji
  if (progress > progressBarLength) {
    progressBarArray.push(emojiMap.fillEnd);
  }

  // If progress is less than the full length, add remaining empty bars
  for (let i = 0; i < remaining; i++) {
    progressBarArray.push(emojiMap.emptyBar);
  }

  // Add the empty end emoji
  progressBarArray.push(emojiMap.emptyEnd);

  return progressBarArray.join('');
}

export function calculateXPForNextLevel(currentLevel: number) {
  const nextLevelData = levelRoles.find((role) => role.level === currentLevel + 1);

  if (nextLevelData) {
    return nextLevelData.xpRequired;
  } else {
    // Return a default value if the next level data is not found
    return -1; // You can return any default value indicating no next level or handle it accordingly
  }
}

export const levelRoles: LevelRole[] = [
  { level: 0, xpRequired: 100, role: '1184213602304016484' },
  { level: 1, xpRequired: 155, role: '1184213602304016484' },
  { level: 2, xpRequired: 220, role: '1184213602304016484' },
  { level: 3, xpRequired: 295, role: '1184213655173206157' },
  { level: 4, xpRequired: 380, role: '1184213655173206157' },
  { level: 5, xpRequired: 475, role: '1184213655173206157' },
  { level: 6, xpRequired: 580, role: '1184213655173206157' },
  { level: 7, xpRequired: 695, role: '1184213655173206157' },
  { level: 8, xpRequired: 820, role: '1184213655173206157' },
  { level: 9, xpRequired: 955, role: '1184213655173206157' },
  { level: 10, xpRequired: 1100, role: '1184213710831628401' },
  { level: 11, xpRequired: 1255, role: '1184213710831628401' },
  { level: 12, xpRequired: 1420, role: '1184213710831628401' },
  { level: 13, xpRequired: 1595, role: '1184213710831628401' },
  { level: 14, xpRequired: 1780, role: '1184213710831628401' },
  { level: 15, xpRequired: 1975, role: '1184213710831628401' },
  { level: 16, xpRequired: 2180, role: '1184213710831628401' },
  { level: 17, xpRequired: 2395, role: '1184213710831628401' },
  { level: 18, xpRequired: 2620, role: '1184213710831628401' },
  { level: 19, xpRequired: 2855, role: '1184213710831628401' },
  { level: 20, xpRequired: 3100, role: '1184213752992772247' },
  { level: 21, xpRequired: 3355, role: '1184213752992772247' },
  { level: 22, xpRequired: 3620, role: '1184213752992772247' },
  { level: 23, xpRequired: 3895, role: '1184213752992772247' },
  { level: 24, xpRequired: 4180, role: '1184213752992772247' },
  { level: 25, xpRequired: 4475, role: '1184213752992772247' },
  { level: 26, xpRequired: 4780, role: '1184213752992772247' },
  { level: 27, xpRequired: 5095, role: '1184213752992772247' },
  { level: 28, xpRequired: 5420, role: '1184213752992772247' },
  { level: 29, xpRequired: 5755, role: '1184213752992772247' },
  { level: 30, xpRequired: 6100, role: '1184213752992772247' },
  { level: 31, xpRequired: 6455, role: '1184213752992772247' },
  { level: 32, xpRequired: 6820, role: '1184213752992772247' },
  { level: 33, xpRequired: 7195, role: '1184213752992772247' },
  { level: 34, xpRequired: 7580, role: '1184213752992772247' },
  { level: 35, xpRequired: 7975, role: '1184213792230490263' },
  { level: 36, xpRequired: 8380, role: '1184213792230490263' },
  { level: 37, xpRequired: 8795, role: '1184213792230490263' },
  { level: 38, xpRequired: 9220, role: '1184213792230490263' },
  { level: 39, xpRequired: 9655, role: '1184213792230490263' },
  { level: 40, xpRequired: 10100, role: '1184213792230490263' },
  { level: 41, xpRequired: 10555, role: '1184213792230490263' },
  { level: 42, xpRequired: 11020, role: '1184213792230490263' },
  { level: 43, xpRequired: 11495, role: '1184213792230490263' },
  { level: 44, xpRequired: 11980, role: '1184213792230490263' },
  { level: 45, xpRequired: 12475, role: '1184213792230490263' },
  { level: 46, xpRequired: 12980, role: '1184213792230490263' },
  { level: 47, xpRequired: 13495, role: '1184213792230490263' },
  { level: 48, xpRequired: 14020, role: '1184213792230490263' },
  { level: 49, xpRequired: 14555, role: '1184213792230490263' },
  { level: 50, xpRequired: 15100, role: '1186953493806845994' },
];

// ///////////////////////////////////// for prestige system /////////////////////////////////////

export const prestigeLevelRoles: PrestigeLevelRole[] = [
  { prestige_level: 1, xpRequired: 1000 },
  { prestige_level: 2, xpRequired: 2300 },
  { prestige_level: 3, xpRequired: 3600 },
  { prestige_level: 4, xpRequired: 5000 },
  { prestige_level: 5, xpRequired: 6500 },
  { prestige_level: 6, xpRequired: 8150 },
  { prestige_level: 7, xpRequired: 9800 },
  { prestige_level: 8, xpRequired: 11500 },
  { prestige_level: 9, xpRequired: 13200 },
  { prestige_level: 10, xpRequired: 15000 },
]

export async function generatePrestigeLeaderboard(topUsers: string | any[], limit: any) {
  let prestigeLeaderboard = "```css\n"; // Using code block for a different visual style

  for (let i = 0; i < topUsers.length; i++) {
    const userTag = (await client.users.fetch(topUsers[i].userID))?.tag;
    let rank;
    switch (i) {
      case 0:
        rank = "🏴‍☠️"; // Emojis for ranking
        break;
      case 1:
        rank = "🏴‍☠️🏴‍☠️";
        break;
      case 2:
        rank = "🏴‍☠️🏴‍☠️🏴‍☠️";
        break;
      default:
        rank = `${i + 1}.`;
    }

    const currentXP = topUsers[i].prestige_xp; // Assuming the XP field for prestige users is 'prestige_xp'
    const currentLevel = topUsers[i].prestige_level; // Assuming the level field for prestige users is 'prestige_level'

    prestigeLeaderboard += `${rank} ${userTag}\n` +
      `  • Prestige Level: ${currentLevel}\n` +
      `  • Prestige XP: ${currentXP} xp\n` +
      "\n"; // Separate leaderboard entries
  }

  prestigeLeaderboard += "```";
  return prestigeLeaderboard;
}

export const calculateNextPrestigeLevel = (currentPrestigeLevel: number) => {
  const nextPrestigeLevelData = prestigeLevelRoles.find((role) => role.prestige_level === currentPrestigeLevel + 1);

  if (nextPrestigeLevelData) {
    return nextPrestigeLevelData.xpRequired;
  } else {
    // Return a default value if the next level data is not found
    return -1; // You can return any default value indicating no next level or handle it accordingly
  }
}