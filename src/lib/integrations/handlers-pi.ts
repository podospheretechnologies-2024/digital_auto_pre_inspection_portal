/**
 * Pre-Inspection Phase 4 handlers — Laravel response-shape parity.
 * Scope: vehicle RC + Vahan store/fetch used by PI. No valuation/FI APIs.
 */

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  findRcApiUserByUuid,
  isInternalRcUpdateToken,
} from "@/lib/integrations/api-auth";
import { normalizeRegn } from "@/lib/integrations/normalize";
import { toPublicRcData } from "@/lib/integrations/rc-shape";
import { storeVahanDetails } from "@/lib/integrations/vahan-history";
import {
  apiVehicleDetailGovt,
  attachRcHistories,
  deleteRcHistoryData,
  findRcDetail,
  storeVahanData,
} from "@/lib/integrations/vahan";

const RC_API_SUCCESS_LIMIT = 445;

export async function handleVehicleRc(
  request: Request,
  params: Record<string, unknown>,
): Promise<NextResponse> {
  const accessToken =
    typeof params.access_token === "string" ? params.access_token.trim() : "";
  const rcRegnNo =
    typeof params.rc_regn_no === "string"
      ? normalizeRegn(params.rc_regn_no)
      : "";

  const requestRow = await db.rc_api_requests.create({
    data: {
      access_token: accessToken || null,
      rc_regn_no: rcRegnNo || null,
    },
  });

  const fail = async (message: string) => {
    await db.rc_api_requests.update({
      where: { id: requestRow.id },
      data: { status: "failed", message },
    });
    return NextResponse.json({ status: "Error", message });
  };

  try {
    if (request.method !== "POST") {
      return fail("Method not allowed. Only POST requests are allowed.");
    }
    if (!accessToken) {
      return fail(
        "Access token is required. Please provide a valid access token.",
      );
    }

    const rcApiUser = await findRcApiUserByUuid(accessToken);
    if (!rcApiUser) {
      return fail(
        "Invalid access token. Please provide a valid access token for authentication.",
      );
    }

    await db.rc_api_requests.update({
      where: { id: requestRow.id },
      data: { rc_api_user_id: rcApiUser.id },
    });

    const successCount = await db.rc_api_requests.count({
      where: { rc_api_user_id: rcApiUser.id, status: "success" },
    });
    if (successCount > RC_API_SUCCESS_LIMIT) {
      return fail("API limit over.");
    }

    if (!rcRegnNo) {
      return fail(
        "Vehicle registration number is required. Please provide a valid registration number.",
      );
    }

    let rcDetail = await findRcDetail(rcRegnNo, { maxAgeHours: 24 });
    if (!rcDetail) {
      try {
        await apiVehicleDetailGovt(rcRegnNo);
      } catch {
        // may still have any-age row
      }
    }
    rcDetail = await findRcDetail(rcRegnNo);

    if (!rcDetail) {
      return fail(
        "Vehicle registration number is invalid. Please provide a valid registration number.",
      );
    }

    if (rcDetail.rc_regn_dt) {
      await db.rc_api_requests.update({
        where: { id: requestRow.id },
        data: {
          rc_detail_id: rcDetail.id,
          rc_regn_no: rcDetail.rc_regn_no,
          status: "success",
        },
      });
      return NextResponse.json({
        status: "Success",
        data: toPublicRcData(rcDetail as Record<string, unknown>),
      });
    }

    const message =
      rcDetail.MESSAGE ||
      "Vehicle registration number is invalid. Please provide a valid registration number.";
    await db.rc_api_requests.update({
      where: { id: requestRow.id },
      data: {
        rc_detail_id: rcDetail.id,
        rc_regn_no: rcDetail.rc_regn_no,
        status: "failed",
        message,
      },
    });
    return NextResponse.json({ status: "Error", message });
  } catch {
    await db.rc_api_requests.update({
      where: { id: requestRow.id },
      data: {
        status: "failed",
        message: "Internal server error. Please contact the administrator.",
      },
    });
    return NextResponse.json({
      status: "Error",
      message: "Internal server error. Please contact the administrator.",
    });
  }
}

export async function handleVehicleInfo(
  params: Record<string, unknown>,
): Promise<NextResponse> {
  const rcRegnNo =
    typeof params.rc_regn_no === "string"
      ? normalizeRegn(params.rc_regn_no)
      : "";

  // PI uses standard 24h cache (valuation domain bypass is out of scope)
  let rcDetail = await findRcDetail(rcRegnNo, { maxAgeHours: 24 });

  if (!rcDetail) {
    try {
      await apiVehicleDetailGovt(rcRegnNo);
    } catch {
      // ignore
    }
    rcDetail = await findRcDetail(rcRegnNo);
  }

  if (!rcDetail) {
    try {
      await apiVehicleDetailGovt(rcRegnNo);
    } catch {
      // ignore
    }
    rcDetail = await findRcDetail(rcRegnNo);
  }

  if (!rcDetail) {
    return NextResponse.json([]);
  }

  const withHistory = await attachRcHistories(
    rcRegnNo,
    rcDetail as unknown as Record<string, unknown>,
  );
  return NextResponse.json(withHistory);
}

