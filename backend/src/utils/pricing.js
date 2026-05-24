const BASE_PRICE = 20;
const PER_KM_RATE = 8;
const EXPRESS_MULTIPLIER = 1.5;
const WEIGHT_RATE = 5;

const PACKAGE_SURCHARGE = {
  medicine: 0,
  food: 5,
  tea_snacks: 0,
  documents: 0,
  fragile: 15,
  gift: 10,
  grocery: 5,
  electronics: 20,
  household: 15,
  other: 0,
};

function calculatePrice(distanceKm, packageType, deliverySpeed, weightKg = 1) {
  let price = BASE_PRICE + distanceKm * PER_KM_RATE;
  price += (weightKg - 1) * WEIGHT_RATE;
  price += PACKAGE_SURCHARGE[packageType] || 0;
  if (deliverySpeed === 'express') price *= EXPRESS_MULTIPLIER;
  return Math.round(price);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTime(distanceKm, deliverySpeed) {
  const baseMinutes = Math.max(10, distanceKm * 4);
  return deliverySpeed === 'express' ? Math.round(baseMinutes * 0.7) : Math.round(baseMinutes);
}

module.exports = { calculatePrice, calculateDistance, estimateTime };
