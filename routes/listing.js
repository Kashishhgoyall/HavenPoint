const express = require('express');
const router = express.Router();
const { isLoggedIn, isOwner, validateListing } = require('../middleware.js');
const listingController = require('../controllers/listings.js');
const multer  = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });

router
    .route('/')
    .get(listingController.index)
    .post(
        isLoggedIn,
        upload.single('listing[image]'),
        validateListing,
        listingController.createListing
    );

router.post('/:id/checkout/cod', isLoggedIn, listingController.checkoutCod);
router.post('/:id/checkout/razorpay-order', isLoggedIn, listingController.createRazorpayOrder);
router.post('/:id/checkout/verify', isLoggedIn, listingController.verifyPayment);

// New Route:
router.get('/new', isLoggedIn, listingController.newListing);

router
    .route('/:id')
    .get(listingController.showListing)
    .put(
        isLoggedIn,
        isOwner,
        upload.single('listing[image]'),
        validateListing,
        listingController.updateListing
    )
    .delete(
        isLoggedIn,
        isOwner,
        listingController.deleteListing
    );

// Edit Route:
router.get(
    '/:id/edit',
    isLoggedIn,
    isOwner,
    listingController.editListing
);

module.exports = router;