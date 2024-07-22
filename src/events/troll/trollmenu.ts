import { EmbedBuilder } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import { ExtendedButtonInteraction } from "../../typings/Command";

import UserModel from "../../models/user/user";
import { levelRoles, randomGif } from "../../functions/xp";

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
            case "troll-xp-remove":
                // check if the user has the permission to use this button
                if (!interaction.member.permissions.has("ModerateMembers")) return interaction.reply({ content: "You don't have the permission to use this button.", ephemeral: true });

                const userID = interaction.message.embeds[0].footer.text;
                const member = await interaction.guild.members.fetch(userID);

                // get a random number between 50 and 200
                const xpToRemove = Math.floor(Math.random() * 150) + 50;

                // get the user's document
                const userQuery = await UserModel.findOne({ userID: userID });
                let usersXP = userQuery.xp_points;
                let usersLevel = userQuery.xp_level;

                let newUserXP = usersXP - xpToRemove;
                const newLevel = levelRoles.reverse().find((role) => newUserXP >= role.xpRequired)?.level || 0;

                // Remove roles for level down
                if (newLevel < usersLevel) {
                    const rolesToRemove = levelRoles.filter(role => role.level > newLevel && role.level <= usersLevel);
                    const rolesToRemoveIDs = rolesToRemove.map(role => role.role);
                    const member = interaction.guild.members.cache.get(interaction.user.id);

                    if (member) {
                        await member.roles.remove(rolesToRemoveIDs);
                    }
                }

                const embed = new EmbedBuilder()
                .setDescription(`<@${interaction.user.id}> made a decision.`)
                .addFields(
                    { name: "🔴", value: `Removed ${xpToRemove} XP from ${member}.` },
                )
                .setFooter({ text: `Their new level is ${newLevel} with ${newUserXP} XP` })
                .setColor("Random");

                await UserModel.findOneAndUpdate({ userID: userID }, { xp_points: newUserXP, xp_level: newLevel });
                await interaction.message.edit({ embeds: [embed], components: [] });
                await interaction.reply({ content: "Done", ephemeral: true });
                break;

            case "troll-xp-add":
                if (!interaction.member.permissions.has("ModerateMembers")) return interaction.reply({ content: "You don't have the permission to use this button.", ephemeral: true });

                const userID2 = interaction.message.embeds[0].footer.text;
                const member2 = await interaction.guild.members.fetch(userID2);

                // get a random number between 50 and 200
                const xpToAdd = Math.floor(Math.random() * 150) + 50;

                // get the user's document
                const userQuery2 = await UserModel.findOne({ userID: userID2 });
                let usersXP2 = userQuery2.xp_points;
                let usersLevel2 = userQuery2.xp_level;

                let newUserXP2 = usersXP2 + xpToAdd;
                const newLevel2 = levelRoles.reverse().find((role) => newUserXP2 >= role.xpRequired)?.level || 0;

                // Add roles for level up
                if (newLevel2 > usersLevel2) {
                    const rolesToAdd = levelRoles.filter(role => role.level > usersLevel2 && role.level <= newLevel2);
                    const rolesToAddIDs = rolesToAdd.map(role => role.role);
                    const member = interaction.guild.members.cache.get(interaction.user.id);

                    if (member) {
                        await member.roles.add(rolesToAddIDs);
                    }
                }

                const embed2 = new EmbedBuilder()
                .setDescription(`<@${interaction.user.id}> made a decision.`)
                .addFields(
                    { name: "🟢", value: `Added ${xpToAdd} XP to ${member2}.` },
                )
                .setFooter({ text: `Their new level is ${newLevel2} with ${newUserXP2} XP` })
                .setColor("Random");

                await UserModel.findOneAndUpdate({ userID: userID2 }, { xp_points: newUserXP2, xp_level: newLevel2 });
                await interaction.message.edit({ embeds: [embed2], components: [] });
                await interaction.reply({ content: "Done", ephemeral: true });
                break;

            case "troll-nickname":
                if (!interaction.member.permissions.has("ModerateMembers")) return interaction.reply({ content: "You don't have the permission to use this button.", ephemeral: true });

                const userID3 = interaction.message.embeds[0].footer.text;
                const member3 = await interaction.guild.members.fetch(userID3);

                // get a random number between 50 and 200
                const nicknames: string[] = [
                    "TV | 🤡 Clown",
                    "TV | 🐍 Snake",
                    "TV | 🐷 Pig",
                    "TV | 🐀 Rat",
                    "TV | 🐶 Dog",
                    "TV | 🐱 Cat",
                    "TV | 🐯 Tiger",
                    "TV | 🐻 Bear",
                    "TV | 🐵 Monkey",
                    "TV | 🐘 Elephant",
                ]; 

                const randomNickame = nicknames[Math.floor(Math.random() * nicknames.length)];

                const embed3 = new EmbedBuilder()
                .setDescription(`<@${interaction.user.id}> made a decision.`)
                .addFields(
                    { name: "🔵", value: `Changed ${member3}'s nickname successfully.` },
                )
                .setColor("Random");

                await member3.setNickname(randomNickame);
                await interaction.message.edit({ embeds: [embed3], components: [] });
                await interaction.reply({ content: "Done! Btw. you have to change back the nickname manually!", ephemeral: true });
                break;

            case "troll-timeout":
                if (!interaction.member.permissions.has("ModerateMembers")) return interaction.reply({ content: "You don't have the permission to use this button.", ephemeral: true });
                
                const userID4 = interaction.message.embeds[0].footer.text;
                const member4 = await interaction.guild.members.fetch(userID4);

                const embed4 = new EmbedBuilder()
                .setDescription(`<@${interaction.user.id}> made a decision.`)
                .addFields(
                    { name: "🟠", value: `Timed out ${member4} for 1 minute.` },
                )
                .setColor("Random");

                await member4.timeout(1000 * 60)
                await interaction.message.edit({ embeds: [embed4], components: [] });
                await interaction.reply({ content: "Done", ephemeral: true });
                break;
        }
    }
}