import { EmbedBuilder, GuildMember } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { BaseEvent } from "../../structures/Event";
import { ExtendedButtonInteraction } from "../../typings/Command";

import UserModel from "../../models/user/user";

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
            case "prestige-modal": {
                const name = interaction.fields.getTextInputValue("prestige-username");
                const member = interaction.member as GuildMember;
                const username = member.user.username;

                if (name !== username) return interaction.reply({ content: "Your entered username does not match your discord username", ephemeral: true });

                const user = await UserModel.findOne({ userID: interaction.user.id });
                if (!user) return interaction.reply({ content: "User not found", ephemeral: true });

                // check if the user is already signed up for prestige mode
                if (user.prestige.is_prestige) return interaction.reply({ content: "You are already signed up for prestige mode", ephemeral: true });

                // Set user's xp level and xp points to 0 and add them to the prestige collection 
                user.xp_level = 0;
                user.xp_points = 0;
                user.prestige = {
                    is_prestige: true,
                    prestige_level: 0,
                    prestige_xp: 0,
                    prestige_insertedAt: new Date(),
                    prestige_updatedAt: new Date()
                };
                await user.save();

                const prestigeEmbed = new EmbedBuilder()
                    .setTitle("🏴‍☠️ Prestige Sign Up")
                    .setDescription(`${interaction.user} has signed up for prestige mode.\nGood luck on your journey, you will need it!`)
                    .setImage("https://images.mein-mmo.de/medien/2020/11/cod-cold-war-prestige-system-erklaert.jpg")
                    .setTimestamp();

                await interaction.reply({ embeds: [prestigeEmbed], ephemeral: false });
            }
        }
    }
}
