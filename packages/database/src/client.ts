import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });



const raw = process.env.DATABASE_URL;
console.log("DATABASE_URL set?", !!raw);

if (raw) {
    const u = new URL(raw);
    console.log("host:", u.host, "| user:", u.username, "| password:", u.password ? "present" : "MISSING");
}