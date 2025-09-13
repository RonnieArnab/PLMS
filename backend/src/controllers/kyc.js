// src/controllers/kyc.js
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import unzipper from "unzipper";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import pool from "../config/db.js";
import { createWorker } from "tesseract.js";

// -------- Config --------
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 });

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIMES = new Set([
  "application/pdf",
  "application/zip",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

// Multer: store files in UPLOAD_DIR with safe names
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

// optional pdf-parse fallback (dynamic import)
let pdfParse = null;
try {
  // dynamic import to avoid failing if not installed
  // eslint-disable-next-line no-await-in-loop
  pdfParse = (await import("pdf-parse")).default;
} catch (e) {
  pdfParse = null;
}

// --------- Helpers ----------
function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch (e) {
    // ignore
  }
}

function qpdfDecrypt(inputPath, outputPath, pass) {
  return new Promise((resolve, reject) => {
    execFile(
      "qpdf",
      [`--password=${String(pass)}`, "--decrypt", inputPath, outputPath],
      { maxBuffer: 50 * 1024 * 1024 },
      (err, _stdout, stderr) => {
        if (err) {
          const msg = String(stderr || err.message || "");
          return reject(new Error(msg.trim() || "qpdf failed"));
        }
        resolve();
      }
    );
  });
}

function checkQpdfExists() {
  try {
    execFile("qpdf", ["--help=usage"], { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function checkPdftoppmExists() {
  try {
    execFile("pdftoppm", ["-v"], { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function buildAndSaveXmlObj(prefix, obj) {
  const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
  const xmlString = builder.build({ KYC: obj });
  const filename = `${prefix}_${Date.now()}_${uuidv4()}.xml`;
  const fullPath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(fullPath, xmlString, { mode: 0o600 });
  return { filename, fullPath, xmlString };
}

// --------- Privacy helpers ----------
function maskPan(pan) {
  if (!pan || typeof pan !== "string") return null;
  const up = pan.toUpperCase();
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(up)) {
    const start = up.slice(0, 3);
    const end = up.slice(-1);
    return `${start}****${end}`;
  }
  return `****${up.slice(-1) || ""}`;
}

function redactAadhaar(aad) {
  if (!aad || typeof aad !== "string") return null;
  const digits = String(aad).replace(/\D/g, "");
  if (digits.length === 12) return `**** **** ${digits.slice(-4)}`;
  if (digits.length >= 4) return `**** ${digits.slice(-4)}`;
  return "****";
}

function sanitizeParsedForResponse(parsed) {
  if (!parsed) return null;
  return {
    pan: parsed.pan ? maskPan(parsed.pan) : null,
    aadhaar_last4: parsed.aadhaar12 ? String(parsed.aadhaar12).slice(-4) : null,
    dob: parsed.dob || null,
    name_detected: !!parsed.name,
  };
}

// --------- Parsing heuristics ----------
const PAN_REGEX = /\b([A-Z]{5}[0-9]{4}[A-Z])\b/i;
const AADHAAR_12 = /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/;
const DOB_REGEX = /\b(\d{2}[\/-]\d{2}[\/-]\d{4})\b/;

function normalizeText(t) {
  return String(t || "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTextForKyc(text) {
  const normalized = normalizeText(text);
  const panM = normalized.match(PAN_REGEX);
  const aadM = normalized.match(AADHAAR_12);
  const dobM = normalized.match(DOB_REGEX);
  let name = null;
  if (panM) {
    const idx = normalized.indexOf(panM[1]);
    const slice = normalized.slice(Math.max(0, idx - 150), idx + 150);
    const nm =
      slice.match(/Name\s*[:\-]\s*([A-Z][A-Za-z\s\.'-]{2,})/i) ||
      slice.match(/([A-Z][A-Za-z\s\.'-]{3,})\s*\(Permanent/i);
    if (nm) name = nm[1].trim();
  } else {
    const nm2 = normalized.match(/Name\s*[:\-]\s*([A-Z][A-Za-z\s\.'-]{2,})/i);
    if (nm2) name = nm2[1].trim();
  }

  return {
    pan: panM ? panM[1].toUpperCase() : null,
    aadhaar12: aadM ? aadM[1].replace(/[\s-]/g, "") : null,
    dob: dobM ? dobM[1] : null,
    name,
    textSample: normalized.slice(0, 1600),
  };
}

// ---------- OCR / PDF helpers (tesseract + pdftoppm or pdf-parse) ----------
let tesseractWorker = null;
let tesseractInitialized = false;
async function ensureTesseractWorker(lang = "eng") {
  if (tesseractInitialized && tesseractWorker) return tesseractWorker;
  tesseractWorker = createWorker();
  await tesseractWorker.load();
  await tesseractWorker.loadLanguage(lang);
  await tesseractWorker.initialize(lang);
  tesseractInitialized = true;
  return tesseractWorker;
}

function pdfToPngImages(pdfPath, outPrefix) {
  return new Promise((resolve, reject) => {
    execFile(
      "pdftoppm",
      ["-png", pdfPath, outPrefix],
      { maxBuffer: 100 * 1024 * 1024 },
      (err, _stdout, stderr) => {
        if (err) {
          return reject(
            new Error(
              String(stderr || err.message || "").trim() || "pdftoppm failed"
            )
          );
        }
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

async function ocrImages(imagePaths, lang = "eng") {
  const worker = await ensureTesseractWorker(lang);
  let fullText = "";
  for (const img of imagePaths) {
    try {
      const { data } = await worker.recognize(img);
      fullText += "\n" + (data?.text || "");
    } catch (e) {
      fullText += `\n[OCR error ${path.basename(img)}: ${String(e.message)}]`;
    }
  }
  return fullText;
}

async function extractTextFromPdfViaOcr(pdfPath) {
  if (checkPdftoppmExists()) {
    const outPrefix = path.join(UPLOAD_DIR, `pg_${Date.now()}_${uuidv4()}`);
    const imagePaths = await pdfToPngImages(pdfPath, outPrefix);
    if (!imagePaths || imagePaths.length === 0)
      throw new Error("pdftoppm produced no images");
    try {
      const text = await ocrImages(imagePaths, "eng");
      for (const p of imagePaths) safeUnlink(p);
      return text;
    } catch (e) {
      for (const p of imagePaths) safeUnlink(p);
      throw e;
    }
  }

  if (pdfParse) {
    const buf = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(buf);
    return pdfData.text || "";
  }

  throw new Error(
    "No method available to extract text: install pdftoppm+tesseract or add pdf-parse"
  );
}

// process PDF optionally decrypting with passcode
async function processPdfWithOptionalPass(filePath, passcode) {
  const out = {
    storedFilename: path.basename(filePath),
    decrypted: false,
    decryptedFilename: null,
    parsed: null,
    errors: null,
    size: null,
    mime: "application/pdf",
  };
  out.size = fs.existsSync(filePath) ? fs.statSync(filePath).size : null;

  let workingPath = filePath;
  let tmpDec = null;

  if (passcode) {
    if (!checkQpdfExists()) {
      out.errors =
        "qpdf is not installed; cannot decrypt password-protected PDFs";
      return out;
    }
    try {
      tmpDec = path.join(UPLOAD_DIR, `dec_${Date.now()}_${uuidv4()}.pdf`);
      await qpdfDecrypt(filePath, tmpDec, passcode);
      out.decrypted = true;
      out.decryptedFilename = path.basename(tmpDec);
      workingPath = tmpDec;
    } catch (e) {
      safeUnlink(tmpDec);
      out.decrypted = false;
      out.errors = `Failed to decrypt PDF with provided passcode: ${String(
        e.message
      )}`;
      return out;
    }
  }

  try {
    const text = await extractTextFromPdfViaOcr(workingPath);
    out.parsed = parseTextForKyc(text || "");
  } catch (e) {
    out.errors = `text extraction failed: ${String(e.message)}`;
  } finally {
    if (tmpDec) safeUnlink(tmpDec);
  }

  return out;
}

// process Aadhaar offline ZIP
async function processAadhaarZip(zipPath, passcode) {
  const out = {
    zipFilename: path.basename(zipPath),
    parsed: null,
    signatureVerified: null,
    errors: null,
    xmlSample: null,
    size: null,
    mime: "application/zip",
  };
  try {
    out.size = fs.statSync(zipPath).size;
    const directory = await unzipper.Open.file(zipPath);
    const xmlEntry = directory.files.find(
      (f) => f.path && f.path.toLowerCase().endsWith(".xml")
    );
    if (!xmlEntry) {
      out.errors = "No XML found in ZIP";
      return out;
    }
    let xmlBuffer;
    try {
      xmlBuffer = await xmlEntry.buffer(passcode);
    } catch (e) {
      out.errors =
        "Failed to decrypt zip - wrong passcode or unsupported encryption";
      return out;
    }
    const xmlString = xmlBuffer.toString("utf8");
    out.xmlSample = xmlString.slice(0, 800);

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });
    const doc = parser.parse(xmlString);
    const root = doc.OfflinePaperlessKyc || doc.KycRes || doc;
    const uidai = root.UidData || root.uid_data || root;
    const poi = uidai.Poi || uidai.POI || uidai || {};
    const name = poi.name || poi.Name || uidai.name || null;
    const dob = poi.dob || poi.DOB || poi.yob || uidai.dob || null;
    const gender = poi.gender || poi.Gender || uidai.gender || null;
    const last4Raw =
      uidai.maskedAadhaar || uidai.uid || uidai.uidNumber || null;
    const last4 =
      (last4Raw && String(last4Raw).replace(/\D/g, "").slice(-4)) || null;

    out.parsed = { name, dob, gender, last4 };
    out.signatureVerified = null;
  } catch (e) {
    out.errors = String(e.message);
  }
  return out;
}

// compute confidence for simple rules (defensive)
function computeConfidence(parsed, provided) {
  let score = 0;
  const reasons = [];
  if (!parsed) return { score, reasons };

  const provPan = provided?.pan_no
    ? String(provided.pan_no).toUpperCase()
    : null;
  const parsedPan = parsed?.pan ? String(parsed.pan).toUpperCase() : null;
  if (provPan && parsedPan && provPan === parsedPan) {
    score++;
    reasons.push("PAN matches");
  }

  const provAad = provided?.aadhaar_no
    ? String(provided.aadhaar_no).replace(/\D/g, "")
    : null;
  const parsedAad = parsed?.aadhaar12
    ? String(parsed.aadhaar12).replace(/\D/g, "")
    : null;
  if (provAad && parsedAad && provAad.slice(-4) === parsedAad.slice(-4)) {
    score++;
    reasons.push("Aadhaar last4 matches");
  }

  const provDob = provided?.dob ? String(provided.dob) : null;
  const parsedDob = parsed?.dob ? String(parsed.dob) : null;
  if (provDob && parsedDob && provDob === parsedDob) {
    score++;
    reasons.push("DOB matches");
  }

  return { score, reasons };
}

function decideRecordStatus(conf) {
  if (conf.score >= 2) return "PENDING";
  if (conf.score === 1) return "NEEDS_REVIEW";
  return "NEEDS_REVIEW";
}

// compute overall customer kyc_status from per-doc statuses
function aggregateCustomerKycStatus(aadhaarStatus, panStatus) {
  // priority: REJECTED > NEEDS_REVIEW > PENDING > VERIFIED/AUTO_APPROVED > null
  const ranks = {
    REJECTED: 100,
    NEEDS_REVIEW: 80,
    PENDING: 60,
    AUTO_APPROVED: 50,
    VERIFIED: 40,
    null: 0,
    undefined: 0,
  };
  const aRank = ranks[aadhaarStatus?.toUpperCase?.() ?? null] ?? 0;
  const pRank = ranks[panStatus?.toUpperCase?.() ?? null] ?? 0;
  const maxRank = Math.max(aRank, pRank);

  if (maxRank === ranks.REJECTED) return "REJECTED";
  if (maxRank === ranks.NEEDS_REVIEW) return "NEEDS_REVIEW";
  if (maxRank === ranks.PENDING) return "PENDING";
  if (maxRank === ranks.AUTO_APPROVED) return "AUTO_APPROVED";
  if (maxRank === ranks.VERIFIED) return "VERIFIED";
  return "PENDING";
}

// ensure customerprofile has per-document columns (safe: runs once per request)
async function ensurePerDocColumns(client) {
  // Add aadhaar_kyc_status and pan_kyc_status if they don't exist.
  // Note: alter with IF NOT EXISTS for modern Postgres
  await client.query(
    `ALTER TABLE customerprofile 
     ADD COLUMN IF NOT EXISTS aadhaar_kyc_status VARCHAR(20) DEFAULT NULL;`
  );
  await client.query(
    `ALTER TABLE customerprofile 
     ADD COLUMN IF NOT EXISTS pan_kyc_status VARCHAR(20) DEFAULT NULL;`
  );
}

// ---------------- Controllers ----------------

// POST /api/kyc/aadhaar
export async function verifyAadhaar(req, res) {
  const client = await pool.connect();
  const userId = req.user?.userId;
  if (!userId) {
    client.release();
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // defensive parse
  const aadhaar_passcode = req.body?.aadhaar_passcode ?? null;
  const aadhaar_pdf_passcode = req.body?.aadhaar_pdf_passcode ?? null;
  const aadhaar_no = req.body?.aadhaar_no
    ? String(req.body.aadhaar_no).replace(/\D/g, "")
    : null;

  try {
    await client.query("BEGIN");
    await ensurePerDocColumns(client);

    // ensure customerprofile exists
    const cpRes = await client.query(
      "SELECT customer_id, aadhaar_kyc_status, pan_kyc_status, aadhaar_no, pan_no, latest_kyc_id, kyc_status FROM customerprofile WHERE user_id = $1",
      [userId]
    );
    let customerId = cpRes.rows[0]?.customer_id || null;
    let existingAadhaarStatus = cpRes.rows[0]?.aadhaar_kyc_status ?? null;
    let existingPanStatus = cpRes.rows[0]?.pan_kyc_status ?? null;
    if (!customerId) {
      const ins = await client.query(
        "INSERT INTO customerprofile (user_id, full_name, created_at) VALUES ($1,$2,NOW()) RETURNING customer_id, aadhaar_kyc_status, pan_kyc_status, kyc_status",
        [userId, ""]
      );
      customerId = ins.rows[0].customer_id;
      existingAadhaarStatus = ins.rows[0].aadhaar_kyc_status ?? null;
      existingPanStatus = ins.rows[0].pan_kyc_status ?? null;
    }

    const zipFile = req.files?.aadhaar_zip?.[0] ?? null;
    const pdfFile = req.files?.aadhaar_file?.[0] ?? null;

    if (!zipFile && !pdfFile && !aadhaar_no) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        ok: false,
        error: "Provide aadhaar_no or upload aadhaar_zip/aadhaar_file",
      });
    }

    if (aadhaar_no && !/^\d{12}$/.test(aadhaar_no)) {
      if (zipFile) safeUnlink(zipFile.path);
      if (pdfFile) safeUnlink(pdfFile.path);
      await client.query("ROLLBACK");
      return res.status(400).json({
        ok: false,
        error: "Invalid Aadhaar format (12 digits expected)",
      });
    }

    // process file -> insert kyc_files and parse
    let fileId = null;
    let parsed = null;
    let source = null;
    if (zipFile) {
      source = "zip";
      const zipRes = await processAadhaarZip(zipFile.path, aadhaar_passcode);
      parsed = zipRes.parsed;
      const storedFilename = path.basename(zipFile.path);
      const filePath = path.join(UPLOAD_DIR, storedFilename);
      const r = await client.query(
        `INSERT INTO kyc_files (user_id, customer_id, type, original_filename, stored_filename, file_path, mime, size_bytes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          userId,
          customerId,
          "aadhaar_zip",
          zipFile.originalname,
          storedFilename,
          filePath,
          zipFile.mimetype,
          zipRes.size || null,
        ]
      );
      fileId = r.rows[0].id;
    } else if (pdfFile) {
      source = "pdf";
      const pdfRes = await processPdfWithOptionalPass(
        pdfFile.path,
        aadhaar_pdf_passcode
      );
      parsed = pdfRes.parsed;
      const storedFilename = path.basename(pdfFile.path);
      const filePath = path.join(UPLOAD_DIR, storedFilename);
      const r = await client.query(
        `INSERT INTO kyc_files (user_id, customer_id, type, original_filename, stored_filename, file_path, mime, size_bytes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          userId,
          customerId,
          "aadhaar_pdf",
          pdfFile.originalname,
          storedFilename,
          filePath,
          pdfFile.mimetype,
          pdfRes.size || null,
        ]
      );
      fileId = r.rows[0].id;
    }

    // create xml artifact & store in kyc_files(xml_content)
    const xmlObj = {
      timestamp: new Date().toISOString(),
      source: "aadhaar",
      providedAadhaarLast4: aadhaar_no ? aadhaar_no.slice(-4) : null,
      parsedName: parsed?.name || null,
      parsedDob: parsed?.dob || null,
      parsedLast4: parsed?.aadhaar12 ? parsed.aadhaar12.slice(-4) : null,
      errors: null,
    };
    const savedXml = buildAndSaveXmlObj("aadhaar", xmlObj);
    const xmlInsert = await client.query(
      `INSERT INTO kyc_files (user_id, customer_id, type, original_filename, stored_filename, file_path, mime, size_bytes, xml_content) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        userId,
        customerId,
        "xml",
        savedXml.filename,
        savedXml.filename,
        savedXml.fullPath,
        "application/xml",
        Buffer.byteLength(savedXml.xmlString),
        savedXml.xmlString,
      ]
    );
    const xmlFileId = xmlInsert.rows[0].id;

    // compute confidence, decide status
    const conf = computeConfidence(parsed, { aadhaar_no });
    const recordStatus = decideRecordStatus(conf);
    const confidenceScore = conf.score || 0;

    // insert kyc_records
    const insertKycQ = `INSERT INTO kyc_records (user_id, customer_id, kyc_type, source, file_id, xml_file_id, parsed_json, confidence_score, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING id`;
    const kycRes = await client.query(insertKycQ, [
      userId,
      customerId,
      "AADHAAR",
      source,
      fileId,
      xmlFileId,
      parsed ? JSON.stringify(parsed) : null,
      confidenceScore,
      recordStatus,
    ]);
    const kycId = kycRes.rows[0].id;

    // update per-document status column and only overwrite aadhaar_no if provided
    await client.query(
      `UPDATE customerprofile SET latest_kyc_id = $1, aadhaar_kyc_status = $2, aadhaar_no = COALESCE(NULLIF($3,''), aadhaar_no) WHERE customer_id = $4`,
      [kycId, recordStatus, aadhaar_no || "", customerId]
    );

    // Fetch updated per-doc statuses to aggregate overall
    const after = await client.query(
      "SELECT aadhaar_kyc_status, pan_kyc_status, aadhaar_no, pan_no, latest_kyc_id FROM customerprofile WHERE customer_id = $1",
      [customerId]
    );
    const aadhaarKyc = after.rows[0]?.aadhaar_kyc_status ?? null;
    const panKyc = after.rows[0]?.pan_kyc_status ?? null;
    const overall = aggregateCustomerKycStatus(aadhaarKyc, panKyc);

    // update global kyc_status
    await client.query(
      "UPDATE customerprofile SET kyc_status = $1 WHERE customer_id = $2",
      [overall, customerId]
    );

    await client.query("COMMIT");

    // prepare response
    const safeParsed = sanitizeParsedForResponse(parsed);
    const matchFlags = {
      aadhaar_last4_match: !!(
        parsed?.aadhaar12 &&
        aadhaar_no &&
        String(aadhaar_no).slice(-4) === String(parsed.aadhaar12).slice(-4)
      ),
      dob_match: !!(
        parsed?.dob &&
        req.body?.dob &&
        String(req.body.dob) === String(parsed.dob)
      ),
    };

    const customerSnap = {
      customer_id: customerId,
      aadhaar_no: after.rows[0]?.aadhaar_no || null,
      pan_no: after.rows[0]?.pan_no || null,
      aadhaar_kyc_status: aadhaarKyc,
      pan_kyc_status: panKyc,
      kyc_status: overall,
      latest_kyc_id: after.rows[0]?.latest_kyc_id || null,
    };

    return res.json({
      ok: true,
      message: "Aadhaar KYC processed",
      record: {
        id: kycId,
        type: "AADHAAR",
        status: recordStatus,
        confidence: confidenceScore,
        confidenceReasons: conf.reasons || [],
        matchFlags,
        parsed: safeParsed,
        xmlDownloadRoute: `/api/kyc/download-xml/${xmlFileId}`,
        createdAt: new Date().toISOString(),
      },
      customer: customerSnap,
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("verifyAadhaar error:", err);
    try {
      if (req.files?.aadhaar_zip?.[0])
        safeUnlink(req.files.aadhaar_zip[0].path);
      if (req.files?.aadhaar_file?.[0])
        safeUnlink(req.files.aadhaar_file[0].path);
    } catch (_) {}
    return res.status(500).json({
      ok: false,
      error: "Failed to process Aadhaar",
      details: String(err?.message || err),
    });
  } finally {
    client.release();
  }
}

// POST /api/kyc/pan
export async function verifyPan(req, res) {
  const client = await pool.connect();
  const userId = req.user?.userId;
  if (!userId) {
    client.release();
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const pan_pdf_passcode = req.body?.pan_pdf_passcode ?? null;
  const providedPan = req.body?.pan_no
    ? String(req.body.pan_no).trim().toUpperCase()
    : null;

  try {
    await client.query("BEGIN");
    await ensurePerDocColumns(client);

    // ensure customerprofile exists
    const cpRes = await client.query(
      "SELECT customer_id, aadhaar_kyc_status, pan_kyc_status, aadhaar_no, pan_no, latest_kyc_id, kyc_status FROM customerprofile WHERE user_id = $1",
      [userId]
    );
    let customerId = cpRes.rows[0]?.customer_id || null;
    let existingAadhaarStatus = cpRes.rows[0]?.aadhaar_kyc_status ?? null;
    let existingPanStatus = cpRes.rows[0]?.pan_kyc_status ?? null;
    if (!customerId) {
      const ins = await client.query(
        "INSERT INTO customerprofile (user_id, full_name, created_at) VALUES ($1,$2,NOW()) RETURNING customer_id, aadhaar_kyc_status, pan_kyc_status, kyc_status",
        [userId, ""]
      );
      customerId = ins.rows[0].customer_id;
      existingAadhaarStatus = ins.rows[0].aadhaar_kyc_status ?? null;
      existingPanStatus = ins.rows[0].pan_kyc_status ?? null;
    }

    const pdfFile = req.files?.pan_file?.[0] ?? null;
    if (!pdfFile && !providedPan) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ ok: false, error: "Provide pan_no or upload pan_file" });
    }
    if (providedPan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(providedPan)) {
      if (pdfFile) safeUnlink(pdfFile.path);
      await client.query("ROLLBACK");
      return res.status(400).json({ ok: false, error: "Invalid PAN format" });
    }

    // process pdf (optional decrypt) and store
    let fileId = null;
    let parsed = null;
    if (pdfFile) {
      const pdfRes = await processPdfWithOptionalPass(
        pdfFile.path,
        pan_pdf_passcode
      );
      parsed = pdfRes.parsed;
      const storedFilename = path.basename(pdfFile.path);
      const filePath = path.join(UPLOAD_DIR, storedFilename);
      const r = await client.query(
        `INSERT INTO kyc_files (user_id, customer_id, type, original_filename, stored_filename, file_path, mime, size_bytes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          userId,
          customerId,
          "pan_pdf",
          pdfFile.originalname,
          storedFilename,
          filePath,
          pdfFile.mimetype,
          pdfRes.size || null,
        ]
      );
      fileId = r.rows[0].id;
    }

    // build xml artifact and store
    const xmlObj = {
      timestamp: new Date().toISOString(),
      source: "pan",
      providedPan: providedPan || null,
      parsedPan: parsed?.pan || null,
      parsedName: parsed?.name || null,
      parsedDob: parsed?.dob || null,
      errors: null,
    };
    const savedXml = buildAndSaveXmlObj("pan", xmlObj);
    const xmlInsert = await client.query(
      `INSERT INTO kyc_files (user_id, customer_id, type, original_filename, stored_filename, file_path, mime, size_bytes, xml_content) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        userId,
        customerId,
        "xml",
        savedXml.filename,
        savedXml.filename,
        savedXml.fullPath,
        "application/xml",
        Buffer.byteLength(savedXml.xmlString),
        savedXml.xmlString,
      ]
    );
    const xmlFileId = xmlInsert.rows[0].id;

    // compute confidence & status
    const conf = computeConfidence(parsed, { pan_no: providedPan });
    const confidenceScore = conf.score || 0;
    const recordStatus = decideRecordStatus(conf);

    // insert into kyc_records
    const insertKycQ = `INSERT INTO kyc_records (user_id, customer_id, kyc_type, source, file_id, xml_file_id, parsed_json, confidence_score, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING id`;
    const kycRes = await client.query(insertKycQ, [
      userId,
      customerId,
      "PAN",
      "pdf",
      fileId,
      xmlFileId,
      parsed ? JSON.stringify(parsed) : null,
      confidenceScore,
      recordStatus,
    ]);
    const kycId = kycRes.rows[0].id;

    // update per-document status and optionally pan_no
    await client.query(
      "UPDATE customerprofile SET latest_kyc_id = $1, pan_kyc_status = $2, pan_no = COALESCE(NULLIF($3,''), pan_no) WHERE customer_id = $4",
      [kycId, recordStatus, providedPan || "", customerId]
    );

    // fetch updated statuses
    const after = await client.query(
      "SELECT aadhaar_kyc_status, pan_kyc_status, aadhaar_no, pan_no, latest_kyc_id FROM customerprofile WHERE customer_id = $1",
      [customerId]
    );
    const aadhaarKyc = after.rows[0]?.aadhaar_kyc_status ?? null;
    const panKyc = after.rows[0]?.pan_kyc_status ?? null;
    const overall = aggregateCustomerKycStatus(aadhaarKyc, panKyc);

    await client.query(
      "UPDATE customerprofile SET kyc_status = $1 WHERE customer_id = $2",
      [overall, customerId]
    );

    await client.query("COMMIT");

    const safeParsed = sanitizeParsedForResponse(parsed);
    const matchFlags = {
      pan_match: !!(
        parsed?.pan &&
        providedPan &&
        String(providedPan).toUpperCase() === String(parsed.pan).toUpperCase()
      ),
      dob_match: !!(
        parsed?.dob &&
        req.body?.dob &&
        String(req.body.dob) === String(parsed.dob)
      ),
    };

    const customerSnap = {
      customer_id: customerId,
      aadhaar_no: after.rows[0]?.aadhaar_no || null,
      pan_no: after.rows[0]?.pan_no || null,
      aadhaar_kyc_status: aadhaarKyc,
      pan_kyc_status: panKyc,
      kyc_status: overall,
      latest_kyc_id: after.rows[0]?.latest_kyc_id || null,
    };

    return res.json({
      ok: true,
      message: "PAN KYC processed",
      record: {
        id: kycId,
        type: "PAN",
        status: recordStatus,
        confidence: confidenceScore,
        confidenceReasons: conf.reasons || [],
        matchFlags,
        parsed: safeParsed,
        xmlDownloadRoute: `/api/kyc/download-xml/${xmlFileId}`,
        createdAt: new Date().toISOString(),
      },
      customer: customerSnap,
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("verifyPan error:", err);
    try {
      if (req.files?.pan_file?.[0]) safeUnlink(req.files.pan_file[0].path);
    } catch (_) {}
    return res.status(500).json({
      ok: false,
      error: "Failed to process PAN",
      details: String(err?.message || err),
    });
  } finally {
    client.release();
  }
}

// GET /api/kyc/download-xml/:fileId
export async function downloadXml(req, res) {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    if (!userId)
      return res.status(401).json({ ok: false, error: "Unauthorized" });

    const fileId = req.params.fileId;
    if (!fileId)
      return res.status(400).json({ ok: false, error: "fileId required" });

    const r = await client.query(
      "SELECT id, user_id, mime, file_path, xml_content FROM kyc_files WHERE id = $1",
      [fileId]
    );
    if (!r.rows.length)
      return res.status(404).json({ ok: false, error: "File not found" });

    const fileRow = r.rows[0];

    // allow if owner OR admin
    const u = await client.query("SELECT role FROM users WHERE user_id = $1", [
      userId,
    ]);
    const role = u.rows[0]?.role || null;

    if (String(fileRow.user_id) !== String(userId) && role !== "ADMIN") {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    if (fileRow.xml_content) {
      res.setHeader("Content-Type", "application/xml");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="kyc_${fileId}.xml"`
      );
      return res.send(fileRow.xml_content);
    }

    const p = fileRow.file_path;
    if (p && fs.existsSync(p)) {
      const resolved = path.resolve(p);
      if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
        return res.status(500).json({ ok: false, error: "Invalid file path" });
      }
      return res.download(resolved, `kyc_${fileId}.xml`);
    }

    return res
      .status(404)
      .json({ ok: false, error: "XML content not available" });
  } catch (e) {
    console.error("downloadXml error:", e);
    return res.status(500).json({ ok: false, error: "Failed to retrieve XML" });
  } finally {
    client.release();
  }
}

// combined stub
export async function verifyDocuments(_req, res) {
  return res
    .status(501)
    .json({ ok: false, error: "Use /aadhaar or /pan routes" });
}

/**
 * Utility: fetch latest kyc_record for each type (AADHAAR, PAN) for a user.
 * Returns an object:
 * {
 *   aadhaar: { id, status, kyc_type, source, confidence_score, confidence_reasons, parsed, file_id, xml_file_id, created_at } | null,
 *   pan:     { ... } | null
 * }
 *
 * Note: parsed is sanitized (PII redacted) using sanitizeParsedForResponse.
 */
export async function getLatestKycForUser(userId) {
  if (!userId) throw new Error("userId required");

  const client = await pool.connect();
  try {
    const out = { aadhaar: null, pan: null };

    // We'll query latest AADHAAR and PAN separately (simpler & index-friendly)
    const types = ["AADHAAR", "PAN"];
    for (const t of types) {
      const q = `
        SELECT kr.id,
               kr.kyc_type,
               kr.source,
               kr.status,
               kr.confidence_score,
               kr.parsed_json,
               kr.parsed_json->'name' AS parsed_name,
               kr.created_at,
               kr.file_id,
               kr.xml_file_id,
               kr.notes,
               -- try to grab xml file path / existence from kyc_files (xml_file)
               kf.file_path AS xml_file_path,
               kf.xml_content IS NOT NULL AS has_xml_content
        FROM kyc_records kr
        LEFT JOIN kyc_files kf ON kf.id = kr.xml_file_id
        WHERE kr.user_id = $1 AND kr.kyc_type = $2
        ORDER BY kr.created_at DESC
        LIMIT 1
      `;
      const res = await client.query(q, [userId, t]);
      if (res.rows.length === 0) {
        out[t === "AADHAAR" ? "aadhaar" : "pan"] = null;
        continue;
      }
      const row = res.rows[0];

      // parsed_json may be JSONB or text, ensure we handle both
      let parsedRaw = null;
      if (row.parsed_json) {
        try {
          parsedRaw =
            typeof row.parsed_json === "string"
              ? JSON.parse(row.parsed_json)
              : row.parsed_json;
        } catch {
          parsedRaw = row.parsed_json;
        }
      }

      const sanitized = sanitizeParsedForResponse(parsedRaw);

      const result = {
        id: row.id,
        kyc_type: row.kyc_type,
        source: row.source,
        status: row.status,
        confidence_score: Number(row.confidence_score) || 0,
        // If you stored reasons separately, include them; otherwise leave empty array
        confidence_reasons: row.confidence_reasons || [],
        parsed: sanitized,
        parsed_raw_available: !!parsedRaw,
        file_id: row.file_id || null,
        xml_file_id: row.xml_file_id || null,
        has_xml_content: !!row.has_xml_content,
        xml_file_path: row.xml_file_path || null,
        notes: row.notes || null,
        created_at: row.created_at ? row.created_at.toISOString() : null,
      };

      out[t === "AADHAAR" ? "aadhaar" : "pan"] = result;
    }

    return out;
  } finally {
    client.release();
  }
}

/**
 * Express handler: GET /api/kyc/review/latest
 * Returns { ok: true, latest: { aadhaar:..., pan:... } } or error
 */
export async function getLatestKycForUserHandler(req, res) {
  const userId = req.user?.userId;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const latest = await getLatestKycForUser(userId);

    // Optionally: determine an overall quick summary for frontend convenience
    const summary = {
      aadhaar: latest.aadhaar
        ? {
            status: latest.aadhaar.status,
            confidence_score: latest.aadhaar.confidence_score,
            created_at: latest.aadhaar.created_at,
          }
        : null,
      pan: latest.pan
        ? {
            status: latest.pan.status,
            confidence_score: latest.pan.confidence_score,
            created_at: latest.pan.created_at,
          }
        : null,
    };

    return res.json({
      ok: true,
      latest,
      summary,
      note: "Sensitive PII is redacted in `latest.*.parsed`. Use /api/kyc/download-xml/:fileId to fetch XML securely if authorized.",
    });
  } catch (err) {
    console.error("getLatestKycForUserHandler error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch latest KYC",
      details: String(err?.message || err),
    });
  }
}
