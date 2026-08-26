/**
 * A frozen snapshot of the seeded catalog, served when `NEXT_PUBLIC_DEMO_CATALOG`
 * is on.
 *
 * The storefront is deployed before the API is hosted anywhere, so every read
 * would otherwise fail and the site would render empty. This lets the pages be
 * looked at. It is a display stand-in, nothing more:
 *
 * - Reads only. Cart, checkout, sign-in and every dashboard still go to the
 *   real API and still fail without one — this never fakes a purchase, an
 *   account, or an order.
 * - Captured from a real `/api/v1` response, so the shapes match the generated
 *   schema rather than being invented alongside it.
 * - Off unless the flag is explicitly "true", so a real deployment cannot serve
 *   it by accident.
 *
 * Delete this file and the branches in `endpoints.ts` once the API is hosted.
 */
export const DEMO_CATALOG = {
  "categories": [
    {
      "id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
      "name": "Tibbiy kiyim",
      "slug": "medical-wear",
      "description": "Klinika, dorixona va laboratoriya xodimlari uchun kostyum va xalatlar.",
      "icon": "Shirt",
      "parent_id": null,
      "position": 0,
      "children": [
        {
          "id": "01a03fb2-fe77-73be-b896-f452d5747acc",
          "name": "Kostyumlar",
          "slug": "scrubs",
          "description": null,
          "icon": null,
          "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
          "position": 0,
          "children": [],
          "product_count": 6
        },
        {
          "id": "01a03fb2-fe77-765f-9644-41d0cf200dcd",
          "name": "Xalatlar",
          "slug": "lab-coats",
          "description": null,
          "icon": null,
          "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
          "position": 1,
          "children": [],
          "product_count": 3
        }
      ],
      "product_count": 9
    },
    {
      "id": "01a03fb2-fe78-7f54-aa2a-e164d0a6ec02",
      "name": "Bosh kiyimlar",
      "slug": "headwear",
      "description": "Jarrohlik shapkalari, bandanalar va klassik kolpaklar.",
      "icon": "HardHat",
      "parent_id": null,
      "position": 1,
      "children": [
        {
          "id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e",
          "name": "Shapka va bandanalar",
          "slug": "surgical-caps",
          "description": null,
          "icon": null,
          "parent_id": "01a03fb2-fe78-7f54-aa2a-e164d0a6ec02",
          "position": 0,
          "children": [],
          "product_count": 4
        },
        {
          "id": "01a03fb2-fe79-740b-9d40-ef6e84db219d",
          "name": "Kolpaklar",
          "slug": "clinic-caps",
          "description": null,
          "icon": null,
          "parent_id": "01a03fb2-fe78-7f54-aa2a-e164d0a6ec02",
          "position": 1,
          "children": [],
          "product_count": 2
        }
      ],
      "product_count": 6
    },
    {
      "id": "01a03fb2-fe79-742a-910b-f6a9a3c59d2e",
      "name": "Tibbiy poyabzal",
      "slug": "medical-footwear",
      "description": "Uzoq smena uchun yengil va yuviladigan sabo va shippaklar.",
      "icon": "Footprints",
      "parent_id": null,
      "position": 2,
      "children": [
        {
          "id": "01a03fb2-fe79-7961-b5ad-75522d8a495a",
          "name": "Sabolar",
          "slug": "clogs",
          "description": null,
          "icon": null,
          "parent_id": "01a03fb2-fe79-742a-910b-f6a9a3c59d2e",
          "position": 0,
          "children": [],
          "product_count": 3
        },
        {
          "id": "01a03fb2-fe7a-7984-8b1e-3344efccdb4d",
          "name": "Shippaklar",
          "slug": "slippers",
          "description": null,
          "icon": null,
          "parent_id": "01a03fb2-fe79-742a-910b-f6a9a3c59d2e",
          "position": 1,
          "children": [],
          "product_count": 1
        }
      ],
      "product_count": 4
    },
    {
      "id": "01a03fb2-fe7a-73fa-99f6-5aa7e0c4814e",
      "name": "Himoya vositalari",
      "slug": "ppe",
      "description": "Niqob va qo‘lqoplar — klinika, ish joyi va uy uchun.",
      "icon": "ShieldCheck",
      "parent_id": null,
      "position": 3,
      "children": [
        {
          "id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
          "name": "Niqob va respiratorlar",
          "slug": "masks-respirators",
          "description": null,
          "icon": null,
          "parent_id": "01a03fb2-fe7a-73fa-99f6-5aa7e0c4814e",
          "position": 0,
          "children": [],
          "product_count": 5
        },
        {
          "id": "01a03fb2-fe7b-70c2-b34c-dbd7d521e167",
          "name": "Qo‘lqoplar",
          "slug": "gloves",
          "description": null,
          "icon": null,
          "parent_id": "01a03fb2-fe7a-73fa-99f6-5aa7e0c4814e",
          "position": 1,
          "children": [],
          "product_count": 2
        }
      ],
      "product_count": 7
    },
    {
      "id": "01a03fb2-fe7c-7756-9ca5-cde0cb192a18",
      "name": "Birinchi yordam",
      "slug": "first-aid",
      "description": "Uy, avtomobil va ish joyi uchun aptechkalar.",
      "icon": "Bandage",
      "parent_id": null,
      "position": 4,
      "children": [
        {
          "id": "01a03fb2-fe7c-7ce8-ac5e-649d9514f683",
          "name": "Aptechkalar",
          "slug": "first-aid-kits",
          "description": null,
          "icon": null,
          "parent_id": "01a03fb2-fe7c-7756-9ca5-cde0cb192a18",
          "position": 0,
          "children": [],
          "product_count": 1
        }
      ],
      "product_count": 1
    }
  ],
  "products": {
    "items": [
      {
        "id": "01a03fb2-ff76-7d88-97a1-322b95328967",
        "name": "Tibbiy kolpak, erkaklar uchun",
        "slug": "tibbiy-kolpak-erkaklar-uchun",
        "brand": "Oq Xalat",
        "image_url": "/products/cap-white-men.jpg",
        "price_amount_minor": 45000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 96,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.9,
        "rating_count": 10,
        "seller": {
          "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
          "business_name": "Oq Xalat",
          "slug": "oq-xalat",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe79-740b-9d40-ef6e84db219d"
      },
      {
        "id": "01a03fb2-ff76-7d87-8df9-56f81349a3e0",
        "name": "Uch qatlamli tibbiy niqob, ko‘k (50 dona)",
        "slug": "uch-qatlamli-tibbiy-niqob-kok-50-dona",
        "brand": "Shifo Savdo",
        "image_url": "/products/mask-blue-50.jpg",
        "price_amount_minor": 45000,
        "compare_at_amount_minor": 64000,
        "discount_percent": 30,
        "currency": "UZS",
        "unit_label": "to‘plam",
        "in_stock": true,
        "stock": 480,
        "certifications": [
          "CE"
        ],
        "prescription_required": false,
        "rating_average": 4.71,
        "rating_count": 7,
        "seller": {
          "id": "01a03fb2-ff0c-7389-932f-149de18701da",
          "business_name": "Shifo Savdo",
          "slug": "shifo-savdo",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12"
      },
      {
        "id": "01a03fb2-ff76-7cd8-a1e0-17868f943792",
        "name": "Erkaklar tibbiy kostyumi, naqshli",
        "slug": "erkaklar-tibbiy-kostyumi-naqshli",
        "brand": "MedTekstil",
        "image_url": "/products/scrubs-men-print.jpg",
        "price_amount_minor": 275000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 33,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 3.55,
        "rating_count": 11,
        "seller": {
          "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
          "business_name": "MedTekstil",
          "slug": "medtekstil",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc"
      },
      {
        "id": "01a03fb2-ff76-7c6e-8af7-612040c9577d",
        "name": "Naqshli tibbiy niqob, pushti (10 dona)",
        "slug": "naqshli-tibbiy-niqob-pushti-10-dona",
        "brand": "Shifo Savdo",
        "image_url": "/products/mask-print-pink.jpg",
        "price_amount_minor": 22000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "to‘plam",
        "in_stock": true,
        "stock": 245,
        "certifications": [
          "CE"
        ],
        "prescription_required": false,
        "rating_average": 3.78,
        "rating_count": 9,
        "seller": {
          "id": "01a03fb2-ff0c-7389-932f-149de18701da",
          "business_name": "Shifo Savdo",
          "slug": "shifo-savdo",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12"
      },
      {
        "id": "01a03fb2-ff76-7bb1-9d79-e88cc8b71c63",
        "name": "Jarrohlik shapkasi, pushti naqsh",
        "slug": "jarrohlik-shapkasi-pushti-naqsh",
        "brand": "Oq Xalat",
        "image_url": "/products/cap-print-pink.jpg",
        "price_amount_minor": 55000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 74,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.64,
        "rating_count": 11,
        "seller": {
          "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
          "business_name": "Oq Xalat",
          "slug": "oq-xalat",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e"
      },
      {
        "id": "01a03fb2-ff76-79df-a6fd-0b934078cdf0",
        "name": "Bandana-shapka, oq",
        "slug": "bandana-shapka-oq",
        "brand": "Oq Xalat",
        "image_url": "/products/bandana-white.jpg",
        "price_amount_minor": 60000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 58,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.67,
        "rating_count": 3,
        "seller": {
          "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
          "business_name": "Oq Xalat",
          "slug": "oq-xalat",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e"
      },
      {
        "id": "01a03fb2-ff76-791c-8a01-f2682800457d",
        "name": "Tibbiy sabo, qora",
        "slug": "tibbiy-sabo-qora",
        "brand": "Oq Xalat",
        "image_url": "/products/clogs-black.jpg",
        "price_amount_minor": 195000,
        "compare_at_amount_minor": 270000,
        "discount_percent": 28,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 57,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.17,
        "rating_count": 6,
        "seller": {
          "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
          "business_name": "Oq Xalat",
          "slug": "oq-xalat",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe79-7961-b5ad-75522d8a495a"
      },
      {
        "id": "01a03fb2-ff76-78fa-809c-da66c170f178",
        "name": "Erkaklar jarrohlik kostyumi, yashil",
        "slug": "erkaklar-jarrohlik-kostyumi-yashil",
        "brand": "MedTekstil",
        "image_url": "/products/scrubs-men-green.jpg",
        "price_amount_minor": 320000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 29,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.36,
        "rating_count": 11,
        "seller": {
          "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
          "business_name": "MedTekstil",
          "slug": "medtekstil",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc"
      },
      {
        "id": "01a03fb2-ff76-78d2-958c-d0ac567fa453",
        "name": "Bandana-shapka, kulrang",
        "slug": "bandana-shapka-kulrang",
        "brand": "Oq Xalat",
        "image_url": "/products/bandana-grey.jpg",
        "price_amount_minor": 60000,
        "compare_at_amount_minor": 84000,
        "discount_percent": 29,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 52,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.46,
        "rating_count": 13,
        "seller": {
          "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
          "business_name": "Oq Xalat",
          "slug": "oq-xalat",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e"
      },
      {
        "id": "01a03fb2-ff76-76f3-a2c7-328ab3653f32",
        "name": "Jarrohlik shapkasi, yashil naqsh",
        "slug": "jarrohlik-shapkasi-yashil-naqsh",
        "brand": "Oq Xalat",
        "image_url": "/products/cap-print-green.jpg",
        "price_amount_minor": 55000,
        "compare_at_amount_minor": 76000,
        "discount_percent": 28,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 68,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 3.75,
        "rating_count": 4,
        "seller": {
          "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
          "business_name": "Oq Xalat",
          "slug": "oq-xalat",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e"
      },
      {
        "id": "01a03fb2-ff76-7533-9096-c8ad1c98f5ac",
        "name": "Tibbiy sabo, krem rang",
        "slug": "tibbiy-sabo-krem-rang",
        "brand": "Oq Xalat",
        "image_url": "/products/clogs-cream.jpg",
        "price_amount_minor": 210000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 44,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.86,
        "rating_count": 14,
        "seller": {
          "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
          "business_name": "Oq Xalat",
          "slug": "oq-xalat",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe79-7961-b5ad-75522d8a495a"
      },
      {
        "id": "01a03fb2-ff76-7532-a057-c84e6ffd7934",
        "name": "Ayollar tibbiy kostyumi, oq-ko‘k",
        "slug": "ayollar-tibbiy-kostyumi-oq-kok",
        "brand": "MedTekstil",
        "image_url": "/products/scrubs-women-navy.jpg",
        "price_amount_minor": 285000,
        "compare_at_amount_minor": 359000,
        "discount_percent": 21,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 64,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 3.62,
        "rating_count": 8,
        "seller": {
          "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
          "business_name": "MedTekstil",
          "slug": "medtekstil",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc"
      },
      {
        "id": "01a03fb2-ff76-751c-a915-c3fbf9c13549",
        "name": "Ayollar tibbiy kostyumi, gulli naqsh",
        "slug": "ayollar-tibbiy-kostyumi-gulli-naqsh",
        "brand": "MedTekstil",
        "image_url": "/products/scrubs-women-print.jpg",
        "price_amount_minor": 265000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 48,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.29,
        "rating_count": 14,
        "seller": {
          "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
          "business_name": "MedTekstil",
          "slug": "medtekstil",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc"
      },
      {
        "id": "01a03fb2-ff76-7509-8618-e1634712626f",
        "name": "Erkaklar tibbiy xalati, uzun",
        "slug": "erkaklar-tibbiy-xalati-uzun",
        "brand": "MedTekstil",
        "image_url": "/products/labcoat-men-long.jpg",
        "price_amount_minor": 340000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 26,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.5,
        "rating_count": 8,
        "seller": {
          "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
          "business_name": "MedTekstil",
          "slug": "medtekstil",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe77-765f-9644-41d0cf200dcd"
      },
      {
        "id": "01a03fb2-ff76-747d-9136-581be66b12fb",
        "name": "Erkaklar tibbiy xalati, klassik",
        "slug": "erkaklar-tibbiy-xalati-klassik",
        "brand": "MedTekstil",
        "image_url": "/products/labcoat-men-classic.jpg",
        "price_amount_minor": 365000,
        "compare_at_amount_minor": 512000,
        "discount_percent": 29,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 18,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 3.38,
        "rating_count": 8,
        "seller": {
          "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
          "business_name": "MedTekstil",
          "slug": "medtekstil",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe77-765f-9644-41d0cf200dcd"
      },
      {
        "id": "01a03fb2-ff76-7426-b145-73e2e88bb79e",
        "name": "Bir martalik tibbiy niqob, ko‘k (10 dona)",
        "slug": "bir-martalik-tibbiy-niqob-kok-10-dona",
        "brand": "Shifo Savdo",
        "image_url": "/products/mask-blue-10.jpg",
        "price_amount_minor": 12000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "to‘plam",
        "in_stock": true,
        "stock": 920,
        "certifications": [
          "CE"
        ],
        "prescription_required": false,
        "rating_average": 3.67,
        "rating_count": 3,
        "seller": {
          "id": "01a03fb2-ff0c-7389-932f-149de18701da",
          "business_name": "Shifo Savdo",
          "slug": "shifo-savdo",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12"
      },
      {
        "id": "01a03fb2-ff76-741c-b24d-8bfda6c14a8c",
        "name": "Nitril qo‘lqoplar, kukunsiz (50 juft)",
        "slug": "nitril-qolqoplar-kukunsiz-50-juft",
        "brand": "Shifo Savdo",
        "image_url": "/products/gloves-nitrile-50.jpg",
        "price_amount_minor": 185000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 215,
        "certifications": [
          "CE",
          "FDA"
        ],
        "prescription_required": false,
        "rating_average": 4.17,
        "rating_count": 6,
        "seller": {
          "id": "01a03fb2-ff0c-7389-932f-149de18701da",
          "business_name": "Shifo Savdo",
          "slug": "shifo-savdo",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe7b-70c2-b34c-dbd7d521e167"
      },
      {
        "id": "01a03fb2-ff76-7406-9f7e-c646249c65e4",
        "name": "Uch qatlamli tibbiy niqob, qora (50 dona)",
        "slug": "uch-qatlamli-tibbiy-niqob-qora-50-dona",
        "brand": "Shifo Savdo",
        "image_url": "/products/mask-black-50.jpg",
        "price_amount_minor": 52000,
        "compare_at_amount_minor": 65000,
        "discount_percent": 20,
        "currency": "UZS",
        "unit_label": "to‘plam",
        "in_stock": true,
        "stock": 310,
        "certifications": [
          "CE"
        ],
        "prescription_required": false,
        "rating_average": 4.43,
        "rating_count": 14,
        "seller": {
          "id": "01a03fb2-ff0c-7389-932f-149de18701da",
          "business_name": "Shifo Savdo",
          "slug": "shifo-savdo",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12"
      },
      {
        "id": "01a03fb2-ff76-7377-98d9-dd36e474768a",
        "name": "Ayollar tibbiy xalati, uzun",
        "slug": "ayollar-tibbiy-xalati-uzun",
        "brand": "MedTekstil",
        "image_url": "/products/labcoat-women-long.jpg",
        "price_amount_minor": 355000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 31,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 3.33,
        "rating_count": 6,
        "seller": {
          "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
          "business_name": "MedTekstil",
          "slug": "medtekstil",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe77-765f-9644-41d0cf200dcd"
      },
      {
        "id": "01a03fb2-ff76-7374-aa53-e43a444880c2",
        "name": "Tibbiy sabo, to‘q ko‘k",
        "slug": "tibbiy-sabo-toq-kok",
        "brand": "Oq Xalat",
        "image_url": "/products/clogs-navy.jpg",
        "price_amount_minor": 195000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 61,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 3.79,
        "rating_count": 14,
        "seller": {
          "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
          "business_name": "Oq Xalat",
          "slug": "oq-xalat",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe79-7961-b5ad-75522d8a495a"
      },
      {
        "id": "01a03fb2-ff76-72b7-85ee-386fa9678f22",
        "name": "Erkaklar tibbiy kostyumi, kulrang",
        "slug": "erkaklar-tibbiy-kostyumi-kulrang",
        "brand": "MedTekstil",
        "image_url": "/products/scrubs-men-grey.jpg",
        "price_amount_minor": 310000,
        "compare_at_amount_minor": 352000,
        "discount_percent": 12,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 42,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.0,
        "rating_count": 6,
        "seller": {
          "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
          "business_name": "MedTekstil",
          "slug": "medtekstil",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc"
      },
      {
        "id": "01a03fb2-ff76-7295-8d5d-3ee530d7a3ef",
        "name": "Ayollar tibbiy kostyumi, fuksiya",
        "slug": "ayollar-tibbiy-kostyumi-fuksiya",
        "brand": "MedTekstil",
        "image_url": "/products/scrubs-women-fuchsia.jpg",
        "price_amount_minor": 295000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 37,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.6,
        "rating_count": 10,
        "seller": {
          "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
          "business_name": "MedTekstil",
          "slug": "medtekstil",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc"
      },
      {
        "id": "01a03fb2-ff76-727f-8eeb-de3dfad85e5c",
        "name": "Tibbiy kolpak, oq",
        "slug": "tibbiy-kolpak-oq",
        "brand": "Oq Xalat",
        "image_url": "/products/cap-white-tall.jpg",
        "price_amount_minor": 45000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 120,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.67,
        "rating_count": 6,
        "seller": {
          "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
          "business_name": "Oq Xalat",
          "slug": "oq-xalat",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe79-740b-9d40-ef6e84db219d"
      },
      {
        "id": "01a03fb2-ff76-71f3-9d80-f84d667ec740",
        "name": "Naqshli tibbiy niqob, oq (10 dona)",
        "slug": "naqshli-tibbiy-niqob-oq-10-dona",
        "brand": "Shifo Savdo",
        "image_url": "/products/mask-print-white.jpg",
        "price_amount_minor": 22000,
        "compare_at_amount_minor": 30000,
        "discount_percent": 27,
        "currency": "UZS",
        "unit_label": "to‘plam",
        "in_stock": true,
        "stock": 260,
        "certifications": [
          "CE"
        ],
        "prescription_required": false,
        "rating_average": 3.86,
        "rating_count": 14,
        "seller": {
          "id": "01a03fb2-ff0c-7389-932f-149de18701da",
          "business_name": "Shifo Savdo",
          "slug": "shifo-savdo",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12"
      },
      {
        "id": "01a03fb2-ff76-70fb-94b9-93636af3e73e",
        "name": "Nitril qo‘lqoplar, binafsha rang (100 dona)",
        "slug": "nitril-qolqoplar-binafsha-rang-100-dona",
        "brand": "Shifo Savdo",
        "image_url": "/products/gloves-nitrile-100.jpg",
        "price_amount_minor": 165000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "to‘plam",
        "in_stock": true,
        "stock": 190,
        "certifications": [
          "CE"
        ],
        "prescription_required": false,
        "rating_average": 3.38,
        "rating_count": 8,
        "seller": {
          "id": "01a03fb2-ff0c-7389-932f-149de18701da",
          "business_name": "Shifo Savdo",
          "slug": "shifo-savdo",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe7b-70c2-b34c-dbd7d521e167"
      },
      {
        "id": "01a03fb2-ff76-70f5-a43e-9699fef900af",
        "name": "Tibbiy shippak, naqshli",
        "slug": "tibbiy-shippak-naqshli",
        "brand": "Oq Xalat",
        "image_url": "/products/slippers-print.jpg",
        "price_amount_minor": 165000,
        "compare_at_amount_minor": null,
        "discount_percent": null,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 39,
        "certifications": [],
        "prescription_required": false,
        "rating_average": 4.0,
        "rating_count": 5,
        "seller": {
          "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
          "business_name": "Oq Xalat",
          "slug": "oq-xalat",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe7a-7984-8b1e-3344efccdb4d"
      },
      {
        "id": "01a03fb2-ff76-7062-905e-ef58498d4c50",
        "name": "Universal aptechka, 23x13x8 sm",
        "slug": "universal-aptechka-23x13x8-sm",
        "brand": "Salomat Market",
        "image_url": "/products/first-aid-kit-universal.jpg",
        "price_amount_minor": 95000,
        "compare_at_amount_minor": 108000,
        "discount_percent": 12,
        "currency": "UZS",
        "unit_label": "dona",
        "in_stock": true,
        "stock": 140,
        "certifications": [
          "CE"
        ],
        "prescription_required": false,
        "rating_average": 4.36,
        "rating_count": 11,
        "seller": {
          "id": "01a03fb2-ff3c-79f9-8081-5fe2a3a481bd",
          "business_name": "Salomat Market",
          "slug": "salomat-market",
          "country": "UZ",
          "status": "verified",
          "verified": true
        },
        "category_id": "01a03fb2-fe7c-7ce8-ac5e-649d9514f683"
      }
    ],
    "next_cursor": null
  },
  "details": {
    "tibbiy-kolpak-erkaklar-uchun": {
      "id": "01a03fb2-ff76-7d88-97a1-322b95328967",
      "name": "Tibbiy kolpak, erkaklar uchun",
      "slug": "tibbiy-kolpak-erkaklar-uchun",
      "brand": "Oq Xalat",
      "image_url": "/products/cap-white-men.jpg",
      "price_amount_minor": 45000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 96,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.9,
      "rating_count": 10,
      "seller": {
        "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
        "business_name": "Oq Xalat",
        "slug": "oq-xalat",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe79-740b-9d40-ef6e84db219d",
      "description": "Tibbiy kolpak, erkaklar uchun — Oq Xalat tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "OQ -30273",
      "buyers_last_7d": 0,
      "images": [
        "/products/cap-white-men.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Yo‘q",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "Turkiya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe79-740b-9d40-ef6e84db219d",
        "name": "Kolpaklar",
        "slug": "clinic-caps",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe78-7f54-aa2a-e164d0a6ec02",
        "position": 1
      },
      "created_at": "2026-08-26T20:11:30.550681Z"
    },
    "uch-qatlamli-tibbiy-niqob-kok-50-dona": {
      "id": "01a03fb2-ff76-7d87-8df9-56f81349a3e0",
      "name": "Uch qatlamli tibbiy niqob, ko‘k (50 dona)",
      "slug": "uch-qatlamli-tibbiy-niqob-kok-50-dona",
      "brand": "Shifo Savdo",
      "image_url": "/products/mask-blue-50.jpg",
      "price_amount_minor": 45000,
      "compare_at_amount_minor": 64000,
      "discount_percent": 30,
      "currency": "UZS",
      "unit_label": "to‘plam",
      "in_stock": true,
      "stock": 480,
      "certifications": [
        "CE"
      ],
      "prescription_required": false,
      "rating_average": 4.71,
      "rating_count": 7,
      "seller": {
        "id": "01a03fb2-ff0c-7389-932f-149de18701da",
        "business_name": "Shifo Savdo",
        "slug": "shifo-savdo",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
      "description": "Uch qatlamli tibbiy niqob, ko‘k (50 dona) — Shifo Savdo tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "SHI-15587",
      "buyers_last_7d": 0,
      "images": [
        "/products/mask-blue-50.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "24 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
        "name": "Niqob va respiratorlar",
        "slug": "masks-respirators",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe7a-73fa-99f6-5aa7e0c4814e",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550695Z"
    },
    "erkaklar-tibbiy-kostyumi-naqshli": {
      "id": "01a03fb2-ff76-7cd8-a1e0-17868f943792",
      "name": "Erkaklar tibbiy kostyumi, naqshli",
      "slug": "erkaklar-tibbiy-kostyumi-naqshli",
      "brand": "MedTekstil",
      "image_url": "/products/scrubs-men-print.jpg",
      "price_amount_minor": 275000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 33,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 3.55,
      "rating_count": 11,
      "seller": {
        "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
        "business_name": "MedTekstil",
        "slug": "medtekstil",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc",
      "description": "Erkaklar tibbiy kostyumi, naqshli — MedTekstil tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "MED-94915",
      "buyers_last_7d": 0,
      "images": [
        "/products/scrubs-men-print.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "36 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe77-73be-b896-f452d5747acc",
        "name": "Kostyumlar",
        "slug": "scrubs",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550673Z"
    },
    "naqshli-tibbiy-niqob-pushti-10-dona": {
      "id": "01a03fb2-ff76-7c6e-8af7-612040c9577d",
      "name": "Naqshli tibbiy niqob, pushti (10 dona)",
      "slug": "naqshli-tibbiy-niqob-pushti-10-dona",
      "brand": "Shifo Savdo",
      "image_url": "/products/mask-print-pink.jpg",
      "price_amount_minor": 22000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "to‘plam",
      "in_stock": true,
      "stock": 245,
      "certifications": [
        "CE"
      ],
      "prescription_required": false,
      "rating_average": 3.78,
      "rating_count": 9,
      "seller": {
        "id": "01a03fb2-ff0c-7389-932f-149de18701da",
        "business_name": "Shifo Savdo",
        "slug": "shifo-savdo",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
      "description": "Naqshli tibbiy niqob, pushti (10 dona) — Shifo Savdo tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "SHI-76640",
      "buyers_last_7d": 0,
      "images": [
        "/products/mask-print-pink.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Yo‘q",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
        "name": "Niqob va respiratorlar",
        "slug": "masks-respirators",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe7a-73fa-99f6-5aa7e0c4814e",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550701Z"
    },
    "jarrohlik-shapkasi-pushti-naqsh": {
      "id": "01a03fb2-ff76-7bb1-9d79-e88cc8b71c63",
      "name": "Jarrohlik shapkasi, pushti naqsh",
      "slug": "jarrohlik-shapkasi-pushti-naqsh",
      "brand": "Oq Xalat",
      "image_url": "/products/cap-print-pink.jpg",
      "price_amount_minor": 55000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 74,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.64,
      "rating_count": 11,
      "seller": {
        "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
        "business_name": "Oq Xalat",
        "slug": "oq-xalat",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e",
      "description": "Jarrohlik shapkasi, pushti naqsh — Oq Xalat tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "OQ -45509",
      "buyers_last_7d": 0,
      "images": [
        "/products/cap-print-pink.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Yo‘q",
        "Yaroqlilik muddati": "24 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e",
        "name": "Shapka va bandanalar",
        "slug": "surgical-caps",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe78-7f54-aa2a-e164d0a6ec02",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550683Z"
    },
    "bandana-shapka-oq": {
      "id": "01a03fb2-ff76-79df-a6fd-0b934078cdf0",
      "name": "Bandana-shapka, oq",
      "slug": "bandana-shapka-oq",
      "brand": "Oq Xalat",
      "image_url": "/products/bandana-white.jpg",
      "price_amount_minor": 60000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 58,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.67,
      "rating_count": 3,
      "seller": {
        "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
        "business_name": "Oq Xalat",
        "slug": "oq-xalat",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e",
      "description": "Bandana-shapka, oq — Oq Xalat tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "OQ -76476",
      "buyers_last_7d": 0,
      "images": [
        "/products/bandana-white.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e",
        "name": "Shapka va bandanalar",
        "slug": "surgical-caps",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe78-7f54-aa2a-e164d0a6ec02",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550687Z"
    },
    "tibbiy-sabo-qora": {
      "id": "01a03fb2-ff76-791c-8a01-f2682800457d",
      "name": "Tibbiy sabo, qora",
      "slug": "tibbiy-sabo-qora",
      "brand": "Oq Xalat",
      "image_url": "/products/clogs-black.jpg",
      "price_amount_minor": 195000,
      "compare_at_amount_minor": 270000,
      "discount_percent": 28,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 57,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.17,
      "rating_count": 6,
      "seller": {
        "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
        "business_name": "Oq Xalat",
        "slug": "oq-xalat",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe79-7961-b5ad-75522d8a495a",
      "description": "Tibbiy sabo, qora — Oq Xalat tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "OQ -66928",
      "buyers_last_7d": 0,
      "images": [
        "/products/clogs-black.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "36 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "O‘zbekiston"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe79-7961-b5ad-75522d8a495a",
        "name": "Sabolar",
        "slug": "clogs",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe79-742a-910b-f6a9a3c59d2e",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550692Z"
    },
    "erkaklar-jarrohlik-kostyumi-yashil": {
      "id": "01a03fb2-ff76-78fa-809c-da66c170f178",
      "name": "Erkaklar jarrohlik kostyumi, yashil",
      "slug": "erkaklar-jarrohlik-kostyumi-yashil",
      "brand": "MedTekstil",
      "image_url": "/products/scrubs-men-green.jpg",
      "price_amount_minor": 320000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 29,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.36,
      "rating_count": 11,
      "seller": {
        "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
        "business_name": "MedTekstil",
        "slug": "medtekstil",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc",
      "description": "Erkaklar jarrohlik kostyumi, yashil — MedTekstil tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "MED-82323",
      "buyers_last_7d": 0,
      "images": [
        "/products/scrubs-men-green.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "36 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "Turkiya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe77-73be-b896-f452d5747acc",
        "name": "Kostyumlar",
        "slug": "scrubs",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550671Z"
    },
    "bandana-shapka-kulrang": {
      "id": "01a03fb2-ff76-78d2-958c-d0ac567fa453",
      "name": "Bandana-shapka, kulrang",
      "slug": "bandana-shapka-kulrang",
      "brand": "Oq Xalat",
      "image_url": "/products/bandana-grey.jpg",
      "price_amount_minor": 60000,
      "compare_at_amount_minor": 84000,
      "discount_percent": 29,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 52,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.46,
      "rating_count": 13,
      "seller": {
        "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
        "business_name": "Oq Xalat",
        "slug": "oq-xalat",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e",
      "description": "Bandana-shapka, kulrang — Oq Xalat tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "OQ -26127",
      "buyers_last_7d": 0,
      "images": [
        "/products/bandana-grey.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Yo‘q",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e",
        "name": "Shapka va bandanalar",
        "slug": "surgical-caps",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe78-7f54-aa2a-e164d0a6ec02",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550686Z"
    },
    "jarrohlik-shapkasi-yashil-naqsh": {
      "id": "01a03fb2-ff76-76f3-a2c7-328ab3653f32",
      "name": "Jarrohlik shapkasi, yashil naqsh",
      "slug": "jarrohlik-shapkasi-yashil-naqsh",
      "brand": "Oq Xalat",
      "image_url": "/products/cap-print-green.jpg",
      "price_amount_minor": 55000,
      "compare_at_amount_minor": 76000,
      "discount_percent": 28,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 68,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 3.75,
      "rating_count": 4,
      "seller": {
        "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
        "business_name": "Oq Xalat",
        "slug": "oq-xalat",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e",
      "description": "Jarrohlik shapkasi, yashil naqsh — Oq Xalat tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "OQ -69219",
      "buyers_last_7d": 0,
      "images": [
        "/products/cap-print-green.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe78-7936-96f9-72a9d8ba969e",
        "name": "Shapka va bandanalar",
        "slug": "surgical-caps",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe78-7f54-aa2a-e164d0a6ec02",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550684Z"
    },
    "tibbiy-sabo-krem-rang": {
      "id": "01a03fb2-ff76-7533-9096-c8ad1c98f5ac",
      "name": "Tibbiy sabo, krem rang",
      "slug": "tibbiy-sabo-krem-rang",
      "brand": "Oq Xalat",
      "image_url": "/products/clogs-cream.jpg",
      "price_amount_minor": 210000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 44,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.86,
      "rating_count": 14,
      "seller": {
        "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
        "business_name": "Oq Xalat",
        "slug": "oq-xalat",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe79-7961-b5ad-75522d8a495a",
      "description": "Tibbiy sabo, krem rang — Oq Xalat tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "OQ -68934",
      "buyers_last_7d": 0,
      "images": [
        "/products/clogs-cream.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "Turkiya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe79-7961-b5ad-75522d8a495a",
        "name": "Sabolar",
        "slug": "clogs",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe79-742a-910b-f6a9a3c59d2e",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550689Z"
    },
    "ayollar-tibbiy-kostyumi-oq-kok": {
      "id": "01a03fb2-ff76-7532-a057-c84e6ffd7934",
      "name": "Ayollar tibbiy kostyumi, oq-ko‘k",
      "slug": "ayollar-tibbiy-kostyumi-oq-kok",
      "brand": "MedTekstil",
      "image_url": "/products/scrubs-women-navy.jpg",
      "price_amount_minor": 285000,
      "compare_at_amount_minor": 359000,
      "discount_percent": 21,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 64,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 3.62,
      "rating_count": 8,
      "seller": {
        "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
        "business_name": "MedTekstil",
        "slug": "medtekstil",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc",
      "description": "Ayollar tibbiy kostyumi, oq-ko‘k — MedTekstil tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "MED-48628",
      "buyers_last_7d": 0,
      "images": [
        "/products/scrubs-women-navy.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "24 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe77-73be-b896-f452d5747acc",
        "name": "Kostyumlar",
        "slug": "scrubs",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550661Z"
    },
    "ayollar-tibbiy-kostyumi-gulli-naqsh": {
      "id": "01a03fb2-ff76-751c-a915-c3fbf9c13549",
      "name": "Ayollar tibbiy kostyumi, gulli naqsh",
      "slug": "ayollar-tibbiy-kostyumi-gulli-naqsh",
      "brand": "MedTekstil",
      "image_url": "/products/scrubs-women-print.jpg",
      "price_amount_minor": 265000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 48,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.29,
      "rating_count": 14,
      "seller": {
        "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
        "business_name": "MedTekstil",
        "slug": "medtekstil",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc",
      "description": "Ayollar tibbiy kostyumi, gulli naqsh — MedTekstil tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "MED-44488",
      "buyers_last_7d": 0,
      "images": [
        "/products/scrubs-women-print.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Yo‘q",
        "Yaroqlilik muddati": "24 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "O‘zbekiston"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe77-73be-b896-f452d5747acc",
        "name": "Kostyumlar",
        "slug": "scrubs",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550666Z"
    },
    "erkaklar-tibbiy-xalati-uzun": {
      "id": "01a03fb2-ff76-7509-8618-e1634712626f",
      "name": "Erkaklar tibbiy xalati, uzun",
      "slug": "erkaklar-tibbiy-xalati-uzun",
      "brand": "MedTekstil",
      "image_url": "/products/labcoat-men-long.jpg",
      "price_amount_minor": 340000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 26,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.5,
      "rating_count": 8,
      "seller": {
        "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
        "business_name": "MedTekstil",
        "slug": "medtekstil",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe77-765f-9644-41d0cf200dcd",
      "description": "Erkaklar tibbiy xalati, uzun — MedTekstil tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "MED-58199",
      "buyers_last_7d": 0,
      "images": [
        "/products/labcoat-men-long.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "O‘zbekiston"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe77-765f-9644-41d0cf200dcd",
        "name": "Xalatlar",
        "slug": "lab-coats",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
        "position": 1
      },
      "created_at": "2026-08-26T20:11:30.550674Z"
    },
    "erkaklar-tibbiy-xalati-klassik": {
      "id": "01a03fb2-ff76-747d-9136-581be66b12fb",
      "name": "Erkaklar tibbiy xalati, klassik",
      "slug": "erkaklar-tibbiy-xalati-klassik",
      "brand": "MedTekstil",
      "image_url": "/products/labcoat-men-classic.jpg",
      "price_amount_minor": 365000,
      "compare_at_amount_minor": 512000,
      "discount_percent": 29,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 18,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 3.38,
      "rating_count": 8,
      "seller": {
        "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
        "business_name": "MedTekstil",
        "slug": "medtekstil",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe77-765f-9644-41d0cf200dcd",
      "description": "Erkaklar tibbiy xalati, klassik — MedTekstil tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "MED-90777",
      "buyers_last_7d": 0,
      "images": [
        "/products/labcoat-men-classic.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "36 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "Turkiya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe77-765f-9644-41d0cf200dcd",
        "name": "Xalatlar",
        "slug": "lab-coats",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
        "position": 1
      },
      "created_at": "2026-08-26T20:11:30.550676Z"
    },
    "bir-martalik-tibbiy-niqob-kok-10-dona": {
      "id": "01a03fb2-ff76-7426-b145-73e2e88bb79e",
      "name": "Bir martalik tibbiy niqob, ko‘k (10 dona)",
      "slug": "bir-martalik-tibbiy-niqob-kok-10-dona",
      "brand": "Shifo Savdo",
      "image_url": "/products/mask-blue-10.jpg",
      "price_amount_minor": 12000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "to‘plam",
      "in_stock": true,
      "stock": 920,
      "certifications": [
        "CE"
      ],
      "prescription_required": false,
      "rating_average": 3.67,
      "rating_count": 3,
      "seller": {
        "id": "01a03fb2-ff0c-7389-932f-149de18701da",
        "business_name": "Shifo Savdo",
        "slug": "shifo-savdo",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
      "description": "Bir martalik tibbiy niqob, ko‘k (10 dona) — Shifo Savdo tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "SHI-57348",
      "buyers_last_7d": 0,
      "images": [
        "/products/mask-blue-10.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Yo‘q",
        "Yaroqlilik muddati": "36 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "O‘zbekiston"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
        "name": "Niqob va respiratorlar",
        "slug": "masks-respirators",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe7a-73fa-99f6-5aa7e0c4814e",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550696Z"
    },
    "nitril-qolqoplar-kukunsiz-50-juft": {
      "id": "01a03fb2-ff76-741c-b24d-8bfda6c14a8c",
      "name": "Nitril qo‘lqoplar, kukunsiz (50 juft)",
      "slug": "nitril-qolqoplar-kukunsiz-50-juft",
      "brand": "Shifo Savdo",
      "image_url": "/products/gloves-nitrile-50.jpg",
      "price_amount_minor": 185000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 215,
      "certifications": [
        "CE",
        "FDA"
      ],
      "prescription_required": false,
      "rating_average": 4.17,
      "rating_count": 6,
      "seller": {
        "id": "01a03fb2-ff0c-7389-932f-149de18701da",
        "business_name": "Shifo Savdo",
        "slug": "shifo-savdo",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe7b-70c2-b34c-dbd7d521e167",
      "description": "Nitril qo‘lqoplar, kukunsiz (50 juft) — Shifo Savdo tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "SHI-44211",
      "buyers_last_7d": 0,
      "images": [
        "/products/gloves-nitrile-50.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Yo‘q",
        "Yaroqlilik muddati": "36 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "Turkiya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe7b-70c2-b34c-dbd7d521e167",
        "name": "Qo‘lqoplar",
        "slug": "gloves",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe7a-73fa-99f6-5aa7e0c4814e",
        "position": 1
      },
      "created_at": "2026-08-26T20:11:30.550702Z"
    },
    "uch-qatlamli-tibbiy-niqob-qora-50-dona": {
      "id": "01a03fb2-ff76-7406-9f7e-c646249c65e4",
      "name": "Uch qatlamli tibbiy niqob, qora (50 dona)",
      "slug": "uch-qatlamli-tibbiy-niqob-qora-50-dona",
      "brand": "Shifo Savdo",
      "image_url": "/products/mask-black-50.jpg",
      "price_amount_minor": 52000,
      "compare_at_amount_minor": 65000,
      "discount_percent": 20,
      "currency": "UZS",
      "unit_label": "to‘plam",
      "in_stock": true,
      "stock": 310,
      "certifications": [
        "CE"
      ],
      "prescription_required": false,
      "rating_average": 4.43,
      "rating_count": 14,
      "seller": {
        "id": "01a03fb2-ff0c-7389-932f-149de18701da",
        "business_name": "Shifo Savdo",
        "slug": "shifo-savdo",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
      "description": "Uch qatlamli tibbiy niqob, qora (50 dona) — Shifo Savdo tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "SHI-71287",
      "buyers_last_7d": 0,
      "images": [
        "/products/mask-black-50.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "36 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "O‘zbekiston"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
        "name": "Niqob va respiratorlar",
        "slug": "masks-respirators",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe7a-73fa-99f6-5aa7e0c4814e",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550698Z"
    },
    "ayollar-tibbiy-xalati-uzun": {
      "id": "01a03fb2-ff76-7377-98d9-dd36e474768a",
      "name": "Ayollar tibbiy xalati, uzun",
      "slug": "ayollar-tibbiy-xalati-uzun",
      "brand": "MedTekstil",
      "image_url": "/products/labcoat-women-long.jpg",
      "price_amount_minor": 355000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 31,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 3.33,
      "rating_count": 6,
      "seller": {
        "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
        "business_name": "MedTekstil",
        "slug": "medtekstil",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe77-765f-9644-41d0cf200dcd",
      "description": "Ayollar tibbiy xalati, uzun — MedTekstil tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "MED-40662",
      "buyers_last_7d": 0,
      "images": [
        "/products/labcoat-women-long.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "O‘zbekiston"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe77-765f-9644-41d0cf200dcd",
        "name": "Xalatlar",
        "slug": "lab-coats",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
        "position": 1
      },
      "created_at": "2026-08-26T20:11:30.550678Z"
    },
    "tibbiy-sabo-toq-kok": {
      "id": "01a03fb2-ff76-7374-aa53-e43a444880c2",
      "name": "Tibbiy sabo, to‘q ko‘k",
      "slug": "tibbiy-sabo-toq-kok",
      "brand": "Oq Xalat",
      "image_url": "/products/clogs-navy.jpg",
      "price_amount_minor": 195000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 61,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 3.79,
      "rating_count": 14,
      "seller": {
        "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
        "business_name": "Oq Xalat",
        "slug": "oq-xalat",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe79-7961-b5ad-75522d8a495a",
      "description": "Tibbiy sabo, to‘q ko‘k — Oq Xalat tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "OQ -56595",
      "buyers_last_7d": 0,
      "images": [
        "/products/clogs-navy.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "Turkiya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe79-7961-b5ad-75522d8a495a",
        "name": "Sabolar",
        "slug": "clogs",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe79-742a-910b-f6a9a3c59d2e",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550690Z"
    },
    "erkaklar-tibbiy-kostyumi-kulrang": {
      "id": "01a03fb2-ff76-72b7-85ee-386fa9678f22",
      "name": "Erkaklar tibbiy kostyumi, kulrang",
      "slug": "erkaklar-tibbiy-kostyumi-kulrang",
      "brand": "MedTekstil",
      "image_url": "/products/scrubs-men-grey.jpg",
      "price_amount_minor": 310000,
      "compare_at_amount_minor": 352000,
      "discount_percent": 12,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 42,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.0,
      "rating_count": 6,
      "seller": {
        "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
        "business_name": "MedTekstil",
        "slug": "medtekstil",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc",
      "description": "Erkaklar tibbiy kostyumi, kulrang — MedTekstil tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "MED-78730",
      "buyers_last_7d": 0,
      "images": [
        "/products/scrubs-men-grey.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "24 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "O‘zbekiston"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe77-73be-b896-f452d5747acc",
        "name": "Kostyumlar",
        "slug": "scrubs",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550669Z"
    },
    "ayollar-tibbiy-kostyumi-fuksiya": {
      "id": "01a03fb2-ff76-7295-8d5d-3ee530d7a3ef",
      "name": "Ayollar tibbiy kostyumi, fuksiya",
      "slug": "ayollar-tibbiy-kostyumi-fuksiya",
      "brand": "MedTekstil",
      "image_url": "/products/scrubs-women-fuchsia.jpg",
      "price_amount_minor": 295000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 37,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.6,
      "rating_count": 10,
      "seller": {
        "id": "01a03fb2-feb2-7347-8822-0b269c53856b",
        "business_name": "MedTekstil",
        "slug": "medtekstil",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe77-73be-b896-f452d5747acc",
      "description": "Ayollar tibbiy kostyumi, fuksiya — MedTekstil tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "MED-63554",
      "buyers_last_7d": 0,
      "images": [
        "/products/scrubs-women-fuchsia.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Yo‘q",
        "Yaroqlilik muddati": "36 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe77-73be-b896-f452d5747acc",
        "name": "Kostyumlar",
        "slug": "scrubs",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe75-73cb-a6d9-4c46d84341ed",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550668Z"
    },
    "tibbiy-kolpak-oq": {
      "id": "01a03fb2-ff76-727f-8eeb-de3dfad85e5c",
      "name": "Tibbiy kolpak, oq",
      "slug": "tibbiy-kolpak-oq",
      "brand": "Oq Xalat",
      "image_url": "/products/cap-white-tall.jpg",
      "price_amount_minor": 45000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 120,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.67,
      "rating_count": 6,
      "seller": {
        "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
        "business_name": "Oq Xalat",
        "slug": "oq-xalat",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe79-740b-9d40-ef6e84db219d",
      "description": "Tibbiy kolpak, oq — Oq Xalat tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "OQ -78335",
      "buyers_last_7d": 0,
      "images": [
        "/products/cap-white-tall.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe79-740b-9d40-ef6e84db219d",
        "name": "Kolpaklar",
        "slug": "clinic-caps",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe78-7f54-aa2a-e164d0a6ec02",
        "position": 1
      },
      "created_at": "2026-08-26T20:11:30.550679Z"
    },
    "naqshli-tibbiy-niqob-oq-10-dona": {
      "id": "01a03fb2-ff76-71f3-9d80-f84d667ec740",
      "name": "Naqshli tibbiy niqob, oq (10 dona)",
      "slug": "naqshli-tibbiy-niqob-oq-10-dona",
      "brand": "Shifo Savdo",
      "image_url": "/products/mask-print-white.jpg",
      "price_amount_minor": 22000,
      "compare_at_amount_minor": 30000,
      "discount_percent": 27,
      "currency": "UZS",
      "unit_label": "to‘plam",
      "in_stock": true,
      "stock": 260,
      "certifications": [
        "CE"
      ],
      "prescription_required": false,
      "rating_average": 3.86,
      "rating_count": 14,
      "seller": {
        "id": "01a03fb2-ff0c-7389-932f-149de18701da",
        "business_name": "Shifo Savdo",
        "slug": "shifo-savdo",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
      "description": "Naqshli tibbiy niqob, oq (10 dona) — Shifo Savdo tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "SHI-68488",
      "buyers_last_7d": 0,
      "images": [
        "/products/mask-print-white.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Yo‘q",
        "Yaroqlilik muddati": "36 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe7b-7557-80a1-61a7b384bc12",
        "name": "Niqob va respiratorlar",
        "slug": "masks-respirators",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe7a-73fa-99f6-5aa7e0c4814e",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550699Z"
    },
    "nitril-qolqoplar-binafsha-rang-100-dona": {
      "id": "01a03fb2-ff76-70fb-94b9-93636af3e73e",
      "name": "Nitril qo‘lqoplar, binafsha rang (100 dona)",
      "slug": "nitril-qolqoplar-binafsha-rang-100-dona",
      "brand": "Shifo Savdo",
      "image_url": "/products/gloves-nitrile-100.jpg",
      "price_amount_minor": 165000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "to‘plam",
      "in_stock": true,
      "stock": 190,
      "certifications": [
        "CE"
      ],
      "prescription_required": false,
      "rating_average": 3.38,
      "rating_count": 8,
      "seller": {
        "id": "01a03fb2-ff0c-7389-932f-149de18701da",
        "business_name": "Shifo Savdo",
        "slug": "shifo-savdo",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe7b-70c2-b34c-dbd7d521e167",
      "description": "Nitril qo‘lqoplar, binafsha rang (100 dona) — Shifo Savdo tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "SHI-74821",
      "buyers_last_7d": 0,
      "images": [
        "/products/gloves-nitrile-100.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril emas",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "24 oy",
        "Saqlash": "Salqin, quruq joyda",
        "Ishlab chiqarilgan davlat": "O‘zbekiston"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe7b-70c2-b34c-dbd7d521e167",
        "name": "Qo‘lqoplar",
        "slug": "gloves",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe7a-73fa-99f6-5aa7e0c4814e",
        "position": 1
      },
      "created_at": "2026-08-26T20:11:30.550704Z"
    },
    "tibbiy-shippak-naqshli": {
      "id": "01a03fb2-ff76-70f5-a43e-9699fef900af",
      "name": "Tibbiy shippak, naqshli",
      "slug": "tibbiy-shippak-naqshli",
      "brand": "Oq Xalat",
      "image_url": "/products/slippers-print.jpg",
      "price_amount_minor": 165000,
      "compare_at_amount_minor": null,
      "discount_percent": null,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 39,
      "certifications": [],
      "prescription_required": false,
      "rating_average": 4.0,
      "rating_count": 5,
      "seller": {
        "id": "01a03fb2-fee0-7bad-9b14-1fd9d3794cfb",
        "business_name": "Oq Xalat",
        "slug": "oq-xalat",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe7a-7984-8b1e-3344efccdb4d",
      "description": "Tibbiy shippak, naqshli — Oq Xalat tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "OQ -54364",
      "buyers_last_7d": 0,
      "images": [
        "/products/slippers-print.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Yo‘q",
        "Yaroqlilik muddati": "60 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "Turkiya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe7a-7984-8b1e-3344efccdb4d",
        "name": "Shippaklar",
        "slug": "slippers",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe79-742a-910b-f6a9a3c59d2e",
        "position": 1
      },
      "created_at": "2026-08-26T20:11:30.550693Z"
    },
    "universal-aptechka-23x13x8-sm": {
      "id": "01a03fb2-ff76-7062-905e-ef58498d4c50",
      "name": "Universal aptechka, 23x13x8 sm",
      "slug": "universal-aptechka-23x13x8-sm",
      "brand": "Salomat Market",
      "image_url": "/products/first-aid-kit-universal.jpg",
      "price_amount_minor": 95000,
      "compare_at_amount_minor": 108000,
      "discount_percent": 12,
      "currency": "UZS",
      "unit_label": "dona",
      "in_stock": true,
      "stock": 140,
      "certifications": [
        "CE"
      ],
      "prescription_required": false,
      "rating_average": 4.36,
      "rating_count": 11,
      "seller": {
        "id": "01a03fb2-ff3c-79f9-8081-5fe2a3a481bd",
        "business_name": "Salomat Market",
        "slug": "salomat-market",
        "country": "UZ",
        "status": "verified",
        "verified": true
      },
      "category_id": "01a03fb2-fe7c-7ce8-ac5e-649d9514f683",
      "description": "Universal aptechka, 23x13x8 sm — Salomat Market tomonidan yetkazib beriladi. UZ dan jo‘natiladi; har bir qutida partiya raqami va yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda ko‘rsatmaga muvofiq foydalanish uchun mos.",
      "sku": "SAL-84204",
      "buyers_last_7d": 0,
      "images": [
        "/products/first-aid-kit-universal.jpg"
      ],
      "specs": {
        "Sterilligi": "Steril",
        "Bir martalik": "Ha",
        "Yaroqlilik muddati": "24 oy",
        "Saqlash": "25°C dan past haroratda",
        "Ishlab chiqarilgan davlat": "Germaniya"
      },
      "status": "active",
      "category": {
        "id": "01a03fb2-fe7c-7ce8-ac5e-649d9514f683",
        "name": "Aptechkalar",
        "slug": "first-aid-kits",
        "description": null,
        "icon": null,
        "parent_id": "01a03fb2-fe7c-7756-9ca5-cde0cb192a18",
        "position": 0
      },
      "created_at": "2026-08-26T20:11:30.550706Z"
    }
  },
  "brands": [
    "MedTekstil",
    "Oq Xalat",
    "Salomat Market",
    "Shifo Savdo"
  ]
};
