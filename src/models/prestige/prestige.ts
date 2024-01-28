import { prop, getModelForClass, Severity, modelOptions } from "@typegoose/typegoose";

/**
 * @class User
 * @description User model
 * @property {string} userID - The user's ID
 */
@modelOptions({
  options: {
    allowMixed: Severity.ALLOW
  }
})
class Prestige {
  @prop({ required: true, unique: true })
  userID: string;

  // prestige system
  @prop()
  prestige_level: number;

  @prop()
  prestige_xp: number;

  @prop()
  inserted_at: Date;

  @prop()
  updated_at: Date;
}

const PrestigeModel = getModelForClass(Prestige);

export default PrestigeModel;
