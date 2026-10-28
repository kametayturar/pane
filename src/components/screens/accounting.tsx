"use client"

import * as React from "react"
import { BookOpenText, Check, ChevronDown, Download, Flag, FlaskConical, Landmark, LayoutDashboard, Link2, ListChecks, Menu, PenLine, Plus, Radar, Search, Send, Trash2, Wallet, X, type LucideIcon } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Tab = "reconcile" | "invoices" | "ledger" | "reports"
type Group = "Assets" | "Liabilities" | "Equity" | "Income" | "Expenses"
type Section = "cos" | "opex" | "fin"
type Account = { code: string; name: string; group: Group; section?: Section }
type Source = "bank" | "invoice" | "bill" | "payroll" | "stripe" | "manual" | "agent"
type JLine = { acct: string; dr: number; cr: number }
type Journal = { id: string; key: string; date: string; ref: string; memo: string; src: Source; lines: JLine[] }
type InvStatus = "Draft" | "Sent" | "Overdue" | "Paid"
type InvLine = { desc: string; qty: number; unit: number }
type Invoice = {
  id: string
  customer: string
  contact: string
  email: string
  issued: string
  paidOn?: string
  draft?: boolean
  vat: number
  reminders: number
  lines: InvLine[]
  po?: string
}
type BankLine = {
  id: string
  date: string
  desc: string
  ref: string
  amt: number
  match?: { key: string; conf: number; note: string }
  suggest?: { acct: string; memo: string; vat?: boolean; note: string }
}

/* -------------------------------------------------------------------------- */
/*                         Money, dates and formatting                        */
/* -------------------------------------------------------------------------- */

/** Pounds to integer pence. Every amount in this file is integer pence. */
const P = (n: number) => Math.round(n * 100)
const nf = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** 1,234.50 (no sign). */
const money = (p: number) => nf.format(Math.abs(p) / 100)
/** 1,234.50 or (1,234.50) when negative. */
const paren = (p: number) => (p < 0 ? `(${money(p)})` : money(p))
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const dShort = (iso: string) => `${+iso.slice(8, 10)} ${MON[+iso.slice(5, 7) - 1]}`
const dLong = (iso: string) => `${+iso.slice(8, 10)} ${MON[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}`
const dayNum = (iso: string) => Math.round(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000)
const addDays = (iso: string, n: number) => new Date((dayNum(iso) + n) * 86400000).toISOString().slice(0, 10)
const pctText = (a: number, b: number) => {
  if (b === 0) return "n/m"
  const v = ((a - b) / Math.abs(b)) * 100
  const s = Math.abs(v).toFixed(1) + "%"
  return v < 0 ? `(${s})` : s
}

/** "1,234.5" or "1234.50" to pence, or null when it is not a valid amount. */
function parseMoney(s: string): number | null {
  const t = s.replace(/[£,\s]/g, "")
  if (t === "") return 0
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null
  return Math.round(parseFloat(t) * 100)
}

const AS_AT = "2026-10-31"
const PERIOD_START = "2026-10-01"

/* -------------------------------------------------------------------------- */
/*                            Chart of accounts                               */
/* -------------------------------------------------------------------------- */

const ACCOUNTS: Account[] = [
  { code: "1010", name: "Operating account", group: "Assets" },
  { code: "1020", name: "Reserve savings", group: "Assets" },
  { code: "1030", name: "Card-payments clearing", group: "Assets" },
  { code: "1040", name: "Petty cash float", group: "Assets" },
  { code: "1100", name: "Trade debtors", group: "Assets" },
  { code: "1200", name: "Stock", group: "Assets" },
  { code: "1300", name: "Prepayments", group: "Assets" },
  { code: "1500", name: "Fixtures & equipment, cost", group: "Assets" },
  { code: "1510", name: "Accum. depreciation", group: "Assets" },
  { code: "2000", name: "Trade creditors", group: "Liabilities" },
  { code: "2100", name: "VAT control", group: "Liabilities" },
  { code: "2200", name: "PAYE, NIC & pensions", group: "Liabilities" },
  { code: "2300", name: "Accruals", group: "Liabilities" },
  { code: "2400", name: "Deferred income & deposits", group: "Liabilities" },
  { code: "2600", name: "Term loan", group: "Liabilities" },
  { code: "3000", name: "Share capital", group: "Equity" },
  { code: "3100", name: "Retained earnings, to 30 Sep", group: "Equity" },
  { code: "4000", name: "Online sales", group: "Income" },
  { code: "4100", name: "Wholesale sales", group: "Income" },
  { code: "4200", name: "Delivery charges", group: "Income" },
  { code: "5000", name: "Cost of goods sold", group: "Expenses", section: "cos" },
  { code: "5100", name: "Freight & duty", group: "Expenses", section: "cos" },
  { code: "5200", name: "Payment processing fees", group: "Expenses", section: "cos" },
  { code: "6000", name: "Salaries & wages", group: "Expenses", section: "opex" },
  { code: "6010", name: "Employer NIC & pension", group: "Expenses", section: "opex" },
  { code: "6100", name: "Rent & rates", group: "Expenses", section: "opex" },
  { code: "6200", name: "Marketing", group: "Expenses", section: "opex" },
  { code: "6300", name: "Software & subscriptions", group: "Expenses", section: "opex" },
  { code: "6400", name: "Utilities", group: "Expenses", section: "opex" },
  { code: "6500", name: "Professional fees", group: "Expenses", section: "opex" },
  { code: "6600", name: "Courier & fulfilment", group: "Expenses", section: "opex" },
  { code: "6700", name: "Depreciation", group: "Expenses", section: "opex" },
  { code: "6800", name: "Bank charges", group: "Expenses", section: "opex" },
  { code: "6900", name: "Insurance", group: "Expenses", section: "opex" },
  { code: "6950", name: "Travel & subsistence", group: "Expenses", section: "opex" },
  { code: "7000", name: "Loan interest", group: "Expenses", section: "fin" },
]
const ACCT = new Map(ACCOUNTS.map((a) => [a.code, a]))
const GROUPS: Group[] = ["Assets", "Liabilities", "Equity", "Income", "Expenses"]
/** Debit-normal groups. Everything else is credit-normal. */
const debitNormal = (g: Group) => g === "Assets" || g === "Expenses"

/** Signed opening balances at 1 Oct (debit positive). P&L accounts open at nil. */
const OPEN: Record<string, number> = {
  "1010": P(121582.52),
  "1020": P(40000),
  "1030": P(3115.42),
  "1040": P(150),
  "1100": P(39390),
  "1200": P(121880),
  "1300": P(7180),
  "1500": P(64800),
  "1510": -P(22950),
  "2000": -P(24910.2),
  "2100": -P(25692.9),
  "2200": -P(9920),
  "2300": -P(2780),
  "2400": -P(4950),
  "2600": -P(60000),
  "3000": -P(10000),
}
// Retained earnings to 30 Sep is the balancing figure of the opening trial balance.
OPEN["3100"] = -Object.values(OPEN).reduce((s, v) => s + v, 0)

/** September activity for the P&L comparison (income and costs, positive). */
const SEP: Record<string, number> = {
  "4000": P(88210),
  "4100": P(29640),
  "4200": P(3860),
  "5000": P(48110),
  "5100": P(3790),
  "5200": P(2098.35),
  "6000": P(27600),
  "6010": P(4140),
  "6100": P(6850),
  "6200": P(7920),
  "6300": P(1492),
  "6400": P(984.2),
  "6500": P(1200),
  "6600": P(4870),
  "6700": P(1350),
  "6800": P(198.65),
  "6900": P(460),
  "6950": P(142.3),
  "7000": P(390),
}

/* -------------------------------------------------------------------------- */
/*                          October journal (posted)                          */
/* -------------------------------------------------------------------------- */

type RawLine = [acct: string, dr: number, cr: number]
let jn = 400
function J(key: string, date: string, ref: string, src: Source, memo: string, ...lines: RawLine[]): Journal {
  jn += 1
  return {
    id: `JE-0${jn}`,
    key,
    date,
    ref,
    memo,
    src,
    lines: lines.map(([acct, dr, cr]) => ({ acct, dr: P(dr), cr: P(cr) })),
  }
}
const stripe = (key: string, date: string, n: number, net: number, fee: number): Journal =>
  J(key, date, `PO-${n}`, "stripe", `Card payout ${n} of 5, net of fees`, ["1010", net, 0], ["5200", fee, 0], ["1030", 0, +(net + fee).toFixed(2)])
const summary = (key: string, date: string, we: string, online: number, delivery: number): Journal => {
  const net = online + delivery
  const vat = +(net * 0.2).toFixed(2)
  return J(key, date, `WS-${we}`, "agent", `Online sales summary, week ending ${we}`, ["1030", +(net + vat).toFixed(2), 0], ["4000", 0, online], ["4200", 0, delivery], ["2100", 0, vat])
}
const sale = (key: string, date: string, no: string, cust: string, net: number, vatRate: number): Journal => {
  const vat = +(net * vatRate).toFixed(2)
  return J(key, date, no, "invoice", `Sales invoice, ${cust}`, ["1100", +(net + vat).toFixed(2), 0], ["4100", 0, net], ...(vat ? ([["2100", 0, vat]] as RawLine[]) : []))
}
const receipt = (key: string, date: string, no: string, cust: string, amt: number): Journal =>
  J(key, date, `RC-${no.slice(4)}`, "bank", `Receipt ${no}, ${cust}`, ["1010", amt, 0], ["1100", 0, amt])
const bill = (key: string, date: string, ref: string, sup: string, acct: string, net: number, memo: string): Journal => {
  const vat = +(net * 0.2).toFixed(2)
  return J(key, date, ref, "bill", `${sup}, ${memo}`, [acct, net, 0], ["2100", vat, 0], ["2000", 0, +(net + vat).toFixed(2)])
}
const pay = (key: string, date: string, ref: string, sup: string, amt: number, memo = "Supplier payment"): Journal =>
  J(key, date, ref, "bank", `${memo}, ${sup}`, ["2000", amt, 0], ["1010", 0, amt])

const JOURNAL0: Journal[] = [
  J("rent", "2026-10-01", "SO-1001", "bank", "Standing order, Quayside Properties, October rent", ["6100", 6850, 0], ["1010", 0, 6850]),
  sale("inv2041", "2026-10-01", "INV-2041", "Nordhaven Interiors", 4500, 0.2),
  bill("bill5531", "2026-10-02", "BILL-5531", "Kiln & Loom Ceramics", "1200", 14200, "stoneware"),
  J("sw", "2026-10-03", "DD-0310", "bank", "Direct debit, Cartwright Commerce, storefront platform", ["6300", 1540, 0], ["2100", 308, 0], ["1010", 0, 1848]),
  stripe("po1", "2026-10-03", 1, 24716.3, 515.1),
  bill("bill5534", "2026-10-05", "BILL-5534", "Haulwell Freight", "5100", 4120, "inbound freight"),
  pay("pay-kiln-sep", "2026-10-05", "FP-0905", "Kiln & Loom Ceramics", 13140.2, "September bills"),
  sale("inv2044", "2026-10-05", "INV-2044", "Marlow House Stores", 4900, 0.2),
  receipt("rcpt2020", "2026-10-06", "INV-2020", "Bramble Hall", 7440),
  J("ins", "2026-10-06", "PP-1006", "manual", "Release prepaid insurance, October", ["6900", 460, 0], ["1300", 0, 460]),
  J("vat-aug", "2026-10-07", "VAT-0826", "bank", "VAT return, period to 31 Aug, paid to HMRC", ["2100", 12418.6, 0], ["1010", 0, 12418.6]),
  summary("ws07", "2026-10-07", "7 Oct", 21840, 1020),
  pay("pay-linen-1", "2026-10-08", "FP-0908", "Northern Linen Mills", 6720, "September bills"),
  bill("bill8820", "2026-10-08", "PR-8820", "Parcelrun Logistics", "6600", 2640, "courier, 1 to 7 Oct"),
  bill("bill5538", "2026-10-09", "BILL-5538", "Northern Linen Mills", "1200", 9600, "linen throws and napkins"),
  bill("bill5539", "2026-10-09", "BILL-5539", "Lumen Wax & Glass", "1200", 7300, "candles and carafes"),
  stripe("po2", "2026-10-10", 2, 27803.55, 498.35),
  sale("inv2047", "2026-10-12", "INV-2047", "Nordhaven Interiors", 5400, 0.2),
  pay("chq100485", "2026-10-12", "CHQ-100485", "Oakridge Timber Co.", 3644.6, "Cheque 100485, September bills"),
  receipt("rcpt2024", "2026-10-13", "INV-2024", "The Cottage Shelf", 6150),
  bill("bill5541", "2026-10-14", "BILL-5541", "Hartley & Voss Accountants", "6500", 1450, "bookkeeping review"),
  summary("ws14", "2026-10-14", "14 Oct", 23160, 1090),
  J("energy", "2026-10-14", "DD-1014", "bank", "Direct debit, Calder Energy, warehouse and shop", ["6400", 1120.55, 0], ["2100", 224.11, 0], ["1010", 0, 1344.66]),
  pay("pay-kiln-2", "2026-10-14", "FP-1014", "Kiln & Loom Ceramics", 17040),
  bill("bill5544", "2026-10-16", "BILL-5544", "Oakridge Timber Co.", "1200", 6850, "oak boards"),
  pay("chq100486", "2026-10-16", "CHQ-100486", "Haulwell Freight", 4944, "Cheque 100486"),
  stripe("po3", "2026-10-17", 3, 29114.61, 531.2),
  pay("pay-parcel-1", "2026-10-17", "FP-1017", "Parcelrun Logistics", 3168),
  sale("inv2049", "2026-10-19", "INV-2049", "Larkspur & Lane", 6600, 0.2),
  bill("bill5547", "2026-10-20", "BILL-5547", "Fieldmark Digital", "6200", 6400, "autumn campaign fee"),
  summary("ws21", "2026-10-21", "21 Oct", 24580, 1140),
  bill("bill8836", "2026-10-21", "PR-8836", "Parcelrun Logistics", "6600", 2670, "courier, 8 to 20 Oct"),
  J("hmrc", "2026-10-22", "FP-2210", "bank", "HMRC PAYE/NIC and pension remittance, September payroll", ["2200", 9920, 0], ["1010", 0, 9920]),
  pay("pay-linen-2", "2026-10-23", "FP-1023", "Northern Linen Mills", 11520),
  receipt("rcpt2029", "2026-10-23", "INV-2029", "Larkspur & Lane", 8100),
  stripe("po4", "2026-10-24", 4, 22980.4, 412.75),
  sale("inv2053", "2026-10-26", "INV-2053", "Bramble Hall", 4300, 0.2),
  J("ads", "2026-10-27", "CARD-1027", "bank", "Card charge, ad platform, October spend", ["6200", 3240, 0], ["1010", 0, 3240]),
  pay("pay-lumen", "2026-10-27", "FP-1027", "Lumen Wax & Glass", 8760),
  bill("bill5552", "2026-10-28", "BILL-5552", "Kiln & Loom Ceramics", "1200", 8400, "winter range"),
  summary("ws28", "2026-10-28", "28 Oct", 19730, 640),
  J("payroll", "2026-10-28", "PAY-1028", "payroll", "October payroll, 14 staff", ["6000", 28400, 0], ["6010", 4260, 0], ["1010", 0, 22430], ["2200", 0, 10230]),
  receipt("rcpt2041", "2026-10-28", "INV-2041", "Nordhaven Interiors", 5400),
  J("loan", "2026-10-28", "DD-1028", "bank", "Direct debit, term loan interest", ["7000", 375, 0], ["1010", 0, 375]),
  sale("inv2055", "2026-10-29", "INV-2055", "Kinsale Home Ltd, export, zero-rated", 5650, 0),
  pay("pay-parcel-2", "2026-10-29", "FP-1029", "Parcelrun Logistics", 3204),
  pay("pay-hartley", "2026-10-29", "FP-1029B", "Hartley & Voss Accountants", 1740),
  J("deposit", "2026-10-29", "DEP-0412", "manual", "Customer deposit, custom oak dining set, J. Whitaker", ["1010", 480, 0], ["2400", 0, 480]),
  receipt("rcpt2044", "2026-10-30", "INV-2044", "Marlow House Stores", 5880),
  stripe("po5", "2026-10-30", 5, 14060.4, 319),
  J("petty", "2026-10-30", "PC-1030", "manual", "Petty cash top-up, cash drawn from bank", ["1040", 250, 0], ["1010", 0, 250]),
  summary("ws31", "2026-10-31", "31 Oct", 7110, 290),
  J("bankchg", "2026-10-31", "BC-1031", "bank", "Bank charges, account fee and card-machine fees", ["6800", 214.3, 0], ["1010", 0, 214.3]),
  J("cogs", "2026-10-31", "STK-1031", "agent", "Stock relieved to cost of goods sold, October count", ["5000", 52340, 0], ["1200", 0, 52340]),
  J("depn", "2026-10-31", "DEP-1031", "manual", "Depreciation, fixtures and equipment, October", ["6700", 1350, 0], ["1510", 0, 1350]),
]

/* -------------------------------------------------------------------------- */
/*                                  Invoices                                  */
/* -------------------------------------------------------------------------- */

const L = {
  mug: { desc: "Stoneware mug set, 4 pc", unit: P(18) },
  throw: { desc: "Linen throw, Fjord", unit: P(42.5) },
  board: { desc: "Oak serving board", unit: P(36) },
  candle: { desc: "Beeswax candles, box of 6", unit: P(9.5) },
  planter: { desc: "Ceramic planter set", unit: P(34) },
  carafe: { desc: "Glass carafe, 1 L", unit: P(15) },
  napkin: { desc: "Cotton napkins, set of 4", unit: P(14) },
  towel: { desc: "Linen tea towels, pair", unit: P(11) },
}
const ln = (k: keyof typeof L, qty: number): InvLine => ({ ...L[k], qty })
const carriage = (n: number): InvLine => ({ desc: "Carriage", qty: 1, unit: P(n) })

