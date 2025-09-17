// src/controllers/kyc.js
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import pool from "../config/db.js";
import sharp from "sharp";
import Tesseract from "tesseract.js";
import jsQR from "jsqr";
import levenshtein from "fast-levenshtein";

// ---------------- config ----------------
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 });

const MAX_FILE_BYTES = 12 * 1024 * 1024;
const ACCEPTED_MIMES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}_${uuidv4()}${ext}`);
  },
});
export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED_MIMES.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"), false);
    }
    cb(null, true);
  },
});

// ---------------- helpers & checkers ----------------
function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    // ignore
  }
}
function checkCommandExists(cmd, args = ["--help"]) {
  try {
    execFile(cmd, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const hasPdftoppm = checkCommandExists("pdftoppm", ["-v"]);
const hasQpdf = checkCommandExists("qpdf", ["--help"]);

// Pretty logging utilities

// Prints a compact single-line JSON summary
function logSummary(obj) {
  try {
    const out = { ts: new Date().toISOString(), ...obj };
    console.log(JSON.stringify(out));
  } catch (e) {
    console.log("logSummary error", String(e));
  }
}

// Prints a multi-line pretty JSON block with a header and footer so it's easy to find
function logDetail(title, obj) {
  try {
    const header = `\n--- ${title} (${new Date().toISOString()}) ----------------------`;
    const body = JSON.stringify(obj, null, 2);
    const footer = `--- end ${title} --------------------------------\n`;
    console.log(header);
    console.log(body);
    console.log(footer);
  } catch (e) {
    console.log(`logDetail error for ${title}`, String(e));
  }
}

// Error logger with stack trace block
function logError(title, err) {
  try {
    const header = `\nXXX ERROR: ${title} (${new Date().toISOString()}) XXX`;
    console.error(header);
    if (err instanceof Error) {
      console.error(err.stack || String(err));
    } else {
      console.error(JSON.stringify(err, null, 2));
    }
    console.error("XXX end error XXX\n");
  } catch (e) {
    console.error("logError fallback", String(e));
  }
}

// qpdf decrypt wrapper
function qpdfDecrypt(inputPath, outputPath, pass) {
  return new Promise((resolve, reject) => {
    execFile(
      "qpdf",
      [`--password=${String(pass)}`, "--decrypt", inputPath, outputPath],
      { maxBuffer: 50 * 1024 * 1024 },
      (err, _stdout, stderr) => {
        if (err) return reject(new Error(String(stderr || err.message)));
        resolve();
      }
    );
  });
}

// pdftoppm wrapper
function pdfToPngImages(pdfPath, outPrefix) {
  return new Promise((resolve, reject) => {
    execFile(
      "pdftoppm",
      ["-png", "-rx", "300", "-ry", "300", pdfPath, outPrefix],
      { maxBuffer: 200 * 1024 * 1024 },
      (err, _stdout, stderr) => {
        if (err)
          return reject(
            new Error(String(stderr || err.message || "pdftoppm failed"))
          );
        try {
          const dir = path.dirname(outPrefix);
          const base = path.basename(outPrefix);
          const files = fs
            .readdirSync(dir)
            .filter((f) => f.startsWith(base + "-") && f.endsWith(".png"))
            .map((f) => path.join(dir, f))
            .sort();
          resolve(files);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

// text helpers
function normalizeText(t) {
  return String(t || "")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .trim()
    .toLowerCase();
}
function nameSimilarityPercent(a, b) {
  if (!a || !b) return 0;
  const sa = normalizeText(a);
  const sb = normalizeText(b);
  const dist = levenshtein.get(sa, sb);
  const maxLen = Math.max(sa.length, sb.length);
  if (maxLen === 0) return 0;
  return Math.round(((maxLen - dist) / maxLen) * 100);
}
function extractAadhaarNumber(text) {
  const m = text.match(/\b(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/);
  return m ? m[1].replace(/\D/g, "") : null;
}
function extractDOB(text) {
  const m = text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
  if (m) return m[1];
  const m2 = text.match(/\b(\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/);
  if (m2) return m2[1];
  return null;
}

// OCR & preprocess
async function runOcrOnBuffer(bufferOrPath) {
  // uses tesseract.js (as in previous code). If you want native CLI, we can swap later.
  const res = await Tesseract.recognize(bufferOrPath, "eng");
  return (res?.data?.text || "").trim();
}
async function preprocessImageToBuffer(inputPath, options = {}) {
  const { maxWidth = 2200 } = options;
  const img = sharp(inputPath);
  const meta = await img.metadata();
  const width = meta.width || maxWidth;
  const targetWidth = Math.min(width, maxWidth);
  const buf = await img
    .rotate()
    .resize({ width: targetWidth })
    .grayscale()
    .normalize()
    .toFormat("png")
    .toBuffer();
  return buf;
}

// QR decode (dynamic Jimp import)
async function tryDecodeQrFromBuffer(buffer) {
  try {
    const jimpModule = await import("jimp");
    const Jimp = jimpModule?.default || jimpModule;
    const jimg = await Jimp.read(buffer);
    const { data, width, height } = jimg.bitmap;
    const uint8 = new Uint8ClampedArray(data.buffer);
    const code = jsQR(uint8, width, height);
    if (!code) return null;
    return code.data || null;
  } catch (e) {
    return null;
  }
}

function layoutScoreFromText(text) {
  const low = normalizeText(text || "");
  let score = 0;
  if (low.includes("government")) score += 20;
  if (low.includes("unique identification")) score += 15;
  if (low.includes("uidai")) score += 25;
  if (low.includes("name")) score += 10;
  if (low.includes("gender")) score += 10;
  return Math.min(100, score);
}

const WEIGHTS_DEFAULT = {
  qr: 0.35,
  aadhaarNum: 0.2,
  name: 0.15,
  dob: 0.05,
  layout: 0.1,
  face: 0.15,
};

function decideFinalStatus(score, hasFace = false) {
  const approveThreshold = hasFace ? 80 : 86;
  const reviewThreshold = hasFace ? 60 : 70;
  if (score >= approveThreshold) return "APPROVED";
  if (score >= reviewThreshold) return "NEEDS_REVIEW";
  return "NEEDS_REVIEW";
}

async function ensureColumns(client) {
  await client.query(
    `ALTER TABLE customerprofile 
     ADD COLUMN IF NOT EXISTS aadhaar_kyc_status VARCHAR(20),
     ADD COLUMN IF NOT EXISTS aadhaar_no VARCHAR(32),
     ADD COLUMN IF NOT EXISTS latest_kyc_id BIGINT,
     ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20)`
  );
}

async function getCanonicalIdentity(client, userId) {
  const cp = await client.query(
    `SELECT full_name, aadhaar_no FROM customerprofile WHERE user_id = $1`,
    [userId]
  );
  if (cp.rows.length) {
    const r = cp.rows[0];
    return {
      full_name: r.full_name || null,
      aadhaar_no: r.aadhaar_no || null,
      dob: "2002-12-31",
    };
  }
  const u = await client.query(`SELECT full_name FROM users WHERE user_id=$1`, [
    userId,
  ]);
  if (u.rows.length) {
    const r = u.rows[0];
    return {
      full_name: r.full_name || null,
      aadhaar_no: null,
      dob: "2002-12-31",
    };
  }
  return { full_name: null, aadhaar_no: null, dob: "2002-12-31" };
}

function aggregateCustomerKycStatus(aadhaarStatus) {
  if (!aadhaarStatus) return "PENDING";
  if (aadhaarStatus === "APPROVED") return "VERIFIED";
  if (aadhaarStatus === "NEEDS_REVIEW") return "NEEDS_REVIEW";
  return "PENDING";
}

// ---------------- Controller ----------------
export async function verifyAadhaar(req, res) {
  const client = await pool.connect();
  const userId = req.user?.userId;
  const startTs = new Date().toISOString();
  if (!userId) {
    client.release();
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const file = req.file;
  if (!file) {
    client.release();
    return res
      .status(400)
      .json({ ok: false, error: "Upload aadhaar_file (PDF or image)" });
  }

  const storedFilename = path.basename(file.path);
  const storedPath = path.join(UPLOAD_DIR, storedFilename);
  const passcode = req.body?.aadhaar_pdf_passcode || null;

  // START: summary
  logSummary({
    event: "kyc:start",
    userId,
    file: {
      originalname: file.originalname,
      storedFilename,
      size: file.size,
      mime: file.mimetype,
    },
  });

  try {
    await client.query("BEGIN");
    await ensureColumns(client);

    // ensure customerprofile exists
    let cpRes = await client.query(
      "SELECT customer_id FROM customerprofile WHERE user_id=$1",
      [userId]
    );
    let customerId = cpRes.rows[0]?.customer_id;
    if (!customerId) {
      const ins = await client.query(
        "INSERT INTO customerprofile (user_id, full_name, created_at) VALUES ($1,$2,NOW()) RETURNING customer_id",
        [userId, ""]
      );
      customerId = ins.rows[0].customer_id;
      logSummary({ event: "kyc:customerCreated", customerId });
    }

    const canonical = await getCanonicalIdentity(client, userId);
    logDetail("kyc:canonicalFetched", canonical);

    // optional decryption
    let workingPath = storedPath;
    let tmpDec = null;
    if (passcode) {
      if (!hasQpdf) {
        await client.query("ROLLBACK");
        safeUnlink(storedPath);
        logError("qpdf_missing", "qpdf binary not installed");
        return res
          .status(400)
          .json({
            ok: false,
            error: "Server cannot decrypt PDFs (qpdf missing)",
          });
      }
      tmpDec = path.join(UPLOAD_DIR, `dec_${Date.now()}_${uuidv4()}.pdf`);
      await qpdfDecrypt(storedPath, tmpDec, passcode);
      workingPath = tmpDec;
      logSummary({ event: "kyc:pdfDecrypted", tmpDec });
    }

    // build page images
    let pageImages = [];
    const ext = path.extname(workingPath).toLowerCase();
    let fallbackPdfText = "";
    if (ext === ".pdf") {
      if (hasPdftoppm) {
        const outPrefix = path.join(UPLOAD_DIR, `pg_${Date.now()}_${uuidv4()}`);
        pageImages = await pdfToPngImages(workingPath, outPrefix);
        logSummary({
          event: "kyc:pdfConverted",
          count: pageImages.length,
          samplePages: pageImages.slice(0, 3),
        });
      } else {
        try {
          const pdfParseMod = await import("pdf-parse");
          const pdfParse = pdfParseMod?.default || pdfParseMod;
          const buf = fs.readFileSync(workingPath);
          const pdfData = await pdfParse(buf);
          fallbackPdfText = pdfData?.text || "";
          logDetail("kyc:pdfTextExtractedFallback", {
            length: String(fallbackPdfText?.length),
          });
        } catch (e) {
          fallbackPdfText = "";
          logError("kyc:pdfParseFailed", e);
        }
      }
    } else {
      pageImages = [workingPath];
      logSummary({ event: "kyc:imageReceived", image: workingPath });
    }

    // OCR / QR loop
    let aggregatedText = "";
    if (fallbackPdfText) aggregatedText += "\n" + fallbackPdfText;

    let qrPayload = null;
    let layoutScore = 0;
    const perPageSamples = [];

    for (const imgPath of pageImages) {
      const preBuf = await preprocessImageToBuffer(imgPath, { maxWidth: 2200 });

      // QR attempt
      let qr = null;
      try {
        qr = await tryDecodeQrFromBuffer(preBuf);
      } catch (e) {
        qr = null;
      }
      if (qr && !qrPayload) qrPayload = qr;

      // OCR
      let pageText = "";
      try {
        pageText = await runOcrOnBuffer(preBuf);
      } catch (e) {
        pageText = "";
        logError("ocr:pageError", e);
      }
      aggregatedText += "\n" + pageText;
      layoutScore = Math.max(layoutScore, layoutScoreFromText(pageText));
      perPageSamples.push({
        imgPath,
        textLen: pageText.length,
        textSample: pageText.slice(0, 400),
      });

      logSummary({
        event: "kyc:pageProcessed",
        imgPath,
        qrFound: Boolean(qr),
        textLen: pageText.length,
      });
    }

    if (pageImages.length === 0) {
      try {
        const fallbackBuf = fs.readFileSync(workingPath);
        const ptext = await runOcrOnBuffer(fallbackBuf);
        aggregatedText += "\n" + ptext;
        layoutScore = Math.max(layoutScore, layoutScoreFromText(ptext));
        logSummary({ event: "kyc:fallbackOcrUsed", textLen: ptext.length });
      } catch (e) {
        logError("kyc:fallbackOcrFailed", e);
      }
    }

    if (tmpDec) safeUnlink(tmpDec);

    // Parse fields
    const parsedAadhaar = extractAadhaarNumber(aggregatedText);
    // enhanced candidates
    let parsedAadhaarCandidates = [];
    const allDigits = aggregatedText.replace(/\D/g, "");
    if (allDigits.length >= 12) {
      for (let i = 0; i <= allDigits.length - 12; i++) {
        parsedAadhaarCandidates.push(allDigits.slice(i, i + 12));
      }
    }
    const grp = aggregatedText.match(/\b(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g);
    if (grp && grp.length)
      parsedAadhaarCandidates.push(...grp.map((s) => s.replace(/\D/g, "")));
    parsedAadhaarCandidates = [...new Set(parsedAadhaarCandidates)].filter(
      Boolean
    );
    const parsedAadhaarFinal =
      parsedAadhaarCandidates.find((c) => c.length === 12) ||
      parsedAadhaarCandidates[0] ||
      parsedAadhaar ||
      null;

    const parsedDob = extractDOB(aggregatedText);
    const parsedDobFinal = parsedDob || null;

    // name heuristics
    let parsedName = null;
    try {
      const norm = aggregatedText
        .replace(/\r/g, " ")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      for (let i = 0; i < norm.length; i++) {
        const line = norm[i];
        if (/name/i.test(line) && /[a-zA-Z]/.test(line)) {
          const m = line.match(/name\s*[:\-]\s*(.+)$/i);
          if (m && m[1]) {
            parsedName = m[1].trim();
            break;
          } else if (norm[i + 1]) {
            parsedName = norm[i + 1].trim();
            break;
          }
        }
      }
      if (!parsedName) {
        const caps = norm.find(
          (s) => /^[A-Z\s\.\-']{3,}$/.test(s) && s.split(/\s+/).length <= 6
        );
        if (caps) parsedName = caps.trim();
      }
    } catch (e) {
      parsedName = null;
    }
    const parsedNameFinal = parsedName || null;

    // Log parsing results
    logDetail("kyc:parsing", {
      aadhaarCandidateCount: parsedAadhaarCandidates.length,
      parsedAadhaarFinal,
      parsedDobFinal,
      parsedNameFinal,
      perPageSamples,
    });

    // Signals calculation (use final parsed values)
    const signals = {
      qr: qrPayload ? 100 : 0,
      aadhaarNum: 0,
      name: 0,
      dob: 0,
      layout: Math.min(100, layoutScore),
      face: null,
    };

    if (canonical.aadhaar_no && parsedAadhaarFinal) {
      const canonDigits = String(canonical.aadhaar_no).replace(/\D/g, "");
      if (canonDigits === parsedAadhaarFinal) signals.aadhaarNum = 100;
      else if (canonDigits.slice(-4) === parsedAadhaarFinal.slice(-4))
        signals.aadhaarNum = 90;
      else {
        let matchCount = 0;
        const minL = Math.min(canonDigits.length, parsedAadhaarFinal.length);
        for (let i = 1; i <= minL; i++)
          if (canonDigits.slice(-i) === parsedAadhaarFinal.slice(-i))
            matchCount = i;
        signals.aadhaarNum = Math.min(80, Math.round((matchCount / 12) * 100));
      }
    } else if (parsedAadhaarFinal) {
      signals.aadhaarNum = 65;
    } else {
      signals.aadhaarNum = 0;
    }

    // name signal
    if (canonical.full_name && parsedNameFinal) {
      const nameLev = nameSimilarityPercent(
        canonical.full_name,
        parsedNameFinal
      );
      const canonicalTokens = normalizeText(canonical.full_name)
        .split(/\s+/)
        .filter(Boolean);
      const parsedTokens = normalizeText(parsedNameFinal)
        .split(/\s+/)
        .filter(Boolean);
      const intersection = canonicalTokens.filter((t) =>
        parsedTokens.includes(t)
      );
      const tokenOverlap = canonicalTokens.length
        ? Math.round((intersection.length / canonicalTokens.length) * 100)
        : 0;
      signals.name = Math.max(nameLev, tokenOverlap);
    } else {
      signals.name = 0;
    }

    // dob signal — canonical.dob is present (hard-coded) and parsedDobFinal may be present
    if (canonical.dob && parsedDobFinal) {
      const cd = canonical.dob.replace(/\D/g, "");
      const pd = parsedDobFinal.replace(/\D/g, "");
      signals.dob = cd === pd ? 100 : cd.slice(-4) === pd.slice(-4) ? 75 : 0;
    } else {
      signals.dob = 0;
    }

    // Log signals before weighting
    logDetail("kyc:signalsComputed", {
      signals,
      qrPayloadExists: Boolean(qrPayload),
      layoutScore,
    });

    // Weights (adjusted)
    const adjustedWeights = {
      qr: 0.4,
      aadhaarNum: 0.3,
      name: 0.12,
      dob: 0.05,
      layout: 0.13,
      face: 0,
    };
    const totalW = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
    const normalizedWeights = {};
    for (const k in adjustedWeights)
      normalizedWeights[k] = adjustedWeights[k] / totalW;

    // Score
    const score = Math.round(
      normalizedWeights.qr * signals.qr +
        normalizedWeights.aadhaarNum * signals.aadhaarNum +
        normalizedWeights.name * signals.name +
        normalizedWeights.dob * signals.dob +
        normalizedWeights.layout * signals.layout
    );
    const finalStatus =
      score >= 82 ? "APPROVED" : score >= 55 ? "NEEDS_REVIEW" : "NEEDS_REVIEW";

    logDetail("kyc:score", { score, finalStatus, normalizedWeights });

    // persist file
    const fileInsert = await client.query(
      `INSERT INTO kyc_files (user_id, customer_id, type, original_filename, stored_filename, file_path, mime, size_bytes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [
        userId,
        customerId,
        "aadhaar_pdf",
        file.originalname,
        storedFilename,
        storedPath,
        file.mimetype,
        file.size || null,
      ]
    );
    const fileId = fileInsert.rows[0].id;
    logSummary({ event: "kyc:fileSaved", fileId });

    // persist record
    const recInsert = await client.query(
      `INSERT INTO kyc_records (user_id, customer_id, kyc_type, source, file_id, parsed_json, confidence_score, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING id`,
      [
        userId,
        customerId,
        "AADHAAR",
        "pdf",
        fileId,
        JSON.stringify({
          sampleText: aggregatedText.slice(0, 4000),
          parsed: {
            aadhaar: parsedAadhaarFinal,
            name: parsedNameFinal,
            dob: parsedDobFinal,
          },
          qrPayload,
          signals,
        }),
        score,
        finalStatus,
      ]
    );
    const kycId = recInsert.rows[0].id;
    logSummary({ event: "kyc:recordSaved", kycId });

    // update profile
    await client.query(
      `UPDATE customerprofile SET latest_kyc_id = $1, aadhaar_kyc_status = $2, aadhaar_no = COALESCE(NULLIF($3,''), aadhaar_no) WHERE customer_id = $4`,
      [
        kycId,
        finalStatus,
        canonical.aadhaar_no ||
          (parsedAadhaarFinal ? parsedAadhaarFinal.slice(-4) : ""),
        customerId,
      ]
    );
    const overall = aggregateCustomerKycStatus(finalStatus);
    await client.query(
      "UPDATE customerprofile SET kyc_status = $1 WHERE customer_id = $2",
      [overall, customerId]
    );

    await client.query("COMMIT");

    // final log & response (with debug)
    logDetail("kyc:complete", {
      userId,
      customerId,
      kycId,
      finalStatus,
      score,
    });

    return res.json({
      ok: true,
      record: { id: kycId, status: finalStatus, confidence: score },
      customer: { customer_id: customerId, aadhaar_kyc_status: finalStatus },
      debug: {
        parsed: {
          aadhaar: parsedAadhaarFinal,
          name: parsedNameFinal,
          dob: parsedDobFinal,
        },
        qrPayload,
        signals,
        weights: normalizedWeights,
        layoutScore,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    logError("kyc:error", err);
    safeUnlink(storedPath);
    return res
      .status(500)
      .json({ ok: false, error: String(err?.message || err) });
  } finally {
    client.release();
  }
}

// ---------------- get status ----------------
export async function getKycStatusForCurrentUser(req, res) {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    if (!userId)
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    await ensureColumns(client);
    const r = await client.query(
      "SELECT customer_id,aadhaar_no,aadhaar_kyc_status,kyc_status,latest_kyc_id FROM customerprofile WHERE user_id=$1",
      [userId]
    );
    if (!r.rows.length)
      return res.json({ ok: true, status: { kyc_status: "PENDING" } });
    return res.json({ ok: true, status: r.rows[0] });
  } catch (e) {
    logError("kyc:statusError", e);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to fetch KYC status" });
  } finally {
    client.release();
  }
}
