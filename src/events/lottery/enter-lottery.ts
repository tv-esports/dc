import { EmbedBuilder, TextChannel } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import { ExtendedButtonInteraction } from "../../typings/Command";

import UserModel from "../../models/user/user";
import GuildModel from "../../models/guild/guild";
import LotteryModel from "../../models/lottery/lottery";

import dedent from 'dedent';

import { levelRoles } from "../../functions/xp";

function validateLotteryNumbers(input: string) {
    // Split the input into an array of strings
    const numbersArray = input.split(',').map(number => number.trim());

    // Check if there are exactly three numbers
    if (numbersArray.length !== 3) {
        return false;
    }

    // Check if each element is a valid number between 1 and 100
    for (const numberString of numbersArray) {
        const number = parseInt(numberString, 10);

        if (isNaN(number) || number < 1 || number > 100) {
            return false;
        }
    }

    const sumOfNumbers = numbersArray.reduce((acc, cur) => acc + parseInt(cur, 10), 0);
    if (sumOfNumbers > 100) return false;

    // All checks passed, the input is valid
    return true;
}

export default class InteractionCreateEvent extends BaseEvent {
    constructor() {
        super("interactionCreate");
    }

    /**
     * Executes when a button interaction occurs.
     *
     * @param {ExtendedClient} client - The extended Discord client.
     * @param {ExtendedButtonInteraction} interaction - The button interaction.
     */
    async run(client: ExtendedClient, interaction: ExtendedButtonInteraction) {
        switch (interaction.customId) {
            case "lottery-join-modal": {
                const rawXPBet = interaction.fields.getTextInputValue("input-xp");
                const xpBet = parseInt(rawXPBet, 10);
                const numbersBet = interaction.fields.getTextInputValue("input-numbers");

                const latestLotteryQuery = await LotteryModel.findOne({ opened: true }).sort({ inserted_at: -1 });
                const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });
                const userXPQuery = await UserModel.findOne({ userID: interaction.user.id });

                const numbersBetFormat = validateLotteryNumbers(numbersBet);

                // Check if numbers format is valid
                if (!numbersBetFormat) {
                    return interaction.reply({
                        content: "Invalid numbers format! Enter three numbers between 1 and 100 separated with a comma, that is in total 100 or below.\nExample: `10, 12, 24` = 46 (must be below 100)",
                        ephemeral: true
                    });
                }

                // Check if user has enough XP or hasn't sent any messages yet
                if (!userXPQuery || userXPQuery.xp_points < rawXPBet) {
                    return interaction.reply({ content: "You don't have enough XP to enter the lottery.", ephemeral: true });
                }

                // Check if guild has no data, XP is disabled, or user is blacklisted
                if (!guildQuery || guildQuery.xp_enabled === false || guildQuery.blacklisted_xp_users.includes(interaction.user.id)) {
                    return interaction.reply({ content: "You are unable to do this.", ephemeral: true });
                }

                // Check if the user already entered the lottery
                const lotteryBets = latestLotteryQuery.lotteryBets;
                const userAlreadyEntered = lotteryBets.some((bet) => bet.userID === interaction.user.id);

                if (userAlreadyEntered) {
                    return interaction.reply({ content: "You have already entered the lottery.", ephemeral: true });
                }

                // Deduct XP and update user's level if necessary
                let newUserXP = userXPQuery.xp_points - rawXPBet;
                const newLevel = levelRoles.reverse().find((role) => newUserXP >= role.xpRequired)?.level || 0;

                // Remove roles if user levels down
                if (newLevel < userXPQuery.xp_level) {
                    const rolesToRemove = levelRoles.filter(role => role.level > newLevel && role.level <= userXPQuery.xp_level);
                    const rolesToRemoveIDs = rolesToRemove.map(role => role.role);
                    const member = interaction.guild.members.cache.get(interaction.user.id);

                    if (member) {
                        await member.roles.remove(rolesToRemoveIDs);
                    }
                }

                await UserModel.findOneAndUpdate({ userID: interaction.user.id }, { xp_points: newUserXP, xp_level: newLevel });

                // Add the user to the lottery bets and increase the lottery pot
                const updatedLottery = {
                    userID: interaction.user.id,
                    betAmount: xpBet,
                    lotteryNumbers: numbersBet.split(',').map((number: string) => parseInt(number.trim(), 10)),
                };

                await LotteryModel.findOneAndUpdate(
                    { _id: latestLotteryQuery._id },
                    { $push: { lotteryBets: updatedLottery }, $inc: { lotteryPot: rawXPBet }, $set: { updated_at: new Date() } }
                );

                // Edit the lottery message to update the pot
                const channel = (await client.channels.fetch(
                    process.env.LOTTERY_CHAT
                )) as TextChannel;

                const lotteryMessage = latestLotteryQuery.lotteryMessageID;
                const actualLotteryPot = latestLotteryQuery.lotteryPot + parseInt(rawXPBet, 10);
                const message = await channel.messages.fetch(lotteryMessage);
                if (!channel || !message) return;

                const endsIn = latestLotteryQuery.endsIn;
                const actualLotteryPotFormat = actualLotteryPot.toLocaleString();

                const embed = new EmbedBuilder()
                    .setDescription("The lottery has been opened for this week!")
                    .setColor("Random")
                    .addFields(
                        {
                            name: "Prize Pool 🎁",
                            value: `${actualLotteryPotFormat} XP`
                        },
                        {
                            name: "Ends in",
                            value: `<t:${endsIn}:R>`
                        }
                    )
                    .setImage("https://anchor-precisiongroup-uat-web.s3.ap-southeast-2.amazonaws.com/prancentral/media/blogs/4-benefits-of-playing-the-lottery.jpg?ext=.jpg")
                    .setFooter({ text: "Play carefully.", iconURL: client.user?.displayAvatarURL() });

                await message.edit({ embeds: [embed] });

                // Quest tracking for "Join the lottery"
                const joinLotteryQuest = userXPQuery.daily_quests.find(
                    (quest) => quest.quest_name === "Join the lottery" && !quest.completed
                );

                if (joinLotteryQuest) {
                    joinLotteryQuest.progress += 1;
                    if (joinLotteryQuest.progress >= joinLotteryQuest.goal) {
                        joinLotteryQuest.completed = true;
                        newUserXP += joinLotteryQuest.reward_xp;
                    }

                    // Update user data with quest progress
                    await UserModel.updateOne(
                        { userID: interaction.user.id },
                        {
                            daily_quests: userXPQuery.daily_quests,
                            xp_points: newUserXP
                        }
                    );
                }

                // Check if all daily quests are completed
                const allQuestsCompleted = userXPQuery.daily_quests.every((quest) => quest.completed);

                if (allQuestsCompleted) {
                    const bonusXP = 150;
                    newUserXP += bonusXP;

                    // Determine new level with bonus XP
                    let newLevelWithBonus = newLevel;
                    for (const levelRole of levelRoles) {
                        if (newUserXP >= levelRole.xpRequired && levelRole.level > newLevelWithBonus) {
                            newLevelWithBonus = levelRole.level;
                        }
                    }

                    // Add roles based on the new level
                    const rolesToAddWithBonus = levelRoles.filter(role => role.level > newLevel && role.level <= newLevelWithBonus);
                    const rolesToAddIDsWithBonus = rolesToAddWithBonus.map(role => role.role);

                    const memberInGuild = interaction.guild.members.cache.get(interaction.user.id);
                    if (memberInGuild) {
                        await memberInGuild.roles.add(rolesToAddIDsWithBonus);
                    }

                    // Update user's XP and level with bonus XP and new level
                    await UserModel.updateOne(
                        { userID: interaction.user.id },
                        {
                            xp_points: newUserXP,
                            xp_level: newLevelWithBonus
                        }
                    );

                    await interaction.reply({
                        content: `You joined the lottery and completed all quests! You received a bonus of ${bonusXP} XP.`,
                        ephemeral: true
                    });
                } else {
                    // Update user's XP and level without bonus
                    await UserModel.updateOne(
                        { userID: interaction.user.id },
                        {
                            xp_points: newUserXP,
                            xp_level: newLevel
                        }
                    );

                    await interaction.reply({
                        content: `Successfully entered the lottery.\nBet: ${rawXPBet} XP and your numbers: ${numbersBet}`,
                        ephemeral: true
                    });
                }
            }
        }
    }
}    