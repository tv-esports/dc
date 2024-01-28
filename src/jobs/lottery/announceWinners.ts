import { EmbedBuilder, TextChannel } from "discord.js";
import cron from "node-cron";
import { client } from "../../index";

import UserModel from "../../models/user/user";
import GuildModel from "../../models/guild/guild";
import LotteryModel from "../../models/lottery/lottery";
import { levelRoles } from "../../functions/xp";

import dedent from 'dedent';

export async function announceWinners() {
    const channel = (await client.channels.fetch(process.env.LOTTERY_CHAT)) as TextChannel;

    if (!channel) return;

    const guildQuery = await GuildModel.findOne({ guildID: channel.guild.id });
    if (!guildQuery || guildQuery.xp_enabled === false) return;

    const lotteryQuery = await LotteryModel.findOne({ opened: false }).sort({ inserted_at: -1 });
    if (!lotteryQuery) return;

    // lottery generated numbers sum
    const lotteryNumbers = lotteryQuery.lotteryNumbers;
    const flattenedNumbers = lotteryNumbers.flat();
    const lotteryNumbersSum = flattenedNumbers.reduce((a, b) => a + Number(b), 0);
    const lotteryPot = lotteryQuery.lotteryPot;

    const lotteryMessage = lotteryQuery.lotteryMessageID;
    const lotteryBets = lotteryQuery.lotteryBets;

    // friday 8pm
    cron.schedule("20 20 * * FRI", async () => {
        let exactWinnerFound = false;

        for (const bet of lotteryBets) {
            const userQuery = await UserModel.findOne({ userID: bet.userID });

            if (!userQuery) continue;

            // Calculate the sum of user's numbers
            const userNumbersSum = bet.lotteryNumbers.reduce((a, b) => a + Number(b), 0);
            const message = await channel.messages.fetch(lotteryMessage);
            if (!message) return;

            // Check if the user guessed the exact number
            if (userNumbersSum === lotteryNumbersSum) {
                const winnings = lotteryPot;

                const updatedXP = userQuery.xp_points + winnings;
                let updatedLevel = userQuery.xp_level;
                for (const levelRole of levelRoles) {
                    if (updatedXP >= levelRole.xpRequired && levelRole.level > updatedLevel) {
                        const role = channel.guild?.roles.cache.find((r) => r.id === levelRole.role);

                        if (role && !channel.guild?.members.cache.get(bet.userID)?.roles.cache.has(role.id)) {
                            await channel.guild?.members.cache.get(bet.userID)?.roles.add(role);
                        }

                        updatedLevel = levelRole.level;
                    }
                }

                await UserModel.updateOne({ userID: bet.userID }, { xp_points: updatedXP, xp_level: updatedLevel, updated_at: new Date() });

                const wonXP = dedent`
                ${winnings} XP\n
                `

                const jackpotWinnerEmbed = new EmbedBuilder()
                    .setTitle("🎉 Jackpot Winner 🎉")
                    .setDescription(dedent`
                    Congratulations to the user: <@${bet.userID}>!
                    The sum of the lottery numbers was ${lotteryNumbersSum} and you guessed it exactly!
        
                    You won:
                    \`\`\`diff
                    ${wonXP}
                    \`\`\`
                    `)
                    .setColor("Green")
                    .setImage("https://media.istockphoto.com/id/1299870911/vector/big-win-banner.jpg?s=612x612&w=0&k=20&c=MEHngN8fRZbwHo1L-Sw32ZStupkYMOA7LJkyk2tAQ-g=")
                    .setTimestamp();


                await LotteryModel.updateOne({ lotteryMessageID: lotteryMessage }, { winner: bet.userID, updated_at: new Date() });
                await message.edit({ embeds: [jackpotWinnerEmbed], components: [] });

                exactWinnerFound = true;
                break; // Exit the loop since we have an exact winner
            }
        }

        // If nobody guessed the exact number, check for users within the range
        if (!exactWinnerFound) {
            const range = 20; // 20 points above or below
            const rangeWinners = lotteryBets.filter((b) => Math.abs(b.lotteryNumbers.reduce((a, b) => a + Number(b), 0) - lotteryNumbersSum) <= range);

            if (rangeWinners.length > 0) {
                const rangeWinnings = (30 / 100) * lotteryPot / rangeWinners.length;
                // Update user's XP with range winnings
                for (const winner of rangeWinners) {
                    const updatedUserQuery = await UserModel.findOne({ userID: winner.userID });

                    if (!updatedUserQuery) continue;

                    const updatedXP = updatedUserQuery.xp_points + rangeWinnings;
                    const message = await channel.messages.fetch(lotteryMessage);
                    if (!message) return;

                    // Check for level-up and role update
                    let updatedLevel = updatedUserQuery.xp_level;
                    for (const levelRole of levelRoles) {
                        if (updatedXP >= levelRole.xpRequired && levelRole.level > updatedLevel) {
                            const role = channel.guild?.roles.cache.find((r) => r.id === levelRole.role);

                            if (role && !channel.guild?.members.cache.get(winner.userID)?.roles.cache.has(role.id)) {
                                await channel.guild?.members.cache.get(winner.userID)?.roles.add(role);
                            }

                            updatedLevel = levelRole.level;
                        }
                    }

                    // Update user XP and level in the database
                    await UserModel.updateOne({ userID: winner.userID }, { xp_points: updatedXP, xp_level: updatedLevel, updated_at: new Date() });

                    const wonXP = dedent`
                    ${rangeWinnings} XP\n
                    `

                    const rageWinnersEmbed = new EmbedBuilder()
                        .setTitle("🎉 Range Winner 🎉")
                        .setDescription(dedent`
                        Congratulations to the users:
                        ${rangeWinners.map((w) => `<@${w.userID}>`).join("\n")}!
                        The sum of the lottery numbers was ${lotteryNumbersSum}.

                        Each of you won:
                        \`\`\`diff
                        ${wonXP}
                        \`\`\`
                         `)
                        .setColor("Green")
                        .setImage("https://www.shutterstock.com/image-vector/game-level-badges-award-icons-600nw-2397615147.jpg")
                        .setTimestamp();


                    await LotteryModel.updateOne({ lotteryMessageID: lotteryMessage }, { winner: "multi", updated_at: new Date() });
                    await message.edit({ embeds: [rageWinnersEmbed], components: [] });
                }
            } else {
                const message = await channel.messages.fetch(lotteryMessage);
                if (!message) return;


                const noWinnerEmbed = new EmbedBuilder()
                    .setTitle("❌ No Winner ❌")
                    .setDescription(`
                    The lottery has been closed completely.\n\nUnfortunately, nobody guessed the exact number nor was within the range of ${range} points.\n
                    The sum of the lottery numbers was ${lotteryNumbersSum}.
                    Better luck next time! ☘️
                    `)
                    .setColor("Red")
                    .setTimestamp();

                await LotteryModel.updateOne({ lotteryMessageID: lotteryMessage }, { winner: "none", updated_at: new Date() });
                await message.edit({ embeds: [noWinnerEmbed], components: [] });
            }
        }
    }, {
        scheduled: true,
        timezone: "Europe/Berlin"
    });
}