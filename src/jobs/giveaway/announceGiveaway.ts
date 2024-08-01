import { EmbedBuilder, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import cron from "node-cron";
import { client } from "../../index";

import moment from "moment-timezone";

import GuildModel from "../../models/guild/guild";
import GiveawayModel from "../../models/giveaway/giveaway";

export async function announceGiveaway() {
    cron.schedule("0 0 * * *", async () => {
        function generateRandomNumber(min: number, max: number) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        const channel = await client.channels.fetch(process.env.GIVEAWAY_CHAT) as TextChannel;

        if (!channel) return;

        const guildQuery = await GuildModel.findOne({ guildID: channel.guild.id });
        if (!guildQuery || guildQuery.xp_enabled === false) return;

        const pricepool = generateRandomNumber(80, 260);

        const joinButton = new ButtonBuilder()
            .setCustomId("enter-giveaway")
            .setLabel("Participate")
            .setEmoji("🎰")
            .setStyle(ButtonStyle.Primary);

        const giveawayrow = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

        const now = moment().tz("Europe/Berlin");
        const endsIn = now.clone().add(20, 'hours');
        const timestamp = Math.floor(endsIn.valueOf() / 1000);

        const giveawayEmbed = new EmbedBuilder()
            .setDescription("A new XP-Giveaway has been started 🎉")
            .setColor("Random")
            .addFields(
                {
                    name: "Price 🎁",
                    value: `${pricepool} XP`
                },
                {
                    name: "Users 🧑",
                    value: "0"
                },
                {
                    name: "Ends in ⏰",
                    value: `<t:${timestamp}:R>`
                }
            )
            .setImage("https://www.pushengage.com/wp-content/uploads/2022/11/Social-Media-Giveaway-Ideas.png")

        const giveawayMessageID = await (channel as TextChannel).send({ embeds: [giveawayEmbed], components: [giveawayrow] });
        await GiveawayModel.create({
            giveawayMessageID: giveawayMessageID.id,
            xpAmount: pricepool,
            endsIn: timestamp,
            signed_up_users: [],
            inserted_at: new Date(),
            updated_at: new Date()
        });
    }, {
        scheduled: true,
        timezone: "Europe/Berlin"
    });
}