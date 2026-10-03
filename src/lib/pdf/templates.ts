import {
  formatDate,
  formatDateTime,
  printVehicleStatus,
} from "./escape";
import {
  closingFields,
  field,
  renderDeclarationPage,
  renderHeader,
  renderPhotosPage,
  renderSection,
  statusField,
  wrapDocument,
} from "./layout";
import type { PdfDocumentData, PdfField, PdfSection } from "./types";

function resolveSections(
  data: PdfDocumentData,
  defaults: PdfSection[],
): PdfSection[] {
  if (data.sections?.length) {
    return data.sections.map((section) => ({
      ...section,
      fields: section.fields.map((f) => ({
        ...f,
        value: f.value !== undefined ? f.value : data.printdata[f.key],
      })),
    }));
  }
  return defaults;
}

/** Blade: case block has no "CASE DETAILS" h5 — bare 3-col table under banner. */
function caseDetails(
  data: PdfDocumentData,
  opts?: { agentFromBroker?: boolean },
): PdfSection {
  const p = data.printdata;
  const agentName = opts?.agentFromBroker
    ? (p.ins_broker_name ?? [p.fname, p.lname].filter(Boolean).join(" "))
    : [p.fname, p.lname].filter(Boolean).join(" ");

  return {
    heading: "",
    columns: 3,
    fields: [
      field("Proposer", "proposer", p),
      field("Insurer/Broker", "insurer_broker", p),
      {
        label: "",
        key: "valuation_price",
        html: true,
        value: `<span class="price-red">Valuation Price : ${p.valuation_price != null ? p.valuation_price : 0} /-</span>`,
      },
      {
        label: opts?.agentFromBroker
          ? "Officer/Agent Name & No."
          : "Officer/Agent Name & No",
        key: "agent",
        value: agentName || "—",
      },
      {
        label: "Inspection Date",
        key: "created_at",
        value: `${formatDateTime(p.created_at)}${p.ctime ? ` ${p.ctime}` : ""}`,
      },
      {
        label: "Request Date",
        key: "request_date",
        value: formatDate(p.request_date),
      },
      field("Inspection Place", "inspection_place", p),
      field("Inspection Type", "inspection_type", p),
      field("Self-Inspection Case", "inspection_case", p),
    ],
  };
}

function vehicleTitle(data: PdfDocumentData): PdfSection {
  return {
    heading: "VEHICLE DETAILS",
    titleOnly: true,
    fields: [
      {
        label: "Ownership",
        key: "ownership_name",
        value: data.printdata.ownership_name,
      },
    ],
  };
}

function appendClosing(
  section: PdfSection,
  closing: PdfField[],
): PdfSection {
  return { ...section, fields: [...section.fields, ...closing] };
}

