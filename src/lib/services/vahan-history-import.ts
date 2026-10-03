/**
 * Port of Laravel `cron:ImportVahanHistoryData` (ImportVahanHistoryData.php).
 *
 * Uses Prisma raw SQL because history_* tables are not yet in the sparse
 * scaffold schema — run `npm run db:pull` to add typed models later.
 */

import { Prisma } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import {
  fetchDigitalDekhoStaticData,
  type DigitalDekhoStaticData,
} from "@/lib/integrations/digital-dekho";

export type HistoryImportCounts = Record<string, { inserted: number; skipped: number }>;

export type VahanHistoryImportResult = {
  ok: true;
  startedAt: string;
  finishedAt: string;
  counts: HistoryImportCounts;
  dryRun: boolean;
};

function str(row: Record<string, unknown>, key: string): string | null {
  const v = row[key];
  if (v == null) return null;
  return String(v);
}

async function exists(
  sql: Prisma.Sql,
): Promise<boolean> {
  const rows = await db.$queryRaw<Array<{ id: number }>>(sql);
  return rows.length > 0;
}

async function insertIfMissing(
  counts: HistoryImportCounts,
  bucket: string,
  check: Prisma.Sql,
  insert: Prisma.Sql,
  dryRun: boolean,
): Promise<void> {
  if (!counts[bucket]) counts[bucket] = { inserted: 0, skipped: 0 };
  if (await exists(check)) {
    counts[bucket].skipped += 1;
    return;
  }
  if (!dryRun) {
    await db.$executeRaw(insert);
  }
  counts[bucket].inserted += 1;
}

