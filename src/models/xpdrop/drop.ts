import { prop, getModelForClass, Severity, modelOptions } from "@typegoose/typegoose";

/**
 * @class Drop
 * @description User model
 * @property {string} userID - The user's ID
 */
@modelOptions({
    options: {
        allowMixed: Severity.ALLOW
    }
})
class Drop {
    @prop({ required: true, unique: false })
    guildID: string;

    @prop()
    dropMessage: string;

    @prop()
    amount: number;

    @prop()
    inserted_at: Date;

    @prop()
    updated_at: Date;
}

const DropModel = getModelForClass(Drop);

export default DropModel;