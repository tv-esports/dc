import { prop, getModelForClass, Severity, modelOptions } from "@typegoose/typegoose";

/**
 * @class LFG
 * @description User model
 * @property {string} userID - The user's ID
 */
@modelOptions({
  options: {
    allowMixed: Severity.ALLOW
  }
})
class LFG {
  @prop({ required: true, unique: false })
  userID: string;

  @prop()
  lfg_count: number;

  @prop()
  inserted_at: Date;

  @prop()
  updated_at: Date;
}

const LFGModel = getModelForClass(LFG);

export default LFGModel;