import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputDir = path.join(process.cwd(), "public", "cards");
const outputDir = path.join(process.cwd(), "public", "cards", "webp");

const allowedExt = new Set([".jpg", ".jpeg"]);

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function getFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => allowedExt.has(path.extname(name).toLowerCase()));
}

async function main() {
  await ensureDir(outputDir);

  const files = await getFiles(inputDir);

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const baseName = path.parse(file).name;
    const outputPath = path.join(outputDir, `${baseName}.webp`);

    const inputStat = await fs.promises.stat(inputPath);
    const outputStat = await fs.promises.stat(outputPath).catch(() => null);

    if (outputStat && outputStat.mtime >= inputStat.mtime) {
      console.log(`SKIP ${file} (actualizado)`);
      continue;
    }

    try {
      await sharp(inputPath)
        .webp({ quality: 88 })
        .toFile(outputPath);

      console.log(`OK ${file} -> webp/${baseName}.webp`);
    } catch (err) {
      console.error(`ERROR ${file}`, err);
    }
  }

  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});