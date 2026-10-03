/**
 * Laravel `VahanController::storeVahanDetails` — history block importer (PI RC cache).
 */

import { db } from "@/lib/db";
import { normalizeRegn, scalarOrNull } from "@/lib/integrations/normalize";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function rowsOf(vahan: Record<string, unknown>, key: string): unknown[] {
  const value = vahan[key];
  return Array.isArray(value) ? value : [];
}

function cell(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    if (key in row) return scalarOrNull(row[key]);
  }
  return null;
}

export async function storeVahanDetails(
  vahan: Record<string, unknown>,
): Promise<"success" | string> {
  try {
    const regnRaw = vahan["Registration No"];
    if (!regnRaw) return "success";
    const regn = normalizeRegn(String(regnRaw));

    for (const item of rowsOf(vahan, "History of Transfer of Ownership")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_transfer_ownerships
          (Registration_No, Application_No, Ownership_Serial, Owner_From, Owner_Upto,
           Owner_Name, Father_Husband_Name, Present_Address, Permanent_Address,
           Owner_Type, Sale_Auction_Date, Sale_Amount, Reason, Office)
        VALUES
          (${regn}, ${cell(row, "Application No.")}, ${cell(row, "Ownership Serial")},
           ${cell(row, "Owner From")}, ${cell(row, "Owner Upto")}, ${cell(row, "Owner Name")},
           ${cell(row, "Father / Husband Name")}, ${cell(row, "Present Address")},
           ${cell(row, "Permanent Address")}, ${cell(row, "Owner Type")},
           ${cell(row, "Sale / Auction Date")}, ${cell(row, "Sale Amount")},
           ${cell(row, "Reason")}, ${cell(row, "Office")})
      `;
    }

    for (const item of rowsOf(vahan, "History of Challan")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_challans
          (Registration_No, Serial_No, Challan_No, Offense_Details, Challan_Place,
           Challan_Date_Time, State, RTO, Accused_Name, Amount, Challan_Status,
           Payment_Source, Payment_Date, Receipt_Number)
        VALUES
          (${regn}, ${Number(cell(row, "Serial no") ?? 0)}, ${cell(row, "Challan No")},
           ${cell(row, "Offense Details Name/Act")}, ${cell(row, "Challan Place")},
           ${cell(row, "Challan Date/Time")}, ${cell(row, "State")}, ${cell(row, "RTO")},
           ${cell(row, "Accused Name")}, ${cell(row, "Amount")}, ${cell(row, "Challan Status")},
           ${cell(row, "Payment source")}, ${cell(row, "Payment Date")}, ${cell(row, "Receipt Number")})
      `;
    }

    for (const item of rowsOf(vahan, "History of Insurance of Vehicle")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_insurances
          (Registration_No, Sr_No, Insurance_Company, Insurance_Type, Insurance_From,
           Insurance_Upto, Cover_Note_No, Office)
        VALUES
          (${regn}, ${cell(row, "Sr.No")}, ${cell(row, "Insurance Company")},
           ${cell(row, "Insurance Type")}, ${cell(row, "Insurance From")},
           ${cell(row, "Insurance Upto")}, ${cell(row, "Cover Note No")}, ${cell(row, "Office")})
      `;
    }

    for (const item of rowsOf(vahan, "History of Hypothecation of Vehicle")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_hypothecations
          (Registration_No, Application_No, Hypothecation_Type, Financer_Name,
           Financer_Address, From_Date, To_Date, Termination_Date, Office)
        VALUES
          (${regn}, ${cell(row, "Application No")}, ${cell(row, "Hypothecation Type")},
           ${cell(row, "Financer Name")}, ${cell(row, "Financer Address")},
           ${cell(row, "From Date")}, ${cell(row, "To Date")},
           ${cell(row, "Termination Date")}, ${cell(row, "Office")})
      `;
    }

    for (const item of rowsOf(vahan, "History of Paid Fees")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_paid_fees
          (Registration_No, Receipt_No, Receipt_Date, Fee_Amount, Fine,
           Fee_Particular, Office, GRN_No, Fee_Collected_As)
        VALUES
          (${regn}, ${cell(row, "Receipt No")}, ${cell(row, "Receipt Date")},
           ${cell(row, "Fee Amount")}, ${cell(row, "Fine")}, ${cell(row, "Fee Particular")},
           ${cell(row, "Office")}, ${cell(row, "GRN No")}, ${cell(row, "Fee Collected as")})
      `;
    }

    for (const item of rowsOf(vahan, "History of Paid Road Tax")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_road_taxes
          (Registration_No, Receipt_No, Tax_From, Tax_Upto, Tax_Type, Challan_Date,
           Total_Amount, Office, Tax, Penalty, GRN_No, Breakup, Tax_Mode)
        VALUES
          (${regn}, ${cell(row, "Receipt No")}, ${cell(row, "Tax From")}, ${cell(row, "Tax Upto")},
           ${cell(row, "Tax Type")}, ${cell(row, "Challan Date")}, ${cell(row, "Total Amount")},
           ${cell(row, "Office")}, ${cell(row, "Tax")}, ${cell(row, "Penalty")},
           ${cell(row, "GRN No")}, ${cell(row, "Breakup")}, ${cell(row, "Tax Mode")})
      `;
    }

    for (const item of rowsOf(vahan, "History of Blacklist")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_blacklists
          (Registration_No, Complain_File_Number, Complain_Date, Complain_Entered_By,
           Action_Taken, Action_Entered_By, Action_Date, Office, Compounding_Amount)
        VALUES
          (${regn}, ${cell(row, "Complain/File Number")}, ${cell(row, "Complain Date")},
           ${cell(row, "Complain Entered By")}, ${cell(row, "Action Taken")},
           ${cell(row, "Action Entered By")}, ${cell(row, "Action Date")},
           ${cell(row, "Office")}, ${cell(row, "Compounding Amount")})
      `;
    }

    for (const item of rowsOf(vahan, "History of Permit")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_permits
          (Registration_No, Application_No, Permit_No, Issue_Date, Valid_From,
           Valid_Upto, Permit_Type, Permit_Category, Office)
        VALUES
          (${regn}, ${cell(row, "Application No")}, ${cell(row, "Permit No")},
           ${cell(row, "Issue Date")}, ${cell(row, "Valid From")}, ${cell(row, "Valid Upto")},
           ${cell(row, "Permit Type")}, ${cell(row, "Permit Category")}, ${cell(row, "Office")})
      `;
    }

    for (const item of rowsOf(vahan, "History of Tax Clear")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_tax_clears
          (Registration_No, Sr_No, Tax_Description, Tax_Clear_To, TCR_No, Operation_Date, Remarks)
        VALUES
          (${regn}, ${cell(row, "Sr.No")}, ${cell(row, "Tax Description")},
           ${cell(row, "Tax Clear To")}, ${cell(row, "TCR No.")},
           ${cell(row, "Operation Date")}, ${cell(row, "Remarks")})
      `;
    }

    for (const item of rowsOf(vahan, "History of Fitness")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_fitnesses
          (Registration_No, Application_No, Fitness_Check_Date, Result, Fitness_Upto,
           NID, Operation_Date, Fitness_Officer_Name1, Fitness_Officer_Name2, Office, Remark)
        VALUES
          (${regn}, ${cell(row, "Appl. No")}, ${cell(row, "Fitness Check date")},
           ${cell(row, "Result")}, ${cell(row, "Fitness UPTO")}, ${cell(row, "NID")},
           ${cell(row, "Operation Date")}, ${cell(row, "Fitness Officer Name1")},
           ${cell(row, "Fitness Officer Name2")}, ${cell(row, "Office")}, ${cell(row, "Remark")})
      `;
    }

    for (const item of rowsOf(
      vahan,
      "History of Changed Vehicle Record by Admin",
    )) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_changed_vehicle_record_by_admins
          (Registration_No, Sr_No, Changed_By, Changed_Data, Changed_On, Office)
        VALUES
          (${regn}, ${cell(row, "Sr.No")}, ${cell(row, "Changed By")},
           ${cell(row, "Changed Data")}, ${cell(row, "Changed On")}, ${cell(row, "Office")})
      `;
    }

    for (const item of rowsOf(vahan, "RC Print Details")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_rc_print_details
          (Registration_No, Application_No, Purpose, Printed_On, Printed_By)
        VALUES
          (${regn}, ${cell(row, "Application No")}, ${cell(row, "Purpose")},
           ${cell(row, "Printed On")}, ${cell(row, "Printed by")})
      `;
    }

    for (const item of rowsOf(vahan, "History of NOC")) {
      const row = asRecord(item);
      if (!row) continue;
      await db.$executeRaw`
        INSERT INTO history_of_noc
          (Registration_No, Application_No, NOC_No, NOC_Date, State_To, Office_To,
           Dispatch_No, New_Owner, Office)
        VALUES
          (${regn}, ${cell(row, "Application No")}, ${cell(row, "NOC No")},
           ${cell(row, "NOC Date")}, ${cell(row, "State To")}, ${cell(row, "Office To")},
           ${cell(row, "Dispatch No")}, ${cell(row, "New Owner")}, ${cell(row, "Office")})
      `;
    }

    return "success";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Error: ${message}`;
  }
}
