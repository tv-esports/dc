import { ActivityType } from "discord.js";
import Logger from "../logger";
import { ExtendedClient } from "../structures/Client";
import { BaseEvent } from "../structures/Event";
import { lootDrop } from "../jobs/lootDrop";
import { announceWeekend } from "../jobs/announceWeekend";
import { victim } from "../jobs/victim";
import { announceLottery } from "../jobs/lottery/announceLottery";
import { closeLottery } from "../jobs/lottery/closeLottery";
import { announceWinners } from "../jobs/lottery/announceWinners";

const logger = new Logger();
export default class ReadyEvent extends BaseEvent {
  constructor() {
    super("ready");
  }
  async run(client: ExtendedClient) {
    logger.success(`Logged in as ${client.user.tag}`);
    client.user.setActivity({
      name: "over Team Void",
      type: ActivityType.Watching,
    });
    client.user.setStatus("online");

    // cron jobs
    lootDrop();
    announceWeekend();
    // disable reaper: victim();
    announceLottery();
    closeLottery();
    announceWinners();
  }
}