export async function handleUpdateRcMaskData(
  params: Record<string, unknown>,
): Promise<NextResponse> {
  const accessToken =
    typeof params.access_token === "string" ? params.access_token.trim() : "";
  if (!accessToken) {
    return NextResponse.json({
      success: 0,
      message: "Access token is required.",
    });
  }
  if (!isInternalRcUpdateToken(accessToken)) {
    return NextResponse.json({ success: 0, message: "Access denied." });
  }

  const rcRegnNo =
    typeof params.rc_regn_no === "string" ? params.rc_regn_no : "";
  const rcChasiNo =
    typeof params.rc_chasi_no === "string" ? params.rc_chasi_no : "";
  const rcEngNo = typeof params.rc_eng_no === "string" ? params.rc_eng_no : "";
  const rcOwnerName =
    typeof params.rc_owner_name === "string" ? params.rc_owner_name : "";

  const errors: Record<string, string[]> = {};
  if (!rcRegnNo) errors.rc_regn_no = ["The rc regn no field is required."];
  if (!rcChasiNo) errors.rc_chasi_no = ["The rc chasi no field is required."];
  if (!rcEngNo) errors.rc_eng_no = ["The rc eng no field is required."];
  if (!rcOwnerName)
    errors.rc_owner_name = ["The rc owner name field is required."];
  if (Object.keys(errors).length) {
    return NextResponse.json(errors, { status: 422 });
  }

  await db.rc_details.updateMany({
    where: { rc_regn_no: rcRegnNo, is_deleted: 0 },
    data: {
      rc_chasi_no: rcChasiNo,
      rc_eng_no: rcEngNo,
      rc_owner_name: rcOwnerName,
    },
  });
  return NextResponse.json({ success: 1, message: "RC mask data updated." });
}

export async function handleUpdateOldRcData(
  params: Record<string, unknown>,
): Promise<NextResponse> {
  const accessToken =
    typeof params.access_token === "string" ? params.access_token.trim() : "";
  if (!accessToken) {
    return NextResponse.json({
      success: 0,
      message: "Access token is required.",
    });
  }
  if (!isInternalRcUpdateToken(accessToken)) {
    return NextResponse.json({ success: 0, message: "Access denied." });
  }

  const rcRegnNo =
    typeof params.rc_regn_no === "string" ? params.rc_regn_no : "";
  const rcOldRegnNo =
    typeof params.rc_old_regn_no === "string" ? params.rc_old_regn_no : "";

  const errors: Record<string, string[]> = {};
  if (!rcRegnNo) errors.rc_regn_no = ["The rc regn no field is required."];
  if (!rcOldRegnNo)
    errors.rc_old_regn_no = ["The rc old regn no field is required."];
  if (Object.keys(errors).length) {
    return NextResponse.json(errors, { status: 422 });
  }

  await db.rc_details.updateMany({
    where: { rc_regn_no: rcRegnNo, is_deleted: 0 },
    data: { rc_old_regn_no: rcOldRegnNo },
  });
  return NextResponse.json({ success: 1, message: "Old RC data updated." });
}

export async function handleUpdateRcFhData(
  params: Record<string, unknown>,
): Promise<NextResponse> {
  const accessToken =
    typeof params.access_token === "string" ? params.access_token.trim() : "";
  if (!accessToken) {
    return NextResponse.json({
      success: 0,
      message: "Access token is required.",
    });
  }
  if (!isInternalRcUpdateToken(accessToken)) {
    return NextResponse.json({ success: 0, message: "Access denied." });
  }

  const rcRegnNo =
    typeof params.rc_regn_no === "string" ? params.rc_regn_no : "";
  const rcFhName =
    typeof params.rc_f_h_name === "string" ? params.rc_f_h_name : "";

  const errors: Record<string, string[]> = {};
  if (!rcRegnNo) errors.rc_regn_no = ["The rc regn no field is required."];
  if (!rcFhName) errors.rc_f_h_name = ["The rc f h name field is required."];
  if (Object.keys(errors).length) {
    return NextResponse.json(errors, { status: 422 });
  }

  await db.rc_details.updateMany({
    where: { rc_regn_no: rcRegnNo, is_deleted: 0 },
    data: { rc_f_name: rcFhName },
  });
  return NextResponse.json({
    success: 1,
    message: "RC father/husband name data updated.",
  });
}

export async function handleStoreVahanData(
  body: Record<string, unknown>,
): Promise<NextResponse> {
  const result = await storeVahanData(body);
  return new NextResponse(result, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function handleStoreVahanDetails(
  body: Record<string, unknown>,
): Promise<NextResponse> {
  const result = await storeVahanDetails(body);
  return new NextResponse(result, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function handleDeleteRcHistoryData(
  body: Record<string, unknown>,
): Promise<NextResponse> {
  const result = await deleteRcHistoryData({
    rc_regn_no: String(body.rc_regn_no ?? ""),
    rc_history: String(body.rc_history ?? ""),
  });
  return new NextResponse(result, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/** Explicit drop for valuation/FI-only or non-PI RestAPI surfaces. */
export function outOfScopeResponse(endpoint: string) {
  return NextResponse.json(
    {
      success: 0,
      message: `${endpoint} is out of Pre-Inspection Phase 4 scope. Keep on Laravel (valuation/FI/external RestAPI).`,
      scope: "pre-inspection-only",
    },
    { status: 501 },
  );
}
