import { EmbedBuilder } from "discord.js";
import UserModel from "../models/user/user";
import { ExtendedClient } from "../structures/Client";
import { BaseEvent } from "../structures/Event";
import { ExtendedButtonInteraction } from "../typings/Command";
import { levelRoles } from "../functions/xp";

export default class InteractionCreateEvent extends BaseEvent {
    constructor() {
        super("interactionCreate");
    }

    async run(client: ExtendedClient, interaction: ExtendedButtonInteraction) {
        if (!interaction.isButton()) return;

        const [prefix, correctNumber, guessedNumber] = interaction.customId.split("-");
        if (prefix !== "guess") return;

        const userQuery = await UserModel.findOne({ userID: interaction.user.id });
        if (!userQuery) return interaction.reply({ content: "You are not in the database yet, send messages first!", ephemeral: true });

        if (guessedNumber === correctNumber) {
            let usersXP = userQuery.xp_points;
            let userLevel = userQuery.xp_level;
            const XP_TO_GIVE = Math.floor(Math.random() * (50 - 20 + 1) + 20); // Random XP reward between 20 and 50

            // Add the XP to the user's current points
            usersXP += XP_TO_GIVE;

            // Check for level up
            for (const levelRole of levelRoles) {
                if (usersXP >= levelRole.xpRequired && levelRole.level > userLevel) {
                    const role = interaction.guild?.roles.cache.find((r) => r.id === levelRole.role);

                    if (role && !interaction.member?.roles.cache.has(role.id)) {
                        await interaction.member?.roles.add(role);
                    }

                    userLevel = levelRole.level;
                }
            }

            // Update user XP and level in the database
            await UserModel.updateOne(
                { userID: interaction.user.id },
                { xp_points: usersXP, xp_level: userLevel, updated_at: new Date() }
            );

            // Create and send a congratulatory embed
            const embed = new EmbedBuilder()
                .setTitle("🎉 We Have a Winner!")
                .setDescription(`Congratulations to ${interaction.user.username} for guessing the correct number!`)
                .addFields(
                    { name: "Correct Number", value: `${correctNumber}`, inline: true },
                    { name: "XP Won", value: `${XP_TO_GIVE} XP`, inline: true }
                )
                .setColor("Gold")
                .setTimestamp();

            if (userLevel > userQuery.xp_level) {
                embed.addFields({ name: "Level Up", value: `You reached level ${userLevel}!`, inline: false });
            }

            // Remove buttons from the original message
            await interaction.message.edit({ embeds: [embed], components: [] });

            await interaction.reply({ content: `🎉 You guessed the correct number and won ${XP_TO_GIVE} XP!`, ephemeral: true });
        } else {
            await interaction.reply({ content: "❌ Incorrect guess. Be fast and try again.", ephemeral: true });
        }
    }
}