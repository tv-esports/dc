import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "../../structures/Command";

import UserModel from "../../models/user/user";
import GuildModel from "../../models/guild/guild";
import PrestigeModel from "../../models/prestige/prestige";

import { calculateNextPrestigeLevel, calculateXPForNextLevel, generatePrestigeLeaderboard, progressBar } from "../../functions/xp";

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
            name: "prestige-level",
            description: "View your own prestige level",
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
            // options: [
            //     {
            //         name: "top",
            //         description: "How many should be displayed (max 15)",
            //         type: ApplicationCommandOptionType.Number,
            //         required: false
            //     }
            // ],
        },
        {
            name: "prestige-leaderboard",
            description: "The prestige leaderboard",
            type: ApplicationCommandOptionType.Subcommand,
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

            const embed = new EmbedBuilder()
                .setTitle(`Level of ${user.username}`)
                .setDescription(`**Level:** ${userRank} | **XP:** ${userXP} xp\n` +
                    `${progressBar(userXP, xpToNextLevel)}\n` +
                    "\n")
                .setColor("Random")
                .setFooter({ text: `${userRankCheck}` })

            return await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        if (interaction.options.getSubcommand() === "prestige-level") {
            const user = interaction.options.getUser("user") || interaction.user;
            const prestigeQuery = await PrestigeModel.findOne({ userID: user.id });

            if (!prestigeQuery) return interaction.reply({ content: "This user is not in the prestige database", ephemeral: true });

            const userRank = prestigeQuery.prestige_level;
            const userXP = prestigeQuery.prestige_xp;
            const xpToNextLevel = calculateNextPrestigeLevel(userRank); // Function to calculate XP needed for next level

            const levelInfo = `Level: ${userRank} | XP: ${userXP} / ${xpToNextLevel} XP`;

            const embed = new EmbedBuilder()
                .setTitle(`Prestige Level of ${user.username}`)
                .setDescription(`\`\`\`css\n${levelInfo}\n\`\`\``) // Using code block for a different visual style
                .setColor("NotQuiteBlack");

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        if (interaction.options.getSubcommand() === "leaderboard") {
            const guildQuery = await GuildModel.findOne({ guildID: interaction.guildId });
            if (!guildQuery) return interaction.reply({ content: "There is no valid data for this leaderboard.", ephemeral: true });

            const limit = interaction.options.getNumber("top") || 5;
            if (limit < 5 || limit > 15 || isNaN(limit)) return interaction.reply({ content: "Enter a real number, which is above 5 and below 16", ephemeral: true });

            let leaderboard = "";

            const topRegularUsers = await UserModel.aggregate([
                { $sort: { xp_level: -1, xp_points: -1 } },
                { $limit: limit },
            ]);

            for (let i = 0; i < topRegularUsers.length; i++) {
                const userTag = (await client.users.fetch(topRegularUsers[i].userID))?.tag;
                let emoji;

                switch (i) {
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

            const embed = new EmbedBuilder().setTitle("Team Void Leaderboard").setDescription(leaderboard).setFooter({ text: "Showing: Top " + limit });
            await interaction.reply({
                embeds: [embed],
            });
        }


        if (interaction.options.getSubcommand() === "prestige-leaderboard") {
            const topFiveUsers = await PrestigeModel.aggregate([
                { $sort: { prestige_level: -1, prestige_xp: -1 } }, // Sort by prestige level first, then by prestige xp
                { $limit: 5 },
            ]);

            if (topFiveUsers.length === 0) return interaction.reply({ content: "There is no valid data for this leaderboard.", ephemeral: true });

            const prestigeLeaderboard = await generatePrestigeLeaderboard(topFiveUsers, 5);
            const prestigeEmbed = new EmbedBuilder().setTitle("🏴‍☠️ Prestige Leaderboard").setDescription(`${prestigeLeaderboard}`).setColor("NotQuiteBlack").setFooter({ text: "Showing: Top five" }).setTimestamp();
            await interaction.reply({
                embeds: [prestigeEmbed],
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
            const prestigeCount = await PrestigeModel.countDocuments();

            const totalAmountOfXP = (await UserModel.aggregate([{ $group: { _id: null, total: { $sum: "$xp_points" } } }]))[0]?.total;
            const totalAmountOfLevel = (await UserModel.aggregate([{ $group: { _id: null, total: { $sum: "$xp_level" } } }]))[0]?.total;

            const stats = dedent`
                Total levels in database: ${totalAmountOfLevel}
                Total XP in database: ${totalAmountOfXP}
                Users in database: ${userCount}
                Users in prestige: ${prestigeCount}
                Root Server Expire Date: 04/10/2024
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