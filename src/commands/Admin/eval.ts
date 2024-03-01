import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { ownerCheck } from "../../guards/owner";
import { Command } from "../../structures/Command";

const { inspect } = require('util')

export default new Command({
    name: "eval",
    description: "Eval code",
    userPermissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: "code",
            description: "The code to run",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async ({ interaction, client }) => {
        await ownerCheck(interaction);
        if (interaction.replied) return;

        const code = interaction.options.getString('code');

        try {
            const result = await eval(code);
            if (result === client.token || process.env) return interaction.reply({ content: 'No', ephemeral: true });
            let output = result;
            if (typeof result !== 'string') {
                output = inspect(result)
            }
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: 'Result:' })
                        .setDescription('\`\`\`js\n' + output + '\n\`\`\`')
                        .setColor('Green')
                ],
                ephemeral: true
            })
        } catch (e) {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('An error occured! Check console for more information (hidden) ...')
                        .setColor('Red')
                ],
                ephemeral: true
            })
        }

    },
});
