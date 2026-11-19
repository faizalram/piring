// Cooked warung and restaurant foods, with nutrition per 100 g as served (drinks: per 100 ml).
// These are estimates for typical warung preparation, not lab values. Swap in official
// TKPI numbers where a cooked entry exists. The model only picks an id and grams;
// the app does the math here, so the same dish always gives the same numbers.

export type Food = {
  id: string;
  name: string;
  portion: number; // typical warung portion in grams (ml for drinks), a hint for the model
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Row = [id: string, name: string, portion: number, kcal: number, protein: number, carbs: number, fat: number];

const ROWS: Row[] = [
  // Rice, noodles, starch
  ["nasi_putih", "Nasi putih", 150, 130, 2.7, 28.2, 0.3],
  ["nasi_uduk", "Nasi uduk", 150, 180, 3, 30, 5.5],
  ["nasi_kuning", "Nasi kuning", 150, 175, 3, 30, 5],
  ["nasi_merah", "Nasi merah", 150, 110, 2.6, 23, 0.9],
  ["nasi_goreng", "Nasi goreng (nasinya, tanpa telur/lauk)", 250, 175, 4.5, 26, 6],
  ["lontong", "Lontong", 100, 105, 2, 23.5, 0.3],
  ["ketupat", "Ketupat", 100, 105, 2, 23.5, 0.3],
  ["bubur_nasi", "Bubur nasi (buburnya saja)", 300, 60, 1.2, 13, 0.3],
  ["mie_goreng", "Mie goreng", 200, 195, 4.5, 26, 8],
  ["mie_kuah", "Mie rebus / mie kuah (dengan kuah)", 350, 75, 1.8, 10, 3],
  ["mie_ayam", "Mie ayam (mie + topping ayam, tanpa kuah)", 250, 160, 7, 22, 4.8],
  ["bihun_goreng", "Bihun goreng", 200, 160, 2.8, 29, 3.8],
  ["kwetiau_goreng", "Kwetiau goreng", 300, 165, 4.5, 24, 5.8],
  ["ketoprak", "Ketoprak (lengkap dengan bumbu kacang)", 350, 150, 6, 18, 6],
  ["roti_tawar", "Roti tawar (per lembar 30 g)", 30, 265, 9, 49, 3.2],
  ["roti_bakar", "Roti bakar isi (dengan mentega)", 150, 330, 7, 45, 13.5],
  ["kentang_goreng", "Kentang goreng / french fries", 100, 312, 3.4, 41, 15],
  ["perkedel", "Perkedel kentang", 50, 190, 4, 18, 11.5],
  ["singkong_goreng", "Singkong goreng", 100, 290, 1.5, 40, 14],
  ["jagung_rebus", "Jagung rebus (pipilan)", 100, 96, 3.4, 18, 1.5],

  // Chicken, meat, fish, egg, soy
  ["ayam_goreng", "Ayam goreng (ungkep, tanpa tepung, daging tanpa tulang)", 100, 260, 26, 3, 16.5],
  ["ayam_goreng_tepung", "Ayam goreng tepung / fried chicken / ayam geprek", 130, 280, 19, 11, 18],
  ["ayam_bakar", "Ayam bakar", 100, 210, 25, 6, 9.5],
  ["ayam_pop", "Ayam pop", 100, 220, 25, 1, 13],
  ["opor_ayam", "Opor ayam (dengan kuah santan)", 180, 165, 13, 3, 11],
  ["gulai_ayam", "Gulai ayam (dengan kuah)", 150, 160, 14, 3, 10],
  ["semur_ayam", "Semur ayam / ayam kecap", 120, 180, 18, 8, 8.5],
  ["ayam_suwir", "Ayam suwir (topping bubur, soto, mie)", 40, 170, 27, 1, 6.5],
  ["bebek_goreng", "Bebek goreng", 150, 300, 22, 2, 23],
  ["ati_ampela", "Ati ampela goreng", 60, 210, 24, 3, 11.5],
  ["rendang", "Rendang daging", 70, 215, 21, 7, 11.5],
  ["dendeng_balado", "Dendeng balado", 50, 300, 30, 14, 14],
  ["paru_goreng", "Paru goreng", 40, 300, 30, 5, 18],
  ["empal", "Empal daging", 60, 250, 24, 11, 12],
  ["semur_daging", "Semur daging", 120, 185, 17, 9, 9],
  ["tongseng", "Tongseng / gulai kambing (dengan kuah)", 250, 130, 10, 6, 7.5],
  ["sate_ayam", "Sate ayam (dagingnya; 10 tusuk ±100 g)", 100, 230, 24, 7, 12],
  ["sate_kambing", "Sate kambing / sapi (dagingnya)", 100, 230, 24, 4, 13],
  ["bumbu_kacang", "Bumbu kacang (sate, gado-gado, siomay)", 50, 250, 8.5, 16, 17],
  ["lele_goreng", "Lele goreng", 100, 260, 21, 3, 18.5],
  ["ikan_goreng", "Ikan goreng (nila, kembung, tongkol, bandeng)", 100, 220, 24, 2, 13],
  ["ikan_bakar", "Ikan bakar", 120, 165, 25, 4, 5.5],
  ["udang_goreng", "Udang goreng tepung", 80, 270, 14, 20, 15],
  ["cumi_goreng", "Cumi goreng tepung", 80, 270, 13, 21, 15],
  ["telur_ceplok", "Telur ceplok / telur dadar (goreng)", 60, 196, 13.6, 0.8, 15.3],
  ["telur_rebus", "Telur rebus", 55, 155, 12.6, 1.1, 10.6],
  ["telur_balado", "Telur balado", 70, 185, 11.5, 4.5, 13.5],
  ["tempe_goreng", "Tempe goreng", 50, 330, 20, 11, 23],
  ["tempe_mendoan", "Tempe mendoan", 50, 300, 12, 21, 19],
  ["tempe_orek", "Tempe orek", 60, 260, 14, 16, 15.5],
  ["tahu_goreng", "Tahu goreng", 50, 175, 11, 5, 12.5],
  ["bakso", "Bakso (bulatan baksonya)", 120, 190, 11, 15, 9.5],
  ["siomay", "Siomay (kukus)", 120, 175, 9, 20, 6.5],
  ["batagor", "Batagor", 120, 280, 9, 25, 16],
  ["dimsum", "Dimsum kukus (siu mai, hakau)", 100, 190, 10, 18, 9],
  ["sosis", "Sosis goreng", 50, 290, 11, 6, 25],
  ["nugget", "Nugget ayam", 60, 290, 13, 17, 19],

  // Vegetables
  ["sayur_lodeh", "Sayur lodeh (dengan kuah santan)", 150, 80, 2, 6, 5.5],
  ["sayur_asem", "Sayur asem", 200, 30, 1, 6, 0.3],
  ["sayur_sop", "Sayur sop", 200, 35, 1.5, 5, 1],
  ["sayur_bayam", "Sayur bayam bening", 150, 25, 2, 3.5, 0.3],
  ["sayur_labu_santan", "Sayur labu siam santan (lontong sayur)", 200, 70, 1.5, 5, 5],
  ["tumis_kangkung", "Tumis / cah kangkung", 100, 90, 3, 5, 6.5],
  ["tumis_sayur", "Tumis buncis / sayur campur", 100, 80, 2, 6, 5.5],
  ["capcay", "Capcay", 150, 80, 4, 6, 4.5],
  ["gulai_daun_singkong", "Daun singkong (gulai / rebus, Padang)", 80, 90, 3, 6, 6],
  ["gulai_nangka", "Gulai nangka / cubadak", 100, 120, 2, 10, 8],
  ["terong_balado", "Terong balado", 80, 120, 1.5, 8, 9.5],
  ["kentang_balado", "Kentang balado / sambal goreng kentang", 80, 160, 2, 20, 8],
  ["urap", "Urap", 80, 120, 3, 8, 8.5],
  ["gado_gado", "Gado-gado / pecel / karedok (sayur + bumbu, tanpa lontong)", 300, 140, 6, 10, 8.5],
  ["lalapan", "Lalapan (timun, kol, kemangi)", 40, 15, 1, 3, 0.1],
  ["acar", "Acar", 30, 35, 0.5, 8, 0.1],
  ["salad_sayur", "Salad sayur (dengan dressing)", 150, 90, 2, 6, 6.5],

  // Soups and gravies (with the broth)
  ["soto_ayam", "Soto ayam (kuah + isi, tanpa nasi)", 350, 55, 5, 2.5, 3],
  ["soto_betawi", "Soto betawi (kuah santan/susu + daging)", 350, 110, 7, 3, 8],
  ["sop_buntut", "Sop buntut", 350, 90, 7.5, 2, 6],
  ["rawon", "Rawon", 350, 70, 6, 2, 4.3],
  ["kuah_kaldu", "Kuah bakso / mie / kaldu bening", 300, 15, 1, 1, 0.8],
  ["kuah_gulai", "Kuah gulai / santan siraman nasi Padang", 40, 120, 1.5, 4, 11],
  ["ramen", "Ramen (dengan kuah)", 500, 90, 4.5, 11, 3.2],

  // Sambal, condiments, crackers
  ["sambal", "Sambal (terasi, bawang, ulek; dengan minyak)", 15, 120, 2, 10, 8],
  ["sambal_hijau", "Sambal hijau / lado mudo", 20, 150, 1.5, 8, 12.5],
  ["saus_sambal", "Saus sambal / saus tomat botol", 15, 100, 1, 24, 0.2],
  ["kecap_manis", "Kecap manis", 10, 250, 4, 58, 0],
  ["mayones", "Mayones", 15, 680, 1, 1, 75],
  ["mentega", "Mentega / margarin", 10, 717, 0.9, 0.1, 81],
  ["kental_manis", "Susu kental manis", 20, 320, 8, 54, 8.7],
  ["bawang_goreng", "Bawang goreng", 3, 470, 6, 45, 30],
  ["kerupuk", "Kerupuk (udang / putih / kulit)", 10, 500, 4, 65, 25],
  ["emping", "Emping", 15, 460, 9, 62, 20],

  // Gorengan and snacks
  ["bakwan", "Bakwan / bala-bala", 50, 280, 5, 30, 15.5],
  ["tahu_isi", "Tahu isi goreng", 50, 240, 7, 22, 14],
  ["pisang_goreng", "Pisang goreng", 60, 260, 2, 35, 12.5],
  ["risoles", "Risoles", 60, 270, 7, 28, 14.5],
  ["cireng", "Cireng", 40, 250, 1, 40, 9.5],
  ["cilok", "Cilok", 100, 190, 3, 35, 4],
  ["seblak", "Seblak", 300, 150, 3, 20, 6.5],
  ["martabak_manis", "Martabak manis / terang bulan", 100, 330, 6, 45, 14],
  ["martabak_telur", "Martabak telur", 100, 260, 10, 20, 15.5],
  ["donat", "Donat", 50, 400, 6, 50, 20],
  ["roti_manis", "Roti manis isi", 70, 320, 8, 50, 10],
  ["kue_basah", "Kue basah (lapis, klepon, putu, dll)", 50, 220, 2.5, 38, 6.5],
  ["keripik", "Keripik kentang / singkong", 30, 530, 6, 55, 32],
  ["biskuit", "Biskuit / cookies / wafer", 30, 480, 6, 66, 21],
  ["cokelat", "Cokelat batang", 25, 540, 7, 58, 31],
  ["es_krim", "Es krim", 70, 207, 3.5, 24, 11],

  // Western and fast food
  ["burger", "Burger", 150, 250, 13, 25, 11],
  ["pizza", "Pizza (per potong ±110 g)", 110, 266, 11, 33, 10],
  ["spaghetti", "Spaghetti / pasta saus daging", 300, 150, 7, 20, 4.5],
  ["sushi", "Sushi / onigiri", 150, 145, 5, 28, 1.5],

  // Drinks (per 100 ml)
  ["air_putih", "Air putih", 300, 0, 0, 0, 0],
  ["es_teh_manis", "Es teh manis / teh manis", 300, 40, 0, 10, 0],
  ["teh_tawar", "Teh tawar", 300, 1, 0, 0.2, 0],
  ["teh_kemasan", "Teh kemasan manis (botol/kotak)", 300, 35, 0, 8.7, 0],
  ["kopi_hitam", "Kopi hitam tanpa gula", 200, 2, 0.1, 0.3, 0],
  ["kopi_hitam_gula", "Kopi hitam manis", 200, 30, 0.1, 7.5, 0],
  ["kopi_susu", "Es kopi susu / kopi susu gula aren / latte manis", 250, 75, 2, 11, 2.5],
  ["kopi_sachet", "Kopi sachet 3-in-1 (sudah diseduh)", 200, 60, 0.5, 10.5, 2],
  ["milk_tea", "Milk tea / thai tea / teh tarik", 400, 70, 1.2, 12, 2],
  ["boba", "Boba / bubble tea (dengan pearl)", 500, 80, 0.8, 15, 2],
  ["es_jeruk", "Es jeruk manis", 300, 45, 0.3, 11, 0.1],
  ["jus_buah", "Jus buah dengan gula", 300, 60, 0.5, 14.5, 0.2],
  ["jus_alpukat", "Jus alpukat (dengan susu kental manis)", 300, 120, 1.5, 14, 6.8],
  ["susu", "Susu full cream", 250, 61, 3.2, 4.8, 3.3],
  ["susu_cokelat", "Susu cokelat", 200, 80, 3, 11, 2.7],
  ["soft_drink", "Minuman bersoda manis", 330, 42, 0, 10.6, 0],
  ["es_campur", "Es campur / es buah", 300, 90, 0.8, 20, 1],
  ["kelapa_muda", "Es kelapa muda", 300, 35, 0.3, 8, 0.2],

  // Fruit
  ["pisang", "Pisang", 100, 89, 1.1, 23, 0.3],
  ["pepaya", "Pepaya", 150, 43, 0.5, 11, 0.3],
  ["semangka", "Semangka", 200, 30, 0.6, 7, 0.2],
  ["apel", "Apel", 150, 52, 0.3, 14, 0.2],
  ["jeruk", "Jeruk", 130, 47, 0.9, 12, 0.1],
  ["mangga", "Mangga", 150, 60, 0.8, 15, 0.4],
  ["alpukat", "Alpukat", 100, 160, 2, 8.5, 14.7],
];

export const FOODS: Food[] = ROWS.map(([id, name, portion, kcal, protein, carbs, fat]) => ({
  id,
  name,
  portion,
  kcal,
  protein,
  carbs,
  fat,
}));

export const FOOD_BY_ID = new Map(FOODS.map((f) => [f.id, f]));

/** Compact list for the model: "id | name | typical portion" */
export function catalogForPrompt(): string {
  return FOODS.map((f) => `${f.id} | ${f.name} | ~${f.portion} ${isDrink(f) ? "ml" : "g"}`).join("\n");
}

const DRINK_IDS = new Set([
  "air_putih", "es_teh_manis", "teh_tawar", "teh_kemasan", "kopi_hitam", "kopi_hitam_gula", "kopi_susu",
  "kopi_sachet", "milk_tea", "boba", "es_jeruk", "jus_buah", "jus_alpukat", "susu", "susu_cokelat",
  "soft_drink", "es_campur", "kelapa_muda",
]);

export function isDrink(f: Food): boolean {
  return DRINK_IDS.has(f.id);
}
