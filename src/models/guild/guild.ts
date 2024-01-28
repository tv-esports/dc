import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";

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
class Guild {
    @prop({ required: true, unique: true })
    guildID: string;

    // welcome
    @prop()
    welcome_enabled: boolean;

    @prop()
    welcome_channel: string;

    @prop()
    welcome_join_role: string;

    // TODO: add this when migrating
    // @prop()
    // users: Array<{ userID: string, xp_level: number, xp_points: number, warnings: number, inserted_at: Date, updated_at: Date }>;

    // xp
    @prop()
    xp_enabled: boolean;

    @prop()
    ignored_xp_channels: string[];

    @prop()
    ignored_xp_roles: string[];

    @prop()
    blacklisted_xp_users: string[];

    @prop()
    inserted_at: Date;

    @prop()
    updated_at: Date;
}

const GuildModel = getModelForClass(Guild);

export default GuildModel;
