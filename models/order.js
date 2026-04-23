const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    // ✅ ADD THESE
    checkIn: Date,
    checkOut: Date,
    guests: Number,

    paymentType: {
        type: String,
        enum: ['COD', 'Razorpay'],
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },

    orderId: String,
    paymentId: String

}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);

