import mongoose, { Schema, model, Types } from "mongoose";

const subcategorySchema = new Schema(
  {
    customId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    slug: {
      type: String,
      lowercase: true,
      required: true,
    },
    image: {
      type: Object,
      required: true,
    },
    categoryId: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const subcategoryModel =
  mongoose.models.Subcategory || model("Subcategory", subcategorySchema);
export default subcategoryModel;
