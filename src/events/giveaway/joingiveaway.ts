import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import { ExtendedButtonInteraction } from "../../typings/Command";

import UserModel from "../../models/user/user";
import GuildModel from "../../models/guild/guild";
import GiveawayModel from "../../models/giveaway/giveaway";

export default class InteractionCreateEvent extends BaseEvent {
    constructor() {
        super("interactionCreate");
    }

    /**
     * Executes when a button interaction occurs.
     *
     * @param {ExtendedClient} client - The extended Discord client.
     * @param {ExtendedButtonInteraction} interaction - The button interaction.
     */
    async run(client: ExtendedClient, interaction: ExtendedButtonInteraction) {
        switch (interaction.customId) {
            case "enter-giveaway": {
                const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });
                if (!guildQuery || guildQuery.xp_enabled === false) return;

                const userQuery = await UserModel.findOne({ userID: interaction.user.id });
                if (!userQuery) return;

                if (guildQuery.blacklisted_xp_users.includes(interaction.user.id)) return interaction.reply({ content: "You are not able to do that", ephemeral: true });

                const giveawayQuery = await GiveawayModel.findOne().sort({ inserted_at: -1 });
                if (!giveawayQuery) return;

                if (giveawayQuery.signed_up_users.includes(interaction.user.id)) {
                    await interaction.reply({ content: "You have already entered the giveaway!", ephemeral: true });
                    return;
                }

                giveawayQuery.signed_up_users.push(interaction.user.id);
                await giveawayQuery.save();

                const channel = await client.channels.fetch(process.env.GIVEAWAY_CHAT) as TextChannel;
                const message = await channel.messages.fetch(giveawayQuery.giveawayMessageID);
                if (!channel || !message) return;

                const giveawayUsers = giveawayQuery.signed_up_users.map(userID => `<@${userID}>`).join(", ");

                const joinButton = new ButtonBuilder()
                    .setCustomId("enter-giveaway")
                    .setLabel("Participate")
                    .setEmoji("🎰")
                    .setStyle(ButtonStyle.Primary);

                const giveawayrow = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton)

                const embed = new EmbedBuilder()
                    .setDescription("A new XP-Giveaway has been started 🎉")
                    .setColor("Random")
                    .addFields(
                        {
                            name: "Price 🎁",
                            value: `${giveawayQuery.xpAmount} XP`
                        },
                        {
                            name: "Users 🧑",
                            value: giveawayUsers
                        },
                        {
                            name: "Ends in ⏰",
                            value: `<t:${giveawayQuery.endsIn}:R>`
                        }
                    )
                    .setImage("https://www.pushengage.com/wp-content/uploads/2022/11/Social-Media-Giveaway-Ideas.png")

                await message.edit({ embeds: [embed], components: [giveawayrow] });

                await interaction.reply({ content: "You have successfully entered the giveaway!", ephemeral: true });
                break;
            }
        }
    }
}