import { ActivityType } from "discord.js";
import { ExtendedClient } from "../structures/Client";
import { BaseEvent } from "../structures/Event";

import Logger from "../util";

import { envguard } from "env";
import { lootDrop } from "../jobs/lootDrop";
import { announceWeekend } from "../jobs/announceWeekend";
import { victim } from "../jobs/victim";
import { announceGiveaway } from "../jobs/giveaway/announceGiveaway";
import { endGiveaway } from "../jobs/giveaway/endGiveaway";
import { announceLottery } from "../jobs/lottery/announceLottery";
import { closeLottery } from "../jobs/lottery/closeLottery";
import { announceWinners } from "../jobs/lottery/announcewinner";

export default class ReadyEvent extends BaseEvent {
  constructor() {
    super("ready");
  }
  async run(client: ExtendedClient) {
    envguard({ strict: ["MONGODB_TOKEN"] });

    Logger.scan(`${client.user.tag} is now online.`);

    client.user.setActivity({
      name: "over Team Void",
      type: ActivityType.Watching,
    });
    client.user.setStatus("online");

    // utils
    lootDrop();
    announceWeekend();
    victim();

    // giveaway
    announceGiveaway();
    endGiveaway();

    // lottery
    announceLottery();
    closeLottery();
    announceWinners();
  }
}
