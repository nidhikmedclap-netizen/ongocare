import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
try {
const templatesDir = path.join(
process.cwd(),
"services",
"emails",
"templates"
);

const categories = await fs.readdir(templatesDir);

const data = [];

for (const category of categories) {
  const categoryPath = path.join(
    templatesDir,
    category
  );

  const stat = await fs.stat(categoryPath);

  if (!stat.isDirectory()) {
    continue;
  }

  const files = await fs.readdir(categoryPath);

  data.push({
    category,
    templates: files
      .filter((file) => file.endsWith(".js"))
      .map((file) => ({
        id: file.replace(".js", ""),
        name: file.replace(".js", ""),
      })),
  });
}

return NextResponse.json({
  success: true,
  data,
});

} catch (error) {
console.error(error);

return NextResponse.json(
  {
    success: false,
    message: error.message,
  },
  {
    status: 500,
  }
);

}
}
