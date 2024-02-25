import { EmbedBuilder, TextChannel } from "discord.js";
import cron from "node-cron";
import { client } from "../index";

import GuildModel from "../models/guild/guild";
import UserModel from "../models/user/user";

import { levelRoles } from "../functions/xp";

export async function victim() {
    const channel = (await client.channels.fetch(process.env.MAIN_CHAT)) as TextChannel;

    if (!channel) return;

    const guildQuery = await GuildModel.findOne({ guildID: channel.guild.id });
    if (!guildQuery || guildQuery.xp_enabled === false) return;

    // every day at 3am
    cron.schedule("0 3 * * *", async () => {
        const usersAbove15 = await UserModel.find({
            guildID: channel.guild.id,
            xp_level: { $gt: 25 } // Users above level 25 can be a victim
        });

        const usersBetween5And15 = await UserModel.find({
            guildID: channel.guild.id,
            xp_level: { $gt: 10, $lte: 20 } // Users above level 10 and at or below level 15
        });
        
        if (usersAbove15.length === 0 || usersBetween5And15.length === 0) return;

        const selectEmbed = new EmbedBuilder()
            .setDescription("It's 3am, the time has come. I am now selecting a victim and a beneficiary for today ...")
            .setImage("https://media4.giphy.com/media/7LzsVhXKgiGCQ/giphy.gif?cid=ecf05e47v7rbs68nfl9kspopugthqyeo3xfe63dsc3c5d5oy&ep=v1_gifs_related&rid=giphy.gif&ct=g")
            .setColor("Red")

        const selectMsg = await channel.send({ embeds: [selectEmbed] });

        setTimeout(async () => {
            await selectMsg.delete();

            // Randomly select a user above level 15
            const victimIndex = Math.floor(Math.random() * usersAbove15.length);
            const victim = usersAbove15[victimIndex];

            const newVictimLevel = Math.max(victim.xp_level - 2, 1); // Decrease level by 2, minimum level is 1
            const victimRole = levelRoles.find((role) => role.level === newVictimLevel);
            const victimXP = victimRole ? victimRole.xpRequired : 0; // Reset XP to the minimum of the new level

            // Randomly select a user below level 15
            const beneficiaryIndex = Math.floor(Math.random() * usersBetween5And15.length);
            const beneficiary = usersBetween5And15[beneficiaryIndex];

            const newBeneficiaryLevel = Math.min(beneficiary.xp_level + 2, 50); // Increase level by 2, maximum level is 50
            const beneficiaryRole = levelRoles.find((role) => role.level === newBeneficiaryLevel);
            const beneficiaryXP = beneficiaryRole ? beneficiaryRole.xpRequired : 0; // Set XP to the role requirement

            const victimMember = channel.guild.members.cache.get(victim.userID);
            const beneficiaryMember = channel.guild.members.cache.get(beneficiary.userID);

            // Update victim's level and XP
            await UserModel.updateOne(
                { userID: victim.userID },
                { xp_level: newVictimLevel, xp_points: victimXP }
            );

            // Update beneficiary's level and XP
            await UserModel.updateOne(
                { userID: beneficiary.userID },
                { xp_level: newBeneficiaryLevel, xp_points: beneficiaryXP }
            );


            const resultEmbed = new EmbedBuilder()
                .setDescription(`The reaper found his victim.\n\n<@${victim.userID}> almost got stabbed and therefore was downgraded to level ${newVictimLevel} with ${victimXP} XP.\n<@${beneficiary.userID}> escaped, their new level is ${newBeneficiaryLevel} with ${beneficiaryXP} XP.`)
                .setImage("https://media3.giphy.com/media/OY9XK7PbFqkNO/giphy.gif?cid=ecf05e47m92wk56yfvvvp9o8v1wn4tllwkrvl7mlru3ckwjl&ep=v1_gifs_search&rid=giphy.gif&ct=g")
                .setFooter({ text: "The reaper will try it again ..." })
                .setColor("Red")

            await channel.send({
                embeds: [resultEmbed]
            });

            // handling roles
            for (const levelRole of levelRoles) {
                const role = channel.guild.roles.cache.find((r) => r.id === levelRole.role);

                if (victimXP >= levelRole.xpRequired && levelRole.level > newVictimLevel) {
                    if (role && victimMember?.roles.cache.has(role.id)) {
                        await victimMember?.roles.remove(role);
                    }
                }

                if (beneficiaryXP >= levelRole.xpRequired && levelRole.level > newBeneficiaryLevel) {
                    if (role && !beneficiaryMember?.roles.cache.has(role.id)) {
                        await beneficiaryMember?.roles.add(role);
                    }
                }
            }
        }, 30000); // Wait for 30 seconds
    }, {
        scheduled: true,
        timezone: "Europe/Berlin"
    });
}