import { GuildMember, TextChannel } from "discord.js";
import { ExtendedClient } from "../structures/Client";
import { BaseEvent } from "../structures/Event";

import GuildModel from "../models/guild/guild";

import Logger from "../util";

export default class MessageEvent extends BaseEvent {
    constructor() {
        super("guildMemberAdd");
    }
    async run(client: ExtendedClient, member: GuildMember) {
        Logger.scan(`Member joined: ${member.user.username}`);

        const guildQuery = await GuildModel.findOne({ guildID: member.guild.id });

        if (!guildQuery.welcome_enabled) return;

        const welcomeChannel = member.guild.channels.cache.find((c) => c.id === guildQuery.welcome_channel);
        const joinRole = member.guild.roles.cache.find((r) => r.id === guildQuery.welcome_join_role);

        if (welcomeChannel) {
            (welcomeChannel as TextChannel).send({ content: `Welcome to the server, ${member.user}!` });
        }

        if (joinRole && !member.roles.cache.has(joinRole.id)) {
            member.roles.add(joinRole);
        }
    }
}
