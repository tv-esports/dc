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
class User {
  @prop({ required: true, unique: true })
  userID: string;

  // xp system
  @prop()
  xp_level: number;

  @prop()
  xp_points: number;

  // warn system
  @prop()
  warnings: number; // Array<{reason: string, moderator: string, date: Date}>;

  // prestige system
  @prop({ default: { is_prestige: false, prestige_level: 0, prestige_xp: 0, prestige_insertedAt: 0, prestige_updatedAt: 0 } })
  prestige: { is_prestige: boolean, prestige_level: number, prestige_xp: number, prestige_insertedAt: Date, prestige_updatedAt: Date };

  @prop()
  inserted_at: Date;

  @prop()
  updated_at: Date;
}

const UserModel = getModelForClass(User);

export default UserModel;
