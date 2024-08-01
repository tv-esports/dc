import { EmbedBuilder, TextChannel } from "discord.js";
import cron from "node-cron";
import { client } from "../../index";

import GuildModel from "../../models/guild/guild";
import GiveawayModel from "../../models/giveaway/giveaway";
import emojis from "../../styles/emojis";
import UserModel from "../../models/user/user";
import { levelRoles } from "../../functions/xp";

export async function endGiveaway() {
    // every day 20:00 PM | 0 20 * * *
    cron.schedule("0 20 * * *", async () => {
        const channel = await client.channels.fetch(process.env.GIVEAWAY_CHAT) as TextChannel;
        if (!channel) return;

        const guildQuery = await GuildModel.findOne({ guildID: channel.guild.id });
        if (!guildQuery || guildQuery.xp_enabled === false) return;

        const giveawayQuery = await GiveawayModel.findOne({}).sort({ createdAt: -1 });
        if (!giveawayQuery) return;

        const giveawayMessage = await channel.messages.fetch(giveawayQuery.giveawayMessageID);
        if (!giveawayMessage) return;

        const giveawayPrice = giveawayQuery.xpAmount as number;
        const giveawayParticipants = giveawayQuery.signed_up_users as string[];

        if (giveawayMessage && !giveawayParticipants.length) {
            giveawayMessage.delete();
            await GiveawayModel.deleteOne({ giveawayMessageID: giveawayQuery.giveawayMessageID });
            return;
        }

        const randomWinner = giveawayParticipants[Math.floor(Math.random() * giveawayParticipants.length)];

        const giveawayEndEmbed = new EmbedBuilder()
            .setDescription(`The giveaway has ended`)
            .setColor("Random")
            .addFields(
                {
                    name: `Winner ${emojis.diamond}`,
                    value: `<@${randomWinner}>`
                },
                {
                    name: `Price ${emojis.supporter}`,
                    value: `${giveawayPrice} XP`
                }
            )
            .setImage("https://t3.ftcdn.net/jpg/02/33/38/08/360_F_233380815_4ah3nJszftXDiCch6CwlmlAJdJSsRlSM.jpg")
            .setFooter({ text: "Don't worry, the next giveaway will start soon" });

        await giveawayMessage.edit({ embeds: [giveawayEndEmbed], components: [] });
        await GiveawayModel.deleteOne({ giveawayMessageID: giveawayQuery.giveawayMessageID });

        const userQuery = await UserModel.findOne({ userID: randomWinner });
        if (!userQuery) return;

        const updatedXP = userQuery.xp_points + giveawayPrice;
        let updatedLevel = userQuery.xp_level;
        for (const levelRole of levelRoles) {
            if (updatedXP >= levelRole.xpRequired && levelRole.level > updatedLevel) {
                const role = channel.guild?.roles.cache.find((r) => r.id === levelRole.role);

                if (role && !channel.guild?.members.cache.get(randomWinner)?.roles.cache.has(role.id)) {
                    await channel.guild?.members.cache.get(randomWinner)?.roles.add(role);
                }

                updatedLevel = levelRole.level;
            }
        }

        await UserModel.updateOne({ userID: randomWinner }, { xp_points: updatedXP, xp_level: updatedLevel, updated_at: new Date() });
    }, {
        scheduled: true,
        timezone: "Europe/Berlin"
    });
}
