import { EmbedBuilder, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import cron from "node-cron";
import crypto from "crypto";

import { client } from "../../index";

import GuildModel from "../../models/guild/guild";
import LotteryModel from "../../models/lottery/lottery";

function generateThreeRandomNumbersBetweenOneAndOneHundreds() {
    const numbers = [];
    for (let i = 0; i < 3; i++) {
        numbers.push(Math.floor(Math.random() * 100) + 1);
    }
    return numbers;
}

export async function announceLottery() {
    const channel = (await client.channels.fetch(
        process.env.LOTTERY_CHAT
    )) as TextChannel;

    if (!channel) return;

    const guildQuery = await GuildModel.findOne({ guildID: channel.guild.id });
    if (!guildQuery || guildQuery.xp_enabled === false) return;

    const embed = new EmbedBuilder()
        .setTitle("Lottery")
        .setDescription(`
        The lottery has been opened for this weekend!
        Click on "Participate", enter your bet + three lucky numbers and you're in!

        The pot is currently at \`0\` XP.
        `)
        .setColor("Random")
        .setImage("https://anchor-precisiongroup-uat-web.s3.ap-southeast-2.amazonaws.com/prancentral/media/blogs/4-benefits-of-playing-the-lottery.jpg?ext=.jpg")
        .setFooter({ text: "Play carefully.", iconURL: client.user?.displayAvatarURL() });

    const joinLotteryButton = new ButtonBuilder()
        .setCustomId("join-lottery-button")
        .setLabel("Participate")
        .setEmoji("🎰")
        .setStyle(ButtonStyle.Danger)

    const informationButton = new ButtonBuilder()
        .setCustomId("information-button")
        .setLabel("Information")
        .setEmoji("ℹ️")
        .setStyle(ButtonStyle.Primary)

    const lotteryRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(joinLotteryButton, informationButton)

    // monday 11pm opening
    cron.schedule("0 23 * * MON", async () => {
        // cron.schedule("*/1 * * * *", async () => {

        const lotteryMessage = await channel.send({ embeds: [embed], components: [lotteryRow] });
        const lotteryID = crypto.randomBytes(18).toString("hex");
        const lotteryNumbers = generateThreeRandomNumbersBetweenOneAndOneHundreds();

        await LotteryModel.create({
            lotteryMessageID: lotteryMessage.id,
            lotteryGameID: lotteryID,
            winner: "",
            lotteryPot: 0,
            lotteryBets: [],
            lotteryNumbers: lotteryNumbers,
            opened: true,
            inserted_at: new Date(),
            updated_at: new Date()
        });
    }), {
        scheduled: true,
        timezone: "Europe/Berlin"
    }
}