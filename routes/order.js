const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Listing = require("../models/listing");

// Middleware
function isLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  next();
}

// ================= SHOW ORDERS =================
router.get("/", isLoggedIn, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });

    // ✅ FIXED PATH
    res.render("order", { orders });

  } catch (err) {
    console.log(err);
    req.flash("error", "Unable to load orders.");
    res.redirect("/");
  }
});

// ================= COD ORDER =================
router.post("/", isLoggedIn, async (req, res) => {
  try {
    const { listingId, amount, checkIn, checkOut, guests } = req.body;

    const order = new Order({
      user: req.user._id,
      listing: listingId,
      amount,
      checkIn,
      checkOut,
      guests,
      paymentType: "COD",
      status: "confirmed"
    });

    await order.save();

    req.flash("success", "Booking successful!");
    res.redirect("/orders");

  } catch (err) {
    console.log(err);
    req.flash("error", "Booking failed.");
    res.redirect("back");
  }
});

// ================= RAZORPAY SUCCESS =================
router.post("/payment/success", isLoggedIn, async (req, res) => {
  try {
    const {
      listingId,
      amount,
      checkIn,
      checkOut,
      guests,
      razorpay_order_id,
      razorpay_payment_id
    } = req.body;

    const order = new Order({
      user: req.user._id,
      listing: listingId,
      amount,
      checkIn,
      checkOut,
      guests,
      paymentType: "Razorpay",
      status: "confirmed",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    });

    await order.save();

    req.flash("success", "Payment successful!");
    res.redirect("/orders");

  } catch (err) {
    console.log(err);
    req.flash("error", "Payment failed.");
    res.redirect("/");
  }
});

module.exports = router;