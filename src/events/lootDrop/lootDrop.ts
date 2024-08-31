import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import { ExtendedButtonInteraction } from "../../typings/Command";
import { levelRoles } from "../../functions/xp";
import GuildModel from "../../models/guild/guild";
import UserModel from "../../models/user/user";
import DropModel from "../../models/xpdrop/drop";
import VoucherModel from "../../models/voucher/xpvoucher";

export default class InteractionCreateEvent extends BaseEvent {
    constructor() {
        super("interactionCreate");
    }

    async run(client: ExtendedClient, interaction: ExtendedButtonInteraction) {
        switch (interaction.customId) {
            case "loot-button": {
                const userQuery = await UserModel.findOne({ userID: interaction.user.id });
                const guildQuery = await GuildModel.findOne({ guildID: interaction.guildId });

                if (!userQuery) return interaction.reply({ content: "You are not in the database, send messages first.", ephemeral: true });
                if (!guildQuery || guildQuery.xp_enabled === false) return interaction.reply({ content: "The server disabled XPs", ephemeral: true });
                if (guildQuery.blacklisted_xp_users.includes(interaction.user.id)) return interaction.reply({ content: "You are not able to do that", ephemeral: true });

                const message = interaction.message;
                const usersXP = userQuery.xp_points;
                let userLevel = userQuery.xp_level;
                const today = new Date().getDay();
                const checkIfItsSaturdayOrSunday = today === 6 || today === 0;

                if (!checkIfItsSaturdayOrSunday && userLevel >= 30) return interaction.reply({ content: "You cannot claim above level 30 during the week.", ephemeral: true });

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
                    .addComponents(lootButton);

                let newXP;
                if (checkIfItsSaturdayOrSunday && userLevel < 10) {
                    newXP = usersXP + 100;
                } else if (checkIfItsSaturdayOrSunday && userLevel >= 10) {
                    newXP = usersXP + 50;
                } else if (!checkIfItsSaturdayOrSunday && userLevel < 10) {
                    newXP = usersXP + 50;
                }

                // Track quest progress for "Open two loot drops"
                const lootQuest = userQuery.daily_quests.find(
                    (quest) => quest.quest_name === "Open two loot drops" && !quest.completed
                );
                if (lootQuest) {
                    lootQuest.progress += 1;
                    if (lootQuest.progress >= lootQuest.goal) {
                        lootQuest.completed = true;
                        newXP += lootQuest.reward_xp;
                    }
                }

                // Check if all quests are completed
                const allQuestsCompleted = userQuery.daily_quests.every((quest) => quest.completed);
                if (allQuestsCompleted) {
                    const bonusXP = 150;
                    newXP += bonusXP;

                    // Determine new level with bonus XP
                    let newLevelWithBonus = userLevel;
                    for (const levelRole of levelRoles) {
                        if (newXP >= levelRole.xpRequired && levelRole.level > newLevelWithBonus) {
                            newLevelWithBonus = levelRole.level;
                        }
                    }

                    // Add roles based on the new level
                    const rolesToAddWithBonus = levelRoles.filter(role => role.level > userLevel && role.level <= newLevelWithBonus);
                    const rolesToAddIDsWithBonus = rolesToAddWithBonus.map(role => role.role);

                    const memberInGuild = interaction.guild.members.cache.get(interaction.user.id);
                    if (memberInGuild) {
                        await memberInGuild.roles.add(rolesToAddIDsWithBonus);
                    }

                    userLevel = newLevelWithBonus;
                }

                await UserModel.updateOne(
                    { userID: interaction.user.id },
                    { xp_points: newXP, xp_level: userLevel, daily_quests: userQuery.daily_quests }
                );

                await message.edit({ embeds: [embed], components: [lootRow] });
                await interaction.reply({ content: "Successfully opened loot, congrats!", ephemeral: true });
                break;
            }

            case "risk-button": {
                const userQuery = await UserModel.findOne({ userID: interaction.user.id });
                const guildQuery = await GuildModel.findOne({ guildID: interaction.guild?.id });

                if (!userQuery) return interaction.reply({ content: "You are not in the database, send messages first.", ephemeral: true });
                if (!guildQuery || guildQuery.xp_enabled === false) return interaction.reply({ content: "XP is disabled in this server.", ephemeral: true });
                if (guildQuery.blacklisted_xp_users.includes(interaction.user.id)) return interaction.reply({ content: "You are not able to do that", ephemeral: true });

                let userLevel = userQuery.xp_level;
                let usersXP = userQuery.xp_points;
                const message = interaction.message;

                if (userLevel < 3) return interaction.reply({ content: "You must be at least level 3 to risk it.", ephemeral: true });

                const chosenOption = Math.random() < 0.8 ? "win" : "lose";
                let response = "";

                if (chosenOption === "win") {
                    usersXP += 100;
                    response = "You chose to risk it and won 100 XP!";

                    let levelUp = false;
                    for (const levelRole of levelRoles) {
                        if (usersXP >= levelRole.xpRequired && levelRole.level > userLevel) {
                            const role = interaction.guild?.roles.cache.find((r) => r.id === levelRole.role);

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
                    for (let i = levelRoles.length - 1; i >= 0; i--) {
                        const levelRole = levelRoles[i];
                        if (usersXP >= levelRole.xpRequired && levelRole.level < userLevel) {
                            const role = interaction.guild?.roles.cache.find((r) => r.id === levelRole.role);

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

                // Track quest progress for "Risk it at the lootdrop"
                const riskQuest = userQuery.daily_quests.find(
                    (quest) => quest.quest_name === "Risk it at the lootdrop" && !quest.completed
                );
                if (riskQuest) {
                    riskQuest.progress += 1;
                    if (riskQuest.progress >= riskQuest.goal) {
                        riskQuest.completed = true;
                        usersXP += riskQuest.reward_xp;
                    }
                }

                // Check if all quests are completed
                const allQuestsCompleted = userQuery.daily_quests.every((quest) => quest.completed);
                if (allQuestsCompleted) {
                    const bonusXP = 150;
                    usersXP += bonusXP;

                    // Determine new level with bonus XP
                    let newLevelWithBonus = userLevel;
                    for (const levelRole of levelRoles) {
                        if (usersXP >= levelRole.xpRequired && levelRole.level > newLevelWithBonus) {
                            newLevelWithBonus = levelRole.level;
                        }
                    }

                    // Add roles based on the new level
                    const rolesToAddWithBonus = levelRoles.filter(role => role.level > userLevel && role.level <= newLevelWithBonus);
                    const rolesToAddIDsWithBonus = rolesToAddWithBonus.map(role => role.role);

                    const memberInGuild = interaction.guild.members.cache.get(interaction.user.id);
                    if (memberInGuild) {
                        await memberInGuild.roles.add(rolesToAddIDsWithBonus);
                    }

                    userLevel = newLevelWithBonus;
                }

                await UserModel.updateOne(
                    { userID: interaction.user.id },
                    { xp_points: usersXP, xp_level: userLevel, daily_quests: userQuery.daily_quests }
                );

                await interaction.reply({ content: response, ephemeral: true });
                break;
            }

            case "drop-extra-xp-button": {
                const message = interaction.message;
                const amount = 25;
                const userQuery = await UserModel.findOne({ userID: interaction.user.id });
                const dropQuery = await DropModel.findOne({ guildID: interaction.guild.id }).sort({ inserted_at: -1 });
                const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });

                if (!guildQuery || guildQuery.xp_enabled === false) return interaction.reply({ content: `XP is not active.`, ephemeral: true });
                if (!userQuery || guildQuery.blacklisted_xp_users.includes(interaction.user.id)) return interaction.reply({ content: `You can't do that`, ephemeral: true });

                const extraXPEmbed = new EmbedBuilder()
                    .setDescription(`<@${interaction.user.id}> decided to drop some extra XP`)
                    .setColor("Random")
                    .setImage("https://static.wikia.nocookie.net/fortnite/images/0/07/Chest_-_Chest_-_Fortnite.png/revision/latest?cb=20231016113143")
                    .setTimestamp()
                    .setFooter({ text: "Fast!", iconURL: client.user?.displayAvatarURL() });

                const xpDropButton = new ButtonBuilder()
                    .setCustomId("xp-drop-button")
                    .setLabel("🖐 Claim")
                    .setStyle(ButtonStyle.Success);

                const xpRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(xpDropButton);

                await message.edit({ embeds: [extraXPEmbed], components: [xpRow] });

                if (!dropQuery) {
                    await DropModel.create({ guildID: interaction.guild.id, dropMessage: message.id, amount: amount, inserted_at: new Date(), updated_at: new Date() });
                } else {
                    await DropModel.findOneAndUpdate({ guildID: interaction.guild.id }, { dropMessage: message.id, amount: amount });
                }
                break;
            }

            case "share-xp-button": {
                const message = interaction.message;
                const xpToShare = 30;
                const usage = 2;
                const voucherCode = Math.random().toString(36).substring(7);

                const shareXPEmbed = new EmbedBuilder()
                    .setDescription(`<@${interaction.user.id}> decided to share an XP voucher with a friend\n\n\`\`\`${voucherCode}\`\`\`\nTo redeem, use \`/voucher redeem <code>\``)
                    .setColor("Random")
                    .setImage("https://paytechlaw.com/wp-content/uploads/190414_Corona-Voucher_Artenauta.png")
                    .setTimestamp()
                    .setFooter({ text: "Fast!", iconURL: client.user?.displayAvatarURL() });

                await VoucherModel.create({
                    adminID: interaction.user.id,
                    xpAmount: xpToShare,
                    voucherCode: voucherCode,
                    usageCount: usage,
                    redeemedBy: [],
                    inserted_at: new Date(),
                    updated_at: new Date()
                });

                await message.edit({ embeds: [shareXPEmbed], components: [] });
                break;
            }

            case "destroy-button": {
                const message = interaction.message;
                const userQuery = await UserModel.findOne({ userID: interaction.user.id });

                const destroyEmbed = new EmbedBuilder()
                    .setDescription(`<@${interaction.user.id}> decided to destroy the loot chest`)
                    .setColor("Random")
                    .setImage("https://www.brandonthatchers.co.uk/uploads/items/33e065a17e37cbee/14438daf0c83b3b3.jpeg?size=224&date=1660743589")
                    .setTimestamp()
                    .setFooter({ text: "R.I.P", iconURL: client.user?.displayAvatarURL() });

                // Track quest progress for "Destroy one lootdrop"
                const destroyQuest = userQuery.daily_quests.find(
                    (quest) => quest.quest_name === "Destroy one lootdrop" && !quest.completed
                );
                if (destroyQuest) {
                    destroyQuest.progress += 1;
                    if (destroyQuest.progress >= destroyQuest.goal) {
                        destroyQuest.completed = true;
                        userQuery.xp_points += destroyQuest.reward_xp;
                    }
                }

                // Check if all quests are completed
                const allQuestsCompleted = userQuery.daily_quests.every((quest) => quest.completed);
                if (allQuestsCompleted) {
                    const bonusXP = 150;
                    userQuery.xp_points += bonusXP;

                    // Determine new level with bonus XP
                    let newLevelWithBonus = userQuery.xp_level;
                    for (const levelRole of levelRoles) {
                        if (userQuery.xp_points >= levelRole.xpRequired && levelRole.level > newLevelWithBonus) {
                            newLevelWithBonus = levelRole.level;
                        }
                    }

                    // Add roles based on the new level
                    const rolesToAddWithBonus = levelRoles.filter(role => role.level > userQuery.xp_level && role.level <= newLevelWithBonus);
                    const rolesToAddIDsWithBonus = rolesToAddWithBonus.map(role => role.role);

                    const memberInGuild = interaction.guild.members.cache.get(interaction.user.id);
                    if (memberInGuild) {
                        await memberInGuild.roles.add(rolesToAddIDsWithBonus);
                    }

                    userQuery.xp_level = newLevelWithBonus;
                }

                await UserModel.updateOne(
                    { userID: interaction.user.id },
                    { daily_quests: userQuery.daily_quests, xp_points: userQuery.xp_points, xp_level: userQuery.xp_level }
                );

                await message.edit({ embeds: [destroyEmbed], components: [] });
                break;
            }
        }
    }
}
