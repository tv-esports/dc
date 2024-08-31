import { ColorResolvable, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "../../structures/Command";
import { levelRoles } from "../../functions/xp";

import UserModel from "../../models/user/user";
import GuildModel from "../../models/guild/guild";

export default new Command({
    name: "wof",
    description: "Wheel of Fortune!",
    userPermissions: [PermissionFlagsBits.SendMessages],
    run: async ({ interaction, client }) => {
        const userQuery = await UserModel.findOne({ userID: interaction.user.id });
        const guildQuery = await GuildModel.findOne({ guildID: interaction.guild?.id });
        if (!userQuery) return interaction.reply({ content: "You are not in the database yet, send messages first!", ephemeral: true });
        if (guildQuery.xp_enabled === false) return interaction.reply({ content: "You are not able to do that!", ephemeral: true });

        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        if (userQuery.updated_at && userQuery.updated_at > twelveHoursAgo) {
            const timeLeft = new Date(userQuery.updated_at.getTime() + 12 * 60 * 60 * 1000 - Date.now());
            const hours = timeLeft.getUTCHours();
            const minutes = timeLeft.getUTCMinutes();
            const seconds = timeLeft.getUTCSeconds();

            return interaction.reply({
                content: `You can use this command again in ${hours} hours, ${minutes} minutes and ${seconds} seconds.`,
                ephemeral: true,
            });
        }

        const red = "https://cdn.discordapp.com/attachments/930931951005736990/1021451941403959358/Red.gif";
        const blue = "https://cdn.discordapp.com/attachments/930931951005736990/1021451954418888724/Blue.gif";
        const green = "https://cdn.discordapp.com/attachments/930931951005736990/1021451971514859520/Green.gif";
        const yellow = "https://cdn.discordapp.com/attachments/930931951005736990/1021451992310235218/Yellow.gif";

        const colors = [red, blue, green, yellow];
        const endColor = colors[Math.floor(Math.random() * colors.length)];

        let usersXP = userQuery.xp_points;
        let userLevel = userQuery.xp_level;
        let resultMessage = "";

        const colorEmbed = new EmbedBuilder()
            .setTitle(`🎡 Wheel of Fortune 🎡`)
            .setDescription(
                "__**Pricing:**__\n\n**Red:** 100XP.\n**Blue:** 80XP.\n**Green:** 50XP.\n**Yellow:** 40XP."
            )
            .setImage(endColor);

        const message = await interaction.reply({ embeds: [colorEmbed] });

        // Wait for a short duration (e.g., 9 seconds) before revealing the result
        setTimeout(async () => {
            let colorDesc = "";
            let XP_TO_GIVE = 0;

            // Determine XP and description based on the resulting color
            if (endColor === red) {
                colorDesc = "Red";
                XP_TO_GIVE = 100;
                resultMessage = "You won 100 XP!";
            } else if (endColor === blue) {
                colorDesc = "Blue";
                XP_TO_GIVE = 80;
                resultMessage = "You won 80 XP!";
            } else if (endColor === green) {
                colorDesc = "Green";
                XP_TO_GIVE = 50;
                resultMessage = "You won 50 XP!";
            } else if (endColor === yellow) {
                colorDesc = "Yellow";
                XP_TO_GIVE = 40;
                resultMessage = "You won 40 XP!";
            }

            // Assign XP to the user and update their role if necessary
            usersXP += XP_TO_GIVE;

            // Quest tracking for "Play one WoF game"
            const wofQuest = userQuery.daily_quests.find(
                (quest) => quest.quest_name === "Play one wof game" && !quest.completed
            );

            if (wofQuest) {
                wofQuest.progress += 1;
                if (wofQuest.progress >= wofQuest.goal) {
                    wofQuest.completed = true;
                    usersXP += wofQuest.reward_xp;

                    // Optional: Log that the quest is completed
                    console.log(`User ${interaction.user.tag} completed the quest: ${wofQuest.quest_name}`);
                }
            }

            // Check if all quests are completed for bonus XP
            const allQuestsCompleted = userQuery.daily_quests.every((quest) => quest.completed);
            if (allQuestsCompleted) {
                const bonusXP = 150;
                usersXP += bonusXP;


                // Determine if user should level up with the new XP
                let newLevelWithBonus = userLevel;
                for (const levelRole of levelRoles) {
                    if (usersXP >= levelRole.xpRequired && levelRole.level > newLevelWithBonus) {
                        newLevelWithBonus = levelRole.level;
                    }
                }

                // Update user level and roles if needed
                const rolesToAddWithBonus = levelRoles.filter(role => role.level > userLevel && role.level <= newLevelWithBonus);
                const rolesToAddIDsWithBonus = rolesToAddWithBonus.map(role => role.role);

                if (rolesToAddIDsWithBonus.length > 0) {
                    const memberInGuild = interaction.guild?.members.cache.get(interaction.user.id);
                    if (memberInGuild) {
                        await memberInGuild.roles.add(rolesToAddIDsWithBonus);
                    }
                }

                // Update user data in the database
                await UserModel.updateOne(
                    { userID: interaction.user.id },
                    { xp_points: usersXP, xp_level: newLevelWithBonus, updated_at: new Date(), daily_quests: userQuery.daily_quests }
                );

                const resultEmbed = new EmbedBuilder()
                    .setTitle(`🎡 Wheel of Fortune Result 🎡`)
                    .setDescription(`The wheel stopped at ${colorDesc}!`)
                    .setColor(colorDesc as ColorResolvable)
                    .setFooter({ text: resultMessage });

                await message.edit({ embeds: [resultEmbed] });
            }
        }, 9000);
    },
});
