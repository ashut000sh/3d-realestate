import path from "node:path";
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import listingsRoutes from "./modules/listings/listings.routes.js";
import scansRoutes from "./modules/scans/scans.routes.js";
import bookingsRoutes from "./modules/bookings/bookings.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import savedRoutes from "./modules/saved/saved.routes.js";
import nearbyRoutes from "./modules/nearby/nearby.routes.js";
import statsRoutes from "./modules/stats/stats.routes.js";

export const app = express();

app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());

// Uploaded files: listing photos (/uploads/listings/...) and 3D tours (/uploads/tours/...)
app.use("/uploads", express.static(path.resolve(import.meta.dirname, "../uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// One line per module. Each module lives in src/modules/<name>/.
app.use(authRoutes);
app.use(listingsRoutes);
app.use(scansRoutes);
app.use(bookingsRoutes);
app.use(chatRoutes);
app.use(adminRoutes);
app.use(savedRoutes);
app.use(nearbyRoutes);
app.use(statsRoutes);

app.use((req, res) => res.status(404).json({ error: `No route: ${req.method} ${req.path}` }));
app.use(errorHandler);
