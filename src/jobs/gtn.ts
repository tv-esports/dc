import { EmbedBuilder, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import cron from "node-cron";
import { client } from "../index";

export async function gtn() {
    cron.schedule("0 */2 * * *", async () => {
        function generateUniqueRandomNumbers(correctNumber: number, min: number, max: number, count: number) {
            const numbers = new Set<number>();
            numbers.add(correctNumber);
            while (numbers.size < count + 1) {
                const randomNumber = Math.floor(Math.random() * (max - min + 1) + min);
                numbers.add(randomNumber);
            }
            return Array.from(numbers);
        }

        const channel = await client.channels.fetch(process.env.MAIN_CHAT) as TextChannel;
        if (!channel) return;

        const correctNumber = Math.floor(Math.random() * 100) + 1;
        const allNumbers = generateUniqueRandomNumbers(correctNumber, 1, 100, 3);
        const shuffledNumbers = allNumbers.sort(() => 0.5 - Math.random());

        const buttons = shuffledNumbers.map((number) => new ButtonBuilder()
            .setCustomId(`guess-${correctNumber}-${number}`)
            .setLabel(number.toString())
            .setStyle(ButtonStyle.Primary)
        );

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

        const gameEmbed = new EmbedBuilder()
            .setTitle("🔢 Guess the Correct Number!")
            .setDescription("Click the button with the correct number to win XP!")
            .setColor("Random")
            .setTimestamp();

        await channel.send({ embeds: [gameEmbed], components: [buttonRow] });
    }, {
        scheduled: true,
        timezone: "Europe/Berlin"
    });
}