const INVOICES: Invoice[] = [
  { id: "INV-2057", customer: "Pellam Home Co.", contact: "Maren", email: "ap@pellamhome.example", issued: "2026-11-04", draft: true, vat: 0.2, reminders: 0, lines: [ln("planter", 40), ln("carafe", 48), ln("napkin", 80)] },
  { id: "INV-2056", customer: "Oaken Row Interiors", contact: "Jonah", email: "accounts@oakenrow.example", issued: "2026-11-03", draft: true, vat: 0.2, reminders: 0, lines: [ln("board", 40), ln("carafe", 64)] },
  { id: "INV-2055", customer: "Kinsale Home Ltd", contact: "Siobhan", email: "accounts@kinsalehome.example", issued: "2026-10-29", vat: 0, reminders: 0, po: "PO KH-0877", lines: [ln("throw", 60), ln("board", 50), ln("mug", 60), ln("towel", 20)] },
  { id: "INV-2053", customer: "Bramble Hall", contact: "Hugo", email: "accounts@bramblehall.example", issued: "2026-10-26", vat: 0.2, reminders: 0, po: "PO 4471", lines: [ln("planter", 50), ln("throw", 40), ln("candle", 60), ln("towel", 30)] },
  { id: "INV-2049", customer: "Larkspur & Lane", contact: "Rosa", email: "accounts@larkspurlane.example", issued: "2026-10-19", vat: 0.2, reminders: 0, po: "PO LL-209", lines: [ln("mug", 100), ln("carafe", 80), ln("board", 60), ln("candle", 100), ln("napkin", 35)] },
  { id: "INV-2047", customer: "Nordhaven Interiors", contact: "Freya", email: "payables@nordhaven.example", issued: "2026-10-12", vat: 0.2, reminders: 0, po: "PO 7730", lines: [ln("throw", 40), ln("board", 50), ln("planter", 50), carriage(200)] },
  { id: "INV-2044", customer: "Marlow House Stores", contact: "Teodor", email: "ledger@marlowhouse.example", issued: "2026-10-05", paidOn: "2026-10-30", vat: 0.2, reminders: 0, lines: [ln("throw", 40), ln("mug", 100), ln("napkin", 100)] },
  { id: "INV-2041", customer: "Nordhaven Interiors", contact: "Freya", email: "payables@nordhaven.example", issued: "2026-10-01", paidOn: "2026-10-28", vat: 0.2, reminders: 0, po: "PO 7702", lines: [ln("throw", 40), ln("board", 40), ln("planter", 40)] },
  { id: "INV-2036", customer: "Tidewater Living", contact: "Noor", email: "finance@tidewaterliving.example", issued: "2026-09-18", vat: 0.2, reminders: 1, lines: [ln("planter", 40), ln("throw", 20), ln("napkin", 40)] },
  { id: "INV-2031", customer: "Ashgrove Gifts", contact: "Callum", email: "office@ashgrovegifts.example", issued: "2026-09-09", vat: 0.2, reminders: 1, lines: [ln("candle", 80), ln("mug", 20), ln("towel", 40)] },
  { id: "INV-2029", customer: "Larkspur & Lane", contact: "Rosa", email: "accounts@larkspurlane.example", issued: "2026-09-04", paidOn: "2026-10-23", vat: 0.2, reminders: 1, lines: [ln("mug", 100), ln("board", 60), ln("planter", 60), ln("carafe", 50)] },
  { id: "INV-2027", customer: "Fenwick & Dray", contact: "Isla", email: "accounts@fenwickdray.example", issued: "2026-09-02", vat: 0.2, reminders: 1, lines: [ln("board", 30), ln("carafe", 48)] },
  { id: "INV-2024", customer: "The Cottage Shelf", contact: "Wren", email: "hello@cottageshelf.example", issued: "2026-08-31", paidOn: "2026-10-13", vat: 0.2, reminders: 1, lines: [ln("throw", 50), ln("board", 50), ln("carafe", 80)] },
  { id: "INV-2022", customer: "Marlow House Stores", contact: "Teodor", email: "ledger@marlowhouse.example", issued: "2026-08-22", vat: 0.2, reminders: 2, lines: [ln("throw", 16), ln("mug", 40), ln("towel", 40)] },
  { id: "INV-2020", customer: "Bramble Hall", contact: "Hugo", email: "accounts@bramblehall.example", issued: "2026-08-18", paidOn: "2026-10-06", vat: 0.2, reminders: 2, lines: [ln("throw", 60), ln("board", 50), ln("planter", 50), carriage(150)] },
  { id: "INV-2018", customer: "Pellam Home Co.", contact: "Maren", email: "ap@pellamhome.example", issued: "2026-08-14", vat: 0.2, reminders: 2, lines: [ln("planter", 40), ln("carafe", 48), ln("napkin", 80)] },
  { id: "INV-2012", customer: "Oaken Row Interiors", contact: "Jonah", email: "accounts@oakenrow.example", issued: "2026-06-28", vat: 0.2, reminders: 3, lines: [ln("mug", 60), ln("throw", 20), ln("board", 30), ln("candle", 60)] },
]

const invNet = (i: Invoice) => i.lines.reduce((s, l) => s + l.qty * l.unit, 0)
const invVat = (i: Invoice) => Math.round(invNet(i) * i.vat)
const invTotal = (i: Invoice) => invNet(i) + invVat(i)
const invDue = (i: Invoice) => addDays(i.issued, 30)
const invStatus = (i: Invoice): InvStatus => (i.draft ? "Draft" : i.paidOn ? "Paid" : invDue(i) < AS_AT ? "Overdue" : "Sent")
const daysOver = (i: Invoice) => dayNum(AS_AT) - dayNum(invDue(i))

type Bucket = { key: "cur" | "d30" | "d60" | "d60p"; label: string; amt: number; n: number; level: number }
function aging(invs: Invoice[]): Bucket[] {
  const b: Bucket[] = [
    { key: "cur", label: "Current", amt: 0, n: 0, level: 0.12 },
    { key: "d30", label: "1–30 days", amt: 0, n: 0, level: 0.32 },
    { key: "d60", label: "31–60 days", amt: 0, n: 0, level: 0.58 },
    { key: "d60p", label: "60+ days", amt: 0, n: 0, level: 0.88 },
  ]
  for (const i of invs) {
    const s = invStatus(i)
    if (s === "Draft" || s === "Paid") continue
    const d = daysOver(i)
    const k = d <= 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : 3
    b[k].amt += invTotal(i)
    b[k].n += 1
  }
  return b
}

/* -------------------------------------------------------------------------- */
/*                                Bank feed                                   */
/* -------------------------------------------------------------------------- */

const BANK: BankLine[] = [
  { id: "B01", date: "2026-10-22", desc: "FPO HMRC PAYE/NIC 120/GB47291", ref: "FP 2210 0418", amt: -P(9920), match: { key: "hmrc", conf: 0.98, note: "Reference and amount agree" } },
  { id: "B02", date: "2026-10-26", desc: "CARD RAIL TICKETS LDN 0398", ref: "CARD 0398", amt: -P(186.4), suggest: { acct: "6950", memo: "Rail fares, supplier visit", note: "No ledger entry. Looks like the 24 Oct supplier visit." } },
  { id: "B03", date: "2026-10-27", desc: "CARD ADPLATFORM 8841 EU", ref: "CARD 8841", amt: -P(3240), match: { key: "ads", conf: 0.95, note: "Same amount, booked the same day" } },
  { id: "B04", date: "2026-10-28", desc: "BACS PAYROLL OCT HARBOR FINCH", ref: "BACS 0043", amt: -P(22430), match: { key: "payroll", conf: 0.99, note: "Net pay of the October payroll" } },
  { id: "B05", date: "2026-10-28", desc: "DD TERM LOAN INT 7701", ref: "DD 7701", amt: -P(375), match: { key: "loan", conf: 0.96, note: "Standing monthly interest" } },
  { id: "B06", date: "2026-10-29", desc: "BGC NORDHAVEN INTERIORS INV2041", ref: "BGC 2041", amt: P(5400), match: { key: "rcpt2041", conf: 0.99, note: "Invoice number in reference; ledger booked 28 Oct from remittance" } },
  { id: "B07", date: "2026-10-29", desc: "FPO PARCELRUN LOGISTICS 8836", ref: "FP 2910 0207", amt: -P(3204), match: { key: "pay-parcel-2", conf: 0.99, note: "Bill PR-8836 paid in full" } },
  { id: "B08", date: "2026-10-29", desc: "FPO HARTLEY VOSS ACCTS", ref: "FP 2910 0318", amt: -P(1740), match: { key: "pay-hartley", conf: 0.97, note: "Payee name shortened by the bank" } },
  { id: "B09", date: "2026-10-29", desc: "FPI J WHITAKER", ref: "FP 2910 0551", amt: P(480), match: { key: "deposit", conf: 0.62, note: "Amount matches the Whitaker deposit, but the payer reference is only an initial and surname" } },
  { id: "B10", date: "2026-10-30", desc: "BGC MARLOW HOUSE STORES", ref: "BGC 2044", amt: P(5880), match: { key: "rcpt2044", conf: 0.98, note: "Invoice INV-2044 settled in full" } },
  { id: "B11", date: "2026-10-30", desc: "STRIPE PAYOUT PO_4F21", ref: "PO 4F21", amt: P(14060.4), match: { key: "po5", conf: 0.99, note: "Payout 5 of 5, fees already split out" } },
  { id: "B12", date: "2026-10-30", desc: "ATM WITHDRAWAL HIGH ST 0930", ref: "ATM 0930", amt: -P(250), match: { key: "petty", conf: 0.94, note: "Cash drawn for the petty cash float" } },
  { id: "B13", date: "2026-10-30", desc: "DD ORIEL PACKAGING", ref: "DD 6120", amt: -P(318), suggest: { acct: "6600", memo: "Oriel Packaging, mailers and tape", vat: true, note: "No entry and no open bill. £318.00 reads as £265.00 plus VAT." } },
  { id: "B14", date: "2026-10-30", desc: "ACCT FEE + CARD MCHT FEES OCT", ref: "CHG OCT", amt: -P(214.3), match: { key: "bankchg", conf: 0.88, note: "Same amount; ledger booked 31 Oct, bank posted 30 Oct" } },
]
/** Ledger entries that are in the books and not yet on the statement (cheques not presented). */
const OUTSTANDING = ["chq100485", "chq100486"]

/* -------------------------------------------------------------------------- */
/*                                  Derivation                                */
/* -------------------------------------------------------------------------- */

/** Signed closing balance of every account (debit positive). */
function balances(journal: Journal[]): Record<string, number> {
  const b: Record<string, number> = {}
  for (const a of ACCOUNTS) b[a.code] = OPEN[a.code] ?? 0
  for (const j of journal) for (const l of j.lines) b[l.acct] += l.dr - l.cr
  return b
}
/** Movement of one account in the period, debit positive. */
function activity(journal: Journal[], code: string) {
  let dr = 0
  let cr = 0
  for (const j of journal) {
    for (const l of j.lines) {
      if (l.acct !== code) continue
      dr += l.dr
      cr += l.cr
    }
  }
  return { dr, cr }
}
/** Balance as a natural-direction amount: negative means the opposite side (shown in parentheses). */
const natural = (code: string, signed: number) => (debitNormal(ACCT.get(code)!.group) ? signed : -signed)
/** Income and cost amounts for the period, positive in their own direction. */
const pnlAmount = (journal: Journal[], code: string) => {
  const { dr, cr } = activity(journal, code)
  return ACCT.get(code)!.group === "Income" ? cr - dr : dr - cr
}
/** Cash on hand and in the bank: accounts 1010 to 1040. */
const cashOf = (b: Record<string, number>) => b["1010"] + b["1020"] + b["1030"] + b["1040"]
/** Signed amount a journal posts to one account. */
const lineFor = (j: Journal, code: string) => j.lines.filter((l) => l.acct === code).reduce((s, l) => s + (l.dr - l.cr), 0)

/** Statement closing balance: constant, derived from the books as first handed to the close. */
const STATEMENT = (() => {
  const b = balances(JOURNAL0)["1010"]
  const chq = OUTSTANDING.reduce((s, k) => s + lineFor(JOURNAL0.find((j) => j.key === k)!, "1010"), 0)
  const unbooked = BANK.filter((x) => x.suggest).reduce((s, x) => s + x.amt, 0)
  return b - chq + unbooked
})()

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.iac {
  --iac-paper: #fafafa;
  --iac-sheet: #ffffff;
  --iac-ink: #0a0a0a;
  --iac-signal: #0060e2;
  --iac-accent: var(--iac-signal);
  --iac-surface: var(--iac-sheet);
  --iac-signal-soft: color-mix(in oklab, var(--iac-accent) 12%, transparent);
  --iac-t1: color-mix(in oklab, var(--iac-ink) 92%, transparent);
  --iac-t2: color-mix(in oklab, var(--iac-ink) 64%, transparent);
  --iac-t3: color-mix(in oklab, var(--iac-ink) 44%, transparent);
  --iac-t4: color-mix(in oklab, var(--iac-ink) 22%, transparent);
  --iac-rule: color-mix(in oklab, var(--iac-ink) 14%, transparent);
  --iac-rule-2: color-mix(in oklab, var(--iac-ink) 7%, transparent);
  --iac-hover: color-mix(in oklab, var(--iac-ink) 3.5%, transparent);
  --iac-ok: #1f8a4c; --iac-warn: #b7791f; --iac-bad: #c4321a;
  --iac-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --iac-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --iac-font: var(--iac-sans);
  --iac-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --iac-ease: cubic-bezier(.2, .8, .2, 1);
  --iac-ease-trace: cubic-bezier(.65, 0, .35, 1);
  font: 13px/20px var(--iac-font); color: var(--iac-t1);
  -webkit-font-smoothing: antialiased; text-align: left;
  position: relative; display: flex;
  height: 100%; min-height: 0; overflow: hidden; background: var(--iac-paper);
}
:is(.dark, [data-theme="dark"]) .iac {
  --iac-paper: #0c0c0d; --iac-sheet: #1c1c1e; --iac-ink: #f5f5f5; --iac-signal: #4d8dff;
  --iac-ok: #4cc27f; --iac-warn: #e0a64a; --iac-bad: #ff7a62;
}
.iac *, .iac *::before, .iac *::after { box-sizing: border-box }
:where(.iac) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.iac) input, :where(.iac) select, :where(.iac) textarea { font: inherit; color: inherit; margin: 0 }
:where(.iac) ul, :where(.iac) ol { list-style: none; margin: 0; padding: 0 }
:where(.iac) h1, :where(.iac) h2, :where(.iac) h3, :where(.iac) p { margin: 0; font-weight: inherit }
.iac :focus-visible { outline: 2px solid color-mix(in oklab, var(--iac-accent) 60%, transparent); outline-offset: 1px }
.iac button:disabled { cursor: not-allowed }
.iac-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Type */
.iac-lab { font: 500 10.5px/16px var(--iac-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iac-t3); white-space: nowrap }
.iac-num { font-family: var(--iac-mono); font-variant-numeric: tabular-nums; font-feature-settings: "tnum" }
.iac-u { font: 500 10.5px/16px var(--iac-mono); letter-spacing: .06em; color: var(--iac-t3) }
.iac-caret { display: inline-block; width: 6px; height: 1em; margin-left: 2px; vertical-align: -.14em; background: var(--iac-ink); opacity: .7 }

/* ---- rail ---- */
.iac-rlab { font-family: var(--iac-mono); font-size: 10.5px; line-height: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--iac-t3) }
.iac-rail { width: 232px; flex: none; display: flex; flex-direction: column; background: var(--iac-sheet); border-right: 1px solid var(--iac-rule); min-height: 0; overflow-y: auto; z-index: 30 }
.iac-brand { display: flex; align-items: center; gap: 9px; padding: 15px 18px 14px; font: 400 20px/24px var(--iac-serif); letter-spacing: -.01em; color: var(--iac-ink) }
.iac-brand svg { flex: none }
.iac-rgroup { padding: 0 12px; margin-top: 12px }
.iac-rgroup > .iac-rlab { padding: 0 6px; margin-bottom: 6px; display: block }
.iac-ws { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 32px; padding: 0 10px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-paper); color: var(--iac-t1); transition: box-shadow .2s var(--iac-ease) }
.iac-ws:hover { box-shadow: 0 0 0 1px var(--iac-t4) }
.iac-ws svg { color: var(--iac-t3) }
.iac-rnav { position: relative; margin: 0 0 0 8px; padding: 0 }
.iac-rnav::before { content: ""; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--iac-rule) }
.iac-ritem { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; height: 30px; padding: 0 8px 0 16px; color: var(--iac-t2); border-radius: 0 2px 2px 0; transition: color .2s var(--iac-ease), background-color .2s var(--iac-ease) }
.iac-ritem:hover { color: var(--iac-t1); background: var(--iac-rule-2) }
.iac-ritem svg { flex: none; stroke-width: 1.5 }
.iac-ritem.is-active { color: var(--iac-ink) }
.iac-ritem.is-active::before { content: ""; position: absolute; left: -1px; top: 5px; bottom: 5px; width: 2px; background: var(--iac-accent); transform-origin: top; animation: iac-rtick .5s var(--iac-ease) backwards }
.iac-ragent { padding-left: 16px }
.iac-rdot { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--iac-t4); position: relative }
.iac-rdot.ok { background: var(--iac-ok) }
.iac-rdot.live { background: var(--iac-accent) }
.iac-rdot.live::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--iac-accent); animation: iac-rpulse 1.6s var(--iac-ease) infinite }
.iac-ragent .iac-rlab { margin-left: auto; font-size: 9.5px }
.iac-rspacer { flex: 1; min-height: 12px }
.iac-ruser { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-top: 1px solid var(--iac-rule) }
.iac-rav { width: 24px; height: 24px; border-radius: 2px; flex: none; display: grid; place-items: center; background: var(--iac-ink); color: var(--iac-paper); font: 600 10px/1 var(--iac-mono); letter-spacing: .04em }
.iac-ruser b { font-weight: 500; color: var(--iac-t1); display: block; line-height: 16px }
.iac-ruser div span { display: block; font-size: 11.5px; line-height: 14px; color: var(--iac-t3) }
.iac-sidetools { padding: 8px 12px }
.iac-scrim { position: absolute; inset: 0; z-index: 20; background: color-mix(in oklab, var(--iac-ink) 28%, transparent); opacity: 0; pointer-events: none; transition: opacity .3s var(--iac-ease) }

/* ---- main + top bar ---- */
.iac-top { height: 52px; flex: none; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--iac-rule); background: var(--iac-paper) }
.iac-menu { display: none; width: 32px; height: 32px; place-items: center; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-sheet) }
.iac-ttl { min-width: 0 }
.iac-ttl .iac-crumb { display: block; font-size: 10px; line-height: 12px; white-space: nowrap }
.iac-ttl h1 { margin: 0; font: 400 22px/24px var(--iac-serif); letter-spacing: -.01em; color: var(--iac-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.iac-actions { margin-left: auto; display: flex; align-items: center; gap: 10px }
.iac-search { display: flex; align-items: center; gap: 8px; width: 210px; height: 30px; padding: 0 8px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-sheet); color: var(--iac-t3); transition: box-shadow .2s var(--iac-ease) }
.iac-search:hover { box-shadow: 0 0 0 1px var(--iac-t4) }
.iac-search span { flex: 1 }
.iac-search kbd { font: 500 10px/14px var(--iac-mono); letter-spacing: .04em; padding: 0 4px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); color: var(--iac-t3) }
.iac-tbtn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; height: 30px; padding: 0 12px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-sheet); color: var(--iac-t1); font-weight: 500; transition: box-shadow .2s var(--iac-ease), opacity .2s }
.iac-tbtn svg { flex: none }
.iac-tbtn:hover { box-shadow: 0 0 0 1px var(--iac-t3) }
.iac-tbtn.ink { background: var(--iac-ink); color: var(--iac-paper); box-shadow: none }
.iac-tbtn.ink:hover { opacity: .88 }
.iac-search input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; outline: 0; background: none; color: var(--iac-t1); font: inherit; -webkit-appearance: none; appearance: none }
.iac-search input::placeholder { color: var(--iac-t3); opacity: 1 }
.iac-search input::-webkit-search-cancel-button { display: none }
.iac-search:focus-within { box-shadow: 0 0 0 1px var(--iac-t3) }
@keyframes iac-rpulse { from { transform: scale(1); opacity: .9 } to { transform: scale(3.2); opacity: 0 } }
@keyframes iac-rtick { from { transform: scaleY(0) } to { transform: scaleY(1) } }

