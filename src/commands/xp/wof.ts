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

        const cooldownTime = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
        const lastUsed = userQuery.updated_at ? userQuery.updated_at.getTime() : 0;
        const now = Date.now();

        if (now - lastUsed < cooldownTime) {
            const timeLeft = cooldownTime - (now - lastUsed);
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            return interaction.reply({
                content: `You can use this command again in ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`,
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

        const message = await interaction.reply({ embeds: [colorEmbed], fetchReply: true });

        setTimeout(async () => {
            let colorDesc = "";
            let XP_TO_GIVE = 0;

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

            // Add the XP to the user's total
            usersXP += XP_TO_GIVE;

            // Quest tracking for "Play one wof game"
            const wofQuest = userQuery.daily_quests.find(
                (quest) => quest.quest_name === "Play one wof game" && !quest.completed
            );

            if (wofQuest) {
                wofQuest.progress += 1;

                // Debugging: Log the progress and quest status
                console.log(`Quest progress: ${wofQuest.progress}/${wofQuest.goal}`);
                console.log(`Is quest completed? ${wofQuest.completed}`);

                if (wofQuest.progress >= wofQuest.goal) {
                    wofQuest.completed = true;
                    usersXP += wofQuest.reward_xp;

                    console.log(`User ${interaction.user.tag} completed the quest: ${wofQuest.quest_name}`);
                }
            }

            // Check if all quests are completed for bonus XP
            const allQuestsCompleted = userQuery.daily_quests.every((quest) => quest.completed);
            if (allQuestsCompleted) {
                const bonusXP = 150;
                usersXP += bonusXP;

                console.log(`User ${interaction.user.tag} has completed all daily quests and earned bonus XP.`);

                // Update user level based on new XP after bonus
                for (const levelRole of levelRoles) {
                    if (usersXP >= levelRole.xpRequired && levelRole.level > userLevel) {
                        userLevel = levelRole.level;
                    }
                }
            }

            // Assign new XP and level if necessary
            for (const levelRole of levelRoles) {
                if (usersXP >= levelRole.xpRequired && levelRole.level > userLevel) {
                    userLevel = levelRole.level;
                }
            }

            await userQuery.updateOne({
                xp_points: usersXP,
                xp_level: userLevel,
                updated_at: new Date(),
                daily_quests: userQuery.daily_quests
            });
            

            // Send the final result message
            const resultEmbed = new EmbedBuilder()
                .setTitle(`🎡 Wheel of Fortune Result 🎡`)
                .setDescription(`The wheel stopped at ${colorDesc}!`)
                .setColor(colorDesc as ColorResolvable)
                .setFooter({ text: resultMessage });

            await message.edit({ embeds: [resultEmbed] });

        }, 9000);
    },
});
