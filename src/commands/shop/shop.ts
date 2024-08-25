import ShopModel from "../../models/shop/shop";
import { Command } from "../../structures/Command";
import { ApplicationCommandOptionType, EmbedBuilder, User } from "discord.js";
import emojis from "../../styles/emojis";
import { ownerCheck } from "../../guards/owner";
import { isAdmin, isOwner } from "../../guards/permissions";
import UserModel from "../../models/user/user";
import { levelRoles } from "../../functions/xp";

export default new Command({
    name: "shop",
    description: "Manage shop items",
    options: [
        {
            name: "list",
            description: "List all shop items",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "add",
            description: "Add a new item to the shop",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "Item name",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "description",
                    description: "Item description",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "price",
                    description: "Item price",
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                },
                {
                    name: "availability",
                    description: "How many of this item are available",
                    type: ApplicationCommandOptionType.Integer,
                    required: false
                }
            ],
        },
        {
            name: "edit",
            description: "Edit an existing item",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "Name of the item to edit",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "new-name",
                    description: "New name for the item",
                    type: ApplicationCommandOptionType.String,
                    required: false
                },
                {
                    name: "new-description",
                    description: "New description for the item",
                    type: ApplicationCommandOptionType.String,
                    required: false
                },
                {
                    name: "new-price",
                    description: "New price for the item",
                    type: ApplicationCommandOptionType.Integer,
                    required: false
                },
                {
                    name: "new-availability",
                    description: "New availability for the item",
                    type: ApplicationCommandOptionType.Integer,
                    required: false
                }
            ],
        },
        {
            name: "delete",
            description: "Delete an item from the shop",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "Name of the item to delete",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ],
        },
        {
            name: "renew",
            description: "Restock an item",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "Name of the item to restock",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "quantity",
                    description: "Number of items to add",
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                }
            ],
        },
        {
            name: "buy",
            description: "Buy an item from the shop",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "item",
                    description: "Name of the item to buy",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "inventory",
            description: "Show items in your inventory",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "remove",
            description: "Remove an item from your inventory",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "item",
                    description: "Name of the item to remove",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
    ],
    run: async ({ interaction }) => {
        const subcommand = interaction.options.getSubcommand();
        let shop = await ShopModel.findOne();
        if (!shop) {
            shop = new ShopModel();
            await shop.save();
        }

        if (subcommand === "list") {
            if (shop.items.length === 0) {
                return interaction.reply({ content: "The shop is empty.", ephemeral: true });
            }

            shop.items.sort((a, b) => a.price - b.price);

            const embed = new EmbedBuilder()
                .setTitle(`${emojis.settings} Shop Items`)
                .setColor("Blue");

            shop.items.forEach(item => {
                // Determine the availability status emoji
                const availabilityEmoji = item.available > 0 ? emojis.turnedon : emojis.turnedoff;
                const availabilityText = item.available > 0 ? `Available: ${item.available}` : `Out of stock`;

                // Add fields with emojis for enhanced visual appeal
                embed.addFields({
                    name: `${emojis.file} ${item.name} - ${item.price}XP`,
                    value: `-# ${item.description}\n${availabilityEmoji} ${availabilityText}`,
                    inline: true
                });
            });

            return interaction.reply({ embeds: [embed], ephemeral: false });
        }

        if (subcommand === "buy") {
            const itemName = interaction.options.getString("item");
            const userId = interaction.user.id;
            const userQuery = await UserModel.findOne({ userID: userId });

            if (!userQuery) return interaction.reply({ content: "User data not found. Please send messages first.", ephemeral: true });

            let shop = await ShopModel.findOne();
            if (!shop) {
                shop = new ShopModel();
                await shop.save();
            }

            const item = shop.items.find(i => i.name === itemName);
            if (!item) return interaction.reply({ content: `Item **${itemName}** not found in the shop.`, ephemeral: true });

            const xpRequired = item.price; // Assuming price is used as XP cost
            if (userQuery.xp_points < xpRequired) return interaction.reply({ content: `You don't have enough XP to buy **${itemName}**.`, ephemeral: true });

            if (userQuery.inventory.some(i => i.name === itemName)) return interaction.reply({ content: `You already own **${itemName}**.`, ephemeral: true });

            // Check item availability
            if (item.available === 0) return interaction.reply({ content: `**${itemName}** is out of stock.`, ephemeral: true });

            // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
            if (item.name === "Badge") {
                const availableBadges = ["Silver", "Krypton", "Gold", "Carbon", "Platin", "Diamond"];
                const randomBadge = availableBadges[Math.floor(Math.random() * availableBadges.length)];
                const userHasBadge = userQuery.badges.includes(randomBadge);

                // Check if the user has the badge already
                if (!userHasBadge) {
                    // Add badge to user's badges array
                    await UserModel.updateOne(
                        { userID: userId },
                        {
                            $addToSet: {
                                inventory: { name: "Badge", acquiredAt: new Date() },
                                badges: randomBadge
                            }
                        }
                    );
                }
            }

            // Deduct XP
            let newXP = userQuery.xp_points - xpRequired;
            let userLevel = userQuery.xp_level;

            // Check if the user needs to level down
            let levelDown = false;
            for (const levelRole of levelRoles) {
                if (newXP < levelRole.xpRequired && userLevel > levelRole.level) {
                    userLevel = levelRole.level;
                    levelDown = true;
                    break;
                }
            }

            // Update user XP and level
            if (levelDown) {
                await UserModel.updateOne({ userID: userId }, { xp_points: newXP, xp_level: userLevel });
            } else {
                await UserModel.updateOne({ userID: userId }, { xp_points: newXP, xp_level: userLevel, $addToSet: { inventory: { name: itemName, acquiredAt: new Date() } } });
            }

            // Update item availability
            if (item.available > 0) {
                item.available -= 1;
                await ShopModel.updateOne({ "items.name": itemName }, { $set: { "items.$": item } });
            }

            return interaction.reply({ content: `You bought **${itemName}** successfully!`, ephemeral: true });
        }

        if (subcommand === "remove") {
            const itemName = interaction.options.getString("item");
            const userId = interaction.user.id;
            const userQuery = await UserModel.findOne({ userID: userId });

            if (!userQuery) return interaction.reply({ content: "User data not found. Please send messages first.", ephemeral: true });

            const itemIndex = userQuery.inventory.findIndex(i => i.name === itemName);
            if (itemIndex === -1) return interaction.reply({ content: `You do not own **${itemName}**.`, ephemeral: true });

            userQuery.inventory.splice(itemIndex, 1);
            await UserModel.updateOne({ userID: userId }, { inventory: userQuery.inventory });

            return interaction.reply({ content: `Item **${itemName}** removed from your inventory.`, ephemeral: true });
        }

        if (subcommand === "inventory") {
            const userId = interaction.user.id;
            const userQuery = await UserModel.findOne({ userID: userId });

            if (!userQuery) return interaction.reply({ content: "User data not found. Please send messages first.", ephemeral: true });

            const inventory = userQuery.inventory;

            if (inventory.length === 0) {
                return interaction.reply({ content: "Your inventory is empty.", ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`${emojis.diamond} Your Inventory`)
                .setColor("Blue");

            inventory.forEach(item => {
                embed.addFields({
                    name: `${emojis.file} ${item.name}`,
                    value: `Acquired At: ${item.acquiredAt.toDateString()}`,
                    inline: true
                });
            });

            return interaction.reply({ embeds: [embed], ephemeral: false });
        }

        if (subcommand === "add") {
            if (!isAdmin(interaction.member)) { return interaction.reply({ content: `${emojis.error} You need to be an admin to use this command.`, ephemeral: true }); }

            const name = interaction.options.getString("name");
            const description = interaction.options.getString("description");
            const price = interaction.options.getInteger("price");
            const available = interaction.options.getInteger("availability") ?? 3;

            shop.items.push({ name, description, price, available });
            await shop.save();

            return interaction.reply({ content: `${emojis.success} Item **${name}** added to the shop!`, ephemeral: true });
        }

        if (subcommand === "edit") {
            if (!isAdmin(interaction.member)) return interaction.reply({ content: `${emojis.error} You need to be an admin to use this command.`, ephemeral: true });

            const name = interaction.options.getString("name");
            const newName = interaction.options.getString("new-name");
            const newDescription = interaction.options.getString("new-description");
            const newPrice = interaction.options.getInteger("new-price");
            const newAvailability = interaction.options.getInteger("new-availability");

            const item = shop.items.find(i => i.name === name);
            if (!item) return interaction.reply({ content: `Item **${name}** not found.`, ephemeral: true });

            if (newName) item.name = newName;
            if (newDescription) item.description = newDescription;
            if (newPrice) item.price = newPrice;
            if (newAvailability !== undefined) item.available = newAvailability;

            await shop.save();

            return interaction.reply({ content: `${emojis.success} Item **${name}** updated!`, ephemeral: true });
        }

        if (subcommand === "delete") {
            if (!isAdmin(interaction.member)) return interaction.reply({ content: `${emojis.error} You need to be an admin to use this command.`, ephemeral: true });

            const name = interaction.options.getString("name");
            const index = shop.items.findIndex(i => i.name === name);
            if (index === -1) return interaction.reply({ content: `Item **${name}** not found.`, ephemeral: true });

            shop.items.splice(index, 1);
            await shop.save();

            return interaction.reply({ content: `${emojis.success} Item **${name}** deleted from the shop!`, ephemeral: true });
        }

        if (subcommand === "renew") {
            if (!isAdmin(interaction.member)) return interaction.reply({ content: `${emojis.error} You need to be an admin to use this command.`, ephemeral: true });

            const name = interaction.options.getString("name");
            const quantity = interaction.options.getInteger("quantity");

            const item = shop.items.find(i => i.name === name);
            if (!item) return interaction.reply({ content: `Item **${name}** not found.`, ephemeral: true });

            item.available = (item.available || 0) + quantity;
            await shop.save();

            return interaction.reply({ content: `${emojis.success} Item **${name}** restocked with ${quantity} more units!`, ephemeral: true });
        }
    },
});