/* ---- rail + top bar: responsive (shared by all Meridian screens) ---- */
@media (max-width: 1023px) {
  .iac-rail { position: absolute; left: 0; top: 0; bottom: 0; transform: translateX(-100%); visibility: hidden; transition: transform .32s var(--iac-ease), visibility 0s .32s; box-shadow: 0 1px 0 var(--iac-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
  .iac.is-open .iac-rail { transform: none; visibility: visible; transition: transform .32s var(--iac-ease), visibility 0s }
  .iac.is-open .iac-scrim { opacity: 1; pointer-events: auto }
  .iac-menu { display: grid }
}
@media (max-width: 1099px) { .iac-search { display: none } }
@media (max-width: 767px) {
  .iac-top { padding: 0 12px; gap: 10px }
  .iac-ttl .iac-crumb { display: none }
  .iac-ttl h1 { font-size: 21px }
}

.iac-main { position: relative; flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden }
.iac-sp { flex: 1 }
.iac-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 30px; padding: 0 11px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-sheet); font-size: 12.5px; font-weight: 500; color: var(--iac-t1); white-space: nowrap; transition: box-shadow .2s var(--iac-ease), background .2s var(--iac-ease), opacity .2s }
.iac-btn:hover:not(:disabled) { box-shadow: 0 0 0 1px var(--iac-t3) }
.iac-btn.pri { box-shadow: 0 0 0 1px var(--iac-accent); color: var(--iac-ink) }
.iac-btn.pri:hover:not(:disabled) { background: var(--iac-signal-soft) }
.iac-btn.sm { height: 26px; padding: 0 9px; font-size: 12px }
.iac-btn:disabled { opacity: .45; box-shadow: 0 0 0 1px var(--iac-rule) }
.iac-btn.ghost { background: none; box-shadow: none; color: var(--iac-t2) }
.iac-btn.ghost:hover:not(:disabled) { background: var(--iac-hover); color: var(--iac-t1); box-shadow: none }
.iac-ib { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); color: var(--iac-t2); background: var(--iac-sheet); transition: box-shadow .2s var(--iac-ease), color .2s, background .2s }
.iac-ib:hover:not(:disabled) { box-shadow: 0 0 0 1px var(--iac-ink); color: var(--iac-ink) }
.iac-ib.go:hover:not(:disabled) { background: var(--iac-ink); color: var(--iac-paper) }
.iac-body { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 24px 24px 56px; scrollbar-width: thin; scrollbar-color: var(--iac-t4) transparent }
.iac-wrap { max-width: 1240px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px }

/* Panels, crop marks */
.iac-panel { position: relative; background: var(--iac-sheet); border-radius: 4px; box-shadow: 0 0 0 1px var(--iac-rule) }
.iac-crops { position: absolute; inset: 0; pointer-events: none }
.iac-crops i { position: absolute; width: 8px; height: 8px; border: 0 solid var(--iac-t4) }
.iac-crops i:nth-child(1) { top: -5px; left: -5px; border-top-width: 1px; border-left-width: 1px }
.iac-crops i:nth-child(2) { top: -5px; right: -5px; border-top-width: 1px; border-right-width: 1px }
.iac-crops i:nth-child(3) { bottom: -5px; left: -5px; border-bottom-width: 1px; border-left-width: 1px }
.iac-crops i:nth-child(4) { bottom: -5px; right: -5px; border-bottom-width: 1px; border-right-width: 1px }
.iac-fig { font: 500 10.5px/16px var(--iac-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--iac-t3); padding: 10px 16px 12px; border-top: 1px solid var(--iac-rule-2) }
.iac-fig b { font-weight: 500; color: var(--iac-t2) }

/* Summary: readouts + close ruler */
.iac-readouts { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; background: var(--iac-rule); border-radius: 4px 4px 0 0; overflow: hidden }
.iac-ro { display: flex; flex-direction: column; gap: 2px; padding: 14px 16px 12px; background: var(--iac-sheet); min-width: 0 }
.iac-big { font: 500 20px/28px var(--iac-mono); font-variant-numeric: tabular-nums; letter-spacing: -.02em; color: var(--iac-ink); white-space: nowrap }
.iac-big .iac-u { font-size: 11px; margin-right: 3px; letter-spacing: 0 }
.iac-big .iac-u.t { margin: 0 0 0 6px }
.iac-sub { font: 500 10.5px/16px var(--iac-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--iac-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.iac-sub b { font-weight: 500; color: var(--iac-warn) }
.iac-steps { position: relative; padding: 14px 16px 16px }
.iac-stepl { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)) }
.iac-steps::before { content: ""; position: absolute; left: 16px; right: 16px; top: 22px; height: 4px; background: repeating-linear-gradient(90deg, var(--iac-rule) 0 1px, transparent 1px 10px); }
.iac-steps::after { content: ""; position: absolute; left: 16px; right: 16px; top: 22px; height: 1px; background: var(--iac-rule) }
.iac-trace { position: absolute; left: 16px; top: 21px; height: 3px; background: var(--iac-ink); transform-origin: 0 50%; transform: scaleX(var(--p, 0)); transition: transform .8s var(--iac-ease-trace); animation: iac-grow .9s var(--iac-ease-trace) backwards .2s; z-index: 1 }
.iac-step { position: relative; padding-top: 18px; min-width: 0; display: flex; flex-direction: column; gap: 1px }
.iac-step::before { content: ""; position: absolute; left: 0; top: 0; width: 1px; height: 10px; background: var(--iac-t4); z-index: 2 }
.iac-step[data-s="done"]::before { background: var(--iac-ink) }
.iac-step[data-s="now"]::before { width: 2px; height: 14px; top: -2px; background: var(--iac-accent); animation: iac-tick-in .5s var(--iac-ease) backwards .9s }
.iac-step .n { display: flex; align-items: center; gap: 6px; font: 500 11px/16px var(--iac-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--iac-t3) }
.iac-step[data-s="done"] .n { color: var(--iac-t2) }
.iac-step[data-s="now"] .n { color: var(--iac-ink) }
.iac-step .st { font: 400 11.5px/16px var(--iac-sans); color: var(--iac-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.iac-step[data-s="now"] .st { color: var(--iac-t1) }
.iac-step svg { color: var(--iac-ok) }
.iac-step .n em { font-style: normal }

/* Tabs */
.iac-tabbar { position: sticky; top: -24px; z-index: 6; margin: 0 -24px; padding: 0 24px; background: var(--iac-paper); border-bottom: 1px solid var(--iac-rule); display: flex; align-items: center; gap: 4px }
.iac-tabs { display: flex; gap: 2px; margin-left: -12px; min-width: 0; overflow-x: auto; scrollbar-width: none }
.iac-tab { position: relative; display: flex; align-items: center; gap: 7px; height: 42px; padding: 0 12px; color: var(--iac-t2); font-weight: 500; white-space: nowrap; transition: color .2s var(--iac-ease) }
.iac-tab:hover { color: var(--iac-t1) }
.iac-tab[aria-selected="true"] { color: var(--iac-ink) }
.iac-tab::after { content: ""; position: absolute; left: 12px; right: 12px; bottom: -1px; height: 2px; background: var(--iac-accent); transform: scaleX(0); transform-origin: 0 50%; transition: transform .38s var(--iac-ease) }
.iac-tab[aria-selected="true"]::after { transform: scaleX(1) }
.iac-tabn { font: 500 10.5px/16px var(--iac-mono); letter-spacing: .04em; color: var(--iac-t3); font-variant-numeric: tabular-nums }
.iac-status { margin-left: auto; font: 500 10.5px/16px var(--iac-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--iac-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0 }
.iac-tabpanel { display: flex; flex-direction: column; gap: 24px }
.iac-scan { position: relative; animation: iac-reveal .6s var(--iac-ease) backwards }
.iac-scan::before { content: ""; position: absolute; inset: -6px 0 0; z-index: 3; pointer-events: none; background: linear-gradient(var(--iac-accent), var(--iac-accent)) 0 0 / 100% 1px no-repeat; animation: iac-sweep .6s var(--iac-ease) forwards }

/* Section heads */
.iac-head { display: grid; gap: 2px; max-width: 64ch }
.iac-head h2 { font: 400 28px/34px var(--iac-serif); letter-spacing: -.01em; color: var(--iac-ink) }
.iac-head h2 em { font-style: italic }
.iac-head p { color: var(--iac-t2) }

/* Dither + chips */
.iac-dither { display: block }
.iac-chip { display: inline-flex; align-items: center; gap: 6px; flex: none; height: 18px; padding: 0 6px 0 5px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); font: 500 10.5px/16px var(--iac-mono); font-variant-numeric: tabular-nums; color: var(--iac-t1); background: var(--iac-sheet) }
.iac-chip .d { width: 24px; height: 8px; color: var(--iac-ink) }
.iac-chip[data-low="1"] .d { color: var(--iac-warn) }
.iac-flag { flex: none; font: 500 10px/16px var(--iac-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iac-warn); padding: 0 5px; border-radius: 2px; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--iac-warn) 45%, transparent) }
.iac-flag.mute { color: var(--iac-t3); box-shadow: inset 0 0 0 1px var(--iac-rule) }
.iac-note { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; line-height: 16px; color: var(--iac-t3) }

/* Reconcile */
.iac-rechead { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--iac-rule-2); flex-wrap: wrap }
.iac-margin { flex: 1 1 280px; min-width: 0; display: flex; align-items: flex-start; gap: 12px }
.iac-margin .tx { font: italic 400 15px/20px var(--iac-serif); color: var(--iac-t2); max-width: 66ch; min-height: 40px }
.iac-margin .who { padding-top: 3px }
.iac-leader { flex: 1 1 24px; min-width: 24px; height: 1px; background: var(--iac-rule); position: relative; margin-top: 10px }
.iac-leader::after { content: ""; position: absolute; right: 0; top: -2px; width: 5px; height: 5px; border-radius: 50%; background: var(--iac-paper); box-shadow: 0 0 0 1px var(--iac-t3) }
.iac-proof { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; background: var(--iac-rule-2); border-bottom: 1px solid var(--iac-rule-2) }
.iac-proof > div { background: var(--iac-sheet); padding: 8px 16px 9px; display: flex; flex-direction: column; min-width: 0 }
.iac-proof .v { font: 500 13px/20px var(--iac-mono); font-variant-numeric: tabular-nums; color: var(--iac-t1); white-space: nowrap }
.iac-proof .v.ok { color: var(--iac-ok) }
.iac-manual { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 10px 16px; border-bottom: 1px solid var(--iac-rule-2); background: var(--iac-signal-soft); animation: iac-rise .35s var(--iac-ease) backwards }
.iac-manual p { flex: 1 1 260px; min-width: 0; color: var(--iac-t1) }
.iac-manual p b { font-weight: 500 }
.iac-colhead { display: grid; grid-template-columns: minmax(0, 1fr) var(--gut, 96px) minmax(0, 1fr); border-bottom: 1px solid var(--iac-rule-2) }
.iac-colhead > div { padding: 8px 16px; display: flex; justify-content: space-between; gap: 8px }
.iac-match { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) var(--gut, 96px) minmax(0, 1fr) }
.iac-col { min-width: 0 }
.iac-gut { position: relative; border-left: 1px solid var(--iac-rule-2); border-right: 1px solid var(--iac-rule-2) }
.iac-gut::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(circle, var(--iac-rule) 1px, transparent 1.2px); background-size: 8px 8px; background-position: 4px 4px; -webkit-mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent); mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent) }
.iac-wires { position: absolute; left: 0; top: 0; overflow: visible }
.iac-wire { fill: none; stroke: var(--iac-t3); stroke-width: 1; stroke-dasharray: 1; stroke-dashoffset: 0; animation: iac-trace .85s var(--iac-ease-trace) backwards; animation-delay: calc(var(--i, 0) * 45ms + 150ms); transition: stroke .25s var(--iac-ease) }
.iac-wire.low { stroke-dasharray: 3 3; animation: iac-fade .6s var(--iac-ease) backwards; animation-delay: calc(var(--i, 0) * 45ms + 500ms) }
.iac-wire.sel { stroke: var(--iac-accent); stroke-width: 1.5 }
.iac-wire.out { stroke: var(--iac-accent); animation: iac-wire-out .6s var(--iac-ease) forwards; animation-delay: var(--d, 0ms) }
.iac-stub { stroke: var(--iac-warn); stroke-width: 1; stroke-dasharray: 2 3 }
.iac-end { fill: var(--iac-sheet); stroke: var(--iac-t3); stroke-width: 1 }
.iac-end.sel { stroke: var(--iac-accent) }
.iac-end.warn { stroke: var(--iac-warn) }
.iac-row { position: relative; height: 56px; display: flex; align-items: center; border-bottom: 1px solid var(--iac-rule-2) }
.iac-rmain { position: relative; flex: 1; min-width: 0; height: 100%; padding: 0 10px 0 16px; transition: background .2s var(--iac-ease) }
.iac-rmain:hover { background: var(--iac-hover) }
.iac-row.is-sel .iac-rmain { background: color-mix(in oklab, var(--iac-ink) 4.5%, transparent) }
.iac-row.is-sel .iac-rmain::before { content: ""; position: absolute; left: 0; top: 14px; bottom: 14px; width: 2px; background: var(--iac-accent) }
.iac-row.is-flag .iac-rmain::after { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: repeating-linear-gradient(to bottom, var(--iac-warn) 0 3px, transparent 3px 6px); opacity: .7 }
.iac-row.is-sel.is-flag .iac-rmain::after { display: none }
.iac-acts { flex: none; display: flex; gap: 4px; padding: 0 10px 0 2px }
.iac-row.is-out, .iac-pc.is-out { animation: iac-out .62s var(--iac-ease) forwards; animation-delay: var(--d, 0ms) }
.iac-row.is-out::after, .iac-pc.is-out::after { content: ""; position: absolute; left: 0; right: 0; height: 1px; background: var(--iac-accent); top: 0; animation: iac-sweep-top .62s var(--iac-ease) forwards; animation-delay: var(--d, 0ms) }
.iac-cell { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; grid-template-areas: "d t a" "d s a"; column-gap: 10px; row-gap: 1px; align-items: center; width: 100%; min-width: 0 }
.iac-cell .d { grid-area: d; font: 500 10.5px/16px var(--iac-mono); letter-spacing: .02em; color: var(--iac-t3); white-space: nowrap }
.iac-cell .t { grid-area: t; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; color: var(--iac-t1) }
.iac-cell .s { grid-area: s; display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden }
.iac-cell .a { grid-area: a; display: flex; flex-direction: column; align-items: flex-end; font: 500 13px/18px var(--iac-mono); font-variant-numeric: tabular-nums; color: var(--iac-ink); white-space: nowrap }
.iac-cell .a.neg { color: var(--iac-t1) }
.iac-cell .a small { font: 500 9.5px/12px var(--iac-mono); letter-spacing: .08em; color: var(--iac-t3) }
.iac-mt { padding: 0 16px }
.iac-cards { display: flex; flex-direction: column; gap: 10px; padding: 12px 12px 4px }
.iac-pc { position: relative; border-radius: 4px; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-sheet) }
.iac-pc .iac-cell { padding: 10px 12px }
.iac-pc .mid { display: flex; align-items: center; gap: 8px; padding: 0 12px; height: 28px; border-top: 1px dashed var(--iac-rule); border-bottom: 1px dashed var(--iac-rule); background: color-mix(in oklab, var(--iac-ink) 2%, transparent) }
.iac-pc .btns { display: flex; gap: 8px; padding: 8px 12px 10px; border-top: 1px solid var(--iac-rule-2) }
.iac-pc .btns .iac-btn { flex: 1 }
.iac-pc.is-sel { box-shadow: 0 0 0 1px var(--iac-accent) }
.iac-pc.is-flag { box-shadow: 0 0 0 1px color-mix(in oklab, var(--iac-warn) 55%, transparent) }
.iac-empty { padding: 28px 16px; text-align: center; color: var(--iac-t3); font: italic 400 16px/22px var(--iac-serif) }

