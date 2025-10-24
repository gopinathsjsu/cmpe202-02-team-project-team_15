import { Schema, model, Document, Types } from "mongoose";

export interface IReport extends Document {
  listingId: Types.ObjectId;
  sellerId: Types.ObjectId;
  reporterId: Types.ObjectId;
  reportCategory: 'FRAUD' | 'SCAM_COUNTERFEIT' | 'MISLEADING_WRONG_CATEGORY' | 'INAPPROPRIATE_PROHIBITED_SAFETY' | 'OTHER';
  details?: string;
  status: 'OPEN' | 'IN_REVIEW' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportCategory: {
      type: String,
      enum: ['FRAUD', 'SCAM_COUNTERFEIT', 'MISLEADING_WRONG_CATEGORY', 'INAPPROPRIATE_PROHIBITED_SAFETY', 'OTHER'],
      required: true,
    },
    details: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_REVIEW', 'CLOSED'],
      default: 'OPEN',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ReportSchema.index({ listingId: 1, reporterId: 1 }, { unique: true }); // One report per user per listing
ReportSchema.index({ status: 1, createdAt: -1 }); // For admin review queries
ReportSchema.index({ sellerId: 1, status: 1 }); // For seller-specific reports

export const Report = model<IReport>("Report", ReportSchema);
