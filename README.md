# Boutique + Cake Shop – WhatsApp ordering site (dynamic version)

Each shop has its **own** Google Sheet + **own** Apps Script + **own** Web App URL + **own** admin page.
The shop owner adds products and photos in the admin page; the website shows them automatically.

## Do these steps TWICE (once for the boutique, once for the cake shop)

### 1. Google Sheet + Apps Script
1. Create a new Google Sheet (name it e.g. "Boutique products").
2. **Extensions > Apps Script**. Delete sample code, paste all of `Code.gs`, Save.
3. **Project Settings (gear) > Script Properties > Add**:
   - `SHOP_TYPE` = `boutique` (for the boutique sheet) or `cakes` (for the cake sheet)
   - `ADMIN_PASSWORD` = a password of your choice (use a different one per shop)
   - `CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (from your Cloudinary dashboard)
4. Choose function **setup** > **Run** > approve permissions. Headers + 1 sample row appear.
5. **Deploy > New deployment > Web app**. Execute as **Me**, access **Anyone**. Deploy and copy the **/exec URL**.
6. After ANY change to `Code.gs`: **Deploy > Manage deployments > pencil > New version > Deploy**.

## Once only: Cloudinary
**Settings > Upload > Upload presets > Add**: Signing mode **Unsigned**, Folder e.g. `shops`, formats `jpg,png,webp`. Note the preset name.

## Configure + host
1. Edit `config.js`: paste Cloudinary cloud name + preset, and for each shop its `api` (Web App URL) and `whatsapp` number (digits only with country code).
2. Upload all files to GitHub Pages (or drag the folder onto netlify.com/drop).
3. Customer site: `your-site/`
   Boutique admin: `your-site/admin.html?b=boutique`
   Cakes admin: `your-site/admin.html?b=cakes`

## Cake sheet format
- **Weights & Prices**: `0.5 kg=600, 1 kg=1100, 2 kg=2100`
- Flavors / Shapes / Types / Designs: comma separated (leave Shapes/Types/Designs empty if not needed)
- **Hours of notice needed**: minimum time before the customer's required date (e.g. 24, 72)
- **Price is only an estimate**: Yes for custom/designer cakes (shown as "estimate, confirmed on WhatsApp")
- **Available**: 1 = yes, 0 = sold out

## Notes
- You can also edit the Sheet directly; changes show on the site within about a minute. Keep Status as Active/Hidden.
- 5 wrong passwords lock login for 10 minutes. Sessions last 6 hours.
- Deleting a product removes its Cloudinary images first; if that fails the product is kept and an error shows.
- WhatsApp links carry text only, so product photo links are included in the message.
- `data.js` is no longer used.
