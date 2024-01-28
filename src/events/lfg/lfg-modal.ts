import { ChannelType, EmbedBuilder, GuildMember, Role, TextChannel } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import { ExtendedButtonInteraction } from "../../typings/Command";

import LFGModel from "../../models/lfg/lfg";

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
            case "lfgmodal_duoq":
            case "lfgmodal_trioq":
            case "lfgmodal_fiveq": {
                const args = interaction.customId.split("_");
                const roleInput = interaction.fields.getTextInputValue("lfg-roles");
                const queue = args[1];

                const lfgQuery = await LFGModel.findOne({ userID: interaction.user.id });
                const oneAndAHalfHourAgo = new Date(Date.now() - 1000 * 60 * 90);

                if (lfgQuery && lfgQuery.updated_at > oneAndAHalfHourAgo) {
                    return interaction.reply({
                        content: `You can ping again in ${Math.round((lfgQuery.updated_at.getTime() - oneAndAHalfHourAgo.getTime()) / 1000 / 60)} minutes.`,
                        ephemeral: true
                    });
                }

                const lfgRole = process.env.LFG_ROLE || "1192069881328316436";
                const lfgChannel = process.env.LFG_CHANNEL || "1192071242166046761";
                const pingLfgRole = interaction.guild.roles.cache.get(lfgRole) as Role;
                const lfgChannelObj = interaction.guild.channels.cache.get(lfgChannel) as TextChannel;

                const formatQueue = {
                    "duoq": "Duo Queue",
                    "trioq": "Trio Queue",
                    "fiveq": "Five Queue"
                }[queue];

                const lfgEmbed = new EmbedBuilder()
                    .setTitle("Looking for game")
                    .setDescription(`The user ${interaction.user} is looking for a \`${formatQueue}\` game.\nRoles needed: \`${roleInput}\``)
                    .setTimestamp()
                    .setFooter({ iconURL: interaction.user.displayAvatarURL(), text: interaction.user.tag });

                const lfgModelOptions = {
                    userID: interaction.user.id,
                    lfg_count: lfgQuery ? lfgQuery.lfg_count + 1 : 1,
                    inserted_at: !lfgQuery ? new Date() : undefined,
                    updated_at: new Date()
                };

                if (!lfgQuery) {
                    await LFGModel.create(lfgModelOptions);
                } else {
                    await LFGModel.findOneAndUpdate({ userID: interaction.user.id }, lfgModelOptions);
                }

                await lfgChannelObj.send({ content: `${pingLfgRole}`, embeds: [lfgEmbed] });
                const channel = await client.channels.fetch(lfgChannel) as TextChannel;
                const thread = await channel.threads.create({
                    name: `${interaction.user.username}'s LFG Thread`,
                    autoArchiveDuration: 60,
                    type: ChannelType.PublicThread,
                    reason: "LFG Thread"
                });
                await thread.join();
                await thread.sendTyping();
                await thread.send({ content: `${interaction.user} here is your channel for questions` });

                await interaction.reply({ content: "Your LFG message has been sent.", ephemeral: true });
                break;
            }
            default:
                break;
        }
    }
}