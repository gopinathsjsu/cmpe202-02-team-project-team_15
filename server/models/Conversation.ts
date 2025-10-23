import { Schema, model, Types, Document } from "mongoose";
export interface IConversation extends Document {
  listingId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  lastMessageAt: Date;
  status: "open" | "archived" | "blocked";
}

const ConversationSchema = new Schema<IConversation>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["open", "archived", "blocked"],
      default: "open",
    },
  },
  { timestamps: true }
);

ConversationSchema.index(
  { listingId: 1, buyerId: 1, sellerId: 1 },
  { unique: true }
);
ConversationSchema.index({ lastMessageAt: -1 }); // WHY: fast inbox sorting

export const Conversation = model<IConversation>(
  "Conversation",
  ConversationSchema
);
