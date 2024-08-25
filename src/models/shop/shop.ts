import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";

class Item {
    @prop({ required: true })
    name: string;

    @prop({ required: true })
    description: string;

    @prop({ required: true })
    price: number;

    @prop()
    available: number; 
}

@modelOptions({
    options: {
        allowMixed: Severity.ALLOW
    }
})
class Shop {
    @prop()
    enabled: boolean;

    @prop({ type: () => [Item], default: [] })
    items: Item[];

    @prop()
    updated_at: Date;

    @prop()
    inserted_at: Date;
}

const ShopModel = getModelForClass(Shop);
export default ShopModel;
