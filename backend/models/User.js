const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      maxlength: 15,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    type: {
      type: String,
      enum: ['customer', 'admin', 'mainAdmin'],
      default: 'customer',
    },
    restaurantId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toClient = function toClient() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    type: this.type,
    restaurantId: this.restaurantId,
  };
};

module.exports = mongoose.model('User', userSchema);
