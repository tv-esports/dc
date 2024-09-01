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
        const xpToAdd = voucherData.xpAmount;
        let newUserXP = userQuery.xp_points + xpToAdd;
        let newLevel = userQuery.xp_level;

        // Determine the new level after adding XP
        for (const levelRole of levelRoles) {
            if (newUserXP >= levelRole.xpRequired && levelRole.level > newLevel) {
                newLevel = levelRole.level;
            }
        }

        // Update user roles if they have leveled up
        const rolesToAdd = levelRoles.filter(role => role.level > userQuery.xp_level && role.level <= newLevel);
        const rolesToAddIDs = rolesToAdd.map(role => role.role);
        const memberInGuild = interaction.guild.members.cache.get(interaction.user.id);

        if (memberInGuild) {
            await memberInGuild.roles.add(rolesToAddIDs);
        }

        // Track quest progress for "Redeem two vouchers"
        const redeemQuest = userQuery.daily_quests.find(
            (quest) => quest.quest_name === "Redeem two vouchers" && !quest.completed
        );

        if (redeemQuest) {
            redeemQuest.progress += 1;

            if (redeemQuest.progress >= redeemQuest.goal) {
                redeemQuest.completed = true;
                newUserXP += redeemQuest.reward_xp; // Add quest reward XP

                // Recalculate XP and Level with quest reward
                for (const levelRole of levelRoles) {
                    if (newUserXP >= levelRole.xpRequired && levelRole.level > newLevel) {
                        newLevel = levelRole.level;
                    }
                }

                // Update user roles if they have leveled up with quest reward
                const rolesToAddWithQuest = levelRoles.filter(role => role.level > userQuery.xp_level && role.level <= newLevel);
                const rolesToAddIDsWithQuest = rolesToAddWithQuest.map(role => role.role);

                if (memberInGuild) {
                    await memberInGuild.roles.add(rolesToAddIDsWithQuest);
                }
            }
        }

        // Update user data
        try {
            await UserModel.updateOne(
                { userID: member.id },
                {
                    xp_points: newUserXP,
                    xp_level: newLevel,
                    daily_quests: userQuery.daily_quests,
                }
            );
            console.log("User data updated successfully.");
        } catch (error) {
            console.error("Error updating user data:", error);
        }

        // Update voucher data
        try {
            await VoucherModel.updateOne(
                { voucherCode: voucherCode },
                { $inc: { usageCount: -1 }, $push: { redeemedBy: member.id } }
            );
        } catch (error) {
            console.error("Error updating voucher data:", error);
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

            // Update user roles if they have leveled up with bonus XP
            const rolesToAddWithBonus = levelRoles.filter(role => role.level > newLevel && role.level <= newLevelWithBonus);
            const rolesToAddIDsWithBonus = rolesToAddWithBonus.map(role => role.role);

            if (memberInGuild) {
                await memberInGuild.roles.add(rolesToAddIDsWithBonus);
            }

            try {
                await UserModel.updateOne(
                    { userID: member.id },
                    {
                        xp_points: newUserXP,
                        xp_level: newLevelWithBonus,
                    }
                );
                console.log("User data updated successfully with bonus XP.");
            } catch (error) {
                console.error("Error updating user data with bonus XP:", error);
            }
        } else {
            await interaction.reply({
                content: `Successfully redeemed the voucher! You have received ${voucherData.xpAmount} XP!`,
                ephemeral: true
            });
        }
    }
});
