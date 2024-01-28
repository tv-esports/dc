import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { ownerCheck } from "../../guards/owner";
import { Command } from "../../structures/Command";

export default new Command({
    name: "maintenance",
    description: "Enter maintenance mode",
    userPermissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: "info",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Sends info from maintenance mode",
            options: [
                {
                    name: "message",
                    description: "The message to send",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "on",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Sends into maintenance mode",
            options: [
                {
                    name: "message",
                    description: "The message to send",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "off",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Takes out of maintenance mode",
            options: [
                {
                    name: "message",
                    description: "The message to send",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ],
    run: async ({ interaction, client }) => {
        await ownerCheck(interaction);
        if (interaction.replied) return;

        if (interaction.options.getSubcommand() === "info") {
            const message = interaction.options.getString("message");

            const embed = new EmbedBuilder()
                .setTitle("Team Void :: Update")
                .setDescription(message)
                .setColor('Green')
                .setTimestamp()
                .setFooter({ text: "Made by vKxni", iconURL: client.user.avatarURL() })

            await interaction.reply({ content: "done", ephemeral: true });
            return interaction.channel.send({ content: "A new update has been released", embeds: [embed] })
        }

        if (interaction.options.getSubcommand() === "on") {
            const message = interaction.options.getString("message");

            const embed = new EmbedBuilder()
                .setTitle("Team Void :: Maintenance")
                .setDescription(message)
                .setColor('Red')
                .setTimestamp()
                .setFooter({ text: "Made by vKxni", iconURL: client.user.avatarURL() })

            await interaction.reply({ content: "done", ephemeral: true });
            return interaction.channel.send({ content: "Attention boys!", embeds: [embed] })
        }

        if (interaction.options.getSubcommand() === "off") {
            const message = interaction.options.getString("message");

            const embed = new EmbedBuilder()
                .setTitle("Team Void :: Maintenance")
                .setDescription(message)
                .setColor('Green')
                .setTimestamp()
                .setFooter({ text: "Made by vKxni", iconURL: client.user.avatarURL() })

            await interaction.reply({ content: "done", ephemeral: true });
            return interaction.channel.send({ content: "Maintenance over, get back to work!", embeds: [embed] })
        }
    },
});
