import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import { ExtendedButtonInteraction } from "../../typings/Command";

import { levelRoles } from "../../functions/xp";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

import DropModel from "../../models/xpdrop/drop";
import GuildModel from "../../models/guild/guild";
import UserModel from "../../models/user/user";

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

                const widButton = new ButtonBuilder()
                    .setCustomId("xp-wid-button")
                    .setLabel("👻 Congrats")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const widRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(widButton)

                await interaction.message.edit({ embeds: [embed], components: [widRow] })
                await UserModel.findOneAndUpdate({ userID: interaction.user.id }, { xp_points: newUserXP, xp_level: newUserLevel });
                await interaction.reply({ content: "You claimed the XP drop!", ephemeral: true });
                break;

            // case "xp-wid-button":
            //     const widEmbed = new EmbedBuilder()
            //         .setDescription(`Hello ${interaction.user.username}!\nDue to the server inactivity, a small feature called "XP Drop" was implemented.\nOwners can send this drop whenever they want to help you earn XP faster. It is not possible to lose anything, you can only win.`)
            //         .setColor("Random")
            //         .setFooter({ text: "Lets wait for a new drop ...", iconURL: client.user?.displayAvatarURL() })
            //         .setTimestamp();

            //     await interaction.reply({ embeds: [widEmbed], ephemeral: true });

            // break;

            default:
        break;
}
    }
}
