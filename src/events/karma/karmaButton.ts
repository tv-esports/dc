import { BaseEvent } from "../../structures/Event";
import { ExtendedClient } from "../../structures/Client";
import { ButtonInteraction, EmbedBuilder } from "discord.js";
import KarmaModel from "../../models/karma/karma";
import UserModel from "../../models/user/user";
import { levelRoles } from "../../functions/xp";

const buttonToPenaltyMap: Record<string, string> = {
    "karma-timeout": "Timeout",
    "karma-previous-xp": "XP",
    "karma-nickname": "Nickname",
};

export default class ButtonInteractionEvent extends BaseEvent {
    constructor() {
        super("interactionCreate");
    }

    async run(client: ExtendedClient, interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;

        const userID = interaction.message?.embeds[0].footer?.text;
        if (!userID) return;

        const recentTimestamp = new Date(Date.now() - 1000 * 60 * 30);
        const recentKarmaCase = await KarmaModel.findOne({
            karmaUserID: userID,
            inserted_at: { $gte: recentTimestamp },
        }).sort({ inserted_at: -1 });

        if (!recentKarmaCase) return;

        const { customId } = interaction;
        const predefinedPenalties = Object.keys(buttonToPenaltyMap);

        if (!predefinedPenalties.includes(customId)) return;

        const karmaPunishments = recentKarmaCase.karmaPunishments;

        const userVotedForPenalty = predefinedPenalties.some((penalty) =>
            karmaPunishments[buttonToPenaltyMap[penalty]]?.includes(interaction.user.id)
        );

        // check if the user in the case is the same as the user who clicked the button
        if (interaction.user.id === recentKarmaCase.karmaUserID) return await interaction.reply({ content: "You can't vote for yourself!", ephemeral: true });

        if (userVotedForPenalty) {
            await interaction.reply({ content: "You have already voted for a penalty!", ephemeral: true });
            return;
        }

        const predefinedPenalty = buttonToPenaltyMap[customId];

        if (!karmaPunishments[predefinedPenalty]) {
            karmaPunishments[predefinedPenalty] = [interaction.user.id];
        } else {
            karmaPunishments[predefinedPenalty].push(interaction.user.id);
        }

        await KarmaModel.findOneAndUpdate(
            { karmaMessageID: recentKarmaCase.karmaMessageID },
            { karmaPunishments },
        );

        const updatedKarmaCase = await KarmaModel.findOne({
            karmaMessageID: recentKarmaCase.karmaMessageID,
        });

        const karmaEmbedUpdates = new EmbedBuilder()
            .setTitle("Karma Crime Case")
            .setDescription(`A new karma case about <@${recentKarmaCase.karmaUserID}> has been opened!\nYou have 10 minutes to vote for a penalty!`)
            .addFields({
                name: "10min Timeout",
                value: updatedKarmaCase.karmaPunishments["Timeout"]?.map((userID) => `<@${userID}>`).join(", ") || "No votes",
            }, {
                name: "Decrease XP",
                value: updatedKarmaCase.karmaPunishments["XP"]?.map((userID) => `<@${userID}>`).join(", ") || "No votes",
            }, {

                name: "Random Nickname",
                value: updatedKarmaCase.karmaPunishments["Nickname"]?.map((userID) => `<@${userID}>`).join(", ") || "No votes",
            })

            .setFooter({ text: userID })

        const votedEmbed = new EmbedBuilder()
            .setDescription(`Thank you. Your vote has been recorded for: **${predefinedPenalty}**`)
            .setColor("Random")


        await interaction.message.edit({ embeds: [karmaEmbedUpdates] });
        await interaction.reply({ embeds: [votedEmbed], ephemeral: true });

        setTimeout(async () => {
            const karmaPunishments = updatedKarmaCase.karmaPunishments;
            const karmaPunishmentsEntries = Object.entries(karmaPunishments);

            const mostVotedPenalty = karmaPunishmentsEntries.reduce((prev, current) => {
                return prev[1].length > current[1].length ? prev : current;
            })[0];

            const resultEmbed = new EmbedBuilder()
                .setTitle("Karma Crime Case")
                .setDescription(`The karma crime case about <@${updatedKarmaCase.karmaUserID}> has been closed!\n\nThe most voted penalty was: **${mostVotedPenalty}**`)
                .setFooter({ text: userID })

            await KarmaModel.findOneAndUpdate(
                { karmaMessageID: updatedKarmaCase.karmaMessageID },
                { karmaDecision: mostVotedPenalty, karmaStatus: "closed", updated_at: new Date() },
            );

            await interaction.message.edit({ embeds: [resultEmbed], components: [] });

            const karmaUser = await client.users.fetch(userID);
            const karmaGuild = await client.guilds.fetch(updatedKarmaCase.karmaGuildID);
            const karmaMember = await karmaGuild.members.fetch(karmaUser);

            const karmaPunishment = mostVotedPenalty.toLowerCase();

            switch (karmaPunishment) {
                case "timeout":
                    if (!karmaMember.manageable) return;

                    await karmaMember.timeout(1000 * 60 * 10);
                    break;
                case "xp":
                    const xpQuery = await UserModel.findOne({ userID: userID });
                    if (!xpQuery) return;

                    let newLevel = xpQuery.xp_level;

                    if (xpQuery.xp_level < 10) {
                        newLevel -= 1;
                    } else if (xpQuery.xp_level >= 10 && xpQuery.xp_level < 20) {
                        newLevel -= 2;
                    } else if (xpQuery.xp_level >= 20) {
                        newLevel -= 3;
                    }

                    newLevel = Math.max(newLevel, 1);
                    const levelRole = levelRoles.find((role) => role.level === newLevel);
                    const getXPRequiredForNewLevel = levelRole?.xpRequired;

                    await UserModel.findOneAndUpdate(
                        { userID: userID },
                        { xp_level: newLevel, xp_points: getXPRequiredForNewLevel }
                    );
                    break;
                case "nickname":
                    const nicknames = [
                        "🤡 Snickerdoodle",
                        "🤡 Pickle",
                        "🤡 Squishy",
                        "🤡 Bubbles",
                        "🤡 Fluffy",
                        "🤡 Boomerang",
                        "🤡 Noodle",
                        "🤡 Tootsie",
                        "🤡 Squeegee",
                        "🤡 Biscuit"
                    ]
                    const randomIndex = Math.floor(Math.random() * nicknames.length);
                    const randomNickname = nicknames[randomIndex];

                    // check for permissions
                    if (!karmaMember.manageable) return;

                    await karmaMember.setNickname(randomNickname);
                    break;
            }
        }, 1000 * 60 * 10);
    }
}