import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import { ExtendedButtonInteraction } from "../../typings/Command";

import { levelRoles, randomGif } from "../../functions/xp";

import GuildModel from "../../models/guild/guild";
import UserModel from "../../models/user/user";

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
            case "loot-button": {
                // get the users xp and level, check if he is eligible for the loot drop (not close to level up, not above level 10)
                const userQuery = await UserModel.findOne({ userID: interaction.user.id });
                if (!userQuery) return interaction.reply({ content: "You are not in the database, send messages first.", ephemeral: true });

                const guildQuery = await GuildModel.findOne({ guildID: interaction.guildId });
                if (!guildQuery || guildQuery.xp_enabled === false) return interaction.reply({ content: "The server disabled XPs", ephemeral: true });

                // check if user is blacklisted
                if (guildQuery.blacklisted_xp_users.includes(interaction.user.id)) return interaction.reply({ content: "You are not able to do that", ephemeral: true });

                const message = interaction.message;

                const usersXP = userQuery.xp_points;
                let userLevel = userQuery.xp_level;

                const today = new Date().getDay();
                const checkIfItsSaturdayOrSunday = today === 6 || today === 0;

                // if it isnt weekend, the users above level 10 cannot claim the loot
                if (!checkIfItsSaturdayOrSunday && userLevel >= 30) return interaction.reply({ content: "You cannot claim above level 30 during the week.", ephemeral: true });

                // const nextLevel = usersLevel + 1;
                // const xpRequiredForNextLevel = levelRoles.find((role) => role.level === nextLevel)?.xpRequired;

                // if (xpRequiredForNextLevel && usersXP >= xpRequiredForNextLevel) {
                //     return interaction.reply({ content: "You are close to leveling up or already leveled up.", ephemeral: true });
                // }

                const embed = new EmbedBuilder()
                    .setDescription(`${interaction.user} had fast fingers and claimed the loot! 🎉`)
                    .setColor("Random")
                    .setFooter({ text: "Come back later for a new drop!", iconURL: client.user?.displayAvatarURL() });

                const lootButton = new ButtonBuilder()
                    .setCustomId("loot-button")
                    .setLabel("🎁 Claimed")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true);

                const lootRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(lootButton)

                // const newXP = usersXP + 50 /* XP gained from loot */;
                // const nextLevelXP = levelRoles[userLevel + 1]?.xpRequired || Infinity;

                let newXP;
                // if its weekend and user is below level 10, give 100XP
                if (checkIfItsSaturdayOrSunday && userLevel < 10) {
                    newXP = usersXP + 100;
                    // if its weekend and the user is above level 10, give 50XP
                } else if (checkIfItsSaturdayOrSunday && userLevel >= 10) {
                    newXP = usersXP + 50;
                    // if its during week and the user is below level 10, give 50XP
                } else if (!checkIfItsSaturdayOrSunday && userLevel < 10) {
                    newXP = usersXP + 50;
                }

                for (const levelRole of levelRoles) {
                    if (newXP >= levelRole.xpRequired && levelRole.level > userLevel) {
                        const role = interaction.guild.roles.cache.find((r) => r.id === levelRole.role);

                        if (role && interaction.member?.roles.cache.has(role.id)) {
                            const levelUpEmbed = new EmbedBuilder()
                                .setColor("Random")
                                .setDescription(`🎉 Congratulations, you have leveled up!\nYou are now level \`${levelRole.level}\``)
                                .setImage(`${randomGif()}`)
                                .setTimestamp();
                            await interaction.reply({ content: `${interaction.user}`, embeds: [levelUpEmbed] });
                        }

                        if (role && !interaction.member?.roles.cache.has(role.id)) {
                            const levelUpEmbed = new EmbedBuilder()
                                .setColor("Random")
                                .setDescription(`🎉 Congratulations, you have leveled up!\nYou are now level \`${levelRole.level}\` and received the \`${role.name}\` role`)
                                .setImage(`${randomGif()}`)
                                .setTimestamp();
                            await interaction.member?.roles.add(role);
                            await interaction.reply({ content: `${interaction.user}`, embeds: [levelUpEmbed] });
                        }

                        userLevel = levelRole.level;

                        // if (newXP >= nextLevelXP) {
                        //     const newLevel = userLevel + 1;

                        //     await UserModel.updateOne({ userID: interaction.user.id }, { xp_points: newXP, xp_level: newLevel });
                        // }
                    }
                }

                await UserModel.updateOne({ userID: interaction.user.id }, { xp_points: newXP, xp_level: userLevel });
                await message.edit({ embeds: [embed], components: [lootRow] });
                await interaction.reply({ content: "Sucessfully opened loot, congrats!", ephemeral: true });
                break;
            }

            case "risk-button": {
                const userQuery = await UserModel.findOne({ userID: interaction.user.id });
                const guildQuery = await GuildModel.findOne({ guildID: interaction.guild?.id });
                if (!userQuery) return interaction.reply({ content: "You are not in the database, send messages first.", ephemeral: true });
                if (!guildQuery || guildQuery.xp_enabled === false) return interaction.reply({ content: "XP is disabled in this server.", ephemeral: true });

                // check if user is blacklisted
                if (guildQuery.blacklisted_xp_users.includes(interaction.user.id)) return interaction.reply({ content: "You are not able to do that", ephemeral: true });

                let userLevel = userQuery.xp_level;
                let usersXP = userQuery.xp_points;
                const message = interaction.message;

                if (userLevel < 3) return interaction.reply({ content: "You must be at least level 5 to risk it.", ephemeral: true });

                const chosenOption = Math.random() < 0.8 ? "win" : "lose"; // 80% chance to win
                let response = "";

                if (chosenOption === "win") {
                    // Handle winning the +100 XP and potential level up
                    usersXP += 100;
                    response = "You chose to risk it and won 100 XP!";

                    let levelUp = false;

                    for (const levelRole of levelRoles) {
                        if (usersXP >= levelRole.xpRequired && levelRole.level > userLevel) {
                            const role = interaction.guild.roles.cache.find((r) => r.id === levelRole.role);

                            if (role && !interaction.member?.roles.cache.has(role.id)) {
                                userLevel = levelRole.level;
                                await interaction.member?.roles.add(role);
                                response += `\nCongratulations! You reached level ${userLevel} and received the ${role.name} role!`;
                                levelUp = true;
                                break;
                            }
                        }
                    }

                    if (!levelUp) {
                        for (const levelRole of levelRoles) {
                            if (usersXP >= levelRole.xpRequired && levelRole.level > userLevel) {
                                userLevel = levelRole.level;
                                break;
                            }
                        }
                    }

                    const winEmbed = new EmbedBuilder()
                        .setDescription(`${interaction.user} went for the risk and actually won!${levelUp ? ` You reached level ${userLevel}!` : ''}`)
                        .setFooter({ text: "Play carefully", iconURL: client.user?.displayAvatarURL() })
                        .setColor("Green")
                        .setImage("https://media2.giphy.com/media/Vu5UbNpjpqfMq2UFg0/giphy.gif?cid=ecf05e47n2lcdlt9uw5rm4u81y2roffs73fe4pan87gxtlzp&ep=v1_gifs_search&rid=giphy.gif&ct=g")
                        .setTimestamp();

                    await message.edit({ embeds: [winEmbed], components: [] });
                } else {
                    // Reset to the previous level
                    for (let i = levelRoles.length - 1; i >= 0; i--) {
                        const levelRole = levelRoles[i];
                        if (usersXP >= levelRole.xpRequired && levelRole.level < userLevel) {
                            const role = interaction.guild.roles.cache.find((r) => r.id === levelRole.role);

                            if (role && interaction.member?.roles.cache.has(role.id)) {
                                await interaction.member?.roles.remove(role);
                            }

                            userLevel = levelRole.level;
                            usersXP = levelRole.xpRequired;
                            response = `You chose to risk it and lost! You've been reset to your previous level ${userLevel} with ${usersXP} XP.`;
                            break;
                        }
                    }

                    const loseEmbed = new EmbedBuilder()
                        .setDescription(`${interaction.user} went for the risk, lost, and got reset to their previous level ${userLevel} with ${usersXP} XP`)
                        .setFooter({ text: "Play carefully", iconURL: client.user?.displayAvatarURL() })
                        .setColor("Red")
                        .setImage("https://media0.giphy.com/media/DURbX7oesHiaA/giphy.gif?cid=ecf05e47zswrjgkllt8262l6l4kdm2q0kce0bkpeceyve5nf&ep=v1_gifs_search&rid=giphy.gif&ct=g")
                        .setTimestamp();

                    await message.edit({ embeds: [loseEmbed], components: [] });
                }

                // Update user's XP and level
                await UserModel.updateOne({ userID: interaction.user.id }, { xp_points: usersXP, xp_level: userLevel });

                // Respond with the chosen option and its result
                await interaction.reply({ content: response, ephemeral: true });
                break;
            }
        }
    }
}