/** Laravel `twoPDF` inspection blocks */
function sections2w(data: PdfDocumentData): PdfSection[] {
  const p = data.printdata;
  const others: PdfSection = {
    heading: "OTHERS",
    banner: true,
    columns: 3,
    fields: [
      statusField("Left Cover Shield", "left_cover_shield", p, printVehicleStatus),
      statusField("Right Cover Shield", "right_cover_shield", p, printVehicleStatus),
      statusField("Wisor", "wisor", p, printVehicleStatus),
      statusField("Tail Lamp", "tail_lamp", p, printVehicleStatus),
      field("Tyres Front Rear", "tyres_front", p),
      { label: "", key: "_pad", value: "" },
      statusField("Leg Shield Right", "leg_side_right", p, printVehicleStatus),
      statusField("Leg Shield Left", "leg_shield_left", p, printVehicleStatus),
    ],
  };

  return [
    caseDetails(data),
    vehicleTitle(data),
    {
      heading: "VEHICLE DETAILS",
      columns: 4,
      fields: [
        field("Vehicle NO", "vehicleno", p),
        field("Chassis NO", "chassisno", p),
        field("Engine NO", "engineno", p),
        field("Make", "company", p),
        {
          label: "Model & Variant",
          key: "model_variant",
          value: [p.model, p.variant].filter(Boolean).join(" ") || "—",
        },
        field("Year of Manufacture", "year_of_manufacture", p),
        field("Odometer Reading", "odometer_reading", p),
        field("R.C. Verified", "rc_verified", p),
      ],
    },
    {
      heading: "VEHICLE ACCESSORIES",
      columns: 4,
      fields: [
        field("Helmet Box", "helmetbox", p),
        field("Luggage Carrier", "laggage_carrier", p),
        field("Stepney", "stepney", p),
        statusField("Stepney Bracket", "stepney_bracket", p, printVehicleStatus),
        statusField("Leg Gaurd", "leggaurd", p, printVehicleStatus),
        statusField("Saree Gaurd", "saree_gaurd", p, printVehicleStatus),
      ],
    },
    { heading: "INSPECTION DETAILS", titleOnly: true, fields: [] },
    {
      heading: "FRONT",
      banner: true,
      columns: 3,
      fields: [
        statusField(
          "Front Left Indicator Light",
          "fron_left_ind_light",
          p,
          printVehicleStatus,
        ),
        statusField(
          "Front Right Indicator Light",
          "fron_right_ind_light",
          p,
          printVehicleStatus,
        ),
        field("Front Mudgaurd", "front_mudgaurd", p),
        statusField(
          "Front Hub/Disc/Drum",
          "front_hub_disc_drum",
          p,
          printVehicleStatus,
        ),
        statusField("Front Wheel Rim", "front_wheel_rim", p, printVehicleStatus),
        field("Front Shock Absorber", "from_shock_absorber", p),
      ],
    },
    {
      heading: "MECHANICAL PARTS",
      banner: true,
      columns: 3,
      fields: [
        statusField(
          "Speedometer/Tachometre",
          "speedometer_tachometer",
          p,
          printVehicleStatus,
        ),
        statusField(
          "Lever Clutch/Hand Break",
          "lever_clutch_hand_break",
          p,
          printVehicleStatus,
        ),
        statusField("Chassis Frame", "chassis_frame", p, printVehicleStatus),
        statusField(
          "CrankCase Cylinder",
          "crankCase_cylinder",
          p,
          printVehicleStatus,
        ),
        statusField("Head Lamp/ Rim/ Cover", "head_lamp_rim", p, printVehicleStatus),
        statusField("Silencer", "silencer", p, printVehicleStatus),
        statusField("Chain Cover", "chain_cover", p, printVehicleStatus),
        statusField("Fork", "fork", p, printVehicleStatus),
        statusField("Fairing", "fairing", p, printVehicleStatus),
        statusField("Fuel Tank", "fuel_tank", p, printVehicleStatus),
        field("Kick Pedal", "kick_padal", p),
        statusField("Handle Bar", "handel_bar", p, printVehicleStatus),
      ],
    },
    {
      heading: "REAR",
      banner: true,
      columns: 3,
      fields: [
        statusField("Rear Wheel Rim", "rear_wheel_rim", p, printVehicleStatus),
        field("Rear Shock Absorber", "rear_shock_absorber", p),
        statusField("Rear Drum Disc", "rear_drum_disc", p, printVehicleStatus),
        statusField(
          "Rear Left Indicator Light",
          "rear_left_indicator_light",
          p,
          printVehicleStatus,
        ),
        statusField(
          "Rear Right Indicator Light",
          "rear_right_indicator_light",
          p,
          printVehicleStatus,
        ),
        statusField(
          "Rear View Mirror LT",
          "rear_view_mirror_lt",
          p,
          printVehicleStatus,
        ),
        field("Rear View Mirror RT", "rear_view_mirror_rt", p),
        statusField(
          "Rear Cowl Left/Centre/Right",
          "rear_cowl_left_centre_right",
          p,
          printVehicleStatus,
        ),
        field("Rear Foot Rest", "rear_foot_rest", p),
        field("Rear Mudguard", "rear_mudguard", p),
      ],
    },
    appendClosing(others, closingFields(data, { statusInline: true, columns: 3 })),
  ];
}

