import { PermissionFlagsBits, ButtonBuilder, EmbedBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, AttachmentBuilder } from "discord.js";
import { ownerCheck } from "../../guards/owner";
import { Command } from "../../structures/Command";
import UserModel from "../../models/user/user";

import config from "../../../owner.json";
import GuildModel from "../../models/guild/guild";

import { levelRoles } from "../../functions/xp";

export default new Command({
    name: "mod",
    description: "Moderate a user",
    userPermissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: "warn",
            description: "Warn a user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "Select the user",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "reason",
                    description: "The reason for the warn",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ],
        },
        {
            name: "reset-xp",
            description: "Reset the xp of a user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "Enter the users ID",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ],
        },
        {
            name: "update-xp",
            description: "Update the xp of a user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "Select the user",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "level",
                    description: "The new level for the user",
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                }
            ]
        },
        {
            name: "update-badge",
            description: "Manage the badges of a user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "Select the user",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "add",
                    description: "Add a badge to the user",
                    type: ApplicationCommandOptionType.String,
                    choices: [
                        { name: "Silver", value: "Silver" },
                        { name: "Krypton", value: "Krypton" },
                        { name: "Gold", value: "Gold" },
                        { name: "Carbon", value: "Carbon" },
                        { name: "Platin", value: "Platin" },
                        { name: "Diamond", value: "Diamond" },
                        { name: "Rubin", value: "Rubin" },
                        { name: "Sapphire", value: "Sapphire" },
                    ],
                    required: false
                },
                {
                    name: "remove",
                    description: "Remove a badge from the user",
                    type: ApplicationCommandOptionType.String,
                    choices: [
                        { name: "Silver", value: "Silver" },
                        { name: "Krypton", value: "Krypton" },
                        { name: "Gold", value: "Gold" },
                        { name: "Carbon", value: "Carbon" },
                        { name: "Platin", value: "Platin" },
                        { name: "Diamond", value: "Diamond" },
                        { name: "Rubin", value: "Rubin" },
                        { name: "Sapphire", value: "Sapphire" },
                    ],
                    required: false
                }
            ]
        },
        {
            name: "view-data",
            description: "View the extended data of a user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "The users discord ID",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "troll-user",
            description: "Mess with a user",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "Select the user",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ],
        },
    ],
    run: async ({ interaction, client }) => {
        await ownerCheck(interaction);
        if (interaction.replied) return;

        if (interaction.options.getSubcommand() === "warn") {
            const user = interaction.options.getUser("user") ?? interaction.user;
            const reason = interaction.options.getString("reason") ?? "No reason provided";
            const member = await interaction.guild.members.fetch(user.id);

            const userQuery = await UserModel.findOne({ userID: user.id });
            if (!userQuery) return interaction.reply({ content: "This user is not in the database. Let him send a message first.", ephemeral: true });
            if (!member) return interaction.reply({ content: "This user is not in the server", ephemeral: true });


            // userQuery.warnings.push({ reason: reason, moderator: interaction.user.id, date: new Date() });
            // await userQuery.save();
            userQuery.warnings += 1;
            await userQuery.save();

            if (userQuery.warnings === 3) {
                await UserModel.updateOne({ userID: user.id }, { $set: { xp_level: 0, xp_points: 0 } });
            }

            const embed = new EmbedBuilder()
                .setTitle(`User Warned`)
                .setDescription(`${user} has been warned by ${interaction.user}\nReason: ${reason}\n\nThis user now has \`${userQuery.warnings}\` warnings.`)
                .setColor("Red")
                .setTimestamp();

            await interaction.reply({ content: `${user}`, embeds: [embed], ephemeral: false });
        }

        if (interaction.options.getSubcommand() === "reset-xp") {
            const user = interaction.options.getString("id");

            const owners = config.owners.includes(interaction.user.id);
            if (user === interaction.user.id && !owners) return interaction.reply({ content: "You can't reset your own xp.", ephemeral: true });

            const userQuery = await UserModel.findOne({ userID: user });
            if (!user || !userQuery) return interaction.reply({ content: "This user is not in the database. Let him send a message first.", ephemeral: true });

            await UserModel.updateOne({ userID: user }, { $set: { xp_level: 0, xp_points: 0 } });

            const embed = new EmbedBuilder()
                .setTitle(`User XP Reset`)
                .setDescription(`<@${user}> (${user}) has had their xp reset by ${interaction.user}`)
                .setColor("Red")
                .setTimestamp();

            await interaction.reply({ content: `<@${user}>`, embeds: [embed], ephemeral: false });
        }

        if (interaction.options.getSubcommand() === "update-xp") {
            const user = interaction.options.getUser("user");
            const level = interaction.options.getInteger("level");

            const ownerCheck = config.owners.includes(interaction.user.id);
            if (!ownerCheck) return interaction.reply({ content: "You can't update xp.", ephemeral: true });

            const userQuery = await UserModel.findOne({ userID: user.id });
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });

            if (!userQuery || !guildQuery) {
                return interaction.reply({ content: "Unable to update XP. Ensure the user exists and the XP system is enabled.", ephemeral: true });
            }

            const levelRole = levelRoles.find((role) => role.level === level);
            if (!levelRole) {
                return interaction.reply({ content: "Invalid level specified.", ephemeral: true });
            }

            const newXP = levelRole.xpRequired;

            await UserModel.findOneAndUpdate(
                { userID: user.id },
                { xp_points: newXP, xp_level: level }
            );

            const updatedEmbed = new EmbedBuilder()
                .setTitle(`User XP Updated`)
                .setDescription(`${user} has had their xp updated by ${interaction.user}\n\nTheir new level is \`${level}\` with \`${newXP}\` XP.`)
                .setColor("Red")
                .setTimestamp();

            await interaction.reply({ content: `${user}`, embeds: [updatedEmbed], ephemeral: false });
        }

        if (interaction.options.getSubcommand() === "update-badge") {
            const user = interaction.options.getUser("user");
            const add = interaction.options.getString("add");
            const remove = interaction.options.getString("remove");

            const userQuery = await UserModel.findOne({ userID: user.id });
            if (!userQuery) return interaction.reply({ content: "This user is not in the database. Let him send a message first.", ephemeral: true });

            if (add) {
                if (userQuery.badges.includes(add)) {
                    return interaction.reply({ content: "This user already has this badge.", ephemeral: true });
                }

                userQuery.badges.push(add);
                await userQuery.save();

                const embed = new EmbedBuilder()
                    .setTitle(`User Badge Added`)
                    .setDescription(`${user} has had the badge ${add} added by ${interaction.user}`)
                    .setColor("Green")
                    .setFooter({ text: `Congratulations!` })
                    .setTimestamp();

                await interaction.reply({ content: `${user}`, embeds: [embed], ephemeral: false });
            }

            if (remove) {
                if (!userQuery.badges.includes(remove)) {
                    return interaction.reply({ content: "This user does not have this badge.", ephemeral: true });
                }

                userQuery.badges = userQuery.badges.filter((badge) => badge !== remove);
                await userQuery.save();

                const embed = new EmbedBuilder()
                    .setTitle(`User Badge Removed`)
                    .setDescription(`${user} has had the badge ${remove} removed by ${interaction.user}`)
                    .setColor("Red")
                    .setTimestamp();

                await interaction.reply({ content: `${user}`, embeds: [embed], ephemeral: false });
            }
        }

        if (interaction.options.getSubcommand() === "view-data") {
            const id = interaction.options.getString("id");

            const userQuery = await UserModel.findOne({ userID: id });
            if (!userQuery) return interaction.reply({ content: "This user is not in the database. Let him send a message first.", ephemeral: true });

            const data = JSON.stringify(userQuery, null, 2);
            const buffer = Buffer.from(data, "utf-8");

            const attachment = {
                name: `${id}.json`,
                file: buffer
            }

            const messageAttachment = new AttachmentBuilder(attachment.name).setName(attachment.name).setFile(attachment.file);

            await interaction.reply({ content: "Done! For privacy reasons it's only visible to you.", files: [messageAttachment], ephemeral: true });
        }

        if (interaction.options.getSubcommand() === "troll-user") {
            const userID = interaction.options.getUser("user").id;
            const userQuery = await UserModel.findOne({ userID: userID });

            if (userID === interaction.user.id) return interaction.reply({ content: "You can't troll yourself.", ephemeral: true });
            if (userID === client.user.id) return interaction.reply({ content: "You can't troll me.", ephemeral: true });
            
            if (!userQuery) return interaction.reply({ content: "This user is not in the database. Let him send a message first.", ephemeral: true });
            if (userQuery.xp_level < 10) return interaction.reply({ content: "Can't troll users below level 10.", ephemeral: true });

            const trollEmbed = new EmbedBuilder()
                .setTitle("Troll User")
                .setDescription(`
                Welcome to the troll menu. Here you can mess with a user by either being nice or mean.`)
                .addFields(
                    { name: "🔴 XP", value: "Remove random XP from the user", inline: true }, 
                    { name: "🟢 XP", value: "Add random XP to the user", inline: true },
                    { name: "🔵 Nickname", value: "Change the users nickname", inline: true },
                    { name: "🟡 Timeout", value: "Timeout the user", inline: true },
                )
                .addFields(
                    { name: "Victim", value: `<@${userID}>`, inline: false },

                )
                .setColor("Red")
                .setFooter({ text: userID })
                .setTimestamp();

            const redButton = new ButtonBuilder()
                .setCustomId("troll-xp-remove")
                .setLabel("XP")
                .setEmoji("🔴")
                .setStyle(ButtonStyle.Danger);

            const blueButton = new ButtonBuilder()
                .setCustomId("troll-xp-add")
                .setLabel("XP")
                .setEmoji("🟢")
                .setStyle(ButtonStyle.Success);

            const nicknameButton = new ButtonBuilder()
                .setCustomId("troll-nickname")
                .setLabel("Nickname")
                .setEmoji("🔵")
                .setStyle(ButtonStyle.Secondary);

            const timeoutButton = new ButtonBuilder()
                .setCustomId("troll-timeout")
                .setLabel("Timeout")
                .setEmoji("🟡")
                .setStyle(ButtonStyle.Secondary);

            const actionRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents([redButton, blueButton, nicknameButton, timeoutButton]);

            await interaction.reply({ embeds: [trollEmbed], components: [actionRow], ephemeral: false });
        }
    },
});