import { Schema, model, Types, Document } from "mongoose";
export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  body: string;
  readBy: Types.ObjectId[];
  senderProfileImage?: string | null; // Cached sender profile image URL
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    senderProfileImage: { 
      type: String, 
      default: null,
      trim: true 
    }, // Cached sender profile image URL for performance
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model<IMessage>("Message", MessageSchema);
