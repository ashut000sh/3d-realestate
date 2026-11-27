# Aawas user manual

Aawas lets you walk through homes in Nepal as 3D tours before you visit. You can buy, rent or
book a short stay, and sellers can have their property scanned in 3D by our team.

This manual is for the people who **use** Aawas. To install or run it, see `docs/SETUP.md`.
To present it, see `docs/DEMO.md`.

> **Screenshots.** Each 📷 line marks where a screenshot goes. Take them after
> `npm run demo:reset`, save them in `docs/screenshots/` with the file name shown, then
> replace the 📷 line with `![caption](screenshots/<file name>)`.

## Contents

1. [Getting started](#1-getting-started)
2. [Finding a home](#2-finding-a-home)
3. [The 3D tour](#3-the-3d-tour)
4. [Saving and comparing homes](#4-saving-and-comparing-homes)
5. [Booking a viewing or a stay](#5-booking-a-viewing-or-a-stay)
6. [Messages](#6-messages)
7. [For sellers](#7-for-sellers)
8. [For the admin team](#8-for-the-admin-team)
9. [Questions and problems](#9-questions-and-problems)

---

## 1. Getting started

### Welcome screens

The first time you open Aawas you see three short slides:
**Walk through homes before you visit**, **Measure any room from your sofa** and
**Compare, chat and book in one place**. Swipe or press **Next**, or **Skip** to go straight in.

> 📷 `01-onboarding.png`: the first welcome slide

You can look at homes, search and open 3D tours **without an account**. You need one to save
homes, book, chat or list a property.

### Create an account

1. Press **Sign up** (top right, or in the ☰ menu on a phone).
2. Under **I want to**, choose **I'm looking** (to buy, rent or stay) or **I'm listing** (to sell
   or rent out a property). This decides what you can do later.
3. Fill in your name, email, phone (optional, e.g. `98XXXXXXXX`) and a password of at least
   8 characters. The bar under the password shows how strong it is, from **Weak** to **Strong**.
4. Press **Sign up**. We email you a **6-digit code**.

> 📷 `02-signup.png`: the sign-up form with "I'm looking" chosen

### Verify your email

1. Type the 6-digit code from the email, or paste it: all six boxes fill at once.
2. The code works for a few minutes. Didn't get it? Check your spam folder, then press
   **Resend** (available after 60 seconds). Only the newest code works.
3. After **5 wrong tries** the code stops working, for your safety: press **Resend** for a new one.

When the code is right you are logged in.

> 📷 `03-otp.png`: the six code boxes and the Resend timer

### Log in and out

Press **Log in**, enter your email and password. If you signed up but never entered the code,
Aawas takes you back to the code screen.

To log out, open the account menu (your name, top right; or ☰ on a phone) and press **Log out**.

### Finding your way around

| On a laptop | On a phone | What's there |
|---|---|---|
| Top menu | ☰ menu | **Home**, **Explore**, **Compare**, **Messages** |
| Account menu (your name) | ☰ menu → **Your account** | **Saved homes**, **My bookings**, and for sellers **My listings** and **List a property**; for the admin, **Admin dashboard** |

A small gold number on **Compare** shows how many homes you picked. A red number on
**Messages** shows unread messages.

---

## 2. Finding a home

### Home page

The home page shows featured homes. Use the **Buy / Rent / Short stay** tabs, or type a place
(for example *Lalitpur* or *Lakeside*) in the search bar and press **Search**.

Each card shows the price, the district, the type and the size, in sq ft and in the local unit
("1,250 sq ft · 3.7 aana"; bigha or kattha for Chitwan). "Area not provided" means the seller
didn't give it. A **3D tour** badge means you can walk
through it online.

> 📷 `04-home.png`: the home page with listing cards

### Explore (search)

Open **Explore** to search with filters:

- **Search**: words from the title or address
- **Type**: for sale, for rent or short stay
- **District**: Kathmandu, Lalitpur, Bhaktapur, Kaski or Chitwan
- **Min / Max price** in rupees
- **Minimum area**: type it in **sq ft** or switch the little toggle to **aana** (4 aana is about
  1,369 sq ft). Homes that don't list their area are hidden while this is set.

Then press **Apply**.

The results, the map and the web address all update. You can copy the address to share the
same search. The map shows every result: click a pin to see the price and open the home.
**Clear** removes all filters.

> 📷 `05-search.png`: results with the map, district "Kaski" chosen

Prices for rent are **per month** and for short stays **per night**.

### A home's page

Click any card to open the home. You see:

- **Photos**: use the arrows or the small pictures underneath
- the **price**, address, bedrooms, bathrooms, floors and description
- an **Area** card: the size in **sq ft**, the same size in local units and in **m²**, and one
  outline per floor. Kathmandu, Lalitpur, Bhaktapur and Kaski use **ropani-aana-paisa-daam**;
  Chitwan uses **bigha-kattha-dhur**. For example, 1,250 sq ft is about **3 aana 2 paisa 2 daam**.
  Homes without an area simply don't show the card.
- a **map** of where it is
- who listed it
- buttons to **Open 3D tour**, **Book a viewing** (or **Book a stay**), **Chat with seller**,
  **Save** and **Add to compare**

If a home has no tour yet, the button says **Tour coming soon**.

> 📷 `06-listing.png`: a home's page with the photo gallery and the buttons

---

## 3. The 3D tour

Press **Open 3D tour** on a home's page. The tour is a real 3D model of the property, made by our
team with a LiDAR scanner.

**Look around**

- **Drag** to turn around.
- **Scroll** (mouse) or **pinch** (phone) to zoom in and out.

**Measure a room**

1. Press **Measure**.
2. Click two points, for example the two ends of a wall. The distance appears in **metres** and
   in **feet and inches** (for example `3.20 m · 10′ 6″`).
3. Add as many measurements as you like. Each one is listed in **Measurements**: remove one with
   its ✕, or press **Clear all**. Clicked the first point by mistake? Press **Esc** to drop it.

When you've seen enough, press **Book a visit** to book a viewing.

> 📷 `07-tour.png`: the 3D tour with one measurement shown

If the page says **We couldn't open this tour**, check your internet connection and reload.

---

## 4. Saving and comparing homes

### Saved homes

Press the **♥** on any card, or **Save** on a home's page. The heart turns red. Open
**Saved homes** from the account menu to see your shortlist. Press the heart again to remove a
home. You need to be logged in; if you aren't, Aawas asks you to log in and brings you back.

> 📷 `08-saved.png`: the Saved homes page

### Compare up to 3 homes

1. On a home's page press **Add to compare**.
2. Do the same for up to **3** homes.
3. Open **Compare** to see them side by side: price, type, district, rooms, area (sq ft and the
   local unit, e.g. "1,250 sq ft · 3.7 aana"), floors and 3D tour.

Press **Remove** to take one out. Your choice stays even if you close the browser.

> 📷 `09-compare.png`: three homes side by side

---

## 5. Booking a viewing or a stay

### Book

On a home's page press **Book a viewing** (homes for sale or rent) or **Book a stay**
(short stays).

- **Viewing**: pick a date.
- **Stay**: pick **check-in** and **check-out**. Aawas shows the number of nights and the total.

Add a message if you like (for example "two adults, arriving by bus") and press
**Send request**. Nothing is paid now. The seller confirms or declines.

> 📷 `10-booking.png`: booking a stay with the nights and total shown

You can't book dates in the past, or a stay on dates that are already confirmed for someone else.

### My bookings

Open **My bookings** from the account menu.

- **Upcoming**: your next viewings and stays, soonest first
- **Past & cancelled**: everything that's over, declined or cancelled

Each booking shows its status: **Waiting for the seller**, **Confirmed**, **Declined** or
**Cancelled**. Press **Cancel** to cancel one that's still waiting or confirmed.

> 📷 `11-my-bookings.png`: the Upcoming tab

---

## 6. Messages

On a home's page press **Chat with seller** to ask a question. You and the seller can then chat
in **Messages**.

- Your conversations are on the left (on a phone, tap one to open it).
- Type in the box and press **Enter** (or the send button). **Shift + Enter** starts a new line.
- New messages appear straight away, without reloading. You can see when the other person is
  typing.

> 📷 `12-chat.png`: a conversation between a buyer and a seller

---

## 7. For sellers

Sign up with **I'm listing** to use these pages.

### List a property

Open **List a property** from the account menu (or **List your property** in the top bar).
It takes three steps:

1. **Property details**: title, type, price, district, address, rooms, area (in sq ft: the form
   shows the same size in aana or kattha underneath), number of floors, description.
   **Click the map** where the property is. Press **Save and continue**.
2. **Photos**: up to 10 photos, `.jpg` or `.png`, up to 5 MB each. The first one is the
   cover. Press **Upload and continue** (or **Skip**).
3. **Scan visit**: pick a preferred date and add notes for our team (gate code, who opens the
   door). Press **Request a scan**.

Your listing is saved as a **draft** and only buyers can see it after the scan, when it goes live
with its 3D tour.

> 📷 `13-list-property.png`: step 1 with the map pin set

Further down the same page, **Booking requests** shows bookings on your homes: press
**Confirm** or **Decline**.

### My listings

Open **My listings** from the account menu to manage everything you've listed.

- At the top: how many listings you have, how many are **live**, how many times buyers saved
  them, and how many bookings are **waiting for your answer**.
- Filter by **All**, **Live**, **Waiting for scan** or **Drafts**.
- On each listing:
  - **Edit details**: change the title, price, rooms, area, number of floors, description and more
  - **Add photos**: up to 10 photos per listing in total
  - **Request 3D scan**: shown when a listing has no tour and no scan in progress

> 📷 `14-my-listings.png`: the My listings page with the totals and filters

**What the statuses mean**

| Status | Meaning |
|---|---|
| Draft | Saved, not visible to buyers |
| Waiting for scan | A scan is requested or booked |
| Live | Visible to everyone, with its 3D tour |

When you open one of your own homes, you see **Manage in My listings** instead of the booking
and chat buttons.

---

## 8. For the admin team

Admins log in with an admin account and open **Admin dashboard** (account menu).

### Insights

The numbers and charts at the top show how Aawas is doing:

- **Activity**: new listings, bookings and sign-ups per week, for the last 8 weeks
- **Scan pipeline**: how many requests are at each step
- **Listings by district**, **listing mix** by type with average prices, and **bookings** by status
- **Most wanted homes**: the 5 live homes with the most saves, bookings and chats

> 📷 `15-admin-insights.png`: the Insights charts

### Scan queue: from request to live 3D tour

Requests are grouped by status: **Pending**, **Scheduled**, **Scanned**, **Published**,
**Cancelled**.

1. **Pending**: call the seller, then press **Schedule visit** and set the date and time.
2. **Scheduled**: after the visit, press **Mark scanned**. (**Reschedule** changes the date.)
3. **Scanned**: press **Upload tour & publish** and choose the finished `.glb` file
   (up to 50 MB). The listing goes **live** with its 3D tour straight away.

**Cancel request** stops a request at any open step; the listing goes back to draft.

> 📷 `16-admin-queue.png`: the scan queue with a request ready to publish

### Bookings and people

- **Bookings**: every viewing and stay on Aawas, with the guest, the seller and the status.
- **People**: every account, filtered by role, showing whether the email is verified.

---

## 9. Questions and problems

| Problem | What to do |
|---|---|
| I didn't get the code email | Check spam. Wait 60 seconds and press **Resend**. Make sure the email address is right. |
| "Too many wrong codes" | Press **Resend** for a new code. |
| I can't save, book or chat | Log in first. |
| "This area isn't for your account" | That page is for another kind of account (for example sellers only). |
| A home says "Property not found" | It was removed, or it isn't live yet. |
| A photo shows a grey picture icon | The photo couldn't load. Check your internet connection. |
| The 3D tour doesn't open | Check your internet connection and reload. Large tours can take a little while. |
| "These dates are already booked" | Someone has a confirmed stay on those nights. Pick other dates. |
| "Something went wrong on this page" | Press **Reload**. If it happens again, go **Home** and tell the team. |
