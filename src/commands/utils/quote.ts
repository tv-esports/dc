import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../structures/Command';

/**
 * Extract the message ID from the provided URL or directly use the ID.
 * @param {string} input - The message URL or ID.
 * @returns {string|null} - The extracted message ID or null if invalid.
 */
function extractMessageId(input: string) {
    const messageUrlPattern = /(?:https?:\/\/)?(?:www\.)?discord\.com\/channels\/\d+\/\d+\/(\d+)/;
    const match = input.match(messageUrlPattern);
    if (match) {
        return match[1]; // The message ID is captured in the first group
    }
    return input; // Assume input is already an ID if not matched as URL
}

export default new Command({
    name: 'quote',
    description: 'Quote a message and provide a reply',
    userPermissions: [PermissionFlagsBits.SendMessages],
    options: [
        {
            name: 'message',
            description: 'The URL or ID of the message to quote',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'reply',
            description: 'Your reply to the quoted message',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async ({ interaction, client }) => {
        const messageInput = interaction.options.getString('message');
        const reply = interaction.options.getString('reply');

        const messageId = extractMessageId(messageInput);

        if (!messageId) {
            await interaction.reply({ content: 'Invalid message URL or ID provided.', ephemeral: true });
            return;
        }

        try {
            const message = await interaction.channel.messages.fetch(messageId);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Quoted Message')
                .setDescription(`**[Message:](${messageInput})**\n"${message.content}"\n\n> ${reply}`)
                .setFooter({ text: `Quoted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            // Reply to the interaction
            await interaction.channel.send({ embeds: [embed] });
            await interaction.reply({ content: 'Quoted the message successfully!', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occurred while fetching the message or creating the quote.\nInvalid message URL or ID provided.', ephemeral: true });
        }
    },
});