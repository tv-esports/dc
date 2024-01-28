import { ApplicationCommandOptionType, AttachmentBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "../../structures/Command";

export default new Command({
  name: "lisa",
  description: "Lisa presentation!",
  userPermissions: [PermissionFlagsBits.Administrator],
  options: [
    {
      name: "text",
      description: "The text to present",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async ({ interaction, client }) => {

    const text = interaction.options.getString("text");

    const finalLink = `https://luminabot.xyz/api/image/lisa-presents?text=${encodeURIComponent(text)}`;
    const attachment = new AttachmentBuilder(finalLink, { name: 'lisa.jpg' })

    await interaction.reply({ files: [attachment] });
  },
});