/* Invoices */
.iac-aging { padding: 14px 16px 12px; display: flex; flex-direction: column; gap: 10px }
.iac-agebar { display: flex; gap: 2px; height: 32px }
.iac-agebar > div { position: relative; min-width: 6px; flex-basis: 0; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-sheet); overflow: hidden; color: var(--iac-ink); transition: flex-grow .6s var(--iac-ease) }
.iac-agebar > div > svg { position: absolute; inset: 0 }
.iac-agekey { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px }
.iac-agekey > div { display: flex; flex-direction: column; min-width: 0 }
.iac-agekey .v { font: 500 15px/22px var(--iac-mono); font-variant-numeric: tabular-nums; color: var(--iac-ink) }
.iac-tools { display: flex; align-items: center; gap: 12px; flex-wrap: wrap }
.iac-seg { display: inline-flex; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-sheet); overflow: hidden; max-width: 100% }
.iac-seg button { position: relative; display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px; color: var(--iac-t2); font-size: 12.5px; font-weight: 500; white-space: nowrap }
.iac-seg button + button { box-shadow: -1px 0 0 var(--iac-rule) }
.iac-seg button:hover { color: var(--iac-t1) }
.iac-seg button[aria-pressed="true"] { color: var(--iac-ink); background: color-mix(in oklab, var(--iac-ink) 6%, transparent) }
.iac-seg button[aria-pressed="true"]::after { content: ""; position: absolute; left: 11px; right: 11px; bottom: 0; height: 2px; background: var(--iac-accent) }
.iac-seg .c { font: 500 10.5px/16px var(--iac-mono); color: var(--iac-t3) }
.iac-find { display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 8px; width: 220px; margin-left: auto; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-sheet); color: var(--iac-t3) }
.iac-find input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; color: var(--iac-t1); font-size: 12.5px }
.iac-find:focus-within { box-shadow: 0 0 0 1px var(--iac-t3) }
.iac-th, .iac-irow { display: grid; grid-template-columns: 92px minmax(0, 1.7fr) 72px 72px 112px 112px; gap: 0 12px; align-items: center; padding: 0 16px }
.iac-th { height: 32px; border-bottom: 1px solid var(--iac-rule) }
.iac-th .r, .iac-irow .r { text-align: right; justify-self: end }
.iac-irow { position: relative; width: 100%; height: 44px; border-bottom: 1px solid var(--iac-rule-2); transition: background .2s var(--iac-ease) }
.iac-irow:hover { background: var(--iac-hover) }
.iac-irow[aria-pressed="true"] { background: color-mix(in oklab, var(--iac-ink) 4.5%, transparent) }
.iac-irow[aria-pressed="true"]::before { content: ""; position: absolute; left: 0; top: 11px; bottom: 11px; width: 2px; background: var(--iac-accent) }
.iac-irow .no { font: 500 12px/16px var(--iac-mono); color: var(--iac-ink) }
.iac-irow .cu { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.iac-irow .dt { font: 400 12px/16px var(--iac-mono); color: var(--iac-t2); white-space: nowrap }
.iac-irow .am { font: 500 13px/18px var(--iac-mono); font-variant-numeric: tabular-nums; color: var(--iac-ink); white-space: nowrap }
.iac-st { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--iac-t1); white-space: nowrap }
.iac-st i { display: inline-block; width: 2px; height: 12px; background: var(--iac-t2) }
.iac-st[data-s="Draft"] { color: var(--iac-t3) }
.iac-st[data-s="Draft"] i { background: none; box-shadow: inset 0 0 0 1px var(--iac-t3) }
.iac-st[data-s="Overdue"] { color: var(--iac-bad) }
.iac-st[data-s="Overdue"] i { background: var(--iac-bad) }
.iac-st[data-s="Paid"] { color: var(--iac-t2) }
.iac-st[data-s="Paid"] i { background: var(--iac-ok) }
.iac-st small { font: 500 10.5px/16px var(--iac-mono); letter-spacing: .02em; color: var(--iac-t3) }
.iac-tfoot { display: flex; justify-content: space-between; gap: 12px; padding: 10px 16px; font: 500 10.5px/16px var(--iac-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--iac-t3) }
.iac-tfoot b { font-weight: 500; color: var(--iac-t1) }
.iac-drawer-wrap { position: absolute; inset: 52px 0 0 0; z-index: 30; overflow: hidden; pointer-events: none }
.iac-dscrim { position: absolute; inset: 0; background: color-mix(in oklab, var(--iac-ink) 22%, transparent); opacity: 1; pointer-events: auto; animation: iac-fade .3s var(--iac-ease) backwards }
.iac-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 460px; max-width: 100%; display: flex; flex-direction: column; background: var(--iac-sheet); border-left: 1px solid var(--iac-rule); box-shadow: 0 1px 0 var(--iac-rule), 0 12px 24px -16px rgb(0 0 0 / .25); pointer-events: auto; animation: iac-slide .4s var(--iac-ease) backwards }
.iac-dhead { flex: none; padding: 16px 20px 14px; border-bottom: 1px solid var(--iac-rule); display: flex; gap: 12px; align-items: flex-start }
.iac-dhead h3 { font: 400 26px/30px var(--iac-serif); letter-spacing: -.01em; color: var(--iac-ink) }
.iac-dbody { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 20px; scrollbar-width: thin }
.iac-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: var(--iac-rule-2); box-shadow: 0 0 0 1px var(--iac-rule-2) }
.iac-meta > div { background: var(--iac-sheet); padding: 8px 12px; min-width: 0 }
.iac-meta .v { font: 500 12.5px/18px var(--iac-mono); font-variant-numeric: tabular-nums; color: var(--iac-t1); overflow-wrap: anywhere }
.iac-lines { width: 100%; border-collapse: collapse }
.iac-lines th { font: 500 10.5px/16px var(--iac-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iac-t3); text-align: left; padding: 0 0 6px; font-weight: 500; border-bottom: 1px solid var(--iac-rule) }
.iac-lines td { padding: 7px 0; border-bottom: 1px solid var(--iac-rule-2); vertical-align: top }
.iac-lines .r { text-align: right; font-family: var(--iac-mono); font-variant-numeric: tabular-nums; white-space: nowrap; padding-left: 12px }
.iac-lines td.r { font-size: 12.5px }
.iac-lines th.r { text-align: right }
.iac-tot { margin-left: auto; width: 240px; max-width: 100%; display: grid; gap: 3px; font-size: 12.5px }
.iac-tot > div { display: flex; justify-content: space-between; gap: 16px }
.iac-tot .m { font-family: var(--iac-mono); font-variant-numeric: tabular-nums }
.iac-tot .grand { margin-top: 4px; padding-top: 6px; border-top: 1px solid var(--iac-ink); font-weight: 500; font-size: 14px; color: var(--iac-ink) }
.iac-tot .grand::after { content: none }
.iac-draft { padding: 12px 14px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); background: color-mix(in oklab, var(--iac-ink) 2.5%, transparent); font-size: 12.5px; line-height: 19px; white-space: pre-wrap; color: var(--iac-t1); min-height: 120px }
.iac-dfoot { flex: none; display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--iac-rule) }
.iac-dfoot .iac-sp { min-width: 8px }
.iac-aside { display: flex; gap: 12px; align-items: flex-start }
.iac-aside .hl { flex: none; width: 20px; height: 1px; margin-top: 10px; background: var(--iac-rule); position: relative }
.iac-aside .hl::before { content: ""; position: absolute; left: -1px; top: -2px; width: 5px; height: 5px; border-radius: 50%; background: var(--iac-paper); box-shadow: 0 0 0 1px var(--iac-t3) }
.iac-aside p { font: italic 400 14.5px/20px var(--iac-serif); color: var(--iac-t2) }
.iac-aside .iac-lab { display: block; font-style: normal }

/* Ledger */
.iac-lg { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 24px; align-items: start }
.iac-coa { position: sticky; top: 30px; max-height: min(680px, calc(100dvh - 52px - 42px - 40px)); display: flex; flex-direction: column }
.iac-coa-list { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: thin; padding-bottom: 6px }
.iac-gh { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 12px 16px 6px; position: sticky; top: 0; background: var(--iac-sheet); z-index: 1 }
.iac-gh .iac-num { font-size: 12px; color: var(--iac-t2) }
.iac-ar { position: relative; display: flex; align-items: baseline; gap: 10px; width: 100%; padding: 5px 16px; transition: background .2s var(--iac-ease) }
.iac-ar:hover { background: var(--iac-hover) }
.iac-ar .c { flex: none; width: 34px; font: 500 11px/18px var(--iac-mono); color: var(--iac-t3) }
.iac-ar .n { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--iac-t2) }
.iac-ar .b { flex: none; font: 500 12.5px/18px var(--iac-mono); font-variant-numeric: tabular-nums; color: var(--iac-t1) }
.iac-ar[aria-pressed="true"] { background: color-mix(in oklab, var(--iac-ink) 4.5%, transparent) }
.iac-ar[aria-pressed="true"] .n { color: var(--iac-ink); font-weight: 500 }
.iac-ar[aria-pressed="true"]::before { content: ""; position: absolute; left: 0; top: 5px; bottom: 5px; width: 2px; background: var(--iac-accent) }
.iac-ar.memo .n, .iac-ar.memo .b { font-style: italic; color: var(--iac-t3) }
.iac-ar.memo { cursor: default }
.iac-ar.memo:hover { background: none }
.iac-jhead { display: flex; align-items: flex-start; gap: 16px; padding: 16px; flex-wrap: wrap }
.iac-jhead h3 { font: 400 26px/30px var(--iac-serif); letter-spacing: -.01em; color: var(--iac-ink) }
.iac-jtable { overflow-x: auto }
.iac-jrow { display: grid; grid-template-columns: 56px 82px minmax(160px, 1fr) 104px 104px 124px; gap: 0 12px; align-items: baseline; padding: 0 16px; min-width: 680px }
.iac-jrow.h { height: 32px; align-items: center; border-top: 1px solid var(--iac-rule); border-bottom: 1px solid var(--iac-rule) }
.iac-jrow .r { text-align: right; font-family: var(--iac-mono); font-variant-numeric: tabular-nums; font-size: 12.5px; white-space: nowrap }
.iac-jrow .dt { font: 400 12px/18px var(--iac-mono); color: var(--iac-t2) }
.iac-jrow .rf { font: 400 11.5px/18px var(--iac-mono); color: var(--iac-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.iac-jmain { display: contents }
.iac-jb { display: contents; width: 100% }
.iac-je { position: relative; border-bottom: 1px solid var(--iac-rule-2) }
.iac-je > button.iac-jrow { width: 100%; padding-top: 9px; padding-bottom: 9px; transition: background .2s var(--iac-ease) }
.iac-je > button.iac-jrow:hover { background: var(--iac-hover) }
.iac-je .ds { min-width: 0 }
.iac-je .ds span { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden }
.iac-je .ds small { display: block; font: 500 9.5px/14px var(--iac-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--iac-t3) }
.iac-je.open { background: color-mix(in oklab, var(--iac-ink) 2.5%, transparent) }
.iac-je.is-new { animation: iac-reveal .7s var(--iac-ease) backwards }
.iac-je.is-new::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(var(--iac-accent), var(--iac-accent)) 0 0 / 100% 1px no-repeat; animation: iac-sweep .7s var(--iac-ease) forwards }
.iac-je.bf { background: none }
.iac-je.bf .ds span { font-style: italic; color: var(--iac-t2) }
.iac-split { padding: 4px 16px 12px 150px; display: grid; gap: 2px; min-width: 680px; animation: iac-rise .3s var(--iac-ease) backwards }
.iac-split button { display: grid; grid-template-columns: 38px minmax(0, 1fr) 96px 96px; gap: 12px; align-items: baseline; width: 100%; padding: 3px 0 }
.iac-split button:hover .n { color: var(--iac-ink); text-decoration: underline; text-underline-offset: 3px }
.iac-split .c { font: 500 11px/18px var(--iac-mono); color: var(--iac-t3) }
.iac-split .n { color: var(--iac-t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.iac-split .r { text-align: right; font: 400 12px/18px var(--iac-mono); font-variant-numeric: tabular-nums; color: var(--iac-t1) }
.iac-jfoot { border-top: 1px solid var(--iac-ink) }
.iac-jfoot .iac-jrow { height: 36px; align-items: center; font-weight: 500 }
.iac-jfoot .iac-jrow .r { color: var(--iac-ink) }
.iac-form { padding: 16px; display: grid; gap: 14px; border-top: 1px solid var(--iac-rule); background: color-mix(in oklab, var(--iac-ink) 2%, transparent); animation: iac-rise .35s var(--iac-ease) backwards }
.iac-fgrid { display: grid; grid-template-columns: 150px 150px minmax(0, 1fr); gap: 12px }
.iac-fld { display: flex; flex-direction: column; gap: 4px; min-width: 0 }
.iac-in { height: 30px; padding: 0 8px; border: 0; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-sheet); color: var(--iac-t1); min-width: 0; width: 100%; outline: 0; transition: box-shadow .2s var(--iac-ease) }
.iac-in:hover { box-shadow: 0 0 0 1px var(--iac-t4) }
.iac-in:focus { box-shadow: 0 0 0 1px var(--iac-ink) }
.iac-in.num { text-align: right; font-family: var(--iac-mono); font-variant-numeric: tabular-nums }
.iac-in[aria-invalid="true"] { box-shadow: 0 0 0 1px var(--iac-bad) }
select.iac-in { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--iac-t3) 50%), linear-gradient(135deg, var(--iac-t3) 50%, transparent 50%); background-position: calc(100% - 13px) 13px, calc(100% - 9px) 13px; background-size: 4px 4px; background-repeat: no-repeat; padding-right: 22px }
.iac-fl { display: grid; grid-template-columns: minmax(0, 1fr) 118px 118px 28px; gap: 8px; align-items: center }
.iac-fl.h { padding-bottom: 0 }
.iac-bal { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 10px 12px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iac-rule); background: var(--iac-sheet) }
.iac-gauge { display: grid; gap: 4px }
.iac-gauge .row { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 8px; align-items: center }
.iac-gauge .bar { position: relative; height: 8px; background: repeating-linear-gradient(90deg, var(--iac-rule-2) 0 1px, transparent 1px 10px) }
.iac-gauge .bar i { position: absolute; left: 0; top: 2px; bottom: 2px; background: var(--iac-ink); transition: width .5s var(--iac-ease) }
.iac-gauge .bar b { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--iac-accent); transition: left .5s var(--iac-ease), opacity .3s; opacity: 0 }
.iac-gauge.ok .bar b { opacity: 1 }
.iac-bal .res { text-align: right; min-width: 150px }
.iac-bal .res .v { font: 500 13px/20px var(--iac-mono); font-variant-numeric: tabular-nums }
.iac-bal .res .v.ok { color: var(--iac-ok) }
.iac-bal .res .v.off { color: var(--iac-warn) }
.iac-ferr { font-size: 12px; color: var(--iac-warn); min-height: 18px }
.iac-fact { display: flex; align-items: center; gap: 8px; flex-wrap: wrap }

