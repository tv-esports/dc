import { PermissionFlagsBits } from "discord.js";
import { ownerCheck } from "../../guards/owner";
import { Command } from "../../structures/Command";

export default new Command({
  name: "ping",
  description: "Pong!",
  userPermissions: [PermissionFlagsBits.Administrator],
  run: async ({ interaction, client }) => {
    await ownerCheck(interaction);
    if (interaction.replied) return;

    const interactionTime = interaction.createdTimestamp - Date.now();

    interaction.reply({
      content: "Pong!" + ` ${interactionTime}ms`,
      ephemeral: true,
    });
  },
});
