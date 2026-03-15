import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local (override existing env vars to match Next.js behavior)
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

const prisma = new PrismaClient();

async function main() {
  // Check if demo user already exists
  const existing = await prisma.user.findUnique({
    where: { email: "demo@boxit.com" },
  });

  if (existing) {
    console.log("Demo user already exists, skipping seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.create({
    data: {
      email: "demo@boxit.com",
      password: hashedPassword,
      name: "Demo User",
      emailVerified: true,
    },
  });

  console.log("Created demo user: demo@boxit.com / demo1234");

  // Create labels
  const labels = await Promise.all(
    ["Fragile", "Heavy", "Electronics", "Clothes", "Books", "Kitchen", "Bathroom", "Seasonal"].map(
      (name) => prisma.label.create({ data: { name, userId: user.id } })
    )
  );

  const labelMap = Object.fromEntries(labels.map((l) => [l.name, l.id]));

  // Storage Room 1: Living Room
  const livingRoom = await prisma.storageRoom.create({
    data: {
      name: "Living Room",
      userId: user.id,
      boxes: {
        create: [
          {
            name: "Entertainment",
            qrCode: nanoid(10),
            items: {
              create: [
                { name: "PlayStation 5", description: "With 2 controllers and power cable" },
                { name: "HDMI Cables", description: "3x 2m HDMI 2.1 cables" },
                { name: "Board Games", description: "Catan, Ticket to Ride, Codenames" },
                { name: "TV Remote", description: "Samsung remote + universal remote" },
              ],
            },
          },
          {
            name: "Books & Magazines",
            qrCode: nanoid(10),
            items: {
              create: [
                { name: "Fiction novels", description: "About 15 paperback novels" },
                { name: "Coffee table books", description: "Photography and travel books" },
                { name: "Magazine collection", description: "National Geographic 2023-2024" },
              ],
            },
          },
          {
            name: "Decorations",
            qrCode: nanoid(10),
            items: {
              create: [
                { name: "Picture frames", description: "6 assorted frames, wrapped in bubble wrap" },
                { name: "Candles & holders", description: "Various sizes, glass holders" },
                { name: "Throw pillows", description: "4 decorative cushions" },
                { name: "Vases", description: "2 ceramic vases, wrapped carefully" },
              ],
            },
          },
        ],
      },
    },
    include: { boxes: { include: { items: true } } },
  });

  // Storage Room 2: Kitchen
  const kitchen = await prisma.storageRoom.create({
    data: {
      name: "Kitchen",
      userId: user.id,
      boxes: {
        create: [
          {
            name: "Pots & Pans",
            qrCode: nanoid(10),
            items: {
              create: [
                { name: "Cast iron skillet", description: "12 inch Lodge skillet" },
                { name: "Stock pot", description: "Large stainless steel, with lid" },
                { name: "Saucepans", description: "Set of 3 (small, medium, large)" },
                { name: "Baking sheets", description: "2 half-sheet pans" },
                { name: "Dutch oven", description: "Le Creuset 5.5 qt, red" },
              ],
            },
          },
          {
            name: "Utensils & Gadgets",
            qrCode: nanoid(10),
            items: {
              create: [
                { name: "Knife set", description: "Wusthof 8-piece block set" },
                { name: "Spatulas & ladles", description: "Silicone utensil set" },
                { name: "Blender", description: "Vitamix E310" },
                { name: "Toaster", description: "Breville 4-slice" },
              ],
            },
          },
          {
            name: "Dishes & Glasses",
            qrCode: nanoid(10),
            items: {
              create: [
                { name: "Dinner plates", description: "Set of 8, white ceramic" },
                { name: "Bowls", description: "Set of 8 soup bowls" },
                { name: "Wine glasses", description: "6 red wine glasses, wrapped individually" },
                { name: "Coffee mugs", description: "8 assorted mugs" },
                { name: "Serving platters", description: "2 large oval platters" },
              ],
            },
          },
        ],
      },
    },
    include: { boxes: { include: { items: true } } },
  });

  // Storage Room 3: Bedroom
  const bedroom = await prisma.storageRoom.create({
    data: {
      name: "Bedroom",
      userId: user.id,
      boxes: {
        create: [
          {
            name: "Winter Clothes",
            qrCode: nanoid(10),
            items: {
              create: [
                { name: "Winter jackets", description: "2 down jackets, 1 rain shell" },
                { name: "Sweaters", description: "5 wool and cashmere sweaters" },
                { name: "Scarves & gloves", description: "3 scarves, 2 pairs of gloves" },
                { name: "Boots", description: "Snow boots and leather boots" },
              ],
            },
          },
          {
            name: "Bedding",
            qrCode: nanoid(10),
            items: {
              create: [
                { name: "Duvet", description: "Queen size, all-season" },
                { name: "Sheet sets", description: "2 sets of queen sheets" },
                { name: "Pillows", description: "4 sleeping pillows" },
                { name: "Blankets", description: "2 throw blankets" },
              ],
            },
          },
        ],
      },
    },
    include: { boxes: { include: { items: true } } },
  });

  // Storage Room 4: Garage
  await prisma.storageRoom.create({
    data: {
      name: "Garage",
      userId: user.id,
      boxes: {
        create: [
          {
            name: "Tools",
            qrCode: nanoid(10),
            items: {
              create: [
                { name: "Drill", description: "DeWalt cordless drill with 2 batteries" },
                { name: "Screwdriver set", description: "Phillips and flathead, various sizes" },
                { name: "Hammer & pliers", description: "Claw hammer, needle-nose and regular pliers" },
                { name: "Measuring tape", description: "25ft Stanley tape measure" },
                { name: "Level", description: "24 inch spirit level" },
              ],
            },
          },
          {
            name: "Holiday Decorations",
            qrCode: nanoid(10),
            items: {
              create: [
                { name: "Christmas lights", description: "4 strands of LED lights" },
                { name: "Ornaments", description: "Box of ~50 assorted ornaments" },
                { name: "Wreath", description: "Artificial pine wreath, 24 inch" },
                { name: "Halloween decorations", description: "Pumpkin lights, fake cobwebs" },
              ],
            },
          },
        ],
      },
    },
    include: { boxes: { include: { items: true } } },
  });

  // Add labels to some items
  const allItems = [
    ...livingRoom.boxes.flatMap((b) => b.items),
    ...kitchen.boxes.flatMap((b) => b.items),
    ...bedroom.boxes.flatMap((b) => b.items),
  ];

  const labelAssignments: { itemName: string; labels: string[] }[] = [
    { itemName: "PlayStation 5", labels: ["Electronics", "Fragile"] },
    { itemName: "HDMI Cables", labels: ["Electronics"] },
    { itemName: "Picture frames", labels: ["Fragile"] },
    { itemName: "Vases", labels: ["Fragile"] },
    { itemName: "Cast iron skillet", labels: ["Kitchen", "Heavy"] },
    { itemName: "Stock pot", labels: ["Kitchen"] },
    { itemName: "Dutch oven", labels: ["Kitchen", "Heavy"] },
    { itemName: "Knife set", labels: ["Kitchen", "Fragile"] },
    { itemName: "Blender", labels: ["Kitchen", "Electronics"] },
    { itemName: "Wine glasses", labels: ["Kitchen", "Fragile"] },
    { itemName: "Dinner plates", labels: ["Kitchen", "Fragile"] },
    { itemName: "Winter jackets", labels: ["Clothes", "Seasonal"] },
    { itemName: "Sweaters", labels: ["Clothes"] },
    { itemName: "Boots", labels: ["Clothes", "Seasonal"] },
    { itemName: "Duvet", labels: ["Clothes"] },
    { itemName: "Fiction novels", labels: ["Books"] },
    { itemName: "Coffee table books", labels: ["Books", "Heavy"] },
    { itemName: "Drill", labels: ["Electronics", "Heavy"] },
    { itemName: "Christmas lights", labels: ["Seasonal"] },
    { itemName: "Halloween decorations", labels: ["Seasonal"] },
  ];

  for (const assignment of labelAssignments) {
    const item = allItems.find((i) => i.name === assignment.itemName);
    if (!item) continue;
    for (const labelName of assignment.labels) {
      await prisma.itemLabel.create({
        data: { itemId: item.id, labelId: labelMap[labelName] },
      });
    }
  }

  console.log("Seed complete!");
  console.log("  4 storage rooms: Living Room, Kitchen, Bedroom, Garage");
  console.log("  10 boxes with 44 items total");
  console.log("  8 labels with assignments");
  console.log("\nLogin: demo@boxit.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
