const Discord = require('discord.js')

import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { ownerCheck } from "../../guards/owner";
import { Command } from "../../structures/Command";
import { msToTimeObj } from "../../functions/ms";

const { stripIndent } = require('common-tags')

export default new Command({
  name: "debug",
  description: "Shows information about the bot",
  userPermissions: [PermissionFlagsBits.Administrator],
  run: async ({ interaction, client }) => {
    await ownerCheck(interaction);
    if (interaction.replied) return;

    const timeObj = msToTimeObj(interaction.client.uptime);

    const interactionTime = interaction.createdTimestamp - Date.now();

    const infos = stripIndent`
    • Ping     : ${interactionTime}ms
    • Uptime   : ${timeObj.days} days, ${timeObj.hours} hours, ${timeObj.minutes} minutes, ${timeObj.seconds} seconds
    • Users    : ${client.users.cache.size}
    • Library  : Discord.js | v${Discord.version}
    • RAM      : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
      2,
    )} MB / ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB\n`

    const embed = new EmbedBuilder()
      .setTitle("Team Void :: Debug")
      .setDescription(`\`\`\`diff\n${infos}\`\`\``)
      .setColor('#2f3136')
      .setTimestamp()
      .setFooter({ text: "Made by vKxni", iconURL: client.user.avatarURL() })

    return interaction.reply({ embeds: [embed], ephemeral: false })

  },
});
