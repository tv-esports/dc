import { ActivityType } from "discord.js";
import { ExtendedClient } from "../structures/Client";
import { BaseEvent } from "../structures/Event";
import { lootDrop } from "../jobs/lootDrop";
import { announceWeekend } from "../jobs/announceWeekend";
import { victim } from "../jobs/victim";

import Logger from "../util";

import { envguard } from "env";

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

    // cron jobs
    lootDrop();
    announceWeekend();
    victim();
    //announceLottery();
    //closeLottery();
    //announceWinners();
  }
}