/** Laravel `threePDF` */
function sections3w(data: PdfDocumentData): PdfSection[] {
  const p = data.printdata;
  const others: PdfSection = {
    heading: "OTHERS",
    banner: true,
    columns: 2,
    fields: [
      field("Extra Fittings", "extra_fittings", p),
      {
        label: "MARKET VALUE ON THE DATE OF INSPECTION(In INR)",
        key: "market_value",
        value: p.market_value,
      },
    ],
  };

  return [
    caseDetails(data),
    vehicleTitle(data),
    {
      heading: "VEHICLE DETAILS",
      columns: 4,
      fields: [
        field("Vehicle No.", "vehicleno", p),
        field("Chassis No.", "chassisno", p),
        field("Engine No.", "engineno", p),
        field("Make", "company", p),
        {
          label: "Model & Variant",
          key: "model_variant",
          value: [p.model, p.variant].filter(Boolean).join(" ") || "—",
        },
        field("Year of Manufacture", "year_of_manufacture", p),
        field("Odometer Reading", "odometer_reading", p),
        field("R.C. Verified", "rc_verified", p),
        field("Tyre of body", "tyre_of_body", p),
        field("Fuel Used", "fuel_used", p),
        field("Chassis Production No.", "chassis_production_no", p),
        field("Stereo Make", "stereo_make", p),
      ],
    },
    { heading: "INSPECTION DETAILS", titleOnly: true, fields: [] },
    {
      heading: "BODY PARTS",
      banner: true,
      columns: 4,
      fields: [
        statusField("Cowl", "cowl", p, printVehicleStatus),
        statusField("Cabin", "cabin", p, printVehicleStatus),
        statusField("Front Excavator", "front_excavator", p, printVehicleStatus),
        statusField("Boom", "boom", p, printVehicleStatus),
        statusField("Chassis Frame", "chassis_frame", p, printVehicleStatus),
        statusField("Stepney", "stepney", p, printVehicleStatus),
        statusField("Left Mudguard", "left_mudguard", p, printVehicleStatus),
        statusField("Grill", "grill", p, printVehicleStatus),
        statusField("Front Body", "front_body", p, printVehicleStatus),
        statusField("Bonnet", "bonnet", p, printVehicleStatus),
        statusField("AC", "ac", p, printVehicleStatus),
        statusField("Fuel Tank", "fuel_tank", p, printVehicleStatus),
        statusField("Head Light", "head_light", p, printVehicleStatus),
        statusField("Right Mudguard", "right_mudguard", p, printVehicleStatus),
        statusField("Dashboard", "dashboard", p, printVehicleStatus),
        statusField("Right Body", "right_body", p, printVehicleStatus),
        statusField("Cran Bucket", "cran_bucket", p, printVehicleStatus),
        statusField("Fans", "fans", p, printVehicleStatus),
        statusField("Seats", "seats", p, printVehicleStatus),
        statusField("Indicator Light", "indicator_light", p, printVehicleStatus),
        statusField("Cran Hook", "crane_hook", p, printVehicleStatus),
        statusField("Hydraulic system", "hydraulic_system", p, printVehicleStatus),
        statusField("Tyres", "tyres", p, printVehicleStatus),
        statusField("Rear Body", "rear_body", p, printVehicleStatus),
        statusField("Cabin LT Door", "cabin_lt_door", p, printVehicleStatus),
        statusField("Cabin RT Door", "cabin_rt_door", p, printVehicleStatus),
        statusField("Bumper", "bumper", p, printVehicleStatus),
        statusField("Left Body", "left_body", p, printVehicleStatus),
      ],
    },
    {
      heading: "Glasses",
      banner: true,
      columns: 4,
      fields: [
        statusField("WS Glasses", "ws_glasses", p, printVehicleStatus),
        statusField(
          "Excavator Cabin Glass",
          "excavator_cabin_glass",
          p,
          printVehicleStatus,
        ),
        statusField(
          "Left Window Glasses",
          "left_window_glass",
          p,
          printVehicleStatus,
        ),
        statusField(
          "Crane Cabin Glass",
          "crane_cabin_glass",
          p,
          printVehicleStatus,
        ),
        statusField(
          "Right Window Glasses",
          "right_window_glasses",
          p,
          printVehicleStatus,
        ),
        statusField("Rear View Mirrors", "rear_view_body", p, printVehicleStatus),
        statusField("Back Glasses", "back_glass", p, printVehicleStatus),
        statusField("Tail Lamp", "tail_lamp", p, printVehicleStatus),
      ],
    },
    appendClosing(others, closingFields(data, { columns: 2 })),
  ];
}

