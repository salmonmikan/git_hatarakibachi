import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "public/hatarakibachi_logo.jpg"; // 元画像
const OUT_DIR = "public";      // 出力先（そのまま /img/... で参照できる）
const BASE = "hatarakibachi_logo";

fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = [
    { size: 64, suffix: "64" },
    { size: 128, suffix: "128" },
];

for (const t of targets) {
    const outJpg = path.join(OUT_DIR, `${BASE}-${t.suffix}.jpg`);
    await sharp(SRC)
        .resize(t.size, t.size, { fit: "contain" })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outJpg);

    console.log(`[OK] ${outJpg}`);
}
