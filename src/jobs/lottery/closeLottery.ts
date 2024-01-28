import { EmbedBuilder, TextChannel, Message } from "discord.js";
import cron from "node-cron";
import { client } from "../../index";

import LotteryModel from "../../models/lottery/lottery";

import dedent from 'dedent';

export async function closeLottery() {
    const lotteryQuery = await LotteryModel.findOne({ opened: true }).sort({ inserted_at: -1 });
    if (!lotteryQuery) return;

    const lotteryPot = lotteryQuery.lotteryPot;
    const lotteryMessage = lotteryQuery.lotteryMessageID;

    const pricePool = dedent`
    ${lotteryPot} XP\n
    `;

    const embed = new EmbedBuilder()
        .setTitle("Lottery")
        .setDescription(dedent`
        The lottery has been closed for this week.
        The winners will be announced tonight, may the odds be ever in your favor!
        
        Price Pool: 
        \`\`\`diff
        ${pricePool}
        \`\`\`
        `)
        .setColor("NotQuiteBlack")
        .setImage("https://media04.kraichgau.news/article/2023/12/29/8/355728_L.jpg?1703837941")
        .setFooter({ text: "Good luck!", iconURL: client.user?.displayAvatarURL() });

    // friday 12:00 closing
    cron.schedule("0 12 * * FRI", async () => {
        // cron.schedule("*/1 * * * *", async () => {

        const channel = (await client.channels.fetch(
            process.env.LOTTERY_CHAT
        )) as TextChannel;

        // edit the message
        const message = await channel.messages.fetch(lotteryMessage);
        if (!channel || !message) return;

        await message.edit({ embeds: [embed], components: [] }) as Message;

        // update the lottery
        await LotteryModel.updateOne({ lotteryMessageID: lotteryMessage }, {
            opened: false
        })
    }), {
        scheduled: true,
        timezone: "Europe/Berlin"
    }
}