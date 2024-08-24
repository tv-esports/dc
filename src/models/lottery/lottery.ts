import { prop, getModelForClass, Severity, modelOptions } from "@typegoose/typegoose";

/**
 * @class Lottery
 * @description Lottery model
 * @property {string} 
 */

@modelOptions({
    options: {
        allowMixed: Severity.ALLOW
    }
})

class Lottery {
    @prop()
    lotteryMessageID: string;

    @prop()
    lotteryGameID: string;

    @prop({ default: "" })
    winner: string;

    // the amount of winnable XP 
    @prop({ default: 0 })
    lotteryPot: number;

    @prop()  // Define the type for lotteryBets
    lotteryBets: Array<{ userID: string, betAmount: number, lotteryNumbers: [number, number, number] }>;

    // the 3 random numbers generated for the lottery
    @prop()
    lotteryNumbers: Array<[number, number, number]>;

    @prop()
    opened: boolean;

    @prop()
    endsIn: number;

    @prop()
    inserted_at: Date;

    @prop()
    updated_at: Date;
}

const LotteryModel = getModelForClass(Lottery);

export default LotteryModel;