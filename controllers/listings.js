const Listing = require('../models/listing.js');
const getGeoData = require('../utils/geoData.js');

module.exports.index = async (req, res) => {
    let { category, location } = req.query;

    let query = {};

    if (category && category !== "All") {
        query.category = {
            $regex: `^${category.trim()}$`,
            $options: "i"
        };
    }

    if (location) {
        query.location = {
            $regex: location,
            $options: "i"
        };
    }

    const allListings = await Listing.find(query);

    res.render("listings/index", {
        allListings,
        selectedCategory: category || ""
    });
};

module.exports.newListing = (req, res) => {
    res.render('listings/new');
}

module.exports.createListing = async (req, res) => {
    let listing = req.body.listing;
    let geometry = await getGeoData(listing.location, listing.country);

    if (!geometry) {
        req.flash('error', 'Location not found! Please check the spelling or Country.');
        return res.redirect('/listings/new');
    }

    let imageUrl = req.file.path;
    let imageFilename = req.file.filename;

    const newListing = new Listing(listing);
    newListing.owner = req.user._id;
    newListing.image = { url: imageUrl, filename: imageFilename };
    newListing.geometry = geometry;
    
    await newListing.save();
    console.log(newListing);

    req.flash('success', 'New listing created! It is now live and visible to everyone.');
    res.redirect('/listings');
}

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id)
        .populate({
            path: 'reviews',
            populate: {
                path: 'author',
            },
        })
        .populate('owner');

    if (!listing) {
        req.flash('error', 'Error! The listing you requested does not exist or was deleted.');
        return res.redirect('/listings');
    }
    
    // console.log(listing);
    res.render('listings/show', { listing });
}

module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash('error', 'Error! The listing you requested does not exist or was deleted.');
        return res.redirect('/listings');
    }

    res.render('listings/edit', { listing });
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = req.body.listing;
    let existingListing = await Listing.findById(id);

    if (
        existingListing.location !== listing.location ||
        existingListing.country !== listing.country
    ) {
        let geometry = await getGeoData(listing.location, listing.country);

        if (!geometry) {
            req.flash('error', 'Location not found! Please check the spelling or Country.');
            return res.redirect(`/listings/${id}/edit`);
        }

        listing.geometry = geometry;
    }
    
    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }

    listing = await Listing.findByIdAndUpdate(id, { ...listing }, { new: true } );

    console.log(listing);

    req.flash('success', 'Listing updated! Your latest changes are now live on the website.');
    res.redirect(`/listings/${id}`);
}

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndDelete(id);
    console.log(listing);
    req.flash('success', 'Listing deleted! It has been successfully removed from your collection.');
    res.redirect('/listings');
}

module.exports.checkoutCod = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        const userId = req.user._id;

        req.flash('success', `COD booking confirmed for ${listing.title}! Pay ₹${listing.price.toLocaleString('en-IN')} on delivery.`);
        res.redirect(`/listings/${id}`);
    } catch (err) {
        req.flash('error', 'Booking failed!');
        res.redirect(`/listings/${id}`);
    }
}





const Razorpay = require('razorpay');
const crypto = require('crypto');

const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports.createRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body; // ✅ THIS LINE MUST BE HERE

        console.log("AMOUNT RECEIVED:", amount);

        if (!amount || isNaN(amount)) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const options = {
            amount: Number(amount),
            currency: "INR"
        };

        const order = await rzp.orders.create(options);

        res.json({
            order_id: order.id,
            amount: order.amount
        });

    } catch (error) {
        console.log("🔥 RAZORPAY ERROR:", error);
        res.status(400).json({ message: error.message });
    }
};


module.exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const { id } = req.params;
        
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (expectedSign === razorpay_signature) {
            req.flash('success', 'Payment verified and booking confirmed!');
            res.json({ success: true });

        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false });
    }
}