/** Laravel `fourPDF` */
function sections4w(data: PdfDocumentData): PdfSection[] {
  const p = data.printdata;
  const glassOthers: PdfSection = {
    heading: "GLASS/OTHERS",
    banner: true,
    columns: 4,
    fields: [
      statusField("Back Glass", "back_glass", p, printVehicleStatus),
      statusField("RF Door Glass", "rf_door_glass", p, printVehicleStatus),
      statusField("LF Door Glass", "lf_door_glass", p, printVehicleStatus),
      // Blade uses rh_rear_tyre_dot_no for Rim (legacy quirk)
      statusField("Rim", "rh_rear_tyre_dot_no", p, printVehicleStatus),
      statusField(
        "Front ws Glass Laminated",
        "front_ws_glass_laminate",
        p,
        printVehicleStatus,
      ),
      statusField("RR Door Glass", "rr_door_glass", p, printVehicleStatus),
      statusField("LR Door Glass", "lr_door_glass", p, printVehicleStatus),
      statusField("Under Carriage", "under_carriage", p, printVehicleStatus),
    ],
  };

  return [
    caseDetails(data, { agentFromBroker: true }),
    vehicleTitle(data),
    {
      heading: "VEHICLE DETAILS",
      columns: 4,
      fields: [
        field("Vehicle No.", "vehicleno", p),
        field("Chassis No.", "chassisno", p),
        field("Engine No.", "engineno", p),
        field("Make", "company", p),
        {
          label: "Model & Variant",
          key: "model_variant",
          value: [p.model, p.variant].filter(Boolean).join(" ") || "—",
        },
        field("Year of Manufacture", "year_of_manufacture", p),
        field("Odometer Reading", "odometer_reading", p),
        field("R.C. Verified", "rc_verified", p),
        field("Colour", "colour", p),
        field("Fuel Used", "fuel_used", p),
        {
          label: "Stepney Make-Dot No",
          key: "stepney_make_dot_no",
          value: p.stepney_make_dot_no,
          colSpan: 2,
        },
        {
          label: "RH Front Tyre DOT No.",
          key: "rh_front_tyre_dot_no",
          value: p.rh_front_tyre_dot_no,
          colSpan: 2,
        },
        {
          label: "RH Rear Tyre DOT No.",
          key: "rh_rear_tyre_dot_no",
          value: p.rh_rear_tyre_dot_no,
          colSpan: 2,
        },
        {
          label: "LH Front Tyre DOT No.",
          key: "lh_front_tyre_dot_no",
          value: p.lh_front_tyre_dot_no,
          colSpan: 2,
        },
        {
          label: "LH Rear Tyre DOT No.",
          key: "lh_rear_tyre_dot_no",
          value: p.lh_rear_tyre_dot_no,
          colSpan: 2,
        },
      ],
    },
    {
      heading: "VEHICLE ELECTRICAL& NON-ELECTRICAL ACCESSORIES",
      columns: 4,
      fields: [
        field("Stereo Make", "stereo_make", p),
        field("CD Changer Make", "cd_charger_make", p),
        field("Other Electrical", "other_electrical", p),
        field("Seat Cover", "seat_cover", p),
        field("Centre Lock", "center_lock", p),
        field("Gear Locking", "gear_locking", p),
        field("Other Non-Electrical", "other_non_electrical", p),
      ],
    },
    { heading: "INSPECTION DETAILS", titleOnly: true, fields: [] },
    {
      heading: "FRONT / REAR",
      banner: true,
      columns: 4,
      fields: [
        statusField("Front Bumper", "front_bumper", p, printVehicleStatus),
        statusField(
          "Indicator Light (LT)",
          "indicator_light_lt",
          p,
          printVehicleStatus,
        ),
        statusField("Front Panel", "front_panel", p, printVehicleStatus),
        statusField("Dicky", "dicky", p, printVehicleStatus),
        statusField("Grill", "grill", p, printVehicleStatus),
        statusField(
          "Indicator Light (RT)",
          "indicator_light_rt",
          p,
          printVehicleStatus,
        ),
        statusField("Bonnet", "bonnet", p, printVehicleStatus),
        statusField("Rear Bumper", "reat_bumper", p, printVehicleStatus),
        statusField("Head Lamp (LT)", "head_lamp_lt", p, printVehicleStatus),
        statusField("Fog Lamp (LT)", "fog_lamp_lt", p, printVehicleStatus),
        statusField("Left Apron", "left_apron", p, printVehicleStatus),
        statusField("Tail Lamp (LT)", "tail_lamp_lt", p, printVehicleStatus),
        statusField("Head Lamp (RT)", "head_lamp_rt", p, printVehicleStatus),
        statusField("Fog Lamp (RT)", "fog_lamp_rt", p, printVehicleStatus),
        statusField("Right Apron", "right_apron", p, printVehicleStatus),
        statusField("Tail Lamp (RT)", "tail_lamp_rt", p, printVehicleStatus),
      ],
    },
    {
      heading: "LEFT",
      banner: true,
      columns: 4,
      fields: [
        statusField("LT FrontFender", "lt_frontfender", p, printVehicleStatus),
        statusField("LT Pillar Door (A)", "lt_pillar_door_a", p, printVehicleStatus),
        statusField("LT FrontDoor", "lt_frontdoor", p, printVehicleStatus),
        statusField(
          "LT Pillar Centre (B)",
          "lt_pillar_center_b",
          p,
          printVehicleStatus,
        ),
        statusField("LT RearDoor", "lt_reardoor", p, printVehicleStatus),
        statusField("LT Pillar Rear (C)", "lt_pillar_door_c", p, printVehicleStatus),
        statusField("LT RunningBoard", "lt_runningboard", p, printVehicleStatus),
        statusField("LT Qtr Panel", "lt_qtr_panel", p, printVehicleStatus),
      ],
    },
    {
      heading: "RIGHT",
      banner: true,
      columns: 4,
      fields: [
        statusField("RT Qtr Panel", "rt_qtr_panel", p, printVehicleStatus),
        statusField(
          "RT Center Pillar (B)",
          "rt_pillar_door_b",
          p,
          printVehicleStatus,
        ),
        statusField("Floor / Silencer", "floor_silencer", p, printVehicleStatus),
        statusField("RT Rear Door", "rt_rear_door", p, printVehicleStatus),
        statusField(
          "RT Rear Pillar (C)",
          "rt_rear_pillar_c",
          p,
          printVehicleStatus,
        ),
        statusField(
          "Rear View Mirror(LT)",
          "rear_view_mirror_lt",
          p,
          printVehicleStatus,
        ),
        statusField("RT Front Door", "rt_front_door", p, printVehicleStatus),
        statusField(
          "RT Running Board",
          "rt_running_board",
          p,
          printVehicleStatus,
        ),
        statusField(
          "Rear View Mirror(RT)",
          "rear_view_mirror_rt",
          p,
          printVehicleStatus,
        ),
        statusField(
          "RT Front Pillar (A)",
          "rt_front_pillar_a",
          p,
          printVehicleStatus,
        ),
        statusField("RT Front Fender", "rt_front_fender", p, printVehicleStatus),
        statusField("Tyres", "tyres", p, printVehicleStatus),
      ],
    },
    appendClosing(
      glassOthers,
      closingFields(data, { statusRemarksSplit: true, columns: 4 }),
    ),
  ];
}

function buildHtml(
  data: PdfDocumentData,
  defaultSections: PdfSection[],
): string {
  const sections = resolveSections(data, defaultSections);
  const page1 = [renderHeader(data), ...sections.map(renderSection)].join("\n");
  // Blade always emits photos + declaration pages (gallery may be empty)
  const pages = [page1, renderPhotosPage(data), renderDeclarationPage(data)];
  return wrapDocument(pages);
}

/** Laravel `twoPDF` — Pre-Inspection 2W */
export function renderTwoPdf(data: PdfDocumentData): string {
  return buildHtml(data, sections2w(data));
}

/** Laravel `threePDF` — Pre-Inspection 3W */
export function renderThreePdf(data: PdfDocumentData): string {
  return buildHtml(data, sections3w(data));
}

/** Laravel `fourPDF` — Pre-Inspection 4W */
export function renderFourPdf(data: PdfDocumentData): string {
  return buildHtml(data, sections4w(data));
}
