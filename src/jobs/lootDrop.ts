import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from "discord.js";

import { client } from "../index";
import cron from "node-cron";
import GuildModel from "../models/guild/guild";

export async function lootDrop() {
    const channel = (await client.channels.fetch(
        process.env.MAIN_CHAT
    )) as TextChannel;

    if (!channel) return;

    const guildQuery = await GuildModel.findOne({ guildID: channel.guild.id });
    if (!guildQuery || guildQuery.xp_enabled === false) return;

    const embed = new EmbedBuilder()
        .setDescription("A brand new loot chest appeared!\nReact with 🎁 to open or 🧙🏼 to possibly double your win!")
        .setColor("Random")
        .setImage("https://i.gyazo.com/d55dacb0c5ed588d6131bc087133f838.png")
        .setFooter({ text: "Automated message", iconURL: client.user?.displayAvatarURL() });

    const lootButton = new ButtonBuilder()
        .setCustomId("loot-button")
        .setLabel("🎁 Open")
        .setStyle(ButtonStyle.Success)

    const riskButton = new ButtonBuilder()
        .setCustomId("risk-button")
        .setLabel("🧙🏼 Risk")
        .setStyle(ButtonStyle.Danger)

    // clicks and it drops a random amount of XP (like admin command)
    const dropButton = new ButtonBuilder()
        .setCustomId("drop-extra-xp-button")
        .setLabel("🤭 Drop")
        .setStyle(ButtonStyle.Secondary)

    // clicks, drops a voucher for two people to share XP
    const shareButton = new ButtonBuilder()
        .setCustomId("share-xp-button")
        .setLabel("🤝 Share")
        .setStyle(ButtonStyle.Secondary)

    // clicks, edits the message to say "The loot chest has been destroyed!"
    const destroyButton = new ButtonBuilder()
        .setCustomId("destroy-button")
        .setLabel("🗑️ Destroy")
        .setStyle(ButtonStyle.Secondary)

    const lootRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(riskButton, lootButton, dropButton, shareButton, destroyButton);

    // every 4h
    cron.schedule("0 */4 * * *", async () => {
        const isEnabled = true;
        if (!isEnabled) return;

        await channel.send({ embeds: [embed], components: [lootRow] });
    }), {
        scheduled: true,
        timezone: "Europe/Berlin"
    }
}