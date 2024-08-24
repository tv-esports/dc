import { EmbedBuilder, TextChannel, Message } from "discord.js";
import cron from "node-cron";
import { client } from "../../index";

import LotteryModel from "../../models/lottery/lottery";

export async function closeLottery() {
    // friday 11:30 closing
    cron.schedule("30 11 * * FRI", async () => {
        const lotteryQuery = await LotteryModel.findOne({ opened: true }).sort({ inserted_at: -1 });
        if (!lotteryQuery) return;

        const lotteryPot = lotteryQuery.lotteryPot;
        const lotteryMessage = lotteryQuery.lotteryMessageID;
        const endsIn = lotteryQuery.endsIn;
        const timestamp = `<t:${endsIn}:R>`;

        const embed = new EmbedBuilder()
            .setDescription(`The lottery has been closed for this week! You cannot enter anymore.\nThe winner will be announced ${timestamp} `)
            .setColor("NotQuiteBlack")
            .addFields(
                {
                    name: "Price Pool 🎁",
                    value: `${lotteryPot} XP`
                },
            )
            .setImage("https://media04.kraichgau.news/article/2023/12/29/8/355728_L.jpg?1703837941")
            .setFooter({ text: "Good luck!", iconURL: client.user?.displayAvatarURL() });

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