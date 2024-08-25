import { EmbedBuilder, Message } from "discord.js";
import { ExtendedClient } from "../structures/Client";
import { BaseEvent } from "../structures/Event";

import UserModel from "../models/user/user";
import GuildModel from "../models/guild/guild";

import { generateRandomXP, levelRoles } from "../functions/xp";

const cooldowns = new Map();

export default class MessageEvent extends BaseEvent {
  constructor() {
    super("messageCreate");
  }

  async run(client: ExtendedClient, message: Message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const guildQuery = await GuildModel.findOne({ guildID: message.guild.id });
    let userQuery = await UserModel.findOne({ userID: message.author.id });

    const hasPremiumPerk = userQuery.inventory.some((item) => item.name === "Premium");

    // If userQuery is null (user not found in database), create a new user
    if (!userQuery) {
      userQuery = await UserModel.create({
        userID: message.author.id,
        xp_level: 0,
        xp_points: 0,
        warnings: 0,
        inserted_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (!guildQuery) return;
    if (guildQuery.xp_enabled === false) return;
    if (guildQuery.blacklisted_xp_users.includes(message.author.id)) return;
    if (guildQuery.ignored_xp_channels.includes(message.channel.id)) return;
    if (guildQuery.ignored_xp_roles.some((role) => message.member?.roles.cache.has(role))) return;

    let cooldownTime = 10000;

    const currentTime = Date.now();
    const userCooldown = cooldowns.get(message.author.id);

    // Determine XP to give, with increased XP for Premium users
    const isWeekend = [0, 6].includes(new Date().getDay()); // Sunday or Saturday
    const baseXP = isWeekend ? generateRandomXP(16, 24) : generateRandomXP(8, 12);
    const XP_TO_GIVE = hasPremiumPerk ? baseXP * 2 : baseXP; // Double XP for Premium users

    // User is on cooldown, ignore message
    if (userCooldown && (currentTime - userCooldown) < cooldownTime) return;

    cooldowns.set(message.author.id, currentTime);

    const newXP = userQuery.xp_points + XP_TO_GIVE;
    const defaultMessagesSent = userQuery.messages_sent || 0;
    let userLevel = userQuery.xp_level;

    for (const levelRole of levelRoles) {
      if (newXP >= levelRole.xpRequired && levelRole.level > userLevel) {
        const role = message.guild.roles.cache.find((r) => r.id === levelRole.role);

        if (role && message.member?.roles.cache.has(role.id)) {
          // const levelUpEmbed = new EmbedBuilder()
          //   .setColor("Random")
          //   .setDescription(`🎉 Congratulations, you have leveled up!\nYou are now level \`${levelRole.level}\``)
          //   .setTimestamp();
          // message.reply({ content: `${message.author}`, embeds: [levelUpEmbed] });
          message.react("🎉")
        }

        if (role && !message.member?.roles.cache.has(role.id)) {
          // const levelUpEmbed = new EmbedBuilder()
          //   .setColor("Random")
          //   .setDescription(`🎉 Congratulations, you have leveled up!\nYou are now level \`${levelRole.level}\` and received the \`${role.name}\` role`)
          //   .setTimestamp();
          message.member?.roles.add(role);
          // message.reply({ content: `${message.author}`, embeds: [levelUpEmbed] });
          message.react("🎉")
        }

        userLevel = levelRole.level;
      }
    }

    await UserModel.findOneAndUpdate(
      { userID: message.author.id },
      { xp_points: newXP, xp_level: userLevel, messages_sent: defaultMessagesSent + 1 }
    );
  }
}