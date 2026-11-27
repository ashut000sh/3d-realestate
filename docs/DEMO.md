# Demo guide

How to reset Aawas to clean sample data and run the 5-minute demo.

## 1. Reset before every demo

```bash
npm run demo:reset
npm run dev
```

`demo:reset` runs, in order:

1. `npm run db:migrate -w server`: brings the database up to date
2. `npm run db:seed`: **empties every table** and loads the sample data
3. `npm run tours`: makes the sample 3D tour files in `client/public/tours/`

Only run it on your own test database. Then open <http://localhost:5173>.

## 2. Test accounts

Every account uses the password **`Password123!`** and is already verified.

| Role | Email | Use it for |
|---|---|---|
| Buyer | `gita.buyer@test.com` | Exploring, saving, booking, chatting |
| Buyer | `bikash.buyer@test.com`, `anita.buyer@test.com` | Spare buyers |
| Seller | `ram.seller@test.com` | Listing a property, answering bookings |
| Seller | `sita.seller@test.com`, `hari.seller@test.com` | Spare sellers |
| Admin | `admin@test.com` | Scan queue, tour upload, insights |

Use two browser windows (or one normal and one private window) so the buyer and the
seller can be logged in at the same time for the live chat.

## 3. The 5-minute demo

### Buyer explores (2 minutes): window 1, log in as `gita.buyer@test.com`

1. **Home**: point out the 3D tour badges on the listing cards.
2. **Explore** (top menu): choose district **Kaski**. The results, the map and the web address all change.
3. Press the **heart** on two homes. Open the account menu: **Saved homes** shows the count.
4. Open **Farm house in Bharatpur**, then **Add to compare**. Open **Newari house in Patan** and add it too.
   Open **Compare** (top menu): the two homes side by side.
5. Open **3BHK house in Budhanilkantha** (Ram's home, so he gets the booking and the chat).
   Press **Open 3D tour**. Drag to look around, press **Measure** and click two points on the floor:
   the distance shows in metres and feet.
6. Back on the listing, **Book a viewing**: pick a date and send. Then open **My bookings** in the account
   menu: it's under Upcoming.
7. Back on the listing, press **Chat with seller** and send "Is it still available?".

### Seller (1.5 minutes): window 2, log in as `ram.seller@test.com`

1. Open **Messages**: Gita's message is there. Reply. **In window 1 the reply appears without a refresh.**
2. Account menu, **My listings**: totals, filters and the actions on each home. The
   **3BHK house** shows Gita's booking to answer: confirm it on **List your property** (Booking requests).
3. **List your property**: fill in a title and price, click the map to set the location, **Save and continue**,
   add 2 photos, **Upload and continue**, pick a date, **Request a scan**.

### Admin (1.5 minutes): window 2, log out, then log in as `admin@test.com`

1. **Insights** at the top: 8-week activity, scan pipeline, districts, listing mix, booking split and the
   most wanted homes.
2. **Scan queue**: find Ram's new property under Pending, **Schedule visit**, save. Open **Scheduled**,
   press **Mark scanned**.
3. Open **Scanned**, press **Upload tour & publish** and choose `client/public/tours/house.glb`.
   The request moves to **Published**, the listing goes live, and the insights update.
4. Open the listing from the request and show its new 3D tour.

## 4. If something goes wrong

| Problem | Fix |
|---|---|
| The OTP email doesn't arrive | Read the code from the API terminal: the line `[OTP] email -> 123456`. If it says `Could not send OTP email`, check the `SMTP_*` settings in `server/.env`. |
| A 3D tour says "We couldn't open this tour" or keeps loading | Run `npm run tours` (it makes the sample files), then reload. |
| A listing page says "Property not found" | It's a draft or the data was reset. Use a live listing, or run `npm run demo:reset`. |
| Photos don't show | The sample photos load from Wikimedia, so the laptop needs internet. |
| Login fails with the right password | The data was changed. Run `npm run demo:reset`. |
| Port 4000 or 5173 is already in use | An old `npm run dev` is still running. Close that terminal (Ctrl+C) and start again. |
