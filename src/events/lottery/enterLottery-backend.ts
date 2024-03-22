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
                // if format is wrong
                if (!numbersBetFormat) return interaction.reply({ content: "Invalid numbers format! Enter three numbers between 1 and 100 separated with a comma.\nExample: \`22, 36, 99\`", ephemeral: true });
                // if user is prestige
                if (userXPQuery.prestige.is_prestige) return interaction.reply({ content: "Prestige users can't enter the lottery.", ephemeral: true });
                // if user has not enough XP or havent sent any message yet
                if (!userXPQuery || userXPQuery.xp_points < rawXPBet) return interaction.reply({ content: "You don't have enough XP to enter the lottery.", ephemeral: true });
                // if guild has no data, disabled xp or user is blacklisted
                if (!guildQuery || guildQuery.xp_enabled === false || guildQuery.blacklisted_xp_users.includes(interaction.user.id)) return interaction.reply({ content: "You are unable to do this.", ephemeral: true });

                // check if the user already entered the lottery
                const lotteryBets = latestLotteryQuery.lotteryBets;

                const userAlreadyEntered = lotteryBets.some((bet) => bet.userID === interaction.user.id);

                if (userAlreadyEntered) return interaction.reply({ content: "You have already entered the lottery.", ephemeral: true });

                // Check if the new XP would result in a level down
                let newUserXP = userXPQuery.xp_points - rawXPBet;
                const newLevel = levelRoles.reverse().find((role) => newUserXP >= role.xpRequired)?.level || 0;

                // Remove roles for level down
                if (newLevel < userXPQuery.xp_level) {
                    const rolesToRemove = levelRoles.filter(role => role.level > newLevel && role.level <= userXPQuery.xp_level);
                    const rolesToRemoveIDs = rolesToRemove.map(role => role.role);
                    const member = interaction.guild.members.cache.get(interaction.user.id);

                    if (member) {
                        await member.roles.remove(rolesToRemoveIDs);
                    }
                }

                await UserModel.findOneAndUpdate({ userID: interaction.user.id }, { xp_points: newUserXP, xp_level: newLevel });
                // add the user to the lotteryBets and increase the lotteryPot

                const updatedLottery = {
                    userID: interaction.user.id,
                    betAmount: xpBet,
                    lotteryNumbers: numbersBet.split(',').map((number: string) => parseInt(number.trim(), 10)),
                };

                await LotteryModel.findOneAndUpdate(
                    { _id: latestLotteryQuery._id },
                    { $push: { lotteryBets: updatedLottery }, $inc: { lotteryPot: rawXPBet }, $set: { updated_at: new Date() } }
                );

                // edit the lottery message
                const channel = (await client.channels.fetch(
                    process.env.LOTTERY_CHAT
                )) as TextChannel;

                const lotteryMessage = latestLotteryQuery.lotteryMessageID;
                const actualLotteryPot = latestLotteryQuery.lotteryPot + parseInt(rawXPBet, 10);
                const message = await channel.messages.fetch(lotteryMessage);
                if (!channel || !message) return;

                const timeTillFriday12PMBerlinTimeZone_WhenItsMonday11PMRightNow = 345600000; // 4 days in milliseconds
                const timeInTimestamp = new Date(Date.now() + timeTillFriday12PMBerlinTimeZone_WhenItsMonday11PMRightNow).toLocaleDateString('en-US', { timeZone: 'Europe/Berlin' });

                const actualLotteryPotFormat = actualLotteryPot.toLocaleString();

                const embed = new EmbedBuilder()
                    .setTitle("Lottery")
                    .setDescription(dedent`
                    The lottery has been opened for this week! You can enter until Friday 12pm (${timeInTimestamp}).

                     Current price pool:
                    \`\`\`diff
                    ${actualLotteryPotFormat} XP
                    \`\`\`
    `)
                    .setColor("Random")
                    .setImage("https://anchor-precisiongroup-uat-web.s3.ap-southeast-2.amazonaws.com/prancentral/media/blogs/4-benefits-of-playing-the-lottery.jpg?ext=.jpg")
                    .setFooter({ text: "Play carefully.", iconURL: client.user?.displayAvatarURL() });



                await message.edit({ embeds: [embed] });

                interaction.reply({ content: `Successfully entered lottery.\nBet: ${rawXPBet}XP and your numbers: ${numbersBet}`, ephemeral: true });
            }
        }
    }
}