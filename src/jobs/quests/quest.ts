import cron from 'node-cron';
import UserModel from '../../models/user/user';

const quests = [
    { quest_name: "Add 20 reactions to messages", goal: 20, reward_xp: 90 },
    { quest_name: "Send 80 messages", goal: 80, reward_xp: 200 },
    { quest_name: "Send five images", goal: 5, reward_xp: 30 },
    { quest_name: "Play three guess the number games", goal: 3, reward_xp: 120 },
    { quest_name: "Open two loot drops", goal: 2, reward_xp: 50 },
    { quest_name: "Play one wof game", goal: 1, reward_xp: 20 },
    { quest_name: "Buy an item from the shop", goal: 1, reward_xp: 200 },
    { quest_name: "Redeem two vouchers", goal: 2, reward_xp: 80 },
    { quest_name: "Risk it at the lootdrop", goal: 1, reward_xp: 50 },
    { quest_name: "Destroy one lootdrop", goal: 1, reward_xp: 30 },
    { quest_name: "Join the lottery", goal: 1, reward_xp: 125 }
];

function getRandomQuests(array: Array<any>, num: number) {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

export async function generateDailyQuests() {
    const users = await UserModel.find();

    for (const user of users) {
        const randomQuests = getRandomQuests(quests, 3).map(quest => ({
            ...quest,
            progress: 0,
            completed: false
        }));

        user.daily_quests = randomQuests;
        user.quest_reset_at = Math.floor(Date.now() / 1000);
        await user.save();
    }

    console.log('Daily quests generated');
}

// Schedule the quest generation at midnight every day
cron.schedule('0 0 * * *', async () => {
    await generateDailyQuests();
}, {
    scheduled: true,
    timezone: 'Europe/Berlin'
});
