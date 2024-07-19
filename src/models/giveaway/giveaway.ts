import { prop, getModelForClass, Severity, modelOptions } from "@typegoose/typegoose";

/**
 * @class Giveaway
 * @description Giveaway model
 * @property {string} xxy
 */
@modelOptions({
    options: {
        allowMixed: Severity.ALLOW
    }
})
class Giveaway {
    @prop()
    giveawayMessageID: string;

    @prop()
    xpAmount: number;

    @prop()
    endsIn: number;

    @prop()
    signed_up_users: string[];

    @prop()
    inserted_at: Date;

    @prop()
    updated_at: Date;
}

const GiveawayModel = getModelForClass(Giveaway);

export default GiveawayModel;