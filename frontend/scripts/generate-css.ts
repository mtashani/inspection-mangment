#!/usr/bin/env tsx

/**
 * Generate CSS from Design Tokens
 * This script generates the globals.css file from design tokens and themes
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { generateDesignSystemCSS } from "../src/design-system/css-generator";

function main() {
  console.log("🎨 Generating CSS from design tokens...");

  try {
    // Generate CSS
    const css = generateDesignSystemCSS();

    // Write to globals.css
    const outputPath = join(__dirname, "../src/app/globals.css");
    writeFileSync(outputPath, css, "utf8");

    console.log("✅ CSS generated successfully!");
    console.log(`📁 Output: ${outputPath}`);
  } catch (error) {
    console.error("❌ Error generating CSS:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
