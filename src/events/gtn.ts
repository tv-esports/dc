import { EmbedBuilder } from "discord.js";
import UserModel from "../models/user/user";
import { ExtendedClient } from "../structures/Client";
import { BaseEvent } from "../structures/Event";
import { ExtendedButtonInteraction } from "../typings/Command";
import { levelRoles } from "../functions/xp";

export default class InteractionCreateEvent extends BaseEvent {
    constructor() {
        super("interactionCreate");
    }

    async run(client: ExtendedClient, interaction: ExtendedButtonInteraction) {
        if (!interaction.isButton()) return;

        const [prefix, correctNumber, guessedNumber] = interaction.customId.split("-");
        if (prefix !== "guess") return;

        const userQuery = await UserModel.findOne({ userID: interaction.user.id });
        if (!userQuery) {
            return interaction.reply({ content: "You are not in the database yet, send messages first!", ephemeral: true });
        }

        if (guessedNumber === correctNumber) {
            let usersXP = userQuery.xp_points;
            let userLevel = userQuery.xp_level;
            const XP_TO_GIVE = Math.floor(Math.random() * (50 - 20 + 1) + 20); // Random XP reward between 20 and 50

            // Add the XP to the user's current points
            usersXP += XP_TO_GIVE;

            // Quest tracking for "Play three guess the number games"
            const guessNumberQuest = userQuery.daily_quests.find(
                (quest) => quest.quest_name === "Play three guess the number games" && !quest.completed
            );

            if (guessNumberQuest) {
                guessNumberQuest.progress += 1;
                if (guessNumberQuest.progress >= guessNumberQuest.goal) {
                    guessNumberQuest.completed = true;
                    usersXP += guessNumberQuest.reward_xp;
                }
            }

            // Check if all quests are completed
            const allQuestsCompleted = userQuery.daily_quests.every((quest) => quest.completed);
            if (allQuestsCompleted) {
                const bonusXP = 150;
                usersXP += bonusXP;

                // Determine new level with bonus XP
                let newLevelWithBonus = userLevel;
                for (const levelRole of levelRoles) {
                    if (usersXP >= levelRole.xpRequired && levelRole.level > newLevelWithBonus) {
                        newLevelWithBonus = levelRole.level;
                    }
                }

                // Add roles based on the new level
                const rolesToAddWithBonus = levelRoles.filter(role => role.level > userLevel && role.level <= newLevelWithBonus);
                const rolesToAddIDsWithBonus = rolesToAddWithBonus.map(role => role.role);

                const memberInGuild = interaction.guild?.members.cache.get(interaction.user.id);
                if (memberInGuild) {
                    await memberInGuild.roles.add(rolesToAddIDsWithBonus);
                }

                // Update user data with bonus XP and new level
                await UserModel.updateOne(
                    { userID: interaction.user.id },
                    { xp_points: usersXP, xp_level: newLevelWithBonus, daily_quests: userQuery.daily_quests }
                );

                // Send response for bonus XP
                await interaction.reply({
                    content: `🎉 You guessed the correct number and won ${XP_TO_GIVE} XP! You also completed all quests and earned an additional ${bonusXP} XP!`,
                    ephemeral: true
                });

                // Create and send a congratulatory embed
                const embed = new EmbedBuilder()
                    .setTitle("🎉 We Have a Winner!")
                    .setDescription(`Congratulations to ${interaction.user.username} for guessing the correct number and completing all quests!`)
                    .addFields(
                        { name: "Correct Number", value: `${correctNumber}`, inline: true },
                        { name: "XP Won", value: `${XP_TO_GIVE} XP`, inline: true },
                        { name: "Bonus XP", value: `${bonusXP} XP`, inline: true }
                    )
                    .setColor("Gold")
                    .setTimestamp();

                if (newLevelWithBonus > userLevel) {
                    embed.addFields({ name: "Level Up", value: `You reached level ${newLevelWithBonus}!`, inline: false });
                }

                // Remove buttons from the original message
                await interaction.message.edit({ embeds: [embed], components: [] });

            } else {
                // Check for level up with regular XP
                let newLevel = userLevel;
                for (const levelRole of levelRoles) {
                    if (usersXP >= levelRole.xpRequired && levelRole.level > newLevel) {
                        const role = interaction.guild?.roles.cache.find((r) => r.id === levelRole.role);

                        if (role && !interaction.member?.roles.cache.has(role.id)) {
                            await interaction.member?.roles.add(role);
                        }

                        newLevel = levelRole.level;
                    }
                }

                // Update user data with regular XP and level
                await UserModel.updateOne(
                    { userID: interaction.user.id },
                    { xp_points: usersXP, xp_level: newLevel, daily_quests: userQuery.daily_quests }
                );

                // Create and send a congratulatory embed
                const embed = new EmbedBuilder()
                    .setTitle("🎉 We Have a Winner!")
                    .setDescription(`Congratulations to ${interaction.user.username} for guessing the correct number!`)
                    .addFields(
                        { name: "Correct Number", value: `${correctNumber}`, inline: true },
                        { name: "XP Won", value: `${XP_TO_GIVE} XP`, inline: true }
                    )
                    .setColor("Gold")
                    .setTimestamp();

                if (newLevel > userLevel) {
                    embed.addFields({ name: "Level Up", value: `You reached level ${newLevel}!`, inline: false });
                }

                // Remove buttons from the original message
                await interaction.message.edit({ embeds: [embed], components: [] });

                await interaction.reply({ content: `🎉 You guessed the correct number and won ${XP_TO_GIVE} XP!`, ephemeral: true });
            }
        } else {
            await interaction.reply({ content: "❌ Incorrect guess. Be fast and try again.", ephemeral: true });
        }
    }
}
