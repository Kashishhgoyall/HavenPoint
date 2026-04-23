// Rating Stars:
let stars = document.querySelectorAll('.rating-star');
let inputField = document.getElementById('rating-value');

if (stars.length > 0) {
  updateFilledStars(3);

  stars.forEach((star) => {
    star.addEventListener('click', () => {
      let ratingValue = star.getAttribute('data-value');

      if (inputField) {
        inputField.value = ratingValue;
      }

      updateFilledStars(ratingValue);
    });
  });
}

function updateFilledStars(value) {
  stars.forEach((star) => {
    let starValue = star.getAttribute('data-value');

    if (starValue <= value) {
      star.classList.remove('fa-regular');
      star.classList.add('fa-solid');
    } else {
      star.classList.remove('fa-solid');
      star.classList.add('fa-regular');
    }
  });
}

// Map Logic - ORIGINAL
if (typeof listing !== 'undefined' && listing && listing.geometry && listing.geometry.coordinates) {
  let coordinates = listing.geometry.coordinates;
  
  // SWAP GeoJSON from [Lng, Lat] to [Lat, Lng]
  let mapCoordinates = [coordinates[1], coordinates[0]];

  // Icon design
  const icon = L.icon({
    iconUrl: '/assets/compass.svg',
    iconSize:     [40, 40],
    iconAnchor:   [20, 20],
    popupAnchor:  [0, -20],
  });

  const map = L.map('map').setView(mapCoordinates, 10);

  L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  console.log('geojson:', coordinates);
  console.log('leaflet:', mapCoordinates);

  L.marker(mapCoordinates, {icon: icon})
    .addTo(map)
    .bindPopup(`
      <div style="text-align: center;">
        <h4 style="color: #fe424d; margin: 0;">${listing.title}</h4>
        <p style="margin: 5px 0;">Exact location provided after booking.</p>
        <p style="font-weight: bold; font-size: 1.1rem;">₹ ${listing.price.toLocaleString("en-IN")}/night</p>
      </div>
    `)
    .openPopup();
}

// Checkout functionality
document.addEventListener('DOMContentLoaded', function() {
  const bookNowBtn = document.querySelector('.book-now-btn');
  const paymentOptions = document.querySelector('.payment-options');
  const razorpayBtn = document.querySelector('.razorpay-btn');

  if (bookNowBtn) {
    bookNowBtn.addEventListener('click', function(e) {
      e.preventDefault();
      paymentOptions.style.display = paymentOptions.style.display === 'none' ? 'block' : 'none';
    });
  }

  const razorpayKey = window.razorpayKey || 'rzp_test_SgH0Jv9t65FX3P';

  if (razorpayBtn) {
    razorpayBtn.addEventListener('click', function() {
      const listingId = this.dataset.listingId;
      const price = parseInt(this.dataset.price) * 100;

      fetch(`/listings/${listingId}/checkout/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: price })
      })
      .then(res => res.json())
      .then(data => {
        if (data.order_id) {
          const options = {
            key: razorpayKey,
            amount: data.amount,
            currency: 'INR',
            name: 'HavenPoint',
            description: 'Listing Booking',
            order_id: data.order_id,
            handler: function (response) {
              verifyPayment(response, listingId);
            },
            prefill: {
              name: 'Guest',
              email: 'guest@example.com'
            },
            theme: {
              color: '#28a745'
            }
          };
          const rzp = new Razorpay(options);
          rzp.open();
        }
      })
      .catch(err => console.error('Order creation failed:', err));
    });
  }
});

function verifyPayment(response, listingId) {
  fetch(`/listings/${listingId}/checkout/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('Payment successful! Booking confirmed.');
      location.reload();
    } else {
      alert('Payment verification failed.');
    }
  });
}

