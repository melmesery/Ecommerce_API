import mongoose, { Schema, model, Types } from "mongoose";

const categorySchema = new Schema(
  {
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
  { toJSON: { virtuals: true }, timestamps: true }
);

categorySchema.virtual("subcategories", {
  ref: "Subcategory",
  localField: "_id",
  foreignField: "categoryId",
});

const categoryModel =
  mongoose.models.Category || model("Category", categorySchema);
export default categoryModel;
