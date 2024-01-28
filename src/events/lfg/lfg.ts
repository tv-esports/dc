import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
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
            case "duoq":
            case "trioq":
            case "fiveq":

                const clickedButton = interaction.customId;
                const lfgModal = new ModalBuilder()
                    .setTitle("Looking for game")
                    .setCustomId(`lfgmodal_${clickedButton}`)

                const roleInput = new TextInputBuilder()
                    .setCustomId("lfg-roles")
                    .setLabel("Needed Roles")
                    .setPlaceholder("F.e. Support, Jungle, Top")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(50)
                    .setRequired(true)

                const usernameRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(roleInput);

                lfgModal.addComponents(usernameRow);

                await interaction.showModal(lfgModal);
                break;
            default:
                break;
        }
    }
}