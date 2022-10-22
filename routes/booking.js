const { BookingController } = require("../controllers/BookingController");
const router = require("express").Router();

router.get("/booking/barber/:shopId", BookingController.getBookingsBarber);
router.get("/booking/:shopId", BookingController.getBookings);
router.post("/booking", BookingController.createBooking);
router.put("/booking/barber/:id", BookingController.updateBooking);
router.delete("/booking/event/:id", BookingController.deleteBooking);
router.put("/booking/confirm/:id", BookingController.confirmBooking);

module.exports = router;
