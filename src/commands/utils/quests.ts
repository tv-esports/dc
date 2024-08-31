import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "../../structures/Command";
import UserModel from "../../models/user/user";
import emojis from "../../styles/emojis";

export default new Command({
    name: "quests",
    description: "Get info about your quests",
    userPermissions: [PermissionFlagsBits.SendMessages],

    options: [
        {
            name: 'user',
            description: 'View quests of another user',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    run: async ({ interaction, client }) => {
        const user = interaction.options.getUser("user") || interaction.user;
        const userQuery = await UserModel.findOne({ userID: user.id });

        if (!userQuery) {
            return interaction.reply({ content: `${emojis.error} User data not found. Please send messages first.`, ephemeral: true });
        }

        const quests = userQuery.daily_quests;
        if (quests.length === 0) {
            return interaction.reply({ content: `${emojis.error} You have no quests available at the moment.`, ephemeral: true });
        }

        // Calculate time left until the next quest reset
        const now = Math.floor(Date.now() / 1000); // Current Unix timestamp
        const resetTime = userQuery.quest_reset_at + 86400; // Next reset time in Unix timestamp (24 hours later)
        const timeLeft = resetTime - now;

        // Calculate XP earned from tasks and any bonus XP
        const totalTaskXP = quests
            .filter(quest => quest.completed)
            .reduce((total, quest) => total + quest.reward_xp, 0);
        const allQuestsCompleted = quests.every((quest) => quest.completed);
        const bonusXP = allQuestsCompleted ? 150 : 0;
        const totalXP = totalTaskXP + bonusXP;

        // Create an embed to list quests
        const embed = new EmbedBuilder()
            .setTitle(`📝 Current Quests`)
            .setColor(allQuestsCompleted ? "#FFD700" : "#00FF00")
            .setFooter({ text: "Keep up the good work!" });

        if (allQuestsCompleted) {
            // Special message for completed quests
            embed
                .setDescription(`🎉 Congratulations, you completed all your quests for today!\nYou earned a total of **${totalXP} XP** (including a **${bonusXP} XP** bonus).`)
                .addFields({
                    name: `⏰ **Quests Update In**`,
                    value: `<t:${resetTime}:R>`,
                    inline: false
                });
        } else {
            // Add each quest to the embed
            const formatProgress = (progress: number, goal: number) => {
                const progressBar = '█'.repeat(Math.floor((progress / goal) * 10)).padEnd(10, '░');
                return `${progressBar} ${progress}/${goal}`;
            };

            // Sort quests by progress (least progress first) and then by completion status
            const sortedQuests = quests.sort((a, b) => {
                if (a.completed !== b.completed) {
                    // Completed quests should appear after incomplete ones
                    return a.completed ? 1 : -1;
                }
                return a.progress - b.progress; // Sort by progress if not completed
            });

            // Add each quest to the embed
            sortedQuests.forEach((quest) => {
                const progress = quest.completed ? `${emojis.success} Completed` : `${emojis.loadee} ${formatProgress(quest.progress, quest.goal)}`;
                embed.addFields({ 
                    name: quest.quest_name,
                    value: progress,
                    inline: false 
                });
            });

            // Add a horizontal line and time left until the next quest reset
            embed.addFields({
                name: `⏰ **Time Left Until Reset**`,
                value: `<t:${resetTime}:R>`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
});
