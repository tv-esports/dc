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

        const hasPremiumPerk = userQuery && userQuery.inventory.some((item) => item.name === "Premium");

        // If userQuery is null (user not found in database), create a new user
        if (!userQuery) {
            userQuery = await UserModel.create({
                userID: message.author.id,
                xp_level: 0,
                xp_points: 0,
                warnings: 0,
                inserted_at: new Date(),
                updated_at: new Date(),
                daily_quests: [] // Initialize with an empty quest list
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

        // Quest tracking for "Send 80 messages"
        const sendMessagesQuest = userQuery.daily_quests.find(
            (quest) => quest.quest_name === "Send 80 messages" && !quest.completed
        );

        if (sendMessagesQuest) {
            sendMessagesQuest.progress += 1;
            if (sendMessagesQuest.progress >= sendMessagesQuest.goal) {
                sendMessagesQuest.completed = true;
                userQuery.xp_points += sendMessagesQuest.reward_xp;
            }
        }

        // Quest tracking for "Send five images"
        const sendImagesQuest = userQuery.daily_quests.find(
            (quest) => quest.quest_name === "Send five images" && !quest.completed
        );

        if (sendImagesQuest && message.attachments.size > 0) {
            const imageAttachments = message.attachments.filter(attachment =>
                attachment.contentType?.startsWith("image/")
            );

            if (imageAttachments.size > 0) {
                sendImagesQuest.progress += 1;
                if (sendImagesQuest.progress >= sendImagesQuest.goal) {
                    sendImagesQuest.completed = true;
                    userQuery.xp_points += sendImagesQuest.reward_xp;
                }
            }
        }

        // Check if all quests are completed for bonus XP
        const allQuestsCompleted = userQuery.daily_quests.every((quest) => quest.completed);
        if (allQuestsCompleted) {
            const bonusXP = 150; // Bonus XP
            userQuery.xp_points += bonusXP;
            console.log(`User ${message.author.tag} has completed all daily quests and earned bonus XP.`);

            // Update user level based on new XP after bonus
            for (const levelRole of levelRoles) {
                if (userQuery.xp_points >= levelRole.xpRequired && levelRole.level > userLevel) {
                    const role = message.guild.roles.cache.find((r) => r.id === levelRole.role);

                    if (role && message.member?.roles.cache.has(role.id)) {
                        console.log(`User ${message.author.tag} already has the role ${role.name}.`);
                    } else if (role) {
                        await message.member?.roles.add(role);
                        console.log(`User ${message.author.tag} has been assigned the role ${role.name}.`);
                    }

                    userLevel = levelRole.level;
                }
            }
        }

        // Assign new XP and level if necessary
        for (const levelRole of levelRoles) {
            if (newXP >= levelRole.xpRequired && levelRole.level > userLevel) {
                const role = message.guild.roles.cache.find((r) => r.id === levelRole.role);

                if (role && message.member?.roles.cache.has(role.id)) {
                    console.log(`User ${message.author.tag} already has the role ${role.name}.`);
                } else if (role) {
                    await message.member?.roles.add(role);
                    console.log(`User ${message.author.tag} has been assigned the role ${role.name}.`);
                }

                userLevel = levelRole.level;
            }
        }

        // Save the updated user data
        await UserModel.findOneAndUpdate(
            { userID: message.author.id },
            {
                xp_points: newXP,
                xp_level: userLevel,
                messages_sent: defaultMessagesSent + 1,
                daily_quests: userQuery.daily_quests
            }
        );
    }
}
