import { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ModalActionRowComponentBuilder } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import { ExtendedButtonInteraction } from "../../typings/Command";

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
            case "information-button":
                const informationEmbed = new EmbedBuilder()
                    .setTitle("Lottery Information")
                    .setDescription(`
                    The lottery is a weekly event that takes place every Sunday (8pm) to Friday (12pm).\n\nUsers can enter a bet + three numbers between 1 and 100.\nIf the sum of the three numbers matches the sum of the generated numbers, the user wins the pot.\nIf nobody guessed it correctly, you still have a chance to be a range winner (that wins a certain amount of % of the pool, if you got close enough).\n\nThe winner will be announced on Friday (12pm).\n-# Warning: Do not play if you do not want to lose your progress.\n-# Fair warning: Once entered, you cannot leave the lottery.
                    `)
                    .setColor("Random")
                    .setFooter({ text: "Good luck! 🍀", iconURL: client.user?.displayAvatarURL() });

                await interaction.reply({ embeds: [informationEmbed], ephemeral: true });
                break;

            case "join-lottery-button":
                const joinLotteryModal = new ModalBuilder()
                    .setTitle("Lottery")
                    .setCustomId(`lottery-join-modal`);

                const XPBet = new TextInputBuilder()
                    .setCustomId("input-xp")
                    .setLabel("Amount of XP to bet")
                    .setPlaceholder("f.e. 245, 500, ...")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(2)
                    .setMaxLength(5)
                    .setRequired(true);

                const NumbersBet = new TextInputBuilder()
                    .setCustomId("input-numbers")
                    .setLabel("The 3 numbers you want to bet on")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("f.e. 10, 12, 24")
                    .setMinLength(7)
                    .setMaxLength(20)
                    .setRequired(true);

                const XPBetRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                    XPBet
                );
                const NumbersBetRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                    NumbersBet
                );
                joinLotteryModal.addComponents(XPBetRow, NumbersBetRow);

                await interaction.showModal(joinLotteryModal);
                break;

            default:
                break;
        }
    }
}