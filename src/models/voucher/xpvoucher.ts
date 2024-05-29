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
class XPVoucher {
    @prop()
    adminID: string;

    @prop()
    xpAmount: number;

    @prop()
    voucherCode: string;

    @prop()
    usageCount: number;

    @prop()
    redeemedBy: string[];

    @prop()
    inserted_at: Date;

    @prop()
    updated_at: Date;
}

const VoucherModel = getModelForClass(XPVoucher);

export default VoucherModel;