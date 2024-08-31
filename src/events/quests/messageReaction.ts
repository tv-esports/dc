import { GuildMember, MessageReaction, User as DiscordUser } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import UserModel from "../../models/user/user";
import { levelRoles } from "../../functions/xp";

export default class MessageReactionEvent extends BaseEvent {
    constructor() {
        super("messageReactionAdd");
    }

    async run(client: ExtendedClient, reaction: MessageReaction, user: GuildMember | DiscordUser) {
        if (user instanceof GuildMember && user.user.bot) return; // Ignore bot reactions

        const discordUser = user as DiscordUser;
        const userID = discordUser.id;

        // Fetch the user from the database
        const dbUser = await UserModel.findOne({ userID }).exec();

        if (!dbUser) {
            console.log(`User with ID ${userID} not found`);
            return;
        }

        // Find the specific quest "Add 20 reactions to messages"
        const targetQuestIndex = dbUser.daily_quests.findIndex(
            (quest) => quest.quest_name === "Add 20 reactions to messages" && !quest.completed
        );

        if (targetQuestIndex === -1) return; // Quest not found

        const targetQuest = dbUser.daily_quests[targetQuestIndex];

        // Increment quest progress
        targetQuest.progress += 1;

        // Check if the quest is completed
        let bonusXP = 0;
        if (targetQuest.progress >= targetQuest.goal) {
            targetQuest.completed = true;
            dbUser.xp_points += targetQuest.reward_xp;

            // Check if all quests are completed
            const allQuestsCompleted = dbUser.daily_quests.every((quest) => quest.completed);
            if (allQuestsCompleted) {
                bonusXP = 150; // Bonus XP
                console.log(`User ${discordUser.tag} has completed all daily quests.`);
            }
        }

        // Update user XP and check for level-up
        const newXP = dbUser.xp_points + bonusXP;
        let userLevel = dbUser.xp_level;

        // Ensure the message.guild exists
        if (reaction.message.guild) {
            const guild = reaction.message.guild;
            const member = await guild.members.fetch(userID); // Fetch the member object

            // Determine the new level with the updated XP
            for (const levelRole of levelRoles) {
                if (newXP >= levelRole.xpRequired && levelRole.level > userLevel) {
                    // Assign the new level role if the user has not already received it
                    const role = guild.roles.cache.find((r) => r.id === levelRole.role);
                    if (role && member.roles.cache.has(role.id)) {
                        console.log(`User ${discordUser.tag} already has the role ${role.name}.`);
                    } else if (role) {
                        await member.roles.add(role);
                        console.log(`User ${discordUser.tag} has been assigned the role ${role.name}.`);
                    }

                    userLevel = levelRole.level;
                }
            }

            // Save the updated user data
            await UserModel.updateOne(
                { userID },
                {
                    $set: {
                        daily_quests: dbUser.daily_quests,
                        xp_points: newXP,
                        xp_level: userLevel
                    }
                }
            );
        } else {
            console.log(`Message guild is undefined for message ID ${reaction.message.id}.`);
        }
    }
}
