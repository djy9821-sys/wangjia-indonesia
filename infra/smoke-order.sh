#!/bin/bash
# Creates a customer + one real order through the store API (dev data for the admin UI).
set -e
B=${B:-http://localhost:9000}
KEY=$(grep NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY= apps/storefront/.env.local | cut -d= -f2)
H=(-H "Content-Type: application/json" -H "x-publishable-api-key: $KEY")
EMAIL=${EMAIL:-budi@contoh.id}
j() { python3 -c "import sys,json; d=json.load(sys.stdin); print(eval('d'+sys.argv[1]))" "$1"; }

TOKEN=$(curl -s "${H[@]}" -X POST $B/auth/customer/emailpass/register -d "{\"email\":\"$EMAIL\",\"password\":\"rahasia123\"}" | j "['token']" 2>/dev/null || true)
if [ -n "$TOKEN" ]; then
  curl -s "${H[@]}" -H "Authorization: Bearer $TOKEN" -X POST $B/store/customers -d "{\"email\":\"$EMAIL\",\"first_name\":\"Budi\",\"last_name\":\"Santoso\",\"phone\":\"+6281234567890\",\"company_name\":\"PT Sawit Makmur\"}" >/dev/null
fi
TOKEN=$(curl -s "${H[@]}" -X POST $B/auth/customer/emailpass -d "{\"email\":\"$EMAIL\",\"password\":\"rahasia123\"}" | j "['token']")
A=(-H "Authorization: Bearer $TOKEN")

REGION=$(curl -s "${H[@]}" $B/store/regions | j "['regions'][0]['id']")
VARIANT=$(curl -s "${H[@]}" "$B/store/products?region_id=$REGION&fields=*variants" | j "['products'][0]['variants'][0]['id']")
CART=$(curl -s "${H[@]}" "${A[@]}" -X POST $B/store/carts -d "{\"region_id\":\"$REGION\"}" | j "['cart']['id']")
curl -s "${H[@]}" "${A[@]}" -X POST $B/store/carts/$CART/line-items -d "{\"variant_id\":\"$VARIANT\",\"quantity\":1}" >/dev/null
ADDR='{"first_name":"Budi","last_name":"Santoso","company":"PT Sawit Makmur","phone":"+6281234567890","address_1":"Jl. Raya Bekasi KM 20","city":"Bekasi","province":"Jawa Barat","postal_code":"17530","country_code":"id"}'
curl -s "${H[@]}" "${A[@]}" -X POST $B/store/carts/$CART -d "{\"email\":\"$EMAIL\",\"shipping_address\":$ADDR,\"billing_address\":$ADDR}" >/dev/null
OPT=$(curl -s "${H[@]}" "${A[@]}" "$B/store/shipping-options?cart_id=$CART" | j "['shipping_options'][0]['id']")
curl -s "${H[@]}" "${A[@]}" -X POST $B/store/carts/$CART/shipping-methods -d "{\"option_id\":\"$OPT\"}" >/dev/null
PC=$(curl -s "${H[@]}" "${A[@]}" -X POST $B/store/payment-collections -d "{\"cart_id\":\"$CART\"}" | j "['payment_collection']['id']")
curl -s "${H[@]}" "${A[@]}" -X POST $B/store/payment-collections/$PC/payment-sessions -d '{"provider_id":"pp_system_default"}' >/dev/null
RES=$(curl -s "${H[@]}" "${A[@]}" -X POST $B/store/carts/$CART/complete)
echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print('type:', d.get('type')); o=d.get('order') or {}; print('order:', o.get('id'), '#', o.get('display_id'), 'total', o.get('total'), o.get('currency_code')) if o else print(d)"
