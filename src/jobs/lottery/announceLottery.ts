import { EmbedBuilder, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedAssertions } from "discord.js";
import cron from "node-cron";
import crypto from "crypto";

import { client } from "../../index";

import GuildModel from "../../models/guild/guild";
import LotteryModel from "../../models/lottery/lottery";
import moment from "moment";

export async function announceLottery() {
    cron.schedule("15 20 * * SUN", async () => {
        // generates three numbers, that dont exceed 100 in total
        function generateNumbers() {
            const numbers = [];
            let sum = 0;

            for (let i = 0; i < 3; i++) {
                const number = Math.floor(Math.random() * 100) + 1;
                numbers.push(number);
                sum += number;
            }

            if (sum > 100) {
                return generateNumbers();
            }

            return numbers;
        }

        const now = moment().tz("Europe/Berlin");
        const endsIn = now.clone().day(5).hour(12).minute(0).second(0); // Friday 12 PM
        const timestamp = Math.floor(endsIn.valueOf() / 1000);

        const channel = (await client.channels.fetch(
            process.env.LOTTERY_CHAT
        )) as TextChannel;

        if (!channel) return;

        const guildQuery = await GuildModel.findOne({ guildID: channel.guild.id });
        if (!guildQuery || guildQuery.xp_enabled === false) return;

        const embed = new EmbedBuilder()
            .setDescription("The lottery has been opened for this week!")
            .setColor("Random")
            .addFields(
                {
                    name: "Price Pool 🎁",
                    value: "0 XP"
                },
                {
                    name: "Ends in",
                    value: `<t:${timestamp}:R>`
                }
            )
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

        const lotteryMessage = await channel.send({ embeds: [embed], components: [lotteryRow] });
        const lotteryID = crypto.randomBytes(18).toString("hex");
        const lotteryNumbers = generateNumbers();

        await LotteryModel.create({
            lotteryMessageID: lotteryMessage.id,
            lotteryGameID: lotteryID,
            winner: "",
            lotteryPot: 0,
            lotteryBets: [],
            lotteryNumbers: lotteryNumbers,
            opened: true,
            endsIn: timestamp,
            inserted_at: new Date(),
            updated_at: new Date()
        });
    }), {
        scheduled: true,
        timezone: "Europe/Berlin"
    }
}