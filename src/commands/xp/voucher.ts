import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";

import UserModel from "../../models/user/user";
import VoucherModel from "../../models/voucher/xpvoucher";
import { levelRoles } from "../../functions/xp";

export default new Command({
    name: "voucher",
    description: "Redeem a XP voucher",
    options: [
        {
            name: "redeem",
            description: "Redeem a XP voucher",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async ({ interaction, client }) => {
        const voucherCode = interaction.options.getString("redeem");
        const member = interaction.member;

        // Fetch the voucher and user data
        const voucherData = await VoucherModel.findOne({ voucherCode: voucherCode });
        const userQuery = await UserModel.findOne({ userID: member.id });

        if (!userQuery) return interaction.reply({ content: "Oops, you don't have an XP profile yet!", ephemeral: true });
        if (!voucherData) return interaction.reply({ content: "Oops, this voucher doesn't exist!", ephemeral: true });

        // Check the voucher's usage count
        if (voucherData.usageCount === undefined || voucherData.usageCount <= 0) {
            return interaction.reply({ content: "Oops, this voucher has been fully redeemed or has an invalid usage count!", ephemeral: true });
        }

        // Check if the user has already redeemed this voucher
        if (voucherData.redeemedBy.includes(member.id)) {
            return interaction.reply({ content: "Oops, you have already redeemed this voucher!", ephemeral: true });
        }

        // Redeem the voucher
        const userXP = userQuery.xp_points;
        const userLevel = userQuery.xp_level;
        const xpToAdd = voucherData.xpAmount;
        let newUserXP = userXP + xpToAdd;
        let newLevel = userLevel;

        // Determine the new level after adding XP
        for (const levelRole of levelRoles) {
            if (newUserXP >= levelRole.xpRequired && levelRole.level > newLevel) {
                newLevel = levelRole.level;
            }
        }

        // Update user roles if they have leveled up
        const rolesToAdd = levelRoles.filter(role => role.level > userLevel && role.level <= newLevel);
        const rolesToAddIDs = rolesToAdd.map(role => role.role);
        const memberInGuild = interaction.guild.members.cache.get(interaction.user.id);

        if (memberInGuild) {
            await memberInGuild.roles.add(rolesToAddIDs);
        }

        // Update user XP and level
        await UserModel.updateOne(
            { userID: member.id },
            { xp_points: newUserXP, xp_level: newLevel }
        );

        // Update voucher data
        await VoucherModel.updateOne(
            { voucherCode: voucherCode },
            { $inc: { usageCount: -1 }, $push: { redeemedBy: member.id } }
        );

        // Track quest progress for "Redeem two vouchers"
        const redeemQuest = userQuery.daily_quests.find(
            (quest) => quest.quest_name === "Redeem two vouchers" && !quest.completed
        );
        if (redeemQuest) {
            redeemQuest.progress += 1;
            if (redeemQuest.progress >= redeemQuest.goal) {
                redeemQuest.completed = true;
                newUserXP += redeemQuest.reward_xp; // Add quest reward XP
                // Recalculate XP and Level
                // Recalculate XP and Level with quest reward
                let newXPWithQuestReward = newUserXP;
                let newLevelWithQuestReward = newLevel;

                for (const levelRole of levelRoles) {
                    if (newXPWithQuestReward >= levelRole.xpRequired && levelRole.level > newLevelWithQuestReward) {
                        newLevelWithQuestReward = levelRole.level;
                    }
                }

                // Update user roles if they have leveled up
                const rolesToAddWithQuest = levelRoles.filter(role => role.level > newLevel && role.level <= newLevelWithQuestReward);
                const rolesToAddIDsWithQuest = rolesToAddWithQuest.map(role => role.role);

                if (memberInGuild) {
                    await memberInGuild.roles.add(rolesToAddIDsWithQuest);
                }

                await UserModel.updateOne(
                    { userID: member.id },
                    { xp_points: newXPWithQuestReward, xp_level: newLevelWithQuestReward }
                );

                await interaction.reply({
                    content: `Successfully redeemed the voucher! You have received ${voucherData.xpAmount} XP! You also completed a quest and received an additional ${redeemQuest.reward_xp} XP!`,
                    ephemeral: true
                });
            } else {
                await UserModel.updateOne(
                    { userID: member.id },
                    { xp_points: newUserXP, xp_level: newLevel }
                );

                await interaction.reply({
                    content: `Successfully redeemed the voucher! You have received ${voucherData.xpAmount} XP!`,
                    ephemeral: true
                });
            }
        } else {
            await interaction.reply({
                content: `Successfully redeemed the voucher! You have received ${voucherData.xpAmount} XP!`,
                ephemeral: true
            });
        }

        // Check if all quests are completed
        const allQuestsCompleted = userQuery.daily_quests.every((quest) => quest.completed);
        if (allQuestsCompleted) {
            const bonusXP = 150;
            newUserXP += bonusXP;

            // Recalculate XP and Level with the bonus XP
            let newLevelWithBonus = newLevel;

            for (const levelRole of levelRoles) {
                if (newUserXP >= levelRole.xpRequired && levelRole.level > newLevelWithBonus) {
                    newLevelWithBonus = levelRole.level;
                }
            }

            // Update user roles if they have leveled up
            const rolesToAddWithBonus = levelRoles.filter(role => role.level > newLevel && role.level <= newLevelWithBonus);
            const rolesToAddIDsWithBonus = rolesToAddWithBonus.map(role => role.role);

            if (memberInGuild) {
                await memberInGuild.roles.add(rolesToAddIDsWithBonus);
            }

            await UserModel.updateOne(
                { userID: member.id },
                { xp_points: newUserXP, xp_level: newLevelWithBonus }
            );

            // await interaction.followUp({
            //     content: `Congratulations! All your quests are completed! You have received a bonus of ${bonusXP} XP!`,
            //     ephemeral: true
            // });
        }
    }
});
