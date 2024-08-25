import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "../../structures/Command";

import UserModel from "../../models/user/user";
import GuildModel from "../../models/guild/guild";

import { calculateXPForNextLevel, progressBar } from "../../functions/xp";

import dedent from 'dedent';

export default new Command({
    name: "xp",
    description: "Get infos about the XP system",
    userPermissions: [PermissionFlagsBits.SendMessages],
    options: [
        {
            name: "level",
            description: "View your own level",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "Info of a specific user",
                    type: ApplicationCommandOptionType.User,
                    required: false
                },
            ],
        },
        {
            name: "leaderboard",
            description: "The servers leaderboard",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "page",
                    description: "What page should be displayed",
                    type: ApplicationCommandOptionType.Number,
                    required: false
                },
                {
                    name: "minlevel",
                    description: "The minimum level to show",
                    type: ApplicationCommandOptionType.Number,
                    required: false
                },
                {
                    name: "maxlevel",
                    description: "The maximum level to show",
                    type: ApplicationCommandOptionType.Number,
                    required: false
                },
                {
                    name: "minxp",
                    description: "The minimum xp to show",
                    type: ApplicationCommandOptionType.Number,
                    required: false
                },
                {
                    name: "maxxp",
                    description: "The maximum xp to show",
                    type: ApplicationCommandOptionType.Number,
                    required: false
                }
            ],
        },
        {
            name: "settings",
            description: "Check the XP settings",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "stats",
            description: "Get some stats about the bot",
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],
    run: async ({ interaction, client }) => {
        if (interaction.options.getSubcommand() === "level") {
            const user = interaction.options.getUser("user") || interaction.user;

            const userQuery = await UserModel.findOne({ userID: user.id });
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guild.id });
            if (!guildQuery) return interaction.reply({ content: "This guild is not in the database", ephemeral: true });
            if (!userQuery) return interaction.reply({ content: "This user is not in the database", ephemeral: true });

            const userRank = userQuery.xp_level;
            const userXP = userQuery.xp_points;

            const xpToNextLevel = calculateXPForNextLevel(userRank); // Function to calculate XP needed for next level

            const allUsers = await UserModel.find({}).sort({ xp_level: -1, xp_points: -1 }); // Sort by XP level first, then by XP points
            const userIndex = allUsers.findIndex((u) => u.userID === user.id); // Find the index of the user in the array
            const userRankCheck = userIndex !== -1 ? `Rank on leaderboard: ${userIndex + 1}` : `${user.username} is still unranked`;

            const levelembed = new EmbedBuilder()
                .setTitle(`Level of ${user.username}`)
                .setDescription(`**Level:** ${userRank} | **XP:** ${userXP} xp\n` +
                    `${progressBar(userXP, xpToNextLevel)}\n` +
                    "\n")
                .setColor("Random")
                .setFooter({ text: `${userRankCheck}` })

            return await interaction.reply({
                embeds: [levelembed.toJSON()],
                ephemeral: true
            });
        }

        if (interaction.options.getSubcommand() === "leaderboard") {
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guildId });
            if (!guildQuery) return interaction.reply({ content: "There is no valid data for this leaderboard.", ephemeral: true });
        
            const page = interaction.options.getNumber("page") || 1; // Default to page 1 if no page is specified
            const minLevel = interaction.options.getNumber("minlevel") || 0; // Default to 0 if not specified
            const maxLevel = interaction.options.getNumber("maxlevel") || Infinity; // Default to Infinity if not specified
            const minXP = interaction.options.getNumber("minxp") || 0; // Default to 0 if not specified
            const maxXP = interaction.options.getNumber("maxxp") || Infinity; // Default to Infinity if not specified
        
            const usersPerPage = 5;
            const startIndex = (page - 1) * usersPerPage;
        
            // Aggregate query to exclude users with "Anonymous" perk
            const topRegularUsers = await UserModel.aggregate([
                { $match: { 
                    xp_level: { $gte: minLevel, $lte: maxLevel },
                    xp_points: { $gte: minXP, $lte: maxXP },
                    "inventory.name": { $ne: "Anonymous" } // Exclude users with "Anonymous" perk
                } },
                { $sort: { xp_level: -1, xp_points: -1 } },
            ]);
        
            const totalPages = Math.ceil(topRegularUsers.length / usersPerPage);
            if (page < 1 || page > totalPages) return interaction.reply({ content: `Enter a valid page number between 1 and ${totalPages}`, ephemeral: true });
        
            let leaderboard = "";
            const endIndex = Math.min(startIndex + usersPerPage, topRegularUsers.length);
        
            for (let i = startIndex; i < endIndex; i++) {
                const userTag = (await client.users.fetch(topRegularUsers[i].userID))?.tag;
                let emoji;
        
                switch (i % 5) {
                    case 0:
                        emoji = "🥇";
                        break;
                    case 1:
                        emoji = "🥈";
                        break;
                    case 2:
                        emoji = "🥉";
                        break;
                    default:
                        emoji = "🎖️";
                }
        
                const currentXP = topRegularUsers[i].xp_points;
                const currentLevel = topRegularUsers[i].xp_level;
                const xpToNextLevel = calculateXPForNextLevel(currentLevel);
        
                leaderboard += `${emoji} **${userTag}**\n` +
                    `**Level:** ${currentLevel} | **XP:** ${currentXP} xp\n` +
                    `${progressBar(currentXP, xpToNextLevel)}\n` +
                    "\n";
            }
        
            const embed = new EmbedBuilder()
                .setTitle("Team Void Leaderboard")
                .setDescription(leaderboard)
                .setFooter({ text: `Page ${page} of ${totalPages}` });
        
            await interaction.reply({
                embeds: [embed],
            });
        }

        if (interaction.options.getSubcommand() === "settings") {
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guildId });
            if (!guildQuery) return interaction.reply({ content: "This guild is not in the database", ephemeral: true });

            const isXPEnabled = guildQuery.xp_enabled ? "✅" : "❌";
            const ignoredXPChannels = guildQuery.ignored_xp_channels.length > 0 ? guildQuery.ignored_xp_channels.map((c) => `<#${c}>`).join(", ") : "None";
            const ignoredXPRoles = guildQuery.ignored_xp_roles.length > 0 ? guildQuery.ignored_xp_roles.map((r) => `<@&${r}>`).join(", ") : "None";
            const blacklistedUserCounts = guildQuery.blacklisted_xp_users.length;

            const today = new Date();
            const dayOfWeek = today.getDay(); // Returns the day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)

            // Check if it's Saturday (6) or Sunday (0)
            const isWeekendXPBoost = dayOfWeek === 0 || dayOfWeek === 6;

            const embed = new EmbedBuilder()
                .setTitle("XP Settings")
                .setDescription(`**XP-System enabled:** ${isXPEnabled}\n` +
                    `**Weekend XP Boost:** ${isWeekendXPBoost ? "✅" : "❌"}\n` +
                    `**Ignored Channels:** ${ignoredXPChannels}\n` +
                    `**Ignored Roles:** ${ignoredXPRoles}\n` +
                    `**Blacklisted Users:** ${blacklistedUserCounts}\n` +
                    "\n")

                .setColor("Random")
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}` })

            return await interaction.reply({
                embeds: [embed],
            });
        }

        if (interaction.options.getSubcommand() === "stats") {
            const userCount = await UserModel.countDocuments();

            const totalAmountOfXP = (await UserModel.aggregate([{ $group: { _id: null, total: { $sum: "$xp_points" } } }]))[0]?.total;
            const totalAmountOfLevel = (await UserModel.aggregate([{ $group: { _id: null, total: { $sum: "$xp_level" } } }]))[0]?.total;

            const stats = dedent`
                Total levels in database: ${totalAmountOfLevel}
                Total XP in database: ${totalAmountOfXP}
                Users in database: ${userCount}
                Root Server Expire Date: 8/20/2024
            `;

            const embed = new EmbedBuilder()
                .setTitle("TV-Bot Stats")
                .setDescription(dedent`
                
                \`\`\`diff
                ${stats}
                \`\`\`
                `)
                .setColor("Random")
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}` });

            return await interaction.reply({
                embeds: [embed],
            });
        }
    },
});