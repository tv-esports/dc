import { EmbedBuilder } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import { ExtendedButtonInteraction } from "../../typings/Command";

import DropModel from "../../models/xpdrop/drop";
import GuildModel from "../../models/guild/guild";
import UserModel from "../../models/user/user";

import { levelRoles } from "../../functions/xp";

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
            case "xp-drop-button":
                const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });
                const userQuery = await UserModel.findOne({ userID: interaction.user.id });
                const dropQuery = await DropModel.findOne({ guildID: interaction.guild.id }).sort({ inserted_at: -1 });

                if (!guildQuery) return interaction.reply({ content: "You can't do that, XP system isn't enabled", ephemeral: true });

                const xpAmount = dropQuery.amount;

                let newUserXP = userQuery.xp_points + xpAmount;
                let newUserLevel = userQuery.xp_level;

                for (const levelRole of levelRoles) {
                    if (newUserXP >= levelRole.xpRequired && levelRole.level > newUserLevel) {
                        const role = interaction.guild?.roles.cache.find((r) => r.id === levelRole.role);

                        if (role && !interaction.guild?.members.cache.get(interaction.user.id)?.roles.cache.has(role.id)) {
                            await interaction.guild?.members.cache.get(interaction.user.id)?.roles.add(role);
                        }

                        newUserLevel = levelRole.level;
                    }
                }

                const embed = new EmbedBuilder()
                    .setDescription(`${interaction.user.username} claimed the XP drop and got **${xpAmount}** XP!`)
                    .setColor("Random")
                    .setFooter({ text: "Be nice to get another one.", iconURL: client.user?.displayAvatarURL() });

                await interaction.message.edit({ embeds: [embed] });
                await UserModel.findOneAndUpdate({ userID: interaction.user.id }, { xp_points: newUserXP, xp_level: newUserLevel });
                await interaction.reply({ content: "You claimed the XP drop!", ephemeral: true });
                break;

            default:
                break;
        }
    }
}
