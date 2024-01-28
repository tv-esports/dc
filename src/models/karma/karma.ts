import { prop, getModelForClass, Severity, modelOptions } from '@typegoose/typegoose';

/**
 * @class Karma
 * @description Karma model
 * @property {string} userID - TODO
 */
@modelOptions({
    options: {
      allowMixed: Severity.ALLOW
    }
  })
class Karma {
    @prop({ required: true, unique: false })
    karmaUserID: string;

    @prop()
    karmaGuildID: string;

    @prop()
    karmaMessageID: string; // message ID of the karma message (trigger)

    @prop()
    karmaStatus: string; // like: "open", "decided", "closed"

    @prop()
    karmaPunishments: Record<string, string[]>; // like "penalty": ["userID", "userID"] for counter

    @prop()
    karmaDecision: string; // like what penalty was decided

    @prop()
    inserted_at: Date;

    @prop()
    updated_at: Date;
}

const KarmaModel = getModelForClass(Karma);

export default KarmaModel;