const { Expo } = require("expo-server-sdk");
const Admin = require("../models/Admin");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Booking = require("../models/Booking");
const shortId = require("shortid");

class IOService {
  server = null;
  static onlineUsers = [];
  static onlineUsersRoom = [];
  static helpQueue = [];
  static currentHelpDeskUser = null;
  static helpDeskMessages = [];
  static admins = [];

  constructor(server) {
    this.server = server;
  }

  static addAdmin(shopIds, adminId, socketId) {
    this.removeAdmin(adminId);

    const adminExists = this.admins.find((x) => x.adminId === adminId);
    if (adminExists) {
      adminExists.socketId = socketId;
      return;
    }

    this.admins.push({
      shopIds,
      adminId,
      socketId,
    });
  }

  static findAdmin(adminId) {
    return this.admins.find((x) => x.adminId === adminId);
  }

  static removeAdmin(adminId) {
    this.admins = this.admins.filter((x) => x.adminId !== adminId);
  }

  static removeAdminBySocketId(socketId) {
    this.admins = this.admins.filter((x) => x.socketId !== socketId);
  }

  init() {
    this.server.on("connection", (socket) => {
      console.log("client connected with socket " + socket.id);

      socket.emit("connection-successful", socket.id);

      socket.on("new-booking", async (booking) => {
        console.log(booking);

        for (let admin of IOService.admins) {
          const shop = admin.shopIds.find((x) => x === booking.shopId);
          if (shop) {
            this.server.to(admin.adminId).emit("new-booking", booking);
          }
        }
      });

      socket.on("join-admin", ({ adminId, shopIds }) => {
        IOService.addAdmin(shopIds, adminId, socket.id);
        console.log(IOService.admins);
        socket.join(adminId);
      });

      /*
       * Disconnection
       * */

      socket.on("disconnect", () => {
        console.log("disconnecting");
        IOService.removeAdminBySocketId(socket.id);
        console.log(IOService.admins);
        socket.leave("admin");
      });
    });
  }
}

module.exports = IOService;