export async function importVahanHistoryData(opts?: {
  dryRun?: boolean;
  data?: DigitalDekhoStaticData;
}): Promise<VahanHistoryImportResult> {
  const dryRun = opts?.dryRun ?? false;
  const startedAt = new Date().toISOString();
  const data = opts?.data ?? (await fetchDigitalDekhoStaticData());
  const counts: HistoryImportCounts = {};

  for (const row of data.blacklist_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const complain = str(r, "Complain_File_Number");
    if (!reg || !complain) continue;
    await insertIfMissing(
      counts,
      "blacklist_history",
      Prisma.sql`SELECT id FROM history_of_blacklists WHERE Registration_No = ${reg} AND Complain_File_Number = ${complain} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_blacklists
        (Registration_No, Complain_File_Number, Complain_Date, Complain_Entered_By, Action_Taken, Action_Entered_By, Action_Date, Office, Compounding_Amount)
        VALUES (${reg}, ${complain}, ${str(r, "Complain_Date")}, ${str(r, "Complain_Entered_By")}, ${str(r, "Action_Taken")}, ${str(r, "Action_Entered_By")}, ${str(r, "Action_Date")}, ${str(r, "Office")}, ${str(r, "Compounding_Amount")})`,
      dryRun,
    );
  }

  for (const row of data.ownership_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const app = str(r, "Application_No");
    if (!reg || !app) continue;
    await insertIfMissing(
      counts,
      "ownership_history",
      Prisma.sql`SELECT id FROM history_of_transfer_ownerships WHERE Registration_No = ${reg} AND Application_No = ${app} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_transfer_ownerships
        (Registration_No, Application_No, Ownership_Serial, Owner_From, Owner_Upto, Owner_Name, Father_Husband_Name, Present_Address, Permanent_Address, Owner_Type, Sale_Auction_Date, Sale_Amount, Reason, Office)
        VALUES (${reg}, ${app}, ${str(r, "Ownership_Serial")}, ${str(r, "Owner_From")}, ${str(r, "Owner_Upto")}, ${str(r, "Owner_Name")}, ${str(r, "Father_Husband_Name")}, ${str(r, "Present_Address")}, ${str(r, "Permanent_Address")}, ${str(r, "Owner_Type")}, ${str(r, "Sale_Auction_Date")}, ${str(r, "Sale_Amount")}, ${str(r, "Reason")}, ${str(r, "Office")})`,
      dryRun,
    );
  }

  for (const row of data.challan_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const challan = str(r, "Challan_No");
    if (!reg || !challan) continue;
    await insertIfMissing(
      counts,
      "challan_history",
      Prisma.sql`SELECT id FROM history_of_challans WHERE Registration_No = ${reg} AND Challan_No = ${challan} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_challans
        (Registration_No, Serial_No, Challan_No, Offense_Details, Challan_Place, Challan_Date_Time, State, RTO, Accused_Name, Amount, Challan_Status, Payment_Source, Payment_Date, Receipt_Number, sent_to_reg_court, remark, dl_no, driver_name, owner_name, department, document_impounded, amount_of_fine_imposed, court_address, court_name, date_of_proceeding, sent_to_court_on, sent_to_virtual_court, rto_distric_name)
        VALUES (${reg}, ${str(r, "Serial_No")}, ${challan}, ${str(r, "Offense_Details")}, ${str(r, "Challan_Place")}, ${str(r, "Challan_Date_Time")}, ${str(r, "State")}, ${str(r, "RTO")}, ${str(r, "Accused_Name")}, ${str(r, "Amount")}, ${str(r, "Challan_Status")}, ${str(r, "Payment_Source")}, ${str(r, "Payment_Date")}, ${str(r, "Receipt_Number")}, ${str(r, "sent_to_reg_court")}, ${str(r, "remark")}, ${str(r, "dl_no")}, ${str(r, "driver_name")}, ${str(r, "owner_name")}, ${str(r, "department")}, ${str(r, "document_impounded")}, ${str(r, "amount_of_fine_imposed")}, ${str(r, "court_address")}, ${str(r, "court_name")}, ${str(r, "date_of_proceeding")}, ${str(r, "sent_to_court_on")}, ${str(r, "sent_to_virtual_court")}, ${str(r, "rto_distric_name")})`,
      dryRun,
    );
  }

  for (const row of data.changed_vehicle_history_by_admins ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const sr = str(r, "Sr_No");
    if (!reg || !sr) continue;
    await insertIfMissing(
      counts,
      "changed_vehicle_history",
      Prisma.sql`SELECT id FROM history_of_changed_vehicle_record_by_admins WHERE Registration_No = ${reg} AND Sr_No = ${sr} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_changed_vehicle_record_by_admins
        (Registration_No, Sr_No, Changed_By, Changed_Data, Changed_On, Office)
        VALUES (${reg}, ${sr}, ${str(r, "Changed_By")}, ${str(r, "Changed_Data")}, ${str(r, "Changed_On")}, ${str(r, "Office")})`,
      dryRun,
    );
  }

  for (const row of data.fitness_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const app = str(r, "Appl_No") ?? str(r, "Application_No");
    if (!reg || !app) continue;
    await insertIfMissing(
      counts,
      "fitness_history",
      Prisma.sql`SELECT id FROM history_of_fitnesses WHERE Registration_No = ${reg} AND Application_No = ${app} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_fitnesses
        (Registration_No, Application_No, Fitness_Check_Date, Result, Fitness_Upto, NID, Operation_Date, Fitness_Officer_Name1, Fitness_Officer_Name2, Office, Remark)
        VALUES (${reg}, ${app}, ${str(r, "Fitness_Check_Date")}, ${str(r, "Result")}, ${str(r, "Fitness_UPTO") ?? str(r, "Fitness_Upto")}, ${str(r, "NID")}, ${str(r, "Operation_Date")}, ${str(r, "Fitness_Officer_Name1")}, ${str(r, "Fitness_Officer_Name2")}, ${str(r, "Office")}, ${str(r, "Remark")})`,
      dryRun,
    );
  }

  for (const row of data.hypothecation_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const app = str(r, "Application_No");
    if (!reg || !app) continue;
    await insertIfMissing(
      counts,
      "hypothecation_history",
      Prisma.sql`SELECT id FROM history_of_hypothecations WHERE Registration_No = ${reg} AND Application_No = ${app} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_hypothecations
        (Registration_No, Application_No, Hypothecation_Type, Financer_Name, Financer_Address, From_Date, To_Date, Termination_Date, Office)
        VALUES (${reg}, ${app}, ${str(r, "Hypothecation_Type")}, ${str(r, "Financer_Name")}, ${str(r, "Financer_Address")}, ${str(r, "From_Date")}, ${str(r, "To_Date")}, ${str(r, "Termination_Date")}, ${str(r, "Office")})`,
      dryRun,
    );
  }

  for (const row of data.insurance_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const sr = str(r, "Sr_No");
    if (!reg || !sr) continue;
    await insertIfMissing(
      counts,
      "insurance_history",
      Prisma.sql`SELECT id FROM history_of_insurances WHERE Registration_No = ${reg} AND Sr_No = ${sr} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_insurances
        (Registration_No, Sr_No, Insurance_Company, Insurance_Type, Insurance_From, Insurance_Upto, Cover_Note_No, Office)
        VALUES (${reg}, ${sr}, ${str(r, "Insurance_Company")}, ${str(r, "Insurance_Type")}, ${str(r, "Insurance_From")}, ${str(r, "Insurance_Upto")}, ${str(r, "Cover_Note_No")}, ${str(r, "Office")})`,
      dryRun,
    );
  }

  for (const row of data.noc_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const app = str(r, "Application_No");
    const noc = str(r, "NOC_No");
    if (!reg || !app || !noc) continue;
    await insertIfMissing(
      counts,
      "noc_history",
      Prisma.sql`SELECT id FROM history_of_noc WHERE Registration_No = ${reg} AND Application_No = ${app} AND NOC_No = ${noc} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_noc
        (Registration_No, Application_No, NOC_No, NOC_Date, State_To, Office_To, Office, Dispatch_No, New_Owner)
        VALUES (${reg}, ${app}, ${noc}, ${str(r, "NOC_Date")}, ${str(r, "State_To")}, ${str(r, "Office_To")}, ${str(r, "Office")}, ${str(r, "Dispatch_No")}, ${str(r, "New_Owner")})`,
      dryRun,
    );
  }

  for (const row of data.paid_fees_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const receipt = str(r, "Receipt_No");
    const fee = str(r, "Fee_Particular");
    if (!reg || !receipt || !fee) continue;
    await insertIfMissing(
      counts,
      "paid_fees_history",
      Prisma.sql`SELECT id FROM history_of_paid_fees WHERE Registration_No = ${reg} AND Receipt_No = ${receipt} AND Fee_Particular = ${fee} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_paid_fees
        (Registration_No, Receipt_No, Receipt_Date, Fee_Amount, Fine, Fee_Particular, Office, GRN_No, Fee_Collected_As)
        VALUES (${reg}, ${receipt}, ${str(r, "Receipt_Date")}, ${str(r, "Fee_Amount")}, ${str(r, "Fine")}, ${fee}, ${str(r, "Office")}, ${str(r, "GRN_No")}, ${str(r, "Fee_Collected_As")})`,
      dryRun,
    );
  }

  for (const row of data.permit_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const app = str(r, "Application_No");
    if (!reg || !app) continue;
    await insertIfMissing(
      counts,
      "permit_history",
      Prisma.sql`SELECT id FROM history_of_permits WHERE Registration_No = ${reg} AND Application_No = ${app} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_permits
        (Registration_No, Application_No, Permit_No, Issue_Date, Valid_From, Valid_Upto, Permit_Type, Permit_Category, Office)
        VALUES (${reg}, ${app}, ${str(r, "Permit_No")}, ${str(r, "Issue_Date")}, ${str(r, "Valid_From")}, ${str(r, "Valid_Upto")}, ${str(r, "Permit_Type")}, ${str(r, "Permit_Category")}, ${str(r, "Office")})`,
      dryRun,
    );
  }

  for (const row of data.rc_print_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const app = str(r, "Application_No");
    if (!reg || !app) continue;
    await insertIfMissing(
      counts,
      "rc_print_history",
      Prisma.sql`SELECT id FROM history_of_rc_print_details WHERE Registration_No = ${reg} AND Application_No = ${app} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_rc_print_details
        (Registration_No, Application_No, Purpose, Printed_On, Printed_By)
        VALUES (${reg}, ${app}, ${str(r, "Purpose")}, ${str(r, "Printed_On")}, ${str(r, "Printed_By")})`,
      dryRun,
    );
  }

  for (const row of data.road_tax_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const receipt = str(r, "Receipt_No");
    const taxFrom = str(r, "Tax_From");
    if (!reg || !receipt || !taxFrom) continue;
    await insertIfMissing(
      counts,
      "road_tax_history",
      Prisma.sql`SELECT id FROM history_of_road_taxes WHERE Registration_No = ${reg} AND Receipt_No = ${receipt} AND Tax_From = ${taxFrom} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_road_taxes
        (Registration_No, Receipt_No, Tax_From, Tax_Upto, Tax_Type, Challan_Date, Total_Amount, Office, Tax, Penalty, GRN_No, Breakup, Tax_Mode)
        VALUES (${reg}, ${receipt}, ${taxFrom}, ${str(r, "Tax_Upto")}, ${str(r, "Tax_Type")}, ${str(r, "Challan_Date")}, ${str(r, "Total_Amount")}, ${str(r, "Office")}, ${str(r, "Tax")}, ${str(r, "Penalty")}, ${str(r, "GRN_No")}, ${str(r, "Breakup")}, ${str(r, "Tax_Mode")})`,
      dryRun,
    );
  }

  for (const row of data.tax_clear_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const sr = str(r, "Sr_No");
    if (!reg || !sr) continue;
    await insertIfMissing(
      counts,
      "tax_clear_history",
      Prisma.sql`SELECT id FROM history_of_tax_clears WHERE Registration_No = ${reg} AND Sr_No = ${sr} LIMIT 1`,
      Prisma.sql`INSERT INTO history_of_tax_clears
        (Registration_No, Sr_No, Tax_Description, Tax_Clear_To, TCR_No, Operation_Date, Remarks, Office)
        VALUES (${reg}, ${sr}, ${str(r, "Tax_Description")}, ${str(r, "Tax_Clear_To")}, ${str(r, "TCR_No")}, ${str(r, "Operation_Date")}, ${str(r, "Remarks")}, ${str(r, "Office")})`,
      dryRun,
    );
  }

  for (const row of data.old_registration_history ?? []) {
    const r = row as Record<string, unknown>;
    const reg = str(r, "Registration_No");
    const oldReg = str(r, "Old_Registration_No");
    if (!reg || !oldReg || reg === oldReg) continue;
    if (!counts.old_registration_history) {
      counts.old_registration_history = { inserted: 0, skipped: 0 };
    }
    const existing = await db.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM rc_details WHERE rc_regn_no = ${reg} LIMIT 1
    `;
    if (!existing.length) {
      counts.old_registration_history.skipped += 1;
      continue;
    }
    if (!dryRun) {
      await db.$executeRaw`
        UPDATE rc_details SET rc_old_regn_no = ${oldReg} WHERE id = ${existing[0].id}
      `;
    }
    counts.old_registration_history.inserted += 1;
  }

  return {
    ok: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    counts,
    dryRun,
  };
}