/* Reports */
.iac-rp { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start }
.iac-side { display: flex; flex-direction: column; gap: 24px; min-width: 0 }
.iac-pl { padding-bottom: 4px }
.iac-plr { display: grid; grid-template-columns: minmax(0, 1fr) 104px 104px 104px 76px; gap: 0 10px; align-items: baseline; padding: 0 16px; min-height: 28px }
.iac-plr > span { padding: 4px 0 }
.iac-plr .r { text-align: right; font: 400 12.5px/20px var(--iac-mono); font-variant-numeric: tabular-nums; white-space: nowrap }
.iac-plr.h { min-height: 32px; align-items: center; border-bottom: 1px solid var(--iac-rule) }
.iac-plr.h .r { font: 500 10.5px/16px var(--iac-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iac-t3) }
.iac-plr.sec { padding-top: 14px; min-height: 0 }
.iac-plr.sec > span { padding: 0 0 2px }
.iac-plr.ln .nm { color: var(--iac-t2); padding-left: 10px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.iac-plr.ln .nm em { font-style: normal; font: 500 11px/20px var(--iac-mono); color: var(--iac-t3); margin-right: 8px }
.iac-plr.ln .r { color: var(--iac-t1) }
.iac-plr.sub { border-top: 1px solid var(--iac-rule); margin-top: 2px }
.iac-plr.sub .nm, .iac-plr.sub .r { font-weight: 500; color: var(--iac-ink) }
.iac-plr.sub .nm { font-family: var(--iac-sans); font-size: 13px }
.iac-plr.key { margin-top: 10px; background: color-mix(in oklab, var(--iac-ink) 3%, transparent); border-top: 1px solid var(--iac-rule); border-bottom: 1px solid var(--iac-rule) }
.iac-plr.key .nm { font: 400 17px/24px var(--iac-serif); color: var(--iac-ink) }
.iac-plr.key .r { font-weight: 500; color: var(--iac-ink) }
.iac-plr.net { margin-top: 12px; min-height: 40px; align-items: center; border-top: 1px solid var(--iac-ink); position: relative }
.iac-plr.net::after { content: ""; position: absolute; left: 0; right: 0; bottom: 3px; height: 1px; background: var(--iac-ink) }
.iac-plr.net { border-bottom: 1px solid var(--iac-ink); padding-bottom: 8px }
.iac-plr.net .nm { font: 400 20px/26px var(--iac-serif); color: var(--iac-ink) }
.iac-plr.net .r { font-weight: 500; font-size: 14px; color: var(--iac-ink) }
.iac-good { color: var(--iac-ok) !important }
.iac-badv { color: var(--iac-bad) !important }
.iac-bs { padding: 16px; display: grid; gap: 10px }
.iac-bsr { display: flex; justify-content: space-between; align-items: baseline; gap: 12px }
.iac-bsr .iac-num { font-size: 13px; color: var(--iac-ink) }
.iac-bsr.sm { padding-left: 12px; font-size: 12px; color: var(--iac-t3) }
.iac-bsr.sm .iac-num { font-size: 12px; color: var(--iac-t2) }
.iac-check { display: flex; gap: 12px; align-items: center; padding: 12px 16px; border-top: 1px solid var(--iac-rule); }
.iac-check svg { flex: none; color: var(--iac-ok) }
.iac-check svg path { stroke-dasharray: 1; stroke-dashoffset: 0; animation: iac-trace .7s var(--iac-ease-trace) backwards .5s }
.iac-check .eq { font: 500 12.5px/20px var(--iac-mono); font-variant-numeric: tabular-nums; color: var(--iac-ink) }
.iac-check.bad svg { color: var(--iac-bad) }
.iac-spread { padding: 14px 16px 6px; display: grid; gap: 10px }
.iac-spbar { display: flex; gap: 2px; height: 28px }
.iac-spbar > div { position: relative; box-shadow: 0 0 0 1px var(--iac-rule); overflow: hidden; color: var(--iac-ink); min-width: 4px }
.iac-spbar > div > svg { position: absolute; inset: 0 }
.iac-spkey { display: grid; gap: 4px }
.iac-spkey > div { display: grid; grid-template-columns: 14px minmax(0, 1fr) auto; gap: 8px; align-items: center; font-size: 12px }
.iac-spkey i { display: block; width: 14px; height: 8px; box-shadow: 0 0 0 1px var(--iac-rule); color: var(--iac-ink) }
.iac-spkey .iac-num { font-size: 12px; color: var(--iac-t1) }
.iac-notes { display: grid; gap: 14px }

/* Motion */
@keyframes iac-trace { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes iac-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes iac-grow { from { transform: scaleX(0) } to { transform: scaleX(var(--p, 0)) } }
@keyframes iac-tick-in { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes iac-reveal { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes iac-sweep { from { background-position: 0 0; opacity: 1 } 85% { opacity: 1 } to { background-position: 0 100%; opacity: 0 } }
@keyframes iac-sweep-top { from { top: 0; opacity: 1 } 85% { opacity: 1 } to { top: calc(100% - 1px); opacity: 0 } }
@keyframes iac-out { from { clip-path: inset(0 0 0 0) } to { clip-path: inset(100% 0 0 0) } }
@keyframes iac-wire-out { from { opacity: 1 } to { opacity: 0 } }
@keyframes iac-rise { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes iac-slide { from { transform: translateX(32px); opacity: 0 } to { transform: none; opacity: 1 } }

/* Responsive */
@media (max-width: 1023px) {
  .iac-lg { grid-template-columns: 280px minmax(0, 1fr); gap: 16px }
  .iac-rp { grid-template-columns: minmax(0, 1fr); }
  .iac-side { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start }
}
@media (max-width: 899px) {
  .iac-lg { grid-template-columns: minmax(0, 1fr) }
  .iac-coa { position: static; max-height: 300px }
  .iac-side { grid-template-columns: minmax(0, 1fr) }
}
@media (max-width: 767px) {
  .iac-tbtn.exp span { display: none }
  .iac-tbtn.exp { padding: 0; width: 30px }
  .iac-body { padding: 16px 16px 48px }
  .iac-wrap { gap: 20px }
  .iac-tabbar { top: -16px; margin: 0 -16px; padding: 0 16px }
  .iac-status { display: none }
  .iac-readouts { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .iac-readouts .iac-ro:last-child { grid-column: span 2 }
  .iac-ro { padding: 12px 14px 10px }
  .iac-big { font-size: 17px }
  .iac-steps { padding: 14px 14px 14px }
  .iac-steps::before, .iac-steps::after { left: 14px; right: 14px }
  .iac-trace { left: 14px }
  .iac-step .n { font-size: 9.5px; letter-spacing: .02em }
  .iac-step .n svg, .iac-step .n em { display: none }
  .iac-step .n { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block }
  .iac-leader { display: none }
  .iac-step:not([data-s="now"]) .st { display: none }
  .iac-step[data-s="now"] .st { white-space: normal; font-size: 11px; line-height: 14px }
  .iac-head h2 { font-size: 24px; line-height: 30px }
  .iac-rechead { padding: 12px 14px }
  .iac-proof { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .iac-proof > div:last-child { grid-column: span 2 }
  .iac-proof > div { padding: 8px 14px }
  .iac-agekey { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 10px }
  .iac-find { width: 100%; margin-left: 0 }
  .iac-seg { overflow-x: auto }
  .iac-th { display: none }
  .iac-irow { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "cu am" "no st" "dt dt"; height: auto; padding: 10px 14px; row-gap: 2px }
  .iac-irow .cu { grid-area: cu; font-weight: 500 }
  .iac-irow .am { grid-area: am }
  .iac-irow .no { grid-area: no }
  .iac-irow .st-c { grid-area: st; justify-self: end }
  .iac-irow .dt.i { display: none }
  .iac-irow .dt.u { grid-area: dt; font-size: 11.5px }
  .iac-irow .dt.u::before { content: "Due "; color: var(--iac-t3) }
  .iac-drawer { width: 100%; border-left: 0 }
  .iac-dhead { padding: 14px 16px 12px }
  .iac-dbody { padding: 14px 16px 18px }
  .iac-dfoot { padding: 10px 16px }
  .iac-fgrid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) }
  .iac-fgrid .iac-fld:last-child { grid-column: span 2 }
  .iac-fl { grid-template-columns: minmax(0, 1fr) 92px 92px 28px }
  .iac-bal { grid-template-columns: minmax(0, 1fr) }
  .iac-bal .res { text-align: left }
  .iac-plr { grid-template-columns: minmax(0, 1fr) 74px 74px 54px; gap: 0 8px; padding: 0 12px }
  .iac-plr .vr { display: none }
  .iac-plr .r { font-size: 11px }
  .iac-plr.ln .nm { padding-left: 6px }
  .iac-plr.key .nm { font-size: 15px }
  .iac-jhead { padding: 14px }
  .iac-jrow { min-width: 0; grid-template-columns: 44px minmax(0, 1fr) minmax(0, 1fr); grid-template-areas: "dt ds ds" ". dr cr" ". bl bl"; gap: 2px 12px; padding: 0 14px }
  .iac-jrow.h { display: none }
  .iac-jrow .dt { grid-area: dt }
  .iac-jrow .rf { display: none }
  .iac-jrow .ds { grid-area: ds }
  .iac-jrow .dr { grid-area: dr }
  .iac-jrow .cr { grid-area: cr }
  .iac-jrow .bl { grid-area: bl }
  .iac-jrow .r { text-align: left }
  .iac-jrow .r:empty { display: none }
  .iac-jrow .r::before { content: attr(data-l) " "; font: 500 9.5px/14px var(--iac-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iac-t3); margin-right: 6px }
  .iac-jfoot .iac-jrow { height: auto; padding-top: 8px; padding-bottom: 8px }
  .iac-split { min-width: 0; padding: 4px 14px 12px 14px }
  .iac-split button { grid-template-columns: 34px minmax(0, 1fr) 76px 76px; gap: 6px }
  .iac-plr .hm, .iac-plr.ln .nm em { display: none }
  .iac-form { padding: 14px }
  .iac-fig { padding: 10px 14px 12px }
}
@media (max-width: 420px) {
  .iac-big { font-size: 15.5px }
  .iac-tbtn.ink span.lbl { display: none }
  .iac-tbtn.ink { padding: 0; width: 30px }
}

@media (prefers-reduced-motion: reduce) {
  .iac *, .iac *::before, .iac *::after { animation: none !important; transition: none !important }
  .iac-rdot.live::after { display: none }
  .iac-scan::before, .iac-je.is-new::after { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function useMedia(q: string) {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(q)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(q).matches,
    () => false,
  )
}
const useReduced = () => useMedia("(prefers-reduced-motion: reduce)")

/** Agent-written text: steady typing with a block caret. Shows the settled text when motion is reduced. */
function Typed({ text, step = 3, tick = 22, onDone, onTick }: { text: string; step?: number; tick?: number; onDone?: () => void; onTick?: () => void }) {
  const reduced = useReduced()
  const [len0] = React.useState(text.length)
  const [n, setN] = React.useState(reduced ? text.length : 0)
  const doneRef = React.useRef(onDone)
  const tickRef = React.useRef(onTick)
  React.useEffect(() => {
    doneRef.current = onDone
    tickRef.current = onTick
  })
  React.useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(() => doneRef.current?.(), 0)
      return () => window.clearTimeout(t)
    }
    let i = 0
    const id = window.setInterval(() => {
      i += step
      setN(Math.min(i, len0))
      tickRef.current?.()
      if (i >= len0) {
        window.clearInterval(id)
        doneRef.current?.()
      }
    }, tick)
    return () => window.clearInterval(id)
  }, [reduced, step, tick, len0])
  const done = n >= len0
  return (
    <>
      <span className="iac-sr">{text}</span>
      <span aria-hidden="true">
        {done ? text : text.slice(0, n)}
        {!done && <i className="iac-caret" />}
      </span>
    </>
  )
}

/** One easing for numbers: counts to the value, overshoots by 1.5% and returns. */
const settle = (t: number) => {
  if (t < 0.75) {
    const u = t / 0.75
    return (1 - Math.pow(1 - u, 3)) * 1.015
  }
  const u = (t - 0.75) / 0.25
  return 1.015 - 0.015 * (u * u * (3 - 2 * u))
}
const fmtMoney = (p: number) => money(p)
const fmtInt = (v: number) => String(Math.round(v))

/** Count-up readout. Writes straight to the DOM so it never fights React, and always ends on the exact value. */
function Num({ value, format }: { value: number; format: (v: number) => string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const shown = React.useRef(0)
  const reduced = useReduced()
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const put = (v: number) => {
      shown.current = v
      el.textContent = format(v)
    }
    const from = shown.current
    if (reduced || from === value) {
      put(value)
      return
    }
    const total = 900
    put(from)
    const t0 = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / total)
      put(t >= 1 ? value : from + (value - from) * settle(t))
      if (t < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const fallback = window.setTimeout(() => put(value), total + 300)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
    }
  }, [value, reduced, format])
  return <span ref={ref} className="iac-num" />
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
/** Ordered (Bayer 4x4) dither: ink dots on paper, density = value (0 to 1). */
function Dither({ level, cell = 2 }: { level: number; cell?: number }) {
  const id = React.useId().replace(/:/g, "")
  const k = Math.round(Math.max(0, Math.min(1, level)) * 16)
  const dots: React.ReactNode[] = []
  for (let i = 0; i < 16; i++) {
    if (BAYER[i] < k) dots.push(<rect key={i} x={(i % 4) * cell} y={Math.floor(i / 4) * cell} width={cell - 0.4} height={cell - 0.4} />)
  }
  return (
    <svg className="iac-dither" width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id={id} width={cell * 4} height={cell * 4} patternUnits="userSpaceOnUse" fill="currentColor">
          {dots}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

function ConfChip({ conf, manual }: { conf: number; manual?: boolean }) {
  return (
    <span className="iac-chip" data-low={conf < 0.8 ? "1" : undefined} title={manual ? "Matched by hand" : `Atlas confidence ${conf.toFixed(2)}`}>
      <span className="d">
        <Dither level={conf} />
      </span>
      {manual ? "MANUAL" : conf.toFixed(2)}
    </span>
  )
}

const Crops = () => (
  <span className="iac-crops" aria-hidden="true">
    <i />
    <i />
    <i />
    <i />
  </span>
)

function Head({ label, title, em, children }: { label: string; title: string; em: string; children: React.ReactNode }) {
  return (
    <header className="iac-head">
      <span className="iac-lab">{label}</span>
      <h2>
        {title} <em>{em}</em>
      </h2>
      <p>{children}</p>
    </header>
  )
}

const gbp = (p: number) => (p < 0 ? `(£${money(p)})` : `£${money(p)}`)
const sgbp = (p: number) => (p < 0 ? `-£${money(p)}` : `+£${money(p)}`)

/* -------------------------------------------------------------------------- */
/*                                    Shell                                   */
/* -------------------------------------------------------------------------- */

const NAV_CONSOLE: { label: string; icon: LucideIcon }[] = [
  { label: "Mission control", icon: Radar },
  { label: "Research desk", icon: BookOpenText },
  { label: "Workbench", icon: PenLine },
  { label: "Evals", icon: FlaskConical },
]
const NAV_OPS: { label: string; icon: LucideIcon }[] = [
  { label: "Tasks", icon: ListChecks },
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Accounting", icon: Landmark },
  { label: "Finance", icon: Wallet },
]
const AGENTS: RailAgent[] = [
  { name: "Atlas", state: "live", note: "Reconciling" },
  { name: "Sage", state: "ok", note: "Reviewing" },
  { name: "Quill", state: "off", note: "Idle" },
]

function Glyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 9h15" stroke="var(--iac-accent)" strokeWidth="1.5" />
    </svg>
  )
}

type RailAgent = { name: string; state: "ok" | "live" | "off" | "warn" | "bad"; note: string }

function Rail({
  hidden,
  active,
  agents,
  userRole,
  onGo,
  sideTools,
}: {
  hidden: boolean
  active: string
  agents: RailAgent[]
  userRole: string
  onGo: (label: string) => void
  sideTools?: React.ReactNode
}) {
  const group = (name: string, items: { label: string; icon: LucideIcon }[]) => (
    <nav className="iac-rgroup" aria-label={name}>
      <span className="iac-rlab">{name}</span>
      <div className="iac-rnav">
        {items.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className={`iac-ritem${label === active ? " is-active" : ""}`}
            aria-current={label === active ? "page" : undefined}
            onClick={() => onGo(label)}
          >
            <Icon size={15} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
  return (
    <aside className="iac-rail" aria-label="Meridian navigation" inert={hidden}>
      <div className="iac-brand">
        <Glyph />
        Meridian
      </div>
      <div className="iac-rgroup" style={{ marginTop: 4 }}>
        <span className="iac-rlab">Workspace</span>
        <button type="button" className="iac-ws" aria-label="Switch workspace">
          Harbor &amp; Finch
          <ChevronDown size={14} strokeWidth={1.5} />
        </button>
      </div>
      {group("Console", NAV_CONSOLE)}
      {group("Operations", NAV_OPS)}
      <nav className="iac-rgroup" aria-label="Agents">
        <span className="iac-rlab">Agents</span>
        <div className="iac-rnav">
          {agents.map((a) => (
            <button key={a.name} type="button" className="iac-ritem iac-ragent" onClick={() => onGo(a.name)}>
              <span className={`iac-rdot ${a.state}`} aria-hidden="true" />
              {a.name}
              <span className="iac-rlab">{a.note}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="iac-rspacer" />
      {sideTools ? <div className="iac-sidetools">{sideTools}</div> : null}
      <div className="iac-ruser">
        <span className="iac-rav" aria-hidden="true">
          AO
        </span>
        <div>
          <b>Ada Okafor</b>
          <span>{userRole}</span>
        </div>
      </div>
    </aside>
  )
}

function Top({ open, onMenu, onNewJournal }: { open: boolean; onMenu: () => void; onNewJournal: () => void }) {
  return (
    <header className="iac-top">
      <button type="button" className="iac-menu" aria-label="Open navigation" aria-expanded={open} onClick={onMenu}>
        <Menu size={16} strokeWidth={1.5} />
      </button>
      <div className="iac-ttl">
        <span className="iac-rlab iac-crumb">Operations / Accounting</span>
        <h1>Accounting</h1>
      </div>
      <div className="iac-actions">
        <label className="iac-search">
          <Search size={14} strokeWidth={1.5} />
          <input type="search" placeholder="Search" aria-label="Search" />
          <kbd>⌘K</kbd>
        </label>
        <button type="button" className="iac-tbtn exp" aria-label="Export close pack">
          <Download size={14} strokeWidth={1.5} />
          <span>Export pack</span>
        </button>
        <button type="button" className="iac-tbtn ink" onClick={onNewJournal} aria-label="New journal entry">
          <Plus size={14} strokeWidth={1.5} />
          <span className="lbl">New journal</span>
        </button>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/*                         Summary: readouts + close ruler                    */
/* -------------------------------------------------------------------------- */

const STEPS = ["Bank feeds", "Reconcile", "Accruals", "Review", "Lock"]

function Summary({ cash, ar, ap, unrec, ready, overdue, openInv, openBills }: { cash: number; ar: number; ap: number; unrec: number; ready: number; overdue: number; openInv: number; openBills: number }) {
  const cur = unrec > 0 ? 1 : 2
  const stat = (i: number) => (i < cur ? "done" : i === cur ? "now" : "next")
  const text = [
    "Done · 3 feeds",
    unrec > 0 ? `${unrec} lines open` : "Done · 14 of 14",
    cur === 2 ? "Atlas has 1 accrual to propose" : "Waits on reconcile",
    "Waits on accruals",
    "Locks Fri 6 Nov",
  ]
  return (
    <section className="iac-panel" aria-label="Close summary">
      <Crops />
      <div className="iac-readouts">
        <div className="iac-ro">
          <span className="iac-lab">Cash</span>
          <span className="iac-big">
            <span className="iac-u">£</span>
            <Num value={cash} format={fmtMoney} />
          </span>
          <span className="iac-sub">4 accounts</span>
        </div>
        <div className="iac-ro">
          <span className="iac-lab">Receivables</span>
          <span className="iac-big">
            <span className="iac-u">£</span>
            <Num value={ar} format={fmtMoney} />
          </span>
          <span className="iac-sub">
            <b>{overdue} overdue</b> of {openInv}
          </span>
        </div>
        <div className="iac-ro">
          <span className="iac-lab">Payables</span>
          <span className="iac-big">
            <span className="iac-u">£</span>
            <Num value={ap} format={fmtMoney} />
          </span>
          <span className="iac-sub">{openBills} bills open</span>
        </div>
        <div className="iac-ro">
          <span className="iac-lab">Unreconciled</span>
          <span className="iac-big">
            <Num value={unrec} format={fmtInt} />
            <span className="iac-u t">of 14</span>
          </span>
          <span className="iac-sub">{ready} ready to accept</span>
        </div>
        <div className="iac-ro">
          <span className="iac-lab">Close</span>
          <span className="iac-big">
            OCT<span className="iac-u t">DAY 3 OF 5</span>
          </span>
          <span className="iac-sub">Wed 4 Nov · due 6 Nov</span>
        </div>
      </div>
      <div className="iac-steps">
        <span className="iac-trace" style={{ "--p": cur / 5 } as React.CSSProperties} aria-hidden="true" />
        <ol className="iac-stepl" aria-label="Close checklist">
        {STEPS.map((s, i) => (
          <li key={s} className="iac-step" data-s={stat(i)} aria-current={stat(i) === "now" ? "step" : undefined}>
            <span className="n">
              {stat(i) === "done" && <Check size={11} strokeWidth={2} aria-hidden="true" />}
              <em>{String(i + 1).padStart(2, "0")}</em> {s}
            </span>
            <span className="st">{text[i]}</span>
          </li>
        ))}
        </ol>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Reconcile                                 */
/* -------------------------------------------------------------------------- */

type Link = { key: string; conf: number; manual?: boolean; created?: boolean }

function useRecon(post: (j: Omit<Journal, "id">) => void) {
  const [links, setLinks] = React.useState<Record<string, Link>>(() => Object.fromEntries(BANK.filter((b) => b.match).map((b) => [b.id, { key: b.match!.key, conf: b.match!.conf }])))
  const [done, setDone] = React.useState<Record<string, true>>({})
  const [leaving, setLeaving] = React.useState<Record<string, number>>({})
  const [rejected, setRejected] = React.useState<Record<string, true>>({})
  const [queried, setQueried] = React.useState<Record<string, true>>({})
  const timers = React.useRef<number[]>([])
  React.useEffect(() => {
    const t = timers.current
    return () => t.forEach((x) => window.clearTimeout(x))
  }, [])

  const settleOut = (ids: string[]) => {
    setLeaving((l) => ({ ...l, ...Object.fromEntries(ids.map((id, i) => [id, i * 60])) }))
    const t = window.setTimeout(() => {
      setDone((d) => ({ ...d, ...Object.fromEntries(ids.map((id) => [id, true as const])) }))
      setLeaving((l) => {
        const n = { ...l }
        ids.forEach((id) => delete n[id])
        return n
      })
    }, 700 + (ids.length - 1) * 60)
    timers.current.push(t)
  }
  const open = BANK.filter((b) => !done[b.id] && leaving[b.id] === undefined)
  const ready = open.filter((b) => links[b.id] && links[b.id].conf >= 0.95)

  return {
    links,
    done,
    leaving,
    rejected,
    queried,
    unrec: open.length,
    ready: ready.length,
    accept: (id: string) => settleOut([id]),
    acceptAll: () => ready.length && settleOut(ready.map((b) => b.id)),
    reject: (id: string) => {
      setLinks((l) => {
        const n = { ...l }
        delete n[id]
        return n
      })
      setRejected((r) => ({ ...r, [id]: true }))
    },
    query: (id: string) => setQueried((q) => ({ ...q, [id]: true })),
    matchManual: (id: string, key: string) => {
      setLinks((l) => ({ ...l, [id]: { key, conf: 1, manual: true } }))
      setRejected((r) => {
        const n = { ...r }
        delete n[id]
        return n
      })
    },
    create: (b: BankLine) => {
      const s = b.suggest
      if (!s) return
      const amt = Math.abs(b.amt)
      const net = s.vat ? Math.round(amt / 1.2) : amt
      const vat = amt - net
      const lines: JLine[] = [{ acct: s.acct, dr: net, cr: 0 }]
      if (vat) lines.push({ acct: "2100", dr: vat, cr: 0 })
      lines.push({ acct: "1010", dr: 0, cr: amt })
      const key = `new-${b.id}`
      post({ key, date: b.date, ref: `BK-${b.ref.replace(/\s+/g, "")}`, memo: s.memo, src: "bank", lines })
      setLinks((l) => ({ ...l, [b.id]: { key, conf: 1, manual: true, created: true } }))
      settleOut([b.id])
    },
  }
}
type Rec = ReturnType<typeof useRecon>

function BankCell({ b, link, mode }: { b: BankLine; link?: Link; mode: "open" | "rejected" | "queried" }) {
  const out = b.amt < 0
  return (
    <span className="iac-cell">
      <span className="d">{dShort(b.date)}</span>
      <span className="t" title={b.desc}>
        {b.desc}
      </span>
      <span className="s">
        {link ? (
          <>
            <ConfChip conf={link.conf} manual={link.manual} />
            <span className="iac-note">{link.created ? "Entry created from this line" : link.manual ? "Matched by hand" : b.match?.note}</span>
          </>
        ) : (
          <>
            <span className="iac-flag">{mode === "rejected" ? "Rejected" : mode === "queried" ? "Queried" : "Unmatched"}</span>
            <span className="iac-note">{mode === "rejected" ? "Pick a ledger entry to match by hand" : mode === "queried" ? "Raised with the bank, awaiting reply" : (b.suggest?.note ?? "No ledger entry for this line")}</span>
          </>
        )}
      </span>
      <span className={"a" + (out ? " neg" : "")}>
        {paren(b.amt)}
        <small>{out ? "OUT" : "IN"}</small>
      </span>
    </span>
  )
}

function LedgerCell({ j, bankId, outstanding }: { j: Journal; bankId?: string; outstanding: boolean }) {
  const amt = lineFor(j, "1010")
  return (
    <span className="iac-cell">
      <span className="d">{dShort(j.date)}</span>
      <span className="t" title={j.memo}>
        {j.memo}
      </span>
      <span className="s">
        {bankId ? (
          <span className="iac-note">
            {j.id} · matched to {bankId}
          </span>
        ) : outstanding ? (
          <>
            <span className="iac-flag mute">Not presented</span>
            <span className="iac-note">{j.ref} awaits the bank</span>
          </>
        ) : (
          <>
            <span className="iac-flag">Unmatched</span>
            <span className="iac-note">{j.id} has no bank line</span>
          </>
        )}
      </span>
      <span className={"a" + (amt < 0 ? " neg" : "")}>
        {paren(amt)}
        <small>{amt < 0 ? "CR" : "DR"}</small>
      </span>
    </span>
  )
}

const ROW_H = 56
const GUT = 96

function Reconcile({ rec, journal, ledger1010, wide }: { rec: Rec; journal: Journal[]; ledger1010: number; wide: boolean }) {
  const [sel, setSel] = React.useState<{ bank?: string; ledger?: string }>({})
  const byKey = React.useMemo(() => new Map(journal.map((j) => [j.key, j])), [journal])

  const bankRows = BANK.filter((b) => !rec.done[b.id])
  const doneKeys = new Set(BANK.filter((b) => rec.done[b.id] && rec.links[b.id]).map((b) => rec.links[b.id].key))
  const keyList: string[] = []
  for (const k of [...BANK.filter((b) => b.match).map((b) => b.match!.key), ...OUTSTANDING, ...Object.values(rec.links).map((l) => l.key)]) {
    if (!keyList.includes(k) && !doneKeys.has(k)) keyList.push(k)
  }
  const ledgerRows = keyList
    .map((k) => byKey.get(k))
    .filter((j): j is Journal => !!j)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const bankOfKey = new Map<string, string>()
  for (const b of bankRows) if (rec.links[b.id]) bankOfKey.set(rec.links[b.id].key, b.id)

  const modeOf = (id: string): "open" | "rejected" | "queried" => (rec.rejected[id] ? "rejected" : rec.queried[id] ? "queried" : "open")
  const delay = (id: string) => ({ "--d": `${rec.leaving[id] ?? 0}ms` }) as React.CSSProperties

  const selBank = sel.bank && bankRows.some((b) => b.id === sel.bank) ? BANK.find((b) => b.id === sel.bank) : undefined
  const selLedger = sel.ledger ? ledgerRows.find((j) => j.key === sel.ledger) : undefined
  const canPair = !!(selBank && selLedger && !rec.links[selBank.id] && !bankOfKey.has(selLedger.key))
  const amtMatch = canPair && selBank && selLedger ? selBank.amt === lineFor(selLedger, "1010") : false

  const clickBank = (b: BankLine) => {
    const l = rec.links[b.id]
    setSel(l ? { bank: b.id, ledger: l.key } : { bank: b.id, ledger: sel.ledger && !bankOfKey.has(sel.ledger) ? sel.ledger : undefined })
  }
  const clickLedger = (k: string) => {
    const bid = bankOfKey.get(k)
    setSel(bid ? { bank: bid, ledger: k } : { ledger: k, bank: sel.bank && !rec.links[sel.bank] ? sel.bank : undefined })
  }

  const unbooked = BANK.filter((b) => b.suggest && !rec.links[b.id]).reduce((s, b) => s + b.amt, 0)
  const cheques = -OUTSTANDING.reduce((s, k) => s + (byKey.get(k) ? lineFor(byKey.get(k)!, "1010") : 0), 0)
  const diff = STATEMENT - (ledger1010 + cheques + unbooked)

  const linked = bankRows.filter((b) => rec.links[b.id] && rec.leaving[b.id] === undefined).length
  const open = rec.unrec
  const none = open - linked
  const note =
    open === 0
      ? "All 14 bank lines are reconciled. The two cheques stay on the ledger until the bank pays them. Accruals is next."
      : [
          `${linked} of ${open} open lines have a ledger partner${rec.ready ? `. ${rec.ready} clear 0.95 and can go through together.` : ", none above 0.95."}`,
          linked - rec.ready > 0 ? `${linked - rec.ready} ${linked - rec.ready === 1 ? "needs" : "need"} a closer look${none ? "," : "."}` : "",
          none ? `${linked - rec.ready > 0 ? "and " : ""}${none} ${none === 1 ? "has" : "have"} no entry in the books yet.` : "",
        ]
          .filter(Boolean)
          .join(" ")

  const actions = (b: BankLine) => {
    const l = rec.links[b.id]
    const gone = rec.leaving[b.id] !== undefined
    return (
      <span className="iac-acts">
        {l ? (
          <>
            <button className="iac-ib go" aria-label={`Accept match for ${b.desc}`} title="Accept" disabled={gone} onClick={() => (rec.accept(b.id), setSel({}))}>
              <Check size={14} strokeWidth={1.75} />
            </button>
            <button className="iac-ib" aria-label={`Reject match for ${b.desc}`} title="Reject" disabled={gone} onClick={() => rec.reject(b.id)}>
              <X size={14} strokeWidth={1.75} />
            </button>
          </>
        ) : (
          <>
            {b.suggest && (
              <button className="iac-ib go" aria-label={`Create ledger entry for ${b.desc}`} title="Create entry from suggestion" disabled={gone} onClick={() => (rec.create(b), setSel({}))}>
                <Plus size={14} strokeWidth={1.75} />
              </button>
            )}
            <button className="iac-ib" aria-label={`Query ${b.desc} with the bank`} title="Query" disabled={!!rec.queried[b.id]} onClick={() => rec.query(b.id)}>
              <Flag size={13} strokeWidth={1.5} />
            </button>
          </>
        )}
      </span>
    )
  }

  const rows = Math.max(bankRows.length, ledgerRows.length, 1)
  const wires = bankRows.flatMap((b, i) => {
    const l = rec.links[b.id]
    if (!l) return []
    const j = ledgerRows.findIndex((x) => x.key === l.key)
    return j < 0 ? [] : [{ b, l, i, j }]
  })

  return (
    <div className="iac-panel" style={{ "--gut": `${GUT}px` } as React.CSSProperties}>
      <Crops />
      <div className="iac-rechead">
        <div className="iac-margin">
          <span className="iac-lab who">Atlas</span>
          <p className="tx">
            <Typed key={open === 0 ? "done" : "work"} text={note} />
          </p>
        </div>
        <span className="iac-leader" aria-hidden="true" />
        <button className="iac-btn pri" disabled={rec.ready === 0} onClick={() => (rec.acceptAll(), setSel({}))}>
          <Check size={14} strokeWidth={1.75} aria-hidden="true" />
          Accept all ≥ 0.95
          <span className="iac-tabn">{rec.ready}</span>
        </button>
      </div>

      <div className="iac-proof" role="group" aria-label="Bank reconciliation proof, operating account">
        <div>
          <span className="iac-lab">Statement</span>
          <span className="v">{paren(STATEMENT)}</span>
        </div>
        <div>
          <span className="iac-lab">Ledger 1010</span>
          <span className="v">{paren(ledger1010)}</span>
        </div>
        <div>
          <span className="iac-lab">+ Not presented</span>
          <span className="v">{paren(cheques)}</span>
        </div>
        <div>
          <span className="iac-lab">+ Not in books</span>
          <span className="v">{paren(unbooked)}</span>
        </div>
        <div>
          <span className="iac-lab">Difference</span>
          <span className={"v" + (diff === 0 ? " ok" : "")}>{diff === 0 ? "0.00 ✓" : paren(diff)}</span>
        </div>
      </div>

      {((selBank && !rec.links[selBank.id]) || (selLedger && !bankOfKey.has(selLedger.key))) && (
        <div className="iac-manual" role="status">
          <p>
            {canPair && selBank && selLedger ? (
              <>
                Match <b>{selBank.desc}</b> ({paren(selBank.amt)}) with <b>{selLedger.id}</b> ({paren(lineFor(selLedger, "1010"))})?
                {!amtMatch && <> The amounts differ, so these cannot be paired one to one.</>}
              </>
            ) : selBank && !rec.links[selBank.id] ? (
              <>Now pick the ledger entry for <b>{selBank.desc}</b> on the right.</>
            ) : (
              <>Now pick the bank line for <b>{selLedger?.id}</b> on the left.</>
            )}
          </p>
          <button className="iac-btn sm" disabled={!canPair || !amtMatch} onClick={() => selBank && selLedger && (rec.matchManual(selBank.id, selLedger.key), setSel({ bank: selBank.id, ledger: selLedger.key }))}>
            <Link2 size={13} strokeWidth={1.5} aria-hidden="true" />
            Match selected
          </button>
          <button className="iac-btn sm ghost" onClick={() => setSel({})}>
            Clear
          </button>
        </div>
      )}

      {wide ? (
        <>
          <div className="iac-colhead">
            <div>
              <span className="iac-lab">Bank feed</span>
              <span className="iac-lab">{rec.unrec} open</span>
            </div>
            <div style={{ padding: 0 }} />
            <div>
              <span className="iac-lab">Ledger 1010</span>
              <span className="iac-lab">{ledgerRows.length} entries</span>
            </div>
          </div>
          <div className="iac-match" style={{ minHeight: rows * ROW_H }}>
            <ul className="iac-col" aria-label="Bank transactions">
              {bankRows.length === 0 && <li className="iac-empty">Every bank line is reconciled.</li>}
              {bankRows.map((b) => {
                const l = rec.links[b.id]
                return (
                  <li key={b.id} className={"iac-row" + (sel.bank === b.id ? " is-sel" : "") + (l ? "" : " is-flag") + (rec.leaving[b.id] !== undefined ? " is-out" : "")} style={delay(b.id)}>
                    <button className="iac-rmain" onClick={() => clickBank(b)} aria-pressed={sel.bank === b.id}>
                      <BankCell b={b} link={l} mode={modeOf(b.id)} />
                    </button>
                    {actions(b)}
                  </li>
                )
              })}
            </ul>
            <div className="iac-gut" aria-hidden="true">
              <svg className="iac-wires" width={GUT} height={rows * ROW_H} viewBox={`0 0 ${GUT} ${rows * ROW_H}`}>
                {wires.map(({ b, l, i, j }) => {
                  const y1 = i * ROW_H + ROW_H / 2
                  const y2 = j * ROW_H + ROW_H / 2
                  const cls = "iac-wire" + (l.conf < 0.8 ? " low" : "") + (sel.bank === b.id ? " sel" : "") + (rec.leaving[b.id] !== undefined ? " out" : "")
                  return (
                    <g key={b.id}>
                      <path d={`M0 ${y1} C ${GUT / 2} ${y1}, ${GUT / 2} ${y2}, ${GUT} ${y2}`} pathLength={1} className={cls} style={{ "--i": i, "--d": `${rec.leaving[b.id] ?? 0}ms` } as React.CSSProperties} />
                      <circle cx="0" cy={y1} r="2.5" className={"iac-end" + (sel.bank === b.id ? " sel" : "")} />
                      <circle cx={GUT} cy={y2} r="2.5" className={"iac-end" + (sel.bank === b.id ? " sel" : "")} />
                    </g>
                  )
                })}
                {bankRows.map((b, i) =>
                  rec.links[b.id] ? null : (
                    <g key={"s" + b.id}>
                      <line className="iac-stub" x1="0" x2="26" y1={i * ROW_H + ROW_H / 2} y2={i * ROW_H + ROW_H / 2} />
                      <circle cx="26" cy={i * ROW_H + ROW_H / 2} r="2.5" className="iac-end warn" />
                    </g>
                  ),
                )}
                {ledgerRows.map((j, i) =>
                  bankOfKey.has(j.key) ? null : (
                    <g key={"l" + j.key}>
                      <line className="iac-stub" x1={GUT} x2={GUT - 26} y1={i * ROW_H + ROW_H / 2} y2={i * ROW_H + ROW_H / 2} />
                      <circle cx={GUT - 26} cy={i * ROW_H + ROW_H / 2} r="2.5" className="iac-end warn" />
                    </g>
                  ),
                )}
              </svg>
            </div>
            <ul className="iac-col" aria-label="Ledger entries">
              {ledgerRows.map((j) => {
                const bid = bankOfKey.get(j.key)
                const out = outstandingKey(j.key)
                return (
                  <li key={j.key} className={"iac-row" + (sel.ledger === j.key ? " is-sel" : "") + (!bid && !out ? " is-flag" : "") + (bid && rec.leaving[bid] !== undefined ? " is-out" : "")} style={bid ? delay(bid) : undefined}>
                    <button className="iac-rmain" onClick={() => clickLedger(j.key)} aria-pressed={sel.ledger === j.key}>
                      <LedgerCell j={j} bankId={bid} outstanding={out} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      ) : (
        <div className="iac-cards">
          {bankRows.length === 0 && <p className="iac-empty">Every bank line is reconciled.</p>}
          {bankRows.map((b) => {
            const l = rec.links[b.id]
            const j = l ? byKey.get(l.key) : undefined
            return (
              <article key={b.id} className={"iac-pc" + (sel.bank === b.id ? " is-sel" : "") + (l ? "" : " is-flag") + (rec.leaving[b.id] !== undefined ? " is-out" : "")} style={delay(b.id)}>
                <button style={{ display: "block", width: "100%" }} onClick={() => clickBank(b)} aria-pressed={sel.bank === b.id}>
                  <BankCell b={b} link={l} mode={modeOf(b.id)} />
                </button>
                <div className="mid">
                  <span className="iac-lab">{j ? "Ledger entry" : "No ledger partner"}</span>
                </div>
                {j && <LedgerCell j={j} bankId={b.id} outstanding={false} />}
                <div className="btns">
                  {l ? (
                    <>
                      <button className="iac-btn sm pri" disabled={rec.leaving[b.id] !== undefined} onClick={() => (rec.accept(b.id), setSel({}))}>
                        <Check size={13} strokeWidth={1.75} aria-hidden="true" />
                        Accept
                      </button>
                      <button className="iac-btn sm" disabled={rec.leaving[b.id] !== undefined} onClick={() => rec.reject(b.id)}>
                        <X size={13} strokeWidth={1.75} aria-hidden="true" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <>
                      {b.suggest && (
                        <button className="iac-btn sm pri" onClick={() => (rec.create(b), setSel({}))}>
                          <Plus size={13} strokeWidth={1.75} aria-hidden="true" />
                          Create entry
                        </button>
                      )}
                      <button className="iac-btn sm" disabled={!!rec.queried[b.id]} onClick={() => rec.query(b.id)}>
                        <Flag size={13} strokeWidth={1.5} aria-hidden="true" />
                        Query
                      </button>
                    </>
                  )}
                </div>
              </article>
            )
          })}
          <p className="iac-lab" style={{ padding: "6px 2px 0" }}>
            Ledger entries without a bank line
          </p>
          {ledgerRows
            .filter((j) => !bankOfKey.has(j.key))
            .map((j) => (
              <article key={j.key} className={"iac-pc" + (sel.ledger === j.key ? " is-sel" : "")}>
                <button style={{ display: "block", width: "100%" }} onClick={() => clickLedger(j.key)} aria-pressed={sel.ledger === j.key}>
                  <LedgerCell j={j} outstanding={outstandingKey(j.key)} />
                </button>
              </article>
            ))}
        </div>
      )}
      <p className="iac-fig">
        <b>FIG. 1</b> — Bank feed against ledger, operating account 1010, 22 to 31 Oct. Dither density = Atlas confidence; dashed rule = low confidence.
      </p>
    </div>
  )
}
const outstandingKey = (k: string) => OUTSTANDING.includes(k)

/* -------------------------------------------------------------------------- */
/*                                  Invoices                                  */
/* -------------------------------------------------------------------------- */

function reminderText(i: Invoice) {
  const over = daysOver(i)
  const total = gbp(invTotal(i))
  const head = over > 0 ? `Invoice ${i.id}, ${total}, ${over} days overdue` : `Invoice ${i.id}, ${total}, due ${dShort(invDue(i))}`
  const body =
    over <= 0
      ? `A quick note ahead of time: invoice ${i.id} for ${total} falls due on ${dLong(invDue(i))}. Payment details are on the invoice, and the reference to quote is ${i.id}.`
      : i.reminders === 0
        ? `Our records show invoice ${i.id} for ${total}, issued ${dLong(i.issued)}, fell due on ${dLong(invDue(i))} and is now ${over} days overdue. If it has crossed with your payment, please ignore this note.`
        : i.reminders === 1
          ? `Following my earlier note, invoice ${i.id} for ${total} is still unpaid, ${over} days after its due date of ${dLong(invDue(i))}. Could you confirm a payment date this week?`
          : `Invoice ${i.id} for ${total} is now ${over} days past its due date of ${dLong(invDue(i))}, and this is our ${i.reminders === 2 ? "third" : "fourth"} reminder. Please pay by Friday 6 November. After that we will apply statutory interest and compensation under the Late Payment of Commercial Debts (Interest) Act 1998.`
  return `Subject: ${head}\n\nHi ${i.contact},\n\n${body}\n\nBank details and a copy of the invoice are attached. Reply to this email if anything is in dispute and I will sort it with you directly.\n\nThanks,\nAda Okafor\nHarbor & Finch`
}
function invoiceNote(i: Invoice) {
  const s = invStatus(i)
  if (s === "Paid") return `Settled on ${dLong(i.paidOn!)}, ${Math.abs(dayNum(i.paidOn!) - dayNum(invDue(i)))} days ${i.paidOn! > invDue(i) ? "after" : "before"} the due date.`
  if (s === "Draft") return "Drafted from the 28 Oct wholesale order. Not posted to the ledger until it is issued."
  if (s === "Overdue") return i.reminders >= 2 ? `${i.customer} has needed ${i.reminders} reminders before. A call lands faster than a fourth email.` : `Reminder ${i.reminders + 1} of this invoice. Tone is set from how late it is and how many have gone.`
  return "Not yet due. A heads-up two days before the due date has the best response rate."
}

function Invoices({ openId, onOpen, reminded }: { openId: string | null; onOpen: (id: string) => void; reminded: Record<string, number> }) {
  const [filter, setFilter] = React.useState<"All" | InvStatus>("All")
  const [q, setQ] = React.useState("")
  const buckets = aging(INVOICES)
  const totalOpen = buckets.reduce((s, b) => s + b.amt, 0)
  const counts = { All: INVOICES.length, Draft: 0, Sent: 0, Overdue: 0, Paid: 0 }
  for (const i of INVOICES) counts[invStatus(i)] += 1
  const list = INVOICES.filter((i) => (filter === "All" || invStatus(i) === filter) && (q === "" || `${i.id} ${i.customer}`.toLowerCase().includes(q.toLowerCase())))
  const sum = list.reduce((s, i) => s + invTotal(i), 0)
  return (
    <>
      <Head label="02 · Invoices" title="Who owes us," em="and since when">
        Sales invoices with 30-day terms. Every issued invoice posts to trade debtors; drafts stay out of the books until they are sent.
      </Head>
      <section className="iac-panel" aria-label="Receivables aging">
        <Crops />
        <div className="iac-aging">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0 12px", flexWrap: "wrap" }}>
            <span className="iac-lab">Receivables aging · as at 31 Oct 2026</span>
            <span className="iac-lab">
              Total <b style={{ fontWeight: 500, color: "var(--iac-ink)" }}>£{money(totalOpen)}</b>
            </span>
          </div>
          <div className="iac-agebar" role="img" aria-label={buckets.map((b) => `${b.label} £${money(b.amt)}`).join(", ")}>
            {buckets.map((b) => (
              <div key={b.key} style={{ flexGrow: b.amt }}>
                <Dither level={b.level} />
              </div>
            ))}
          </div>
          <div className="iac-agekey">
            {buckets.map((b) => (
              <div key={b.key}>
                <span className="iac-lab">{b.label}</span>
                <span className="v">
                  <span className="iac-u">£</span>
                  {money(b.amt)}
                </span>
                <span className="iac-sub">
                  {b.n} {b.n === 1 ? "invoice" : "invoices"} · {((b.amt / totalOpen) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="iac-fig">
          <b>FIG. 2</b> — Open invoices by days past due. Denser dither = older debt.
        </p>
      </section>

      <div className="iac-tools">
        <div className="iac-seg" role="group" aria-label="Filter by status">
          {(["All", "Draft", "Sent", "Overdue", "Paid"] as const).map((s) => (
            <button key={s} aria-pressed={filter === s} onClick={() => setFilter(s)}>
              {s}
              <span className="c">{counts[s]}</span>
            </button>
          ))}
        </div>
        <label className="iac-find">
          <Search size={14} strokeWidth={1.5} aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Number or customer" aria-label="Search invoices" />
        </label>
      </div>

      <section className="iac-panel" aria-label="Invoices">
        <Crops />
        <div className="iac-th" aria-hidden="true">
          <span className="iac-lab">Number</span>
          <span className="iac-lab">Customer</span>
          <span className="iac-lab">Issued</span>
          <span className="iac-lab">Due</span>
          <span className="iac-lab r">Amount £</span>
          <span className="iac-lab">Status</span>
        </div>
        <ul>
          {list.map((i) => {
            const s = invStatus(i)
            return (
              <li key={i.id}>
                <button className="iac-irow" aria-pressed={openId === i.id} onClick={() => onOpen(i.id)}>
                  <span className="no">{i.id}</span>
                  <span className="cu">{i.customer}</span>
                  <span className="dt i">{dShort(i.issued)}</span>
                  <span className="dt u">{dShort(invDue(i))}</span>
                  <span className="am r">{money(invTotal(i))}</span>
                  <span className="st-c">
                    <span className="iac-st" data-s={s}>
                      <i />
                      {s}
                      {s === "Overdue" && <small>{daysOver(i)}d</small>}
                      {(reminded[i.id] ?? 0) > 0 && <small>· +{reminded[i.id]}</small>}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
          {list.length === 0 && <li className="iac-empty">No invoices match.</li>}
        </ul>
        <div className="iac-tfoot">
          <span>
            <b>{list.length}</b> invoices
          </span>
          <span>
            Total <b>£{money(sum)}</b>
          </span>
        </div>
      </section>
    </>
  )
}

function InvoiceDrawer({ inv, extra, onClose, onReminded }: { inv: Invoice; extra: number; onClose: () => void; onReminded: (id: string, to: string) => void }) {
  const [phase, setPhase] = React.useState<"idle" | "drafting" | "ready" | "sent">("idle")
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const toEnd = () => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  const closeCb = React.useRef(onClose)
  React.useEffect(() => {
    closeCb.current = onClose
  })
  const s = invStatus(inv)
  const reminders = inv.reminders + extra
  const draft = reminderText({ ...inv, reminders })
  React.useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCb.current()
    }
    window.addEventListener("keydown", key)
    return () => {
      window.removeEventListener("keydown", key)
      prev?.focus?.()
    }
  }, [])
  const net = invNet(inv)
  const vat = invVat(inv)
  return (
    <div className="iac-drawer-wrap">
      <div className="iac-dscrim" onClick={onClose} aria-hidden="true" />
      <aside className="iac-drawer" role="dialog" aria-modal="true" aria-label={`Invoice ${inv.id}`}>
        <div className="iac-dhead">
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="iac-lab">
              {inv.id} · {inv.po ?? "No PO"}
            </span>
            <h3>{inv.customer}</h3>
            <span className="iac-st" data-s={s} style={{ marginTop: 4 }}>
              <i />
              {s}
              {s === "Overdue" && <small>{daysOver(inv)} days past due</small>}
            </span>
          </div>
          <button ref={closeRef} className="iac-ib" onClick={onClose} aria-label="Close invoice">
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
        <div className="iac-dbody" ref={bodyRef}>
          <div className="iac-meta">
            <div>
              <span className="iac-lab">Issued</span>
              <div className="v">{dLong(inv.issued)}</div>
            </div>
            <div>
              <span className="iac-lab">Due · net 30</span>
              <div className="v">{dLong(invDue(inv))}</div>
            </div>
            <div>
              <span className="iac-lab">Bill to</span>
              <div className="v" title={inv.email}>
                {inv.email}
              </div>
            </div>
            <div>
              <span className="iac-lab">Reminders sent</span>
              <div className="v">{reminders}</div>
            </div>
          </div>

          <table className="iac-lines">
            <thead>
              <tr>
                <th>Description</th>
                <th className="r">Qty</th>
                <th className="r">Unit £</th>
                <th className="r">Net £</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((l, idx) => (
                <tr key={idx}>
                  <td>{l.desc}</td>
                  <td className="r">{l.qty}</td>
                  <td className="r">{money(l.unit)}</td>
                  <td className="r">{money(l.qty * l.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="iac-tot">
            <div>
              <span>Subtotal</span>
              <span className="m">{money(net)}</span>
            </div>
            <div>
              <span>{inv.vat ? `VAT ${inv.vat * 100}%` : "VAT 0% · export, zero-rated"}</span>
              <span className="m">{money(vat)}</span>
            </div>
            <div className="grand">
              <span>Total</span>
              <span className="m">£{money(invTotal(inv))}</span>
            </div>
            {s === "Paid" && (
              <div style={{ color: "var(--iac-ok)" }}>
                <span>Received {dShort(inv.paidOn!)}</span>
                <span className="m">({money(invTotal(inv))})</span>
              </div>
            )}
            <div>
              <span className="iac-lab" style={{ alignSelf: "center" }}>
                Balance due
              </span>
              <span className="m">£{money(s === "Paid" || s === "Draft" ? 0 : invTotal(inv))}</span>
            </div>
          </div>

          <div className="iac-aside">
            <span className="hl" aria-hidden="true" />
            <p>
              <span className="iac-lab">Atlas</span>
              {invoiceNote(inv)}
            </p>
          </div>

          {(phase === "drafting" || phase === "ready") && (
            <div>
              <span className="iac-lab">Draft by Atlas · to {inv.email}</span>
              <div className="iac-draft" style={{ marginTop: 6 }} aria-live="polite">
                <Typed text={draft} step={4} tick={18} onTick={toEnd} onDone={() => setPhase((p) => (p === "drafting" ? "ready" : p))} />
              </div>
            </div>
          )}
          {phase === "sent" && (
            <p className="iac-lab" role="status" style={{ color: "var(--iac-ok)" }}>
              ✓ Reminder queued to {inv.email} · logged on {inv.id}
            </p>
          )}
        </div>
        <div className="iac-dfoot">
          {(s === "Sent" || s === "Overdue") && phase === "idle" && (
            <button className="iac-btn pri" onClick={() => setPhase("drafting")}>
              <Send size={13} strokeWidth={1.5} aria-hidden="true" />
              Send reminder
            </button>
          )}
          {phase === "drafting" && (
            <button className="iac-btn" disabled>
              Atlas is drafting
            </button>
          )}
          {phase === "ready" && (
            <>
              <button
                className="iac-btn pri"
                onClick={() => {
                  setPhase("sent")
                  onReminded(inv.id, inv.email)
                }}
              >
                <Send size={13} strokeWidth={1.5} aria-hidden="true" />
                Send now
              </button>
              <button className="iac-btn ghost" onClick={() => setPhase("idle")}>
                Discard
              </button>
            </>
          )}
          {phase === "sent" && <span className="iac-lab">Sent</span>}
          {s === "Draft" && <span className="iac-lab">Draft · issue from Workbench</span>}
          {s === "Paid" && <span className="iac-lab">Paid in full</span>}
          <span className="iac-sp" />
          <span className="iac-lab">Esc to close</span>
        </div>
      </aside>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Ledger                                   */
/* -------------------------------------------------------------------------- */

const SRC: Record<Source, string> = { bank: "Bank", invoice: "Sales", bill: "Bill", payroll: "Payroll", stripe: "Payout", manual: "Manual", agent: "Atlas" }
const byDate = (a: Journal, b: Journal) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)

type FormLine = { k: number; acct: string; dr: string; cr: string }

function JournalForm({ nextId, onPost, onClose }: { nextId: string; onPost: (j: Omit<Journal, "id">) => void; onClose: () => void }) {
  const [date, setDate] = React.useState(AS_AT)
  const [memo, setMemo] = React.useState("")
  const [lines, setLines] = React.useState<FormLine[]>([
    { k: 1, acct: "", dr: "", cr: "" },
    { k: 2, acct: "", dr: "", cr: "" },
  ])
  const seq = React.useRef(3)
  const parsed = lines.map((l) => ({ ...l, d: parseMoney(l.dr), c: parseMoney(l.cr) }))
  const totalDr = parsed.reduce((s, l) => s + (l.d ?? 0), 0)
  const totalCr = parsed.reduce((s, l) => s + (l.c ?? 0), 0)
  const used = parsed.filter((l) => (l.d ?? 1) > 0 || (l.c ?? 1) > 0 || l.acct !== "")
  const err = (l: (typeof parsed)[number]) => {
    if (l.d === null || l.c === null) return "Enter an amount such as 640.00"
    if (l.d > 0 && l.c > 0) return "Use a debit or a credit, not both"
    if (l.acct === "" && (l.d > 0 || l.c > 0)) return "Choose an account"
    if (l.acct !== "" && l.d === 0 && l.c === 0) return "Add an amount"
    return ""
  }
  const firstErr = used.map(err).find((e) => e !== "") ?? ""
  const diff = totalDr - totalCr
  const balanced = totalDr > 0 && diff === 0
  const dateOk = date >= PERIOD_START && date <= AS_AT
  const amtLines = used.filter((l) => (l.d ?? 0) > 0 || (l.c ?? 0) > 0)
  const reason = !dateOk ? "Date must fall in October 2026" : memo.trim() === "" ? "Add a memo" : firstErr !== "" ? firstErr : amtLines.length < 2 ? "Needs at least two lines" : !balanced ? (diff > 0 ? `Credits are short by ${money(diff)}` : `Debits are short by ${money(-diff)}`) : ""
  const max = Math.max(totalDr, totalCr, 1)
  const setLine = (k: number, patch: Partial<FormLine>) => setLines((ls) => ls.map((l) => (l.k === k ? { ...l, ...patch } : l)))
  const suggest = () => {
    setMemo("Accrue October warehouse electricity (estimate)")
    setLines([
      { k: 1, acct: "6400", dr: "640.00", cr: "" },
      { k: 2, acct: "2300", dr: "", cr: "640.00" },
    ])
    seq.current = 3
  }
  const post = () => {
    if (reason !== "") return
    onPost({
      key: `manual-${nextId}`,
      date,
      ref: nextId,
      memo: memo.trim(),
      src: "manual",
      lines: amtLines.map((l) => ({ acct: l.acct, dr: l.d ?? 0, cr: l.c ?? 0 })),
    })
  }
  return (
    <form
      className="iac-form"
      aria-label="New journal entry"
      onSubmit={(e) => {
        e.preventDefault()
        post()
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="iac-lab">New journal entry · {nextId}</span>
        <span className="iac-sp" />
        <button type="button" className="iac-btn sm" onClick={suggest}>
          Use Atlas suggestion
        </button>
        <button type="button" className="iac-ib" onClick={onClose} aria-label="Close journal form">
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
      <div className="iac-fgrid">
        <label className="iac-fld">
          <span className="iac-lab">Date</span>
          <input className="iac-in" type="date" value={date} min={PERIOD_START} max={AS_AT} onChange={(e) => setDate(e.target.value)} aria-invalid={!dateOk} />
        </label>
        <label className="iac-fld">
          <span className="iac-lab">Reference</span>
          <input className="iac-in num" value={nextId} readOnly aria-readonly="true" />
        </label>
        <label className="iac-fld">
          <span className="iac-lab">Memo</span>
          <input className="iac-in" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="What this entry records" />
        </label>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <div className="iac-fl h">
          <span className="iac-lab">Account</span>
          <span className="iac-lab" style={{ textAlign: "right" }}>
            Debit £
          </span>
          <span className="iac-lab" style={{ textAlign: "right" }}>
            Credit £
          </span>
          <span />
        </div>
        {parsed.map((l, idx) => {
          const bad = err(l) !== "" && used.includes(l)
          return (
            <div className="iac-fl" key={l.k}>
              <select className="iac-in" value={l.acct} onChange={(e) => setLine(l.k, { acct: e.target.value })} aria-label={`Line ${idx + 1} account`}>
                <option value="">Choose account</option>
                {GROUPS.map((g) => (
                  <optgroup key={g} label={g}>
                    {ACCOUNTS.filter((a) => a.group === g).map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.code} · {a.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input className="iac-in num" inputMode="decimal" value={l.dr} placeholder="0.00" aria-label={`Line ${idx + 1} debit`} aria-invalid={bad && l.d === null} onChange={(e) => setLine(l.k, { dr: e.target.value, ...(parseMoney(e.target.value) ? { cr: "" } : {}) })} />
              <input className="iac-in num" inputMode="decimal" value={l.cr} placeholder="0.00" aria-label={`Line ${idx + 1} credit`} aria-invalid={bad && l.c === null} onChange={(e) => setLine(l.k, { cr: e.target.value, ...(parseMoney(e.target.value) ? { dr: "" } : {}) })} />
              <button type="button" className="iac-ib" aria-label={`Remove line ${idx + 1}`} disabled={lines.length <= 2} onClick={() => setLines((ls) => ls.filter((x) => x.k !== l.k))}>
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          )
        })}
        <div>
          <button
            type="button"
            className="iac-btn sm ghost"
            onClick={() => {
              setLines((ls) => [...ls, { k: seq.current++, acct: "", dr: "", cr: "" }])
            }}
          >
            <Plus size={13} strokeWidth={1.5} aria-hidden="true" />
            Add line
          </button>
        </div>
      </div>

      <div className="iac-bal" role="status" aria-live="polite">
        <div className={"iac-gauge" + (balanced ? " ok" : "")}>
          <div className="row">
            <span className="iac-lab">Dr</span>
            <span className="bar">
              <i style={{ width: `${(totalDr / max) * 100}%` }} />
              <b style={{ left: `calc(${(totalDr / max) * 100}% - 1px)` }} />
            </span>
          </div>
          <div className="row">
            <span className="iac-lab">Cr</span>
            <span className="bar">
              <i style={{ width: `${(totalCr / max) * 100}%` }} />
              <b style={{ left: `calc(${(totalCr / max) * 100}% - 1px)` }} />
            </span>
          </div>
        </div>
        <div className="res">
          <span className="iac-lab">
            Dr {money(totalDr)} · Cr {money(totalCr)}
          </span>
          <div className={"v " + (balanced ? "ok" : "off")}>{balanced ? "Balanced · 0.00 ✓" : diff === 0 ? "Enter amounts" : `Out by ${money(diff)}`}</div>
        </div>
      </div>

      <div className="iac-fact">
        <button type="submit" className="iac-btn pri" disabled={reason !== ""}>
          Post entry
        </button>
        <button type="button" className="iac-btn ghost" onClick={onClose}>
          Cancel
        </button>
        <span className="iac-ferr" aria-live="polite">
          {reason}
        </span>
      </div>
    </form>
  )
}

function Ledger({ journal, formOpen, setFormOpen, onPost, nextId, lastPosted }: { journal: Journal[]; formOpen: boolean; setFormOpen: (v: boolean) => void; onPost: (j: Omit<Journal, "id">) => void; nextId: string; lastPosted: string | null }) {
  const [code, setCode] = React.useState("1010")
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const bal = React.useMemo(() => balances(journal), [journal])
  const acct = ACCT.get(code)!
  const profit = -ACCOUNTS.filter((a) => a.group === "Income" || a.group === "Expenses").reduce((s, a) => s + bal[a.code], 0)
  const groupTotal = (g: Group) => {
    const sum = ACCOUNTS.filter((a) => a.group === g).reduce((s, a) => s + bal[a.code], 0)
    return g === "Assets" || g === "Expenses" ? sum : g === "Equity" ? -sum + profit : -sum
  }
  const entries = journal.filter((j) => j.lines.some((l) => l.acct === code)).sort(byDate)
  const dn = debitNormal(acct.group)
  const open = OPEN[code] ?? 0
  const rows = entries.reduce<{ j: Journal; dr: number; cr: number; run: number }[]>((acc, j) => {
    const dr = j.lines.filter((l) => l.acct === code).reduce((s, l) => s + l.dr, 0)
    const cr = j.lines.filter((l) => l.acct === code).reduce((s, l) => s + l.cr, 0)
    const prev = acc.length ? acc[acc.length - 1].run : open
    acc.push({ j, dr, cr, run: prev + dr - cr })
    return acc
  }, [])
  const tdr = rows.reduce((s, r) => s + r.dr, 0)
  const tcr = rows.reduce((s, r) => s + r.cr, 0)
  return (
    <>
      <Head label="03 · Ledger" title="Every figure," em="to its entry">
        Chart of accounts on the left, double-entry journals on the right. Open an entry to see every line it posts.
      </Head>
      <div className="iac-lg">
        <section className="iac-panel iac-coa" aria-label="Chart of accounts">
          <Crops />
          <div className="iac-coa-list">
            {GROUPS.map((g) => (
              <div key={g}>
                <div className="iac-gh">
                  <span className="iac-lab">{g}</span>
                  <span className="iac-num">{paren(groupTotal(g))}</span>
                </div>
                {ACCOUNTS.filter((a) => a.group === g).map((a) => (
                  <button key={a.code} className="iac-ar" aria-pressed={code === a.code} onClick={() => (setCode(a.code), setExpanded(null))}>
                    <span className="c">{a.code}</span>
                    <span className="n">{a.name}</span>
                    <span className="b">{paren(natural(a.code, bal[a.code]))}</span>
                  </button>
                ))}
                {g === "Equity" && (
                  <div className="iac-ar memo">
                    <span className="c" />
                    <span className="n">Profit for October</span>
                    <span className="b">{paren(profit)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="iac-fig">
            <b>FIG. 3</b> — Balance sheet accounts at 31 Oct. Income and expenses show October only.
          </p>
        </section>

        <section className="iac-panel" aria-label={`Journal entries, ${acct.name}`}>
          <Crops />
          <div className="iac-jhead">
            <div style={{ flex: 1, minWidth: 200 }}>
              <span className="iac-lab">
                {acct.code} · {acct.group.replace(/s$/, "")} · {dn ? "debit" : "credit"}-normal
              </span>
              <h3>{acct.name}</h3>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <button className="iac-btn pri" onClick={() => setFormOpen(!formOpen)} aria-expanded={formOpen}>
                <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
                New journal entry
              </button>
            </div>
          </div>
          {formOpen && <JournalForm nextId={nextId} onPost={onPost} onClose={() => setFormOpen(false)} />}
          <div className="iac-jtable">
            <div className="iac-jrow h" aria-hidden="true">
              <span className="iac-lab">Date</span>
              <span className="iac-lab">Ref</span>
              <span className="iac-lab">Description</span>
              <span className="iac-lab r">Debit £</span>
              <span className="iac-lab r">Credit £</span>
              <span className="iac-lab r">Balance £</span>
            </div>
            <div className="iac-je bf">
              <div className="iac-jrow" style={{ paddingTop: 9, paddingBottom: 9 }}>
                <span className="dt">1 Oct</span>
                <span className="rf" />
                <span className="ds">
                  <span>Balance brought forward</span>
                </span>
                <span className="r dr" />
                <span className="r cr" />
                <span className="r bl" data-l="Bal">{paren(natural(code, open))}</span>
              </div>
            </div>
            {rows.map(({ j, dr, cr, run }) => (
              <div key={j.id} className={"iac-je" + (expanded === j.id ? " open" : "") + (lastPosted === j.id ? " is-new" : "")}>
                <button className="iac-jrow" aria-expanded={expanded === j.id} onClick={() => setExpanded(expanded === j.id ? null : j.id)}>
                  <span className="dt">{dShort(j.date)}</span>
                  <span className="rf" title={j.ref}>
                    {j.ref}
                  </span>
                  <span className="ds">
                    <span title={j.memo}>{j.memo}</span>
                    <small>
                      {j.id} · {SRC[j.src]}
                    </small>
                  </span>
                  <span className="r dr" data-l="Dr">{dr ? money(dr) : ""}</span>
                  <span className="r cr" data-l="Cr">{cr ? money(cr) : ""}</span>
                  <span className="r bl" data-l="Bal">{paren(natural(code, run))}</span>
                </button>
                {expanded === j.id && (
                  <div className="iac-split" role="group" aria-label={`Lines of ${j.id}`}>
                    {j.lines.map((l, idx) => (
                      <button key={idx} onClick={() => (setCode(l.acct), setExpanded(null))} title={`Open ${ACCT.get(l.acct)!.name}`}>
                        <span className="c">{l.acct}</span>
                        <span className="n">{ACCT.get(l.acct)!.name}</span>
                        <span className="r">{l.dr ? `Dr ${money(l.dr)}` : ""}</span>
                        <span className="r">{l.cr ? `Cr ${money(l.cr)}` : ""}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {rows.length === 0 && <p className="iac-empty">No postings in October.</p>}
            <div className="iac-jfoot">
              <div className="iac-jrow">
                <span className="dt" />
                <span className="rf" />
                <span className="iac-lab ds">Period total · closing</span>
                <span className="r dr" data-l="Dr">{money(tdr)}</span>
                <span className="r cr" data-l="Cr">{money(tcr)}</span>
                <span className="r bl" data-l="Bal">{paren(natural(code, open + tdr - tcr))}</span>
              </div>
            </div>
          </div>
          <p className="iac-fig">
            <b>FIG. 4</b> — {acct.name}, October 2026. Negative balances sit in parentheses.
          </p>
        </section>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Reports                                  */
/* -------------------------------------------------------------------------- */

function Reports({ journal }: { journal: Journal[] }) {
  const bal = React.useMemo(() => balances(journal), [journal])
  const oct = (c: string) => pnlAmount(journal, c)
  const sep = (c: string) => SEP[c] ?? 0
  const inSec = (s: Section) => ACCOUNTS.filter((a) => a.section === s)
  const income = ACCOUNTS.filter((a) => a.group === "Income")
  const sum = (as: Account[], f: (c: string) => number) => as.reduce((t, a) => t + f(a.code), 0)
  const T = {
    rev: [sum(income, oct), sum(income, sep)],
    cos: [sum(inSec("cos"), oct), sum(inSec("cos"), sep)],
    opex: [sum(inSec("opex"), oct), sum(inSec("opex"), sep)],
    fin: [sum(inSec("fin"), oct), sum(inSec("fin"), sep)],
  }
  const gp = [T.rev[0] - T.cos[0], T.rev[1] - T.cos[1]]
  const op = [gp[0] - T.opex[0], gp[1] - T.opex[1]]
  const net = [op[0] - T.fin[0], op[1] - T.fin[1]]
  const z = (v: number) => (v === 0 ? "–" : paren(v))
  const pcls = (o: number, s: number, cost: boolean) => {
    if (s === 0) return ""
    const v = ((o - s) / Math.abs(s)) * 100
    if (Math.abs(v) < 10) return ""
    return (cost ? v < 0 : v > 0) ? "iac-good" : "iac-badv"
  }
  const row = (label: string, o: number, s: number, cost: boolean, cls: string, code?: string) => (
    <div className={"iac-plr " + cls} key={code ?? label}>
      <span className="nm">
        {code && <em>{code}</em>}
        {label}
      </span>
      <span className="r">{z(o)}</span>
      <span className="r">{z(s)}</span>
      <span className="r vr">{o === s ? "–" : paren(o - s)}</span>
      <span className={"r " + pcls(o, s, cost)}>{o === s ? "–" : pctText(o, s)}</span>
    </div>
  )
  const section = (title: string, accts: Account[], total: string, t: number[], cost: boolean) => (
    <>
      <div className="iac-plr sec">
        <span className="iac-lab">{title}</span>
      </div>
      {accts
        .filter((a) => oct(a.code) !== 0 || sep(a.code) !== 0)
        .map((a) => (
          row(a.name, oct(a.code), sep(a.code), cost, "ln", a.code)
        ))}
      {row(total, t[0], t[1], cost, "sub")}
    </>
  )
  const margin = (p: number[]) => (T.rev[0] && T.rev[1] ? [(p[0] / T.rev[0]) * 100, (p[1] / T.rev[1]) * 100] : [0, 0])

  // Balance sheet
  const assets = ACCOUNTS.filter((a) => a.group === "Assets").reduce((s, a) => s + bal[a.code], 0)
  const liabs = -ACCOUNTS.filter((a) => a.group === "Liabilities").reduce((s, a) => s + bal[a.code], 0)
  const capital = -bal["3000"]
  const re = -bal["3100"]
  const equity = capital + re + net[0]
  const bsDiff = assets - (liabs + equity)
  const tb = ACCOUNTS.reduce((s, a) => s + bal[a.code], 0)
  const tbDr = ACCOUNTS.reduce((s, a) => s + Math.max(0, bal[a.code]), 0)
  const cashV = cashOf(bal)

  // Where each £1 went
  const staff = oct("6000") + oct("6010")
  const parts = [
    { name: "Cost of sales", v: T.cos[0], lv: 0.82 },
    { name: "Staff and NIC", v: staff, lv: 0.56 },
    { name: "Other operating costs", v: T.opex[0] - staff, lv: 0.34 },
    { name: "Finance costs", v: T.fin[0], lv: 0.16 },
    { name: "Net profit", v: Math.max(0, net[0]), lv: 0 },
  ]

  // Margin notes, computed from the statement
  const costAccts = ACCOUNTS.filter((a) => a.section === "opex")
  const mover = costAccts.map((a) => ({ a, d: oct(a.code) - sep(a.code) })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d))[0]
  const gm = margin(gp)

  return (
    <>
      <Head label="04 · Reports" title="October," em="against September">
        Profit and loss from the posted journal, with a balance-sheet proof underneath. Everything here recalculates when an entry posts.
      </Head>
      <div className="iac-rp">
        <section className="iac-panel iac-pl" aria-label="Profit and loss, October against September">
          <Crops />
          <div className="iac-plr h">
            <span className="iac-lab">
              <span className="hm">Profit and loss · </span>£
            </span>
            <span className="r">Oct 2026</span>
            <span className="r">Sep 2026</span>
            <span className="r vr">Variance</span>
            <span className="r">Var %</span>
          </div>
          {section("Revenue", income, "Total revenue", T.rev, false)}
          {section("Cost of sales", inSec("cos"), "Total cost of sales", T.cos, true)}
          {row("Gross profit", gp[0], gp[1], false, "key")}
          <div className="iac-plr ln">
            <span className="nm" style={{ fontStyle: "italic", fontFamily: "var(--iac-serif)", fontSize: 14, color: "var(--iac-t3)" }}>
              Gross margin
            </span>
            <span className="r" style={{ color: "var(--iac-t3)" }}>
              {gm[0].toFixed(1)}%
            </span>
            <span className="r" style={{ color: "var(--iac-t3)" }}>
              {gm[1].toFixed(1)}%
            </span>
            <span className="r vr" style={{ color: "var(--iac-t3)" }}>
              {(gm[0] - gm[1] < 0 ? "−" : "+") + Math.abs(gm[0] - gm[1]).toFixed(1)} pt
            </span>
            <span className="r" />
          </div>
          {section("Operating expenses", inSec("opex"), "Total operating expenses", T.opex, true)}
          {row("Operating profit", op[0], op[1], false, "key")}
          {section("Finance costs", inSec("fin"), "Total finance costs", T.fin, true)}
          {row("Net profit", net[0], net[1], false, "net")}
          <p className="iac-fig">
            <b>FIG. 5</b> — Profit and loss, October against September 2026, before corporation tax. Green and red mark moves over 10%.
          </p>
        </section>

        <div className="iac-side">
          <section className="iac-panel" aria-label="Balance sheet check">
            <Crops />
            <div className="iac-bs">
              <span className="iac-lab">Balance sheet · 31 Oct 2026</span>
              <div className="iac-bsr">
                <span>Assets</span>
                <span className="iac-num">{paren(assets)}</span>
              </div>
              <div className="iac-bsr sm">
                <span>of which cash and bank</span>
                <span className="iac-num">{paren(cashV)}</span>
              </div>
              <div className="iac-bsr">
                <span>Liabilities</span>
                <span className="iac-num">{paren(liabs)}</span>
              </div>
              <div className="iac-bsr">
                <span>Equity</span>
                <span className="iac-num">{paren(equity)}</span>
              </div>
              <div className="iac-bsr sm">
                <span>Share capital</span>
                <span className="iac-num">{paren(capital)}</span>
              </div>
              <div className="iac-bsr sm">
                <span>Retained earnings, to 30 Sep</span>
                <span className="iac-num">{paren(re)}</span>
              </div>
              <div className="iac-bsr sm">
                <span>Profit for October</span>
                <span className="iac-num">{paren(net[0])}</span>
              </div>
            </div>
            <div className={"iac-check" + (bsDiff === 0 ? "" : " bad")} role="status">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="9.5" stroke="currentColor" strokeWidth="1.25" />
                {bsDiff === 0 ? <path d="M6.5 11.5l3 3 6-7" pathLength={1} stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" /> : <path d="M7 7l8 8M15 7l-8 8" pathLength={1} stroke="currentColor" strokeWidth="1.5" />}
              </svg>
              <div>
                <span className="iac-lab">{bsDiff === 0 ? "Assets = liabilities + equity" : `Out of balance by ${money(bsDiff)}`}</span>
                <div className="eq">
                  {money(assets)} = {money(liabs)} + {money(equity)}
                </div>
              </div>
            </div>
            <div className={"iac-check" + (tb === 0 ? "" : " bad")}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="9.5" stroke="currentColor" strokeWidth="1.25" />
                <path d="M6.5 11.5l3 3 6-7" pathLength={1} stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              </svg>
              <div>
                <span className="iac-lab">Trial balance</span>
                <div className="eq">
                  Dr {money(tbDr)} = Cr {money(tbDr - tb)}
                </div>
              </div>
            </div>
          </section>

          <section className="iac-panel" aria-label="Where October revenue went">
            <Crops />
            <div className="iac-spread">
              <span className="iac-lab">Where £{money(T.rev[0])} went</span>
              <div className="iac-spbar" role="img" aria-label={parts.map((p) => `${p.name} ${((p.v / T.rev[0]) * 100).toFixed(1)}%`).join(", ")}>
                {parts.map((p) => (
                  <div key={p.name} style={{ flex: `${Math.max(p.v, 1)} 1 0` }}>
                    <Dither level={p.lv} />
                  </div>
                ))}
              </div>
              <div className="iac-spkey">
                {parts.map((p) => (
                  <div key={p.name}>
                    <i>
                      <Dither level={p.lv} />
                    </i>
                    <span>{p.name}</span>
                    <span className="iac-num">{T.rev[0] ? ((p.v / T.rev[0]) * 100).toFixed(1) : "0.0"}%</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="iac-fig">
              <b>FIG. 6</b> — Share of revenue by use, October.
            </p>
          </section>

          <div className="iac-notes">
            <div className="iac-aside">
              <span className="hl" aria-hidden="true" />
              <p>
                <span className="iac-lab">Atlas · margin</span>
                Gross margin was {gm[0].toFixed(1)}% against {gm[1].toFixed(1)}% in September. Freight and card fees grew a little faster than sales.
              </p>
            </div>
            {mover && (
              <div className="iac-aside">
                <span className="hl" aria-hidden="true" />
                <p>
                  <span className="iac-lab">Atlas · biggest mover</span>
                  {mover.a.name} is {sgbp(mover.d)} on September ({pctText(oct(mover.a.code), sep(mover.a.code))}).
                  {mover.a.code === "6200" ? " £3,240.00 of it is ad platform spend booked on 27 Oct." : ""}
                </p>
              </div>
            )}
            <div className="iac-aside">
              <span className="hl" aria-hidden="true" />
              <p>
                <span className="iac-lab">Sage · review</span>
                Net profit of {gbp(net[0])} is {pctText(net[0], net[1])} against September. Corporation tax is provisioned at year end, so this is profit before tax.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Screen                                   */
/* -------------------------------------------------------------------------- */

export type AccountingTab = Tab
export type AccountingProps = {
  /** Called with the label of any nav item the user clicks. */
  onNavigate?: (label: string) => void
  /** Rendered at the bottom of the rail, above the user. */
  sideTools?: React.ReactNode
  /** Tab to show first. */
  defaultTab?: AccountingTab
}

const TAB_LIST: { id: Tab; label: string }[] = [
  { id: "reconcile", label: "Reconcile" },
  { id: "invoices", label: "Invoices" },
  { id: "ledger", label: "Ledger" },
  { id: "reports", label: "Reports" },
]

export function Accounting({ onNavigate, sideTools, defaultTab = "reconcile" }: AccountingProps) {
  const [tab, setTab] = React.useState<Tab>(defaultTab)
  const [journal, setJournal] = React.useState<Journal[]>(JOURNAL0)
  const [railOpen, setRailOpen] = React.useState(false)
  const [formOpen, setFormOpen] = React.useState(false)
  const [status, setStatus] = React.useState("")
  const [lastPosted, setLastPosted] = React.useState<string | null>(null)
  const [reminded, setReminded] = React.useState<Record<string, number>>({})
  const [openInv, setOpenInv] = React.useState<string | null>(null)
  const wide = useMedia("(min-width: 1280px), (min-width: 900px) and (max-width: 1023px)")
  const narrow = useMedia("(max-width: 1023px)")
  const flashTimer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  const nextId = `JE-0${400 + journal.length + 1}`
  const flash = (msg: string) => {
    setStatus(msg)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setStatus(""), 6000)
  }
  const post = (j: Omit<Journal, "id">) => {
    setJournal((prev) => [...prev, { ...j, id: nextId }].sort(byDate))
    setLastPosted(nextId)
    const amt = j.lines.reduce((s, l) => s + l.dr, 0)
    flash(`${nextId} posted · ${j.lines.length} lines · ${money(amt)}`)
  }
  const rec = useRecon(post)
  const bal = React.useMemo(() => balances(journal), [journal])
  const openInvs = INVOICES.filter((i) => ["Sent", "Overdue"].includes(invStatus(i)))
  const overdue = INVOICES.filter((i) => invStatus(i) === "Overdue").length
  const inv = INVOICES.find((i) => i.id === openInv) ?? null
  const tabCount: Record<Tab, string> = { reconcile: String(rec.unrec), invoices: String(INVOICES.length), ledger: String(ACCOUNTS.length), reports: "" }

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = TAB_LIST.findIndex((t) => t.id === tab)
    const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? TAB_LIST.length - 1 : -1
    if (n < 0) return
    e.preventDefault()
    const next = TAB_LIST[(n + TAB_LIST.length) % TAB_LIST.length].id
    setTab(next)
    document.getElementById(`iac-tab-${next}`)?.focus()
  }

  return (
    <div
      className={"iac" + (railOpen ? " is-open" : "")}
      onKeyDown={(e) => {
        if (e.key === "Escape" && railOpen) setRailOpen(false)
      }}
    >
      <style href="accounting" precedence="default">
        {CSS}
      </style>
      <div className="iac-scrim" onClick={() => setRailOpen(false)} aria-hidden="true" />
      <Rail
        hidden={narrow && !railOpen}
        active="Accounting"
        agents={AGENTS}
        userRole="Product lead"
        onGo={(l) => {
          setRailOpen(false)
          onNavigate?.(l)
        }}
        sideTools={sideTools}
      />
      <div className="iac-main">
        <Top
          open={railOpen}
          onMenu={() => setRailOpen(true)}
          onNewJournal={() => {
            setTab("ledger")
            setFormOpen(true)
          }}
        />
        <div className="iac-body">
          <div className="iac-wrap">
            <Summary cash={cashOf(bal)} ar={bal["1100"]} ap={-bal["2000"]} unrec={rec.unrec} ready={rec.ready} overdue={overdue} openInv={openInvs.length} openBills={4} />

            <div className="iac-tabbar">
              <div className="iac-tabs" role="tablist" aria-label="Accounting views" onKeyDown={onTabKey}>
                {TAB_LIST.map((t) => (
                  <button key={t.id} id={`iac-tab-${t.id}`} role="tab" className="iac-tab" aria-selected={tab === t.id} aria-controls={`iac-panel-${t.id}`} tabIndex={tab === t.id ? 0 : -1} onClick={() => setTab(t.id)}>
                    {t.label}
                    {tabCount[t.id] && <span className="iac-tabn">{tabCount[t.id]}</span>}
                  </button>
                ))}
              </div>
              <span className="iac-status" role="status" aria-live="polite">
                {status}
              </span>
            </div>

            <div key={tab} id={`iac-panel-${tab}`} role="tabpanel" aria-labelledby={`iac-tab-${tab}`} className="iac-tabpanel iac-scan">
              {tab === "reconcile" && (
                <>
                  <Head label="01 · Reconcile" title="Bank feed against" em="the ledger">
                    Atlas has proposed a ledger partner for each October bank line. Accept what is right, reject what is not, and book anything the ledger is missing.
                  </Head>
                  <Reconcile rec={rec} journal={journal} ledger1010={bal["1010"]} wide={wide} />
                </>
              )}
              {tab === "invoices" && <Invoices openId={openInv} onOpen={setOpenInv} reminded={reminded} />}
              {tab === "ledger" && <Ledger journal={journal} formOpen={formOpen} setFormOpen={setFormOpen} onPost={(j) => (post(j), setFormOpen(false))} nextId={nextId} lastPosted={lastPosted} />}
              {tab === "reports" && <Reports journal={journal} />}
            </div>
          </div>
        </div>
        {inv && (
          <InvoiceDrawer
            key={inv.id}
            inv={inv}
            extra={reminded[inv.id] ?? 0}
            onClose={() => setOpenInv(null)}
            onReminded={(id, to) => {
              setReminded((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }))
              flash(`Reminder for ${id} queued to ${to}`)
            }}
          />
        )}
      </div>
    </div>
  )
}
