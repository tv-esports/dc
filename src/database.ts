import mongoose from "mongoose";
import Logger from "./util";

export function connect() {
  if (!process.env.MONGODB_TOKEN) return;
  mongoose
    .connect(process.env.MONGODB_TOKEN)
    .then(() => Logger.scan(`Successfully connected to MongoDB`))
    .catch((err: string) => Logger.scan(`Error connecting to MongoDB: ${err}`));
}