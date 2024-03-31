import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";

import emojis from "../../styles/emojis";

import UserModel from "../../models/user/user";
import { convertNameToEmoji } from "../../functions/badge";

export default new Command({
    name: "userinfo",
    description: "Get the information of a user",
    options: [
        {
            name: "user",
            description: "The user to get the information",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    run: async ({ interaction, client }) => {

        const member = interaction.options.getUser("user") || interaction.user;
        const userQuery = await UserModel.findOne({ userID: member.id });

        const guildMember = await interaction.guild.members.fetch(member.id).catch(() => null);

        const convertBadgeToEmoji = userQuery?.badges.map((badge: string) => convertNameToEmoji(badge)) || [];
        const formatEmoji = convertBadgeToEmoji.map((emoji: string) => emoji).join(" ");

        const userInfoEmbed = new EmbedBuilder()
            .setAuthor({
                name: guildMember.user.username,
                iconURL: guildMember.user.displayAvatarURL({
                    forceStatic: true,
                    extension: "png",
                    size: 1024,
                }),
            })
            .setColor(guildMember.displayHexColor)
            .addFields(
                {
                    name: "ID",
                    value: `${guildMember.id}`,
                    inline: true,
                },
                {
                    name: "Account Created",
                    value: `<t:${Math.round(guildMember.user.createdTimestamp / 1000)}:R>`,
                    inline: true,
                },
                {
                    name: "Joined Server",
                    value: `<t:${Math.round(guildMember.joinedTimestamp / 1000)}:R>`,
                    inline: true,
                },
                {
                    name: "Messages Sent",
                    value: `${userQuery?.messages_sent || 0}`,
                    inline: true,
                },
                {
                    name: "Warnings",
                    value: `${userQuery?.warnings || 0}`,
                    inline: true,
                },
                {
                    name: "Prestige",
                    value: `${userQuery.prestige.is_prestige ? emojis.success : emojis.error}`,
                    inline: true,
                },
                {
                    name: "Roles",
                    value:
                        `${guildMember.roles.cache
                            .map((role: string) => role.toString())
                            .join(",\n")
                            .slice(0, -11)}` || "None",
                    inline: true,
                },
                {
                    name: "Badges",
                    value: `${formatEmoji || "None"}`,
                  
                }
            )

        await interaction.reply({ embeds: [userInfoEmbed] });
    },
});
