import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export const generatePreview = (pdfPath, outputFolder) => {

  return new Promise((resolve) => {

    try {

      /* =====================================
         📁 ENSURE OUTPUT FOLDER
      ===================================== */
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }

      /* =====================================
         🔒 SAFE COMMAND (NO INJECTION)
      ===================================== */
      const outputBase = path.join(outputFolder, "preview");

      const process = spawn("pdftoppm", [
        "-jpeg",
        "-f", "1",
        "-l", "2",
        pdfPath,
        outputBase
      ]);

      let errorOccurred = false;

      /* =====================================
         ⏱ TIMEOUT (10s)
      ===================================== */
      const timeout = setTimeout(() => {
        process.kill("SIGKILL");
        console.log("⏱ Preview generation timeout");
        resolve(null);
      }, 10000);

      process.on("error", (err) => {
        errorOccurred = true;
        clearTimeout(timeout);
        console.log("❌ Preview spawn error:", err.message);
        resolve(null);
      });

      process.on("close", () => {
        clearTimeout(timeout);

        if (errorOccurred) return;

        const preview1 = path.join(outputFolder, "preview-1.jpg");
        const preview2 = path.join(outputFolder, "preview-2.jpg");

        if (!fs.existsSync(preview1) && !fs.existsSync(preview2)) {
          console.log("⚠️ Preview files not generated");
          return resolve(null);
        }

        console.log("✅ Preview generated successfully");

        resolve({
          page1: fs.existsSync(preview1) ? preview1 : null,
          page2: fs.existsSync(preview2) ? preview2 : null,
        });

      });

    } catch (error) {
      console.log("❌ Unexpected preview error:", error.message);
      resolve(null);
    }

  });

};