import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle } from "discord.js";
import { Command } from "../../structures/Command";
import UserModel from "../../models/user/user";

export default new Command({
    name: "prestige",
    description: "Signs you up for prestige mode",
    userPermissions: [PermissionFlagsBits.SendMessages],
    run: async ({ interaction, client }) => {
        const userQuery = await UserModel.findOne({ userID: interaction.user.id });

        if (!userQuery || userQuery.xp_level !== 50) return interaction.reply({ content: "Come back once you are level 50", ephemeral: true });

        const modal = new ModalBuilder()
            .setTitle("Prestige Sign Up")
            .setCustomId("prestige-modal")

        const username = new TextInputBuilder()
            .setCustomId("prestige-username")
            .setLabel("Your Username")
            .setPlaceholder("Enter your username")
            .setStyle(TextInputStyle.Short)
            .setMinLength(3)
            .setMaxLength(20)
            .setRequired(true)

        const usernameRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(username);

        modal.addComponents(usernameRow);

        await interaction.showModal(modal);
    },
});