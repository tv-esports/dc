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

  @prop()
  inserted_at: Date;

  @prop()
  updated_at: Date;
}

const UserModel = getModelForClass(User);

export default UserModel;
