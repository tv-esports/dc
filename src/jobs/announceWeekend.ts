import { EmbedBuilder, TextChannel } from "discord.js";
import cron from "node-cron";
import { client } from "../index";
import GuildModel from "../models/guild/guild";

export async function announceWeekend() {
    const channel = await client.channels.fetch(process.env.MAIN_CHAT) as TextChannel;

    if(!channel) return; 

    const guildQuery = await GuildModel.findOne({ guildID: channel.guild.id });
    if(!guildQuery || guildQuery.xp_enabled === false) return;

    const weekendEmbed = new EmbedBuilder()
    .setDescription("It's finally weekend! Enjoy double XP and bigger loot drops for the next 48h! 🎉")
    .setColor("Random")
    .setFooter({ text: "Discuss the highlight of your week!", iconURL: client.user?.displayAvatarURL() });
    
    // every saturday at 00:00
    cron.schedule("0 0 * * 6", async () => {
        await (channel as TextChannel).send({ content: `Attention everyone!`, embeds: [weekendEmbed] });
    }, {
        scheduled: true,
        timezone: "Europe/Berlin"
    });
}