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
        const voucher = interaction.options.getString("redeem");
        const member = interaction.member;

        // Fetch the voucher and user data
        const voucherData = await VoucherModel.findOne({ voucherCode: voucher });
        const userQuery = await UserModel.findOne({ userID: member.id });

        if (!userQuery) return interaction.reply({ content: "Oops, you don't have an XP profile yet!", ephemeral: true });
        if (!voucherData) return interaction.reply({ content: "Oops, this voucher doesn't exist!", ephemeral: true });
    
        // Check the voucher's usage count
        const usageCount = voucherData.usageCount;

        if (usageCount === undefined) return interaction.reply({ content: "Oops, this voucher has an invalid usage count!", ephemeral: true });
        
        if (usageCount <= 0) return interaction.reply({ content: "Oops, this voucher has been fully redeemed!", ephemeral: true });

        // Check if the user has already redeemed this voucher
        if (voucherData.redeemedBy.includes(member.id)) return interaction.reply({ content: "Oops, you have already redeemed this voucher!", ephemeral: true });

        const userXP = userQuery.xp_points;
        const userLevel = userQuery.xp_level;

        const newUserXP = userXP + voucherData.xpAmount;
        const newLevel = levelRoles.reverse().find((role) => newUserXP >= role.xpRequired)?.level || 0;

        // Update user roles if they have leveled up
        if (newLevel > userLevel) {
            const rolesToAdd = levelRoles.filter(role => role.level > userLevel && role.level <= newLevel);
            const rolesToAddIDs = rolesToAdd.map(role => role.role);
            const member = interaction.guild.members.cache.get(interaction.user.id);

            if (member) await member.roles.add(rolesToAddIDs);
        }

        await UserModel.findOneAndUpdate({ userID: member.id }, { xp_points: newUserXP, xp_level: newLevel });
        await VoucherModel.updateOne({ voucherCode: voucher }, { $inc: { usageCount: -1 }, $push: { redeemedBy: member.id } });
        return interaction.reply({ content: `Successfully redeemed the voucher! You have received ${voucherData.xpAmount} XP!`, ephemeral: true });
    }
});
