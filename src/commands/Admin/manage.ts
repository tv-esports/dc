import { PermissionFlagsBits, ButtonBuilder, EmbedBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, TextChannel } from "discord.js";
import { ownerCheck } from "../../guards/owner";
import { Command } from "../../structures/Command";

import GuildModel from "../../models/guild/guild";
import UserModel from "../../models/user/user";
import DropModel from "../../models/xpdrop/drop";
import VoucherModel from "../../models/voucher/xpvoucher";
import { levelRoles } from "../../functions/xp";

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
            name: "voucher",
            description: "Create a voucher for XP",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "xp",
                    description: "The amount of XP to give",
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                },
                {
                    name: "usage",
                    description: "The amount of times the voucher can be used",
                    type: ApplicationCommandOptionType.Integer,
                    required: false
                }
            ]
        },
        {
            name: "view-blacklist",
            description: "View the blacklisted users",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "gtn",
            description: "Start a Guess The Number game",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "reaper",
            description: "Reap the souls of the inactive users",
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

        if (interaction.options.getSubcommand() === "xp-drop") {
            const amount = interaction.options.getInteger("amount");
            if (amount >= 15000) return interaction.reply({ content: `You can't drop more than 15000 XP!`, ephemeral: true });

            const userQuery = await UserModel.findOne({ userID: interaction.user.id });
            const dropQuery = await DropModel.findOne({ guildID: interaction.guild.id }).sort({ inserted_at: -1 });
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });
            if (!guildQuery || guildQuery.xp_enabled === false) return interaction.reply({ content: `XP is not active.`, ephemeral: true });

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

        if (interaction.options.getSubcommand() === "voucher") {
            const xp = interaction.options.getInteger("xp");
            const usage = interaction.options.getInteger("usage") || 1;

            const voucherCode = Math.random().toString(36).substring(7);

            const embed = new EmbedBuilder()
                .setTitle(`Generated XP voucher`)
                .setDescription(`\`\`\`${voucherCode}\`\`\`\nTo redeem, use \`/voucher redeem <code>\``)
                .setColor("Random")
                .setFooter({ text: `Good luck!` })
                .setTimestamp();

            await VoucherModel.create({
                adminID: interaction.user.id,
                xpAmount: xp,
                voucherCode: voucherCode,
                usageCount: usage,
                redeemedBy: [],
                inserted_at: new Date(),
                updated_at: new Date()
            });

            await interaction.reply({ embeds: [embed], ephemeral: false });
        }

        if (interaction.options.getSubcommand() === "gtn") {
            function generateUniqueRandomNumbers(correctNumber: number, min: number, max: number, count: number) {
                const numbers = new Set<number>();
                numbers.add(correctNumber);
                while (numbers.size < count + 1) {
                    const randomNumber = Math.floor(Math.random() * (max - min + 1) + min);
                    numbers.add(randomNumber);
                }
                return Array.from(numbers);
            }

            const correctNumber = Math.floor(Math.random() * 100) + 1;
            const allNumbers = generateUniqueRandomNumbers(correctNumber, 1, 100, 3);
            const shuffledNumbers = allNumbers.sort(() => 0.5 - Math.random());

            const buttons = shuffledNumbers.map((number) => new ButtonBuilder()
                .setCustomId(`guess-${correctNumber}-${number}`)
                .setLabel(number.toString())
                .setStyle(ButtonStyle.Primary)
            );

            const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

            const gameEmbed = new EmbedBuilder()
                .setTitle("🔢 Guess the Correct Number!")
                .setDescription("Click the button with the correct number to win XP!")
                .setColor("Random")
                .setTimestamp();

            await interaction.reply({ content: `Game started!`, ephemeral: true });
            await interaction.channel.send({ embeds: [gameEmbed], components: [buttonRow] });
        }

        if (interaction.options.getSubcommand() === "reaper") {
            const channel = (await client.channels.fetch(process.env.MAIN_CHAT)) as TextChannel;
            if (!channel) return;

            const guildQuery = await GuildModel.findOne({ guildID: channel.guild.id });
            if (!guildQuery || guildQuery.xp_enabled === false) return;

            const allUsersAbove15 = await UserModel.find({
                guildID: channel.guild.id,
                xp_level: { $gt: 30 } // Users above level 30 can be a victim
            });

            const allUsersBetween5And15 = await UserModel.find({
                guildID: channel.guild.id,
                xp_level: { $gt: 10, $lte: 25 } // Users above level 10 and at or below level 25
            });

            // Filter out users with the "Reaper" perk
            const usersAbove15 = allUsersAbove15.filter(user => !user.inventory.some(item => item.name === "Reaper"));
            const usersBetween5And15 = allUsersBetween5And15.filter(user => !user.inventory.some(item => item.name === "Reaper"));

            if (usersAbove15.length === 0 || usersBetween5And15.length === 0) return;

            const selectEmbed = new EmbedBuilder()
                .setDescription("It's 3am, the time has come. I am now selecting a victim and a beneficiary for today ...")
                .setImage("https://media4.giphy.com/media/7LzsVhXKgiGCQ/giphy.gif?cid=ecf05e47v7rbs68nfl9kspopugthqyeo3xfe63dsc3c5d5oy&ep=v1_gifs_related&rid=giphy.gif&ct=g")
                .setColor("Red")

            const selectMsg = await channel.send({ embeds: [selectEmbed] });

            setTimeout(async () => {
                await selectMsg.delete();

                // Randomly select a user above level 30
                const victimIndex = Math.floor(Math.random() * usersAbove15.length);
                const victim = usersAbove15[victimIndex];

                const newVictimLevel = Math.max(victim.xp_level - 2); // Decrease level by 2
                const victimRole = levelRoles.find((role) => role.level === newVictimLevel);
                const victimXP = victimRole ? victimRole.xpRequired : 0; // Reset XP to the minimum of the new level

                // Randomly select a user below level 25
                const beneficiaryIndex = Math.floor(Math.random() * usersBetween5And15.length);
                const beneficiary = usersBetween5And15[beneficiaryIndex];

                const newBeneficiaryLevel = Math.min(beneficiary.xp_level + 2); // Increase level by 2
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
            }, 30000); 

            return interaction.reply({ content: `The reaper is on the way!`, ephemeral: true });
        }
    },
});