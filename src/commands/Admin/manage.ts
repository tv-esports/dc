import { PermissionFlagsBits, ButtonBuilder, EmbedBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, TextChannel } from "discord.js";
import { ownerCheck } from "../../guards/owner";
import { Command } from "../../structures/Command";

import GuildModel from "../../models/guild/guild";
import UserModel from "../../models/user/user";
import DropModel from "../../models/xpdrop/drop";

export default new Command({
    name: "manage",
    description: "Manage the core system",
    userPermissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: "xp-setup",
            description: "Manage the XP system",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "enable",
                    description: "Enable or disable the XP system",
                    type: ApplicationCommandOptionType.Boolean,
                    required: true
                },
                {
                    name: "ignore-channel",
                    description: "Ignore a channel from XPs",
                    type: ApplicationCommandOptionType.Channel,
                    required: false
                },
                {
                    name: "ignore-role",
                    description: "Ignore a role from XPs",
                    type: ApplicationCommandOptionType.Role,
                    required: false
                }
            ],
        },
        {
            name: "xp-blacklist",
            description: "Blacklist a user from XP",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "The users ID to blackist",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ],
        },
        {
            name: "xp-whitelist",
            description: "Whitelist a user from XP",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "The users ID to whitelist",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
            ],
        },
        {
            name: "welcome-setup",
            description: "Setup the welcome system",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "enable",
                    description: "Enable or disable the welcome system",
                    type: ApplicationCommandOptionType.Boolean,
                    required: true
                },
                {
                    name: "channel",
                    description: "The channel for join messages",
                    type: ApplicationCommandOptionType.Channel,
                    required: false
                },
                {
                    name: "role",
                    description: "The role users should get when joining",
                    type: ApplicationCommandOptionType.Role,
                    required: false
                },
            ]
        },
        {
            name: "lfg-panel",
            description: "Sends the LFG panel",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "channel",
                    description: "The channel to send the panel in",
                    type: ApplicationCommandOptionType.Channel,
                    required: false
                }
            ]
        },
        {
            name: "xp-drop",
            description: "Drop XP for everyone",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "amount",
                    description: "The amount of XP to drop",
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                }
            ]
        },
        {
            name: "view-blacklist",
            description: "View the blacklisted users",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async ({ interaction, client }) => {
        await ownerCheck(interaction);
        if (interaction.replied) return;

        // const ADMIN_CHANNEL_ID = process.env.ADMIN_CHANNEL;
        // const ADMIN_CHANNEL = await interaction.guild.channels.fetch(ADMIN_CHANNEL_ID);

        if (interaction.options.getSubcommand() === "xp-setup") {
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });

            const xpEnabled = interaction.options.getBoolean("enable");
            const xpIgnoreChannel = interaction.options.getChannel("ignore-channel");
            const xpIgnoreRole = interaction.options.getRole("ignore-role");

            if (guildQuery) {
                let message = '';
                let action = '';

                if (xpEnabled === true) {
                    if (guildQuery.xp_enabled) {
                        message = 'XP is already enabled';
                    } else {
                        await GuildModel.findOneAndUpdate(
                            { guildID: interaction.guild.id },
                            { xp_enabled: true }
                        );
                        message = 'XP is now enabled!';
                    }
                } else if (xpEnabled === false) {
                    if (!guildQuery.xp_enabled) {
                        message = 'XP is already disabled!';
                    } else {
                        message = 'XP is now disabled';
                    }
                }

                if (xpIgnoreChannel) {
                    const index = guildQuery.ignored_xp_channels.indexOf(xpIgnoreChannel.id);
                    const isChannelIgnored = index !== -1;

                    isChannelIgnored
                        ? guildQuery.ignored_xp_channels.splice(index, 1)
                        : guildQuery.ignored_xp_channels.push(xpIgnoreChannel.id);

                    action = isChannelIgnored ? 'removed from' : 'added to';
                    message += `\nChannel ${xpIgnoreChannel.id} is ${action} ignore list!`;
                }

                if (xpIgnoreRole) {
                    const index = guildQuery.ignored_xp_roles.indexOf(xpIgnoreRole.id);
                    const isRoleIgnored = index !== -1;

                    isRoleIgnored
                        ? guildQuery.ignored_xp_roles.splice(index, 1)
                        : guildQuery.ignored_xp_roles.push(xpIgnoreRole.id);

                    action = isRoleIgnored ? 'removed from' : 'added to';
                    message += `\nRole ${xpIgnoreRole.id} is ${action} ignore list!`;
                }

                await GuildModel.findOneAndUpdate(
                    { guildID: interaction.guild.id },
                    {
                        xp_enabled: xpEnabled === true ? true : false,
                        ignored_xp_channels: guildQuery.ignored_xp_channels,
                        ignored_xp_roles: guildQuery.ignored_xp_roles,
                    }
                );

                return interaction.reply({ content: message, ephemeral: true });
            } else {
                await GuildModel.create({
                    guildID: interaction.guild.id,
                    xp_enabled: xpEnabled,
                    xp_ignore_channels: xpIgnoreChannel || [],
                    xp_ignore_roles: xpIgnoreRole || [],
                    inserted_at: new Date(),
                    updated_at: new Date()
                });

                return interaction.reply({ content: `XP is now enabled!`, ephemeral: true });
            }
        }

        if (interaction.options.getSubcommand() === "welcome-setup") {
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });
            const welcomeEnabled = interaction.options.getBoolean("enable");
            const welcomeChannel = interaction.options.getChannel("channel");
            const welcomeRole = interaction.options.getRole("role");

            if (guildQuery) {
                let message = '';

                if (welcomeEnabled === true) {
                    if (guildQuery.welcome_enabled) {
                        message = 'Welcome messages are already enabled';
                    } else {
                        await GuildModel.findOneAndUpdate(
                            { guildID: interaction.guild.id },
                            { welcome_enabled: true }
                        );
                        message = 'Welcome messages are now enabled!';
                    }
                } else if (welcomeEnabled === false) {
                    if (!guildQuery.welcome_enabled) {
                        message = 'Welcome messages are already disabled!';
                    } else {
                        message = 'Welcome messages are now disabled';

                        await GuildModel.findOneAndUpdate(
                            { guildID: interaction.guild.id },
                            { welcome_enabled: false }
                        );
                    }
                }

                if (welcomeChannel) {
                    await GuildModel.findOneAndUpdate(
                        { guildID: interaction.guild.id },
                        { welcome_channel: welcomeChannel.id }
                    );

                    message += `\nWelcome channel is now set to: ${welcomeChannel.id}!`;
                }

                if (welcomeRole) {
                    await GuildModel.findOneAndUpdate(
                        { guildID: interaction.guild.id },
                        { welcome_role: welcomeRole.id }
                    );

                    message += `\nWelcome role is now set to: ${welcomeRole.id}!`;
                }

                return interaction.reply({ content: message, ephemeral: true });
            } else {
                await GuildModel.create({
                    guildID: interaction.guild.id,
                    welcome_enabled: welcomeEnabled,
                    welcome_channel: welcomeChannel.id || null,
                    welcome_role: welcomeRole.id || null,
                    inserted_at: new Date(),
                    updated_at: new Date()
                });

                return interaction.reply({ content: `Welcome messages are now enabled!`, ephemeral: true });
            }
        }

        if (interaction.options.getSubcommand() === "xp-blacklist") {
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });
            const user = interaction.options.getString("id");

            const format = user.match(/\d{17,19}/);
            if (!format) return interaction.reply({ content: `Invalid user ID!`, ephemeral: true });

            if (guildQuery) {
                if (guildQuery.blacklisted_xp_users.includes(user)) {
                    return interaction.reply({ content: `This user is already blacklisted!`, ephemeral: true });
                }

                await GuildModel.findOneAndUpdate({ guildID: interaction.guild.id }, { $push: { blacklisted_xp_users: user } });

                const blacklistEmbed = new EmbedBuilder()
                    .setTitle(`User XP Blacklist`)
                    .setDescription(`<@${user}> (${user}) has been blacklisted by ${interaction.user}`)
                    .setColor("Red")
                    .setTimestamp();

                return interaction.reply({ embeds: [blacklistEmbed], ephemeral: false });
            } else {
                await GuildModel.create({
                    guildID: interaction.guild.id,
                    blacklisted_xp_users: [user],
                    inserted_at: new Date(),
                    updated_at: new Date()
                });

                return interaction.reply({ content: `This user is now blacklisted!`, ephemeral: true });
            }
        }

        if (interaction.options.getSubcommand() === "xp-whitelist") {
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });
            const user = interaction.options.getString("id");

            if (guildQuery) {
                if (!guildQuery.blacklisted_xp_users.includes(user)) {
                    return interaction.reply({ content: `This user is not blacklisted!`, ephemeral: true });
                }

                await GuildModel.findOneAndUpdate({ guildID: interaction.guild.id }, { $pull: { blacklisted_xp_users: user } });

                const whitelistEmbed = new EmbedBuilder()
                    .setTitle(`User XP Whitelist`)
                    .setDescription(`<@${user}> (${user}) has been whitelisted by ${interaction.user}`)
                    .setColor("Green")
                    .setTimestamp();

                return interaction.reply({ embeds: [whitelistEmbed], ephemeral: false });
            } else {
                return interaction.reply({ content: `Oops, did you run any guild setup yet?`, ephemeral: true });
            }
        }

        if (interaction.options.getSubcommand() === "lfg-panel") {
            const channelOption = interaction.options.getChannel("channel") || interaction.channel;
            const channel = (await interaction.guild.channels.fetch(channelOption.id)) as TextChannel;

            const panelEmbed = new EmbedBuilder()
                .setTitle(`Looking For Game`)
                .setDescription(`Click the button below to ask for a team-up!\n\nYou can choose between Duo, Trio and Squad. Additionally you can also enter needed roles for these games.`)
                .setColor("Gold")
                .setTimestamp();

            const duoQ = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Duo Q")
                .setCustomId("duoq")
            //.setEmoji("👥");

            const trioQ = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Trio")
                .setCustomId("trioq")
            //.setEmoji("👪");

            const fiveQ = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Squad")
                .setCustomId("fiveq")
            //.setEmoji("👨‍👩‍👧‍👦👥");

            const actionRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(duoQ, trioQ, fiveQ);

            await channel.send({ embeds: [panelEmbed], components: [actionRow] });
            interaction.reply({ content: `LFG panel has been sent to ${channel}`, ephemeral: true });
        }

        if (interaction.options.getSubcommand() === "xp-drop") {
            const amount = interaction.options.getInteger("amount");
            if (amount >= 15000) return interaction.reply({ content: `You can't drop more than 15000 XP!`, ephemeral: true });

            const userQuery = await UserModel.findOne({ userID: interaction.user.id });
            const dropQuery = await DropModel.findOne({ guildID: interaction.guild.id }).sort({ inserted_at: -1 });
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });
            if (!guildQuery || guildQuery.xp_enabled === false) return interaction.reply({ content: `XP is not active.`, ephemeral: true });

            if (!userQuery || userQuery.xp_level === 50 || guildQuery.blacklisted_xp_users.includes(interaction.user.id) || userQuery.prestige.is_prestige) return interaction.reply({ content: `You can't do that`, ephemeral: true });

            const embed = new EmbedBuilder()
                .setDescription(`${interaction.user} dropped some XP for everyone! 🎉`)
                .setColor("Random")
                .setImage("https://static.wikia.nocookie.net/fortnite/images/0/07/Chest_-_Chest_-_Fortnite.png/revision/latest?cb=20231016113143")
                .setFooter({ text: "Fast", iconURL: client.user?.displayAvatarURL() });

            const xpDropButton = new ButtonBuilder()
                .setCustomId("xp-drop-button")
                .setLabel("🖐 Claim")
                .setStyle(ButtonStyle.Success)

            const widButton = new ButtonBuilder()
                .setCustomId("xp-wid-button")
                .setLabel("👀 WID")
                .setStyle(ButtonStyle.Secondary)

            const lootRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(xpDropButton, widButton)

            const dropMessage = await interaction.channel.send({ embeds: [embed], components: [lootRow] });
            await interaction.reply({ content: `XP has been dropped!`, ephemeral: true });

            if (!dropQuery) {
                await DropModel.create({
                    guildID: interaction.guild.id,
                    dropMessage: dropMessage.id,
                    amount: amount,
                    inserted_at: new Date(),
                    updated_at: new Date()
                });
            } else {
                await DropModel.findOneAndUpdate({ guildID: interaction.guild.id }, { dropMessage: dropMessage.id, amount: amount });
            }
        }

        if (interaction.options.getSubcommand() === "view-blacklist") {
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });
            if (!guildQuery || guildQuery.blacklisted_xp_users.length === 0) return interaction.reply({ content: `Yikes, no data found!`, ephemeral: true });

            const blacklistedUsers = guildQuery.blacklisted_xp_users;

            const embed = new EmbedBuilder()
                .setTitle(`Blacklisted Users`)
                .setDescription(`Here are the blacklisted users:\n\n${blacklistedUsers.join("\n")}`)
                .setColor("Red")
                .setFooter({ text: `Use: https://discord.id/ to check their username` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
});