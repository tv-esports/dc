import crypto from 'crypto';
import { client } from '..';

const progressBarLength = 10;

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
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGxoa3RvNm0zZnZxbG45OHR3YTMwMXM4d3VlMng2bnVzZ2YzY29rbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/o75ajIFH0QnQC3nCeD/200.webp",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHZtZm5icHFxbmNlNWVjMXRwYmkzMm5neHUwbm1ycTd5ajM3MGhkcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BrxCPbnWV7pvqiffdi/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjFpZGN6MTU2Z3NyYmRubzBrZzc3MXBnem4xb2YzbXpyY2Q4YW1saSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dFZAA2mUFWFC35mzQy/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXU5cWQyaXIwajgwdzdiaDBrc2VmOTBvN3o2bWxrZXc4anZuM2phMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/EHDBBTY9mUxwtHMzOB/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaHVmaTdmams3bXY3dHRobXJiM290Nm8yNHlmZm5paHAybGo4bGpuYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Jir7AUookJHIVb5aYM/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMW1sdjFxZm02bndjOHdneGlzdnpua2dyNWx6YTZzbHJ3ZjhlajVubSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4HodBpDmoMA5p9bG/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXBldGh4MzU3M3RuZHA4cmN1OTBraHY0bWlxb3RuejEybnhhcWg0aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/11uArCoB4fkRcQ/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3h4aG81dGg2MzIwNjVnczIwcmZjNmpxczhqMGFtZm12MGVycjBheCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3JNILOuA7SuDU3X5nk/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTZkbjh5d3FmM2E2NTN2ajJiOXVvNnJocjJjcjQxejczYTFodnhzNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TEFplLVRDMWBi/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2VleTd4NmljMTJuc3RpMnJ3dGJ6N3BlMTg4cHdrenRkYTd4ZnVtbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26u4exk4zsAqPcq08/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWIwM21qZzg0bGRhNWM4N21tdTM5ZjY5b3dqZnUwbDQwbno2cDhoNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6nuiJjOOQBBn2/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjNld3JmcWNldHpla2xlOGR0MWlpNnY2cWlraHY0MTVkbDBqMHJsbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/K3raI0cXTkzNC/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzkzeHMwZjJrZ253NzY2N3o2d3VxZWd2N3hzd2E3d3RrNXRpaXZ2ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9KVGaO2v0xzfIPMA/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXd0eW4xMDF0N2pldzFlbXFnbzV6enZrM3J3dnExbDBnNDg1MXl3eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/klxOW1G2uiVYg8axes/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdXBrc3JzODBrc2M3ZWozanBvMzhtNnQydjNhaTk1bmEwdDBucnNhaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3FfYEVMs8hErBx4Okn/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeG9oZzNoNnBxNzdtOXVtd3Z6dnoxNWxka2ltZmFjcnoyaHppeHk3OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/rxtcfIprmkBA1g6kiL/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXZtbXZocDFldnlkeHhoeGVmejZleWZjdjZmaXdjMndlbnF5a2h1aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5PKQrJbDKMnxUeqgvT/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaHBheng3YnZ3bmkzem5xeDRtNjU5cm9la3NmaHZhbTh4aHgzZHg3OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/giRL7f2SiARXE0YO3y/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3N4M2xzYzg0YnVpaGdpNW4wcWU5ZXgzOXdwZ3Y2dDNhMWdldXVvayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7buil9QoX91N17Ow/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzh3MG9yM2o1MDJmNGpvY2FyZ3I5N3NidnVqOGVmdDE2M2lxM3FwdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPt3IEJbcqkff7a/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExemhzOWl3YTdkbnkyM3Z3cm9yeWpjaTNkbzZ4ZjI0em95d2VyaW5idyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2be3wzOOEh7rGTmGLo/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2V4c2ZienIxa2V5cDE3cGpwanQ5NzkxcWd5bGJxbWd0cjBqMGpreiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oz8xynJ88hmIdCCOI/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHAyMzh6bG8ycngxNmlmdXoyajg1dzlucnFwdnVsNGR4dzZkbTYyMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2JI9I2xDKW5To2uA/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHBqbXM3NnhpcXZscmFjNW1uMW04b3N5dTk4enN2bzQ1MW85djZzbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6AWP1xQ8PHz2TprBvq/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdzR4eHBtMGg2ZXlmMG9vdnE2amxreWgycThmbDRka25leGJ6Z3Q1ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/j08FAAf3VWaTssKtWt/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHJrM3N4eHZyc3Vqbm1ldDR3cmN5cWgzdHZ5MWxvYXBpZXU1eXptNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MuyRCJzb18cIIVyuQT/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExejc2Y2R5OG5zdTU3bmk1eWM0cXRqMW1tM2ZrdDVoZjc1aXM4em14bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/AL0XsYU0pkFTq/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWI2MDVneDc3d3p1M3VkbDl6Nnc1aHVhODUwZjd5djFuNHF2ZHh5eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/i157x7wHuLJvtTslX6/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3FwZ2x5cmtzaTF4ajJsaWJ4dGVybG9iZjF0cWUwOWJyOGhpc3NvaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/eKvlvkPEzPHihkIobL/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmRndGUyejM0NGtwZTlmNGN2NjF5YXg2cnF6azFocWhldWp0NDAyMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6vBm2wIoc1bdDj1eQT/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjZ3ZW9tOXB6ZW1vN2RvMHd2aWRrc2Q5aWU1N3AwbWttdzhveG1sNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/DpN931EVIzcEo/giphy.gif"
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

  // Add the start emoji
  progressBarArray.push(emojiMap.fillStart);

  // Calculate the progress within the full length of the bar
  const progressWithinBar = Math.min(progress, progressBarLength);

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
  { level: 51, xpRequired: 283475, role: '1186953493806845994' },
  { level: 52, xpRequired: 299130, role: '1186953493806845994' },
  { level: 53, xpRequired: 315350, role: '1186953493806845994' },
  { level: 54, xpRequired: 332145, role: '1186953493806845994' },
  { level: 55, xpRequired: 349525, role: '1186953493806845994' },
  { level: 56, xpRequired: 367500, role: '1186953493806845994' },
  { level: 57, xpRequired: 386080, role: '1186953493806845994' },
  { level: 58, xpRequired: 405275, role: '1186953493806845994' },
  { level: 59, xpRequired: 425095, role: '1186953493806845994' },
  { level: 60, xpRequired: 445550, role: '1186953493806845994' },
  { level: 61, xpRequired: 466650, role: '1186953493806845994' },
  { level: 62, xpRequired: 488405, role: '1186953493806845994' },
  { level: 63, xpRequired: 510825, role: '1186953493806845994' },
  { level: 64, xpRequired: 533920, role: '1186953493806845994' },
  { level: 65, xpRequired: 557700, role: '1186953493806845994' },
  { level: 66, xpRequired: 582175, role: '1186953493806845994' },
  { level: 67, xpRequired: 607355, role: '1186953493806845994' },
  { level: 68, xpRequired: 633250, role: '1186953493806845994' },
  { level: 69, xpRequired: 659870, role: '1186953493806845994' },
  { level: 70, xpRequired: 687225, role: '1186953493806845994' },
  { level: 71, xpRequired: 715325, role: '1186953493806845994' },
  { level: 72, xpRequired: 744180, role: '1186953493806845994' },
  { level: 73, xpRequired: 773800, role: '1186953493806845994' },
  { level: 74, xpRequired: 804195, role: '1186953493806845994' },
  { level: 75, xpRequired: 835375, role: '1186953493806845994' },
  { level: 76, xpRequired: 867350, role: '1186953493806845994' },
  { level: 77, xpRequired: 900130, role: '1186953493806845994' },
  { level: 78, xpRequired: 933725, role: '1186953493806845994' },
  { level: 79, xpRequired: 968145, role: '1186953493806845994' },
  { level: 80, xpRequired: 1003400, role: '1186953493806845994' },
  { level: 81, xpRequired: 1039500, role: '1186953493806845994' },
  { level: 82, xpRequired: 1076455, role: '1186953493806845994' },
  { level: 83, xpRequired: 1114275, role: '1186953493806845994' },
  { level: 84, xpRequired: 1152970, role: '1186953493806845994' },
  { level: 85, xpRequired: 1192550, role: '1186953493806845994' },
  { level: 86, xpRequired: 1233025, role: '1186953493806845994' },
  { level: 87, xpRequired: 1274405, role: '1186953493806845994' },
  { level: 88, xpRequired: 1316700, role: '1186953493806845994' },
  { level: 89, xpRequired: 1359920, role: '1186953493806845994' },
  { level: 90, xpRequired: 1404075, role: '1186953493806845994' },
  { level: 91, xpRequired: 1449175, role: '1186953493806845994' },
  { level: 92, xpRequired: 1495230, role: '1186953493806845994' },
  { level: 93, xpRequired: 1542250, role: '1186953493806845994' },
  { level: 94, xpRequired: 1590225, role: '1186953493806845994' },
  { level: 95, xpRequired: 1639175, role: '1186953493806845994' },
  { level: 96, xpRequired: 1689100, role: '1186953493806845994' },
  { level: 97, xpRequired: 1739995, role: '1186953493806845994' },
  { level: 98, xpRequired: 1791875, role: '1186953493806845994' },
  { level: 99, xpRequired: 1844750, role: '1186953493806845994' },
  { level: 100, xpRequired: 1898625, role: '1186953493806845994' },
];